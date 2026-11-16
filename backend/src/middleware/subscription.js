// Après la fin de l'essai ou de l'abonnement, l'organisation passe en lecture seule :
// ses documents restent consultables et téléchargeables (ils lui appartiennent),
// mais l'ajout, la modification, le partage et les invitations sont suspendus.
function isExpired(tenant) {
  return Boolean(tenant?.subscriptionExpiresAt && new Date(tenant.subscriptionExpiresAt) < new Date());
}

function requireActiveSubscription(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  if (!isExpired(req.tenant)) return next();
  const admin = req.user?.role === "admin";
  return res.status(402).json({
    expired: true,
    message: admin
      ? "Votre abonnement a expiré : Archivix est en lecture seule. Choisissez une offre dans « Abonnement » pour réactiver l'ajout et la modification."
      : "L'abonnement de votre organisation a expiré : Archivix est en lecture seule. Prévenez votre administrateur.",
  });
}

module.exports = { requireActiveSubscription, isExpired };
