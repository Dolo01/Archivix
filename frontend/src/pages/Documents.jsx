import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, UploadCloud, Plus, MessageSquare, Pencil, Trash2, ExternalLink, Share2, Printer,
  FolderPlus, Folder, FolderOpen, FileText, ChevronLeft, ChevronRight, Users,
} from "../components/icons.jsx";
import api from "../api/client";
import { openDocument, printDocument } from "../api/files";
import SealBadge from "../components/SealBadge.jsx";
import Modal from "../components/Modal.jsx";
import DocumentChat from "../components/DocumentChat.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Field from "../components/ui/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STATUTS = [
  { value: "archive", label: "Archivé" },
  { value: "en_revision", label: "En révision" },
  { value: "archive_definitif", label: "Définitif" },
];

const PAGE_SIZE = 20;

function formatSize(kb) {
  if (kb == null) return "—";
  if (kb < 1) return "< 1 Ko";
  return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}

function ShareList({ departments, excludeId, selected, onToggle }) {
  const options = departments.filter((d) => d.id !== excludeId);
  if (options.length === 0) {
    return <p className="text-sm text-ink/50">Créez un autre département pour activer le partage.</p>;
  }
  return (
    <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
      {options.map((d) => (
        <label key={d.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-paper-dim/60">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line accent-brand"
            checked={selected.includes(d.id)}
            onChange={() => onToggle(d.id)}
          />
          <span className="flex-1 font-medium">{d.name}</span>
          <span className="text-xs text-ink/45">{d.membres} membre{d.membres > 1 ? "s" : ""}</span>
        </label>
      ))}
    </div>
  );
}

export default function Documents() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canManage = isAdmin || user?.role === "gestionnaire";
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null); // null = tous les documents
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState(urlQuery);
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
  const [printingId, setPrintingId] = useState(null);

  async function handlePrint(doc) {
    setPrintingId(doc.id);
    try {
      const note = await printDocument(doc);
      if (note) alert(note);
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'imprimer ce document pour le moment.");
    } finally {
      setPrintingId(null);
    }
  }

  function fetchDocuments(q = urlQuery, folderId = activeFolder, status = statusFilter, p = page) {
    setLoading(true);
    const params = { page: p, limit: PAGE_SIZE };
    if (q) params.q = q;
    if (folderId) params.folder = folderId;
    if (status) params.status = status;
    api
      .get("/documents", { params })
      .then(({ data }) => {
        setDocuments(data.documents);
        setTotal(data.total);
        setPages(Math.max(1, data.pages || 1));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function refresh() {
    fetchDocuments(urlQuery, activeFolder, statusFilter, page);
  }

  function fetchFolders() {
    api.get("/folders").then(({ data }) => setFolders(data)).catch(() => {});
  }

  useEffect(() => {
    fetchFolders();
    api.get("/departments").then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  // La recherche vit dans l'URL (?q=…) : la barre du haut et celle de la page restent synchronisées.
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    fetchDocuments(urlQuery, activeFolder, statusFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, activeFolder, statusFilter, page]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    const q = query.trim();
    setSearchParams(q ? { q } : {});
  }

  function selectFolder(id) {
    setPage(1);
    setActiveFolder(id);
  }

  function selectStatus(value) {
    setPage(1);
    setStatusFilter(value);
  }

  function closeModal(setter) {
    setError("");
    setter(null);
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
    if (isAdmin && !form.department) {
      setModalOpen(true);
      return setError("Choisissez le département de destination.");
    }
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
      refresh();
      fetchFolders();
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
    setError("");
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
      refresh();
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
      refresh();
      fetchFolders();
    } catch (err) {
      alert(err.response?.data?.message || "Échec de la suppression.");
    }
  }

  async function toggleDocShare(targetId) {
    const current = shareDoc.sharedWithDepartmentIds || [];
    const next = current.includes(targetId) ? current.filter((id) => id !== targetId) : [...current, targetId];
    try {
      const { data } = await api.patch(`/documents/${shareDoc.id}`, { sharedWithDepartments: next });
      // La réponse contient les partages sous forme brute : on reconstruit la liste des départements.
      const shared = departments.filter((dep) => next.includes(dep.id)).map((dep) => ({ id: dep.id, name: dep.name }));
      setShareDoc({ ...shareDoc, ...data, sharedWithDepartments: shared });
      setDocuments((prev) => prev.map((d) => (d.id === data.id ? { ...d, ...data, sharedWithDepartments: shared } : d)));
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
      refresh();
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

  const currentFolder = folders.find((f) => f.id === activeFolder);
  const totalInFolders = folders.reduce((s, f) => s + (f.documentsCount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Archivez, classez et retrouvez les documents de votre organisation."
        actions={
          canManage && (
            <>
              <button onClick={() => { setError(""); setFolderModalOpen(true); }} className="btn-secondary">
                <FolderPlus size={16} /> Nouveau dossier
              </button>
              <button onClick={() => { setError(""); setModalOpen(true); }} className="btn-primary">
                <Plus size={16} /> Archiver
              </button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Arborescence des dossiers */}
        <aside className="card h-fit p-2">
          <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-ink/40">Dossiers</p>
          <button
            onClick={() => selectFolder(null)}
            className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium ${
              activeFolder === null ? "bg-brand-50 text-brand-dark" : "text-ink/70 hover:bg-ink/[0.04]"
            }`}
          >
            <FileText size={16} /> <span className="flex-1">Tous les documents</span>
          </button>
          {folders.map((f) => {
            const active = activeFolder === f.id;
            const Icon = active ? FolderOpen : Folder;
            return (
              <div
                key={f.id}
                className={`group flex items-center rounded-md ${active ? "bg-brand-50 text-brand-dark" : "text-ink/70 hover:bg-ink/[0.04]"}`}
              >
                <button onClick={() => selectFolder(f.id)} className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm font-medium">
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{f.name}</span>
                  {f.sharedWithDepartmentIds?.length > 0 && <Users size={12} className="shrink-0 opacity-50" />}
                </button>
                <span className="pr-2 text-xs tabular-nums text-ink/40 group-hover:hidden">{f.documentsCount}</span>
                {canManage && (
                  <span className="hidden items-center pr-1 group-hover:flex">
                    <button onClick={() => setShareFolder(f)} title="Partager" className="icon-btn-brand h-7 w-7"><Share2 size={13} /></button>
                    <button onClick={() => { setError(""); setEditFolder(f); }} title="Renommer" className="icon-btn-neutral h-7 w-7"><Pencil size={13} /></button>
                    <button onClick={() => handleDeleteFolder(f)} title="Supprimer" className="icon-btn-danger h-7 w-7"><Trash2 size={13} /></button>
                  </span>
                )}
              </div>
            );
          })}
          {folders.length === 0 && <p className="px-3 py-2 text-xs text-ink/45">Aucun dossier créé.</p>}
          {folders.length > 0 && (
            <p className="border-t border-line px-3 pb-1 pt-2 text-xs text-ink/40">{totalInFolders} document(s) classé(s)</p>
          )}
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Barre d'outils */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Titre, référence, mot-clé… puis Entrée"
                className="input pl-9"
              />
            </form>
            <select value={statusFilter} onChange={(e) => selectStatus(e.target.value)} className="input sm:w-48">
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {urlQuery && (
            <div className="flex items-center gap-2 text-sm text-ink/60">
              Résultats pour <span className="font-medium text-ink">« {urlQuery} »</span>
              <button onClick={() => { setPage(1); setSearchParams({}); }} className="font-medium text-brand hover:underline">
                Effacer
              </button>
            </div>
          )}

          {/* Zone de glisser-déposer */}
          {canManage && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.length) submitFiles(e.dataTransfer.files);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-sm transition-colors ${
                dragOver ? "border-brand bg-brand-50 text-brand-dark" : "border-ink/20 bg-white text-ink/50"
              }`}
            >
              <UploadCloud size={18} />
              {submitting
                ? "Archivage en cours…"
                : `Déposez vos fichiers ici pour les archiver${currentFolder ? ` dans « ${currentFolder.name} »` : ""}`}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="text-sm font-semibold">{currentFolder ? currentFolder.name : "Tous les documents"}</p>
              <p className="text-xs text-ink/50">{total} document{total > 1 ? "s" : ""}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Statut</th>
                    <th className="hidden 2xl:table-cell">Département</th>
                    <th className="hidden 2xl:table-cell">Ajouté le</th>
                    <th className="text-right">Taille</th>
                    <th className="w-0"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {loading &&
                    [0, 1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td colSpan={6}><div className="h-8 animate-pulse rounded bg-ink/[0.04]" /></td>
                      </tr>
                    ))}
                  {!loading &&
                    documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="max-w-[300px]">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-dim text-ink/50">
                              <FileText size={16} />
                            </span>
                            <div className="min-w-0">
                              <Link to={`/app/documents/${doc.id}`} className="block max-w-full truncate text-left font-medium hover:text-brand">
                                {doc.title}
                              </Link>
                              <p className="truncate text-xs text-ink/45">
                                {doc.department?.name && <span className="2xl:hidden">{doc.department.name} · </span>}
                                {doc.reference && <span className="font-mono">{doc.reference} · </span>}
                                {doc.folder ? doc.folder.name : "Hors dossier"}
                                {doc.storageProvider === "google_drive" && " · Google Drive"}
                                {doc.sharedWithDepartments?.length > 0 &&
                                  ` · partagé avec ${doc.sharedWithDepartments.map((d) => d.name).join(", ")}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td><SealBadge status={doc.status} /></td>
                        <td className="hidden whitespace-nowrap text-ink/65 2xl:table-cell">{doc.department?.name || "—"}</td>
                        <td className="hidden whitespace-nowrap text-ink/60 2xl:table-cell">
                          {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="whitespace-nowrap text-right tabular-nums text-ink/60">{formatSize(doc.sizeKb)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => setChatDoc(doc)} title="Discussion" className="icon-btn-info"><MessageSquare size={15} /></button>
                            <button onClick={() => openDocument(doc)} title="Ouvrir" aria-label="Ouvrir" className="icon-btn-neutral">
                              <ExternalLink size={15} />
                            </button>
                            <button onClick={() => handlePrint(doc)} disabled={printingId === doc.id} title="Imprimer" aria-label="Imprimer" className="icon-btn-neutral">
                              <Printer size={15} className={printingId === doc.id ? "animate-pulse" : ""} />
                            </button>
                            {canManage && (
                              <>
                                <button onClick={() => setShareDoc(doc)} title="Partager" className="icon-btn-brand"><Share2 size={15} /></button>
                                <button onClick={() => openEdit(doc)} title="Modifier" className="icon-btn-neutral"><Pencil size={15} /></button>
                                <button onClick={() => handleDelete(doc)} title="Supprimer" className="icon-btn-danger"><Trash2 size={15} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {!loading && documents.length === 0 && (
              <EmptyState
                icon={FileText}
                title={urlQuery || statusFilter ? "Aucun résultat" : "Aucun document ici"}
                text={
                  urlQuery || statusFilter
                    ? "Essayez d'autres mots-clés ou retirez les filtres."
                    : "Archivez un document ou déposez des fichiers dans la zone ci-dessus."
                }
              />
            )}

            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
                <span className="text-ink/55">Page {page} sur {pages}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-3 py-1.5">
                    <ChevronLeft size={15} /> Précédente
                  </button>
                  <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-3 py-1.5">
                    Suivante <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Archivage */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Archiver des documents"
        description="Ajoutez un ou plusieurs fichiers au registre."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Field label="Fichier(s)">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60 hover:border-brand hover:bg-brand-50/40">
              <UploadCloud size={22} className="text-ink/40" />
              <span className="font-medium text-ink">
                {form.file?.length ? `${form.file.length} fichier(s) sélectionné(s)` : "Cliquez pour choisir des fichiers"}
              </span>
              <span className="text-xs">PDF, images, Word, Excel</span>
              <input type="file" multiple className="hidden" onChange={(e) => setForm({ ...form, file: e.target.files })} />
            </label>
          </Field>

          <Field label="Titre" hint="Utilisé si vous n'envoyez qu'un seul fichier ; sinon, le nom de chaque fichier est repris.">
            <input className="input" placeholder="Ex : Contrat de bail — Siège" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {isAdmin && (
              <Field label="Département">
                <select required className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Choisir…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Dossier">
              <select className="input" value={form.folderId} onChange={(e) => setForm({ ...form, folderId: e.target.value })}>
                <option value="">{currentFolder ? currentFolder.name : "Aucun dossier"}</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Référence interne">
              <input className="input" placeholder="Ex : AX-2026-00417" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </Field>
            <Field label="Mots-clés" hint="Séparés par des virgules">
              <input className="input" placeholder="contrat, siège, 2026" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </Field>
          </div>

          {departments.length > 1 && (
            <Field label="Partager aussi avec (optionnel)">
              <div className="flex flex-wrap gap-2">
                {departments.map((d) => {
                  const on = form.sharedWithDepartments.includes(d.id);
                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => toggleShareTarget(d.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        on ? "border-brand bg-brand-50 text-brand-dark" : "border-line text-ink/60 hover:bg-paper-dim"
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {error && <p className="alert-error">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Archivage en cours…" : "Archiver"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modification */}
      <Modal open={!!editDoc} onClose={() => closeModal(setEditDoc)} title="Modifier le document" description={editDoc?.title}>
        <form onSubmit={handleEdit} className="space-y-4">
          <Field label="Titre">
            <input required className="input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Référence interne">
              <input className="input" value={editForm.reference} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} />
            </Field>
            <Field label="Statut">
              <select className="input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                {STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Mots-clés" hint="Séparés par des virgules">
            <input className="input" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />
          </Field>

          {error && <p className="alert-error">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => closeModal(setEditDoc)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Partage individuel du document */}
      <Modal
        open={!!shareDoc}
        onClose={() => setShareDoc(null)}
        title="Partager le document"
        description="Les départements cochés pourront consulter ce document, en plus de son département propriétaire."
      >
        <ShareList
          departments={departments}
          excludeId={shareDoc?.department?.id}
          selected={shareDoc?.sharedWithDepartmentIds || []}
          onToggle={toggleDocShare}
        />
        <p className="mt-3 text-xs text-ink/45">Les modifications sont enregistrées immédiatement.</p>
      </Modal>

      {/* Création de dossier */}
      <Modal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} title="Nouveau dossier">
        <form onSubmit={handleCreateFolder} className="space-y-4">
          {isAdmin && (
            <Field label="Département">
              <select required className="input" value={folderForm.departmentId} onChange={(e) => setFolderForm({ ...folderForm, departmentId: e.target.value })}>
                <option value="">Choisir un département</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Nom du dossier">
            <input required className="input" placeholder="Ex : Contrats 2026" value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} />
          </Field>
          <Field label="Description (optionnel)">
            <input className="input" value={folderForm.description} onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })} />
          </Field>
          {error && <p className="alert-error">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setFolderModalOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Création…" : "Créer le dossier"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Renommer un dossier */}
      <Modal open={!!editFolder} onClose={() => closeModal(setEditFolder)} title="Modifier le dossier">
        <form onSubmit={handleRenameFolder} className="space-y-4">
          <Field label="Nom du dossier">
            <input required className="input" value={editFolder?.name || ""} onChange={(e) => setEditFolder({ ...editFolder, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <input className="input" value={editFolder?.description || ""} onChange={(e) => setEditFolder({ ...editFolder, description: e.target.value })} />
          </Field>
          {error && <p className="alert-error">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => closeModal(setEditFolder)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Partage d'un dossier (jamais du département entier) */}
      <Modal
        open={!!shareFolder}
        onClose={() => setShareFolder(null)}
        title={`Partager « ${shareFolder?.name || ""} »`}
        description="Les départements cochés pourront consulter tous les documents de ce dossier."
      >
        <ShareList
          departments={departments}
          excludeId={shareFolder?.departmentId}
          selected={shareFolder?.sharedWithDepartmentIds || []}
          onToggle={toggleFolderShare}
        />
        <p className="mt-3 text-xs text-ink/45">Les modifications sont enregistrées immédiatement.</p>
      </Modal>

      <Modal open={!!chatDoc} onClose={() => setChatDoc(null)} title="Discussion" description={chatDoc?.title}>
        {chatDoc && <DocumentChat documentId={chatDoc.id} />}
      </Modal>
    </div>
  );
}
