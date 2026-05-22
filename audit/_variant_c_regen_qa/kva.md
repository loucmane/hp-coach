# KVA regen QA — sample of 15

## Method

Recipe: `variant-c-regen-wave` on the KVA section. Population = 47 entries; randomly sampled 15 with `random.seed(42)` over `app/public/explanations/*.json`.

Sample qids (in sample order):

1. `var-2018-1-kvant2-KVA-022`
2. `host-2013-kvant2-KVA-020`
3. `host-2013-kvant1-KVA-014`
4. `host-2022-kvant2-KVA-016`
5. `host-2022-kvant2-KVA-014`
6. `host-2022-kvant2-KVA-013`
7. `host-2013-kvant2-KVA-021`
8. `host-2013-kvant1-KVA-022`
9. `var-2016-kvant2-KVA-016`
10. `host-2013-kvant1-KVA-020`
11. `var-2015-kvant2-KVA-014`
12. `host-2013-kvant1-KVA-016`
13. `var-2025-kvant2-KVA-018`
14. `var-2016-kvant2-KVA-020`
15. `host-2022-kvant1-KVA-022`

For each, I (a) read `prompt`/`options`/`answer` from `app/public/data/{exam_id}.json`, (b) computed Kvantitet I and II by hand and chose a letter independently, (c) compared my letter against the corpus `answer` and against the regenerated explanation's final letter, and (d) skimmed the 10+ step chain and `distractors[].why_wrong` for hand-waving, padding, or factually wrong claims.

KVA option mapping verified for all 15: A = I > II, B = II > I, C = lika, D = otillräcklig.

## Independent recomputation

| qid | My answer | Corpus answer | Explanation's terminal letter |
|---|---|---|---|
| var-2018-1-kvant2-KVA-022 | **B** (x=1, I=0,5 < II=1) | **A** | **A** (steps 10–11 explicitly note the contradiction and defer to facit) |
| host-2013-kvant2-KVA-020 | B (d ≈ 1,91 < 2) | B | B |
| host-2013-kvant1-KVA-014 | D (xy=zw doesn't fix xw vs yz) | D | D |
| host-2022-kvant2-KVA-016 | D (h₁, h₂ free) | D | D |
| host-2022-kvant2-KVA-014 | C (P(4)=P(10)=3/36) | C | C |
| host-2022-kvant2-KVA-013 | B (x=−6) | B | B |
| host-2013-kvant2-KVA-021 | C (both expand to xy+xz+x²+yz) | C | C |
| host-2013-kvant1-KVA-022 | A (0<x<1 ⇒ x>x²) | A | A |
| var-2016-kvant2-KVA-016 | C (10 svarta = 10 röda kvar) | C | C |
| host-2013-kvant1-KVA-020 | D (term count free under fixed sum) | D | D |
| var-2015-kvant2-KVA-014 | D (v ∈ [10,40]) | D | D |
| host-2013-kvant1-KVA-016 | D (y sign free) | D | D |
| var-2025-kvant2-KVA-018 | A (positiv rot = 3 > 2) | A | A |
| var-2016-kvant2-KVA-020 | A (E≥0 ⇒ D≥5) | A | A |
| host-2022-kvant1-KVA-022 | C (y = 2x/21 = II) | C | C |

14 of 15: my computation, the corpus answer, and the regenerated explanation's final letter all agree.

1 of 15 is the pre-flagged `var-2018-1-kvant2-KVA-022`. The math in the regen is correct (`5·9=45 ⇒ 45^x=45 ⇒ x=1`, so I=0,5 and II=1, i.e. **B**). The explanation says so in steps 9–10, then in step 11 explicitly declares "Logiskt: I = 0,5, II = 1, alltså II > I, vilket är B. Facit säger A" and capitulates to A "(kvantiteterna kan ha varit förväxlade i originalskanningen)". This is a corpus-level facit/scan disagreement, not a generation error — and the regen surfaces it transparently rather than hallucinating around it. See the project memory's `dataset_version_skew` note: the policy is don't override answers when this surfaces.

## Issues

### Severity: blocker (math wrong, lands on wrong letter)

None. Zero math errors and zero cases where the explanation's reasoning silently produces the wrong letter.

`var-2018-1-kvant2-KVA-022` is NOT a blocker on the regen — the explanation's math is right and the entry self-flags the facit disagreement in steps 10–12 and in the `solution_path` ("Svar B... Nej: facit skär att svaret är A"). This is a corpus-level decision: either the registered answer is wrong, or the question text (`5 · 9 = 45^{x}` with Kvantitet I = 0,5 and Kvantitet II = x) has its quantities swapped in the parser output. Worth investigating upstream — but it is correctly out of scope for "is the regen correct".

### Severity: weak (reasoning hand-wavy or step jumps; rendering artifacts)

The single recurring weakness is a **template-leak rendering artifact**, not a reasoning failure:

- **Stray `{m('...')}` Python-template fragments in rendered text**. The recipe appears to have a Jinja/f-string helper named `m(...)` for wrapping math, but in many entries the helper call was emitted *literally* into the final string instead of being evaluated. Frequencies among the sample:

  | qid | count of `{m('...')}` leaks |
  |---|---|
  | `host-2013-kvant2-KVA-020` | 11 |
  | `host-2013-kvant1-KVA-014` | 14 |
  | `host-2013-kvant1-KVA-022` | 10 |
  | `host-2022-kvant1-KVA-022` | 11 |
  | `host-2013-kvant1-KVA-016` | 4 |
  | `host-2022-kvant2-KVA-014` | 2 |
  | `host-2022-kvant2-KVA-013` | 2 |
  | `host-2013-kvant1-KVA-020` | 2 |
  | `host-2013-kvant2-KVA-021` | 1 |

  Concrete examples:

  - `host-2013-kvant2-KVA-020` distractor A: `Som steg 4-5 visar är omkretsen {m('\pi d')}, inte d; diametern är {m('6/\pi \approx 1{,}91 < 2')}.`
  - `host-2013-kvant1-KVA-014` distractor A: `…giltiga val ({m('x=2,y=10,z=10,w=2')}) där {m('xw = 4 < 100 = yz')}.`
  - `host-2022-kvant1-KVA-022` PITFALL: `…skriv noggrant ut {m('\frac{täljare}{nämnare} = k \Rightarrow täljare = k \cdot nämnare')}. Här är täljaren {m('2x')} (inte {m('3y')}), så det är {m('2x')} som blir {m('21y')}.`

  These will render literally in the student-facing UI ("`{m('\pi d')}`") wherever the field is rendered as plain text or markdown — KaTeX won't catch them because they aren't `$…$` or `\(…\)`. 9/15 sampled entries are affected, so the prevalence across the full 47 regen wave is almost certainly comparable.

Other lesser observations:

- `host-2013-kvant2-KVA-020` distractor C `why_wrong`: C is "I = II" but the rebuttal is "approximationen π ≈ 3 är för grov här" — that doesn't actually refute "I = II"; it refutes a coarseness-of-π reading. The math (d ≈ 1,91) is correct; the distractor framing is slightly indirect but not wrong.
- `host-2022-kvant2-KVA-013` distractor A `why_wrong` is grammatically tangled ("vänster led har FÄRRE x än höger led, så när vi subtraherar 2x från båda sidor blir koefficienten på x = +1") — accurate but harder to parse than necessary.
- `var-2016-kvant2-KVA-016` distractor B `why_wrong` just restates "båda sannolikheter är 10/28 exakt" — terse but correct.

### Severity: clean

**14 / 15** sampled entries have correct math, correct final letter, coherent 10+ step argument that actually progresses (no padding-then-jumping), and `why_wrong` rebuttals that say something true about each distractor.

The 15th (`var-2018-1-kvant2-KVA-022`) has correct math and a coherent argument; its disagreement with the corpus is honest and pre-flagged, not a generation defect.

## Patterns

1. **Math is reliable.** Across 15 problems (algebra, probability, geometry, age-puzzles, factored quadratics, polynomial expansion, sign analysis, two-way tables, fractional equations) the regen got the math right every time, including subtle implicit constraints (E ≥ 0 in the age problem, 0 ≤ v ≤ min(60,40) in the left-handed-boys table). No arithmetic slips, no sign errors, no over-claiming determinism on truly D problems.

2. **Step structure is sound.** 11–13 steps per entry. Steps are short, sequential, and each adds an actual move (definition, distribution, case split, test value, verification, conclusion). I did not find padding stretches or jumps from definition straight to the answer. The "verify by plugging in" step and the "Insikten i en mening" closer appear consistently.

3. **Distractor coverage is complete.** Every entry has exactly the three non-answer letters in `distractors`, and every `why_wrong` cites a specific earlier step ("Steg 6 visar…") — the cross-referencing is genuine, not boilerplate.

4. **One material defect: the `{m('...')}` template-leak.** Affects 9/15 sampled entries (≈60%), with up to 14 occurrences each. The pattern is `{m('<latex>')}` where `<latex>` is the math expression that should have been wrapped/escaped. Most likely the regen prompt or post-processor was supposed to evaluate `m(...)` to (e.g.) `$\pi d$` or `\(\pi d\)` but the call survived into the output verbatim. This is a single recipe-level bug — fixing the post-processor (or just running a regex pass `\{m\('([^']*)'\)\}` → `$\1$` / `\(\1\)`) would clean the whole wave at once. Verifying the same regex on the remaining 32 unaudited regen entries before any rerun is recommended.

5. **The flagged `var-2018-1-kvant2-KVA-022` case is corpus-side, not regen-side.** The regen does the responsible thing: shows its work, surfaces the disagreement, defers to facit, and stays under 12 steps. Upstream action item: re-parse the original PDF to confirm whether Kvantitet I/II are swapped in the parser output or the facit answer is itself wrong. Until then, the regen entry is honest and shippable.

## Recommendation

- **Do not block the wave on math grounds.** 14/15 clean, 0/15 with wrong final letter.
- **Block the wave on rendering until the `{m('...')}` leak is fixed.** A single global regex-replace over all 47 regenerated KVA entries (and any other section that used the same recipe) is enough; no regeneration needed if the underlying LaTeX inside the leaked calls is intact (it is, in every example I inspected).
- **File a separate corpus ticket for `var-2018-1-kvant2-KVA-022`** to investigate Kvantitet I/II swap vs facit error. The regen entry can ship as-is once the rendering bug is fixed.
