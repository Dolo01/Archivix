const multer = require("multer");

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Stockage en mémoire : le fichier est ensuite envoyé vers Supabase Storage
// (ou le disque local en développement) via src/utils/storage.js.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
    const err = new Error(
      `Le fichier « ${file.originalname} » n'est pas pris en charge. Formats acceptés : PDF, images (PNG, JPEG), Word et Excel.`
    );
    err.status = 400;
    cb(err);
  },
});

module.exports = upload;
