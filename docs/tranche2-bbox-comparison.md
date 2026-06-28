# Tranche-2 bbox X-widen: option comparison (analysis only)

**Scope:** 4 multi-object quant figures whose SECOND object is clipped because the
figure bbox X-edge is derived from question **text-line extents**, not drawing
extents. The per-item CENTER test in `parse_figures.py` `_flatten_items` then drops
every drawing primitive whose center-x exceeds that text cap.

**Targets:**

| qid | page | text cap x | 2nd-object x-range | clean widen? |
|---|---|---|---|---|
| host-2013-kvant1-KVA-017 | p9 | 287.9 | 304.7..457.2 (L2 coord graph) | yes |
| var-2018-1-kvant1-XYZ-011 | p7 | 321.34 | 283.4..477.3 (2nd parallelogram) | yes |
| var-2018-1-kvant2-KVA-018 | p10 | 331.58 | 265.9..402.0 (right graph y=g(x)) | yes |
| var-2022-1-kvant1-KVA-013 | p7 | 292.66 | 317.7..387.8 (triangle) | yes |

All four are confirmed `dataPresentInPdf=yes` (the second object exists in the PDF
and is currently lost). Decoration/crop-mark band sits at x ≈ 485..617; every target's
real 2nd object terminates by x=477.3, leaving a clean dead zone.

## Root cause (verified)

- `parse_quant.py:1238-1239` — `x1 = max(text-span right edge over the page) + 20.0`.
  Never touches `get_drawings()`. The +20 slack exists only to keep a `(cm)` glyph from
  being center-clipped; far too small to reach a side-by-side 2nd object.
- `parse_figures.py:457-464` — `_flatten_items` center test discards any primitive whose
  `cx > question_bbox.x1`. Item-level, correctly rejecting page-wide crop marks/headers —
  but it also nukes the real 2nd object.
- On figure pages, figure labels are drawn as **vector glyphs**, not extractable text, so
  the text cap is driven entirely by answer-option prose and lands in the inter-object
  gutter (vividly true for host-2013 KVA-017: rightmost word "otillräcklig" → cap 287.9
  slices between the two coordinate systems).

## Comparison matrix

| | CURRENT | OPTION A (full widen + clamp) | OPTION B (surgical disjoint-cluster) | OPTION C (leave) |
|---|---|---|---|---|
| **Recovers (4 targets)** | 0/4 | 4/4 | 4/4 | 0/4 |
| **Sibling bleed** | n/a | 0 measured (0/207 sweep deco/neighbour/crop) | 0 measured (0/208 fired admit deco) | n/a |
| **Blast radius** | none | global: 126/207 bbox edges move; **31/207 (15%) served figures change** (all benign: ~21 other clipped figures repaired + 10 densified) | targeted: detector fires on **35/208**; 4 intended + 31 other genuinely-clipped figures repaired; 173 untouched/byte-identical | none |
| **Complexity** | n/a | Low code (~10 lines, swap text cap for clamped drawing extents), **high verification** (full 215-figure visual re-sweep) | Moderate code (~40-60 LoC: new upstream widen pass + X-cluster JOIN keyed on MIN_CLUSTER_GAP, NOT max(key=len)); verification scoped to ~35 changed figures | none |
| **Re-opens neighbour-bleed class?** | no | yes, in principle (global; safe only empirically on this corpus) | no on single-object figures (their text-cap bbox untouched) | no |

Both A and B recover the **identical** 4 targets, and both incidentally repair the **same
~31 additional currently-clipped figures** the text cap was silently truncating
(e.g. var-2019-kvant2-XYZ-007 two-parallel-lines served cut in half; host-2020 KVA-015
rectangle right edge; var-2017 KVA-015 triangle + "(m)" unit; host-2025 KVA-016 x-axis
arrowhead; NOG-024 second quadrilateral). On this 27-exam corpus, measured foreign-content
bleed for **both** options is **zero**.

The difference is exposure, not measured outcome:

- **A** unconditionally rewrites the X-edge of all 208 figures and relies on the page-relative
  clamp `[30, page_w−30]` + the existing `_largest_y_cluster` Y-gap=60 guard to suppress the
  neighbour/adjacent-column bleed the tight cap was originally built to prevent. Safe here
  only because no served figure on these 27 exams has real adjacent-column content in
  `x ∈ [textcap, page_w−30]` within its Y-band. That is empirical, not structural.
- **B** widens only the 35 figures that actually have a coherent disjoint drawing cluster past
  the cap; the other 173 keep their text-derived bbox verbatim, so single-object figures have
  **no** exposure to the bleed class at all.

## Recommendation: **B**

Recovering the 4 figures is worth it: all four are load-bearing (the second object carries
the comparison the question is *about* — a 2nd graph, parallelogram, or triangle — so the
clipped figure is not merely ugly but pedagogically wrong/unanswerable), and the fix
incidentally repairs ~31 other silently-broken figures. So C (do nothing) is rejected: it
leaves 4 (in fact 35) figures broken when a measured-clean fix exists.

Between A and B: both achieve identical recovery with 0% measured bleed, so the decision is
governed by **regression exposure**, not capability. B is strictly lower-regression — it
touches only figures with real content past the cap and leaves single-object figures' bbox
provably untouched, whereas A re-opens (in principle) the exact neighbour/adjacent-column
bleed class the tight text cap was deliberately built to suppress, and is clean only because
of the specific geometry of *this* corpus. The extra implementation cost for B (~40-60 LoC
vs A's ~10) is real but modest and self-contained, and it buys a smaller blast radius and a
narrower verification surface (~35 figures vs a mandatory full 215-figure re-sweep).

**A is the acceptable fallback** if B's cluster-JOIN proves fiddly to implement, on the
strict condition that it ships with the page-relative clamp and a full 215-figure visual
re-verification gate. **Reject any literal-565 clamp** — page widths vary across exam
families (578.9 / 595.x / 606.1 / 612.3 / 637), so a literal would clip wide-page figures
and over-extend narrow ones.

## If proceeding (Option B): concrete plan + guardrails

**Where:** a NEW upstream widen pass at `parse_quant.py` ~1238, running **before** the
`_flatten_items` center clip in `parse_figures.py` (the clip is at 457-464; widening
downstream is too late — the 2nd object is already gone).

**Algorithm:**
1. Collect drawing-item centers in the figure's Y-band `[y_top, y_bottom]` (center-y overlap,
   matching the existing test's axis), including those **past** the text cap.
2. Cluster along X by bbox-edge gap — direct transplant of `_largest_y_cluster`'s gap algorithm
   (`parse_figures.py:523-533`) but sorted by `x0`, gap = `x0 − cluster_max_x1`.
3. **Coherent-adjacent-cluster JOIN** keyed on `MIN_CLUSTER_GAP = 60.0`: keep ALL clusters whose
   inter-gap ≤ 60 and whose center-x stays within the page-relative crop clamp. Real 2nd objects
   sit 12-33pt past the cap (joined); decorations sit 200+pt away (never joined — top X-gaps were
   205/221/246pt for 3 of 4 targets).
4. Set the widened bbox `x1 = max(joined-cluster item.x1)`, hard-clamped to `[30, page_w − 30]`.

**Guardrails (mandatory):**
- **Page-relative clamp** `x1 ≤ page.rect.width − 30`, `x0 ≥ 30`. NOT a literal 565. Verified:
  clamp@page_w−30 admits full 2nd objects (max right-edge 477.3) with 0 decoration leakage on
  all 4 targets and across the 35 fires.
- **Do NOT reuse `_largest_y_cluster`'s `max(clusters, key=len)`** — a real 2nd object is often the
  *smaller* cluster (XYZ-011 splits `[57, 23, 23]`; the 2nd parallelogram is the smallest). max-pick
  would keep cluster 1 and DROP the 2nd object — exactly backwards. JOIN, do not winner-take-all.
- **Key the detector on center-x past the cap, not on a literal empty vertical gap** — 3 of 4 targets
  have a wide bridging axis-arrow primitive whose left edge precedes the cap, so the drawing projection
  is continuous (no empty strip). Detect via bimodal center-x density, not a literal gutter.
- **`>= 6`-item floor** on the candidate cluster to avoid promoting stray decoration marks.
- **Keep `_largest_y_cluster`'s vertical drop intact** and run it AFTER the X-widen (diagonal-line
  caveat in its docstring 504-519 still applies); the Y-gap=60 guard remains the neighbour-row defence.

**Verification gate before merge:**
- Re-extract and visually diff the **35 figures the detector fires on** (annotated raster crops),
  confirming each is a genuine recovery and none merges a neighbour or sweeps decoration.
- Confirm the **173 non-firing figures are byte-identical** after re-crop (regression null check).
- Spot-check exam families across all page widths (578.9 / 595.x / 606.1 / 612.3 / 637) to confirm
  the page-relative clamp behaves.

**Untouched knobs:** `FIG_PADDING=8.0` (post-clip, orthogonal); `MIN_FIGURE_WIDTH/HEIGHT/ITEMS`
(all widened figures clear these comfortably).

**References:** `/home/loucmane/dev/hpfetcher/docs/figure-audit.md` (reextractList),
`/home/loucmane/dev/hpfetcher/docs/figure-reextraction-plan.md` (Change 2 == this X-widen).
Simulations: `scratchpad/sim_optionA_final.py` + `optA_final.json` (A, 215 served figures);
the Option-B detector run covered all 208 vector-figure questions corpus-wide.
