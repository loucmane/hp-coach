#!/usr/bin/env python3
"""Report presented-question counts per (exam, provpass) for the quant
half — mirrors the Provpass-picker logic (parsing_status == 'complete'
and options present). Also lists promoted qids lacking explanations.

Usage:
    python3 scripts/report_pass_counts.py [qid ...]
        Optional qids: check explanation presence for exactly these.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "app" / "public" / "data"
EXPL = REPO / "app" / "public" / "explanations"


def main() -> int:
    counts: dict[tuple[str, str], int] = {}
    totals: dict[tuple[str, str], int] = {}
    for path in sorted(DATA.glob("*.json")):
        if path.name.startswith("_"):
            continue
        for q in json.loads(path.read_text()):
            if not q.get("provpass", "").startswith("kvant"):
                continue
            key = (q["exam_id"], q["provpass"])
            totals[key] = totals.get(key, 0) + 1
            if q.get("parsing_status") == "complete" and q.get("options"):
                counts[key] = counts.get(key, 0) + 1

    full = short = 0
    for key in sorted(totals):
        c = counts.get(key, 0)
        t = totals[key]
        mark = "FULL " if c >= 40 else "short"
        if c >= 40:
            full += 1
        else:
            short += 1
        print(f"{mark} {key[0]:>18} {key[1]}: {c}/{t}")
    print(f"\nkvant passes at 40/40: {full}; short: {short}")

    qids = sys.argv[1:]
    if qids:
        expl: dict[str, bool] = {}
        cache: dict[str, set] = {}
        for qid in qids:
            exam = qid.rsplit("-kvant", 1)[0]
            if exam not in cache:
                p = EXPL / f"{exam}.json"
                cache[exam] = set(json.loads(p.read_text()).keys()) if p.exists() else set()
            expl[qid] = qid in cache[exam]
        missing = [q for q, ok in expl.items() if not ok]
        print(f"\npromoted without explanation ({len(missing)}):")
        for q in missing:
            print(f"  {q}")
    return 0


if __name__ == "__main__":
    main()
