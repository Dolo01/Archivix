import { useEffect, useState } from "react";
import { BellRing, BellOff, Smartphone } from "lucide-react";
import { pushStatus, enablePush, disablePush, sendTestPush } from "../api/push";

const HELP = {
  "ios-install":
    "Sur iPhone et iPad : touchez Partager puis « Sur l'écran d'accueil », ouvrez Archivix depuis l'icône, puis activez les notifications ici (iOS 16.4 ou plus récent).",
  unsupported: "Ce navigateur ne permet pas les notifications. Essayez Chrome, Edge, Firefox ou Safari récent.",
  "server-off": "Les notifications sur l'appareil ne sont pas encore activées sur la plateforme.",
  denied:
    "Les notifications sont bloquées pour Archivix dans ce navigateur. Autorisez-les dans les réglages du site (icône à gauche de l'adresse), puis rechargez la page.",
};

// Activation des notifications sur l'appareil courant (téléphone, tablette, ordinateur).
export default function PushToggle() {
  const [status, setStatus] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    pushStatus().then(setStatus).catch(() => setStatus("unsupported"));
  }, []);

  async function run(fn) {
    setBusy(true);
    setMessage("");
    try {
      const next = await fn();
      if (typeof next === "string" && ["on", "off", "denied"].includes(next)) setStatus(next);
      else if (typeof next === "string") setMessage(next);
    } catch (err) {
      setMessage(err.response?.data?.message || "Action impossible pour le moment. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return null;

  return (
    <div className="border-b border-line bg-paper-dim/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${status === "on" ? "bg-success-light text-success-dark" : "bg-white text-ink/50 border border-line"}`}>
          {status === "on" ? <BellRing size={16} /> : status === "ios-install" ? <Smartphone size={16} /> : <BellOff size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{status === "on" ? "Activées sur cet appareil" : "Notifications sur cet appareil"}</p>
          <p className="text-xs text-ink/50">
            {status === "on" ? "Vous serez prévenu même Archivix fermé." : "Recevez les alertes même Archivix fermé."}
          </p>
        </div>
        {status === "off" && (
          <button onClick={() => run(enablePush)} disabled={busy} className="btn-primary shrink-0 px-3 py-1.5 text-xs">
            {busy ? "…" : "Activer"}
          </button>
        )}
        {status === "on" && (
          <button onClick={() => run(disablePush)} disabled={busy} className="btn-secondary shrink-0 px-3 py-1.5 text-xs">
            Désactiver
          </button>
        )}
      </div>
      {HELP[status] && <p className="mt-2 text-xs leading-relaxed text-ink/55">{HELP[status]}</p>}
      {status === "on" && (
        <button onClick={() => run(sendTestPush)} disabled={busy} className="mt-2 text-xs font-medium text-brand hover:underline">
          Envoyer une notification de test
        </button>
      )}
      {message && <p className="mt-2 text-xs text-ink/70">{message}</p>}
    </div>
  );
}
