import { useEffect, useState } from "react";
import { Smartphone, CheckCircle2, ShieldAlert, Clock, XCircle, Copy, Mail } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";

const STATUS_META = {
  en_attente: { label: "En attente de vérification", color: "text-warning", icon: Clock },
  approuve: { label: "Approuvé", color: "text-success-dark", icon: CheckCircle2 },
  refuse: { label: "Refusé", color: "text-danger", icon: XCircle },
};

const PLAN_GRADIENTS = {
  starter: "linear-gradient(135deg,#EDE9FE,#C4B5FD)",
  pro: "linear-gradient(135deg,#FFE2D1,#FFB08A)",
  business: "linear-gradient(135deg,#CFFAF9,#7BEFEA)",
  entreprise: "linear-gradient(135deg,#D8F5DE,#8FE3A8)",
};

export default function Billing() {
  const { tenant } = useAuth();
  const [coordonnees, setCoordonnees] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({ moyenPaiement: "wave", numeroExpediteur: "", reference: "", capture: null });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  function fetchHistory() {
    api.get("/abonnement/historique").then(({ data }) => setHistory(data)).catch(() => {});
  }

  useEffect(() => {
    api.get("/abonnement/coordonnees").then(({ data }) => setCoordonnees(data));
    fetchHistory();
  }, []);

  function copyNumber(numero) {
    navigator.clipboard?.writeText(numero);
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    setError("");
    setFeedback("");
    if (!form.numeroExpediteur || !form.reference) {
      return setError("Le numéro utilisé pour le dépôt et la référence de la transaction sont obligatoires.");
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("plan", selectedPlan.id);
      payload.append("moyenPaiement", form.moyenPaiement);
      payload.append("numeroExpediteur", form.numeroExpediteur);
      payload.append("reference", form.reference);
      if (form.capture) payload.append("capture", form.capture);

      const { data } = await api.post("/abonnement", payload, { headers: { "Content-Type": "multipart/form-data" } });
      setFeedback(data.message);
      setForm({ moyenPaiement: "wave", numeroExpediteur: "", reference: "", capture: null });
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Échec de l'envoi de la demande.");
    } finally {
      setSubmitting(false);
    }
  }

  const expiry = tenant?.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : null;
  const isExpired = expiry ? expiry < new Date() : true;
  const isTrial = tenant?.plan === "essai";
  const daysLeft = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div>
      <span className="label-eyebrow">Réservé à l'administrateur</span>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Facturation & abonnement</h1>

      <div className={`mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isExpired ? "bg-danger-light text-danger-dark" : isTrial ? "bg-info-light text-info-dark" : "bg-success-light text-success-dark"}`}>
        {isExpired ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
        {isTrial && !isExpired && `Essai gratuit — il vous reste ${daysLeft} jour(s), jusqu'au ${expiry.toLocaleDateString("fr-FR")}`}
        {!isTrial && expiry && !isExpired && `Offre ${tenant?.plan} active jusqu'au ${expiry.toLocaleDateString("fr-FR")}`}
        {isExpired && `Abonnement expiré le ${expiry?.toLocaleDateString("fr-FR")}. Choisissez une offre ci-dessous pour continuer.`}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-display text-lg font-semibold">Comment s'abonner ou se réabonner</h2>
        <ol className="mt-3 space-y-2 text-sm text-ink/70">
          <li>1. Choisissez une offre ci-dessous (facturation annuelle) et effectuez le dépôt via Wave ou Orange Money au numéro affiché.</li>
          <li>2. Indiquez le numéro que vous avez utilisé pour le dépôt et la référence de la transaction.</li>
          <li>3. Joignez si possible une capture d'écran du reçu.</li>
          <li>4. Votre demande est examinée par l'administrateur de la plateforme, qui l'approuve ou la refuse.</li>
        </ol>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-4">
        {coordonnees?.offres?.map((p) => (
          <div key={p.id} className="rounded-2xl p-6 text-ink" style={{ background: PLAN_GRADIENTS[p.id] }}>
            <h3 className="font-display text-lg font-semibold">{p.label}</h3>
            <p className="mt-1 text-sm text-ink/60">{p.maxUsers ? `${p.maxUsers} utilisateurs` : "Utilisateurs illimités"}</p>
            <p className="mt-3">
              {p.surDevis ? (
                <span className="font-display text-2xl font-semibold">Sur devis</span>
              ) : (
                <>
                  <span className="font-display text-2xl font-semibold">{p.prixAnnuel.toLocaleString("fr-FR")}</span>
                  <span className="text-sm text-ink/50"> FCFA/an</span>
                </>
              )}
            </p>
            {p.surDevis ? (
              <a
                href={`mailto:${coordonnees.contactEntreprise}?subject=Offre Enterprise Archivix`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-ink-light"
              >
                <Mail size={15} /> Nous contacter
              </a>
            ) : (
              <button
                onClick={() => setSelectedPlan(p)}
                disabled={tenant?.plan === p.id}
                className="mt-5 w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-ink-light disabled:bg-ink/20 disabled:text-ink/40"
              >
                {tenant?.plan === p.id ? "Offre actuelle" : `Demander ${p.label}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card mt-8 p-6">
        <h2 className="font-display text-lg font-semibold">Historique des demandes</h2>
        <div className="mt-4 divide-y divide-ink/10">
          {history.length === 0 && <p className="py-4 text-sm text-ink/50">Aucune demande envoyée pour l'instant.</p>}
          {history.map((h) => {
            const meta = STATUS_META[h.status] || STATUS_META.en_attente;
            const Icon = meta.icon;
            return (
              <div key={h.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium capitalize">{h.plan} — {h.montant.toLocaleString("fr-FR")} FCFA/an ({h.moyenPaiement === "wave" ? "Wave" : "Orange Money"})</p>
                  <p className="text-xs text-ink/45">{new Date(h.createdAt).toLocaleDateString("fr-FR")} · réf. {h.reference}</p>
                  {h.status === "refuse" && h.motifRefus && <p className="text-xs text-danger">Motif : {h.motifRefus}</p>}
                </div>
                <span className={`flex items-center gap-1.5 font-mono text-xs ${meta.color}`}>
                  <Icon size={13} /> {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!selectedPlan} onClose={() => setSelectedPlan(null)} title={`Demande d'abonnement — ${selectedPlan?.label}`}>
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="label-eyebrow">Moyen de paiement</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {["wave", "orange_money"].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setForm({ ...form, moyenPaiement: m })}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium ${form.moyenPaiement === m ? "border-brass bg-brass/10 text-brass-dark" : "border-ink/15 text-ink/60"}`}
                >
                  {m === "wave" ? "Wave" : "Orange Money"}
                </button>
              ))}
            </div>
          </div>

          {coordonnees && (
            <div className="rounded-xl bg-ink/[0.04] p-4">
              <p className="text-xs uppercase tracking-wide text-ink/50">Numéro pour le dépôt</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="font-mono text-lg font-semibold">
                  {form.moyenPaiement === "wave" ? coordonnees.wave.numero : coordonnees.orangeMoney.numero}
                </p>
                <button
                  type="button"
                  onClick={() => copyNumber(form.moyenPaiement === "wave" ? coordonnees.wave.numero : coordonnees.orangeMoney.numero)}
                  className="icon-btn-info"
                  title="Copier"
                >
                  <Copy size={15} />
                </button>
              </div>
              <p className="mt-1 text-xs text-ink/50">
                Bénéficiaire : {form.moyenPaiement === "wave" ? coordonnees.wave.nomBeneficiaire : coordonnees.orangeMoney.nomBeneficiaire} · Montant : {selectedPlan?.prixAnnuel?.toLocaleString("fr-FR")} FCFA/an
              </p>
            </div>
          )}

          <div>
            <label className="label-eyebrow">Numéro utilisé pour le dépôt</label>
            <input required className="input mt-1.5" placeholder="+223 75 14 89 49" value={form.numeroExpediteur} onChange={(e) => setForm({ ...form, numeroExpediteur: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Référence de la transaction</label>
            <input required className="input mt-1.5" placeholder="Ex : WV-2026-889231" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>
          <div>
            <label className="label-eyebrow">Capture d'écran du reçu (optionnel)</label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-ink/20 px-4 py-5 text-sm text-ink/60 hover:border-brass">
              <Smartphone size={16} />
              {form.capture ? form.capture.name : "Joindre une capture (PNG, JPEG)"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setForm({ ...form, capture: e.target.files[0] })} />
            </label>
          </div>

          {error && <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger-dark">{error}</p>}
          {feedback && (
            <p className="flex items-center gap-2 rounded-md bg-success-light px-3 py-2 text-sm text-success-dark">
              <CheckCircle2 size={15} /> {feedback}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-success w-full">
            {submitting ? "Envoi en cours…" : "Envoyer ma demande"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
