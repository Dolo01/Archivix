const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const messageController = require("../controllers/messageController");

router.use(requireAuth);

router.get("/:documentId", messageController.history);
router.post("/:documentId", messageController.create);

module.exports = router;
