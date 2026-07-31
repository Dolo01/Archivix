import { useEffect, useMemo, useState } from "react";
import {
  LogOut, CheckCircle2, XCircle, Clock, Building2, Power, Bell, Settings,
  FileStack, ChevronRight, TrendingUp, TrendingDown, LayoutGrid, CreditCard,
} from "lucide-react";
import superAdminApi from "../../api/superAdminClient";
import { useSuperAdmin } from "../../context/SuperAdminContext.jsx";
import Modal from "../../components/Modal.jsx";

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function ActivityLine({ values }) {
  const width = 560;
  const height = 160;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const points = values.map((v, i) => [i * step, height - (v / max) * (height - 20) - 10]);

  const path = points
    .map(([x, y], i) => {
      if (i === 0) return `M ${x},${y}`;
      const [px] = points[i - 1];
      const cx = (px + x) / 2;
      return `C ${cx},${points[i - 1][1]} ${cx},${y} ${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full">
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="0" x2={width} y1={(height / 4) * i + 5} y2={(height / 4) * i + 5} stroke="rgba(30,27,46,0.06)" />
      ))}
      <path d={path} fill="none" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 5 : 3} fill="#F5A623" />
      ))}
    </svg>
  );
}

const STATUS_TABS = [
  { key: "en_attente", label: "En attente" },
  { key: "approuve", label: "Approuvées" },
  { key: "refuse", label: "Refusées" },
];

const NAV = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutGrid },
  { key: "entreprises", label: "Entreprises", icon: Building2 },
  { key: "demandes", label: "Demandes d'abonnement", icon: CreditCard },
];

export default function SuperAdminDashboard() {
  const { admin, logout } = useSuperAdmin();
  const [view, setView] = useState("dashboard");
  const [statusTab, setStatusTab] = useState("en_attente");
  const [allRequests, setAllRequests] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [motif, setMotif] = useState("");

  function fetchRequests() {
    superAdminApi.get("/demandes-abonnement").then(({ data }) => setAllRequests(data));
  }
  function fetchTenants() {
    superAdminApi.get("/entreprises").then(({ data }) => setTenants(data));
  }

  useEffect(() => {
    fetchRequests();
    fetchTenants();
    const interval = setInterval(() => {
      fetchRequests();
      fetchTenants();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(() => ({
    en_attente: allRequests.filter((r) => r.status === "en_attente").length,
    approuve: allRequests.filter((r) => r.status === "approuve").length,
    refuse: allRequests.filter((r) => r.status === "refuse").length,
  }), [allRequests]);

  const filteredRequests = allRequests.filter((r) => r.status === statusTab);
  const totalDocuments = tenants.reduce((sum, t) => sum + t._count.documents, 0);
  const activeTenants = tenants.filter((t) => t.isActive).length;

  const weekActivity = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    allRequests.forEach((r) => { buckets[new Date(r.createdAt).getDay()] += 1; });
    return buckets;
  }, [allRequests]);

  const topTenants = [...tenants].sort((a, b) => b._count.documents - a._count.documents).slice(0, 5);
  const initials = (admin?.fullName || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  async function approve(id) {
    if (!window.confirm("Approuver cette demande d'abonnement ?")) return;
    await superAdminApi.patch(`/demandes-abonnement/${id}/approuver`);
    fetchRequests();
    fetchTenants();
  }

  async function reject(e) {
    e.preventDefault();
    await superAdminApi.patch(`/demandes-abonnement/${rejectTarget.id}/refuser`, { motif });
    setRejectTarget(null);
    setMotif("");
    fetchRequests();
  }

  async function toggleTenant(t) {
    if (!window.confirm(`${t.isActive ? "Désactiver" : "Réactiver"} l'entreprise « ${t.name} » ?`)) return;
    await superAdminApi.patch(`/entreprises/${t.id}/basculer-actif`);
    fetchTenants();
  }

  return (
    <div className="flex min-h-screen bg-paper-dim">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[#F3ECE3] md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ink to-brass text-xs font-semibold text-white">A</div>
          <span className="font-display text-base font-semibold text-ink">Archivix</span>
        </div>

        <div className="flex flex-col items-center px-6 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brass to-ink text-lg font-semibold text-white">
            {initials}
          </div>
          <p className="mt-3 font-display text-sm font-semibold text-ink">{admin?.fullName}</p>
          <p className="text-xs text-ink/50">Super-administrateur</p>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-4">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                view === key ? "bg-white text-ink shadow-card" : "text-ink/55 hover:bg-white/50 hover:text-ink"
              }`}
            >
              <span className="flex items-center gap-2.5"><Icon size={16} /> {label}</span>
              {key === "demandes" && counts.en_attente > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {counts.en_attente}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={logout} className="mx-4 mb-6 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-ink/50 hover:bg-white/50 hover:text-danger">
          <LogOut size={15} /> Déconnexion
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between bg-gradient-to-r from-ink via-brass-dark to-brass px-6 py-5 md:px-10">
          <h1 className="font-display text-xl font-semibold text-white md:text-2xl">
            {NAV.find((n) => n.key === view)?.label}
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
              <Bell size={16} />
              {counts.en_attente > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger" />}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
              <Settings size={16} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {view === "dashboard" && (
            <div>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-wrap gap-8 lg:col-span-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-ink/50">Entreprises actives <TrendingUp size={13} className="text-success" /></p>
                    <p className="mt-1 font-display text-3xl font-bold text-ink">{activeTenants}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-ink/50">Demandes en attente <TrendingDown size={13} className="text-danger" /></p>
                    <p className="mt-1 font-display text-3xl font-bold text-ink">{counts.en_attente}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-ink/50">Documents archivés <TrendingUp size={13} className="text-success" /></p>
                    <p className="mt-1 font-display text-3xl font-bold text-ink">{totalDocuments}</p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-[#F3ECE3] p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink">
                    <Building2 size={16} />
                  </div>
                  <p className="mt-3 font-display text-lg font-bold leading-tight text-ink">
                    Gérez <span className="text-brass-dark">toutes</span> vos entreprises
                  </p>
                  <p className="mt-1 text-xs text-ink/60">Approuvez les abonnements, activez ou suspendez un compte.</p>
                  <button onClick={() => setView("entreprises")} className="mt-3 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                    Voir les entreprises
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="card p-5 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">Activité</h2>
                    <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/50">Demandes cette semaine</span>
                  </div>
                  <ActivityLine values={weekActivity} />
                  <div className="mt-1 flex justify-between text-xs text-ink/40">
                    {JOURS.map((j) => <span key={j}>{j}</span>)}
                  </div>
                </div>

                <div className="card p-5">
                  <h2 className="font-display text-lg font-semibold">Top entreprises</h2>
                  <div className="mt-3 space-y-3">
                    {topTenants.length === 0 && <p className="text-sm text-ink/45">Aucune entreprise pour l'instant.</p>}
                    {topTenants.map((t, i) => (
                      <div key={t.id} className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ background: ["#8B5CF6", "#FF6B4A", "#2FD5D0", "#16A34A", "#2563EB"][i % 5] }}
                        >
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-ink/45">{t._count.documents} documents</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setView("entreprises")} className="mt-3 flex items-center gap-1 text-xs font-medium text-brass-dark">
                    Voir plus <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "demandes" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-ink/55">Approuvez ou refusez les dépôts Wave / Orange Money reçus des entreprises.</p>
                <div className="flex gap-2">
                  {STATUS_TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setStatusTab(t.key)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${statusTab === t.key ? "bg-ink text-white" : "bg-white text-ink/60"}`}
                    >
                      {t.label} {t.key === "en_attente" && counts.en_attente > 0 ? `(${counts.en_attente})` : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {filteredRequests.length === 0 && <p className="text-sm text-ink/50">Aucune demande dans cette catégorie.</p>}
                {filteredRequests.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-card">
                    {r.captureUrl ? (
                      <a href={r.captureUrl} target="_blank" rel="noreferrer">
                        <img src={r.captureUrl} alt="Capture" className="h-14 w-14 rounded-lg object-cover" />
                      </a>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink/5 text-ink/30"><FileStack size={18} /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.tenant?.name}</p>
                      <p className="text-xs text-ink/60 capitalize">{r.plan} — {r.montant.toLocaleString("fr-FR")} FCFA/an</p>
                      <p className="font-mono text-[11px] text-ink/40">réf. {r.reference}</p>
                      {r.status === "refuse" && r.motifRefus && <p className="text-xs text-danger">Motif : {r.motifRefus}</p>}
                    </div>
                    {r.status === "en_attente" ? (
                      <div className="flex shrink-0 gap-1.5">
                        <button onClick={() => approve(r.id)} className="icon-btn-success"><CheckCircle2 size={16} /></button>
                        <button onClick={() => setRejectTarget(r)} className="icon-btn-danger"><XCircle size={16} /></button>
                      </div>
                    ) : (
                      <span className={r.status === "approuve" ? "text-success-dark" : "text-danger"}>
                        {r.status === "approuve" ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "entreprises" && (
            <div className="space-y-3">
              {tenants.map((t) => (
                <div key={t.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass/15 text-brass-dark">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="font-display font-semibold">{t.name}</p>
                      <p className="text-xs text-ink/50">
                        {t._count.users} membres · {t._count.departments} départements · {t._count.documents} documents
                      </p>
                      <p className="text-xs text-ink/45">
                        Offre : <span className="capitalize">{t.plan}</span> · Abonnement : {t.subscriptionExpiresAt ? new Date(t.subscriptionExpiresAt).toLocaleDateString("fr-FR") : "aucun"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toggleTenant(t)} className={t.isActive ? "btn-danger text-sm" : "btn-success text-sm"}>
                    <Power size={15} /> {t.isActive ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              ))}
              {tenants.length === 0 && <p className="text-sm text-ink/50">Aucune entreprise inscrite pour l'instant.</p>}
            </div>
          )}
        </main>
      </div>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title={`Refuser la demande — ${rejectTarget?.tenant?.name || ""}`}>
        <form onSubmit={reject} className="space-y-4">
          <div>
            <label className="label-eyebrow">Motif du refus</label>
            <textarea required className="input mt-1.5" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex : référence introuvable, montant incorrect…" />
          </div>
          <button type="submit" className="btn-danger w-full">Confirmer le refus</button>
        </form>
      </Modal>
    </div>
  );
}
