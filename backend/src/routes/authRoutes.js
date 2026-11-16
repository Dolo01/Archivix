const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const auth = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

// Fabrique un limiteur ; chaque action a son propre compteur pour qu'un bureau entier
// (souvent derrière une même adresse IP) ne soit pas bloqué par l'activité de ses collègues.
function limiter(max, message, keyGenerator) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    message: { message },
  });
}
const TROP = "Trop de tentatives. Réessayez dans 15 minutes.";
const registerLimit = limiter(10, TROP); // créations d'organisation, par IP
const changeLimit = limiter(10, TROP, (req) => `chg:${req.user?.id}`); // par utilisateur connecté
const forgotLimit = limiter(5, TROP, (req) => `oubli:${String(req.body?.email || "").trim().toLowerCase()}`); // par adresse
const forgotIpLimit = limiter(50, TROP); // garde-fou global par IP
const resetLimit = limiter(30, TROP); // le jeton (256 bits) ne peut pas être deviné ; simple garde-fou

// Connexion : limite par compte (adresse e-mail), pour ne pas bloquer un bureau entier derrière une même IP
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `login:${String(req.body?.email || "").trim().toLowerCase()}`,
  message: { message: "Trop de tentatives de connexion pour ce compte. Réessayez dans 15 minutes ou réinitialisez votre mot de passe." },
});

router.post("/register", registerLimit, auth.register);
router.post("/login", loginLimit, auth.login);
router.get("/me", requireAuth, auth.me);
router.get("/config", auth.config);
router.post("/mot-de-passe", requireAuth, changeLimit, auth.changePassword);
router.post("/mot-de-passe-oublie", forgotIpLimit, forgotLimit, auth.forgotPassword);
router.get("/jeton", auth.tokenInfo);
router.post("/reinitialiser", resetLimit, auth.resetPassword);

module.exports = router;
