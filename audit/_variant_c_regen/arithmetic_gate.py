#!/usr/bin/env python3
"""Arithmetic-consistency gate for variant-c regen entries.

For each entry where the regen claims a specific answer letter,
verify the regen's final/terminal steps actually contain a token
matching `option_text(correct_letter)`.

Canonical failure case this catches (from XYZ QA):
    var-2018-1-kvant2-XYZ-010 — regen says "answer B" but computes
    14/5 in the terminal step. Option B's text is something else.
    Gate parses option B → looks for it in terminal steps → fails →
    flag.

What it does NOT catch (different failure mode, needs vision):
    var-2024-kvant1-XYZ-001 — regen says "answer B (7 cm)" and the
    token "7" does appear. But the geometric *path* is fabricated
    (invented Pythagorean 7-24-25 instead of real square+triangle
    area decomposition). The gate sees the matching token and PASSES.

Output: report of entries that fail the gate, grouped by section.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / "app/public/data"
EXPL_DIR = REPO_ROOT / "app/public/explanations"

E0 = ""
E1 = ""

# Only XYZ has option text that is a true computed numeric/algebraic
# value the explanation must reproduce. KVA's options are structural
# verdicts ("I är större än II"); NOG's are sufficiency states; DTK's
# are chart labels or paragraph quotes. Gating those would all be
# noise.
QUANT = {"XYZ"}


def strip_pua(s: str) -> str:
    return s.replace(E0, "").replace(E1, "")


def normalize(s: str) -> str:
    """Aggressive normalization for substring matching."""
    s = strip_pua(s)
    # Remove unit annotations: \mathrm{cm}^{2}, \text{ cm}, etc.
    s = re.sub(r"\\mathrm\{[^}]*\}(?:\^\{[^}]*\})?", "", s)
    s = re.sub(r"\\text\{[^}]*\}", "", s)
    # Collapse \tfrac, \dfrac → \frac
    s = re.sub(r"\\[td]frac\b", r"\\frac", s)
    # Remove spaces; we'll do whitespace-insensitive matching
    s = re.sub(r"\s+", "", s)
    # Normalize Swedish decimal comma to dot for matching
    s = s.replace("{,}", ".").replace(",", ".")
    return s.lower()


def expand_frac(s: str) -> list[str]:
    """Generate alternate textual forms.

    `\\frac{a}{b}` ↔ `a/b`
    `\\sqrt{n}` ↔ `√n`
    """
    forms = {s}
    # \frac{a}{b} → a/b
    def frac_to_slash(m: re.Match) -> str:
        return f"{m.group(1)}/{m.group(2)}"
    forms.add(re.sub(r"\\frac\{([^{}]+)\}\{([^{}]+)\}", frac_to_slash, s))
    # a/b → \frac{a}{b} (only if a, b are simple)
    def slash_to_frac(m: re.Match) -> str:
        return f"\\frac{{{m.group(1)}}}{{{m.group(2)}}}"
    forms.add(re.sub(r"(\d+)/(\d+)", slash_to_frac, s))
    # √n ↔ \sqrt{n}
    forms.add(s.replace("\\sqrt{", "√"))
    return [f for f in forms if f]


def option_signature(option_text: str) -> list[str]:
    """Build a list of canonical forms to search for."""
    if not option_text:
        return []
    raw = option_text
    norms = set()
    for variant in expand_frac(raw):
        norms.add(normalize(variant))
    return [n for n in norms if n and len(n) >= 1]


def terminal_text(entry: dict) -> str:
    """Concatenate the body of the entry where the final computed
    value should appear. Uses solution_path + ALL step texts because
    the answer often surfaces mid-derivation (e.g. step N-3 computes
    `3/10` and step N just says 'Svaret är B')."""
    parts: list[str] = []
    if entry.get("solution_path"):
        parts.append(entry["solution_path"])
    steps = entry.get("steps") or []
    for s in steps:
        if s.get("text"):
            parts.append(s["text"])
    return "\n".join(parts)


def extract_numeric_anchor(option_text: str) -> str | None:
    """Pull the most distinctive numeric token from the option text.

    For `\\frac{14}{15}\\,\\mathrm{cm}^{2}` → `14/15`
    For `7 cm` → `7`
    For `3a²b/c` → `3a²b/c` (whole thing)
    For `2 15` (mangled) → `2/15` (best guess)
    """
    s = normalize(option_text)
    if not s:
        return None
    # Frac case
    m = re.search(r"\\frac\{([^{}]+)\}\{([^{}]+)\}", s)
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    # Slash-fraction
    m = re.search(r"(\d+)/(\d+)", s)
    if m:
        return m.group(0)
    # Just digits + decimals
    m = re.search(r"-?\d+\.?\d*", s)
    if m:
        return m.group(0)
    return None


def gate_entry(qid: str, entry: dict, corpus_q: dict) -> list[str]:
    """Check the entry. Return list of issues (empty = pass)."""
    section = corpus_q.get("section")
    if section not in QUANT:
        return []  # text-section gates are pointless

    answer_letter = corpus_q.get("answer")
    if not answer_letter:
        return []

    options = corpus_q.get("options") or []
    correct = next(
        (o for o in options if o.get("letter") == answer_letter), None
    )
    if not correct:
        return []

    option_text = correct.get("text", "")
    sigs = option_signature(option_text)
    if not sigs:
        return []

    anchor = extract_numeric_anchor(option_text)

    search = normalize(terminal_text(entry))
    if not search:
        return ["no terminal text"]

    # Pass if any canonical signature appears as substring OR
    # the numeric anchor appears (covers fraction-form drift).
    if any(sig and sig in search for sig in sigs if len(sig) >= 2):
        return []
    if anchor and anchor in search:
        return []

    # Both representations missing — flag.
    return [
        f"option {answer_letter} text {option_text!r} not found in terminal "
        f"steps; anchor={anchor!r}; tried={list(sigs)[:3]}"
    ]


def load_corpus() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for path in sorted(DATA_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        for entry in json.loads(path.read_text()):
            qid = entry.get("qid")
            if qid:
                out[qid] = entry
    return out


def main() -> int:
    corpus = load_corpus()
    print(f"Loaded {len(corpus)} corpus questions")

    flagged: list[tuple[str, str, str, list[str]]] = []
    total_quant = 0
    total_regen = 0

    for path in sorted(EXPL_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        data = json.loads(path.read_text())
        for qid, entry in data.items():
            cq = corpus.get(qid)
            if not cq:
                continue
            if cq.get("section") not in QUANT:
                continue
            total_quant += 1
            recipe = (entry.get("_meta") or {}).get("recipe", "")
            if "variant-c-regen-wave" in recipe:
                total_regen += 1
            issues = gate_entry(qid, entry, cq)
            if issues:
                flagged.append((qid, cq["section"], recipe, issues))

    print(f"Scanned {total_quant} quant entries ({total_regen} from regen-wave)")
    print(f"Flagged: {len(flagged)}\n")

    by_section: dict[str, list] = defaultdict(list)
    for qid, section, recipe, issues in flagged:
        by_section[section].append((qid, recipe, issues))

    for section in sorted(by_section):
        items = by_section[section]
        regen_count = sum(1 for _, r, _ in items if "variant-c-regen-wave" in r)
        print(f"=== {section}: {len(items)} flagged ({regen_count} from regen-wave) ===")
        for qid, recipe, issues in items:
            marker = "REGEN" if "variant-c-regen-wave" in recipe else "other"
            print(f"  [{marker}] {qid}")
            for i in issues:
                print(f"    {i[:150]}")
        print()

    return 0


if __name__ == "__main__":
    main()
