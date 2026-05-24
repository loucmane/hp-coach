#!/usr/bin/env python3
"""Apply verbal-section tag maps to per-exam explanation files.

Reads `audit/_verbal_tagging/tagged_{SECTION}.json` (qid → framework_id
or None) and patches `data/explanations/{exam}.json` accordingly,
then mirrors to `app/public/explanations/`.

Idempotent: re-running with the same input is a no-op.

Usage:
    python3 scripts/apply_verbal_tags.py [--section MEK,LÄS,ELF,DTK]
                                          [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TAGS_DIR = REPO / "audit" / "_verbal_tagging"
EXPL_DIR = REPO / "data" / "explanations"
PUBLIC_DIR = REPO / "app" / "public" / "explanations"

ALL_SECTIONS = ["MEK", "LÄS", "ELF", "DTK"]


def exam_from_qid(qid: str) -> str | None:
    parts = qid.split("-")
    for i, p in enumerate(parts):
        if p.startswith(("verb", "kvant")):
            return "-".join(parts[:i])
    return None


def load_tags(sections: list[str]) -> dict[str, str | None]:
    """Merge all section tag maps into one qid → framework_id dict."""
    out: dict[str, str | None] = {}
    for s in sections:
        path = TAGS_DIR / f"tagged_{s}.json"
        if not path.exists():
            print(f"  warn: {path} missing, skipping {s}", file=sys.stderr)
            continue
        for qid, fid in json.loads(path.read_text()).items():
            out[qid] = fid
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--section", default=",".join(ALL_SECTIONS),
                    help="Comma-separated section codes")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    sections = [s.strip() for s in args.section.split(",") if s.strip()]
    tags = load_tags(sections)
    print(f"Loaded {len(tags)} tag entries across {sections}")

    by_exam: dict[str, list[str]] = defaultdict(list)
    for qid in tags:
        exam = exam_from_qid(qid)
        if exam:
            by_exam[exam].append(qid)

    total_set = total_cleared = total_unchanged = 0
    files_touched = 0
    for exam, qids in sorted(by_exam.items()):
        path = EXPL_DIR / f"{exam}.json"
        if not path.exists():
            print(f"  warn: {path} missing", file=sys.stderr)
            continue
        data = json.loads(path.read_text())
        dirty = False
        set_n = clear_n = unc_n = 0
        for qid in qids:
            entry = data.get(qid)
            if entry is None:
                continue
            target = tags[qid]
            current = entry.get("framework_id")
            if current == target:
                unc_n += 1
                continue
            if target is None:
                # Clear stale tag — caller asked for None
                if "framework_id" in entry:
                    entry["framework_id"] = None
                    clear_n += 1
                    dirty = True
            else:
                entry["framework_id"] = target
                set_n += 1
                dirty = True
        if dirty and not args.dry_run:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
            files_touched += 1
        if set_n + clear_n > 0:
            print(f"  {exam}: +{set_n} set · {clear_n} cleared · {unc_n} unchanged")
        total_set += set_n
        total_cleared += clear_n
        total_unchanged += unc_n

    print(f"\nTotals: {total_set} set · {total_cleared} cleared · "
          f"{total_unchanged} unchanged · {files_touched} files written")

    if args.dry_run:
        print("(dry run — no writes)")
        return 0

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    copied = 0
    for src in sorted(EXPL_DIR.glob("*.json")):
        if src.name.startswith("_"):
            continue
        (PUBLIC_DIR / src.name).write_text(src.read_text())
        copied += 1
    print(f"Mirrored {copied} files to {PUBLIC_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
