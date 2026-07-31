import { createContext, useContext, useEffect, useState } from "react";
import superAdminApi from "../api/superAdminClient";

const SuperAdminContext = createContext(null);

export function SuperAdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("archivix_superadmin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    superAdminApi
      .get("/moi")
      .then(({ data }) => setAdmin(data))
      .catch(() => localStorage.removeItem("archivix_superadmin_token"))
      .finally(() => setLoading(false));
  }, []);

  function loginSuccess({ token, admin }) {
    localStorage.setItem("archivix_superadmin_token", token);
    setAdmin(admin);
  }

  function logout() {
    localStorage.removeItem("archivix_superadmin_token");
    setAdmin(null);
  }

  return (
    <SuperAdminContext.Provider value={{ admin, loading, loginSuccess, logout }}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  return useContext(SuperAdminContext);
}
