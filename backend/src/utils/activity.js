const prisma = require("../config/prisma");

const STATUS_LABEL = { archive: "Archivé", en_revision: "En révision", archive_definitif: "Définitif" };

/**
 * Enregistre une action dans le journal d'activité.
 * Ne bloque jamais l'action principale : une erreur d'écriture est seulement signalée dans les journaux.
 */
async function logActivity(req, { action, document, departmentId, departmentName, details }) {
  try {
    let deptName = departmentName;
    const deptId = departmentId || document?.departmentId || null;
    if (!deptName && deptId) {
      const dept = await prisma.department.findUnique({ where: { id: deptId }, select: { name: true } });
      deptName = dept?.name || null;
    }
    await prisma.activityLog.create({
      data: {
        tenantId: req.tenantId,
        userId: req.user?.id || null,
        userName: req.user?.fullName || null,
        action,
        documentId: document?.id || null,
        documentTitle: document?.title || null,
        departmentId: deptId,
        departmentName: deptName || null,
        details: details || null,
      },
    });
  } catch (err) {
    console.error("[Activité] enregistrement impossible :", err.message);
  }
}

module.exports = { logActivity, STATUS_LABEL };
