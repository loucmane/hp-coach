# gen-elf-long-1 — author notes

## Unit
- **Title:** The Fastest Mend
- **Section / format:** ELF, `long_passage_5q` (5 questions)
- **Family tag:** `submarine-cable-repair-science-journalism-long`
- **Topic:** deep-sea cable repair ships and submarine-cable maintenance (assigned pool; fresh — no batch-1..6 neighbor)
- **Genre:** science journalism, BrE spelling held throughout
- **Byline:** Clara Voss (invented); publication type = science-and-engineering monthly
- **Fictional entities:** the Meridian cable-maintenance consortium; Nadia Osei, reliability engineer / study lead; Bjorn Haugland, repair-fleet director. All findings and quotes invented.
- **Glossary (tail, inside `passage`):** `grapnel`, `landing` — both appear in the text and are genuine specialist terms (law 6 compliance).

## Genre / topic rationale
Science-journalism arc **phenomenon → evidence → complication → verdict**. The seductive
"textbook" story is the *measurement substitution*: everyone watches mean time to repair
(MTTR), and faster mends read as a safer network, so the pitch is always "more and faster
ships." The passage plants that pitch, then dismantles it with a two-arm natural experiment:
holding fault rate and cable types steady, regions that added fleet **and** widened route
diversity kept losing little connectivity as the fleet grew, while regions that added ships
but let a single cable engross more than ~a third of the traffic saw lost connectivity
**plateau** — the fast mends stopped buying resilience. No famous real thesis anchors it
(law 1); the mechanism is invented-but-concrete (eight years, dozen regions, one-third hinge).
The passage refuses tidiness (law 9): it explicitly concedes the mends are real and "run all
the way up" where routes stay diverse, and it stages the Haugland-vs-Osei disagreement without
resolving it into a parable.

## Planted trap architecture (passage and questions are ONE design)
The passage was written with hedged/directional/scoped claims so each distractor is a named
operation on a real target:

- **Q1 — ELF-TYPE-004 main idea (edge pos 1).** Key B paraphrases the bounded para-5 verdict.
  Traps: A = *scope_error* (the opening pitch promoted to thesis); C = *surface_word_match /
  outside_knowledge* (anchor/breakage vocabulary bent into a protect-the-busiest-cables policy
  the text never issues); D = *detail-as-main* (the grapnel-and-splice repair image, real but
  scene-setting).
- **Q2 — ELF-TYPE-001 detail.** Key A = MTTR fell in **both** arms alike. Traps: B =
  *quantifier_upgrade* ("across the regions tracked" → "without any limit however large"); C =
  *cross-arm swap* (the diversify/concentrate split belongs to the lost-connectivity result,
  not to MTTR); D = *outside_knowledge* (invented fault-type repair-time breakdown).
- **Q3 — ELF-TYPE-001 detail, STEM-LAW.** Stem names the concentrating regions but not the
  direction; the two-stage fall-then-plateau curve is a reported outcome. Key C. Traps: A =
  *cross-arm swap* (the diversified arm's steadily-falling curve); B = *quantifier_upgrade /
  time-shift* (instant collapse on the first extra ship); D = *outside_knowledge*
  (pre-positioning fix never reported).
- **Q4 — ELF-TYPE-002 inference (one inch).** Key D = the cost driver is the traffic-share on
  the failing cable, not fleet size. Traps: A = *wrong mechanism / contradicted* (calmer seas —
  but the study held fault rate/conditions steady); B = *quantifier_upgrade / too_far* (absolute
  "never … unless every route fully duplicated"); C = *too_literal* (the raise-and-splice rule,
  true in every region, so it cannot explain the difference).
- **Q5 — ELF-TYPE-005 stance (edge pos 5), HEDGE-BALANCED.** Key B = "Qualified." Both A
  ("Broadly persuaded") and B are cautious **in form**, so the "lone hedge among absolutes"
  structural leak is closed — the item turns on direction/content only. A = *direction reversal,
  hedged in form* (lands the writer on Haugland's side, plateau downgraded to a fixable gap); C =
  *role_or_attribution_swap* (Haugland's certainty assigned to the writer — the TYPE-005 signature);
  D = *polarity overshoot* ("Dismissive," contradicted by the "mends they buy are real" concession).

## Law-11 / verbatim-truth check
No distractor is verbatim-true-per-passage. Each carries one identifiable flaw (scope, quantifier,
wrong-arm, outside-knowledge, contradiction, or too-literal). Options paraphrase; none reproduces a
passage sentence (law 3) — M-PLAGIARISM passes.

## Length-tell discipline (law 10)
Key is the single longest option in **none** of the five questions. Per-question
option_length_ratio ≤ 1.59, well under the 2.36 cap. Key letters B, A, C, D, B — all four used,
no monotonic run, no positional/alternation tell. Keys mix confident-specific (Q2/Q3/Q4) with
bounded-qualified (Q1/Q5) so "pick the hedged answer" does not score the unit blind.

## Self-blind-solve result
Solved all five from the passage alone before consulting the keys: **Q1=B, Q2=A, Q3=C, Q4=D,
Q5=B (5/5 match)**. Adversarially argued each non-keyed option:
- Q4 near-two-way (D vs C) closes: C's raise-and-splice requirement holds in *every* region and
  so cannot explain why only the concentrating regions kept losing connectivity — it names the
  rule, not the difference.
- Q5 (B vs A) requires reading the para-5 verdict ("stop buying resilience," "a floor on what a
  fault can cost") to separate the qualified-but-adverse key from the qualified-but-favourable
  reversal. No item resolves to two defensible answers.

## Mechanical gate self-check
`run_mech.py` on the pre-renumber file (candidate_id = PLACEHOLDER):
**M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-PLAGIARISM pass** (5/5).
Passage ≈ 800 words (within the 550–825 long-passage band; mech token count under the split
count, which includes the em-dash byline and `=` glossary tokens). One spelling variety (BrE)
held throughout.
