import { useEffect, useState } from "react";
import { UserPlus, Trash2, Pencil, Search, Users } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Field from "../components/ui/Field.jsx";
import Avatar from "../components/ui/Avatar.jsx";

const ROLE_LABEL = { admin: "Administrateur", gestionnaire: "Gestionnaire", lecteur: "Lecteur" };
const ROLE_BADGE = { admin: "badge-brand", gestionnaire: "badge-neutral", lecteur: "badge-neutral" };

function RoleSelect({ value, onChange }) {
  return (
    <select className="input" value={value} onChange={onChange}>
      <option value="lecteur">Lecteur — consultation seule</option>
      <option value="gestionnaire">Gestionnaire — dépôt et classement</option>
      <option value="admin">Administrateur — accès complet</option>
    </select>
  );
}

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
  const [filter, setFilter] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [notice, setNotice] = useState("");

  function fetchUsers() {
    api.get("/users").then(({ data }) => setUsers(data));
  }

  useEffect(() => {
    fetchUsers();
    api.get("/departments").then(({ data }) => setDepartments(data)).catch(() => {});
    api.get("/auth/config").then(({ data }) => setEmailEnabled(Boolean(data.emailEnabled))).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/users", form);
      setNotice(
        data.invitationSent
          ? `Invitation envoyée à ${data.email}. Le lien pour choisir son mot de passe est valable 3 jours.`
          : !form.password
          ? `${data.fullName} a été ajouté, mais l'e-mail n'a pas pu partir. Ouvrez sa fiche (crayon) et cliquez sur « Envoyer un lien de connexion ».`
          : `${data.fullName} a été ajouté. Communiquez-lui son mot de passe temporaire : il devra le changer à sa première connexion.`
      );
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
    setError("");
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

  const [resending, setResending] = useState(false);
  async function resendInvitation() {
    setResending(true);
    setError("");
    try {
      const { data } = await api.post(`/users/${editMember.id}/invitation`);
      setNotice(data.message);
      setEditMember(null);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'envoyer le lien.");
    } finally {
      setResending(false);
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

  const visible = users.filter((u) => {
    const f = filter.trim().toLowerCase();
    return !f || u.fullName.toLowerCase().includes(f) || u.email.toLowerCase().includes(f);
  });
  const activeCount = users.filter((u) => u.isActive).length;

  const deptSelect = (value, onChange) => (
    <select className="input" value={value} onChange={onChange}>
      <option value="">Aucun département</option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>{d.name}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} compte${users.length > 1 ? "s" : ""} · ${activeCount} actif${activeCount > 1 ? "s" : ""}. Gérez les accès et les rôles de votre équipe.`}
        actions={
          <button onClick={() => { setError(""); setModalOpen(true); }} className="btn-primary">
            <UserPlus size={16} /> Inviter un membre
          </button>
        }
      />

      {notice && (
        <div className="alert-success flex items-start justify-between gap-3">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="shrink-0 text-xs font-medium underline">Fermer</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-line p-3">
          <div className="relative max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer par nom ou email" className="input pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Rôle</th>
                <th className="hidden md:table-cell">Département</th>
                <th>Statut</th>
                <th className="w-0"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.fullName} size={34} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {u.fullName}
                          {u.id === currentUser?.id && <span className="ml-1.5 text-xs font-normal text-ink/45">(vous)</span>}
                        </p>
                        <p className="truncate text-xs text-ink/50">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={ROLE_BADGE[u.role] || "badge-neutral"}>{ROLE_LABEL[u.role] || u.role}</span></td>
                  <td className="hidden text-ink/65 md:table-cell">{u.department?.name || "—"}</td>
                  <td>
                    <span className={u.isActive ? "badge-success" : "badge-danger"}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {u.isActive ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => openEdit(u)} title="Modifier" className="icon-btn-neutral"><Pencil size={15} /></button>
                      {u.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(u)} title="Retirer" className="icon-btn-danger"><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <EmptyState icon={Users} title={filter ? "Aucun membre trouvé" : "Aucun membre"} text={filter ? "Vérifiez l'orthographe du nom ou de l'email." : undefined} />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Inviter un membre" description={
          emailEnabled
            ? "Le membre reçoit un e-mail pour choisir lui-même son mot de passe."
            : "Le membre se connectera avec cet email et ce mot de passe temporaire."
        }>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet">
              <input required className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Email professionnel">
              <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field
            label={emailEnabled ? "Mot de passe temporaire (facultatif)" : "Mot de passe temporaire"}
            hint={
              emailEnabled
                ? "Laissez vide pour envoyer une invitation par e-mail. Sinon, 8 caractères minimum : le membre devra le changer à sa première connexion."
                : "8 caractères minimum. Communiquez-le au membre de façon sécurisée : il devra le changer à sa première connexion."
            }
          >
            <input
              type="password"
              required={!emailEnabled}
              minLength={8}
              autoComplete="new-password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rôle">
              <RoleSelect value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </Field>
            <Field label="Département">
              {deptSelect(form.departmentId, (e) => setForm({ ...form, departmentId: e.target.value }))}
            </Field>
          </div>

          {error && <p className="alert-error">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Envoi…" : emailEnabled && !form.password ? "Envoyer l'invitation" : "Ajouter le membre"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editMember} onClose={() => setEditMember(null)} title="Modifier le membre" description={editMember?.email}>
        <form onSubmit={handleEdit} className="space-y-4">
          <Field label="Nom complet">
            <input required className="input" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rôle">
              <RoleSelect value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} />
            </Field>
            <Field label="Département">
              {deptSelect(editForm.departmentId, (e) => setEditForm({ ...editForm, departmentId: e.target.value }))}
            </Field>
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-line px-4 py-3">
            <span>
              <span className="block text-sm font-medium">Compte actif</span>
              <span className="block text-xs text-ink/50">Un compte désactivé ne peut plus se connecter.</span>
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
            />
          </label>

          {emailEnabled && editMember && editMember.id !== currentUser?.id && editForm.isActive && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper-dim/60 px-4 py-3">
              <span className="min-w-0 text-xs text-ink/60">
                Invitation non reçue ou mot de passe perdu ? Envoyez-lui un lien pour choisir un nouveau mot de passe.
              </span>
              <button type="button" onClick={resendInvitation} disabled={resending} className="btn-secondary px-3 py-1.5 text-xs">
                {resending ? "Envoi…" : "Envoyer un lien de connexion"}
              </button>
            </div>
          )}

          {error && <p className="alert-error">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setEditMember(null)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
