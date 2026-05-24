#!/usr/bin/env bash
# Smoke-check that every JSON file under app/public/data/ is served by
# the dev server with Content-Type: application/json, NOT text/html.
#
# Why this exists: Vite 6's static-asset registry can go stale when a
# file is added to public/ AFTER `pnpm dev` started — the file watcher
# fires page-reload events but doesn't re-register the file as a
# static asset. The result is a silent 200 OK with the SPA fallback
# (index.html) as the response body. Calls to fetch() on that URL
# parse the HTML as JSON and throw `Unexpected token '<'`.
#
# This script catches the regression by curling every public/data/*.json
# and asserting Content-Type. Run it before merging any PR that touches
# the dataset OR after restarting the dev server.
#
# Usage:
#   ./scripts/check_public_data_serves_json.sh             # uses http://localhost:5173
#   APP_URL=http://localhost:5174 ./scripts/check_public_data_serves_json.sh

set -euo pipefail

APP_URL="${APP_URL:-http://localhost:5173}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$REPO_ROOT/app/public/data"

if [[ ! -d "$DATA_DIR" ]]; then
  echo "error: $DATA_DIR does not exist" >&2
  exit 2
fi

# Verify the server is up before walking files (saves a confusing
# per-file timeout cascade if the user forgot to start `pnpm dev`).
if ! curl -sf --max-time 2 "$APP_URL/" >/dev/null; then
  echo "error: $APP_URL is not responding (is \`pnpm dev\` running?)" >&2
  exit 2
fi

ok=0
bad=0
bad_files=()

for path in "$DATA_DIR"/*.json; do
  name=$(basename "$path")
  url="$APP_URL/data/$name"
  ct=$(curl -sI --max-time 5 "$url" | grep -i '^content-type:' | tr -d '\r' | awk '{print $2}')
  if [[ "$ct" == application/json* ]]; then
    ok=$((ok + 1))
  else
    bad=$((bad + 1))
    bad_files+=("$name  (got: ${ct:-<none>})")
  fi
done

echo "✓ $ok files served correctly as application/json"
if (( bad > 0 )); then
  echo "✗ $bad files served as the WRONG Content-Type (Vite stale-asset bug):"
  printf '    %s\n' "${bad_files[@]}"
  echo ""
  echo "  Fix: restart \`pnpm dev\`. If that doesn't help, rm + recopy the"
  echo "  affected file(s) to force Vite to re-register them."
  exit 1
fi
