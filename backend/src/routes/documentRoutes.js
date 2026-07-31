const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const documentController = require("../controllers/documentController");

router.use(requireAuth);

router.get("/", documentController.list);
router.get("/:id", documentController.getOne);
router.post("/", upload.single("file"), documentController.upload);
router.patch("/:id", requireRole("admin", "gestionnaire"), documentController.update);
router.delete("/:id", requireRole("admin", "gestionnaire"), documentController.remove);

module.exports = router;
