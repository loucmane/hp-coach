#!/usr/bin/env python3
"""
Build data/parsed/{exam_id}.json — the unified question bank for any
single exam in the CATALOG. Generalised from the original
build_var2026.py once we needed to scale to all 27 sittings (task 36).

Output schema (one record per question; matches the TS interface used
by the drill engine):

  {
    "qid":        "var-2026-verb1-ORD-001",
    "exam_id":    "var-2026",
    "provpass":   "verb1" | "verb2" | "kvant1" | "kvant2",
    "section":    "ORD" | "LÄS" | ... | "DTK",
    "number":     int,                  # 1..40 within the provpass
    "prompt":     str | null,           # null on stub records
    "options":    [{"letter":..., "text":...}] | null,
    "answer":     "A" | "B" | "C" | "D" | "E",
    "parsing_status": "complete" | "answer_only"
  }

Coverage today:
  * answer key for ALL 160 questions (40 × 4 provpass) — from facit.pdf
  * full prompt+options for ORD and MEK across both provpasses
    (40 questions = 25% by count, but they're the cleanest layouts)
  * stub records for LÄS / ELF / XYZ / KVA / NOG / DTK
    flagged parsing_status="answer_only" — section parsers in flight.

CLI:
  python3 parser/build.py <exam_id>           # one exam
  python3 parser/build.py                     # default: var-2026
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

PDF_ROOT = ROOT / "data" / "pdfs"
OUT_ROOT = ROOT / "data" / "parsed"

# Provpass → section → question-number range. Fixed across exams (the
# HP exam structure has been stable for years).
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


def qid(exam_id: str, provpass: str, section: str, number: int) -> str:
    return f"{exam_id}-{provpass}-{section}-{number:03d}"


def parse_provpass(exam_id: str, pdf_path: Path, provpass: str) -> list[dict]:
    """Parse one provpass PDF; return one record per question (1..40)."""
    doc = fitz.open(pdf_path)
    records: dict[int, dict] = {}

    # Pre-fill stubs so every (section, number) gets an entry even if its
    # section parser isn't implemented yet.
    for section, rng in SECTION_RANGES[provpass]:
        for n in rng:
            records[n] = {
                "qid": qid(exam_id, provpass, section, n),
                "exam_id": exam_id,
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
                rec = records.get(q["number"])
                if rec is None or rec["section"] != section:
                    continue  # belt-and-braces guard against misclassification
                rec["prompt"] = q["prompt"]
                rec["options"] = q["options"]
                rec["parsing_status"] = "complete"

    doc.close()
    return [records[n] for n in sorted(records)]


def build(exam_id: str) -> dict:
    """Parse one exam end-to-end. Returns a stats dict for the orchestrator."""
    pdf_dir = PDF_ROOT / exam_id
    if not pdf_dir.exists():
        raise FileNotFoundError(
            f"PDFs missing for {exam_id}. Run: python3 parser/fetch_pdfs.py {exam_id}"
        )

    facit = parse_facit(pdf_dir / "facit.pdf")

    all_questions: list[dict] = []
    for provpass in ("verb1", "verb2", "kvant1", "kvant2"):
        recs = parse_provpass(exam_id, pdf_dir / f"{provpass}.pdf", provpass)
        for r in recs:
            r["answer"] = facit[provpass].get(r["number"])
        all_questions.extend(recs)

    out_path = OUT_ROOT / f"{exam_id}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(all_questions, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    # Stats
    by_section: dict[str, tuple[int, int]] = {}
    for q in all_questions:
        done, tot = by_section.get(q["section"], (0, 0))
        by_section[q["section"]] = (
            done + (1 if q["parsing_status"] == "complete" else 0),
            tot + 1,
        )
    return {
        "exam_id": exam_id,
        "out_path": str(out_path.relative_to(ROOT)),
        "total": len(all_questions),
        "with_answer": sum(1 for q in all_questions if q["answer"]),
        "complete": sum(1 for q in all_questions if q["parsing_status"] == "complete"),
        "by_section": by_section,
    }


def _print_summary(stats: dict) -> None:
    print(f"== {stats['exam_id']} ==")
    print(f"  output:       {stats['out_path']}")
    print(f"  questions:    {stats['total']}  (expected 160)")
    print(f"  with answer:  {stats['with_answer']}/{stats['total']}")
    print(f"  fully parsed: {stats['complete']}/{stats['total']}")
    print("  by section:")
    for s in ["ORD", "LÄS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"]:
        if s in stats["by_section"]:
            done, tot = stats["by_section"][s]
            print(f"    {s:4s}  {done:>2}/{tot:<2}")


def main() -> None:
    exam_id = sys.argv[1] if len(sys.argv) > 1 else "var-2026"
    stats = build(exam_id)
    _print_summary(stats)


if __name__ == "__main__":
    main()
