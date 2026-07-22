# Batch 2 — status: COMPLETE — 6/7 units through the FULL automated pipeline, promote gate CLEAN

First batch run end-to-end by `pipeline/run-batch.workflow.js` (stages 4–9
automated: gate fleet → gkey_resolve → aggregate → language → pedagogy →
integrated sweep → promote). 32 agents, 0 errors. `promote.py --require-clean`
exits 0: **6 PASS, 0 HOLD** — every shipped unit cleared every stage, machine-verified.

## Result

| unit | section | q | gate fleet | language | pedagogy | integrated sweep |
|---|---|---|---|---|---|---|
| elf-b2-001 | ELF long (fog-nets) | 5 | survived | CLEAR | SOUND | MINOR_NOTES (fixed) |
| elf-b2-002 | ELF cloze (four-day week) | 5 | survived | CORRECTED | SOUND | MINOR_NOTES (fixed) |
| elf-b2-003 | ELF short | 1 | survived | CLEAR | SOUND | CONSISTENT |
| elf-b2-004 | ELF short | 1 | survived | CLEAR | SOUND | MINOR_NOTES (fixed) |
| las-b2-002 | LÄS short (school lunches) | 2 | survived | CLEAR | SOUND | CONSISTENT |
| las-b2-003 | LÄS short (church organs) | 2 | survived | CLEAR | SOUND | MINOR_NOTES (fixed²) |
| las-b2-001 | LÄS long (church-mural conservation) | — | **DEAD (G-STEM q:4)** | — | — | — |

**16 questions shipped** to `candidates-final/` (batch1: 20 → running total 36).

## The kill (feeds batch 3 generation as a negative example)

`las-b2-001` q:4 — G-STEM structural leak: the stem premise (painting fields in
the SAME church preserved differently) makes the key a logically necessary truth
about a controlled comparison; blind-answerable without the passage. First fleet
kill on real batch content — the gates are earning their keep. Autopsy in
`verdicts/verdicts-gstem.jsonl`. Batch 3 regenerates the LÄS-long slot.

## The sweeper's first live catch (validates the integrated-review layer)

The integrated sweep caught **exactly its predicted highest-yield failure** on
its first automated run: in `elf-b2-001`, an upstream review edited option A's
wording but the rationale still "quoted" the pre-edit text — an orphaned quote
no siloed gate can see. Same class in `elf-b2-002` and `las-b2-002` (quoted
spans not verbatim after edits). All rationale-only, fixed in place, re-verified.

## Owner flag (spot-check item)

- `las-b2-003` option A says **"flera"** where the passage says **"ett par"** —
  a quantity inflation in a *distractor* whose wrongness doesn't hinge on the
  count (detail_as_main trap; key unaffected). Fixing it touches an option and
  would need a blind re-gate, so it was deliberately NOT auto-applied.
  Say the word and it gets the edit + re-gate; otherwise it ships as-is.

## Verification trail

- `verdicts/` — all 11 judge files + `verdicts-gkey-resolved.jsonl`; merged `verdicts.jsonl`; `report.json`
- `reviews/{language,pedagogy,integrated}.jsonl` — one record per unit per stage (last record wins)
- `promote.py --batch-dir batches/batch2 --candidates-dir batches/batch2/candidates-final --require-clean` → exit 0
- Structural check: keys/option letters/option texts/prompts byte-identical
  candidates-corrected → candidates-final for all rationale/metadata-only edits; mech 0 non-pass post-edits.
