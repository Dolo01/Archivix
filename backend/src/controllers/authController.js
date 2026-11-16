const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { ESSAI_DUREE_JOURS, PLANS } = require("../utils/plans");
const mailer = require("../utils/mailer");
const { createToken, findValidToken, validatePassword } = require("../utils/passwordTokens");

function signToken(user) {
  return jwt.sign({ sub: user.id, tenant: user.tenantId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tenantResponse(tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    subscriptionExpiresAt: tenant.subscriptionExpiresAt,
    storageUsedMb: tenant.storageUsedMb,
    storageQuotaMb: tenant.storageQuotaMb,
    storageProvider: tenant.storageProvider,
    features: (PLANS[tenant.plan] || PLANS.essai).features,
    googleDriveEmail: tenant.storageProvider === "google_drive" ? tenant.googleDriveEmail : null,
  };
}

// Inscription d'une nouvelle entreprise + de son premier administrateur.
// Chaque nouvelle entreprise démarre avec un essai gratuit de 14 jours.
exports.register = async (req, res) => {
  try {
    const { companyName, fullName, email, password } = req.body;
    if (!companyName || !fullName || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }
    const pwdError = validatePassword(password);
    if (pwdError) return res.status(400).json({ message: pwdError });

    const slug = slugify(companyName);

    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return res.status(409).json({ message: "Ce nom d'entreprise est déjà utilisé." });
    }

    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + ESSAI_DUREE_JOURS);

    const tenant = await prisma.tenant.create({
      data: { name: companyName, slug, plan: "essai", subscriptionExpiresAt: trialExpiresAt, storageQuotaMb: PLANS.essai.quotaMb },
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        role: "admin",
      },
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      tenant: tenantResponse(tenant),
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'inscription.", error: err.message });
  }
};

function userResponse(user) {
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword };
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Une même adresse peut exister dans plusieurs organisations : on retient le compte dont le mot de passe correspond
    const candidates = await prisma.user.findMany({ where: { email: String(email || "").trim().toLowerCase() } });
    let user = null;
    for (const c of candidates) {
      if (await bcrypt.compare(String(password || ""), c.passwordHash)) {
        user = c;
        break;
      }
    }
    if (!user) return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    if (!user.isActive) {
      return res.status(403).json({ message: "Votre compte a été désactivé. Contactez l'administrateur de votre organisation." });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
    if (!tenant || !tenant.isActive) {
      return res.status(403).json({ message: "L'espace de votre organisation est suspendu. Contactez le support Archivix." });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signToken(user);
    res.json({ token, user: userResponse(user), tenant: tenantResponse(tenant) });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la connexion." });
  }
};

// Rappel par e-mail aux administrateurs : 3 jours avant la fin, puis à l'expiration (une fois chacun).
async function maybeSendExpiryReminder(tenant) {
  if (!tenant?.subscriptionExpiresAt || !mailer.configured) return;
  const until = new Date(tenant.subscriptionExpiresAt);
  const daysLeft = Math.ceil((until - new Date()) / 86400000);
  if (daysLeft > 3) return;
  // Étape du rappel : « bientôt » (1 à 3 jours) puis « expiré » ; chaque étape n'est envoyée qu'une fois
  const stageStart = daysLeft > 0 ? new Date(until.getTime() - 3 * 86400000) : until;
  if (tenant.expiryReminderSentAt && tenant.expiryReminderSentAt >= stageStart) return;
  await prisma.tenant.update({ where: { id: tenant.id }, data: { expiryReminderSentAt: new Date() } });
  const admins = await prisma.user.findMany({ where: { tenantId: tenant.id, role: "admin", isActive: true } });
  await mailer.sendMail(
    mailer.expiryReminderEmail({
      admins,
      orgName: tenant.name,
      daysLeft,
      isTrial: tenant.plan === "essai",
      until: until.toLocaleDateString("fr-FR", { timeZone: "Africa/Bamako" }),
    })
  );
}

exports.me = async (req, res) => {
  const tenant = req.tenant || (await prisma.tenant.findUnique({ where: { id: req.user.tenantId } }));
  maybeSendExpiryReminder(tenant).catch(() => {});
  res.json({ user: req.user, tenant: tenantResponse(tenant) });
};

// Informations publiques utiles à l'interface (aucune donnée sensible)
exports.config = (req, res) => {
  res.json({ emailEnabled: mailer.configured });
};

// Changement de mot de passe par l'utilisateur connecté (obligatoire après un mot de passe temporaire)
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!(await bcrypt.compare(String(currentPassword || ""), user.passwordHash))) {
    return res.status(400).json({ message: "Le mot de passe actuel est incorrect." });
  }
  const pwdError = validatePassword(newPassword);
  if (pwdError) return res.status(400).json({ message: pwdError });
  if (String(newPassword) === String(currentPassword)) {
    return res.status(400).json({ message: "Choisissez un mot de passe différent de l'actuel." });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(String(newPassword), 10), mustChangePassword: false, passwordChangedAt: new Date() },
  });
  // Nouveau jeton : cette session reste ouverte, les autres sont fermées
  res.json({ message: "Mot de passe modifié.", token: signToken(updated), user: userResponse(updated) });
};

// Mot de passe oublié : réponse identique que l'adresse existe ou non (pas de fuite d'information)
exports.forgotPassword = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const generic = { message: "Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être envoyé." };
  if (!mailer.configured) {
    return res.status(503).json({ message: "L'envoi d'e-mails n'est pas encore activé. Demandez à votre administrateur de réinitialiser votre accès." });
  }
  if (!email) return res.json(generic);
  const users = await prisma.user.findMany({ where: { email, isActive: true }, include: { tenant: true } });
  for (const user of users) {
    if (!user.tenant?.isActive) continue;
    const raw = await createToken(user.id, "reinitialisation");
    await mailer.sendMail(mailer.resetEmail({ user, orgName: user.tenant.name, resetUrl: `${mailer.FRONTEND_URL()}/reinitialiser?jeton=${raw}` }));
  }
  res.json(generic);
};

// Vérifie un lien avant d'afficher le formulaire
exports.tokenInfo = async (req, res) => {
  const record = await findValidToken(req.query.jeton);
  if (!record) return res.status(410).json({ message: "Ce lien n'est plus valable. Demandez-en un nouveau." });
  const user = await prisma.user.findUnique({ where: { id: record.userId }, include: { tenant: true } });
  if (!user || !user.isActive) return res.status(410).json({ message: "Ce lien n'est plus valable." });
  res.json({ purpose: record.purpose, email: user.email, fullName: user.fullName, orgName: user.tenant?.name });
};

// Choix ou réinitialisation du mot de passe à partir d'un lien reçu par e-mail
exports.resetPassword = async (req, res) => {
  const record = await findValidToken(req.body.jeton);
  if (!record) return res.status(410).json({ message: "Ce lien n'est plus valable. Demandez-en un nouveau." });
  const pwdError = validatePassword(req.body.password);
  if (pwdError) return res.status(400).json({ message: pwdError });

  const user = await prisma.user.findUnique({ where: { id: record.userId }, include: { tenant: true } });
  if (!user || !user.isActive || !user.tenant?.isActive) return res.status(410).json({ message: "Ce lien n'est plus valable." });

  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(String(req.body.password), 10), mustChangePassword: false, passwordChangedAt: now },
    }),
    // Ce lien et tous les autres liens en cours de ce compte deviennent inutilisables
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: now } }),
  ]);
  res.json({ message: "Mot de passe enregistré. Vous pouvez vous connecter." });
};