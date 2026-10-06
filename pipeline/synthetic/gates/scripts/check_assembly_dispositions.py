#!/usr/bin/env python3
"""Assembly "disposition owed" → explicit G-REGISTER disposition, enforced.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 3): two batches in a
row the assembly named a cross-batch name proximity with the words
"disposition owed" and G-REGISTER answered with a bare pass — which is
indistinguishable from "never looked". This check closes the loop:

  Every occurrence of the marker "disposition owed" must name at least one
  unit id (elf-*/las-*) in its OWN SENTENCE, and for each named unit the
  G-REGISTER verdict stream must carry an explicit disposition of at least
  20 characters: a "disposition" field, or a finding note that starts with
  "disposition:" or says "not-applicable"/"not applicable". A bare pass, or
  merely non-empty findings, does NOT discharge the marker.

  Marker (PR #370 round 4, bead hpf-wu46): "disposition" or "dispositions",
  then "owed", in any case, with whitespace (a line wrap included) or inline
  emphasis/code markers (*, _, `) between or around the words, so
  "dispositions owed", "disposition **owed**" and "`disposition owed`" all
  count. Any other word or punctuation between the two words makes no marker.

  Scope (PR #370 review, bead hpf-qo10): a marker's units are looked up
  only inside its markdown block — the list item or paragraph holding it,
  wrapped continuation lines included — and, within that block, only in the
  sentence holding the marker. Never a sibling or nested list item, heading,
  table row, or text across a blank line. The sentence bound is load-
  bearing: batch16 ASSEMBLY.md item 2 carries two obligations in one list
  item, and the second (line 50) names no unit; item-wide lookup would let
  the first obligation's dispositions silently discharge it.

  Sentence (PR #370 round 2, bead hpf-oy2w): it ends at . ; ! or ? followed
  by whitespace, WHATEVER the case of the next word — "elf-b16-003 is clean.
  cross-batch echo; disposition owed." names no unit in the marker's
  sentence. A ";" clause counts as a sentence of its own. Never split: a
  decimal ("8.7"), a file name ("ASSEMBLY.md") or a unit id (no whitespace
  after the dot), nor the full stop of an abbreviation that always takes a
  complement (_ABBREVIATIONS: "vs.", "e.g.", "t.ex." ...). When in doubt the
  text is split: a split can only narrow a marker's sentence towards
  "<no unit named>" (fail closed), never lend it a unit from another one.

  Tables (PR #370 round 3, bead hpf-96rj): every GFM pipe-table row is a
  block of its own, with or without leading/trailing pipes, so a marker row
  names only its own unit(s) — "Other | disposition owed" names none, whatever
  the other rows say. A table is found by its delimiter row (cells of "-",
  optional ":" alignment); a "|" in prose with no delimiter row is no table.
  The delimiter row names no unit and is no marker. A marker wrapped across
  two adjacent lines of different blocks (two rows; a heading and the line
  below it) is in neither block: it still counts, and names no unit.

  Blockquotes (PR #370 round 4, bead hpf-wu46): every rule above reads a
  line's text after its blockquote markers (">" and one optional space, any
  nesting depth), so a quoted list item, heading or table row is one, and a
  marker wrapped across two lines of one quote is found. A quote-only line
  (">", "> >") is a blank line, and a change of quote depth ends the block,
  also where GFM would read a lazy continuation line: a quote never lends a
  unit to the text around it, nor borrows one from it.

Exit 0 = all markers discharged (or no markers). Exit 1 = any undischarged
marker, printed as "DISPOSITION-OWED <unit>: line <n>: <sentence excerpt>",
with "<no unit named>" in place of the unit when the sentence names none and
"(split across two blocks)" opening the excerpt of a marker in neither block.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

UNIT_RE = re.compile(r"\b(?:elf|las)-b\d+-\d+\b")
# "disposition(s)" then "owed" across whitespace and emphasis/code markers (bead
# hpf-wu46). Blocks are joined with single spaces, so a line wrap is whitespace.
MARKER_RE = re.compile(r"dispositions?[\s*_`]+owed", re.IGNORECASE)

# Markdown blocks, read on each line's text after its blockquote markers
# (_QUOTE): a blank or quote-only line closes the open block, and so does a
# change of quote depth; a list item (bullet or ordered, any nesting depth)
# opens a new one; a heading, table row, thematic break or code fence is a
# block of its own line; any other line continues the open block (wrapped
# continuation) or opens a paragraph.
_LIST_ITEM = re.compile(r"^\s*(?:[-*+]|\d{1,9}[.)])\s+")
_OPENER = r"#{1,6}(?:\s|$)|(?:[-*_]\s*){3,}$|```|~~~"  # heading, thematic break, fence
_ONE_LINE_BLOCK = re.compile(r"^\s{0,3}(?:" + _OPENER + r"|\|)")
# A table row is a line starting with "|" or any line of a GFM pipe table (bead
# hpf-96rj). The table is found by its delimiter row — cells of "-" with
# optional ":" alignment, outer pipes optional, holding a "|" or a ":" (a bare
# "---" is a thematic break or setext underline) — and runs from the header row
# above it to the next blank line, line opening another block (_LIST_ITEM,
# _TABLE_END) or change of blockquote depth. As in GFM (spec example 202), a
# line without "|" inside that run is a one-cell row, never a paragraph line
# that could join the next one.
_TABLE_DELIMITER = re.compile(r"^(?=.*[|:])\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$")
_TABLE_END = re.compile(r"^\s{0,3}(?:" + _OPENER + ")")
# Blockquote markers, any nesting depth: ">" and one optional space (GFM), with
# indentation allowed before each ">" (a quote inside a list item).
_QUOTE = re.compile(r"^(?:\s*>[ \t]?)*")
# A sentence ends at . ; ! or ? (plus closing quotes/brackets/emphasis) when
# whitespace follows — never on the case of the next word (bead hpf-oy2w).
# "8.7", "ASSEMBLY.md" and unit ids have no whitespace after the dot; a full
# stop closing one of _ABBREVIATIONS is not a boundary either. Only
# abbreviations that always take a complement belong there: one that can end
# a sentence ("etc.", "osv.", "m.m.") would join two sentences and could lend
# the marker a unit, so it is left to split.
_SENTENCE_GAP = re.compile(r"[.;!?][\"')\]*_`”’»]*\s+")
_ABBREVIATIONS = frozenset((
    "vs", "e.g", "i.e", "cf", "viz", "approx", "ca", "incl", "excl", "resp",
    "fig", "nr", "dr", "mr", "mrs", "ms", "prof",
    "t.ex", "bl.a", "d.v.s", "dvs", "s.k", "jfr", "p.g.a", "pga", "fr.o.m",
    "t.o.m", "inkl", "exkl", "kap",
))
_TOKEN_OPENERS = "\"'([{*_`“‘«"


# Hardened per the 2026-08-31 GC hardening-review lane: a merely non-empty
# findings array no longer discharges anything — content-free records were
# indistinguishable from a written disposition. Discharge now requires an
# EXPLICIT disposition sentence (>= 20 chars of substance) either in a
# dedicated "disposition" field or in a finding note that begins with
# "disposition:" / contains "not-applicable"/"not applicable" plus a reason.
_MIN_SUBSTANCE = 20


def discharged(unit: str, verdict_files: list[Path]) -> bool:
    for vf in verdict_files:
        for line in vf.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            v = json.loads(line)
            if v.get("gate") != "G-REGISTER" or v.get("candidate_id") != unit:
                continue
            disp = v.get("disposition")
            if isinstance(disp, str) and len(disp.strip()) >= _MIN_SUBSTANCE:
                return True
            for f in v.get("findings") or []:
                note = (f.get("note") or "").strip()
                low = note.lower()
                explicit = (low.startswith("disposition:")
                            or "not-applicable" in low
                            or "not applicable" in low)
                if explicit and len(note) >= _MIN_SUBSTANCE:
                    return True
    return False


def _quoted(raw: str) -> tuple[int, str]:
    """A line's blockquote depth and its text after the quote markers."""
    quote = _QUOTE.match(raw).group()
    return quote.count(">"), raw[len(quote):]


def _table_rows(lines: list[str]) -> set[int]:
    """Indices of every line of every GFM pipe table (rules above _TABLE_DELIMITER)."""
    rows: set[int] = set()
    for i, raw in enumerate(lines):
        depth, text = _quoted(raw)
        if not _TABLE_DELIMITER.match(text):
            continue
        if i and _quoted(lines[i - 1])[1].strip():
            rows.add(i - 1)  # the header row
        rows.add(i)
        for j in range(i + 1, len(lines)):
            row_depth, text = _quoted(lines[j])
            if (row_depth != depth or not text.strip()
                    or _LIST_ITEM.match(text) or _TABLE_END.match(text)):
                break
            rows.add(j)
    return rows


def _blocks(lines: list[str]) -> list[list[int]]:
    """Group line indices into markdown blocks (rules above _LIST_ITEM)."""
    table = _table_rows(lines)
    blocks: list[list[int]] = []
    open_block: list[int] | None = None
    open_depth = 0
    for i, raw in enumerate(lines):
        depth, text = _quoted(raw)
        if not text.strip():
            open_block = None
        elif i in table or _ONE_LINE_BLOCK.match(text):
            blocks.append([i])
            open_block = None
        elif open_block is None or depth != open_depth or _LIST_ITEM.match(text):
            open_block, open_depth = [i], depth
            blocks.append(open_block)
        else:
            open_block.append(i)
    return blocks


def _closes_abbreviation(text: str, dot: int) -> bool:
    """True when the full stop at `dot` ends a word listed in _ABBREVIATIONS."""
    start = dot
    while start > 0 and not text[start - 1].isspace():
        start -= 1
    return text[start:dot].lstrip(_TOKEN_OPENERS).lower() in _ABBREVIATIONS


def _sentence_spans(text: str) -> list[tuple[int, int]]:
    spans, start = [], 0
    for m in _SENTENCE_GAP.finditer(text):
        if text[m.start()] == "." and _closes_abbreviation(text, m.start()):
            continue
        spans.append((start, m.end()))
        start = m.end()
    spans.append((start, len(text)))
    return spans


def find_markers(lines: list[str]) -> list[tuple[int, list[str], str]]:
    """Every marker as (1-based line, unit ids in its sentence, that sentence).

    Each block is joined into one whitespace-normalised string of its lines'
    text after their quote markers, so a marker phrase wrapped across two
    lines is still found (and reported on the line where it starts) and a
    unit id on a wrapped continuation line is still in scope — but nothing
    outside the block ever is. A marker wrapped from one block's last line
    into the next block's first line is in neither block: it is found all the
    same, naming no unit.
    """
    found = []
    dequoted = [_quoted(raw)[1] for raw in lines]
    blocks = _blocks(lines)
    for block in blocks:
        parts, starts, pos = [], [], 0
        for k, i in enumerate(block):
            text = _LIST_ITEM.sub("", dequoted[i], count=1) if k == 0 else dequoted[i]
            text = " ".join(text.split())
            starts.append((pos, i))
            parts.append(text)
            pos += len(text) + 1
        joined = " ".join(parts)
        spans = _sentence_spans(joined)
        for m in MARKER_RE.finditer(joined):
            line = max(i for p, i in starts if p <= m.start()) + 1
            s, e = next(sp for sp in spans if sp[0] <= m.start() < sp[1])
            sentence = joined[s:e].strip()
            found.append((line, list(dict.fromkeys(UNIT_RE.findall(sentence))), sentence))
    for first in (block[0] for block in blocks):
        if not first or not dequoted[first - 1].strip():
            continue
        tail, head = (" ".join(dequoted[k].split()) for k in (first - 1, first))
        pair = f"{tail} {head}"
        for m in MARKER_RE.finditer(pair):
            if m.start() < len(tail) < m.end():
                s, e = next(sp for sp in _sentence_spans(pair) if sp[0] <= m.start() < sp[1])
                found.append((first, [], "(split across two blocks) " + pair[s:e].strip()))
    return sorted(found, key=lambda f: f[0])


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("assembly", type=Path, help="path to ASSEMBLY.md")
    ap.add_argument("verdicts", nargs="+", type=Path,
                    help="verdict jsonl files that may carry G-REGISTER records")
    args = ap.parse_args()
    problems: list[str] = []
    markers = find_markers(args.assembly.read_text(encoding="utf-8").splitlines())
    for line, units, sentence in markers:
        where = f"line {line}: {sentence[:120]}"
        if not units:
            problems.append(f"DISPOSITION-OWED <no unit named>: {where}")
            continue
        for unit in units:
            if not discharged(unit, args.verdicts):
                problems.append(f"DISPOSITION-OWED {unit}: {where}")
    for p in problems:
        print(p)
    if problems:
        print(f"assembly-dispositions: {len(problems)} undischarged of {len(markers)} marker(s)")
        return 1
    print(f"assembly-dispositions: OK — {len(markers)} marker(s), all discharged")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
