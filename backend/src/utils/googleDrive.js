// Intégration Google Drive : chaque organisation connecte SON propre Drive.
// On demande uniquement l'autorisation "drive.file" (classée non sensible par Google) :
// Archivix n'accède qu'aux fichiers qu'il a lui-même créés, jamais au reste du Drive.
// Documentation : https://developers.google.com/workspace/drive/api/guides/api-specific-auth
const { encrypt, decrypt, hasKey } = require("./secretBox");

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/drive.file"];
const FOLDER_MIME = "application/vnd.google-apps.folder";

class DriveError extends Error {
  constructor(message, { status = 502, reconnect = false } = {}) {
    super(message);
    this.status = status;
    this.reconnect = reconnect;
  }
}

// Noms des réglages manquants ou invalides (jamais leurs valeurs), pour aider l'administrateur.
function missingSettings() {
  const missing = [];
  if (!process.env.GOOGLE_CLIENT_ID?.trim()) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET?.trim()) missing.push("GOOGLE_CLIENT_SECRET");
  if (!process.env.GOOGLE_REDIRECT_URI?.trim()) missing.push("GOOGLE_REDIRECT_URI");
  if (!hasKey()) missing.push("GOOGLE_TOKEN_ENCRYPTION_KEY");
  return missing;
}

function isConfigured() {
  return missingSettings().length === 0;
}

function buildAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // nécessaire pour obtenir un refresh token
    prompt: "consent", // garantit qu'un refresh token est renvoyé, même en cas de reconnexion
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params}`;
}

async function postForm(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function exchangeCode(code) {
  const { ok, data } = await postForm(TOKEN_URL, {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  if (!ok) throw new DriveError(`Google a refusé l'autorisation (${data.error || "erreur inconnue"}).`, { status: 400 });
  if (!data.scope || !data.scope.includes("auth/drive.file")) {
    throw new DriveError("L'accès à Google Drive n'a pas été accordé. Cochez l'autorisation Drive lors de la connexion.", { status: 400 });
  }
  return data; // { access_token, refresh_token, expires_in, scope, id_token }
}

async function getUserEmail(accessToken) {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.email || null;
}

// Cache mémoire des jetons d'accès (valables ~1 h) pour éviter de les redemander à chaque fichier.
const accessCache = new Map();

async function getAccessToken(tenant) {
  if (tenant.storageProvider !== "google_drive" || !tenant.googleDriveRefreshToken) {
    throw new DriveError("Google Drive n'est pas connecté pour cette organisation.", { status: 409, reconnect: true });
  }
  const cached = accessCache.get(tenant.id);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  let refreshToken;
  try {
    refreshToken = decrypt(tenant.googleDriveRefreshToken);
  } catch {
    throw new DriveError("Impossible de lire la connexion Google Drive. Reconnectez-la dans les paramètres.", { status: 409, reconnect: true });
  }

  const { ok, data } = await postForm(TOKEN_URL, {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  if (!ok) {
    accessCache.delete(tenant.id);
    if (data.error === "invalid_grant") {
      throw new DriveError(
        "L'accès à Google Drive a été révoqué ou a expiré. Un administrateur doit le reconnecter dans les paramètres.",
        { status: 409, reconnect: true }
      );
    }
    throw new DriveError("Google Drive est momentanément indisponible. Réessayez dans quelques instants.");
  }
  accessCache.set(tenant.id, { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

function forget(tenantId) {
  accessCache.delete(tenantId);
}

async function driveFetch(accessToken, url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason || body?.error?.status || res.status;
    if (res.status === 404) throw new DriveError("Ce fichier est introuvable dans Google Drive (supprimé ou déplacé ?).", { status: 404 });
    if (reason === "storageQuotaExceeded") throw new DriveError("Le Google Drive de votre organisation est plein.", { status: 413 });
    if (res.status === 401) throw new DriveError("La connexion Google Drive a expiré. Reconnectez-la dans les paramètres.", { status: 409, reconnect: true });
    throw new DriveError(`Erreur Google Drive (${reason}).`);
  }
  return res;
}

async function createFolder(accessToken, name, parentId) {
  const res = await driveFetch(accessToken, `${DRIVE_API}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, ...(parentId ? { parents: [parentId] } : {}) }),
  });
  return (await res.json()).id;
}

async function folderExists(accessToken, folderId) {
  try {
    const res = await driveFetch(accessToken, `${DRIVE_API}/files/${encodeURIComponent(folderId)}?fields=id,trashed`);
    const data = await res.json();
    return !data.trashed;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

// Envoi "resumable" : recommandé par Google au-delà de 5 Mo, et fonctionne pour toutes les tailles.
// https://developers.google.com/drive/api/guides/manage-uploads
async function uploadFile(accessToken, { buffer, name, mimeType, parentId }) {
  const init = await driveFetch(accessToken, `${DRIVE_UPLOAD}/files?uploadType=resumable&fields=id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mimeType || "application/octet-stream",
      "X-Upload-Content-Length": String(buffer.length),
    },
    body: JSON.stringify({ name, mimeType, parents: parentId ? [parentId] : undefined }),
  });
  const sessionUri = init.headers.get("location");
  if (!sessionUri) throw new DriveError("Google Drive n'a pas ouvert de session d'envoi.");

  const res = await fetch(sessionUri, {
    method: "PUT",
    headers: { "Content-Type": mimeType || "application/octet-stream", "Content-Length": String(buffer.length) },
    body: buffer,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason;
    if (reason === "storageQuotaExceeded") throw new DriveError("Le Google Drive de votre organisation est plein.", { status: 413 });
    throw new DriveError(`Échec de l'envoi vers Google Drive (${reason || res.status}).`);
  }
  return (await res.json()).id;
}

async function downloadFile(accessToken, fileId) {
  return driveFetch(accessToken, `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`);
}

// Mise à la corbeille plutôt que suppression définitive : le client peut récupérer
// un document supprimé par erreur depuis la corbeille de son Drive.
async function trashFile(accessToken, fileId) {
  await driveFetch(accessToken, `${DRIVE_API}/files/${encodeURIComponent(fileId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true }),
  });
}

async function revoke(refreshTokenEncrypted) {
  try {
    await postForm(REVOKE_URL, { token: decrypt(refreshTokenEncrypted) });
  } catch {
    /* révocation au mieux : on déconnecte de toute façon côté Archivix */
  }
}

module.exports = {
  DriveError,
  isConfigured,
  missingSettings,
  buildAuthUrl,
  exchangeCode,
  getUserEmail,
  getAccessToken,
  forget,
  createFolder,
  folderExists,
  uploadFile,
  downloadFile,
  trashFile,
  revoke,
  encrypt,
};
