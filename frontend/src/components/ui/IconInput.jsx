// Champ texte avec une icône à gauche
export default function IconInput({ icon: Icon, className = "", ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />}
      <input {...props} className={`input ${Icon ? "pl-10" : ""} ${className}`} />
    </div>
  );
}
