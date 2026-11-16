import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { closeSocket } from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("archivix_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        setTenant(data.tenant);
      })
      .catch(() => localStorage.removeItem("archivix_token"))
      .finally(() => setLoading(false));
  }, []);

  function loginSuccess({ token, user, tenant }) {
    localStorage.setItem("archivix_token", token);
    setUser(user);
    setTenant(tenant);
  }

  // Recharge l'organisation (ex. après la connexion de Google Drive)
  async function refreshTenant() {
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    setTenant(data.tenant);
    return data.tenant;
  }

  // Après un changement de mot de passe, le serveur ferme les anciennes sessions et en fournit une nouvelle
  function passwordChanged({ token, user: updated }) {
    if (token) localStorage.setItem("archivix_token", token);
    if (updated) setUser((u) => ({ ...u, ...updated }));
  }

  function logout() {
    localStorage.removeItem("archivix_token");
    closeSocket();
    setUser(null);
    setTenant(null);
  }

  return (
    <AuthContext.Provider value={{ user, tenant, loading, loginSuccess, logout, refreshTenant, passwordChanged }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
