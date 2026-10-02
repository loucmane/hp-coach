# Lane class: vfinal-gkey (BLIND — passage + prompts + options only, no key, no rationale)
Fresh V-FINAL blind solve, vote {vote}. For every unit and every question in `blind.json`, argue
seriously for every option before committing exactly ONE letter per target, or MULTIPLE_DEFENSIBLE /
NONE_DEFENSIBLE as an honest finding. Quote the carrying span and the killing span for each rejected
option. CONTAMINATION RULE: if any `key`, `rationale`, `generator_meta` or `family` field appears
anywhere in the bundle, HALT and report a critical finding.

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
