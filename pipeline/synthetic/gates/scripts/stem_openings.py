#!/usr/bin/env python3
"""Attested stem openings: report them, and strip them before an anti-clone screen.

Why this exists
---------------
Law 5 wants stems phrased the way the real exam phrases them. RULE 24 bars any
n>=5 token run a unit shares with the synthetic bank. Those two pulled against
each other and the anti-clone rule won: batch23 generators rejected the exam's
own standard ELF openings *because earlier synthetic units had already used
them*, and shipped invented forms instead. Measured on batch23: five attested
openings were rejected (attested 13, 8, 21, 22 and 1 times in the authentic
corpus) while four shipped openings were attested zero times.

The corpus says the two sections are not the same problem:

  ELF   405 stems, top 5-token opening 26x (6.8%), 51% of stems use an opening
        attested 3+ times. The forms repeat. Reuse is the register.
  LÄS   540 stems, top 5-token opening 5x (0.9%), 5% of stems use an opening
        attested 3+ times. The forms do not repeat. Bespoke is the register.

So the rule is asymmetric, and this script serves both halves:

  --report   for each stem, the longest attested opening (3..6 tokens) and its
             authentic count. ELF stems should open on a form attested >=3
             times; LÄS stems need no attested opening and should not be pushed
             toward one.
  --strip    print each stem with its attested opening removed, so an n>=5
             screen runs against the stem's CONTENT and never its frame. This
             is the carve-out GENERATION.md law 10 already grants M-PLAGIARISM
             ("reusing the stem form is fine"); RULE 24 now inherits it.

The inventory is gates/attested-stem-openings.json, derived mechanically from
data/parsed. Its `_method` block states the source, selection and
normalisation; regenerate it rather than editing it by hand.

Usage
-----
  stem_openings.py --report  candidates/*.json
  stem_openings.py --strip   candidates/*.json
  stem_openings.py --report  --section ELF --stem "What is said about the wall?"
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
INVENTORY = HERE.parent / "attested-stem-openings.json"
ELF_MIN_ATTESTATION = 3  # the corpus share that makes reuse the ELF register


def load_inventory(path: Path = INVENTORY) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _norm(tokens: list[str]) -> str:
    return " ".join(tokens).lower().rstrip(",")


def longest_attested(stem: str, section: str, inv: dict) -> tuple[str, int]:
    """Longest attested opening of `stem` (6 tokens down to 3) and its count."""
    table = inv.get(section, {}).get("openings", {})
    toks = stem.split()
    for n in (6, 5, 4, 3):
        if len(toks) < n:
            continue
        key = _norm(toks[:n])
        hit = table.get(str(n), {}).get(key)
        if hit:
            return key, hit
    return "", 0


def strip_opening(stem: str, section: str, inv: dict) -> str:
    """`stem` with its attested opening removed, for a content-only screen."""
    opening, count = longest_attested(stem, section, inv)
    if not count:
        return stem
    return " ".join(stem.split()[len(opening.split()):])


GAP_LABEL = re.compile(r"^\s*gap\s*\(?\d+\)?\s*$", re.I)


def is_cloze(unit: dict) -> bool:
    """A cloze unit's prompts are structural gap labels, not stems.

    Law 5 is about how a question is phrased to a reader. A cloze gap carries
    no phrasing at all -- that contentless label is exactly why the cloze lane
    measures a stems-only floor at chance. Checking it for an attested opening
    is a category error, so cloze units are skipped.
    """
    if "CLOZE" in str(unit.get("family", "")).upper():
        return True
    prompts = [q.get("prompt") or "" for q in unit.get("questions", [])]
    return bool(prompts) and all(GAP_LABEL.match(x) for x in prompts)


def iter_stems(paths: list[str]):
    for p in paths:
        unit = json.loads(Path(p).read_text(encoding="utf-8"))
        if is_cloze(unit):
            continue
        section = unit.get("section", "")
        cid = unit.get("candidate_id") or Path(p).stem
        for q in unit.get("questions", []):
            prompt = q.get("prompt") or ""
            if prompt.strip() and not GAP_LABEL.match(prompt):
                yield cid, section, q.get("q_index"), prompt


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--strip", action="store_true")
    ap.add_argument("--section", choices=("ELF", "LÄS"))
    ap.add_argument("--stem")
    ap.add_argument("--inventory", type=Path, default=INVENTORY)
    a = ap.parse_args()
    if not (a.report or a.strip):
        ap.error("choose --report or --strip")
    inv = load_inventory(a.inventory)

    if a.stem:
        if not a.section:
            ap.error("--stem needs --section")
        rows = [("(stdin)", a.section, None, a.stem)]
    else:
        rows = list(iter_stems(a.paths))

    unattested_elf = 0
    weak_elf = 0
    for cid, section, qi, prompt in rows:
        opening, count = longest_attested(prompt, section, inv)
        if a.strip:
            print(f"{cid}\tq{qi}\t{strip_opening(prompt, section, inv)}")
            continue
        if section == "ELF":
            if not count:
                verdict, unattested_elf = "UNATTESTED", unattested_elf + 1
            elif count < ELF_MIN_ATTESTATION:
                verdict, weak_elf = f"thin({count})", weak_elf + 1
            else:
                verdict = f"ok({count})"
        else:
            # LÄS: bespoke is the register. An attested opening is fine and is
            # exempt from the screen; the absence of one is not a finding.
            verdict = f"attested({count})" if count else "bespoke"
        print(f"{cid}\tq{qi}\t{section}\t{verdict}\t{opening or '-'}\t{prompt}")

    if a.report and not a.stem:
        print(
            f"\nELF stems with no attested opening: {unattested_elf}"
            f" | attested but under {ELF_MIN_ATTESTATION}: {weak_elf}",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
