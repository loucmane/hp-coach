# Batch-2 ELF generator — NOTES (short text 2)

Generator: batch2-generator / claude-opus-4-8 / 2026-07-21
File: `gen-elf-short-2.json` (candidate_id = PLACEHOLDER; orchestrator renumbers)

## Topic & genre rationale

**"The Vanished Fair"** — history_essay (BrE), a narrative-history short built
on an **archival silence**: a fictional Fenland town whose otherwise complete
ledgers stop recording its Michaelmas goose fair after 1631. One question,
ELF-TYPE-002 (inference).

Chosen so the inference mechanism is **inference from absence**, deliberately
different from Batch-1's incentive-structure inference (lantern-keepers paid by
ships) — the reader must reason from what the meticulous chamberlain *stopped*
recording, not from a stated rule. Distinct topic from every Batch-1 unit and
from the two other Batch-2 units (a four-day-week firm; self-healing concrete).

Fictional entities only: town **Nettleholt**, its **borough chamberlain**
(unnamed), the **Michaelmas goose fair**. "Town waits" (municipal musicians)
and the goose-fair custom are generic period colour, not a specific real event;
no real person is named or quoted (anti-plagiarism.md §2, defamation guard).
BrE held throughout; no AmE slip.

Planted material (law 2): three concrete facts are laid down — the fair drops
out after 1631, **no** cancellation line is recorded, and the next Michaelmas
pages go entirely to a river wall that "devoured a sum far larger than the fair
had ever yielded" and was raised "on the very meadow where the stalls had once
stood." The *why* is never stated; the key is the one-inch link across those
facts.

## Trap architecture — q1 (ELF-TYPE-002, inference)

Stem: "What does the text suggest about why the goose fair disappears from
Nettleholt's ledgers after 1631?" — corpus-attested TYPE-002 form ("What does
the text suggest about …?").

- **D (key)** — river-wall works claimed both the money and the fair's meadow,
  so the fair lapsed. `one_inch_inference`: the single link the passage implies
  but never states (site consumed + funds diverted → fair could not run).
- **A** — recording merely stopped; the fair "carried on as before".
  `too_literal`: restates the surface silence but is defeated by the meadow
  being built over ("carried on as before" is impossible once the site is gone).
- **B** — goose fairs were being abandoned across England. `outside_knowledge /
  two-step leap`: an England-wide trend the passage never asserts.
- **C** — the fair was formally abolished by an order the chamberlain chose not
  to record. `contradiction`: the text says "No line records its cancellation";
  inventing a suppressed order runs against the passage.

Options 11–22 tokens (ratio 2.0, under the 2.36 cap). The key (D) does not
reuse a distinctive ≥4-word run from the passage.

## Self-blind-solve (passage-only)

The passage gives the pieces and withholds the cause. D supplies exactly one
inferential inch, grounded in the meadow-reuse and the diverted spending. A is
contradicted by the meadow clause; B is unsupported world knowledge; C is
contradicted by the explicit "No line records its cancellation." Only D is
defensible. A is the strongest distractor (a reader ignoring the meadow detail
could reach for it) but is beatable on the exact wording "carried on as before"
→ ARGUABLE at most, key clearly best. Single defensible key.

## Band compliance (mech.py against bands.json — all PASS)

| stat | value | short_text band | ok |
|---|---|---|---|
| passage_words | 148 | 101–368 | ✓ (inside task's 105–160) |
| paragraph_count | 1 | 0–8 | ✓ |
| mean_sentence_words | 29.6 | 12.0–47.2 | ✓ |
| prompt_words | 17 | 3–30 | ✓ |
| option_words | 11–22 | 0–31 | ✓ |
| option_length_ratio | 2.0 | ≤2.36 | ✓ |

Sentence-length spread 13–47 tokens (variance; law 7). Mechanical self-check:
**M-SCHEMA / M-BANDS / M-TELL / M-PLAGIARISM all pass** against the real
corpus. Original prose, invented entities — no verbatim ≥17-gram, containment 0.
