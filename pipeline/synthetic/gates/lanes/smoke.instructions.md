# Lane class: smoke (ordinary report-only startup check — NOT a sandbox probe)
Read `smoke.json` — one short fixture text with one question — and answer it. Write exactly
`../reports/report.json` per `report.schema.json` with `candidate_id` "smoke-0001", your `answer`
letter and a one-line `note`. That is the whole task: it proves the claim → read bundle → write
report → close bead → drain-ack path on this agent with the production instructions unchanged.
Do not read anything outside this bundle, do not write anything else, do not inspect or report
your working directory, sandbox or host. Those facts are established operator-side, not by you.

## Contract (every lane)
- Read ONLY the files in this bundle directory. No network.
- Write EXACTLY `../reports/report.json`, valid against `report.schema.json`.
- Bead operations use only the exact allowlisted `gc` forms in your agent prompt.
