// Grille tarifaire d'Archivix — facturation annuelle uniquement.
// "entreprise" est sur devis : aucun prix fixe, aucune limite d'utilisateurs.
const PLANS = {
  essai: { label: "Essai gratuit", maxUsers: null, prixAnnuel: 0 },
  starter: { label: "Starter", maxUsers: 5, prixAnnuel: 60000 },
  pro: { label: "Pro", maxUsers: 10, prixAnnuel: 100000 },
  business: { label: "Business", maxUsers: 25, prixAnnuel: 200000 },
  entreprise: { label: "Enterprise", maxUsers: null, prixAnnuel: null },
};

const ESSAI_DUREE_JOURS = 14;

// Offres qu'une entreprise peut demander via le formulaire de dépôt (Enterprise se fait sur devis, hors de ce flux)
const OFFRES_DEMANDABLES = ["starter", "pro", "business"];

module.exports = { PLANS, ESSAI_DUREE_JOURS, OFFRES_DEMANDABLES };
