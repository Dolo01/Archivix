import { Link } from "react-router-dom";
import { ArrowRight, FileStack, ShieldCheck, Smartphone, Search, Users, Building2 } from "lucide-react";

const PILIERS = [
  {
    icon: FileStack,
    titre: "Classement sans effort",
    texte: "Chaque document reçoit une référence, une catégorie et un statut — retrouvés en quelques secondes.",
  },
  {
    icon: ShieldCheck,
    titre: "Cloisonnement par entreprise",
    texte: "Chaque client dispose de son propre registre, isolé et sécurisé, même sur une infrastructure partagée.",
  },
  {
    icon: Smartphone,
    titre: "Facturation Mobile Money",
    texte: "Vos abonnements se règlent directement par Orange Money ou Moov Money, sans carte bancaire.",
  },
];

const ETAPES = [
  { n: "01", titre: "Déposez", texte: "Glissez vos contrats, factures ou dossiers RH dans le registre." },
  { n: "02", titre: "Classez", texte: "Attribuez catégorie, référence et mots-clés en un geste." },
  { n: "03", titre: "Retrouvez", texte: "Recherchez par mot, référence ou catégorie, où que vous soyez." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ink to-brass font-display text-sm font-semibold text-white">
            A
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Archivix</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
          <a href="#piliers" className="hover:text-ink">Fonctionnalités</a>
          <a href="#tarifs" className="hover:text-ink">Tarifs</a>
          <a href="#comment" className="hover:text-ink">Comment ça marche</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/connexion" className="btn-ghost text-sm">Se connecter</Link>
          <Link to="/inscription" className="btn-primary text-sm">Créer mon registre</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl overflow-hidden px-6 pb-20 pt-10 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="label-eyebrow">Registre numérique — Entreprises d'Afrique de l'Ouest</span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-5xl">
              L'archive de votre entreprise,
              <span className="text-brass"> classée et scellée</span> numériquement.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70">
              Archivix remplace vos armoires et clés USB par un registre unique : chaque
              document est catégorisé, retrouvable et protégé — accessible à votre équipe,
              fermé à tous les autres.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/inscription" className="btn-primary">
                Créer mon registre <ArrowRight size={16} />
              </Link>
              <a href="#comment" className="btn-outline">Voir comment ça marche</a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-ink/50">
              <span className="font-mono">Paiement Orange Money & Moov Money</span>
            </div>
          </div>

          {/* Signature visuelle : carte de registre tamponnée */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-2xl bg-ledger opacity-60" />
            <div className="card relative rotate-1 bg-paper p-6">
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <p className="label-eyebrow">Dossier N°</p>
                  <p className="font-mono text-sm font-semibold">AX-2026-00417</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-stamp text-[10px] font-mono font-bold uppercase text-stamp">
                  Scellé
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {["Contrat de bail — Siège", "Facture fournisseur #2291", "Registre RH — Juillet"].map(
                  (titre) => (
                    <div key={titre} className="flex items-center gap-3 rounded-lg bg-ink/[0.03] px-3 py-2.5">
                      <div className="h-8 w-8 shrink-0 rounded-md bg-brass/20" />
                      <span className="truncate text-sm text-ink/80">{titre}</span>
                    </div>
                  )
                )}
              </div>
              <p className="mt-4 font-mono text-[11px] text-ink/40">
                Dernière consultation — il y a 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PILIERS */}
      <section id="piliers" className="border-y border-ink/10 bg-gradient-to-br from-ink via-ink to-brass-dark py-20 text-paper">
        <div className="mx-auto max-w-6xl px-6">
          <span className="label-eyebrow text-brass-light">Ce que vous gagnez</span>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-tight md:text-4xl">
            Un registre pensé pour les entreprises qui grandissent.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {PILIERS.map(({ icon: Icon, titre, texte }) => (
              <div key={titre} className="rounded-xl border border-paper/10 bg-paper/[0.04] p-6">
                <Icon size={22} className="text-brass" />
                <h3 className="mt-4 font-display text-lg font-semibold">{titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section id="comment" className="mx-auto max-w-6xl px-6 py-20">
        <span className="label-eyebrow">Comment ça marche</span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Trois gestes, un registre à jour.
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {ETAPES.map((e) => (
            <div key={e.n} className="relative border-l-2 border-brass/40 pl-6">
              <span className="font-display text-3xl font-semibold text-brass/50">{e.n}</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink">{e.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="bg-paper-dim py-20">
        <div className="mx-auto max-w-6xl px-6">
          <span className="label-eyebrow">Tarifs</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Une offre pour chaque taille d'équipe.
          </h2>
          <p className="mt-2 text-sm text-ink/60">Facturation annuelle. Essai gratuit de 14 jours sur toutes les offres.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { nom: "Starter", prix: "60 000", detail: "5 utilisateurs", mise: false, bg: "linear-gradient(135deg,#EDE9FE,#C4B5FD)" },
              { nom: "Pro", prix: "100 000", detail: "10 utilisateurs", mise: true, bg: "linear-gradient(135deg,#FFE2D1,#FFB08A)" },
              { nom: "Business", prix: "200 000", detail: "25 utilisateurs", mise: false, bg: "linear-gradient(135deg,#CFFAF9,#7BEFEA)" },
              { nom: "Enterprise", prix: "Sur devis", detail: "Utilisateurs illimités", mise: false, bg: "linear-gradient(135deg,#D8F5DE,#8FE3A8)" },
            ].map((p) => (
              <div
                key={p.nom}
                className={`rounded-2xl p-7 text-ink ${p.mise ? "ring-2 ring-brass" : ""}`}
                style={{ background: p.bg }}
              >
                {p.mise && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">Le plus choisi</span>
                )}
                <h3 className="mt-2 font-display text-xl font-semibold">{p.nom}</h3>
                <p className="mt-3">
                  {p.nom === "Enterprise" ? (
                    <span className="font-display text-2xl font-semibold">Sur devis</span>
                  ) : (
                    <>
                      <span className="font-display text-3xl font-semibold">{p.prix}</span>
                      <span className="text-sm text-ink/50"> FCFA/an</span>
                    </>
                  )}
                </p>
                <p className="mt-2 text-sm text-ink/60">{p.detail}</p>
                <Link to="/inscription" className="mt-6 flex w-full items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-ink-light">
                  {p.nom === "Enterprise" ? "Nous contacter" : "Essayer 14 jours gratuitement"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-ink/50 md:flex-row">
          <span>© 2026 Archivix — Bamako, Mali</span>
          <div className="flex items-center gap-2">
            <Building2 size={14} /> <span>Conçu pour les entreprises ouest-africaines</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
