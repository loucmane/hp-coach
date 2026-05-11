# v2 trajectory simulation — findings — 2026-05-11

Second iteration after MVP. 64 rounds (10 hardened baseline + 48
practice + 16 transfer). Wall-clock: 5.5 min.

## Headline numbers

| Metric | Value | Target | Status |
|---|---|---|---|
| Baseline calibration | **3/10** | 1-3/10 | ✓ |
| `cant_solve` rounds | 8/64 | ≥1 | ✓ |
| Trajectory deltas | 44/64 positive | non-decreasing | ✓ |
| Final estimated level | **0.6** | ≥0.6 | ✓ |
| Bottleneck signals (hard + soft) | 5 + 4 = 9 | ≥3 | ✓ |
| High-leverage entries | 11 | ≥1 | ✓ |

**6/6 pass.** Validator verdict: *EXCELLENT — corpus signal is solid;
ready to wire into regen cycle.* But see the caveat below.

## Section proficiency at run-end

| Section | Proficiency | Rounds practiced |
|---|---|---|
| NOG | 0.39 | 8 |
| ELF | 0.24 | 6 |
| XYZ | 0.22 | 8 |
| LÄS | 0.22 | 6 |
| KVA | 0.20 | 8 |
| MEK | 0.19 | 6 |
| ORD | 0.18 | 6 |
| DTK | 0.00 | 0 (no Layer-2) |

Quant ordering NOG > XYZ ≈ KVA tracks the persona's reported
experience: NOG taxonomy unlocked once early; KVA option taxonomy
unlocked but fraction-arithmetic was blocked (see caveat); XYZ split
between accessible algebra and KaTeX-blocked content.

## The big caveat — KaTeX rendering is a brief artifact

The agent reported "KaTeX rendering blocks me" on 4/4 soft bottlenecks
and 3/5 hard bottlenecks. Root cause analysis: the v2 brief fed raw
`\frac{1}{3}` strings into prompts, but in the actual SPA those spans
are KaTeX-rendered into proper fractions. The persona ("no KaTeX
literacy" in the spec) refused to engage with math notation that a
real student WOULD see rendered.

This was a **methodological flaw in the brief**, not a corpus problem.

Hard bottleneck breakdown after diagnosis:

| Round | Practiced → Transfer | Diagnosis |
|---|---|---|
| 49 | `(ab)^n` → `(x^a)^b` | **Real adjacent-technique gap.** Practiced rule didn't preview the power-of-power sibling. Clustering false-positive too (both phrased "Potens av X"). |
| 57 | `1/5+1/5` → `1/2−1/3` | KaTeX-render false positive. Same technique. v3 should clear. |
| 58 | `27-18+15-7 / 81` → `x/5 − x/3 − x/2` | KaTeX-render false positive. Same technique. v3 should clear. |
| 59 | `right+isoceles=45-45-90` → `inscribed-in-circle → 45-45-90` | **Real adjacent-technique gap.** Transfer needs Thales theorem to establish the right-angle premise; practiced explanation didn't teach Thales. |
| 62 | `1/3+5/6 vs 4/5+4/10` → `1/4+1/16+1/64 vs 85/256` | KaTeX-render false positive. Same technique. v3 should clear. |

**Real pedagogy gaps from v2: 2 (rounds 49, 59).** Both are
adjacent-technique edge cases, not "wrong explanation" bugs. The
underlying explanations are correct — the test challenged a sibling
rule the explanation didn't preview.

Soft bottlenecks (rounds 25, 29, 37, 39): all KaTeX-render artifacts
except round 37, which is a **real corpus bug** — `var-2014-kvant2-XYZ-002`
has a parser-truncated prompt (missing the `(x^2)^4` numerator) and
bleed from another question's text in option D. Added to
`known_broken.json` for exclusion in future runs.

## The high-leverage finding (the methodology payoff)

11 explanations transferred cleanly to similar-but-different questions.
Notable wins:

- KVA option taxonomy (A=I>II, B=II>I, C=I=II, D=insufficient) — once
  unlocked, every KVA round used it
- NOG "count equations vs unknowns" — a single ~10-word fact transferred
  across 4 practice rounds
- NOG "marginals don't fix cells" (for 2×2 table sufficiency) — same
- Greek-root families for ORD (pathos → sympati/antipati/empati) — one
  ORD round established the morphology; future ORD with Greek roots
  unlocked
- Linear equation distribute+collect, line intersection — XYZ workhorses

These high-leverage facts should be **voice anchors** for future
explanation regens. The pattern: a short ATOMIC rule (≤15 words) that
the persona can apply across superficially-different problems.

## What v2 validated

1. The trajectory simulation works as designed.
2. Hardened baseline pool (NOG/KVA + Tier-1/2) hits the persona honestly.
3. Soft bottlenecks (explanation_helped=false) catch issues even when
   no transfer test exists for the affected qid — critical for verb
   sections where transfer-pair clustering yields few candidates.
4. The technique-clustering is *too loose* in places — "Potens av X"
   matches multiple distinct power rules. This is detectable from the
   simulation output (bottleneck rounds where the practiced and transfer
   techniques are sibling-but-distinct).

## v3 follow-up dispatched

v3 brief fixes the KaTeX-render bug: pipes all prompt/option/explanation
text through `katex_to_ascii` before serialization. Expected:
- Hard bottlenecks drop from 5 → 1-2 (KaTeX false positives evaporate)
- Soft bottlenecks drop from 4 → 0-1
- Final level rises (more accessible content)
- Round 49 and 59 stay as bottlenecks if they're real adjacent-technique
  gaps; evaporate if v2's read was confounded

## Real corpus issues surfaced for action

1. **`var-2014-kvant2-XYZ-002`** — parser bug, prompt truncated, option D
   has bleed. In `known_broken.json`. Fix at parser level or hand-patch.
2. **Power-of-product → power-of-power adjacency** — consider whether
   `var-2019-kvant1-XYZ-012`'s explanation should preview
   `(x^m)^n = x^(mn)` alongside `(ab)^n = a^n b^n`.
3. **Right-triangle premise teaching** — consider whether NOG
   45-45-90 explanations should mention Thales (inscribed in circle ⇒
   right angle) as a common precondition source.

Three concrete fixes — exactly the kind of signal we wanted from the
trajectory pass.
