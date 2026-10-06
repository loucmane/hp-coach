#!/usr/bin/env python3
"""Generate the Layer-2 font/style inventory from installed KaTeX, offline.

Run from any directory:
    python3 pipeline/synthetic/gates/scripts/katex_inventory.py

The JSON output is checked in: Python-only CI and the lint never need
node_modules. Regenerate after a KaTeX upgrade; the optional installed-source
test checks the exact output, including the version. The source files below
contain content-preserving font/style declarations, not arbitrary functions
or macros (which can insert, replace, or hide letters).

This is a narrow reader for KaTeX's names arrays, not a TypeScript interpreter.
It accepts literal arrays and references to constant literal arrays, and fails
on unsupported declarations so source changes require review.
"""
from __future__ import annotations

import argparse
import ast
import json
import re
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
DEFAULT_KATEX = SCRIPTS.parents[3] / "app/node_modules/katex"
DEFAULT_OUTPUT = SCRIPTS / "katex_style_commands.json"
SOURCES = (
    "src/functions/font.ts",      # math fonts, aliases, boldsymbol/bm, old fonts
    "src/functions/text.ts",      # text families, weights, shapes, emph
    "src/functions/pmb.ts",       # simulated bold
    "src/functions/styling.ts",   # display/text/script styles
    "src/functions/sizing.ts",    # font sizes, declared through sizeFuncs
)

# Preserve quoted strings while removing comments, including commented-out
# registrations and command names in comments. Templates are preserved too.
_STRING = r'"(?:\\.|[^"\\])*"' + r"|'(?:\\.|[^'\\])*'"
_TOKEN = re.compile(_STRING + r"|`(?:\\.|[^`\\])*`|//[^\n]*|/\*.*?\*/", re.DOTALL)
_CALL = re.compile(r"\bdefineFunction\s*\(")
_HEADER = re.compile(
    r"\bdefineFunction\s*\(\s*\{\s*type\s*:\s*(?:" + _STRING + r")\s*,\s*names\s*:\s*"
    r"(?P<names>\[[^\[\]]*\]|[A-Za-z_$][\w$]*)\s*,", re.DOTALL)


def commands_from_source(source: str) -> list[str]:
    """Read all registered command names in one selected KaTeX source file."""
    code = _TOKEN.sub(lambda m: " " if m.group().startswith(("//", "/*")) else m.group(), source)
    headers = list(_HEADER.finditer(code))
    if not headers or len(headers) != len(_CALL.findall(code)):
        raise ValueError("unsupported or missing defineFunction names declaration")
    commands = []
    for header in headers:
        names = header.group("names")
        if not names.startswith("["):
            declarations = re.findall(
                r"\bconst\s+" + re.escape(names) + r"\s*=\s*(\[[^\[\]]*\])\s*;", code)
            if len(declarations) != 1:
                raise ValueError(f"names must refer to one constant literal array: {names}")
            names = declarations[0]
        # Allow only comma-separated string literals (with a trailing comma).
        # No spreads, expressions, templates, or silent partial extraction.
        literal = re.compile(_STRING)
        body = names[1:-1].strip()
        if not re.fullmatch(r"(?:" + _STRING + r")(?:\s*,\s*(?:" + _STRING + r"))*\s*,?", body):
            raise ValueError("names must be a nonempty array of string literals")
        for token in literal.findall(body):
            name = ast.literal_eval(token)
            if not re.fullmatch(r"\\[A-Za-z]+", name):
                raise ValueError(f"unexpected font/style command: {name!r}")
            commands.append(name[1:])
    if len(commands) != len(set(commands)):
        raise ValueError("duplicate font/style command registration")
    return sorted(commands)


def generate_inventory(katex_root: Path) -> str:
    """Return deterministic JSON without machine-local paths or timestamps."""
    package = json.loads((katex_root / "package.json").read_text(encoding="utf-8"))
    if package["name"] != "katex":
        raise ValueError("expected the installed katex package")
    commands = set()
    for relative in SOURCES:
        try:
            names = commands_from_source((katex_root / relative).read_text(encoding="utf-8"))
        except ValueError as exc:
            raise ValueError(f"{relative}: {exc}") from exc
        if commands.intersection(names):
            raise ValueError(f"{relative}: command registered in multiple source files")
        commands.update(names)
    return json.dumps({
        "katex_version": package["version"],
        "sources": list(SOURCES),
        "commands": sorted(commands),
    }, indent=2) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--katex-root", type=Path, default=DEFAULT_KATEX,
                        help="installed KaTeX package directory (default: app/node_modules/katex)")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT,
                        help="generated JSON path (default: beside this script)")
    args = parser.parse_args()
    try:
        inventory = generate_inventory(args.katex_root)
    except (OSError, ValueError, KeyError) as exc:
        parser.error(f"cannot generate KaTeX inventory: {exc}")
    args.output.write_text(inventory, encoding="utf-8")


if __name__ == "__main__":
    main()
