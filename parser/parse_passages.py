#!/usr/bin/env python3
"""
LÄS / ELF parser — multi-page reading-comprehension extractor.

Both sections share the same physical layout:

  - Section spans 4-5 contiguous pages within the verb provpass PDF.
  - Each page is split vertically into UP TO TWO regions:
      * passage region (top): paragraph text, 2-column layout
      * questions region (bottom, optional): numbered Q's with options,
        2-column layout, separated from the passage region by an
        "Uppgifter" / "Questions" / "Question" header.
  - A passage may flow across multiple consecutive pages before any
    question group attaches to it (debate format with INLÄGG markers).
  - Author bylines, glossaries, and INLÄGG headers are part of the
    passage; they get folded into the question's `context`.

Differences:
  - LÄS questions have 4 options (A-D); ELF has 5 (A-E).
  - LÄS divider header is "Uppgifter"; ELF uses "Question" / "Questions".
  - LÄS section header tag is "LÄS"; ELF is "ELF".

Algorithm:

  Walk pages in order. For each page, find the divider header (if any)
  to split blocks into passage_blocks + question_blocks. Both are read
  in 2-column reading order (left col top-to-bottom, then right col).

  Maintain a `passage_buffer` accumulating passage text across pages.
  When a question region appears, lock the buffer as the `context` for
  the upcoming questions, parse them, and reset the buffer afterwards.

  When passage paragraphs reappear after a question group on the same
  page (rare, but happens), they kick off a fresh passage_buffer.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

import fitz

# Question heading: "13.\t..." or just "31." (cloze format — marker
# alone, prompt text lives in the surrounding passage as a numbered
# blank). We allow the trailing whitespace OR end-of-string so both
# variants match.
Q_HEAD_RE = re.compile(r"^\s*(\d{1,2})[.\)](\s|$)")
# Option heading: "A\t..." — first char a letter, then whitespace.
OPT_HEAD_RE = re.compile(r"^\s*([A-E])\s")
# All-options-in-one-block (cloze format): "A austerity B durability
# C prosperity D liability". Captures the 4–5 option texts in order.
MULTI_OPT_RE = re.compile(
    r"^A\s+(.+?)\s+B\s+(.+?)\s+C\s+(.+?)\s+D\s+(.+?)(?:\s+E\s+(.+))?$"
)


def _expand_multi_option_block(text: str) -> list[tuple[str, str]] | None:
    """If a single block holds all 4 (or 5) options inline, split it.
    Returns [(letter, text), …] or None if the block isn't a packed
    options run.
    """
    m = MULTI_OPT_RE.match(text.strip())
    if not m:
        return None
    out = [
        ("A", m.group(1).strip()),
        ("B", m.group(2).strip()),
        ("C", m.group(3).strip()),
        ("D", m.group(4).strip()),
    ]
    if m.group(5):
        out.append(("E", m.group(5).strip()))
    return out

# Page-number tags like "– 5 –" or "- 12 -"
PAGE_NUM_RE = re.compile(r"^\s*[–-]\s*\d+\s*[–-]\s*$")

# Page-footer chrome that PyMuPDF returns as its own (or a tail) block.
# Older exams like to print "Fortsätt på nästa sida »" + the page number
# at the bottom of LÄS / ELF pages. We strip these so they don't leak
# into the last option's text.
PAGE_FOOTER_RES = (
    re.compile(r"FORTSÄTT\s+PÅ\s+NÄSTA\s+SIDA", re.IGNORECASE),
    re.compile(r"BLANKSIDA", re.IGNORECASE),
)

# Divider strings that separate passage region from question region.
# We accept multiple casings/forms — older exams use lowercase.
LAS_DIVIDERS = {"uppgifter"}
ELF_DIVIDERS = {"question", "questions"}


@dataclass
class _Block:
    x0: float
    y0: float
    text: str  # already stripped + whitespace-collapsed


def _collect_blocks(page: fitz.Page) -> list[_Block]:
    """Return non-empty text blocks with positions, stripped/normalised."""
    out: list[_Block] = []
    for x0, y0, _x1, _y1, text, _bno, btype in page.get_text("blocks"):
        if btype != 0:
            continue
        norm = re.sub(r"\s+", " ", text).strip()
        if not norm:
            continue
        out.append(_Block(x0=x0, y0=y0, text=norm))
    return out


def _is_section_chrome(text: str, section_tag: str) -> bool:
    """Page-decoration blocks: section tag, page number, or footer."""
    t = text.strip()
    if PAGE_NUM_RE.match(t):
        return True
    if t == section_tag:
        return True
    # Long forms ("ORD – Ordförståelse" etc.) also count as decoration.
    if t.startswith(f"{section_tag} – ") or t.startswith(f"{section_tag} -"):
        return True
    if section_tag == "LÄS" and t.startswith("Svensk läsförståelse"):
        return True
    if section_tag == "ELF" and t.startswith("Engelsk läsförståelse"):
        return True
    # Page footer ("Fortsätt på nästa sida »", "BLANKSIDA …"). Keep this
    # last — these are short blocks that would otherwise glue onto a
    # nearby question option as wrap continuation.
    if any(rx.search(t) for rx in PAGE_FOOTER_RES):
        return True
    return False


def _is_divider(text: str, dividers: set[str]) -> bool:
    return text.strip().lower().rstrip("?") in dividers


def _reading_order(blocks: list[_Block], page_width: float) -> list[_Block]:
    """Sort 2-column blocks: left col top-to-bottom, then right col."""
    midline = page_width / 2
    left = [b for b in blocks if b.x0 < midline - 20]
    right = [b for b in blocks if b.x0 >= midline - 20]
    left.sort(key=lambda b: b.y0)
    right.sort(key=lambda b: b.y0)
    return left + right


def _parse_question_blocks(
    blocks: list[_Block],
    expected_range: range,
    expected_options: int,
    context: str | None,
) -> dict[int, dict]:
    """Walk a flattened-reading-order block list, emit question dicts.

    Stops collecting options for a question once `expected_options` are
    in. Returns {q_number: {prompt, options, context}}.
    """
    out: dict[int, dict] = {}
    current: dict | None = None

    def flush() -> None:
        if current and len(current["options"]) >= expected_options - 1:
            out[current["number"]] = current

    for b in blocks:
        # Skip per-question divider headers that repeat between Q groups
        # on a page ("Question", "Questions", "Uppgifter").
        if b.text.strip().lower().rstrip("?") in {
            "question",
            "questions",
            "uppgifter",
            "alternatives",
        }:
            continue

        m_q = Q_HEAD_RE.match(b.text)
        if m_q:
            num = int(m_q.group(1))
            if num in expected_range:
                flush()
                stem = Q_HEAD_RE.sub("", b.text).strip()
                current = {
                    "number": num,
                    "prompt": "",
                    "options": [],
                    "context": context,
                }
                # Tightest cloze: "31. A foo B bar C baz D qux" packs
                # marker + all options in a single block. Extract them.
                multi = _expand_multi_option_block(stem)
                if multi:
                    for letter, opt_text in multi[:expected_options]:
                        current["options"].append({"letter": letter, "text": opt_text})
                else:
                    current["prompt"] = stem
                continue

        # If we're collecting options for a question, the cloze packing
        # may also appear as a standalone block.
        if current is not None and len(current["options"]) == 0:
            multi = _expand_multi_option_block(b.text)
            if multi:
                for letter, opt_text in multi[:expected_options]:
                    current["options"].append({"letter": letter, "text": opt_text})
                continue

        m_o = OPT_HEAD_RE.match(b.text)
        if m_o and current is not None and len(current["options"]) < expected_options:
            value = OPT_HEAD_RE.sub("", b.text).strip()
            current["options"].append({"letter": m_o.group(1), "text": value})
            continue

        # Wrap continuation: prompts and options sometimes break across
        # blocks (PyMuPDF splits on visual line). Attribute to the
        # currently-building part.
        if current is not None and not m_q and not m_o:
            if current["options"]:
                current["options"][-1]["text"] += " " + b.text
            else:
                # Prompt continuation
                current["prompt"] = (current["prompt"] + " " + b.text).strip()

    flush()
    return out


def _split_at_divider(
    blocks: list[_Block],
    dividers: set[str],
    expected_range: range,
) -> tuple[list[_Block], list[_Block]]:
    """Find the divider y; everything before/after is passage/questions.

    Decision tree:
      1. Column-split — ≥2 question heads cluster at the same x.
         Passage on the left col, questions stacked on the right.
         Wins over a row split because pages with multiple Q-groups
         (var-2025 verb1 p13) repeat "Question" headers per group; a
         row-based detector would split at one of those mid-page.
      2. Explicit row divider — "Uppgifter" / "Questions" header.
      3. First Q-head in range — implicit row divider for cloze pages
         that omit the header entirely.
      4. None — whole page is passage.
    """
    candidates = [
        b for b in blocks
        if (m := Q_HEAD_RE.match(b.text)) and int(m.group(1)) in expected_range
    ]
    # 1. Column-split when Q heads cluster at one x.
    if len(candidates) >= 2:
        xs = sorted(c.x0 for c in candidates)
        if xs[-1] - xs[0] < 30:
            col_x = xs[0] - 10
            return (
                [b for b in blocks if b.x0 < col_x],
                [b for b in blocks if b.x0 >= col_x],
            )
    # 2. Explicit row divider — use the FIRST one (smallest y).
    explicit_dividers = [b for b in blocks if _is_divider(b.text, dividers)]
    if explicit_dividers:
        first = min(explicit_dividers, key=lambda b: b.y0)
        return (
            [b for b in blocks if b.y0 < first.y0],
            [b for b in blocks if b.y0 > first.y0],
        )
    # 3. Implicit row divider — first Q-head in range.
    if candidates:
        first = min(candidates, key=lambda b: b.y0)
        return (
            [b for b in blocks if b.y0 < first.y0],
            [b for b in blocks if b.y0 >= first.y0],
        )
    # 4. No divider.
    return blocks, []


def parse_section_with_context(
    pages: list[fitz.Page],
    section_tag: str,
    expected_range: range,
    expected_options: int,
    dividers: set[str],
) -> list[dict]:
    """Parse a multi-page reading section. Generic over LÄS / ELF."""
    questions: dict[int, dict] = {}
    passage_buffer: list[str] = []

    for page in pages:
        page_blocks = _collect_blocks(page)
        page_blocks = [
            b for b in page_blocks if not _is_section_chrome(b.text, section_tag)
        ]

        # Split into passage region (above divider) and question region (below).
        passage_blocks, question_blocks = _split_at_divider(
            page_blocks, dividers, expected_range
        )
        passage_blocks = _reading_order(passage_blocks, page.rect.width)
        question_blocks = _reading_order(question_blocks, page.rect.width)

        # Drop blocks that are themselves question heads or options from the
        # passage list — they spilled across the divider in some PDFs.
        passage_blocks = [
            b for b in passage_blocks
            if not Q_HEAD_RE.match(b.text) and not OPT_HEAD_RE.match(b.text)
        ]

        # Accumulate the passage region into the buffer.
        for b in passage_blocks:
            passage_buffer.append(b.text)

        # If this page has questions, lock the buffer as their context.
        if question_blocks:
            ctx = "\n\n".join(passage_buffer).strip() or None
            parsed = _parse_question_blocks(
                question_blocks, expected_range, expected_options, ctx
            )
            for num, q in parsed.items():
                # First-write wins so a later page's stray duplicate doesn't
                # overwrite a clean parse.
                if num not in questions:
                    questions[num] = q
            passage_buffer = []  # next group gets a fresh passage

    return [questions[n] for n in sorted(questions)]


def parse_las(pages: list[fitz.Page]) -> list[dict]:
    return parse_section_with_context(
        pages,
        section_tag="LÄS",
        expected_range=range(11, 21),
        expected_options=4,
        dividers=LAS_DIVIDERS,
    )


def parse_elf(pages: list[fitz.Page]) -> list[dict]:
    return parse_section_with_context(
        pages,
        section_tag="ELF",
        expected_range=range(31, 41),
        # ELF questions have 4 options (A-D) just like LÄS, despite
        # ORD/MEK using A-E above them in the same provpass.
        expected_options=4,
        dividers=ELF_DIVIDERS,
    )
