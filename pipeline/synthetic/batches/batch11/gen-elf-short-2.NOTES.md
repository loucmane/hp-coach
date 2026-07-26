# gen-elf-short-2 — "Working For It" (batch 11)

**Block format:** `short_text_1q` · **Genre:** science_journalism · **Spelling variety:** AmE (`labor`)
**Family:** ELF-TYPE-002 (inference / implication) · **Key:** B

## Why this topic and this cut of it

Zoo enrichment is usually written as a welfare story about toys. The passage
takes the operational view from a keeper's log: generosity fails, an
unpredictable payout keeps working, and the devices that work best are the ones
that cost a keeper twenty minutes every morning. The closing line — "The budget
line is called enrichment; what it mostly buys is labor" — is the inference
anchor. Nothing in the passage states a price, so the item cannot be answered by
retrieval; the reader has to put the twenty-minute detail together with the
budget line and land one logical inch beyond the text, not two.

Deliberate residue (law 9): the opening "and what it displaced" is never
developed, and the three-day figure is never reused. Both exist so the passage
does not read as a frictionless ramp toward its own question.

Anti-plagiarism: Vidmark Zoo and Runa Kjellman are invented; no institution,
keeper or study is named, and the partial-reward observation is presented as
this zoo's own log rather than as a cited principle, so a solver who knows the
psychology literature gains nothing.

## Trap architecture

Stem: *What does the writer imply about the cost of enrichment at Vidmark Zoo?*
— attested "What does the writer …" form. It names the topic (cost) without
entailing which kind of cost, so the stem does not leak the key.

| opt | role | mechanism |
|---|---|---|
| A | outside_knowledge | a plausible economics claim ("the objects cost more than visitors would guess") the text never makes — and points the wrong way, since the materials named are bark, a crevice and almonds |
| **B** | **key** | one_inch_inference: twenty minutes of daily preparation + "what it mostly buys is labor" → the expense is staff hours, not equipment |
| C | misread of the closing line | reads "buys labor" as diversion of funds; but preparing a puzzle box *is* enrichment work, not "ordinary keeping duties", and the writer's wryness is about where the money goes, not about impropriety |
| D | too_far (two-step leap) | jumps to a budget comparison with unnamed alternatives; the passage compares devices with each other and never weighs enrichment against anything else |

## Self-blind-solve

Argued each option from the passage alone. C is the strongest rival — the
sentence is sardonic and could be heard as an accusation — but the passage has
just explained that the labor *is* the enrichment (the twenty minutes produce
the device), so nothing has been diverted. A is unsupported and contradicted in
spirit by the cheapness of the materials described. D requires a comparison the
text never sets up. **Single defensible answer; no rewrite needed.**

Hedge-balance / test-wise checks: A hedges with "tend to" and B with "mainly",
so the qualified option is not uniquely the key; no distractor carries an
absolutizer, so "strip the absolutes" does not answer the item; the key (16
words) is the second-shortest, not the longest (A and D are 18). All four
options open with "That" and are grammatically parallel.

## Bands (measured)

passage 139 words (short_text band 101–368) · 1 paragraph (0–8) ·
mean sentence 23.2 words (12.0–47.2) · prompt 13 words (reading 3–30) ·
options 15–18 words (0–31) · option ratio 1.20 (cap 2.36).
`run_mech.py`: M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-PLAGIARISM all **pass**.
