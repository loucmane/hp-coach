#!/usr/bin/env python3
"""Derive reviews/final_verify.jsonl from on-disk V-FINAL evidence.

The final_verify verdict is the double cross-check over the review stages:
fresh blind G-KEY x2 + G-DISTRACTOR on the exact shipping files, plus one
adversarial meta-audit per unit. This script is the ONLY writer of
final_verify records — an agent must never write one, because a verification
record an agent can write is a verification record an agent can fabricate.
Everything here is derived from files:

  <verdicts-dir>/verdicts-gkey-resolved.jsonl   (gkey_resolve.py output)
  <verdicts-dir>/verdicts-gdistractor.jsonl     (keyed judge output)
  <audits-dir>/<candidate_id>.json              (persisted meta-audit result:
                                                 {candidate_id, audit_verdict,
                                                  findings:[{severity,...}]})

Superseding rule: within each verdict file, a LATER line for the same
(gate, target, vote) supersedes an earlier one — re-gates append after the
lines they replace. (gkey_resolve.py refuses to re-ingest its own output, so
appended raw lines keep true chronological order.)

Fold rule (fail-closed):
  REFUTED         any surviving G-KEY kill, any G-DISTRACTOR kill, audit
                  REFUTED, audit MISSING, or any non-minor audit finding
  VERIFIED_NOTES  otherwise, if any G-DISTRACTOR flag or any minor audit
                  finding or audit CONFIRMED_NOTES
  VERIFIED        otherwise

Usage:
  vfinal_fold.py --verdicts-dir <batch>/verdicts-vfinal --audits-dir <batch>/audits \
                 --out <batch>/reviews/final_verify.jsonl [--date YYYY-MM-DD]

The --out file is fully REGENERATED (not appended): it is a derived artifact.
Exit 0 always (promote.py acts on the records, not this exit code).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def _last_wins(path: Path, cid: str) -> list[dict]:
    """Read a verdict file, keep the last line per (gate, target, vote) for cid."""
    last: dict[tuple, dict] = {}
    if not path.exists():
        return []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        v = json.loads(line)
        if v.get("candidate_id") != cid:
            continue
        last[(v.get("gate"), v.get("target"), v.get("vote"))] = v
    return list(last.values())


def fold_unit(cid: str, verdicts_dir: Path, audits_dir: Path) -> dict:
    gkey = _last_wins(verdicts_dir / "verdicts-gkey-resolved.jsonl", cid)
    gdistr = _last_wins(verdicts_dir / "verdicts-gdistractor.jsonl", cid)
    gkey_kills = sum(1 for v in gkey if v.get("verdict") == "kill")
    gd_kills = sum(1 for v in gdistr if v.get("verdict") == "kill")
    gd_flags = sum(1 for v in gdistr if v.get("verdict") == "flag")

    audit_path = audits_dir / f"{cid}.json"
    if audit_path.exists():
        audit = json.loads(audit_path.read_text(encoding="utf-8"))
        audit_v = audit.get("audit_verdict", "MISSING")
        majors = sum(1 for f in audit.get("findings", []) if f.get("severity") != "minor")
        minors = sum(1 for f in audit.get("findings", []) if f.get("severity") == "minor")
    else:
        audit_v, majors, minors = "MISSING", 0, 0

    if (gkey_kills or gd_kills or audit_v in ("REFUTED", "MISSING") or majors):
        verdict = "REFUTED"
    elif gd_flags or minors or audit_v == "CONFIRMED_NOTES":
        verdict = "VERIFIED_NOTES"
    else:
        verdict = "VERIFIED"

    return {
        "candidate_id": cid,
        "stage": "final_verify",
        "verdict": verdict,
        "reviewed_by": "vfinal_fold.py/1 (gkey2+gdistractor+meta-audit evidence)",
        "note": (f"gkey_records={len(gkey)} gkey_kills={gkey_kills} "
                 f"gdistr_kills={gd_kills} gdistr_flags={gd_flags} "
                 f"audit={audit_v} audit_major={majors} audit_minor={minors}"),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verdicts-dir", required=True, type=Path)
    ap.add_argument("--audits-dir", required=True, type=Path)
    ap.add_argument("--candidates-dir", type=Path,
                    help="units to fold (default: every <audits-dir>/*.json)")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--date", default=None, help="ISO date stamped on each record")
    args = ap.parse_args()

    if args.candidates_dir:
        cids = sorted(json.loads(p.read_text(encoding="utf-8"))["candidate_id"]
                      for p in args.candidates_dir.glob("*.json"))
    else:
        cids = sorted(p.stem for p in args.audits_dir.glob("*.json"))

    records = []
    for cid in cids:
        rec = fold_unit(cid, args.verdicts_dir, args.audits_dir)
        if args.date:
            rec["date"] = args.date
        records.append(rec)
        print(f"{rec['verdict']:15s} {cid}  {rec['note']}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records),
                        encoding="utf-8")
    print(f"---\nvfinal_fold: {len(records)} record(s) -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
