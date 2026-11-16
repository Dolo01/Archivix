// Libellés et couleurs des actions du journal d'activité.
export const ACTION_META = {
  archivage: { label: "Archivage", badge: "badge-success", dot: "bg-success" },
  consultation: { label: "Consultation", badge: "badge-neutral", dot: "bg-ink/30" },
  impression: { label: "Impression", badge: "badge-neutral", dot: "bg-ink/50" },
  modification: { label: "Modification", badge: "badge-brand", dot: "bg-brand" },
  partage: { label: "Partage", badge: "badge-warning", dot: "bg-warning" },
  suppression: { label: "Suppression", badge: "badge-danger", dot: "bg-danger" },
};

const VERBES = {
  archivage: "a archivé",
  consultation: "a consulté",
  impression: "a imprimé",
  modification: "a modifié",
  partage: "a modifié le partage de",
  suppression: "a supprimé",
};

export function verbFor(action) {
  return VERBES[action] || "a agi sur";
}

/**
 * Phrase lisible pour une entrée du journal.
 * short : sans le titre du document (utilisé dans la fiche du document elle-même).
 */
export function describeActivity(entry, { short = false } = {}) {
  const verbe = VERBES[entry.action] || "a agi sur";
  if (!entry.documentTitle) {
    // Action sans document (ex. partage d'un dossier) : le détail décrit l'action.
    return entry.action === "partage" ? "a modifié un partage" : verbe;
  }
  if (short) return verbe === "a modifié le partage de" ? "a modifié le partage" : `${verbe} le document`;
  return `${verbe} « ${entry.documentTitle} »`;
}
