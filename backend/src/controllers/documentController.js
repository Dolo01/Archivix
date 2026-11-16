const prisma = require("../config/prisma");
const { notifyDepartmentMembers } = require("../utils/notify");
const { saveFile } = require("../utils/storage");

// Un document est visible : pour l'admin, tout le registre ; pour les autres,
// les documents de leur département, ceux partagés directement avec eux (par document),
// ou ceux rangés dans un dossier partagé avec leur département.
// On ne partage jamais un département entier — seulement des dossiers ou des documents précis.
async function buildScopeWhere(req) {
  const base = { tenantId: req.tenantId };
  if (req.user.role === "admin") return base;

  const ownDept = req.user.departmentId || "__aucun__";

  const sharedFolders = await prisma.folder.findMany({
    where: { tenantId: req.tenantId, sharedWithDepartments: { contains: ownDept } },
    select: { id: true },
  });
  const sharedFolderIds = sharedFolders.map((f) => f.id);

  return {
    ...base,
    OR: [
      { departmentId: ownDept },
      { sharedWithDepartments: { contains: ownDept } },
      ...(sharedFolderIds.length ? [{ folderId: { in: sharedFolderIds } }] : []),
    ],
  };
}

function serialize(doc) {
  return {
    ...doc,
    tags: JSON.parse(doc.tags || "[]"),
    sharedWithDepartmentIds: JSON.parse(doc.sharedWithDepartments || "[]"),
  };
}

async function attachRelations(docs) {
  const deptIds = [...new Set(docs.map((d) => d.departmentId).filter(Boolean))];
  const shareIds = [...new Set(docs.flatMap((d) => JSON.parse(d.sharedWithDepartments || "[]")))];
  const allDeptIds = [...new Set([...deptIds, ...shareIds])];
  const folderIds = [...new Set(docs.map((d) => d.folderId).filter(Boolean))];

  const [depts, folders] = await Promise.all([
    allDeptIds.length ? prisma.department.findMany({ where: { id: { in: allDeptIds } }, select: { id: true, name: true } }) : [],
    folderIds.length ? prisma.folder.findMany({ where: { id: { in: folderIds } }, select: { id: true, name: true } }) : [],
  ]);
  const deptMap = Object.fromEntries(depts.map((d) => [d.id, d]));
  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f]));

  return docs.map((doc) => {
    const s = serialize(doc);
    return {
      ...s,
      department: deptMap[doc.departmentId] || null,
      folder: doc.folderId ? folderMap[doc.folderId] || null : null,
      sharedWithDepartments: s.sharedWithDepartmentIds.map((id) => deptMap[id]).filter(Boolean),
    };
  });
}

exports.list = async (req, res) => {
  const { q, category, status, department, folder, page = 1, limit = 20 } = req.query;
  const where = await buildScopeWhere(req);

  // La recherche doit s'AJOUTER au périmètre d'accès (AND), jamais l'élargir :
  // la fusionner dans le OR du périmètre exposerait les documents des autres départements.
  if (q) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { reference: { contains: q, mode: "insensitive" } },
          { tags: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }
  if (category) where.categoryId = category;
  if (status) where.status = status;
  if (department && req.user.role === "admin") where.departmentId = department;
  if (folder) where.folderId = folder;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: { category: true, uploadedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.document.count({ where }),
  ]);

  res.json({ documents: await attachRelations(documents), total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getOne = async (req, res) => {
  const where = await buildScopeWhere(req);
  const doc = await prisma.document.findFirst({
    where: { ...where, id: req.params.id },
    include: { category: true, uploadedBy: { select: { id: true, fullName: true } } },
  });
  if (!doc) return res.status(404).json({ message: "Document introuvable ou accès non autorisé." });
  const [full] = await attachRelations([doc]);
  res.json(full);
};

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu." });

    const departmentId = req.user.role === "admin" && req.body.department ? req.body.department : req.user.departmentId;
    if (!departmentId) {
      return res.status(400).json({ message: "Vous devez appartenir à un département pour archiver un document." });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const sizeKb = Math.round(req.file.size / 1024);

    if (tenant.storageUsedMb + sizeKb / 1024 > tenant.storageQuotaMb) {
      return res.status(413).json({ message: "Quota de stockage dépassé pour votre offre actuelle." });
    }

    const sharedWithDepartments = req.body.sharedWithDepartments
      ? String(req.body.sharedWithDepartments).split(",").filter(Boolean)
      : [];

    const { url: fileUrl } = await saveFile(req.file.buffer, req.file.originalname, `documents/${req.tenantId}`, req.file.mimetype);

    const doc = await prisma.document.create({
      data: {
        tenantId: req.tenantId,
        departmentId,
        folderId: req.body.folderId || null,
        sharedWithDepartments: JSON.stringify(sharedWithDepartments),
        title: req.body.title || req.file.originalname,
        reference: req.body.reference || "",
        categoryId: req.body.category || null,
        tags: JSON.stringify(req.body.tags ? req.body.tags.split(",").map((t) => t.trim()) : []),
        fileName: req.file.originalname,
        fileUrl,
        mimeType: req.file.mimetype,
        sizeKb,
        uploadedById: req.user.id,
      },
    });

    await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { storageUsedMb: tenant.storageUsedMb + sizeKb / 1024 },
    });

    notifyDepartmentMembers(req.app, {
      tenantId: req.tenantId,
      departmentId,
      type: "document_ajoute",
      message: `${req.user.fullName} a archivé « ${doc.title} » dans votre département.`,
      link: "/app/documents",
      excludeUserId: req.user.id,
    }).catch(() => { });

    res.status(201).json(serialize(doc));
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'archivage du document.", error: err.message });
  }
};

exports.update = async (req, res) => {
  const where = await buildScopeWhere(req);
  const existing = await prisma.document.findFirst({ where: { ...where, id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Document introuvable ou accès non autorisé." });

  const { title, reference, tags, category, status, sharedWithDepartments, folderId } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (reference !== undefined) data.reference = reference;
  if (status !== undefined) data.status = status;
  if (category !== undefined) data.categoryId = category;
  if (tags !== undefined) data.tags = JSON.stringify(tags);
  if (sharedWithDepartments !== undefined) data.sharedWithDepartments = JSON.stringify(sharedWithDepartments);
  if (folderId !== undefined) data.folderId = folderId || null;

  const doc = await prisma.document.update({ where: { id: req.params.id }, data });
  res.json(serialize(doc));
};

exports.remove = async (req, res) => {
  const where = await buildScopeWhere(req);
  const doc = await prisma.document.findFirst({ where: { ...where, id: req.params.id } });
  if (!doc) return res.status(404).json({ message: "Document introuvable ou accès non autorisé." });
  await prisma.message.deleteMany({ where: { documentId: doc.id } });
  await prisma.document.delete({ where: { id: doc.id } });
  res.json({ message: "Document supprimé." });
};