const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let supabase = null;
if (useSupabase) {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const BUCKET = process.env.SUPABASE_BUCKET || "archivix";
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");

/**
 * Enregistre un fichier et renvoie son URL publique.
 * Utilise Supabase Storage si configuré (recommandé en production, car le disque
 * d'un hébergeur gratuit comme Render est effacé à chaque redémarrage).
 * Sinon, retombe sur le disque local (pratique en développement).
 */
async function saveFile(buffer, originalName, folder, mimeType) {
  const ext = path.extname(originalName) || "";
  const fileName = `${uuid()}${ext}`;

  if (useSupabase) {
    const objectPath = `${folder}/${fileName}`;
    const uploadOptions = { upsert: false };
    if (mimeType) uploadOptions.contentType = mimeType;
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, uploadOptions);
    if (error) throw new Error(`Échec de l'envoi vers Supabase Storage : ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return { url: data.publicUrl, storedName: fileName, path: objectPath };
  }

  const dir = path.join(LOCAL_UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), buffer);
  return { url: `/uploads/${folder}/${fileName}`, storedName: fileName, path: `${folder}/${fileName}` };
}

// Retrouve le chemin interne d'un fichier à partir de son ancienne URL publique
// (documents archivés avant l'introduction des liens temporaires).
function pathFromUrl(fileUrl = "") {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = fileUrl.indexOf(marker);
  if (i !== -1) return decodeURIComponent(fileUrl.slice(i + marker.length).split("?")[0]);
  if (fileUrl.startsWith("/uploads/")) return decodeURIComponent(fileUrl.slice("/uploads/".length));
  return null;
}

// Lien Supabase temporaire : le fichier n'est lisible que pendant `seconds` secondes.
// Nécessite un bucket PRIVÉ côté Supabase pour que les anciennes URL publiques cessent de fonctionner.
async function signedSupabaseUrl(objectPath, seconds = 300) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(objectPath, seconds);
  if (error) throw new Error(`Lien temporaire impossible : ${error.message}`);
  return data.signedUrl;
}

// Chemin absolu d'un fichier local, en refusant toute sortie du dossier d'upload ("../").
function localFilePath(relativePath) {
  const full = path.resolve(LOCAL_UPLOAD_DIR, relativePath);
  if (!full.startsWith(path.resolve(LOCAL_UPLOAD_DIR) + path.sep)) return null;
  return full;
}

// Pour l'affichage (ex. captures de reçus dans l'espace super-admin) : remplace une URL publique
// Supabase par un lien temporaire, pour que ces images restent visibles une fois le bucket privé.
async function displayUrl(fileUrl, seconds = 3600) {
  if (!fileUrl || !useSupabase || fileUrl.startsWith("/uploads/")) return fileUrl;
  const objectPath = pathFromUrl(fileUrl);
  if (!objectPath) return fileUrl;
  try {
    return await signedSupabaseUrl(objectPath, seconds);
  } catch {
    return null;
  }
}

module.exports = { saveFile, useSupabase, pathFromUrl, signedSupabaseUrl, localFilePath, displayUrl };