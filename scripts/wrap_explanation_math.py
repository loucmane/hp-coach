#!/usr/bin/env python3
"""Wrap unwrapped LaTeX in Variant-C explanation step text with PUA delimiters.

MathText only typesets content wrapped in U+E000/U+E001 PUA delimiters
as KaTeX. Outside the delimiters, text renders literally — so a step
text like "Vi har 47^{2} = 2209" shows up as raw `47^{2}` not 47².

Surfaced live during /diagnostik dogfood on var-2017-KVA-019 (Step 4
read "50^{2} = 2500. 2 \\cdot 50 \\cdot 3 = 300. ..." with raw LaTeX
visible).

Approach: scan each step.text (plus pitfall, distractor.why_tempting,
distractor.why_wrong, sub_text) for math anchors (`\\command`, `^{...}`,
`_{...}`), expand each anchor outward to grab its surrounding math
expression (operators + operands), and wrap each contiguous math span
in PUA delimiters.

Idempotent: a math span that's already inside an existing PUA pair
is skipped (no double-wrapping).

Usage:
    python3 scripts/wrap_explanation_math.py [--dry-run] [--limit N]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EXPLANATIONS_DIR = REPO_ROOT / "data" / "explanations"
APP_PUBLIC_DIR = REPO_ROOT / "app" / "public" / "explanations"

# Use escape form — Write tool strips literal PUA bytes.
E0 = ""
E1 = ""

# Anchor patterns that mark a token as "math-bearing".
#   - \cmd            e.g. \frac, \cdot, \sqrt, \pi, \mathrm
#   - ^{...}, _{...}  superscript / subscript
LATEX_ANCHOR = re.compile(r"\\[a-zA-Z]+|\^\{[^}]+\}|_\{[^}]+\}")

# Math operators that connect operands within a single math zone.
# Unicode `·` is the Swedish/HP convention for multiplication.
MATH_OPERATORS = {
    "+", "-", "=", "·", "*", "/", "<", ">",
    "≤", "≥", "≠", "≈", "±",
    "→", "⇒", "⇔",
}

# Tokens that are MATH operands when surrounded by other math content.
# Each alt below covers a class of operand seen in HP math prose; the
# trailing sup/sub group is optional.
OPERAND_RE = re.compile(
    r"^[+\-]?"
    r"(?:"
    r"\d+(?:[,.]\d+)?%?[a-zA-Z]*"  # 2500, 0,05, 5%, 47.5, 3x, 2y²
    r"|[a-zA-Z]\([^)]*\)"          # f(x), sin(x)  — must come before single-letter
    r"|[a-zA-Z]"                   # single variable: x, a, n
    r"|\([^)]*\)"                  # (a+b), (50-3)
    r")"
    r"(?:\^\{[^}]+\}|_\{[^}]+\})?"
    r"$"
)

# Compound LaTeX command + braces  (e.g. \frac{a}{b}, \mathrm{kg}).
LATEX_COMMAND_FULL = re.compile(r"\\[a-zA-Z]+(?:\{[^}]*\})*")


def is_math_operator(token: str) -> bool:
    return token in MATH_OPERATORS or LATEX_COMMAND_FULL.fullmatch(token) is not None


def is_math_token(token: str) -> bool:
    """A token that is itself a math operand, operator, or carries LaTeX."""
    if LATEX_ANCHOR.search(token):
        return True
    if token in MATH_OPERATORS:
        return True
    if LATEX_COMMAND_FULL.fullmatch(token):
        return True
    return False


def is_math_or_operand(token: str) -> bool:
    """Math-anchored, operator, OR plain operand (digit/variable/paren)."""
    if is_math_token(token):
        return True
    return OPERAND_RE.match(token) is not None


def split_tokens(text: str) -> list[tuple[str, str]]:
    """Return [(kind, value), ...] where kind ∈ {'ws', 'tok'}.

    'ws' preserves the exact whitespace between tokens (including
    newlines + multiple spaces). 'tok' is one non-whitespace run.
    Reassembly is "".join(v for _, v in result), which restores the
    original text byte-for-byte.
    """
    out: list[tuple[str, str]] = []
    i = 0
    n = len(text)
    while i < n:
        if text[i].isspace():
            j = i
            while j < n and text[j].isspace():
                j += 1
            out.append(("ws", text[i:j]))
            i = j
        else:
            j = i
            while j < n and not text[j].isspace():
                j += 1
            out.append(("tok", text[i:j]))
            i = j
    return out


def strip_trailing_punct(token: str) -> tuple[str, str]:
    """Split a token into (core, trailing_punct). E.g. '2500.' → ('2500', '.').

    Punctuation that anchors to sentence/clause boundaries should stay
    OUTSIDE the PUA wrap so the wrap doesn't end mid-sentence.
    """
    m = re.match(r"^(.*?)([.,;:?!]+)$", token)
    if not m:
        return token, ""
    return m.group(1), m.group(2)


def strip_leading_punct(token: str) -> tuple[str, str]:
    """No-op: opening paren / bracket is part of the math operand
    (e.g. `(50-3)^{2}`) so we keep it inside any wrap that would form
    around the token. Kept as a function for symmetry with the
    trailing-punct splitter."""
    return "", token


def _wrap_segmented(text: str) -> tuple[str, int]:
    """Split text on PUA spans (E0..E1) and process only the segments
    that fall OUTSIDE any span. Inside-span content is preserved
    verbatim. Mismatched delimiters (rare) cause us to bail and
    return text unchanged — safer than corrupting the wrap."""
    # Build segments: list of (kind, value) where kind ∈ {'out','in'}.
    segments: list[tuple[str, str]] = []
    i = 0
    n = len(text)
    while i < n:
        if text[i] == E0:
            # Find matching E1.
            j = text.find(E1, i + 1)
            if j == -1:
                # Unpaired E0 — bail.
                return text, 0
            segments.append(("in", text[i:j + 1]))
            i = j + 1
        elif text[i] == E1:
            # Stray E1 — bail.
            return text, 0
        else:
            # Outside segment: read until next E0 (or EOF).
            j = text.find(E0, i)
            if j == -1:
                segments.append(("out", text[i:]))
                i = n
            else:
                segments.append(("out", text[i:j]))
                i = j

    total_wraps = 0
    pieces: list[str] = []
    for kind, val in segments:
        if kind == "in":
            pieces.append(val)
        else:
            # Out segment is PUA-free by construction. Call the
            # PUA-free helper directly to avoid any chance of
            # infinite recursion if a stray PUA byte slips in.
            if val and LATEX_ANCHOR.search(val):
                new, n_w = _wrap_pua_free(val)
                pieces.append(new)
                total_wraps += n_w
            else:
                pieces.append(val)
    return "".join(pieces), total_wraps


def has_unpaired_pua(text: str) -> bool:
    """True if the substring contains a PUA delimiter — indicates we're
    already inside (or straddling) an existing wrap."""
    return E0 in text or E1 in text


def wrap_math_in_text(text: str) -> tuple[str, int]:
    """Wrap math zones in PUA delimiters across regions OUTSIDE any
    existing PUA-protected span.

    If the input already has E0..E1 spans, those are left untouched —
    we only operate on the gaps between them. Without this guard the
    wrapper would mistake the inner `=` of a wrapped expression as a
    fresh anchor and re-wrap a sub-span, leaving mismatched delimiters.
    """
    if not text:
        return text, 0
    if E0 in text or E1 in text:
        return _wrap_segmented(text)
    if not LATEX_ANCHOR.search(text):
        return text, 0
    return _wrap_pua_free(text)


def _wrap_pua_free(text: str) -> tuple[str, int]:
    """Wrap math zones in a string guaranteed to contain no PUA delimiters."""
    parts = split_tokens(text)
    n = len(parts)
    wraps = 0

    i = 0
    out: list[str] = []
    while i < n:
        kind, val = parts[i]
        if kind != "tok":
            out.append(val)
            i += 1
            continue

        # Strip leading/trailing punctuation. (Lead is a no-op now;
        # parens stay attached so `(50-3)^{2}` wraps whole.)
        lead, core = strip_leading_punct(val)
        core_trim, trail = strip_trailing_punct(core)

        if not is_math_token(core_trim):
            out.append(val)
            i += 1
            continue

        # Found a math anchor — extend the zone left then right.
        zone_tokens: list[str] = [core_trim]
        zone_end_in_parts = i  # last parts-index inside the zone
        # Trailing punct captured AT zone end. Starts with this token's
        # own trail; overwritten as we extend rightward.
        final_trail = trail

        # ── Left extension ─────────────────────────────────────────
        # Pop already-emitted operand/operator tokens off `out` while
        # they look like math context for the anchor (e.g. `2` before
        # `\cdot`). Stop at sentence-ending punctuation or non-math.
        # `out` ends with the ws BEFORE the anchor, so out[-1] is ws
        # and out[-2] is the previous tok.
        left_absorbed: list[str] = []
        while len(out) >= 2:
            prev_ws = out[-1]
            prev_tok = out[-2]
            if prev_ws.strip() != "":
                # Not pure whitespace — we're at a non-token boundary
                # we shouldn't cross.
                break
            prev_core_trim, prev_trail = strip_trailing_punct(prev_tok)
            if prev_trail:
                # Sentence boundary BEFORE our anchor — don't absorb
                # past it.
                break
            if not is_math_or_operand(prev_core_trim):
                break
            # Pop ws then tok off out
            out.pop()  # ws
            out.pop()  # tok
            left_absorbed.insert(0, prev_core_trim)
        if left_absorbed:
            zone_tokens = left_absorbed + zone_tokens

        # ── Right extension ────────────────────────────────────────
        j = i + 1
        while j < n:
            # Need: ws then tok then ...
            if j + 1 >= n:
                break
            if parts[j][0] != "ws":
                break
            next_tok = parts[j + 1][1]
            next_lead, next_core = strip_leading_punct(next_tok)
            next_core_trim, next_trail = strip_trailing_punct(next_core)
            if not is_math_or_operand(next_core_trim):
                break
            # If the leading paren is unusual (e.g. word-like), bail.
            # If trailing punct is sentence-ending, absorb the token
            # but stop after this iteration.
            zone_tokens.append(next_lead + next_core_trim)
            zone_end_in_parts = j + 1
            # The absorbed token may itself carry trailing punct — that
            # becomes the new "trail" emitted after the wrap closes,
            # overriding any prior anchor-token trail.
            final_trail = next_trail
            j += 2
            if next_trail:
                # Sentence-ending punctuation closes the zone.
                break

        # If the zone is just the single anchor token with no neighbors,
        # we still wrap it — single-operator/single-superscript still
        # needs PUA for KaTeX rendering.
        zone_text = " ".join(zone_tokens)
        # Refuse to wrap if zone is already inside a PUA span (caller's
        # responsibility is per-step, so straddling shouldn't happen,
        # but guard anyway).
        if has_unpaired_pua(zone_text):
            out.append(val)
            i += 1
            continue

        out.append(lead + E0 + zone_text + E1 + final_trail)
        wraps += 1

        # Advance past the consumed parts.
        if zone_end_in_parts == i:
            i += 1
        else:
            i = zone_end_in_parts + 1

    return "".join(out), wraps


def patch_field(entry: dict, key: str) -> int:
    val = entry.get(key)
    if not isinstance(val, str):
        return 0
    new, n = wrap_math_in_text(val)
    if n > 0:
        entry[key] = new
    return n


def patch_explanation(data: dict) -> int:
    """Mutate `data` in place; return total wraps added."""
    total = 0
    for _qid, entry in data.items():
        if not isinstance(entry, dict):
            continue
        # Steps — title + body + optional sub_text
        for step in entry.get("steps") or []:
            if not isinstance(step, dict):
                continue
            total += patch_field(step, "title")
            total += patch_field(step, "text")
            total += patch_field(step, "sub_text")
        # Distractors
        for d in entry.get("distractors") or []:
            if not isinstance(d, dict):
                continue
            total += patch_field(d, "why_tempting")
            total += patch_field(d, "why_wrong")
        # Pitfall / technique / insight (single-string fields)
        for key in ("pitfall", "technique", "insight"):
            total += patch_field(entry, key)
    return total


def sweep_dir(directory: Path, dry_run: bool, limit: int | None = None) -> int:
    total = 0
    files_touched = 0
    print(f"Sweeping {directory}...")
    for path in sorted(directory.glob("*.json")):
        if path.name.startswith("_"):
            continue
        if limit is not None and files_touched >= limit:
            break
        data = json.loads(path.read_text())
        n = patch_explanation(data)
        if n > 0:
            print(f"  {path.name}: {n} wraps added")
            if not dry_run:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
            files_touched += 1
            total += n
    return total


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--limit", type=int, default=None,
                   help="Stop after N files (for quick verification)")
    args = p.parse_args()

    canonical_n = sweep_dir(EXPLANATIONS_DIR, args.dry_run, args.limit)
    public_n = sweep_dir(APP_PUBLIC_DIR, args.dry_run, args.limit)
    print(f"\nTotals: {canonical_n} wraps in data/explanations · "
          f"{public_n} wraps in app/public/explanations")
    if args.dry_run:
        print("(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
