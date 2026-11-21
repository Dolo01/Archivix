import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, Share2, Pencil, Trash2, FileText, Image as ImageIcon, FileSpreadsheet,
  History, MessageSquare, Info, Printer,
} from "../components/icons.jsx";
import api from "../api/client";
import { printDocument } from "../api/files";
import { useAuth } from "../context/AuthContext.jsx";
import SealBadge from "../components/SealBadge.jsx";
import Modal from "../components/Modal.jsx";
import Field from "../components/ui/Field.jsx";
import DocumentChat from "../components/DocumentChat.jsx";
import { ACTION_META, describeActivity } from "../utils/activity.js";

const API_ORIGIN = import.meta.env.VITE_API_URL || "";

const STATUTS = [
  { value: "archive", label: "Archivé" },
  { value: "en_revision", label: "En révision" },
  { value: "archive_definitif", label: "Définitif" },
];

function formatSize(kb) {
  if (kb == null) return "—";
  if (kb < 1) return "< 1 Ko";
  return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}

function previewKind(mime = "") {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  return "none";
}

function MetaRow({ label, children }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-2.5 text-sm">
      <dt className="text-ink/50">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-ink">{children}</dd>
    </div>
  );
}

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "gestionnaire";

  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchParams] = useSearchParams();
  // Une notification de message ouvre directement la discussion
  const [tab, setTab] = useState(searchParams.get("onglet") === "discussion" ? "discussion" : "historique");

  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", reference: "", tags: "", status: "archive" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function loadHistory() {
    api.get(`/documents/${id}/historique`).then(({ data }) => setHistory(data)).catch(() => {});
  }

  useEffect(() => {
    setDoc(null);
    setFileUrl(null);
    api
      .get(`/documents/${id}`)
      .then(({ data }) => setDoc(data))
      .catch((err) => setError(err.response?.data?.message || "Document introuvable."));
    // Ouvrir la fiche = consulter le document : le lien temporaire est enregistré dans le journal.
    api
      .get(`/documents/${id}/lien`)
      .then(({ data }) => setFileUrl(data.url.startsWith("/api/") ? `${API_ORIGIN}${data.url}` : data.url))
      .catch((err) => setPreviewError(err.response?.data?.message || "Aperçu indisponible."))
      .finally(loadHistory);
    api.get("/departments").then(({ data }) => setDepartments(data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Le lien temporaire expire au bout de 5 minutes : on en redemande un pour l'ouverture complète.
  async function openFull() {
    const tab = window.open("", "_blank");
    try {
      const { data } = await api.get(`/documents/${id}/lien`);
      const url = data.url.startsWith("/api/") ? `${API_ORIGIN}${data.url}` : data.url;
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else window.location.href = url;
      loadHistory();
    } catch (err) {
      tab?.close();
      alert(err.response?.data?.message || "Impossible d'ouvrir ce document.");
    }
  }

  const [printing, setPrinting] = useState(false);
  async function handlePrint() {
    setPrinting(true);
    try {
      const note = await printDocument(doc);
      if (note) alert(note);
      loadHistory();
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'imprimer ce document pour le moment.");
    } finally {
      setPrinting(false);
    }
  }

  function openEdit() {
    setFormError("");
    setEditForm({ title: doc.title, reference: doc.reference || "", tags: (doc.tags || []).join(", "), status: doc.status });
    setEditOpen(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const { data } = await api.patch(`/documents/${id}`, {
        title: editForm.title,
        reference: editForm.reference,
        status: editForm.status,
        tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      // La réponse ne contient pas les relations (département, dossier, partages) : on garde celles déjà chargées.
      setDoc((d) => ({ ...d, ...data, sharedWithDepartments: d.sharedWithDepartments }));
      setEditOpen(false);
      loadHistory();
    } catch (err) {
      setFormError(err.response?.data?.message || "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleShare(deptId) {
    const previous = doc;
    const current = doc.sharedWithDepartmentIds || [];
    const next = current.includes(deptId) ? current.filter((x) => x !== deptId) : [...current, deptId];
    const shared = departments.filter((dep) => next.includes(dep.id)).map((dep) => ({ id: dep.id, name: dep.name }));
    // Mise à jour immédiate de l'affichage, annulée si le serveur refuse
    setDoc((d) => ({ ...d, sharedWithDepartmentIds: next, sharedWithDepartments: shared }));
    try {
      const { data } = await api.patch(`/documents/${id}`, { sharedWithDepartments: next });
      setDoc((d) => ({ ...d, ...data, sharedWithDepartments: shared }));
      loadHistory();
    } catch (err) {
      setDoc(previous);
      alert(err.response?.data?.message || "Échec de la mise à jour du partage.");
    }
  }

  async function remove() {
    if (!window.confirm(`Supprimer définitivement « ${doc.title} » ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/documents/${id}`);
      navigate("/app/documents");
    } catch (err) {
      alert(err.response?.data?.message || "Échec de la suppression.");
    }
  }

  if (error) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold">{error}</p>
        <Link to="/app/documents" className="btn-secondary mt-4"><ArrowLeft size={16} /> Retour aux documents</Link>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-72 animate-pulse rounded bg-ink/[0.06]" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="card h-[60vh] animate-pulse" />
          <div className="card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  const kind = previewKind(doc.mimeType);
  const KindIcon = kind === "image" ? ImageIcon : doc.mimeType?.includes("sheet") || doc.mimeType?.includes("excel") ? FileSpreadsheet : FileText;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink/45" aria-label="Fil d'Ariane">
            <Link to="/app/documents" className="hover:text-brand">Documents</Link>
            <span>›</span>
            <span>{doc.department?.name || "—"}</span>
            {doc.folder && (<><span>›</span><span>{doc.folder.name}</span></>)}
          </nav>
          <h1 className="page-title mt-1 break-words">{doc.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink/55">
            <SealBadge status={doc.status} />
            {doc.reference && <span className="font-mono text-xs">{doc.reference}</span>}
            <span>· Ajouté le {new Date(doc.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openFull} className="btn-secondary"><ExternalLink size={16} /> Ouvrir</button>
          <button onClick={handlePrint} disabled={printing} className="btn-secondary"><Printer size={16} /> {printing ? "Préparation…" : "Imprimer"}</button>
          {canManage && (
            <>
              <button onClick={() => setShareOpen(true)} className="btn-secondary"><Share2 size={16} /> Partager</button>
              <button onClick={openEdit} className="btn-primary"><Pencil size={16} /> Modifier</button>
              <button onClick={remove} className="act-delete h-10 w-10" title="Supprimer" aria-label="Supprimer"><Trash2 size={17} /></button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Aperçu */}
        <section className="card min-w-0 overflow-hidden" aria-label="Aperçu du document">
          {fileUrl && kind === "pdf" && (
            <iframe src={fileUrl} title={`Aperçu de ${doc.title}`} className="block h-[72vh] min-h-[420px] w-full bg-paper-dim" />
          )}
          {fileUrl && kind === "image" && (
            <div className="flex min-h-[420px] items-center justify-center bg-paper-dim p-4">
              <img src={fileUrl} alt={doc.title} className="max-h-[70vh] rounded-md object-contain shadow-card" />
            </div>
          )}
          {(!fileUrl || kind === "none") && (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 bg-paper-dim/60 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-white text-ink/45"><KindIcon size={26} /></span>
              <p className="font-medium">{doc.fileName}</p>
              <p className="max-w-sm text-sm text-ink/55">
                {previewError || (fileUrl ? "L'aperçu n'est pas disponible pour ce type de fichier." : "Chargement de l'aperçu…")}
              </p>
              {fileUrl && <button onClick={openFull} className="btn-primary"><ExternalLink size={16} /> Ouvrir le fichier</button>}
            </div>
          )}
        </section>

        {/* Colonne d'informations */}
        <div className="min-w-0 space-y-6">
          <section className="card">
            <div className="card-header"><h2 className="card-title flex items-center gap-2"><Info size={16} className="text-ink/45" /> Informations</h2></div>
            <dl className="divide-y divide-line">
              <MetaRow label="Statut"><SealBadge status={doc.status} /></MetaRow>
              <MetaRow label="Référence"><span className="font-mono text-xs">{doc.reference || "—"}</span></MetaRow>
              <MetaRow label="Département">{doc.department?.name || "—"}</MetaRow>
              <MetaRow label="Dossier">{doc.folder?.name || "Hors dossier"}</MetaRow>
              <MetaRow label="Partagé avec">{doc.sharedWithDepartments?.length ? doc.sharedWithDepartments.map((d) => d.name).join(", ") : "Personne"}</MetaRow>
              <MetaRow label="Stockage">{doc.storageProvider === "google_drive" ? "Google Drive" : "Archivix"}</MetaRow>
              <MetaRow label="Fichier">{doc.fileName} · {formatSize(doc.sizeKb)}</MetaRow>
              <MetaRow label="Ajouté par">{doc.uploadedBy?.fullName || "—"}</MetaRow>
              {doc.tags?.length > 0 && (
                <MetaRow label="Mots-clés">
                  <span className="flex flex-wrap gap-1">{doc.tags.map((t) => <span key={t} className="badge-neutral">{t}</span>)}</span>
                </MetaRow>
              )}
            </dl>
          </section>

          <section className="card overflow-hidden">
            <div className="flex border-b border-line" role="tablist">
              {[
                { key: "historique", label: "Historique", icon: History },
                { key: "discussion", label: "Discussion", icon: MessageSquare },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                    tab === key ? "border-brand text-brand-dark" : "border-transparent text-ink/55 hover:text-ink"
                  }`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            {tab === "historique" ? (
              <ol className="max-h-[420px] space-y-4 overflow-y-auto p-4">
                {history.length === 0 && <li className="text-sm text-ink/50">Aucune action enregistrée.</li>}
                {history.map((h) => {
                  const meta = ACTION_META[h.action] || ACTION_META.modification;
                  return (
                    <li key={h.id} className="grid grid-cols-[10px_minmax(0,1fr)] gap-3">
                      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                      <div className="min-w-0 text-sm">
                        <p><b>{h.userName || "Un membre"}</b> {describeActivity(h, { short: true })}</p>
                        {h.details && <p className="text-xs text-ink/55">{h.details}</p>}
                        <p className="text-xs text-ink/40">{new Date(h.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="p-4"><DocumentChat documentId={doc.id} /></div>
            )}
          </section>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le document" description={doc.title}>
        <form onSubmit={saveEdit} className="space-y-4">
          <Field label="Titre">
            <input required className="input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Référence interne">
              <input className="input" value={editForm.reference} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} />
            </Field>
            <Field label="Statut">
              <select className="input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Mots-clés" hint="Séparés par des virgules">
            <input className="input" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />
          </Field>
          {formError && <p className="alert-error">{formError}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Partager le document"
        description="Les départements cochés pourront consulter ce document, en plus de son département propriétaire."
      >
        {departments.filter((d) => d.id !== doc.department?.id).length === 0 ? (
          <p className="text-sm text-ink/50">Créez un autre département pour activer le partage.</p>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {departments
              .filter((d) => d.id !== doc.department?.id)
              .map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-paper-dim/60">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand"
                    checked={(doc.sharedWithDepartmentIds || []).includes(d.id)}
                    onChange={() => toggleShare(d.id)}
                  />
                  <span className="flex-1 font-medium">{d.name}</span>
                  <span className="text-xs text-ink/45">{d.membres} membre{d.membres > 1 ? "s" : ""}</span>
                </label>
              ))}
          </div>
        )}
        <p className="mt-3 text-xs text-ink/45">Les modifications sont enregistrées immédiatement.</p>
      </Modal>
    </div>
  );
}
