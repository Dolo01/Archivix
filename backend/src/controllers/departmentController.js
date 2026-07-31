const prisma = require("../config/prisma");

exports.list = async (req, res) => {
  const departments = await prisma.department.findMany({
    where: { tenantId: req.tenantId },
    orderBy: { name: "asc" },
  });

  const withCounts = await Promise.all(
    departments.map(async (d) => {
      const membres = await prisma.user.count({ where: { departmentId: d.id } });
      return { ...d, membres };
    })
  );

  res.json(withCounts);
};

// Réservé admin : créer un département
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = await prisma.department.create({
      data: { tenantId: req.tenantId, name, description: description || null, createdById: req.user.id },
    });
    res.status(201).json(department);
  } catch (err) {
    res.status(400).json({ message: "Impossible de créer ce département (nom déjà utilisé ?).", error: err.message });
  }
};

exports.update = async (req, res) => {
  const existing = await prisma.department.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
  if (!existing) return res.status(404).json({ message: "Département introuvable." });

  const { name, description } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;

  const updated = await prisma.department.update({ where: { id: existing.id }, data });
  res.json(updated);
};

// Réservé admin : affecter un membre à un département (donne l'accès à ses dossiers/documents)
exports.assignMember = async (req, res) => {
  const { userId, departmentId } = req.body;
  const existing = await prisma.user.findFirst({ where: { id: userId, tenantId: req.tenantId } });
  if (!existing) return res.status(404).json({ message: "Utilisateur introuvable." });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { departmentId: departmentId || null },
  });
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
};

exports.remove = async (req, res) => {
  try {
    await prisma.user.updateMany({ where: { tenantId: req.tenantId, departmentId: req.params.id }, data: { departmentId: null } });
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ message: "Département supprimé." });
  } catch (err) {
    res.status(409).json({
      message: "Impossible de supprimer ce département : il contient encore des dossiers ou des documents. Déplacez-les d'abord.",
      error: err.message,
    });
  }
};
