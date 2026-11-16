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

function isAppleMobile() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Imprime un document : le fichier est récupéré par le serveur Archivix (droits vérifiés),
 * chargé dans un cadre invisible, puis la boîte d'impression du navigateur s'ouvre.
 * Renvoie un message à afficher si l'impression directe n'est pas possible.
 */
export async function printDocument(doc) {
  const mime = doc.mimeType || "";
  const printable = mime === "application/pdf" || mime.startsWith("image/");
  if (!printable) {
    await openDocument(doc);
    return "L'impression directe fonctionne pour les PDF et les images. Le fichier s'ouvre : imprimez-le depuis Word ou Excel.";
  }

  // Sur iPhone / iPad, l'impression d'un cadre invisible n'est pas fiable : on ouvre le fichier,
  // puis Partager → Imprimer.
  const appleTab = isAppleMobile() ? window.open("", "_blank") : null;

  const res = await api.get(`/documents/${doc.id}/contenu`, { params: { usage: "impression" }, responseType: "blob" });
  const blob = new Blob([res.data], { type: mime });
  const url = URL.createObjectURL(blob);

  if (appleTab) {
    appleTab.location.href = url;
    return "Le document est ouvert : touchez Partager puis Imprimer.";
  }

  await new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.title = "Impression";
    // Hors de l'écran mais avec une vraie taille : certains navigateurs n'impriment pas un cadre de 0 px
    Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "800px", height: "600px", border: "0", opacity: "0", pointerEvents: "none" });
    const cleanup = () => {
      setTimeout(() => {
        frame.remove();
        URL.revokeObjectURL(url);
      }, 1000);
    };
    frame.onload = () => {
      setTimeout(() => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.addEventListener("afterprint", cleanup, { once: true });
          frame.contentWindow.print();
        } catch {
          window.open(url, "_blank");
        }
        // Filet de sécurité si « afterprint » n'est pas émis
        setTimeout(cleanup, 60000);
        resolve();
      }, mime === "application/pdf" ? 500 : 50);
    };
    if (mime.startsWith("image/")) {
      frame.srcdoc = `<!doctype html><html><head><title>${(doc.title || "").replace(/[<&>"]/g, "")}</title><style>@page{margin:12mm}html,body{margin:0}img{display:block;max-width:100%;max-height:100vh;margin:0 auto;object-fit:contain}</style></head><body><img src="${url}" alt=""></body></html>`;
    } else {
      frame.src = url;
    }
    document.body.appendChild(frame);
  });
  return null;
}
