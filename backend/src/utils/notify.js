const prisma = require("../config/prisma");

/**
 * Crée une notification en base et la pousse en temps réel si l'utilisateur est connecté.
 * @param {import('express').Application} app - pour récupérer l'instance Socket.io (app.get("io"))
 */
async function notifyUser(app, { tenantId, userId, type, message, link }) {
  const notification = await prisma.notification.create({
    data: { tenantId, userId, type, message, link: link || null },
  });
  const io = app.get("io");
  io?.to(`user:${userId}`).emit("notification", notification);
  return notification;
}

/** Notifie tous les administrateurs d'un tenant (ex : décision d'abonnement). */
async function notifyTenantAdmins(app, { tenantId, type, message, link }) {
  const admins = await prisma.user.findMany({ where: { tenantId, role: "admin", isActive: true } });
  return Promise.all(admins.map((a) => notifyUser(app, { tenantId, userId: a.id, type, message, link })));
}

/** Notifie tous les membres d'un département (ex : nouveau document). */
async function notifyDepartmentMembers(app, { tenantId, departmentId, type, message, link, excludeUserId }) {
  const members = await prisma.user.findMany({
    where: { tenantId, departmentId, isActive: true, id: { not: excludeUserId || undefined } },
  });
  return Promise.all(members.map((m) => notifyUser(app, { tenantId, userId: m.id, type, message, link })));
}

module.exports = { notifyUser, notifyTenantAdmins, notifyDepartmentMembers };
