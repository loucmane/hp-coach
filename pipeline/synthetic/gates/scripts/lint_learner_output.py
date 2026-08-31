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

# L2-SNAKE — hardened per the 2026-08-31 GC review: case-insensitive,
# digits allowed inside segments, and the length gate is on the WHOLE
# token (>=5 chars, >=2 segments, at least one segment with >=2 letters)
# so scope_x / scope_2_shift / Scope_shift / SCOPE_SHIFT are all caught
# while math subscript notation stays protected by the store's
# math-preservation contract: v_r, a_n, b_m (total < 5) and K_2007 /
# a_1 (no segment with two letters) never flag.
_SNAKE_TOKEN = re.compile(r"\b[0-9A-Za-zÅÄÖåäö]+(?:_[0-9A-Za-zÅÄÖåäö]+)+\b")
# The pipeline's trap-taxonomy vocabulary, as STEMS so case/digit/truncation
# evasions (scope_x, scope_2_shift, Scope_shift, SCOPE_SHIFT) are caught.
# Extend with any new taxonomy family; never remove without a store run.
_TAXONOMY_STEMS = ("scope", "shift", "causal", "worldknowledge",
                   "conjunction", "overgeneral", "generalis", "attribution",
                   "swap", "detail_as", "tempting", "hedg", "planted_trap", "trap_label",
                   "distractor", "misdirect", "as_main")


class _Snake:
    """Two-tier snake_case detector.

    Tier 1 (always fails): snake tokens carrying pipeline taxonomy stems —
    these are internal join keys and must never reach learner prose.
    Tier 2 (only with --strict): any other snake token of length >= 5 with
    a >=2-letter segment — improvised formula variable names (värde_B,
    antal_A, K_diff). Those are a bounded STYLE debt (bead hpf-gyo5,
    non-blocking, inspect-before-replace), not gate-internal leakage, and
    the store's math-preservation contract protects them from blind
    rewriting. Pure subscript notation (v_r, a_n, K_2007) never flags in
    either tier.
    """

    def __init__(self, strict: bool = False):
        self.strict = strict

    def search(self, text):
        fallback = None
        for m in _SNAKE_TOKEN.finditer(text):
            tok = m.group(0)
            low = tok.lower()
            if any(stem in low for stem in _TAXONOMY_STEMS):
                return m
            if (self.strict and fallback is None and len(tok) >= 5
                    and any(sum(c.isalpha() for c in seg) >= 2
                            for seg in tok.split("_"))):
                fallback = m
        return fallback


SNAKE = _Snake()
HEDGAT = re.compile(r"\bhedg(?:at|ad|ar|ade|ning)\b", re.IGNORECASE)
# Gate names — hardened per the 2026-08-31 GC review: case-INSENSITIVE for
# G-* gates and mech.py (no Swedish collision), and for M-* gates with a
# guard that exempts math prose like "k-m-form" / "kx + m-form" (a gate
# name preceded by <alnum>- or by "+ "/"= " is arithmetic, not a gate).
GATEREF_GATES = re.compile(
    r"mech\.py"
    r"|(?<![0-9A-Za-z-])(?<![+=] )[mM]-(?:form|echo|tell|schema|bands|plagiarism)\b"
    r"|\b[gG]-(?:key|stem|sprak|språk|distractor|register|eng)\b",
    re.IGNORECASE,
)
GATEREF_PHRASES = re.compile(
    r"absoluti[sz]er|round[- ]\d+\s+version|runda[- ]\d+[- ]?version\w*"
    r"|version(?:en)? från runda \d+",
    re.IGNORECASE,
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
            if k.startswith("_"):
                # _-prefixed keys are in-file bookkeeping (audit metadata),
                # never rendered to learners — same convention as _-files.
                continue
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
    ap.add_argument("--strict", action="store_true",
                    help="also fail on generic snake_case style tokens "
                         "(formula variable names), not only taxonomy stems")
    args = ap.parse_args()
    SNAKE.strict = args.strict
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
