import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Message laissé par une déconnexion forcée (ex. mot de passe changé sur un autre appareil)
  // (effacé seulement en quittant la page : un rechargement juste après la déconnexion le conserve)
  const [error, setError] = useState(() => {
    try {
      return sessionStorage.getItem("archivix_logout_reason") || "";
    } catch {
      return "";
    }
  });
  useEffect(() => () => {
    try {
      sessionStorage.removeItem("archivix_logout_reason");
    } catch {
      /* sans gravité */
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      sessionStorage.removeItem("archivix_logout_reason");
    } catch {
      /* sans gravité */
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      loginSuccess(data);
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.message || "Connexion impossible. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à l'espace documentaire de votre organisation."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="font-semibold text-brand hover:text-brand-dark">Créer un espace</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email professionnel">
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="vous@organisation.com" />
        </Field>
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Mot de passe</label>
            <Link to="/mot-de-passe-oublie" className="mb-1.5 text-xs font-medium text-brand hover:text-brand-dark">Mot de passe oublié ?</Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/40 hover:text-ink"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="alert-error">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthLayout>
  );
}
