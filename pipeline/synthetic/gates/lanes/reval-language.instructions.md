# Lane class: reval-language (full units, NOT blind) — gate {gate}
Three independent passes per unit (vote 1 read-aloud, vote 2 systematic grammar/typography, vote 3
register). Read two sentences either side of every span listed in `changed_spans.json`: the live
risk is a repair introducing a defect in the text it rewrote. Exact string, location and
replacement for every defect.

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
