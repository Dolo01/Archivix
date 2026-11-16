import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Building2 } from "lucide-react";
import Logo from "./Logo.jsx";

const POINTS = [
  { icon: ShieldCheck, text: "Données de chaque organisation strictement cloisonnées" },
  { icon: Lock, text: "Accès par rôle : administrateur, gestionnaire, lecteur" },
  { icon: Building2, text: "Conçu pour les entreprises, cabinets et administrations" },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="w-fit"><Logo /></Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink/55">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <p className="mt-8 text-center text-sm text-ink/55">{footer}</p>}
          </div>
        </div>
        <p className="text-xs text-ink/40">© {new Date().getFullYear()} Archivix</p>
      </div>

      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/40 blur-3xl" />
        <div className="relative" />
        <div className="relative max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Vos archives, organisées, sécurisées et accessibles à la bonne personne.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/75">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">Gestion documentaire · Archivage · Collaboration</p>
      </div>
    </div>
  );
}
