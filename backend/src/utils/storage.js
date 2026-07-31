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
    return { url: data.publicUrl, storedName: fileName };
  }

  const dir = path.join(LOCAL_UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), buffer);
  return { url: `/uploads/${folder}/${fileName}`, storedName: fileName };
}

module.exports = { saveFile, useSupabase };