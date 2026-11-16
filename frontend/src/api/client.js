import axios from "axios";

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ""}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("archivix_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    // Session expirée ou fermée : on ne redirige que si une session était envoyée,
    // sinon (ex. mauvais mot de passe à la connexion) le message d'erreur resterait invisible.
    if (status === 401 && err.config?.headers?.Authorization) {
      localStorage.removeItem("archivix_token");
      try {
        const msg = err.response?.data?.message;
        if (msg) sessionStorage.setItem("archivix_logout_reason", msg);
      } catch {
        /* stockage indisponible : sans gravité */
      }
      window.location.href = "/connexion";
    }
    // Abonnement expiré : l'interface affiche le bandeau « lecture seule »
    if (status === 402 && err.response?.data?.expired) {
      window.dispatchEvent(new CustomEvent("archivix:lecture-seule"));
    }
    return Promise.reject(err);
  }
);

export default api;
