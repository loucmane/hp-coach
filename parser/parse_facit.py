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
import shutil
import subprocess
import tempfile
from pathlib import Path

import fitz  # PyMuPDF

# Each facit cell is "<digit+><whitespace?><A-E>" — OCR'd PDFs sometimes
# strip the space ("1A" vs "1 A"), so whitespace is optional. The leading
# and trailing word boundaries keep us from gluing onto neighbouring tokens.
PAIR_RE = re.compile(r"\b(\d{1,2})\s*([A-E])\b")

# Section-type marker lines (one per column) appear in this fixed order.
# Some older PDFs break "Verbal" / "Kvantitativ" mid-word across glyph runs
# ("Ver\n \nbal del"), so we allow whitespace BETWEEN every letter too.
VERBAL_RE = re.compile(r"V\s*e\s*r\s*b\s*a\s*l\s+del", re.IGNORECASE)
KVANT_RE = re.compile(r"K\s*v\s*a\s*n\s*t\s*i\s*t\s*a\s*t\s*i\s*v\s+del", re.IGNORECASE)


def _column_provpass_map(text: str) -> list[str]:
    """Find the 4 column markers (Verbal del / Kvantitativ del) in their
    order of appearance and map each one to verb1/verb2/kvant1/kvant2.

    Walks the whole text rather than line-by-line — OCR'd PDFs sometimes
    pack all four markers onto a single line, while old PDFs put each on
    its own line; one regex sweep handles both. We stop at the first 4
    matches and verify we found a sensible mix.
    """
    matches: list[tuple[int, str]] = []
    for m in VERBAL_RE.finditer(text):
        matches.append((m.start(), "verb"))
    for m in KVANT_RE.finditer(text):
        matches.append((m.start(), "kvant"))
    matches.sort()

    out: list[str] = []
    v_seen = q_seen = 0
    for _pos, kind in matches:
        if kind == "verb":
            v_seen += 1
            out.append(f"verb{v_seen}")
        else:
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


def _try_layout_c(pdf_path: Path) -> dict[str, dict[int, str]]:
    """Bbox-aware extraction. Falls back here when text order is reflowed
    (host-2022, host-2023) — the data is on the page in 4 columns × 40
    rows, but PyMuPDF emits tokens in a different sequence than reading
    order. We use word-level positions to recover the grid:

      1. Find the 4 section-type tokens (Verbal/Kvantitativ) → column
         x-anchors + verb1/verb2/kvant1/kvant2 mapping.
      2. For each digit-like token in 1..40, find the letter A-E in the
         same row to its immediate right.
      3. Bucket each (number, letter) into the column whose anchor x is
         closest to the digit's x, then into that column's provpass.
    """
    doc = fitz.open(pdf_path)
    words: list[tuple[float, float, float, float, str, int, int, int]] = []
    for page in doc:
        # tuple shape: (x0, y0, x1, y1, text, block_no, line_no, word_no)
        words.extend(page.get_text("words"))
    doc.close()

    # ── 1. column anchors ────────────────────────────────────────────────
    # The PDF sometimes splits "Kvantitativ" into "Kva" + "ntitativ" or
    # "Verbal" into "Ver" + "bal" across separate runs. We accept any of
    # those leading tokens as the column anchor.
    cols: list[tuple[float, str]] = []  # (x_anchor, 'verb'|'kvant')
    for w in words:
        text = w[4]
        if text in ("Verbal", "Ver"):
            cols.append((w[0], "verb"))
        elif text in ("Kvantitativ", "Kva"):
            cols.append((w[0], "kvant"))
    cols.sort(key=lambda c: c[0])
    if len(cols) != 4:
        raise ValueError(
            f"Expected 4 section-type column anchors, got {len(cols)}: "
            f"{[c[1] for c in cols]}"
        )

    col_anchors = [c[0] for c in cols]
    v_seen = q_seen = 0
    col_map: list[str] = []
    for _x, kind in cols:
        if kind == "verb":
            v_seen += 1
            col_map.append(f"verb{v_seen}")
        else:
            q_seen += 1
            col_map.append(f"kvant{q_seen}")

    # ── 2. find (number, letter) pairs by spatial proximity ──────────────
    # Header tokens live above the answer grid; skip anything above the
    # first row of numbers (y of the topmost "1").
    digit_words = [
        w for w in words
        if w[4].isdigit() and 1 <= int(w[4]) <= 40
    ]
    letter_words = [w for w in words if w[4] in {"A", "B", "C", "D", "E"}]
    if not digit_words:
        raise ValueError("No digit tokens found")

    out: dict[str, dict[int, str]] = {p: {} for p in col_map}

    for d in digit_words:
        d_x, d_y = d[0], d[1]
        n = int(d[4])
        # Find letters in the same row (small y delta), to the right.
        candidates = [
            l for l in letter_words
            if abs(l[1] - d_y) < 4 and l[0] > d_x and l[0] - d_x < 40
        ]
        if not candidates:
            continue
        letter = min(candidates, key=lambda l: l[0])[4]
        # Column = nearest anchor.
        col_idx = min(
            range(4), key=lambda i: abs(col_anchors[i] - d_x)
        )
        provpass = col_map[col_idx]
        # Don't overwrite — first hit wins. Helps when the header itself
        # has tokens like "(= DYS 1)" that match digit pattern.
        if n not in out[provpass]:
            out[provpass][n] = letter

    # Validate: each provpass should have all 40 questions.
    missing = {p: sorted(set(range(1, 41)) - set(qs.keys())) for p, qs in out.items()}
    if any(missing.values()):
        raise ValueError(f"Layout C: incomplete coverage. Missing: {missing}")
    return out


def _ocr_pdf(pdf_path: Path) -> str:
    """Render every page to a high-DPI image and run tesseract.
    Used as a third fallback when the PDF has a broken ToUnicode CMap
    (host-2016/17/18 era) — PyMuPDF and pdftotext both return shifted
    glyph indices we can't decode otherwise.
    """
    if not shutil.which("tesseract"):
        raise RuntimeError(
            "tesseract not installed — apt install tesseract-ocr tesseract-ocr-swe"
        )
    doc = fitz.open(pdf_path)
    chunks: list[str] = []
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        for pno in range(doc.page_count):
            png_path = tmp_dir / f"p{pno}.png"
            doc[pno].get_pixmap(dpi=300).save(png_path)
            txt_stem = tmp_dir / f"p{pno}"
            # tesseract writes <stem>.txt; we read it back.
            subprocess.run(
                ["tesseract", str(png_path), str(txt_stem), "-l", "swe+eng"],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            chunks.append((tmp_dir / f"p{pno}.txt").read_text(encoding="utf-8"))
    doc.close()
    return "\n".join(chunks)


def parse_facit(pdf_path: Path) -> dict[str, dict[int, str]]:
    """Try layouts in increasing cost order:
      A. flat text, 4-column grid             (var-2026 era)
      B. flat text, per-provpass blocks       (host-2021 era)
      C. word-level bbox extraction           (host-2022, host-2023 — reflowed)
      OCR + A/B/C. tesseract fallback         (host-2016/17/18 — broken CMap)
    """
    doc = fitz.open(pdf_path)
    text = "".join(doc[p].get_text() for p in range(doc.page_count))
    doc.close()

    try:
        return _try_layout_a(text)
    except ValueError as exc_a:
        pass
    try:
        return _try_layout_b(text)
    except ValueError as exc_b:
        pass
    try:
        return _try_layout_c(pdf_path)
    except ValueError as exc_c:
        pass

    # All flat-text + bbox attempts failed → OCR fallback.
    try:
        ocr_text = _ocr_pdf(pdf_path)
    except Exception as exc_ocr:
        raise ValueError(
            f"Facit layout unrecognised. A: {exc_a}. B: {exc_b}. "
            f"C: {exc_c}. OCR setup: {exc_ocr}"
        ) from exc_c
    try:
        return _try_layout_a(ocr_text)
    except ValueError as exc_oa:
        pass
    try:
        return _try_layout_b(ocr_text)
    except ValueError as exc_ob:
        raise ValueError(
            f"Facit layout unrecognised even after OCR. "
            f"A: {exc_a}. B: {exc_b}. C: {exc_c}. "
            f"OCR-A: {exc_oa}. OCR-B: {exc_ob}"
        ) from exc_ob


if __name__ == "__main__":
    import json
    import sys

    target = Path(sys.argv[1] if len(sys.argv) > 1 else "data/pdfs/var-2026/facit.pdf")
    print(json.dumps(parse_facit(target), indent=2, ensure_ascii=False))
