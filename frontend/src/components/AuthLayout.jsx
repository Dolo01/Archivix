import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Building2, FileText, Search, CheckCircle2, Smartphone } from "lucide-react";
import Logo from "./Logo.jsx";

const POINTS = [
  { icon: ShieldCheck, title: "Données cloisonnées", text: "Chaque organisation ne voit que ses propres archives." },
  { icon: Lock, title: "Accès par rôle", text: "Administrateur, gestionnaire, lecteur : chacun à sa place." },
  { icon: Smartphone, title: "Partout", text: "Ordinateur, tablette et téléphone, avec notifications." },
];

// Aperçu illustratif de l'application (panneau décoratif)
function Apercu() {
  const docs = [
    { t: "Acte de vente — Parcelle 42", d: "Juridique", s: "Validé" },
    { t: "Bilan comptable 2025", d: "Comptabilité", s: "Archivé" },
    { t: "Contrat de bail — Siège", d: "Direction", s: "Validé" },
  ];
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/60">
        <Search size={15} /> Rechercher une référence, un titre…
      </div>
      <ul className="mt-3 space-y-2">
        {docs.map((d) => (
          <li key={d.t} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand">
              <FileText size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{d.t}</span>
              <span className="block text-xs text-ink/50">{d.d}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[11px] font-medium text-success-dark">
              <CheckCircle2 size={12} /> {d.s}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footer, badge }) {
  return (
    <div className="min-h-screen bg-paper-dim lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ---------- Formulaire ---------- */}
      <div className="relative flex min-h-screen flex-col">
        {/* Bandeau coloré sur téléphone (le panneau de droite y est masqué) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-brand to-[#2563eb] px-5 pb-16 pt-6 lg:hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <Link to="/" className="relative w-fit"><Logo light /></Link>
          <p className="relative mt-5 max-w-xs text-lg font-semibold leading-snug text-white">
            Vos archives, organisées et sécurisées.
          </p>
        </div>

        {/* Logo écran large */}
        <div className="hidden px-12 pt-8 lg:block">
          <Link to="/" className="w-fit"><Logo /></Link>
        </div>

        <div className="relative -mt-10 flex flex-1 items-start justify-center px-4 pb-8 sm:px-6 lg:mt-0 lg:items-center lg:py-10">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] sm:p-8">
            {badge && (
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-dark">
                {badge}
              </span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[26px]">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{subtitle}</p>}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-7 border-t border-line pt-5 text-center text-sm text-ink/55">{footer}</div>}
          </div>
        </div>

        <p className="flex justify-center gap-4 px-6 pb-6 text-xs text-ink/40 lg:justify-start lg:px-12">
          <span>© {new Date().getFullYear()} Archivix · Bamako</span>
          <Link to="/confidentialite" className="hover:text-ink">Politique de confidentialité</Link>
        </p>
      </div>

      {/* ---------- Panneau de marque (écran large) ---------- */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0f1d4d] via-[#1e3a8a] to-brand lg:flex lg:flex-col lg:justify-center lg:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl" />

        <div className="relative mx-auto w-full max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
            <Building2 size={13} /> Entreprises · Cabinets · Administrations
          </span>
          <p className="mt-5 text-[34px] font-semibold leading-[1.15] tracking-tight text-white">
            Vos archives, organisées, sécurisées et accessibles à la bonne personne.
          </p>

          <div className="mt-8"><Apercu /></div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                  <Icon size={17} />
                </span>
                <p className="mt-2.5 text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/65">{text}</p>
              </li>
            ))}
          </ul>

          <p className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60">
            <span>✓ 14 jours d'essai gratuit</span>
            <span>✓ Paiement Wave ou Orange Money</span>
            <span>✓ Conçu au Mali</span>
          </p>
        </div>
      </div>
    </div>
  );
}
