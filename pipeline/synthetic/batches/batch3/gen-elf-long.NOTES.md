# gen-elf-long — generator notes

**Candidate:** `PLACEHOLDER` (orchestrator assigns real id) — "Living Walls"
**Block:** long_passage_5q · genre science_journalism (coastal ecology / engineering)
**Spelling variety chosen:** **AmE**, held throughout (defense, toward, meter-free prose; no BrE token — `defence/colour/metre/…` guard returned empty). Blueprint rule: science → AmE.
**Fictional frame (all invented, publication-neutral):** byline *Priya Restrepo* for "a coastal-science monthly"; the *Calloway Estuarine Laboratory*; setting the *Quillon estuary* (invented inlet); quoted expert *Dr. Halvard Estrup*, marine biologist. Every quote is invented. No real publication, institution, place, or person. Satisfies anti-plagiarism fictional-entity rule.

## Topic rationale (FRESH domain)
Oyster-reef "living shorelines" as coastal defense — a domain that does **not** touch or neighbor any used batch-3 topic (nocturnal pollinators, urban-quarter renewal, board-game cafés, fog-net reforestation, four-day work week, school-lunch logistics, church organs, church-mural conservation, self-healing concrete). Deliberately steered away from the concrete/self-healing lane: this passage's "self-repair" is *biological* (oysters cementing and regrowing), not the material-science self-healing of the forbidden topic, and the passage never mentions concrete except as the losing comparison.

The load-bearing content is a **passage-specific invented field study** — 40 matched reef segments, live-spat vs bare-shell controls, wave gauges, four winters, a ~one-third wave-height cut at *most* seeded sites. The twist is engineered to defeat world-knowledge solving: a **lifeless control did nearly as well for two winters**, so early wave-damping credit shifts from biology to bulk; the living reef's genuine advantage (self-repair after storms, keeping pace with rising seas) only emerges later. You cannot answer Q3/Q4/Q5 from general "oyster reefs are good" knowledge — you must have read *this* study's control arm and its reinterpretation.

## Arc & devices
phenomenon (living reefs pitched as self-mending defense) → evidence (Quillon study, ~⅓ wave cut) → complication (dead sills damp "almost as well" for two winters; "Here the story complicates" pivot) → reinterpretation (two hard winters part the two reef types; hedged/absolutist expert quote) → verdict (¶5, guarded: "The oysters are not a better wall. They are a wall that heals."). One **load-bearing quotation** from Estrup, deliberately over-absolute ("every single time … always the more sensible bet") to seed the attribution-swap trap. Sentence rhythm alternates 40+-word subordinated sentences with short verdicts ("A mound of shell, it turned out, is a mound of shell"; "The oysters are not a better wall."). Seeded hedges as trap anchors: "most of the seeded sites", "roughly a third", "almost as well", "might serve just as well".

Anti-tidiness (law 9): the passage argues *against* its own opening pitch, carries digression ("the water does not much care whether anything inside it is breathing"), and leaves concrete residue (the slumped "useless ridges") that does not all point at the key.

## Question geometry & family map
Q1 main idea (ELF-TYPE-004, **edge pos 1**) · Q2 detail (TYPE-001) · Q3 detail (TYPE-001) · Q4 inference (TYPE-002) · Q5 stance/tone (ELF-TYPE-005, **edge pos 5**). Matches the corpus long-passage budget (2 detail + 1 inference + 1 whole-text edge + 1 stance). Per-question family map lives in `generator_meta.question_families` (1-based string keys). Stems are content-anchored corpus-attested forms ("What is this text mainly about?", "What are we told about…", "According to the text, what did… do…", "What does the text suggest…", "What is the writer's attitude toward…"); the banned generic "Which statement is supported by the passage?" (0/405 in corpus) is avoided.

## Trap architecture per question
- **Q1 (main idea, key B):** A scope_error (day-one wave-breaking pitch → thesis; refuted by "damped the waves almost as well"). C surface_word_match/outside_knowledge (seawall vocabulary → sweeping "fail wherever … built" claim the text never makes). D detail-as-main/wrong_location (seeding is a detail; oyster-population recovery never reported).
- **Q2 (detail, key A) — DOMINANT quantifier_upgrade:** B upgrades "most of the seeded sites" → "every site in the estuary" (else identical to A). C surface_word_match with fabricated figure ("single winter" vs "for four years"). D outside_knowledge (fish/crab habitat — real-world truth, unstated).
- **Q3 (detail, key D):** A polarity_mirror ("no measurable protection" — opposite pole). B quantifier_upgrade ("better … at every gauge"). C wrong_location/time-shift ("within a few weeks" — the slump is a *later*, post-two-hard-winters event).
- **Q4 (inference, key A):** B attribution error/too_far (Estrup's blanket view + the day-one wave claim the study refutes). C quantifier_upgrade ("certain to fail within two winters" — absolute law from one result). D outside_knowledge two-step (warm-water growth never raised).
- **Q5 (tone, key C) — SIGNATURE ATTRIBUTION SWAP:** A role_or_attribution_swap (Estrup's "every single time … always" certainty assigned to the writer). B polarity overshoot ("dismissive" — contradicted by "more valuable"). D tone_misread ("declines to weigh" — misses the verdict "a wall that heals").

## Self-blind-solve result (skeptical, from passage only, before consulting my keys)
- **Q1 → B.** Arc verdict is self-repair-not-early-protection; A text-contradicted, C over-broad/unstated, D a detail. Single-defensible.
- **Q2 → A.** "most of the seeded sites … roughly a third." B fails on scope ("every"), C on timespan ("four years"), D unstated. Single-defensible.
- **Q3 → D.** "damped … almost as well … For the first two winters." A/B wrong pole/scope; C is the *later* collapse, not weeks-in. Single-defensible.
- **Q4 → A.** Cemented crust + regrowth is the stated durability mechanism; B is the refuted wave-breaking claim, C absolutizes, D imports outside cause. Nearest two-way A-vs-B resolved because ¶3 explicitly equalizes early wave-breaking, so B is text-contradicted, not merely weaker.
- **Q5 → C.** Writer calls the record "more guarded," grants a specific edge, concedes the dead sill "might serve just as well" on a calm coast; A = the quoted expert's stance (swap), B contradicted, D contradicted by the evaluative close. Single-defensible.

**Result: B, A, D, A, C — 5/5 match key.** No MULTIPLE_DEFENSIBLE two-way item survived; the one genuine risk (Q4 A-vs-B) is closed by an explicit in-text contradiction. I rewrote nothing at solve time because no item blind-solved to two answers.

## Length-tell & hedge-tell discipline (law 10)
- **Key never the sole-longest option** on any of the 5 questions (verified: `sole_longest=False` ×5 via mech tokenizer). Q1/Q2 were rebalanced (trimmed key, padded a distractor) after an initial draft put the key longest on 4/5 — M-TELL now passes clean.
- **Key ≠ "the qualified one" pattern:** keys mix confident/specific (Q1 thesis, Q4 mechanism) with hedged/qualified (Q2 "most", Q3 "nearly", Q5 "qualified"). On Q4 the key is the confident specific claim while distractors over-absolutize ("simply better than any", "certain to fail"), and on Q1 the key is a confident thesis while a distractor over-states — so "pick the hedged answer" does not score the unit blind.
- **Key letters B, A, D, A, C** — all four letters used, no all-A column, no positional/alternation tell (Q3 was re-lettered from B→D to break an initial B,A,B,A alternation).

## Metric compliance (mech.py units, bands.json ELF long_passage) — all PASS
- passage_words **619** ∈ [332, 873] ✓
- mean_sentence_words **23.81** ∈ [14.9, 35.4] ✓
- within-passage sentence-length **sd 11.31** (≥7; high variance, min 4 / max 43 words) ✓
- paragraphs **5** ∈ [1, 5] ✓
- prompt_words 6–21 ∈ [3, 30] ✓; option_words 12–19 ∈ [0, 31] ✓
- option_length_ratio per q: 1.29 / 1.36 / 1.25 / 1.20 / 1.13 — all ≤ 2.36 cap ✓
- AmE spelling held; BrE-token guard empty ✓
- **Full mech stack: M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-PLAGIARISM pass** (run against the real `data/parsed/*.json` corpus) ✓

## Schema deviation (flagged, same as Batch 1)
`candidate-item.schema.json` sets `questions.maxItems = 4` (authored for single-question seeded eval items). This unit ships **5 questions** because the block is `long_passage_5q` and ELF long passages are invariantly 5q. M-SCHEMA accepts it (passes clean); the deviation is intentional and noted in `generator_meta.schema_note`. `candidate_id` left as the literal `"PLACEHOLDER"` per the output contract.

## Pending web-originality (Tier 2)
Corpus (Tier 1 / M-PLAGIARISM) is clean — no ≥17-token shared run, containment under flag. Tier-2 exact-phrase web probes on the distinctive invented strings ("Calloway Estuarine Laboratory", "Quillon estuary", "Dr. Halvard Estrup", "a wall that heals") were **not run in this pass** — the paranoid web probe belongs to the gate stack. All named entities are invented; no real person carries an invented quote.
