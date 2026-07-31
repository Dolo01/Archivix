import { useEffect, useState } from "react";
import { UserPlus, Trash2, Pencil } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";

const ROLE_LABEL = { admin: "Administrateur", gestionnaire: "Gestionnaire", lecteur: "Lecteur" };

export default function Team() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "lecteur", departmentId: "" });
  const [editForm, setEditForm] = useState({ fullName: "", role: "lecteur", isActive: true, departmentId: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function fetchUsers() {
    api.get("/users").then(({ data }) => setUsers(data));
  }

  useEffect(() => {
    fetchUsers();
    api.get("/departments").then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/users", form);
      setModalOpen(false);
      setForm({ fullName: "", email: "", password: "", role: "lecteur", departmentId: "" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ajouter ce membre.");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(member) {
    setEditMember(member);
    setEditForm({
      fullName: member.fullName,
      role: member.role,
      isActive: member.isActive,
      departmentId: member.department?.id || member.departmentId || "",
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.patch(`/users/${editMember.id}`, editForm);
      setEditMember(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de modifier ce membre.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(member) {
    if (!window.confirm(`Retirer définitivement ${member.fullName} de l'entreprise ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/users/${member.id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Impossible de supprimer ce membre.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="label-eyebrow">Accès</span>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Équipe</h1>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <UserPlus size={16} /> Ajouter un membre
        </button>
      </div>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] text-left">
              <th className="px-5 py-3 font-medium text-ink/60">Nom</th>
              <th className="px-5 py-3 font-medium text-ink/60">Email</th>
              <th className="px-5 py-3 font-medium text-ink/60">Rôle</th>
              <th className="px-5 py-3 font-medium text-ink/60">Département</th>
              <th className="px-5 py-3 font-medium text-ink/60">Statut</th>
              <th className="px-5 py-3 font-medium text-ink/60"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {users.map((u, i) => (
              <tr key={u.id} className="hover:bg-ink/[0.02]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: ["#8B5CF6", "#FF6B4A", "#2FD5D0", "#16A34A", "#2563EB"][i % 5] }}
                    >
                      {u.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <span className="font-medium">{u.fullName}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink/60">{u.email}</td>
                <td className="px-5 py-3 text-ink/60">{ROLE_LABEL[u.role]}</td>
                <td className="px-5 py-3 text-ink/60">{u.department?.name || "—"}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-mono ${u.isActive ? "text-success-dark" : "text-danger"}`}>
                    {u.isActive ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(u)} title="Modifier ce membre" className="icon-btn-info">
                      <Pencil size={15} />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u)} title="Supprimer ce membre" className="icon-btn-danger">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ajouter un membre à l'équipe">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label-eyebrow">Nom complet</label>
            <input required className="input mt-1.5" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Email</label>
            <input type="email" required className="input mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Mot de passe temporaire</label>
            <input type="password" required minLength={6} className="input mt-1.5" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Rôle</label>
            <select className="input mt-1.5" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="lecteur">Lecteur — consultation seule</option>
              <option value="gestionnaire">Gestionnaire — dépôt et classement</option>
              <option value="admin">Administrateur — accès complet</option>
            </select>
          </div>
          <div>
            <label className="label-eyebrow">Département</label>
            <select className="input mt-1.5" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Aucun département</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Ajout en cours…" : "Ajouter ce membre"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editMember} onClose={() => setEditMember(null)} title={`Modifier — ${editMember?.fullName || ""}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="label-eyebrow">Nom complet</label>
            <input required className="input mt-1.5" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Rôle</label>
            <select className="input mt-1.5" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="lecteur">Lecteur — consultation seule</option>
              <option value="gestionnaire">Gestionnaire — dépôt et classement</option>
              <option value="admin">Administrateur — accès complet</option>
            </select>
          </div>
          <div>
            <label className="label-eyebrow">Département</label>
            <select className="input mt-1.5" value={editForm.departmentId} onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}>
              <option value="">Aucun département</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
            Compte actif
          </label>

          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
