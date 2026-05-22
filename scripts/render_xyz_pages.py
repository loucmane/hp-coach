#!/usr/bin/env python3
"""Render XYZ section PDF pages to PNG for the #147 (datavakuum) + #144
(figure-aware regen) workstreams.

For each affected qid:
  1. Open the source PDF at `data/pdfs/{exam}/{provpass}.pdf`
  2. Find the page where the question appears (search by question
     number, e.g. "9. ")
  3. Render that page to PNG at 220 DPI under
     `audit/_xyz_recovery/pages/{qid}.png`
  4. Also dump the pdfplumber-extracted text for the subagent's
     secondary input.

Usage:
    python3 scripts/render_xyz_pages.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pdfplumber

REPO = Path(__file__).resolve().parent.parent
PDF_ROOT = REPO / "data" / "pdfs"
OUT_ROOT = REPO / "audit" / "_xyz_recovery" / "pages"
OUT_ROOT.mkdir(parents=True, exist_ok=True)


def load_corpus_questions() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for path in sorted((REPO / "app/public/data").glob("*.json")):
        if path.name.startswith("_"):
            continue
        for q in json.loads(path.read_text()):
            out[q["qid"]] = q
    return out


def find_datavakuum_qids() -> list[str]:
    """XYZ entries where the previous regen wrote a Datavakuum
    placeholder. Detected by scanning explanation contents for the
    marker phrase."""
    qids = []
    for p in sorted((REPO / "app/public/explanations").glob("*.json")):
        if p.name.startswith("_"):
            continue
        for qid, entry in json.loads(p.read_text()).items():
            section_match = qid.split("-")[-2]
            if section_match != "XYZ":
                continue
            fields = [
                entry.get("solution_path", ""),
                entry.get("technique", ""),
                entry.get("pitfall", "") or "",
                (entry.get("pregrade_tactic") or {}).get("handle", ""),
                (entry.get("pregrade_tactic") or {}).get("move", ""),
            ]
            if any("datavakuum" in (f or "").lower() for f in fields):
                qids.append(qid)
    return qids


# Hand-curated #144 list from audit/_variant_c_regen_qa/xyz_part{1,2}.md
WEAK_144 = [
    "host-ver2-2019-kvant1-XYZ-005",
    "host-2018-kvant1-XYZ-003",
    "host-2024-kvant1-XYZ-004",
    "host-2018-kvant1-XYZ-008",
    "host-2024-kvant2-XYZ-005",
    "var-2025-kvant2-XYZ-006",
    "var-2013-kvant2-XYZ-001",
    "var-2017-kvant2-XYZ-002",
    "host-2021-kvant1-XYZ-005",
    "host-2016-kvant2-XYZ-006",
    "var-2022-1-kvant2-XYZ-006",
    "var-2022-2-kvant2-XYZ-011",
    "host-2020-kvant1-XYZ-003",
    "host-2022-kvant1-XYZ-007",
    "host-ver1-2019-kvant1-XYZ-003",
]


def question_page_index(pdf, question_number: int) -> int | None:
    """Find the 0-indexed page where 'N. ' begins a question."""
    pattern = re.compile(rf"\b{question_number}\.\s")
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        for line in text.split("\n"):
            if pattern.match(line.strip()):
                return i
    return None


def render_for_qid(q: dict, workstream: str) -> dict | None:
    exam = q["exam_id"]
    provpass = q.get("provpass")
    number = q.get("number")
    if not provpass or not number:
        return None
    pdf_path = PDF_ROOT / exam / f"{provpass}.pdf"
    if not pdf_path.exists():
        return None
    with pdfplumber.open(str(pdf_path)) as pdf:
        page_idx = question_page_index(pdf, number)
        if page_idx is None:
            return None
        page = pdf.pages[page_idx]
        img = page.to_image(resolution=220)
        out_path = OUT_ROOT / f"{q['qid']}.png"
        img.save(str(out_path), format="PNG")
        text = page.extract_text() or ""
        if page_idx + 1 < len(pdf.pages):
            text += "\n[NEXT PAGE]\n" + (pdf.pages[page_idx + 1].extract_text() or "")
    return {
        "qid": q["qid"],
        "exam": exam,
        "png": str(out_path.relative_to(REPO)),
        "extracted_text": text[:3000],  # truncate to keep batch JSON small
        "corpus_prompt": q.get("prompt") or "",
        "corpus_options": q.get("options") or [],
        "corpus_answer": q.get("answer"),
        "parsing_status": q.get("parsing_status"),
        "has_figure": q.get("figure") is not None,
        "workstream": workstream,
    }


def main() -> int:
    corpus = load_corpus_questions()
    datavakuum = find_datavakuum_qids()
    print(f"#147 datavakuum candidates: {len(datavakuum)}")
    print(f"#144 weak candidates: {len(WEAK_144)}")

    manifest = {"_147": [], "_144": []}
    rendered = miss = 0
    for qid in datavakuum:
        if qid not in corpus:
            miss += 1
            continue
        entry = render_for_qid(corpus[qid], "147")
        if entry:
            manifest["_147"].append(entry)
            rendered += 1
        else:
            miss += 1
    for qid in WEAK_144:
        if qid not in corpus:
            miss += 1
            continue
        # Skip if already in 147 list
        if any(e["qid"] == qid for e in manifest["_147"]):
            continue
        entry = render_for_qid(corpus[qid], "144")
        if entry:
            manifest["_144"].append(entry)
            rendered += 1
        else:
            miss += 1

    out = REPO / "audit" / "_xyz_recovery" / "manifest.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(f"Rendered: {rendered}, miss: {miss}")
    print(f"Manifest: {out}")
    return 0


if __name__ == "__main__":
    main()
