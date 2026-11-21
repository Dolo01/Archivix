import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, History, Lock, ChevronLeft, ChevronRight, UploadCloud, Eye, Printer, Pencil, Share2, Trash2 } from "../components/icons.jsx";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { ACTION_META, describeActivity, verbFor } from "../utils/activity.js";

const ACTION_ICON = { archivage: UploadCloud, consultation: Eye, impression: Printer, modification: Pencil, partage: Share2, suppression: Trash2 };

const PERIODES = [
  { value: 7, label: "7 derniers jours" },
  { value: 30, label: "30 derniers jours" },
  { value: 90, label: "3 derniers mois" },
  { value: 0, label: "Tout l'historique" },
];

function dateLabel(d) {
  const date = new Date(d);
  return {
    jour: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    heure: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function Activity() {
  const [filters, setFilters] = useState({ jours: 7, membre: "", action: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [locked, setLocked] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = { jours: filters.jours, page, limit: 50 };
    if (filters.membre) params.membre = filters.membre;
    if (filters.action) params.action = filters.action;
    api
      .get("/activite", { params })
      .then(({ data }) => {
        setData(data);
        setLocked("");
      })
      .catch((err) => {
        if (err.response?.status === 403) setLocked(err.response.data?.message || "Fonction non incluse dans votre offre.");
      })
      .finally(() => setLoading(false));
  }, [filters, page]);

  function setFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const params = { jours: filters.jours };
      if (filters.membre) params.membre = filters.membre;
      if (filters.action) params.action = filters.action;
      const res = await api.get("/activite/export.csv", { params, responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `journal-activite-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      const text = await err.response?.data?.text?.().catch(() => "");
      let message = "Export impossible pour le moment.";
      try {
        message = JSON.parse(text).message || message;
      } catch {
        /* réponse non JSON */
      }
      alert(message);
    } finally {
      setExporting(false);
    }
  }

  if (locked) {
    return (
      <div className="space-y-6">
        <PageHeader title="Journal d'activité" subtitle="Qui a consulté, modifié, partagé ou supprimé quoi, et quand." />
        <div className="card">
          <EmptyState
            icon={Lock}
            title="Disponible à partir de l'offre Professionnel"
            text={`${locked} Le journal garde la trace de chaque consultation, modification, partage et suppression : un atout pour le contrôle interne et les audits.`}
            action={<Link to="/app/facturation" className="btn-primary">Voir les offres</Link>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'activité"
        subtitle="Qui a consulté, modifié, partagé ou supprimé quoi, et quand."
        actions={
          data?.canExport ? (
            <button onClick={exportCsv} disabled={exporting} className="btn-secondary">
              <Download size={16} /> {exporting ? "Export…" : "Exporter (CSV)"}
            </button>
          ) : (
            data && (
              <Link to="/app/facturation" className="btn-secondary" title="Export inclus dans l'offre Business">
                <Lock size={15} /> Exporter (offre Business)
              </Link>
            )
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <select aria-label="Période" className="input sm:w-52" value={filters.jours} onChange={(e) => setFilter("jours", Number(e.target.value))}>
          {PERIODES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select aria-label="Membre" className="input sm:w-56" value={filters.membre} onChange={(e) => setFilter("membre", e.target.value)}>
          <option value="">Tous les membres</option>
          {data?.members?.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
        </select>
        <select aria-label="Action" className="input sm:w-52" value={filters.action} onChange={(e) => setFilter("action", e.target.value)}>
          <option value="">Toutes les actions</option>
          {data?.actions?.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-sm font-semibold">Actions</p>
          <p className="text-xs text-ink/50">{data ? `${data.total} entrée${data.total > 1 ? "s" : ""}` : ""}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th className="hidden md:table-cell">Département</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={4}><div className="h-8 animate-pulse rounded bg-ink/[0.04]" /></td></tr>
                ))}
              {!loading &&
                data?.entries?.map((e) => {
                  const meta = ACTION_META[e.action] || ACTION_META.modification;
                  const d = dateLabel(e.createdAt);
                  return (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap">
                        <p className="text-sm tabular-nums">{d.jour}</p>
                        <p className="font-mono text-xs text-ink/45">{d.heure}</p>
                      </td>
                      <td className="min-w-[260px]">
                        <div className="flex items-start gap-3">
                          {(() => {
                            const Ic = ACTION_ICON[e.action] || Pencil;
                            return (
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tile}`} title={meta.label}>
                                <Ic size={16} />
                              </span>
                            );
                          })()}
                          <div className="min-w-0">
                            <p className="text-sm">
                              <b>{e.userName || "Un membre"}</b>{" "}
                              {e.documentId && e.action !== "suppression" ? (
                                <>
                                  {verbFor(e.action)}{" "}
                                  <Link to={`/app/documents/${e.documentId}`} className="font-medium text-brand hover:underline">« {e.documentTitle} »</Link>
                                </>
                              ) : (
                                describeActivity(e)
                              )}
                            </p>
                            {e.details && <p className="text-xs text-ink/55">{e.details}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap text-ink/65 md:table-cell">{e.departmentName || "—"}</td>
                      <td><span className={meta.badge}>{meta.label}</span></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!loading && data?.entries?.length === 0 && (
          <EmptyState icon={History} title="Aucune action sur cette période" text="Essayez une période plus longue ou retirez les filtres." />
        )}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <span className="text-ink/55">Page {page} sur {data.pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-3 py-1.5"><ChevronLeft size={15} /> Précédente</button>
              <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-3 py-1.5">Suivante <ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
