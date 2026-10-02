#!/usr/bin/env python3
"""Plan the re-validation lanes a set of pending exact fixes will require — BEFORE applying them.

Codex review v3, contract correction: the conditional budget is a SESSION budget (five per
batch). The complete re-validation path for a repair is one session per lane, and the number
of lanes depends on WHAT the fixes touch and on the SECTIONS of the units they touch:

  student-facing sheet change (passage / title / prompt / option text)
      -> reval-gstem (1 lane, all changed units)
      -> reval-gkey vote 1 + vote 2 (2 lanes, all changed units)
      -> reval-gdistractor (1 lane, all changed units)
      -> reval-language, ONE LANE PER GATE: G-ENG for changed ELF units, G-SPRAK for changed
         LÄS units
  rationale / glossary-only change
      -> reval-language only (one lane per gate among the changed units)

So an ELF-only student-facing repair needs 5 sessions (fits); a repair that touches both an
ELF and a LÄS unit's student-facing text needs 6 (does not fit); rationale-only repairs need
1 or 2. This planner reads the pending FIX_PROPOSED / MINOR_FIXES journal records (the same
selection apply_exact_fixes.py will apply), prints the lane list and count, and exits 1 when
the count exceeds --budget, so the coordinator STOPS before applying anything and re-requests
instead of discovering the overrun mid-path. Over budget means STOP: a proposed fix is never
"deferred" by recording a pass verdict — check_review_integrity.py runs first and any journal
that clears an unapplied fix is a violation (exit 3). A genuinely deferred fix stays
FIX_PROPOSED, or is recorded as DEFERRED, and keeps the unit on HOLD.

Usage:
  plan_revalidation.py --batch-dir <batch> --stages language pedagogy [--budget 5] [--json out]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_exact_fixes import FixError, plan  # noqa: E402
from check_review_integrity import check as integrity_check  # noqa: E402

SHEET_PATH = re.compile(r"^\$\.(passage|title)$|^\$\.questions\[\d+\]\.prompt$|^\$\.questions\[\d+\]\.options\[\d+\]\.text$")
LANG_GATE = {"ELF": "G-ENG", "LÄS": "G-SPRAK", "LAS": "G-SPRAK"}


def plan_lanes(batch: Path, stages: list[str]) -> dict:
    changed: dict[str, dict] = {}
    for st in stages:
        try:
            todo = plan(batch, st)
        except FixError:
            continue  # no journal for that stage yet
        for cid, r in todo.items():
            paths = [f["path"] for f in r.get("fixes", [])]
            entry = changed.setdefault(cid, {"sheet_change": False, "paths": []})
            entry["paths"] += paths
            entry["sheet_change"] |= any(SHEET_PATH.match(p) for p in paths)
    sections = {}
    for cid in changed:
        c = json.loads((batch / "candidates" / f"{cid}.json").read_text(encoding="utf-8"))
        sections[cid] = c.get("section", "ELF")
    lanes: list[dict] = []
    sheet_units = sorted(c for c, e in changed.items() if e["sheet_change"])
    if sheet_units:
        lanes.append({"lane_class": "reval-gstem", "units": sheet_units})
        lanes.append({"lane_class": "reval-gkey", "vote": 1, "units": sheet_units})
        lanes.append({"lane_class": "reval-gkey", "vote": 2, "units": sheet_units})
        lanes.append({"lane_class": "reval-gdistractor", "units": sheet_units})
    for gate in sorted({LANG_GATE.get(sections[c], "G-ENG") for c in changed}):
        units = sorted(c for c in changed if LANG_GATE.get(sections[c], "G-ENG") == gate)
        lanes.append({"lane_class": "reval-language", "gate": gate, "units": units})
    return {"schema": "hpfetcher-revalidation-plan.v1", "changed_units": sorted(changed),
            "sheet_change_units": sheet_units, "sections": sections, "lanes": lanes, "sessions_required": len(lanes)}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--batch-dir", required=True, type=Path)
    ap.add_argument("--stages", nargs="+", default=["language", "pedagogy"])
    ap.add_argument("--budget", type=int, default=5)
    ap.add_argument("--json", type=Path)
    a = ap.parse_args()
    bad = integrity_check(a.batch_dir)
    if bad:
        print("plan_revalidation: review journals are not clean — refusing to plan:")
        for x in bad:
            print(f"  {x}")
        return 3
    p = plan_lanes(a.batch_dir, a.stages)
    p["budget"] = a.budget
    p["fits_budget"] = p["sessions_required"] <= a.budget
    if a.json:
        a.json.write_text(json.dumps(p, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"plan_revalidation: {len(p['changed_units'])} unit(s) to change, {p['sessions_required']} re-validation session(s) "
          f"required, budget {a.budget} -> {'FITS' if p['fits_budget'] else 'STOP: exceeds budget'}")
    for l in p["lanes"]:
        extra = f" vote {l['vote']}" if "vote" in l else (f" {l['gate']}" if "gate" in l else "")
        print(f"  {l['lane_class']}{extra}: {', '.join(l['units'])}")
    return 0 if p["fits_budget"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
