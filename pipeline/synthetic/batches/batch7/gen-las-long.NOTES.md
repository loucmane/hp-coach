# gen-las-long — authoring notes

## Topic & genre
- **Topic (from my exclusive pool):** *lantbrevbärarna och postväsendets landsbygdshistoria* — the introduction of rural mail delivery (lantbrevbäring) in late-1870s Sweden and a fictional historian's archival study of whether a resident (bofast) carrier mattered.
- **Genre:** sakprosa / facktext_larobok, populärvetenskaplig historieskrivning. Result-lede opening (finding first, then background → method → finding → residue → caveat → counterpoint → close), signed byline, glossary tail. LIX ~48–54 target; sentence length deliberately varied (short verdicts — "Det hon fann var något annat." — beside 30+-word subordinated sentences).
- **Topic-distance:** does not touch any batch 1–6 topic. Nearest excluded neighbours are *trains/rail* and *cold-chain logistics*; the railway appears only as the **contrast condition** (the study's effect is scoped to parishes the railway had *not* reached) — the passage is about the human carrier, not rail.
- **All entities fictional:** historian Elisabet Rahm, carrier Per Ersson, critic Tore Lundqvist, byline author Ingrid Sahlén. Ådalen/Norrland are real places (allowed). The ~1870s introduction of lantbrevbäring is background flavour only and is **never the tested claim** — every measured finding (resident-carrier effect, far-from-railway scope, per-hundred-households figure) is invented and passage-internal, so a reader who knows postal history cannot answer without reading (Law 1 / G-STEM).

## Planted trap architecture (passage and questions are one design)
The load-bearing planted claim is **hedged, directional, scoped**: *where the round was run by a resident neighbour (not an outsider), private-letter volume grew faster — but only in remote parishes the railway had not reached, and the effect is confounded by literacy.* Every distractor is a named operation on that claim.

- **Q1 `enligt_texten_detalj` (key B).** Key paraphrases the finding. A = **scope_shift** — lifts the critics' "he just booked more carefully" objection (§7) and dresses it as the study's *result*, plus "förklarar hela ökningen" which the text explicitly refuses to conclude. C = **overgeneralisation** — strips both hedges ("oavsett hur långt... all slags post"). D = **scope_shift** — promotes the method/data volume (19 000 notations) to "result".
- **Q2 `detalj_ospecificerad` (key D).** Key paraphrases how the service was first organised (bisyssla, bofast bonde/torpare, blygsam årlig ersättning). A = **overgeneralisation/reversal** (heltidsanställd tjänsteman i varje socken — opposite of "blygsam"). B = **plausible_worldknowledge** (per-försändelse pay tied to traffic — text says fixed annual sum). C = **scope_shift/quantity** (dagligen + korta rundor nära kyrkbyn — text says a couple times a week, several mil).
- **Q3 `inference_slutsats` (key A).** Key requires combining two facts in the stated direction: the resident advantage came from *förtrogenhet* (hand-delivery, shortening the way to the post) **and** near a station the way was already short → the advantage was redundant. B = **reversed_causality** (the #1 inference trap — flips to "remote parishes got *worse* post", the opposite of the finding). C = **plausible_worldknowledge** (station parishes denser/more literate — text attributes the smaller effect to proximity, and names literacy only as a confound). D = **overgeneralisation** ("helt och hållet"/"inga brev kom bort").
- **Q4 `huvudbudskap_syfte` (key C).** Key spans the whole text (lede + hedged finding + explicit uncertainties). Law 11 respected — **no distractor is verbatim-true**: A = **detail_as_main** with a distortion (material called "genomgående tillförlitlig och heltäckande" though the text stresses its luckor). B = **overgeneralisation** ("de bofasta brevbärarna, *inte* järnvägen" — the close says *both*). D = **detail_as_main** attributing an unstated purpose ("infördes främst för att bespara...").

## Hedge-balance (Law 10)
Key letters spread **B, D, A, C**. The key is **not** the longest option in any of the four questions (verified: Q1 longest=C, Q2=B, Q3=D, Q4=A). The "pick the qualified answer" shortcut is broken across the unit: only Q4's key is the hedged option; Q1/Q2 keys are confident, specific factual claims and Q3's key is a positive causal statement, while absolutised distractors sit on questions whose key is *not* the sole hedge.

## Self-blind-solve result
Solved all four from the passage alone, arguing actively for each non-keyed option:
- **Q1 → B** only. A is an objection not a result and overclaims "hela ökningen"; C contradicts the two explicit scope limits; D is method-as-result.
- **Q2 → D** only. A/B/C each contradict a specific passage detail (employment status, pay form, frequency/distance).
- **Q3 → A** only. B reverses the finding's direction; C is real-world-plausible but text-unsupported; D absolutises "mindre roll".
- **Q4 → C** only. A overstates reliability the text disowns; B denies the railway's role the close affirms; D invents a purpose.
No question is two-way; no distractor is verbatim-true.

## Band compliance (mech, all pass)
- passage: **810 words**, 40 sentences, mean **20.2** w/sent — inside LÄS-long bands (words 215–1260; mean 8.2–30.9) and the blueprint 750–1135 / 14–25 authoring targets.
- Options all ≤ 21 tokens (cap 23); per-question length ratio ≤ ~1.9 (cap 5.25).
- M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM: **all pass** (no verbatim n-gram overlap with the authentic corpus).
