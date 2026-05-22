#!/usr/bin/env python3
"""Merge the 18 Variant-C regen output files into the live corpus.

For each qid in each output_*.json:
  - find the exam (from the qid prefix)
  - load app/public/explanations/{exam}.json AND data/explanations/{exam}.json
  - replace the existing thin entry with the new v3 entry
  - write back

Dedup: when both `output_NN_<section>.json` and `output_batch_NN_<section>.json`
exist, prefer the first (content is identical).

Idempotent: re-run is safe (same merge logic).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = REPO_ROOT / "audit" / "_variant_c_regen"


def collect_regenerated() -> dict[str, dict]:
    """Walk output_*.json files, return { qid: v3_entry } with dedup."""
    merged: dict[str, dict] = {}
    files = sorted(OUTPUT_DIR.glob("output_*.json"))
    for path in files:
        try:
            data = json.loads(path.read_text())
        except Exception as e:
            print(f"  skip {path.name}: {e}")
            continue
        if not isinstance(data, dict):
            continue
        for qid, entry in data.items():
            if qid in merged:
                continue  # first wins (dedup output_NN vs output_batch_NN)
            merged[qid] = entry
    return merged


def exam_from_qid(qid: str) -> str:
    # qid format: {exam_id}-{provpass}-{section}-{number}
    # exam_id can be `host-2013`, `host-ver1-2019`, `var-2022-1`, etc.
    # Strip the trailing -{provpass}-{section}-{number}
    parts = qid.split("-")
    # Find the index of the provpass token (kvant1/kvant2/verb1/verb2)
    for i, p in enumerate(parts):
        if p in ("kvant1", "kvant2", "verb1", "verb2"):
            return "-".join(parts[:i])
    return parts[0] + "-" + parts[1]  # fallback


def merge_into(path: Path, regenerated: dict[str, dict], dry_run: bool) -> int:
    if not path.exists():
        return 0
    data = json.loads(path.read_text())
    touched = 0
    for qid, new_entry in regenerated.items():
        # Only patch qids that belong to this file's exam
        if exam_from_qid(qid) != path.stem:
            continue
        if qid not in data:
            # Skip — regenerated should match existing thin entry
            continue
        data[qid] = new_entry
        touched += 1
    if touched > 0 and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return touched


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    print("Collecting regenerated entries...")
    regen = collect_regenerated()
    print(f"  {len(regen)} unique qids regenerated\n")

    # Group qids by exam for the merge log
    by_exam: dict[str, list[str]] = {}
    for qid in regen:
        by_exam.setdefault(exam_from_qid(qid), []).append(qid)

    print(f"Affected exams: {len(by_exam)}\n")
    for exam in sorted(by_exam.keys()):
        print(f"  {exam}: {len(by_exam[exam])} qids")

    print("\nMerging into live corpus...")
    grand_total = 0
    for parent in [REPO_ROOT / "data/explanations",
                   REPO_ROOT / "app/public/explanations"]:
        if not parent.exists():
            continue
        for exam, qids in sorted(by_exam.items()):
            path = parent / f"{exam}.json"
            n = merge_into(path, regen, args.dry_run)
            if n > 0:
                grand_total += n
                print(f"  {parent.name}/{exam}.json: {n} entries")

    print(f"\nTotal patches: {grand_total}")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
