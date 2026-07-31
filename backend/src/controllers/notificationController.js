const prisma = require("../config/prisma");

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
