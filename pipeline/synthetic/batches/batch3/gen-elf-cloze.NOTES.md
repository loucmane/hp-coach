# gen-elf-cloze — authoring notes

## Unit
- **Format:** `cloze_5gap` (5 gaps → 5 questions)
- **Family:** `ELF-CLOZE-001 / sleeper-train-revival-society-commentary-cloze`
- **Genre:** society_commentary
- **Topic:** the recent revival of overnight sleeper trains and whether its economics are as sound as the coverage implies. Fresh domain — does not overlap or neighbour any banned topic (transport/rail is new to the batch series; four-day-week, gentrification, fog-nets etc. are untouched here).
- **Spelling variety:** **BrE**, held throughout (`traveller`, `ageing`, `favourable` in rationale). No AmE spellings in the passage.
- **Fictional entities:** Halden Rail (operator), Aurora (service), Ingrid Sollander (economist), Elias Thorne (byline). All invented, publication-neutral.
- **Frame:** title line separate; byline ("— Elias Thorne, transport columnist") inside the passage tail. No glossary — no specialist terms needed.

## Planted gap architecture (contract: ≥1 collocation, ≥1 polarity, ≥1 connective; ≥2 shape-matched per gap; 1 polarity mirror where a contrast frame exists)
- **Gap 1 — collocation.** Key `withdrew` (withdrew its services). Distractors are real transitive verbs that fail on collocation/sense: *dismissed* (dismiss a claim/employee), *declined* (refuse an offer, or intransitive "reduce"), *renounced* (renounce a claim/title). Key at **C**.
- **Gap 2 — collocation.** Key `underwrite` (underwrite a loss). Misfits: *condone* (needs a moral wrong), *overturn* (a decision/verdict), *dispel* (doubts/myths). Key at **A**.
- **Gap 3 — connective/adverb.** Key `Instead` — expectation ("fill perhaps half the cabins") reversed by outcome ("sold out"). Wrong-logic adverbs: *Accordingly* (consequence in line with expectation), *Otherwise* (conditional), *Meanwhile* (temporal parallel). Key at **D**.
- **Gap 4 — polarity (with polarity-mirror distractor).** Contrastive pivot "**Yet** the revival is more ___ than the cheering headlines suggest" + downstream fragility evidence demands the negative pole. Key `precarious`; suffix-rhymed -ious set. *auspicious* = the positive-pole **polarity mirror** a skimmer grabs; *gregarious*, *meticulous* = sense misfits. Key at **B**.
- **Gap 5 — collocation/sense.** Key `rosy` ("the ledgers look far less rosy"). Misfits: *hollow* (a hollow victory), *candid* (frank), *generous* (a person/portion). Key at **C**.

Gap-type coverage: collocation ×3 (1,2,5), connective ×1 (3), polarity ×1 (4). Contrast frame present at gap 4 with an explicit polarity mirror. ✅

## Key spread & tells
Keys **C, A, D, B, C** — no positional column, no all-same. Cloze options are single words (1 token each), so the length tell and the "only-hedged" tell do not apply; option_length_ratio = 1.0.

## Self-blind-solve (skeptical, argued each non-key)
- G1: only `withdrew` collocates with "its overnight services"; the other three are ruled out on sense (dismiss/decline/renounce do not take a scheduled service as object). **Single.**
- G2: only `underwrite` collocates with a sustained loss; condone needs a wrong, overturn a ruling, dispel a doubt. **Single.**
- G3: expectation→opposite-outcome forces `Instead`; the other adverbs impose the wrong relation. **Single.**
- G4: "Yet" + fragility evidence forces the negative pole `precarious`; auspicious is the trap positive; the other two are off-sense. **Single.**
- G5: financial-health idiom forces `rosy`; the rest are collocation/sense misfits. **Single.**
Rewrote nothing after blind-solve — no two-way gap survived. Deliberately avoided near-synonym distractors (e.g. dropped *abolished* at G1, *absorb*/*sustain* at G2, *buoyant* at G5) that would have manufactured a second defensible key.

## Bands (self-checked via mech.py)
words 271 (cloze 228–401 ✓); mean_sentence_words 33.9 (cloze 13.1–34.8 ✓); option_words 1 (cloze 0–4 ✓). All four mechanical gates pass.
