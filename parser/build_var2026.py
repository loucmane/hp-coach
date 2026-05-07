#!/usr/bin/env python3
"""
Build data/parsed/var-2026.json — the unified question bank for one exam.

This is the parser MVP (task 31): prove the pipeline end-to-end on a
single sitting before scaling out to all 27 (task 36).

Output schema (one record per question; matches the TS interface used
by the drill engine):

  {
    "qid":        "var-2026-verb1-ORD-001",
    "exam_id":    "var-2026",
    "provpass":   "verb1" | "verb2" | "kvant1" | "kvant2",
    "section":    "ORD" | "LÄS" | ... | "DTK",
    "number":     int,                  # 1..40 within the provpass
    "prompt":     str,                  # question stem (when parsed)
    "options":    [{"letter": "A", "text": "..."}, ...] (when parsed),
    "answer":     "A" | "B" | "C" | "D" | "E",
    "parsing_status": "complete" | "answer_only"
  }

Coverage in this MVP:
  * answer key for ALL 160 questions (40 × 4 provpass) — from facit.pdf
  * full prompt+options for ORD and MEK across both provpasses
    (40 questions = 25% by count, but they're the cleanest layouts)
  * stub records for LÄS / ELF / XYZ / KVA / NOG / DTK
    flagged parsing_status="answer_only" — task 32 follow-ups will
    flesh these out section by section.

This is honest about what's done vs. todo, gives the drill engine a
working dataset to render against, and forces the schema decisions now
rather than later.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from parser.parse_facit import parse_facit  # noqa: E402
from parser.parse_section import find_section_pages, parse_mek, parse_ord  # noqa: E402

EXAM_ID = "var-2026"
PDF_DIR = ROOT / "data" / "pdfs" / EXAM_ID
OUT_PATH = ROOT / "data" / "parsed" / f"{EXAM_ID}.json"

# Provpass → section → question-number range. The HP exam structure is
# fixed across exams (PRD § "Section codes"), so this is a static map.
SECTION_RANGES: dict[str, list[tuple[str, range]]] = {
    "verb1": [
        ("ORD", range(1, 11)),
        ("LÄS", range(11, 21)),
        ("MEK", range(21, 31)),
        ("ELF", range(31, 41)),
    ],
    "verb2": [
        ("ORD", range(1, 11)),
        ("LÄS", range(11, 21)),
        ("MEK", range(21, 31)),
        ("ELF", range(31, 41)),
    ],
    "kvant1": [
        ("XYZ", range(1, 13)),
        ("KVA", range(13, 23)),
        ("NOG", range(23, 29)),
        ("DTK", range(29, 41)),
    ],
    "kvant2": [
        ("XYZ", range(1, 13)),
        ("KVA", range(13, 23)),
        ("NOG", range(23, 29)),
        ("DTK", range(29, 41)),
    ],
}


def qid(provpass: str, section: str, number: int) -> str:
    return f"{EXAM_ID}-{provpass}-{section}-{number:03d}"


def parse_provpass(pdf_path: Path, provpass: str) -> list[dict]:
    """Parse one provpass PDF; return one record per question (1..40)."""
    doc = fitz.open(pdf_path)
    records: dict[int, dict] = {}

    # Pre-fill stubs so every (section, number) gets an entry even if its
    # section parser isn't implemented yet.
    for section, rng in SECTION_RANGES[provpass]:
        for n in rng:
            records[n] = {
                "qid": qid(provpass, section, n),
                "exam_id": EXAM_ID,
                "provpass": provpass,
                "section": section,
                "number": n,
                "prompt": None,
                "options": None,
                "answer": None,
                "parsing_status": "answer_only",
            }

    # Verbal-side parsers (ORD + MEK).
    if provpass.startswith("verb"):
        for section, parser in (("ORD", parse_ord), ("MEK", parse_mek)):
            pages = find_section_pages(doc, section)
            for q in parser(pages):
                rec = records[q["number"]]
                if rec["section"] != section:
                    continue  # belt-and-braces guard against misclassification
                rec["prompt"] = q["prompt"]
                rec["options"] = q["options"]
                rec["parsing_status"] = "complete"

    doc.close()
    return [records[n] for n in sorted(records)]


def main() -> None:
    facit = parse_facit(PDF_DIR / "facit.pdf")

    all_questions: list[dict] = []
    for provpass in ("verb1", "verb2", "kvant1", "kvant2"):
        recs = parse_provpass(PDF_DIR / f"{provpass}.pdf", provpass)
        for r in recs:
            r["answer"] = facit[provpass].get(r["number"])
        all_questions.extend(recs)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(all_questions, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    # Summary report: how much of the dataset is fully parsed.
    total = len(all_questions)
    complete = sum(1 for q in all_questions if q["parsing_status"] == "complete")
    answers = sum(1 for q in all_questions if q["answer"])
    by_section: dict[str, tuple[int, int]] = {}
    for q in all_questions:
        done, tot = by_section.get(q["section"], (0, 0))
        by_section[q["section"]] = (
            done + (1 if q["parsing_status"] == "complete" else 0),
            tot + 1,
        )

    print(f"== {EXAM_ID} ==")
    print(f"  output:      {OUT_PATH.relative_to(ROOT)}")
    print(f"  questions:   {total}  (expected 160)")
    print(f"  with answer: {answers}/{total}")
    print(f"  fully parsed: {complete}/{total}")
    print("  by section:")
    for s in ["ORD", "LÄS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"]:
        if s in by_section:
            done, tot = by_section[s]
            print(f"    {s:4s}  {done:>2}/{tot:<2}")


if __name__ == "__main__":
    main()
