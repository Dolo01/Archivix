import { useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import Field from "./ui/Field.jsx";
import PasswordInput from "./ui/PasswordInput.jsx";

export default function ChangePasswordForm({ onDone, onCancel, submitLabel = "Changer le mot de passe" }) {
  const { passwordChanged } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirm) return setError("Les deux nouveaux mots de passe ne correspondent pas.");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/mot-de-passe", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      passwordChanged(data);
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de changer le mot de passe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Mot de passe actuel">
        <PasswordInput value={form.currentPassword} onChange={set("currentPassword")} autoComplete="current-password" autoFocus />
      </Field>
      <Field label="Nouveau mot de passe" hint="8 caractères minimum. Vos autres appareils seront déconnectés.">
        <PasswordInput value={form.newPassword} onChange={set("newPassword")} autoComplete="new-password" minLength={8} />
      </Field>
      <Field label="Confirmer le nouveau mot de passe">
        <PasswordInput value={form.confirm} onChange={set("confirm")} autoComplete="new-password" minLength={8} />
      </Field>
      {error && <p className="alert-error">{error}</p>}
      <div className={`flex gap-2 ${onCancel ? "justify-end border-t border-line pt-4" : ""}`}>
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>}
        <button type="submit" disabled={loading} className={`btn-primary ${onCancel ? "" : "w-full py-2.5"}`}>
          {loading ? "Enregistrement…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
