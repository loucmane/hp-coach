# Eval run 2026-07-24 — G-REGISTER cloze-scope + M-TELL/M-FORM + G-KEY split-vote rule

**Verdict: PASS** (certified report: `report-certified.json`; attempt-1 report: `report.json`)
Git SHA at certification: ed053c4a350b0723fa887b86536790aef07f27b8 · Judges: claude-opus-4-8 · Items: 31 (15 authentic + 16 seeded incl. new elf-b0-016) + 3-cloze supplement

## What this run certifies

1. **G-REGISTER cloze-scope amendment** (owner decision 2026-07-24): the numbered-gap
   FORMAT is outside the gate's jurisdiction; register remains fully in.
   Both directions asserted: the 3 shipped clozes (elf-b1-002, elf-b2-002,
   elf-b4-002) PASS under the amended prompt; the new register-broken cloze seed
   **elf-b0-016** (structurally valid cloze, clickbait/blog passage) DIES by
   exactly G-REGISTER — the exemption does not rubber-stamp cloze content.
2. **M-TELL + M-FORM mech additions** (protocol trigger 3, retroactive coverage):
   both ran in the mech stage; no authentic item killed or destabilized.
3. **G-KEY split-vote rule** (gkey_resolve.py): a lone mismatching blind vote with
   a key-matching sibling is now a lethal-severity FLAG, not a kill; kill requires
   mismatch MAJORITY or a MULTIPLE_/NONE_DEFENSIBLE self-kill.

## The two attempts (full honesty trail)

- **Attempt 1 — FAIL.** Authentic item las-b00-005 ("Ett sluttande plan?", euthanasia
  debate) went DEAD: solver vote 1 answered C (= stored key), vote 2 answered D, and
  the old either-mismatch-kills rule executed it. Orchestrator diagnosis: the stored
  key C is defensible (Norlén's societal-habituation framing; D over-medicalizes her
  "glider på indikationerna" into disease reclassification she never asserts);
  3 of 4 historical blind solves agree with C. Single-solver error on a hard item.
- **Fix.** Split-vote rule implemented in gkey_resolve.py with tests (60/60 suite):
  dissent-with-matching-sibling → flag; mismatch majority / self-kill → kill.
  vfinal_fold.py surfaces gkey flags as VERIFIED_NOTES.
- **Attempt 2 — PASS.** The SAME frozen judge outputs re-resolved under the new rule
  (no re-rolling of any judge; the resolver is deterministic post-processing, so the
  recorded solver answers exercise it fully — including the split-vote case and the
  both-mismatch wrong-key seeds, which still die with `got=G-KEY`):
  authentic false kills 0/0 · seeded kill-by-right-gate 15/15 · hard negative survives
  · las-b00-005 = SURVIVED_FLAGGED (dissent surfaced, not executed).

## Score table

See `report-certified.json`. Summary: SURVIVED_CLEAN 9 · SURVIVED_FLAGGED 7 · DEAD 15 · INCOMPLETE 0.
Supplement: elf-b1-002 pass · elf-b2-002 pass · elf-b4-002 pass.

**The amended stack is CERTIFIED for batch gating** (unlocks batch 8 incl. its
restored cloze, and the elf-b3-002 re-gate).
