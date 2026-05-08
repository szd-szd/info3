# Politique de sécurité

## Signaler une vulnérabilité

Merci de **ne pas** ouvrir d’issue publique pour un problème de sécurité sensible.

1. Contactez les mainteneurs du dépôt (message privé GitHub / e-mail défini sur le profil organisation).
2. Décrivez le risque, les étapes de reproduction et l’impact éventuel.

Nous tâcherons de répondre sous **quelques jours ouvrés**.

## Bonnes pratiques du projet

- Ne jamais committer la clé **service_role** Supabase ni de secrets dans le dépôt.
- Variables sensibles : `frontend/.env` (local) et secrets **Netlify** / **GitHub Actions** uniquement.
- Le workflow **CI** exécute `npm audit` sur les dépendances de production (`--omit=dev`).
- **Dependabot** est configuré pour proposer des mises à jour npm et GitHub Actions.
