// Libellés et couleurs des actions du journal d'activité.
// tile : pastille de l'icône ; badge : étiquette du type ; dot : point de la frise
export const ACTION_META = {
  archivage: { label: "Archivage", badge: "badge bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100", dot: "bg-emerald-500", tile: "bg-emerald-50 text-emerald-600" },
  consultation: { label: "Consultation", badge: "badge bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100", dot: "bg-sky-500", tile: "bg-sky-50 text-sky-600" },
  impression: { label: "Impression", badge: "badge bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200", dot: "bg-slate-500", tile: "bg-slate-100 text-slate-600" },
  modification: { label: "Modification", badge: "badge bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100", dot: "bg-amber-500", tile: "bg-amber-50 text-amber-600" },
  partage: { label: "Partage", badge: "badge bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100", dot: "bg-violet-500", tile: "bg-violet-50 text-violet-600" },
  suppression: { label: "Suppression", badge: "badge bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100", dot: "bg-rose-500", tile: "bg-rose-50 text-rose-600" },
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
