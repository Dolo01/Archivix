const multer = require("multer");

const uploadCapture = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) return cb(null, true);
    cb(new Error("La capture doit être une image (PNG, JPEG ou WEBP)."));
  },
});

module.exports = uploadCapture;
