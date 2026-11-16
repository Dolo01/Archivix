const prisma = require("../config/prisma");
const { pushToUser } = require("./push");

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
  // Notification sur les appareils de l'utilisateur (téléphone, ordinateur), sans bloquer l'action
  pushToUser(userId, { body: message, url: link || "/app", tag: type }).catch(() => {});
  return notification;
}

/** Notifie une liste d'utilisateurs (sans doublon, en excluant l'auteur de l'action). */
async function notifyUsers(app, { tenantId, userIds, type, message, link, excludeUserId }) {
  const ids = [...new Set(userIds)].filter((id) => id && id !== excludeUserId);
  return Promise.all(ids.map((userId) => notifyUser(app, { tenantId, userId, type, message, link })));
}

/** Identifiants des membres actifs de plusieurs départements. */
async function membersOfDepartments(tenantId, departmentIds) {
  if (!departmentIds.length) return [];
  const members = await prisma.user.findMany({
    where: { tenantId, departmentId: { in: departmentIds }, isActive: true },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

/** Identifiants des administrateurs actifs. */
async function adminsOf(tenantId) {
  const admins = await prisma.user.findMany({ where: { tenantId, role: "admin", isActive: true }, select: { id: true } });
  return admins.map((a) => a.id);
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

module.exports = { notifyUser, notifyUsers, notifyTenantAdmins, notifyDepartmentMembers, membersOfDepartments, adminsOf };
