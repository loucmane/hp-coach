#!/usr/bin/env python3
"""Replace leaked Python template strings `{m('<latex>')}` with proper
PUA-wrapped LaTeX.

One Variant-C regen subagent wrote f-string templates like
    f"omkretsen är {m('\\pi d')}, inte d"
without actually calling the `m()` helper — the literal text
`{m('\\pi d')}` ended up in the output JSON. KaTeX doesn't interpret
it; the user sees it as raw text.

Sweep all explanations and replace each `{m('<latex>')}` (or with
double quotes) with U+E000 + <latex> + U+E001.

Idempotent: if no template strings are present, no change.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

E0 = ""
E1 = ""

# Matches {m('...')} or {m("...")}. The LaTeX inside may contain
# backslashes and braces but not the matching quote.
TEMPLATE_RE = re.compile(r"\{m\((['\"])((?:[^'\"\\]|\\.)*)\1\)\}")


def fix_text(text: str) -> tuple[str, int]:
    if not text or "{m(" not in text:
        return text, 0
    changes = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal changes
        changes += 1
        latex = match.group(2)
        # Unescape any \\ that the original Python string had — in JSON
        # those came through as \\, so we want a single \.
        # Actually the JSON file already has the right backslash count
        # for LaTeX (\\frac for KaTeX). Leave as-is.
        return f"{E0}{latex}{E1}"

    new = TEMPLATE_RE.sub(repl, text)
    return new, changes


def walk_json(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str):
                yield obj, k
            else:
                yield from walk_json(v)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, str):
                yield obj, i
            else:
                yield from walk_json(v)


def patch_file(path: Path, dry_run: bool) -> int:
    data = json.loads(path.read_text())
    total = 0
    for parent, key in walk_json(data):
        new, n = fix_text(parent[key])
        if n > 0:
            parent[key] = new
            total += n
    if total > 0 and not dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return total


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    total = 0
    files = 0
    for dirname in ("data/explanations", "app/public/explanations"):
        d = REPO_ROOT / dirname
        if not d.exists():
            continue
        print(f"Sweeping {d}...")
        for path in sorted(d.glob("*.json")):
            if path.name.startswith("_"):
                continue
            n = patch_file(path, args.dry_run)
            if n > 0:
                print(f"  {path.name}: {n} template strings replaced")
                files += 1
                total += n
    print(f"\nTotal: {total} template strings replaced across {files} files")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
