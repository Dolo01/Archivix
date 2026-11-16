// Notifications Web Push : arrivent sur l'appareil (ordinateur, Android, et iPhone/iPad
// lorsque Archivix est ajouté à l'écran d'accueil, iOS 16.4+), même application fermée.
// Clés VAPID à générer une fois : npx web-push generate-vapid-keys
const webpush = require("web-push");
const prisma = require("../config/prisma");

const configured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

if (configured) {
  const contact = process.env.VAPID_SUBJECT || `mailto:${process.env.PAYMENT_BENEFICIARY_EMAIL || "contact@archivix.app"}`;
  webpush.setVapidDetails(contact, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

function publicKey() {
  return configured ? process.env.VAPID_PUBLIC_KEY : null;
}

/**
 * Envoie une notification sur tous les appareils d'un utilisateur.
 * Les abonnements expirés (404 / 410) sont supprimés. N'échoue jamais.
 */
async function pushToUser(userId, { title, body, url, tag }) {
  if (!configured) return 0;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const payload = JSON.stringify({ title: title || "Archivix", body, url: url || "/app", tag });
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 24 * 60 * 60, urgency: "normal" }
        );
        sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          console.error("[Push] envoi impossible :", err.statusCode || "", err.message);
        }
      }
    })
  );
  return sent;
}

module.exports = { configured, publicKey, pushToUser };
