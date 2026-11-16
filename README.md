# Archivix

SaaS d'archivage numérique multi-entreprises — front React (Vite + Tailwind), back Node.js (Express + Prisma/PostgreSQL sur Neon), abonnement géré manuellement via Wave / Orange Money.

## Structure

```
archivix/
├── backend/     API Express (auth, documents, dossiers, départements, abonnements, super-admin)
└── frontend/    Application React (landing, connexion, tableau de bord, espace super-admin)
```

## Base de données et stockage : Neon

Archivix utilise **PostgreSQL** et un **stockage de fichiers compatible S3**, tous deux fournis par **Neon** (offre gratuite, région Francfort). La marche à suivre complète est dans `DEPLOYMENT.md` (section 1).

En local pour développer, deux options :
- utiliser la base Neon (renseigner `DATABASE_URL` et `DATABASE_URL_UNPOOLED` dans `backend/.env`) ;
- ou un PostgreSQL installé localement, en mettant la même adresse dans les deux variables (`postgresql://user:password@localhost:5432/archivix`).

⚠️ Ne supprimez jamais le dossier `backend/prisma/migrations` : il décrit l'historique de la base et sert à chaque déploiement.

## Démarrer le backend

```bash
cd backend
cp .env.example .env   # renseigner DATABASE_URL, DATABASE_URL_UNPOOLED et les autres variables
npm install
npx prisma migrate deploy   # crée ou met à jour les tables
npm run create-superadmin -- "Votre Nom" vous@exemple.com votremotdepasse
npm run dev
```

La commande `create-superadmin` crée votre compte de super-administrateur de la plateforme (à ne lancer qu'une fois). C'est avec ce compte que vous approuvez ou refusez les demandes d'abonnement, sur `/superadmin/connexion`.

## Stockage des fichiers

Les documents et captures de paiement sont enregistrés, par ordre de priorité :
1. sur **Neon Object Storage** si `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` sont renseignés (recommandé) ;
2. sinon sur **Supabase Storage** si `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` le sont (ancienne configuration, toujours lue) ;
3. sinon dans `backend/uploads/` (développement uniquement : le disque d'un hébergeur gratuit est effacé à chaque redéploiement).

Aucun fichier n'est accessible par une adresse publique : chaque ouverture passe par un lien temporaire (5 minutes) délivré après vérification des droits. Au démarrage, le serveur affiche le stockage utilisé.

## Stockage dans le Google Drive du client (optionnel)

Chaque organisation peut connecter son propre Google Drive depuis **Paramètres** (administrateurs). Ses nouveaux documents y sont enregistrés (un dossier par organisation, un sous-dossier par département) ; les droits d'accès d'Archivix continuent de s'appliquer et les fichiers sont ouverts via des liens signés valables 5 minutes. Configuration Google Cloud : voir la section 6 de `DEPLOYMENT.md`.

## Déploiement gratuit

Voir **`DEPLOYMENT.md`** pour un guide complet, étape par étape, sans nom de domaine : Neon (base + stockage) + Render (backend en Web Service, frontend en Static Site).

## Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
```

## Rôles et espaces

- **Super-administrateur** (`/superadmin`) — vous, l'exploitant de la plateforme. Voit toutes les entreprises, approuve/refuse les demandes d'abonnement, peut désactiver une entreprise.
- **Admin d'entreprise** — crée les départements, gère l'équipe (ajout/modification/suppression), gère l'abonnement.
- **Gestionnaire** — dépose, modifie, partage des documents/dossiers dans son département.
- **Lecteur** — consultation seule.

## Abonnement manuel (sans API de paiement)

- **Essai gratuit de 14 jours** automatique à l'inscription de toute nouvelle entreprise (offre `essai`, aucune limite d'utilisateurs pendant l'essai).
- Grille tarifaire, facturation annuelle uniquement :

  | Offre | Utilisateurs | Prix |
  |---|---|---|
  | Starter | 5 | 60 000 FCFA/an |
  | Pro | 10 | 100 000 FCFA/an |
  | Business | 25 | 200 000 FCFA/an |
  | Enterprise | Illimité | Sur devis (bouton "Nous contacter") |

  Modifiable dans `backend/src/utils/plans.js`.

1. L'admin de l'entreprise clique sur **Facturation**, choisit une offre (Starter/Pro/Business) et voit les numéros Wave / Orange Money à utiliser (configurés dans `.env` via `WAVE_NUMBER` / `ORANGE_MONEY_NUMBER`). L'offre Enterprise ouvre directement un email vers `PAYMENT_BENEFICIARY_EMAIL`.
2. Il effectue le dépôt, puis renseigne le numéro utilisé, la référence de la transaction, et peut joindre une capture d'écran.
3. La demande apparaît chez le super-administrateur (`/superadmin`), qui l'approuve (l'abonnement de 12 mois s'active sur l'offre choisie, avec sa limite d'utilisateurs) ou la refuse (avec motif).
4. L'entreprise est notifiée automatiquement de la décision (cloche de notifications en temps réel).
5. La création d'un nouveau membre est bloquée si l'entreprise a atteint la limite d'utilisateurs de son offre.

## Départements, dossiers et partage

- Un département n'est **jamais partagé en entier**. On partage un **dossier** précis ou un **document** précis avec d'autres départements.
- Chaque département peut créer des dossiers ; chaque dossier peut être partagé (bouton partage sur le dossier, page Documents).
- Un document peut aussi être partagé individuellement, qu'il soit dans un dossier ou non.
- Glisser-déposer plusieurs fichiers à la fois est pris en charge sur la page Documents.

## Notifications

- Un événement (document ajouté dans votre département, abonnement approuvé/refusé) crée une notification en base et la pousse en temps réel via Socket.io si l'utilisateur est connecté.
- La cloche dans l'en-tête affiche le nombre de notifications non lues et les marque comme lues à l'ouverture.

## Discussion instantanée sur un document

Chaque document dispose d'un fil de discussion, consultable via le bouton **Discuter**, avec diffusion en temps réel par Socket.io.

## Prochaines étapes suggérées

- Stockage des fichiers sur un service cloud (S3-compatible) plutôt qu'en local, avant mise en production.
- Historique des versions d'un fichier (garder les anciennes versions après remplacement).
- Recherche dans le contenu des PDF (pas seulement titre/référence/mots-clés).
- Réinitialisation de mot de passe et invitation de membre par email (nécessite un service d'envoi d'emails, ex. SMTP ou Resend).
