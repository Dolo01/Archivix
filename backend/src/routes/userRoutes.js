const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { requireAuth, requireRole } = require("../middleware/auth");
const prisma = require("../config/prisma");
const { PLANS } = require("../utils/plans");
const crypto = require("crypto");
const mailer = require("../utils/mailer");
const { createToken, validatePassword } = require("../utils/passwordTokens");
const { requireActiveSubscription } = require("../middleware/subscription");

router.use(requireAuth);

router.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { tenantId: req.tenantId },
    include: { department: { select: { id: true, name: true } } },
  });
  res.json(users.map(({ passwordHash, ...u }) => u));
});

router.post("/", requireRole("admin"), requireActiveSubscription, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const plan = PLANS[tenant.plan] || PLANS.essai;

    if (plan.maxUsers !== null) {
      const currentCount = await prisma.user.count({ where: { tenantId: req.tenantId } });
      if (currentCount >= plan.maxUsers) {
        return res.status(403).json({
          message: `Votre offre ${plan.label} est limitée à ${plan.maxUsers} utilisateurs. Passez à une offre supérieure pour en ajouter davantage.`,
        });
      }
    }

    const { fullName, role, departmentId, password } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!fullName?.trim()) return res.status(400).json({ message: "Indiquez le nom complet du membre." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Adresse e-mail invalide." });
    // Sans mot de passe : invitation par e-mail (le membre choisit le sien). Sinon : mot de passe temporaire.
    const byInvitation = !password;
    if (byInvitation && !mailer.configured) {
      return res.status(400).json({ message: "Indiquez un mot de passe temporaire : l'envoi d'invitations par e-mail n'est pas encore activé." });
    }
    if (!byInvitation) {
      const pwdError = validatePassword(password);
      if (pwdError) return res.status(400).json({ message: pwdError.replace("Le mot de passe", "Le mot de passe temporaire") });
    }
    if (role && !["admin", "gestionnaire", "lecteur"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    const existing = await prisma.user.findFirst({ where: { tenantId: req.tenantId, email } });
    if (existing) {
      return res.status(409).json({
        message: existing.id === req.user.id
          ? "Cette adresse est celle de votre propre compte : vous êtes déjà membre de l'organisation."
          : `${existing.fullName} utilise déjà cette adresse e-mail dans votre organisation.`,
      });
    }
    if (departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: departmentId, tenantId: req.tenantId } });
      if (!dept) return res.status(400).json({ message: "Ce département n'existe plus. Rechargez la page et réessayez." });
    }

    const passwordHash = await bcrypt.hash(byInvitation ? crypto.randomBytes(24).toString("base64url") : String(password), 10);
    const user = await prisma.user.create({
      data: {
        tenantId: req.tenantId,
        fullName: fullName.trim(),
        email,
        passwordHash,
        role: role || "lecteur",
        departmentId: departmentId || null,
        mustChangePassword: !byInvitation,
      },
      include: { department: { select: { id: true, name: true } } },
    });
    // E-mail d'invitation (lien valable 72 h pour choisir son mot de passe)
    // (seulement si l'administrateur n'a pas choisi de mot de passe temporaire)
    let invitationSent = false;
    if (byInvitation) {
      const raw = await createToken(user.id, "invitation");
      invitationSent = await mailer.sendMail(
        mailer.invitationEmail({
          user,
          orgName: tenant.name,
          inviterName: req.user.fullName,
          setupUrl: `${mailer.FRONTEND_URL()}/reinitialiser?jeton=${raw}`,
        })
      );
    }
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ ...safeUser, invitationSent });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Un membre utilise déjà cette adresse e-mail dans votre organisation." });
    }
    console.error("[Membres] création impossible :", err.message);
    res.status(500).json({ message: "Impossible d'ajouter ce membre pour le moment. Réessayez dans un instant." });
  }
});

router.patch("/:id", requireRole("admin"), requireActiveSubscription, async (req, res) => {
  try {
    const { fullName, role, isActive, departmentId } = req.body;
    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (departmentId !== undefined) data.departmentId = departmentId || null;

    const existing = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: "Utilisateur introuvable." });

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { department: { select: { id: true, name: true } } },
    });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch {
    res.status(404).json({ message: "Utilisateur introuvable." });
  }
});

// Réservé admin : retirer définitivement un membre de l'entreprise
// Renvoie un lien d'invitation (e-mail non reçu, lien expiré, ou mot de passe oublié par un membre).
// Les anciens liens encore valides sont annulés.
router.post("/:id/invitation", requireRole("admin"), requireActiveSubscription, async (req, res) => {
  try {
    if (!mailer.configured) {
      return res.status(400).json({ message: "L'envoi d'e-mails n'est pas encore activé : attribuez un mot de passe temporaire." });
    }
    const member = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!member) return res.status(404).json({ message: "Membre introuvable." });
    if (!member.isActive) return res.status(400).json({ message: "Réactivez d'abord ce compte." });
    await prisma.passwordResetToken.updateMany({ where: { userId: member.id, usedAt: null }, data: { usedAt: new Date() } });
    const raw = await createToken(member.id, "invitation");
    const sent = await mailer.sendMail(
      mailer.invitationEmail({
        user: member,
        orgName: req.tenant.name,
        inviterName: req.user.fullName,
        setupUrl: `${mailer.FRONTEND_URL()}/reinitialiser?jeton=${raw}`,
      })
    );
    if (!sent) return res.status(502).json({ message: "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques minutes." });
    res.json({ message: `Lien envoyé à ${member.email}. Il est valable 3 jours.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Impossible d'envoyer l'invitation." });
  }
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const target = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!target) return res.status(404).json({ message: "Utilisateur introuvable." });

    if (target.id === req.user.id) {
      return res.status(400).json({ message: "Vous ne pouvez pas vous supprimer vous-même." });
    }

    if (target.role === "admin") {
      const otherAdmins = await prisma.user.count({ where: { tenantId: req.tenantId, role: "admin", id: { not: target.id } } });
      if (otherAdmins === 0) {
        return res.status(400).json({ message: "Impossible de supprimer le dernier administrateur de l'entreprise." });
      }
    }

    await prisma.user.delete({ where: { id: target.id } });
    res.json({ message: "Membre supprimé de l'entreprise." });
  } catch (err) {
    // Un membre ayant déjà déposé des documents ou des messages ne peut pas être supprimé (contrainte de données)
    res.status(409).json({
      message: "Impossible de supprimer ce membre : il a déjà archivé des documents ou participé à des discussions. Désactivez-le plutôt.",
      error: err.message,
    });
  }
});

module.exports = router;
