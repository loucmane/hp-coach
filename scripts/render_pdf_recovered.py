#!/usr/bin/env python3
"""Render pages for the pdf-recovered verify-and-promote campaign
(corpus/pdf-recovered-promotion, task #173 parked policy).

For each qid with parsing_status == 'pdf-recovered':
  1. Open data/pdfs/{exam}/{provpass}.pdf
  2. Find the page where "N. " begins the question (regex on line start,
     matching the prior render_xyz_pages.py convention).
  3. If more than one page matches (ambiguous question-number reuse),
     render ALL candidate pages so the reviewer can disambiguate visually.
  4. Render at 220 DPI to audit/_pdf_recovered_promotion/pages/{qid}[_p{i}].png
  5. Dump extracted text (page + next page) for cross-reference.

Usage:
    python3 scripts/render_pdf_recovered.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pdfplumber

REPO = Path(__file__).resolve().parent.parent
PDF_ROOT = REPO / "data" / "pdfs"
OUT_ROOT = REPO / "audit" / "_pdf_recovered_promotion" / "pages"
OUT_ROOT.mkdir(parents=True, exist_ok=True)


def load_corpus_questions() -> list[dict]:
    out: list[dict] = []
    for path in sorted((REPO / "app/public/data").glob("*.json")):
        if path.name.startswith("_"):
            continue
        rows = json.loads(path.read_text())
        items = rows if isinstance(rows, list) else list(rows.values())
        for q in items:
            if isinstance(q, dict) and q.get("parsing_status") == "pdf-recovered":
                out.append(q)
    return out


def question_pages(pdf, question_number: int) -> list[int]:
    """Find ALL 0-indexed pages where 'N. ' begins a question line."""
    pattern = re.compile(rf"\b{question_number}\.\s")
    hits = []
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        for line in text.split("\n"):
            if pattern.match(line.strip()):
                hits.append(i)
                break
    return hits


def render_for_qid(q: dict) -> dict | None:
    exam = q["exam_id"]
    provpass = q.get("provpass")
    number = q.get("number")
    qid = q["qid"]
    if not provpass or not number:
        return {"qid": qid, "error": "missing provpass/number"}
    pdf_path = PDF_ROOT / exam / f"{provpass}.pdf"
    if not pdf_path.exists():
        return {"qid": qid, "error": f"missing pdf {pdf_path}"}
    with pdfplumber.open(str(pdf_path)) as pdf:
        pages = question_pages(pdf, number)
        if not pages:
            return {"qid": qid, "error": "question number not found in pdf"}
        renders = []
        for idx in pages:
            page = pdf.pages[idx]
            suffix = "" if len(pages) == 1 else f"_p{idx}"
            out_path = OUT_ROOT / f"{qid}{suffix}.png"
            if not out_path.exists():
                img = page.to_image(resolution=220)
                img.save(str(out_path), format="PNG")
            text = page.extract_text() or ""
            if idx + 1 < len(pdf.pages):
                text += "\n[NEXT PAGE]\n" + (pdf.pages[idx + 1].extract_text() or "")
            renders.append(
                {
                    "page_index": idx,
                    "png": str(out_path.relative_to(REPO)),
                    "extracted_text": text[:3000],
                }
            )
    return {
        "qid": qid,
        "exam": exam,
        "provpass": provpass,
        "number": number,
        "ambiguous": len(pages) > 1,
        "renders": renders,
        "corpus_prompt": q.get("prompt") or "",
        "corpus_options": q.get("options") or [],
        "corpus_answer": q.get("answer"),
        "has_figure": q.get("figure") is not None,
    }


def main() -> int:
    candidates = load_corpus_questions()
    print(f"pdf-recovered candidates: {len(candidates)}")

    manifest = []
    ok = err = 0
    for q in candidates:
        entry = render_for_qid(q)
        manifest.append(entry)
        if entry and "error" in entry:
            err += 1
        else:
            ok += 1

    out = REPO / "audit" / "_pdf_recovered_promotion" / "manifest.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(f"Rendered ok: {ok}, errors: {err}")
    print(f"Manifest: {out}")
    return 0


if __name__ == "__main__":
    main()
