r"""Read-only audit of math fences in both explanation stores.

Run from any directory: python3 audit/corpus_lint/fence_balance.py
Exits 1 for malformed fences or unbalanced LaTeX groups, 0 for a clean corpus.
Locations include the question, field path, one-based step and span numbers.
Escaped braces (\\{ and \\}) are literal LaTeX characters, not groups.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterator


ROOT = Path(__file__).resolve().parents[2]
STORES = (ROOT / "data/explanations", ROOT / "app/public/explanations")
MATH_OPEN = "\uE000"
MATH_CLOSE = "\uE001"


def strings(value: object, field: str = "") -> Iterator[tuple[str, str]]:
    """Visit every string value, including nested steps and distractors."""
    if isinstance(value, str):
        yield field, value
    elif isinstance(value, dict):
        for key, child in value.items():
            yield from strings(child, f"{field}.{key}" if field else key)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from strings(child, f"{field}[{index}]")


def balanced_groups(latex: str) -> bool:
    """Skip escaped characters, and require every closing group to match."""
    depth = 0
    for token in re.findall(r"\\.|[{}]", latex, re.DOTALL):
        if token == "{":
            depth += 1
        elif token == "}":
            depth -= 1
            if depth < 0:
                return False
    return depth == 0


def fence_issues(text: str) -> Iterator[tuple[int, str]]:
    """Report incomplete/nested fences as well as unbalanced fenced groups."""
    start = None
    span = 0
    for index, char in enumerate(text):
        if char == MATH_OPEN:
            span += 1
            if start is not None:
                yield span, "nested opening fence"
            start = index + 1
        elif char == MATH_CLOSE:
            if start is None:
                yield span, "closing fence without opener"
            elif not balanced_groups(text[start:index]):
                yield span, "unbalanced braces"
            start = None
    if start is not None:
        yield span, "opening fence without closer"


def main() -> int:
    files = entries = spans = findings = 0
    for store in STORES:
        paths = sorted(store.glob("*.json"))
        if not paths:
            raise ValueError(f"No explanation files in {store}")
        for path in paths:
            corpus = json.loads(path.read_text(encoding="utf-8"))
            files += 1
            for qid, entry in corpus.items():
                entries += 1
                for field, text in strings(entry):
                    spans += text.count(MATH_OPEN)
                    for span, reason in fence_issues(text):
                        findings += 1
                        step = re.search(r"(?:^|\.)steps\[(\d+)\]", field)
                        step_number = str(int(step[1]) + 1) if step else "-"
                        print(
                            f"{path.relative_to(ROOT)} | {qid} | {field} | "
                            f"step {step_number} | span {span}: {reason}"
                        )
    print(f"{files} files, {entries} entries, {spans} fenced spans, {findings} findings")
    return int(findings > 0)


if __name__ == "__main__":
    raise SystemExit(main())
