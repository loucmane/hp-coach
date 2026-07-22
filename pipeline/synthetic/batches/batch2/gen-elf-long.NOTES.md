# gen-elf-long — generator notes

**Candidate:** `PLACEHOLDER` (orchestrator renumbers) — "Catching Clouds"
**Block:** long_passage_5q · genre science_journalism (arid-lands restoration / fog-harvesting)
**Spelling variety chosen:** **AmE**, held throughout (fibers, liters, defense, toward-free prose; BrE-token guard returned empty). Blueprint rule: science → AmE.
**Fictional frame (all invented, publication-neutral):** byline *Dominic Vale* for "a popular-science monthly"; the *Halvard Institute for Arid-Lands Research*; setting *Corvane* (invented fishing town / fog-belt ridge); lead researcher *Dr. Ines Marlow*; enthusiast engineer *Rem Kessler*, whose firm builds the mesh arrays. Every quote is invented. No real magazine, person, or place named. Satisfies anti-plagiarism.md §2 fictional-entity rule.

## Topic distinctness (vs Batch 1)
Batch 1 subjects were: light-pollution/moths, culture-quarter metrics, two herbaria, late-life cognition (music/cello), board-game cafés, bat-timing/owls, lantern-keepers. This unit's subject — **mesh fog-nets used to keep planted trees alive on a dry coast** — overlaps none of them at the specific level (category overlap with "an ecology field study" is inevitable and allowed). Corpus n-gram screen (M-PLAGIARISM over data/parsed/*.json) returned **pass**: no shared ≥17-gram, 8-gram containment under the 0.01 flag threshold.

## Topic rationale (particulars, not a textbook thesis — law 1)
The "wring water from fog to green the deserts" hook is a genre-authentic popular-science pitch, but the passage is built on an **invented field trial** with invented specifics (≈3,000 native thorn-tree seedlings, three planting seasons 2021–2023, a seaward vs leeward slope split, ~2-in-3 vs ~1-in-5 survival behind the nets on the fog-rich slope, a hand-watered ~7-in-10 subset on the fog-poor slope). The load-bearing idea is a passage-specific particular: the causal credit is not the mesh technology but *reliable water delivery*, so the nets earn their keep only where fog is already thick. A knowledgeable solver cannot answer Q3/Q4/Q5 from world knowledge — they must have read *this* trial's slope comparison. No famous thesis is anchored.

## Arc & devices
phenomenon (fog-nets as a cure for spreading deserts) → evidence (Corvane trial, seaward slope thrives) → complication (leeward slope: nets buy almost nothing; hand-watering works — "Then the tidy result began to complicate itself") → verdict (¶5, sober: the nets supply water, they don't manufacture it). One load-bearing **direct quotation** from the enthusiast Kessler; rhetorical pivots "Then the tidy result began to complicate itself" and "Not everyone reads the numbers so cautiously" and "For now, though". Sentence rhythm alternates 40–70-word subordinated sentences with short verdict sentences ("It looked like water, arriving often enough to matter." / "It may also be the only honest one."). **Concrete residue that does not point at the answer** (law 9): the polypropylene-netting description and the water truck breaking an axle twice — texture and digression, not thesis-servants. The neat binary (fancy tech vs nothing) is dismantled by the hand-watered control, not merely presented.

Hedges deliberately seeded as trap anchors: "may not fall", "most mornings", "roughly three thousand", "most … on the order of two in three", "barely a fifth", "much the same rate", "roughly seven in ten", "may yet be proved partly right".

## Question geometry (matches corpus long-passage budget)
Q1 main idea (ELF-TYPE-004, **edge position 1**) · Q2 detail (TYPE-001) · Q3 detail (TYPE-001) · Q4 inference (TYPE-002) · Q5 stance/tone (ELF-TYPE-005, **edge position 5**). Stems are content-anchored corpus-attested forms ("What is this text mainly about?", "What are we told about…", "According to the text, what happened…", "What does the trial imply about…", "What is the writer's attitude toward…"). The banned generic "Which statement is supported by the passage?" (0/405 in the authentic corpus) is avoided.

## Trap architecture per question (engineered quantifier-upgrades + one attribution-swap on tone)
- **Q1 (main idea, key C):** A scope_error (Kessler's broad "any arid coastline" pitch promoted to thesis; refuted by the leeward result); B surface_word_match (recycles "mesh/fog/harvesting water" in an affordability-at-scale claim never argued); D outside_knowledge (desertification-defense truism the trial never asserts).
- **Q2 (detail, key A) — DOMINANT TRAP quantifier_upgrade:** B upgrades "most … two in three" → "Every … alive"; C wrong_location (imports the leeward "same rate" fact onto the seaward slope); D outside_knowledge (growth-rate-vs-hand-water comparison never made).
- **Q3 (detail, key B) — quantifier_upgrade to absolute:** A pushes "bought almost nothing" → "none … survived" and ignores the hand-watered survivors; C surface_word_match/reversal (nets "worked even better there" — contradicted); D outside_knowledge (invents a cost reason for dropping hand-watering; the axle residue makes this tempting without supporting it).
- **Q4 (inference, key D):** A wrong_transfer/too_literal (carries the fog-RICH two-thirds figure onto a fog-poor coast); B quantifier_upgrade adopting Kessler's "fog reaches almost everywhere" overclaim; C too_far/outside_knowledge (thorn trees "need almost no water" — contradicted by the trial).
- **Q5 (tone, key A) — SIGNATURE ATTRIBUTION SWAP:** B role_or_attribution_swap = the quoted engineer Kessler's confidence ("We can green any dry shore the fog reaches") assigned to the writer; C polarity_mirror ("dismissive" overshoots the writer's mild reservation — the writer concedes the nets genuinely work on the seaward slope); D tone_misread ("detached" misses the evaluative verdict).

## Self-blind-solve result (skeptical, from passage alone)
Solved each item from the passage only, arguing for every non-keyed option before consulting my stored key: **Q1→C, Q2→A, Q3→B, Q4→D, Q5→A** — 5/5 match, each single-defensible.

Two-way risk found and repaired: Q4's original option A ("netted and unnetted would die at similar rates") was co-defensible with key D, since both describe the low-fog outcome. Rewrote A to *transfer the fog-rich seaward two-thirds figure onto the hypothetical low-fog coast* — now a clean wrong-inference distractor, not co-defensible with D. Re-solved: single answer D. Nearest surviving two-way, Q1 A-vs-C, is resolved because A's absolute "any arid coastline" is explicitly contradicted by the leeward failure and the verdict, while C carries the conditional the text actually delivers.

## Metric compliance (mech.py units, bands.json ELF long_passage) — all M-gates PASS
- passage_words **670** ∈ [332,873]; inside blueprint 550–825 ✓
- paragraphs **5** ∈ [1,5] ✓
- mean_sentence_words **24.8** ∈ [14.9,35.4] ✓
- within-passage sentence-length **sd 14.85** (≥7 heuristic; high variance, not uniform) ✓
- prompt_words 6/12/10/17/18 ∈ [3,30] ✓
- option_words all 11–14 ∈ [0,31]; option_length_ratio per q 1.17/1.08/1.08/1.17/1.27 — all ≤ 2.36 cap ✓
- key distribution **C, A, B, D, A** — all four letters used, edges differ (C at pos1, A at pos5), no positional/column tell ✓
- AmE spelling: BrE-token guard returned empty ✓
- M-SCHEMA / M-BANDS / M-TELL / M-PLAGIARISM: **pass / pass / pass / pass** (run_mech.py on the PLACEHOLDER file, full corpus)

## Schema deviation (flagged, same as Batch 1 elf-b1-001)
`candidate-item.schema.json` sets `questions.maxItems = 4` (authored for single-question seeded eval items). This unit ships **5 questions** because the block is `long_passage_5q` and ELF long passages are invariantly 5q; `mech.py` M-SCHEMA accepts 1–5 and returned pass. Per-question family tags and planted traps live in `generator_meta` (the question object forbids additionalProperties); top-level `family` = `fog-harvesting-restoration-science-long`.

## Pending web-originality (Tier 2 — belongs to the gate stack, not this pass)
Corpus (Tier 1) is clean. Tier-2 exact-phrase web probes on the most distinctive invented phrases (e.g. "Halvard Institute for Arid-Lands Research", "fog-belt ridge above the fishing town of Corvane", "Rem Kessler", "conjure moisture from a dry sky", "the only honest one") were **not run in this generation pass**. All named entities are invented; no real person carries an invented quote.
