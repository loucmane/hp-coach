#!/usr/bin/env python3
"""Assembly "disposition owed" → explicit G-REGISTER disposition, enforced.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 3): two batches in a
row the assembly named a cross-batch name proximity with the words
"disposition owed" and G-REGISTER answered with a bare pass — which is
indistinguishable from "never looked". This check closes the loop:

  Every occurrence of the marker "disposition owed" (case-insensitive, also
  when markdown wraps it across two lines) must name at least one unit id
  (elf-*/las-*) in its OWN SENTENCE, and for each named unit the
  G-REGISTER verdict stream must carry an explicit disposition of at least
  20 characters: a "disposition" field, or a finding note that starts with
  "disposition:" or says "not-applicable"/"not applicable". A bare pass, or
  merely non-empty findings, does NOT discharge the marker.

  Scope (PR #370 review, bead hpf-qo10): a marker's units are looked up
  only inside its markdown block — the list item or paragraph holding it,
  wrapped continuation lines included — and, within that block, only in the
  sentence holding the marker. Never a sibling or nested list item, heading,
  table row, or text across a blank line. The sentence bound is load-
  bearing: batch16 ASSEMBLY.md item 2 carries two obligations in one list
  item, and the second (line 50) names no unit; item-wide lookup would let
  the first obligation's dispositions silently discharge it.

Exit 0 = all markers discharged (or no markers). Exit 1 = any undischarged
marker, printed as "DISPOSITION-OWED <unit>: line <n>: <sentence excerpt>",
with "<no unit named>" in place of the unit when the sentence names none.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

UNIT_RE = re.compile(r"\b(?:elf|las)-b\d+-\d+\b")
MARKER_RE = re.compile(r"disposition\s+owed", re.IGNORECASE)

# Markdown blocks: a blank line closes the open block; a list item (bullet or
# ordered, any nesting depth) opens a new one; a heading, table row, thematic
# break or code fence is a block of its own line; any other line continues the
# open block (wrapped continuation) or opens a paragraph.
_LIST_ITEM = re.compile(r"^\s*(?:[-*+]|\d{1,9}[.)])\s+")
_ONE_LINE_BLOCK = re.compile(r"^\s{0,3}(?:#{1,6}(?:\s|$)|\||(?:[-*_]\s*){3,}$|```|~~~)")
# A sentence ends at . ! or ? (plus closing quotes/brackets/emphasis) when
# whitespace and an upper-case letter follow; "vs. las-b16-002", "e.g. the",
# "8.7" and "ASSEMBLY.md" stay inside one sentence.
_SENTENCE_GAP = re.compile(r"[.!?][\"')\]*_`”’»]*\s+")
_SENTENCE_OPENERS = "\"'([*_`“‘«"


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


def _blocks(lines: list[str]) -> list[list[int]]:
    """Group line indices into markdown blocks (rules above _LIST_ITEM)."""
    blocks: list[list[int]] = []
    open_block: list[int] | None = None
    for i, raw in enumerate(lines):
        if not raw.strip():
            open_block = None
        elif _ONE_LINE_BLOCK.match(raw):
            blocks.append([i])
            open_block = None
        elif open_block is None or _LIST_ITEM.match(raw):
            open_block = [i]
            blocks.append(open_block)
        else:
            open_block.append(i)
    return blocks


def _sentence_spans(text: str) -> list[tuple[int, int]]:
    spans, start = [], 0
    for m in _SENTENCE_GAP.finditer(text):
        j = m.end()
        while j < len(text) and text[j] in _SENTENCE_OPENERS:
            j += 1
        if j < len(text) and text[j].isupper():
            spans.append((start, m.end()))
            start = m.end()
    spans.append((start, len(text)))
    return spans


def find_markers(lines: list[str]) -> list[tuple[int, list[str], str]]:
    """Every marker as (1-based line, unit ids in its sentence, that sentence).

    Each block is joined into one whitespace-normalised string, so a marker
    phrase wrapped across two lines is still found (and reported on the line
    where it starts) and a unit id on a wrapped continuation line is still in
    scope — but nothing outside the block ever is.
    """
    found = []
    for block in _blocks(lines):
        parts, starts, pos = [], [], 0
        for k, i in enumerate(block):
            text = _LIST_ITEM.sub("", lines[i], count=1) if k == 0 else lines[i]
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
    return found


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
