// Carte de chiffre clé, avec une pastille d'icône colorée selon le thème (tone)
const TONES = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function StatCard({ label, value, hint, icon: Icon, tone = "blue", children }) {
  return (
    <div className="card p-5 transition-shadow duration-200 hover:shadow-raised">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${TONES[tone] || TONES.blue}`}>
            <Icon size={22} />
          </span>
        )}
        <p className="text-sm font-medium text-ink/60">{label}</p>
      </div>
      <p className="mt-4 text-[28px] font-semibold leading-none tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-xs text-ink/50">{hint}</p>}
      {children}
    </div>
  );
}
