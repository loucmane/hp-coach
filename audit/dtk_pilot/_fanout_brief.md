# DTK fan-out brief — Option C (facit-anchored Variant-C)

## Context

You are authoring DTK explanations for the HP-Coach corpus. The voice
is **Variant-C ultra-granular** (read `audit/_explanation_recipes.md`
for the full voice description) adapted for DTK with **Option C
framing** — facit-anchored explanations.

DTK is the data-interpretation section of the Swedish högskoleprov:
diagrams, tables, maps. Questions reference a figure that the user
sees alongside the prompt + options.

## The data source is the facit, not your reading of the figure

The figure is the medium the **user** reads through to arrive at the
facit's value. Your job is to teach the reading recipe such that
the user lands on the facit's answer.

**Concretely:**
1. Take the facit-indicated option text as ground truth. UHR published
   this answer key — it is authoritative.
2. Read the figure to roughly confirm the facit's value is visually
   consistent (you may need 4× zoom; gridlines and tick labels are now
   readable, not just estimable).
3. Teach the user how to read the chart so they arrive at the facit's
   value via gridline-anchored reading.
4. Cite the facit explicitly when stating numerical values: "facit
   fastslår 1/3" or "enligt facit är 1982 svaret."

## DO write

- "Den ljusgrå rutan i 1982 har bredden ungefär 1/3 av stapeln — du
  kan verifiera detta genom att projicera kanterna mot procent-axelns
  printade tick-värden (0, 20, 40, 60, 80, 100)."
- "Facit fastslår att svaret är 1/3 (ca 33 %). Det är konsistent med
  en visuell avläsning där rutan spänner från strax under 30 % till
  strax under 60 %."
- "Skillnaden 1987→2007 är enligt facit 35 procentenheter."

## DO NOT write

- "Rutan börjar vid 25 % och slutar vid 58 %" — pixel estimate as fact.
- "Din exakta avläsning kan variera, det viktiga är att den ligger
  närmast 1/3" — we know it's 1/3, say so.

## Printed-numbers-first sub-rule

Many DTK figures have data labels printed ON the chart — numbers next
to bars, percentages in legend keys, table cells, axis tick labels.
**First identify any printed numbers and treat those as authoritative.**
Visual estimates are a last resort. If the chart is purely visual
(just colored rectangles with no printed values inside), say so and
rely on the facit + gridline anchors. Tables and maps almost always
have printed values; bar/line/pie charts vary.

## Question typing (auto-detect per question)

- **Type 1** (vad var värdet av X?): facit gives a value. Use it. Teach
  where to look on the chart to confirm.
- **Type 2** (vilket år hade störst skillnad?): facit gives a year/
  category. State why this is correct via visual ranking. May not have
  a single value to cite — Option B fallback (teach the comparison
  strategy).
- **Type 3** (vilket påstående stämmer?): facit gives a textual claim.
  Verify the claim holds against the chart's printed numbers + visual
  gross structure.
- **Type 4** (hur många procent ökade Z?): facit gives a value. Use it.
  Teach the start-value and end-value reading.
- **Type 5** (vilket alternativ beskriver bäst...?): facit gives a
  description. Verify via printed values + visual confirmation.

## Distractor framing

Each wrong-answer letter describes a READING MISTAKE + ties back to
the facit:

> "Om du av misstag mäter sandborstmaskens (VITA) ruta istället för
> fåborstmaskens (LJUSGRÅ), hamnar du nära 1/4 — men facit fastslår
> 1/3, alltså fåborstmasken."

Empathy opener first (Variant-C voice), then the misread mechanism,
then the facit-grounded correction. Cross-reference step numbers
where the trap would have been caught: "Som steg 3 betonar…"

## Conclusion framing — be confident

> "Facit bekräftar: svaret är A (1/3). Insikten i en mening: i staplade
> andelsdiagram = legenden först, rätt stapel sedan, mät bredden mot
> gridlinjerna sist."

NOT "if your reading lands near 1/3" — we know it's 1/3.

## Step structure (10+ steps, mix essential + detail tiers)

A typical DTK step sequence:
1. Förstå frågan (what's being asked, what format is the answer in;
   STATE the facit value explicitly)
2. Orientera dig i diagrammet (what's on each axis, what units, vad
   är staplarna; identify what's printed vs what isn't)
3. Läs legenden (which color/pattern is which category)
4. Hitta rätt stapel/kategori
5. Hitta rätt ruta/cell/punkt
6. Use printed numbers OR project to gridlines
7. Vad betyder N i denna kontext? (first-principles term defining,
   Variant-C signature)
8. Översätt mätningen till svarsformatet (% → bråk, etc.)
9. Sanity-check mot grannar / andra år
10. Plocka närmaste svarsalternativ
11. Slutsats med facit-bekräftelse

Each step gets `n`, `title`, `text`, `tier` ("essential" | "detail").

## Schema requirements

Top-level fields per explanation: `_meta`, `distractors`,
`framework_id`, `pitfall`, `pregrade_tactic`, `solution_path`,
`steps`, `technique`.

- `_meta.generated_at = "2026-05-17"`
- `_meta.model = "claude-opus-4-7"`
- `_meta.recipe = "variant-c-ultra-granular"`
- `framework_id = null`
- `pregrade_tactic = {handle: "Short-kebab-case-name", move: "~25-40
  word ADHD-friendly nudge that hints at strategy without giving away
  the answer"}`
- `distractors[]`: array for the THREE wrong-answer letters; each has
  `letter`, `why_tempting`, `why_wrong`.
- `steps[]`: 10+ steps minimum.
- `pitfall`: 2-3 sentence "klassiska DTK-fällan + botemedlet" pattern.
- `technique`: 2-3 sentence naming the strategy + actionable trigger.
- `solution_path`: 2-4 sentence summary of the reading recipe,
  citing the facit value explicitly.

All Swedish, except domain terms (DTK, kvantpass).

## Reference samples (read these for voice calibration)

- v3 pilot: `audit/dtk_pilot/host-2024-kvant1-pilot-v3.json` — 3
  examples on host-2024 figure (Havsbottenfaunan vid Gotlands ostkust).
- Existing KVA/NOG explanations in `data/explanations/host-2024.json`
  — same voice, same schema, different section. Look at any
  `host-2024-kvant1-KVA-*` or `host-2024-kvant1-NOG-*` entry.

## Pre-2019 layout note

Older exams (`host-2013` through `var-2018-1`) have DTK figure pages
in landscape orientation with content stored sideways in the PDF. The
rendered JPEGs come out with content upright — but the page-binding-
edge metadata text ("DELPROV DTK – DIAGRAM, TABELLER OCH KARTOR")
runs vertically along one edge. That's normal. Ignore it.
