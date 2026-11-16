const express = require("express");
const { requireActiveSubscription } = require("../middleware/subscription");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const documentController = require("../controllers/documentController");

// Ouverture d'un fichier Google Drive via lien signé (ouvert dans un nouvel onglet, donc sans en-tête d'authentification)
router.get("/:id/fichier", documentController.streamFile);

router.use(requireAuth);
// Abonnement expiré : consultation possible, modifications suspendues (lecture seule)
router.use(requireActiveSubscription);

router.get("/", documentController.list);
router.get("/:id", documentController.getOne);
router.get("/:id/lien", documentController.link);
router.get("/:id/historique", documentController.history);
router.get("/:id/contenu", documentController.content);
router.post("/", upload.single("file"), documentController.upload);
router.patch("/:id", requireRole("admin", "gestionnaire"), documentController.update);
router.delete("/:id", requireRole("admin", "gestionnaire"), documentController.remove);

module.exports = router;
