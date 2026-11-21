import { useEffect, useState } from "react";
import { Plus, Building2, Pencil, Users } from "../components/icons.jsx";
import api from "../api/client";
import DeptBadge from "../components/ui/DeptBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Field from "../components/ui/Field.jsx";

export default function Departments() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function fetchAll() {
    api
      .get("/departments")
      .then(({ data }) => setDepartments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
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
    setError("");
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
    <div className="space-y-6">
      <PageHeader
        title="Départements"
        subtitle="Chaque membre accède aux archives de son département. Le partage se fait dossier par dossier ou document par document, jamais sur un département entier."
        actions={
          isAdmin && (
            <button onClick={() => { setError(""); setCreateOpen(true); }} className="btn-primary">
              <Plus size={16} /> Nouveau département
            </button>
          )
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Building2}
            title="Aucun département"
            text="Créez vos services (Direction, Comptabilité, RH, Juridique…) pour organiser les accès aux archives."
            action={
              isAdmin && (
                <button onClick={() => setCreateOpen(true)} className="btn-primary">
                  <Plus size={16} /> Créer un département
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((d, i) => (
            <div key={d.id} className="card relative flex flex-col overflow-hidden p-5 pt-6 transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-raised">
              <div className={`absolute inset-x-0 top-0 h-1 ${["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"][i % 7]}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <DeptBadge name={d.name} size={42} index={i} />
                  <p className="truncate font-semibold">{d.name}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => openEdit(d)} title="Modifier" className="act-edit">
                    <Pencil size={15} />
                  </button>
                )}
              </div>
              <p className="mt-3 line-clamp-2 flex-1 text-sm text-ink/60">
                {d.description || <span className="text-ink/35">Aucune description</span>}
              </p>
              <div className="mt-4 border-t border-line pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-ink/65">
                  <Users size={13} /> {d.membres} membre{d.membres > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau département">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Nom">
            <input required className="input" placeholder="Ex : Ressources humaines" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description (optionnel)">
            <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          {error && <p className="alert-error">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editDept} onClose={() => setEditDept(null)} title="Modifier le département" description={editDept?.name}>
        <form onSubmit={handleEdit} className="space-y-4">
          <Field label="Nom">
            <input required className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea rows={3} className="input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </Field>
          {error && <p className="alert-error">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setEditDept(null)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
