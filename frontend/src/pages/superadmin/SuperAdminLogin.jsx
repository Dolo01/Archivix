import { useState } from "react";
import { useNavigate } from "react-router-dom";
import superAdminApi from "../../api/superAdminClient";
import { useSuperAdmin } from "../../context/SuperAdminContext.jsx";
import { ShieldCheck } from "lucide-react";
import Logo from "../../components/Logo.jsx";
import Field from "../../components/ui/Field.jsx";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useSuperAdmin();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await superAdminApi.post("/connexion", { email, password });
      loginSuccess(data);
      navigate("/superadmin");
    } catch (err) {
      setError(err.response?.data?.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-dim px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="card p-8 shadow-raised">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand" />
            <h1 className="text-lg font-semibold">Administration de la plateforme</h1>
          </div>
          <p className="mt-1 text-sm text-ink/55">Espace réservé à l'exploitant d'Archivix.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Email">
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </Field>
            <Field label="Mot de passe">
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            </Field>
            {error && <p className="alert-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn-dark w-full py-2.5">
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
