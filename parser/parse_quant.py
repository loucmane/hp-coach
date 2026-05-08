#!/usr/bin/env python3
"""
Quant section parsers — XYZ, KVA, NOG.

Why a separate file from parse_section.py:
  Quant questions need span-level text extraction (font sizes per
  glyph) so we can detect superscripts and reconstruct them as LaTeX.
  parse_section.py uses block-level extraction which is fine for
  ORD/MEK but loses the size info we need here.

Math reconstruction strategy (v1):
  - Walk PyMuPDF's `dict` mode line-by-line, span-by-span.
  - When a span's font-size is meaningfully smaller than its line's
    dominant size AND its y-top is above the line baseline, classify
    it as a superscript and wrap the surrounding token in `$...^{n}$`.
  - Inline fractions ("1/5") pass through unchanged as text.
  - Vertically-stacked fractions (rare in HP exams; numerator at one
    y, denominator at another, same x) are LEFT AS-IS in the visual
    order PyMuPDF emits. They're imperfect but readable, and the
    parser stays simple.

Layout cascade (same idea as parse_passages.py, simpler in practice
because quant questions don't carry passages):
  - Find all "N." markers on each page → split spans into per-question
    bins.
  - For each question: first non-marker text on the prompt y-range is
    the prompt; subsequent "A.", "B.", ... are options.

Section detection: SECTION_HEADERS supports both modern ("XYZ –
Matematisk problemlösning") and older uppercase ("DELPROV XYZ –
MATEMATISK PROBLEMLÖSNING") patterns; structural fallback (page's
question numbers fall within the section's range) catches anything
the header strings miss.
"""
from __future__ import annotations

import re
from collections.abc import Iterable

import fitz  # PyMuPDF

# ── Section configuration ──────────────────────────────────────────────────

# Question-number ranges per section. Stable across exams (mostly —
# build.py owns the canonical map; we mirror it here for the structural
# fallback to know what "this page is XYZ" looks like).
SECTION_RANGES = {
    "XYZ": range(1, 13),
    "KVA": range(13, 23),
    "NOG": range(23, 29),
}

# Header strings we look for on each page. We try every variant; if any
# matches, the page belongs to this section. Order matters only for
# clarity (newer first).
SECTION_HEADERS = {
    "XYZ": (
        "XYZ – Matematisk problemlösning",
        "DELPROV XYZ – MATEMATISK PROBLEMLÖSNING",
    ),
    "KVA": (
        "KVA – Kvantitativa jämförelser",
        "DELPROV KVA – KVANTITATIVA JÄMFÖRELSER",
    ),
    "NOG": (
        "NOG – Kvantitativa resonemang",
        "DELPROV NOG – KVANTITATIVA RESONEMANG",
    ),
}

# Continuation-page tag — a page that isn't the section start but
# belongs to it usually has the bare section short-code as its first
# non-empty content line.
SECTION_SHORT = {"XYZ": "XYZ", "KVA": "KVA", "NOG": "NOG"}

# ── Regexes ────────────────────────────────────────────────────────────────

Q_HEAD_RE = re.compile(r"^\s*(\d{1,2})\.\s*$")
OPT_HEAD_RE = re.compile(r"^\s*([A-E])\b")
PAGE_FOOTER_RES = (
    re.compile(r"^\s*–\s*\d+\s*–\s*$"),  # "– 5 –" page numbers
    re.compile(r"FORTSÄTT\s+PÅ\s+NÄSTA\s+SIDA", re.IGNORECASE),
    re.compile(r"^\s*BLANKSIDA\s*$", re.IGNORECASE),
)

# Delimiters we wrap reconstructed LaTeX in. We don't use the conventional
# `$...$` because HP source PDFs occasionally contain a literal `$` glyph
# inside stacked-fraction renderings (the dollar sign is part of certain
# bracket macros in the original typesetter), which would collide with
# our delimiters and break KaTeX parsing on the SPA. Private-use code
# points are guaranteed never to appear in the source text.
MATH_OPEN = ""
MATH_CLOSE = ""

# Question stem (when prompt and number share a line block, e.g.
# "12. Vad är x?"). Only matched on the prompt-text candidates.
Q_STEM_RE = re.compile(r"^\s*(\d{1,2})\.\s+(.*)$", re.DOTALL)


# ── Span / line helpers ────────────────────────────────────────────────────


def _line_dominant_size_and_baseline(line: dict) -> tuple[float, float]:
    """Return (dominant font-size, baseline y-center) for a line.

    Dominant size = most frequent size weighted by character count.
    Baseline y-center = the y-center of any dominant-size span (they
    share a baseline by construction). We need both to distinguish a
    superscript (smaller AND raised) from a same-baseline smaller font
    (e.g. NOG's "(1)" / "(2)" condition markers — digits rendered at
    9pt against 11pt parens, but vertically aligned).
    """
    counts: dict[float, int] = {}
    samples: dict[float, dict] = {}
    for span in line["spans"]:
        text = span["text"]
        if not text.strip():
            continue
        size = round(span["size"], 1)
        counts[size] = counts.get(size, 0) + len(text)
        samples.setdefault(size, span)
    if not counts:
        return 11.0, (line["bbox"][1] + line["bbox"][3]) / 2
    dominant = max(counts, key=lambda s: counts[s])
    sample = samples[dominant]
    baseline_y = (sample["bbox"][1] + sample["bbox"][3]) / 2
    return dominant, baseline_y


def _span_is_superscript(span: dict, dominant: float, baseline_y: float) -> bool:
    """True iff the span is BOTH meaningfully smaller AND visibly
    raised relative to the line's baseline. Either condition alone
    isn't enough: NOG's "(1)" markers are smaller-but-aligned, not
    superscripts; they would render badly as `^{1}`."""
    if round(span["size"], 1) >= dominant - 1.5:
        return False
    span_y_center = (span["bbox"][1] + span["bbox"][3]) / 2
    return span_y_center < baseline_y - 1.0


def _line_to_text(line: dict) -> str:
    """Render one PyMuPDF dict-mode `line` to text, wrapping superscripts
    in LaTeX `$x^{n}$`. Adjacent superscript chars are merged inside one
    pair of braces so "x²³" becomes `x^{23}`, not `x^{2}^{3}`.

    Whitespace handling: we trust PyMuPDF to give us correctly-spaced
    body text; it doesn't always — we add spaces between non-superscript
    spans only when neither already carries a leading/trailing space.
    """
    dominant, baseline_y = _line_dominant_size_and_baseline(line)
    out: list[str] = []
    sup_buffer: list[str] = []  # accumulating superscript chars
    last_base_token: str | None = None  # last non-superscript token (the base of x^n)

    def flush_sup() -> None:
        nonlocal last_base_token
        if not sup_buffer:
            return
        sup = "".join(sup_buffer).strip()
        if not sup:
            sup_buffer.clear()
            return
        # Wrap base+sup in $...$ so DrillQuestion's KaTeX render fires.
        # If we have no base (rare; superscript at start of line) emit
        # the digit verbatim — better than dangling LaTeX.
        if last_base_token is None or not last_base_token.strip():
            out.append(sup)
        else:
            base = last_base_token.rstrip()
            # Strip the previously-pushed base so we can re-emit it
            # inside the math wrapper.
            out[-1] = out[-1][: len(out[-1]) - len(last_base_token)] + last_base_token[
                : len(last_base_token) - len(base)
            ]
            out.append(f"{MATH_OPEN}{base}^{{{sup}}}{MATH_CLOSE}")
        sup_buffer.clear()
        last_base_token = None

    for span in line["spans"]:
        text = span["text"]
        if not text:
            continue
        if _span_is_superscript(span, dominant, baseline_y):
            sup_buffer.append(text)
            continue
        # Regular-size span — flush any pending superscript first.
        flush_sup()
        out.append(text)
        last_base_token = text
    flush_sup()
    return "".join(out)


def _is_chrome(text: str) -> bool:
    """Filter out the page-margin chrome PyMuPDF gives us (footer
    "– N –" page numbers, "FORTSÄTT PÅ NÄSTA SIDA »" continuation
    markers, bare section-tag headers like "XYZ"). The section header
    on the FIRST page of each section is also short ("XYZ – ..."), so
    we let those through and the question-number split removes them
    naturally — anything before the first "1." marker is dropped."""
    s = text.strip()
    if not s:
        return True
    if any(rex.search(s) for rex in PAGE_FOOTER_RES):
        return True
    if s in SECTION_SHORT.values():
        return True
    return False


# ── Question splitting ─────────────────────────────────────────────────────


def _gather_lines(pages: Iterable[fitz.Page]) -> list[dict]:
    """Walk every page's dict-mode lines into a single flat sequence.
    Each dict carries its rendered text plus geometry for the
    column / row-bucket sort below."""
    flat: list[dict] = []
    for page in pages:
        d = page.get_text("dict")
        page_w = page.rect.width
        for block in d["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                text = _line_to_text(line).strip()
                if _is_chrome(text):
                    continue
                bbox = line["bbox"]
                flat.append(
                    {
                        "text": text,
                        "x0": bbox[0],
                        "y0": bbox[1],
                        "y_center": (bbox[1] + bbox[3]) / 2,
                        "page": page.number,
                        "page_w": page_w,
                    }
                )
    return flat


def _split_into_questions(
    lines: list[dict], expected: range
) -> dict[int, list[dict]]:
    """Group consecutive lines under their preceding "N." marker. Lines
    before the first marker (section header carry-over) are dropped.

    Reading-order recovery: HP quant pages are 2-column. We sort each
    page's lines into (column, y0) order before splitting — column is
    decided by x0 against the page midline. Without this, "1." (left
    column top) gets followed by "2." (left column second) but then
    PyMuPDF zig-zags into "13." (right column top) which then carries
    "2."'s real prompt text. Catastrophic.
    """
    # First, sort within each page by (column, y).
    by_page: dict[int, list[dict]] = {}
    for ln in lines:
        by_page.setdefault(ln["page"], []).append(ln)

    sorted_lines: list[dict] = []
    for pno in sorted(by_page):
        plines = by_page[pno]
        if not plines:
            continue
        midline = plines[0]["page_w"] / 2
        # Sort by (column-bucket, row-bucket, x). Row-bucket is the
        # y-center rounded into 8-pt cells — each option block is
        # ~18pt tall in the standard layout, so 8pt is fine-grained
        # enough to keep adjacent options apart (16pt = 2 buckets)
        # while still merging a superscript-bearing math line with its
        # marker line (their y-centers differ by ~0.5pt). x ties break
        # by horizontal position so within one row the marker (low x)
        # sorts before its content (higher x).
        plines.sort(
            key=lambda ln: (
                0 if ln["x0"] < midline else 1,
                round(ln["y_center"] / 8),
                ln["x0"],
            )
        )
        sorted_lines.extend(plines)

    bins: dict[int, list[dict]] = {}
    current: int | None = None
    for ln in sorted_lines:
        m = Q_HEAD_RE.match(ln["text"])
        if m:
            num = int(m.group(1))
            if num in expected:
                current = num
                bins.setdefault(num, [])
                continue
            # A "13." marker on an XYZ page is suspicious (likely the
            # KVA section starting); stop accepting more under the
            # current bin, drop until the next valid marker.
            current = None
            continue
        # Line might be "12. Vad är x?" — both marker and content.
        m2 = Q_STEM_RE.match(ln["text"])
        if m2:
            num = int(m2.group(1))
            if num in expected:
                current = num
                bins.setdefault(num, [])
                # Push the stem text without its leading "N. ".
                bins[num].append({**ln, "text": m2.group(2)})
                continue
        if current is not None:
            bins[current].append(ln)
    return bins


# ── Per-question parser ────────────────────────────────────────────────────

# How many options each section's questions carry. The format has
# drifted over the 13 years of exams in our corpus — KVA and NOG both
# shipped 5-option versions in older sittings (with an "ej genom de
# båda påståendena" / "informationen är otillräcklig" 5th option) and
# 4-option versions later. XYZ is usually 4. Accept either across the
# board; the gate exists to catch malformed parses (0/1/6+ options),
# not to enforce a count we don't actually need.
SECTION_EXPECTED_OPTIONS = {"XYZ": (4, 5), "KVA": (4, 5), "NOG": (4, 5)}


# Phrases that, in conjunction with "nedan" / "ovan", indicate the
# question references a figure (vector diagram, chart, coordinate
# system). HP doesn't render figures inline as text, so the question
# is unanswerable without rendering the underlying drawing — out of
# scope for this branch; we drop such questions until the
# `quant-figures` follow-up wires up image extraction.
_FIGURE_REFERENCE_PATTERNS = (
    "koordinatsystem",
    "figur",
    "diagram",
    "trianglar",
    "triangeln",
    "rektangeln",
    "cirkeln",
    "graf",
    "tabell",
    "kart",
    "skiss",
)


def _looks_garbled(text: str) -> bool:
    """Heuristic — does this prompt/option text look like the parser
    chewed through a stacked fraction or `\\big(` bracket and emitted
    its torn-apart pieces verbatim?

    Strong signals:
      - Literal "$" — HP exam content never uses dollar signs in
        text, but the source PDF emits them as glyph fragments inside
        stacked-fraction macros. A "$" surviving into our output means
        we're looking at one of those.
      - Literal "b l" — pieces of `\\big(` / `\\big)` brackets that
        PyMuPDF emits as separate spans we then re-join with spaces.
      - Long consecutive run of single-character tokens. A chewed
        fraction looks like "x 5 5 5 b l 3" — six 1-char tokens in
        a row. Legitimate equations like "x = 2 + 3" have at most
        2 in a row before hitting an operator or a multi-char term.

    Math operators (+, -, =, /, ·, *) don't count toward the run
    because "x = 2 + 3" is a real equation, not garbage. Short texts
    (<5 tokens) bypass the check entirely — single-digit integer
    options like "2" are obviously fine.
    """
    if "$" in text or "b l" in text:
        return True
    # Digit-only multi-token text: "0 1", "1 2", "5 11 1". These are
    # almost always stacked fractions where the dividing rule got lost
    # (the original was `0/1`, `1/2`, etc.). Real numeric options are
    # single tokens or have units / operators ("5 cm", "x = 5", "1/3").
    stripped = text.strip()
    if stripped and all(t.isdigit() for t in stripped.split()) and len(stripped.split()) >= 2:
        return True
    tokens = text.split()
    if len(tokens) < 5:
        return False
    operators = set("+-=/·*×÷")
    longest_run = 0
    run = 0
    for t in tokens:
        if len(t) == 1 and t not in operators:
            run += 1
            longest_run = max(longest_run, run)
        else:
            run = 0
    return longest_run >= 4


_FIGURE_LABEL_RE = re.compile(
    r"\b(vinkeln|vinklarna|punkten|punkterna|sträckan|sträckorna|sidan|sidorna|"
    r"linjen|linjerna|kurvan|kurvorna|trianglarna|triangeln|"
    r"rektangeln|kvadraten|cirkeln|cirklarna|"
    r"fyrhörningen|femhörningen|sexhörningen|månghörningen|polygonen|"
    r"hörnet|hörnen|axeln|grafen|diagrammet)\s+"
    # Label: 1-5 letters/digits. Catches "v" (single), "BC" (two-letter
    # vertex pair), "ABCD" (quadrilateral), "L1" / "L2" (subscripted
    # line names). The trailing `\b` ensures we don't bleed into the
    # next word.
    r"([a-zA-ZÅÄÖåäö][a-zA-Z0-9ÅÄÖåäö]{0,4})\b",
    re.IGNORECASE,
)


def _references_figure(prompt: str) -> bool:
    """True if the question prompt clearly references a diagram or
    chart we can't render.

    Three signal layers:

    1. Standalone keywords (always = figure):
       "inritad" / "ritad i", "figuren visar", "som figuren",
       "ovanstående" / "nedanstående", "koordinatsystemet".

    2. Labeled-entity pattern (`vinkeln v`, `punkten P`, `linjen L1`,
       `triangeln ABC`): a geometric noun followed by a single-letter
       label. The label is what the figure draws — without the
       picture, the question can't be answered.

    3. Weak signal: figure-domain noun near "nedan" / "ovan".

    The labeled-entity catch is what saves us from "Hur stor är
    vinkeln v?" — short prompt, no obvious figure keyword, but the
    bare "v" is a labeled angle that only exists in the diagram.
    """
    p = prompt.lower()
    standalone = (
        "inritad",
        "ritad i ",
        "figuren visar",
        "som figuren",
        "ovanstående",
        "nedanstående",
        "koordinatsystemet",
    )
    if any(s in p for s in standalone):
        return True
    if _FIGURE_LABEL_RE.search(prompt):
        return True
    if "nedan" not in p and "ovan" not in p:
        return False
    return any(pat in p for pat in _FIGURE_REFERENCE_PATTERNS)


# Reasonable max length for a quant option's text. Real options are
# short (numbers, short formulas, short Swedish phrases like "I är
# större än II"). Anything past this length almost always means we
# accidentally swept narrative text from a downstream chart or section
# into this option's bin. 180 chars is generous — the longest legit
# KVA option is ~50 chars, NOG ~80 chars.
_MAX_OPTION_LEN = 180


def _parse_one_question(num: int, qlines: list[dict]) -> dict | None:
    """Render a question dict from its grouped lines. Returns None if
    the prompt or option count is degenerate — caller logs and skips."""
    if not qlines:
        return None

    # Walk lines: collect prompt text until we hit the first "A." option.
    prompt_parts: list[str] = []
    options: list[dict[str, str]] = []
    current_letter: str | None = None
    current_buf: list[str] = []

    def flush_option() -> None:
        nonlocal current_letter, current_buf
        if current_letter is None:
            return
        text = " ".join(s.strip() for s in current_buf if s.strip()).strip()
        options.append({"letter": current_letter, "text": text})
        current_letter = None
        current_buf = []

    for ln in qlines:
        text = ln["text"]
        m = OPT_HEAD_RE.match(text)
        if m:
            flush_option()
            current_letter = m.group(1)
            # Trim the leading letter so options[].text has just the value.
            rest = text[m.end() :].strip()
            # PyMuPDF often emits "A\t" or "A\n3" as separate runs; both
            # are normalised here.
            current_buf = [rest] if rest else []
            continue
        if current_letter is not None:
            current_buf.append(text)
        else:
            prompt_parts.append(text)
    flush_option()

    prompt = " ".join(p.strip() for p in prompt_parts if p.strip()).strip()
    if not prompt or not options:
        return None

    # Quality gate — multiple ways a question becomes unusable:
    #
    # 1. Prompt looks garbled (chewed-up stacked fraction).
    # 2. Prompt references a figure we don't render (koordinatsystem
    #    nedan, etc.).
    # 3. ≥2 options look garbled (one wonky option is fine — user can
    #    still pick from the others).
    # 4. ANY option is suspiciously long — that's almost always cross-
    #    section bleed (a downstream DTK chart's narrative text got
    #    swept into this option's bin because there was no Q-marker
    #    to redirect the line walker).
    #
    # On any hit we return None and the build pipeline keeps the
    # pre-filled stub (parsing_status='answer_only'), so the drill
    # picker silently skips it.
    if _looks_garbled(prompt):
        return None
    if _references_figure(prompt):
        return None
    if any(len(o["text"]) > _MAX_OPTION_LEN for o in options):
        return None
    broken_options = sum(1 for o in options if _looks_garbled(o["text"]))
    if broken_options > 1:
        return None

    return {
        "number": num,
        "prompt": prompt,
        "options": options,
        "context": None,
    }


# ── Public API ─────────────────────────────────────────────────────────────


def _parse_section(section: str, pages: Iterable[fitz.Page]) -> list[dict]:
    expected = SECTION_RANGES[section]
    expected_opts = SECTION_EXPECTED_OPTIONS[section]
    lines = _gather_lines(pages)
    bins = _split_into_questions(lines, expected)

    out: list[dict] = []
    for num in sorted(bins):
        q = _parse_one_question(num, bins[num])
        if q is None:
            continue
        if len(q["options"]) not in expected_opts:
            # Skip rather than emit malformed; build.py treats missing
            # entries as parsing_status='answer_only' stubs, which is
            # the right fallback.
            continue
        out.append(q)
    return out


def parse_xyz(pages: Iterable[fitz.Page]) -> list[dict]:
    return _parse_section("XYZ", pages)


def parse_kva(pages: Iterable[fitz.Page]) -> list[dict]:
    return _parse_section("KVA", pages)


def parse_nog(pages: Iterable[fitz.Page]) -> list[dict]:
    return _parse_section("NOG", pages)


# ── Section-page detection ─────────────────────────────────────────────────


def find_quant_section_pages(doc: fitz.Document, section: str) -> list[fitz.Page]:
    """Same three-method cascade as parse_section.find_section_pages
    but with the quant-specific header strings and ranges."""
    primaries = SECTION_HEADERS[section]
    short = SECTION_SHORT[section]
    expected = set(SECTION_RANGES[section])

    pages: list[fitz.Page] = []
    for pno in range(doc.page_count):
        page = doc[pno]
        text = page.get_text()
        # Method 1: explicit header on the page.
        if any(h in text for h in primaries):
            pages.append(page)
            continue
        # Method 2: continuation page tagged with the bare section code.
        if pages:
            head_lines = [ln.strip() for ln in text.lstrip().split("\n", 4)[:4]]
            if short in head_lines:
                pages.append(page)
                continue
        # Method 3: structural — page contains question heads in the range.
        nums: set[int] = set()
        for x0, y0, _x1, _y1, btext, _bno, btype in page.get_text("blocks"):
            if btype != 0:
                continue
            m = Q_HEAD_RE.match(btext.strip())
            if m:
                nums.add(int(m.group(1)))
            m2 = Q_STEM_RE.match(btext.strip())
            if m2:
                nums.add(int(m2.group(1)))
        if nums and nums.issubset(expected):
            pages.append(page)
    return pages


# ── CLI for ad-hoc probing ─────────────────────────────────────────────────

if __name__ == "__main__":
    import json
    import sys

    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "data/pdfs/var-2026/kvant1.pdf"
    section = sys.argv[2] if len(sys.argv) > 2 else "XYZ"
    doc = fitz.open(pdf_path)
    pages = find_quant_section_pages(doc, section)
    print(f"  {section}: {len(pages)} pages found", file=sys.stderr)
    parser = {"XYZ": parse_xyz, "KVA": parse_kva, "NOG": parse_nog}[section]
    questions = parser(pages)
    print(json.dumps(questions, indent=2, ensure_ascii=False))
