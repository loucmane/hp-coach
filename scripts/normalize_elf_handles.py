#!/usr/bin/env python3
"""Normalize ELF pregrade_tactic handles where they don't match the move
language.

The audit flagged Swedish-handle / English-move pairs as register slips
(PRD: ELF stays English by exam design — the coaching scaffolding should
match the test material's language). This script targets entries where
the handle and move are in *different* languages and rewrites the handle
to match the move.

Fully-Swedish (handle + move) and fully-English ELF entries are left
alone. Pushing all Swedish ELF coaching to English is a separate content
workstream (task #138 / deferred).

Hand-curated mapping below; small enough (8 entries) that translation
quality matters more than throughput.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EXPLANATIONS_DIR = REPO_ROOT / "data" / "explanations"
APP_PUBLIC_DIR = REPO_ROOT / "app" / "public" / "explanations"

# qid → new English handle. Each translation matches the existing move's
# topic (the move stays untouched). Handles are definite-noun form per
# the authoring rule for non-Swedish ELF entries.
HANDLE_FIXES = {
    # Swedish handle → English move
    "var-2025-verb1-ELF-032": "The quote-headline",
    "var-2025-verb1-ELF-035": "The echo-source",
    "var-2025-verb1-ELF-038": "The concession tell",
    "var-2025-verb2-ELF-035": "The antonym marker",
    "var-2025-verb2-ELF-036": "The paragraph boundary",
    "var-2025-verb2-ELF-040": "The time contrast",
    # English handle → Swedish move (the other direction — rewrite move
    # to English instead, since ELF convention is English)
}

# qid → new English move. For en-sv mismatches, rewrite the move into
# English, keeping the existing English handle.
MOVE_FIXES_TO_ENGLISH = {
    "host-2021-verb1-ELF-033": (
        "Track the writer's setup-then-reversal: when a tag question ('right?') is "
        "followed by 'Not so' or 'But', the answer mirrors the second move — the "
        "overturn names the position the writer actually holds."
    ),
    "var-2017-verb1-ELF-031": (
        "First find a concrete number or quantification in the passage — the correct "
        "paraphrase is the option that preserves that number while restating the claim "
        "around it."
    ),
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    target_qids = set(HANDLE_FIXES) | set(MOVE_FIXES_TO_ENGLISH)
    touched = patched = 0
    for path in sorted(EXPLANATIONS_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        data = json.loads(path.read_text())
        changed = False
        for qid in list(data.keys()):
            if qid not in target_qids:
                continue
            entry = data[qid]
            pt = entry.get("pregrade_tactic")
            if not isinstance(pt, dict):
                continue
            if qid in HANDLE_FIXES:
                old = pt.get("handle")
                new = HANDLE_FIXES[qid]
                if old != new:
                    pt["handle"] = new
                    print(f"  {qid}: handle {old!r} → {new!r}")
                    patched += 1
                    changed = True
            if qid in MOVE_FIXES_TO_ENGLISH:
                old = pt.get("move")
                new = MOVE_FIXES_TO_ENGLISH[qid]
                if old != new:
                    pt["move"] = new
                    print(f"  {qid}: move rewritten to English")
                    patched += 1
                    changed = True
        if changed:
            touched += 1
            if not args.dry_run:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

    print(f"\n{patched} fields patched across {touched} files")

    if args.dry_run:
        print("(dry run — no files written)")
        return 0

    print(f"\nMirroring → {APP_PUBLIC_DIR}...")
    APP_PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    n = 0
    for src in sorted(EXPLANATIONS_DIR.glob("*.json")):
        if src.name.startswith("_"):
            continue
        (APP_PUBLIC_DIR / src.name).write_text(src.read_text())
        n += 1
    print(f"  {n} files mirrored")
    return 0


if __name__ == "__main__":
    sys.exit(main())
