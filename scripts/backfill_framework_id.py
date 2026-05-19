#!/usr/bin/env python3
"""Backfill `framework_id` on Layer-2 explanation entries.

For each trap-catalog framework (currently KVA + NOG; XYZ deferred until
it's retrofitted to the rich schema), invert the `example_questions[]`
index and tag every matching explanation in `data/explanations/*.json`
with the trap entry's id. Then mirror the result into
`app/public/data/` so the SPA's per-exam fetch sees the same file.

Idempotent: re-running is safe. If a qid is already tagged with the
correct framework_id, no change. If it's tagged with a *different*
framework_id, the script prints a warning and leaves the existing tag
intact (multi-trap qids are rare but possible; we don't want this
script to thrash on whichever trap catalog was authored last).

Usage:
    python3 scripts/backfill_framework_id.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
FRAMEWORKS_DIR = REPO_ROOT / "frameworks"
EXPLANATIONS_DIR = REPO_ROOT / "data" / "explanations"
APP_PUBLIC_DIR = REPO_ROOT / "app" / "public" / "explanations"

# Which trap-catalog frameworks are rich enough that the framework_id
# link will land on a card with worked_example + tldr + recognition_cue.
# All three quant trap catalogs (KVA + NOG + XYZ) carry the rich schema
# as of XYZ retrofit (task #137).
RICH_TRAP_FRAMEWORKS = ["kva_traps", "nog_traps", "xyz_traps"]


def build_qid_to_framework_id() -> dict[str, str]:
    """Walk RICH_TRAP_FRAMEWORKS and return qid → trap-id map."""
    mapping: dict[str, str] = {}
    collisions: dict[str, list[str]] = defaultdict(list)
    for name in RICH_TRAP_FRAMEWORKS:
        path = FRAMEWORKS_DIR / f"{name}.json"
        framework = json.loads(path.read_text())
        for entry in framework["entries"]:
            for qid in entry.get("example_questions", []):
                if qid in mapping and mapping[qid] != entry["id"]:
                    collisions[qid].append(entry["id"])
                else:
                    mapping[qid] = entry["id"]
    if collisions:
        print(f"  note: {len(collisions)} qids listed under multiple traps; "
              f"first-seen wins. Examples:")
        for qid, others in list(collisions.items())[:3]:
            print(f"    {qid}: kept {mapping[qid]}, also listed under {others}")
    return mapping


def patch_explanation_file(path: Path, qid_map: dict[str, str], dry_run: bool) -> tuple[int, int, int]:
    """Return (already_tagged, newly_tagged, conflict_skipped)."""
    data = json.loads(path.read_text())
    already = newly = conflict = 0
    for qid, entry in data.items():
        target = qid_map.get(qid)
        if target is None:
            continue
        current = entry.get("framework_id")
        if current == target:
            already += 1
        elif current is None:
            entry["framework_id"] = target
            newly += 1
        else:
            # A different framework already tagged this qid; respect it
            print(f"    skip {qid}: keeps {current}, would have been {target}")
            conflict += 1
    if newly > 0 and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return already, newly, conflict


def mirror_to_public(src_dir: Path, dst_dir: Path) -> int:
    """Copy every {exam}.json from src to dst. Returns file count."""
    dst_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for src in sorted(src_dir.glob("*.json")):
        if src.name.startswith("_"):
            continue
        dst = dst_dir / src.name
        dst.write_text(src.read_text())
        count += 1
    return count


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Report counts without writing files.")
    args = parser.parse_args()

    print(f"Building qid → framework_id map from {RICH_TRAP_FRAMEWORKS}...")
    qid_map = build_qid_to_framework_id()
    print(f"  → {len(qid_map)} qids tagged across all rich frameworks")

    total_already = total_newly = total_conflict = 0
    files_touched = 0
    print(f"\nPatching {EXPLANATIONS_DIR}...")
    for path in sorted(EXPLANATIONS_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        already, newly, conflict = patch_explanation_file(path, qid_map, args.dry_run)
        if newly > 0 or conflict > 0:
            print(f"  {path.name}: +{newly} new, {already} unchanged, "
                  f"{conflict} conflict-skipped")
            if newly > 0:
                files_touched += 1
        total_already += already
        total_newly += newly
        total_conflict += conflict

    print(f"\nTotals: {total_newly} newly tagged · {total_already} already tagged · "
          f"{total_conflict} conflicts skipped · {files_touched} files written")

    if args.dry_run:
        print("(dry run — no files written)")
        return 0

    print(f"\nMirroring {EXPLANATIONS_DIR} → {APP_PUBLIC_DIR}...")
    n = mirror_to_public(EXPLANATIONS_DIR, APP_PUBLIC_DIR)
    print(f"  → {n} files copied")

    return 0


if __name__ == "__main__":
    sys.exit(main())
