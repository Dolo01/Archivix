const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const uploadCapture = require("../middleware/uploadCapture");
const subscriptionController = require("../controllers/subscriptionController");

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/coordonnees", subscriptionController.coordonnees);
router.post("/", uploadCapture.single("capture"), subscriptionController.create);
router.get("/historique", subscriptionController.history);

module.exports = router;
