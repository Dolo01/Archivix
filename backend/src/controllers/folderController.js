const prisma = require("../config/prisma");

function canSeeFolder(req, folder) {
  if (req.superAdmin) return true;
  if (req.user.role === "admin") return true;
  const ownDept = req.user.departmentId;
  const sharedIds = JSON.parse(folder.sharedWithDepartments || "[]");
  return folder.departmentId === ownDept || sharedIds.includes(ownDept);
}

function serialize(folder) {
  return { ...folder, sharedWithDepartmentIds: JSON.parse(folder.sharedWithDepartments || "[]") };
}

exports.list = async (req, res) => {
  const { department } = req.query;
  const where = { tenantId: req.tenantId };
  if (department) where.departmentId = department;

  const folders = await prisma.folder.findMany({ where, orderBy: { name: "asc" } });
  const visible = req.user.role === "admin" ? folders : folders.filter((f) => canSeeFolder(req, f));

  const withDeptNames = await Promise.all(
    visible.map(async (f) => {
      const s = serialize(f);
      const depts = s.sharedWithDepartmentIds.length
        ? await prisma.department.findMany({ where: { id: { in: s.sharedWithDepartmentIds } }, select: { id: true, name: true } })
        : [];
      const count = await prisma.document.count({ where: { folderId: f.id } });
      return { ...s, sharedWithDepartments: depts, documentsCount: count };
    })
  );

  res.json(withDeptNames);
};

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const departmentId = req.user.role === "admin" && req.body.departmentId ? req.body.departmentId : req.user.departmentId;
    if (!departmentId) return res.status(400).json({ message: "Département requis pour créer un dossier." });

    const folder = await prisma.folder.create({
      data: { tenantId: req.tenantId, departmentId, name, description: description || null, createdById: req.user.id },
    });
    res.status(201).json(serialize(folder));
  } catch (err) {
    res.status(400).json({ message: "Impossible de créer ce dossier (nom déjà utilisé dans ce département ?).", error: err.message });
  }
};

exports.update = async (req, res) => {
  const folder = await prisma.folder.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
  if (!folder) return res.status(404).json({ message: "Dossier introuvable." });
  if (req.user.role !== "admin" && folder.departmentId !== req.user.departmentId) {
    return res.status(403).json({ message: "Vous ne pouvez modifier que les dossiers de votre département." });
  }

  const { name, description } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;

  const updated = await prisma.folder.update({ where: { id: folder.id }, data });
  res.json(serialize(updated));
};

// Partage de CE dossier précis avec d'autres départements (jamais le département entier)
exports.updateSharing = async (req, res) => {
  const folder = await prisma.folder.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
  if (!folder) return res.status(404).json({ message: "Dossier introuvable." });
  if (req.user.role !== "admin" && folder.departmentId !== req.user.departmentId) {
    return res.status(403).json({ message: "Vous ne pouvez partager que les dossiers de votre département." });
  }

  const { sharedWithDepartments } = req.body;
  const updated = await prisma.folder.update({
    where: { id: folder.id },
    data: { sharedWithDepartments: JSON.stringify(sharedWithDepartments || []) },
  });
  res.json(serialize(updated));
};

exports.remove = async (req, res) => {
  const folder = await prisma.folder.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
  if (!folder) return res.status(404).json({ message: "Dossier introuvable." });
  if (req.user.role !== "admin" && folder.departmentId !== req.user.departmentId) {
    return res.status(403).json({ message: "Vous ne pouvez supprimer que les dossiers de votre département." });
  }

  await prisma.document.updateMany({ where: { folderId: folder.id }, data: { folderId: null } });
  await prisma.folder.delete({ where: { id: folder.id } });
  res.json({ message: "Dossier supprimé. Les documents qu'il contenait restent archivés dans le département." });
};
