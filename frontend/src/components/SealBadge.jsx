const STATUS_STYLES = {
  archive: { label: "Archivé", short: "AR", bg: "#8B5CF6" },
  en_revision: { label: "En révision", short: "EN", bg: "#FF6B4A" },
  archive_definitif: { label: "Définitif", short: "DEF", bg: "#16A34A" },
};

export default function SealBadge({ status = "archive", size = "sm" }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.archive;
  const dims = size === "sm" ? "h-7 w-7 text-[9px]" : "h-10 w-10 text-[10px]";

  return (
    <span
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-lg font-mono font-semibold uppercase leading-none text-white`}
      style={{ background: style.bg }}
      title={style.label}
    >
      {style.short}
    </span>
  );
}
