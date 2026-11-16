import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Check, FileText, Search, ShieldCheck, Users, FolderTree, MessageSquare,
  Briefcase, Scale, Landmark, Lock, History, Smartphone, Menu, X, Building2, Bell,
} from "lucide-react";
import Logo, { LogoMark } from "../components/Logo.jsx";
import PlanCards, { BillingToggle } from "../components/PlanCards.jsx";

const PUBLICS = [
  {
    icon: Briefcase,
    titre: "Entreprises",
    texte: "Contrats, factures, dossiers du personnel : chaque service classe ses pièces et les retrouve en quelques secondes.",
  },
  {
    icon: Scale,
    titre: "Cabinets",
    texte: "Avocats, notaires, experts-comptables : un dossier par client, des accès maîtrisés et un historique des échanges.",
  },
  {
    icon: Landmark,
    titre: "Administrations",
    texte: "Directions et services publics : dématérialisez les registres et partagez uniquement ce qui doit l'être.",
  },
];

const FONCTIONS = [
  { icon: FolderTree, titre: "Classement structuré", texte: "Départements, dossiers, références internes et mots-clés pour un plan de classement clair." },
  { icon: Search, titre: "Recherche rapide", texte: "Retrouvez un document par son titre, sa référence ou ses mots-clés." },
  { icon: Users, titre: "Rôles et permissions", texte: "Administrateur, gestionnaire ou lecteur : chacun ne voit que ce qui le concerne." },
  { icon: ShieldCheck, titre: "Partage maîtrisé", texte: "Partagez un dossier ou un document précis avec un autre service, jamais un département entier." },
  { icon: MessageSquare, titre: "Discussion par document", texte: "Échangez directement sur une pièce, sans perdre le fil dans les emails." },
  { icon: Bell, titre: "Notifications", texte: "Soyez prévenu en temps réel lorsqu'un document est archivé dans votre service." },
];

const ETAPES = [
  { titre: "Créez votre espace", texte: "Inscrivez votre organisation en deux minutes et démarrez l'essai gratuit." },
  { titre: "Organisez vos services", texte: "Ajoutez vos départements et invitez vos collaborateurs avec le bon rôle." },
  { titre: "Archivez et retrouvez", texte: "Déposez vos fichiers par glisser-déposer, classez-les, retrouvez-les à tout moment." },
];


function ProductPreview() {
  const rows = [
    { t: "Contrat de bail — Siège social", d: "Direction", s: "Définitif", c: "badge-success" },
    { t: "Facture fournisseur F-2291", d: "Comptabilité", s: "Archivé", c: "badge-brand" },
    { t: "Procès-verbal AG 2026", d: "Juridique", s: "En révision", c: "badge-warning" },
    { t: "Dossier du personnel — Juillet", d: "Ressources humaines", s: "Archivé", c: "badge-brand" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-pop" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b border-line bg-paper-dim px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
      </div>
      <div className="flex">
        <div className="hidden w-44 shrink-0 border-r border-line p-3 sm:block">
          <div className="flex items-center gap-2 px-1.5 pb-3">
            <LogoMark size={20} />
            <span className="text-xs font-semibold">Archivix</span>
          </div>
          {["Tableau de bord", "Documents", "Départements", "Utilisateurs"].map((l, i) => (
            <div key={l} className={`mb-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium ${i === 1 ? "bg-brand-50 text-brand-dark" : "text-ink/55"}`}>
              {l}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Documents</p>
            <span className="rounded-md bg-brand px-2 py-1 text-[10px] font-medium text-white">+ Archiver</span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-[11px] text-ink/40">
            <Search size={12} /> Rechercher une référence…
          </div>
          <div className="mt-3 divide-y divide-line rounded-md border border-line">
            {rows.map((r) => (
              <div key={r.t} className="flex items-center gap-2.5 px-2.5 py-2">
                <FileText size={14} className="shrink-0 text-ink/35" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium">{r.t}</p>
                  <p className="text-[10px] text-ink/45">{r.d}</p>
                </div>
                <span className={`${r.c} px-2 text-[10px]`}>{r.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [menu, setMenu] = useState(false);
  const [duree, setDuree] = useState(1);
  const links = [
    { href: "#fonctionnalites", label: "Fonctionnalités" },
    { href: "#securite", label: "Sécurité" },
    { href: "#tarifs", label: "Tarifs" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink/65 md:flex">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-ink">{l.label}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/connexion" className="btn-ghost">Se connecter</Link>
            <Link to="/inscription" className="btn-primary">Essai gratuit</Link>
          </div>
          <button onClick={() => setMenu((m) => !m)} className="icon-btn-neutral md:hidden" aria-label="Menu">
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menu && (
          <div className="border-t border-line px-4 py-3 md:hidden">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenu(false)} className="block rounded-md px-2 py-2 text-sm font-medium text-ink/70">
                {l.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link to="/connexion" className="btn-secondary">Se connecter</Link>
              <Link to="/inscription" className="btn-primary">Essai gratuit</Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-paper-dim to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <span className="badge-brand">Gestion documentaire pour organisations</span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              L'archivage numérique de votre organisation, enfin maîtrisé.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/60">
              Archivix centralise vos documents, les classe par service et contrôle qui y accède.
              Fini les armoires saturées et les clés USB perdues.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/inscription" className="btn-primary px-5 py-3">
                Démarrer l'essai gratuit <ArrowRight size={16} />
              </Link>
              <a href="#fonctionnalites" className="btn-secondary px-5 py-3">Découvrir les fonctionnalités</a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/55">
              {["14 jours d'essai gratuit", "Sans carte bancaire", "Paiement Wave ou Orange Money"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check size={15} className="text-brand" /> {t}</li>
              ))}
            </ul>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* PUBLICS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand">Pour qui ?</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Une solution adaptée aux structures publiques et privées.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PUBLICS.map(({ icon: Icon, titre, texte }) => (
            <div key={titre} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand"><Icon size={20} /></span>
              <h3 className="mt-4 text-lg font-semibold">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FONCTIONNALITES */}
      <section id="fonctionnalites" className="scroll-mt-16 border-y border-line bg-paper-dim py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand">Fonctionnalités</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Tout ce qu'il faut pour gérer vos archives au quotidien.</h2>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FONCTIONS.map(({ icon: Icon, titre, texte }) => (
              <div key={titre}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink shadow-card"><Icon size={18} /></span>
                <h3 className="mt-4 font-semibold">{titre}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITE */}
      <section id="securite" className="scroll-mt-16 bg-ink py-20 text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-light">Sécurité et confidentialité</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Vos documents restent les vôtres.</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-white/65">
              Chaque organisation dispose d'un espace isolé. À l'intérieur, l'accès est réglé par
              département et par rôle : un collaborateur ne voit que les pièces de son service et
              celles qu'on a explicitement partagées avec lui.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Building2, t: "Espaces cloisonnés", x: "Les données d'une organisation ne sont jamais visibles par une autre." },
              { icon: Lock, t: "Accès par rôle", x: "Administrateur, gestionnaire ou lecteur, avec des droits distincts." },
              { icon: ShieldCheck, t: "Partage granulaire", x: "Un dossier ou un document à la fois, jamais tout un service." },
              { icon: History, t: "Suivi des échanges", x: "Les discussions restent attachées au document concerné." },
            ].map(({ icon: Icon, t, x }) => (
              <div key={t} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <Icon size={18} className="text-brand-light" />
                <p className="mt-3 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-white/60">{x}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ETAPES */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand">Mise en route</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Opérationnel en quelques minutes.</h2>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="card p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{e.titre}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="scroll-mt-16 border-t border-line bg-paper-dim py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand">Tarifs</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Une offre pour chaque taille d'équipe.</h2>
            <p className="mt-3 text-ink/60">Paiement mensuel ou annuel en FCFA. 14 jours d'essai gratuit, sans engagement.</p>
          </div>
          <div className="mt-8 flex justify-center"><BillingToggle value={duree} onChange={setDuree} /></div>
          <div className="mt-10">
            <PlanCards
              duree={duree}
              renderAction={(p) => (
                <Link to="/inscription" className={`${p.recommande ? "btn-primary" : "btn-secondary"} w-full`}>
                  {p.surDevis ? "Nous contacter" : "Essayer gratuitement"}
                </Link>
              )}
            />
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-ink/55">
            <Smartphone size={15} /> Règlement par Wave ou Orange Money, sans carte bancaire.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight">Prêt à dématérialiser vos archives ?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">
            Créez l'espace de votre organisation et invitez votre équipe dès aujourd'hui.
          </p>
          <Link to="/inscription" className="btn relative mt-8 bg-white px-5 py-3 text-brand-dark shadow-card hover:bg-white/90">
            Démarrer l'essai gratuit <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-ink/50 sm:px-6 md:flex-row">
          <Logo size={24} />
          <p>© {new Date().getFullYear()} Archivix · Bamako, Mali</p>
          <div className="flex gap-6">
            <Link to="/connexion" className="hover:text-ink">Connexion</Link>
            <Link to="/confidentialite" className="hover:text-ink">Confidentialité</Link>
            <a href="mailto:support@archivix.example" className="hover:text-ink">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
