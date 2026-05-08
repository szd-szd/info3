# Spécification — Application de gestion des ressources humaines

**Nom de projet (proposé)** : *RH Portal* (ou à renommer selon l’entreprise)  
**Version du document** : 1.0  
**Date** : 7 mai 2026  

---

## 1. Vision et objectifs

Application web pour la **gestion du personnel** au sein d’une entreprise, avec :

- une **interface administrateur** réservée au service RH : saisie et maintenance des données employés, validation des demandes, pilotage ;
- une **interface employé** : consultation de l’espace personnel (profil synthétique, soldes, documents utiles) et **demandes de congés** (création, suivi du statut).

**Objectifs principaux** : centraliser l’information RH de base, réduire les allers-retours e-mail pour les congés, tracer les demandes, et respecter des **règles d’accès strictes** (qui voit quoi).

---

## 2. Périmètre fonctionnel (MVP recommandé)

### 2.1 Espace RH (administrateur)

- Authentification sécurisée (comptes dédiés RH / rôles).
- **Gestion des employés** : création / édition / désactivation (sans supprimer l’historique des demandes si possible).
- Champs typiques : identité, poste, service, manager, date d’entrée, contact pro, éventuellement matricule interne.
- **Tableau de bord** : vue des demandes en attente, indicateurs simples (ex. nombre de congés en attente).
- **Traitement des congés** : accepter / refuser une demande, commentaire optionnel, notification (e-mail ou in-app selon choix technique).
- **Paramètres RH** (phase ultérieure possible) : types de congés, soldes — pour le MVP, soldes peuvent être manuels ou calculés simplement.

### 2.2 Espace employé

- Authentification (même identité que le profil `employees`, lié à Supabase Auth).
- **Mon profil** (lecture, éventuellement mise à jour limitée : ex. téléphone personnel si autorisé).
- **Congés** : formulaire de demande (dates, type, motif optionnel), liste des demandes avec statuts (`en_attente`, `approuve`, `refuse`, `annule`).
- (Optionnel MVP+) **Pièces jointes** justificatives, export PDF, calendrier d’équipe restreint.

### 2.3 Hors périmètre MVP (évolutions)

- Paie, pointeuse temps réel, entretiens annuels structurés, multi-pays / conformité légale détaillée (à préciser avec un juriste RH).

---

## 3. Architecture technique

### 3.1 Vue d’ensemble

| Couche | Technologie proposée | Rôle |
|--------|----------------------|------|
| Frontend | SPA moderne (ex. **React + Vite** ou **Next.js** si besoin SSR) | UI admin + employé, routage par rôle |
| Backend / données | **Supabase** (PostgreSQL, Auth, Row Level Security, Storage optionnel) | Persistance, API auto-générée, règles de sécurité au plus près des données |
| Hébergement UI | **Netlify** | Build, CDN, déploiement continu depuis Git |
| Auth | Supabase Auth | Magic link, e-mail/mot de passe, ou SSO (enterprise plus tard) |

**Remarque** : Un backend NestJS séparé n’est **pas requis** si toute la logique métier peut être couverte par des **politiques RLS**, des **Edge Functions** Supabase, et du typage côté client. Si des intégrations lourdes (ERP) sont prévues, on pourra ajouter un backend plus tard.

### 3.2 Schéma logique (haut niveau)

```
[Navigateur]
    |
    v
[Frontend sur Netlify]  --HTTPS-->  [Supabase: Auth + Postgres + RLS]
                      [Secrets: URL + anon key]
```

- Le frontend utilise le **client Supabase** (`@supabase/supabase-js`) avec la clé `anon` (publique) ; les accès réels sont bornés par **RLS** et le JWT utilisateur.

### 3.3 Modèle de données (ébauche)

Entités minimales (tables PostgreSQL) :

- `profiles` ou extension de `auth.users` : lien `user_id`, `role` (`rh` | `employee`), `employee_id` nullable pour les comptes RH purs.
- `employees` : données métier employé, `user_id` unique quand le compte est activé.
- `leave_requests` : `employee_id`, dates début/fin, `type`, `status`, `comment_employee`, `comment_rh`, timestamps, `handled_by` (user RH).

Les détails des colonnes et contraintes (CHECK sur dates, exclusion de chevauchement, etc.) seront figés lors de la phase d implementation.

---

## 4. Frontend (détails)

### 4.1 Structure UI

- **Deux zones** : routes `/admin/*` (layout RH) et `/app/*` ou `/employee/*` (layout employé).
- **Garde de route** : après chargement de la session Supabase, vérifier le `role` depuis `profiles` (ou claim JWT si on synchronise le rôle dans les métadonnées — à documenter lors du dev).

### 4.2 États et données

- React Query / TanStack Query (ou équivalent) pour le cache et la synchronisation.
- Formulaires avec validation (ex. Zod + react-hook-form).

### 4.3 Variables d’environnement (Netlify)

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (ou préfixe adapté au framework).
- **Ne jamais** exposer la `service_role` key côté client.

---

## 5. Supabase

### 5.1 Projets et environnements

- Projet **dev** et **prod** (ou branches Supabase si utilisées).
- Migrations versionnées (SQL ou CLI Supabase) dans le dépôt Git.

### 5.2 Sécurité au niveau base (RLS)

- **Activer RLS** sur toutes les tables contenant des données personnelles.
- Politiques typiques :
  - un employé ne lit / met à jour que **ses** lignes (`employee_id` ou `user_id` = `auth.uid()` selon modèle) ;
  - un utilisateur `role = rh` peut lire / mettre à jour l’ensemble des employés et des demandes ;
  - insertion de `leave_requests` : seulement pour soi-même (employé).

### 5.3 Fonctions et triggers (si besoin)

- Trigger `updated_at`, agrégation de soldes, ou log d’audit (table `audit_log` en option).

---

## 6. Docker

### 6.1 Objectif

Uniformiser l’**environnement de développement** : même version de Node, scripts npm/pnpm, et optionnellement **Supabase local** via la stack officielle (CLI Supabase + Docker).

### 6.2 Livrables proposés

- `Dockerfile` (multi-stage) pour le frontend : build + image nginx légère **ou** image node pour preview — selon préférence d’équipe.
- `docker-compose.yml` à la racine (ou dans `./docker/`) :
  - service `frontend` : montage du code, `npm run dev` avec ports exposés ;
  - option `supabase` : documentation « lancer `supabase start` » plutôt que tout recâbler si la CLI gère déjà les conteneurs.

### 6.3 CI vs local

- **Netlify** ne déploie pas obligatoirement l’image Docker du frontend ; Docker sert surtout au dev et à des tests locaux. Une **GitHub Action** peut builder l’image pour vérifier que le Dockerfile reste valide (optionnel).

---

## 7. CI/CD (GitHub)

### 7.1 Principes

- Chaque **pull request** : lint, tests unitaires, build production du frontend.
- Branche **main** (ou `production`) : déploiement automatique vers Netlify (via intégration Netlify–GitHub **ou** action dédiée avec token).

### 7.2 Workflows GitHub Actions (exemples)

1. **`ci.yml`** (sur `pull_request` + `push`)  
   - Checkout, installation deps (cache), `npm run lint`, `npm run test`, `npm run build`.  
   - Secrets : aucun obligatoire si pas de déploiement depuis cette job.

2. **`deploy.yml`** (sur `push` vers branche de prod) — *si non géré par Netlify nativement*  
   - Build, puis `netlify deploy --prod` avec `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.

### 7.3 Supabase migrations en CI (recommandé)

- Job optionnel : vérifier que les migrations SQL s’appliquent sur une base vierge (docker-service postgres + script), pour éviter les migrations cassées.

### 7.4 Gestion des secrets GitHub

- `SUPABASE_*` pour scripts de seed / tests d’intégration (environnement **staging** uniquement).
- Pas de `service_role` dans des workflows exposés publiquement sans garde-fous.

---

## 8. Sécurité de l’application

### 8.1 Authentification et sessions

- Politique de mots de passe / MFA selon policy entreprise (Supabase supporte MFA côté auth).
- Durée de session et refresh tokens gérés par Supabase ; frontend ne stocke pas de secrets additionnels en clair.

### 8.2 Autorisation

- **Source de vérité** : RLS + vérifications UI (l’UI n’est pas une barrière de sécurité seule).
- Principe du moindre privilège pour les comptes de service (clé `service_role` uniquement côté serveur / Edge Functions).

### 8.3 Données personnelles (RGPD — rappel)

- Minimiser les données collectées, durée de conservation, droit d’accès / suppression (procédure à définir avec la direction).
- Journalisation des accès admin sensibles (qui a validé quelle demande).

### 8.4 Frontend

- En-têtes de sécurité sur Netlify (`Content-Security-Policy` progressive), HTTPS obligatoire, pas de secrets dans le dépôt.
- Dépendances : Dependabot / `npm audit` en CI.

### 8.5 API et Edge Functions

- Si logique métier sensible (ex. double validation RH), préférer une **Edge Function** avec la `service_role` **uniquement** côté fonction, jamais exposée au navigateur.

---

## 9. Déploiement sur Netlify

### 9.1 Configuration

- **Build command** : `npm run build` (ou `pnpm build`).
- **Publish directory** : `dist` (Vite) ou `out` / `.next` selon framework.
- Fichier `netlify.toml` : redirections SPA (`/*` → `/index.html` pour une SPA), en-têtes de cache pour les assets.

### 9.2 Connexion à Supabase en production

- Renseigner les variables d’environnement dans l’UI Netlify.
- Autoriser les **URL de redirection** Supabase pour le domaine Netlify (Auth settings).

### 9.3 Preview deployments

- Activer les **deploy previews** Netlify pour chaque PR ; utiliser un projet Supabase **staging** avec des données factices.

---

## 10. Critères d’acceptation (MVP)

- Un compte RH peut créer un employé et associer (ou inviter) un compte utilisateur.
- Un employé voit uniquement ses informations et ses demandes de congé.
- Un employé peut soumettre une demande ; un RH peut l’approuver ou la refuser ; le statut est visible côté employé.
- Les accès sont enforce **côté base** (RLS) : un test automatisé ou un script de vérification des politiques est un plus.
- CI verte sur PR : lint + build (+ tests si présents).
- Documentation README : comment lancer avec Docker / Supabase local et comment déployer.

---

## 11. Glossaire

| Terme | Signification |
|-------|----------------|
| RLS | Row Level Security (PostgreSQL) |
| MVP | Produit minimum viable |
| RH | Ressources humaines |

---

## 12. Prompt de démarrage pour le développement

Copier-coller le bloc suivant dans une nouvelle conversation (ou la suite de ce fil) pour lancer l’implémentation :

---

**PROMPT — Démarrage développement RH Portal**

Tu es chargé d’implémenter l’application décrite dans `docs/SPECIFICATION-APP-RH.md` du dépôt.

**Stack imposée** : frontend moderne (React + Vite + TypeScript par défaut), Supabase (Auth + PostgreSQL + RLS strictes), hébergement prévu sur Netlify, GitHub Actions pour CI (lint + test + build), Docker pour le dev local (Dockerfile + docker-compose avec service frontend ; documenter Supabase local via CLI).

**Livrables attendus dans l’ordre** :

1. Initialiser le frontend (Vite React TS), installer `@supabase/supabase-js`, structurer les dossiers (`/admin`, `/employee` ou équivalent), routing et protection des routes selon le rôle lu depuis Supabase.
2. Fournir les **fichiers SQL de migration** Supabase : tables `profiles`, `employees`, `leave_requests`, index, triggers utiles, et **politiques RLS complètes** (employé vs RH). Inclure un seed minimal pour développement local.
3. Implémenter les écrans MVP :  
   - RH : liste employés, formulaire création/édition, liste des demandes de congé avec actions approuver/refuser.  
   - Employé : profil lecture, formulaire nouvelle demande, liste des demandes avec statuts.
4. Ajouter `netlify.toml` (SPA fallback, en-têtes de base), `.env.example`, et README avec prérequis, `docker compose up`, lien vers Supabase dashboard, et variables Netlify.
5. Ajouter `.github/workflows/ci.yml` (install, lint, build ; ajouter tests quand présents).
6. Respecter la sécurité : jamais de `service_role` côté client ; valider les entrées ; commentaires brefs sur les parties sensibles (RLS).

**Contrainte** : rester sur le périmètre MVP du document ; ne pas introduire de backend NestJS sauf justification documentée. Commence par créer la structure et les migrations, puis l’UI en réutilisant des composants cohérents (design sobre professionnel).

**Structure du dépôt** : placer le frontend dans un dossier `frontend/` à la racine, à côté de `docs/` et des migrations Supabase versionnées.

---

*Fin du document.*
