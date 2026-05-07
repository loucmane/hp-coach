#!/usr/bin/env python3
"""
Section-level parsers for HP exam PDFs.

We use PyMuPDF's `get_text("blocks")` to recover layout. Within each
block, the text is already correctly grouped (a single multiple-choice
option, or a question stem). The hard part is *reading order*: pages
mix 1- and 2-column layouts, and the default top-to-bottom block order
zig-zags across columns.

We solve this by classifying each block's column from its `x0` against
the page midline, then sorting (column, y0) inside each column.

Currently implemented:
  parse_ord(pages)  — verbal ORD section, 2-column page layout
  parse_mek(pages)  — verbal MEK section, single-column long stems

Out of scope for this MVP (left for a later pass):
  LÄS, ELF, XYZ, KVA, NOG, DTK
These have passages, math, or images that need richer extraction.
"""
from __future__ import annotations

import re
from collections.abc import Iterator
from dataclasses import dataclass

import fitz  # PyMuPDF

# Block.text examples — note PyMuPDF inserts "\t\n" between the "marker" and
# the value within a single styled run, so we strip whitespace per token:
#   "1.\t\nprognos"   → question stem "1. prognos"
#   "A\t\nbesked"     → option A "besked"
QUESTION_HEAD_RE = re.compile(r"^\s*(\d{1,2})\.\s")
OPTION_HEAD_RE = re.compile(r"^\s*([A-E])\s")


@dataclass
class Block:
    x0: float
    y0: float
    text: str
    column: int  # 0 = left half, 1 = right half (or 0 for single-col pages)


def _iter_blocks(page: fitz.Page, *, two_column: bool) -> Iterator[Block]:
    """Yield text blocks tagged with column index."""
    midline = page.rect.width / 2
    for x0, y0, _x1, _y1, text, _bno, btype in page.get_text("blocks"):
        if btype != 0:  # skip image blocks
            continue
        text = text.strip()
        if not text:
            continue
        col = 1 if (two_column and x0 >= midline - 20) else 0
        yield Block(x0=x0, y0=y0, text=text, column=col)


def _normalize(text: str) -> str:
    """Collapse the tab+newline glyph PyMuPDF emits inside styled tokens."""
    return re.sub(r"\s+", " ", text).strip()


# ── ORD ────────────────────────────────────────────────────────────────────
# Page layout: 5 questions in left half (x≈71), 5 in right half (x≈333).
# Each question is 6 blocks: stem + 5 options A–E in y order.

def parse_ord(pages: list[fitz.Page]) -> list[dict]:
    """Parse all ORD pages of a provpass into a list of question dicts."""
    questions: dict[int, dict] = {}
    for page in pages:
        blocks = list(_iter_blocks(page, two_column=True))
        # Sort: column first (left then right), then y top-to-bottom.
        blocks.sort(key=lambda b: (b.column, b.y0))
        current: dict | None = None
        for b in blocks:
            text = _normalize(b.text)
            qm = QUESTION_HEAD_RE.match(text)
            if qm:
                # Flush previous question (if any) before opening a new one.
                if current is not None and len(current["options"]) >= 4:
                    questions[current["number"]] = current
                num = int(qm.group(1))
                # Strip the "N." prefix from stem.
                stem = QUESTION_HEAD_RE.sub("", text).strip()
                current = {"number": num, "prompt": stem, "options": []}
                continue
            om = OPTION_HEAD_RE.match(text)
            if om and current is not None:
                value = OPTION_HEAD_RE.sub("", text).strip()
                current["options"].append({"letter": om.group(1), "text": value})
        if current is not None and len(current["options"]) >= 4:
            questions[current["number"]] = current

    # Return in question order (1..10), only those we successfully parsed.
    return [questions[n] for n in sorted(questions)]


# ── MEK ────────────────────────────────────────────────────────────────────
# Single-column layout. Question stems span multiple lines (with one or more
# `_____` blanks); options are A–D (only 4 options). PyMuPDF returns the stem
# as ONE block and each option as its own block, so we just need y-sort.

def parse_mek(pages: list[fitz.Page]) -> list[dict]:
    questions: dict[int, dict] = {}
    for page in pages:
        blocks = list(_iter_blocks(page, two_column=False))
        blocks.sort(key=lambda b: (b.column, b.y0))
        current: dict | None = None
        for b in blocks:
            text = _normalize(b.text)
            qm = QUESTION_HEAD_RE.match(text)
            if qm:
                if current is not None and len(current["options"]) >= 4:
                    questions[current["number"]] = current
                num = int(qm.group(1))
                stem = QUESTION_HEAD_RE.sub("", text).strip()
                current = {"number": num, "prompt": stem, "options": []}
                continue
            om = OPTION_HEAD_RE.match(text)
            if om and current is not None:
                value = OPTION_HEAD_RE.sub("", text).strip()
                current["options"].append({"letter": om.group(1), "text": value})
        if current is not None and len(current["options"]) >= 4:
            questions[current["number"]] = current
    return [questions[n] for n in sorted(questions)]


# ── page selection ─────────────────────────────────────────────────────────
# Each provpass PDF has cover + per-section pages. Modern exams (var-2017+)
# print a section header on each page ("ORD – Ordförståelse", "MEK –
# Meningskomplettering"). Older exams (var-2018-1 and earlier) often skip
# the header — questions start at the top of the page directly.
#
# We try both:
#   1. Header-text match (modern exams, fastest path)
#   2. Structural detection — find pages whose question blocks have numbers
#      in the section's expected range (older exams)
#
# The build script post-filters to its own section's number range, so a
# misclassified page (e.g. a LÄS page handed to parse_ord) emits questions
# that get dropped at the schema-merge step. Worst case is wasted parsing,
# never wrong data.

SECTION_HEADERS = {
    "ORD": ("ORD – Ordförståelse", "ORD"),
    "MEK": ("MEK – Meningskomplettering", "MEK"),
}

# Where each section's question numbers fall within its provpass.
SECTION_RANGES = {
    "ORD": range(1, 11),
    "LÄS": range(11, 21),
    "MEK": range(21, 31),
    "ELF": range(31, 41),
}


def _page_question_numbers(page: fitz.Page) -> set[int]:
    """Return the set of question numbers (1-40) whose stem block lives on
    this page. Used by the structural section detector."""
    nums: set[int] = set()
    for x0, y0, _x1, _y1, text, _bno, btype in page.get_text("blocks"):
        if btype != 0:
            continue
        m = QUESTION_HEAD_RE.match(text.strip())
        if m:
            nums.add(int(m.group(1)))
    return nums


def find_section_pages(doc: fitz.Document, section: str) -> list[fitz.Page]:
    """Return all pages whose contents belong to the given section."""
    primary, _short = SECTION_HEADERS[section]
    expected = SECTION_RANGES[section]
    pages: list[fitz.Page] = []
    for pno in range(doc.page_count):
        page = doc[pno]
        text = page.get_text()
        # Method 1: explicit header on the page (modern exams).
        if primary in text:
            pages.append(page)
            continue
        # Method 2: continuation page — first non-empty line is the short tag.
        if pages and text.lstrip().split("\n", 2)[1:2] == [section]:
            pages.append(page)
            continue
        # Method 3: structural — page contains question blocks whose numbers
        # fall in this section's range. Catches header-less older layouts.
        nums = _page_question_numbers(page)
        if nums and nums.issubset(set(expected)):
            pages.append(page)
    return pages


if __name__ == "__main__":
    import json
    import sys

    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "data/pdfs/var-2026/verb1.pdf"
    section = sys.argv[2] if len(sys.argv) > 2 else "ORD"
    doc = fitz.open(pdf_path)
    pages = find_section_pages(doc, section)
    print(f"  {section}: {len(pages)} pages found", file=sys.stderr)
    parser = {"ORD": parse_ord, "MEK": parse_mek}[section]
    questions = parser(pages)
    print(json.dumps(questions, indent=2, ensure_ascii=False))
