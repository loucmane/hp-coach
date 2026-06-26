// Figure-audit overrides — provenance: docs/figure-audit.md (2026-06-26).
//
// A render-and-classify audit of all 214 extracted quant figures (12 agents
// each viewing a PNG render vs the question prompt) found 40 broken figures.
// Two zero-content-regeneration remediations live here, both applied in
// data/questions.ts:
//
//   1. SUPPRESSED_FIGURES — the figure is junk (a stray "Steg 1-4" layout
//      fragment), empty (a blank grid / axes with no data), garbled, or a
//      clean figure LEAKED from a neighbouring question, BUT the prompt text
//      is fully self-contained. We hide the figure; the question stays
//      drillable and answerable. (loadBank nulls q.figure for these.)
//
//   2. EXCLUDED_QUESTIONS — the figure is LOAD-BEARING (the question can't be
//      answered without it: "which line best fits the points", "graph of
//      f+g", "shaded vs unshaded") AND it is empty/garbled. We drop the
//      question from the drillable pool so a student never hits an
//      unanswerable item. (questionsInSection filters these out.)
//
// REEXTRACT_QUESTIONS is the subset of EXCLUDED_QUESTIONS whose real figure is
// recoverable from the source PDF — see the figure-reextract task. When a
// figure is re-extracted and validated, remove its qid from both this set and
// EXCLUDED_QUESTIONS to return it to circulation.

/** Hide the (broken/leaked) figure; question stays drillable. */
export const SUPPRESSED_FIGURES: ReadonlySet<string> = new Set([
  'host-2015-kvant1-XYZ-012',
  'host-2017-kvant2-XYZ-006',
  'host-2020-kvant1-KVA-016',
  'host-2021-kvant1-XYZ-008',
  'host-2021-kvant1-XYZ-012',
  'host-2023-kvant2-XYZ-011',
  'host-2023-kvant2-XYZ-012',
  'host-2024-kvant2-XYZ-006',
  'host-2025-kvant1-XYZ-008',
  'host-ver1-2019-kvant1-KVA-020',
  'host-ver1-2019-kvant1-XYZ-010',
  'host-ver1-2019-kvant2-XYZ-010',
  'host-ver2-2019-kvant1-XYZ-010',
  'host-ver2-2019-kvant2-XYZ-010',
  'var-2015-kvant2-KVA-020',
  'var-2016-kvant1-KVA-013',
  'var-2016-kvant1-XYZ-004',
  'var-2016-kvant1-XYZ-012',
  'var-2016-kvant2-XYZ-004',
  'var-2016-kvant2-XYZ-006',
  'var-2017-kvant1-XYZ-004',
  'var-2017-kvant2-XYZ-006',
  'var-2018-1-kvant1-XYZ-012',
  'var-2019-kvant1-XYZ-002',
  'var-2022-1-kvant1-XYZ-005',
  'var-2022-1-kvant1-XYZ-007',
  'var-2022-1-kvant1-XYZ-008',
  'var-2022-1-kvant2-KVA-014',
  'var-2023-kvant1-KVA-015',
  'var-2023-kvant1-KVA-016',
  'var-2024-kvant1-XYZ-008',
  'var-2026-kvant2-XYZ-002',
  // Tranche 1.1: figure-less before, but the glyph-aspect fix tips them past
  // MIN_FIGURE_ITEMS and emits a junk inline-math fragment — suppress so a
  // future full re-extract can't serve garbage.
  'var-2024-kvant1-XYZ-003',
  'var-2018-1-kvant2-XYZ-008',
])

/** Load-bearing figure is broken AND recoverable from the source PDF — drop
 *  from drilling until re-extracted. Subset of EXCLUDED_QUESTIONS.
 *  Tranche 1.1 (2026-06-26) fixed + re-shipped var-2016-XYZ-008 (glyph-fragment
 *  filter was dropping thin glyphs like 'l' → aspect-ratio exemption) and
 *  var-2025-XYZ-012 (filled+stroked knockout dropped its stroke → now
 *  preserved); both PDF-cross-checked faithful. These 4 remain (multi-object
 *  X-clip, Tranche 2). */
export const REEXTRACT_QUESTIONS: ReadonlySet<string> = new Set([
  'host-2013-kvant1-KVA-017',
  'var-2018-1-kvant1-XYZ-011',
  'var-2018-1-kvant2-KVA-018',
  'var-2022-1-kvant1-KVA-013',
])

/** Drop from the drillable pool — load-bearing figure is empty/garbled.
 *  Tranche 1 recovered host-2014 (raster fallback) + var-2024-KVA-014
 *  (hexagon role-fill) — both removed. host-2025 needs a multi-figure data
 *  model; var-2024-XYZ-006 is verify-then-promote. Plus the 4 REEXTRACT. */
export const EXCLUDED_QUESTIONS: ReadonlySet<string> = new Set([
  'host-2025-kvant2-XYZ-008', // graph of f+g — graph-choice, needs multi-figure model
  'var-2024-kvant1-XYZ-006', // angle x — localized bbox under-cover (verify-then-promote)
  ...REEXTRACT_QUESTIONS,
])
