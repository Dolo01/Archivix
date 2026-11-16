// Grille tarifaire d'Archivix (FCFA). Paiement mensuel ou annuel (l'annuel = 10 mois, soit 2 mois offerts).
// Le stockage Archivix est limité par offre ; avec le Google Drive de l'organisation, aucun quota ne s'applique.
//
// features : fonctions réservées à certaines offres
//   - activite        : journal d'activité (qui a consulté / modifié / partagé quoi)
//   - activiteExport  : export CSV du journal d'activité
const ALL_FEATURES = ["activite", "activiteExport"];

const PLANS = {
  // Essai gratuit : toutes les fonctions, pour que l'organisation puisse tout tester.
  essai: { label: "Essai gratuit", maxUsers: null, prixMensuel: 0, prixAnnuel: 0, quotaMb: 1024, features: ALL_FEATURES },

  essentiel: {
    label: "Essentiel",
    description: "Petit cabinet, association",
    maxUsers: 5,
    prixMensuel: 5000,
    prixAnnuel: 50000,
    quotaMb: 1024,
    features: [],
  },
  professionnel: {
    label: "Professionnel",
    description: "Cabinet, PME",
    maxUsers: 15,
    prixMensuel: 12000,
    prixAnnuel: 120000,
    quotaMb: 3072,
    features: ["activite"],
    recommande: true,
  },
  business: {
    label: "Business",
    description: "Entreprise multi-services",
    maxUsers: 40,
    prixMensuel: 25000,
    prixAnnuel: 250000,
    quotaMb: 10240,
    features: ["activite", "activiteExport"],
  },
  institution: {
    label: "Institution",
    description: "Administration, grand compte",
    maxUsers: null,
    prixMensuel: null,
    prixAnnuel: null,
    quotaMb: 10240,
    features: ALL_FEATURES,
    surDevis: true,
  },

  // Anciennes offres (avant novembre 2026) : toujours reconnues pour les organisations qui les ont,
  // mais plus proposées à la souscription.
  starter: { label: "Starter", maxUsers: 5, prixMensuel: null, prixAnnuel: 60000, quotaMb: 5000, features: [], ancienne: true },
  pro: { label: "Pro", maxUsers: 10, prixMensuel: null, prixAnnuel: 100000, quotaMb: 5000, features: ["activite"], ancienne: true },
  entreprise: { label: "Enterprise", maxUsers: null, prixMensuel: null, prixAnnuel: null, quotaMb: 10240, features: ALL_FEATURES, ancienne: true },
};

const ESSAI_DUREE_JOURS = 14;

// Offres que l'on peut demander via le formulaire de dépôt (Institution se fait sur devis).
const OFFRES_DEMANDABLES = ["essentiel", "professionnel", "business"];
const OFFRES_AFFICHEES = ["essentiel", "professionnel", "business", "institution"];

// Durées de paiement acceptées (en mois) et montant correspondant.
const DUREES = { 1: "prixMensuel", 12: "prixAnnuel" };

function planOf(tenant) {
  return PLANS[tenant?.plan] || PLANS.essai;
}

function hasFeature(tenant, feature) {
  return planOf(tenant).features.includes(feature);
}

function montantPour(planId, dureeMois) {
  const plan = PLANS[planId];
  const champ = DUREES[dureeMois];
  if (!plan || !champ) return null;
  return plan[champ];
}

module.exports = {
  PLANS,
  ESSAI_DUREE_JOURS,
  OFFRES_DEMANDABLES,
  OFFRES_AFFICHEES,
  DUREES,
  planOf,
  hasFeature,
  montantPour,
};
