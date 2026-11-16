const express = require("express");
const { requireActiveSubscription } = require("../middleware/subscription");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const messageController = require("../controllers/messageController");

router.use(requireAuth);
// Abonnement expiré : consultation possible, modifications suspendues (lecture seule)
router.use(requireActiveSubscription);

router.get("/:documentId", messageController.history);
router.post("/:documentId", messageController.create);

module.exports = router;
