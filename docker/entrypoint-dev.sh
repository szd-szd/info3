#!/bin/sh
# Démarre Vite en dev dans Docker. Évite npm ENOTEMPTY sur volumes overlay
# (état partiel de node_modules après un crash / Ctrl+C pendant npm install).

set -e
cd /app

# Par défaut : vider node_modules dans le volume (évite ENOTEMPTY après install partielle).
# On ne peut pas « rm -rf node_modules » : c’est souvent un point de montage Docker → « Device or resource busy ».
# Pour aller plus vite entre deux runs : NPM_PRESERVE_NODE_MODULES=1 docker compose up
if [ "${NPM_PRESERVE_NODE_MODULES:-0}" != "1" ] && [ -d node_modules ]; then
  find node_modules -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
fi

npm install --no-audit --no-fund

exec npm run dev -- --host 0.0.0.0 --port "${VITE_DEV_PORT:-5320}"
