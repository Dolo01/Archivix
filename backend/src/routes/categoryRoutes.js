const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const prisma = require("../config/prisma");

router.use(requireAuth);

router.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({ where: { tenantId: req.tenantId }, orderBy: { name: "asc" } });
  res.json(categories);
});

router.post("/", async (req, res) => {
  const category = await prisma.category.create({
    data: { tenantId: req.tenantId, name: req.body.name, color: req.body.color, parentId: req.body.parentId || null },
  });
  res.status(201).json(category);
});

router.delete("/:id", async (req, res) => {
  await prisma.category.deleteMany({ where: { id: req.params.id, tenantId: req.tenantId } });
  res.json({ message: "Catégorie supprimée." });
});

module.exports = router;
