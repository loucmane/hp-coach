#!/usr/bin/env python3
"""Derive a unit's repair scope from the verdict files. Do not transcribe it.

Why this exists
---------------
Batch23's fleet-repair-1 prompts were hand-written by the coordinator from a
worklog covering two batches. Four of the seven carried a transcription error:

  * a finding attributed to the wrong field of the right unit,
  * a gate's prose summary paraphrased instead of its findings array, twice,
  * and two whole items attributed to `elf-b22-004` in a prompt for
    `elf-b23-004` -- the same lane slot in the previous batch, whose repair had
    already been executed a batch earlier.

Every one was caught by the agent receiving it, in each case by reading the
verdict line itself. Zero errors came from an agent that did that. The lesson
is not "be careful": it is that repair scope is data and must be derived.

This script reads batches/<N>/verdicts/*.jsonl and prints, per unit, every
record that names it -- gate, target, vote, verdict, and each finding verbatim.
Paste its output into a repair prompt, or read it before writing one. A finding
that does not appear here does not belong in that unit's prompt.

`--correctness` splits findings on the correctness / prose-quality tag the
language gates apply, because that tag decides whether a finding is repaired at
all: measured over batch22's five rounds, repairing rationale prose introduced
14, 17, 17 and 11 new defects while fixing comparable numbers, and none of them
ever changed which option a student could defend.

Usage
-----
  repair_scope.py --batch-dir batches/batch23
  repair_scope.py --batch-dir batches/batch23 --unit las-b23-001
  repair_scope.py --batch-dir batches/batch23 --kills-only
  repair_scope.py --batch-dir batches/batch23 --correctness
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

TAG = re.compile(r"\b(correctness|prose[- ]quality)\b", re.I)


def load(batch: Path) -> list[tuple[str, dict]]:
    out: list[tuple[str, dict]] = []
    seen: set[Path] = set()
    for d in (batch / "verdicts", batch):
        if not d.is_dir():
            continue
        for p in sorted(d.glob("verdicts-*.jsonl")):
            if p in seen:
                continue
            seen.add(p)
            for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append((f"{p.name}:{n}", json.loads(line)))
                except json.JSONDecodeError:
                    print(f"  !! {p.name}:{n} does not parse", file=sys.stderr)
    return out


def tag_of(finding: str) -> str:
    m = TAG.search(finding)
    if not m:
        return "untagged"
    return "correctness" if m.group(1).lower() == "correctness" else "prose-quality"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch-dir", type=Path, required=True)
    ap.add_argument("--unit")
    ap.add_argument("--kills-only", action="store_true")
    ap.add_argument("--correctness", action="store_true", help="group findings by tag")
    ap.add_argument("--max-chars", type=int, default=400)
    a = ap.parse_args()

    records = load(a.batch_dir)
    units = sorted({r.get("candidate_id", "?") for _, r in records})
    if a.unit:
        units = [u for u in units if u == a.unit] or [a.unit]

    for unit in units:
        rows = [(src, r) for src, r in records if r.get("candidate_id") == unit]
        if a.kills_only:
            rows = [(s, r) for s, r in rows if r.get("verdict") == "kill"]
        if not rows:
            continue
        kills = sum(1 for _, r in rows if r.get("verdict") == "kill")
        flags = sum(1 for _, r in rows if r.get("verdict") == "flag")
        print(f"\n{'='*72}\n{unit}   records {len(rows)} · kills {kills} · flags {flags}\n{'='*72}")
        buckets: dict[str, list[str]] = {}
        for src, r in rows:
            head = (
                f"  [{r.get('verdict','?'):5}] {r.get('gate','?'):14} "
                f"{str(r.get('target','')):8} vote={r.get('vote','-')}   {src}"
            )
            findings = r.get("findings") or []
            if not a.correctness:
                print(head)
                for f in findings:
                    s = f if isinstance(f, str) else json.dumps(f, ensure_ascii=False)
                    print(f"        - {s[:a.max_chars]}")
                continue
            for f in findings:
                s = f if isinstance(f, str) else json.dumps(f, ensure_ascii=False)
                buckets.setdefault(tag_of(s), []).append(
                    f"{r.get('gate','?')} {r.get('target','')} v{r.get('vote','-')}: {s[:a.max_chars]}"
                )
        if a.correctness:
            for tag in ("correctness", "untagged", "prose-quality"):
                items = buckets.get(tag, [])
                if not items:
                    continue
                note = "  <- REPAIR" if tag == "correctness" else (
                    "  <- carry, do not repair" if tag == "prose-quality" else "  <- classify before deciding")
                print(f"\n  {tag.upper()} ({len(items)}){note}")
                for s in items:
                    print(f"        - {s}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
