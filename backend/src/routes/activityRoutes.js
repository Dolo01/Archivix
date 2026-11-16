const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const activityController = require("../controllers/activityController");

router.use(requireAuth, requireRole("admin"));
router.get("/", activityController.list);
router.get("/export.csv", activityController.exportCsv);

module.exports = router;
