#!/usr/bin/env bash
# =============================================================================
# Commit + push (+ versionnement optionnel) en une seule commande
# =============================================================================
# Usage :
#   ./scripts/git-ship.sh "feat: description du changement"
#   ./scripts/git-ship.sh "chore: release v1.0.0" --release 1.0.0
#
# Voir aussi : scripts/release-version.sh (bump ciblé + lockfile npm, idéal pour v1.0.0).
#
# Le second forme met à jour VERSION + frontend/package.json (+ package-lock), commit, tag,
# puis pousse la branche puis le tag vX.Y.Z explicitement (visible sous github.com/…/tags).
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MSG=""
RELEASE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release)
      if [[ -z "${2:-}" ]]; then
        echo "Erreur : --release doit être suivi d’une version (ex. 0.2.0)" >&2
        exit 1
      fi
      RELEASE="$2"
      shift 2
      ;;
    -h | --help)
      echo "Usage : $0 \"message de commit\" [--release X.Y.Z]"
      echo ""
      echo "Exemples :"
      echo "  $0 \"fix: correction login\""
      echo "  $0 \"chore: release v1.0.0\" --release 1.0.0"
      exit 0
      ;;
    *)
      if [[ -n "$MSG" ]]; then
        echo "Erreur : un seul message de commit attendu (argument inattendu : $1)" >&2
        exit 1
      fi
      MSG="$1"
      shift
      ;;
  esac
done

if [[ -z "$MSG" ]]; then
  echo "Usage : $0 \"message de commit\" [--release X.Y.Z]" >&2
  echo "        $0 --help" >&2
  exit 1
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Erreur : pas un dépôt Git (lancez git init)." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ -n "$RELEASE" ]]; then
  if [[ ! "$RELEASE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Erreur : version attendue au format X.Y.Z (ex. 0.2.0), reçu : $RELEASE" >&2
    exit 1
  fi
  echo "$RELEASE" > VERSION
  if ! command -v npm >/dev/null 2>&1; then
    echo "Erreur : npm introuvable (--release met à jour le lockfile via npm version)." >&2
    exit 1
  fi
  (cd "$REPO_ROOT/frontend" && npm version "$RELEASE" --no-git-tag-version)
  echo "Version mise à jour : $RELEASE (VERSION + frontend/package.json + package-lock.json)"
fi

echo ">>> git add -A"
git add -A

if git diff --staged --quiet; then
  if [[ -n "$RELEASE" ]]; then
    echo "Erreur : aucun fichier version modifié (déjà en $RELEASE ?)." >&2
    echo "Pour poser seulement le tag sur le commit actuel : ./scripts/release-version.sh $RELEASE --tag-only" >&2
    exit 1
  fi
  echo "Rien à committer (index vide)."
  exit 0
fi

echo ">>> git status (résumé)"
git status -sb

echo ">>> git commit -m \"$MSG\""
git commit -m "$MSG"

TAG=""
if [[ -n "$RELEASE" ]]; then
  TAG="v$RELEASE"
  if git show-ref --verify --quiet "refs/tags/$TAG"; then
    echo "Erreur : le tag $TAG existe déjà." >&2
    exit 1
  fi
  echo ">>> git tag -a $TAG -m \"Release $TAG\""
  git tag -a "$TAG" -m "Release $TAG"
fi

echo ">>> git push -u origin $BRANCH"
git push -u origin "$BRANCH"
if [[ -n "$TAG" ]]; then
  echo ">>> git push origin $TAG   (tag explicite — visible sur GitHub dans « Tags »)"
  git push origin "$TAG"
fi

echo "Terminé (branche : $BRANCH)."
if [[ -n "$TAG" ]]; then
  echo "Tag local : $TAG  ($(git rev-parse "$TAG" 2>/dev/null | cut -c1-7)…)"
  echo "Lister les tags : git tag -l 'v*' | tail -n 20"
fi
