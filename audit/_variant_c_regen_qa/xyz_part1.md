# XYZ regen QA — part 1 (seed 42, 25 sample)

## Method
Seed 42, sample of 25 / 147 regenerated XYZ entries. Each entry: confirmed corpus answer by computing the math from the prompt; cross-referenced with the rendered PDF for figure-dependent items and OCR-mangled prompts. Read the regenerated `solution_path`, `steps`, and `distractors`.

## Issues

### Severity: blocker (wrong answer / fabricated math that doesn't connect to the actual problem)

- `var-2018-1-kvant1-XYZ-001` — corpus prompt + options are OCR-mangled. Real PDF expression is `12a²b³ / (4b²c)`, which simplifies to `3a²b/c` (option D in PDF). The regen agent took the corpus's mangled options at face value, reconstructed the expression as `(4bc · 3a²)/(12a²b)`, and derived **c** as the final value. Final letter "D" is right, but D in the real options is `3a²b/c`, not `c`. A student looking at the actual exam paper would see math that doesn't match the option text. Root cause is corpus parsing, but the regen step had a chance to notice the mismatch and didn't.

- `var-2018-1-kvant2-XYZ-003` — real PDF options are A=(√7+√7)², B=7√7, C=√7+√7, D=√7+√(7/7). Only A=28 is heltal; B=7√7≈18.52 is irrational. The regen explanation rewrites option B as "√7·√7 = 7" — which is not what the PDF shows — and rationalizes B as the cleanest heltal. The math in the explanation (B = 7) is **wrong about the option** (B is actually 7√7). Final letter matches corpus, but corpus answer itself looks wrong against the PDF (likely dataset version skew per `feedback`/`project_dataset_version_skew.md`). The regen agent didn't flag the inconsistency.

- `var-2018-1-kvant2-XYZ-010` — real figure: 5×3 grid, 6 shaded cells, total area x·y = 1·(7/5) = 7/5 cm². Correct shaded area = (6/15)·(7/5) = **14/25 cm²** (option C in PDF). Regen explanation fabricates dimensions ("5x=5 cm and 3y=21/5 cm, total area 21 cm²") and arrives at 14/5 cm² ≈ 2.8, which matches no option. It then declares "Svaret är B." Final letter "B" matches corpus, but the worked arithmetic (14/5) ≠ option B's value (14/15). Both the corpus and the regen math look wrong against the figure; the regen step compounded the error rather than catching it.

### Severity: weak (math arrives at right answer but a step is wrong, hand-waved, or inconsistent with the figure)

- `host-ver2-2019-kvant1-XYZ-005` — v = 67°. Real figure has yttervinklar 130° and 117° at the base corners; v is the inner top angle. Correct path: 180−130=50, 180−117=63, v = 180−50−63 = 67. Regen explanation insists v is itself an yttervinkel and claims "a+b = 67°" without ever computing the supplements. Coincidence-correct (67° equals 180−117), but the geometric story is wrong: v is the inner top angle, not an external angle.

- `host-2018-kvant1-XYZ-003` — slope k = −1/2. Real line passes through (0,2) and (4,0). Regen explanation assumes points (0,1) and (2,0), which are not on the actual line. Same slope answer, but the worked points don't sit on the depicted line.

- `host-2024-kvant1-XYZ-004` — x = 20°. Real equation from figure: (3x+30) + (x+10) + (2x+20) = 180 → 6x+60 = 180 → x = 20. Regen explanation hand-waves "if the two known angles are 70° and 90°, then x = 180−70−90 = 20°" — never references the actual angle expressions (3x+30, x+10, 2x+20). Answer correct by lucky guess at the residual; algebra shown does not match the figure.

- `host-2018-kvant1-XYZ-008` — x = √18 cm. Math is correct (Pythagoras with kateter 3, 3). The why_wrong for option D phrases the trap as "tro hypotenusan = kateternas summa = 6 or heltal 20" — but the real D option is √20 cm, a near-distractor where a student computed 3²+? wrong. The trap rationale doesn't quite map to √20.

- `host-2024-kvant2-XYZ-005` — train traveled 540 km, started from P. Real map: P is 295+245 = 540 km from T (Q=450, R=530, S=560). Regen explanation says "P is 540 km from T" but never shows the 295+245 chain; it's a generic "read the map" without using the figure's two-leg structure.

- `var-2025-kvant2-XYZ-006` — hexagon area = 110 cm². Correct decomposition: bottom rectangle 10·7 = 70, top trapezoid (10+6)/2·5 = 40, sum 110. Regen explanation gives a generic "decompose into rectangles and triangles, sum gives 110" without doing the rectangle+trapezoid arithmetic. Right answer, no shown computation.

- `var-2013-kvant2-XYZ-001` — v = 103°. Correct chain: top angles 2x with x = 44° (since 59+33+2x=180), then v as yttervinkel of left sub-triangle gives v = 59+44 = 103°. Regen explanation jumps to "a+b = 103°" without ever deriving x = 44°. Right answer, skipped derivation.

- `var-2017-kvant2-XYZ-002` — 3x+2y = 90°. Clean derivation: 4y and 6x are co-interior, so 6x+4y = 180°, divide by 2. Regen explanation invents "α" and "β" auxiliary variables and asserts the result without actually combining the relations.

### Severity: clean
- 14 / 25

## Patterns

1. **Figure-dependent items get hand-waved**: when the figure carries the key data (angles, dimensions, map labels, grid counts), the regen agent often picks the right answer but skips the actual computation, substituting phrases like "the figure shows a + b = 67°" or "the sum lands on 110 cm²." Five of the eight weak items are this pattern. It works for "right-answer" QA but a student following the steps cannot reconstruct the reasoning.

2. **OCR-mangled prompts get fabricated reconstructions that propagate forward**: in three items the regen agent reconstructed a mangled prompt/options to fit the corpus answer rather than the real PDF, ending up with explanations whose final-arithmetic value doesn't match the option text. This is the blocker class. The agent had no way to see the PDF, so this is partly a corpus-quality issue (var-2018-1 in particular shows multiple parser failures), but a defensible regen would flag "I cannot derive the corpus answer from these options" rather than synthesize a path.

3. **Pure-algebra items are reliably clean**: every non-figure non-OCR-mangled item in the sample (XYZ-012/host-2020, XYZ-009/host-2013, XYZ-010/var-2025, XYZ-011/host-2013, XYZ-009/host-2016, XYZ-004/host-2016, XYZ-007/host-2024, XYZ-012/host-2013, XYZ-010/host-2024, XYZ-011/host-2022, XYZ-005/var-2026, XYZ-003/var-2025, XYZ-011/var-2023) had correct math, correct definitions early, and correct distractor analysis. This is the recipe working as designed.

4. **`why_wrong` quality drops for figure-dep items**: when the agent doesn't truly know what the figure shows, the distractor rationales tend toward generic "you misread a value" rather than pointing at the specific computational mistake. Compare `host-2013-kvant1-XYZ-009`'s sharp distractor-by-mistake mapping with `var-2025-kvant2-XYZ-006`'s generic "you missed a hörnstycke."

5. **Recommendation**: for the figure-dep weak items, regenerate with the figure SVG (or rendered PNG) attached to the prompt. For the OCR-mangled blockers, the upstream parser fix is the right place to act — flag `var-2018-1-kvant1-XYZ-001`, `var-2018-1-kvant2-XYZ-003`, and `var-2018-1-kvant2-XYZ-010` for re-parse + facit cross-check (var-2018-1 looks like it may have a sitting-vs-version mismatch given the facit shows 4 different kvant passes).
