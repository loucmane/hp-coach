#!/usr/bin/env python3
"""Extract the proper-noun registry a batch introduced, mechanically.

Why this exists: batch19's las-b19-002 coined "Vässlingsbadet" one letter from
batch15's invented municipality "Vässlinge" — and BOTH the generator and
G-REGISTER cleared it in good faith, because the BRIEF-ADDENDUM's excluded
toponym list had been refilled BY HAND from the names that happened to reach
adjudication, and "Vässlinge" never did. The owner carry-forward is therefore
that the refill must be mechanical over every shipped unit, not curated.

This script reads the student-facing layer only (title, passage, prompts,
options — never generator_meta, whose search logs mention the REJECTED names
too, and folding those in would forbid names the bank never used). It emits
the capitalized tokens and adjacent capitalized pairs, minus sentence-initial
positions that are ordinary words.

The output is a CANDIDATE registry for a human/agent to merge into the next
brief — not an authority. Over-collection is the intended failure direction:
a false entry costs one coined name, a missed entry costs a near-collision.

Usage:
  registry_extract.py <unit.json|dir> [...] [--exclude-brief <BRIEF-ADDENDUM.md>]
  registry_extract.py batches/batch19/candidates --exclude-brief batches/batch19/BRIEF-ADDENDUM.md
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Words that begin sentences constantly and are never names. Kept deliberately
# short: this list only suppresses sentence-INITIAL tokens, so a real name that
# happens to collide here is still caught mid-sentence.
STOPWORDS = {
    # Swedish
    "den", "det", "de", "dem", "denna", "detta", "dessa", "en", "ett", "och", "men",
    "att", "som", "har", "hade", "var", "vara", "är", "blev", "för", "från", "till",
    "med", "utan", "under", "över", "efter", "före", "när", "då", "där", "här",
    "han", "hon", "hans", "hennes", "jag", "vi", "man", "min", "mitt", "sin", "sitt",
    "i", "på", "av", "om", "vid", "ur", "än", "så", "ja", "nej", "inte", "ingen",
    "nu", "sedan", "redan", "ännu", "bara", "också", "eller", "alla", "allt", "vad",
    "hur", "varför", "vem", "vilka", "vilken", "vilket", "kanske", "ändå", "först",
    "mot", "mellan", "genom", "trots", "både", "varje", "andra", "samma", "flera",
    # English
    "the", "a", "an", "and", "but", "that", "this", "these", "those", "there",
    "here", "it", "its", "he", "she", "his", "her", "they", "them", "their",
    "i", "we", "you", "of", "to", "in", "on", "at", "by", "for", "from", "with",
    "without", "under", "over", "after", "before", "when", "then", "where", "if",
    "not", "no", "nothing", "nobody", "now", "still", "only", "also", "or", "all",
    "what", "how", "why", "who", "which", "one", "two", "three", "four", "five",
    "six", "seven", "eight", "nine", "ten", "every", "each", "both", "same",
    "some", "any", "most", "more", "less", "few", "many", "much", "so", "as",
    "is", "was", "were", "are", "be", "been", "has", "had", "have", "did", "does",
}

TOKEN = r"[A-ZÅÄÖÜÉÈ][a-zåäöüéèA-ZÅÄÖ'’\-]+"
SENT_SPLIT = re.compile(r"(?<=[.!?:;])\s+|\n+")


def student_facing(unit: dict) -> list[str]:
    """Title, passage, prompts and option texts. Never generator_meta."""
    out = []
    for k in ("title", "passage"):
        v = unit.get(k)
        if isinstance(v, str):
            out.append(v)
    for q in unit.get("questions", []):
        if isinstance(q.get("prompt"), str):
            out.append(q["prompt"])
        for o in q.get("options", []):
            if isinstance(o, dict) and isinstance(o.get("text"), str):
                out.append(o["text"])
            elif isinstance(o, str):
                out.append(o)
        # rationales are authored commentary, not student-facing at exam time,
        # but names invented for the unit do surface there — include them.
        if isinstance(q.get("rationale"), str):
            out.append(q["rationale"])
    return out


def extract(texts: list[str]) -> tuple[set[str], set[str]]:
    singles: set[str] = set()
    pairs: set[str] = set()
    for text in texts:
        for sentence in SENT_SPLIT.split(text):
            sentence = sentence.strip()
            if not sentence:
                continue
            # Adjacent capitalized tokens => candidate full-name pair.
            for m in re.finditer(rf"\b({TOKEN})\s+({TOKEN})\b", sentence):
                pairs.add(f"{m.group(1)} {m.group(2)}")
            first = True
            for m in re.finditer(rf"\b{TOKEN}\b", sentence):
                tok = m.group(0)
                at_start = m.start() == 0
                if not (at_start and first and tok.lower() in STOPWORDS):
                    if tok.lower() not in STOPWORDS:
                        singles.add(tok)
                first = False
    return singles, pairs


def load_units(paths: list[Path]) -> list[tuple[str, dict]]:
    units = []
    for p in paths:
        files = sorted(p.glob("*.json")) if p.is_dir() else [p]
        for f in files:
            try:
                d = json.loads(f.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                continue
            if isinstance(d, dict) and "candidate_id" in d and "questions" in d:
                units.append((d["candidate_id"], d))
    return units


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="+", type=Path)
    ap.add_argument("--exclude-brief", type=Path, default=None,
                    help="BRIEF-ADDENDUM.md whose lists already cover names; "
                         "entries found there are reported as ALREADY-LISTED")
    ap.add_argument("--json", type=Path, default=None)
    args = ap.parse_args()

    units = load_units(args.paths)
    if not units:
        print("registry_extract: no units found", file=sys.stderr)
        return 2

    brief_text = args.exclude_brief.read_text(encoding="utf-8") if args.exclude_brief else ""

    per_unit = {}
    all_singles: set[str] = set()
    all_pairs: set[str] = set()
    for cid, unit in units:
        s, p = extract(student_facing(unit))
        per_unit[cid] = {"singles": sorted(s), "pairs": sorted(p)}
        all_singles |= s
        all_pairs |= p

    new_singles = sorted(t for t in all_singles if t not in brief_text)
    listed = sorted(t for t in all_singles if t in brief_text)
    new_pairs = sorted(t for t in all_pairs if t not in brief_text)

    print(f"units: {len(units)}")
    print(f"capitalized tokens: {len(all_singles)}  "
          f"(already in brief: {len(listed)}, NEW: {len(new_singles)})")
    print(f"adjacent pairs: {len(all_pairs)}  (NEW: {len(new_pairs)})")
    print("\n--- NEW single tokens (candidate registry additions) ---")
    print(", ".join(new_singles) or "(none)")
    print("\n--- NEW adjacent pairs ---")
    print(", ".join(new_pairs) or "(none)")

    if args.json:
        args.json.write_text(json.dumps(
            {"per_unit": per_unit, "new_singles": new_singles,
             "new_pairs": new_pairs, "already_listed": listed},
            ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\nregistry_extract: -> {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
