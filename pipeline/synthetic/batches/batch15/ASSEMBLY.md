# Batch15 — stage 2 assembly record (2026-08-25)

Seven generators (all claude-opus-5, parallel, disjoint domain lanes assigned
in the dispatch briefs; shared addendum `BRIEF-ADDENDUM.md`). All seven
self-ran `run_mech.py` clean before handoff. Canonical batch shape: 7 units,
20 questions (LÄS 4+2+2, ELF 5+5+1+1).

## Id map

| candidate_id | source | family | q |
|---|---|---|---|
| las-b15-001 | gen-las-long | garverihantverk-facktext-long | 4 |
| las-b15-002 | gen-las-short-1 | foreningslokaler-halltider-debatt-short | 2 |
| las-b15-003 | gen-las-short-2 | namnsdagsseden-essa-short | 2 |
| elf-b15-001 | gen-elf-long | phage-therapy-matching-science-journalism-long | 5 |
| elf-b15-002 | gen-elf-cloze | ELF-CLOZE-001 / village-noticeboard-pruning-society-commentary-cloze | 5 |
| elf-b15-003 | gen-elf-short-1 | ELF-TYPE-001 / welded-rail-ballast-resistance-engineering-short | 1 |
| elf-b15-004 | gen-elf-short-2 | ELF-TYPE-002 / turnpike-side-bar-what-a-gate-is-worth-history-essay-short | 1 |

`gen-*.json` / `gen-*.NOTES.md` are stage-1 evidence and stay as written;
`candidates/*.json` are canonical from here.

## Name sweep (batch-level given-name dedup — new step after batch14's Vendelas)

- Intra-batch: zero given-name collisions across the seven units. One was
  prevented mid-generation by the essay generator itself (its Gunvor renamed
  to Barbro on seeing the sibling's Gunvor Slättmar).
- Cross-batch: **Sixten Rimhall (las-b15-003) renamed to Algot Rimhall at
  assembly** — the bank already ships Sixten Rehn (las-b8-001) and Sixten
  Frejmark (las-b13-001); a third would recreate the Vendela defect. Change
  is passage + metadata with an audit note in `originality_note`; the source
  gen file is untouched. (The pre-existing Rehn/Frejmark pair is itself a
  register echo — noted for the batch15 ADJUDICATION, not actionable here.)
- Addendum gap found: the registry lists full-name pairs only, so bare
  given-name reuse against shipped units is invisible to generators. Fixed
  operationally by this sweep; fold it into the next batch's addendum.

## Flags carried to the fleet and V-FINAL

1. **Law-16 verification ran degraded batch-wide**: session WebSearch budget
   exhausted (200/200); all name checks went through Exa (semantic, not
   exact-phrase) + Wikipedia. Every generator logged queries re-runnably and
   flagged kept names for V-FINAL re-verification instead of certifying.
   V-FINAL auditors must re-run real-entity checks with whatever exact-phrase
   search is then available.
2. **Domain adjacency, ELF shorts**: elf-b15-003 (railway track mechanics)
   and elf-b15-004 (turnpike toll economics) are both broadly transport
   infrastructure. Different families (TYPE-001 vs TYPE-002), genres and
   centuries; stated here so G-REGISTER judges it deliberately.
3. **Generator-declared residual edges** (from NOTES, for the audits):
   elf-b15-003 distractor A is the designed live edge (repair recipe in its
   NOTES §8); elf-b15-001 Q5/D carries the usual TYPE-005 exposure and ¶5
   has one cuttable clause; elf-b15-004 option B is the strongest rival by
   design.
4. **Audit severity contract** (batch14 lesson): auditors write
   `findings[]` severities ONLY from `{minor, note, info}`; resolution
   history goes in `resolved_findings`/`cleared`, never as non-standard
   severity values — `vfinal_fold.py` counts unknown severities as majors.
