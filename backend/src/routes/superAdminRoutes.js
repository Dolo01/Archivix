const express = require("express");
const router = express.Router();
const { requireSuperAdmin } = require("../middleware/superAdminAuth");
const superAdminController = require("../controllers/superAdminController");

router.post("/connexion", superAdminController.login);

router.use(requireSuperAdmin);
router.get("/moi", superAdminController.me);
router.get("/entreprises", superAdminController.tenants);
router.patch("/entreprises/:id/basculer-actif", superAdminController.toggleTenantActive);
router.get("/demandes-abonnement", superAdminController.subscriptionRequests);
router.patch("/demandes-abonnement/:id/approuver", superAdminController.approveRequest);
router.patch("/demandes-abonnement/:id/refuser", superAdminController.rejectRequest);

module.exports = router;
