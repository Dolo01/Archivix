import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

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
    <div className="flex min-h-screen items-center justify-center overflow-y-auto bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ink to-brass text-white font-display text-sm font-semibold">A</div>
          <span className="font-display text-lg font-semibold">Archivix</span>
        </Link>
        <h1 className="mt-6 font-display text-2xl font-semibold">Créer le registre de votre entreprise</h1>
        <p className="mt-1 text-sm text-ink/60">14 jours d'essai, sans engagement.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label-eyebrow">Nom de l'entreprise</label>
            <input required value={form.companyName} onChange={update("companyName")} className="input mt-1.5" placeholder="ISA Conseils" />
          </div>
          <div>
            <label className="label-eyebrow">Votre nom complet</label>
            <input required value={form.fullName} onChange={update("fullName")} className="input mt-1.5" placeholder="Aïssata Traoré" />
          </div>
          <div>
            <label className="label-eyebrow">Email professionnel</label>
            <input type="email" required value={form.email} onChange={update("email")} className="input mt-1.5" placeholder="vous@entreprise.com" />
          </div>
          <div>
            <label className="label-eyebrow">Mot de passe</label>
            <input type="password" required minLength={6} value={form.password} onChange={update("password")} className="input mt-1.5" placeholder="6 caractères minimum" />
          </div>

          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Création…" : "Créer mon registre"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Déjà inscrit ? <Link to="/connexion" className="font-semibold text-brass-dark">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
