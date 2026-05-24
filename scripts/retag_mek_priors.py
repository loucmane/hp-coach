#!/usr/bin/env python3
"""Apply sharpened priority rules to MEK tags after QA found 2 biases.

Bias 1: stems with apposition cues ("det vill säga", "med andra ord",
"som betyder", "som innebär", "d.v.s.") were under-tagged for
RULE-007 (inbyggd definition).

Bias 2: stems with 2+ blanks were tagged as single-blank rules
(RULE-008/009/011/012/etc.) instead of routing through RULE-004
(two-blank consistency) or RULE-016 (three-blank sakfältskoherens)
first.

Priority order applied (first match wins):
  1. apposition cue           → MEK-RULE-007
  2. korrelativ trigger AND multi-blank
                              → MEK-RULE-003
  3. 3+ blanks                → MEK-RULE-016
  4. 2 blanks                 → MEK-RULE-004
  otherwise: leave existing tag alone

Run with --dry-run to preview the diff.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TAGGED = REPO / "audit/_verbal_tagging/tagged_MEK.json"
UNTAGGED = REPO / "audit/_verbal_tagging/untagged_MEK.json"

APPOSITION_CUES = [
    "det vill säga",
    "d.v.s.",
    " dvs ",
    "med andra ord",
    "m.a.o.",
    "som betyder",
    "som innebär",
    "menas här",
    "menas med",
    "med X menas",  # placeholder; pattern below catches generic "med N menas"
]

# Generic "med <något> menas" pattern (e.g. "Med samtid menas …").
MENAS_RE = re.compile(r"\bmed\s+\w+\s+menas\b", re.IGNORECASE)

# Korrelativa konjunktioner — RULE-003. Must appear in stem; "och"/"eller"
# alone don't count (too broad).
KORRELATIV_TRIGGERS = [
    "såväl",
    "varken",
    "både ",
    "antingen",
    "vare sig",
    " ju ",
    "icke endast",
    "inte endast",
    "inte bara",
]

BLANK_RE = re.compile(r"_{2,}")


def classify(stem: str, current: str | None) -> str | None:
    s = stem.lower()
    blanks = len(BLANK_RE.findall(stem))
    if any(cue in s for cue in APPOSITION_CUES) or MENAS_RE.search(stem):
        return "MEK-RULE-007"
    # Don't override a manual RULE-007 tag with a mechanical multi-blank
    # decision — RULE-007 is a semantic judgment about definition cues.
    if current == "MEK-RULE-007":
        return None
    if blanks >= 2 and any(t in s for t in KORRELATIV_TRIGGERS):
        return "MEK-RULE-003"
    if blanks >= 3:
        return "MEK-RULE-016"
    if blanks == 2:
        return "MEK-RULE-004"
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    tagged = json.loads(TAGGED.read_text())
    untagged = json.loads(UNTAGGED.read_text())
    items_by_qid = {it["qid"]: it for it in untagged["items"]}

    changes: list[tuple[str, str | None, str]] = []
    new_tags = 0
    moved = 0
    unchanged = 0
    for qid, current in tagged.items():
        stem = items_by_qid.get(qid, {}).get("prompt", "")
        decided = classify(stem, current)
        if decided is None:
            unchanged += 1
            continue
        if current == decided:
            unchanged += 1
            continue
        changes.append((qid, current, decided))
        if current is None:
            new_tags += 1
        else:
            moved += 1
        tagged[qid] = decided

    print(f"unchanged: {unchanged}")
    print(f"newly tagged: {new_tags}")
    print(f"moved between rules: {moved}")
    print(f"total changes: {len(changes)}")

    # Distribution of moves
    from collections import Counter
    move_counts = Counter((c, d) for _, c, d in changes)
    print("\nTop moves:")
    for (frm, to), n in move_counts.most_common(15):
        print(f"  {frm or 'None':>15s} → {to:<15s} : {n}")

    if not args.dry_run:
        TAGGED.write_text(json.dumps(tagged, ensure_ascii=False, indent=2) + "\n")
        print(f"\nWrote {TAGGED}")
    else:
        print("\n(dry run — no write)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
