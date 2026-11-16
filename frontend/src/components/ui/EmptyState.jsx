export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-paper-dim text-ink/45">
          <Icon size={20} />
        </div>
      )}
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink/55">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
