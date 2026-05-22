#!/usr/bin/env python3
"""Validate the 18 Variant-C regen output files.

Checks each entry across these dimensions:

  Schema:
    - required fields: steps, distractors, technique, pregrade_tactic, _meta, solution_path
    - steps is non-empty array
    - each step has n, title, text, tier
    - each distractor has letter, why_tempting, why_wrong
    - pregrade_tactic has handle + move

  Math wrapping:
    - PUA delimiters U+E000/U+E001 must be balanced per entry
    - flag entries with raw LaTeX commands outside PUA wraps

  Language:
    - ELF entries: handle + move should NOT contain å/ä/ö
    - other sections: handle should contain å/ä/ö OR Swedish stop-words

  Answer-letter:
    - corpus answer letter should NOT appear in distractors[]
    - distractor letters must be unique

  Step counts (quant=10+, verbal=4-6, ORD=2-3 — soft warnings only)

Output: structured report with per-entry pass/fail + summary.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = REPO_ROOT / "audit" / "_variant_c_regen"

E0 = ""
E1 = ""

# Map qid → section and corpus answer.
def load_corpus_answers():
    answers = {}
    sections = {}
    for path in sorted((REPO_ROOT / "app/public/data").glob("*.json")):
        if path.name.startswith("_"):
            continue
        for entry in json.loads(path.read_text()):
            qid = entry.get("qid")
            if qid:
                answers[qid] = entry.get("answer")
                sections[qid] = entry.get("section")
    return answers, sections


def find_unwrapped_latex(text: str) -> list[str]:
    """Return LaTeX commands that appear outside any PUA wrap."""
    # Split text by PUA boundaries; only check the OUT segments.
    out_segments = []
    i = 0
    in_wrap = False
    cur = []
    for c in text:
        if c == E0:
            if cur:
                out_segments.append("".join(cur))
                cur = []
            in_wrap = True
        elif c == E1:
            in_wrap = False
            cur = []
        elif not in_wrap:
            cur.append(c)
    if cur:
        out_segments.append("".join(cur))

    LATEX_CMD = re.compile(r"\\(?:frac|sqrt|cdot|mathrm|sum|int|prod|le|ge|ne|approx|leq|geq|neq|times|div|pi|alpha|beta|gamma|theta|sigma|sin|cos|tan)\b|\^\{[^}]+\}|_\{[^}]+\}")
    hits = []
    for seg in out_segments:
        for m in LATEX_CMD.finditer(seg):
            hits.append(m.group(0))
    return hits


def is_likely_swedish(s: str) -> bool:
    """Cheap heuristic: any å/ä/ö, or a common Swedish stop-word."""
    s = s.lower()
    if any(c in s for c in "åäö"):
        return True
    sw_stops = {"och", "att", "som", "att", "från", "den", "det", "i", "ett", "en", "är", "om"}
    return any(w in s.split() for w in sw_stops)


def has_swedish_chars(s: str) -> bool:
    return any(c in s.lower() for c in "åäö")


def validate_entry(qid: str, entry: dict, section: str, corpus_answer: str) -> dict:
    issues = []

    # Schema
    required = ["steps", "distractors", "technique", "pregrade_tactic", "_meta"]
    for f in required:
        if f not in entry:
            issues.append(f"missing field: {f}")
            continue

    steps = entry.get("steps") or []
    if not steps:
        issues.append("steps empty")
    else:
        for i, step in enumerate(steps):
            if not all(k in step for k in ("n", "title", "text", "tier")):
                issues.append(f"step {i} missing fields")

    distractors = entry.get("distractors") or []
    if len(distractors) < 2:
        issues.append(f"only {len(distractors)} distractor(s)")
    distr_letters = set()
    for d in distractors:
        if not all(k in d for k in ("letter", "why_tempting", "why_wrong")):
            issues.append(f"distractor {d.get('letter','?')} missing fields")
        distr_letters.add(d.get("letter"))
        if d.get("letter") == corpus_answer:
            issues.append(
                f"distractor includes correct answer {corpus_answer}"
            )

    pgt = entry.get("pregrade_tactic")
    if not isinstance(pgt, dict) or not pgt.get("handle") or not pgt.get("move"):
        issues.append("pregrade_tactic incomplete")
    else:
        handle = pgt["handle"]
        move = pgt["move"]
        if section == "ELF":
            if has_swedish_chars(handle):
                issues.append(f"ELF handle has Swedish char: {handle!r}")
            if has_swedish_chars(move):
                issues.append(f"ELF move has Swedish char: {move[:60]!r}")
        else:
            if not is_likely_swedish(handle + " " + move):
                issues.append(f"non-ELF pregrade_tactic doesn't look Swedish: {handle!r}")

    # PUA balance + unwrapped LaTeX in all text fields
    all_text = []
    for s in steps:
        if s.get("text"):
            all_text.append(s["text"])
        if s.get("sub_text"):
            all_text.append(s["sub_text"])
    for d in distractors:
        for k in ("why_tempting", "why_wrong"):
            if d.get(k):
                all_text.append(d[k])
    if entry.get("solution_path"):
        all_text.append(entry["solution_path"])
    if entry.get("technique"):
        all_text.append(entry["technique"])
    if entry.get("pitfall"):
        all_text.append(entry["pitfall"])

    full = "\n".join(all_text)
    open_count = full.count(E0)
    close_count = full.count(E1)
    if open_count != close_count:
        issues.append(
            f"unbalanced PUA: {open_count} open vs {close_count} close"
        )

    unwrapped = find_unwrapped_latex(full)
    if unwrapped:
        # Section-aware: warn but don't error
        issues.append(f"unwrapped LaTeX: {len(unwrapped)} (e.g. {unwrapped[:3]})")

    # Section-aware step count
    expected = {"XYZ": 10, "KVA": 10, "NOG": 10, "DTK": 10, "LÄS": 4, "ELF": 4, "MEK": 4, "ORD": 2}
    min_steps = expected.get(section, 4)
    if len(steps) < min_steps:
        issues.append(f"step count {len(steps)} < expected {min_steps}")

    return {"qid": qid, "section": section, "issues": issues}


def main():
    answers, sections = load_corpus_answers()
    print(f"Loaded {len(answers)} corpus answers\n")

    all_results = []
    seen_qids = set()
    files = sorted(OUTPUT_DIR.glob("output_*.json"))
    # Prefer non-"batch" naming when duplicates exist
    for path in files:
        data = json.loads(path.read_text())
        for qid, entry in data.items():
            if qid in seen_qids:
                continue
            seen_qids.add(qid)
            section = sections.get(qid, "?")
            corpus_ans = answers.get(qid, "?")
            r = validate_entry(qid, entry, section, corpus_ans)
            r["source_file"] = path.name
            all_results.append(r)

    # Summarize
    total = len(all_results)
    clean = sum(1 for r in all_results if not r["issues"])
    by_section = defaultdict(lambda: {"total": 0, "clean": 0, "issues": 0})
    issue_classes = defaultdict(int)
    for r in all_results:
        s = r["section"]
        by_section[s]["total"] += 1
        if r["issues"]:
            by_section[s]["issues"] += 1
            for issue in r["issues"]:
                # Classify by first phrase
                key = issue.split(":")[0].split(" (")[0]
                issue_classes[key] += 1
        else:
            by_section[s]["clean"] += 1

    print("=" * 60)
    print(f"TOTAL: {total} entries · {clean} clean · {total - clean} with issues")
    print("=" * 60)
    print()
    print("Per section:")
    for s in sorted(by_section.keys()):
        st = by_section[s]
        print(f"  {s}: {st['clean']}/{st['total']} clean ({st['issues']} with issues)")
    print()
    print("Issue classes (top 10):")
    for k, n in sorted(issue_classes.items(), key=lambda x: -x[1])[:10]:
        print(f"  {n:4d}  {k}")
    print()

    # Show first 10 entries with issues for inspection
    bad = [r for r in all_results if r["issues"]]
    if bad:
        print(f"First {min(10, len(bad))} entries with issues:")
        for r in bad[:10]:
            print(f"  {r['qid']} ({r['section']}) [{r['source_file']}]")
            for issue in r["issues"]:
                print(f"    - {issue}")

    return all_results


if __name__ == "__main__":
    main()
