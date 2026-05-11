# MVP trajectory simulation — findings — 2026-05-11

First proof-of-concept run of the 0.0 → ? trajectory simulation.
30 rounds (10 baseline + 24 practice + 5 transfer tests).
One Opus agent in background. Wall-clock: 3.5 min.

## Headline numbers

| Metric | Value | Target | Status |
|---|---|---|---|
| Baseline calibration | 5/10 | 0-3/10 | ✗ (see analysis) |
| `cant_solve` rounds | 5/24 practice | ≥1 | ✓ |
| Trajectory deltas | 23/29 positive | non-decreasing | ✓ |
| Final estimated level | 0.7 | ≥0.4 (MVP) | ✓ |
| Bottlenecks (failed transfers) | 0/5 | ≥1 | ✗ (small sample) |
| High-leverage (passed + fact added) | 5/5 | ≥1 | ✓ |

**4/6 pass.** Validator verdict: *MVP signal is GOOD — scale next.*

## The two failures, examined

### Baseline 5/10 instead of 0-3/10

Per-question breakdown of the 5 "correct" baseline answers:

| qid | section | why it was in-persona |
|---|---|---|
| `var-2022-2-kvant2-XYZ-008` | XYZ | grade-9 algebra (persona allows) |
| `host-2015-kvant1-KVA-019` | KVA | comparison deducible without taxonomy |
| `host-2017-verb1-MEK-022` | MEK | natural Swedish sentence completion |
| `var-2022-1-verb1-ELF-031` | ELF | high-school English reading |
| `host-2013-kvant1-XYZ-009` | XYZ | grade-9 algebra |

The 4 `cant_solve` were correctly invoked (3 NOG taxonomy + 1 ORD jargon `väsensskild`).
The 1 wrong answer (LÄS-014) was a real miss.

**This is honest behavior given the persona definition.** The persona spec
explicitly allows grade-9 math, native Swedish, and high-school English.
The brief selected baseline questions that didn't sufficiently isolate
HP-specific concepts. Fix: baseline-question selection should bias toward
opaque option taxonomies (NOG/KVA), KaTeX-heavy quant, complex ORD jargon,
and ELF stance/inference (not just literal comprehension).

Not a persona-fidelity bug — a calibration-brief design bug.

### 0 bottlenecks (5/5 transfer tests passed)

Transfer pairs and outcomes:

| Round | Practiced | Transfer | Result |
|---|---|---|---|
| 25 | `var-2024-kvant2-NOG-026` | `var-2018-1-kvant1-NOG-026` | ✓ |
| 26 | `host-2018-kvant2-XYZ-008` | `host-2023-kvant1-XYZ-007` | ✓ |
| 27 | `var-2022-2-kvant2-XYZ-010` | `host-ver2-2019-kvant2-XYZ-008` | ✓ |
| 28 | `host-2015-kvant2-XYZ-011` | `host-2023-kvant1-XYZ-002` | ✓ |
| 29 | `host-2015-verb2-LÄS-012` | `host-2014-verb1-LÄS-016` | ✓ |

All 5 passed. With n=5, the binomial doesn't let us conclude much beyond
"corpus is plausibly teaching transfer in these techniques." We need
~20+ transfer tests before 0 bottlenecks becomes a meaningful "corpus is
strong" signal vs. just lucky sample.

**Complementary signal already surfacing**: 3 rounds (5, 19, 21) reported
`explanation_helped: false`. These are entries the agent studied but
gained no fact from. Round 5 (ELF-037) was a parser issue (truncated
passage); rounds 19 and 21 (both ORD) were potentially template-fatigued
pedagogy. Soft-bottleneck signal that doesn't depend on transfer-test
sample size.

## What the run validated

1. **Anti-cheat protocol holds.** The agent honestly invoked `cant_solve`
   in 5/24 practice rounds when concepts weren't in `facts_learned`.
   Not a persona-jailbreak; the state-only constraint is binding.

2. **Facts grow atomically.** 29 facts at run-end. Inspection: each is
   a small reusable rule (e.g. "ratio multipliers k₁+k₂+k₃ sum to 180
   when total is 180", "negative exponent flips reciprocal"). No
   summary-blob facts.

3. **Section proficiency tracks coherently** — final state:

   | Section | Proficiency | Comment |
   |---|---|---|
   | XYZ | 0.50 | best — concrete algebra anchors well |
   | NOG, KVA, MEK | 0.45 | taxonomy unlocks pay off |
   | ELF, LÄS | 0.40 | reading patterns transferable |
   | ORD | 0.30 | jargon = worst-leverage |
   | DTK | 0.00 | never practiced (no DTK explanations exist) |

4. **High-leverage entries identified.** All 5 practice→transfer pairs
   that passed are now flagged as voice anchors for future regens. The
   techniques that transferred: distribute-minus in XYZ, point-on-line,
   ratio-sum=180, NOG 2×2 table cell-relation, LÄS "no explanation given"
   schema.

## What needs fixing before scale-up

### v2 brief design

1. **Harder baseline selection** — sample baseline questions from a
   filtered pool: NOG (any), KVA where the comparison requires option
   taxonomy, ORD with jargon-tier targets, XYZ with KaTeX-required
   expressions. Drop pure grade-9 algebra and pure-reading questions
   from the baseline pool. Target: re-test should hit 1-3/10 on real
   HP-specific stressors.

2. **More transfer tests** — bump to 20+ from a larger practice pool
   (say 50-60 practice rounds → 20+ transfer pairs). With n=20 we can
   meaningfully detect <50% transfer rate per technique.

3. **Capture `explanation_helped: false` as a soft bottleneck signal** —
   add to the analysis output alongside failed transfer tests. These are
   "explanation read, nothing learned" entries; complementary to "studied
   then failed to apply."

4. **Section coverage of practice** — guarantee at least 6-8 rounds per
   section (current MVP gave ORD/LÄS only 3 each). Need enough samples
   per section for proficiency-delta noise to average out.

### Open methodology questions

- **Per-section transfer matrix.** XYZ techniques may transfer better
  than ORD techniques by construction (ORD = vocab, no technique). Should
  we weight transfer tests by section?
- **Forgetting curve.** The MVP didn't have enough rounds to test the
  "fading facts" mechanism in the plan. v2 should.
- **Same-question retests.** Currently we measure transfer to a SIMILAR
  question. What about the *exact* same question 50 rounds later — does
  the fact survive? Cheap to add.

## Decision

Scale to v2: ~80 rounds total (10 hardened baseline + 50 practice + 20
transfer) in one agent dispatch. Address all 4 fixes above. If v2 lands
clean (5/6 or 6/6 pass), the trajectory simulation graduates from
"interesting experiment" to "primary regen-queue source" and we wire it
into the existing audit cycle as planned in Phase G.
