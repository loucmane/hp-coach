#!/usr/bin/env bash
# Copy the latest parser output into the SPA's static-asset folder.
# Run this after re-running parser/build_*.py if the question content
# changed; otherwise the SPA continues to use its committed copy.
#
# Files land in app/public/data/ — Vite serves them as static assets at
# /data/*, fetched lazily on demand by data/questions.ts:loadBank().
# (They used to live in app/src/data/ and ride along in the JS bundle;
# moved out 2026-05-08 because 6 MB of bundled JSON was inflating
# Clerk bootstrap to the point of e2e flake.)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$REPO_ROOT/data/parsed"
DEST="$REPO_ROOT/app/public/data"

if [ ! -d "$SRC" ]; then
  echo "Parser output missing at $SRC."
  echo "Run: python3 parser/build_var2026.py" >&2
  exit 1
fi

mkdir -p "$DEST"
shopt -s nullglob
copied=0
for f in "$SRC"/*.json; do
  cp "$f" "$DEST/$(basename "$f")"
  echo "  $(basename "$f")  →  app/public/data/"
  copied=$((copied + 1))
done

if [ "$copied" -eq 0 ]; then
  echo "No parser JSON files found in $SRC." >&2
  exit 1
fi
echo "synced $copied dataset(s)"
