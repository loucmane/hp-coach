"""Crop per-option pie-chart images for the DTK questions whose four answer
choices are printed as images (pie/circle diagrams), not text.

`parse_dtk_prompts.py`'s text-block parser (OPTION_MARKER matching an A-D
run of TEXT) can't populate `options` for these — the "text" after each
letter marker is empty because the option IS a drawn pie chart, not a
sentence. This script is task #176's DTK-2b: it crops each option's chart
as its own PNG and wires `option.figure` (see the `OptionFigureMeta` type
in app/src/data/questions.ts) so the drill can render the four images
directly in the option rows, same idiom QuestionFigure already uses for
question-level figures.

Same INLINE_FIGURE_OVERRIDES idiom as parse_dtk_figures.py: a hardcoded
per-qid map of hand-calibrated clip boxes, because there's no generic
"find four pie charts on a question page" heuristic that survives the
corpus's layout variety (single row, 2x2 grid, rotated landscape content
in a portrait page rect, shared multi-category legends). Re-running this
script regenerates the same PNGs byte-identically (same PyMuPDF render
call, same inputs) — that's the reproducibility bar, not "infer boxes from
scratch every run".

ROTATION GOTCHA (the reason each entry below carries `rotate`): several
older-format exams (2019 "ver1/ver2" editions, var-2015, var-2017,
var-2022-2) draw the DTK question page content landscape-rotated *inside*
a portrait-shaped page rect, with `page.rotation == 0` — PyMuPDF's own
rotation handling (see parse_dtk_figures.py's render_page docstring) does
NOT cover this case, because that mechanism reads the page's `/Rotate`
flag, and these PDFs don't set one; the rotation is baked into the content
stream itself. For those, `rotate: 90` tells this script to render via
`fitz.Matrix(scale, scale).prerotate(90)` and crop in the ROTATED pixel
space (PIL crop on the rendered bitmap) instead of clipping in PDF-point
space (which only works for unrotated content). var-2016-kvant1 is a
third case — `page.rotation == 90` (a real `/Rotate` flag) — PyMuPDF
already un-rotates it during get_pixmap, so that entry uses `rotate: 0`
like the normal-format exams.

Output:
    app/public/figures/options/{qid}-{letter}.png
    app/public/figures/options/_index.json

Run:
    python3 parser/parse_dtk_option_figures.py
    python3 parser/parse_dtk_option_figures.py --qid var-2016-kvant2-DTK-030
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
PDF_ROOT = REPO_ROOT / "data" / "pdfs"
DATA_DIR = REPO_ROOT / "app" / "public" / "data"
OUT_DIR = REPO_ROOT / "app" / "public" / "figures" / "options"
INDEX_PATH = OUT_DIR / "_index.json"

# Same render density as parse_dtk_figures.py's RENDER_SCALE (4x ≈ 288 dpi)
# for full-page rasters; option crops are small (one pie chart, ~250x250pt)
# so we go one notch higher (6x ≈ 432 dpi) — costs nothing in file size at
# this crop size and keeps thin hatch-pattern lines (the pojkar/flickor
# dot/cross-hatch fills several exams use instead of color) crisp.
RENDER_SCALE = 6.0

# Per-qid: which PDF/page, whether the content needs the prerotate(90)
# workaround, and each option letter's clip box.
#
#   - rotate=0 entries: `clip` is a plain PDF-point (x0,y0,x1,y1) box in
#     the page's own (unrotated) coordinate space, rendered the same way
#     parse_dtk_figures.py crops INLINE_FIGURE_OVERRIDES.
#   - rotate=90 entries: `clip` is a PIXEL box (x0,y0,x1,y1) measured on a
#     `fitz.Matrix(RENDER_SCALE, RENDER_SCALE).prerotate(90)` render of the
#     page — i.e. already in the upright, reader-facing orientation. We
#     crop with PIL directly on that bitmap instead of fitz's PDF-point
#     clip (which can't express "clip after this content-stream rotation").
DTK_OPTION_FIGURES: dict[str, dict[str, object]] = {
    "host-2021-kvant1-DTK-033": {
        "pdf": "host-2021/kvant1.pdf",
        "page_idx": 18,
        "rotate": 0,
        "clip": {
            "A": (113.0, 284.2, 161.8, 335.5),
            "B": (186.7, 284.2, 234.3, 335.5),
            "C": (263.0, 284.2, 313.0, 335.5),
            "D": (340.5, 284.2, 390.0, 335.5),
        },
    },
    "host-2023-kvant1-DTK-033": {
        "pdf": "host-2023/kvant1.pdf",
        "page_idx": 18,
        "rotate": 0,
        "clip": {
            "A": (113.0, 285.8, 187.0, 378.2),
            "B": (201.0, 285.8, 274.2, 378.2),
            "C": (287.8, 285.8, 362.2, 378.2),
            "D": (375.5, 285.8, 448.5, 378.2),
        },
    },
    # host-ver1-2019 / host-ver2-2019: landscape content in a portrait
    # page rect, page.rotation == 0. Same DTK page in both exam editions
    # (verified identical q32 pie layout), so both share the same pixel
    # clip box on the prerotate(90) render.
    "host-ver1-2019-kvant2-DTK-032": {
        "pdf": "host-ver1-2019/kvant2.pdf",
        "page_idx": 18,
        "rotate": 90,
        "clip": {
            "A": (600 + 34 - 15, 1400 + 60 - 15, 600 + 437 + 15, 1400 + 446 + 15),
            "B": (600 + 483 - 15, 1400 + 60 - 15, 600 + 883 + 15, 1400 + 446 + 15),
            "C": (600 + 976 - 15, 1400 + 60 - 15, 600 + 1372 + 15, 1400 + 446 + 15),
            "D": (600 + 1471 - 15, 1400 + 60 - 15, 600 + 1870 + 15, 1400 + 446 + 15),
        },
    },
    "host-ver2-2019-kvant2-DTK-032": {
        "pdf": "host-ver2-2019/kvant2.pdf",
        "page_idx": 18,
        "rotate": 90,
        "clip": {
            "A": (600 + 34 - 15, 1400 + 60 - 15, 600 + 437 + 15, 1400 + 446 + 15),
            "B": (600 + 483 - 15, 1400 + 60 - 15, 600 + 883 + 15, 1400 + 446 + 15),
            "C": (600 + 976 - 15, 1400 + 60 - 15, 600 + 1372 + 15, 1400 + 446 + 15),
            "D": (600 + 1471 - 15, 1400 + 60 - 15, 600 + 1870 + 15, 1400 + 446 + 15),
        },
    },
    # var-2015: landscape content in a portrait rect, 2x2 grid layout
    # (A top-left, C top-right, B bottom-left, D bottom-right).
    "var-2015-kvant1-DTK-037": {
        "pdf": "var-2015/kvant1.pdf",
        "page_idx": 20,
        "rotate": 90,
        "clip": {
            "A": (2900 + 106 - 15, 940 + 846 - 15, 2900 + 641 + 15, 940 + 1323 + 15),
            "C": (2900 + 896 - 15, 940 + 41 - 15, 2900 + 1415 + 15, 940 + 529 + 15),
            "B": (2900 + 106 - 15, 940 + 846 - 15, 2900 + 641 + 15, 940 + 1323 + 15),
            "D": (2900 + 896 - 15, 940 + 845 - 15, 2900 + 1415 + 15, 940 + 1322 + 15),
        },
    },
    # var-2016-kvant1: page.rotation == 90 (a real /Rotate flag) — PyMuPDF
    # un-rotates it natively, so rotate=0 here (plain matrix, no prerotate)
    # even though the source page object is physically landscape.
    "var-2016-kvant1-DTK-037": {
        "pdf": "var-2016/kvant1.pdf",
        "page_idx": 20,
        "rotate": 0,
        "native_page_rotation_90": True,
        "clip_px": {
            # Measured on a plain Matrix(6,6) render (no prerotate — the
            # page's own /Rotate:90 flag already uprights it).
            "A": (740 * 4 + 42 - 15, 240 * 4 + 22 - 15, 740 * 4 + 348 + 15, 240 * 4 + 380 + 15),
            "B": (740 * 4 + 561 - 15, 240 * 4 + 22 - 15, 740 * 4 + 854 + 15, 240 * 4 + 380 + 15),
            "C": (740 * 4 + 996 - 15, 240 * 4 + 22 - 15, 740 * 4 + 1290 + 15, 240 * 4 + 380 + 15),
            "D": (740 * 4 + 1428 - 15, 240 * 4 + 22 - 15, 740 * 4 + 1722 + 15, 240 * 4 + 380 + 15),
        },
    },
    "var-2016-kvant2-DTK-030": {
        "pdf": "var-2016/kvant2.pdf",
        "page_idx": 16,
        "rotate": 0,
        "clip": {
            "A": (119.5, 296.5, 182.7, 359.7),
            "B": (208.8, 296.5, 266.7, 359.7),
            "C": (296.2, 296.5, 350.8, 359.7),
            "D": (368.5, 296.5, 427.5, 359.7),
        },
    },
    "var-2017-kvant2-DTK-030": {
        "pdf": "var-2017/kvant2.pdf",
        "page_idx": 16,
        "rotate": 90,
        "clip": {
            "A": (120 * 4 + 46 - 15, 500 * 4 + 30 - 15, 120 * 4 + 342 + 15, 500 * 4 + 378 + 15),
            "B": (120 * 4 + 483 - 15, 500 * 4 + 30 - 15, 120 * 4 + 779 + 15, 500 * 4 + 378 + 15),
            "C": (120 * 4 + 909 - 15, 500 * 4 + 30 - 15, 120 * 4 + 1205 + 15, 500 * 4 + 378 + 15),
            "D": (120 * 4 + 1324 - 15, 500 * 4 + 30 - 15, 120 * 4 + 1620 + 15, 500 * 4 + 378 + 15),
        },
    },
    "var-2022-1-kvant2-DTK-038": {
        "pdf": "var-2022-1/kvant2.pdf",
        "page_idx": 22,
        "rotate": 0,
        "clip": {
            "A": (103, 136, 179, 207),
            "B": (183, 136, 259, 207),
            "C": (267, 136, 343, 207),
            "D": (349, 136, 428, 207),
        },
    },
    "var-2022-2-kvant2-DTK-029": {
        "pdf": "var-2022-2/kvant2.pdf",
        "page_idx": 16,
        "rotate": 90,
        "clip": {
            "A": (560 + 27 - 15, 920 + 85 - 15, 560 + 323 + 15, 920 + 485 + 15),
            "B": (560 + 397 - 15, 920 + 85 - 15, 560 + 693 + 15, 920 + 485 + 15),
            "C": (560 + 767 - 15, 920 + 85 - 15, 560 + 1063 + 15, 920 + 485 + 15),
            "D": (560 + 1158 - 15, 920 + 85 - 15, 560 + 1454 + 15, 920 + 485 + 15),
        },
    },
    "var-2026-kvant1-DTK-038": {
        "pdf": "var-2026/kvant1.pdf",
        "page_idx": 22,
        "rotate": 90,
        "clip": {
            "A": (560 + 29 - 15, 960 + 47 - 15, 560 + 324 + 15, 960 + 408 + 15),
            "B": (560 + 515 - 15, 960 + 47 - 15, 560 + 811 + 15, 960 + 408 + 15),
            "C": (560 + 951 - 15, 960 + 47 - 15, 560 + 1249 + 15, 960 + 408 + 15),
            "D": (560 + 1381 - 15, 960 + 47 - 15, 560 + 1676 + 15, 960 + 408 + 15),
        },
    },
}

# Short Swedish accessible label per option (the `text` field on Option —
# stays required per app/src/data/questions.ts; holds "Cirkeldiagram A"
# rather than a transcribed choice since the choice IS the image).
def accessible_label(letter: str) -> str:
    return f"Cirkeldiagram {letter}"


def render_and_crop(qid: str, spec: dict[str, object]) -> dict[str, dict[str, object]]:
    """Render + crop all 4 option figures for one qid. Returns index rows
    keyed by qid-letter → {src, width, height}."""
    pdf_path = PDF_ROOT / str(spec["pdf"])
    if not pdf_path.exists():
        print(f"  MISSING PDF: {pdf_path}", file=sys.stderr)
        return {}
    doc = fitz.open(pdf_path)
    page = doc[int(spec["page_idx"])]  # type: ignore[call-overload]
    rows: dict[str, dict[str, object]] = {}

    if spec.get("native_page_rotation_90"):
        # page.rotation == 90 (real /Rotate flag) — PyMuPDF already
        # un-rotates during get_pixmap with a PLAIN matrix (no prerotate).
        mat = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        for letter, box in spec["clip_px"].items():  # type: ignore[union-attr]
            crop = img.crop(tuple(box))
            name = f"{qid}-{letter}.png"
            crop.save(OUT_DIR / name, format="PNG")
            rows[f"{qid}-{letter}"] = {
                "src": f"figures/options/{name}",
                "width": crop.width,
                "height": crop.height,
            }
        return rows

    if spec["rotate"] == 90:
        # Content is landscape-rotated inside a portrait page rect with no
        # /Rotate flag set — prerotate(90) uprights it; clip boxes are
        # already in that rotated bitmap's pixel space (PIL crop).
        mat = fitz.Matrix(RENDER_SCALE, RENDER_SCALE).prerotate(90)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        for letter, box in spec["clip"].items():  # type: ignore[union-attr]
            crop = img.crop(tuple(box))
            name = f"{qid}-{letter}.png"
            crop.save(OUT_DIR / name, format="PNG")
            rows[f"{qid}-{letter}"] = {
                "src": f"figures/options/{name}",
                "width": crop.width,
                "height": crop.height,
            }
        return rows

    # rotate == 0: plain PDF-point clip, same recipe as
    # parse_dtk_figures.py's apply_inline_overrides.
    mat = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)
    for letter, box in spec["clip"].items():  # type: ignore[union-attr]
        clip = fitz.Rect(*box)
        pix = page.get_pixmap(matrix=mat, clip=clip)
        name = f"{qid}-{letter}.png"
        pix.pil_save(str(OUT_DIR / name), format="PNG")
        rows[f"{qid}-{letter}"] = {
            "src": f"figures/options/{name}",
            "width": pix.width,
            "height": pix.height,
        }
    return rows


def update_question_bank(qid: str, index_rows: dict[str, dict[str, object]]) -> bool:
    """Wire option.figure + parsing_status='complete' + a short prompt into
    app/public/data/{exam}.json for this qid. Returns True if updated.

    Prompt text is transcribed by hand (see the task's step 4) into
    PROMPTS below — the text-block parser can't recover it generically
    here because the same page mixes text-option questions (which IT
    handles fine) with this image-option question."""
    parts = qid.split("-")
    provpass_idx = parts.index("kvant1") if "kvant1" in parts else parts.index("kvant2")
    exam_id = "-".join(parts[:provpass_idx])
    json_path = DATA_DIR / f"{exam_id}.json"
    if not json_path.exists():
        print(f"  MISSING bank: {json_path}", file=sys.stderr)
        return False
    bank = json.loads(json_path.read_text(encoding="utf-8"))
    target = next((q for q in bank if q["qid"] == qid), None)
    if target is None:
        print(f"  qid not found in bank: {qid}", file=sys.stderr)
        return False

    prompt = PROMPTS.get(qid)
    if prompt is None:
        print(f"  no transcribed prompt for {qid} — skipping bank update", file=sys.stderr)
        return False

    options = []
    for letter in ("A", "B", "C", "D"):
        row = index_rows.get(f"{qid}-{letter}")
        if row is None:
            print(f"  missing crop for {qid}-{letter} — aborting bank update", file=sys.stderr)
            return False
        options.append(
            {
                "letter": letter,
                "text": accessible_label(letter),
                "figure": {"src": row["src"], "aspect_ratio": round(row["width"] / row["height"], 4)},
            }
        )

    target["prompt"] = prompt
    target["options"] = options
    target["parsing_status"] = "complete"
    json_path.write_text(json.dumps(bank, ensure_ascii=False, indent=2))
    return True


# Hand-transcribed prompts (PDF-readable per PR #213's audit). Swedish
# source text, verbatim from the exam PDF text layer / visual read.
PROMPTS: dict[str, str] = {
    "host-2021-kvant1-DTK-033": (
        "Vilken av cirklarna visar hur hushållssektorns avfallstyp Övrigt från "
        "återvinningscentral fördelades på behandlingstyp?"
    ),
    "host-2023-kvant1-DTK-033": (
        "Vilket av cirkeldiagrammen nedan illustrerar könsfördelningen bland "
        "patienterna som vårdades till följd av Exponering för rök och öppen eld?"
    ),
    "host-ver1-2019-kvant2-DTK-032": (
        "Studera hur det totala antalet rapporterade skadefall i kategorin "
        "skola, offentlig lokal, institutionsområde var fördelat på "
        "skadeplatser. Vilken av cirklarna visar den korrekta fördelningen?"
    ),
    "host-ver2-2019-kvant2-DTK-032": (
        "Studera hur det totala antalet rapporterade skadefall i kategorin "
        "skola, offentlig lokal, institutionsområde var fördelat på "
        "skadeplatser. Vilken av cirklarna visar den korrekta fördelningen?"
    ),
    "var-2015-kvant1-DTK-037": (
        "Vilket diagram visar freemover-studenternas procentuella fördelning "
        "på utbildningstyper 2007?"
    ),
    "var-2016-kvant1-DTK-037": (
        "Hur var antalet forskande och undervisande helårspersoner fördelat "
        "på vetenskapsområden 2008?"
    ),
    "var-2016-kvant2-DTK-030": (
        "Studera antalet gånger som området ensamhet berördes. Vilket "
        "svarsförslag redovisar hur detta antal var fördelat på kön?"
    ),
    "var-2017-kvant2-DTK-030": (
        "Vilket cirkeldiagram visar hur det totala antalet hälso- och "
        "sjukvårdsbesök var fördelat på läkarbesök och besök hos andra "
        "personalkategorier?"
    ),
    "var-2022-1-kvant2-DTK-038": (
        "Vilket cirkeldiagram illustrerar förhållandet mellan antalet "
        "förskrivningar per tusen kvinnor av nitrofurantoin och "
        "fluorokinoloner år 2013?"
    ),
    "var-2022-2-kvant2-DTK-029": (
        "Identifiera åldersgruppen med störst antal mottagare av "
        "föräldrapenning. Vilket svarsförslag visar den procentuella "
        "fördelningen av kvinnor och män inom denna grupp?"
    ),
    "var-2026-kvant1-DTK-038": (
        "Vilket svarsförslag redovisar den procentuella fördelningen av "
        "medlemmar och icke medlemmar i Svenska kyrkan bland 63-åringar?"
    ),
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--qid", help="Process only this qid. Default: all.")
    parser.add_argument(
        "--dry-run", action="store_true", help="Render/crop but don't write the bank JSON"
    )
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    existing_index: dict[str, dict[str, object]] = {}
    if INDEX_PATH.exists():
        existing_index = json.loads(INDEX_PATH.read_text())

    targets = [args.qid] if args.qid else list(DTK_OPTION_FIGURES.keys())
    full_index = dict(existing_index)
    updated = 0
    for qid in targets:
        spec = DTK_OPTION_FIGURES.get(qid)
        if spec is None:
            print(f"no override entry for qid: {qid}", file=sys.stderr)
            continue
        rows = render_and_crop(qid, spec)
        if not rows:
            continue
        full_index.update(rows)
        print(f"[{qid}] cropped {len(rows)} option figure(s)")
        if not args.dry_run:
            if update_question_bank(qid, rows):
                updated += 1

    INDEX_PATH.write_text(json.dumps(full_index, indent=2, sort_keys=True, ensure_ascii=False))
    print(f"\nWrote {len(full_index)} option-figure entries · {updated}/{len(targets)} qids promoted")
    print(f"Index: {INDEX_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
