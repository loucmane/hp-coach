"""One-shot: wrap multi-letter unit clusters in `\\mathrm{…}` inside
LaTeX math segments across the corpus.

Mirrors `_wrap_unit_base` in parser/parse_quant.py and the runtime
preprocessor in app/src/components/MathText.tsx so the on-disk JSON
matches what KaTeX renders. Future parses emit the wrap natively
via the parse_quant.py change in the same commit; this catches the
content that was parsed before the fix landed.

Math segments are fenced by the parser's private-use Unicode
delimiters (U+E000 / U+E001). Replacement runs ONLY inside those
fences so plain Swedish prose containing "dm" or "kg" as
ordinary text stays untouched.

USAGE:
    python3 audit/wrap_units_in_corpus.py            # dry run
    python3 audit/wrap_units_in_corpus.py --apply    # write
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

MATH_OPEN = ""
MATH_CLOSE = ""

UNIT_RE = re.compile(r"\b(mm|cm|dm|km|mg|kg|ml|cl|dl|min|kr|Hz|SEK)\b")

# Avoid double-wrapping if the cluster is already inside a \mathrm{}.
# Conservative check: re-wrap is harmless because KaTeX collapses
# `\mathrm{\mathrm{dm}}` to `\mathrm{dm}`, but the regex below already
# skips matches preceded by `\mathrm{`.
DOUBLE_WRAP_GUARD = re.compile(r"\\mathrm\{[^}]*$")


def wrap_in_segment(segment: str) -> str:
    """Wrap unit clusters in one math segment, skipping those already
    inside a `\\mathrm{}` brace."""
    def repl(m: re.Match[str]) -> str:
        # Skip if we're already inside an unclosed \mathrm{…}
        if DOUBLE_WRAP_GUARD.search(segment, 0, m.start()):
            return m.group(0)
        return f"\\mathrm{{{m.group(1)}}}"

    return UNIT_RE.sub(repl, segment)


def transform(s: str) -> tuple[str, int]:
    """Process all math segments in `s`. Returns (new_text, change_count)."""
    if MATH_OPEN not in s:
        return s, 0
    out: list[str] = []
    changes = 0
    i = 0
    while i < len(s):
        start = s.find(MATH_OPEN, i)
        if start == -1:
            out.append(s[i:])
            break
        out.append(s[i:start])
        end = s.find(MATH_CLOSE, start + 1)
        if end == -1:
            out.append(s[start:])
            break
        segment = s[start + 1:end]
        new_segment = wrap_in_segment(segment)
        if new_segment != segment:
            changes += 1
        out.append(MATH_OPEN + new_segment + MATH_CLOSE)
        i = end + 1
    return "".join(out), changes


def walk(obj):
    """Yield (set_callback, str) for every string field in a nested JSON."""
    if isinstance(obj, str):
        return obj
    if isinstance(obj, list):
        for i, item in enumerate(obj):
            new = walk(item)
            if new is not None and new != item:
                obj[i] = new
        return obj
    if isinstance(obj, dict):
        for k, v in obj.items():
            new = walk(v)
            if new is not None and new != v:
                obj[k] = new
        return obj
    return obj


def process_file(path: Path, apply: bool) -> int:
    """Apply transform to every string in the JSON file. Returns total
    segment changes."""
    data = json.loads(path.read_text())
    total = [0]

    def recurse(o):
        if isinstance(o, str):
            new, n = transform(o)
            total[0] += n
            return new
        if isinstance(o, list):
            return [recurse(x) for x in o]
        if isinstance(o, dict):
            return {k: recurse(v) for k, v in o.items()}
        return o

    new_data = recurse(data)
    if total[0] > 0 and apply:
        path.write_text(json.dumps(new_data, ensure_ascii=False, indent=2))
    return total[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Write changes (default: dry run)")
    args = ap.parse_args()

    targets = [
        ("data/parsed", "*.json"),
        ("data/explanations", "*.json"),
        ("app/public/data", "*.json"),
        ("app/public/explanations", "*.json"),
    ]
    grand_total = 0
    files_touched = 0
    for dirpath, pattern in targets:
        d = ROOT / dirpath
        if not d.exists():
            continue
        for f in sorted(d.glob(pattern)):
            if f.name.startswith("_"):
                continue
            n = process_file(f, args.apply)
            if n > 0:
                files_touched += 1
                grand_total += n
                print(f"  {f.relative_to(ROOT)}: {n} segments")
    print()
    print(f"Total math segments touched: {grand_total}")
    print(f"Files affected: {files_touched}")
    if args.apply:
        print("Mode: APPLIED")
    else:
        print("Mode: DRY RUN (re-run with --apply)")


if __name__ == "__main__":
    main()
