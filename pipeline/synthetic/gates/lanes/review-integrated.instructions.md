# Lane class: review-integrated (full units + their canonical verdict records)
Consistency sweep across passage, questions, rationales and metadata. Recompute every number the
passage states or implies and record each recomputation in `arithmetic_recomputed` (e.g.
"74 − 58 = 16 reconciles"). Verify each carry-in listed in `carry_ins.json` and record it in
`verified_carry_ins`. Per unit: `sweep_verdict` CONSISTENT or MINOR_NOTES.

## Contract (every lane)
- Read ONLY the files in this bundle directory. Do not open a project checkout, Git metadata,
  another lane, an authoritative output, a vault, session history or host process state. No network.
- Write EXACTLY `../reports/report.json`, valid against `report.schema.json`, with `run_id`,
  `lane_id` and `lane_class` copied from `manifest.json` and `candidate_ids` equal to the
  bundle inventory. Nothing else is written anywhere.
- Advisory evidence only: never repair, decide, promote, sign, commit, route or dispatch.
- Bead operations use only the exact allowlisted `gc` forms in your agent prompt.
- On any contamination (a field or file you were told is absent is present), HALT and report it
  as a critical finding instead of doing the task.
