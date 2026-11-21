import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "../components/icons.jsx";
import api from "../api/client";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/mot-de-passe-oublie", { email });
      setSent(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Envoi impossible pour le moment. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Recevez par e-mail un lien pour choisir un nouveau mot de passe."
      footer={<Link to="/connexion" className="font-semibold text-brand hover:text-brand-dark">← Retour à la connexion</Link>}
    >
      {sent ? (
        <div className="rounded-xl border border-success/25 bg-success-light/50 p-5 text-sm text-success-dark">
          <MailCheck size={22} className="mb-2" />
          <p className="font-medium">Vérifiez votre boîte de réception.</p>
          <p className="mt-1 text-success-dark/80">{sent}</p>
          <p className="mt-3 text-success-dark/70">Le lien est valable 1 heure. Pensez à regarder dans les courriers indésirables.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email professionnel">
            <input type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="vous@organisation.com" />
          </Field>
          {error && <p className="alert-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
          <p className="text-center text-xs text-ink/45">
            Pas d'e-mail reçu ? Votre administrateur peut aussi vous attribuer un mot de passe temporaire depuis « Utilisateurs ».
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
