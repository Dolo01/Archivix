const prisma = require("../config/prisma");
const { hasFeature, planOf } = require("../utils/plans");

const ACTIONS = ["archivage", "consultation", "modification", "partage", "suppression"];
const ACTION_LABEL = {
  archivage: "Archivage",
  consultation: "Consultation",
  modification: "Modification",
  partage: "Partage",
  suppression: "Suppression",
};

async function tenantOf(req) {
  return prisma.tenant.findUnique({ where: { id: req.tenantId } });
}

function buildWhere(req) {
  const where = { tenantId: req.tenantId };
  const days = Number(req.query.jours || 7);
  if (days > 0) where.createdAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
  if (req.query.membre) where.userId = String(req.query.membre);
  if (req.query.action && ACTIONS.includes(req.query.action)) where.action = req.query.action;
  return where;
}

function featureError(res, tenant, feature) {
  const label = planOf(tenant).label;
  const message =
    feature === "activiteExport"
      ? `L'export du journal d'activité est inclus dans l'offre Business. Votre offre actuelle : ${label}.`
      : `Le journal d'activité est inclus à partir de l'offre Professionnel. Votre offre actuelle : ${label}.`;
  return res.status(403).json({ message, upgrade: true });
}

// Journal de toute l'organisation (administrateurs, offres Professionnel et plus).
exports.list = async (req, res) => {
  const tenant = await tenantOf(req);
  if (!hasFeature(tenant, "activite")) return featureError(res, tenant, "activite");

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const where = buildWhere(req);
  const [entries, total, members] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.activityLog.count({ where }),
    prisma.user.findMany({ where: { tenantId: req.tenantId }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
  ]);
  res.json({
    entries,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    members,
    actions: ACTIONS.map((a) => ({ value: a, label: ACTION_LABEL[a] })),
    canExport: hasFeature(tenant, "activiteExport"),
  });
};

function csvCell(value) {
  const s = value == null ? "" : String(value);
  // Neutralise les formules pour éviter l'injection dans un tableur
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

// Export CSV (offre Business et plus). Séparateur « ; » pour une ouverture directe dans Excel en français.
exports.exportCsv = async (req, res) => {
  const tenant = await tenantOf(req);
  if (!hasFeature(tenant, "activiteExport")) return featureError(res, tenant, "activiteExport");

  const entries = await prisma.activityLog.findMany({ where: buildWhere(req), orderBy: { createdAt: "desc" }, take: 10000 });
  const header = ["Date", "Membre", "Action", "Document", "Département", "Détails"];
  const lines = entries.map((e) =>
    [
      new Date(e.createdAt).toLocaleString("fr-FR", { timeZone: "Africa/Bamako" }),
      e.userName,
      ACTION_LABEL[e.action] || e.action,
      e.documentTitle,
      e.departmentName,
      e.details,
    ]
      .map(csvCell)
      .join(";")
  );
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="journal-activite-${date}.csv"`);
  res.send("﻿" + [header.map(csvCell).join(";"), ...lines].join("\r\n"));
};
