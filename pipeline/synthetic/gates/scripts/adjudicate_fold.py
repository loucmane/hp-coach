#!/usr/bin/env python3
"""Fold adjudication evidence into per-unit recommendations — mechanically.

Like promote.py and vfinal_fold.py, this script is the ONLY writer of
recommendation records: agents produce EVIDENCE (fresh-eyes readings, cold
solves, triaged flags), and the recommendation class is derived by rule, so
no agent can talk a unit into GODKANN.

Inputs (per unit, in --evidence-dir):
  <cid>.json  {candidate_id,
               cold_solve: [{target, reader_answer}],       # fresh reader's answers
               naturalness: "natural"|"minor_friction"|"unnatural",
               makes_sense: true|false,
               reader_blockers: [str],                       # anything the reader calls ship-blocking
               reader_notes: [str]}                          # non-blocking observations

Keys come from --candidates-dir <cid>.json (the shipping files).
Outstanding flags come from --flags-file (JSON: {cid: [{source, severity, note}]}).

Fold rule (fail-closed):
  AGARBLICK        any cold-solve mismatch vs key, makes_sense false,
                   naturalness "unnatural", any reader_blocker, or any
                   triaged flag with severity not in {"minor","note","info"}
  GODKANN_NOTED    otherwise, if any reader_note, naturalness
                   "minor_friction", or any minor triaged flag
  GODKANN          otherwise

Output: --out JSONL, fully regenerated. Unknown severities fail closed
(count as escalation-grade), same taxonomy as vfinal_fold.py.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

NOTE_SEV = {"minor", "note", "info"}


def fold_unit(cid: str, evidence: dict, keys: dict[int, str], flags: list[dict]) -> dict:
    mismatches = []
    for solve in evidence.get("cold_solve", []):
        target = solve.get("target", "")
        qn = int(target.split(":")[1]) if ":" in target else None
        key = keys.get(qn)
        if key is None or solve.get("reader_answer") != key:
            mismatches.append(f"{target}: reader={solve.get('reader_answer')} key={key}")

    blockers = list(evidence.get("reader_blockers", []))
    # Disposition rule: a GATE-sourced flag on a shipped unit was already
    # adjudicated by the batch pipeline (promote.py passed the unit with that
    # flag on record), so it surfaces as an anteckning — never re-litigated as
    # an escalation. Everything else (cross-batch scan, reader evidence, audit
    # findings) keeps its severity, unknown severities failing closed.
    GATE_SOURCES_DISPOSITIONED = ("G-KEY", "G-STEM", "G-DISTRACTOR", "G-SPRAK",
                                  "G-SPRÅK", "G-ENG", "G-REGISTER", "M-")
    def _dispositioned(f: dict) -> bool:
        return str(f.get("source", "")).upper().startswith(GATE_SOURCES_DISPOSITIONED)
    hard_flags = [f for f in flags
                  if f.get("severity") not in NOTE_SEV and not _dispositioned(f)]
    soft_flags = [f for f in flags
                  if f.get("severity") in NOTE_SEV or _dispositioned(f)]

    if (mismatches or blockers or hard_flags
            or evidence.get("makes_sense") is not True
            or evidence.get("naturalness") == "unnatural"):
        rec = "AGARBLICK"
        why = (mismatches + blockers
               + [f.get("note", "")[:120] for f in hard_flags]
               + ([] if evidence.get("makes_sense") is True else ["reader: unit does not fully make sense"])
               + (["reader: unnatural language"] if evidence.get("naturalness") == "unnatural" else []))
    elif (evidence.get("reader_notes") or soft_flags
            or evidence.get("naturalness") == "minor_friction"):
        rec = "GODKANN_NOTED"
        why = (list(evidence.get("reader_notes", []))
               + [f.get("note", "")[:120] for f in soft_flags])[:6]
    else:
        rec = "GODKANN"
        why = []

    return {"candidate_id": cid, "recommendation": rec, "why": why,
            "cold_solve_matches": f"{len(evidence.get('cold_solve', [])) - len(mismatches)}/{len(evidence.get('cold_solve', []))}",
            "derived_by": "adjudicate_fold.py/1"}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--evidence-dir", required=True, type=Path)
    ap.add_argument("--candidates-dirs", required=True, nargs="+", type=Path)
    ap.add_argument("--flags-file", type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    all_keys: dict[str, dict[int, str]] = {}
    for d in args.candidates_dirs:
        for f in sorted(d.glob("*.json")):
            c = json.loads(f.read_text(encoding="utf-8"))
            if "candidate_id" not in c:
                continue
            all_keys[c["candidate_id"]] = {int(q["q_index"]): q["key"] for q in c.get("questions", [])}

    flags = json.loads(args.flags_file.read_text(encoding="utf-8")) if args.flags_file else {}

    records = []
    for f in sorted(args.evidence_dir.glob("*.json")):
        ev = json.loads(f.read_text(encoding="utf-8"))
        cid = ev["candidate_id"]
        if cid not in all_keys:
            records.append({"candidate_id": cid, "recommendation": "AGARBLICK",
                            "why": ["no shipping file found for this evidence"], "derived_by": "adjudicate_fold.py/1"})
            continue
        records.append(fold_unit(cid, ev, all_keys[cid], flags.get(cid, [])))

    missing = sorted(set(all_keys) - {r["candidate_id"] for r in records})
    for cid in missing:  # fail-closed: units with no evidence escalate
        records.append({"candidate_id": cid, "recommendation": "AGARBLICK",
                        "why": ["NO fresh-eyes evidence recorded"], "derived_by": "adjudicate_fold.py/1"})

    records.sort(key=lambda r: r["candidate_id"])
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records), encoding="utf-8")
    from collections import Counter
    print(dict(Counter(r["recommendation"] for r in records)))
    print(f"adjudicate_fold: {len(records)} record(s) -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
