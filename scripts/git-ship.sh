#!/usr/bin/env bash
# =============================================================================
# Commit + push (+ versionnement optionnel) en une seule commande
# =============================================================================
# Usage :
#   ./scripts/git-ship.sh "feat: description du changement"
#   ./scripts/git-ship.sh "chore: release v0.2.0" --release 0.2.0
#
# Le second forme met à jour VERSION + frontend/package.json, commit, tag v0.2.0,
# puis pousse la branche courante et les tags (--follow-tags).
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
      echo "  $0 \"chore: release v0.2.0\" --release 0.2.0"
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
  if command -v sed >/dev/null; then
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$RELEASE\"/" frontend/package.json
    rm -f frontend/package.json.bak
  else
    echo "Erreur : sed introuvable." >&2
    exit 1
  fi
  echo "Version mise à jour : $RELEASE (VERSION + frontend/package.json)"
fi

echo ">>> git add -A"
git add -A

if git diff --staged --quiet; then
  echo "Rien à committer (index vide)."
  exit 0
fi

echo ">>> git status (résumé)"
git status -sb

echo ">>> git commit -m \"$MSG\""
git commit -m "$MSG"

if [[ -n "$RELEASE" ]]; then
  TAG="v$RELEASE"
  if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "Erreur : le tag $TAG existe déjà." >&2
    exit 1
  fi
  echo ">>> git tag -a $TAG -m \"Release $TAG\""
  git tag -a "$TAG" -m "Release $TAG"
fi

echo ">>> git push -u origin $BRANCH --follow-tags"
git push -u origin "$BRANCH" --follow-tags

echo "Terminé (branche : $BRANCH)."
