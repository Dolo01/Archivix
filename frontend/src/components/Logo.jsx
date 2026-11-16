// Icône « Maison des archives » : fronton et colonnes d'un bâtiment d'archives.
export function LogoMark({ size = 32, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1D4ED8" />
      <path d="M16 6.5L26 12H6z" fill="#fff" />
      <rect x="8.5" y="13.8" width="3" height="8" rx="0.6" fill="#fff" />
      <rect x="14.5" y="13.8" width="3" height="8" rx="0.6" fill="#fff" />
      <rect x="20.5" y="13.8" width="3" height="8" rx="0.6" fill="#fff" />
      <rect x="6" y="23.3" width="20" height="2.6" rx="0.8" fill="#fff" />
    </svg>
  );
}

export default function Logo({ size = 32, light = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`text-[17px] font-semibold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Archivix
      </span>
    </span>
  );
}
