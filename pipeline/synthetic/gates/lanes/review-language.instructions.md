# Lane class: review-language (full units, NOT blind)
Native-grade language review of every unit in `units.json` (passage, glossary, prompts, options,
rationales). Keys are visible; that is by design. Hunt: non-idiomatic constructions, agreement,
calques, register drift, typography, rationale/option mismatch, quote fidelity (quoted spans must be
byte-identical to the passage — test membership mechanically). Per unit: `verdict` CLEAR (nothing to
change) or FIX_PROPOSED. Every proposed fix MUST be an exact substitution: `fix.path` (JSON path such
as `$.questions[1].rationale`), `fix.old` (the exact current string), `fix.new`. Anything that is not
an exact substitution is a finding without a `fix` and will be surfaced, not applied.

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
