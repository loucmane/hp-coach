# gen-elf-long-001 — generator notes

**Candidate:** `elf-b1-001` — "Slow Learners"
**Block:** long_passage_5q · genre science_journalism (psychology-of-aging, the corpus's over-represented lane)
**Spelling variety chosen:** **AmE**, held throughout (toward, skeptical, labor, plastic; no BrE token present — verified). Blueprint rule: science → AmE.
**Fictional frame (all invented, publication-neutral):** byline *Marguerite Osei* for "a popular-science monthly"; the *Fenwick Institute for Lifespan Research*; setting *Merritt, Ohio* (generic town, no real institution); quoted expert *Dr. Theodore Fanshawe*, neuroscientist. Every quote is invented. No real magazine, no real person. Satisfies anti-plagiarism.md §2 fictional-entity rule.

## Topic rationale
The "music rewires the aging brain" headline is a genre-authentic popular-science hook, but the passage is built on an **invented field study** with invented specifics (96 volunteers, age 68+, 16 weeks, cello + music-reading, a book-club control, sub-3-hours/week practice, a few-percent effect that held at three months). The load-bearing idea is a *passage-specific particular*, not a textbook thesis: the twist is that a non-musical control group improved by the same margin, so the causal credit shifts from music to the shared routine. This defeats world-knowledge answering — you cannot solve Q3/Q4 without having read *this* study's comparison arm. Topic is category-overlap only (cognitive-aging is inevitable), never a specific-entity match to any corpus passage; corpus n-gram screen returned **0 shared 8-grams and 0 shared 5-grams** across 6,369 corpus text blobs (data/parsed/*.json).

## Arc & devices
phenomenon (headline) → evidence (Merritt study) → complication (book-club control climbs equally; "however/yet" pivot in ¶3) → verdict (¶5, sober). One load-bearing **hedged quotation** from Fanshawe (enthusiast); rhetorical pivot "Here, though, the tidy story begins to fray"; sentence rhythm alternates 35–80-word subordinated sentences with terminal 4-word verdicts ("The instrument is optional. / The effort is not."). Hedges deliberately seeded as trap anchors: "Most … modest ones", "roughly the same margin", "may matter far less", "may well turn out to be right".

## Question geometry
Q1 main idea (ELF-TYPE-004, **edge position 1**) · Q2 detail (TYPE-001) · Q3 detail (TYPE-001) · Q4 inference (TYPE-002) · Q5 stance/tone (ELF-TYPE-005, **edge position 5**). Matches the corpus long-passage budget (2 detail + 1 inference + 1 whole-text-edge + 1 stance). Stems are content-anchored corpus-attested forms ("What is this text mainly about?", "What are we told about…", "According to the text, what did… show?", "What does the text suggest…", "What is the writer's attitude toward…") — the banned generic "Which statement is supported by the passage?" (0/405 in corpus; also a seeded double-key defect) is avoided.

## Trap architecture per question
- **Q1 (main idea, key C):** A scope_error (cello anecdote → thesis; refuted by "did not appear to be music as such"); D surface_word_match (recycles "plasticity"/"aging brain" in a "proves" claim never made); B outside_knowledge (childhood-training truism, off-topic — study is adult beginners).
- **Q2 (detail, key A) — DOMINANT TRAP quantifier_upgrade:** B upgrades "Most … modest" → "Every … dramatically"; C surface_word_match with fabricated figure ("over ten hours" vs "a little under three"); D outside_knowledge (older-beginner generalization).
- **Q3 (detail, key D) — quantifier/polarity:** A polarity_mirror ("no improvement at all"); B quantifier_upgrade ("considerably more … every measure"); C surface_word_match (contradicts "never so much as held an instrument").
- **Q4 (inference, key B):** A too_literal/attribution error (Fanshawe's music-is-special view the text sets aside); C quantifier_upgrade (one shared ingredient → "fully accounted for every"); D outside_knowledge two-step (test-retest artifact never raised).
- **Q5 (tone, key A) — SIGNATURE ATTRIBUTION SWAP:** B role_or_attribution_swap = the quoted enthusiast Fanshawe's conviction assigned to the writer (his "carries a power we simply haven't learned to measure yet"); C polarity_mirror ("dismissive" overshoots mild reservation); D tone_misread ("detached" misses the evaluative verdict).

## Self-solve result (blind, skeptical)
Solved each item from the passage only, before consulting my own key: **Q1→C, Q2→A, Q3→D, Q4→B, Q5→A** — 5/5 match key, each single-defensible (no MULTIPLE_DEFENSIBLE two-way item). The nearest two-way risk was Q4 A-vs-B, resolved because ¶3 explicitly denies the music-specific reading ("it did not appear to be music as such"), so the cello-skills option is text-contradicted, not merely weaker.

## Metric compliance (mech.py units, bands.json ELF long_passage)
- passage_words **695** ∈ [332,873] (target ~730 — landed 695) ✓
- mean_sentence_words **23.97** ∈ [14.9,35.4] ✓
- within-passage sentence-length **sd 14.85** (≥7 required; high variance, not uniform) ✓
- paragraphs **5** ∈ [1,5] ✓
- option_length_ratio per q: 1.08 / 1.09 / 1.40 / 1.18 / 1.30 — all ≤ 2.36 cap ✓
- key distribution C,A,D,B,A (deliberately spread; not a uniform column) ✓
- AmE spelling: BrE-token guard returned empty ✓
- corpus n-gram: 0 shared 8-grams, 0 shared 5-grams ✓

## Schema deviation (flagged)
`candidate-item.schema.json` sets `questions.maxItems = 4` (authored for single-question seeded eval items). This unit ships **5 questions** because the block is `long_passage_5q` and ELF long passages are invariantly 5q — a 4q ELF long unit would itself be inauthentic. Validated clean against the schema with `maxItems` relaxed to 5; every other constraint (id pattern, option shape, letters A–D, key ∈ options, additionalProperties) passes as-is. Per-question family tags live inside each `rationale` (the question object forbids additionalProperties, so no extra `family` field was added); top-level `family` = science-journalism-cognition-long.

## Pending web-originality (Tier 2)
Corpus (Tier 1) is clean. Tier-2 exact-phrase web probes on the 8 most distinctive invented phrases (e.g. "Fenwick Institute for Lifespan Research", "old mill town of Merritt, Ohio", "Dr. Theodore Fanshawe", "ragged edge of their own competence", "the tidy story begins to fray") were **not run in this generation pass** (paranoid web probe belongs to the gate stack). All named entities are invented; no real person carries an invented quote.
