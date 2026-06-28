# Figure re-extraction plan — fix (not hide) the load-bearing broken quant figures

Status: PLAN for owner approval. No source code changed yet.
Provenance: `docs/figure-audit.md` (2026-06-26), forensics + fix-architect + validation-pipeline inputs, verified against `parser/parse_figures.py`, `parser/parse_quant.py`, `parser/parse_dtk_figures.py`, and the source PDFs in `data/pdfs/`.

## TL;DR recommendation

**Do the re-extraction. It is worth it.** The forensics confirms `dataPresentInPdf: yes` for all 12, and the root causes are a small number of *shared* extractor defects, not 12 unrelated bugs. Realistically **10 figures return to circulation** (8 reextract targets + 2 high-confidence exclude→promote), with **1 more pending verification** and **1 deferred** for a real data-model reason. This is a high-leverage fix: ~4 coordinated parser changes recover ~10 questions, and every change is gated behind a full-corpus before/after pixel diff so the 173 good figures cannot silently regress.

The honesty bar ("fix not hide") is satisfied: recovered figures leave `EXCLUDED_QUESTIONS` entirely and drill normally; anything that can't be honestly recovered stays transparently excluded with a recorded reason.

## Red-team: how many of the 12 are realistically recoverable?

Verified directly against the PDFs (not just trusting forensics):

- **host-2014-kvant1-XYZ-006** — confirmed: page 3 has exactly 1 embedded image at bbox (102,522,306,721), 1498×1460, Indexed colorspace = the entire ~150-point scatter cloud. The vector path sees only 6 drawings (the axes). `get_drawings()` is structurally blind to it. **Recoverable via raster fallback (Change 4). High confidence.**
- **host-2018-kvant1-KVA-017** — confirmed: drawing [0] grey 0.72 frame (164×99) painted first, then [1]-[4] WHITE (1.0,1.0,1.0) quadrant knockouts on top, then black corner markers. Classic painter's white-knockout collapse. **Recoverable via role-aware fill (Change 1). High confidence.**
- **host-2013-kvant1-KVA-017** — confirmed: page 9 has 23 items at x<300 and 21 items at x≥300 (reaching x=451) in the same Y band = two side-by-side coordinate systems; the text-column cap (x1≈339) center-clips the right cluster. **Recoverable via X-band widen (Change 2). Medium confidence (highest regression risk).**

| # | qid | failure class | data in PDF | recoverable | fix |
|---|-----|---------------|-------------|-------------|-----|
| 1 | host-2014-kvant1-XYZ-006 | raster-backed (scatter) | yes (raster) | YES (promote) | Change 4 |
| 2 | host-2025-kvant2-XYZ-008 | structural (stimulus + 4 option figures) | yes (vector) | NO (defer) | Change 5 |
| 3 | var-2024-kvant1-XYZ-006 | selection/bbox under-cover | yes (vector) | MAYBE (verify) | Change 2/6 |
| 4 | var-2024-kvant2-KVA-014 | fill collapse (grey vs white) | yes (vector) | YES (promote) | Change 1 |
| 5 | host-2013-kvant1-KVA-017 | multi-object X-clip | yes (vector) | YES | Change 2+3 |
| 6 | host-2018-kvant1-KVA-017 | white-knockout collapse | yes (vector) | YES | Change 1 |
| 7 | var-2016-kvant1-XYZ-008 | near-black full-area flood | yes (vector) | YES | Change 1 |
| 8 | var-2018-1-kvant1-XYZ-011 | X-clip (2nd parallelogram) | yes (vector) | YES | Change 2 |
| 9 | var-2018-1-kvant2-KVA-018 | X-clip + dropped axis labels | yes (vector) | YES | Change 2+3 |
| 10 | var-2019-kvant2-KVA-019 | fill collapse (semicircle knockouts) | yes (vector) | YES | Change 1 |
| 11 | var-2022-1-kvant1-KVA-013 | X-clip (triangle) | yes (vector) | YES | Change 2 |
| 12 | var-2025-kvant1-XYZ-012 | fill collapse (grey circles + wedge knockout) | yes (vector) | YES | Change 1 |

**Realistic recovery: 10 high-confidence (1,4,5,6,7,8,9,10,11,12), 1 pending verification (3), 1 deferred (2).**

### Verdict on the audit's own categories
- The audit's `reextractList` (8: #5,6,7,8,9,10,11,12) is correct — all 8 recover.
- The audit's `excludeList` is too pessimistic on two: **#1 (host-2014 scatter)** and **#4 (var-2024 hexagon)** are cleanly recoverable; recommend promoting both.
- **#3 (var-2024 angle x)** is a verify-then-promote (a localized bbox under-cover, not the systematic X-clip) — do NOT loosen a global gate for it.
- **#2 (host-2025 f+g)** genuinely stays excluded: it needs a *stimulus + four option-figures* data model that does not exist; a render fix alone leaves the four answer-choice graphs unrepresented, so the question stays unanswerable. Defer as a separate follow-up; do not let it block the other 10.

## Regression risk to the 173 good figures, and is the guard sufficient?

Risk is real and unevenly distributed across the changes:

- **Change 1 (role-aware fill / paint order / winding)** — MEDIUM. Touches the shared `_build_svg` emit path for all 173. The hazard is a figure that *legitimately* has one solid/shaded fill rendering hollow, or a knockout-as-`var(--panel)` mismatch in one theme. Mitigated by: keeping `GLYPH_FRAGMENT_*` thresholds untouched (the blob fix is role/winding/order, not a wider glyph filter); rendering BOTH light and dark in the diff (the grey-as-`currentColor` + `fill-opacity` and white-as-`var(--panel)` choices specifically must invert correctly — a literal grey RGB would have failed dark mode, which is why the plan forbids it).
- **Change 2 (X-band widen)** — HIGHEST. Widening X re-introduces exactly the neighbour-bleed the tight text-column cap was added to suppress, and confirmed during red-team: page corners carry crop-mark/decoration items reaching x=514–565 (host-2013 p0/p15). The widen MUST (i) admit only same-Y-band items, (ii) hard-clamp against the crop-mark margin (x<~30 / x>~565), (iii) keep `_has_option_graphs` caps and `_largest_y_cluster` vertical drop intact, (iv) still pass `MIN_FIGURE_*`.
- **Change 3 (label recovery)** — LOW. Only ADDS spans whose center is inside the now-correct figure box; never removes. Only hazard: a stray prompt word swept into a wider box, caught by the diff.
- **Change 4 (raster fallback)** — ~ZERO for the 173. Fires strictly below `MIN_FIGURE_ITEMS` AND only when an embedded image intersects the bbox; none of the 173 qualify (they have ≥`MIN_FIGURE_ITEMS` real vector drawings, so the vector path wins).

**Is the guard sufficient? Yes, with the stated discipline.** The primary guard — render all 214 served figures before+after via the *browser* (Playwright/chromium, the only faithful `currentColor` + viewBox-clip + font-fallback renderer available; no SVG rasterizer exists in the venv) in BOTH themes, then perceptual-diff — is the right instrument. Two guard requirements are load-bearing and must not be skipped:
1. **Sequence, never bundle.** Ship Change 1, diff, accept. THEN Change 2+3, diff, accept. Never co-mingle the highest-risk X-widen with the shared emit change in one un-diffed step — otherwise a regression can't be attributed.
2. **Per-qid visual sign-off ≠ pixel diff.** The diff proves "changed"; only an eyeball against the source-PDF crop proves "correct." Re-inclusion is gated per-qid on its own sign-off, never all-or-nothing.

The 7-exam rebuild rewrites ~61 SVGs (8 targets + ~53 siblings, all in the 173 good set), so the diff will surface up to 53 "changed" siblings — each must be confirmed unchanged-in-meaning (sub-pixel coordinate-format jitter OK; any newly-hollow or newly-missing stroke is a regression to fix before shipping).

## Effort estimate

**Medium — roughly 1.5–2.5 focused days.** Breakdown: Change 4 (raster fallback) ~0.5d, mostly mirroring `parse_dtk_figures.py`. Change 1 (role-aware fill) ~0.5–1d incl. dark-mode tuning. Change 2+3 (X-widen + labels) ~0.5–1d, the bulk being the regression diff inspection of ~53 siblings, not the code. Validation harness (render + diff + signoff scripts) ~0.5d, reusable thereafter. The risk concentrates in *diff inspection*, not in writing the fixes.

---

## What to change in the source (owner-approved edits only after sign-off)

### parse_figures.py — Change 0 (prerequisite plumbing)
`_flatten_items` (200-249) currently collapses every drawing to `fill='currentColor'|'none'` (line 215-216) and discards per-drawing fill RGB, `even_odd`, `type`, and paint order. Capture and attach to each flattened item: `d['fill']` (RGB tuple or None), `d.get('even_odd')`, `d.get('type')`, and a monotonic `paint_index`. Stop hard-coding `fill='currentColor'` here; defer the fill decision to `_build_svg`. Keep default behaviour byte-identical (any non-None fill → currentColor) until Change 1 refines it. **No figure changes on its own.**

### parse_figures.py — Change 1 (FIX large-fill black blob)
Add `_fill_role(item, fig_bbox)` near `_is_glyph_fragment_rect` (161) returning `background | shade | knockout | ink`:
- `background` = fill luminance near-black (`sum(rgb)/3 < ~0.15`) OR a fill covering >~70% of `fig_bbox` area (the var-2016 0.01 plot flood + gridline group).
- `knockout` = fill luminance near-white (`> ~0.9`).
- `shade` = mid grey (0.15..0.9).
- `ink` = small black fills (digit/label glyphs — already glyph-filtered — and arrowheads).

In `_build_svg` (333-422) emit BY ROLE: background → drop (`fill='none'`, skip if near-black flood); knockout → `fill='var(--panel)'` (the wrapper bg, erases-to-background in BOTH themes — NOT currentColor); shade → `fill='currentColor' fill-opacity='0.18'` (theme-relative, inverts in dark mode); ink → unchanged currentColor. Stable-sort emit by role then `paint_index`: fills first (background, shade, knockout), strokes+labels last, so outlines/labels always sit on top.

Recovers: #6 host-2018, #10 var-2019, #12 var-2025, #7 var-2016, and the shading half of #4 var-2024 hexagon. Verified fill data present for all (host-2018 grey-then-white layering confirmed directly).

### parse_quant.py — Change 2 (FIX multi-object drop)
The X cap at parse_quant.py ~1238-1240 is `x1 = max(text x1) + 20`; a second side-by-side object's centers fall past it and are center-clipped in `_flatten_items` (235-238). Fix: after computing the text-derived bbox, compute the union x-extent of only those `get_drawings()` items whose vertical span OVERLAPS the question's `[y_top, y_bottom]` band AND whose center-x lies within the page's printable text margins; widen `bbox.x1` (and `x0`) to that same-row drawing extent, HARD-CLAMPED against the crop-mark margin (drop x<~30 / x>~565 — confirmed necessary: host-2013 p0/p15 carry decoration items reaching x=514–565). Keep `_has_option_graphs` top/bottom caps and `_largest_y_cluster` vertical drop untouched. Do NOT widen to raw drawing extents.

Recovers: #5 host-2013, #8 var-2018-1-XYZ-011, #11 var-2022-1-KVA-013, #9 var-2018-1-KVA-018 (#9 also needs Change 3).

### parse_figures.py — Change 3 (recover dropped axis/curve labels)
No new code beyond Change 2: `_text_spans_in` (308-327) already gathers spans by center-in-padded-fig_bbox. Once Change 2 widens the box across both side-by-side systems, the `y=f(x)`/`y=g(x)` and the differing `5`/`10` axis ticks fall inside and emit. Necessary for #9 (its current SVG has ZERO `<text>`; the differing scales are the whole trap). Confirm in re-render that BOTH graphs' ticks appear.

### parse_figures.py — Change 4 (raster fallback for image-backed figures)
NEW gated path mirroring `parse_dtk_figures.py` `get_pixmap`. In `extract_figure_svg`, BEFORE returning None on the thin-vector path (`len(flat) < MIN_FIGURE_ITEMS`), check `page.get_image_info()`: if an embedded image's bbox intersects `question_bbox` AND surviving vector items < `MIN_FIGURE_ITEMS`, render that region via `page.get_pixmap(clip=..., matrix=Matrix(RENDER_SCALE))` and return `{kind:'raster', src, aspect_ratio}`. `QuestionFigure.tsx` already has a `kind==='raster'` branch (no frontend change). Gate strictly on "vector items < MIN_FIGURE_ITEMS AND image intersects bbox" so it never steals a vector figure carrying a decorative bitmap. Dark-mode caveat (rasters don't invert) is consistent with the 205 shipped DTK rasters, not a new defect.

Recovers: #1 host-2014 (verified: page 3, 6 vector drawings + 1 image at (102,522,306,721)).

### Changes 5 & 6 (scope cuts)
- **Change 5**: #2 host-2025-kvant2-XYZ-008 stays excluded — structural (needs stimulus + 4 option-figures data model). Separate follow-up task; do not block the 10.
- **Change 6**: #3 var-2024-kvant1-XYZ-006 is verify-then-promote — re-derive its bbox, confirm whether Change 2 + the existing Pass-2 vertical extension recover it; if a different localized bbox defect, fix in isolation, do NOT loosen a global gate. Stays excluded until confirmed.

---

## Phased implementation plan (ordered)

**Phase 0 — Baseline freeze (before any source edit).**
`source venv/bin/activate`. Copy the 8 current served SVGs to `scratchpad/reextract/before_svg/`. Snapshot all 214: `cp -r app/public/figures scratchpad/reextract/baseline_figures_214`. Build the "good set" programmatically = all 214 served qids minus the non-good audit rows; this is the regression set.

**Phase 1 — Per-qid PDF diagnosis (the "fix not hide" anchor).**
Write `scratchpad/reextract/diagnose.py`: per qid, open `data/pdfs/<exam>/<provpass>.pdf`, recover the question bbox (reuse parse_quant internals or replicate the 3-line bbox build), print `len(get_drawings())`, op counts (l/re/c/qu), filled-vs-unfilled, fill RGBs, any `get_image_info()` intersecting bbox, and save `page.get_pixmap(clip=bbox, matrix=Matrix(4,4))` as the TRUTH crop. Classify each target into LARGE-FILL-BLACK-BLOB vs MULTI-OBJECT-DROPPED vs RASTER-BACKED to confirm which change applies. (Already verified for host-2014, host-2018, host-2013.)

**Phase 2 — Change 0 (plumbing), verify byte-identical output.** Re-extract one exam, confirm SVGs unchanged. This de-risks the refactor before any behavioural change.

**Phase 3 — Change 1 (black-blob role-fill).** Implement role classifier + role-emit + paint order. Re-extract the 4 blob exams (host-2018, var-2019, var-2025, var-2016) + var-2024 hexagon. Run the full-corpus render+diff in BOTH themes. Inspect every flagged sibling; gate: 0 good figures lose content. If a legit-solid figure went hollow, narrow `_fill_role`'s contains-all test and re-run.

**Phase 4 — Change 2+3 (multi-object X-widen + labels).** Implement the same-Y-band widen with margin clamp. Re-extract host-2013, var-2018-1 (both provpass), var-2022-1. Full-corpus diff in both themes; confirm crop marks NOT swept in and no neighbour bled. Confirm both graphs' tick labels appear for #9.

**Phase 5 — Change 4 (raster fallback).** Implement gated `get_pixmap` fallback. Re-extract host-2014. Confirm vector path still wins for all 173 (fallback fires only below MIN_FIGURE_ITEMS).

**Phase 6 — Re-extract affected exams (minimal blast).**
`for ex in host-2013 host-2018 var-2016 var-2018-1 var-2019 var-2022-1 var-2025 host-2014; do python3 parser/build.py $ex; done`. Smallest figure-write unit is one provpass; smallest rebuild is one exam. `build.py` alone (not `build_all.py`) skips the corpus-wide typo sweep, so the blast radius is exactly the ~61+ SVGs for these exams. Copy new target SVGs to `scratchpad/reextract/after_svg/`.

**Phase 7 — Per-figure visual sign-off.**
For each target assemble a 3-up (BEFORE broken render / AFTER browser render / TRUTH pdf crop) at `scratchpad/reextract/signoff/<qid>.png`, Read it, check the verdict-specific criterion (both lines present / bars visible / two parallelograms / both curves / shading legible / both shapes / circles outlined). Record PASS/FAIL in `RESULTS.txt`. Re-read 2-3 flagged siblings to confirm shared-path edits didn't degrade a neighbour. **Partial-recovery policy: a target that fails sign-off STAYS excluded — never re-included blind.**

**Phase 8 — Per-qid re-inclusion (only PASS qids).**
Copy ONLY changed SVGs + 7 changed JSONs — NEVER `pnpm data:sync` / `sync-dataset.sh` (its `rsync -a --delete` would WIPE `app/public/figures/dtk/`'s 217 raster PNGs, which have no counterpart in `data/figures/`). For each PASS qid: remove from `REEXTRACT_QUESTIONS` in `app/src/data/figureOverrides.ts` (this auto-drops it from `EXCLUDED_QUESTIONS`, built as `[...4 hard-excludes, ...REEXTRACT_QUESTIONS]`). For promoted #1/#4, remove their lines from the hard-exclude block. Update `figureOverrides.test.ts`: `EXCLUDED_QUESTIONS.size` → `12 - |recovered|`; add positive drillability + truthy-figure assertions per recovered qid; `SUPPRESSED_FIGURES.size` stays 32. Reconcile the header comment + `docs/figure-audit.md` counts.

**Phase 9 — Verify re-inclusion.**
From `app/`: `pnpm test -- figureOverrides`, `pnpm typecheck`, `./scripts/check_public_data_serves_json.sh` (dev up), and boot `pnpm dev` → open `/drill?qid=<each recovered qid>` to confirm the question re-enters its section pool and the figure renders. Update Taskmaster #167 (done only if all recover; if partial, list still-excluded qids + reason so they aren't silently re-hidden).

## Risks (carry into execution)

1. **Change 2 X-widen re-introduces neighbour bleed** the tight cap was built to prevent — confirmed crop-mark items at x=514–565. Mitigate with same-Y-band-only admission + hard margin clamp; the ~53-sibling diff is the safety net. Highest-risk change.
2. **Change 1 hollows a legitimately-solid figure** or mismatches one theme. Mitigate with both-theme diff + per-sibling inspection; `var(--panel)` knockout + `fill-opacity` shade are specifically theme-relative.
3. **The `--delete` sync gotcha wipes the 217 DTK rasters** if `data:sync` is run. Mitigate: copy only changed files; if a full sync is ever needed, first `mkdir -p data/figures/dtk && rsync -a app/public/figures/dtk/ data/figures/dtk/`.
4. **Count-pinned test breakage** (`EXCLUDED_QUESTIONS.size` literal) — must update in lockstep or CI fails. Mitigate: update test in the same commit as the override edit.
5. **#3 promoted on a loosened global gate** rather than a localized fix → silent regression risk. Mitigate: verify-then-promote only; isolate its bbox fix.
6. **Raster dark-mode non-inversion** for #1 — accepted, consistent with shipped DTK rasters.
7. **Vite stale-watcher** can serve `index.html` instead of the new SVG — mitigate with the `check_public_data_serves_json.sh`-style 200 + `image/svg+xml` probe.
