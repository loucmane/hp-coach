#!/usr/bin/env python3
"""Learner-output lint: enforce the Layer-2 rendering contract.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 6). The P5 bank's
rationale fields legitimately carry (1) snake_case taxonomy labels
(112/114 units), (2) the anglicism *hedgat* (30/114), and (3) gate-internal
meta-commentary. None of that may reach learner-facing prose. The rendered
store (data/explanations/) is clean today — this lint makes that property
enforced instead of accidental. Run it on RENDERED learner text only;
it must NOT be pointed at the bank's internal adjudication metadata.

Checks, per JSON string value (or raw text line):
  L2-SNAKE   snake_case token (two+ lowercase groups joined by _)
  L2-HEDGAT  hedgat/hedgad/hedgar/hedgade/hedgning (any case)
  L2-GATEREF gate-internal references: mech.py, M-FORM/M-ECHO/M-TELL/
             M-SCHEMA/M-BANDS/M-PLAGIARISM, G-KEY/G-STEM/G-SPRAK/G-SPRÅK/
             G-DISTRACTOR/G-REGISTER/G-ENG, absolutiser/absolutizer list,
             "round-N version" / "runda N-versionen" pipeline talk

Exit 0 = clean. Exit 1 = findings, printed "L2-<RULE> <file>:<jsonpath-or-line>: excerpt".
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Segments must be >=2 chars: single-letter groups (v_r, a_n, b_m) are math
# subscript notation, protected by the store's math-preservation contract.
SNAKE = re.compile(r"\b[a-zåäö]{2,}(?:_[a-zåäö]{2,})+\b")
HEDGAT = re.compile(r"\bhedg(?:at|ad|ar|ade|ning)\b", re.IGNORECASE)
# Gate names are matched CASE-SENSITIVELY: pipeline text always writes them
# uppercase, and Swedish math prose legitimately contains "k-m-form" etc.
GATEREF_GATES = re.compile(
    r"mech\.py|\bM-(?:FORM|ECHO|TELL|SCHEMA|BANDS|PLAGIARISM)\b"
    r"|\bG-(?:KEY|STEM|SPRAK|SPRÅK|DISTRACTOR|REGISTER|ENG)\b"
)
GATEREF_PHRASES = re.compile(
    r"absoluti[sz]er|round-\d+ version|runda \d+-versionen", re.IGNORECASE
)
class _GateRef:
    def search(self, text):
        return GATEREF_GATES.search(text) or GATEREF_PHRASES.search(text)
GATEREF = _GateRef()
RULES = (("L2-SNAKE", SNAKE), ("L2-HEDGAT", HEDGAT), ("L2-GATEREF", GATEREF))


def scan_text(text: str) -> list[tuple[str, str]]:
    hits = []
    for name, rx in RULES:
        m = rx.search(text)
        if m:
            start = max(0, m.start() - 30)
            hits.append((name, text[start:m.end() + 30].replace("\n", " ")))
    return hits


def walk_json(obj, path, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            walk_json(v, f"{path}.{k}", out)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            walk_json(v, f"{path}[{i}]", out)
    elif isinstance(obj, str):
        for rule, excerpt in scan_text(obj):
            out.append((rule, path, excerpt))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("paths", nargs="+", type=Path,
                    help="rendered learner-output files or directories (json/md/txt)")
    args = ap.parse_args()
    files: list[Path] = []
    for p in args.paths:
        if p.is_dir():
            # underscore-prefixed files are pipeline bookkeeping (audit notes,
            # skip ledgers) by store convention — never learner-facing.
            files.extend(sorted(q for q in p.rglob("*")
                                if q.suffix in (".json", ".md", ".txt")
                                and not q.name.startswith("_")))
        else:
            files.append(p)
    findings = 0
    for fp in files:
        text = fp.read_text(encoding="utf-8")
        out: list[tuple[str, str, str]] = []
        if fp.suffix == ".json":
            try:
                walk_json(json.loads(text), "$", out)
            except json.JSONDecodeError:
                out = [(r, f"line", e) for r, e in scan_text(text)]
        else:
            for r, e in scan_text(text):
                out.append((r, "-", e))
        for rule, path, excerpt in out:
            print(f"{rule} {fp}:{path}: …{excerpt}…")
            findings += 1
    if findings:
        print(f"learner-output lint: {findings} finding(s) in {len(files)} file(s)")
        return 1
    print(f"learner-output lint: clean — {len(files)} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
