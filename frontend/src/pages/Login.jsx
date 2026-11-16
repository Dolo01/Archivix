import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import IconInput from "../components/ui/IconInput.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      title="Connexion à votre espace"
      subtitle="Identifiez-vous pour accéder aux archives de votre organisation."
      footer={
        <>
          Votre organisation n'a pas encore de compte ?{" "}
          <Link to="/inscription" className="font-semibold text-brand hover:text-brand-dark">Créer un espace</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email professionnel">
          <IconInput icon={Mail} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@organisation.com" />
        </Field>
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Mot de passe</label>
            <Link to="/mot-de-passe-oublie" className="mb-1.5 text-xs font-medium text-brand hover:text-brand-dark">Mot de passe oublié ?</Link>
          </div>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && <p className="alert-error">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthLayout>
  );
}
