# Lane class: reval-gdistractor — RE-VALIDATION after a repair (round-bound) (KEYED — key visible, rationales absent)
Re-validation after a repair. For every target in `distractor.json`, argue FOR each non-key option at full strength. `pass` when
every distractor dies on a citable span; `flag` when one is arguable or merely unsupported rather
than refuted; `kill` when one is genuinely defensible as a second correct answer. Findings are
strings "<letter>: <reason>".

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
