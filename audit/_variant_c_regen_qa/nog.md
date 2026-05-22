# Variant-C NOG regen — QA pass

**Date:** 2026-05-22  
**Scope:** NOG (data sufficiency), 51 regenerated entries with `_meta.recipe == "variant-c-regen-wave"`. Sample of 15, seed 42.  
**Mode:** read-only.

## Sample (15)

```
var-2016-kvant2-NOG-026   (answer C)
host-2013-kvant2-NOG-025  (answer C)
host-2013-kvant1-NOG-024  (answer C)
var-2025-kvant2-NOG-025   (answer A)
host-2016-kvant2-NOG-026  (answer A)
host-2016-kvant2-NOG-023  (answer C)
host-2016-kvant1-NOG-027  (answer D)
host-2013-kvant2-NOG-026  (answer B)
host-2013-kvant2-NOG-024  (answer C)
var-2015-kvant2-NOG-026   (answer A)
host-2013-kvant2-NOG-023  (answer E)
var-2016-kvant2-NOG-023   (answer A)
host-2023-kvant2-NOG-028  (answer B)
host-2013-kvant1-NOG-025  (answer E)
var-2025-kvant2-NOG-026   (answer C)
```

All five NOG answer letters represented; sample covers algebraic, integer/divisibility, geometric-trivial, Venn/inclusion-exclusion, permutation, and homogeneous-relation cases.

## Headline

**Clean across the board. Zero blockers, zero weak. 15/15 ready to ship.**

Math, answer alignment, distractor coverage, and canonical "(1) ALONE → (2) ALONE → JOINT" structure all hold. The wave is meaningfully better than typical NOG explanations: each entry calls out the *trap* (homogeneous relation, trivial geometric identity, "one of the numbers" ambiguity, fraction-without-absolute, etc.) rather than just grinding the algebra.

## Blockers

None.

## Weak

None requiring rework. Two minor stylistic observations, neither blocking:

- **var-2016-kvant2-NOG-026 step 8** says "M=7 eller M=14" as if M=14 were plausible before pulling in (1). Since (1) fixes M=7 immediately on combine, this is harmless but slightly loose phrasing. Not worth a rewrite.
- **var-2016-kvant2-NOG-023 step 8** ("Vänta — kan S vara mer än 2?") explicitly defends the "exactly two" reading of (1). This is the right call (the corpus answer A depends on it), and the meta-step is actually a strength — it surfaces the implicit-exactness convention that bites students on HP. Flagging only because future regens for other NOG-counting questions could borrow this exact pattern.

## Clean (15/15)

For every qid in the sample:

1. **Canonical NOG structure intact.** Each explanation handles (1) alone fully (translate → solve → judge), then (2) alone fully, then either combines (when answer is C or E) or explicitly notes combining isn't needed (when answer is A, B, or D). Verified by step-title scan; ordering is `Test (1) ensamt` < `Test (2) ensamt` < `Kombinera`-or-end for all 15.

2. **Math correct.** Each independently re-derived; results match. Examples spot-verified:
   - `host-2013-NOG-024` (ladugård): T/8 + T/4 + 5 = T → 5T/8 = 5 → T=8. Distinct from the T=16, H=9 counterexample given for (1) alone — both consistent with (1) only, confirming insufficiency.
   - `host-2013-NOG-025` (yttervinkel): both counterexamples in step 10 (b=40,c=10,a=130,d=170) and (b=80,c=20,a=80,d=160) satisfy α+β+γ=180 and c=b/4 while yielding different d. Clean motexempel.
   - `host-2013-NOG-023` (cyklar): all four 3-color herr-subsets enumerated; fall A {svart,blå,röd} and fall D {blå,röd,grön} correctly rejected for producing two dubbletter; fall B (blå dubbel) and fall C (röd dubbel) both survive → answer E.
   - `host-2023-NOG-028`: case x=7 (y=3.5) vs y=7 (y=7) both consistent with "ett av talen är 7"; (1) ambiguous → answer B.
   - `var-2025-NOG-025`: 0.2x=22 → x=110; (2) gives 110,220,330,… → answer A.

3. **Answer letter matches corpus.** All 15 `solution_path` and/or `Slutsats` step end with the corpus letter. 0/15 mismatched.

4. **Distractor coverage complete.** All 15 entries list exactly the four wrong letters, no missing/duplicated/spurious entries.

5. **`why_wrong` is back-referenced.** Each distractor cites the specific step number that rules it out (e.g. "Steg 7 visar att y är fri"). This is the right pattern — students can navigate back to the proof, not just trust the verdict.

6. **Meta-fields populated.** All 15 have `pregrade_tactic.handle`, `pregrade_tactic.move`, `technique`, `pitfall`. 6/15 have `framework_id` set (TRAP-002, 007, 011, 014, 017, 018); the other 9 are null — that's a content-coverage gap for the framework deck, not an explanation defect (most of these are routine algebraic-NOG patterns without a dedicated trap card).

## Patterns / observations

- **Trap framing is consistent and useful.** Each explanation names the *trap* the question turns on (homogeneous relation, trivial identity, "ett av talen", fraction-without-anchor, etc.) and explicitly contrasts it with the alternative reading a student would naturally make. This is the variant-C value-add and it's landing.
- **Counterexample density is high.** For "otillräcklig" verdicts the explanations consistently give two concrete instantiations (T=8 and T=16 in NOG-024; b=40 and b=80 in NOG-025; y=7 and y=3.5 in NOG-028) rather than abstract claims. Strong pedagogically.
- **Math-markup contract honored.** TeX-inline `\frac{...}{...}`, `\cdot`, `_{1}` subscripts, and Swedish decimal commas (`0{,}004`, `49{,}5`) used consistently. No raw-LaTeX leakage seen in the sample.
- **Last-step "Insikten i en mening" closer** appears in ~10/15 entries — a one-sentence takeaway that names the generalizable lesson. Worth promoting to all-15 in future passes; it's the most quotable surface for retrieval/repetition.
- **`pregrade_tactic.handle`** names are vivid and memorable across the sample ("Heltalsfönstret", "Procentdifferens-receptet", "Trivial-sats-detektorn", "Fall-listaren", "Kalibreringspunkten", "Venn-cellräkningen"). Good handle-anchoring for the Cmd+K palette / spaced-repetition surface.

## Recommendation

Ship the wave as-is. No rework needed on the sampled 15. If a follow-up pass is desired, the highest-value optional improvements would be:

1. Backfill `framework_id` on the 9 nulls (assignment, not regen).
2. Standardize on having an "Insikten i en mening" coda in the final step across all entries.

Neither is a blocker; both are polish.
