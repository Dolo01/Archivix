import { Link } from "react-router-dom";
import { ArrowLeft } from "../components/icons.jsx";
import Logo from "../components/Logo.jsx";

// Adresse de contact affichée publiquement et date de dernière mise à jour de la politique.
const CONTACT_EMAIL = "supportarchivix@gmail.com";
const UPDATED_AT = "16 novembre 2026";

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/70">{children}</div>
    </section>
  );
}

function List({ items }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-ink/30">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

const SOMMAIRE = [
  ["responsable", "Qui sommes-nous"],
  ["donnees", "Données collectées"],
  ["finalites", "Utilisation des données"],
  ["google", "Google Drive"],
  ["hebergement", "Hébergement et sous-traitants"],
  ["securite", "Sécurité"],
  ["conservation", "Durée de conservation"],
  ["droits", "Vos droits"],
  ["contact", "Contact"],
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <Link to="/" className="btn-ghost"><ArrowLeft size={16} /> Retour au site</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold text-brand">Informations légales</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Politique de confidentialité</h1>
        <p className="mt-3 text-sm text-ink/50">Dernière mise à jour : {UPDATED_AT}</p>

        <p className="mt-6 text-[15px] leading-relaxed text-ink/70">
          Cette page explique quelles données personnelles Archivix traite, pourquoi, où elles sont hébergées et
          quels sont vos droits. Archivix est une plateforme d'archivage et de gestion documentaire destinée aux
          entreprises, cabinets et administrations.
        </p>

        <nav className="mt-8 rounded-xl border border-line bg-paper-dim/60 p-5" aria-label="Sommaire">
          <p className="text-xs font-medium uppercase tracking-wider text-ink/45">Sommaire</p>
          <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {SOMMAIRE.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="text-ink/70 hover:text-brand">{i + 1}. {label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          <Section id="responsable" title="1. Qui sommes-nous">
            <p>
              Archivix est exploité depuis Bamako (Mali). Nous intervenons à deux titres :
            </p>
            <List
              items={[
                <>en tant que <strong>responsable du traitement</strong> pour les données de compte et de facturation des organisations clientes ;</>,
                <>en tant que <strong>sous-traitant</strong> pour les documents que chaque organisation archive : c'est l'organisation cliente qui décide de leur contenu et de qui y a accès.</>,
              ]}
            />
          </Section>

          <Section id="donnees" title="2. Données collectées">
            <List
              items={[
                <><strong>Compte utilisateur</strong> : nom complet, adresse e-mail professionnelle, mot de passe (enregistré uniquement sous forme chiffrée irréversible), rôle, département, date de dernière connexion.</>,
                <><strong>Organisation</strong> : nom de l'organisation, offre souscrite et date d'échéance.</>,
                <><strong>Documents</strong> : fichiers archivés et leurs informations (titre, référence, mots-clés, statut, dossier, partages, taille, date d'ajout, auteur).</>,
                <><strong>Collaboration</strong> : messages échangés sur un document et notifications.</>,
                <><strong>Abonnement</strong> : offre demandée, moyen de paiement (Wave ou Orange Money), numéro de téléphone utilisé pour le dépôt, référence de la transaction et, le cas échéant, capture du reçu. Archivix ne reçoit aucune donnée de carte bancaire.</>,
                <><strong>Google Drive</strong> (uniquement si un administrateur le connecte) : voir la section 4.</>,
              ]}
            />
            <p>
              Le navigateur conserve un jeton de session dans son stockage local pour vous garder connecté. Archivix
              n'utilise ni publicité, ni outil de suivi publicitaire.
            </p>
          </Section>

          <Section id="finalites" title="3. Utilisation des données">
            <List
              items={[
                "fournir le service : archiver, classer, rechercher, partager et consulter les documents ;",
                "appliquer les droits d'accès définis par l'organisation (départements, rôles, partages) ;",
                "permettre la discussion sur les documents et envoyer les notifications ;",
                "gérer les abonnements et vérifier les paiements reçus ;",
                "assurer la sécurité de la plateforme et répondre aux demandes d'assistance.",
              ]}
            />
            <p>Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires.</p>
          </Section>

          <Section id="google" title="4. Google Drive">
            <p>
              Un administrateur peut choisir d'enregistrer les documents de son organisation dans son propre Google
              Drive. Dans ce cas :
            </p>
            <List
              items={[
                <>Archivix demande uniquement l'autorisation <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 text-[13px]">drive.file</code> : il n'accède qu'aux fichiers qu'il a lui-même créés, jamais au reste du Drive.</>,
                "Archivix enregistre l'adresse e-mail du compte Google connecté et une autorisation d'accès, conservée chiffrée et jamais transmise au navigateur.",
                "Les fichiers sont créés dans un dossier « Archivix — nom de l'organisation » et restent la propriété de l'organisation. Supprimer un document dans Archivix le place dans la corbeille du Drive.",
                "L'organisation peut retirer cet accès à tout moment depuis les Paramètres d'Archivix ou depuis les paramètres de son compte Google.",
              ]}
            />
            <p className="rounded-lg border border-brand/20 bg-brand-50 px-4 py-3 text-brand-dark">
              L'utilisation et le transfert par Archivix des informations reçues des API Google respectent les{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                règles relatives aux données utilisateur des services d'API Google
              </a>
              , y compris les exigences d'utilisation limitée (« Limited Use »).
            </p>
            <p>
              Concrètement, les données obtenues de Google servent uniquement à enregistrer et ouvrir les documents
              de l'organisation dans Archivix. Elles ne sont ni vendues, ni utilisées pour de la publicité, ni pour
              entraîner des modèles d'intelligence artificielle, ni consultées par des personnes, sauf accord de
              l'organisation, pour des raisons de sécurité ou pour respecter la loi.
            </p>
          </Section>

          <Section id="hebergement" title="5. Hébergement et sous-traitants">
            <List
              items={[
                <><strong>Neon</strong> : base de données et stockage des fichiers des organisations qui n'ont pas connecté Google Drive (serveurs situés à Francfort, Allemagne).</>,
                <><strong>Render</strong> : hébergement de l'application et du serveur.</>,
                <><strong>Google</strong> : stockage des fichiers des organisations qui ont connecté leur Google Drive.</>,
              ]}
            />
            <p>
              Ces prestataires peuvent héberger les données en dehors du Mali. Ils n'y accèdent que pour fournir leur
              service technique.
            </p>
          </Section>

          <Section id="securite" title="6. Sécurité">
            <List
              items={[
                "données de chaque organisation strictement cloisonnées ;",
                "accès aux documents limité par département, rôle et partages explicites ;",
                "mots de passe chiffrés de façon irréversible ; autorisations Google chiffrées en base ;",
                "aucun lien public permanent vers les fichiers : chaque ouverture passe par un lien temporaire, délivré après vérification des droits ;",
                "connexions chiffrées (HTTPS).",
              ]}
            />
          </Section>

          <Section id="conservation" title="7. Durée de conservation">
            <p>
              Les données sont conservées tant que le compte de l'organisation est actif. À la demande de
              l'organisation ou à la fin de la relation contractuelle, elles sont supprimées, sauf obligation légale
              de conservation. Les fichiers enregistrés dans le Google Drive d'une organisation restent dans ce Drive
              et sont gérés par l'organisation elle-même.
            </p>
          </Section>

          <Section id="droits" title="8. Vos droits">
            <p>
              Conformément à la loi malienne n° 2013-015 relative à la protection des données à caractère personnel,
              vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données.
            </p>
            <p>
              Si vos données ont été saisies par votre employeur ou une organisation cliente, adressez-vous d'abord à
              l'administrateur Archivix de cette organisation. Vous pouvez aussi nous écrire directement (section 9)
              et, si vous estimez que vos droits ne sont pas respectés, saisir l'Autorité de Protection des Données à
              caractère Personnel (APDP) du Mali.
            </p>
          </Section>

          <Section id="contact" title="9. Contact">
            <p>
              Pour toute question sur cette politique ou pour exercer vos droits :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand hover:underline">{CONTACT_EMAIL}</a>.
            </p>
            <p>Nous pouvons modifier cette politique ; la date de mise à jour figure en haut de la page.</p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-ink/50 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Archivix · Bamako, Mali</span>
          <Link to="/" className="hover:text-ink">Accueil</Link>
        </div>
      </footer>
    </div>
  );
}
