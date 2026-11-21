import { Check, Minus, Briefcase, Scale, Building2, Landmark } from "./icons.jsx";
import { OFFRES } from "../utils/plans.js";

// Couleur propre à chaque offre (bandeau, pastille, coches, bouton)
const THEMES = {
  essentiel: {
    icon: Briefcase, band: "from-emerald-400 to-teal-500", tile: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    check: "text-emerald-500", btn: "btn border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-emerald-700 hover:bg-emerald-100",
  },
  professionnel: {
    icon: Scale, band: "from-blue-500 to-indigo-600", tile: "bg-white/15 text-white ring-white/25",
    check: "text-blue-600", btn: "btn-primary font-semibold",
  },
  business: {
    icon: Building2, band: "from-violet-500 to-fuchsia-500", tile: "bg-violet-50 text-violet-600 ring-violet-100",
    check: "text-violet-500", btn: "btn border border-violet-200 bg-violet-50 px-4 py-2.5 text-violet-700 hover:bg-violet-100",
  },
  institution: {
    icon: Landmark, band: "from-amber-400 to-orange-500", tile: "bg-amber-50 text-amber-600 ring-amber-100",
    check: "text-amber-500", btn: "btn border border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-800 hover:bg-amber-100",
  },
};
export function planTheme(id) {
  return THEMES[id] || THEMES.essentiel;
}

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
            value === o.v ? "bg-brand text-white shadow-card" : "text-ink/60 hover:text-ink"
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
        const t = planTheme(p.id);
        const Icon = t.icon;
        return (
          <div
            key={p.id}
            className={`relative flex flex-col overflow-hidden rounded-2xl border transition duration-200 motion-safe:hover:-translate-y-1 hover:shadow-pop ${
              p.recommande ? "border-transparent shadow-raised ring-2 ring-brand" : "border-line bg-white shadow-card"
            }`}
          >
            {/* En-tête : coloré en dégradé pour l'offre recommandée, simple bandeau sinon */}
            {p.recommande ? (
              <div className={`relative bg-gradient-to-br ${t.band} px-6 pb-6 pt-5 text-white`}>
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                <div className="relative flex items-center justify-between gap-2">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${t.tile}`}><Icon size={22} /></span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">Recommandé</span>
                </div>
                <h3 className="relative mt-4 text-lg font-semibold">{p.label}</h3>
                <p className="relative text-sm text-white/75">{p.description}</p>
                <Prix p={p} prix={prix} duree={duree} light />
              </div>
            ) : (
              <>
                <div className={`h-1.5 bg-gradient-to-r ${t.band}`} />
                <div className="px-6 pb-2 pt-5">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${t.tile}`}><Icon size={22} /></span>
                  <h3 className="mt-4 text-lg font-semibold">{p.label}</h3>
                  <p className="text-sm text-ink/55">{p.description}</p>
                  <Prix p={p} prix={prix} duree={duree} />
                </div>
              </>
            )}
            {current && <span className="badge-success absolute right-4 top-4">Offre actuelle</span>}
            <div className="flex flex-1 flex-col bg-white px-6 pb-6 pt-5">
              <ul className="flex-1 space-y-2.5 text-sm text-ink/70">
                {p.points.map((f) => (
                  <li key={f} className="flex gap-2.5"><Check size={17} weight="bold" className={`mt-0.5 shrink-0 ${t.check}`} /> {f}</li>
                ))}
                {(p.absent || []).map((f) => (
                  <li key={f} className="flex gap-2.5 text-ink/35"><Minus size={17} className="mt-0.5 shrink-0" /> {f}</li>
                ))}
              </ul>
              <div className="mt-6">{renderAction(p, current, t)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Prix({ p, prix, duree, light = false }) {
  const muted = light ? "text-white/70" : "text-ink/50";
  return (
    <div className="relative mt-5 min-h-[60px]">
      {p.surDevis ? (
        <>
          <p className="text-[28px] font-semibold leading-tight tracking-tight">Sur devis</p>
          <p className={`mt-1 text-xs ${muted}`}>Contrat annuel</p>
        </>
      ) : (
        <>
          <p>
            <span className="text-[34px] font-semibold leading-tight tracking-tight tabular-nums">{prix.toLocaleString("fr-FR")}</span>
            <span className={`text-sm ${muted}`}> FCFA / {duree === 1 ? "mois" : "an"}</span>
          </p>
          <p className={`mt-1 text-xs ${muted}`}>
            {duree === 1 ? `ou ${p.prixAnnuel.toLocaleString("fr-FR")} FCFA / an` : "soit 2 mois offerts"}
          </p>
        </>
      )}
    </div>
  );
}
