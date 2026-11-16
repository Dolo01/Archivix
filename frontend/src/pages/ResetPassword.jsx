import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import api from "../api/client";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";

// Sert à la fois au lien « mot de passe oublié » et au lien d'invitation reçu par e-mail
export default function ResetPassword() {
  const [params] = useSearchParams();
  const jeton = params.get("jeton") || "";
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [invalid, setInvalid] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!jeton) return setInvalid("Lien incomplet. Ouvrez le lien reçu par e-mail.");
    api
      .get("/auth/jeton", { params: { jeton } })
      .then(({ data }) => setInfo(data))
      .catch((err) => setInvalid(err.response?.data?.message || "Ce lien n'est plus valable."));
  }, [jeton]);

  const isInvitation = info?.purpose === "invitation";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    setLoading(true);
    try {
      await api.post("/auth/reinitialiser", { jeton, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer le mot de passe.");
    } finally {
      setLoading(false);
    }
  }

  const title = done
    ? "C'est fait !"
    : isInvitation
    ? `Bienvenue, ${info.fullName.split(" ")[0]}`
    : "Nouveau mot de passe";
  const subtitle = done
    ? "Votre mot de passe est enregistré."
    : isInvitation
    ? `Choisissez votre mot de passe pour rejoindre ${info.orgName} sur Archivix.`
    : info
    ? `Choisissez un nouveau mot de passe pour ${info.email}.`
    : "";

  return (
    <AuthLayout
      title={invalid ? "Lien expiré" : title}
      subtitle={invalid ? undefined : subtitle}
      footer={<Link to="/connexion" className="font-semibold text-brand hover:text-brand-dark">← Retour à la connexion</Link>}
    >
      {invalid ? (
        <div className="space-y-4">
          <p className="alert-error">{invalid}</p>
          <p className="text-sm text-ink/60">
            Demandez un nouveau lien ci-dessous. S'il s'agissait d'une invitation, demandez à votre administrateur de vous réinviter.
          </p>
          <Link to="/mot-de-passe-oublie" className="btn-primary w-full py-2.5">Recevoir un nouveau lien</Link>
        </div>
      ) : done ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success-light/50 p-4 text-sm text-success-dark">
            <CheckCircle2 size={20} className="shrink-0" />
            Vous pouvez maintenant vous connecter avec {info?.email}.
          </div>
          <button onClick={() => navigate("/connexion")} className="btn-primary w-full py-2.5">Se connecter</button>
        </div>
      ) : !info ? (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand/20 border-t-brand" aria-label="Chargement" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={isInvitation ? "Mot de passe" : "Nouveau mot de passe"} hint="8 caractères minimum.">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} autoFocus />
          </Field>
          <Field label="Confirmer le mot de passe">
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={8} />
          </Field>
          {error && <p className="alert-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Enregistrement…" : isInvitation ? "Activer mon compte" : "Enregistrer le mot de passe"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
