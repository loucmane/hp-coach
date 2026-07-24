# gen-elf-cloze — authoring notes

## Topic & genre
- **Topic:** the decline of the unplanned personal telephone call — a survey column arguing that the drift away from calls is not just convenience but a quiet social unease about "presuming" on a stranger's attention.
- **Genre:** society_commentary, **BrE**, cloze_5gap.
- **Family tag:** `ELF-CLOZE-001 / decline-of-the-personal-phone-call-society-commentary-cloze`.
- **Spelling variety:** BrE held throughout ("offence", no AmE-only forms).
- No topic overlap with batches 1–7 (nearest neighbours — analogue leisure, dialects/media — are about media formats / regional speech, not telephony or call etiquette).

## House-shape conformance
- 5 gaps → 5 `questions[]`, each `prompt: "Gap (n)"`, marker `___(n)___` inline (matches elf-b2-002 / elf-b4-002).
- Each gap: 4 POS-uniform options, ≥2 suffix/shape-matched to the key.
- Gap-type mix: collocation (1, 2, 5), connective (3), polarity (4) — satisfies the blueprint's "≥1 collocation, ≥1 polarity, ≥1 connective".
- Two suffix-rhymed sets (gap 1 `-ension`; gap 5 `-lapsed`), one `-tion/-ction` set (gap 2), one `-ant` set (gap 4), one sentence-adverb class set (gap 3) — same design as the reference clozes.
- Keys spread **B / C / A / D / B** — no positional tell.
- All entities invented: Bellwether (firm), Nils Ahlgren (sociologist), Marguerite Lowe (byline). M-PLAGIARISM pass.

## Planted trap architecture (per gap)
1. **apprehension** (key B) — collocation/sense. "not warmth but a faint ___" wants a mild-unease noun; "faint apprehension" locks. comprehension / suspension / dimension are real `-ension` nouns that fail on sense (not a feeling toward a call).
2. **imposition** (key C) — collocation. "a small ___ on their time" is the fixed idiom "an imposition on someone's time". injunction / inspection / instruction are shape-matched `-tion/-ction` nouns with no "___ on their time" collocation.
3. **Admittedly** (key A) — connective logic. Concessive slot answered by the downstream "But …". Consequently (causal, backwards), Meanwhile (temporal), Conversely (opposite) all mis-signal the relation.
4. **jubilant** (key D) — **polarity**. "the mood … is far from ___" inverts polarity; downstream "guilt, hesitation, calls put off" shows a heavy mood, so the gap needs the celebratory pole. **hesitant** = polarity_mirror + surface_word_match (echoes "hesitation"; a skimmer's grab, but "far from hesitant" = bold, contradicts). **reluctant** = polarity_mirror. resonant = sense misfit.
5. **lapsed** (key B) — collocation/sense, suffix-rhymed `-lapsed`. "has, Ahlgren suggests, quietly ___" wants gradual fall-into-disuse. collapsed (too sudden, jars with "quietly"), elapsed (only time elapses), relapsed (needs prior recovery) all misfit on sense.

## Self-blind-solve
Solved each gap from the passage alone, arguing for every distractor:
- G1: only "apprehension" is a feeling that answers "how it made them feel"; the others are sense-misfits. Single fit.
- G2: only "imposition" collocates with "on their time". Single fit.
- G3: the "But" pivot forces a concessive; only "Admittedly" concedes. Single fit.
- G4: "far from ___" + heavy downstream mood forces the positive pole; only "jubilant" survives (hesitant/reluctant invert wrongly, resonant is off-dimension). Single fit — the polarity-mirror trap (hesitant echoing "hesitation") is live for a non-reader but killed by the inversion.
- G5: "quietly ___" + "old assumption falling away" → only "lapsed"; the other `-lapsed` verbs fail on sense. Single fit.
Every gap: exactly one defensible option.

## Mech
All five mechanical gates PASS (M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-PLAGIARISM). candidate_id = `PLACEHOLDER`.
