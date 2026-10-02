# Lane class: vfinal-audit (one unit, full history: unit + its verdict records + its reviews)
Adversarial meta-audit of ONE unit. Prime directive: REFUTE. Cold-solve every item from the passage
before reading any rationale, key or verdict; then mechanically re-check every quoted span in every
rationale against the passage; re-verify every repair_log claim on the bytes; re-weigh every carried
flag. `audit_verdict` CONFIRMED_CLEAN / CONFIRMED_NOTES / REFUTED. Findings carry the contract
severity {minor, note, info} for anything that does not touch a key and {major, critical} for
anything that does — a `major`/`critical` is an owner escalation, so cite bytes.

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
