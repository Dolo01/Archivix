import axios from "axios";

const superAdminApi = axios.create({ baseURL: "/api/superadmin" });

superAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("archivix_superadmin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

superAdminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("archivix_superadmin_token");
      window.location.href = "/superadmin/connexion";
    }
    return Promise.reject(err);
  }
);

export default superAdminApi;
