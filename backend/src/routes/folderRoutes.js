const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const folderController = require("../controllers/folderController");

router.use(requireAuth);

router.get("/", folderController.list);
router.post("/", folderController.create);
router.patch("/:id", folderController.update);
router.patch("/:id/partage", folderController.updateSharing);
router.delete("/:id", folderController.remove);

module.exports = router;
