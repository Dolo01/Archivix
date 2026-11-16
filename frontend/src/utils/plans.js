// Noms affichés des offres (y compris les anciennes, encore portées par certaines organisations).
export const PLAN_LABEL = {
  essai: "Essai gratuit",
  essentiel: "Essentiel",
  professionnel: "Professionnel",
  business: "Business",
  institution: "Institution",
  starter: "Starter",
  pro: "Pro",
  entreprise: "Enterprise",
};

export function planLabel(id) {
  return PLAN_LABEL[id] || id || "—";
}

export function formatFcfa(n) {
  return `${Number(n).toLocaleString("fr-FR")} FCFA`;
}

export function dureeLabel(mois) {
  return Number(mois) === 1 ? "1 mois" : `${mois} mois`;
}

// Contenu des offres affiché sur la page d'accueil et la page Abonnement.
// Les prix et limites font foi côté serveur (backend/src/utils/plans.js) : garder les deux alignés.
export const OFFRES = [
  {
    id: "essentiel",
    label: "Essentiel",
    description: "Petit cabinet, association",
    maxUsers: 5,
    prixMensuel: 5000,
    prixAnnuel: 50000,
    points: ["Jusqu'à 5 utilisateurs", "Départements, dossiers, partages", "Google Drive de l'organisation", "Stockage Archivix : 1 Go"],
    absent: ["Journal d'activité"],
  },
  {
    id: "professionnel",
    label: "Professionnel",
    description: "Cabinet, PME",
    maxUsers: 15,
    prixMensuel: 12000,
    prixAnnuel: 120000,
    recommande: true,
    points: ["Jusqu'à 15 utilisateurs", "Tout Essentiel", "Journal d'activité (qui a consulté quoi)", "Stockage Archivix : 3 Go", "Support par e-mail sous 48 h"],
  },
  {
    id: "business",
    label: "Business",
    description: "Entreprise multi-services",
    maxUsers: 40,
    prixMensuel: 25000,
    prixAnnuel: 250000,
    points: ["Jusqu'à 40 utilisateurs", "Tout Professionnel", "Export du journal d'activité", "Stockage Archivix : 10 Go", "Support prioritaire"],
  },
  {
    id: "institution",
    label: "Institution",
    description: "Administration, grand compte",
    surDevis: true,
    points: ["Utilisateurs illimités", "Tout Business", "Formation des équipes", "Accompagnement à la numérisation", "Facture et bon de commande"],
  },
];
