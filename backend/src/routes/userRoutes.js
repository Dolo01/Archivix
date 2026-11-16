const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { requireAuth, requireRole } = require("../middleware/auth");
const prisma = require("../config/prisma");
const { PLANS } = require("../utils/plans");

router.use(requireAuth);

router.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { tenantId: req.tenantId },
    include: { department: { select: { id: true, name: true } } },
  });
  res.json(users.map(({ passwordHash, ...u }) => u));
});

router.post("/", requireRole("admin"), async (req, res) => {
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
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: "Le mot de passe temporaire doit contenir au moins 6 caractères." });
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

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        tenantId: req.tenantId,
        fullName: fullName.trim(),
        email,
        passwordHash,
        role: role || "lecteur",
        departmentId: departmentId || null,
      },
      include: { department: { select: { id: true, name: true } } },
    });
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Un membre utilise déjà cette adresse e-mail dans votre organisation." });
    }
    console.error("[Membres] création impossible :", err.message);
    res.status(500).json({ message: "Impossible d'ajouter ce membre pour le moment. Réessayez dans un instant." });
  }
});

router.patch("/:id", requireRole("admin"), async (req, res) => {
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
