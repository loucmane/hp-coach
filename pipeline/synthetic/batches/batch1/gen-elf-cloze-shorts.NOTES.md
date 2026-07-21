# Batch-1 ELF generator — NOTES (cloze + 2 short texts)

Generator: batch1-generator / claude-opus-4-8 / 2026-07-21
Files: `gen-elf-cloze-001.json` (elf-b1-001), `gen-elf-short-001.json` (elf-b1-002), `gen-elf-short-002.json` (elf-b1-003)

## Topics (all original, fictional entities)

- **Cloze — "Analogue Comforts"** (elf-b1-001): society/culture commentary on the survival of board-game cafés. BrE, magazine register, invented owner "Priya Mehta" and venue. 310 words, 4 paragraphs, 5 gaps.
- **Short text 1 — "Borrowed Suppers"** (elf-b1-002): science journalism; an invented "ashen pygmy owl" that times its hunting to local bat departures because the bats stir up moths. AmE. Invented ecologist "Marisol Venn", invented monthly "Field & Frequency". 146 words. Specific-detail question (ELF-TYPE-001).
- **Short text 2 — "Paid by the Ship"** (elf-b1-003): economic-history/culture; the invented Baltic port "Vellmar" whose lantern-keepers were paid by ships only on safe arrival. BrE. Invented town "Hesse-Aldern", invented guild + chronicle quote. 142 words. Inference question (ELF-TYPE-002).

Each text holds ONE spelling variety throughout (cloze BrE, ST1 AmE matched to science genre, ST2 BrE). No listicle/clickbait framing. Topics are novel and do not entity-match any corpus passage.

## Trap architecture

### Cloze (5 gaps) — CLOZE-001 signatures
| gap | key | POS | set shape | distractor traps |
|---|---|---|---|---|
| 1 | novelty | noun | suffix-rhymed **-ty** (austerity/loyalty/novelty/casualty) | austerity = collocation_misfit ('*a passing austerity'); loyalty, casualty = sense misfit |
| 2 | popularity | noun | suffix-rhymed **-ity** (notoriety/popularity/prosperity/familiarity) | notoriety = **polarity_mirror** (negative pole); prosperity, familiarity = collocation_misfit ('*has quietly deepened') |
| 3 | resistant | adj | connective-locked ('stubbornly ___ to the download') | vulnerable = **polarity_mirror**; superior = scope/sense error; hostile = collocation/sense misfit |
| 4 | erode | verb | 'can ___ its slim margins' | inflate = **polarity_mirror**; dilute = **collocation_misfit** (dilute+shares/brand, not margins); squander = **collocation_misfit** (squander+money/chances, not margins) |
| 5 | durable | adj | suffix-rhymed **-able** (portable/durable/disposable/negotiable) | disposable = **polarity_mirror**; negotiable = collocation_misfit; portable = sense misfit |

Requirement audit: suffix-rhymed gaps = **3** (gaps 1, 2, 5; spec asks ≥2) ✓; polarity-mirror traps present in gaps 2/3/4/5 (spec asks ≥1) ✓; collocation-misfit traps in every gap (spec asks ≥1) ✓. All options single-word, POS-uniform per gap. Exactly one idiomatic English key per gap, each verified by reading the completed sentence aloud; the three wrong options are all real English words that fail only on collocation, polarity, or sense.

### Short text 1 (ELF-TYPE-001, detail)
Stem "According to the text, what prompts the pygmy owls to begin hunting…". Key C = bats' departure stirring moths (paraphrase_one_sentence). A = outside_knowledge (temperature, never stated); B = scope/quantifier error ('fixed internal clock', contradicted by the light-delay experiment); D = wrong-detail contradiction (text says owls do NOT chase the bats).

### Short text 2 (ELF-TYPE-002, inference)
Stem "What does the passage suggest about why Vellmar's lanterns were so reliably kept?". Key D = pay tied to safe arrival aligned self-interest (one_inch_inference — the text gives the toll structure and the outcome but never names the incentive). A = too_literal restatement (the stated evidence, not the 'why'); B = two-step leap / outside_knowledge; C = quantifier_upgrade ('always').

## Self-solve outcomes (blind, passage-only)

- **Cloze**: solved all 5 gaps to the intended key with a single defensible answer each. Gap 3 hardened with 'stubbornly' so 'resistant' locks and 'superior' cannot be argued in. Gap 2 disambiguated by the 'waiting lists / publishers court them' evidence pointing to popularity, not prosperity. No gap admits a second idiomatic reading.
- **ST1**: key C reached via the eleven-minutes-after-bats detail plus the delay experiment; B and D are actively contradicted by the passage, A is unsupported. Unambiguous.
- **ST2**: key D reached as the one-inch causal link behind the stated toll structure + the salaried-rival contrast; A/B/C each defeatable by the TYPE-002 protocol (verbatim restatement, unsupported generalisation, illegal 'always'). Unambiguous.

## Band compliance (verified via gates/scripts/mech.py against bands.json)

| item | passage_words | paras | mean_sent | option ratio | M-BANDS |
|---|---|---|---|---|---|
| cloze | 310 (cloze 228–401) | 4 (1–4) | 17.2 (13.1–34.8) | 1.0 | **pass** |
| short 1 | 146 (short 101–368) | 1 | 20.9 (12.0–47.2) | 1.15 (≤2.36) | **pass** |
| short 2 | 142 | 1 | 28.4 | 1.42 (≤2.36) | **pass** |

Plagiarism: fully original prose with invented entities — expected M-PLAGIARISM pass (no verbatim ≥17-gram, containment ≪0.01). Not machine-verified here because M-PLAGIARISM needs the private `data/parsed/*.json` corpus, which was not loaded in this generation session; run it in the batch harness.

## KNOWN FRAMEWORK CONFLICT — cloze 5 gaps vs question cap 4

`candidate-item.schema.json` sets `questions.maxItems: 4` and `mech.py` M-SCHEMA kills on `len(questions) > 4`. A cloze is invariantly **5 gaps** (corpus-analysis §2), and the task + blueprint + bands.json all model cloze gaps as `questions[]` (bands.json even carries dedicated `cloze` classes for `prompt_words` [1,15] and `option_words` [0,4], which only make sense if a cloze candidate flows through M-BANDS with its gaps as questions). The 5-question cloze therefore passes M-BANDS but is killed by M-SCHEMA purely on the count cap.

This is a stale-cap inconsistency, not a content defect: the parallel ELF-long generator's output in the same batch dir (`gen-elf-long-001.json`, also 5 questions) hits the identical M-SCHEMA kill. Recommended reconciliation by the orchestrator: raise `maxItems` to 5 in the schema and the guard to `len<=5` in `mech.gate_schema` (long_passage and cloze are both 5-item blocks). Content authored to the correct 5-gap invariant; no regeneration needed once the cap is lifted.
