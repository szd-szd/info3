# GitHub, CI/CD, Netlify et versionnement

Ce guide décrit comment connecter ce dépôt à **GitHub**, activer la **CI** (lint, audit, build), le **déploiement Netlify**, et le **versionnement**.

---

## 1. Initialiser Git et pousser vers GitHub

Sur votre machine, à la racine du projet (`Info1/`) :

```bash
cd /chemin/vers/Info1
git init
git branch -M main
git add .
git status   # vérifiez qu’aucun .env / secret n’apparaît
git commit -m "chore: initial import RH Portal"
```

Sur [GitHub](https://github.com/new), créez un dépôt **vide** (sans README généré pour éviter un conflit), puis :

### Option A — HTTPS + **Personal Access Token** (recommandé si SSH bloque)

1. Créez un token GitHub :  
   **Settings → Developer settings → Personal access tokens**  
   - **Fine-grained** : accès au dépôt `info3` (ou org), permissions **Contents** = Read and write.  
   - ou **Classic** : scope **`repo`** (dépôt privé) ou au minimum accès push au bon dépôt.

2. Configurez le dépôt distant en **HTTPS** (pas `git@github.com:`) :

   ```bash
   git remote remove origin 2>/dev/null
   git remote add origin https://github.com/VOTRE_USER/VOTRE_REPO.git
   ```

   (exemple : `https://github.com/szd-szd/info3.git`)

3. Poussez la branche ; Git demande identifiant / mot de passe :

   ```bash
   git push -u origin main
   ```

   - **Username** : votre nom d’utilisateur GitHub (ex. `szd-szd`).  
   - **Password** : collez le **token** (pas le mot de passe du compte GitHub).

   Si rien ne s’affiche : sous Kali, installez / utilisez le **credential helper** pour mémoriser le token une fois :

   ```bash
   git config --global credential.helper store
   ```

   (Le prochain `git push` enregistrera l’URL + identifiants dans `~/.git-credentials` — fichier à protéger, `chmod 600`.)

4. **Ne mettez jamais le token** dans l’URL du remote du style  
   `https://TOKEN@github.com/...` dans un fichier versionné : risque de fuite. Préférez la saisie interactive ou `gh auth login`.

**Erreur `403` / « Permission denied … to USERNAME »** : Git utilise un **autre compte** que celui qui possède le dépôt (souvent des identifiants **mis en cache** pour `github.com`). Par exemple pousser vers `szd-szd/info3` alors que Git s’identifie comme `emmenu`.

- Supprimez les anciennes entrées GitHub dans le cache, puis refaites un `git push` et saisissez **le bon utilisateur** + **le PAT du compte qui a les droits** sur le dépôt :

  ```bash
  # Voir si des identifiants github sont stockés
  grep github ~/.git-credentials 2>/dev/null || true

  # Éditer le fichier et supprimer la ligne qui contient github.com
  nano ~/.git-credentials
  # ou : sed -i '/github.com/d' ~/.git-credentials   # attention : supprime toutes les lignes github
  ```

- Ou désactivez temporairement le stockage : `git config --global --unset credential.helper`, poussez (saisie à chaque fois), puis réactivez `store` si besoin.

- **Autre cas** : le compte `emmenu` doit être **invité en collaborateur** (Write) sur le dépôt `szd-szd/info3` dans les paramètres GitHub du repo.

**Alternative** : [GitHub CLI](https://cli.github.com/) — `gh auth login`, choisir HTTPS, coller le token ; puis `gh repo set-default` si besoin.

### Option B — SSH (`git@github.com:...`)

À utiliser si vous avez déjà une clé SSH enregistrée sur GitHub (voir message d’erreur `Permission denied (publickey)` dans la doc générale).

```bash
git remote add origin git@github.com:VOTRE_ORG/rh-portal.git
git push -u origin main
```

### Accéder et pousser sur **`szd-szd/info3`** (dépôt cible)

L’URL du remote doit rester : `https://github.com/szd-szd/info3.git`.  
GitHub n’accepte un `git push` que si l’identité utilisée a le **droit d’écriture** sur ce dépôt. Deux situations possibles :

#### A — Vous travaillez avec le compte propriétaire **`szd-szd`**

1. Videz les identifiants GitHub **incorrects** (ex. cache de `emmenu`) : voir la section **Erreur 403** ci-dessus (`~/.git-credentials` ou `credential.helper`).
2. `git push` : **Username** = `szd-szd`, **Password** = **PAT créé sur le compte `szd-szd`** avec accès au dépôt `info3`.

#### B — Vous restez connecté en **`emmenu`** mais vous voulez quand même **`info3`**

Le compte **`szd-szd`** (ou un admin du dépôt) doit vous ajouter sur **GitHub** :

**`szd-szd/info3`** → **Settings** → **Collaborators** (ou *Manage access*) → **Add people** → inviter **`emmenu`** avec le rôle **Write** (ou *Maintain*).

Après acceptation de l’invitation, un **PAT du compte `emmenu`** avec scope **`repo`** (classic) ou droits **Contents: Read and write** (fine-grained sur `info3`) suffit pour `git push` vers `szd-szd/info3`.

---

### Option C — Copie personnelle sur `emmenu` (optionnel, hors info3)

Uniquement si vous voulez **en plus** un dépôt miroir sous `emmenu` (fork / backup). Cela **ne remplace pas** l’accès à `info3` : pour modifier **`szd-szd/info3`**, il faut **A** ou **B** ci-dessus.

> **Important** : ne commitez jamais `frontend/.env` ni la clé `service_role` Supabase. Ils sont listés dans `.gitignore`.

---

## 2. CI (GitHub Actions)

Le fichier [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) s’exécute sur chaque **push** et **pull request** vers `main` / `master` :

- `npm ci` dans `frontend/`
- **`npm audit --omit=dev --audit-level=high`** (dépendances de production)
- `npm run lint`
- `npm run build`

Les corrections Dependabot ouvrent des PR ; la CI doit rester verte avant fusion.

---

## 3. Dependabot (mises à jour automatiques)

Le fichier [`.github/dependabot.yml`](../.github/dependabot.yml) suit :

- les paquets **npm** dans `frontend/` (hebdomadaire) ;
- les **GitHub Actions** (mensuel).

Après le premier push, l’onglet **Security → Dependabot** du dépôt GitHub s’active (selon les droits du compte).

---

## 4. Déploiement Netlify (recommandé : lien Git)

Méthode la plus simple pour **chaque push** = build + déploiement sans secret GitHub supplémentaire :

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Choisissez **GitHub**, autorisez Netlify, sélectionnez le dépôt.
3. Paramètres de build (souvent détectés via `netlify.toml`) :
   - **Base directory** : `frontend`
   - **Build command** : `npm ci && npm run build`
   - **Publish directory** : `frontend/dist`
4. **Site settings → Environment variables** : ajoutez  
   `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé **anon** uniquement).
5. Dans **Supabase → Authentication → URL configuration**, ajoutez l’URL Netlify (`https://votre-site.netlify.app` et éventuellement les **Deploy previews**).

Le fichier [`netlify.toml`](../netlify.toml) à la racine fixe déjà `base = "frontend"` et les en-têtes de sécurité de base.

---

## 5. Déploiement via GitHub Actions (optionnel)

Le workflow [`.github/workflows/deploy-netlify.yml`](../.github/workflows/deploy-netlify.yml) déploie en **production** avec la CLI Netlify.

1. Netlify → **User settings → Applications → Personal access tokens** : créez un token.
2. **Site settings → General → Site details** : copiez le **Site ID**.
3. Sur GitHub : **Settings → Secrets and variables → Actions** : créez  
   `NETLIFY_AUTH_TOKEN` et `NETLIFY_SITE_ID`.

Déclenchement : **Actions → Deploy Netlify → Run workflow** (événement `workflow_dispatch`).

Pour déclencher aussi à chaque push sur `main`, ajoutez dans le fichier YAML :

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

(sans secrets configurés, l’étape Netlify échouera — configurez les secrets avant d’activer le `push`.)

---

## 6. Versionnement

- Fichier [`VERSION`](../VERSION) : version « produit » du dépôt (ex. `0.1.0`).
- [`frontend/package.json`](../frontend/package.json) : champ `"version"` à garder **aligné** avec `VERSION` lors des releases.

Exemple de release :

```bash
# Mettre à jour VERSION et frontend/package.json (ex. 0.2.0)
git add VERSION frontend/package.json
git commit -m "chore: release v0.2.0"
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main --tags
```

---

## 7. Sécurité

Voir [`SECURITY.md`](../SECURITY.md) pour la politique de signalement.

Résumé : secrets hors dépôt, audit en CI, Dependabot, en-têtes HTTP dans `netlify.toml`.
