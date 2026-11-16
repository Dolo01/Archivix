# Déployer Archivix gratuitement (sans nom de domaine)

Ce guide utilise deux services gratuits, sans carte bancaire requise pour démarrer :

- **Supabase** → base de données PostgreSQL + stockage des fichiers (permanent, gratuit, ne s'efface jamais)
- **Render** → backend (Web Service) **et** frontend (Static Site), les deux gratuits

Tout se pilote depuis un seul tableau de bord Render, avec des adresses du type `xxxx.onrender.com` — pas besoin de nom de domaine pour tester.

---

## 1. Base de données + stockage (Supabase)

1. Va sur https://supabase.com → crée un compte gratuit → **New project**.
2. Choisis un mot de passe pour la base (note-le, tu en as besoin juste après) et une région proche (Europe de l'Ouest si possible).
3. Une fois le projet créé, va dans **Project Settings → Database → Connection string → URI**. Copie-la : elle ressemble à
   ```
   postgresql://postgres.xxxxx:[TON-MOT-DE-PASSE]@aws-0-xxxx.pooler.supabase.com:6543/postgres
   ```
   Remplace `[TON-MOT-DE-PASSE]` par le mot de passe choisi à l'étape 2. **C'est ta variable `DATABASE_URL`.**
4. Va dans **Storage** (menu de gauche) → **New bucket** → nomme-le `archivix` → laisse **Public bucket** **décoché** → crée-le.

   🔒 Le bucket doit être **privé** : Archivix ouvre chaque document avec un lien temporaire (5 minutes), délivré après vérification des droits. **Si ton bucket existe déjà en public**, ouvre ses réglages (**Edit bucket**) et décoche **Public bucket** : les anciennes adresses publiques cesseront de fonctionner, et les documents existants resteront accessibles normalement depuis Archivix.
5. Va dans **Project Settings → API** :
   - Copie **Project URL** → c'est `SUPABASE_URL`
   - Copie la clé **service_role** (pas la clé `anon` !) → c'est `SUPABASE_SERVICE_ROLE_KEY`. Cette clé est secrète, ne la mets jamais dans le frontend.

> Pourquoi Supabase et pas la base gratuite de Render : la base Postgres gratuite de Render s'auto-détruit 30 jours après sa création (+14 jours de sursis pour passer en payant). Celle de Supabase, elle, reste gratuite sans expiration. On garde donc Render uniquement pour le code (backend + frontend), qui lui n'a pas ce problème.

## 2. Backend (Render — Web Service)

1. Mets ton dossier `archivix/` sur GitHub (crée un repo, `git init` puis `git push` si ce n'est pas déjà fait).
2. Va sur https://render.com → connecte ton compte GitHub → **New → Web Service** → choisis ton repo.
3. Configure :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command** : `node src/server.js`
   - **Instance Type** : Free
4. Dans l'onglet **Environment**, ajoute toutes les variables de `backend/.env.example`, avec tes vraies valeurs :
   - `DATABASE_URL` (celle de Supabase, étape 1.3)
   - `JWT_SECRET` (invente une longue chaîne aléatoire)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=archivix`
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
- Archive un document → vérifie dans Supabase (**Storage → archivix**) que le fichier est bien apparu, puis ouvre-le depuis Archivix (le lien doit contenir `token=` et cesser de fonctionner après 5 minutes).
- Va sur `https://archivix-backend.onrender.com/api/health` pour un test rapide du backend.
- Connecte-toi en super-admin sur `https://archivix-frontend.onrender.com/superadmin/connexion`.
- Recharge la page sur une route profonde comme `/app/documents` pour vérifier que la règle de réécriture fonctionne (pas de 404).

## 6. Option : stockage dans le Google Drive de chaque client

Chaque organisation cliente peut connecter **son propre** Google Drive (menu **Paramètres**, réservé aux administrateurs). Ses documents y sont alors enregistrés, dans un dossier « Archivix — Nom de l'organisation » avec un sous-dossier par département. Tant que tu ne configures pas cette partie, le bouton reste désactivé et tout continue de fonctionner avec Supabase.

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

## Limites du plan gratuit (à connaître)

- Render free (Web Service) : mise en veille après inactivité (cold start ~30-60s), 750h/mois gratuites par workspace.
- Render free (Static Site) : gratuit, sans limite de temps — pas de mise en veille.
- Supabase free : 500 Mo de base de données, 1 Go de stockage de fichiers ; le projet peut être mis en pause après une longue inactivité (une simple visite du tableau de bord suffit à le relancer).
- Prévoir un passage en payant (quelques dollars/mois sur le Web Service) avant un vrai lancement commercial avec des clients qui paient — le gratuit est parfait pour tester et faire une démo.
