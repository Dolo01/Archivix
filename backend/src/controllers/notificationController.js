const prisma = require("../config/prisma");
const push = require("../utils/push");

exports.list = async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const unread = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ notifications, unread });
};

exports.markRead = async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { isRead: true },
  });
  res.json({ message: "Notification marquée comme lue." });
};

exports.markAllRead = async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ message: "Toutes les notifications ont été marquées comme lues." });
};

// --- Notifications sur l'appareil (Web Push) ---

exports.pushConfig = (req, res) => {
  res.json({ enabled: push.configured, publicKey: push.publicKey() });
};

exports.pushSubscribe = async (req, res) => {
  if (!push.configured) return res.status(503).json({ message: "Les notifications sur l'appareil ne sont pas encore activées sur le serveur." });
  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth || !/^https:\/\//.test(sub.endpoint)) {
    return res.status(400).json({ message: "Abonnement de l'appareil invalide." });
  }
  const data = {
    tenantId: req.tenantId,
    userId: req.user.id,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
  };
  await prisma.pushSubscription.upsert({ where: { endpoint: sub.endpoint }, create: { endpoint: sub.endpoint, ...data }, update: data });
  res.status(201).json({ message: "Notifications activées sur cet appareil." });
};

exports.pushUnsubscribe = async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
  res.json({ message: "Notifications désactivées sur cet appareil." });
};

exports.pushTest = async (req, res) => {
  const sent = await push.pushToUser(req.user.id, {
    title: "Archivix",
    body: "Les notifications fonctionnent sur cet appareil.",
    url: "/app",
    tag: "test",
  });
  if (!sent) return res.status(404).json({ message: "Aucun appareil abonné pour le moment." });
  res.json({ message: `Notification de test envoyée sur ${sent} appareil${sent > 1 ? "s" : ""}.` });
};
