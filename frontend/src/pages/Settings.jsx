import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ExternalLink, Unplug, ShieldCheck, FolderOpen, Info } from "../components/icons.jsx";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";

const ERREURS = {
  refus: "Vous avez annulé l'autorisation sur Google. Aucune modification n'a été faite.",
  lien_expire: "Le lien de connexion a expiré. Recommencez depuis cette page.",
  acces_refuse: "Seul un administrateur actif peut connecter Google Drive.",
  jeton_absent: "Google n'a pas renvoyé d'autorisation permanente. Réessayez la connexion.",
  google: "Google n'a pas pu finaliser la connexion. Réessayez dans quelques instants.",
};

function DriveLogo({ size = 28 }) {
  // Pictogramme générique de stockage en ligne (pas de logo de marque)
  return (
    <span className="flex shrink-0 items-center justify-center rounded-lg border border-line bg-white shadow-card" style={{ width: size + 16, height: size + 16 }}>
      <FolderOpen size={size * 0.75} className="text-brand" />
    </span>
  );
}

export default function Settings() {
  const { tenant, refreshTenant } = useAuth();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function load() {
    api.get("/integrations/google-drive").then(({ data }) => setStatus(data)).catch(() => setStatus({ configured: false }));
  }

  // Retour depuis Google : ?drive=connecte ou ?drive=erreur&raison=…
  useEffect(() => {
    const result = params.get("drive");
    if (result === "connecte") {
      setNotice("Google Drive est connecté. Les prochains documents archivés y seront enregistrés.");
      refreshTenant().catch(() => {});
    } else if (result === "erreur") {
      setError(ERREURS[params.get("raison")] || "La connexion à Google Drive a échoué.");
    }
    if (result) setParams({}, { replace: true });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect() {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/integrations/google-drive/connect");
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de démarrer la connexion.");
      setBusy(false);
    }
  }

  async function disconnect() {
    const extra = status?.driveDocuments
      ? `\n\nAttention : ${status.driveDocuments} document(s) sont stockés dans ce Drive. Ils y resteront, mais ne pourront plus être ouverts depuis Archivix tant que vous n'aurez pas reconnecté le même compte Google.`
      : "";
    if (!window.confirm(`Déconnecter Google Drive ?${extra}`)) return;
    setBusy(true);
    setError("");
    try {
      await api.delete("/integrations/google-drive");
      setNotice("Google Drive a été déconnecté. Les nouveaux documents sont stockés par Archivix.");
      await refreshTenant();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la déconnexion.");
    } finally {
      setBusy(false);
    }
  }

  const connected = status?.connected;

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" subtitle={`Configuration de l'espace ${tenant?.name || ""}.`} />

      {notice && <p className="alert-success"><CheckCircle2 size={16} /> {notice}</p>}
      {error && <p className="alert-error flex items-center gap-2"><AlertTriangle size={16} /> {error}</p>}

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Stockage des documents</h2>
            <p className="mt-0.5 text-sm text-ink/55">Choisissez où sont enregistrés les fichiers archivés par votre organisation.</p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-5 rounded-xl border border-line p-5 sm:flex-row sm:items-start">
            <DriveLogo />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">Google Drive de votre organisation</h3>
                {status && (connected ? (
                  <span className="badge-success"><span className="h-1.5 w-1.5 rounded-full bg-current" /> Connecté</span>
                ) : (
                  <span className="badge-neutral">Non connecté</span>
                ))}
              </div>
              <p className="mt-1 text-sm text-ink/60">
                Les documents sont enregistrés directement dans votre propre Google Drive, dans un dossier
                « Archivix — {tenant?.name} » organisé par département. Vos fichiers restent votre propriété.
              </p>

              {connected && (
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-paper-dim/70 px-3 py-2">
                    <dt className="text-xs text-ink/50">Compte Google</dt>
                    <dd className="truncate font-medium">{status.email || "—"}</dd>
                  </div>
                  <div className="rounded-lg bg-paper-dim/70 px-3 py-2">
                    <dt className="text-xs text-ink/50">Connecté le</dt>
                    <dd className="font-medium">{status.connectedAt ? new Date(status.connectedAt).toLocaleDateString("fr-FR") : "—"}</dd>
                  </div>
                </dl>
              )}

              <ul className="mt-4 space-y-1.5 text-sm text-ink/60">
                <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand" /> Archivix accède uniquement aux fichiers qu'il a lui-même créés, jamais au reste de votre Drive.</li>
                <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand" /> Les droits d'accès d'Archivix (départements, rôles, partages) continuent de s'appliquer.</li>
                <li className="flex gap-2"><Info size={16} className="mt-0.5 shrink-0 text-ink/40" /> L'espace utilisé est celui de votre Drive ; le quota Archivix ne s'applique plus.</li>
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-ink/50">
                L'utilisation et le transfert par Archivix des informations reçues des API Google respectent les{" "}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="underline hover:text-ink">
                  règles relatives aux données utilisateur des services d'API Google
                </a>
                , y compris les exigences d'utilisation limitée. Détails dans notre{" "}
                <Link to="/confidentialite#google" className="underline hover:text-ink">politique de confidentialité</Link>.
              </p>

              {!connected && status?.configured && (
                <p className="mt-4 rounded-lg border border-warning/25 bg-warning-light/50 px-3.5 py-2.5 text-sm text-warning-dark">
                  Conseil : connectez un compte Google de l'organisation (Google Workspace) plutôt qu'un compte personnel,
                  pour que l'accès ne dépende pas d'une seule personne.
                </p>
              )}
              {status && !status.configured && (
                <div className="mt-4 rounded-lg border border-line bg-paper-dim/70 px-3.5 py-2.5 text-sm text-ink/60">
                  <p>Cette option n'est pas encore activée sur la plateforme. Contactez le support Archivix.</p>
                  {status.missingSettings?.length > 0 && (
                    <p className="mt-1.5 text-xs text-ink/45">
                      Réglage(s) serveur manquant(s) : <span className="font-mono">{status.missingSettings.join(", ")}</span>
                    </p>
                  )}
                </div>
              )}
              {!connected && status?.driveDocuments > 0 && (
                <p className="mt-4 rounded-lg border border-warning/25 bg-warning-light/50 px-3.5 py-2.5 text-sm text-warning-dark">
                  {status.driveDocuments} document(s) sont enregistrés dans un Google Drive précédemment connecté.
                  Reconnectez le même compte pour pouvoir les ouvrir à nouveau.
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-2 sm:flex-col">
              {connected ? (
                <>
                  <button onClick={connect} disabled={busy} className="btn-secondary">
                    <ExternalLink size={15} /> Changer de compte
                  </button>
                  <button onClick={disconnect} disabled={busy} className="btn-danger-soft">
                    <Unplug size={15} /> Déconnecter
                  </button>
                </>
              ) : (
                <button onClick={connect} disabled={busy || !status?.configured} className="btn-primary">
                  {busy ? "Redirection…" : "Connecter Google Drive"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
