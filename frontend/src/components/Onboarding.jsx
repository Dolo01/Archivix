import { Link } from "react-router-dom";
import { Check, X } from "./icons.jsx";

/**
 * Mise en route guidée affichée à l'administrateur tant que les étapes essentielles ne sont pas faites.
 * steps : [{ key, title, text, done, to, cta, optional }]
 */
export default function Onboarding({ firstName, orgName, steps, trial, onDismiss }) {
  const required = steps.filter((s) => !s.optional);
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-label="Mise en route">
      <div className="card overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="card-title">Bien démarrer, {firstName}</h2>
            <p className="mt-0.5 text-sm text-ink/55">L'espace « {orgName} » est prêt. Quelques étapes pour l'utiliser pleinement.</p>
          </div>
          <button onClick={onDismiss} className="icon-btn-neutral -mr-2 shrink-0" title="Masquer" aria-label="Masquer la mise en route">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3 px-5 pt-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs tabular-nums text-ink/55">{doneCount} sur {steps.length}</span>
        </div>
        <ol className="mt-2 divide-y divide-line">
          {steps.map((s) => (
            <li key={s.key} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  s.done ? "border-success bg-success text-white" : "border-ink/20"
                }`}
                aria-hidden="true"
              >
                {s.done && <Check size={13} strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${s.done ? "text-ink/45 line-through" : "text-ink"}`}>
                  {s.title} {s.optional && !s.done && <span className="badge-neutral ml-1 align-middle no-underline">Optionnel</span>}
                </p>
                {!s.done && s.text && <p className="text-xs text-ink/50">{s.text}</p>}
              </div>
              {!s.done && s.to && (
                <Link to={s.to} className={`${s.optional ? "btn-secondary" : "btn-primary"} shrink-0 px-3 py-1.5`}>
                  {s.cta}
                </Link>
              )}
            </li>
          ))}
        </ol>
        {required.every((s) => s.done) && (
          <p className="border-t border-line bg-success-light/40 px-5 py-3 text-sm text-success-dark">
            Les étapes essentielles sont faites. Vous pouvez masquer ce guide.
          </p>
        )}
      </div>

      {trial && (
        <div className="card flex flex-col p-5">
          <p className="card-title">Essai gratuit</p>
          <p className="mt-1 text-sm text-ink/55">
            {trial.daysLeft > 0
              ? `${trial.daysLeft} jour${trial.daysLeft > 1 ? "s" : ""} restant${trial.daysLeft > 1 ? "s" : ""}, jusqu'au ${trial.until}.`
              : "Votre essai est terminé."}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
            <div
              className={`h-full rounded-full ${trial.daysLeft <= 3 ? "bg-danger" : "bg-warning"}`}
              style={{ width: `${Math.max(4, Math.min(100, ((14 - trial.daysLeft) / 14) * 100))}%` }}
            />
          </div>
          <p className="mt-3 flex-1 text-sm text-ink/60">
            Choisissez une offre avant la fin de l'essai pour garder l'accès à vos documents. Paiement mensuel possible, dès 5 000 FCFA.
          </p>
          <Link to="/app/facturation" className="btn-secondary mt-4 self-start">Voir les offres</Link>
        </div>
      )}
    </section>
  );
}
