#!/usr/bin/env python3
"""Wrap unwrapped LaTeX expressions in PUA delimiters (U+E000/U+E001).

The final_05 batch of XYZ recovery omitted PUA markers around inline
math like `\\frac{18}{3}` and `x^2`. Without the wrap, MathText
won't pick them up for KaTeX rendering, and the user sees raw text.

This sweep finds unwrapped LaTeX patterns in the freshly-merged
qids and wraps each in PUA delimiters. Idempotent — re-running won't
double-wrap (patterns inside an existing wrap are skipped).
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
# Literal PUA chars get stripped by the Write tool — use escape form.
E0 = ""
E1 = ""

# qids from final_05 that need wrapping (others already had PUA markers).
FINAL_05_QIDS = {
    "var-2022-2-kvant1-XYZ-008",
    "var-2022-2-kvant1-XYZ-012",
    "var-2022-2-kvant2-XYZ-004",
    "var-2023-kvant1-XYZ-007",
    "var-2023-kvant2-XYZ-007",
}

# LaTeX patterns we wrap. Order matters: longer / more-specific first.
# Caret patterns drop the leading \b because Swedish multi-letter products
# like "xy^2" don't have a word-boundary inside "xy" — `\b` would skip them.
# We match a contiguous run of letters + caret + exponent instead.
PATTERNS = [
    re.compile(r"\\(?:d?frac|tfrac)\{[^{}]+\}\{[^{}]+\}"),  # \frac{a}{b}
    re.compile(r"\\sqrt\{[^{}]+\}"),                          # \sqrt{n}
    re.compile(r"\\sqrt\b"),
    re.compile(r"\\mathrm\{[^{}]+\}(?:\^\{[^{}]+\})?"),       # \mathrm{cm}^{2}
    re.compile(r"\\(?:cdot|pi|alpha|beta|gamma|theta|sigma|le|ge|ne|approx|leq|geq|neq|times|div|sin|cos|tan)\b"),
    re.compile(r"[a-zA-Z]+\^\{[^{}]+\}"),                    # xy^{N}
    re.compile(r"[a-zA-Z]+\^-?\d+"),                          # xy^2, x^-2
    re.compile(r"[a-zA-Z]_\{[^{}]+\}"),                       # x_{N}
]


def wrap_in_text(text: str) -> tuple[str, int]:
    """Wrap unwrapped LaTeX patterns. Returns (new_text, count)."""
    if not text or E0 in text and E1 in text:
        # Could already have PUA — only wrap segments OUTSIDE existing wraps.
        pass
    # Split text by PUA boundaries; only modify OUT segments.
    parts: list[str] = []
    in_wrap = False
    cur = []
    for ch in text:
        if ch == E0:
            if cur:
                parts.append(("OUT", "".join(cur)))
                cur = []
            in_wrap = True
            parts.append(("DELIM", ch))
        elif ch == E1:
            if cur:
                parts.append(("IN", "".join(cur)))
                cur = []
            in_wrap = False
            parts.append(("DELIM", ch))
        else:
            cur.append(ch)
    if cur:
        parts.append(("IN" if in_wrap else "OUT", "".join(cur)))

    total_wrapped = 0
    out_chunks: list[str] = []
    for kind, val in parts:
        if kind == "OUT":
            for pat in PATTERNS:
                new_val, n = pat.subn(lambda m: f"{E0}{m.group(0)}{E1}", val)
                val = new_val
                total_wrapped += n
            out_chunks.append(val)
        else:
            out_chunks.append(val)
    return "".join(out_chunks), total_wrapped


def patch_entry(entry: dict) -> int:
    """Walk every string field in the explanation and wrap math."""
    e = entry.get("explanation", entry)
    total = 0
    for key in ("solution_path", "technique", "pitfall"):
        if e.get(key):
            e[key], n = wrap_in_text(e[key])
            total += n
    pt = e.get("pregrade_tactic")
    if pt:
        for k in ("handle", "move"):
            if pt.get(k):
                pt[k], n = wrap_in_text(pt[k])
                total += n
    for step in e.get("steps", []) or []:
        if step.get("text"):
            step["text"], n = wrap_in_text(step["text"])
            total += n
        if step.get("title"):
            step["title"], n = wrap_in_text(step["title"])
            total += n
    for d in e.get("distractors", []) or []:
        for k in ("why_tempting", "why_wrong"):
            if d.get(k):
                d[k], n = wrap_in_text(d[k])
                total += n
    return total


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--all", action="store_true", help="Sweep all explanations (not just final_05)")
    args = p.parse_args()

    target_qids = None if args.all else FINAL_05_QIDS

    total_wraps = 0
    for parent in (REPO / "data/explanations", REPO / "app/public/explanations"):
        if not parent.exists():
            continue
        for path in sorted(parent.glob("*.json")):
            if path.name.startswith("_"):
                continue
            data = json.loads(path.read_text())
            file_wraps = 0
            for qid, entry in data.items():
                if target_qids is not None and qid not in target_qids:
                    continue
                n = patch_entry(entry)
                file_wraps += n
            if file_wraps > 0:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
                print(f"  {parent.name}/{path.name}: {file_wraps} wraps")
                total_wraps += file_wraps
    print(f"\nTotal wraps: {total_wraps}")
    return 0


if __name__ == "__main__":
    main()
