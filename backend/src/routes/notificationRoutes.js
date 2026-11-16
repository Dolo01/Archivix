const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

router.use(requireAuth);

router.get("/", notificationController.list);
router.get("/push/config", notificationController.pushConfig);
router.post("/push/abonnement", notificationController.pushSubscribe);
router.delete("/push/abonnement", notificationController.pushUnsubscribe);
router.post("/push/test", notificationController.pushTest);
router.patch("/:id/lue", notificationController.markRead);
router.patch("/tout-lire", notificationController.markAllRead);

module.exports = router;
