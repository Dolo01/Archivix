import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";

export default function Register() {
  const [form, setForm] = useState({ companyName: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      loginSuccess(data);
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.message || "Inscription impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Créer l'espace de votre organisation"
      subtitle="14 jours d'essai gratuit, sans engagement ni carte bancaire."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to="/connexion" className="font-semibold text-brand hover:text-brand-dark">Se connecter</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nom de l'organisation">
          <input required value={form.companyName} onChange={update("companyName")} className="input" placeholder="Cabinet, entreprise ou administration" />
        </Field>
        <Field label="Votre nom complet">
          <input required autoComplete="name" value={form.fullName} onChange={update("fullName")} className="input" placeholder="Prénom Nom" />
        </Field>
        <Field label="Email professionnel">
          <input type="email" required autoComplete="email" value={form.email} onChange={update("email")} className="input" placeholder="vous@organisation.com" />
        </Field>
        <Field label="Mot de passe" hint="8 caractères minimum.">
          <input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={update("password")} className="input" />
        </Field>

        {error && <p className="alert-error">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? "Création…" : "Démarrer l'essai gratuit"}
        </button>
        <p className="text-center text-xs text-ink/45">
          Vous serez l'administrateur de cet espace. En créant un compte, vous acceptez notre{" "}
          <Link to="/confidentialite" className="underline hover:text-ink">politique de confidentialité</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
