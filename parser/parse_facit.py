#!/usr/bin/env python3
"""
Parse a HP facit (answer key) PDF into {provpass -> {q_number -> letter}}.

Facit layout (var-2026 sample):
  Header lines per column:
    "Provpass 2 (= DYS 1)"       <- col 0
    "Provpass 3 (= DYS 2)"       <- col 1
    "Provpass 4 (= DYS 3)"       <- col 2
    "Provpass 5 (= DYS 4)"       <- col 3
    "Verbal del al"              <- col 0 type
    "Kvantitativ del ny"         <- col 1 type
    "Verbal del ne"              <- col 2 type
    "Kvantitativ del if"         <- col 3 type
  Body: 40 rows × 4 cols of "<n> <letter>" pairs, emitted left-to-right
  per row by PyMuPDF's default text extraction (verified empirically).

The two Verbal columns map to verb1/verb2 in column order; ditto Kvant
→ kvant1/kvant2. So the column→provpass mapping for var-2026 is:
  col 0 = verb1, col 1 = kvant1, col 2 = verb2, col 3 = kvant2.

Other exams may interleave V/Q differently; we derive the mapping from
the headers rather than hardcoding it.
"""
from __future__ import annotations

import re
from pathlib import Path

import fitz  # PyMuPDF

# Each facit cell is "<digit+>\s+<A-E>" — capture both.
PAIR_RE = re.compile(r"\b(\d{1,2})\s+([A-E])\b")

# Section-type marker lines (one per column) appear in this fixed order.
VERBAL_RE = re.compile(r"Verbal\s+del", re.IGNORECASE)
KVANT_RE = re.compile(r"Kvantitativ\s+del", re.IGNORECASE)


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


def parse_facit(pdf_path: Path) -> dict[str, dict[int, str]]:
    doc = fitz.open(pdf_path)
    if doc.page_count != 1:
        # All HP facit PDFs we've seen are 1 page; warn but continue.
        print(f"  warn: facit has {doc.page_count} pages; using page 0")
    text = doc[0].get_text()
    doc.close()

    columns = _column_provpass_map(text)

    # Strip the header so we don't accidentally match "Provpass 2" as "2 P".
    body_start = max(text.find("Verbal del"), text.find("Kvantitativ del"))
    body_start = text.find("\n", body_start) if body_start != -1 else 0
    pairs = PAIR_RE.findall(text[body_start:])

    if len(pairs) < 40 * 4:
        raise ValueError(f"Expected ≥160 facit pairs, got {len(pairs)}")

    out: dict[str, dict[int, str]] = {p: {} for p in columns}
    # Pairs come in (q1col0, q1col1, q1col2, q1col3, q2col0, ...).
    for i in range(40):
        for c in range(4):
            num_str, letter = pairs[i * 4 + c]
            num = int(num_str)
            if num != i + 1:
                raise ValueError(f"Row {i} col {c}: expected q={i+1}, got {num}")
            out[columns[c]][num] = letter
    return out


if __name__ == "__main__":
    import json
    import sys

    target = Path(sys.argv[1] if len(sys.argv) > 1 else "data/pdfs/var-2026/facit.pdf")
    print(json.dumps(parse_facit(target), indent=2, ensure_ascii=False))
