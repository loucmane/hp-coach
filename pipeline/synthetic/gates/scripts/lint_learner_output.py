#!/usr/bin/env python3
"""Learner-output lint: enforce the Layer-2 rendering contract.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 6). The P5 bank's
rationale fields legitimately carry (1) snake_case taxonomy labels
(112/114 units), (2) the anglicism *hedgat* (30/114), and (3) gate-internal
meta-commentary. None of that may reach learner-facing prose. The rendered
store (data/explanations/) is clean today — this lint makes that property
enforced instead of accidental. Run it on RENDERED learner text only;
it must NOT be pointed at the bank's internal adjudication metadata.

Checks, per JSON string value (or raw text file):
  L2-SNAKE   snake_case token carrying a pipeline taxonomy stem or label,
             compared with case, diacritics and underscores folded
             (WORLD_KNOWLEDGE, tone_misread, författarens_hållning); with
             --strict also any formula-style snake_case token (värde_B)
  L2-HEDGAT  hedgat/hedgad/hedgar/hedgade/hedgning (any case)
  L2-GATEREF gate-internal references: mech.py, M-FORM/M-ECHO/M-TELL/
             M-SCHEMA/M-BANDS/M-PLAGIARISM, G-KEY/G-STEM/G-SPRAK/G-SPRÅK/
             G-DISTRACTOR/G-REGISTER/G-ENG, absolutiser/absolutizer list,
             "round-N version" / "runda N-versionen" pipeline talk

Every scanned text is normalized to NFC once, before any check runs (PR #370
round 6, bead hpf-pvkp): a canonically equivalent spelling — å written as
a + U+030A, as NFD text has it — lints exactly like the precomposed one, and
excerpts show the normalized text.

Every rule also holds on the text as a learner sees it (PR #370 round 7, bead
hpf-klv6; threat model in docs/worklog/hpf-klv6.md). A word or token is
bounded by anything that is not a letter or digit, so an underscore beside it
cannot hide it (_WORLD_KNOWLEDGE_ is Markdown emphasis). Besides the scanned
text, each rule reads three rendered views of it:
  plain view   invisible characters dropped, right-to-left overrides undone,
               compatibility characters in NFKC form (a fullwidth low line is
               an underscore), stray combining marks dropped;
  app view     the same after KaTeX markup is interpreted between MathText's
               delimiters U+E000 and U+E001, and only there: the app's own
               rendering of a store string, where everything else is shown
               as it stands;
  markup view  the same after Markdown, HTML and KaTeX markup is interpreted
               everywhere (emphasis, code, links, escapes, tags, comments,
               character references, KaTeX style commands and groups, and
               the math delimiters): defense in depth for renderers the app
               does not use, best effort, not a complete CommonMark model.
A match in a view is reported against the scanned text: the excerpt is cut
around the characters that produced it. --strict's style debt is judged on the
scanned text only. The threat model assumes the app's renderer, MathText, which
shows Markdown and HTML as plain text (PR #370 round 8, bead hpf-4xvy;
LAYER2-RENDERING.md, pinned by tests/test_lint_renderer_assumption_round8.py).

Inputs fail closed (PR #370 round 2, bead hpf-oy2w): a path that does not
exist, a directory holding no lintable file (.json/.md/.txt, not _-prefixed),
a file that is not UTF-8, and a .json file that does not parse are input
failures, printed "INPUT-FAIL <path>: reason" — never scanned as raw text,
never reported clean. Zero files examined is an input failure too.

Exit 0 = clean. Exit 1 = findings, printed "L2-<RULE> <file>:<jsonpath>: excerpt"
(the path is "-" for a .md/.txt file; an invisible character anywhere in the
line is printed as <U+XXXX>).
Exit 2 = any input failure (findings, if any, are printed as well).
"""
from __future__ import annotations

import argparse
import functools
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

# L2-SNAKE — hardened per the 2026-08-31 GC review: case-insensitive,
# digits allowed inside segments, and the length gate is on the WHOLE
# token (>=5 chars, >=2 segments, at least one segment with >=2 letters)
# so scope_x / scope_2_shift / Scope_shift / SCOPE_SHIFT are all caught
# while math subscript notation stays protected by the store's
# math-preservation contract: v_r, a_n, b_m (total < 5) and K_2007 /
# a_1 (no segment with two letters) never flag.
# A segment is any run of Unicode letters and digits, i.e. word characters
# other than the `_` separator (PR #370 round 6, bead hpf-pvkp): idé_skifte
# is one token, where a class narrower than \w found no match at all, and
# scan_text has already normalized to NFC, so a decomposed å cannot split one.
# A token is bounded by anything that is not a letter or digit, and runs of
# underscores separate its segments (PR #370 round 7, bead hpf-klv6): \b never
# holds between `_` and a letter, so _WORLD_KNOWLEDGE_ was no token at all.
_SNAKE_TOKEN = re.compile(r"(?<![^\W_])[^\W_]+(?:_+[^\W_]+)+(?![^\W_])")


def _fold(s: str) -> str:
    """Case, diacritics and underscores removed (PR #370 round 5, bead
    hpf-6fkm): WORLD_KNOWLEDGE folds onto the stem worldknowledge, and
    författarens_hållning onto the label forfattarens_hallning. Case is folded
    on both sides of the compatibility decomposition, as in Unicode's
    compatibility caseless match (round 7): a mathematical bold or circled
    capital only becomes a plain capital in NFKD."""
    t = unicodedata.normalize("NFKD", unicodedata.normalize("NFKD", s.casefold()).casefold())
    return "".join(c for c in t if c != "_" and not unicodedata.combining(c))


# Tier 1 vocabulary: a snake token flags when its folded form contains the
# folded form of any entry below. Never add a bare common word: `trap` would
# hit the store's formula name A_trap, and `stance` a name like total_distance.
#
# The pipeline's trap-taxonomy vocabulary, as STEMS so case/digit/truncation
# evasions (scope_x, scope_2_shift, Scope_shift, SCOPE_SHIFT) are caught.
# Extend with any new taxonomy family; never remove without a store run.
_TAXONOMY_STEMS = ("scope", "shift", "causal", "worldknowledge",
                   "conjunction", "overgeneral", "generalis", "attribution",
                   "swap", "detail_as", "tempting", "hedg", "planted_trap", "trap_label",
                   "distractor", "misdirect", "as_main")
# Every snake_case label the pipeline's label sources use (survey 2026-10-05,
# docs/worklog/hpf-6fkm.md). Taxonomy labels, classes and statuses are listed
# in full; a bank label is listed only when no entry above already catches
# it. tests/test_verdict_enum_and_label_vocabulary_round5.py scans the same
# sources and fails on any label the default mode lets through.
_TAXONOMY_LABELS = (
    # LÄS trap tags (las/scripts/question_taxonomy.py TRAP_TAGS)
    "detail_as_main", "half_right_conjunction", "plausible_worldknowledge",
    "reversed_causality", "scope_shift", "surface_lexical_echo", "true_but_irrelevant",
    # LÄS question types (question_taxonomy.py TYPE_RULES, FALLBACK)
    "detalj_ospecificerad", "enligt_texten_detalj", "forfattarens_hallning",
    "hallning_stamning_ton", "huvudbudskap_syfte", "inference_slutsats",
    "jamforelse_relation", "ordbetydelse_i_kontext", "struktur_funktion",
    # LÄS genres (las/scripts/genre_classify.py PRIORITY, MACRO)
    "debatt_opinion", "facktext_larobok", "intervju_reportage", "juridik_myndighet",
    # ELF trap tags (elf/scripts/build_families.py TRAP_TAGS)
    "collocation_misfit", "outside_knowledge", "polarity_contrast_miss",
    "quantifier_upgrade", "role_or_attribution_swap", "scope_error", "surface_word_match",
    "tone_misread", "too_literal_or_too_far", "wrong_location",
    # gate classes (verdict schema, G-KEY/G-STEM prompts, blind_classification
    # and solver_answer in verdict files) and aggregation statuses
    "MULTIPLE_DEFENSIBLE", "NONE_DEFENSIBLE", "NOT_ANSWERABLE", "PARTIALLY_ANSWERABLE",
    "RECALL_ONLY", "STRUCTURAL_LEAK", "WORLD_KNOWLEDGE", "SURVIVED_CLEAN", "SURVIVED_FLAGGED",
    # review, sweep, audit, V-FINAL and adjudication statuses (BATCH-RUNBOOK,
    # run-batch.workflow.js, vfinal_fold.py, batch adjudication notes and
    # records, the law-16 originality sweep)
    "BEARER_SAME_DOMAIN", "BEARER_UNRELATED_FIELD", "BLOCKED_SHIP", "CONFIRMED_NOTES",
    "GODKANN_NOTED", "MINOR_EDITS", "MINOR_FIXES", "MINOR_NOTES", "NEEDS_REDESIGN",
    "NEEDS_WORK", "NO_BEARER", "PUBLISH_READY", "REJECT_LANGUAGE",
    "RESOLVED_WITH_REGRESSION", "UNRESOLVED_MITIGATED", "VERIFIED_NOTES",
    # bank labels (candidates' trap/family/genre/format fields and question
    # rationales) that no entry above catches
    "absence_of_evidence", "clone_avoidance", "cloze_5gap", "concession_overread",
    "craft_reportage", "detail_transplant_ort", "detalj_direct_detail",
    "essa_kulturhistoria", "essa_kulturhistorisk", "explicitly_refuted_criterion",
    "false_premise_kvantitet", "finding_or_ruling", "hallning_stance_tone",
    "history_essay", "huvudbudskap_main_idea", "inferens_inference", "key_derivation",
    "long_passage_5q", "magnitude_overclaim", "method_or_case", "negated_target_restated",
    "nuance_or_caveat", "one_inch_inference", "paraphrase_one_sentence",
    "polarity_mirror", "quantifier_downgrade", "reversed_comparison",
    "reversed_direction", "science_journalism", "self_blind_solve", "sense_misfit",
    "short_text_1q", "society_commentary", "stance_inversion", "stem_lexis_note",
    "too_far", "too_literal", "true_but_distorted", "two_step_leap", "umbrella_decoy",
    "whole_text_gist", "wrong_logic", "wrong_transfer", "zero_sum_displacement",
)
_TIER1 = frozenset(_fold(x) for x in _TAXONOMY_STEMS + _TAXONOMY_LABELS)


# ---------------------------------------- the text as a learner sees it
# PR #370 round 7 (bead hpf-klv6). The store's strings are rendered by the
# app's MathText (app/src/components/MathText.tsx): plain text, except what
# sits between U+E000 and the next U+E001, which KaTeX typesets. That is the
# learner renderer the threat model assumes (round 8, bead hpf-4xvy; pinned by
# tests/test_lint_renderer_assumption_round8.py): the app renders no Markdown
# and no HTML, so the scanned text, the plain view and the app view cover what
# a learner sees. The markup view interprets Markdown and HTML as a CommonMark
# renderer would, as defense in depth: best effort, not a completeness claim.
_MATH_OPEN, _MATH_CLOSE = chr(0xE000), chr(0xE001)
_RLO, _PDF = chr(0x202E), chr(0x202C)
# where the bidirectional algorithm ends an override: its PDF, or the paragraph
_PARAGRAPH_END = frozenset("\n\r\x1c\x1d\x1e\x85" + chr(0x2029))


def _char_class(ranges) -> str:
    return "[" + "".join(re.escape(chr(a)) if a == b else f"{re.escape(chr(a))}-{re.escape(chr(b))}"
                         for a, b in ranges) + "]"


# Characters no renderer draws: general category Cf (Unicode 15.0, the
# Python 3.12 database CI runs) and the other Default_Ignorable_Code_Points
# (combining grapheme joiner, variation selectors, Hangul fillers, …).
# tests/test_lint_rendered_view_round7.py checks the Cf part against the
# running unicodedata.
_INVISIBLE_RANGES = (
    (0x00AD, 0x00AD), (0x034F, 0x034F), (0x0600, 0x0605), (0x061C, 0x061C), (0x06DD, 0x06DD),
    (0x070F, 0x070F), (0x0890, 0x0891), (0x08E2, 0x08E2), (0x115F, 0x1160), (0x17B4, 0x17B5),
    (0x180B, 0x180F), (0x200B, 0x200F), (0x202A, 0x202E), (0x2060, 0x206F), (0x3164, 0x3164),
    (0xFE00, 0xFE0F), (0xFEFF, 0xFEFF), (0xFFA0, 0xFFA0), (0xFFF0, 0xFFFB), (0x110BD, 0x110BD),
    (0x110CD, 0x110CD), (0x13430, 0x1343F), (0x1BCA0, 0x1BCA3), (0x1D173, 0x1D17A),
    (0xE0000, 0xE0FFF))
# Combining marks of the generic diacritic blocks: a mark NFC cannot compose
# with its letter (K + U+0308) would otherwise end a token.
_MARK_RANGES = ((0x0300, 0x036F), (0x0483, 0x0489), (0x1AB0, 0x1AFF), (0x1DC0, 0x1DFF),
                (0x20D0, 0x20FF), (0xFE20, 0xFE2F))
_INVISIBLE = re.compile(_char_class(_INVISIBLE_RANGES))
_DROPPED = re.compile(_char_class(_INVISIBLE_RANGES + _MARK_RANGES))

# KaTeX's font/style registrations, generated offline by katex_inventory.py.
# Ship the JSON beside this script: linting and Python-only CI need no Node
# or node_modules. The installed-source test detects inventory/version drift.
_KATEX_STYLE = tuple(json.loads(
    Path(__file__).with_name("katex_style_commands.json").read_text(encoding="utf-8"))["commands"])
# Existing non-font wrappers retain their handling independently of the font
# inventory (PR #370 round 11); these are not font/style registrations.
_KATEX_WRAPPERS = (
    "operatorname", "mbox", "hbox", "underline", "overline", "boxed", "fbox", "cancel",
    "bcancel", "xcancel", "sout", "mathord", "mathop", "mathbin", "mathrel", "mathopen",
    "mathclose", "mathpunct", "mathinner")
# KaTeX markup that renders as nothing: a colour command with its colour
# argument, a style command (its argument stays)
_KATEX_DROP = (r"\\(?:textcolor|colorbox|color)\s*\{[^{}]*\}|\\fcolorbox\s*\{[^{}]*\}\s*\{[^{}]*\}"
               r"|\\(?:" + "|".join(sorted(_KATEX_STYLE + _KATEX_WRAPPERS, key=len, reverse=True))
               + r")(?![A-Za-z])")
_UNDERSCORE = r"(?P<underscore>\\textunderscore(?![A-Za-z]))"
_ESCAPE = r"\\(?P<escaped>[!-/:-@\[-`{-~])"           # Markdown or TeX backslash escape
# what KaTeX interprets: the app view applies it between the math delimiters
_KATEX = re.compile(r"(?P<drop>" + _KATEX_DROP + r"|[{}])|" + _UNDERSCORE + "|" + _ESCAPE)
# what any renderer may interpret: the markup view applies it everywhere
_MARKUP = re.compile(
    # markup that renders as nothing; an unterminated comment, CDATA section
    # or processing instruction stops at the next opener, so the scan stays
    # linear in the text
    r"(?P<drop><!--(?:(?!<!--).)*?-->|<!\[CDATA\[(?:(?!<!\[CDATA\[).)*?\]\]>"  # HTML comment, CDATA
    r"|<\?(?:(?!<\?).)*?\?>|<![A-Za-z][^<>]*>"                            # processing instruction, declaration
    r"|</?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?/?>"                          # HTML tag
    r"|\]\((?:<[^<>\n]*>|(?:[^()\s]|\([^()\s]*\))*)"                      # Markdown link target …
    r"(?:\s+(?:\"[^\"\n]*\"|'[^'\n]*'|\([^()\n]*\)))?\s*\)"               # … and its title
    r"|\]\[[^\[\]]*\]"                                                     # Markdown reference
    r"|" + _KATEX_DROP +
    r"|[*~`\[\]{}" + _MATH_OPEN + _MATH_CLOSE + r"])"  # Markdown delimiters, TeX groups, math delimiters
    r"|" + _UNDERSCORE + "|" + _ESCAPE +
    r"|(?P<reference>&(?:#[0-9]{1,7}|#[xX][0-9A-Fa-f]{1,6}|[A-Za-z][A-Za-z0-9]{1,31});?)",  # HTML reference
    re.DOTALL)
_MARKUP_START = re.compile(r"[<&\\*~`\[\]{}" + _MATH_OPEN + _MATH_CLOSE + "]")


class _Hit:
    """A match found in a view, located in the scanned text: start(), end()
    and group(0) answer like an re.Match on the scanned text."""

    __slots__ = ("string", "_start", "_end")

    def __init__(self, string: str, start: int, end: int):
        self.string, self._start, self._end = string, start, end

    def start(self) -> int:
        return self._start

    def end(self) -> int:
        return self._end

    def group(self, *groups) -> str:
        if groups not in ((), (0,)):
            raise IndexError("a view match has no groups")
        return self.string[self._start:self._end]


class _View:
    """A rendered view of a scanned text: .text, and for each of its
    characters the span of the scanned text that produced it."""

    __slots__ = ("text", "_starts", "_ends")

    def __init__(self, pieces):
        """pieces: (string, start, end, literal). A literal string is the
        scanned text from start on; any other string replaces [start, end).
        Invisible characters and stray combining marks are dropped, every
        other character is replaced by its NFKC form, and an RLO run is
        reversed, as the bidirectional algorithm displays it."""
        chars, starts, ends = [], [], []
        rlo = None
        for s, start, end, literal in pieces:
            if (literal and rlo is None and not _DROPPED.search(s)
                    and unicodedata.is_normalized("NFKC", s)):
                chars.extend(s)
                starts.extend(range(start, start + len(s)))
                ends.extend(range(start + 1, start + len(s) + 1))
                continue
            for i, c in enumerate(s):
                a, b = (start + i, start + i + 1) if literal else (start, end)
                if rlo is not None and (c == _PDF or c in _PARAGRAPH_END):
                    self._reverse(chars, starts, ends, rlo)
                    rlo = None
                elif c == _RLO and rlo is None:
                    rlo = len(chars)
                if _DROPPED.match(c):
                    continue
                for d in c if c.isascii() else unicodedata.normalize("NFKC", c):
                    if not _DROPPED.match(d):
                        chars.append(d)
                        starts.append(a)
                        ends.append(b)
        if rlo is not None:
            self._reverse(chars, starts, ends, rlo)
        self.text, self._starts, self._ends = "".join(chars), starts, ends

    @staticmethod
    def _reverse(*lists_and_start):
        *lists, k = lists_and_start
        for lst in lists:
            lst[k:] = lst[k:][::-1]

    def hit(self, source: str, m) -> _Hit:
        """m, a match in this view, as a match in the scanned text."""
        a, b = m.start(), m.end()
        return _Hit(source, min(self._starts[a:b]), max(self._ends[a:b]))


def _pieces(rx, text: str, start: int, end: int) -> list:
    """text[start:end] as _View pieces, with rx's markup interpreted."""
    out, pos = [], start
    for m in rx.finditer(text, start, end):
        if m.start() > pos:
            out.append((text[pos:m.start()], pos, m.start(), True))
        pos = m.end()
        if m.lastgroup == "underscore":
            out.append(("_", m.start(), m.end(), False))
        elif m.lastgroup == "escaped":
            out.append((m.group("escaped"), m.start(), m.end(), False))
        elif m.lastgroup == "reference":
            decoded = html.unescape(m.group(0))
            out.append((decoded, m.start(), m.end(), decoded == m.group(0)))
    if pos < end:
        out.append((text[pos:end], pos, end, True))
    return out


def _app_pieces(text: str) -> list:
    """MathText's rendering as _View pieces: KaTeX between U+E000 and the next
    U+E001, everything else as it stands (also after an unmatched U+E000)."""
    out, i = [], 0
    while i < len(text):
        a = text.find(_MATH_OPEN, i)
        if a == -1:
            out.append((text[i:], i, len(text), True))
            break
        if a > i:
            out.append((text[i:a], i, a, True))
        b = text.find(_MATH_CLOSE, a + 1)
        if b == -1:
            out.append((text[a + 1:], a + 1, len(text), True))
            break
        out += _pieces(_KATEX, text, a + 1, b)
        i = b + 1
    return out


@functools.lru_cache(maxsize=16)
def _views(text: str) -> tuple:
    """The plain, app and markup views of a scanned text, each only when it
    differs from the text and from the views before it."""
    pieces = []
    if _DROPPED.search(text) or not unicodedata.is_normalized("NFKC", text):
        pieces.append([(text, 0, len(text), True)])
    if _MATH_OPEN in text:
        pieces.append(_app_pieces(text))
    if _MARKUP_START.search(text):
        pieces.append(_pieces(_MARKUP, text, 0, len(text)))
    seen, out = {text}, []
    for p in pieces:
        view = _View(p)
        if view.text not in seen:
            seen.add(view.text)
            out.append(view)
    return tuple(out)


def _is_label(token: str) -> bool:
    folded = _fold(token)
    return any(entry in folded for entry in _TIER1)


def _is_style_token(token: str) -> bool:
    return len(token) >= 5 and any(sum(c.isalpha() for c in seg) >= 2 for seg in token.split("_"))


class _Snake:
    """Two-tier snake_case detector.

    Tier 1 (always fails): snake tokens whose folded form (_fold: case,
    diacritics and underscores removed) contains a taxonomy stem or label —
    these are internal join keys and must never reach learner prose. Tier 1
    reads the scanned text and then its rendered views (_views, round 7).
    Tier 2 (only with --strict): any other snake token of length >= 5 with
    a >=2-letter segment — improvised formula variable names (värde_B,
    antal_A, K_diff). Those are a bounded STYLE debt (bead hpf-gyo5,
    non-blocking, inspect-before-replace), not gate-internal leakage, and
    the store's math-preservation contract protects them from blind
    rewriting. Tier 2 judges the stored spelling, so it reads the scanned text
    only: a LaTeX subscript such as V_{\\text{ny}} is notation, not debt.
    Pure subscript notation (v_r, a_n, K_2007) never flags in either tier.
    search() expects canonical text: scan_text, its only caller, normalizes
    to NFC before any rule runs.
    """

    def __init__(self, strict: bool = False):
        self.strict = strict

    def search(self, text):
        fallback = None
        for m in _SNAKE_TOKEN.finditer(text):
            if _is_label(m.group(0)):
                return m
            if self.strict and fallback is None and _is_style_token(m.group(0)):
                fallback = m
        for view in _views(text):
            for m in _SNAKE_TOKEN.finditer(view.text):
                if _is_label(m.group(0)):
                    return view.hit(text, m)
        return fallback


class _Rendered:
    """A rule that holds on the scanned text and on each rendered view of it."""

    def __init__(self, *patterns):
        self.patterns = patterns

    def search(self, text):
        for rx in self.patterns:
            m = rx.search(text)
            if m:
                return m
        for view in _views(text):
            for rx in self.patterns:
                m = rx.search(view.text)
                if m:
                    return view.hit(text, m)
        return None


SNAKE = _Snake()
# Word bounds are "no letter or digit beside it" rather than \b, so an
# underscore beside the word cannot hide it (_hedgat_, round 7).
HEDGAT = _Rendered(re.compile(r"(?<![^\W_])hedg(?:at|ad|ar|ade|ning)(?![^\W_])", re.IGNORECASE))
# Gate names — hardened per the 2026-08-31 GC review: case-INSENSITIVE for
# G-* gates and mech.py (no Swedish collision), and for M-* gates with a
# guard that exempts math prose like "k-m-form" / "kx + m-form" (a gate
# name preceded by <alnum>- or by "+ "/"= " is arithmetic, not a gate).
GATEREF_GATES = re.compile(
    r"mech\.py"
    r"|(?<![0-9A-Za-z-])(?<![+=] )[mM]-(?:form|echo|tell|schema|bands|plagiarism)(?![^\W_])"
    r"|(?<![^\W_])[gG]-(?:key|stem|sprak|språk|distractor|register|eng)(?![^\W_])",
    re.IGNORECASE,
)
GATEREF_PHRASES = re.compile(
    r"absoluti[sz]er|round[- ]\d+\s+version|runda[- ]\d+[- ]?version\w*"
    r"|version(?:en)? från runda \d+",
    re.IGNORECASE,
)
GATEREF = _Rendered(GATEREF_GATES, GATEREF_PHRASES)
RULES = (("L2-SNAKE", SNAKE), ("L2-HEDGAT", HEDGAT), ("L2-GATEREF", GATEREF))


def scan_text(text: str) -> list[tuple[str, str]]:
    # The one entry point every rule shares: NFC here, once, before any regex
    # runs (PR #370 round 6, bead hpf-pvkp). NFC, not NFKC: compatibility
    # folding would rewrite learner math in the excerpts (x² as x2, aₙ as an),
    # and tier 1 folds compatibility letters inside a token anyway (_fold).
    # Each rule also reads the rendered views of this NFC text, where NFKC does
    # apply, and reports a match there as a span of this text (round 7), so the
    # excerpt is always cut from the scanned text.
    text = unicodedata.normalize("NFC", text)
    hits = []
    for name, rx in RULES:
        m = rx.search(text)
        if m:
            start = max(0, m.start() - 30)
            hits.append((name, text[start:m.end() + 30].replace("\n", " ")))
    return hits


def _shown(line: str) -> str:
    """A finding line for the terminal: each invisible character as <U+XXXX>,
    so the line shows where it sits and a bidi control cannot reorder it."""
    return _INVISIBLE.sub(lambda m: f"<U+{ord(m.group()):04X}>", line)


def walk_json(obj, path, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k.startswith("_"):
                # _-prefixed keys are in-file bookkeeping (audit metadata),
                # never rendered to learners — same convention as _-files.
                continue
            walk_json(v, f"{path}.{k}", out)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            walk_json(v, f"{path}[{i}]", out)
    elif isinstance(obj, str):
        for rule, excerpt in scan_text(obj):
            out.append((rule, path, excerpt))


LINTABLE = (".json", ".md", ".txt")


def collect(paths: list[Path]) -> tuple[list[Path], list[str]]:
    """Files to lint, plus an INPUT-FAIL line for every path that yields none."""
    files: list[Path] = []
    failures: list[str] = []
    for p in paths:
        if p.is_dir():
            # underscore-prefixed files are pipeline bookkeeping (audit notes,
            # skip ledgers) by store convention — never learner-facing.
            found = sorted(q for q in p.rglob("*")
                           if q.is_file() and q.suffix.lower() in LINTABLE
                           and not q.name.startswith("_"))
            if not found:
                failures.append(f"INPUT-FAIL {p}: no lintable file in this directory "
                                f"({'/'.join(LINTABLE)}, not _-prefixed) — nothing to check")
            files.extend(found)
        elif p.is_file():
            files.append(p)
        else:
            failures.append(f"INPUT-FAIL {p}: path does not exist (or is not a file "
                            f"or directory)")
    return files, failures


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("paths", nargs="+", type=Path,
                    help="rendered learner-output files or directories (json/md/txt)")
    ap.add_argument("--strict", action="store_true",
                    help="also fail on generic snake_case style tokens "
                         "(formula variable names), not only taxonomy stems")
    args = ap.parse_args()
    SNAKE.strict = args.strict
    files, failures = collect(args.paths)
    for line in failures:
        print(line)
    findings = examined = 0
    for fp in files:
        try:
            text = fp.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            failures.append(f"INPUT-FAIL {fp}: not readable as UTF-8 text ({exc})")
            print(failures[-1])
            continue
        out: list[tuple[str, str, str]] = []
        if fp.suffix.lower() == ".json":
            try:
                doc = json.loads(text)
            except json.JSONDecodeError as exc:
                # never fall back to a raw-text scan: a broken store file is
                # an input failure, not a clean file (bead hpf-oy2w)
                failures.append(f"INPUT-FAIL {fp}: not valid JSON ({exc})")
                print(failures[-1])
                continue
            walk_json(doc, "$", out)
        else:
            for r, e in scan_text(text):
                out.append((r, "-", e))
        examined += 1
        for rule, path, excerpt in out:
            print(_shown(f"{rule} {fp}:{path}: …{excerpt}…"))
            findings += 1
    if not examined and not failures:
        failures.append("INPUT-FAIL -: zero files examined")
        print(failures[-1])
    if failures:
        print(f"learner-output lint: FAILED — {len(failures)} input failure(s), "
              f"{findings} finding(s) in {examined} file(s) examined")
        return 2
    if findings:
        print(f"learner-output lint: {findings} finding(s) in {examined} file(s)")
        return 1
    print(f"learner-output lint: clean — {examined} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
