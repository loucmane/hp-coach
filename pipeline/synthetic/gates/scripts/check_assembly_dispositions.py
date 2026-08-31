#!/usr/bin/env python3
"""Assembly "disposition owed" → explicit G-REGISTER disposition, enforced.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 3): two batches in a
row the assembly named a cross-batch name proximity with the words
"disposition owed" and G-REGISTER answered with a bare pass — which is
indistinguishable from "never looked". This check closes the loop:

  Every line in ASSEMBLY.md containing the marker "disposition owed"
  (case-insensitive) must name at least one unit id (elf-*/las-*), and for
  each named unit the G-REGISTER verdict stream must contain EITHER
    * a record whose findings are non-empty, OR
    * a record carrying a "disposition" field (free text), OR
    * a record with "not-applicable" (any case) in a finding note or
      disposition field, stating a reason.
  A bare pass (verdict "pass", no findings, no disposition field) does NOT
  discharge the marker.

Exit 0 = all markers discharged (or no markers). Exit 1 = any undischarged
marker, printed as "DISPOSITION-OWED <unit>: <assembly line excerpt>".
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

UNIT_RE = re.compile(r"\b(?:elf|las)-b\d+-\d+\b")
MARKER = "disposition owed"


def discharged(unit: str, verdict_files: list[Path]) -> bool:
    for vf in verdict_files:
        for line in vf.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            v = json.loads(line)
            if v.get("gate") != "G-REGISTER" or v.get("candidate_id") != unit:
                continue
            if v.get("findings"):
                return True
            disp = v.get("disposition")
            if isinstance(disp, str) and disp.strip():
                return True
            for f in v.get("findings") or []:
                note = (f.get("note") or "").lower()
                if "not-applicable" in note or "not applicable" in note:
                    return True
    return False


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("assembly", type=Path, help="path to ASSEMBLY.md")
    ap.add_argument("verdicts", nargs="+", type=Path,
                    help="verdict jsonl files that may carry G-REGISTER records")
    args = ap.parse_args()
    problems: list[str] = []
    markers = 0
    lines = args.assembly.read_text(encoding="utf-8").splitlines()
    for i, raw in enumerate(lines):
        if MARKER not in raw.lower():
            continue
        markers += 1
        units = UNIT_RE.findall(raw)
        if not units:
            # markdown prose wraps: allow the unit id on a neighbouring line
            window = " ".join(lines[max(0, i - 2):i + 3])
            units = UNIT_RE.findall(window)
        if not units:
            problems.append(f"DISPOSITION-OWED <no unit named>: {raw.strip()[:120]}")
            continue
        for unit in units:
            if not discharged(unit, args.verdicts):
                problems.append(f"DISPOSITION-OWED {unit}: {raw.strip()[:120]}")
    for p in problems:
        print(p)
    if problems:
        print(f"assembly-dispositions: {len(problems)} undischarged of {markers} marker(s)")
        return 1
    print(f"assembly-dispositions: OK — {markers} marker(s), all discharged")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
