// Chiffrement symétrique (AES-256-GCM) des secrets stockés en base, comme les
// jetons Google : une fuite de la base seule ne suffit pas à accéder aux Drive des clients.
const crypto = require("crypto");

function getKey() {
  const hex = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "";
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  return Buffer.from(hex, "hex");
}

function hasKey() {
  return getKey() !== null;
}

function encrypt(plain) {
  const key = getKey();
  if (!key) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY absente ou invalide (64 caractères hexadécimaux attendus).");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), data.toString("base64")].join(":");
}

function decrypt(payload) {
  const key = getKey();
  if (!key) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY absente ou invalide.");
  const [version, iv, tag, data] = String(payload).split(":");
  if (version !== "v1") throw new Error("Format de secret chiffré inconnu.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

module.exports = { encrypt, decrypt, hasKey };
