import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileStack,
  HardDrive,
  Building2,
  CalendarClock,
  ArrowRight,
  Plus,
  FileText,
  AlertTriangle,
  Info,
} from "../components/icons.jsx";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import SealBadge from "../components/SealBadge.jsx";
import { planLabel } from "../utils/plans.js";
import Onboarding from "../components/Onboarding.jsx";

function formatSize(kb) {
  if (kb == null) return "—";
  if (kb < 1) return "< 1 Ko";
  return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}

function greeting() {
  const h = new Date().getHours();
  return h < 18 ? "Bonjour" : "Bonsoir";
}

export default function Dashboard() {
  const { tenant, user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersCount, setUsersCount] = useState(null);
  const [driveConfigured, setDriveConfigured] = useState(false);
  const dismissKey = `archivix_mise_en_route_masquee_${tenant?.id}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (user?.role !== "admin") return;
    api.get("/users").then(({ data }) => setUsersCount(data.length)).catch(() => {});
    api.get("/integrations/google-drive").then(({ data }) => setDriveConfigured(Boolean(data.configured))).catch(() => {});
  }, [user?.role]);

  function dismissOnboarding() {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      /* stockage indisponible : le guide réapparaîtra au prochain chargement */
    }
  }

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

  const quotaPct = tenant?.storageQuotaMb
    ? Math.min(100, Math.round((tenant.storageUsedMb / tenant.storageQuotaMb) * 100))
    : 0;

  const expiry = tenant?.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : null;
  const daysLeft = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isTrial = tenant?.plan === "essai";
  const onDrive = tenant?.storageProvider === "google_drive";
  const canManage = user?.role === "admin" || user?.role === "gestionnaire";
  const totalMembers = departments.reduce((s, d) => s + (d.membres || 0), 0);

  const steps = [
    { key: "espace", title: "Créer l'espace de l'organisation", done: true },
    { key: "depts", title: "Créer les départements", text: "Direction, Comptabilité, RH, Juridique…", done: departments.length > 0, to: "/app/departements", cta: "Créer" },
    { key: "equipe", title: "Inviter votre équipe", text: "Chacun avec son rôle : gestionnaire ou lecteur", done: (usersCount || 0) > 1, to: "/app/equipe", cta: "Inviter" },
    { key: "doc", title: "Archiver un premier document", text: "Glissez-déposez un fichier dans la page Documents", done: total > 0, to: "/app/documents", cta: "Archiver" },
  ];
  if (driveConfigured) {
    steps.push({ key: "drive", title: "Connecter le Google Drive de l'organisation", text: "Vos fichiers restent chez vous", done: onDrive, to: "/app/parametres", cta: "Connecter", optional: true });
  }
  const allDone = steps.every((s) => s.done);
  const showOnboarding = user?.role === "admin" && !loading && usersCount !== null && !dismissed && !allDone;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${user?.fullName?.split(" ")[0] || ""}`}
        subtitle={`Vue d'ensemble des archives de ${tenant?.name || "votre organisation"}.`}
        actions={
          canManage && (
            <Link to="/app/documents" className="btn-primary">
              <Plus size={16} /> Archiver un document
            </Link>
          )
        }
      />

      {showOnboarding && (
        <Onboarding
          firstName={user?.fullName?.split(" ")[0] || ""}
          orgName={tenant?.name}
          steps={steps}
          trial={isTrial && daysLeft !== null ? { daysLeft, until: expiry.toLocaleDateString("fr-FR") } : null}
          onDismiss={dismissOnboarding}
        />
      )}

      {!showOnboarding && isTrial && user?.role === "admin" && daysLeft !== null && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            daysLeft <= 3 ? "border-danger/25 bg-danger-light/50 text-danger-dark" : "border-brand/20 bg-brand-50 text-brand-dark"
          }`}
        >
          <span className="flex items-center gap-2">
            {daysLeft <= 3 ? <AlertTriangle size={16} /> : <Info size={16} />}
            {daysLeft > 0
              ? `Période d'essai : ${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}.`
              : "Votre période d'essai est terminée."}
          </span>
          <Link to="/app/facturation" className="inline-flex items-center gap-1 font-semibold hover:underline">
            Choisir une offre <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Documents archivés" value={total.toLocaleString("fr-FR")} icon={FileStack} hint="Accessibles selon vos droits" />
        {onDrive ? (
          <StatCard label="Stockage" value="Google Drive" icon={HardDrive} hint={tenant?.googleDriveEmail || "Drive de votre organisation"} />
        ) : (
          <StatCard
            label="Stockage utilisé"
            value={`${quotaPct} %`}
            icon={HardDrive}
            hint={tenant ? `${tenant.storageUsedMb.toFixed(1)} Mo sur ${tenant.storageQuotaMb} Mo` : ""}
          >
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
              <div
                className={`h-full rounded-full ${quotaPct >= 90 ? "bg-danger" : quotaPct >= 75 ? "bg-warning" : "bg-brand"}`}
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </StatCard>
        )}
        <StatCard
          label="Départements"
          value={departments.length}
          icon={Building2}
          hint={`${totalMembers} membre${totalMembers > 1 ? "s" : ""} rattaché${totalMembers > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Abonnement"
          value={planLabel(tenant?.plan)}
          icon={CalendarClock}
          hint={expiry ? `${daysLeft > 0 ? "Valable jusqu'au" : "Expiré le"} ${expiry.toLocaleDateString("fr-FR")}` : "Aucun abonnement actif"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <section className="card min-w-0 lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">Documents récents</h2>
            <Link to="/app/documents" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark">
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-ink/[0.04]" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucun document pour l'instant"
              text="Les documents que vous archivez apparaîtront ici."
              action={
                canManage && (
                  <Link to="/app/documents" className="btn-secondary">
                    <Plus size={16} /> Archiver un premier document
                  </Link>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-dim text-ink/50">
                    <FileText size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/app/documents/${doc.id}`} className="block max-w-full truncate text-left text-sm font-medium hover:text-brand">
                      {doc.title}
                    </Link>
                    <p className="truncate text-xs text-ink/50">
                      {doc.department?.name || "—"}
                      {doc.reference ? ` · ${doc.reference}` : ""}
                      {" · "}
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="hidden sm:block">
                    <SealBadge status={doc.status} />
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-ink/50">{formatSize(doc.sizeKb)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Départements</h2>
            <Link to="/app/departements" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark">
              Gérer <ArrowRight size={14} />
            </Link>
          </div>
          {departments.length === 0 ? (
            <EmptyState icon={Building2} title="Aucun département" text="Structurez vos archives par service." />
          ) : (
            <ul className="divide-y divide-line">
              {departments.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                    <Building2 size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-ink/50">
                      {d.membres} membre{d.membres > 1 ? "s" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
