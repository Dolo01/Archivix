import { useEffect, useState } from "react";
import { Smartphone, CheckCircle2, ShieldAlert, Clock, XCircle, Copy, Mail, Check, Info } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Field from "../components/ui/Field.jsx";
import PlanCards, { BillingToggle } from "../components/PlanCards.jsx";
import { planLabel, dureeLabel } from "../utils/plans.js";

const STATUS_META = {
  en_attente: { label: "En vérification", cls: "badge-warning", icon: Clock },
  approuve: { label: "Approuvée", cls: "badge-success", icon: CheckCircle2 },
  refuse: { label: "Refusée", cls: "badge-danger", icon: XCircle },
};

const PAYMENT_LABEL = { wave: "Wave", orange_money: "Orange Money" };

export default function Billing() {
  const { tenant } = useAuth();
  const [coordonnees, setCoordonnees] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duree, setDuree] = useState(1);
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

  const [copied, setCopied] = useState(false);

  function copyNumber(numero) {
    navigator.clipboard?.writeText(numero);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openPlan(p) {
    setError("");
    setFeedback("");
    setSelectedPlan(p);
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
      payload.append("dureeMois", String(duree));
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
  const numero = coordonnees
    ? form.moyenPaiement === "wave" ? coordonnees.wave : coordonnees.orangeMoney
    : null;

  const statusBox = isExpired
    ? { cls: "border-danger/25 bg-danger-light/50 text-danger-dark", icon: ShieldAlert,
        text: expiry ? `Abonnement expiré le ${expiry.toLocaleDateString("fr-FR")}. Choisissez une offre pour continuer.` : "Aucun abonnement actif." }
    : isTrial
    ? { cls: "border-brand/20 bg-brand-50 text-brand-dark", icon: Info,
        text: `Période d'essai : ${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}, jusqu'au ${expiry.toLocaleDateString("fr-FR")}.` }
    : { cls: "border-success/25 bg-success-light/50 text-success-dark", icon: CheckCircle2,
        text: `Offre ${planLabel(tenant?.plan)} active jusqu'au ${expiry.toLocaleDateString("fr-FR")}.` };
  const montant = selectedPlan ? (duree === 1 ? selectedPlan.prixMensuel : selectedPlan.prixAnnuel) : null;
  const StatusIcon = statusBox.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonnement"
        subtitle="Choisissez l'offre adaptée à votre organisation. Paiement mensuel ou annuel par Wave ou Orange Money."
        actions={<BillingToggle value={duree} onChange={setDuree} />}
      />

      <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${statusBox.cls}`}>
        <StatusIcon size={17} className="shrink-0" /> {statusBox.text}
      </div>

      <PlanCards
        duree={duree}
        currentPlan={tenant?.plan}
        renderAction={(p) =>
          p.surDevis ? (
            <a href={`mailto:${coordonnees?.contactEntreprise || ""}?subject=Offre Institution Archivix`} className="btn-secondary w-full">
              <Mail size={15} /> Nous contacter
            </a>
          ) : (
            <button onClick={() => openPlan(p)} className={`${p.recommande ? "btn-primary" : "btn-secondary"} w-full`}>
              {tenant?.plan === p.id ? "Renouveler" : `Choisir ${p.label}`}
            </button>
          )
        }
      />
      {coordonnees?.contactEntreprise && (
        <p className="text-center text-xs text-ink/50">Offre Institution : écrivez-nous à <span className="font-medium text-ink/70">{coordonnees.contactEntreprise}</span></p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6">
          <h2 className="card-title">Comment s'abonner</h2>
          <ol className="mt-4 space-y-4">
            {[
              "Choisissez une offre et effectuez le dépôt par Wave ou Orange Money au numéro indiqué.",
              "Renseignez le numéro utilisé et la référence de la transaction.",
              "Joignez si possible une capture du reçu.",
              "Votre demande est vérifiée puis votre abonnement est activé.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink/70">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-dark">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">Historique des demandes</h2>
          </div>
          {history.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink/50">Aucune demande envoyée pour l'instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Offre</th>
                    <th className="text-right">Montant</th>
                    <th className="hidden sm:table-cell">Paiement</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const meta = STATUS_META[h.status] || STATUS_META.en_attente;
                    const Icon = meta.icon;
                    return (
                      <tr key={h.id}>
                        <td className="whitespace-nowrap text-ink/65">{new Date(h.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td>
                          <p className="font-medium">{planLabel(h.plan)} <span className="font-normal text-ink/50">· {dureeLabel(h.dureeMois)}</span></p>
                          <p className="font-mono text-xs text-ink/45">réf. {h.reference}</p>
                          {h.status === "refuse" && h.motifRefus && <p className="text-xs text-danger">Motif : {h.motifRefus}</p>}
                        </td>
                        <td className="whitespace-nowrap text-right tabular-nums">{h.montant.toLocaleString("fr-FR")} FCFA</td>
                        <td className="hidden text-ink/65 sm:table-cell">{PAYMENT_LABEL[h.moyenPaiement] || h.moyenPaiement}</td>
                        <td><span className={meta.cls}><Icon size={12} /> {meta.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Modal
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title={`Souscrire à l'offre ${selectedPlan?.label || ""}`}
        description={montant ? `${montant.toLocaleString("fr-FR")} FCFA pour ${dureeLabel(duree)}` : undefined}
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <Field label="Durée">
            <BillingToggle value={duree} onChange={setDuree} />
          </Field>
          <Field label="Moyen de paiement">
            <div className="grid grid-cols-2 gap-2">
              {["wave", "orange_money"].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setForm({ ...form, moyenPaiement: m })}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    form.moyenPaiement === m ? "border-brand bg-brand-50 text-brand-dark ring-1 ring-brand" : "border-line text-ink/65 hover:bg-paper-dim"
                  }`}
                >
                  {PAYMENT_LABEL[m]}
                </button>
              ))}
            </div>
          </Field>

          {numero && (
            <div className="rounded-lg border border-line bg-paper-dim/60 p-4">
              <p className="text-xs font-medium text-ink/50">Numéro de dépôt</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-mono text-lg font-semibold tracking-wide">{numero.numero}</p>
                <button type="button" onClick={() => copyNumber(numero.numero)} className="btn-secondary px-3 py-1.5 text-xs">
                  {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                </button>
              </div>
              <p className="mt-1 text-xs text-ink/55">
                Bénéficiaire : {numero.nomBeneficiaire} · Montant : <b>{montant?.toLocaleString("fr-FR")} FCFA</b>
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Numéro utilisé pour le dépôt">
              <input required className="input" placeholder="+223 XX XX XX XX" value={form.numeroExpediteur} onChange={(e) => setForm({ ...form, numeroExpediteur: e.target.value })} />
            </Field>
            <Field label="Référence de la transaction">
              <input required className="input" placeholder="Ex : WV-2026-889231" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </Field>
          </div>
          <Field label="Capture du reçu (optionnel)">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink/20 px-4 py-5 text-sm text-ink/60 hover:border-brand hover:bg-brand-50/40">
              <Smartphone size={16} />
              {form.capture ? form.capture.name : "Joindre une image (PNG, JPEG)"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setForm({ ...form, capture: e.target.files[0] })} />
            </label>
          </Field>

          {error && <p className="alert-error">{error}</p>}
          {feedback && <p className="alert-success"><CheckCircle2 size={15} /> {feedback}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setSelectedPlan(null)} className="btn-secondary">Fermer</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Envoi…" : "Envoyer la demande"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
