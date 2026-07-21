#!/usr/bin/env python3
"""Fold a batch's verdicts.jsonl into per-candidate final statuses.

This encodes THE aggregation rule (single source of truth; the runbook
describes it, this file decides it):

  * Lethal gates — M-SCHEMA, M-BANDS(calibrated), M-PLAGIARISM, G-KEY,
    G-STEM, G-DISTRACTOR, G-REGISTER: ANY kill verdict on any target => DEAD.
    G-KEY runs as 2 independent blind-solve votes; either mismatch kills.
  * Language gate (G-SPRAK for LÄS, G-ENG for ELF): 3 independent votes.
    >= 2 kill votes => DEAD; exactly 1 kill vote => FLAGGED (survives, but
    the dissenting vote's findings go to adjudication).
  * killed_by on a DEAD candidate is the UNION of all lethal-gate kills and
    the language gate when it reached its kill threshold — a lethal kill
    never shadows a concurrent language-majority kill.
  * Any 'flag' verdict anywhere => candidate is at best FLAGGED.
  * Missing required verdicts => INCOMPLETE (never ship an INCOMPLETE item).

Usage:
    python3 aggregate.py verdicts.jsonl --candidates-dir batch_dir [--json report.json]

Reads candidate files to know each candidate's section and question count
(needed to compute the required verdict set). Exit 0 always (reporting tool);
the runbook's kill rules act on the report, not the exit code.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

LETHAL_GATES = {"M-SCHEMA", "M-BANDS", "M-PLAGIARISM", "G-KEY", "G-STEM", "G-DISTRACTOR", "G-REGISTER"}
LANGUAGE_GATES = {"G-SPRAK", "G-ENG"}
LANGUAGE_VOTES = 3
LANGUAGE_KILL_THRESHOLD = 2  # kill votes needed to kill outright
GKEY_VOTES = 2


def required_records(cand: dict) -> set[tuple]:
    """(gate, target, vote) tuples that must exist for a complete run."""
    req = {("M-SCHEMA", "passage", None), ("M-BANDS", "passage", None), ("M-PLAGIARISM", "passage", None)}
    lang = "G-SPRAK" if cand["section"] == "LÄS" else "G-ENG"
    for v in range(1, LANGUAGE_VOTES + 1):
        req.add((lang, "passage", v))
    req.add(("G-REGISTER", "passage", None))
    for q in cand["questions"]:
        t = f"q:{q['q_index']}"
        for v in range(1, GKEY_VOTES + 1):
            req.add(("G-KEY", t, v))
        req.add(("G-STEM", t, None))
        req.add(("G-DISTRACTOR", t, None))
    return req


def aggregate(verdicts: list[dict], candidates: dict[str, dict]) -> dict:
    by_cand = defaultdict(list)
    for v in verdicts:
        by_cand[v["candidate_id"]].append(v)

    # Orphan guard: verdicts whose candidate_id is not in candidates/ would be
    # silently dropped, and their candidates would fall to INCOMPLETE for no
    # visible reason. This is the exact symptom of an id-namespace mismatch
    # (gate inputs not rebuilt from the renumbered candidates/). Fail loud.
    orphans = sorted(set(by_cand) - set(candidates))
    if orphans:
        import sys
        print(f"WARNING: {len(orphans)} verdict candidate_id(s) not in candidates/ "
              f"— gate inputs must be built from candidates/ after renumber: {orphans}",
              file=sys.stderr)

    report = {}
    for cid, cand in sorted(candidates.items()):
        vs = by_cand.get(cid, [])
        have = {(v["gate"], v["target"], v.get("vote")) for v in vs}
        missing = required_records(cand) - have

        # A lethal kill terminates the pipeline early for that candidate, so
        # records downstream of a kill are legitimately absent.
        lethal_kills = [v for v in vs if v["gate"] in LETHAL_GATES and v["verdict"] == "kill"]
        lang_votes = [v for v in vs if v["gate"] in LANGUAGE_GATES]
        lang_kills = [v for v in lang_votes if v["verdict"] == "kill"]
        flags = [v for v in vs if v["verdict"] == "flag"]

        lang_majority = len(lang_kills) >= LANGUAGE_KILL_THRESHOLD
        if lethal_kills or lang_majority:
            # killed_by is the UNION of lethal-gate kills and any
            # language-majority kill. A lethal kill must not shadow a
            # concurrent >=2-vote language kill: score_eval's
            # killed-by-right-gate check needs to see every gate that
            # independently earned the kill (regression: las-b0-005,
            # eval run 2026-07-20 — 3/3 G-SPRAK kill votes hidden behind
            # killed_by=[G-STEM]).
            status = "DEAD"
            killed_by = sorted(
                {v["gate"] for v in lethal_kills}
                | ({v["gate"] for v in lang_kills} if lang_majority else set())
            )
        elif missing:
            status = "INCOMPLETE"
            killed_by = []
        elif len(lang_kills) == 1 or flags:
            status = "SURVIVED_FLAGGED"
            killed_by = []
        else:
            status = "SURVIVED_CLEAN"
            killed_by = []

        report[cid] = {
            "status": status,
            "killed_by": killed_by,
            "language_kill_votes": len(lang_kills),
            "flags": [{"gate": v["gate"], "target": v["target"], "findings": v["findings"]} for v in flags],
            "dissenting_language_vote": (lang_kills[0]["findings"] if len(lang_kills) == 1 else []),
            "missing_records": sorted(str(m) for m in missing) if status == "INCOMPLETE" else [],
            "family": cand.get("family"),
        }
    return report


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("verdicts", type=Path)
    ap.add_argument("--candidates-dir", type=Path, required=True)
    ap.add_argument("--json", type=Path, help="also write the full report as JSON here")
    args = ap.parse_args(argv)

    verdicts = [json.loads(line) for line in args.verdicts.read_text(encoding="utf-8").splitlines() if line.strip()]
    candidates = {}
    for p in sorted(args.candidates_dir.glob("*.json")):
        c = json.loads(p.read_text(encoding="utf-8"))
        if "candidate_id" in c:
            candidates[c["candidate_id"]] = c

    report = aggregate(verdicts, candidates)
    counts = defaultdict(int)
    for cid, r in report.items():
        counts[r["status"]] += 1
        line = f"{r['status']:17s} {cid}  family={r['family']}"
        if r["killed_by"]:
            line += f"  killed_by={','.join(r['killed_by'])}"
        if r["status"] == "SURVIVED_FLAGGED":
            line += f"  flags={len(r['flags'])} lang_dissent={r['language_kill_votes']}"
        print(line)
    print("---")
    for status in ("SURVIVED_CLEAN", "SURVIVED_FLAGGED", "DEAD", "INCOMPLETE"):
        print(f"{status}: {counts.get(status, 0)}")

    if args.json:
        args.json.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
