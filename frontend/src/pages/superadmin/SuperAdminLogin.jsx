import { useState } from "react";
import { useNavigate } from "react-router-dom";
import superAdminApi from "../../api/superAdminClient";
import { useSuperAdmin } from "../../context/SuperAdminContext.jsx";

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
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ink to-brass text-white font-display text-sm font-semibold">A</div>
          <span className="font-display text-lg font-semibold">Archivix — Super Admin</span>
        </div>
        <p className="mt-4 text-sm text-ink/60">Espace réservé à l'exploitant de la plateforme.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label-eyebrow">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1.5" />
          </div>
          <div>
            <label className="label-eyebrow">Mot de passe</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1.5" />
          </div>
          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
