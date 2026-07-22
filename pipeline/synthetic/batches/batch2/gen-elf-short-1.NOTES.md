# Batch-2 ELF generator — NOTES (short text 1)

Generator: batch2-generator / claude-opus-4-8 / 2026-07-21
File: `gen-elf-short-1.json` (candidate_id = PLACEHOLDER; orchestrator renumbers)

## Topic & genre rationale

**"The Self-Sealing Slab"** — science_journalism (AmE), a popular-science
short on a fictional self-healing-concrete additive. Deliberately a
**materials-science** subject, not biology, to stay clear of every Batch-1
science topic (moths/light, bat-timing owls) and the other Batch-2 units
(a four-day-week firm; a vanished local fair). One question, ELF-TYPE-001
(direct detail).

Fictional entities only: district **Calder Vale**, **Dr. Teodora Reyes**,
**Halvorsen Institute for Applied Materials**. No real lab, product, or
person. AmE held throughout ("millimeter", "afterward"); no BrE slip.

The passage plants a **hedged, scoped** claim on purpose (law 2): it names the
trigger explicitly ("the trigger ... is the cracking itself — not a rise in
temperature, and not any chemical brushed on afterward") and scopes the effect
("does nothing for the larger structural fractures"). Those two hedges are the
targets the distractors operate on. Concrete residue (calcite, half a
millimeter, the parking deck, steel corrosion) is denser than the length
suggests (blueprint short_text note) and not all of it points at the key.

## Trap architecture — q1 (ELF-TYPE-001, detail)

Stem: "According to the text, what makes the additive seal a crack in the
concrete?" — corpus-attested TYPE-001 form ("According to the text, what
…?").

- **B (key)** — "The spreading crack itself, which tears open the capsules and
  frees the slurry." paraphrase_one_sentence of the explicit trigger statement.
- **A** — temperature. `outside_knowledge / direct contradiction`: the text
  says "not a rise in temperature".
- **C** — a chemical brushed on the surface. `direct contradiction`: "not any
  chemical brushed on afterward"; also "brushed onto the surface" contradicts
  the self-healing mechanism (the agent is pre-mixed, internal).
- **D** — moisture dissolves the capsules. `surface_word_match / half-right
  distortion`: "moisture" appears, but as what the freed slurry *reacts with*
  to harden — it neither "dissolves the clay capsules" nor is the trigger.
  This is the one that punishes a skimmer who anchors on the word "moisture".

Options are grammatically parallel and 12–13 tokens each (ratio 1.08).

## Self-blind-solve (passage-only)

Trigger is stated outright as the cracking. A and C are each explicitly denied
by the same sentence; D lifts a real passage word ("moisture") into a false
mechanism (it hardens the slurry, it does not dissolve capsules, and it is not
the trigger). Only B survives. Single defensible key.

## Band compliance (mech.py against bands.json — all PASS)

| stat | value | short_text band | ok |
|---|---|---|---|
| passage_words | 136 | 101–368 | ✓ (inside task's 105–160) |
| paragraph_count | 1 | 0–8 | ✓ |
| mean_sentence_words | 22.7 | 12.0–47.2 | ✓ |
| prompt_words | 14 | 3–30 | ✓ |
| option_words | 12–13 | 0–31 | ✓ |
| option_length_ratio | 1.08 | ≤2.36 | ✓ |

Sentence-length spread 10–34 tokens (variance; law 7). Mechanical self-check:
**M-SCHEMA / M-BANDS / M-TELL / M-PLAGIARISM all pass** against the real
corpus. Fully original prose, invented entities — no verbatim ≥17-gram,
containment 0.
