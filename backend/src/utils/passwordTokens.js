const crypto = require("crypto");
const prisma = require("../config/prisma");

const hash = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

const DUREES = { reinitialisation: 60 * 60 * 1000, invitation: 72 * 60 * 60 * 1000 };
const MIN_PASSWORD = 8;

/** Crée un lien à usage unique et renvoie le jeton en clair (seule son empreinte est stockée). */
async function createToken(userId, purpose) {
  const raw = crypto.randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: { userId, purpose, tokenHash: hash(raw), expiresAt: new Date(Date.now() + DUREES[purpose]) },
  });
  return raw;
}

/** Renvoie l'enregistrement valide (non utilisé, non expiré) correspondant au jeton, ou null. */
async function findValidToken(raw) {
  if (!raw || typeof raw !== "string" || raw.length > 200) return null;
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}

function validatePassword(password) {
  if (!password || String(password).length < MIN_PASSWORD) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`;
  }
  if (String(password).length > 200) return "Mot de passe trop long.";
  return null;
}

module.exports = { createToken, findValidToken, validatePassword, MIN_PASSWORD };
