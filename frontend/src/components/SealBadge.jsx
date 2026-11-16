const STATUS_STYLES = {
  archive: { label: "Archivé", cls: "badge-brand" },
  en_revision: { label: "En révision", cls: "badge-warning" },
  archive_definitif: { label: "Définitif", cls: "badge-success" },
};

export default function SealBadge({ status = "archive" }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.archive;
  return (
    <span className={style.cls}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  );
}
