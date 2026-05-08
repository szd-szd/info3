#!/usr/bin/env bash
# =============================================================================
# Version sémantique + tag Git annoté (v1.0.0) + push vers GitHub
# =============================================================================
# Met à jour : VERSION (racine), frontend/package.json et package-lock.json
# (via npm version --no-git-tag-version).
#
# Usage :
#   ./scripts/release-version.sh 1.0.0
#   ./scripts/release-version.sh 1.0.0 "chore: release v1.0.0"
#   ./scripts/release-version.sh 1.0.0 --no-push          # local seulement
#   ./scripts/release-version.sh 1.0.0 --tag-only         # tag sur HEAD actuel
#   ./scripts/release-version.sh 1.0.0 --tag-only --no-push
#
# Prérequis : npm, dépôt Git, remote origin, branche poussable.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

TAG_ONLY=false
NO_PUSH=false
VERSION_RAW=""
COMMIT_MSG=""

usage() {
  cat <<'EOF'
Usage : scripts/release-version.sh <X.Y.Z> [message de commit] [--tag-only] [--no-push]

  1.0.0                 bump VERSION + frontend (npm), commit, tag v1.0.0, push
  1.0.0 "mon message"   même chose avec message de commit personnalisé
  --tag-only            tag annoté sur HEAD sans modifier les fichiers
  --no-push             commit/tag locaux seulement (pas de git push)

Exemples :
  ./scripts/release-version.sh 1.0.0
  ./scripts/release-version.sh 1.0.0 --no-push
  ./scripts/release-version.sh 1.0.0 --tag-only
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag-only)
      TAG_ONLY=true
      shift
      ;;
    --no-push)
      NO_PUSH=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Option inconnue : $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -z "$VERSION_RAW" ]]; then
        VERSION_RAW="$1"
      elif [[ -z "$COMMIT_MSG" ]]; then
        COMMIT_MSG="$1"
      else
        echo "Trop d’arguments : $1" >&2
        exit 1
      fi
      shift
      ;;
  esac
done

VERSION="${VERSION_RAW#v}"

if [[ -z "$VERSION" ]]; then
  echo "Usage : $0 <X.Y.Z> [message de commit] [--tag-only] [--no-push]" >&2
  exit 1
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Erreur : version attendue X.Y.Z ou vX.Y.Z (ex. 1.0.0), reçu : $VERSION_RAW" >&2
  exit 1
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Erreur : pas un dépôt Git." >&2
  exit 1
fi

if [[ "$TAG_ONLY" != true ]] && ! command -v npm >/dev/null 2>&1; then
  echo "Erreur : npm introuvable (nécessaire pour synchroniser package.json / package-lock.json)." >&2
  exit 1
fi

TAG="v$VERSION"
DEFAULT_MSG="chore: release $TAG"
MSG="${COMMIT_MSG:-$DEFAULT_MSG}"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Erreur : le tag $TAG existe déjà en local." >&2
  exit 1
fi

if [[ "$TAG_ONLY" == true ]]; then
  echo ">>> Tag annoté sur HEAD : $TAG"
  git tag -a "$TAG" -m "Release $TAG"
else
  echo "$VERSION" > VERSION
  (cd "$REPO_ROOT/frontend" && npm version "$VERSION" --no-git-tag-version)
  echo ">>> Fichiers version : VERSION, frontend/package.json, frontend/package-lock.json"

  git add VERSION frontend/package.json frontend/package-lock.json

  if git diff --staged --quiet; then
    echo "Erreur : aucun changement indexé (version déjà $VERSION ?)." >&2
    exit 1
  fi

  echo ">>> git commit -m \"$MSG\""
  git commit -m "$MSG"

  echo ">>> git tag -a $TAG -m \"Release $TAG\""
  git tag -a "$TAG" -m "Release $TAG"
fi

if [[ "$NO_PUSH" == true ]]; then
  echo ">>> --no-push : pas de git push. Pour publier le tag :"
  echo "    git push origin \"$(git rev-parse --abbrev-ref HEAD)\" --follow-tags"
  echo "    # ou : git push origin $TAG"
  exit 0
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo ">>> git push origin $BRANCH --follow-tags"
git push -u origin "$BRANCH" --follow-tags

echo "Terminé : $TAG poussé vers origin (branche $BRANCH)."
