export default function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}
