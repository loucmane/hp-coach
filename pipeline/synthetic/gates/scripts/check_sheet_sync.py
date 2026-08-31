#!/usr/bin/env python3
"""Mandatory pre-review gate: candidate-to-sheet byte synchronization.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 8f): las-b16-002's
false G-STEM closure survived two rounds because its stems/ sheet was stale
— no leg had ever read the option set the closure talked about. This check
would have stopped that at the source. It is read-only, takes seconds, and
MUST run before any review leg (G-KEY/G-STEM/G-DISTRACTOR/G-SPRÅK) is
dispatched, and again before promote.

Hardened per the 2026-08-31 GC hardening-review lane (report
hpf-y1p4-hardening-review-20260831-001): the gate FAILS CLOSED —
a missing sheet directory, an empty candidates-final, an orphan sheet
file, a candidate_id/q_index drift, or a contamination-alias field are
all failures, not skips. `--allow-missing-dirs` exists solely for
historical batches that predate the sheet convention and must be passed
explicitly.

Contract, per unit in candidates-final/:
  blind/<id>.json       passage, candidate_id, prompts, q_index, option
                        letters+texts identical; MUST NOT carry any
                        key/answer/rationale-class field (see denylists).
  stems/<id>.json       candidate_id, prompts, q_index, options identical;
                        MUST NOT carry passage/title or any key/answer/
                        rationale-class field.
  distractor/<id>.json  passage, candidate_id, prompts, q_index, options
                        AND keys identical; MUST NOT carry any
                        rationale-class field.
Sheet directories may not contain .json files without a matching final
candidate (orphans are exactly the stale-sheet bug in file form).

Exit 0 = in sync. Exit 1 = any failure (one line per finding,
machine-parsable "SYNC-FAIL <unit> <sheet> <field>: detail").
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Contamination denylists. Alias-complete by design: the 2026-08-31 review
# showed an exact-key denylist of {"key"} alone is trivially bypassed by
# answer/answer_key/correct_answer/solution/facit and by rationale-class
# aliases. Extend HERE (with a bank-wide run) — never narrow.
_KEY_ALIASES = ("key", "keys", "answer", "answers", "answer_key",
                "correct", "correct_answer", "correct_option", "solution",
                "solutions", "facit")
_RATIONALE_ALIASES = ("rationale", "rationales", "explanation",
                      "explanations", "why_wrong", "why_tempting",
                      "generator_meta", "family", "planted_traps",
                      "hedge_map", "repair_log", "self_blind_solve")
FORBIDDEN = {
    "blind": _KEY_ALIASES + _RATIONALE_ALIASES,
    "stems": ("passage", "title") + _KEY_ALIASES + _RATIONALE_ALIASES,
    "distractor": _RATIONALE_ALIASES,
}
SHEETS = ("blind", "stems", "distractor")


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


def check_batch(batch_dir: Path, allow_missing_dirs: bool) -> list[str]:
    problems: list[str] = []
    cand_dir = batch_dir / "candidates-final"
    if not cand_dir.is_dir():
        return [f"SYNC-FAIL - - -: no candidates-final in {batch_dir}"]
    cand_paths = sorted(cand_dir.glob("*.json"))
    if not cand_paths:
        return [f"SYNC-FAIL - - -: candidates-final is empty in {batch_dir}"]
    cand_names = {p.name for p in cand_paths}
    for sheet in SHEETS:
        sheet_dir = batch_dir / sheet
        if not sheet_dir.is_dir():
            if allow_missing_dirs:
                print(f"note: {batch_dir.name} has no {sheet}/ directory — "
                      f"skipped (--allow-missing-dirs)", file=sys.stderr)
                continue
            _fail(problems, "-", sheet, "directory",
                  "sheet directory missing (pass --allow-missing-dirs only "
                  "for historical batches that predate the sheet convention)")
            continue
        for orphan in sorted(set(p.name for p in sheet_dir.glob("*.json")) - cand_names):
            _fail(problems, orphan.removesuffix(".json"), sheet, "orphan",
                  "sheet file has no matching final candidate")
    for cand_path in cand_paths:
        unit = cand_path.stem
        cand = json.loads(cand_path.read_text(encoding="utf-8"))
        cq = _questions(cand)
        for sheet in SHEETS:
            sheet_dir = batch_dir / sheet
            if not sheet_dir.is_dir():
                continue
            sp = sheet_dir / cand_path.name
            if not sp.is_file():
                _fail(problems, unit, sheet, "sheet", "sheet file missing")
                continue
            s = json.loads(sp.read_text(encoding="utf-8"))
            hit = _walk_forbidden(s, FORBIDDEN[sheet])
            if hit:
                _fail(problems, unit, sheet, hit, "forbidden field present (contamination)")
            if s.get("candidate_id") != cand.get("candidate_id"):
                _fail(problems, unit, sheet, "candidate_id", "differs from candidates-final")
            if sheet in ("blind", "distractor"):
                if s.get("passage") != cand.get("passage"):
                    _fail(problems, unit, sheet, "passage", "differs from candidates-final")
            sq = _questions(s)
            if len(sq) != len(cq):
                _fail(problems, unit, sheet, "questions", f"count {len(sq)} != {len(cq)}")
                continue
            for i, (a, b) in enumerate(zip(cq, sq), start=1):
                if a.get("q_index") != b.get("q_index"):
                    _fail(problems, unit, sheet, f"q{i}.q_index", "differs")
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
    ap.add_argument("--allow-missing-dirs", action="store_true",
                    help="historical batches only: skip absent sheet dirs "
                         "with a note instead of failing")
    args = ap.parse_args()
    all_problems: list[str] = []
    for bd in args.batch_dirs:
        all_problems.extend(check_batch(bd, args.allow_missing_dirs))
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
