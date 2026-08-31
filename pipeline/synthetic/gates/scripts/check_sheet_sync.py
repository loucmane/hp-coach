#!/usr/bin/env python3
"""Mandatory pre-review gate: candidate-to-sheet byte synchronization.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 8f): las-b16-002's
false G-STEM closure survived two rounds because its stems/ sheet was stale
— no leg had ever read the option set the closure talked about. This check
would have stopped that at the source. It is read-only, takes seconds, and
MUST run before any review leg (G-KEY/G-STEM/G-DISTRACTOR/G-SPRÅK) is
dispatched, and again before promote.

Contract, per unit in candidates-final/:
  blind/<id>.json       passage, prompts, option letters+texts identical;
                        MUST NOT carry key/rationale/generator_meta/family.
  stems/<id>.json       prompts, option letters+texts identical;
                        MUST NOT carry passage/title/key/rationale.
  distractor/<id>.json  passage, prompts, options AND keys identical;
                        MUST NOT carry rationale/generator_meta.
A missing sheet directory is skipped with a warning (older batches predate
the sheet convention); a missing individual sheet inside an existing
directory is a failure — partial coverage is exactly the stale-sheet bug.

Exit 0 = in sync. Exit 1 = any mismatch/contamination (printed, one line
per finding, machine-parsable "SYNC-FAIL <unit> <sheet> <field>: detail").
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

FORBIDDEN = {
    "blind": ("key", "rationale", "generator_meta", "family"),
    "stems": ("passage", "title", "key", "rationale", "generator_meta", "family"),
    "distractor": ("rationale", "generator_meta"),
}


def _questions(obj: dict) -> list[dict]:
    return obj.get("questions", []) or []


def _fail(out: list[str], unit: str, sheet: str, field: str, detail: str) -> None:
    out.append(f"SYNC-FAIL {unit} {sheet} {field}: {detail}")


def _walk_forbidden(obj, names: tuple[str, ...]) -> str | None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in names:
                return k
            hit = _walk_forbidden(v, names)
            if hit:
                return hit
    elif isinstance(obj, list):
        for v in obj:
            hit = _walk_forbidden(v, names)
            if hit:
                return hit
    return None


def check_batch(batch_dir: Path) -> list[str]:
    problems: list[str] = []
    cand_dir = batch_dir / "candidates-final"
    if not cand_dir.is_dir():
        return [f"SYNC-FAIL - - -: no candidates-final in {batch_dir}"]
    for cand_path in sorted(cand_dir.glob("*.json")):
        unit = cand_path.stem
        cand = json.loads(cand_path.read_text(encoding="utf-8"))
        cq = _questions(cand)
        for sheet in ("blind", "stems", "distractor"):
            sheet_dir = batch_dir / sheet
            if not sheet_dir.is_dir():
                print(f"note: {batch_dir.name} has no {sheet}/ directory — skipped",
                      file=sys.stderr)
                continue
            sp = sheet_dir / cand_path.name
            if not sp.is_file():
                _fail(problems, unit, sheet, "sheet", "sheet file missing while sibling sheets exist")
                continue
            s = json.loads(sp.read_text(encoding="utf-8"))
            hit = _walk_forbidden(s, FORBIDDEN[sheet])
            if hit:
                _fail(problems, unit, sheet, hit, "forbidden field present (contamination)")
            if sheet in ("blind", "distractor"):
                if s.get("passage") != cand.get("passage"):
                    _fail(problems, unit, sheet, "passage", "differs from candidates-final")
            sq = _questions(s)
            if len(sq) != len(cq):
                _fail(problems, unit, sheet, "questions", f"count {len(sq)} != {len(cq)}")
                continue
            for i, (a, b) in enumerate(zip(cq, sq), start=1):
                if a.get("prompt") != b.get("prompt"):
                    _fail(problems, unit, sheet, f"q{i}.prompt", "differs")
                ao = [(o.get("letter"), o.get("text")) for o in a.get("options", [])]
                bo = [(o.get("letter"), o.get("text")) for o in b.get("options", [])]
                if ao != bo:
                    _fail(problems, unit, sheet, f"q{i}.options", "letters/texts differ")
                if sheet == "distractor" and a.get("key") != b.get("key"):
                    _fail(problems, unit, sheet, f"q{i}.key", "differs")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("batch_dirs", nargs="+", type=Path)
    args = ap.parse_args()
    all_problems: list[str] = []
    for bd in args.batch_dirs:
        all_problems.extend(check_batch(bd))
    for p in all_problems:
        print(p)
    n_units = sum(len(list((bd / "candidates-final").glob("*.json")))
                  for bd in args.batch_dirs if (bd / "candidates-final").is_dir())
    if all_problems:
        print(f"sheet-sync: {len(all_problems)} problem(s) across {n_units} unit(s)")
        return 1
    print(f"sheet-sync: OK — {n_units} unit(s) in sync")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
