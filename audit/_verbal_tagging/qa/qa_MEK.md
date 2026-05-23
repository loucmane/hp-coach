# MEK tagging QA — 12-sample (seed 42)

## Verdict: 7/12 CORRECT, 2/12 WRONG, 3/12 AMBIGUOUS

## Item-by-item

- **var-2022-2-verb2-MEK-021** (proposed MEK-RULE-011): CORRECT. Pure betydelsenyans between near-synonyms in the same field — benägenhet (tendency to act) vs fallenhet (aptitude/talent) vs förmodan (supposition) vs anspänning (tension). Distractors are not idioms, not paronyms, not register-tagged; only nuance separates them. Textbook RULE-011.

- **var-2026-verb2-MEK-025** (proposed MEK-RULE-006): AMBIGUOUS, leaning WRONG, better fit MEK-RULE-007. The Greek root peri-od- does carry meaning, but the load-bearing cue is the embedded definition "längre än 24 timmar och därför tenderar att förskjuta dygnsrytmen" — that paraphrase IS the meaning of "periodicitet". The morpheme is a secondary check; the inbyggd definition is the primary lever. RULE-007 covers "som betyder / innebär att / omskrivning".

- **var-2015-verb2-MEK-026** (proposed MEK-RULE-011): WRONG, should be MEK-RULE-004 (Flerblanks-konsistens). This is a two-blank where the deciding move is jointly fitting both blanks: blank-1 contrasts with "färgsättning" (functionality, not design/möblemang/trivsel), blank-2 describes "läckert inredda" offices with akustikproblem (spatiösa = roomy, which explains the overhörning). Three of the four pairs have one defensible word; only "funktionalitet – spatiösa" survives both-blank testing. The pure-nuance frame doesn't capture the multi-blank lock.

- **host-2016-verb2-MEK-030** (proposed MEK-RULE-014): WRONG, should be MEK-RULE-007 (Inbyggd definition via apposition). RULE-014 specifically targets exempel-trio → samlingsord ("dop, vigslar och begravningar → förrättningar"). Here there is NO trio — only an apposition "en konstform, en populärkulturell ___". That's a single-clue paraphrase, which is exactly what RULE-007 covers (parentes/omskrivning). The solution_path even spells it out: "Vad är en konstform? Det är en GENRE" — that's definition-by-apposition, not hypernym-from-list.

- **host-2025-verb1-MEK-024** (proposed MEK-RULE-012): CORRECT. "Dispens" is a juridisk fackterm; distractors (karens/acceptans/resonans) are facktermer from other fields (medicin/psykologi/akustik). The solution explicitly invokes the juridiska facktermen — exact RULE-012 pattern.

- **host-2017-verb2-MEK-022** (proposed MEK-RULE-003): AMBIGUOUS, leaning WRONG, better fit MEK-RULE-004. "Respektive" is a pairing word but it is NOT in the closed RULE-003 list (såväl…som, ju…desto, varken…eller, både…och) — no first-element trigger word appears in the prompt. The deciding constraint is actually the second blank: "bokstavligen slår" (not figuratively) locks alternative B. That is a two-blank consistency check (RULE-004), not a correlative-pair lock.

- **var-2016-verb1-MEK-022** (proposed MEK-RULE-010): CORRECT. plausibel / kompatibel / penibel / disponibel — all share the -ibel suffix; only the Latin roots (plaus-, compat-, pen-, dispon-) discriminate. Solution leans on root semantics ("disponibel" = available to dispose of). Textbook paronym-by-suffix.

- **var-2014-verb1-MEK-026** (proposed MEK-RULE-016): CORRECT. Three-blank where all three terms must sit in the sustainability/environment sakfält: användas – långsiktigt – utsläppen. Distractor sets pull other fields (biologiskt/förbrukningen, ekonomiskt/effekten, miljömässigt/uttaget) but only B coheres tightly with växthusgaser/etanol/bensin context. Exactly the sakfältskoherens pattern.

- **var-2016-verb1-MEK-029** (proposed MEK-RULE-007): CORRECT. "det vill säga" appears literally in the prompt — the canonical RULE-007 trigger phrase listed in the rule notes. Two-blank, but the definition-clue does all the work.

- **var-2026-verb1-MEK-028** (proposed MEK-RULE-016): AMBIGUOUS, leaning CORRECT. Three-blank, all three locked into the political-criticism sakfält (grogrund för en elit, undergräver tilliten till politikerna). Could also be framed as RULE-004 (multi-blank consistency), but the load-bearing constraint is that B/C/D each smuggle in one off-field term (hållhake/medelklass, andrum/agenda, hävstång/ledning) — sakfält-mismatch is what kills them. RULE-016 captures this better than the generic "test all blanks" frame.

- **var-2022-2-verb2-MEK-024** (proposed MEK-RULE-009): CORRECT. All four alternatives are fixed Swedish phrases (sättas åt sidan, tas i anspråk, ges vid handen, ställas till rätta) used in wrong meanings — exactly the RULE-009 notes: "Distraktorerna är ofta andra fasta svenska idiom — i fel betydelse." "Tas i anspråk" is a fixed myndighetssvensk idiom.

- **host-2025-verb2-MEK-025** (proposed MEK-RULE-009): CORRECT. "Ge efter för" is a fixed verbal idiom; distractors are other fixed expressions (ta ställning, ge upp, ta strid) used in semantically off contexts. The two-blank dimension exists (ge efter – impulser) but the idiom lock is what decides, as the solution_path states.

## Patterns

- **Inbyggd definition (RULE-007) is being under-tagged in favor of neighboring rules.** Both misses (item 2 → tagged 006 instead of 007; item 4 → tagged 014 instead of 007) are cases where a clear apposition/paraphrase defines the blank, but the tagger reached for a more "exotic" rule (morpheme analysis, hypernym-from-trio) when 007 was the simpler and more accurate fit. RULE-007 should win whenever the prompt contains "det vill säga", "som betyder", "innebär att", or an appositive noun phrase naming the blank — even if a secondary cue (morpheme, register, hypernym) is also present.

- **Flerblanks-konsistens (RULE-004) is confusable with the semantic rules** (item 3 → tagged 011 instead of 004; item 6 → tagged 003 instead of 004). When the deciding move is "only one alternative survives joint testing of both blanks", that is RULE-004 — even if the lock on one blank is nuance (011) or pairing-feel (003). Recommend: when the question has 2+ blanks AND no single-blank rule clearly dominates, prefer RULE-004 as the umbrella.

- **RULE-014 (hypernym-from-trio) should be reserved for actual trios.** It got over-applied to a single-apposition case (item 4). The rule's own notes specify "tre konkreta exempel" — enforce that filter.

- **RULE-003 (korrelativa konjunktioner) has a closed trigger list.** "Respektive", "samt", "däremot" are NOT on that list and should not trigger RULE-003. Tighten the rule to require one of {såväl, ju, varken, både} in the prompt.

## Recommendation

A 7/12 strict-correct rate with all three ambiguous cases leaning toward the existing tag being defensible-but-not-best suggests the tagger is reading prompts seriously but has two systemic biases worth fixing before scaling:

1. **RULE-007 under-firing.** Add an explicit pre-check: if the prompt contains "det vill säga", "som betyder", "innebär att", or an apposition pattern `[noun-phrase], [indefinite-article] ___`, tag RULE-007 unless a higher-priority structural rule (002 preposition, 003 correlative) clearly applies.

2. **Multi-blank questions defaulting to single-blank rules.** Add a routing rule: if `n_blanks >= 2`, evaluate RULE-004 and RULE-016 before reaching for nuance/idiom rules; only fall through to a single-blank rule if exactly one blank is doing all the discriminative work.

Worth a re-run with these two priors strengthened. The other 7 tags are crisp and don't need adjustment.
