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

# Raster fallback (Change 4): when a figure's content is an embedded
# bitmap (e.g. host-2014's ~150-point scatter cloud) rather than vector
# paths, get_drawings() sees only the axes (a misleading "empty figure").
# We then crop the embedded image's region and ship it as a PNG, exactly
# like the DTK rasterizer. 4x scale is ~288 dpi, keeping scatter dots and
# tick labels sharp; matches parse_dtk_figures.py.
RASTER_RENDER_SCALE = 4.0

# Minimum embedded-image area (sq pt) for the raster fallback to fire. A
# real figure-sized bitmap is tens of thousands of sq pt; this floor
# rejects tiny inline icons/logos. A full-corpus scan shows exactly two
# quant questions clear it (host-2014 scatter ~40k, host-2013 triangle
# ~21k) and zero of the 173 good vector figures carry any intersecting
# image — so the floor is what keeps the vector path winning everywhere
# it should.
MIN_RASTER_IMAGE_AREA = 5000.0

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
# Aspect-ratio escape hatch (Fix 2). A character blob is roughly
# character-shaped (its width and height are comparable). A thin BAR
# — a letter stem drawn as a single filled rectangle, e.g. the 'l' in
# the axis titles "Antal personer"/"Antal timmar" (var-2016 XYZ-008),
# rendered as a 0.89×6.82 pt sliver — is linear, not blob-shaped. The
# original filter dropped those slivers, truncating "Antal" to "Anta"
# in BOTH axis titles. A rect this elongated cannot be a digit glyph,
# so we exempt anything whose long side is at least this many times its
# short side. The legitimate noise the filter targets (gridline tick
# stubs ~2.5×1.7 pt, aspect ~1.5) sits far below this cut, so the blob
# suppression is unaffected.
GLYPH_FRAGMENT_MIN_ASPECT = 4.0

# Y-distance between items that signals "different physical region of
# the page" — e.g. fraction bars in a prompt vs the actual figure
# below, separated by blank text region. A real figure's strokes are
# rarely > 40pt apart (one line of body text is ~12pt; vertical gaps
# inside a coordinate system are < 30pt). This is the cluster-split
# threshold for `_largest_y_cluster`.
MIN_CLUSTER_GAP = 60.0

# ── Disjoint-cluster X-widen (Option B) ────────────────────────────────────
# The figure bbox's right edge (question_bbox.x1) is derived from the
# question's TEXT-LINE extents in parse_quant.py (max line x1 + 20pt slack),
# never from get_drawings(). On a multi-object figure where a SECOND drawing
# (a 2nd graph / parallelogram / triangle carrying the comparison the
# question is about) sits side-by-side to the RIGHT of the first, that 2nd
# object lands past the text cap — and the per-item CENTER test in
# `_flatten_items` then discards every primitive whose center-x exceeds the
# cap, silently dropping the whole 2nd object.
#
# This pass runs UPSTREAM of `_flatten_items` (called from parse_quant's
# pass 2, before extract_figure_svg) and, ONLY when a coherent disjoint
# drawing cluster genuinely sits past the cap, returns a widened x1 so the
# 2nd object survives the center test. Single-object figures (no real
# content past the cap) are returned verbatim — their text-derived bbox is
# provably untouched, so they keep zero exposure to the neighbour/adjacent-
# column bleed the tight cap was originally built to suppress.
#
# Page-relative crop clamp: the widened edge is hard-clamped to
# [WIDEN_CLAMP_MARGIN, page_w − WIDEN_CLAMP_MARGIN]. NEVER a literal 565 —
# page widths vary across exam families (578.9 / 595.x / 606.1 / 612.3 /
# 637), so a literal would clip wide pages and over-extend narrow ones. The
# clamp's job is to exclude the page-corner crop-mark / registration band
# (which sits at x ≈ page_w − 10..0) while admitting the real 2nd object
# (whose right edge tops out ~120pt inside the clamp on this corpus).
WIDEN_CLAMP_MARGIN = 30.0

# Minimum number of drawing primitives whose center sits PAST the original
# text cap for the disjoint cluster to count as a real 2nd object rather
# than stray decoration. A genuine 2nd graph/figure contributes dozens of
# strokes; a stray crop tick or fraction-bar sliver contributes 1–4. This
# is the bimodal-density floor: we promote the cap only when the projection
# past it is dense, not when a lone primitive pokes through.
WIDEN_CANDIDATE_MIN_ITEMS = 6

# ── Role-aware fill classification (Change 1) ──────────────────────────────
# HP geometric figures are layered with the painter's model: a shaded
# region is drawn as a solid fill, then the unshaded interior is painted
# over in WHITE (a knockout) to carve it out. The original extractor
# collapsed every filled drawing to a single opaque `currentColor`, which
# (a) turned a grey shade + white knockout stack into a solid black blob
# (host-2018, var-2019, var-2025, var-2024 hexagon), and (b) let a near-
# black plot-area flood swallow the bars it sat behind (var-2016). The
# fix is to read each fill's luminance + footprint and emit by ROLE:
#
#   background  near-black OR full-figure flood   -> drop (fill='none')
#   knockout    near-white                          -> fill='var(--panel)'
#   shade       mid-grey                            -> currentColor @ opacity
#   ink         small dark fill (glyph / arrowhead) -> currentColor opaque
#
# Luminance is the simple mean of the RGB channels (HP figures are
# greyscale, so the perceptual-weight refinement buys nothing).
FILL_LUM_NEAR_BLACK = 0.15  # <= this -> a candidate background flood
FILL_LUM_NEAR_WHITE = 0.90  # >= this -> a white knockout
# A near-black fill is a background flood (drop it) only when it is a
# sizeable area, not a tiny glyph/bar/arrowhead. The var-2016 plot flood
# is ~29000 sq pt; the legitimate near-black bars/markers it hid are all
# < 60 sq pt — a 2000 sq pt cut sits two orders of magnitude clear of
# both. Below the cut, a near-black fill is treated as ink and kept.
FILL_BACKGROUND_MIN_AREA = 2000.0
# A fill covering most of the figure box is background regardless of its
# colour (a panel/plot rectangle that frames the real content). Kept
# conservative so a single legitimately-large shaded shape is NOT dropped.
FILL_BACKGROUND_AREA_FRAC = 0.92
# Shade opacity is derived from the printed grey level so a light tint
# (host-2018 cross ~0.72 lum) reads faint while a solid data bar
# (var-2016 stolpdiagram ~0.49 lum) reads solid. opacity = 1 - lum,
# clamped, because currentColor is the theme ink — a 0.5-luminance grey
# printed on white is ~50% ink. This inverts correctly in dark mode.
SHADE_OPACITY_MIN = 0.16  # near-white shades never vanish entirely
SHADE_OPACITY_MAX = 0.62  # mid-grey shades stay legibly translucent


def _shade_opacity(lum: float) -> float:
    """Map a shade's printed grey luminance to an ink opacity. Darker
    grey -> more opaque, so data bars read solid and light tints read as
    a wash. Clamped to [SHADE_OPACITY_MIN, SHADE_OPACITY_MAX]."""
    return round(max(SHADE_OPACITY_MIN, min(SHADE_OPACITY_MAX, 1.0 - lum)), 3)


def _fill_role(item: dict, fig_bbox: fitz.Rect) -> str:
    """Classify a flattened item's fill into background | shade |
    knockout | ink. Stroke-only items (no fill_rgb) return 'ink' — they
    are outlines and emit with their normal stroke; the role only governs
    the FILL attribute. See FILL_* constants for the thresholds and the
    Change-1 rationale above."""
    rgb = item.get("fill_rgb")
    if not rgb:
        return "ink"  # unfilled outline / stroke; fill='none' downstream
    lum = sum(rgb) / 3.0
    ib = item["bbox"]
    area = (ib.x1 - ib.x0) * (ib.y1 - ib.y0)
    fig_area = fig_bbox.width * fig_bbox.height
    frac = (area / fig_area) if fig_area > 0 else 0.0

    # A fill that blankets (nearly) the whole figure box is a framing
    # background rectangle — drop it so it can't paint over the content.
    if frac >= FILL_BACKGROUND_AREA_FRAC:
        return "background"
    # Near-black: a large one is a flood that hides content (drop it); a
    # small one is real ink (a digit glyph, a filled arrowhead, a bar).
    if lum <= FILL_LUM_NEAR_BLACK:
        if area >= FILL_BACKGROUND_MIN_AREA:
            return "background"
        return "ink"
    # Near-white: a knockout that carves the unshaded interior out of a
    # shaded region. Emit as the wrapper panel colour so it erases to the
    # figure background in BOTH themes (a literal white would stay white
    # in dark mode and punch a bright hole).
    if lum >= FILL_LUM_NEAR_WHITE:
        return "knockout"
    # Mid-grey: a shaded region. Emit theme-relative so it inverts.
    return "shade"


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

    # Disjoint-cluster handling. When the bbox sweeps in items from
    # multiple physical regions of the page (e.g. fraction-bar lines
    # from a previous question's prompt + the actual figure for this
    # question), the items split into clusters along Y. Pick the
    # densest cluster as the figure and discard the rest. If only one
    # cluster exists (the normal case), this is a no-op.
    if flat:
        flat = _largest_y_cluster(flat)

    # Raster-backed figure gate (Change 4). Some figures' content is an
    # EMBEDDED BITMAP that get_drawings() can't see — host-2014's ~150-
    # point scatter cloud is a single Indexed-colorspace image; the only
    # vectors are the bare axes. The vector path would ship a misleading
    # "empty axes" SVG. So when a sizeable embedded image intersects the
    # question region, crop + ship that region as a PNG instead. The
    # MIN_RASTER_IMAGE_AREA floor means only genuinely figure-sized
    # bitmaps qualify; a corpus scan finds exactly two such quant
    # questions (host-2014 scatter, host-2013 triangle), and NONE of the
    # 173 good vector figures carry an intersecting image — so the vector
    # path still wins for every one of them.
    raster = _raster_fallback(page, question_bbox, flat)
    if raster is not None:
        return raster

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


def _raster_fallback(
    page: fitz.Page, question_bbox: fitz.Rect, flat: list[dict]
) -> dict | None:
    """Image-backed figure fallback (Change 4).

    Looks for a figure-sized embedded raster image (area >=
    MIN_RASTER_IMAGE_AREA) whose bbox intersects `question_bbox`; if
    found, crops the union of that image and any surviving vector items
    (the axes around a scatter cloud), clamped to the question region,
    renders it to a PNG, and returns `{kind:'raster', png_bytes,
    aspect_ratio}`. Returns None when no qualifying image intersects the
    question — so the caller falls through to the vector path and nothing
    changes for the 173 good vector figures (none of which carry an
    intersecting figure-sized image; verified by corpus scan).
    """
    try:
        images = page.get_image_info()
    except Exception:
        return None

    hit: fitz.Rect | None = None
    for im in images:
        ib = fitz.Rect(im["bbox"])
        if ib.is_empty or ib.is_infinite:
            continue
        if ib.width * ib.height < MIN_RASTER_IMAGE_AREA:
            continue  # tiny inline icon, not a figure
        if _intersects(ib, question_bbox):
            hit = ib if hit is None else (hit | ib)
    if hit is None:
        return None

    # Crop region = union of the image(s) and the surviving vector items
    # (so the axes drawn around a bitmap scatter cloud are included),
    # clamped to the question region so we never sweep in neighbouring
    # content, then padded for breathing room.
    crop = fitz.Rect(hit)
    for f in flat:
        crop |= f["bbox"]
    crop &= question_bbox
    if crop.is_empty or crop.width < MIN_FIGURE_WIDTH or crop.height < MIN_FIGURE_HEIGHT:
        return None
    crop = fitz.Rect(
        crop.x0 - FIG_PADDING,
        crop.y0 - FIG_PADDING,
        crop.x1 + FIG_PADDING,
        crop.y1 + FIG_PADDING,
    ) & page.rect

    mat = fitz.Matrix(RASTER_RENDER_SCALE, RASTER_RENDER_SCALE)
    pix = page.get_pixmap(matrix=mat, clip=crop)
    png_bytes = pix.tobytes("png")
    return {
        "kind": "raster",
        "png_bytes": png_bytes,
        "aspect_ratio": round(crop.width / crop.height, 3),
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
    if max(w, h) >= GLYPH_FRAGMENT_MAX_DIM:
        return False  # a real line stroke / figure edge
    # Fix 2: a thin elongated bar is a stroke (a letter stem like 'l', a
    # short axis stub), never a character blob. Exempt it so axis-title
    # words keep all their glyphs (e.g. "Antal" no longer truncates to
    # "Anta"). The blob noise this filter targets is roughly square.
    mn = min(w, h)
    if mn > 0 and max(w, h) / mn >= GLYPH_FRAGMENT_MIN_ASPECT:
        return False
    return True


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
    falls inside `question_bbox`. Returns a list of `{op, item, bbox,
    fill, fill_rgb, even_odd, draw_type, paint_index, stroke_width}`
    dicts ready for SVG emission. Per-item filtering is what lets us
    reject page-corner crop marks and full-width header rules — those
    primitives have centers far outside the question's text region even
    when their parent drawing's bbox spans the page.

    Per-drawing fill provenance (`fill_rgb`, `even_odd`, `draw_type`)
    and a monotonic `paint_index` (the source paint order) are captured
    onto every flattened item so `_build_svg` can make a role-aware fill
    decision (background / shade / knockout / ink) rather than collapsing
    every filled region to a single `currentColor`. The legacy `fill`
    string ("currentColor"|"none") is preserved for callers that want
    the old behaviour; `_build_svg` ignores it in favour of the role.
    """
    flat: list[dict] = []
    # paint_index is a monotonic counter over (drawing, item) in source
    # paint order. Stable across runs because get_drawings() returns
    # drawings in their page paint sequence and items within a drawing
    # in order. _build_svg uses it to re-emit fills before strokes while
    # preserving relative painter order within each role.
    paint_index = 0
    for draw_index, d in enumerate(drawings):
        # Filled regions: capture the raw fill RGB + winding so the SVG
        # builder can decide whether this fill is a background flood, a
        # shade, a white knockout, or small black ink. Source PDF colors
        # aren't blindly preserved (dark-on-dark is unreadable) — they're
        # interpreted by role downstream.
        fill_rgb = d.get("fill")  # RGB tuple in 0..1, or None
        is_filled = bool(fill_rgb)
        # Legacy fill string kept byte-compatible with the pre-Change-0
        # output for any consumer that still reads `fill` directly.
        fill = "currentColor" if is_filled else "none"
        even_odd = d.get("even_odd")
        draw_type = d.get("type")
        # Whether the SOURCE drawing painted a stroke in addition to (or
        # instead of) its fill (Fix 1). PyMuPDF marks this as type 's'
        # (stroke-only) or 'fs' (fill+stroke) AND carries a non-None
        # stroke `color`. A filled drawing that ALSO strokes its outline
        # (e.g. var-2025 XYZ-012's triangle: white knockout fill + black
        # 1.2pt edge stroke) must keep that outline — collapsing it to a
        # pure knockout erases the very triangle the prompt depends on.
        # We only treat a fill as "also stroked" when the source actually
        # had a stroke colour, so a plain 'f' shade/knockout is unchanged.
        stroked = draw_type in ("s", "fs") and d.get("color") is not None
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
                paint_index += 1
                continue
            ib = _item_bbox(op, item)
            if ib is None:
                paint_index += 1
                continue
            cx = (ib.x0 + ib.x1) / 2
            cy = (ib.y0 + ib.y1) / 2
            if not (
                question_bbox.x0 <= cx <= question_bbox.x1
                and question_bbox.y0 <= cy <= question_bbox.y1
            ):
                paint_index += 1
                continue
            flat.append(
                {
                    "op": op,
                    "item": item,
                    "bbox": ib,
                    "fill": fill,
                    "fill_rgb": tuple(fill_rgb) if fill_rgb else None,
                    "even_odd": even_odd,
                    "draw_type": draw_type,
                    "stroked": stroked,
                    "draw_index": draw_index,
                    "paint_index": paint_index,
                    "stroke_width": stroke_width,
                }
            )
            paint_index += 1
    return flat


def _items_tight_bbox(flat: list[dict]) -> fitz.Rect:
    """Smallest rect containing every flattened item's bounding box."""
    x0 = min(f["bbox"].x0 for f in flat)
    y0 = min(f["bbox"].y0 for f in flat)
    x1 = max(f["bbox"].x1 for f in flat)
    y1 = max(f["bbox"].y1 for f in flat)
    return fitz.Rect(x0, y0, x1, y1)


def _largest_y_cluster(flat: list[dict]) -> list[dict]:
    """Split items into y-clusters at vertical bbox-edge gaps of
    MIN_CLUSTER_GAP and return the cluster with the most items (the
    densest one). Single-cluster lists pass through unchanged.

    Why density rather than total area or vertical span: a real HP
    figure has dozens-to-hundreds of strokes packed close together;
    the noise we want to drop is typically 1-5 stray rectangles
    elsewhere on the page (fraction-bar lines, option-marker
    underlines). Density is the most reliable separator.

    Why bbox-edge gap (y0 - max_y1_so_far) instead of midpoint-edge gap:
    a tall stroke that spans the figure (e.g. a diagonal AC line going
    from a square's top-left to its bottom-right) has its midpoint at
    the figure's center. If we sort by midpoint, that one item sits
    between the top-region cluster (labels above the square) and the
    bottom-region cluster (labels below) and the midpoint-gap can read
    as > MIN_CLUSTER_GAP on both sides, splitting the figure into three
    clusters — and the top labels get dropped because the bottom labels
    happen to outnumber them. Switching to bbox-edge gap fixes this:
    the diagonal's TOP edge (y0) is at the square's top, so the gap
    from the label cluster ABOVE the square to the diagonal is
    essentially zero. Everything stays in one cluster.

    The noise case (fraction bar from a previous question's text drawn
    far above the figure) is unaffected: its bbox still sits at a
    distinct y-range with a clean gap.
    """
    if len(flat) < 2:
        return flat
    flat_sorted = sorted(flat, key=lambda f: f["bbox"].y0)

    clusters: list[list[dict]] = [[flat_sorted[0]]]
    cluster_max_y1 = flat_sorted[0]["bbox"].y1
    for f in flat_sorted[1:]:
        if f["bbox"].y0 - cluster_max_y1 > MIN_CLUSTER_GAP:
            clusters.append([f])
            cluster_max_y1 = f["bbox"].y1
        else:
            clusters[-1].append(f)
            cluster_max_y1 = max(cluster_max_y1, f["bbox"].y1)

    if len(clusters) == 1:
        return clusters[0]
    return max(clusters, key=len)


def widen_bbox_for_disjoint_cluster(
    page: fitz.Page, question_bbox: fitz.Rect
) -> fitz.Rect:
    """Surgical X-widen (Option B). Return `question_bbox` with a widened
    right edge IFF a coherent disjoint drawing cluster genuinely sits past
    the text-derived cap `question_bbox.x1`; otherwise return it unchanged.

    Runs UPSTREAM of `_flatten_items`' per-item center clip (which would
    otherwise drop the 2nd object), keyed on the SAME axis the clip uses
    (item center-y inside the band, item center-x vs the cap).

    Algorithm
    ---------
    1. Collect every drawing primitive whose center-y overlaps the figure's
       Y-band `[y0, y1]` — INCLUDING items past the text cap (which
       `_flatten_items` would discard). We track each item's (center-x, x0,
       x1).
    2. Cluster along X by bbox-EDGE gap — a direct transplant of
       `_largest_y_cluster`'s gap algorithm (sort by `x0`,
       gap = `x0 − running cluster max_x1`, split at MIN_CLUSTER_GAP). Edge
       gap (not midpoint) so a wide bridging axis-arrow whose left edge
       precedes the cap keeps the projection continuous instead of
       spuriously splitting.
    3. Anchor = the cluster holding the most WITHIN-cap items (the figure
       body). If no cluster has within-cap content, bail (nothing to widen).
    4. **JOIN, never winner-take-all.** Walk rightward from the anchor and
       absorb each adjacent cluster whose inter-gap ≤ MIN_CLUSTER_GAP AND
       whose every item center stays inside the page-relative clamp
       `[margin, page_w − margin]`. Stop at the first cluster that violates
       either. Deliberately NOT `max(clusters, key=len)`: the real 2nd
       object is often the SMALLER cluster (e.g. XYZ-011 splits [57, 23, 23]
       and the 2nd parallelogram is one of the small ones) — a max-pick
       would keep the body and drop the very object we need.
    5. Bimodal-density gate: only widen when the joined cluster carries
       ≥ WIDEN_CANDIDATE_MIN_ITEMS items whose center is past the cap. This
       is the "real content past the cap", not a literal empty vertical
       gutter — 3 of the 4 intended targets have a bridging axis-arrow so
       there is NO empty strip to detect.
    6. Widened `x1 = max(joined item.x1)`, hard-clamped to the page-relative
       crop band and never narrower than the original cap.

    The clamp excludes the page-corner crop-mark / registration band
    (center-x ≈ page_w − 10) because those decoration clusters either sit
    >60pt past the joined edge (never absorbed) or have centers outside the
    clamp (rejected in the JOIN). Verified zero decoration leakage across
    the corpus fires.
    """
    page_w = page.rect.width
    clamp_lo = WIDEN_CLAMP_MARGIN
    clamp_hi = page_w - WIDEN_CLAMP_MARGIN
    cap = question_bbox.x1
    # Degenerate page: clamp band collapsed — leave the bbox alone.
    if clamp_hi <= clamp_lo:
        return question_bbox

    # 1. Band items: (center-x, x0, x1) for every primitive overlapping the
    #    Y-band on its center-y (same axis as the _flatten_items clip).
    band: list[tuple[float, float, float]] = []
    for d in page.get_drawings():
        for item in d["items"]:
            ib = _item_bbox(item[0], item)
            if ib is None:
                continue
            cy = (ib.y0 + ib.y1) / 2
            if question_bbox.y0 <= cy <= question_bbox.y1:
                band.append(((ib.x0 + ib.x1) / 2, ib.x0, ib.x1))
    if not band:
        return question_bbox

    # 2. X-cluster by bbox-edge gap, sorted by x0.
    band.sort(key=lambda b: b[1])
    clusters: list[list[tuple[float, float, float]]] = [[band[0]]]
    cluster_max_x1 = band[0][2]
    for b in band[1:]:
        if b[1] - cluster_max_x1 > MIN_CLUSTER_GAP:
            clusters.append([b])
            cluster_max_x1 = b[2]
        else:
            clusters[-1].append(b)
            cluster_max_x1 = max(cluster_max_x1, b[2])

    # 3. Anchor = cluster with the most within-cap, within-clamp items.
    def within_cap_count(c: list[tuple[float, float, float]]) -> int:
        return sum(
            1 for cx, _, _ in c if cx <= cap and clamp_lo <= cx <= clamp_hi
        )

    anchor_idx = max(range(len(clusters)), key=lambda i: within_cap_count(clusters[i]))
    if within_cap_count(clusters[anchor_idx]) == 0:
        return question_bbox

    # 4. JOIN rightward from the anchor (coherent-adjacent-cluster join).
    joined = list(clusters[anchor_idx])
    joined_max_x1 = max(x1 for _, _, x1 in clusters[anchor_idx])
    for j in range(anchor_idx + 1, len(clusters)):
        c = clusters[j]
        gap = min(x0 for _, x0, _ in c) - joined_max_x1
        if gap > MIN_CLUSTER_GAP:
            break
        if any(not (clamp_lo <= cx <= clamp_hi) for cx, _, _ in c):
            break
        joined.extend(c)
        joined_max_x1 = max(joined_max_x1, max(x1 for _, _, x1 in c))

    # 5. Bimodal-density gate: enough real content past the cap?
    past_cap = sum(1 for cx, _, _ in joined if cx > cap)
    if past_cap < WIDEN_CANDIDATE_MIN_ITEMS:
        return question_bbox

    # 6. Widened, clamped x1.
    new_x1 = min(max(joined_max_x1, cap), clamp_hi)
    if new_x1 <= cap:
        return question_bbox
    return fitz.Rect(question_bbox.x0, question_bbox.y0, new_x1, question_bbox.y1)


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


_ROLE_RANK = {"shade": 0, "knockout": 1, "ink": 2}


def _stroke_attrs(f: dict) -> str:
    """Legacy per-item stroke attributes (fill + currentColor stroke).
    Used for unfilled (outline) drawings and ink so byte-identical output
    is preserved for the line-art figures that have no role-fill change."""
    return (
        f'fill="{f["fill"]}" stroke="currentColor" '
        f'stroke-width="{f["stroke_width"]}" '
        f'stroke-linecap="round" stroke-linejoin="round"'
    )


def _emit_item(parts: list[str], f: dict, ox: float, oy: float, attrs: str) -> None:
    """Emit a single drawing primitive as its own SVG element (the legacy
    per-item path, used for strokes/outlines). `attrs` carries the fill +
    stroke styling."""
    op = f["op"]
    item = f["item"]
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
            f"{p.x - ox:.2f},{p.y - oy:.2f}" for p in (q.ul, q.ur, q.lr, q.ll)
        )
        parts.append(f'<polygon points="{pts}" {attrs} />')
    # Other ops (e.g. quad bezier) — skip silently. Rare in HP.


def _filled_path_d(items: list[dict], ox: float, oy: float) -> str:
    """Reconstruct an SVG path `d` string for a FILLED drawing whose items
    are line/curve/rect segments. A filled region drawn as separate `l`/`c`
    segments can't be filled by emitting each segment alone — they must be
    stitched into one path. Subpaths are split where a segment's start
    doesn't continue the previous segment's end (the source drew a fresh
    contour, e.g. the three discrete circles in var-2025). Each subpath is
    closed (Z) so the fill rule has a region to fill."""
    sub: list[str] = []  # commands for the current subpath
    out: list[str] = []
    cur: tuple[float, float] | None = None  # current pen position

    def close_sub() -> None:
        if sub:
            out.append("".join(sub) + "Z")
            sub.clear()

    def moveto(p) -> None:
        nonlocal cur
        close_sub()
        sub.append(f"M{p.x - ox:.2f},{p.y - oy:.2f}")
        cur = (p.x, p.y)

    def near(a, b) -> bool:
        return abs(a[0] - b[0]) < 0.15 and abs(a[1] - b[1]) < 0.15

    for f in items:
        op = f["op"]
        item = f["item"]
        if op == "l":
            p1, p2 = item[1], item[2]
            if cur is None or not near(cur, (p1.x, p1.y)):
                moveto(p1)
            sub.append(f"L{p2.x - ox:.2f},{p2.y - oy:.2f}")
            cur = (p2.x, p2.y)
        elif op == "c":
            p1, p2, p3, p4 = item[1], item[2], item[3], item[4]
            if cur is None or not near(cur, (p1.x, p1.y)):
                moveto(p1)
            sub.append(
                f"C{p2.x - ox:.2f},{p2.y - oy:.2f} "
                f"{p3.x - ox:.2f},{p3.y - oy:.2f} "
                f"{p4.x - ox:.2f},{p4.y - oy:.2f}"
            )
            cur = (p4.x, p4.y)
        elif op == "re":
            r = item[1]
            close_sub()
            out.append(
                f"M{r.x0 - ox:.2f},{r.y0 - oy:.2f}"
                f"H{r.x1 - ox:.2f}V{r.y1 - oy:.2f}"
                f"H{r.x0 - ox:.2f}Z"
            )
            cur = None
        elif op == "qu":
            q = item[1]
            close_sub()
            pts = "".join(
                f"{'M' if i == 0 else 'L'}{p.x - ox:.2f},{p.y - oy:.2f}"
                for i, p in enumerate((q.ul, q.ur, q.lr, q.ll))
            )
            out.append(pts + "Z")
            cur = None
    close_sub()
    return "".join(out)


def _build_svg(
    flat: list[dict],
    label_spans: list[dict],
    fig_bbox: fitz.Rect,
) -> str:
    """Compose the SVG element. Translate every coord into the
    figure's local frame (top-left = 0,0). Strokes use `currentColor`
    so the SPA's theme controls the figure's appearance.

    Fills are emitted BY ROLE (Change 1): a filled drawing is stitched
    into a single closed `<path>` (so a polygon/circle drawn as separate
    segments actually fills) and styled by role — background floods are
    dropped, shaded regions get a theme-relative wash, white knockouts
    erase to the panel, small ink fills stay opaque. UNFILLED drawings
    (outline strokes, axis labels) emit per-item exactly as before.

    Emit order is a stable sort by (role rank, source paint_index):
    shade fills first, then knockouts over them, then ink + outline
    strokes + labels LAST so the figure's outlines and labels always sit
    on top of the shading.
    """
    w = fig_bbox.width
    h = fig_bbox.height
    ox = fig_bbox.x0
    oy = fig_bbox.y0

    # Group flattened items back into their source drawings so a filled
    # multi-segment region can be emitted as one fillable path. Items must
    # be re-sorted by paint_index inside each group: upstream
    # `_largest_y_cluster` sorts `flat` by y0, which scrambles a drawing's
    # segment order — and a polygon's edges only stitch into a closed path
    # if walked in their original head-to-tail paint order.
    groups: dict[int, list[dict]] = {}
    order: list[int] = []
    for f in flat:
        di = f.get("draw_index", id(f))
        if di not in groups:
            groups[di] = []
            order.append(di)
        groups[di].append(f)
    for di in groups:
        groups[di].sort(key=lambda it: it.get("paint_index", 0))

    # First pass: classify each filled drawing and find the earliest shade.
    # A white fill is only a *knockout* if it carves a shade painted BEFORE
    # it (the painter's-model: shade region, then white over it to cut the
    # interior). A white fill painted before any shade has nothing to carve
    # — it is the plot/page background (var-2016's white plot rectangle the
    # bars sit on). Reclassifying it as background stops it erasing the bars.
    drawing_roles: dict[int, tuple[str, int, list[dict]]] = {}
    first_shade_pi = None
    for di in order:
        items = groups[di]
        first = items[0]
        if first.get("fill_rgb") is None:
            continue
        pi0 = min(it.get("paint_index", 0) for it in items)
        role = _fill_role(first, fig_bbox)
        drawing_roles[di] = (role, pi0, items)
        if role == "shade" and (first_shade_pi is None or pi0 < first_shade_pi):
            first_shade_pi = pi0

    # Build emit-units: (role_rank, paint_index, kind, payload). kind is
    # 'fill' (one path for a filled drawing) or 'stroke' (per-item legacy
    # emit for an unfilled drawing or ink). Background fills are dropped.
    units: list[tuple[int, int, str, object]] = []
    for di in order:
        items = groups[di]
        first = items[0]
        is_filled = first.get("fill_rgb") is not None
        pi0 = min(it.get("paint_index", 0) for it in items)
        if is_filled:
            role = drawing_roles[di][0]
            if role == "knockout" and (
                first_shade_pi is None or pi0 < first_shade_pi
            ):
                # White with no shade beneath it to carve = plot/page
                # background. Drop it so it can't paint over real content.
                continue
            if role == "background":
                continue  # framing flood / near-black plot fill: never paint
            rank = _ROLE_RANK.get(role, 2)
            units.append((rank, pi0, role, items))
        else:
            # Unfilled outline / stroke drawing: emit per item, last.
            for it in items:
                units.append((_ROLE_RANK["ink"], it.get("paint_index", 0),
                              "stroke", it))

    units.sort(key=lambda t: (t[0], t[1]))

    parts: list[str] = []
    for _rank, _pi, kind, payload in units:
        if kind == "stroke":
            f = payload  # single item
            _emit_item(parts, f, ox, oy, _stroke_attrs(f))
            continue
        # Filled drawing -> one path, styled by role.
        items = payload
        role = kind
        even_odd = items[0].get("even_odd")
        d = _filled_path_d(items, ox, oy)
        if not d:
            continue
        fr = ' fill-rule="evenodd"' if even_odd else ""
        sw = items[0]["stroke_width"]
        # Fix 1: a filled path the SOURCE also stroked must keep its
        # outline regardless of role. The role governs only the FILL; the
        # source stroke is a separate, independently-meaningful mark (the
        # triangle edge in var-2025 XYZ-012 is a white knockout fill AND a
        # black 1.2pt stroke — drop the stroke and the triangle the prompt
        # references vanishes). General, not a var-2025 special case.
        stroked = bool(items[0].get("stroked"))
        if role == "shade":
            # Theme-relative wash PLUS the shape's own outline. Opacity
            # tracks the printed grey level (1 - luminance) so a light tint
            # reads faint and a solid data bar reads solid. The shaded
            # region's border (hexagon edge, cross/circle rim) is drawn by
            # this very drawing in the source — the legacy extractor stroked
            # it, and dropping the stroke would erase the outline (there is
            # often no separate outline drawing). Keep a currentColor stroke
            # so the shaded shape stays delineated.
            rgb = items[0].get("fill_rgb") or (0.5, 0.5, 0.5)
            opacity = _shade_opacity(sum(rgb) / 3.0)
            style = (
                f'fill="currentColor" fill-opacity="{opacity}" '
                f'stroke="currentColor" stroke-width="{sw}" '
                f'stroke-linejoin="round"'
            )
        elif role == "knockout":
            if stroked:
                # The source carved out the interior (white fill) AND drew
                # the shape's outline (a real stroke). Erase to the panel
                # AND keep the currentColor edge so the outline survives.
                style = (
                    f'fill="var(--panel)" stroke="currentColor" '
                    f'stroke-width="{sw}" stroke-linejoin="round"'
                )
            else:
                # Pure knockout: a stroke around the carved-out interior
                # would reintroduce the very lines the knockout erases.
                style = 'fill="var(--panel)" stroke="none"'
        else:  # ink: opaque, keep a hairline stroke so thin shapes survive
            style = (
                f'fill="currentColor" stroke="currentColor" '
                f'stroke-width="{sw}" stroke-linejoin="round"'
            )
        parts.append(f'<path d="{d}"{fr} {style} />')

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
