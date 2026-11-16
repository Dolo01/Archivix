const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

/**
 * Stockage des fichiers (documents archivés, captures de reçus), par ordre de priorité :
 *  1. Stockage objet compatible S3 — Neon Object Storage (recommandé en production)
 *     si AWS_ENDPOINT_URL_S3 + AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY sont renseignés ;
 *  2. Supabase Storage si SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY sont renseignés ;
 *  3. sinon le disque local (développement : le disque d'un hébergeur gratuit est effacé à chaque redéploiement).
 *
 * Aucun fichier n'est exposé par une URL publique permanente : on ne délivre que des liens temporaires.
 */

const useS3 = Boolean(process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
// Supabase reçoit les nouveaux fichiers seulement sans Neon, mais reste lisible pour les anciens fichiers.
const useSupabase = !useS3 && hasSupabase;

const S3_BUCKET = process.env.STORAGE_BUCKET || "archivix";
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "archivix";
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");

let s3 = null;
if (useS3) {
  const { S3Client } = require("@aws-sdk/client-s3");
  // Configuration recommandée par Neon : https://neon.com/docs/storage/get-started
  s3 = new S3Client({
    region: process.env.AWS_REGION || "eu-central-1",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

let supabase = null;
if (hasSupabase) {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const S3_PREFIX = `s3://${S3_BUCKET}/`;

function storageName() {
  if (useS3) return "Neon Object Storage (S3)";
  if (useSupabase) return "Supabase Storage";
  return `disque local (${LOCAL_UPLOAD_DIR})`;
}

/**
 * Enregistre un fichier. Renvoie :
 *  - url  : référence interne (s3://…, URL Supabase historique ou /uploads/…), jamais à exposer telle quelle ;
 *  - path : chemin de l'objet dans son stockage (à enregistrer comme storageKey).
 */
async function saveFile(buffer, originalName, folder, mimeType) {
  const ext = path.extname(originalName) || "";
  const fileName = `${uuid()}${ext}`;
  const objectPath = `${folder}/${fileName}`;

  if (useS3) {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: objectPath,
        Body: buffer,
        ContentType: mimeType || "application/octet-stream",
      })
    );
    return { url: `${S3_PREFIX}${objectPath}`, storedName: fileName, path: objectPath };
  }

  if (useSupabase) {
    const uploadOptions = { upsert: false };
    if (mimeType) uploadOptions.contentType = mimeType;
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(objectPath, buffer, uploadOptions);
    if (error) throw new Error(`Échec de l'envoi vers Supabase Storage : ${error.message}`);
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath);
    return { url: data.publicUrl, storedName: fileName, path: objectPath };
  }

  const dir = path.join(LOCAL_UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), buffer);
  return { url: `/uploads/${objectPath}`, storedName: fileName, path: objectPath };
}

// Type de stockage d'un fichier d'après sa référence enregistrée.
function kindOf(fileUrl = "") {
  if (fileUrl.startsWith("s3://")) return "s3";
  if (fileUrl.startsWith("/uploads/")) return "local";
  if (fileUrl.includes("/storage/v1/object/public/")) return "supabase";
  return "unknown";
}

// Retrouve le chemin interne d'un fichier à partir de sa référence enregistrée.
function pathFromUrl(fileUrl = "") {
  if (fileUrl.startsWith(S3_PREFIX)) return fileUrl.slice(S3_PREFIX.length);
  const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  const i = fileUrl.indexOf(marker);
  if (i !== -1) return decodeURIComponent(fileUrl.slice(i + marker.length).split("?")[0]);
  if (fileUrl.startsWith("/uploads/")) return decodeURIComponent(fileUrl.slice("/uploads/".length));
  return null;
}

/**
 * Lien temporaire vers un fichier stocké en S3 (Neon) ou Supabase.
 * Renvoie null pour un fichier local : c'est alors le serveur qui le diffuse via un lien signé.
 */
async function temporaryUrl(fileUrl, { seconds = 300, fileName, mimeType } = {}) {
  const kind = kindOf(fileUrl);
  const objectPath = pathFromUrl(fileUrl);

  if (kind === "s3") {
    if (!useS3) throw new Error("Ce fichier est stocké sur Neon, mais le stockage S3 n'est pas configuré.");
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: objectPath,
        ResponseContentDisposition: fileName ? `inline; filename*=UTF-8''${encodeURIComponent(fileName)}` : undefined,
        ResponseContentType: mimeType || undefined,
      }),
      { expiresIn: seconds }
    );
  }

  if (kind === "supabase") {
    if (!supabase) throw new Error("Ce fichier est stocké sur Supabase, mais Supabase n'est plus configuré.");
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(objectPath, seconds);
    if (error) throw new Error(`Lien temporaire impossible : ${error.message}`);
    return data.signedUrl;
  }

  return null;
}

/**
 * Lit le contenu d'un fichier (Neon S3, Supabase ou disque local) sous forme de flux Node.
 * Utilisé pour l'impression : le navigateur doit recevoir le fichier depuis le serveur Archivix.
 */
async function readFileStream(fileUrl) {
  const { Readable } = require("stream");
  const kind = kindOf(fileUrl);
  const objectPath = pathFromUrl(fileUrl);
  if (kind === "s3") {
    if (!useS3) throw new Error("Stockage S3 non configuré.");
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const out = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: objectPath }));
    return out.Body;
  }
  if (kind === "supabase") {
    if (!supabase) throw new Error("Supabase n'est plus configuré.");
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(objectPath);
    if (error) throw new Error(error.message);
    return Readable.from(Buffer.from(await data.arrayBuffer()));
  }
  if (kind === "local") {
    const full = localFilePath(objectPath || "");
    if (!full || !fs.existsSync(full)) throw new Error("Fichier introuvable sur le serveur.");
    return fs.createReadStream(full);
  }
  throw new Error("Emplacement du fichier inconnu.");
}

// Chemin absolu d'un fichier local, en refusant toute sortie du dossier d'upload ("../").
function localFilePath(relativePath) {
  const full = path.resolve(LOCAL_UPLOAD_DIR, relativePath);
  if (!full.startsWith(path.resolve(LOCAL_UPLOAD_DIR) + path.sep)) return null;
  return full;
}

// Pour l'affichage (ex. captures de reçus dans l'espace super-admin) : lien temporaire d'une heure.
async function displayUrl(fileUrl, seconds = 3600) {
  if (!fileUrl || kindOf(fileUrl) === "local") return fileUrl;
  try {
    return (await temporaryUrl(fileUrl, { seconds })) || fileUrl;
  } catch {
    return null;
  }
}

// Suppression définitive d'un fichier (au mieux : une erreur n'empêche pas de retirer la fiche).
async function deleteFile(fileUrl) {
  const kind = kindOf(fileUrl);
  const objectPath = pathFromUrl(fileUrl);
  try {
    if (kind === "s3" && useS3) {
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: objectPath }));
    } else if (kind === "supabase" && supabase) {
      await supabase.storage.from(SUPABASE_BUCKET).remove([objectPath]);
    } else if (kind === "local") {
      const full = localFilePath(objectPath);
      if (full && fs.existsSync(full)) fs.unlinkSync(full);
    }
  } catch (err) {
    console.error("[Stockage] suppression impossible :", err.message);
  }
}

module.exports = {
  saveFile,
  useS3,
  useSupabase,
  storageName,
  kindOf,
  pathFromUrl,
  temporaryUrl,
  localFilePath,
  displayUrl,
  deleteFile,
  readFileStream,
};
