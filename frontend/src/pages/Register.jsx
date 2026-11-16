import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, User, Mail } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import IconInput from "../components/ui/IconInput.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";

// Indication simple de la solidité du mot de passe
function force(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 8) return { n: 1, label: "Trop court (8 caractères minimum)", cls: "bg-danger", txt: "text-danger" };
  if (score <= 2) return { n: 2, label: "Moyen", cls: "bg-warning", txt: "text-warning-dark" };
  if (score <= 3) return { n: 3, label: "Bon", cls: "bg-brand", txt: "text-brand" };
  return { n: 4, label: "Excellent", cls: "bg-success", txt: "text-success" };
}

export default function Register() {
  const [form, setForm] = useState({ companyName: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const f = force(form.password);

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
      eyebrow="Essai gratuit de 14 jours"
      title="Création de l'espace de votre organisation"
      subtitle="Sans engagement ni moyen de paiement. Le compte créé sera l'administrateur de l'espace."
      footer={
        <>
          Votre organisation dispose déjà d'un espace ?{" "}
          <Link to="/connexion" className="font-semibold text-brand hover:text-brand-dark">Se connecter</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nom de l'organisation">
          <IconInput icon={Building2} required value={form.companyName} onChange={update("companyName")} placeholder="Cabinet, entreprise ou administration" />
        </Field>
        <Field label="Votre nom complet">
            <IconInput icon={User} required autoComplete="name" value={form.fullName} onChange={update("fullName")} placeholder="Prénom Nom" />
          </Field>
          <Field label="Email professionnel">
            <IconInput icon={Mail} type="email" required autoComplete="email" value={form.email} onChange={update("email")} placeholder="vous@organisation.com" />
          </Field>
        <div>
          <label className="label">Mot de passe</label>
          <PasswordInput value={form.password} onChange={update("password")} autoComplete="new-password" minLength={8} placeholder="8 caractères minimum" />
          {f && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= f.n ? f.cls : "bg-ink/10"}`} />
                ))}
              </div>
              <span className={`text-xs font-medium ${f.txt}`}>{f.label}</span>
            </div>
          )}
        </div>

        {error && <p className="alert-error">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
          {loading ? "Création de l'espace…" : "Créer l'espace"}
        </button>
        <p className="text-xs leading-relaxed text-ink/50">
          En créant un compte, vous acceptez notre{" "}
          <Link to="/confidentialite" className="underline hover:text-ink">politique de confidentialité</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
