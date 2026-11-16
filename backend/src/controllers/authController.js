const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { ESSAI_DUREE_JOURS } = require("../utils/plans");

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

    const slug = slugify(companyName);

    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return res.status(409).json({ message: "Ce nom d'entreprise est déjà utilisé." });
    }

    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + ESSAI_DUREE_JOURS);

    const tenant = await prisma.tenant.create({
      data: { name: companyName, slug, plan: "essai", subscriptionExpiresAt: trialExpiresAt },
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({ where: { email: email?.toLowerCase() } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
    if (!tenant || !tenant.isActive) {
      return res.status(403).json({ message: "Compte entreprise désactivé." });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      tenant: tenantResponse(tenant),
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la connexion.", error: err.message });
  }
};

exports.me = async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId } });
  res.json({ user: req.user, tenant: tenantResponse(tenant) });
};