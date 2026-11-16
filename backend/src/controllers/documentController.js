const prisma = require("../config/prisma");
const { notifyDepartmentMembers } = require("../utils/notify");
const jwt = require("jsonwebtoken");
const { Readable } = require("stream");
const fs = require("fs");
const { saveFile, pathFromUrl, temporaryUrl, localFilePath, deleteFile, kindOf } = require("../utils/storage");
const drive = require("../utils/googleDrive");
const { logActivity, STATUS_LABEL } = require("../utils/activity");

// Renvoie (en le créant au besoin) le sous-dossier Drive du département.
async function departmentDriveFolder(accessToken, tenant, departmentId) {
  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  if (dept.googleDriveFolderId) return dept.googleDriveFolderId;
  const folderId = await drive.createFolder(accessToken, dept.name, tenant.googleDriveFolderId);
  await prisma.department.update({ where: { id: dept.id }, data: { googleDriveFolderId: folderId } });
  return folderId;
}

function driveErrorResponse(res, err, fallback) {
  if (err instanceof drive.DriveError) {
    return res.status(err.status).json({ message: err.message, reconnectDrive: err.reconnect || undefined });
  }
  return res.status(500).json({ message: fallback, error: err.message });
}

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
  const { storageKey, ...rest } = doc;
  return {
    ...rest,
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
    const onDrive = tenant.storageProvider === "google_drive";

    // Sur Google Drive, l'espace utilisé est celui du client : le quota Archivix ne s'applique pas.
    if (!onDrive && tenant.storageUsedMb + sizeKb / 1024 > tenant.storageQuotaMb) {
      return res.status(413).json({ message: "Quota de stockage dépassé pour votre offre actuelle." });
    }

    const sharedWithDepartments = req.body.sharedWithDepartments
      ? String(req.body.sharedWithDepartments).split(",").filter(Boolean)
      : [];

    let fileUrl = "";
    let storageKey = null;
    if (onDrive) {
      const accessToken = await drive.getAccessToken(tenant);
      const parentId = await departmentDriveFolder(accessToken, tenant, departmentId);
      storageKey = await drive.uploadFile(accessToken, {
        buffer: req.file.buffer,
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        parentId,
      });
    } else {
      const saved = await saveFile(req.file.buffer, req.file.originalname, `documents/${req.tenantId}`, req.file.mimetype);
      fileUrl = saved.url;
      storageKey = saved.path;
    }

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
        storageProvider: onDrive ? "google_drive" : "archivix",
        storageKey,
        mimeType: req.file.mimetype,
        sizeKb,
        uploadedById: req.user.id,
      },
    });

    if (!onDrive) {
      await prisma.tenant.update({
        where: { id: req.tenantId },
        data: { storageUsedMb: tenant.storageUsedMb + sizeKb / 1024 },
      });
    }

    notifyDepartmentMembers(req.app, {
      tenantId: req.tenantId,
      departmentId,
      type: "document_ajoute",
      message: `${req.user.fullName} a archivé « ${doc.title} » dans votre département.`,
      link: "/app/documents",
      excludeUserId: req.user.id,
    }).catch(() => { });

    await logActivity(req, { action: "archivage", document: doc, details: onDrive ? "Stocké dans Google Drive" : null });

    res.status(201).json(serialize(doc));
  } catch (err) {
    driveErrorResponse(res, err, "Erreur lors de l'archivage du document.");
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

  // Journal : on distingue le partage des autres modifications
  if (sharedWithDepartments !== undefined && existing.sharedWithDepartments !== data.sharedWithDepartments) {
    const depts = sharedWithDepartments.length
      ? await prisma.department.findMany({ where: { id: { in: sharedWithDepartments } }, select: { name: true } })
      : [];
    await logActivity(req, {
      action: "partage",
      document: doc,
      details: depts.length ? `Partagé avec ${depts.map((d) => d.name).join(", ")}` : "Partage retiré",
    });
  }
  const changes = [];
  if (title !== undefined && title !== existing.title) changes.push(`Titre : ${title}`);
  if (status !== undefined && status !== existing.status) changes.push(`Statut : ${STATUS_LABEL[status] || status}`);
  if (reference !== undefined && reference !== existing.reference) changes.push(`Référence : ${reference || "—"}`);
  if (tags !== undefined && data.tags !== existing.tags) changes.push("Mots-clés modifiés");
  if (folderId !== undefined && (folderId || null) !== existing.folderId) changes.push("Dossier modifié");
  if (changes.length) await logActivity(req, { action: "modification", document: doc, details: changes.join(" · ") });

  res.json(serialize(doc));
};

exports.remove = async (req, res) => {
  const where = await buildScopeWhere(req);
  const doc = await prisma.document.findFirst({ where: { ...where, id: req.params.id } });
  if (!doc) return res.status(404).json({ message: "Document introuvable ou accès non autorisé." });

  if (doc.storageProvider === "google_drive" && doc.storageKey) {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
      const accessToken = await drive.getAccessToken(tenant);
      await drive.trashFile(accessToken, doc.storageKey);
    } catch (err) {
      // Fichier déjà supprimé côté Drive : on peut retirer la fiche sans risque.
      if (!(err instanceof drive.DriveError && err.status === 404)) {
        return driveErrorResponse(res, err, "Impossible de supprimer le fichier dans Google Drive.");
      }
    }
  }

  await prisma.message.deleteMany({ where: { documentId: doc.id } });
  await prisma.document.delete({ where: { id: doc.id } });
  await logActivity(req, { action: "suppression", document: doc });

  // Stockage Archivix : on supprime aussi le fichier et on libère l'espace du quota.
  if (doc.storageProvider !== "google_drive") {
    await deleteFile(doc.fileUrl);
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { storageUsedMb: Math.max(0, tenant.storageUsedMb - doc.sizeKb / 1024) },
    });
  }
  res.json({ message: "Document supprimé." });
};

// Lien d'ouverture d'un document, délivré après vérification des droits de l'utilisateur.
// Aucun fichier n'est accessible par une URL publique permanente : le lien expire au bout de 5 minutes.
exports.link = async (req, res) => {
  const where = await buildScopeWhere(req);
  const doc = await prisma.document.findFirst({ where: { ...where, id: req.params.id } });
  if (!doc) return res.status(404).json({ message: "Document introuvable ou accès non autorisé." });

  await logActivity(req, { action: "consultation", document: doc });

  // Stockage objet (Neon S3 ou Supabase) : lien temporaire signé par le service de stockage.
  if (doc.storageProvider !== "google_drive" && kindOf(doc.fileUrl) !== "local") {
    try {
      const url = await temporaryUrl(doc.fileUrl, { seconds: 300, fileName: doc.fileName, mimeType: doc.mimeType });
      if (url) return res.json({ url });
    } catch (err) {
      return res.status(502).json({ message: "Impossible d'ouvrir ce document pour le moment.", error: err.message });
    }
  }

  // Google Drive ou disque local : le serveur diffuse lui-même le fichier via un lien signé.
  const jeton = jwt.sign({ purpose: "fichier", documentId: doc.id, tenantId: doc.tenantId }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });
  res.json({ url: `/api/documents/${doc.id}/fichier?jeton=${encodeURIComponent(jeton)}` });
};

// Diffuse un fichier Google Drive ou stocké sur le disque local (route publique protégée par le lien signé).
exports.streamFile = async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(String(req.query.jeton || ""), process.env.JWT_SECRET);
    if (payload.purpose !== "fichier" || payload.documentId !== req.params.id) throw new Error();
  } catch {
    return res.status(401).send("Lien expiré. Rouvrez le document depuis Archivix.");
  }

  try {
    const doc = await prisma.document.findFirst({ where: { id: payload.documentId, tenantId: payload.tenantId } });
    if (!doc) return res.status(404).send("Document introuvable.");

    const disposition = `inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`;
    // Aperçu intégré dans la fiche du document : seul le site Archivix peut afficher ce fichier dans un cadre.
    const frontend = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", `frame-ancestors 'self'${frontend ? " " + frontend : ""}`);
    if (doc.storageProvider !== "google_drive") {
      const full = localFilePath(doc.storageKey || pathFromUrl(doc.fileUrl) || "");
      if (!full || !fs.existsSync(full)) return res.status(404).send("Fichier introuvable sur le serveur.");
      res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", disposition);
      res.setHeader("Cache-Control", "private, no-store");
      return fs.createReadStream(full).pipe(res);
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: doc.tenantId } });
    const accessToken = await drive.getAccessToken(tenant);
    const upstream = await drive.downloadFile(accessToken, doc.storageKey);

    res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", disposition);
    res.setHeader("Cache-Control", "private, no-store");
    const length = upstream.headers.get("content-length");
    if (length) res.setHeader("Content-Length", length);
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    const status = err instanceof drive.DriveError ? err.status : 500;
    res.status(status).send(err instanceof drive.DriveError ? err.message : "Impossible d'ouvrir ce document.");
  }
};
// Historique d'un document (visible par toute personne qui a accès au document).
exports.history = async (req, res) => {
  const where = await buildScopeWhere(req);
  const doc = await prisma.document.findFirst({ where: { ...where, id: req.params.id }, select: { id: true } });
  if (!doc) return res.status(404).json({ message: "Document introuvable ou accès non autorisé." });
  const entries = await prisma.activityLog.findMany({
    where: { tenantId: req.tenantId, documentId: doc.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json(entries);
};
