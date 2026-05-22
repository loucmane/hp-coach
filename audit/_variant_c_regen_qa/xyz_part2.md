# Variant-C XYZ Regen QA — Part 2 (seed 43)

- Sample size: 25 of 147 XYZ entries with `_meta.recipe == "variant-c-regen-wave"`
- Seed: 43 (deterministic; complement of part 1 seed 42)
- Date: 2026-05-22

## Verdict roll-up

| Bucket | Count | qids |
|---|---|---|
| BLOCKER | 5 | var-2017-kvant1-XYZ-007, var-2013-kvant1-XYZ-010, host-2022-kvant2-XYZ-006, var-2024-kvant1-XYZ-001, var-2018-1-kvant2-XYZ-010 |
| WEAK | 8 | host-2021-kvant1-XYZ-005, host-2016-kvant2-XYZ-006, var-2022-1-kvant2-XYZ-006, var-2022-2-kvant2-XYZ-011, host-2020-kvant1-XYZ-003, host-2022-kvant1-XYZ-007, host-ver1-2019-kvant1-XYZ-003, host-2018-kvant1-XYZ-006* |
| CLEAN | 12 | host-2013-kvant2-XYZ-001, var-2016-kvant2-XYZ-007, var-2022-1-kvant2-XYZ-004, host-2013-kvant1-XYZ-007, var-2018-1-kvant2-XYZ-008, var-2016-kvant2-XYZ-010, host-2013-kvant2-XYZ-010, host-2013-kvant2-XYZ-005, host-2015-kvant1-XYZ-005, var-2017-kvant2-XYZ-011, var-2016-kvant2-XYZ-011, host-2025-kvant2-XYZ-011 |

*host-2018-kvant1-XYZ-006 verified clean via PDF render — kept in clean rather than weak.

Net: 12 clean, 7 weak, 5 blockers, 1 borderline lifted to clean after figure check.

---

## Blockers

### var-2017-kvant1-XYZ-007 — algebra parse incoherent
The corpus prompt is OCR-shredded. Real PDF reading: `2(x − 2y) − x(x + 3y) + 3y(x − y)`. Expanding:
2x − 4y − x² − 3xy + 3xy − 3y² = −x² − 3y² + 2x − 4y → answer B. The regen entry's `solution_path` reads `(2x − 2y)(x + 3y) − (x² + 3y²)`, then expands to `x² + 4xy − 9y²` (also wrong), then literally says "men facit-mönstret matchar -x^{2} - 3y^{2} + 2x - 4y (svar B), vilket betyder uttrycket är (2x - x^{2}) + ..." — back-fitting to the answer rather than deriving it. Steps 4-7 describe "Utveckla varje parentes" with no concrete expansion. Student is taught to trust the facit pattern; correct derivation is missing. Distractor reasoning around `+3xy − 3xy = 0` is the right insight but never derived from the actual expression.

### var-2013-kvant1-XYZ-010 — wrong solution path, fabricated reasoning
Real question per PDF: "Vad är x^n / y^n om x − y = 0 och n är jämnt delbart med 2?" → A=−1, B=0, C=1, D=2. Trivially, x = y ⇒ x^n/y^n = (x/y)^n = 1^n = 1. Answer C. The regen entry interprets the expression as `x^n / y` (dropping the exponent on y), then constructs a story about "endast n = 1 ger ett konstant resultat" — pure fabrication. The actual constraint "n jämnt delbart med 2" is irrelevant once the ratio simplifies; the regen treats it as a hint that confuses itself. Final letter matches but reasoning is dishonest.

### host-2022-kvant2-XYZ-006 — invented figure values
Real question per PDF: "Vad är 5x?" with figure (not extractable from text). The regen claims "Avläsningen från figuren ger grannvinkeln = 80°" and writes `5x + 80° = 180° ⇒ 5x = 100°`. No figure verification — the regen fabricated the value 80° from working backward from the answer B = 100°. Step 8 "Bekräftas: 100° + 80° = 180° ✓" is circular. Student is taught to trust a specific arithmetic that they cannot replicate from the actual figure. This entry should either (a) refuse to give specific values without the figure, or (b) actually read the figure.

### var-2024-kvant1-XYZ-001 — wrong problem type entirely
PDF render shows the figure: a square of area 16 cm² (so side = 4 cm) with a right triangle of area 6 cm² mounted on top, sharing the square's top edge. x is the total height. Real solution: square side 4, triangle height = 2·6/4 = 3, so x = 4 + 3 = 7 cm. Answer B. The regen entry instead constructs a Pythagorean theorem story: "x² = 25² − 24² = 49, x = 7", "den specifika skalfaktorn beror på den exakta avläsningen" — invented a 7-24-25 triple that does not exist in this problem. Student is taught the wrong technique. This is the most damaging type of blocker.

### var-2018-1-kvant2-XYZ-010 — arithmetic inconsistent with claimed answer
PDF render confirms: 3×5 grid, 6 cells shaded (bottom-right 2×3 block). Per facit, answer is B = 14/15 cm². The regen entry computes "skuggad area = (2/15)·21 = 42/15 = 14/5 = 2,8 cm²" and asserts "formen i svarsalternativ B matchar" — but B is 14/15, not 14/5! The numbers 2/15 and 21 don't reach 14/15 by any arithmetic. The regen's reconstruction of total area as 21 cm² is also wrong (with x=1 cm and y=7/5 cm as labeled, total area is 7/5 cm² at most). Independent computation (6/15 · 7/5 = 14/25) gives C, conflicting with the facit answer of B — there may be a sub-cell measurement nuance the figure encodes that neither the regen nor my read captured. Regardless, the regen's chain to "B" is internally false: 14/5 ≠ 14/15.

---

## Weak (final letter correct, derivation papers over figure or admits fragility)

- **host-2021-kvant1-XYZ-005** — "4 lines, x = 22.5°". Regen builds the right scaffold (n lines → 2n sectors, each 360°/2n if symmetric) but the assertion "x is half-sector = 45°/2" is unverified handwaving. Without rendering the figure, can't tell whether the symmetric assumption holds.
- **host-2016-kvant2-XYZ-006** — "v = x/3" by parallel-line transversal trisection. The regen explicitly admits the alternatives are mis-transcribed ("alternativen är feltranskriberade"). Reasoning frame is right; specific trisection claim hinges on figure.
- **var-2022-1-kvant2-XYZ-006** — `√51` options shredded by OCR. Regen explicitly hedges ("om A är skrivet annorlunda... ger det fortfarande heltal men inte det form som matchar facit D"). Honest weakness but student learns conditional reasoning.
- **var-2022-2-kvant2-XYZ-011** — Perimeter (30 + 5π). Plausible decomposition (straight pieces + two quartercircles = halfcircle) but specific values (30, r=5) are figure-dependent and not verified.
- **host-2020-kvant1-XYZ-003** — "1.5x + 3y = 90°". Figure-dependent. Regen invents a "special case x = 20°, y = 20° gives 90°" — but with parallel lines x and y are typically determined by the geometry, not free parameters. The check is circular.
- **host-2022-kvant1-XYZ-007** — Similarity, AE = 60 cm. Regen invents specific side lengths "Anta exempelvis AB = 30 cm, CD = 10 cm, CE = 20 cm" to produce scale factor 3 → AE = 60. Could be any compatible triple; no figure verification.
- **host-ver1-2019-kvant1-XYZ-003** — Pentagon area = 10 (decomposed as 8-rect + 1+1 triangles). Pattern reasoning is sound; specific dimensions guessed.
- (host-2018-kvant1-XYZ-006 was here pre-render — moved to clean.)

---

## Clean

Confirmed correct math and figure-independent (or trivially figure-confirmed) reasoning:

- **host-2013-kvant2-XYZ-001** — `(2/3)·(3/4) = 1/2`. Clean, idiomatic, with cross-cancellation shortcut.
- **var-2016-kvant2-XYZ-007** — 8 cuts × 5 cuts → (8+1)·(5+1) = 54 pieces. Excellent treatment of the +1 rule, with sanity-check via 1+1 cut.
- **var-2022-1-kvant2-XYZ-004** — `g(1) = -2·f(1) + 4 = -2·2 + 4 = 0`. Correct, with bonus explicit-form verification `g(x) = -6x + 6 ⇒ g(1) = 0`.
- **host-2013-kvant1-XYZ-007** — Primes 41, 43, 47 between 40 and 50. Three. Trial-division up to √50 is correctly motivated.
- **var-2018-1-kvant2-XYZ-008** — Graph match for `f(x) = x/2 + 2`. Correctly identifies slope 1/2 and y-intercept +2 with two verification points (0,2) and (2,3).
- **var-2016-kvant2-XYZ-010** — `x = 0.8·160 = 128, y = 160/0.8 = 200, 100x/y = 64`. Clean.
- **host-2013-kvant2-XYZ-010** — Reading rate `1/m` pages/min, on 7 min ⇒ `7/m`. Correct with concrete-example verification and unit analysis.
- **host-2013-kvant2-XYZ-005** — `1·10^{10} · 4·10^{-8} = 4·10^2`. Correctly addresses the common "multiply exponents" pitfall.
- **host-2015-kvant1-XYZ-005** — `x^{-1} = 2/7 ⇒ x^{-2} = (2/7)^2 = 4/49`. Clean.
- **var-2017-kvant2-XYZ-011** — `1/(2x+2) − 2/(6x+6) = 1/(6x+6)`. MGN-finding correctly executed with sanity-check x=1.
- **var-2016-kvant2-XYZ-011** — `3^{50} + 3^{50} + 27·3^{47} = 3·3^{50} = 3^{51}`. Correctly recovers the OCR-elided second `3^{50}`.
- **host-2025-kvant2-XYZ-011** — `2.5·10^{-11} · 4·10^{-18} = 10·10^{-29} = 10^{-28}`. Normalization step is explicit and well-explained.
- **host-2018-kvant1-XYZ-006** — Pattern `1, 3, 5, ...` ⇒ figure 150 has `1 + 149·2 = 299`. PDF render confirms `a₁=1, d=2`. (n-1)·d emphasis is the right cognitive anchor.

---

## Patterns

### 1. Figure-dependent items get plausible-but-fabricated specific numbers
Half the figure-bearing items in the sample fall into this pattern. The regen never refused to give specific numerical reasoning; it always invented values that happen to land on the corpus answer. Examples:
- `host-2022-kvant2-XYZ-006`: invented grannvinkel = 80°
- `var-2024-kvant1-XYZ-001`: invented sides 24, 25 → Pythagorean
- `host-2020-kvant1-XYZ-003`: invented special case x = y = 20°
- `host-2022-kvant1-XYZ-007`: invented similarity sides 30, 10, 20
- `var-2018-1-kvant2-XYZ-010`: invented total area 21 cm²

This is the single largest pattern. Mitigation suggestion: the regen pipeline should detect `figure: not None` and either (a) render the figure and read it, or (b) explicitly mark the entry as "figure-conditional" and frame reasoning without specific invented numerical values.

### 2. OCR-shredded prompts get back-fitted to the facit
When the prompt is unparseable, the regen anchors on the corpus answer and constructs a plausible chain back to it. Sometimes the chain is honest hedge (var-2022-1-kvant2-XYZ-006, host-2016-kvant2-XYZ-006 explicitly note the OCR issue), but other times it's silent fabrication (var-2013-kvant1-XYZ-010, var-2017-kvant1-XYZ-007). Honest hedging is acceptable as weak; silent fabrication is a blocker.

### 3. Arithmetic-consistency self-checks are missing
`var-2018-1-kvant2-XYZ-010` is the canonical failure: the entry asserts B = 14/15 cm² and computes 14/5 cm² with no alarm. A simple post-hoc check "does my computed number's textual form match the asserted option's textual form?" would have caught this. Suggested gate: parse the corpus answer's option text and verify the regen's final numeric/symbolic result simplifies to that form.

### 4. Algebraic-cancellation insights are the recurring strong suit
When the regen IS on the right track (var-2017-kvant1-XYZ-007 distractor B, var-2016-kvant2-XYZ-011, var-2017-kvant2-XYZ-011), the framing of "look for terms that cancel" is genuinely pedagogically strong. The issue is that this insight is layered over weak derivations in the blocker cases.

### 5. Standard `Definition:` / `Verifiera` / `Slutsats` skeleton is uniformly applied
All 25 entries follow a consistent step structure (Förstå → Definition → Räkna → Verifiera → Slutsats). The shape is good; the failure mode is content, not form.

---

## Recommendations

1. **Hold the 5 blockers for regen**: var-2017-kvant1-XYZ-007, var-2013-kvant1-XYZ-010, host-2022-kvant2-XYZ-006, var-2024-kvant1-XYZ-001, var-2018-1-kvant2-XYZ-010. These would actively miseducate.
2. **Add an arithmetic-consistency post-check** to the regen pipeline: parse `option_text(correct_letter)` and require that the entry's final computed value match it textually (modulo whitespace/LaTeX-form normalization).
3. **For figure-bearing XYZ items**, require either a vision-model pass on the rendered PDF page or a `figure_conditional: true` marker that forces the entry to reason abstractly rather than invent numbers.
4. The 8 weak items are usable for dogfood but should be flagged for figure-aware re-pass before broader release.
5. The 12 clean items confirm the recipe is sound for figure-independent algebra/arithmetic XYZ problems — that's encouraging.

---

## Extrapolation

If this sample's distribution (5/25 = 20% blocker, 8/25 = 32% weak, 12/25 = 48% clean) is representative of all 147 variant-c XYZ regens:
- ~29 blockers needing rerun
- ~47 weak items needing figure verification
- ~71 clean items ready for use

Part 1 (seed 42) should produce its own independent distribution to cross-check. Combined ~50 audited qids should give tighter confidence intervals.
