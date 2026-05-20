#!/usr/bin/env python3
"""Restore missing ELF passage bodies in the corpus.

The parser dropped passage bodies for ~96 ELF questions across 22 exams
— their `context` field is either empty or only a stray title/rubric.
The actual article text IS available in the source PDFs at
data/pdfs/{exam_id}/verb{1,2}.pdf; this script extracts each ELF passage
column by column from the PDF, maps it to the qids it covers via the
question-number layout, and writes the restored body back into the
canonical data/parsed/ files AND the SPA-served app/public/data/ mirror.

Idempotent: any qid whose context is already >= MIN_CTX_LEN is skipped.

Strategy per exam · per verb half (verb1, verb2):
1.  Find ELF section start page via the `Engelsk läsförståelse` or
    `DELPROV ELF` markers, plus any standalone `ELF` section header.
2.  For each page in the ELF range, split into left/right columns at
    page midpoint and walk both columns top-to-bottom.
3.  Recognise three layouts:
        side-by-side  — left = passage(s), right = `Question` + number
                        per passage. One passage maps to one question.
        long passage  — multi-page article in column flow, followed by a
                        `Questions` page that lists multiple Q-numbers;
                        passage maps to all listed questions.
        cloze         — host-2020 verb2 only: rubric + body in left
                        column, gap alternatives in right column;
                        passage maps to the questions referenced by the
                        numeric gap markers embedded in the body.
4.  Strip page chrome (`ELF`, page numbers, `FORTSÄTT PÅ NÄSTA SIDA »`,
    `PROVET ÄR SLUT…`, `AND HERE ARE SOME SHORTER TEXTS:` and the
    section-list page banner) and rejoin column-wrap line breaks while
    keeping paragraph breaks.
5.  Compose new context as `<title>\n\n<body>\n\n<byline>` matching the
    existing populated-ELF style (`host-2020-verb1-ELF-033` etc.).

Usage:
    source venv/bin/activate
    python3 scripts/restore_elf_bodies.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import pdfplumber

REPO_ROOT = Path(__file__).resolve().parent.parent
PARSED_DIR = REPO_ROOT / "data" / "parsed"
APP_PUBLIC_DATA = REPO_ROOT / "app" / "public" / "data"
PDF_ROOT = REPO_ROOT / "data" / "pdfs"

# A context shorter than this is treated as missing the article body
# (only rubric / title / byline survived). 500 chars covers the longest
# legitimate cloze rubric we see in the corpus (~283 chars) with margin.
MIN_CTX_LEN = 500

# ELF qid pattern: {exam_id}-verb{1|2}-ELF-{NNN}
ELF_QID_RE = re.compile(r"^(?P<exam>[a-z0-9-]+)-verb(?P<half>[12])-ELF-(?P<num>\d{3})$")

# Page chrome we always drop (after column-split).
CHROME_LINE_PATTERNS = [
    re.compile(r"^ELF\s*$"),
    re.compile(r"^ELF\d+[A-Za-z]?_Del\s*\d.*$"),                # InDesign artefacts
    re.compile(r"^\s*[–-]\s*\d+\s*[–-]?\s*$"),                  # page-number "– 12 –"
    re.compile(r"^\s*\d+\s*[–-]\s*$"),                          # "5 –" tail
    re.compile(r"^\s*[–-]\s*\d+\s*$"),                          # "– 5" tail
    re.compile(r"^FORTSÄTT PÅ NÄSTA SIDA.*$"),
    re.compile(r"^PROVET ÄR SLUT.*$"),
    re.compile(r"^KONTROLLERA DINA SVAR\.?\s*$"),
    re.compile(r"^AND HERE ARE SOME SHORTER TEXTS:\s*$"),
    re.compile(r"^DELPROV ELF.*$"),
    re.compile(r"^DELPROV\s+EL\s*$"),                           # split mid-acronym
    re.compile(r"^Engelsk läsförståelse.*$"),
    re.compile(r"^Engels(k)?\s*$"),                             # truncated from column split
    re.compile(r"^Alternatives?\s*$"),                          # cloze right-col header
    re.compile(r"^DE\s*$"),                                     # truncated 'DELPROV' from column split
    re.compile(r"^Del\s*\d.*\d{4}-\d{2}-\d{2}.*$"),             # indd footer leftovers
    re.compile(r"^\d+\s*[–-]+\s*\d*\s*$"),                      # "11 – 11" / "1122 ––" / "11 –"
    re.compile(r"^[–-]+\s*\d+\s*[–-]*\s*\d*\s*$"),              # "– 11 –" / "–– 11" / "– 11"
    re.compile(r"^\d{4}-\d{2}-\d{2}\s+\d{1,2}[:.]\d{2}.*$"),    # indd timestamp footer
    re.compile(r".*\.indd\s+\d+.*$"),                           # indd filename row
]

# Question-block headers
QUESTION_HEADER_RE = re.compile(r"^Question\s*$")
QUESTIONS_HEADER_RE = re.compile(r"^Questions\s*$")
# A numbered question like "33." or "33. Which of the following..."
QUESTION_NUM_RE = re.compile(r"^(\d{2})\.\s")
# Standalone "33." line (cloze right column)
QUESTION_NUM_ONLY_RE = re.compile(r"^(\d{2})\.\s*$")
# Choice line: "A blah", "B blah"
CHOICE_LINE_RE = re.compile(r"^[ABCD]\s+\S")

# Likely byline patterns: short last line of a passage that looks like
# "Author Name, Publication". Heuristic only — we keep the byline as
# part of the body when in doubt.
BYLINE_HINTS = (", The ", ", Scientific ", ", International ", ", New York ", ", Time ",
                ", The Guardian", ", The Times", ", Aeon", ", Wired")


@dataclass
class Passage:
    title: str
    body_lines: list[str]
    byline: str | None
    # Vertical band on the page where this passage lives (used to align
    # with right-column Question blocks).
    y_top: float
    y_bot: float

    def render(self) -> str:
        body = "\n\n".join(_collapse_paragraphs(self.body_lines))
        parts = [self.title.strip(), body]
        if self.byline:
            parts.append(self.byline.strip())
        # Drop blank parts but keep order.
        return "\n\n".join(p for p in parts if p).strip()


def _is_chrome(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    return any(pat.match(s) for pat in CHROME_LINE_PATTERNS)


def _collapse_paragraphs(lines: list[str]) -> list[str]:
    """Join column-wrap line breaks; treat blank line as paragraph break.

    Existing populated contexts (e.g. host-2020-verb1-ELF-033) flatten
    paragraphs so each paragraph is one long line; consecutive sections
    are split by a blank line. Mimic that to keep the SPA's whitespace-
    pre-wrap render consistent across restored and pre-existing entries.
    """
    # Drop trailing chrome leftover (e.g. " 1122 ––" tail).
    cleaned: list[str] = []
    for raw in lines:
        s = raw.rstrip()
        if _is_chrome(s):
            continue
        # Strip an inline trailing folio token like "1122 ––" or "– 12 –".
        s = re.sub(r"\s+\d{1,4}\s*[–-]+\s*\d{0,4}\s*[–-]*\s*$", "", s)
        s = re.sub(r"\s+[–-]+\s*\d{1,4}\s*[–-]+\s*$", "", s)
        cleaned.append(s)
    paragraphs: list[list[str]] = [[]]
    for raw in cleaned:
        s = raw.rstrip()
        if not s.strip():
            if paragraphs[-1]:
                paragraphs.append([])
            continue
        paragraphs[-1].append(s.strip())
    out: list[str] = []
    for para in paragraphs:
        if not para:
            continue
        # Re-join wrapped lines with a space, preserving the soft-hyphen
        # convention used in pre-existing entries ("ele- phants" stays
        # as "ele- phants" with a literal hyphen+space).
        joined = " ".join(para)
        out.append(joined)
    return out


def _looks_like_byline(line: str) -> bool:
    s = line.strip()
    if not s or len(s) > 120:
        return False
    if any(hint in s for hint in BYLINE_HINTS):
        return True
    # Pattern: "Firstname Lastname, Publication"
    if re.match(r"^[A-Z][\w'’\.\- ]{2,}( & [A-Z][\w'’\.\- ]+)?,\s+[A-Z]", s):
        return True
    return False


def _column_text_with_positions(page, x0: float, x1: float) -> list[tuple[float, str]]:
    """Return (y, line) tuples for a vertical column slice."""
    bbox = (x0, 0, x1, page.height)
    crop = page.crop(bbox)
    # NOTE: `use_text_flow=True` silently drops the top-of-page section
    # header on some PDFs (it tries to honour the InDesign reading
    # order). Use the default mode and re-sort by y ourselves.
    words = crop.extract_words(keep_blank_chars=False)
    if not words:
        return []
    words = sorted(words, key=lambda w: (w["top"], w["x0"]))
    # Cluster words into lines by y (with tolerance), then sort each
    # line left→right by x0 so italic baselines that wrap slightly
    # offset still read in the correct order.
    lines: list[tuple[float, list[tuple[float, str]]]] = []
    tol = 5.0
    for w in words:
        y = w["top"]
        if lines and abs(y - lines[-1][0]) < tol:
            lines[-1][1].append((w["x0"], w["text"]))
        else:
            lines.append((y, [(w["x0"], w["text"])]))
    out: list[tuple[float, str]] = []
    for y, parts in lines:
        parts.sort(key=lambda xt: xt[0])
        out.append((y, " ".join(t for _, t in parts)))
    return out


def _find_column_split(page) -> float:
    """Find the x-coordinate that best separates the body column from
    the right-side alternative/question column on an ELF page.

    Cloze pages (rubric `In the following text there are gaps…`) use a
    wide body column with a narrow alternatives column on the right —
    page-mid lands in the middle of the body and splits words mid-line.
    For those pages, pick the LEFTMOST x-gap >= 12pt that sits between
    50% and 70% of the page width — that's the body→alternatives
    boundary. Larger gaps further right are just whitespace beyond the
    alternatives column.

    Non-cloze pages use page-mid (which lines up with the standard
    two-equal-column layout used for both side-by-side and long-body
    spreads).
    """
    text = page.extract_text() or ""
    is_cloze = "In the following text there are gaps" in text
    if not is_cloze:
        return page.width / 2
    words = page.extract_words()
    if not words:
        return page.width / 2
    xs = sorted({round(w["x0"]) for w in words})
    for i in range(1, len(xs)):
        gap = xs[i] - xs[i - 1]
        if gap < 10:
            continue
        mid = (xs[i] + xs[i - 1]) / 2
        if not (page.width * 0.50 <= mid <= page.width * 0.70):
            continue
        return mid
    return page.width / 2


def _find_elf_start(pdf) -> int | None:
    """Return 0-indexed page where ELF section begins, or None."""
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        if "DELPROV ELF" in text:
            return i
        if "Engelsk läsförståelse" in text:
            return i
    return None


def _parse_left_column_passages(left_lines: list[tuple[float, str]]) -> list[Passage]:
    """Walk top-to-bottom; carve passages by detecting title lines.

    Title detection uses the vertical gap to the previous line — a body
    paragraph wraps at ~14.5pt line height, a title-to-body gap is
    ~25pt, and the gap between two passage blocks is ~50pt+. Anything
    starting after a gap > 30pt that also looks like a heading (no
    sentence-ending punctuation, mostly capitalised words) is treated
    as a new title; otherwise it's body continuation.
    """
    passages: list[Passage] = []
    current: Passage | None = None
    in_questions_block = False

    cleaned: list[tuple[float, str]] = []
    for y, line in left_lines:
        if _is_chrome(line):
            continue
        cleaned.append((y, line))

    prev_y: float | None = None
    for y, line in cleaned:
        s = line.strip()
        if not s:
            continue
        gap = (y - prev_y) if prev_y is not None else 999.0
        prev_y = y
        if QUESTIONS_HEADER_RE.match(s) or QUESTION_NUM_RE.match(s):
            in_questions_block = True
        if in_questions_block:
            continue
        # Skip cloze rubric leftovers (the rubric wraps badly across
        # the column split).
        if s.startswith("In the following text there are gaps"):
            continue
        if s.startswith("correspond to each gap and decide"):
            continue
        # New title? Must be preceded by a visible vertical break AND
        # look heading-shaped.
        if gap > 30 and _looks_like_title(s):
            if current is not None:
                _finalize_byline(current)
                passages.append(current)
            current = Passage(title=s, body_lines=[], byline=None,
                              y_top=y, y_bot=y)
            continue
        if current is None:
            # Body without a preceding title on this page — continuation
            # of a multi-page passage. Caller will stitch onto the prior
            # page's last passage.
            current = Passage(title="", body_lines=[s], byline=None,
                              y_top=y, y_bot=y)
        else:
            current.body_lines.append(s)
            current.y_bot = y
    if current is not None:
        _finalize_byline(current)
        passages.append(current)
    return passages


def _looks_like_title(line: str) -> bool:
    """Heuristic: a passage title is a short line (<= 55 chars) that
    starts with a capital letter or digit, doesn't end with sentence
    punctuation (apart from `?`, which appears in titles like `Two
    Drinks a Day?`), and contains no internal commas/periods — titles
    are noun phrases, not sentences."""
    if len(line) > 55:
        return False
    if not re.match(r"^[A-Z0-9“\"]", line):
        return False
    # Ends with hyphen ⇒ wrapped body line, never a title.
    if line.endswith("-") or line.endswith("­"):
        return False
    if line.endswith((".", ",", ":", ";", "!")):
        return False
    # Commas/periods inside the line ⇒ sentence prose, not a title.
    if "," in line or "." in line or ";" in line:
        return False
    # Title-case shape: every meaningful word starts with a capital
    # letter; only short stop-words may be lower-case. This rejects
    # body-leading lines like "In December 1788 the astronomer..."
    words = line.split()
    if not words:
        return False
    stops = {"a", "an", "the", "of", "in", "at", "on", "and", "or", "to",
             "for", "with", "by", "as", "is", "are", "vs"}
    for w in words:
        # Bare punctuation separators like `–`, `—`, `&` are allowed
        # within titles (e.g. `Kroomen – Hunting Down Black Slavers`).
        if re.match(r"^[–—&\-]+$", w):
            continue
        wl = w.lower()
        if wl in stops:
            continue
        if not re.match(r"^[A-Z0-9“\"]", w):
            return False
    return True


def _finalize_byline(p: Passage) -> None:
    if not p.body_lines:
        return
    tail = p.body_lines[-1].strip()
    if _looks_like_byline(tail):
        p.byline = tail
        p.body_lines = p.body_lines[:-1]


def _parse_right_column_questions(right_lines: list[tuple[float, str]]) -> list[tuple[int, float]]:
    """Return [(qnum, y_top), …] from a right-column slice."""
    out: list[tuple[int, float]] = []
    for y, line in right_lines:
        m = QUESTION_NUM_RE.match(line.strip()) or QUESTION_NUM_ONLY_RE.match(line.strip())
        if m:
            qnum = int(m.group(1))
            if 31 <= qnum <= 40:
                out.append((qnum, y))
    return out


def _extract_questions_page_numbers(page) -> list[int]:
    """Return the question numbers listed under a `Questions` header on
    a single page (used to map a long passage to its 5 questions)."""
    text = page.extract_text() or ""
    if "Questions" not in text:
        return []
    nums: list[int] = []
    in_block = False
    for raw in text.splitlines():
        s = raw.strip()
        if QUESTIONS_HEADER_RE.match(s):
            in_block = True
            continue
        if not in_block:
            continue
        m = QUESTION_NUM_RE.match(s)
        if m:
            n = int(m.group(1))
            if 31 <= n <= 40 and n not in nums:
                nums.append(n)
    return sorted(nums)


@dataclass
class PassageWithQids:
    passage: Passage
    qnums: list[int]


def _classify_page(left_lines, right_lines) -> str:
    """Return one of: 'side_by_side', 'long_body', 'questions'.

    side_by_side: right column carries one or more `Question`-headers
        (singular), each followed by a Q-number — one question per
        passage block in the left column.
    questions:    right or left column carries a `Questions` (plural)
        header followed by 2+ Q-numbers — pure question-stem page after
        a long passage.
    long_body:    body continuation page; right column is prose, no
        question markers.
    """
    # `Questions` (plural) header anywhere ⇒ question-stem page.
    has_questions_header = any(
        QUESTIONS_HEADER_RE.match(line.strip())
        for _, line in (list(left_lines) + list(right_lines))
    )
    right_qnums = _parse_right_column_questions(right_lines)
    left_questions = _extract_questions_page_numbers_from_lines(left_lines)
    if has_questions_header and (left_questions or len(right_qnums) >= 2):
        return "questions"

    # Side-by-side if the right column has any `Question` header.
    if any(QUESTION_HEADER_RE.match(line.strip()) for _, line in right_lines):
        return "side_by_side"
    # Or if it has standalone Q-numbers (cloze right column).
    if right_qnums:
        return "side_by_side"
    return "long_body"


def _parse_long_body_page(left_lines, right_lines, full_lines=None) -> list[Passage]:
    """For a body-continuation page, read left column then right column
    as a single column flow. Stays compatible with side-by-side parsing
    by reusing _parse_left_column_passages on the concatenated stream.

    Pre-merge step: long-passage pages often have a banner title that
    spans both columns (`Kroomen – Hunting Down Black Slavers`); the
    column crop clips it into `Bla` (left) and `ack Slavers` (right).
    If `full_lines` is provided (a page-wide extraction with no crop),
    we use that to replace the clipped title row on the left.
    """
    left = list(left_lines)
    right = list(right_lines)
    if left and full_lines:
        # Find the first non-chrome line in `left`; replace it with the
        # corresponding full-page line if the latter is materially
        # longer (indicates the crop clipped a banner title).
        for i, (ly, ll) in enumerate(left):
            ls = ll.strip()
            if not ls or _is_chrome(ls):
                continue
            for fy, fl in full_lines:
                fs = fl.strip()
                if abs(fy - ly) > 5:
                    if fy > ly + 5:
                        break
                    continue
                # Same row — if the full extraction is at least 50%
                # longer, it's almost certainly the unclipped title.
                if len(fs) > len(ls) * 1.3 and len(fs) <= 80:
                    left[i] = (ly, fs)
                    # Also drop the corresponding right-column fragment.
                    for j, (ry, rl) in enumerate(right):
                        if abs(ry - ly) <= 5 and rl.strip() in fs:
                            right.pop(j)
                            break
                break
            break
    combined: list[tuple[float, str]] = list(left)
    offset = (max((y for y, _ in left), default=0) or 0) + 1000
    for y, line in right:
        combined.append((y + offset, line))
    return _parse_left_column_passages(combined)


def extract_elf_passages(pdf_path: Path) -> list[PassageWithQids]:
    """Return all ELF passages in the PDF with their question-number
    coverage. Stitches continuation passages across pages."""
    with pdfplumber.open(pdf_path) as pdf:
        start = _find_elf_start(pdf)
        if start is None:
            return []
        elf_pages = list(range(start, len(pdf.pages)))

        # Collect per-page passages + right-column question marks.
        per_page: list[dict] = []
        for pidx in elf_pages:
            page = pdf.pages[pidx]
            mid_x = _find_column_split(page)
            left = _column_text_with_positions(page, 0, mid_x)
            right = _column_text_with_positions(page, mid_x, page.width)
            kind = _classify_page(left, right)
            if kind == "long_body":
                full = _column_text_with_positions(page, 0, page.width)
                passages = _parse_long_body_page(left, right, full)
            elif kind == "questions":
                passages = []
            else:
                passages = _parse_left_column_passages(left)
            right_q = _parse_right_column_questions(right)
            left_questions = _extract_questions_page_numbers_from_lines(left)
            per_page.append({
                "passages": passages,
                "right_q": right_q,
                "left_q": left_questions,
                "page_idx": pidx,
                "kind": kind,
            })

    # Stitch continuation passages: a passage with empty title at the
    # start of a page belongs to the last passage of the previous page.
    stitched: list[tuple[int, Passage]] = []   # (page_idx, passage)
    for entry in per_page:
        for p in entry["passages"]:
            if not p.title and stitched:
                prev_pidx, prev = stitched[-1]
                if prev.byline:
                    prev.body_lines.append(prev.byline)
                    prev.byline = None
                prev.body_lines.extend(p.body_lines)
                if p.byline:
                    prev.byline = p.byline
                prev.y_bot = p.y_bot
            else:
                stitched.append((entry["page_idx"], p))

    # Map passages to question numbers.
    # Rule 1: side-by-side — a passage and a `Question N.` block share
    # a page and the question's y-top sits within the passage's y-band.
    # Rule 2: long passage — passage spans 2 pages with no per-row right
    # questions; the page after the passage tail has a `Questions` header
    # with numbers — those map to the passage.
    # Rule 3: cloze — passage has gap-number tokens (e.g. " 31 ", " 32 ")
    # embedded in its body; those numbers map.
    results: list[PassageWithQids] = []
    # Group passages by page they finished on so we can find the
    # `Questions` page that follows.
    passages_in_order: list[tuple[int, Passage]] = stitched
    page_left_questions: dict[int, list[int]] = {
        entry["page_idx"]: entry["left_q"] for entry in per_page
    }
    page_right_questions: dict[int, list[tuple[int, float]]] = {
        entry["page_idx"]: entry["right_q"] for entry in per_page
    }

    # Re-collect: per page, the passages that finished on that page.
    by_page: dict[int, list[Passage]] = {}
    for pidx, p in passages_in_order:
        by_page.setdefault(pidx, []).append(p)

    consumed_qnums: set[int] = set()

    for pidx, p in passages_in_order:
        qnums: list[int] = []
        # 3. Cloze detection: gap markers in the body.
        gap_nums = _detect_cloze_gap_nums(p)
        if gap_nums:
            qnums = gap_nums
        else:
            # 1. Side-by-side: align with right-column Question blocks
            # on the same page (or earlier page if the passage started
            # there).
            right_q = page_right_questions.get(pidx, [])
            for qnum, y in right_q:
                if qnum in consumed_qnums:
                    continue
                # The Question block's y_top should fall within (or just
                # below) the passage's y-band. We allow a generous slack
                # since column tops can vary.
                if p.y_top - 50 <= y <= p.y_bot + 50:
                    qnums.append(qnum)
                    consumed_qnums.add(qnum)
            # 2. Long passage: look ahead for the next "questions" page
            # (the page after a multi-page passage that carries the
            # `Questions` header + 2+ Q-numbers). Take ALL Q-numbers
            # from that page — they can sit in either column.
            if not qnums:
                for entry in per_page:
                    if entry["page_idx"] < pidx:
                        continue
                    if entry.get("kind") != "questions":
                        continue
                    pool = list(entry["left_q"]) + [n for n, _ in entry["right_q"]]
                    for n in sorted(set(pool)):
                        if n not in consumed_qnums:
                            qnums.append(n)
                            consumed_qnums.add(n)
                    break
        if qnums:
            # Reject passages with no real body — these are chrome
            # artefacts (e.g. the cloze rubric truncated against the
            # column split). A real passage has at least one body line
            # and the body has prose-shape (>= 200 chars).
            body_len = sum(len(l) for l in p.body_lines)
            if body_len < 200:
                # Roll the consumed numbers back so a later passage can
                # claim them.
                for n in qnums:
                    consumed_qnums.discard(n)
                continue
            results.append(PassageWithQids(passage=p, qnums=sorted(set(qnums))))
    return results


def _extract_questions_page_numbers_from_lines(lines: list[tuple[float, str]]) -> list[int]:
    """Find Q-numbers under a `Questions` (plural) header in this column."""
    nums: list[int] = []
    in_block = False
    for _, line in lines:
        s = line.strip()
        if QUESTIONS_HEADER_RE.match(s):
            in_block = True
            continue
        if not in_block:
            continue
        m = QUESTION_NUM_RE.match(s)
        if m:
            n = int(m.group(1))
            if 31 <= n <= 40 and n not in nums:
                nums.append(n)
    return sorted(nums)


def _detect_cloze_gap_nums(p: Passage) -> list[int]:
    """If the passage body contains standalone gap markers like " 31 ",
    return them. We require >= 3 distinct numbers in 31–40 range to
    avoid false positives from ordinary numerals in prose."""
    body = " ".join(p.body_lines)
    # Match a bare number surrounded by spaces, not part of a date/year.
    cands = re.findall(r"(?<!\d)(3[1-9]|40)(?!\d)", body)
    distinct = sorted({int(c) for c in cands})
    if len(distinct) >= 3:
        return distinct
    return []


# ---------------------------------------------------------------------------
# Corpus patch
# ---------------------------------------------------------------------------


def find_short_elf_qids(data: list[dict]) -> list[dict]:
    out: list[dict] = []
    for e in data:
        qid = e.get("qid") or ""
        if "ELF" not in qid:
            continue
        if not ELF_QID_RE.match(qid):
            continue
        if len(e.get("context") or "") >= MIN_CTX_LEN:
            continue
        out.append(e)
    return out


def build_passage_index(exam_id: str) -> dict[tuple[str, int], Passage]:
    """Return {(half, qnum): Passage} for an exam, parsed once per run."""
    idx: dict[tuple[str, int], Passage] = {}
    for half in ("1", "2"):
        pdf = PDF_ROOT / exam_id / f"verb{half}.pdf"
        if not pdf.exists():
            continue
        try:
            passages = extract_elf_passages(pdf)
        except Exception as exc:    # pragma: no cover — surfaces in report
            print(f"  [warn] failed to parse {pdf}: {exc}", file=sys.stderr)
            continue
        for pw in passages:
            for qnum in pw.qnums:
                idx[(half, qnum)] = pw.passage
    return idx


def patch_corpus(dry_run: bool) -> dict:
    """Returns a stats dict for the run report."""
    # Collect all exam IDs that have at least one short ELF qid.
    exam_qids: dict[str, list[tuple[str, dict, Path]]] = {}
    for directory in (PARSED_DIR, APP_PUBLIC_DATA):
        for path in sorted(directory.glob("*.json")):
            if path.name.startswith("_"):
                continue
            data = json.loads(path.read_text())
            short = find_short_elf_qids(data)
            if not short:
                continue
            for entry in short:
                m = ELF_QID_RE.match(entry["qid"])
                if not m:
                    continue
                exam = m.group("exam")
                exam_qids.setdefault(exam, []).append((entry["qid"], entry, path))

    stats = {"per_exam": {}, "failed": {}, "patched": 0, "skipped": 0}

    # Build passage index once per exam, then sweep both corpora.
    for exam in sorted(exam_qids):
        index = build_passage_index(exam)
        patched_qids: set[str] = set()
        missing_qids: set[str] = set()
        # Re-load each affected file so writes are atomic per-file.
        for directory in (PARSED_DIR, APP_PUBLIC_DATA):
            path = directory / f"{exam}.json"
            if not path.exists():
                continue
            data = json.loads(path.read_text())
            file_touched = False
            for entry in data:
                qid = entry.get("qid", "")
                if "ELF" not in qid:
                    continue
                m = ELF_QID_RE.match(qid)
                if not m:
                    continue
                if len(entry.get("context") or "") >= MIN_CTX_LEN:
                    continue
                half = m.group("half")
                qnum = int(m.group("num"))
                passage = index.get((half, qnum))
                if passage is None:
                    missing_qids.add(qid)
                    continue
                new_ctx = passage.render()
                old_ctx = entry.get("context") or ""
                # If the corpus already has what we'd write, treat as
                # already-done (idempotent re-run). No need to flag.
                if old_ctx == new_ctx:
                    continue
                # Require a meaningful gain over the old context (which
                # may already hold just the title): the new context must
                # be at least 3x as long AND add >= 300 chars of body.
                if len(new_ctx) < len(old_ctx) * 3 or len(new_ctx) - len(old_ctx) < 300:
                    missing_qids.add(qid)
                    continue
                entry["context"] = new_ctx
                file_touched = True
                patched_qids.add(qid)
            if file_touched and not dry_run:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        stats["per_exam"][exam] = {
            "patched": sorted(patched_qids),
            "missing": sorted(missing_qids),
        }
        stats["patched"] += len(patched_qids)
        if missing_qids:
            stats["failed"][exam] = sorted(missing_qids)

    return stats


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    stats = patch_corpus(args.dry_run)
    total = stats["patched"]
    print(f"\nRestored {total} ELF qid context(s) across {len(stats['per_exam'])} exam(s).")
    print("Per-exam breakdown (unique qids):")
    for exam, info in sorted(stats["per_exam"].items()):
        n = len(info["patched"])
        m = len(info["missing"])
        suffix = f"  (missing: {m})" if m else ""
        print(f"  {exam:<22s}  {n:>3d} patched{suffix}")
    if stats["failed"]:
        print("\nUnresolved qids (no passage extracted from PDF):")
        for exam, qids in stats["failed"].items():
            print(f"  {exam}: {', '.join(qids)}")
    if args.dry_run:
        print("\n(dry run — no files written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
