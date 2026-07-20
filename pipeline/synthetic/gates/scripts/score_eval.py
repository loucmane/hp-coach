#!/usr/bin/env python3
"""Score a completed eval run against expectations.json.

Given the aggregated report (from aggregate.py --json) and the
expectations.json emitted by load_evalset.py, compute:
  * authentic pass rate  (target: 100% SURVIVED — any DEAD is a false positive)
  * seeded kill rate      (target: 100% killed by intended gate)
  * per-item PASS/FAIL of the eval, with the gate that actually fired

Exit 0 if the eval passes its asserted thresholds (see run-protocol.md), 1
otherwise. This is the gate on the gates.

Usage:
    python3 score_eval.py --report report.json --expectations expectations.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

# Thresholds asserted in run-protocol.md. Changing them is a protocol change.
AUTHENTIC_MAX_FALSE_KILLS = 0
SEEDED_MIN_KILL_RATE = 1.0  # every seeded defect (except the hard negative) must die


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--report", type=Path, required=True)
    ap.add_argument("--expectations", type=Path, required=True)
    args = ap.parse_args(argv)

    report = json.loads(args.report.read_text(encoding="utf-8"))
    exp = json.loads(args.expectations.read_text(encoding="utf-8"))

    false_kills = 0
    seeded_total = 0
    seeded_killed_by_right_gate = 0
    rows = []

    for cid, e in exp.items():
        r = report.get(cid, {"status": "MISSING", "killed_by": []})
        status = r["status"]
        killed_by = r.get("killed_by", [])

        if e["kind"] == "authentic":
            ok = status.startswith("SURVIVED")
            if not ok:
                false_kills += 1
            rows.append((cid, "authentic", "PASS" if ok else "FAIL",
                         f"status={status} killed_by={','.join(killed_by) or '-'}"))
        else:
            if e["expected"] == "SURVIVED":  # hard negative
                ok = status.startswith("SURVIVED")
                rows.append((cid, "hard-neg", "PASS" if ok else "FAIL",
                             f"status={status} killed_by={','.join(killed_by) or '-'}"))
                if not ok:
                    false_kills += 1  # over-firing counts against us too
                continue
            seeded_total += 1
            intended = e["intended_kill_gate"]
            secondary = e.get("secondary")
            allowed = {intended} | ({secondary} if secondary else set())
            right_gate = status == "DEAD" and bool(set(killed_by) & allowed)
            if right_gate:
                seeded_killed_by_right_gate += 1
            # 'dead by some other gate' is a partial fail — the defect died but
            # not for the reason we planted; the intended gate was not exercised.
            if status == "DEAD" and not right_gate:
                verdict = "FAIL(wrong-gate)"
            elif right_gate:
                verdict = "PASS"
            else:
                verdict = "FAIL(survived)"
            rows.append((cid, "seeded", verdict,
                         f"want={intended} got={','.join(killed_by) or '-'} status={status}"))

    print(f"{'candidate':16s} {'kind':9s} {'result':16s} detail")
    print("-" * 78)
    for cid, kind, res, detail in rows:
        print(f"{cid:16s} {kind:9s} {res:16s} {detail}")
    print("-" * 78)

    seeded_rate = seeded_killed_by_right_gate / seeded_total if seeded_total else 1.0
    print(f"authentic false kills: {false_kills} (max allowed {AUTHENTIC_MAX_FALSE_KILLS})")
    print(f"seeded kill-by-right-gate rate: {seeded_killed_by_right_gate}/{seeded_total} = {seeded_rate:.0%} "
          f"(min {SEEDED_MIN_KILL_RATE:.0%})")

    passed = false_kills <= AUTHENTIC_MAX_FALSE_KILLS and seeded_rate >= SEEDED_MIN_KILL_RATE
    print("EVAL PASS" if passed else "EVAL FAIL -> gate stack FROZEN until fixed (see run-protocol.md)")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
