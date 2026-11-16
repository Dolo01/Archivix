const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const integrationController = require("../controllers/integrationController");

// Retour de Google après consentement : pas de jeton Archivix ici, la sécurité repose sur le "state" signé.
router.get("/google-drive/callback", integrationController.callback);

router.use(requireAuth, requireRole("admin"));
router.get("/google-drive", integrationController.status);
router.post("/google-drive/connect", integrationController.connect);
router.delete("/google-drive", integrationController.disconnect);

module.exports = router;
