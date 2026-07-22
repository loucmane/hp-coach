# Batch-2 ELF generator — NOTES (cloze)

Generator: batch2-generator / claude-opus-4-8 / 2026-07-21
File: `gen-elf-cloze.json` (candidate_id = PLACEHOLDER; orchestrator renumbers)

## Topic & genre rationale

**"Fewer Fridays"** — society_commentary (BrE), an analytic weekly-magazine
column reviewing a fictional software firm's four-day-week trial. Distinct
from every Batch-1 topic (light-pollution/moths, culture-quarter metrics,
herbaria, late-life cognition, board-game cafés, bat-timing owls,
lantern-keepers) and from the other two Batch-2 units (self-healing concrete;
a vanished local fair). Chosen because a policy/measurement commentary gives
natural contrastive frames (prediction vs outcome) for polarity gaps and a
mix of noun/verb/adjective/connective slots for POS-uniform gap sets, while
carrying genuine analytical friction rather than a nostalgia parable.

Fictional entities only: **Aldermere** (software firm), **Mira Aldous**
(founder), **Harlen & Voss** (consultancy). No real firm, person, or
publication. The four-day week is a live public debate, but a cloze has no
comprehension key to leak (gaps are decided by collocation/polarity of the
local clause, not world knowledge), and all particulars are invented, so
G-STEM-style passage-independence and M-PLAGIARISM entity-distance are not at
risk. Register held BrE throughout ("stabilise", "per cent"); no AmE slip.

Law 9 (no manufactured tidiness): the piece refuses a clean win — the gain is
real but concentrated in two of seven departments, the founder hedges, and
the closing sentence names the exact conditions (deep reserves, patient
clients, a portable workforce) that make the result hard to generalise.

## Gap architecture (CLOZE-001 signatures)

| gap | key | POS | set shape | trap design |
|---|---|---|---|---|
| 1 | derision | noun | suffix-rhymed **-ision** (revision/derision/provision/precision) | revision/provision/precision = collocation/sense misfit ('universal ___' reaction); only 'derision' idiomatic |
| 2 | slump | verb | free (base-form verbs) | **polarity gap**: surge = **polarity_mirror** (positive pole vs critics' feared fall); stabilise = sense/polarity (the outcome, not a warning); wither = **collocation_misfit** (output doesn't wither) |
| 3 | Indeed | adverb | **connective class** matched (However/Otherwise/Indeed/Conversely) | **connective-logic gap**: prior sentence concedes 'not an unqualified success'; gap reinforces it. However = wrong logic (contrast where none exists) — the skimmer trap; Conversely/Otherwise = wrong logic |
| 4 | reticent | adj | suffix-rhymed **-ent** (insistent/consistent/prevalent/reticent) | insistent = **polarity_mirror** (confident/pushy vs her caution); consistent = collocation_misfit ('consistent about how far'); prevalent = sense misfit (can't describe a stance) |
| 5 | transferable | adj | suffix-rhymed **-able** (transferable/answerable/agreeable/amenable) | all take 'to X' so **collocation**, not grammar, decides: answerable/agreeable/amenable 'to' = accountable/pleasing/tractable — sense misfits; only 'transferable to a setting' = generalise a result |

Requirement audit vs task spec:
- 5 single-word, POS-uniform gaps ✓ (all options 1 token; mech opt ratio 1.0).
- suffix-rhymed sets = **3** (gaps 1 -ision, 4 -ent, 5 -able; spec asks ≥2) ✓.
- **collocation-misfit** traps present in gaps 1, 2 (wither), 4, 5 ✓.
- **polarity-mirror** traps present in gaps 2 (surge) and 4 (insistent) ✓.
- connective/adverb gap present (gap 3) ✓; ≥2 options shape/class-matched per gap ✓.
- Exactly one idiomatic English key per gap, verified by reading the completed
  sentence aloud (BrE); the three wrong options are all real English words
  that fail only on collocation, polarity, or sense.

Keys spread across the unit: **B, A, C, D, A** — all four letters present, no
positional tell.

## Self-blind-solve (passage-only, arguing each non-key option)

- **Gap 1**: after-context ("assumed the scheme was a stunt", "blunter still",
  "predicted output would slump") fixes a scornful reaction → derision. The
  other -ision nouns have no reaction-reading. Single key.
- **Gap 2**: "same volume of work forced into fewer hours" + para-2 reversal
  ("did not fall at all") fixes the feared verb as a fall → slump. surge is
  the wrong pole; stabilise is the outcome not a prediction; wither doesn't
  collocate. Single key.
- **Gap 3**: the immediately preceding sentence concedes a limit and the gap
  sentence supplies confirming evidence → Indeed. However/Conversely demand a
  contrast that is not drawn; Otherwise is conditional. Single key. (However is
  the intended connective-logic skimmer trap; at worst ARGUABLE, key clearly
  best.)
- **Gap 4**: Aldous "is the first to say so" and hedges → guarded → reticent.
  insistent inverts her stance; consistent/prevalent don't apply to a person's
  caution. Single key.
- **Gap 5**: "an arrangement that suits one firm ... ___ to a factory floor or
  a hospital ward" = can it be carried across → transferable. answerable/
  agreeable/amenable 'to' carry accountable/pleasing/tractable senses, all
  wrong of a result offered to a workplace. Closest distractor = amenable
  (collocation_misfit); still not idiomatic. Single key.

No gap admits a second idiomatic reading.

## Band compliance (mech.py against bands.json — all PASS)

| stat | value | cloze band | ok |
|---|---|---|---|
| passage_words | 320 | 228–401 | ✓ (also inside task's 300–401) |
| paragraph_count | 3 | 1–4 | ✓ |
| mean_sentence_words | 26.7 | 13.1–34.8 | ✓ |
| prompt_words (each) | 2 | 1–15 | ✓ |
| option_words (each) | 1 | 0–4 | ✓ |
| option_length_ratio | 1.0 | ≤2.36 | ✓ |

Sentence-length spread 3–54 tokens (high variance; law 7). NB: a gap marker
at sentence start ("___(3)___") is not uppercase, so mech's splitter folds the
preceding sentence into it — expected, accounted for, bands still pass.

Mechanical self-check: **M-SCHEMA / M-BANDS / M-TELL / M-PLAGIARISM all pass**
against the real corpus (data/parsed, 27 sittings). PLACEHOLDER accepted by
M-SCHEMA sentinel; no verbatim ≥17-gram, containment 0.
