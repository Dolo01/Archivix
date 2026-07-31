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

    const { fullName, email, password, role, departmentId } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: req.tenantId,
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        role: role || "lecteur",
        departmentId: departmentId || null,
      },
      include: { department: { select: { id: true, name: true } } },
    });
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (err) {
    res.status(400).json({ message: "Impossible de créer l'utilisateur.", error: err.message });
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
