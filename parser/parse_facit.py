#!/usr/bin/env python3
"""
Parse a HP facit (answer key) PDF into {provpass -> {q_number -> letter}}.

Two facit layouts are seen in the wild:

  Layout A — 4-column grid (var-2026, var-2025, var-2024, …)
  ──────────────────────────────────────────────────────────
  Header lines stack at the top:
    "Provpass 2 (= DYS 1)" / "Provpass 3 (= DYS 2)" / … (4 lines)
    "Verbal del al" / "Kvantitativ del ny" / "Verbal del ne" / "Kvantitativ del if"
  Body: 40 rows × 4 cols of "<n> <letter>" pairs, emitted left-to-right
  per row by PyMuPDF's default text extraction (verified empirically).

  Layout B — per-provpass blocks (host-2021, host-2022, host-2023, …)
  ──────────────────────────────────────────────────────────────────
  Each provpass appears as its own block:
    "Provpass 2 (= DYS 1)"
    "Kvantitativ del me"
    "1 C", "2 C", … "40 D"
    "Provpass 3 (= DYS 2)"
    "Verbal del ty"
    "1 E", "2 E", …

In both layouts, the section-type line tells us which provpass key the
block maps to (first Verbal block → verb1, second → verb2, ditto Kvant).

We try Layout A first (faster, well-tested). If column inference fails
or the body is short on pairs, we fall back to Layout B.
"""
from __future__ import annotations

import re
from pathlib import Path

import fitz  # PyMuPDF

# Each facit cell is "<digit+>\s+<A-E>" — capture both.
PAIR_RE = re.compile(r"\b(\d{1,2})\s+([A-E])\b")

# Section-type marker lines (one per column) appear in this fixed order.
# Some older PDFs break "Verbal" / "Kvantitativ" mid-word across glyph runs
# ("Ver\n \nbal del"), so we allow whitespace BETWEEN every letter too.
VERBAL_RE = re.compile(r"V\s*e\s*r\s*b\s*a\s*l\s+del", re.IGNORECASE)
KVANT_RE = re.compile(r"K\s*v\s*a\s*n\s*t\s*i\s*t\s*a\s*t\s*i\s*v\s+del", re.IGNORECASE)


def _column_provpass_map(text: str) -> list[str]:
    """Walk the header lines in order; emit verb1/verb2 then kvant1/kvant2
    based on the order in which Verbal/Kvant markers appear."""
    out: list[str] = []
    v_seen = q_seen = 0
    for line in text.splitlines():
        if VERBAL_RE.search(line):
            v_seen += 1
            out.append(f"verb{v_seen}")
        elif KVANT_RE.search(line):
            q_seen += 1
            out.append(f"kvant{q_seen}")
        if len(out) == 4:
            break
    if len(out) != 4:
        raise ValueError(f"Could not infer 4 columns from facit header (got {out})")
    return out


def _try_layout_a(text: str) -> dict[str, dict[int, str]]:
    """Parse the 4-column grid layout (var-2026 era)."""
    columns = _column_provpass_map(text)

    # Strip the header so we don't accidentally match "Provpass 2" as "2 P".
    body_start = max(text.find("Verbal del"), text.find("Kvantitativ del"))
    body_start = text.find("\n", body_start) if body_start != -1 else 0
    pairs = PAIR_RE.findall(text[body_start:])

    if len(pairs) < 40 * 4:
        raise ValueError(f"Expected ≥160 facit pairs, got {len(pairs)}")

    out: dict[str, dict[int, str]] = {p: {} for p in columns}
    for i in range(40):
        for c in range(4):
            num_str, letter = pairs[i * 4 + c]
            num = int(num_str)
            if num != i + 1:
                raise ValueError(f"Row {i} col {c}: expected q={i+1}, got {num}")
            out[columns[c]][num] = letter
    return out


# Per-provpass header in layout B: "Provpass 2 (= DYS 1)" or just "Provpass 2".
PROVPASS_HEADER_RE = re.compile(r"\bProvpass\s+\d+\b", re.IGNORECASE)


def _try_layout_b(text: str) -> dict[str, dict[int, str]]:
    """Parse the per-provpass-block layout (host-2021+ era)."""
    # Locate every "Provpass N" header; the body for each runs to the next
    # header (or EOF). Each block has its own section-type marker line.
    headers = list(PROVPASS_HEADER_RE.finditer(text))
    if len(headers) < 4:
        raise ValueError(
            f"Expected ≥4 Provpass blocks for layout B, found {len(headers)}",
        )

    # Slice the text into blocks aligned with each Provpass header.
    blocks: list[str] = []
    for i, m in enumerate(headers[:4]):
        start = m.start()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        blocks.append(text[start:end])

    # Walk blocks in order; assign verb1/verb2/kvant1/kvant2 by encounter.
    out: dict[str, dict[int, str]] = {}
    v_seen = q_seen = 0
    for block in blocks:
        if VERBAL_RE.search(block):
            v_seen += 1
            key = f"verb{v_seen}"
        elif KVANT_RE.search(block):
            q_seen += 1
            key = f"kvant{q_seen}"
        else:
            raise ValueError(
                "Provpass block missing section-type line (Verbal/Kvantitativ del)"
            )
        # Strip everything before the section-type line so we don't match
        # "Provpass 2" as a (num, letter) pair.
        type_m = VERBAL_RE.search(block) or KVANT_RE.search(block)
        body = block[type_m.end() :] if type_m else block
        pairs = PAIR_RE.findall(body)
        if len(pairs) < 40:
            raise ValueError(
                f"Block for {key}: expected ≥40 pairs, got {len(pairs)}"
            )
        out[key] = {}
        for num_str, letter in pairs[:40]:
            out[key][int(num_str)] = letter

    if set(out.keys()) != {"verb1", "verb2", "kvant1", "kvant2"}:
        raise ValueError(f"Layout B produced wrong provpass set: {sorted(out.keys())}")
    return out


def parse_facit(pdf_path: Path) -> dict[str, dict[int, str]]:
    doc = fitz.open(pdf_path)
    text = "".join(doc[p].get_text() for p in range(doc.page_count))
    doc.close()

    # Try layout A first (cheaper, narrower). Fall back to B on any failure.
    try:
        return _try_layout_a(text)
    except ValueError as exc_a:
        try:
            return _try_layout_b(text)
        except ValueError as exc_b:
            raise ValueError(
                f"Facit layout unrecognised. A: {exc_a}. B: {exc_b}"
            ) from exc_b


if __name__ == "__main__":
    import json
    import sys

    target = Path(sys.argv[1] if len(sys.argv) > 1 else "data/pdfs/var-2026/facit.pdf")
    print(json.dumps(parse_facit(target), indent=2, ensure_ascii=False))
