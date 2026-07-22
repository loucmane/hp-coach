# gen-elf-long — authoring notes

## Topic & genre
- **Genre:** science journalism (heritage/maritime-science register), BrE throughout
  (`labelled`, `metres`, `sulphur`, `catalogued`, `towards`, `-ise` endings). One
  variety held; no AmE leakage.
- **Topic (from this batch's exclusive pool):** Baltic **shipwreck excavation +
  dendrochronology + museum-conservation ethics** — the raise-vs-leave-in-situ
  decision for a well-preserved wooden wreck. All three of my pool's archaeology
  strands appear (excavation, tree-ring dating, conservation ethics); no polar
  material used.
- **Collision check:** grepped batches 1–3 — no shipwreck/archaeology/dendro/
  in-situ-conservation topic exists there; the only "polar" hits are `polarity`
  trap jargon. Deliberately steered clear of the excluded neighbours (church-mural
  conservation, lighthouse/harbour guilds, glacier/ice acoustics): this is
  waterlogged-oak chemistry and marine survey, a different domain.
- **All entities fictional:** the wreck *Sabina*, the *Kalvik maritime unit*,
  dendrochronologist *Tobias Renlund*, conservator *Marit Oldenburg*, byline
  *Elias Frisk*. No real lab, ship, publication, or person. Credited-excerpt frame:
  title line + first-person journalist voice ("she told me") + byline + a glossary
  line defining `sapwood`, a specialist word that actually appears in the passage.

## Arc (phenomenon → evidence → complication → verdict)
1. Phenomenon — the Baltic's cold, low-salinity, low-oxygen water preserves wooden
   wrecks; the raise-or-leave question opens.
2. Evidence — dendrochronology dates the felling to ~winter 1627 and traces the oak
   to the southern shore, *hedged*: sapwood on "only a handful" of cores, repairs
   "consistent, not settled".
3. Setup — a controlled split: 20 loose frames, half raised + PEG-treated, half
   reburied and monitored. Early on the raised set looks the obvious success.
4. Complication (the pivot) — over the longer record it reverses: raised timbers
   develop sulphur-acid decay; reburied frames "simply held".
5. Verdict — the conservator's *absolute* rule ("always, every wreck, without
   exception") vs the writer's *qualified* read: raising is a bargain whose worth
   "depends on what the wreck is wanted for". Deliberately dismantles the neat
   binary rather than resolving it tidily (law 9).

## Planted trap architecture (passage-and-questions as one design)
- **Q1 ELF-TYPE-004 main idea (edge pos 1), key C.** Distractors: A scope_error
  (opening phenomenon as thesis), B detail-as-main (the dating sub-point),
  D surface_word_match/outside_knowledge (a claim the para-4 reversal refutes).
- **Q2 ELF-TYPE-001 detail, key A.** Engineered **quantifier_upgrade** at B
  ("only a handful" → "Every one … full certainty"); C wrong_location (origin
  inverted to Gotland); D surface_word_match/too_far (hedged "may have come from
  later repairs" → "established … repaired several times").
- **Q3 ELF-TYPE-001 detail-comparison, key B — the STEM-LAW item.** Stem names the
  comparison but does **not** entail its direction; the answer is a reported
  empirical outcome the passage could have reported either way (the reburied set
  could plausibly have led early). Distractors: A time-shift + quantifier
  ("some frames" later → "cracked apart completely … first year"), C
  **polarity_mirror** (end-state back-dated to "the very start"), D scope_error
  ("both … entirely hidden" — false for the catalogued raised set).
- **Q4 ELF-TYPE-002 inference, key D.** Mechanism = restored seabed conditions.
  Distractors: A **cross-set attribution swap** (the raised frames' PEG bath
  offered as the reburied frames' cause), B quantifier_upgrade ("almost no change"
  → "guaranteed … indefinitely"), C outside_knowledge/too_far (invented "shed the
  sulphur compounds" — text attributes sparing to absence of air).
- **Q5 ELF-TYPE-005 stance (edge pos 5), key B.** Signature **attribution_swap** at
  A (Oldenburg's absolute assigned to the writer); C polarity overshoot
  (reservation → dismissal); D tone_misread (misses the evaluative "bargain"
  verdict). Key = "Qualified".

## Trap-label honesty (per prompt directive)
Labels name the **actual mechanism**: the stance inversion at Q5/A is tagged
`role_or_attribution_swap`, not reversed_causality; the origin flip at Q2/C is
`wrong_location`, not reversed causality; the cross-set confusion at Q4/A is an
attribution/set swap. No circular consequence-as-cause distractors.

## Distractor-form law compliance
Every absolute distractor is refutable **only from the passage**, mapping to a
specific hedge the text plants — B/Q2 vs "only a handful", A/Q3 vs "some frames",
B/Q4 vs "almost no change". None is eliminable by bare form alone; the key is not
uniformly the hedged option (Q2/Q3/Q4 keys are the specific-confident claims,
distractors over-hedge or over-reach), so "pick the qualified answer" does not
score the unit blind. Keys mix confident (Q2, Q3, Q4) with qualified (Q1, Q5).

## Self-blind-solve (skeptical, passage only)
Solved all five arguing actively for each non-key option:
- **Q1 = C** — only option spanning the whole-text raise-vs-leave verdict; A/B are
  sub-points, D is refuted by para 4. Single answer.
- **Q2 = A** — matches "felled … around the winter of 1627 … southern shore" +
  "holds firmly for the main hull planking". B contradicts "only a handful", C
  inverts origin, D overstates a "may have" hedge. Single answer.
- **Q3 = B** — matches "For the first few years … almost cruelly one-sided …
  raised … clean, catalogued … reburied … doing nothing anyone could photograph".
  A is later + absolute, C is the reversed end-state, D over-broad. Single answer.
- **Q4 = D** — matches "sealed again in cold and airless mud … the very conditions
  that had preserved the ship … went on preserving it". A is the wrong (raised)
  set, B absolutises, C invents a mechanism. Single answer.
- **Q5 = B** — writer: "more divided than her rule allows … raising one is a
  bargain … depends on what the wreck is wanted for". A is Oldenburg's stance
  (swap), C contradicts the granted seabed superiority, D ignores the verdict.
  Single answer.
No item was two-way; none required rewrite after the blind pass.

## Band compliance (recomputed via mech.py)
- passage 747 words (long_passage band 332–873; blueprint target 550–825) ✓
- mean sentence 24.9 w (band 14.9–35.4) ✓; sentence-length SD 12.7 (blueprint ≥7,
  high variance: 6-word verdicts beside 40+-word subordinated sentences) ✓
- option-length ratio ≤ 1.29 per question (cap 2.36) ✓
- key is the single longest option in **0 of 5** questions (tied at most) — M-TELL pass ✓
- Mechanical gates: **M-SCHEMA / M-BANDS / M-TELL / M-PLAGIARISM all pass** (no
  findings). candidate_id left as "PLACEHOLDER" per contract.
- key letters C, A, B, D, B — all four letters, no monotonic/positional tell.
