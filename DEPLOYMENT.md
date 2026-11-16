# Déployer Archivix gratuitement (sans nom de domaine)

Ce guide utilise deux services gratuits, sans carte bancaire requise pour démarrer :

- **Neon** → base de données PostgreSQL + stockage des fichiers (gratuit, permanent)
- **Render** → backend (Web Service) **et** frontend (Static Site), les deux gratuits

Tout se pilote depuis un seul tableau de bord Render, avec des adresses du type `xxxx.onrender.com` — pas besoin de nom de domaine pour tester.

---

## 1. Base de données + stockage des fichiers (Neon)

Neon fournit la base PostgreSQL **et** le stockage des fichiers (compatible S3), avec une offre gratuite généreuse (jusqu'à 100 projets, 1 Go de base et 5 Go de fichiers par projet).

1. Va sur https://neon.com → crée un compte gratuit → **New project** :
   - nom : `archivix` ;
   - région : **AWS Europe Central 1 (Frankfurt)** (la plus proche du Mali parmi celles qui proposent le stockage de fichiers) ;
   - nom de la base : `archivix`.
2. Clique **Connect** :
   - copie la chaîne de connexion **poolée** (le nom d'hôte contient `-pooler`) et ajoute à la fin `&pgbouncer=true&connect_timeout=15` → c'est `DATABASE_URL` ;
   - décoche « Connection pooling » pour obtenir la chaîne **directe** (sans `-pooler`), ajoute `&connect_timeout=15` → c'est `DATABASE_URL_UNPOOLED` (utilisée par Prisma pour les migrations).
3. Toujours dans **Connect**, onglet **Storage** : crée un bucket nommé `archivix` en accès **privé**, puis récupère `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` (bouton **Reveal credential**). La clé secrète n'est affichée qu'une fois : copie-la tout de suite.

🔒 Le bucket doit rester **privé** : Archivix ouvre chaque document avec un lien temporaire (5 minutes), délivré après vérification des droits de l'utilisateur.

> Les tables sont créées automatiquement au déploiement par `npx prisma migrate deploy` (voir l'étape 2).

> **Déjà sur Supabase ?** Archivix sait toujours lire les fichiers stockés sur Supabase : laisse `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `SUPABASE_BUCKET` renseignés le temps de migrer. Dès que les variables `AWS_*` sont présentes, les **nouveaux** fichiers partent sur Neon.

## 2. Backend (Render — Web Service)

1. Mets ton dossier `archivix/` sur GitHub (crée un repo, `git init` puis `git push` si ce n'est pas déjà fait).
2. Va sur https://render.com → connecte ton compte GitHub → **New → Web Service** → choisis ton repo.
3. Configure :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command** : `node src/server.js`
   - **Instance Type** : Free
4. Dans l'onglet **Environment**, ajoute toutes les variables de `backend/.env.example`, avec tes vraies valeurs :
   - `DATABASE_URL` et `DATABASE_URL_UNPOOLED` (étape 1.2)
   - `JWT_SECRET` (longue chaîne aléatoire : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `STORAGE_BUCKET=archivix` (étape 1.3)
   - (optionnel) les variables `GOOGLE_*` : voir la section 6
   - `WAVE_NUMBER`, `ORANGE_MONEY_NUMBER`, `PAYMENT_BENEFICIARY_NAME`, `PAYMENT_BENEFICIARY_EMAIL`
   - `FRONTEND_URL` : laisse `http://localhost:5173` pour l'instant, tu la corrigeras à l'étape 4
5. Clique **Create Web Service**. Render te donne une URL du type `https://archivix-backend.onrender.com`. Note-la.
6. Une fois déployé, crée ton compte super-admin **directement depuis Render** : onglet **Shell** (dans le tableau de bord du service) →
   ```bash
   npm run create-superadmin -- "Ton Nom" toi@exemple.com tonmotdepasse
   ```

⚠️ Le plan gratuit de Render met le service en veille après 15 minutes sans requête ; la première requête après une veille prend ~30 à 60 secondes le temps qu'il redémarre. Normal, pas un bug.

## 3. Frontend (Render — Static Site)

1. Dans `frontend/src/api/client.js` et `frontend/src/api/superAdminClient.js`, remplace les `baseURL` relatifs par l'URL de ton backend Render :
   ```js
   const api = axios.create({ baseURL: "https://archivix-backend.onrender.com/api" });
   ```
   (et `.../api/superadmin` pour l'autre fichier). Fais un `git commit` + `git push`.
2. Dans `frontend/src/api/socket.js`, remplace `io("/", ...)` par `io("https://archivix-backend.onrender.com", ...)`.
3. Sur Render → **New → Static Site** → choisis le même repo GitHub.
4. Configure :
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Publish Directory** : `dist`
5. **Important — routage React** : avant de déployer, va dans l'onglet **Redirects/Rewrites** du Static Site et ajoute une règle :
   - Source : `/*`
   - Destination : `/index.html`
   - Action : `Rewrite`

   Sans ça, actualiser une page comme `/app/documents` affichera une erreur 404 (le serveur cherche un fichier `documents.html` qui n'existe pas).
6. Déploie. Render te donne une URL du type `https://archivix-frontend.onrender.com`.

## 4. Reconnecter les deux

Retourne dans ton **Web Service** (backend) → **Environment** → mets à jour `FRONTEND_URL` avec ton URL de Static Site (`https://archivix-frontend.onrender.com`), pour que les CORS et les liens de notification pointent au bon endroit. Render redéploie automatiquement.

## 5. Tester

- Va sur ton URL de Static Site → inscris une entreprise test → vérifie que l'essai de 14 jours s'affiche.
- Archive un document → vérifie dans Neon (**Storage → archivix**) que le fichier est bien apparu, puis ouvre-le depuis Archivix (le lien doit contenir `X-Amz-Expires=300` et cesser de fonctionner après 5 minutes).
- Dans les journaux Render, la ligne `Stockage des fichiers : Neon Object Storage (S3)` confirme la configuration.
- Va sur `https://archivix-backend.onrender.com/api/health` pour un test rapide du backend.
- Connecte-toi en super-admin sur `https://archivix-frontend.onrender.com/superadmin/connexion`.
- Recharge la page sur une route profonde comme `/app/documents` pour vérifier que la règle de réécriture fonctionne (pas de 404).

## 6. Option : stockage dans le Google Drive de chaque client

Chaque organisation cliente peut connecter **son propre** Google Drive (menu **Paramètres**, réservé aux administrateurs). Ses documents y sont alors enregistrés, dans un dossier « Archivix — Nom de l'organisation » avec un sous-dossier par département. Tant que tu ne configures pas cette partie, le bouton reste désactivé et les fichiers sont stockés sur Neon.

Archivix ne demande que l'autorisation `drive.file` : il n'accède qu'aux fichiers qu'il a lui-même créés, jamais au reste du Drive du client. Google classe cette autorisation comme « non sensible », ce qui allège sa vérification.

### 6.1 Créer le projet et l'identifiant OAuth (gratuit)

1. Va sur https://console.cloud.google.com → crée un projet (ex. « Archivix »).
2. **API et services → Bibliothèque** → cherche **Google Drive API** → **Activer**.
3. **Google Auth Platform** (anciennement « Écran de consentement OAuth ») :
   - **Branding** : nom de l'application (« Archivix »), e-mail d'assistance, logo, lien vers la page d'accueil (`https://archivix-frontend.onrender.com`) et vers la politique de confidentialité (`https://archivix-frontend.onrender.com/confidentialite`, déjà intégrée à l'application ; pense à y remplacer l'adresse de contact dans `frontend/src/pages/Privacy.jsx`).
   - **Audience** : type d'utilisateur **Externe**.
   - **Data Access** (accès aux données) : ajoute l'autorisation `.../auth/drive.file`.
4. **Google Auth Platform → Clients → Créer un client** :
   - Type : **Application Web**
   - **URI de redirection autorisés** : `https://archivix-backend.onrender.com/api/integrations/google-drive/callback` (remplace par l'URL de ton backend ; en local : `http://localhost:5000/api/integrations/google-drive/callback`).
   - Récupère l'**ID client** et le **code secret du client**.

### 6.2 Variables d'environnement du backend (Render → Environment)

- `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` : les valeurs de l'étape 6.1
- `GOOGLE_REDIRECT_URI` : exactement la même URI que celle déclarée chez Google
- `GOOGLE_TOKEN_ENCRYPTION_KEY` : clé qui chiffre les autorisations Google enregistrées en base. Génère-la avec
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  ⚠️ Garde-la précieusement et ne la change pas : si elle change, chaque client devra reconnecter son Drive.

### 6.3 ⚠️ Publier l'application (indispensable)

Tant que l'application est en statut **Test** (Google Auth Platform → **Audience**), seuls les comptes ajoutés comme testeurs (100 maximum) peuvent la connecter, et **leur autorisation expire au bout de 7 jours** : les clients verraient alors « reconnectez Google Drive » chaque semaine. Pour tes essais, ajoute ton propre compte comme testeur ; avant d'ouvrir l'option à tes clients, clique **Publier l'application** (statut **En production**) et suis la vérification demandée par Google.

### 6.4 Tester

Connecte-toi en administrateur d'une organisation → **Paramètres** → **Connecter Google Drive** → accepte l'autorisation → archive un document → vérifie qu'il apparaît dans le Drive, dans `Archivix — …/Nom du département/`.

## 7. Notifications sur téléphone, tablette et ordinateur

1. Génère une paire de clés **une seule fois** (ne la change plus ensuite, sinon les appareils devront se réabonner) :
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Dans Render → service **Archivix** → **Environment**, ajoute `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` et `VAPID_SUBJECT` (`mailto:` suivi de ton adresse de contact).
3. Chaque utilisateur active les notifications depuis la cloche → **Activer** :
   - ordinateur (Chrome, Edge, Firefox, Safari) et Android : directement ;
   - iPhone / iPad (iOS 16.4 ou plus) : d'abord **Partager → Sur l'écran d'accueil**, puis ouvrir Archivix depuis l'icône et activer.

## 8. E-mails automatiques (Brevo)

Archivix envoie des e-mails pour : l'invitation d'un membre (il choisit lui-même son mot de passe),
« mot de passe oublié », le rappel 3 jours avant la fin de l'abonnement puis à l'expiration, la
validation ou le refus d'une demande d'abonnement, et l'alerte au super-admin à chaque nouvelle demande.

Render bloque les ports SMTP sur le plan gratuit : Archivix passe donc par l'**API HTTP de Brevo**
(plan gratuit : 300 e-mails par jour, accès API inclus).

1. Créez un compte gratuit sur brevo.com.
2. **Expéditeurs** : ajoutez et validez l'adresse d'envoi (par défaut `supportarchivix@gmail.com`).
   Brevo refuse les envois depuis une adresse non validée. À terme, envoyez depuis une adresse de
   votre propre nom de domaine (ex. `no-reply@archivix.ml`) authentifiée par SPF/DKIM : les e-mails
   arrivent beaucoup moins souvent dans les indésirables.
3. **Clés API** : créez une clé API (pas une clé SMTP).
4. Render → backend → Environment :
   | Variable | Valeur |
   |---|---|
   | `BREVO_API_KEY` | la clé API |
   | `MAIL_FROM_EMAIL` | l'adresse validée à l'étape 2 |
   | `MAIL_FROM_NAME` | `Archivix` |
   | `FRONTEND_URL` | l'adresse du site (déjà réglée à l'étape 4) : elle sert aux liens des e-mails |
5. Testez « Mot de passe oublié » depuis la page de connexion.

Sans clé Brevo, tout fonctionne sauf les e-mails : l'administrateur doit alors donner un mot de passe
temporaire à chaque nouveau membre, qui le change à sa première connexion.

**Fin d'abonnement** : l'organisation passe en **lecture seule** (consultation et téléchargement
toujours possibles ; ajout, modification, partage et invitations suspendus) jusqu'à la validation
d'un paiement par le super-admin.

## Limites du plan gratuit (à connaître)

- Render free (Web Service) : mise en veille après inactivité (cold start ~30-60s), 750h/mois gratuites par workspace.
- Render free (Static Site) : gratuit, sans limite de temps — pas de mise en veille.
- Neon free : 1 Go de base et 5 Go de fichiers par projet, 100 heures de calcul par mois et par projet. La base se met en veille après 5 minutes sans activité et se réveille à la requête suivante (quelques secondes). Si un quota mensuel est atteint, le projet est suspendu jusqu'au mois suivant, sans facturation.
- Prévoir un passage en payant (quelques dollars/mois sur le Web Service) avant un vrai lancement commercial avec des clients qui paient — le gratuit est parfait pour tester et faire une démo.
