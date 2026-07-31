const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const departmentController = require("../controllers/departmentController");

router.use(requireAuth);

router.get("/", departmentController.list);
router.post("/", requireRole("admin"), departmentController.create);
router.patch("/:id", requireRole("admin"), departmentController.update);
router.patch("/affecter-membre", requireRole("admin"), departmentController.assignMember);
router.delete("/:id", requireRole("admin"), departmentController.remove);

module.exports = router;
