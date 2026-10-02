# Lane class: review-pedagogy (full units, NOT blind)
Does each rationale teach the student the right thing about the key and about every distractor?
Hunt: rationales that name the wrong reason, diagnose an option that no longer exists, mis-teach a
grammar or usage point, or leave a distractor undiagnosed. Per unit: `verdict` SOUND or MINOR_FIXES;
fixes only as exact substitutions (`fix.path/old/new`).

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
