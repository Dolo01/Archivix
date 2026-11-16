const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const drive = require("../utils/googleDrive");

const FRONTEND_URL = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

function settingsRedirect(res, params) {
  return res.redirect(`${FRONTEND_URL()}/app/parametres?${new URLSearchParams(params)}`);
}

exports.status = async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
  const driveDocuments = await prisma.document.count({
    where: { tenantId: req.tenantId, storageProvider: "google_drive" },
  });
  res.json({
    configured: drive.isConfigured(),
    connected: tenant.storageProvider === "google_drive" && Boolean(tenant.googleDriveRefreshToken),
    email: tenant.googleDriveEmail,
    connectedAt: tenant.googleDriveConnectedAt,
    driveDocuments,
  });
};

// Étape 1 : on renvoie l'URL de consentement Google. Le "state" signé lie la réponse de
// Google à cette organisation et à cet administrateur, et expire au bout de 10 minutes.
exports.connect = async (req, res) => {
  if (!drive.isConfigured()) {
    return res.status(503).json({ message: "L'intégration Google Drive n'est pas encore configurée sur ce serveur." });
  }
  const state = jwt.sign({ purpose: "gdrive_connect", tenantId: req.tenantId, userId: req.user.id }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  res.json({ url: drive.buildAuthUrl(state) });
};

// Étape 2 : Google redirige ici après le consentement (route publique, sécurisée par le state).
exports.callback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return settingsRedirect(res, { drive: "erreur", raison: error === "access_denied" ? "refus" : error });

  let payload;
  try {
    payload = jwt.verify(String(state || ""), process.env.JWT_SECRET);
    if (payload.purpose !== "gdrive_connect") throw new Error();
  } catch {
    return settingsRedirect(res, { drive: "erreur", raison: "lien_expire" });
  }

  try {
    const admin = await prisma.user.findFirst({
      where: { id: payload.userId, tenantId: payload.tenantId, role: "admin", isActive: true },
    });
    if (!admin) return settingsRedirect(res, { drive: "erreur", raison: "acces_refuse" });

    const tokens = await drive.exchangeCode(String(code || ""));
    if (!tokens.refresh_token) return settingsRedirect(res, { drive: "erreur", raison: "jeton_absent" });

    const tenant = await prisma.tenant.findUnique({ where: { id: payload.tenantId } });
    const email = await drive.getUserEmail(tokens.access_token);

    // Même compte Google qu'avant et dossier toujours présent : on le réutilise.
    // Sinon, on crée un nouveau dossier racine et on oublie les sous-dossiers des départements.
    let folderId = null;
    if (tenant.googleDriveFolderId && email && email === tenant.googleDriveEmail) {
      if (await drive.folderExists(tokens.access_token, tenant.googleDriveFolderId)) folderId = tenant.googleDriveFolderId;
    }
    if (!folderId) {
      folderId = await drive.createFolder(tokens.access_token, `Archivix — ${tenant.name}`);
      await prisma.department.updateMany({ where: { tenantId: tenant.id }, data: { googleDriveFolderId: null } });
    }

    if (tenant.googleDriveRefreshToken) await drive.revoke(tenant.googleDriveRefreshToken);
    drive.forget(tenant.id);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        storageProvider: "google_drive",
        googleDriveEmail: email,
        googleDriveRefreshToken: drive.encrypt(tokens.refresh_token),
        googleDriveFolderId: folderId,
        googleDriveConnectedAt: new Date(),
      },
    });

    return settingsRedirect(res, { drive: "connecte" });
  } catch (err) {
    console.error("[Google Drive] connexion échouée :", err.message);
    return settingsRedirect(res, { drive: "erreur", raison: "google" });
  }
};

exports.disconnect = async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
  if (tenant.googleDriveRefreshToken) await drive.revoke(tenant.googleDriveRefreshToken);
  drive.forget(tenant.id);

  // On garde l'email et l'identifiant du dossier : en cas de reconnexion avec le même
  // compte Google, les documents déjà envoyés redeviennent accessibles.
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { storageProvider: "archivix", googleDriveRefreshToken: null, googleDriveConnectedAt: null },
  });
  res.json({ message: "Google Drive déconnecté. Les nouveaux documents seront stockés par Archivix." });
};
