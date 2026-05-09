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

from parser.parse_figures import extract_figure_svg

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
# Last non-whitespace run — the "base" a sub/super-script attaches to.
# Matches "L" in "Linjerna L", "x" in "f(x)", "5" in "= 5".
_LAST_WORD_RE = re.compile(r"\S+$")
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


# ── Math-font glyph normalization ──────────────────────────────────────────
#
# HP exam PDFs typeset Greek letters and a few math symbols using
# special fonts whose internal glyph IDs don't match standard Unicode.
# When PyMuPDF extracts text from these fonts it returns the raw Latin
# letter that happens to sit at that glyph slot — so π comes through as
# `r`, etc. Without remapping, every "(8 + 6π)" answer looks like
# "( 8 + 6 r )" in the parsed output.
#
# Empirical: only `r` is observed across all 27 exams, exclusively in
# fonts whose name contains "Greek". When we see more letters in the
# wild we extend this table; for now this single mapping covers the
# entire HP corpus.
_GREEK_FONT_TOKEN = "greek"  # case-insensitive substring of font name
_GREEK_GLYPH_MAP = {"r": "π"}

# MMaBinary fonts encode binary math operators (+, -, ·, ×) at glyph
# slots whose Latin transcription is gibberish. The only one observed
# across the 27-exam corpus is `$` → `·` (multiplication dot), seen
# between two stacked fractions in `1 + ½ · ⅓ ?` -style questions.
# Without this mapping the `$` flows into the body line as a literal
# dollar sign, which then gets mistaken for a subscript by the
# baseline-grouping pass (`$` is rendered ~5pt below the numerator
# baseline in MMaBinary because of how the font's bounding box sits).
_MMABINARY_FONT_TOKEN = "mmabinary"
_MMABINARY_GLYPH_MAP = {"$": "·"}


def _remap_glyphs(text: str, font: str) -> str:
    """Return `text` with math-font codepoints replaced by their
    intended Unicode characters. Unknown chars pass through unchanged
    so a future MMaGreek / MMaBinary glyph we haven't catalogued
    doesn't get silently dropped — it'll surface as a Latin letter in
    the parsed text and we can add it to the table."""
    font_lower = font.lower()
    if _GREEK_FONT_TOKEN in font_lower:
        return "".join(_GREEK_GLYPH_MAP.get(ch, ch) for ch in text)
    if _MMABINARY_FONT_TOKEN in font_lower:
        return "".join(_MMABINARY_GLYPH_MAP.get(ch, ch) for ch in text)
    return text


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
    """Walk every page's spans, regroup them by visual baseline, and
    flatten into one ordered list per page. Each entry carries its
    rendered text plus geometry for the column / row-bucket sort below.

    Why we don't trust PyMuPDF's `lines` directly:
      A single visual line in HP quant questions often mixes three
      fonts (body, MMaGreek for π, LucidaSans for `+`) whose glyph
      bboxes are placed with 1-2pt vertical jitter. PyMuPDF interprets
      that jitter as separate lines, so an option like `(6π + 8) cm²`
      reaches us as 3+ fragments: `( 6 8 ) cm`, `r+`, `²`, each
      treated as its own line by downstream code. Bucketing spans by
      visual y-center recovers the true line.

    After raw extraction we run `_merge_stacked_fractions` so that a
    numerator-line and denominator-line stacked vertically over the
    same x-center are collapsed into one line carrying `\\frac{n}{d}`
    LaTeX. Without this, "3/5" rendered as a stacked fraction reaches
    downstream as two separate "3" and "5" lines that get attributed
    wherever the row-bucket sort happens to place them — a major
    source of garbled quant questions.
    """
    flat: list[dict] = []
    for page in pages:
        page_w = page.rect.width
        # rawdict (vs plain dict) gives us per-character positions
        # inside each span. We use that to re-sort each span's chars
        # by visual x-origin: HP exam PDFs sometimes emit decimal
        # numbers like "0,3" via multiple text-show operators where
        # the comma appears BEFORE the leading digit in stream order.
        # PyMuPDF's `text` field follows stream order, so "0,3" comes
        # through as ",0 3". Sorting chars by origin x fixes it.
        spans: list[dict] = []
        for block in page.get_text("rawdict")["blocks"]:
            if block.get("type") != 0:
                continue
            for raw_line in block["lines"]:
                for s in raw_line["spans"]:
                    chars = s.get("chars") or []
                    if chars:
                        chars_sorted = sorted(chars, key=lambda c: c["origin"][0])
                        text = "".join(c["c"] for c in chars_sorted)
                    else:
                        text = s.get("text", "")
                    if not text.strip():
                        continue
                    sb = s["bbox"]
                    spans.append(
                        {
                            "text": text,
                            "font": s["font"],
                            "size": round(s["size"], 1),
                            "bbox": sb,
                            "y_center": (sb[1] + sb[3]) / 2,
                        }
                    )
        if not spans:
            continue

        # Bucket spans by visual baseline: a span joins an existing
        # group whose representative y-center is within ~3pt. When the
        # joining span and the group's dominant size differ by ≥1.5pt
        # (sub/super-script vs body, or vice versa) we widen the
        # window to 5.5pt — sub/super-scripts sit ~3-5pt off the main
        # baseline. Examples: 'L₁' / 'L₂' parallel-line labels, 'cm²'
        # superscripts, '(1) / (2)' NOG condition markers, the `²` in
        # `(3x+y)²(x-y)²` answer choices.
        # 3pt is a hair larger than the worst body-text jitter we've
        # seen (2pt); 5.5pt safely catches subscript drops without
        # bleeding into adjacent text lines (typical line spacing is
        # 13-15pt).
        # The check is symmetric in size — when superscripts sort
        # ahead of body spans (higher on page = smaller y) the group
        # forms with `group_size=7` first, so the body span (size=11)
        # joining is the LARGER one. Without the symmetric check the
        # body span fails the threshold and the superscripts orphan
        # into their own line, dumping `'2 2'` between every option
        # in `(3x+y)²(x-y)²` -style questions.
        #
        # We process larger spans first (sort by `-size`) so body-row
        # groups form with the right `y_ref` BEFORE smaller spans like
        # the MMaBinary `·` glyph (rendered ~5pt below the numerator
        # baseline) try to attach themselves. Then we pick the closest
        # matching group rather than the first match — the `·` in
        # `1 + ½ · ⅓` sits at the body baseline, so given the choice
        # between the numerator group (5pt away) and the body group
        # (0.5pt away) it should snap to the body and end up rendered
        # inline with the prompt rather than as a subscript on `1`.
        groups: list[dict] = []
        for sp in sorted(spans, key=lambda s: (-s["size"], s["y_center"], s["bbox"][0])):
            best_g = None
            best_dist = float("inf")
            for g in groups:
                # Group's dominant size (most common, weighted by glyph count).
                group_size = max(
                    {s["size"] for s in g["spans"]},
                    key=lambda sz: sum(len(s["text"]) for s in g["spans"] if s["size"] == sz),
                )
                threshold = 5.5 if abs(sp["size"] - group_size) >= 1.5 else 3.0
                dist = abs(sp["y_center"] - g["y_ref"])
                if dist <= threshold and dist < best_dist:
                    best_g = g
                    best_dist = dist
            if best_g is not None:
                best_g["spans"].append(sp)
                # Update y_ref toward the running mean so a long line
                # with gradual baseline drift keeps the same group
                # instead of splitting halfway through.
                best_g["y_ref"] = (
                    best_g["y_ref"] * (len(best_g["spans"]) - 1) + sp["y_center"]
                ) / len(best_g["spans"])
            else:
                groups.append({"y_ref": sp["y_center"], "spans": [sp]})

        for g in groups:
            line_spans = sorted(g["spans"], key=lambda s: s["bbox"][0])
            text = _render_baseline_group(line_spans).strip()
            if _is_chrome(text):
                continue
            x0 = min(s["bbox"][0] for s in line_spans)
            x1 = max(s["bbox"][2] for s in line_spans)
            y0 = min(s["bbox"][1] for s in line_spans)
            y1 = max(s["bbox"][3] for s in line_spans)
            flat.append(
                {
                    "text": text,
                    "x0": x0,
                    "x1": x1,
                    "y0": y0,
                    "y1": y1,
                    "x_center": (x0 + x1) / 2,
                    "y_center": (y0 + y1) / 2,
                    "height": y1 - y0,
                    "page": page.number,
                    "page_w": page_w,
                    # Keep span-level info: needed by the stacked-
                    # fraction merger so it can reconstruct multiple
                    # side-by-side fractions (e.g. "5/2 - 8/5") from
                    # the upper "5 8" and lower "2 5" lines instead
                    # of falling back to "?/?" placeholders.
                    "_spans": line_spans,
                }
            )
    return _merge_stacked_fractions(flat)


def _render_baseline_group(spans: list[dict]) -> str:
    """Concatenate spans (already sorted left-to-right) into one
    string. Applies math-font glyph remapping (Greek letters) and
    superscript detection (smaller font + raised baseline → `^{}`).
    The logic mirrors `_line_to_text`'s semantics but operates on a
    flat span list assembled across PyMuPDF line boundaries.
    """
    if not spans:
        return ""
    # Dominant size = the size used by most characters. Anything
    # meaningfully smaller AND raised is a superscript.
    counts: dict[float, int] = {}
    for sp in spans:
        counts[sp["size"]] = counts.get(sp["size"], 0) + len(sp["text"])
    dominant = max(counts, key=lambda s: counts[s])
    # Baseline = midpoint of the first dominant-size span.
    baseline_y = next(
        (sp["bbox"][1] + sp["bbox"][3]) / 2 for sp in spans if sp["size"] == dominant
    )

    out: list[str] = []
    script_buffer: list[str] = []
    script_kind: str | None = None  # "^" for super, "_" for sub
    last_base_token: str | None = None

    def flush_script() -> None:
        nonlocal last_base_token, script_kind
        if not script_buffer:
            return
        script = "".join(script_buffer).strip()
        if not script:
            script_buffer.clear()
            script_kind = None
            return
        op = script_kind or "^"
        # Find the LAST non-whitespace run in the previous out entry —
        # that's the base the script attaches to. We must NOT include
        # earlier words ('Linjerna L' should give base 'L', not the
        # whole span) or KaTeX will render the prose in math mode.
        if out and out[-1]:
            m = _LAST_WORD_RE.search(out[-1])
            if m:
                base = m.group(0)
                out[-1] = out[-1][: -len(base)]
                out.append(f"{MATH_OPEN}{base}{op}{{{script}}}{MATH_CLOSE}")
            else:
                out.append(script)
        else:
            out.append(script)
        script_buffer.clear()
        script_kind = None
        last_base_token = None

    prev_x1: float | None = None
    for sp in spans:
        text = _remap_glyphs(sp["text"], sp["font"])
        if not text:
            continue
        # A span is a super/sub-script if it's ≥1.5pt smaller AND its
        # y-center sits visibly off the line baseline. Above = super,
        # below = sub. Smaller-but-aligned glyphs (NOG's "(1)" / "(2)"
        # condition markers — same y-center as parens) fail the
        # off-baseline test and pass through as regular text.
        span_y_center = (sp["bbox"][1] + sp["bbox"][3]) / 2
        is_smaller = sp["size"] < dominant - 1.5
        is_sup = is_smaller and span_y_center < baseline_y - 1.0
        is_sub = is_smaller and span_y_center > baseline_y + 1.0
        if is_sup or is_sub:
            kind = "^" if is_sup else "_"
            # Mixing super and sub in one buffer would emit garbled
            # math. Flush the current buffer if the kind changes.
            if script_kind is not None and script_kind != kind:
                flush_script()
            script_kind = kind
            script_buffer.append(text)
            continue
        flush_script()
        # Insert a synthetic space when the visual gap to the previous
        # span exceeds ~2pt and neither side already carries whitespace.
        # PyMuPDF puts each word/run in its own span without inserting
        # the implicit space between them, so e.g. "14." + "Kvantitet"
        # would otherwise concatenate to "14.Kvantitet" — masking the
        # question-marker regex (which needs the trailing space).
        if (
            prev_x1 is not None
            and out
            and not out[-1].endswith((" ", "\n"))
            and not text.startswith((" ", "\n"))
            and sp["bbox"][0] - prev_x1 > 2.0
        ):
            out.append(" ")
        out.append(text)
        last_base_token = text
        prev_x1 = sp["bbox"][2]
    flush_script()
    return "".join(out)


# ── Stacked-fraction reconstruction ────────────────────────────────────────


def _multi_stack_columns(
    upper: dict, lower: dict
) -> list[tuple[float, str, float, float]] | None:
    """Pair upper/lower spans by x-alignment and return one entry per
    column: `(x_center, latex_frac, bbox_x0, bbox_x1)`. Returns None
    if the spans don't pair cleanly (counts differ or any pair is
    >8pt apart in x), so the caller can fall back to placeholders.

    Used by the merger to splice each fraction at its OWN x position
    inside the body line, so the operator between the stacks (e.g.
    the `−` in `5/2 − 8/5`) stays between the fractions instead of
    clumping at the end.
    """
    upper_spans = [s for s in (upper.get("_spans") or []) if s["text"].strip()]
    lower_spans = [s for s in (lower.get("_spans") or []) if s["text"].strip()]
    upper_spans.sort(key=lambda s: (s["bbox"][0] + s["bbox"][2]) / 2)
    lower_spans.sort(key=lambda s: (s["bbox"][0] + s["bbox"][2]) / 2)
    if len(upper_spans) != len(lower_spans) or len(upper_spans) < 2:
        return None
    cols: list[tuple[float, str, float, float]] = []
    for u, l in zip(upper_spans, lower_spans):
        ux = (u["bbox"][0] + u["bbox"][2]) / 2
        lx = (l["bbox"][0] + l["bbox"][2]) / 2
        if abs(ux - lx) > 8.0:
            return None
        num = u["text"].strip()
        den = l["text"].strip()
        x0 = min(u["bbox"][0], l["bbox"][0])
        x1 = max(u["bbox"][2], l["bbox"][2])
        cols.append(
            (
                (ux + lx) / 2,
                f"{MATH_OPEN}\\frac{{{num}}}{{{den}}}{MATH_CLOSE}",
                x0,
                x1,
            )
        )
    return cols


def _reconstruct_multi_stack(upper: dict, lower: dict) -> str:
    """Try to recover N side-by-side fractions from the upper / lower
    line span info. Returns a string of N `\\frac{u}{l}` blocks if
    every upper span pairs cleanly with a lower span (x-aligned within
    ~8pt), or N `\\frac{?}{?}` placeholders if reconstruction fails.

    The placeholder fallback is what keeps `_looks_garbled` from
    killing the question — without ANY math marker the torn-apart
    upper/lower tokens flow into the prompt and trip the
    long-single-char-run check.
    """
    upper_spans = [s for s in (upper.get("_spans") or []) if s["text"].strip()]
    lower_spans = [s for s in (lower.get("_spans") or []) if s["text"].strip()]
    upper_spans.sort(key=lambda s: (s["bbox"][0] + s["bbox"][2]) / 2)
    lower_spans.sort(key=lambda s: (s["bbox"][0] + s["bbox"][2]) / 2)
    n_columns = max(
        len(upper.get("text", "").split()),
        len(lower.get("text", "").split()),
    )

    if len(upper_spans) == len(lower_spans) and len(upper_spans) >= 2:
        ok = True
        fracs: list[str] = []
        for u, l in zip(upper_spans, lower_spans):
            ux = (u["bbox"][0] + u["bbox"][2]) / 2
            lx = (l["bbox"][0] + l["bbox"][2]) / 2
            if abs(ux - lx) > 8.0:
                ok = False
                break
            num = u["text"].strip()
            den = l["text"].strip()
            fracs.append(f"{MATH_OPEN}\\frac{{{num}}}{{{den}}}{MATH_CLOSE}")
        if ok and fracs:
            return " ".join(fracs)

    return " ".join(
        f"{MATH_OPEN}\\frac{{?}}{{?}}{MATH_CLOSE}" for _ in range(n_columns)
    )


def _merge_stacked_fractions(lines: list[dict]) -> list[dict]:
    """Detect vertically-stacked fraction pairs and merge them into
    one LaTeX-bearing line each.

    Heuristic — pairs where:
      - both texts are short (≤4 tokens)
      - x-centers align within 5pt
      - y-centers separated by 7-18pt (one line above, one below)
      - heights are within 3pt of each other (same font size)
      - neither already contains LaTeX delimiters (no nested $\\frac$
        in this pass; would need recursion)

    The merged line keeps the upper line's x bounds and stretches y
    to the lower line's bottom. Its text is
    `MATH_OPEN\\frac{numerator}{denominator}MATH_CLOSE` so the SPA's
    KaTeX renderer picks it up exactly like a superscript.

    Lines not part of a pair pass through unchanged. Lines that
    PyMuPDF coincidentally placed near each other but aren't a
    fraction (e.g. consecutive option markers "A" / "B") fail the
    short-text + x-center test and survive too.
    """
    if not lines:
        return lines

    by_page: dict[int, list[dict]] = {}
    for line in lines:
        by_page.setdefault(line["page"], []).append(line)

    out: list[dict] = []
    for pno in sorted(by_page):
        page_lines = sorted(by_page[pno], key=lambda ln: (ln["y_center"], ln["x_center"]))
        n = len(page_lines)
        consumed = [False] * n
        merged_at: dict[int, dict] = {}  # index → replacement line
        # When a stack pair sits OVER a body line at the same baseline
        # (e.g. `Vad är 5/2 - 8/5 = ?` — the body is `Vad är - = ?` at
        # y=120 and the stacks bracket `-` at y=114/125), we splice
        # the rendered `\frac{}{}` into the body line at the upper's
        # x-center instead of emitting a separate merged line. Without
        # this the merged line ends up at y=119.5 (mid-y of upper +
        # lower), sorts adjacent to body, and the prompt reads as
        # `Vad är - ? \frac{5}{2} \frac{8}{5}` with the fractions
        # dumped at the end. Each entry is `(splice_x, latex)`.
        body_splices: dict[int, list[tuple[float, str, float, float]]] = {}

        for i in range(n):
            if consumed[i]:
                continue
            upper = page_lines[i]
            if MATH_OPEN in upper["text"]:
                continue  # don't nest fractions in this pass
            for j in range(i + 1, n):
                if consumed[j]:
                    continue
                lower = page_lines[j]
                dy = lower["y_center"] - upper["y_center"]
                if dy <= 0:
                    continue
                if dy > 14:
                    break  # sorted; nothing further is a candidate
                if dy < 7:
                    continue  # same row, not a stack
                # Tighter dy cap (14, not 18) keeps adjacent option
                # markers ("A" / "B" stacked at same x with ~18pt gap)
                # safely outside the matching window. Real stacked
                # fractions in HP body text run 9-12pt apart.
                if MATH_OPEN in lower["text"]:
                    continue
                if abs(lower["x_center"] - upper["x_center"]) > 5:
                    continue
                if abs(lower["height"] - upper["height"]) > 3:
                    continue
                # Reject if either line is an option marker (single
                # uppercase letter A-E). Two A/B markers stacked over
                # the same x-bucket would otherwise look like a
                # fraction; we can't tell from geometry alone.
                if OPT_HEAD_RE.match(upper["text"]) and len(upper["text"].strip()) <= 3:
                    continue
                if OPT_HEAD_RE.match(lower["text"]) and len(lower["text"].strip()) <= 3:
                    continue
                # Both must be short; multi-token expressions rarely
                # appear as numerator/denominator in HP exam fractions
                # and matching them risks false positives on running
                # text that happens to be vertically aligned.
                if len(upper["text"].split()) > 4:
                    continue
                if len(lower["text"].split()) > 4:
                    continue
                # Reject tabular content. HP exam tables align columns
                # with literal tab characters ('\t' inside the source
                # span); mathematical numerator/denominator content
                # never contains tabs (math fonts emit individual
                # glyphs, not aligned strings). Without this clause,
                # a table like
                #     Färg \t Antal      <-- "upper"
                #     blå  \t 50         <-- "lower"
                # gets merged into \frac{Färg\t Antal}{blå\t 50}, which
                # then sends Swedish characters into KaTeX math mode
                # and breaks rendering with strict-mode warnings.
                if "\t" in upper["text"] or "\t" in lower["text"]:
                    continue
                # Parallel short-token columns: this is N side-by-side
                # stacked fractions on the same baseline (e.g.
                #   y/x − 1 = 1/x      → upper "y 1", lower "x x"
                #   5/2 − 8/5 = ?      → upper "5 8", lower "2 5"
                #   1/x + 1/y + 1/z    → upper "1 1 1", lower "x y z"
                # ) — NOT a single fraction with multi-token numerator.
                # Naively merging gives `\frac{y 1}{x x}` (meaningless).
                #
                # Reconstruct properly by x-bucketing the upper / lower
                # spans (kept on the line dicts as `_spans`): for each
                # upper span, pair it with the lower span whose
                # x-center is closest. If counts match and every pair
                # is within ~8pt of x-alignment, emit one
                # `\frac{u_i}{l_i}` per column. Otherwise fall back to
                # `\frac{?}{?}` placeholders so the question stays
                # drillable (just with the math hidden) rather than
                # killed by `_looks_garbled` once torn-apart tokens
                # leak into the prompt.
                upper_tokens = upper["text"].split()
                lower_tokens = lower["text"].split()
                is_multi_stack = (
                    len(upper_tokens) >= 2
                    and len(upper_tokens) == len(lower_tokens)
                    and all(len(t) <= 2 for t in upper_tokens)
                    and all(len(t) <= 2 for t in lower_tokens)
                )
                # Build the per-column frac list. For a single stack
                # this is one entry; for multi-stack (`5/2 − 8/5`) it
                # is one entry per column so the operator that sits
                # BETWEEN them in the body line ends up between them
                # in the final text — splicing them as one combined
                # span at the avg x would clump the fractions and
                # leave the operator dangling at the end.
                col_fracs: list[tuple[float, str, float, float]] = []
                if is_multi_stack:
                    cols = _multi_stack_columns(upper, lower)
                    if cols:
                        col_fracs = cols
                    else:
                        # Reconstruction failed (unaligned spans) —
                        # fall back to placeholder string at the avg
                        # x so the question stays drillable.
                        col_fracs = [
                            (
                                upper["x_center"],
                                _reconstruct_multi_stack(upper, lower),
                                min(upper["x0"], lower["x0"]),
                                max(upper["x1"], lower["x1"]),
                            )
                        ]
                else:
                    col_fracs = [
                        (
                            upper["x_center"],
                            f"{MATH_OPEN}\\frac{{{upper['text']}}}{{{lower['text']}}}{MATH_CLOSE}",
                            min(upper["x0"], lower["x0"]),
                            max(upper["x1"], lower["x1"]),
                        )
                    ]

                # Try to splice into a body line at midpoint y. The
                # body candidate must sit between upper and lower in
                # y-center (within ~3pt of the midpoint), have body-
                # sized text (no `\frac{}` already), and either
                # straddle the stack horizontally or sit just to one
                # side of it — i.e. we want the line that the stack
                # is INLINE WITH, not a different prompt line above.
                mid_y = (upper["y_center"] + lower["y_center"]) / 2
                body_idx: int | None = None
                for k in range(n):
                    if k == i or k == j or consumed[k]:
                        continue
                    cand = page_lines[k]
                    if MATH_OPEN in cand["text"]:
                        continue
                    if abs(cand["y_center"] - mid_y) > 3.5:
                        continue
                    stack_x0 = min(upper["x0"], lower["x0"])
                    stack_x1 = max(upper["x1"], lower["x1"])
                    if cand["x1"] < stack_x0 - 30 or cand["x0"] > stack_x1 + 30:
                        continue
                    body_idx = k
                    break

                consumed[i] = True
                consumed[j] = True
                if body_idx is not None:
                    body_splices.setdefault(body_idx, []).extend(col_fracs)
                else:
                    # No body line to splice into — emit a single
                    # standalone merged line (joining columns by space
                    # for multi-stack so the LaTeX flows naturally).
                    merged_text = " ".join(t for _, t, _, _ in col_fracs)
                    merged_at[i] = {
                        "text": merged_text,
                        "x0": min(upper["x0"], lower["x0"]),
                        "x1": max(upper["x1"], lower["x1"]),
                        "y0": upper["y0"],
                        "y1": lower["y1"],
                        "x_center": upper["x_center"],
                        "y_center": (upper["y_center"] + lower["y_center"]) / 2,
                        "height": (lower["y1"] - upper["y0"]),
                        "page": pno,
                        "page_w": upper["page_w"],
                    }
                break

        # Apply splices: re-render each body line with virtual frac
        # spans inserted at the recorded x positions. The virtual
        # span has body-sized font so `_render_baseline_group` doesn't
        # mistake it for super/subscript and can handle gap-spacing
        # naturally.
        for body_idx, splices in body_splices.items():
            body = page_lines[body_idx]
            body_spans = list(body.get("_spans") or [])
            if not body_spans:
                # No span info to splice into — fall back to appending.
                body["text"] = (
                    body["text"] + " " + " ".join(t for _, t, _, _ in splices)
                ).strip()
                continue
            body_size = max(
                {s["size"] for s in body_spans},
                key=lambda sz: sum(len(s["text"]) for s in body_spans if s["size"] == sz),
            )
            virtual = []
            for splice_x, frac_text, x0, x1 in splices:
                virtual.append(
                    {
                        "text": frac_text,
                        "font": "synthetic-frac",
                        "size": body_size,
                        "bbox": (x0, body["y0"], x1, body["y1"]),
                        "y_center": body["y_center"],
                    }
                )
            augmented = sorted(body_spans + virtual, key=lambda s: s["bbox"][0])
            body["text"] = _render_baseline_group(augmented).strip()
            body["_spans"] = augmented
            body["x0"] = min(body["x0"], min(s[2] for s in splices))
            body["x1"] = max(body["x1"], max(s[3] for s in splices))

        for i in range(n):
            if i in merged_at:
                out.append(merged_at[i])
            elif not consumed[i]:
                out.append(page_lines[i])

    return out


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
    if any(len(o["text"]) > _MAX_OPTION_LEN for o in options):
        return None
    broken_options = sum(1 for o in options if _looks_garbled(o["text"]))
    if broken_options > 1:
        return None
    # NOTE: the figure-keyword filter (_references_figure) has been
    # removed. Phase B's figure extraction renders the diagram, so a
    # prompt that references "vinkeln v" or "fyrhörningen ABCD" is
    # answerable as long as we attach the SVG. Figure attachment
    # happens in _parse_section after this returns.

    # Compute question's bbox + the page it lives on so the figure
    # extractor can crop drawings to this question's region.
    #
    # X bounds: full column width (use every line on the page so we
    # cover both the prompt-text x-range and any wider figure that
    # extends past it).
    # Y bounds: top = topmost prompt line; bottom = top of the first
    # option marker (when present, otherwise the page bottom).
    #
    # Why bottom-cap at the option marker: for "Vilket svarsalternativ
    # visar grafen..." questions each of the four options has its
    # own mini-graph. Without the cap, the bbox would span the prompt
    # AND all four options, and the figure extractor would pick up
    # drawings from FIVE coordinate systems — rendering a 175×671
    # vertical mishmash instead of the single graph the prompt asks
    # about. The cap is a clean cut because options always live
    # below the marker line.
    #
    # Why top-cap at the topmost prompt line: avoids sweeping in
    # cross-question bleed from the question above. (Less critical
    # than the bottom cap; mostly defensive.)
    page_no = qlines[0]["page"]
    same_page = [ln for ln in qlines if ln["page"] == page_no]
    first_option_y0 = next(
        (ln["y0"] for ln in same_page if OPT_HEAD_RE.match(ln["text"])),
        None,
    )
    prompt_lines = [
        ln
        for ln in same_page
        if first_option_y0 is None or ln["y0"] < first_option_y0
    ]
    if not prompt_lines:
        prompt_lines = same_page
    y_top = min(ln["y0"] for ln in prompt_lines)
    y_bottom = (
        first_option_y0
        if first_option_y0 is not None
        else max(ln["y1"] for ln in same_page)
    )
    # Pad x bounds beyond the text column. Figure labels — especially
    # closing ')' on '(cm)' / '(km)' unit annotations — get drawn as
    # vector paths whose centers sit a few points to the right of the
    # text-column x1. Without this slack, the per-item-center filter
    # in extract_figure_svg drops those final glyph paths and the SVG
    # ships an unbalanced "(cm" missing its closing paren.
    x0 = min(ln["x0"] for ln in same_page) - 20.0
    x1 = max(ln["x1"] for ln in same_page) + 20.0
    bbox = fitz.Rect(x0, y_top, x1, y_bottom)

    return {
        "number": num,
        "prompt": prompt,
        "options": options,
        "context": None,
        "_page_no": page_no,
        "_bbox": bbox,
    }


# ── Public API ─────────────────────────────────────────────────────────────


_OPTION_GRAPHS_RE = re.compile(
    r"\b(svarsalternativ\s+visar|alternativ\s+visar|"
    r"avbildar\s+grafen|svarsalternativ\s+(?:har|är)\s+grafen)\b",
    re.IGNORECASE,
)


def _has_option_graphs(prompt: str) -> bool:
    """True iff this question's OPTIONS each contain a drawing (a
    'Vilket svarsalternativ visar grafen…?' / 'avbildar grafen…?'
    pattern). The space between such a question's prompt and the
    next question's prompt is filled with the option mini-graphs;
    the next question's figure-bbox must NOT extend up through that
    space, otherwise we sweep all four option mini-graphs into the
    next question's figure."""
    return bool(_OPTION_GRAPHS_RE.search(prompt))


def _parse_section(section: str, pages: Iterable[fitz.Page]) -> list[dict]:
    expected = SECTION_RANGES[section]
    expected_opts = SECTION_EXPECTED_OPTIONS[section]
    pages_list = list(pages)  # may be a generator; we iterate twice
    lines = _gather_lines(pages_list)
    bins = _split_into_questions(lines, expected)

    # Index pages by number for figure-extraction lookup.
    pages_by_no = {p.number: p for p in pages_list}

    # Pass 1: parse every question. We keep prompt + bbox + page so
    # pass 2 can extend each question's figure-bbox to capture
    # above-the-prompt figures placed in the gap left by the question
    # ABOVE on the same page. (HP layouts often put the figure right
    # below the previous question's options and ABOVE this question's
    # prompt text.)
    parsed: list[dict] = []
    for num in sorted(bins):
        q = _parse_one_question(num, bins[num])
        if q is None:
            continue
        if len(q["options"]) not in expected_opts:
            continue
        parsed.append(q)

    # Group by page in y0 order.
    by_page: dict[int, list[dict]] = {}
    for q in parsed:
        by_page.setdefault(q["_page_no"], []).append(q)
    for page_q_list in by_page.values():
        page_q_list.sort(key=lambda x: x["_bbox"].y0)

    # Pass 2: extract figures with the extended bbox. Don't pop
    # _bbox / _page_no yet — neighboring questions will read them.
    out: list[dict] = []
    for q in parsed:
        page_no = q["_page_no"]
        bbox = q["_bbox"]
        page_q_list = by_page[page_no]
        idx = page_q_list.index(q)

        if idx == 0:
            # First question on the page: extend up to the page top.
            extended_y0 = 0.0
        else:
            prev_q = page_q_list[idx - 1]
            if _has_option_graphs(prev_q["prompt"]):
                # Previous question's options contain mini-graphs that
                # live in the gap. Don't extend through them.
                extended_y0 = bbox.y0
            else:
                # Extend back to where the previous question's text
                # ended; figures often sit in that gap above the prompt.
                extended_y0 = prev_q["_bbox"].y1

        if extended_y0 < bbox.y0:
            bbox = fitz.Rect(bbox.x0, extended_y0, bbox.x1, bbox.y1)

        page = pages_by_no.get(page_no)
        figure = None
        if page is not None:
            figure = extract_figure_svg(page, bbox)
        q["figure"] = figure
        out.append(q)
    # Now strip the internal bbox/page fields — downstream consumers
    # (build.py) shouldn't see them in the question record.
    for q in out:
        q.pop("_page_no", None)
        q.pop("_bbox", None)
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
