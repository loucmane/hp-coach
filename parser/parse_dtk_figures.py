"""Rasterize DTK figure + question pages from real HP PDFs.

DTK (Diagram, Tabeller, Kartor) questions are unlike the other quant
sections — they reference large multi-panel diagrams, tables, and
maps that cannot be reasonably vectorized. The pragmatic approach is
to render the original printed page as a high-DPI PNG and show that
verbatim in the drill UI, with the prompt + options + answer overlay
coming from a separate transcription step (DTK-2).

Layout per kvantpass in modern HP exams:
    p16: figure page — header "DTK – Diagram, tabeller och kartor"
         + diagram/table title + the diagram itself
    p17: question page — header "DTK – Uppgifter"
         + numbered question prompts (e.g. 29, 30, 31)
    p18: next figure page
    p19: next question page (32, 33, 34)
    ... and so on through page 23 / questions 40.

This script walks each exam's kvant1.pdf and kvant2.pdf, identifies
DTK pages, renders both kinds as PNGs at 2x scale (≈ 144 dpi — sharp
enough to read tiny axis labels without blowing up bundle size), and
emits an index mapping qid → { figure_png, question_png }.

Output:
    app/public/figures/dtk/{exam_id}-{provpass}-p{NN}.png
    app/public/figures/dtk/_index.json

Run:
    python3 parser/parse_dtk_figures.py
    python3 parser/parse_dtk_figures.py --exam host-2024  # one exam
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

REPO_ROOT = Path(__file__).resolve().parent.parent
PDF_ROOT = REPO_ROOT / "data" / "pdfs"
OUT_DIR = REPO_ROOT / "app" / "public" / "figures" / "dtk"
INDEX_PATH = OUT_DIR / "_index.json"

# 2x scale → roughly 144 dpi for a 72-dpi PDF. Sharp enough for axis
# labels and table digits without exploding asset size (a typical DTK
# page lands at ~120-200 KB).
RENDER_SCALE = 2.0

# Page-level classification — DTK pages always carry "DTK" in the
# header / footer (e.g., "– 17 – DTK" or "DTK – 17 –"). Question
# pages additionally contain "Uppgifter". Figure pages do NOT.
DTK_MARKER = re.compile(r"\bdtk\b", re.IGNORECASE)
# Question prompt — "29.\tFör..." at the start of a line, after any
# leading whitespace. PyMuPDF extracts page text with the question
# number on its own visual run, so the `\s` after the period (could be
# tab or space) is always present. Two-digit range covers 29-40 (the
# DTK numbering in both kvantpasses across all 27 exams).
QUESTION_NUMBER = re.compile(r"(?:^|\n)\s*(2[9]|3[0-9]|4[0])\.\s", re.MULTILINE)


def classify_page(page: fitz.Page) -> tuple[str, list[int]]:
    """Return (kind, question_numbers) for a page.

    kind ∈ {'figure', 'question', 'other'}.
    Question pages have at least one numbered prompt (29-40); figure
    pages carry the DTK header but no numbered prompts. Anything else
    falls through to 'other'. The numbered-prompt test is the strong
    signal — "Uppgifter" alone matches stray section-listing pages
    (cover page, end-of-section TOCs) that wrongly absorb question
    detection.
    """
    text = page.get_text()
    if not DTK_MARKER.search(text):
        return ("other", [])
    nums = [int(m.group(1)) for m in QUESTION_NUMBER.finditer(text)]
    if nums:
        return ("question", sorted(set(nums)))
    return ("figure", [])


def render_page(page: fitz.Page, dst: Path) -> None:
    """Render `page` as JPEG at RENDER_SCALE into `dst`.

    JPEG quality 80 keeps axis labels and table digits sharp while
    cutting per-file size 3-4x vs PNG (76 MB total → 22 MB for the
    full corpus). DTK pages are mostly grayscale text + line art, so
    the JPEG compression artifacts that matter for photos don't show
    up here.
    """
    mat = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)
    pix = page.get_pixmap(matrix=mat)
    pix.pil_save(str(dst), format="JPEG", quality=80, optimize=True)


def process_pass(
    exam_id: str, provpass: str, pdf_path: Path, out_dir: Path
) -> dict[str, dict[str, object]]:
    """Process one kvantpass PDF. Returns a partial index keyed by qid.

    Each qid entry maps to { figure, width, height }: filename relative
    to /figures/dtk/ plus rendered pixel dimensions (post-RENDER_SCALE).
    Width/height let the SPA reserve layout space at fetch time so the
    options below don't shift when the figure paints.
    """
    doc = fitz.open(pdf_path)
    pages_info: list[tuple[int, str, list[int]]] = []
    for i, page in enumerate(doc):
        kind, nums = classify_page(page)
        pages_info.append((i, kind, nums))

    # Pair question pages with their preceding figure page.
    last_figure_idx: int | None = None
    pair_map: list[tuple[int, int, list[int]]] = []
    for i, kind, nums in pages_info:
        if kind == "figure":
            last_figure_idx = i
        elif kind == "question" and last_figure_idx is not None:
            pair_map.append((last_figure_idx, i, nums))

    if not pair_map:
        return {}

    # Render only the figure pages. Question prompts come from DTK-2
    # (multimodal LLM transcription); shipping the question-page PNGs
    # would double the corpus disk footprint for no end-user gain.
    rendered: dict[int, tuple[str, int, int]] = {}
    for fig_idx, _q_idx, _ in pair_map:
        if fig_idx in rendered:
            continue
        name = f"{exam_id}-{provpass}-p{fig_idx + 1:02d}.jpg"
        dst = out_dir / name
        # Pixel dimensions match the rendered output exactly. Read
        # them off the page rect × scale rather than the file on disk
        # so this stays fast (no decode round-trip).
        rect = doc[fig_idx].rect
        width = round(rect.width * RENDER_SCALE)
        height = round(rect.height * RENDER_SCALE)
        if not dst.exists():
            render_page(doc[fig_idx], dst)
        rendered[fig_idx] = (name, width, height)

    index: dict[str, dict[str, object]] = {}
    for fig_idx, _q_idx, nums in pair_map:
        name, width, height = rendered[fig_idx]
        for n in nums:
            qid = f"{exam_id}-{provpass}-DTK-{n:03d}"
            index[qid] = {
                "figure": name,
                "width": width,
                "height": height,
            }
    return index


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--exam",
        help="Process only this exam_id (e.g., host-2024). Default: all.",
    )
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    existing_index: dict[str, dict[str, str]] = {}
    if INDEX_PATH.exists():
        existing_index = json.loads(INDEX_PATH.read_text())

    exam_dirs = sorted(p for p in PDF_ROOT.iterdir() if p.is_dir())
    if args.exam:
        exam_dirs = [p for p in exam_dirs if p.name == args.exam]
        if not exam_dirs:
            print(f"no such exam: {args.exam}", file=sys.stderr)
            return 2

    full_index: dict[str, dict[str, object]] = dict(existing_index)
    total_figures = 0
    for exam_dir in exam_dirs:
        exam_id = exam_dir.name
        for provpass in ("kvant1", "kvant2"):
            pdf_path = exam_dir / f"{provpass}.pdf"
            if not pdf_path.exists():
                continue
            try:
                idx = process_pass(exam_id, provpass, pdf_path, OUT_DIR)
            except Exception as e:
                print(f"[{exam_id}/{provpass}] FAILED: {e}", file=sys.stderr)
                continue
            if idx:
                full_index.update(idx)
                fig_count = len({v["figure"] for v in idx.values()})
                q_count = len(idx)
                total_figures += fig_count
                print(f"[{exam_id}/{provpass}] {q_count} questions, {fig_count} figures")

    INDEX_PATH.write_text(json.dumps(full_index, indent=2, sort_keys=True, ensure_ascii=False))
    print(f"\nWrote {len(full_index)} qid entries · {total_figures} figure PNGs total")
    print(f"Index: {INDEX_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
