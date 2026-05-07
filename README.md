# RH Portal — application de gestion RH (frontend + Supabase)

Monorepo minimal : **frontend** (React, Vite, TypeScript) et **supabase** (migrations SQL + seed).

## Prérequis

- Node.js 20+ (ou 22)
- Un projet [Supabase](https://supabase.com/dashboard) (gratuit possible)
- Optionnel : [Docker](https://docs.docker.com/get-docker/) et [CLI Supabase](https://supabase.com/docs/guides/cli) pour le développement local

## Configuration Supabase

1. Créer un projet sur le [tableau de bord Supabase](https://supabase.com/dashboard).
2. Dans **SQL Editor**, exécuter le fichier `supabase/migrations/20240507120000_initial_schema.sql` (ou util `supabase db push` si vous utilisez la CLI).
3. (Optionnel) Exécuter `supabase/seed.sql` pour insérer des employés factices.
4. **Authentication** → activer « Email » (mot de passe).  
   - **URL Configuration** : définir **Site URL** sur l’URL que vous utilisez dans le navigateur (ex. `http://127.0.0.1:5320` ou `http://127.0.0.1:5243` en Docker), avec le schéma `http://` ou `https://`.  
   - **Redirect URLs** : ajoutez au minimum les motifs suivants pour que l’inscription et la confirmation d’e-mail fonctionnent :  
     `http://127.0.0.1:5320/**`, `http://localhost:5320/**`, `http://127.0.0.1:5243/**`, `http://localhost:5243/**` (ajustez le port si vous utilisez `HOST_PORT`).  
5. **Compte administrateur (RH)** — au choix :  
   - **Script (recommandé)** : avec la clé **service_role** (Dashboard → **Settings** → **API** ; ne jamais la mettre dans le frontend ni dans Git) :  
     ```bash
     cd /chemin/vers/Info1
     SUPABASE_URL="https://xxxx.supabase.co" \
     SUPABASE_SERVICE_ROLE_KEY="eyJhbG..." \
     ADMIN_EMAIL="rh@entreprise.com" \
     ADMIN_PASSWORD="VotreMotDePasseSecurise!" \
     node scripts/create-rh-admin.mjs
     ```  
     Puis connectez-vous sur l’app avec cet e-mail / mot de passe → accès **/admin**.  
   - **SQL Editor** : ouvrez [`supabase/sql-editor-create-admin-rh.sql`](./supabase/sql-editor-create-admin-rh.sql), modifiez l’e-mail et le mot de passe en tête du bloc `DO`, collez dans **SQL Editor** et exécutez.  
   - **Manuel** : créer un compte via **Inscription** sur l’app, puis dans **SQL Editor** :  
     ```sql
     update public.profiles
     set role = 'rh', employee_id = null
     where user_id = 'VOTRE_UUID_AUTH_USERS';
     ```  
     (UUID dans **Authentication → Users**.)
6. Créer des fiches **Employés** depuis l’admin : l’e-mail doit correspondre à celui utilisé par l’employé à l’inscription pour le rattachement automatique (trigger `handle_new_user`).

### Erreur : « Email address "…" is invalid »

Ce message vient **d’Auth Supabase** (pas du simple format du navigateur). Pistes :

- **Copier-coller** : caractères invisibles ou espaces dans l’adresse. L’app **normalise** maintenant l’e-mail (Unicode, espaces) ; retapez aussi l’adresse à la main pour tester.
- **Confirmation d’e-mail** activée : l’envoi du mail peut déclencher une validation DNS / SMTP côté serveur ; en dev, désactivez **Confirm email** (Authentication → Providers → Email) ou configurez **SMTP personnalisé** (Authentication → SMTP Settings).
- **Auth hooks** (« Before user created », etc.) : un hook peut rejeter l’inscription ; consultez les logs du hook dans le dashboard.
- **Adresses autorisées** (liste restreinte côté projet) : le message habituel est plutôt « not authorized » ; vérifiez quand même la config avancée / variables d’environnement du projet si vous avez restreint les domaines.

### Erreur à l’inscription : « Invalid path specified in request URL »

Souvent :

- **`VITE_SUPABASE_URL`** incorrect dans `frontend/.env` : utiliser uniquement la **Project URL** (ex. `https://xxx.supabase.co`), **sans** `/rest/v1` ni `/auth/v1` à la fin.  
- **Redirect URLs** ou **Site URL** dans Supabase ne correspondent pas à l’URL ouverte dans le navigateur (ex. `127.0.0.1` vs `localhost`, ou port 5243 vs 5320). Ajoutez les deux hôtes et le bon port, avec `/**` en suffixe dans Redirect URLs.  
- En dev, vous pouvez désactiver temporairement **Confirm email** (Authentication → Providers → Email) pour éviter les liens de confirmation tant que les URL ne sont pas stabilisées.

## Développement local (sans Docker)

```bash
cd frontend
cp ../.env.example .env
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (Settings → API)
npm install
npm run dev
```

Ouvrir http://127.0.0.1:5320 (port Vite du projet, distinct de 5173)

## Docker (développement local)

**Prérequis** : [Docker](https://docs.docker.com/engine/install/) avec **Docker Compose v2**.

1. Avoir un fichier **`frontend/.env`** (ex. copie de `.env.example`) avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Il est monté dans le conteneur avec le reste du dossier `frontend/`.
2. À la **racine du dépôt** :

```bash
docker compose up
```

3. Au premier lancement, `npm install` peut prendre une minute. Ouvrir **http://127.0.0.1:5243** (recommandé) ou **http://localhost:5243** .

**Autre port** : `HOST_PORT=5180 docker compose up` puis utilisez **http://127.0.0.1:5180** (variable `DOCKER_HMR_CLIENT_PORT` suit automatiquement `HOST_PORT` pour le rechargement à chaud).

**Linux — toujours erreur -101** : essayez le mode **réseau hôte** (sans publication de port) :

```bash
docker compose -f docker-compose.host-network.yml down
docker compose -f docker-compose.host-network.yml up
```

Puis **http://127.0.0.1:5243** .

**Si ce port est déjà pris** : choisissez un `HOST_PORT` libre ou arrêtez le service qui occupe le port.

**Arrêt** : `Ctrl+C`, puis si besoin `docker compose down`.

Les modules NPM sont dans un volume **`frontend_node_modules`** pour éviter les mélanges avec un `node_modules` installé sur votre machine (OS différent du conteneur Linux).

**Erreur npm `ENOTEMPTY` / `rename ... acorn`** : le volume `node_modules` était dans un état incohérent. Le script `docker/entrypoint-dev.sh` **vide le contenu** de `node_modules` avant chaque `npm install` (sans supprimer le point de montage Docker — un `rm -rf node_modules` échouerait avec « Device or resource busy »). Pour **réinitialiser complètement** le volume :

```bash
docker compose down -v
docker compose up
```

Après une première installation réussie, vous pouvez accélérer les redémarrages avec  
`NPM_PRESERVE_NODE_MODULES=1 docker compose up` (ne supprime plus `node_modules` avant install ; à éviter si npm re-échoue).

### Si le navigateur affiche une erreur (ex. code **-101**)

Souvent : **rien n’écoute** sur le port, le conteneur a quitté, ou **Vite refuse l’en-tête `Host`** (connexion coupée). Le projet force `allowedHosts` et le port **HMR** côté client pour Docker ; le compose publie sur **127.0.0.1:5243** pour limiter les soucis IPv6.

1. **Recréer le conteneur** après mise à jour : `docker compose down && docker compose up` (sans `-d` la première fois pour lire les logs).
2. **Lancer en avant-plan** et vérifier que Vite affiche « ready » sans erreur `npm`.
3. **URL** : **http://127.0.0.1:5243** (prioritaire sur `localhost`).
4. **Logs** : `docker compose logs frontend --tail 100` ; si le conteneur redémarre en boucle, copier la trace complète.
5. **Navigateur externe** (Firefox / Chrome), pas l’aperçu intégré à l’éditeur.
6. **Pare-feu** : `sudo ufw status` — autoriser **5243** si besoin.
7. **Alternative Linux** : `docker compose -f docker-compose.host-network.yml up` puis **http://127.0.0.1:5243** .

## Build production

```bash
cd frontend && npm install && npm run build
```

Les fichiers statiques sont dans `frontend/dist`.

## GitHub, CI/CD, Netlify et versionnement

Guide pas à pas : **[`docs/GITHUB_NETLIFY_SETUP.md`](docs/GITHUB_NETLIFY_SETUP.md)** (connexion GitHub, CI, Dependabot, Netlify, tags, secrets).

- **CI** : [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — `npm ci`, **`npm audit`** (prod, niveau high), lint, build.
- **Déploiement Netlify** : intégration **Git → Netlify** (recommandé) + `netlify.toml` ; optionnel : [`.github/workflows/deploy-netlify.yml`](.github/workflows/deploy-netlify.yml) (déclenchement manuel).
- **Dependabot** : [`.github/dependabot.yml`](.github/dependabot.yml).
- **Version** : fichier [`VERSION`](VERSION) (aligné sur `frontend/package.json`).
- **Signalement sécurité** : [`SECURITY.md`](SECURITY.md).

## Déploiement Netlify (rappel)

- Relier le dépôt GitHub à Netlify (**Import from Git**).
- `netlify.toml` : `base = frontend`, build, `dist`, en-têtes de sécurité.
- Variables Netlify : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Supabase → URL de redirection : domaine Netlify + previews si besoin.

## Sécurité (application)

- Seule la clé **anon** est exposée au navigateur ; jamais la clé `service_role`.
- Les accès sont imposés par **Row Level Security** (PostgreSQL) sur `employees`, `profiles`, `leave_requests`.

## Documentation fonctionnelle

Voir `docs/SPECIFICATION-APP-RH.md`.
# info3
