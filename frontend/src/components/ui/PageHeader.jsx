export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && <p className="mb-1 text-xs font-medium text-ink/45">{breadcrumb}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
