# Batch 1 — language corrections applied

The expert language reviewers (`expert-language-review`) did not just flag —
they **applied** their language-safe edits and the corrections were
independently re-verified. `candidates-corrected/` is the language-cleared
batch; `candidates/` keeps the originals for this diff.

**Re-verification of the corrected set (all passed):**
- Mechanical: 21/21 (7 units × M-SCHEMA/M-BANDS/M-PLAGIARISM).
- Structural diff: every `key`, option letter, question count, and
  `generator_meta` byte-identical to the originals.
- Blind G-KEY ×2 (independent): all 15 questions × 2 runs solved to the **same
  stored key** — no answer moved.
- G-DISTRACTOR: **0** defensible second answers across all 7 units — no trap
  broken, including the two units whose option text changed.

## Edits, by unit

**las-b1-001** (LÄS) — 2 applied
- `betjänar grödorna` → `pollinerar grödorna` (verb calque)
- `tvilling att jämföras med` → `tvilling att jämföra med` (passive infinitive)

**las-b1-002** (LÄS) — 1 applied
- glossary headword given a referent: `en enda uppgift:` → `en enda uppgift ur
  platsens besöksekonomi:` (frame — the glossed word now appears in the passage)

**elf-b1-001** (ELF) — 1 applied
- `sat a battery of attention tasks` → `took a battery…` (BrE→AmE, matching the
  unit's declared variety)

**elf-b1-003** (ELF) — 3 applied
- `drive up dense clouds of … moths` → `flush up …` (collocation)
- `the bats stir loose` → `the bats shake loose` (collocation)
- option D `The owls following the bats…` → `The owls' own pursuit of the
  bats…` (parallelism; key still C, trap preserved — re-verified)

**elf-b1-004** (ELF) — 3 applied
- `funded from general taxes` → `funded from general taxation`
- q1 prompt `…so reliably kept?` → `…so reliably kept lit?` (clarity)
- option D `served their own interest.` → `served their own interests.` (key
  still D — re-verified)

**elf-b1-002** (ELF cloze) — **escalated, not applied**
- Two collocation notes (`popularity … deepened`, `erode … overnight`) were
  **deliberately not applied**: the verbs are load-bearing for the gap-option
  eliminations, so changing them is trap design, not a language fix. Routed to
  the trap gate for a deliberate call. Unit left byte-for-byte unchanged.

**las-b1-003** (LÄS) — clean, no edit (PUBLISH_READY).
