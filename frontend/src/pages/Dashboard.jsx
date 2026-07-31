import { useEffect, useMemo, useState } from "react";
import { FileStack, Search, SlidersHorizontal, Building2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

function MiniBars({ values, activeIndex, color }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-4 flex h-16 items-end gap-2">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-full rounded-md transition-all"
          style={{
            height: `${Math.max(8, (v / max) * 100)}%`,
            background: i === activeIndex ? color : "rgba(30,27,46,0.08)",
          }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { tenant, user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/documents", { params: { limit: 6 } })
      .then(({ data }) => {
        setDocuments(data.documents);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get("/departments").then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  const quotaPct = tenant ? Math.min(100, Math.round((tenant.storageUsedMb / tenant.storageQuotaMb) * 100)) : 0;

  const weekBars = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    documents.forEach((d) => {
      const day = new Date(d.createdAt).getDay();
      buckets[day] += 1;
    });
    return buckets;
  }, [documents]);

  const deptBars = useMemo(() => (departments.length ? departments.map((d) => d.membres || 1) : [1, 1, 1]), [departments]);

  const isTrial = tenant?.plan === "essai";
  const trialExpiry = tenant?.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : null;
  const trialDaysLeft = trialExpiry ? Math.ceil((trialExpiry - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div>
      <span className="label-eyebrow">Bienvenue, {user?.fullName?.split(" ")[0]}</span>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
        Registre de {tenant?.name}
      </h1>

      {isTrial && user?.role === "admin" && trialDaysLeft !== null && (
        <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm ${trialDaysLeft <= 3 ? "bg-danger-light text-danger-dark" : "bg-info-light text-info-dark"}`}>
          <span>
            {trialDaysLeft > 0
              ? `Essai gratuit — il vous reste ${trialDaysLeft} jour(s).`
              : "Votre essai gratuit est terminé."}
          </span>
          <Link to="/app/facturation" className="font-semibold underline">Choisir une offre</Link>
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl p-6 text-ink" style={{ background: "linear-gradient(135deg,#D8F5DE,#8FE3A8)" }}>
          <p className="text-xs uppercase tracking-wide text-ink/50">Référence entreprise</p>
          <p className="mt-4 font-mono text-xl font-semibold tracking-widest">{(tenant?.id || "AX-0000-0000").slice(0, 16).toUpperCase()}</p>
          <div className="mt-6 flex items-center justify-between text-sm">
            <div>
              <p className="text-[11px] uppercase text-ink/45">Entreprise</p>
              <p className="font-medium">{tenant?.name}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-ink/45">Abonnement</p>
              <p className="font-medium">
                {tenant?.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt).toLocaleDateString("fr-FR") : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#FF9466,#FF6B4A)" }}>
          <p className="text-sm font-medium text-white/90">Stockage utilisé</p>
          <p className="mt-4 text-3xl font-semibold">{quotaPct}%</p>
          <p className="mt-1 text-sm text-white/80">
            {tenant ? `${tenant.storageUsedMb.toFixed(1)} Mo / ${tenant.storageQuotaMb} Mo` : ""}
          </p>
        </div>

        <div className="rounded-2xl p-6 text-ink" style={{ background: "linear-gradient(135deg,#7BEFEA,#2FD5D0)" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink/70">Documents archivés</p>
            <FileStack size={18} className="text-ink/50" />
          </div>
          <p className="mt-4 text-3xl font-semibold">{total}</p>
          <Link to="/app/documents" className="mt-1 inline-block text-sm font-medium text-ink/70 hover:text-ink">
            Voir le registre →
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-medium text-ink/70">Dépôts par jour</p>
          <p className="mt-1 text-xl font-semibold">{documents.length} <span className="text-sm font-normal text-ink/40">cette semaine</span></p>
          <MiniBars values={weekBars} activeIndex={weekBars.indexOf(Math.max(...weekBars))} color="#FF6B4A" />
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-ink/70">Départements actifs</p>
          <p className="mt-1 text-xl font-semibold">{departments.length}</p>
          <MiniBars values={deptBars} activeIndex={deptBars.indexOf(Math.max(...deptBars))} color="#8B5CF6" />
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-ink/70">Occupation du registre</p>
          <p className="mt-1 text-xl font-semibold">{quotaPct}%</p>
          <MiniBars values={[20, 35, quotaPct, 40, 30, 25]} activeIndex={2} color="#2FD5D0" />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Documents récents</h2>
            <div className="flex items-center gap-1 text-ink/40">
              <button className="rounded-lg p-1.5 hover:bg-ink/5 hover:text-ink"><Search size={16} /></button>
              <button className="rounded-lg p-1.5 hover:bg-ink/5 hover:text-ink"><SlidersHorizontal size={16} /></button>
            </div>
          </div>

          <div className="mt-3 divide-y divide-ink/10">
            {loading && <p className="py-6 text-sm text-ink/50">Chargement…</p>}
            {!loading && documents.length === 0 && (
              <p className="py-6 text-sm text-ink/50">Aucun document archivé pour l'instant.</p>
            )}
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brass/10 text-brass-dark">
                  <FileStack size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-ink/45">{doc.department?.name || "—"}</p>
                </div>
                <span className="text-sm font-medium text-ink/60">{(doc.sizeKb / 1024).toFixed(1)} Mo</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Départements</h2>
            <Link to="/app/departements" className="text-xs font-medium text-brass-dark hover:text-brass">Tout voir</Link>
          </div>

          <div className="mt-3 space-y-3">
            {departments.length === 0 && <p className="text-sm text-ink/50">Aucun département créé.</p>}
            {departments.slice(0, 5).map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: ["#8B5CF6", "#FF6B4A", "#2FD5D0", "#16A34A", "#2563EB"][i % 5] }}
                >
                  <Building2 size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-ink/45">{d.membres} membre(s)</p>
                </div>
                <ChevronRight size={14} className="text-ink/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
