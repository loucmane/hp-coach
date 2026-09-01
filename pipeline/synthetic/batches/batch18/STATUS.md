# Batch 18 — status: PIPELINE COMPLETE — 7/7 promote PASS 2026-09-01, awaiting owner PAKETDOM

> **No bank import has happened, and none is prepared.** There is no `candidates-final/` in this
> batch, `pipeline/synthetic/RETIRED.json` carries zero batch18 entries, no batch18 id occurs
> anywhere under `data/` or `app/`, and `batches/batch18/` is still untracked on
> `p5/batch18-19`. The seven units stand at the owner-package boundary: the ruling recorded in
> `ADJUDICATION.md` is what releases them, and nothing merges, imports or deploys before it.

**7 units, 20 questions** — the canonical P5 shape (LÄS 4+2+2, ELF 5+5+1+1), authored under
`BRIEF-ADDENDUM.md`: batch17's addendum, the 2026-08-31 efterhandstillägg, and the batch18
supplement's four new binding rules — **RULE 11** (no cross-question lexical or conceptual
bridges, from las-b17-001's demonstrated 4/4 blind solve), **RULE 12** (a stem must not entail
any option, from elf-b17-003), **RULE 13** (style-tell clustering; the M-FORM absolutizer family
declared complete), **RULE 14** (the proven law-16 transport recipe, with one-letter variant
probing and positive controls on the same endpoints in the same session).

| unit | title | q | family |
|---|---|---|---|
| las-b18-001 | Kalkugnarnas landskap (lime burning, the ugnslag, kiln remains) | 4 | kalkbranning-facktext-long |
| las-b18-002 | Fel timmar att spara in på (elljusspår lighting cuts, kommun debate) | 2 | elljusspar-slackning-debatt-short |
| las-b18-003 | Sätena i kyrkbåten (church-boat seating order, etiquette vs seamanship) | 2 | kyrkbatslag-roddordning-essa-short |
| elf-b18-001 | Under the Flags (street-tree root cells, pavement heave) | 5 | street-tree-root-cells-pavement-heave-science-journalism-long |
| elf-b18-002 | Left to Soak *(cloze, 5 gaps)* | 5 | ELF-CLOZE-001 / office-kitchen-washing-up-society-commentary-cloze |
| elf-b18-003 | Hair and Lime *(short, 1 q)* | 1 | ELF-TYPE-001 / clay-tile-nib-torching-mortar-building-science-short |
| elf-b18-004 | Sittings to Let *(short, 1 q)* | 1 | ELF-TYPE-002 / pew-rent-seating-plan-single-sittings-history-essay-short |

## Rounds

| round | what ran | outcome |
|---|---|---|
| **Generation** (`gen-*.json` + `gen-*.NOTES.md`, 2026-09-01) | seven lanes authored against the supplement; every unit's `generator_meta` carries `date: 2026-09-01`, `origin: batch18-generator` | 7 candidates. (The owner rulings the supplement encodes — `check_sheet_sync.py` mandatory, `merge_verdicts.py` sole merge path, the completed absolutizer family — are dated 2026-08-31, bead hpf-y1p4; the authoring itself is all 2026-09-01) |
| **Round 1 — gate fleet** (`verdicts/verdicts-*.jsonl`, no suffix) | mech ×6 gates, G-KEY ×2 legs, G-STEM, G-DISTRACTOR, G-REGISTER, G-SPRÅK ×3, G-ENG ×3 | **8 kill records, on 2 of 7 units.** G-KEY 2 legs × 20, every committed answer matching · **G-STEM 4 kills / 12 flags / 4 pass** (elf-b18-001 q:3 and q:5, las-b18-001 q:1 and q:3 — two bare-absolutizer strips, one recall-only key, one sibling-stem leak) · **G-ENG 3-of-3 unanimous kill** on elf-b18-002 (gap-5 frame `most kitchens ___` plural against four 3sg options) · **G-SPRÅK 3-of-3 unanimous kill** on las-b18-001 (`bränndes`, a non-form; passive of *bränna* is *brändes*) · G-DISTRACTOR 16 pass / 4 flag · G-REGISTER 6 pass / 1 flag (elf-b18-001, cross-batch register echo of elf-b17-001's closing scoring construction) |
| **Repairs** (`generator_meta.repair_log`, append-forward) | **fleet-repair-1 … fleet-repair-6**, plus the 3b/3c sub-tickets | fleet-repair-1 answered the two unanimous kills and the G-REGISTER major; fleet-repair-2 rebuilt the four G-STEM-killed option sets and broke las-b18-002's cross-question bridge; fleet-repair-3 (+3b/3c) took the solver-convergent passage and rationale defects the round-3 blind reads surfaced, 3c repairing a clause 3b had botched; fleet-repair-4 discharged the review HOLDs and the V-FINAL audit findings; fleet-repair-5 and -6 are elf-b18-002 only. **5 units repaired on student-facing bytes, 2 on metadata and rationale only. No key letter moved in any unit, in any round** — the repair logs assert it and the audits verified it byte-exactly |
| **Re-legs r1→r4** (`verdicts/verdicts-*-{releg,r2,r3,r4}.jsonl`) | targeted re-runs of the affected units after each repair round | **0 kills in any re-leg.** re-leg (elf-b18-001/002, las-b18-001): G-KEY 2×14 all matching, G-ENG 6 pass, G-SPRÅK 3 flag, G-REGISTER 1 flag (repair desync in a q4 rationale quote) · r2: G-KEY 2×11, G-STEM 15 flag / 5 pass, G-DISTRACTOR 9 pass / 2 flag · r3: G-KEY 2×9, G-STEM 3 flag / 1 pass, G-DISTRACTOR 9 pass, G-ENG 3 pass, G-REGISTER pass, G-SPRÅK 6 flag · r4: G-KEY 2×11, G-STEM 4 flag / 2 pass, G-DISTRACTOR 11 pass |
| **Reviews** (`reviews/{language,pedagogy,integrated}.jsonl`) | language, pedagogy, integrated — append-forward journals | **3 HOLDs, all discharged in-journal.** language: las-b18-002 HOLD → CORRECTED (`+ orchestrator fix 3c`); pedagogy: las-b18-001 HOLD → MINOR_NOTES (`+ fleet-repair-4 + G-STEM-r4 verification`), las-b18-003 HOLD → MINOR_NOTES (`+ V-FINAL audit counter-analysis`). A later `coordinator/vocab-normalization` pass appended four rows normalising verdict vocabulary to the promote schema. No line was overwritten |
| **V-FINAL meta-audits** (`audits/*.json`) | seven adversarial refute-directed audits | **7× CONFIRMED_NOTES, 0 majors, 75 findings** (12 / 10 / 9 / 15 / 11 / 10 / 8), severity contract honoured — `findings[].severity` only from {minor, note, info}. **elf-b18-002 reached it through a re-audit chain: REFUTED → REFUTED → CONFIRMED_NOTES**; round 3 booked VF-01 major (a bare false universal in `clone_note`), re-issue #1 booked VF-14 major after fleet-repair-4 *replaced a false universal with a false universal*, and re-issue #2 cleared it against an exhaustive enumeration of all 114 shipped titles |
| **Fresh V-FINAL legs** (`verdicts-vfinal/`) | G-KEY ×2 independent legs + G-DISTRACTOR, on the final shipping bytes | **G-KEY 2 legs × 20 = 40 records, both legs unanimous, every solver answer equal to the key, 0 kills 0 flags** (re-verified here against `candidates/*.json`). **G-DISTRACTOR 19 pass / 1 flag / 0 kills** — the single flag is elf-b18-001 q:1 option C, `arguable` |
| **Fold + promote** (`reviews/final_verify.jsonl`, `report-final.json`) | `vfinal_fold.py` then `promote.py --require-clean` | **fold 7× VERIFIED_NOTES** · aggregate: 6× SURVIVED_FLAGGED, 1× SURVIVED_CLEAN, 0 DEAD, 0 INCOMPLETE · **promote `--require-clean`: PASS 7 / HOLD 0** (re-run for this package, exit 0) |
| **Stage 11 — fresh-eyes + adjudication fold** (`adjudication-evidence/`, `adjudication-flags.json`, `reviews/adjudication.jsonl`) | seven cold readers on blind sheets with no pipeline history, then triaged flags → `adjudicate_fold.py` | **20/20 cold-solve answers match the shipped keys** (counted independently from `adjudication-evidence/` against `candidates/*.json`) · **0 reader blockers**, all seven `makes_sense: true` · naturalness **natural ×2** (elf-b18-002, las-b18-003), **minor_friction ×5** · fold: **7× GODKANN_NOTED** |

## Final state

- **Promote: 7 PASS / 0 HOLD**, re-derived for this package. Aggregate `report-final.json`:
  6× SURVIVED_FLAGGED, 1× SURVIVED_CLEAN (elf-b18-002), 0 DEAD, 0 INCOMPLETE.
- **Canonical merged fleet `verdicts.jsonl`: 150 records, 0 kills.** Composition — mech 42
  (6 gates × 7 units, all pass), G-KEY 40 pass, G-STEM 13 flag / 7 pass, G-DISTRACTOR 19 pass /
  1 flag (elf-b18-004 q:1), G-ENG 12 pass, G-REGISTER 7 pass, G-SPRÅK 9 flag. Every round-1 kill
  is repaired and re-legged; the merged file is the final fleet state, not the round-1 tally.
- **Blind-solve agreement: 100 % on every leg that ran.** Round-1 fleet 2 legs × 20, three
  targeted re-leg waves (2×14, 2×11, 2×9, 2×11), and V-FINAL 2 legs × 20 on the shipping bytes.
  No committed blind answer anywhere in the batch disagreed with the key, before or after repair.
- **Canonical mech: 42/42, and M-ECHO was in the run** — M-SCHEMA / M-BANDS / M-TELL / M-FORM /
  M-ECHO / M-PLAGIARISM across seven units, both at r4 (`verdicts-mech-r4.jsonl`) and on the
  final bytes (`verdicts-mech.jsonl`), M-ECHO indexed against 114 shipped units. This closes the
  batch15/batch17 gap where M-ECHO was absent from the fleet run.
- **Live gate flags carried into adjudication: 13 G-STEM, 9 G-SPRÅK, 2 G-DISTRACTOR** (the fleet
  flag on elf-b18-004 q:1 plus the V-FINAL flag on elf-b18-001 q:1), all triaged into
  `adjudication-flags.json` at their verbatim gate severities. The fold's coded rule treats
  gate-sourced flags on a promoted unit as already adjudicated by the pipeline and surfaces them
  as notes; nothing escalated to ÄGARBLICK mechanically.
- **Audit-coverage boundary, stated plainly.** Six of the seven meta-audits were issued
  **before** fleet-repair-4 (audits 14:19–14:29, candidates last written 14:44–15:33), and
  fleet-repair-4 is precisely the round that discharged their findings. Only elf-b18-002 was
  re-audited on post-repair bytes, and even there fleet-repair-6 (a `typography_note` metadata
  deletion) landed after its re-issue. What *did* read the exact shipping bytes: the four fresh
  V-FINAL blind legs, `vfinal_fold.py`, `promote.py`, and the seven stage-11 cold readers — so
  every key, option and passage a student will see has been independently solved and judged on
  the final text. The unrepeated layer is the adversarial metadata audit, not the item.
- **Law 16 (real entities):** the RULE 14 transport held this batch — exact-phrase indexes with
  positive controls fired in-session (`Pellew` 701, `Nether Stowey`, `Flarken`, `Syd Dernley`).
  One escalation survives: **elf-b18-004's `originality_note` certifies that no real place sits
  one letter from `Stintbury` while naming `Saintbury` among the neighbours it clears** —
  Levenshtein 1, a real Gloucestershire village and civil parish with its own parish church. The
  exact-name blocking test still passes on all three legs. Owner item, unruled.

## Pointers

- **Owner surface:** `ADJUDICATION.md` — the PAKETDOM request, the six-item decision ledger, the
  batch20 carry-forwards, and the import boundary.
- Aggregate: `report-final.json` · merged verdicts: `verdicts.jsonl` (**a convenience merge**;
  the per-leg files under `verdicts/` are the record)
- Gate rounds: `verdicts/` (round 1 + `-releg` / `-r2` / `-r3` / `-r4` re-legs) →
  `verdicts-vfinal/` (fresh G-KEY ×2 + G-DISTRACTOR on shipping bytes)
- Mech: `verdicts-mech.jsonl` (final bytes) · `verdicts-mech-r4.jsonl`
- Reviews: `reviews/{language,pedagogy,integrated,final_verify,adjudication}.jsonl`
- Meta-audits: `audits/*.json` (7) — elf-b18-002's carries its three-round `audit_history`
- Stage-11 fresh eyes: `adjudication-evidence/*.json` (7) · triaged flags:
  `adjudication-flags.json`
- Gate input sheets: `blind/` (passage, no keys), `stems/` (no passage), `distractor/`
- Brief and generation: `BRIEF-ADDENDUM.md`, `gen-*.json` + `gen-*.NOTES.md`
- **Shipping artifacts: `candidates/*.json`.** This batch has no `candidates-corrected/` and no
  `candidates-final/` — `candidates/` *is* the shipping bytes, and every repair round wrote into
  it append-forward with a `repair_log` ticket.

## Open items for the owner (detail in `ADJUDICATION.md`)

1. **STINTBURY ~ SAINTBURY** (elf-b18-004) — invented toponym at edit distance 1 from a real
   Gloucestershire parish, in the same domain as the passage; ships under a do-not-rename hold
   pending the ruling.
2. **VF-19 residual** (elf-b18-002) — four verified-true law-15 sub-claims silently deleted from
   `clone_note` by fleet-repair-5 and deliberately not restored.
3. **Lane-clone / rural fire crafts** — four of the last six LÄS long slots; las-b18-001 is one
   of the back-to-back pair. G-REGISTER major recorded, explicitly not adjudicated.
4. **Absolutizer-habit policy tension** — batch-wide, carried.
5. **G-DISTRACTOR V-FINAL flag** (elf-b18-001 q:1 C) — arguable, not defensible.
6. **Fearnbeck sand/mortar seam** (elf-b18-001) — new from the stage-11 reader, no key touched.

**On owner PAKETDOM**, and not before, the 7 units enter the product-bank import.
