# batch22 — gate phase closed 2026-09-15

**Six units, 16 questions, zero kills.** One unit was withdrawn mid-batch; see `withdrawn/`.
Canonical verdicts: `verdicts.jsonl`, 180 records, sha256 `fa82e7dc47b5ec49e7ebc671cd838e46d2beb7db95bb15ff17d2181f59a74169`, reproducible with
`assemble_verdicts.py --batch-dir . --check verdicts.jsonl` (byte-identical).
Aggregate: SURVIVED_FLAGGED 6 · SURVIVED_CLEAN 0 · DEAD 0 · INCOMPLETE 0 · 143 pass / 37 flag.

| unit | lane | q | family | flags |
|---|---|---|---|---|
| elf-b22-001 | ELF long | 5 | riding-arena waxed-surface temperature, science journalism | 11 |
| elf-b22-002 | ELF cloze | 5 | how a room starts and stops clapping | 4 |
| elf-b22-003 | ELF short TYPE-001 | 1 | pneumatic-tube sample haemolysis, lab reportage | 3 |
| elf-b22-004 | ELF short TYPE-002 | 1 | boundary-hedge dispute, attorneys' letters | 6 |
| las-b22-002 | LÄS debattartikel | 2 | textning på länsteater | 4 |
| las-b22-003 | LÄS essä | 2 | skare / vinterföre | 9 |

## What ran

Five gate rounds and five repair rounds. Rounds 1–4 used the full fleet (G-KEY ×2 blind legs,
G-STEM, G-DISTRACTOR, G-SPRÅK ×3, G-ENG ×3, G-REGISTER). Round 5 was a bounded verification pass —
one blind key leg, one stems gate, one distractor gate, one language pass scoped to the strings the
previous repair changed — followed by a single surgical repair and a three-view re-gate of the one
unit it touched. Mech ran six times, 36/36 at close. Learner-output lint: zero student-visible lines.
78 rationale quotations, all byte-identical to their passages.

Round-5 files are named to the assembler's round convention. Their `gate` field carries the
canonical gate name and `gate_run` preserves the label the run was executed under (V-KEY, V-STEM,
V-DISTRACTOR, V-LANG); `executed_by` is untouched. Round 5 ran ONE blind key leg, not two.

## The withdrawal

`las-b22-001` ("Spårvägen i Nävstuna", LÄS long facktext) was withdrawn on 2026-09-15 under a
stopping rule recorded before round 4 ran. It took a G-STEM kill in every round; in round 4 three of
its four questions were dead at once. Two independent gates then found its passage internally
impossible — the route lengths leave roughly nothing for the hospital branch, and the stated service
level is about 7.5× out of step with its own fleet and stable. Both sets of figures are quoted
verbatim by rationales in three of four questions, so correcting them is a passage rewrite.
Full record, with the arithmetic and with what is *not* being claimed against it, in
`withdrawn/WITHDRAWAL.md`. Its 136 verdict records are preserved in
`withdrawn/verdicts-las-b22-001.jsonl` with per-record provenance. It bars no names or families and
could be revived as a batch24 candidate with a rewritten passage — that would be a fresh generation,
not a repair.

One consequence: the batch's name-collision floor rose from 3 to 4, because the closest pair needed
a name that left with the unit. Nothing now sits within distance 3 of anything.

## Decisions I made that are yours to revisit

1. **The withdrawal itself**, above.
2. **elf-b22-001 q5 option B stands.** One language gate argued it is true on the unit's own
   mechanism. Two blind solvers and the distractor gate killed it on the wax behaving differently
   below ~6° and above ~25°: keeping a school warm is not holding it at July's temperature, and the
   passage does not license that equation. The rebuttal now names the upper threshold explicitly.
3. **elf-b22-001 q3 residual form signal accepted.** Two form variables still have the key as their
   unique value, and the round's claim of zero was wrong. Both point *away* from the key — a
   test-wise reader rejects the option making an absolute claim, and that option is the key. The
   blind stems grader, profiling the set without knowing the answer, picked a distractor.
4. **las-b22-003 pair flag accepted at a measured 2.6×.** The kill was cleared; a weaker leak runs
   the other way. The grader's own blind picks for both questions were distractors, so the channels
   it measured score below chance on these items.
5. **Rationale prose frozen.** See below.

## For the owner ledger

- **Main-idea / whole-text items over multi-section texts** have shown a 40–65 % stems-only floor
  across four batches now, by four different mechanisms. Batch23 declines to ship one in the LÄS
  long lane while the policy question is open. The question is whether the family is retired from
  that lane.
- **RULE 25's quotation ceiling does not state its unit.** elf-b22-003 sits at 25.6 % by characters
  and 28.3 % by tokens against a 30 % ceiling and an authentic p95 of 22.4 %. The whole batch's
  quotation load is in that one unit. 4.4 points of headroom or 1.7, depending on the unit.
- **Expert-only floors.** elf-b22-003's single item is roughly one-in-two for a reader with clinical
  knowledge. Disclosed, not repairable in-unit.
- **elf-b22-004 carries a ~50 % stems-only floor**: the railway appears in exactly the two options
  that survive elimination. The fix is an item redesign, not a repair — and moving the railway into
  the key would be worse, since it would make the test-wise reader who takes the intruder for the
  point right without reading.
- **elf-b22-001 q3 option C is the weakest distractor shipped.** It passes, but its refutation needs
  a three-step chain rather than a sentence. Any edit that moves or generalises the membrane clause
  puts it back in play; re-gate it first.
- **las-b22-003 q2's key** reads "not in advance" against a passage that says they decided the
  evening before. Three gates independently named the step. No rival answer opens under the stricter
  reading; a literal reader lands on no defensible answer rather than a different one.
- **A motif convergence nothing screens for:** three of the seven units put a hoof against a
  load-bearing surface, and two make the identical causal claim in two languages. Below the cluster
  trigger, outside the named-motif list, and nobody looked.

## Repair does not converge on rationale prose — measured

New defects introduced per repair round, batch-wide: **14, 17, 17, 11**, while each round fixed a
comparable number. The population is roughly stationary, because repairing a limb rewrites it and
rewritten copy is new copy. **Across all five rounds, not one of these ever affected answerability**
— on the same bytes the blind solver matched 16/16 keys and the distractor gate passed 16/16.
Batch23 therefore budgets one prose pass per unit and then freezes the rationale layer, reopening it
only for faults that change what an item teaches.

## What V-FINAL is owed

A full sweep once the batch stops moving, which it now has:

- **Sibling-derived figures are stale in every unit** and stamped as such — the withdrawal took the
  population from seven units to six and removed nine name tokens. Each unit's recorded floor is
  stale in the safe direction.
- **Three asserted figures do not reproduce**: elf-b22-001's closing note that no key-isolating form
  variable remains (false against its own table), las-b22-002's claim that a rebuild moved a pronoun
  closer to its antecedent (it moved from 11 to 17 tokens), and las-b22-003's adopted claim that a
  reference stands two sentences earlier (it is four).
- **elf-b22-001 has three metadata fields asserting an inference its rationale was rewritten off.**
  The repair agent opened the divergence, disclosed it, and left it rather than editing out of scope.
- **Census counts**: six mutually inconsistent distinct-token figures exist for one 142-file
  population across the batch's rounds. No bar reads any of them. Emit once, with the tokenizer.
- **Residual language flags**: 37 flags stand in the canonical file, nearly all rationale-prose
  quality. They are listed per unit in the round-4 and round-5 language verdicts.

## Not done here, deliberately

No bank import, no `candidates-final/`, no promotion, no merge, no push. The post-gate chain
(reviews, V-FINAL, promote, stage 11, owner package) is separate work. Batches 18–21 and PRs #370
and #371 were not touched; the batch20/21 completion packages remain on hold.
