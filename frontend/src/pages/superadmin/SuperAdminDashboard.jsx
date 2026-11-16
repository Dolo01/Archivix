import { useEffect, useMemo, useState } from "react";
import {
  LogOut, CheckCircle2, XCircle, Clock, Building2, Power, FileStack, ChevronRight,
  LayoutGrid, CreditCard, Menu, X, Image as ImageIcon,
} from "lucide-react";
import superAdminApi from "../../api/superAdminClient";
import { useSuperAdmin } from "../../context/SuperAdminContext.jsx";
import Modal from "../../components/Modal.jsx";
import Logo from "../../components/Logo.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Field from "../../components/ui/Field.jsx";

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
        <line key={i} x1="0" x2={width} y1={(height / 4) * i + 5} y2={(height / 4) * i + 5} stroke="#E4E7EC" />
      ))}
      <path d={path} fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 5 : 3} fill="#1D4ED8" />
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
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const PLAN_LABEL = { essai: "Essai", starter: "Starter", pro: "Pro", business: "Business", entreprise: "Enterprise" };

  function go(key) {
    setView(key);
    setDrawerOpen(false);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo size={30} />
        <span className="badge-neutral">Admin</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => go(key)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
              view === key ? "bg-brand-50 text-brand-dark" : "text-ink/65 hover:bg-ink/[0.04] hover:text-ink"
            }`}
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {key === "demandes" && counts.en_attente > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white">
                {counts.en_attente}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={admin?.fullName} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{admin?.fullName}</p>
            <p className="text-xs text-ink/50">Super-administrateur</p>
          </div>
          <button onClick={logout} title="Se déconnecter" className="icon-btn-danger"><LogOut size={16} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper-dim">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} />
          <aside className="animate-in absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-pop">
            <button onClick={() => setDrawerOpen(false)} className="icon-btn-neutral absolute right-3 top-4" aria-label="Fermer"><X size={18} /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button onClick={() => setDrawerOpen(true)} className="icon-btn-neutral lg:hidden" aria-label="Menu"><Menu size={20} /></button>
          <h1 className="text-lg font-semibold tracking-tight">{NAV.find((n) => n.key === view)?.label}</h1>
          {counts.en_attente > 0 && view !== "demandes" && (
            <button onClick={() => go("demandes")} className="badge-warning ml-auto">
              <Clock size={12} /> {counts.en_attente} demande{counts.en_attente > 1 ? "s" : ""} à traiter
            </button>
          )}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-in mx-auto max-w-7xl">
            {view === "dashboard" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Organisations inscrites" value={tenants.length} icon={Building2} hint={`${activeTenants} active${activeTenants > 1 ? "s" : ""}`} />
                  <StatCard label="Demandes en attente" value={counts.en_attente} icon={Clock} hint="À vérifier" />
                  <StatCard label="Demandes approuvées" value={counts.approuve} icon={CheckCircle2} hint={`${counts.refuse} refusée${counts.refuse > 1 ? "s" : ""}`} />
                  <StatCard label="Documents archivés" value={totalDocuments.toLocaleString("fr-FR")} icon={FileStack} hint="Toutes organisations" />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <section className="card p-5 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <h2 className="card-title">Demandes d'abonnement par jour</h2>
                      <span className="text-xs text-ink/45">Répartition par jour de la semaine</span>
                    </div>
                    <ActivityLine values={weekActivity} />
                    <div className="mt-1 flex justify-between text-xs text-ink/40">
                      {JOURS.map((j) => <span key={j}>{j}</span>)}
                    </div>
                  </section>

                  <section className="card">
                    <div className="card-header">
                      <h2 className="card-title">Organisations les plus actives</h2>
                    </div>
                    {topTenants.length === 0 ? (
                      <EmptyState icon={Building2} title="Aucune organisation" />
                    ) : (
                      <ul className="divide-y divide-line">
                        {topTenants.map((t) => (
                          <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                            <Avatar name={t.name} size={32} square />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{t.name}</p>
                              <p className="text-xs text-ink/50">{t._count.documents} documents</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button onClick={() => go("entreprises")} className="flex w-full items-center justify-center gap-1 border-t border-line py-3 text-sm font-medium text-brand hover:bg-paper-dim/60">
                      Toutes les organisations <ChevronRight size={14} />
                    </button>
                  </section>
                </div>
              </div>
            )}

            {view === "demandes" && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-ink/55">Vérifiez les dépôts Wave / Orange Money avant d'approuver.</p>
                  <div className="inline-flex rounded-lg border border-line bg-white p-1">
                    {STATUS_TABS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setStatusTab(t.key)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${statusTab === t.key ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
                      >
                        {t.label} <span className="ml-1 opacity-60">{counts[t.key]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card overflow-hidden">
                  {filteredRequests.length === 0 ? (
                    <EmptyState icon={CreditCard} title="Aucune demande" text="Aucune demande dans cette catégorie." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Organisation</th>
                            <th>Offre</th>
                            <th className="text-right">Montant</th>
                            <th className="hidden md:table-cell">Paiement</th>
                            <th className="hidden lg:table-cell">Date</th>
                            <th>Reçu</th>
                            <th className="text-right">Décision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((r) => (
                            <tr key={r.id}>
                              <td>
                                <p className="font-medium">{r.tenant?.name}</p>
                                <p className="font-mono text-xs text-ink/45">réf. {r.reference}</p>
                                {r.status === "refuse" && r.motifRefus && <p className="text-xs text-danger">Motif : {r.motifRefus}</p>}
                              </td>
                              <td className="capitalize">{PLAN_LABEL[r.plan] || r.plan}</td>
                              <td className="whitespace-nowrap text-right tabular-nums">{r.montant.toLocaleString("fr-FR")} FCFA</td>
                              <td className="hidden text-ink/65 md:table-cell">
                                {r.moyenPaiement === "wave" ? "Wave" : "Orange Money"}
                                {r.numeroExpediteur && <p className="font-mono text-xs text-ink/45">{r.numeroExpediteur}</p>}
                              </td>
                              <td className="hidden whitespace-nowrap text-ink/60 lg:table-cell">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                              <td>
                                {r.captureUrl ? (
                                  <a href={r.captureUrl} target="_blank" rel="noreferrer" className="block h-10 w-10 overflow-hidden rounded-md border border-line">
                                    <img src={r.captureUrl} alt="Reçu" className="h-full w-full object-cover" />
                                  </a>
                                ) : (
                                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink/25"><ImageIcon size={16} /></span>
                                )}
                              </td>
                              <td>
                                {r.status === "en_attente" ? (
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setRejectTarget(r)} className="btn-danger-soft px-3 py-1.5">Refuser</button>
                                    <button onClick={() => approve(r.id)} className="btn-primary px-3 py-1.5">Approuver</button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end">
                                    <span className={r.status === "approuve" ? "badge-success" : "badge-danger"}>
                                      {r.status === "approuve" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                      {r.status === "approuve" ? "Approuvée" : "Refusée"}
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === "entreprises" && (
              <div className="card overflow-hidden">
                {tenants.length === 0 ? (
                  <EmptyState icon={Building2} title="Aucune organisation inscrite" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Organisation</th>
                          <th className="hidden md:table-cell">Utilisation</th>
                          <th>Offre</th>
                          <th className="hidden lg:table-cell">Échéance</th>
                          <th>Statut</th>
                          <th className="w-0"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <Avatar name={t.name} size={34} square />
                                <p className="font-medium">{t.name}</p>
                              </div>
                            </td>
                            <td className="hidden text-ink/60 md:table-cell">
                              {t._count.users} membres · {t._count.departments} dép. · {t._count.documents} docs
                            </td>
                            <td><span className="badge-neutral">{PLAN_LABEL[t.plan] || t.plan}</span></td>
                            <td className="hidden whitespace-nowrap text-ink/60 lg:table-cell">
                              {t.subscriptionExpiresAt ? new Date(t.subscriptionExpiresAt).toLocaleDateString("fr-FR") : "—"}
                            </td>
                            <td>
                              <span className={t.isActive ? "badge-success" : "badge-danger"}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {t.isActive ? "Active" : "Suspendue"}
                              </span>
                            </td>
                            <td>
                              <button onClick={() => toggleTenant(t)} className={`${t.isActive ? "btn-danger-soft" : "btn-secondary"} px-3 py-1.5`}>
                                <Power size={14} /> {t.isActive ? "Suspendre" : "Réactiver"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Refuser la demande" description={rejectTarget?.tenant?.name}>
        <form onSubmit={reject} className="space-y-4">
          <Field label="Motif du refus" hint="Ce motif sera visible par l'organisation.">
            <textarea required className="input" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex : référence introuvable, montant incorrect…" />
          </Field>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setRejectTarget(null)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-danger">Confirmer le refus</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
