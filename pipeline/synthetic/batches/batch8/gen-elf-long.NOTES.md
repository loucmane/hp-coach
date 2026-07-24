# gen-elf-long — authoring notes

## Topic & genre
- **Topic (batch-8 exclusive pool):** pearl / oyster aquaculture field science — invented farm (Alenga Bay pearl cooperative), invented researcher (shellfish physiologist Renata Vasco), invented lease-owner (Tomas Broek), invented byline (Iris Halloran). No overlap with batches 1–7 topics.
- **Genre:** science_journalism, BrE spelling held throughout ("humane", "colour"-family words avoided/kept BrE; "iron out", "for what?"). Arc = phenomenon → evidence → complication → verdict.
- **Length:** ~725 words (mech tokenize 726), 5 content paragraphs + byline + 2-line glossary. Glossary defines only words that appear (nacre, mantle).

## Planted trap architecture
The passage is built so the received rule ("leave the oyster alone → better pearl") is TRUE on the watched metric (nacre thickness) but FALSE on what sells (roundness/evenness), and the corrective (mild disturbance) is itself bounded by a threshold beyond which the oyster dies. Every distractor is a named operation on that scoped, hedged material.

- **Q1 (ELF-TYPE-004, main idea, pos 1) — key B.** A = scope_error (opening pitch promoted to thesis). C = surface_word_match/outside_knowledge (cull-and-reseed policy never stated). D = detail-as-main (the para-1 pearl-formation mechanism, scene-setting).
- **Q2 (ELF-TYPE-001, detail) — key A.** Fact: undisturbed oysters laid more nacre, faster, in BOTH kinds of lease alike. B = quantifier_upgrade ("without any limit at all" — and contradicted, since thickness past a point slips grade). C = cross-arm swap (thickness gain assigned only to undisturbed leases; passage says both alike). D = outside_knowledge (thicker coat "whiter and more lustrous" — never stated; text ties lustre to evenness).
- **Q3 (ELF-TYPE-001, detail) — key C.** Undisturbed leases: grade rose slowly then slipped past a thickness. A = time overshoot ("collapsed almost at once"). B = intuitive-false / surface_word_match (grade peaks in calmest leases — the exact old rule the passage refutes). D = outside_knowledge (size trade-off never reported).
- **Q4 (ELF-TYPE-002, inference, one inch) — key D.** Mechanism: disturbance reseats the mantle so layers go on even → roundness (evenness, not thinness). A = wrong mechanism/contradicted (water temp held steady, so no "cooler cleaner water" effect). B = quantifier_upgrade/too_far ("only constant handling"; "always worthless"). C = too_literal (thin ≠ round; passage ties roundness to evenness).
- **Q5 (ELF-TYPE-005, stance, pos 5, HEDGE-BALANCED) — key B.** Both A and B are cautious in FORM, so the "pick the lone hedge" tell is dead; discriminator is direction. A = direction reversal (sides with Broek, downgrades the roundness result). C = role/attribution_swap (Broek's absolute assigned to the writer — the signature TYPE-005 trap). D = polarity overshoot ("worthless" — contradicted by "laid down more nacre, and laid it faster").

## STEM-LAW audit
- Q2/Q3 stems name only the setup (which oysters/leases) and the comparison; the direction/scope/curve is never entailed by the stem.
- Q4 stem reports the finding and asks the mechanism (not entailed).
- Q1/Q5 are whole-text framings with no answer leak.

## Length-tell discipline
Key is the single longest option in NONE of the five questions (Q1→A, Q2→B, Q3→B, Q4→B, Q5→A are the per-question longest). Keys mix confident-specific (Q2/Q3/Q4) with bounded (Q1/Q5), so "pick the qualified answer" scores nothing blind.

## Self-blind-solve result
Solved all five from the passage alone before checking the keys: **Q1=B, Q2=A, Q3=C, Q4=D, Q5=B (5/5 match).** No item resolved to two defensible answers. Closest two-ways deliberately closed:
- Q4 D vs C: C fails because a thinner coat is not automatically round — the passage locates roundness in the *evenness* of the layers, not their thinness.
- Q5 B vs A: both hedged in form; separated only by the paragraph-5 verdict "more divided than Broek's rule allows" plus "a measured disturbance … buys an evenness that perfect stillness never does", which lands the writer against Broek, not with him.

## Band / gate compliance
Mechanical gate (M-SCHEMA / M-BANDS / M-TELL / M-FORM) run with `run_mech.py --no-plagiarism`: all pass. Paragraph count 6 passes M-BANDS via the union check (short_text class allows up to 8). Tokens, mean sentence length, prompt/option word counts, and option-length ratio all inside band. All entities fictional; no famous-thesis anchoring; options paraphrase, none copy a passage sentence.
