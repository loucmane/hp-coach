# Quant rendering — vector-first design

**Status:** planned (B), exploratory (C). Last updated 2026-05-08.

**Owners:** loucmane, with Claude as pair.

**Why this doc exists:** parser-quant (merged 2026-05-08) shipped XYZ/KVA/NOG
parsers that produce text-only output via PyMuPDF. Any question that
references a geometric figure, coordinate system, chart, or stacked
fraction in the source PDF is currently unrenderable in the SPA. Our
interim "filter and skip" approach drops ~25-50% of quant questions and
still occasionally surfaces broken ones (heuristics aren't tight enough,
and never can be — the surface of "needs a figure" is too broad for
keyword detection).

This doc captures the plan to actually fix it, in two phases: B (vector
hybrid) and C (LLM-structured). Phase B is the next implementation
branch. Phase C is the longer-term ceiling.

---

## Quality bar (the three non-negotiables)

A 2026 top-tier learning experience requires:

1. **Vector graphics end-to-end.** No bitmaps anywhere a user can
   pinch-zoom. Bitmap math is a 2010 artifact.
2. **Native text** for prompts, options, labels — accessibility
   (screen readers), search, copy/paste, theme inversion all depend
   on text remaining as text.
3. **Publication-quality math typography.** Latin Modern Math or
   STIX 2 via KaTeX, sized and weighted to harmonize with the
   editorial display font.

Any approach that violates one of these is not "top tier."

---

## Phase B — Hybrid SVG + native text + KaTeX (immediate)

The architecture that ships next. ~1 focused day of work. Three
artifacts per quant question, each a different format optimised for
its content type.

### Architecture

```
                         Question record
┌──────────────────────────────────────────────────────────────────┐
│  qid: "var-2026-kvant1-XYZ-006"                                   │
│  prompt: "En mindre kvadrat med sidan x cm är inritad…"           │
│  options: [                                                        │
│    { letter: "A", text: "(2xy + ⟦x^{2}⟧)cm⟦^{2}⟧" }                │
│    { letter: "B", text: "(2xy + ⟦y^{2}⟧)cm⟦^{2}⟧" }                │
│    …                                                               │
│  ]                                                                 │
│  figure: {                                                         │
│    src: "/figures/var-2026-kvant1-XYZ-006.svg",                    │
│    aspect_ratio: 1.4                                               │
│  } | null                                                          │
└──────────────────────────────────────────────────────────────────┘

⟦…⟧ = U+E000/U+E001 LaTeX delimiters (already in main).
Native text outside ⟦⟧, KaTeX inside, SVG figure separate.
```

### Parser changes (`parser/`)

**1. `parse_figures.py` — new module.**

Per question:
- Get all vector drawings on the page via `page.get_drawings()` —
  PyMuPDF returns these as a list of `{type, items, color, …}`
  records, where `items` is `(op, p1, p2, …)` tuples for line, rect,
  curve, quad.
- Filter to drawings whose bbox intersects the question's bbox.
- If no drawings: emit nothing, question gets `figure: null`.
- If drawings present:
  - Compute a tight figure bbox (min/max of all drawing coords)
  - Find text spans inside that figure bbox (axis labels, point
    labels like A/B/C, equation labels)
  - Emit SVG: `<svg viewBox="0 0 W H" stroke="currentColor"
    fill="none">` with `<line>`, `<path>`, `<rect>` for drawings
    and `<text>` for label spans
  - Save to `data/figures/{qid}.svg`

Key SVG decisions:
- `stroke="currentColor"` everywhere → CSS `color` controls all
  strokes → dark mode is automatic
- `fill="none"` by default; explicit `fill="currentColor"` on
  filled regions where the PDF had a fill
- Coordinates translated so the figure starts at (0,0); viewBox
  describes the figure's intrinsic dimensions
- Text spans rendered as `<text>` with `font-size` matching the
  PDF's measured size (relative to viewBox, scales with figure)

**2. Stacked-fraction reconstruction in `_line_to_text` (`parse_quant.py`).**

Currently we detect superscripts (smaller font + raised baseline).
Stacked fractions need spatial-pair detection:
- Two text spans at approximately the same x-center
- One above, one below (y-centers differ by ~10-12 pt)
- Optionally: a horizontal line drawing between them at the
  matching x-range

Detection algorithm:
- Group spans by approximate x-center bucket (±3pt)
- Within a bucket, sort by y-center
- For each pair (upper, lower) where y_lower - y_upper > 8pt and
  font sizes match, emit `⟦\\frac{upper}{lower}⟧` and consume both
- Also accept the single-line "5/3" form — pass through unchanged

Conservative: only fire when there's strong evidence of stacking.
Edge cases (mixed fractions, nested fractions, fractions with
parenthetical numerators) handled best-effort; the gate falls
through to garbled-skip if reconstruction fails.

**3. Greek-letter font normalization.**

PyMuPDF maps non-Latin glyphs through their PDF font's encoding,
which for math fonts (CMSY10, MathematicalGlyphs, etc.) often
produces Latin nonsense. Common cases:
- `π` → "r" (font CMSY10, char 0x70)
- `°` (degrees) → various
- `≤` `≥` `≠` `±` `∞` `√` — symbol-font glyphs

Build a font-name + char-code → unicode lookup table for the small
set of HP exam math fonts. Apply during span text extraction.

### Question schema changes (`app/src/data/questions.ts`)

```ts
export type Question = {
  // …existing fields…
  /** Path to vector figure SVG, or null if the question is text-only.
   *  Resolved relative to /figures/ in production. */
  figure: { src: string; aspect_ratio: number } | null
}
```

### App changes

**1. `<QuestionFigure>` component (`app/src/components/drill/QuestionFigure.tsx`).**

- Async-loads the SVG content via fetch (enables theming via CSS)
- Renders inline (not as `<img>`) so currentColor works
- Container constrains aspect ratio (no layout shift on load)
- Subtle path-draw entrance animation:
  ```css
  .figure-svg path, .figure-svg line {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: draw-in 800ms ease-out forwards;
  }
  ```
- Tap → opens modal with pinch-zoom (Framer Motion `useGesture`)

**2. `<DrillQuestion>` layout update.**

```
prompt
  ↓
[QuestionFigure if present]   ← new slot
  ↓
options
```

Gap, alignment, and entrance choreography stay editorial — figure
fades in 80ms after prompt, options 160ms after figure.

**3. KaTeX font upgrade.**

Replace the default KaTeX stack with Latin Modern Math. Either
self-host the font files (better) or pull from a CDN. Match the
optical weight of `var(--font-display)` so math doesn't feel like
a different document.

### Filter cleanup

With B in place, the figure-reference detector becomes
**unnecessary** for almost all cases — questions reference figures
because we can show figures now. Drop:
- `_FIGURE_LABEL_RE` aggressive multi-letter matching
- `_references_figure` heuristic
- Digit-only-token option drop (likely become real fractions
  via stacked-fraction reconstruction)

Keep only a minimal "the page genuinely has no parseable content"
gate — if the parser produces zero tokens, skip.

### Coverage projection

| Section | Current | After B |
|---|---|---|
| XYZ | 50.6% | ~95% (figures + fractions both fixed) |
| KVA | 58.9% | ~95% |
| NOG | 86.7% | ~98% (mostly text already) |
| DTK | 0% | ~95% (image-heavy, but B handles that) |

DTK (diagram, tabeller, kartor) becomes drillable as a side effect
of B because every DTK question is already a "figure question" —
the figure pipeline handles it natively.

### Risks and unknowns

- **Stacked-fraction edge cases.** Nested fractions, mixed numerals,
  very-tall multi-line numerators — heuristic might miss. Acceptable
  fallback: skip the question (back to filter behavior).
- **Vector text in SVGs.** PDF authors sometimes render text as
  paths instead of text. We'd lose accessibility on those labels.
  Acceptable fallback: render as paths via PyMuPDF's text-as-path
  fallback.
- **Figure size on mobile.** Figures may be wider than the 390px
  artboard. SVG scales but text inside might shrink to illegible.
  Mitigation: figure-modal with pinch-zoom (already planned).
- **DTK chart complexity.** Some DTK pages have multiple charts +
  legends + footnotes. Figure-bbox heuristic might not separate
  them cleanly. Mitigation: ship XYZ/KVA/NOG first, evaluate DTK
  separately.

### Effort estimate

- Stacked-fraction reconstruction: 2h
- Greek-letter font normalization: 1h
- Vector figure extraction (`parse_figures.py`): 3h
- `<QuestionFigure>` component + integration: 1.5h
- KaTeX font polish: 30min
- Filter cleanup: 30min
- Sync, build, test, ship: 1h

**Total: ~9-10 hours of focused work.**

---

## Phase C — LLM-extracted semantic structure (next ceiling)

The longer-term ambition. ~3 days plus ~$30-50 in API costs (one-time,
cached). Builds on B's component slots — same `<QuestionFigure>`,
different data source.

### What changes

Instead of figures coming from PyMuPDF's drawing extraction, they come
from a Claude Vision (or GPT-4V) pass over each question's PDF region.

```
PDF page region (PNG)
        ↓
Claude Vision (one-time, cached per qid)
        ↓
Structured JSON:
{
  prompt_latex: "Hur lång är sträckan BC?",
  figure: {
    type: "geometry",
    primitives: [
      { kind: "polygon", points: ["A","B","C"], close: true },
      { kind: "label", at: "A", value: "A" },
      …
    ],
    points: { A: [0,0], B: [5,0], C: [3,4] },
    annotations: [
      { kind: "edge_length", edge: "AB", value: "5 cm" },
      { kind: "angle", at: "A", value: "v" }
    ]
  },
  options: [{ letter: "A", value_latex: "3\\text{ cm}" }, …],
  layer1_topics: ["geometry/triangle", "trigonometry/sine_rule"]
}
```

### Why this is the ceiling

1. **Semantic, not pixel.** Knowing "triangle ABC with vertices at
   (0,0), (5,0), (3,4)" is infinitely more powerful than knowing
   "these pixel paths form a triangle."
2. **Bespoke renderers per figure type.** A `<GeometryFigure>` knows
   what an angle marker should look like in dark mode at 2x. A
   `<CoordinateSystemFigure>` knows how to draw axes with labeled
   ticks. Style is intentional, not inherited from the PDF's 2014
   typesetter.
3. **Animation.** "Draw triangle ABC step by step. Now mark angle
   v. Now drop a perpendicular from C…" — the 3blue1brown
   construction-as-explanation pattern.
4. **Interaction.** Hover an option → related figure elements
   highlight. Drag a vertex → see how the answer changes.
5. **Variant generation.** Same triangle, different values. We can
   programmatically produce 10 variants of each question for SRS
   review without re-licensing PDFs.
6. **Layer 1 tagging for free.** Same Claude pass that extracts
   geometry can return the framework topic IDs for our pedagogical
   architecture (PRD §3, Layer 1).

### Architecture sketch

**Pipeline (`pipeline/quant_extract.py`):**

For each quant question:
1. Render PDF region to high-DPI PNG (2x or 3x)
2. Send to Claude Sonnet 4.6 with structured-output prompt:
   ```
   You are extracting a math problem from a PDF page region.
   Output a JSON object matching this schema: {…}
   …
   ```
3. Parse + validate JSON (use Zod or Pydantic for the schema)
4. Cache by qid in `data/extracted/{qid}.json`
5. Idempotent: if file exists, skip the API call

Rate limit: parallelism of ~5, batched ~50/min. ~30-60 min for the
full run on 1500 questions.

**Renderers (`app/src/components/figures/`):**

```
figures/
├── GeometryFigure.tsx        # triangles, polygons, angle marks
├── CoordinateSystemFigure.tsx # lines, points, regions in xy-plane
├── BarChartFigure.tsx
├── ScatterPlotFigure.tsx
├── TableFigure.tsx
└── index.tsx                  # discriminated union dispatch
```

Each renderer:
- Takes the structured spec as props
- Outputs SVG (or HTML for tables)
- Supports `theme: 'light' | 'dark'`, `interactive: boolean`,
  `animate: boolean` props
- Uses `currentColor` for theming (same primitives as B)

**Slot integration:**

`<QuestionFigure>` becomes a discriminated dispatcher:
- If question has `figure_spec` (from C) → render via spec
- Else if question has `figure.src` (from B) → render legacy SVG
- Else → no figure

Both paths coexist; C is opt-in per-question. Good migration story:
roll out C exam-by-exam as Claude extraction completes. Failed
extractions fall back to B.

### Risks and unknowns

- **LLM hallucination.** Claude might invent coordinates or
  miscount vertices on dense figures. Mitigation: validate
  geometrically (e.g., angles sum to 180° for triangles), require
  consistency checks in the schema, manual review for low-
  confidence outputs.
- **Cost overrun.** $30-50 estimate is for ~1500 questions × $0.02
  each. Vision tokens are pricier than text. Mitigation: batch
  small images, use Sonnet (not Opus), cache aggressively.
- **Schema drift.** As we add figure types we'll need to migrate
  cached extractions. Mitigation: version the schema; on schema
  bump, re-run only the affected questions.
- **PRD/legal.** Sending HP exam content to a third-party API.
  PRD §9.2 already flags HP material as legally fuzzy for third-
  party commercial use; sending images to Anthropic for processing
  is probably fine for the dogfood phase but should be revisited
  before public launch. Mitigation: keep extraction local-only for
  now, treat the cached JSONs as the artifact; reconsider before
  multi-user.

### Effort estimate

- Schema design + Pydantic/Zod: 4h
- Extraction pipeline + caching: 4h
- One renderer (`GeometryFigure`): 4h
- Validation + manual QA harness: 4h
- Remaining renderers (4 figure types): 12h
- Slot integration into `<QuestionFigure>`: 2h

**Total: ~3 days of focused work, plus 30-60min of API runtime, plus
$30-50 in API costs.**

---

## Sequencing

**Branch order:**

1. **`quant-vector`** (B) — vector-first hybrid pipeline. ~10h.
   Lands stacked-fraction reconstruction, vector-figure extraction,
   `<QuestionFigure>` component, KaTeX polish, filter cleanup. After
   this branch, ~95% of XYZ/KVA/NOG/DTK becomes drillable.
2. **`quant-extract`** (C, schema + pipeline + first renderer) —
   end-to-end on geometry only. Validates the architecture.
3. **`quant-extract-charts`** (C continued) — chart, scatter,
   table renderers as separate small branches.

After (1) we have a shippable, sleek, top-tier-quality quant
experience. (2)+(3) push it to "best-in-class" territory.

---

## What lives where

- **Code that implements this:** `parser/parse_figures.py`,
  `app/src/components/drill/QuestionFigure.tsx`,
  `app/src/components/figures/*` (eventually).
- **Extracted data:** `data/figures/*.svg` (B) and
  `data/extracted/*.json` (C). The latter is gitignored or stored
  in R2 once size grows.
- **This doc:** keep updated as the implementation lands. When B
  ships, mark §B as ✅ and link to the relevant commits. When C
  starts, sketch the prompt design here before the first run.

---

## Provenance

- **2026-05-08** — Initial doc, written after parser-quant shipped
  with text-only output and the dogfood user reported every
  XYZ/KVA question with a figure was unanswerable. Decision: ship
  B, then C.
