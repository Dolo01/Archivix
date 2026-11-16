import { Link } from "react-router-dom";
import { ShieldCheck, KeyRound, ScrollText } from "lucide-react";
import Logo from "./Logo.jsx";

const GARANTIES = [
  {
    icon: ShieldCheck,
    title: "Cloisonnement des données",
    text: "Les archives de chaque organisation sont strictement séparées et ne sont jamais accessibles à une autre.",
  },
  {
    icon: KeyRound,
    title: "Contrôle des accès",
    text: "Droits définis par rôle et par département : chaque collaborateur ne consulte que ce qui le concerne.",
  },
  {
    icon: ScrollText,
    title: "Traçabilité",
    text: "Consultations, modifications, partages et impressions sont enregistrés dans un journal d'activité.",
  },
];

// Mise en page des écrans d'accès (connexion, inscription, mot de passe).
// Sobre et institutionnelle : formulaire à gauche, présentation à droite (écran large).
export default function AuthLayout({ title, subtitle, eyebrow, children, footer }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ---------- Formulaire ---------- */}
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center border-b border-line px-6 sm:px-10 lg:border-0 lg:px-12 lg:pt-4">
          <Link to="/" className="w-fit"><Logo /></Link>
        </header>

        <main className="flex flex-1 items-start justify-center px-6 py-10 sm:px-10 lg:items-center lg:py-12">
          <div className="w-full max-w-[400px]">
            {eyebrow && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand">{eyebrow}</p>
            )}
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-ink/60">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 border-t border-line pt-6 text-sm text-ink/60">{footer}</div>}
          </div>
        </main>

        <footer className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line px-6 py-5 text-xs text-ink/45 sm:px-10 lg:px-12">
          <span>© {new Date().getFullYear()} Archivix — Bamako, Mali</span>
          <Link to="/confidentialite" className="hover:text-ink">Politique de confidentialité</Link>
          <a href="mailto:supportarchivix@gmail.com" className="hover:text-ink">Assistance</a>
        </footer>
      </div>

      {/* ---------- Présentation (écran large) ---------- */}
      <aside className="hidden bg-[#0B1A3A] text-white lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Gestion documentaire et archivage</p>

        <div className="max-w-md">
          <h2 className="text-[32px] font-semibold leading-[1.2] tracking-tight">
            Un archivage numérique fiable pour les organisations exigeantes.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65">
            Classez, retrouvez et protégez vos documents en toute confiance, avec des accès maîtrisés et un
            historique complet.
          </p>

          <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {GARANTIES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 py-5">
                <Icon size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#93B4FF]" />
                <div>
                  <p className="text-[15px] font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="max-w-md text-sm leading-relaxed text-white/50">
          Conçu pour les cabinets d'avocats, études notariales, cabinets d'expertise comptable, entreprises et
          administrations publiques.
        </p>
      </aside>
    </div>
  );
}
