const express = require("express");
const { requireActiveSubscription } = require("../middleware/subscription");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const folderController = require("../controllers/folderController");

router.use(requireAuth);
// Abonnement expiré : consultation possible, modifications suspendues (lecture seule)
router.use(requireActiveSubscription);

router.get("/", folderController.list);
router.post("/", folderController.create);
router.patch("/:id", folderController.update);
router.patch("/:id/partage", folderController.updateSharing);
router.delete("/:id", folderController.remove);

module.exports = router;
