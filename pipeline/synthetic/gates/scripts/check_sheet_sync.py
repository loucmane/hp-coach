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

Forbidden fields are matched on a NORMALISED key at any depth (PR #370
round 2, bead hpf-oy2w: `correctAnswer: "A"` on a blind sheet passed):
case, accents and every non-alphanumeric character are ignored, so
correctAnswer / Correct Answer / correct-answer / CORRECT_ANSWER are one
key, and rätt_svar / Rätt svar / ratt_svar another.

Exit 0 = in sync. Exit 1 = any failure (one line per finding,
machine-parsable "SYNC-FAIL <unit> <sheet> <field>: detail"; for a
forbidden field, <field> is its JSON path in the sheet).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

# Contamination denylists, in normalised form (see _norm_key). Alias-complete
# by design: the 2026-08-31 review showed an exact-key denylist of {"key"}
# alone is trivially bypassed, and round 2 that a case-sensitive snake_case
# list is too. A key is forbidden when its normalised form CONTAINS a stem
# (catches compounds: answerLetter, isCorrect, correctOption, solutionText,
# whyWrongB) or EQUALS a word (names too short to match inside other keys:
# "key" sits in "keyword", "svar" in "svarsalternativ"). Extend HERE (with a
# bank-wide run) — never narrow.
_ANSWER_STEMS = ("answer", "correct", "solution", "facit", "keyed", "keyletter",
                 "rattsvar", "korrekt")
_ANSWER_WORDS = ("key", "keys", "svar", "svaret", "ratt", "losning")
_RATIONALE_STEMS = ("rationale", "explanation", "whywrong", "whytempting",
                    "generatormeta", "plantedtrap", "hedgemap", "repairlog",
                    "selfblindsolve")
# "family" hints at question architecture and is forbidden on the BLIND
# protocols (blind/stems); the distractor sheet carries keys by contract,
# so family is moot there and historical sheets legitimately include it.
# (words, stems) per sheet:
FORBIDDEN = {
    "blind": (_ANSWER_WORDS, _ANSWER_STEMS + _RATIONALE_STEMS + ("family",)),
    "stems": (_ANSWER_WORDS, ("passage", "title", "family")
              + _ANSWER_STEMS + _RATIONALE_STEMS),
    "distractor": ((), _RATIONALE_STEMS),
}
SHEETS = ("blind", "stems", "distractor")
_PLAIN_KEY = re.compile(r"[^\s.\[\]\"']+")


def _norm_key(key: str) -> str:
    """Case-, accent- and separator-blind form: 'Rätt svar' -> 'rattsvar'."""
    key = unicodedata.normalize("NFKD", key)
    return "".join(c for c in key.casefold()
                   if c.isalnum() and not unicodedata.combining(c))


def _questions(obj: dict) -> list[dict]:
    return obj.get("questions", []) or []


def _fail(out: list[str], unit: str, sheet: str, field: str, detail: str) -> None:
    out.append(f"SYNC-FAIL {unit} {sheet} {field}: {detail}")


def _forbidden(key: str, sheet: str) -> bool:
    words, stems = FORBIDDEN[sheet]
    norm = _norm_key(key)
    return norm in words or any(stem in norm for stem in stems)


def _walk_forbidden(obj, sheet: str, path: str = "") -> list[str]:
    """JSON path of every forbidden key, at any depth."""
    hits: list[str] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if _PLAIN_KEY.fullmatch(k):
                sub = f"{path}.{k}" if path else k
            else:
                sub = f"{path}[{json.dumps(k, ensure_ascii=False)}]"
            if _forbidden(k, sheet):
                hits.append(sub)
            hits.extend(_walk_forbidden(v, sheet, sub))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            hits.extend(_walk_forbidden(v, sheet, f"{path}[{i}]"))
    return hits


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
            for hit in _walk_forbidden(s, sheet):
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
