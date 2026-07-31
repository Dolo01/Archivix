import { useEffect, useState } from "react";
import { Plus, Building2, Pencil } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";

const COLORS = ["#8B5CF6", "#FF6B4A", "#2FD5D0", "#16A34A", "#2563EB"];

export default function Departments() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [departments, setDepartments] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function fetchAll() {
    api.get("/departments").then(({ data }) => setDepartments(data));
  }

  useEffect(fetchAll, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/departments", form);
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer ce département.");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(d) {
    setEditDept(d);
    setEditForm({ name: d.name, description: d.description || "" });
  }

  async function handleEdit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.patch(`/departments/${editDept.id}`, editForm);
      setEditDept(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de modifier ce département.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="label-eyebrow">Organisation</span>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Départements</h1>
          <p className="mt-1 text-sm text-ink/50">
            Un membre accède aux archives de son département. Le partage se fait dossier par dossier ou document par document, jamais sur tout un département.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus size={16} /> Ajouter un département
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((d, i) => (
          <div key={d.id} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{ background: COLORS[i % COLORS.length] }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="font-display text-base font-semibold">{d.name}</p>
                  <p className="text-xs text-ink/50">{d.membres} membre(s)</p>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => openEdit(d)} title="Modifier" className="icon-btn-info">
                  <Pencil size={14} />
                </button>
              )}
            </div>
            {d.description && <p className="mt-3 text-sm text-ink/60">{d.description}</p>}
          </div>
        ))}
        {departments.length === 0 && (
          <p className="text-sm text-ink/50">Aucun département créé pour l'instant.</p>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un département">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label-eyebrow">Nom du département</label>
            <input required className="input mt-1.5" placeholder="Ex : Ressources Humaines" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Description (optionnel)</label>
            <input className="input mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Création…" : "Créer ce département"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editDept} onClose={() => setEditDept(null)} title={`Modifier — ${editDept?.name || ""}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="label-eyebrow">Nom du département</label>
            <input required className="input mt-1.5" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Description</label>
            <input className="input mt-1.5" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
