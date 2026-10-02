# Batch20 — resume point (2026-09-02, GATES COMPLETE, tracked as hpf-ldjj)

## Status: all 7 units through the gate fleet; nothing owed before the review chain

`verdicts.jsonl` assembled (152 records, chronological last-wins across mech/r1/r2/r3/r4,
G-SPRAK/G-ENG/G-REGISTER targets normalised to "passage").
`aggregate.py` -> **7 SURVIVED_FLAGGED, 0 DEAD, 0 INCOMPLETE.**

Round-over-round: G-KEY 40/0 -> 40/0 -> 22/0 -> 10/0 (all legs unanimous, all match keys).
G-STEM kills 8 -> 3 -> 1 -> 0. G-DISTRACTOR 17/3/0 -> 19/1/0 -> 11/11/0 -> 5/5/0.
G-SPRAK 1 unit DEAD -> 0 kills -> 0 kills. G-ENG 2 kills -> 1 -> 1 -> **0 (r4, DONE)**.
G-REGISTER 2p/5f -> 5p/2f. RULE 15 pairs: 1 kill + 1 flag -> both pass.
Repair rounds: fleet-repair-1, -2, -3 (elf-b20-001 also -3 on q5; las-b20-001/-003 -3 on language).

## G-ENG round 4 on elf-b20-001 — DISCHARGED 2026-09-02 16:46 (do not repeat)

`verdicts/verdicts-geng-r4.jsonl` carries three votes (flag / flag / pass) on the
fleet-repair-3 bytes; they are folded into the canonical and supersede the r3 kill.
Canonical kills = 0. An earlier version of this note listed the round as owed; it was
written before the run and is corrected here.

## Tracking (2026-09-02)

Beads: **hpf-ldjj** (this batch's Gas City completion package). Worklog:
GasCity/hpfetcher/Docs/worklogs/hpf-ldjj.md. Digests: `DIGESTS-completion-hpf-ldjj.json`.
Package: `../GC-COMPLETION-PACKAGE-b20-b21.md`. Delegation-authorization gap for the native
agent rounds is recorded in the bead and worklog, not excused.

## Remaining chain (executed as the hpf-ldjj package; not started)

reviews (language/pedagogy/integrated) -> V-FINAL audits x7 -> fresh V-FINAL legs
(G-KEY x2 + G-DISTRACTOR into verdicts-vfinal/) -> vfinal_fold -> promote --require-clean
-> stage-11 fresh-eyes x7 + adjudication-flags.json + adjudicate_fold -> STATUS.md +
ADJUDICATION.md -> signed commit. NO bank import; owner PAKETDOM required.

## Owner-package items already banked

- **Main-idea structural floor.** elf-b20-001 q5 measured at ~50% after three repair
  rounds. Accepted as structural, not chased: a main-idea key is necessarily the
  best-corroborated option on a well-built sheet, because the other four questions are
  made out of the same text. Batch19's ELF long hit the same wall; batch21's TWO
  main-idea questions hit it by a third mechanism. POLICY QUESTION for the owner:
  accept a disclosed ~2-in-5 floor on main-idea items over multi-voice texts, or drop
  main-idea questions from long passages that also carry four detail questions.
- **Repairs generate defects.** All three rounds introduced a new defect in the text
  they rewrote, never in the string they were told to fix (severed antecedent r1; three
  rationale defects r2; one per LAS unit r3). Every round caught its predecessor's
  collateral. This is the argument for re-gating everything after every repair.
- elf-b20-001 q5 key D is now the longest option by characters (142 vs 116/121/119)
  because r3 rewrote A/B/C around a byte-identical key. Weak visual cue only; by word
  count D is not the outlier and "longest wins" scores 1/5 across the sheet. If ever
  closed, the fix is to lengthen A/B/C, not trim D.
- las-b20-001 carried finding: q1 stem says `huvudrannan`, q1 rationale says
  `ett tilloppsdike` for the same conduit. Content consistency, for integrated review.
