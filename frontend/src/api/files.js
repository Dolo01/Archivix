import api from "./client";

const API_ORIGIN = import.meta.env.VITE_API_URL || "";

// Ouvre un document dans un nouvel onglet. Les fichiers stockés sur Google Drive sont privés :
// on demande d'abord au serveur un lien signé, valable quelques minutes.
// L'onglet est ouvert immédiatement (avant la requête) pour ne pas être bloqué par le navigateur.
export async function openDocument(doc) {
  const tab = window.open("", "_blank");
  try {
    const { data } = await api.get(`/documents/${doc.id}/lien`);
    const url = data.url.startsWith("/api/") ? `${API_ORIGIN}${data.url}` : data.url;
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch (err) {
    tab?.close();
    alert(err.response?.data?.message || "Impossible d'ouvrir ce document.");
  }
}
