const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

async function requireSuperAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentification requise." });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "superadmin") {
      return res.status(403).json({ message: "Accès réservé au super-administrateur." });
    }

    const superAdmin = await prisma.superAdmin.findUnique({ where: { id: payload.sub } });
    if (!superAdmin) return res.status(401).json({ message: "Compte introuvable." });

    const { passwordHash, ...safe } = superAdmin;
    req.superAdmin = safe;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Jeton invalide ou expiré." });
  }
}

module.exports = { requireSuperAdmin };
