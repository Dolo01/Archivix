const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

router.use(requireAuth);

router.get("/", notificationController.list);
router.patch("/:id/lue", notificationController.markRead);
router.patch("/tout-lire", notificationController.markAllRead);

module.exports = router;
