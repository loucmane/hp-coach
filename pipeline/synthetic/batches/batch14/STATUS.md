# Batch 14 — status: PIPELINE COMPLETE — 6/6 promote PASS 2026-08-25, awaiting owner adjudication

**A replacement batch**: 6 long units taking the place of the 6 units the
whole-bank adjudication retired (5 architectural clones + 1 self-contradicting
passage). 27 questions. The first batch authored under laws 12–15
(architectural variety, name registry, phrase blocklist, surface quotas), each
generator given its retired predecessor as an explicit anti-model.

| unit | title | q | replaces |
|---|---|---|---|
| las-b14-001 | Kolmilor och tjärdalar (kolning/tjärbränning) | 4 | las-b6-001 (fäbodbruk — clone of las-b5-001) |
| las-b14-002 | Magasinet i Hökaryd (sockenmagasin) | 4 | las-b8-001 (humle — clone of las-b7-001) |
| las-b14-003 | Ishuset vid Långudden (isupptagning) | 4 | las-b11-001 (apotek — clone of las-b10-001) |
| elf-b14-001 | Buoy 43, Off Cleyburn (buoy tending) | 5 | elf-b6-001 (seed banks — clone of elf-b5-001) |
| elf-b14-002 | Inside the Bell at Kerrig (bell founding) | 5 | elf-b7-001 (cables — 3rd elf-b5-001 clone) |
| elf-b14-003 | Sallowgate's Empty Boxes (urban bat roosts) | 5 | elf-b8-001 (pearls — self-contradiction) |

## Final state

- **Promote: 6 PASS / 0 HOLD.** Aggregate `report-final.json`: 6× SURVIVED_FLAGGED,
  0 DEAD, 0 INCOMPLETE.
- **Fold: 6× VERIFIED_NOTES** (`reviews/final_verify.jsonl`), 0 audit majors on
  every unit.
- **Canonical mech 36/36** on the shipping bytes — M-SCHEMA / M-BANDS / M-TELL /
  M-FORM / **M-ECHO** / M-PLAGIARISM (`verdicts-regate2/verdicts-mech-final.jsonl`,
  2026-08-25T18:26:28Z). M-ECHO: 0 clone hits against the whole shipped bank.
- **Blind-solve agreement: 345/345.** G-KEY across two rounds × two legs plus the
  regate legs — every committed answer matched the key, no deviation in any leg,
  any round, any question.
- **0 self-kills post-repair:** G-DISTRACTOR 0 kills, G-STEM 0 kills. 17 of 27
  questions carry a live G-STEM flag (WORLD_KNOWLEDGE / PARTIALLY), each
  self-defended by the gate as *flag, not kill*.
- **Real-entity (law 16):** five fresh V-FINAL meta-audits web-checked every
  invented name; las-b14-003 carries its earlier audit. No same-domain
  collision, no invented words in a real person's mouth. One standing rename
  recommendation remains open (Bjärnhult, las-b14-002).

## Repair rounds

| round | trigger | units touched | what changed | re-gate |
|---|---|---|---|---|
| **Gate fleet R1** | G-STEM STRUCTURAL_LEAK ×2 legs on q4 | las-b14-002 (**DEAD**) | q4 redesigned end to end: new stem (*"Varför tar recensenten upp spruthuset…"*), 4 new options, key letter kept (B) | mech + G-KEY ×2 + G-DISTRACTOR + G-STEM |
| **Repair R1** | V-FINAL refuted 4 units | elf-b14-001, elf-b14-002, elf-b14-003, las-b14-001 | elf-b14-001 q2/B rewritten (defensible distractor + contradicting WHY-grounds) and 2 Nordic passage residues repaired (*spring floods→spring tides*, *drift ice→ground swell*); elf-b14-002 q3/B rewritten (rationale certified a true distractor as false) and q5/C widened out of a STRUCTURAL_LEAK; elf-b14-003 q2 redesigned (double-corroborated WORLD_KNOWLEDGE) + G-ENG *opened→put up*; las-b14-001 real-entity revert-and-restore + 4 G-SPRÅK passage repairs | mech + blind legs per unit; `verdicts-regate/` |
| **Repair R2** | G-REGISTER majors ×2, G-SPRÅK residues | las-b14-002, las-b14-001, las-b14-003, elf-b14-001 | las-b14-002 q2/A de-lifted (6-token verbatim run → 2) and q4's option block trimmed 22/20/21/23 → 13/13/14/13 words; byline *Vendela→Malena* (law-13 given-name diversity); *tjänar något argument→ska bevisa något alls*; las-b14-001 *låg still→låg stilla*; batch-wide em→en dash normalisation (authentic corpus 10435:1) | mech + G-KEY ×2 + G-DISTRACTOR + G-STEM + G-REGISTER + G-SPRÅK ×3; `verdicts-regate2/` |
| **V-FINAL re-run** | full re-verification on shipping bytes | all 6 | fresh G-KEY / G-DISTRACTOR / G-STEM legs, five fresh meta-audits, one severity-vocabulary re-encode of `audits/las-b14-001.json` (content preserved 11/11 — disclosed in ADJUDICATION § 4c) | `verdicts-vfinal/`, `verdicts-merged.jsonl` |

## Pointers

- **Owner surface:** `ADJUDICATION.md` — full passages, all 27 questions with keys
  marked, flags file-attributed, and the four **ÄGARBLICK** decisions.
- Aggregate: `report-final.json` · merged verdicts: `verdicts-merged.jsonl`
- Gate rounds: `verdicts/` → `verdicts-regate/` → `verdicts-regate2/` → `verdicts-vfinal/`
- Reviews: `reviews/{language,pedagogy,integrated,final_verify}.jsonl`
- Meta-audits: `audits/*.json` (see `las-b14-001.json` `encoding_note`)
- Shipping artifacts: `candidates-final/*.json` — **`candidates/` and
  `candidates-corrected/` are stage evidence, not the shipping bytes** (notably
  las-b14-001, deliberately left pre-entity-repair).

## Open items for the owner (detail in `ADJUDICATION.md`)

1. **elf-b14-001** — Q1/D collocation (*channel water*), passage *a relay→re-lay*,
   and the 9/9-flagged "35 metres" numeral.
2. **las-b14-001** — the two-mouth q3/D + q4/D cross-question channel (repair_log
   names only q4/D) and the *fyrtiotvå år i följd* vs *saknas hela band*
   contradiction.
3. **las-b14-002** — q3's three-leg FORMAL G-STEM lean, unadjudicated in writing;
   the Bjärnhult rename, deferred five times.
4. **Batch-wide** — option-length house style (no unit has a short-breath
   question; authentic floor is 11.8 words across 94/94 LÄS passages), G-STEM
   flag disposition policy, and the `vfinal_fold.py` severity-allowlist fix.

**On owner approval**, the 6 retired predecessors are excluded from the
product-bank import.
