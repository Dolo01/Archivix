export default function StatCard({ label, value, hint, icon: Icon, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink/60">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper-dim text-ink/50">
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
      {children}
    </div>
  );
}
