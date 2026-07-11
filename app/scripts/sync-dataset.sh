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
#
# app/public/data/ and app/public/explanations/ are ALSO the source of
# truth for the production R2 content sync (scripts/content-sync.mjs,
# run in deploy.yml): in staging/production the SPA is built with
# VITE_CONTENT_FROM_API=true, which excludes these dirs from the Pages
# bundle and serves them auth-gated from the hpc-content R2 bucket via
# the worker's /api/content route. So: run this script → commit → the
# deploy workflow pushes the same bytes to R2. Dev/e2e keep reading the
# local copies here with no flag and no extra setup.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$REPO_ROOT/data/parsed"
DEST="$REPO_ROOT/app/public/data"
FIG_SRC="$REPO_ROOT/data/figures"
FIG_DEST="$REPO_ROOT/app/public/figures"
EXPL_SRC="$REPO_ROOT/data/explanations"
EXPL_DEST="$REPO_ROOT/app/public/explanations"

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

# Quant figures (Phase B vector pipeline). The drill fetches each
# SVG on demand via QuestionFigure.tsx, so these need to land beside
# the JSON in the public/ tree. Use rsync with --delete so the
# directory inode is preserved; the earlier `rm -rf` + `cp -R`
# recipe broke Vite's static file watcher (the watcher kept the old
# inode reference and SVG requests fell through to the SPA index.html
# instead of the real file, until you bounced the dev server).
if [ -d "$FIG_SRC" ]; then
  mkdir -p "$FIG_DEST"
  rsync -a --delete "$FIG_SRC"/ "$FIG_DEST"/
  fig_count=$(find "$FIG_DEST" -maxdepth 1 -name '*.svg' | wc -l | tr -d ' ')
  echo "synced $fig_count figure(s) → app/public/figures/"
fi

# Layer 2 explanations (per-question coaching content). Generated
# offline by pipeline/explanations/generate.py; one JSON file per
# exam keyed by qid, plus an _index.json listing covered qids. The
# SPA's loadExplanation() fetches them lazily; missing explanations
# are non-fatal — the panel just doesn't mount. Same rsync+--delete
# pattern as figures so Vite's watcher doesn't lose its grip on the
# directory.
if [ -d "$EXPL_SRC" ]; then
  mkdir -p "$EXPL_DEST"
  rsync -a --delete "$EXPL_SRC"/ "$EXPL_DEST"/
  expl_count=$(find "$EXPL_DEST" -maxdepth 1 -name '*.json' ! -name '_index.json' | wc -l | tr -d ' ')
  echo "synced $expl_count explanation file(s) → app/public/explanations/"
fi
