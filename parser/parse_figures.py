#!/usr/bin/env python3
"""
Vector figure extraction for quant questions.

For each question whose page contains vector drawings (lines, curves,
rectangles) inside the question's bbox, this module emits an SVG
snippet ready to drop into the SPA. The SVG uses `currentColor` for
strokes so dark mode just works — the SPA's CSS color cascades into
the figure without per-element overrides.

Why this exists:
  HP quant questions reference labeled geometric figures
  ("vinkeln v", "linjen L1", "fyrhörningen ABCD") that are drawn on
  the page using PDF vector primitives. Our text-only parser
  produces clean prompts but loses the figures, leaving these
  questions unanswerable. PyMuPDF's `page.get_drawings()` exposes
  the underlying paths, which we recompose into SVG.

Out of scope (deferred to Phase C, see docs/quant-rendering.md):
  - Recovering high-level structure (this is a triangle, this is a
    coordinate system, this is a bar chart). We just emit primitives.
  - Theming non-stroke fills correctly when the source PDF uses
    dark colors. Most HP figures are line drawings, so this is rare.
  - Animation / interactivity. The SPA layer adds those.
"""
from __future__ import annotations

from html import escape

import fitz  # PyMuPDF

# Padding around the figure bbox so labels at the edges aren't cropped.
# 8pt is enough breathing room for "(cm)" / "(km)" unit labels that
# PDF often places right at the figure edge — they used to clip into
# the wrapper border at 4pt.
FIG_PADDING = 8.0

# Heuristic: a drawing block at this width or below is probably an
# accent (box around a number, label underline) and not a real figure
# we need to render. This stops us from emitting tiny SVGs for the
# horizontal rule under each section header.
MIN_FIGURE_WIDTH = 30.0
MIN_FIGURE_HEIGHT = 20.0

# Minimum drawing primitives (lines / curves / rects / quads) for a
# region to count as a real figure. HP geometric figures bundle
# at least ~15 strokes (a triangle alone has 3 line segments + tick
# marks + label underlines + arrowheads). Below this threshold we're
# almost always looking at fraction bars or option-marker underlines
# the merger missed — drop them.
MIN_FIGURE_ITEMS = 10

# Filled rectangles in this size range are almost always character
# outlines that the source PDF rasterized into vector paths instead
# of font glyphs. HP exam tick labels ("1", "2", small unit numbers
# at the origin of a coordinate system) frequently come through this
# way. Without a filter, they appear in our SVG as solid black blobs
# where digits should be. Conservative bounds so we don't drop real
# small markers (which are usually drawn as cubic beziers anyway):
# - area must be > 4 sq pt   (sparse tiny dot markers, 1×1, 2×2)
# - max dimension must be < 15pt (line strokes get longer than this)
# - both apply only to FILLED rects; unfilled rect borders pass through
GLYPH_FRAGMENT_MIN_AREA = 4.0
GLYPH_FRAGMENT_MAX_DIM = 15.0

# Y-distance between items that signals "different physical region of
# the page" — e.g. fraction bars in a prompt vs the actual figure
# below, separated by blank text region. A real figure's strokes are
# rarely > 40pt apart (one line of body text is ~12pt; vertical gaps
# inside a coordinate system are < 30pt). This is the cluster-split
# threshold for `_largest_y_cluster`.
MIN_CLUSTER_GAP = 60.0


def extract_figure_svg(
    page: fitz.Page, question_bbox: fitz.Rect
) -> dict | None:
    """Build an SVG for the vector content inside `question_bbox` on
    `page`. Returns `{svg, aspect_ratio}` or None if there's no figure
    worth extracting.

    We walk each drawing's individual items and filter per-item, not
    per-drawing. Why: PyMuPDF often reports page-decoration glyphs
    (registration crop marks at the four page corners, header rules
    spanning the full page width) as a SINGLE drawing whose `rect`
    spans the entire page. Filtering at the drawing level would drag
    all of those into every question on the page. Filtering at the
    item level rejects them while keeping the legitimate per-question
    diagram items intact.

    The figure's tight bbox is computed from the surviving items so a
    figure that takes up half the question's vertical space gets a
    tightly-cropped SVG, not one with empty whitespace.
    """
    flat = _flatten_items(page.get_drawings(), question_bbox)
    if not flat:
        return None

    # Disjoint-cluster handling. When the bbox sweeps in items from
    # multiple physical regions of the page (e.g. fraction-bar lines
    # from a previous question's prompt + the actual figure for this
    # question), the items split into clusters along Y. Pick the
    # densest cluster as the figure and discard the rest. If only one
    # cluster exists (the normal case), this is a no-op.
    flat = _largest_y_cluster(flat)

    if len(flat) < MIN_FIGURE_ITEMS:
        return None

    fig_bbox = _items_tight_bbox(flat)
    if fig_bbox.width < MIN_FIGURE_WIDTH or fig_bbox.height < MIN_FIGURE_HEIGHT:
        return None

    # First pass: pad and gather labels. The padded bbox is used to
    # find spans whose CENTER lies in the region; a label like "(cm)"
    # at the figure's right edge has its center inside the bbox but
    # its full glyph extent reaches past it.
    label_search_bbox = fitz.Rect(
        fig_bbox.x0 - FIG_PADDING,
        fig_bbox.y0 - FIG_PADDING,
        fig_bbox.x1 + FIG_PADDING,
        fig_bbox.y1 + FIG_PADDING,
    )
    label_spans = _text_spans_in(page, label_search_bbox)

    # Second pass: expand fig_bbox so it ENCOMPASSES every selected
    # label's full glyph extent, not just its center. Without this the
    # closing ')' of "(cm)" or the descender on a 'g' falls outside
    # the SVG's viewBox and gets clipped (browsers default to
    # overflow:hidden on <svg> elements). Then re-pad for breathing
    # room around the now-final extents.
    if label_spans:
        fig_bbox = fitz.Rect(
            min(fig_bbox.x0, *(s["bbox"][0] for s in label_spans)),
            min(fig_bbox.y0, *(s["bbox"][1] for s in label_spans)),
            max(fig_bbox.x1, *(s["bbox"][2] for s in label_spans)),
            max(fig_bbox.y1, *(s["bbox"][3] for s in label_spans)),
        )
    fig_bbox = fitz.Rect(
        fig_bbox.x0 - FIG_PADDING,
        fig_bbox.y0 - FIG_PADDING,
        fig_bbox.x1 + FIG_PADDING,
        fig_bbox.y1 + FIG_PADDING,
    )

    svg = _build_svg(flat, label_spans, fig_bbox)
    return {
        "svg": svg,
        "aspect_ratio": round(fig_bbox.width / fig_bbox.height, 3),
    }


# ── Geometry helpers ───────────────────────────────────────────────────────


def _intersects(a: fitz.Rect, b: fitz.Rect) -> bool:
    """True if rectangles overlap (any shared area, not just touching)."""
    return not (a.x1 <= b.x0 or b.x1 <= a.x0 or a.y1 <= b.y0 or b.y1 <= a.y0)


def _is_glyph_fragment_rect(item: tuple) -> bool:
    """Return True if a filled `re` is a character-shaped blob the
    PDF renderer produced from text outlines (rather than from a real
    figure rectangle). Heuristic: small area + bounded max dimension.
    See GLYPH_FRAGMENT_* constants above for rationale."""
    r = item[1]
    w, h = r.x1 - r.x0, r.y1 - r.y0
    area = w * h
    if area <= GLYPH_FRAGMENT_MIN_AREA:
        return False  # tiny dot-marker territory; spare it
    return max(w, h) < GLYPH_FRAGMENT_MAX_DIM


def _item_bbox(op: str, item: tuple) -> fitz.Rect | None:
    """Return the bounding rect of a single drawing primitive, or None
    if the op is one we don't render (e.g. exotic curves we'd skip
    anyway in `_build_svg`)."""
    if op == "l":
        p1, p2 = item[1], item[2]
        return fitz.Rect(
            min(p1.x, p2.x), min(p1.y, p2.y),
            max(p1.x, p2.x), max(p1.y, p2.y),
        )
    if op == "re":
        return fitz.Rect(item[1])
    if op == "c":
        # Cubic bezier: bbox of the 4 control points is a safe outer
        # bound (the curve never leaves the convex hull of its hull).
        xs = [p.x for p in item[1:5]]
        ys = [p.y for p in item[1:5]]
        return fitz.Rect(min(xs), min(ys), max(xs), max(ys))
    if op == "qu":
        q = item[1]
        xs = [q.ul.x, q.ur.x, q.lr.x, q.ll.x]
        ys = [q.ul.y, q.ur.y, q.lr.y, q.ll.y]
        return fitz.Rect(min(xs), min(ys), max(xs), max(ys))
    return None


def _flatten_items(
    drawings: list[dict], question_bbox: fitz.Rect
) -> list[dict]:
    """Walk each drawing's primitives and keep only those whose center
    falls inside `question_bbox`. Returns a list of `{op, item, fill,
    stroke_width}` dicts ready for SVG emission. Per-item filtering is
    what lets us reject page-corner crop marks and full-width header
    rules — those primitives have centers far outside the question's
    text region even when their parent drawing's bbox spans the page.
    """
    flat: list[dict] = []
    for d in drawings:
        # Filled regions: keep fill but route through `currentColor`
        # later so they invert with theme. Source PDF colors aren't
        # preserved because dark-on-dark is unreadable.
        is_filled = bool(d.get("fill"))
        fill = "currentColor" if is_filled else "none"
        # Most HP exam strokes are 0.5–1.0 pt; clamp to [1.0, 1.6] for
        # consistent visibility on retina/mobile screens. The previous
        # 0.6pt floor read as hairline and disappeared into the panel
        # background on dense displays. 1.0pt is the smallest weight
        # that survives subpixel rendering at any zoom level.
        stroke_width = max(1.0, min(1.6, (d.get("width") or 1.0) + 0.2))
        for item in d["items"]:
            op = item[0]
            # Glyph-fragment guard: filled rects in character-size
            # range almost always come from PDF text rendered as
            # outlined paths (HP exam tick labels do this). Drop them.
            if op == "re" and is_filled and _is_glyph_fragment_rect(item):
                continue
            ib = _item_bbox(op, item)
            if ib is None:
                continue
            cx = (ib.x0 + ib.x1) / 2
            cy = (ib.y0 + ib.y1) / 2
            if not (
                question_bbox.x0 <= cx <= question_bbox.x1
                and question_bbox.y0 <= cy <= question_bbox.y1
            ):
                continue
            flat.append(
                {
                    "op": op,
                    "item": item,
                    "bbox": ib,
                    "fill": fill,
                    "stroke_width": stroke_width,
                }
            )
    return flat


def _items_tight_bbox(flat: list[dict]) -> fitz.Rect:
    """Smallest rect containing every flattened item's bounding box."""
    x0 = min(f["bbox"].x0 for f in flat)
    y0 = min(f["bbox"].y0 for f in flat)
    x1 = max(f["bbox"].x1 for f in flat)
    y1 = max(f["bbox"].y1 for f in flat)
    return fitz.Rect(x0, y0, x1, y1)


def _largest_y_cluster(flat: list[dict]) -> list[dict]:
    """Split items into y-clusters at gaps of MIN_CLUSTER_GAP and
    return the cluster with the most items (the densest one).
    Single-cluster lists pass through unchanged.

    Why density rather than total area or vertical span: a real HP
    figure has dozens-to-hundreds of strokes packed close together;
    the noise we want to drop is typically 1-5 stray rectangles
    elsewhere on the page (fraction-bar lines, option-marker
    underlines). Density is the most reliable separator.
    """
    if len(flat) < 2:
        return flat
    flat_sorted = sorted(flat, key=lambda f: (f["bbox"].y0 + f["bbox"].y1) / 2)

    clusters: list[list[dict]] = [[flat_sorted[0]]]
    for f in flat_sorted[1:]:
        prev_y = (clusters[-1][-1]["bbox"].y0 + clusters[-1][-1]["bbox"].y1) / 2
        cur_y = (f["bbox"].y0 + f["bbox"].y1) / 2
        if cur_y - prev_y > MIN_CLUSTER_GAP:
            clusters.append([f])
        else:
            clusters[-1].append(f)

    if len(clusters) == 1:
        return clusters[0]
    return max(clusters, key=len)


def _text_spans_in(page: fitz.Page, bbox: fitz.Rect) -> list[dict]:
    """Find dict-mode spans whose center lies inside `bbox`. Centers
    not corners — labels often have bboxes slightly outside the
    figure region they annotate."""
    spans: list[dict] = []
    d = page.get_text("dict")
    for block in d["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                t = span["text"]
                if not t.strip():
                    continue
                sb = span["bbox"]
                cx = (sb[0] + sb[2]) / 2
                cy = (sb[1] + sb[3]) / 2
                if bbox.x0 <= cx <= bbox.x1 and bbox.y0 <= cy <= bbox.y1:
                    spans.append(span)
    return spans


# ── SVG builder ────────────────────────────────────────────────────────────


def _build_svg(
    flat: list[dict],
    label_spans: list[dict],
    fig_bbox: fitz.Rect,
) -> str:
    """Compose the SVG element. Translate every coord into the
    figure's local frame (top-left = 0,0). Strokes use `currentColor`
    so the SPA's theme controls the figure's appearance.
    """
    w = fig_bbox.width
    h = fig_bbox.height
    ox = fig_bbox.x0
    oy = fig_bbox.y0

    parts: list[str] = []
    for f in flat:
        op = f["op"]
        item = f["item"]
        attrs = (
            f'fill="{f["fill"]}" stroke="currentColor" '
            f'stroke-width="{f["stroke_width"]}" '
            f'stroke-linecap="round" stroke-linejoin="round"'
        )
        if op == "l":  # straight line
            p1, p2 = item[1], item[2]
            parts.append(
                f'<line x1="{p1.x - ox:.2f}" y1="{p1.y - oy:.2f}" '
                f'x2="{p2.x - ox:.2f}" y2="{p2.y - oy:.2f}" {attrs} />'
            )
        elif op == "re":  # rectangle
            r = item[1]
            parts.append(
                f'<rect x="{r.x0 - ox:.2f}" y="{r.y0 - oy:.2f}" '
                f'width="{r.width:.2f}" height="{r.height:.2f}" {attrs} />'
            )
        elif op == "c":  # cubic bezier
            p1, p2, p3, p4 = item[1], item[2], item[3], item[4]
            parts.append(
                f'<path d="M{p1.x - ox:.2f},{p1.y - oy:.2f} '
                f'C{p2.x - ox:.2f},{p2.y - oy:.2f} '
                f'{p3.x - ox:.2f},{p3.y - oy:.2f} '
                f'{p4.x - ox:.2f},{p4.y - oy:.2f}" {attrs} />'
            )
        elif op == "qu":  # quad — render as polygon (4 edges)
            q = item[1]
            pts = " ".join(
                f"{p.x - ox:.2f},{p.y - oy:.2f}"
                for p in (q.ul, q.ur, q.lr, q.ll)
            )
            parts.append(f'<polygon points="{pts}" {attrs} />')
        # Other ops (e.g. quad bezier) — skip silently. Rare in HP.

    # Labels rendered as native SVG text. Use currentColor so they
    # invert with theme. The y-coordinate is the baseline (svg `y` is
    # the bottom of the text), so we use the span's bbox bottom.
    #
    # Font stack: prefer system high-quality serifs (Iowan / Sitka /
    # Charter) before generic. Generic `serif` resolves to whatever
    # the OS picks (often Times New Roman) which looks dated against
    # the rest of the SPA's typography. The stack falls back cleanly
    # so no figure ever renders blank.
    label_font = (
        "'Iowan Old Style', 'Sitka Text', Charter, Cambria, Georgia, serif"
    )
    for span in label_spans:
        sb = span["bbox"]
        x = sb[0] - ox
        y = sb[3] - oy
        size = round(span["size"], 1)
        parts.append(
            f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" '
            f'fill="currentColor" stroke="none" '
            f'font-family="{label_font}">{escape(span["text"])}</text>'
        )

    body = "\n  ".join(parts)
    # Root attributes:
    # - shape-rendering=geometricPrecision: smooth curves on retina
    # - text-rendering=optimizeLegibility: nicer kerning on labels
    # - color-interpolation=linearRGB: accurate alpha blending for
    #   filled regions, even when the SPA inverts colors in dark mode
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {w:.2f} {h:.2f}" '
        f'preserveAspectRatio="xMidYMid meet" '
        f'shape-rendering="geometricPrecision" '
        f'text-rendering="optimizeLegibility">\n  '
        f"{body}\n"
        f"</svg>"
    )


# ── CLI smoke test ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "data/pdfs/var-2026/kvant1.pdf"
    page_no = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    doc = fitz.open(pdf_path)
    page = doc[page_no]
    # Treat the whole page as the question region for a quick smoke.
    fig = extract_figure_svg(page, page.rect)
    if fig:
        print(f"# figure: {page.rect.width:.0f}x{page.rect.height:.0f}", file=sys.stderr)
        print(fig["svg"])
    else:
        print("no figure", file=sys.stderr)
