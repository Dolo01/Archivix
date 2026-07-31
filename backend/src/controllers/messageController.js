const prisma = require("../config/prisma");

async function assertAccess(req, documentId) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId: req.tenantId } });
  if (!doc) return null;
  if (req.user.role === "admin") return doc;

  const ownDept = req.user.departmentId;
  const sharedIds = JSON.parse(doc.sharedWithDepartments || "[]");
  if (doc.departmentId === ownDept || sharedIds.includes(ownDept)) return doc;

  if (doc.folderId) {
    const folder = await prisma.folder.findUnique({ where: { id: doc.folderId } });
    const folderSharedIds = JSON.parse(folder?.sharedWithDepartments || "[]");
    if (folderSharedIds.includes(ownDept)) return doc;
  }

  return null;
}

exports.history = async (req, res) => {
  const doc = await assertAccess(req, req.params.documentId);
  if (!doc) return res.status(404).json({ message: "Document introuvable ou accès non autorisé." });

  const messages = await prisma.message.findMany({
    where: { documentId: req.params.documentId },
    include: { author: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
};

exports.create = async (req, res) => {
  const doc = await assertAccess(req, req.params.documentId);
  if (!doc) return res.status(404).json({ message: "Document introuvable ou accès non autorisé." });

  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Le message ne peut pas être vide." });

  const message = await prisma.message.create({
    data: {
      tenantId: req.tenantId,
      documentId: req.params.documentId,
      authorId: req.user.id,
      content: content.trim(),
    },
    include: { author: { select: { id: true, fullName: true } } },
  });

  const io = req.app.get("io");
  io?.to(`document:${req.params.documentId}`).emit("nouveau_message", message);

  res.status(201).json(message);
};
