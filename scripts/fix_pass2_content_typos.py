#!/usr/bin/env python3
"""Pass-2 audit content fixes — specific typos / wrong characters.

Three small fixes surfaced in the pass-2 audit that don't fit any
broader regex sweep:

  1. var-2024-kvant1-NOG-025  prompt: "limstif?t" → "limstift"
     (an OCR'd `?` in place of `t`)
  2. var-2026-kvant1-XYZ-006  prompt: "at tlägga" + "at tnumret"
     → "att lägga" / "att numret" (whitespace inside the word `att`)
  3. host-2024-kvant1-NOG-023  solution_path step: raw `\\cdot`
     outside U+E000/U+E001 wrap — add wrap.

Idempotent: each fix has a guard that no-ops if the text already
matches the target.

Usage:
    python3 scripts/fix_pass2_content_typos.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

E0 = ""
E1 = ""

# (file_path, qid, field_path, find, replace)
# field_path is dotted: "prompt" or "steps.0.text"
DATA_FIXES = [
    (
        REPO_ROOT / "app" / "public" / "data" / "var-2024.json",
        "var-2024-kvant1-NOG-025",
        "prompt",
        "limstif?t",
        "limstift",
    ),
    (
        REPO_ROOT / "app" / "public" / "data" / "var-2026.json",
        "var-2026-kvant1-XYZ-006",
        "prompt",
        "at tlägga",
        "att lägga",
    ),
    (
        REPO_ROOT / "app" / "public" / "data" / "var-2026.json",
        "var-2026-kvant1-XYZ-006",
        "prompt",
        "at tnumret",
        "att numret",
    ),
]


def patch_data_file(path: Path, qid: str, field: str, find: str, replace: str,
                    dry_run: bool) -> bool:
    if not path.exists():
        print(f"  skip — {path.name} missing")
        return False
    data = json.loads(path.read_text())
    changed = False
    for entry in data:
        if entry.get("qid") != qid:
            continue
        current = entry.get(field) or ""
        if find not in current:
            if replace in current:
                # Already fixed
                return False
            print(f"  skip {qid}.{field}: marker {find!r} not present")
            return False
        new = current.replace(find, replace)
        entry[field] = new
        print(f"  {qid}.{field}: {find!r} → {replace!r}")
        changed = True
    if changed and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return changed


def patch_nog_023_cdot(dry_run: bool) -> bool:
    """host-2024-kvant1-NOG-023 has raw `\\cdot` in solution_path."""
    qid = "host-2024-kvant1-NOG-023"
    for parent_dir in [REPO_ROOT / "data" / "explanations",
                       REPO_ROOT / "app" / "public" / "explanations"]:
        path = parent_dir / "host-2024.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text())
        entry = data.get(qid)
        if not entry:
            continue
        sp = entry.get("solution_path", "")
        if not isinstance(sp, str):
            continue
        if "\\cdot" not in sp:
            continue
        # Wrap any standalone `\cdot` with PUA. Already-wrapped
        # occurrences (i.e. preceded by E0 within a few chars) are
        # left alone — the simple way is to check the immediate left
        # neighbourhood.
        idx = 0
        new_parts: list[str] = []
        last = 0
        while True:
            i = sp.find("\\cdot", idx)
            if i == -1:
                break
            # Look back up to 30 chars for an E0 with no E1 between
            window = sp[max(0, i - 30):i]
            if E0 in window and (E1 not in window or window.rfind(E0) > window.rfind(E1)):
                # Already inside a PUA span — skip
                idx = i + 5
                continue
            # Emit text up to this point, then wrap the \cdot
            new_parts.append(sp[last:i])
            new_parts.append(f"{E0}\\cdot{E1}")
            last = i + 5
            idx = last
        if last == 0:
            # No wraps performed (all already-wrapped)
            continue
        new_parts.append(sp[last:])
        new_sp = "".join(new_parts)
        entry["solution_path"] = new_sp
        print(f"  {qid}.solution_path: wrapped {(new_sp.count(E0) - sp.count(E0))} raw \\cdot")
        if not dry_run:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        return True
    return False


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    print("Applying typo / whitespace fixes...")
    total = 0
    for path, qid, field, find, replace in DATA_FIXES:
        if patch_data_file(path, qid, field, find, replace, args.dry_run):
            total += 1

    print("Wrapping raw \\cdot in NOG-023...")
    if patch_nog_023_cdot(args.dry_run):
        total += 1

    print(f"\nTotal fixes applied: {total}")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
