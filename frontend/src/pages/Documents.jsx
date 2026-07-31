import { useEffect, useState } from "react";
import {
  Search, UploadCloud, Plus, MessageCircle, Pencil, Trash2, Printer, Share2,
  FolderPlus, Folder, X,
} from "lucide-react";
import api from "../api/client";
import SealBadge from "../components/SealBadge.jsx";
import Modal from "../components/Modal.jsx";
import DocumentChat from "../components/DocumentChat.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STATUTS = [
  { value: "archive", label: "Archivé" },
  { value: "en_revision", label: "En révision" },
  { value: "archive_definitif", label: "Définitif" },
];

export default function Documents() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canManage = isAdmin || user?.role === "gestionnaire";

  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null); // null = tous les documents
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [chatDoc, setChatDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [shareDoc, setShareDoc] = useState(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [shareFolder, setShareFolder] = useState(null);

  const [form, setForm] = useState({ title: "", reference: "", tags: "", file: null, department: "", folderId: "", sharedWithDepartments: [] });
  const [editForm, setEditForm] = useState({ title: "", reference: "", tags: "", status: "archive" });
  const [folderForm, setFolderForm] = useState({ name: "", description: "", departmentId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function fetchDocuments(q = "", folderId = activeFolder) {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (folderId) params.folder = folderId;
    api
      .get("/documents", { params })
      .then(({ data }) => setDocuments(data.documents))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function fetchFolders() {
    api.get("/folders").then(({ data }) => setFolders(data)).catch(() => {});
  }

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
    api.get("/departments").then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDocuments(query, activeFolder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder]);

  function handleSearch(e) {
    e.preventDefault();
    fetchDocuments(query, activeFolder);
  }

  function toggleShareTarget(id) {
    setForm((f) => ({
      ...f,
      sharedWithDepartments: f.sharedWithDepartments.includes(id)
        ? f.sharedWithDepartments.filter((x) => x !== id)
        : [...f.sharedWithDepartments, id],
    }));
  }

  async function submitFiles(fileList) {
    setError("");
    const files = Array.from(fileList);
    if (!files.length) return;
    if (isAdmin && !form.department) return setError("Choisissez le département de destination.");
    setSubmitting(true);
    try {
      for (const file of files) {
        const payload = new FormData();
        payload.append("file", file);
        payload.append("title", files.length === 1 ? form.title || file.name : file.name);
        payload.append("reference", form.reference);
        payload.append("tags", form.tags);
        if (isAdmin) payload.append("department", form.department);
        if (form.folderId || activeFolder) payload.append("folderId", form.folderId || activeFolder);
        if (form.sharedWithDepartments.length) payload.append("sharedWithDepartments", form.sharedWithDepartments.join(","));
        await api.post("/documents", payload, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setModalOpen(false);
      setForm({ title: "", reference: "", tags: "", file: null, department: "", folderId: "", sharedWithDepartments: [] });
      fetchDocuments(query, activeFolder);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de l'archivage d'un ou plusieurs documents.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!form.file || form.file.length === 0) return setError("Sélectionnez au moins un fichier à archiver.");
    await submitFiles(form.file);
  }

  function openEdit(doc) {
    setEditDoc(doc);
    setEditForm({
      title: doc.title,
      reference: doc.reference || "",
      tags: (doc.tags || []).join(", "),
      status: doc.status,
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.patch(`/documents/${editDoc.id}`, {
        title: editForm.title,
        reference: editForm.reference,
        status: editForm.status,
        tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setEditDoc(null);
      fetchDocuments(query, activeFolder);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la modification du document.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Supprimer définitivement « ${doc.title} » ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      fetchDocuments(query, activeFolder);
    } catch (err) {
      alert(err.response?.data?.message || "Échec de la suppression.");
    }
  }

  function handlePrint(doc) {
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  }

  async function toggleDocShare(targetId) {
    const current = shareDoc.sharedWithDepartmentIds || [];
    const next = current.includes(targetId) ? current.filter((id) => id !== targetId) : [...current, targetId];
    try {
      const { data } = await api.patch(`/documents/${shareDoc.id}`, { sharedWithDepartments: next });
      setShareDoc(data);
      setDocuments((prev) => prev.map((d) => (d.id === data.id ? { ...d, ...data } : d)));
    } catch (err) {
      alert(err.response?.data?.message || "Échec de la mise à jour du partage.");
    }
  }

  async function handleCreateFolder(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/folders", folderForm);
      setFolderModalOpen(false);
      setFolderForm({ name: "", description: "", departmentId: "" });
      fetchFolders();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer ce dossier.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRenameFolder(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.patch(`/folders/${editFolder.id}`, { name: editFolder.name, description: editFolder.description });
      setEditFolder(null);
      fetchFolders();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de modifier ce dossier.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteFolder(folder) {
    if (!window.confirm(`Supprimer le dossier « ${folder.name} » ? Les documents qu'il contient resteront archivés dans le département.`)) return;
    try {
      await api.delete(`/folders/${folder.id}`);
      if (activeFolder === folder.id) setActiveFolder(null);
      fetchFolders();
      fetchDocuments(query, null);
    } catch (err) {
      alert(err.response?.data?.message || "Échec de la suppression du dossier.");
    }
  }

  async function toggleFolderShare(targetId) {
    const current = shareFolder.sharedWithDepartmentIds || [];
    const next = current.includes(targetId) ? current.filter((id) => id !== targetId) : [...current, targetId];
    try {
      const { data } = await api.patch(`/folders/${shareFolder.id}/partage`, { sharedWithDepartments: next });
      setShareFolder(data);
      fetchFolders();
    } catch (err) {
      alert(err.response?.data?.message || "Échec de la mise à jour du partage.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="label-eyebrow">Registre</span>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Documents archivés</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFolderModalOpen(true)} className="btn-outline">
            <FolderPlus size={16} /> Nouveau dossier
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Archiver un document
          </button>
        </div>
      </div>

      {/* Dossiers */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFolder(null)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            activeFolder === null ? "bg-ink text-white" : "bg-white text-ink/60 hover:bg-ink/5"
          }`}
        >
          Tous les documents
        </button>
        {folders.map((f) => (
          <div
            key={f.id}
            className={`group flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeFolder === f.id ? "bg-brass text-white" : "bg-white text-ink/60 hover:bg-ink/5"
            }`}
          >
            <button onClick={() => setActiveFolder(f.id)} className="flex items-center gap-1.5">
              <Folder size={14} /> {f.name} <span className="opacity-60">({f.documentsCount})</span>
            </button>
            {canManage && (
              <span className="ml-1 hidden items-center gap-1 group-hover:flex">
                <button onClick={() => setShareFolder(f)} title="Partager ce dossier"><Share2 size={12} /></button>
                <button onClick={() => setEditFolder(f)} title="Renommer"><Pencil size={12} /></button>
                <button onClick={() => handleDeleteFolder(f)} title="Supprimer"><X size={12} /></button>
              </span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSearch} className="mt-5 flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par titre, référence, mot-clé…"
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-outline">Rechercher</button>
      </form>

      {/* Zone de glisser-déposer */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) submitFiles(e.dataTransfer.files);
        }}
        className={`mt-4 rounded-2xl border-2 border-dashed p-4 text-center text-sm transition-colors ${
          dragOver ? "border-brass bg-brass/5 text-brass-dark" : "border-ink/15 text-ink/40"
        }`}
      >
        Glissez-déposez un ou plusieurs fichiers ici pour les archiver directement{activeFolder ? " dans ce dossier" : ""}.
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] text-left">
              <th className="px-5 py-3 font-medium text-ink/60">Statut</th>
              <th className="px-5 py-3 font-medium text-ink/60">Titre</th>
              <th className="px-5 py-3 font-medium text-ink/60">Département</th>
              <th className="px-5 py-3 font-medium text-ink/60">Référence</th>
              <th className="px-5 py-3 font-medium text-ink/60">Taille</th>
              <th className="px-5 py-3 font-medium text-ink/60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-ink/50">Chargement du registre…</td></tr>
            )}
            {!loading && documents.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-ink/50">Aucun document ne correspond à votre recherche.</td></tr>
            )}
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-ink/[0.02]">
                <td className="px-5 py-3"><SealBadge status={doc.status} /></td>
                <td className="px-5 py-3">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-medium hover:text-brass-dark">
                    {doc.title}
                  </a>
                  <div className="flex flex-wrap gap-1 text-xs text-ink/40">
                    {doc.folder && <span>dossier : {doc.folder.name}</span>}
                    {doc.sharedWithDepartments?.length > 0 && (
                      <span>· partagé avec {doc.sharedWithDepartments.map((d) => d.name).join(", ")}</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-ink/60">{doc.department?.name || "—"}</td>
                <td className="px-5 py-3 font-mono text-xs text-ink/60">{doc.reference || "—"}</td>
                <td className="px-5 py-3 text-ink/60">{(doc.sizeKb / 1024).toFixed(2)} Mo</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setChatDoc(doc)} title="Discuter" className="icon-btn-info">
                      <MessageCircle size={15} />
                    </button>
                    <button onClick={() => handlePrint(doc)} title="Imprimer" className="icon-btn-neutral">
                      <Printer size={15} />
                    </button>
                    {canManage && (
                      <>
                        <button onClick={() => setShareDoc(doc)} title="Partager" className="icon-btn-brass">
                          <Share2 size={15} />
                        </button>
                        <button onClick={() => openEdit(doc)} title="Modifier" className="icon-btn-info">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(doc)} title="Supprimer" className="icon-btn-danger">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Archivage */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Archiver un ou plusieurs documents">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label-eyebrow">Titre (si un seul fichier)</label>
            <input className="input mt-1.5" placeholder="Ex : Contrat de bail — Siège" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          {isAdmin && (
            <div>
              <label className="label-eyebrow">Département de destination</label>
              <select required className="input mt-1.5" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Choisir un département</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label-eyebrow">Dossier (optionnel)</label>
            <select className="input mt-1.5" value={form.folderId} onChange={(e) => setForm({ ...form, folderId: e.target.value })}>
              <option value="">{activeFolder ? folders.find((f) => f.id === activeFolder)?.name : "Aucun dossier"}</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-eyebrow">Partager également avec (optionnel)</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {departments.map((d) => (
                <label key={d.id} className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 text-xs">
                  <input type="checkbox" checked={form.sharedWithDepartments.includes(d.id)} onChange={() => toggleShareTarget(d.id)} />
                  {d.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label-eyebrow">Référence interne</label>
            <input className="input mt-1.5" placeholder="Ex : AX-2026-00417" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Mots-clés (séparés par des virgules)</label>
            <input className="input mt-1.5" placeholder="contrat, siège, 2026" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Fichier(s)</label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-ink/20 px-4 py-6 text-sm text-ink/60 hover:border-brass">
              <UploadCloud size={18} />
              {form.file?.length ? `${form.file.length} fichier(s) sélectionné(s)` : "Choisir un ou plusieurs fichiers (PDF, image, Word, Excel)"}
              <input type="file" multiple className="hidden" onChange={(e) => setForm({ ...form, file: e.target.files })} />
            </label>
          </div>

          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Archivage en cours…" : "Archiver ces documents"}
          </button>
        </form>
      </Modal>

      {/* Modification */}
      <Modal open={!!editDoc} onClose={() => setEditDoc(null)} title={`Modifier — ${editDoc?.title || ""}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="label-eyebrow">Titre</label>
            <input required className="input mt-1.5" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Référence interne</label>
            <input className="input mt-1.5" value={editForm.reference} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Mots-clés (séparés par des virgules)</label>
            <input className="input mt-1.5" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Statut</label>
            <select className="input mt-1.5" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </form>
      </Modal>

      {/* Partage individuel du document */}
      <Modal open={!!shareDoc} onClose={() => setShareDoc(null)} title={`Partager — ${shareDoc?.title || ""}`}>
        <p className="text-sm text-ink/60">
          Choisissez les départements qui auront accès à ce document précis, en plus du département propriétaire.
        </p>
        <div className="mt-4 space-y-2">
          {departments
            .filter((d) => d.id !== shareDoc?.department?.id)
            .map((d) => {
              const checked = (shareDoc?.sharedWithDepartmentIds || []).includes(d.id);
              return (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={checked} onChange={() => toggleDocShare(d.id)} />
                  {d.name}
                </label>
              );
            })}
          {departments.length <= 1 && <p className="text-sm text-ink/40">Créez un autre département pour activer le partage.</p>}
        </div>
      </Modal>

      {/* Création de dossier */}
      <Modal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} title="Créer un dossier">
        <form onSubmit={handleCreateFolder} className="space-y-4">
          {isAdmin && (
            <div>
              <label className="label-eyebrow">Département</label>
              <select required className="input mt-1.5" value={folderForm.departmentId} onChange={(e) => setFolderForm({ ...folderForm, departmentId: e.target.value })}>
                <option value="">Choisir un département</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label-eyebrow">Nom du dossier</label>
            <input required className="input mt-1.5" placeholder="Ex : Contrats 2026" value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Description (optionnel)</label>
            <input className="input mt-1.5" value={folderForm.description} onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })} />
          </div>
          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Création…" : "Créer ce dossier"}
          </button>
        </form>
      </Modal>

      {/* Renommer un dossier */}
      <Modal open={!!editFolder} onClose={() => setEditFolder(null)} title="Modifier le dossier">
        <form onSubmit={handleRenameFolder} className="space-y-4">
          <div>
            <label className="label-eyebrow">Nom du dossier</label>
            <input required className="input mt-1.5" value={editFolder?.name || ""} onChange={(e) => setEditFolder({ ...editFolder, name: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Description</label>
            <input className="input mt-1.5" value={editFolder?.description || ""} onChange={(e) => setEditFolder({ ...editFolder, description: e.target.value })} />
          </div>
          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </Modal>

      {/* Partage d'un dossier (jamais du département entier) */}
      <Modal open={!!shareFolder} onClose={() => setShareFolder(null)} title={`Partager le dossier — ${shareFolder?.name || ""}`}>
        <p className="text-sm text-ink/60">
          Choisissez les départements qui pourront consulter tous les documents de ce dossier.
        </p>
        <div className="mt-4 space-y-2">
          {departments
            .filter((d) => d.id !== shareFolder?.departmentId)
            .map((d) => {
              const checked = (shareFolder?.sharedWithDepartmentIds || []).includes(d.id);
              return (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={checked} onChange={() => toggleFolderShare(d.id)} />
                  {d.name}
                </label>
              );
            })}
        </div>
      </Modal>

      <Modal open={!!chatDoc} onClose={() => setChatDoc(null)} title={`Discussion — ${chatDoc?.title || ""}`}>
        {chatDoc && <DocumentChat documentId={chatDoc.id} />}
      </Modal>
    </div>
  );
}
