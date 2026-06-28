# Quant Figure Audit

Audit of 214 extracted quant figures (KVA / XYZ / NOG across the host- and var- exam corpus). Each figure was given a **verdict** (quality of the render) and an **action** (what to do in the pipeline).

## Summary counts

**Total judged:** 214

### By verdict

| Verdict | Count |
|---|---|
| good | 173 |
| empty | 20 |
| junk-fragment | 10 |
| garbled | 10 |
| (mismatched figure, quality OK) | 1 |

> Note: 4 figures (`host-2017-kvant2-XYZ-006`, `host-2020-kvant1-KVA-016`, `var-2017-kvant1-XYZ-004`, `var-2018-1-kvant1-XYZ-012`) carry a `good` quality verdict but a `suppress-figure` action — the render is clean, but the figure belongs to a different (self-contained) question and is irrelevant/misleading, so it is hidden. One of those entries was labeled with a bare `suppress` verdict in the source data.

### By action

| Action | Count |
|---|---|
| keep | 170 |
| suppress-figure | 32 |
| reextract | 8 |
| exclude-question | 4 |

## Broken figures (every non-`keep` figure)

| qid | verdict | action | reason |
|---|---|---|---|
| host-2013-kvant1-KVA-017 | empty | reextract | Compares slopes k1/k2 of L1 and L2, but only L1 is drawn; L2 absent. Load-bearing and incomplete. |
| host-2014-kvant1-XYZ-006 | empty | exclude-question | Best-fit-line question but figure shows bare axes with NO data points. Points are load-bearing. |
| host-2015-kvant1-XYZ-012 | junk-fragment | suppress-figure | Stray page fragment of a different question (6/√2); prompt already has the full equation. |
| host-2017-kvant2-XYZ-006 | suppress | suppress-figure | Clean triangle ABC, but prompt is pure number theory; mismatched/irrelevant figure. |
| host-2018-kvant1-KVA-017 | garbled | reextract | Rectangle ABCD renders as solid black block; the shaded sub-region (load-bearing) is lost in the fill. |
| host-2020-kvant1-KVA-016 | good (mismatch) | suppress-figure | Rectangle figure does not match prompt (self-contained linear equation -7(x+3)=21). |
| host-2021-kvant1-XYZ-008 | junk-fragment | suppress-figure | Pure probability question; attached figure is the unrelated parabola carried over from XYZ-007. |
| host-2021-kvant1-XYZ-012 | empty | suppress-figure | Rectangle not drawn (grid + ink blob), but prompt fully specifies all four corners. |
| host-2023-kvant2-XYZ-011 | empty | suppress-figure | Empty grid; prompt fully describes every ant move. Not load-bearing. |
| host-2023-kvant2-XYZ-012 | empty | suppress-figure | Empty grid used as scratch workspace; radical question answerable from text+options. |
| host-2024-kvant2-XYZ-006 | empty | suppress-figure | Empty grid; both lines given explicitly (y=x+2, y=x-2), answerable algebraically. |
| host-2025-kvant1-XYZ-008 | empty | suppress-figure | Empty grid; line L fully specified algebraically. Scratch workspace. |
| host-2025-kvant2-XYZ-008 | garbled | exclude-question | Graph-choice question whose options are figures; extract is a melted black blob, load-bearing. |
| host-ver1-2019-kvant1-KVA-020 | empty | suppress-figure | Blank grid; both lines fully defined in prompt. |
| host-ver1-2019-kvant1-XYZ-010 | junk-fragment | suppress-figure | Duplicate of XYZ-009 two-circles image; prompt is a self-contained word problem. |
| host-ver1-2019-kvant2-XYZ-010 | junk-fragment | suppress-figure | Mismatched ratio expressions from another question; powers-of-10 prompt is self-contained. |
| host-ver2-2019-kvant1-XYZ-010 | junk-fragment | suppress-figure | Duplicate of XYZ-009 two-circles image; algebraic simplification prompt is self-contained. |
| host-ver2-2019-kvant2-XYZ-010 | junk-fragment | suppress-figure | Stray answer-option ratios, not a question figure; powers-of-10 prompt is self-contained. |
| var-2015-kvant2-KVA-020 | garbled | suppress-figure | Renders square-root expressions that don't match the prompt's plain fractions; mangled and wrong. |
| var-2016-kvant1-KVA-013 | garbled | suppress-figure | Square ABCD is solid black fill; point E not visible. Prompt fully states the setup. |
| var-2016-kvant1-XYZ-004 | garbled | suppress-figure | Wrong figure (three-rectangles diagram); prompt is pure arithmetic 1002^3. |
| var-2016-kvant1-XYZ-008 | empty | reextract | Stolpdiagram plot area is solid black; bar heights (needed for the median) are lost. |
| var-2016-kvant1-XYZ-012 | garbled | suppress-figure | Wrong figure (triangle-in-circle); prompt is a pure linear-system algebra question. |
| var-2016-kvant2-XYZ-004 | garbled | suppress-figure | Wrong figure (four line-graphs); prompt is pure expression-summing algebra. |
| var-2016-kvant2-XYZ-006 | garbled | suppress-figure | Wrong figure (fraction blobs / leaked options); prompt is pure parity number theory. |
| var-2017-kvant1-XYZ-004 | good (mismatch) | suppress-figure | L1/L2 geometry leaked from question 003; prompt 3x-15=21-5x is self-contained. |
| var-2017-kvant2-XYZ-006 | empty | suppress-figure | Blank grid (scratch); pure algebra a^2=7 -> (3a)^2, answerable from text. |
| var-2018-1-kvant1-XYZ-011 | empty | reextract | Needs TWO similar parallelograms; only ONE drawn plus a stray 'c'. Load-bearing and incomplete. |
| var-2018-1-kvant1-XYZ-012 | good (mismatch) | suppress-figure | Two parallelograms leaked from XYZ-011; prompt is pure number theory. |
| var-2018-1-kvant2-KVA-018 | empty | reextract | Compares f(4) vs g(3); only ONE line (f) drawn, g absent. Load-bearing and incomplete. |
| var-2019-kvant1-XYZ-002 | junk-fragment | suppress-figure | Only 'Steg 1/2/3/4' labels, no equations; steps are in the prompt text. |
| var-2019-kvant2-KVA-019 | garbled | reextract | Rectangle ABCD solid black; semicircle arcs and shaded region (load-bearing) obscured. |
| var-2022-1-kvant1-KVA-013 | empty | reextract | Compares rectangle vs triangle perimeter; only the rectangle drawn, triangle missing. |
| var-2022-1-kvant1-XYZ-005 | junk-fragment | suppress-figure | Partial open path, not the closed pentagon; prompt's parenthetical lists all sides. |
| var-2022-1-kvant1-XYZ-007 | empty | suppress-figure | Empty grid; line defined analytically by f(2)=4, f(3)=1. |
| var-2022-1-kvant1-XYZ-008 | empty | suppress-figure | Empty grid; pure equation x/3+x/4=x-2 fully stated. |
| var-2022-1-kvant2-KVA-014 | empty | suppress-figure | Empty grid; all four point coordinates given explicitly. |
| var-2023-kvant1-KVA-015 | empty | suppress-figure | Empty grid; quadrilateral ABCD vertex coordinates all listed in prompt. |
| var-2023-kvant1-KVA-016 | empty | suppress-figure | Blank grid irrelevant to a pure fraction comparison. |
| var-2024-kvant1-XYZ-006 | empty | exclude-question | Only a single ray + stray '12'; angle x and any reference angle absent. Load-bearing missing. |
| var-2024-kvant1-XYZ-008 | junk-fragment | suppress-figure | Wrong figure (P/Q/R/S quadrant points); box-packing prompt gives all dimensions. |
| var-2024-kvant2-KVA-014 | empty | exclude-question | Hexagon with NO shading rendered; question compares shaded vs unshaded proportion. Load-bearing missing. |
| var-2025-kvant1-XYZ-012 | garbled | reextract | Three circles render as black blobs; shaded ('skuggade') regions not legibly shown. |
| var-2026-kvant2-XYZ-002 | junk-fragment | suppress-figure | Only 'Steg 1/2/3/4' labels, no equations; full four-step solution is in the prompt. |

## Action lists

### suppressList — hide the figure, prompt carries the content (32)

`host-2015-kvant1-XYZ-012`, `host-2017-kvant2-XYZ-006`, `host-2020-kvant1-KVA-016`, `host-2021-kvant1-XYZ-008`, `host-2021-kvant1-XYZ-012`, `host-2023-kvant2-XYZ-011`, `host-2023-kvant2-XYZ-012`, `host-2024-kvant2-XYZ-006`, `host-2025-kvant1-XYZ-008`, `host-ver1-2019-kvant1-KVA-020`, `host-ver1-2019-kvant1-XYZ-010`, `host-ver1-2019-kvant2-XYZ-010`, `host-ver2-2019-kvant1-XYZ-010`, `host-ver2-2019-kvant2-XYZ-010`, `var-2015-kvant2-KVA-020`, `var-2016-kvant1-KVA-013`, `var-2016-kvant1-XYZ-004`, `var-2016-kvant1-XYZ-012`, `var-2016-kvant2-XYZ-004`, `var-2016-kvant2-XYZ-006`, `var-2017-kvant1-XYZ-004`, `var-2017-kvant2-XYZ-006`, `var-2018-1-kvant1-XYZ-012`, `var-2019-kvant1-XYZ-002`, `var-2022-1-kvant1-XYZ-005`, `var-2022-1-kvant1-XYZ-007`, `var-2022-1-kvant1-XYZ-008`, `var-2022-1-kvant2-KVA-014`, `var-2023-kvant1-KVA-015`, `var-2023-kvant1-KVA-016`, `var-2024-kvant1-XYZ-008`, `var-2026-kvant2-XYZ-002`

### excludeList — drop the question from the drillable pool (4)

`host-2014-kvant1-XYZ-006`, `host-2025-kvant2-XYZ-008`, `var-2024-kvant1-XYZ-006`, `var-2024-kvant2-KVA-014`

### reextractList — figure is load-bearing and broken; re-extract (8)

`host-2013-kvant1-KVA-017`, `host-2018-kvant1-KVA-017`, `var-2016-kvant1-XYZ-008`, `var-2018-1-kvant1-XYZ-011`, `var-2018-1-kvant2-KVA-018`, `var-2019-kvant2-KVA-019`, `var-2022-1-kvant1-KVA-013`, `var-2025-kvant1-XYZ-012`

## Remediation recommendation

Ship the **suppressList** first: it is the largest bucket (32 questions), zero-risk, and immediately corrects the most user-visible defect — questions that render a wrong, leaked, or empty figure even though the prompt is fully self-contained. Hiding those figures makes 32 questions correctly drillable with a one-line per-qid suppression flag and no content regeneration. Next, apply the **excludeList** (4 questions) so the unanswerable graph-/data-dependent items never reach a student. Defer the **reextractList** (8 questions) to a follow-up pass: these need real figure regeneration (better fill handling on solid-black renders, completing partial multi-object figures), which is slower and should be validated visually before re-enabling. Net effect of the first two cheap steps: 36 of 41 broken figures resolved without touching the extraction pipeline.
