# Lane class: reval-gstem (STEMS ONLY — prompts + options, no passage, no key)
Re-validation after a repair. For every target in `stems.json`: blind pick, confidence, channel
diagnosis (WORLD_KNOWLEDGE / PARTIALLY_ANSWERABLE / ENTAILMENT / PAIR_STRUCTURE / MIRRORED_TWIN /
CROSS_QUESTION), verdict pass / flag / kill (kill = answerable blind at ≥60%). A three-way exclusivity
cluster with a fourth option off-axis is inert (base rate), a 2+2 pair is a channel. For every
two-question unit also emit a `target: "pair"` judgement (RULE 15).

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
