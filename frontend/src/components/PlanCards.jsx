import { Check, Minus } from "lucide-react";
import { OFFRES } from "../utils/plans.js";

// Sélecteur mensuel / annuel
export function BillingToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-white p-1" role="group" aria-label="Période de paiement">
      {[
        { v: 1, label: "Mensuel" },
        { v: 12, label: "Annuel · 2 mois offerts" },
      ].map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === o.v ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Grille des quatre offres. `renderAction(offre)` fournit le bouton de chaque carte.
export default function PlanCards({ duree, renderAction, currentPlan }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {OFFRES.map((p) => {
        const prix = duree === 1 ? p.prixMensuel : p.prixAnnuel;
        const current = currentPlan === p.id;
        return (
          <div key={p.id} className={`card relative flex flex-col p-6 ${p.recommande ? "border-brand ring-1 ring-brand" : ""}`}>
            {p.recommande && (
              <span className="absolute -top-2.5 left-6 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">
                Recommandé
              </span>
            )}
            {current && <span className="badge-success absolute right-4 top-4">Offre actuelle</span>}
            <h3 className="text-base font-semibold">{p.label}</h3>
            <p className="mt-0.5 text-sm text-ink/55">{p.description}</p>
            <div className="mt-5 min-h-[56px]">
              {p.surDevis ? (
                <>
                  <p className="text-2xl font-semibold tracking-tight">Sur devis</p>
                  <p className="mt-0.5 text-xs text-ink/50">Contrat annuel</p>
                </>
              ) : (
                <>
                  <p>
                    <span className="text-3xl font-semibold tracking-tight tabular-nums">{prix.toLocaleString("fr-FR")}</span>
                    <span className="text-sm text-ink/50"> FCFA / {duree === 1 ? "mois" : "an"}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {duree === 1 ? `ou ${p.prixAnnuel.toLocaleString("fr-FR")} FCFA / an` : "soit 2 mois offerts"}
                  </p>
                </>
              )}
            </div>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-ink/70">
              {p.points.map((f) => (
                <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand" /> {f}</li>
              ))}
              {(p.absent || []).map((f) => (
                <li key={f} className="flex gap-2 text-ink/40"><Minus size={16} className="mt-0.5 shrink-0" /> {f}</li>
              ))}
            </ul>
            <div className="mt-6">{renderAction(p, current)}</div>
          </div>
        );
      })}
    </div>
  );
}
