const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { tenant: true } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Session invalide ou compte désactivé." });
    }
    // Session ouverte avant un changement de mot de passe : on la ferme (ex. mot de passe volé puis réinitialisé)
    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
      return res.status(401).json({ message: "Votre mot de passe a changé. Reconnectez-vous." });
    }
    if (!user.tenant?.isActive) {
      return res.status(403).json({ message: "L'espace de votre organisation est suspendu. Contactez le support Archivix." });
    }

    const { passwordHash, tenant, ...safeUser } = user;
    req.user = safeUser;
    req.tenant = tenant;
    req.tenantId = user.tenantId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Jeton invalide ou expiré." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé pour ce rôle." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
