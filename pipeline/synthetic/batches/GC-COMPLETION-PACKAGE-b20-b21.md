# Gas City completion package v5 — batch20 (hpf-ldjj) then batch21 (hpf-mjml)

Revised 2026-09-03 after the Codex HOLD reviews of v1–v4. **Not dispatched.** hpfetcher rig suspended
and zero sessions throughout preparation; no tracked file changed; batch18/19 and PRs #370/#371
untouched. Authorization request: `GC-COMPLETION-AUTHREQ-b20-b21.txt` (its sha256 is the
envelope's `request_sha256`). Beads hpf-ldjj, hpf-mjml (blocked-by hpf-ldjj); worklogs in the
classified vault.

## 0. What the review found and what changed

| # | finding | resolution | proof |
|---|---|---|---|
| 1 | `assemble_verdicts --check` compared identities only; a pass→kill edit passed | `--check` now compares the COMPLETE normalised record multiset; only order may differ; identity-set and byte-identity reported separately | `tests/test_assemble_verdicts.py` (pass→kill, findings-only change, reorder-only, CLI exit codes). batch20's reordering re-proved against the **preserved** pre-change file, now kept in the batch as `verdicts-canonical-pre-assemble_verdicts-20260902.jsonl` (sha 3f48522f…): record-multiset identical, bytes differ; the current canonical is byte-reproducible |
| 2 | missing verdicts/audits became "zero flags" | `build_adjudication_flags` fails closed on a declared inventory: candidates, canonical verdicts with full gate coverage per unit and target, unique identities, V-FINAL distractor coverage, one audit per unit with the audit contract; malformed JSON is an input error, never empty | `tests/test_build_adjudication_flags.py` (14 cases: missing, empty, malformed, unknown unit, duplicate identity, missing vote / gate / mech / language, missing V-FINAL target, bad severity, duplicate finding id, rule order, truncation, batch19 byte-identical). batch18 is now byte-identical too. batch20 today correctly fails closed (no V-FINAL yet) |
| 3 | no executable workflow; invented `pre_promote`; profile freeze not applicable | the completion chain is NOT a profile run (§3). Lanes are built by `lane_bundle.py` from the batch sheets with closed inventories, class-specific forbidden-pattern scans, deterministic rebuild, stage binding, jsonschema report validation and append-forward ingest; nine lane classes have bound schemas + instructions under `gates/lanes/`; exact-string repairs run through `apply_exact_fixes.py` | `tests/test_lane_bundle.py`, `tests/test_apply_exact_fixes.py`, and `tests/test_completion_walkthrough.py` — every stage transition through the real fold/promote scripts on a fixture batch |
| 4 | digest checker was all-or-nothing; rewrite replaced the binding; both baselines shared one HEAD | `completion_digests` v2: immutable `baseline` (refuses overwrite; `--supersede` records the prior sha and keeps the file), `snapshot --stage --prior --allow` with explicit allowed deltas, exact `verify`; executed tool copies hashed (7 files), PR #370 blobs kept as references; HEAD change is an explicit allowed delta at the post-commit snapshot; batch21's baseline is re-taken after batch20's commit | `tests/test_completion_digests.py` (baseline once, supersede, exact verify, allowed vs disallowed delta, head transition, executed-tool tamper); walkthrough S5/S6 |
| 5 | isolation claims exceeded the configured boundary | §5 rewritten to what the configuration enforces vs what the prompt asks; the offline `codex sandbox` probe I attempted was declined by the operator gate, so nothing is claimed as measured; a mandatory S00 smoke lane and a per-lane write-scope proof are added | request items 1 and 7 |
| 6 | 25+5 was wrong; expiry preceded the commit | 20 fixed + ≤5 conditional per batch (+1 smoke); budget rule; closeout ordering release → commit → post-commit snapshot → closeout note; expiry 96 h and never before verified closeout | request items 3 and 6, EXPIRY |

Test state: gates suite **120 passed** (incl. the walkthrough); CI evidence + contract suites **70 passed**.

## 0b. Codex review of v2 — six runner gaps, resolved

| # | finding | resolution | proof |
|---|---|---|---|
| 1 | `verify-bundle` compared a saved digest list with a reconstruction, never the files on disk | `verify_bundle` hashes the actual files: on-disk set must equal the declared inventory exactly, no symlinks/dirs/special files, every digest must equal `bundle-digests.txt` AND the reconstruction from the current batch, forbidden-scan re-run on disk bytes; `ingest` runs it first | `test_lane_bundle.py`: tampered `blind.json`, undeclared file, symlink, missing file |
| 2 | schema-valid reports with duplicate/contradictory answers, missing language votes, missing `pair`, or discarded critical findings were accepted | unique identities per class; language votes 1–3 per unit; a `pair` judgement for every multi-question unit; `verify_report` returns the report's **escalations** (major/critical findings, MULTIPLE/NONE_DEFENSIBLE, kill verdicts, REFUTED audits, reader blockers); ingest carries findings into the records (G-KEY: `flag`/`kill` + finding strings) and **refuses** when escalations exist unless `--record-escalations`, which appends them to `reviews/escalations.jsonl`; `build_adjudication_flags` surfaces that file at the recorded severity so `adjudicate_fold` escalates the unit | tests for each reproduction; walkthrough: a major G-KEY finding on u2 ends as ÄGARBLICK |
| 3 | conditional G-KEY/G-DISTRACTOR ingested into `verdicts-vfinal/`, colliding with the fixed lanes | phase-bound classes: `reval-gkey`, `reval-gdistractor` (+ existing `reval-gstem`, `reval-language`) REQUIRE `--round` and write only to `verdicts/*-<round>*.jsonl`; `vfinal-*` refuse `--round` and write only to `verdicts-vfinal/` | `test_phase_binding…`; walkthrough runs the complete five-lane conditional path on mixed ELF/LÄS repairs, then the fixed V-FINAL lanes, no collision |
| 4 | a stage snapshot could be overwritten and a rejected stage used as an accepted prior | accepted stage files are created exclusively (exit 4 on reuse); DISALLOWED results are written under `…stage-<name>.DISALLOWED-<utc>.json` and never take the accepted name; `--prior` must be this bead's baseline or an ALLOWED stage in this batch (exit 5 otherwise; hand-edited verdicts and foreign beads refused); the accepted chain records its predecessor's sha and kind | `test_completion_digests.py::test_stage_files_are_append_forward…`; walkthrough S5 |
| 5 | exact fixes were all-or-nothing only for validation, not for write failures | before-images of every candidate and the journal are copied to `exact-fix-backups/<stage>-<utc>/` with a `txn.json` before the first write; any exception rolls candidates back byte-for-byte and truncates the journal to its recorded length; `--recover` rolls back transactions left `pending` by a crash; the next `apply` refuses until recovery is clean | injected journal failure, injected second-unit write failure, crash simulation + recover |
| 6 | S00 asked the reviewer to probe its own sandbox, against its installed instructions | split: `sandbox_probe.py` is OPERATOR-run (benign temp fixture, exact `codex sandbox` command with the agent's flags, parsed to `sandbox-probe-report.v1`; coordinator never runs it) and the `smoke` lane class asks the reviewer only to answer an embedded one-question fixture with the production instructions unchanged, leaving no trace in the batch | `test_sandbox_probe_and_smoke.py`; walkthrough S00 |

Accepted as-is from v2 (no redesign): the policy-only description of read isolation; the
S00 + 20 fixed + ≤5 conditional session count.

Test state after v3: gates suite **135 passed** (walkthrough extended: S00 smoke; mixed ELF/LÄS
repairs; five-lane conditional path then fixed V-FINAL; escalation → ÄGARBLICK; append-forward
snapshots); CI evidence + contract suites **70 passed**.

## 0c. Codex review of v3 — two defects and one contract correction, resolved

| # | finding | resolution | proof |
|---|---|---|---|
| 1 | the final `txn.json` rewrite sat outside the protected block and was not atomic: a torn write left changed content next to unreadable JSON, and `recover()` crashed | every txn.json write goes to a sibling temp file, fsync, `os.replace`; the "committed" publication is inside the protected region, so a failure there rolls candidates and journal back byte-for-byte and publishes "rolled_back"; if that publication fails too, txn.json still holds the valid "pending" record and the next `apply`/`--recover` finishes the rollback (idempotent); an unreadable record is a `FixError` naming the directory, never a traceback | `test_apply_exact_fixes.py`: torn commit publication, failing rollback publication + recover, unreadable record |
| 2 | probe fixtures under `/tmp` (an automatic writable root, so the "outside" write proved nothing); every curl failure read as DENIED; parser exited 0 on contradictions | fixtures default under `$HOME/hpf-sandbox-probe-fixtures/`, refusing temp roots and the production work_dir (a test-only override marks the plan `not_a_valid_boundary_test`); each probe reports its exit code and error text and is classified ALLOWED / DENIED (permission error) / ERROR (missing fixture, missing curl) / INCONCLUSIVE; network DENIED only when an unsandboxed control succeeded; exit 0 match, 1 contradiction (STOP), 2 inconclusive (not evidence) | `test_sandbox_probe_and_smoke.py`: temp-root refusal, placement, control-gated network, contradiction and error classes, CLI exit codes |
| c | the walkthrough ran six conditional sessions while claiming a five-lane path | `plan_revalidation.py` computes the complete path from the pending fixes BEFORE any repair (per-gate language lanes; sheet vs rationale-only changes) and exits 1 over budget; the walkthrough now shows the mixed ELF+LÄS student-facing proposal planned at 6 → STOP with nothing applied, the LÄS fix deferred in the journal, the ELF-only repair planned at exactly 5 and executed as exactly 5 sessions | `test_plan_revalidation.py` (5 / 6 / rationale-only 1–2 / CLI STOP); walkthrough asserts `sessions == plan == 5` |

Test state after v4: gates suite **145 passed**; CI evidence + contract suites **70 passed**.
The operator sandbox probe remains unexecuted; no fixture directory exists under `$HOME`.

## 0d. Codex review of v4 — the deferral shortcut, and the probe's acceptance logic

| # | finding | resolution | proof |
|---|---|---|---|
| 1 | the v4 walkthrough appended a coordinator `CLEAR` for an unapplied fix to shrink the plan from six to five sessions; promote reads the last record, so that turned a HOLD into a PASS | the deferral shortcut is withdrawn and made impossible to do silently: `check_review_integrity.py` fails closed when a coordinator-authored record clears a unit without a committed exact-fix transaction, when a later pass verdict comes from the same report that proposed unapplied fixes, or when proposed fixes were never applied yet the last record reads as a pass; the only coordinator verdicts allowed are the applied fix (with its transaction) and `DEFERRED`, which is outside promote's vocabulary and keeps the unit visibly on HOLD; `plan_revalidation` refuses to plan on an unclean journal (exit 3) and the check runs again before promote (D2). The walkthrough is now two fixtures: (A) the mixed ELF+LÄS proposal stops at the budget refusal with both `FIX_PROPOSED` records preserved, promote HOLDing them, the forbidden `CLEAR` rejected and `DEFERRED` still holding; (B) an ELF-only proposal runs the five-session path to the end | `test_check_review_integrity.py` (coordinator CLEAR, forged CORRECTED, same-report pass, DEFERRED → promote HOLD, planner refusal); walkthrough A and B |
| 2 | curl rc 60 (TLS) with a passing control read as DENIED / MATCHES_EXPECTED / exit 0; `control.out` and `probe.out` landed in different directories while the parse command assumed one | network DENIED only for curl rc 6/7 with a passing control; TLS/protocol/tool errors are ERROR, timeouts INCONCLUSIVE (exit 2, not evidence); every output and the report use absolute plan-bound paths inside the fixture and the parse command is `python3 <abs script> …`; the printed three-command sequence is executed under test from an unrelated directory with inert `codex`/`curl` stubs and lands every file where the plan says | `test_sandbox_probe_and_smoke.py`: rc 60/35/22/56 → ERROR, rc 28 → INCONCLUSIVE, rc 7 → DENIED, CLI exit 2 on TLS, stub-driven command sequence |

The five-session ceiling and the policy-only read-isolation model are unchanged.

Test state after v5: gates suite **155 passed** (a first draft of this line said 156; corrected 2026-09-03 after re-running); CI evidence + contract suites **70 passed**.
The operator sandbox probe remains unexecuted.

## 1. Checkpoint truth (unchanged)

| | batch20 | batch21 |
|---|---|---|
| gate phase | closed: canonical 152 rec / 0 kills; aggregate 7 SURVIVED_FLAGGED | closed at zero kills (r1 → repair-1 → r2 → repair-2 → r4 spot-check → repair-3 on elf-b21-001) |
| owed before chain | nothing (G-ENG r4 on elf-b20-001 done 16:46, not repeated) | step 0: canonical assembly (dry projection 152 rec / 0 kills over 19 files; r4 G-KEY legs resolved 20/0) |
| mech / sheets / lint | 42/42 · current · 0 | 42/42 · current · 0 |
| keys | unmoved | unmoved; elf-b21-001 repair complete, not repeated |

## 2. Binding

`completion_digests.py baseline` (schema `hpfetcher-completion-digests.v2`) — written once per batch:

| manifest | sha256 (v5) | supersedes |
|---|---|---|
| batch20/DIGESTS-completion-hpf-ldjj.json | 5fe993260027fc729acb5b8691a15fb5d3c2ef357d3b77dac2f7368eb251ce30 | v4 74bce16e…, v3 f202d685…, v2 77729d4a…, v1 2cca97ca… (all kept) |
| batch21/DIGESTS-completion-hpf-mjml.json | c2b2e6057fa35f8f2763eb4a3a65492f67bdb9f8fc5ffa42b1abcc05bf417508 | v4 7adb34dd…, v3 3e37d365…, v2 895d2213…, v1 27aad13f… (all kept) |

Each binds: every batch file (77 / 69); 37 worktree tooling files (`gates/scripts/*.py`,
`bands.json`, `gates/lanes/*`) with git-tracked flags — untracked: `assemble_verdicts`,
`build_adjudication_flags`, `completion_digests`, `lane_bundle`, `apply_exact_fixes`,
`make_sheets`, `registry_extract` and all 18 lane assets; the 10-file evidence toolkit (tracked at
5848f8c); the **executed** tool copies (the scratchpad `hardened/` ×4, `mech.py`, `run_mech.py`,
`bands.json` actually run during batches 20/21) plus PR #370 head 0294fd9 blobs as references;
the lane runtime (`agents/evidence-reviewer/agent.toml`, `prompt.template.md`, `city.toml`, `gc`
binary, gc 1.4.1-loucmane.11-attention-continuity); the corpus inventory (28 files).

**Mutable stages vs immutable snapshots.** The batch dir is a mutable pipeline stage; every
change is a `snapshot --stage <name> --prior <previous> --allow …` whose verdict must be ALLOWED.
Lane bundles are immutable snapshots of one stage: `bundle-digests.txt` fixes them, `verify-bundle`
rebuilds from the CURRENT batch bytes, and `ingest` refuses a report whose bundle no longer
matches. Allowed-delta matrix (batch20; batch21 identical after its step 0):

| stage | prior | allowed delta |
|---|---|---|
| s0 step0 (b21 only) | baseline | `batch:verdicts.jsonl`, `batch:report-final.json` |
| s1-reviews | baseline / s0 | `batch:reviews/*` |
| d1-exact-fix | s1 | `batch:candidates/<changed>.json`, the three sheets of those units, `batch:reviews/language.jsonl`, `batch:reviews/pedagogy.jsonl`, `batch:exact-fix-backups/*` |
| s2-reval-vfinal | d1 | `batch:verdicts/*` (the `-<round>` files of the four re-validation classes + their resolved legs), `batch:verdicts.jsonl`, `batch:verdicts-vfinal/*`, `batch:verdicts-mech-r*.jsonl`, `batch:reviews/escalations.jsonl` |
| s3-fold-promote | s2 | `batch:audits/*`, `batch:verdicts-vfinal/verdicts-gkey-resolved.jsonl`, `batch:reviews/final_verify.jsonl`, `batch:report-final.json` |
| s4-stage11 | s3 | `batch:adjudication-evidence/*`, `batch:adjudication-flags.json`, `batch:reviews/adjudication.jsonl`, `batch:STATUS.md`, `batch:ADJUDICATION.md`, `batch:RESUME.md` |
| s5-post-commit | s4 | `subject:head`, `subject:tree` |
| next batch baseline | — | fresh `baseline`, head == previous batch's post-commit head |

## 3. Freeze contract — what runs, and what is deliberately not used

The bound evidence profile `hpfetcher-exam-batch-v1` (`bundle_common.py`, lanes blind-solver /
adversarial-audit) freezes an **adjudicated** or **pre-owner-adjudication** subject from
`candidates-final/` on a clean bead-bound branch with STATUS / ADJUDICATION / report markers.
Batches 20/21 have none of that yet: the completion chain is what produces it. So this package
does not call the profile builders, does not claim a profile stage, and changes nothing in
`pipeline/synthetic/evidence/`; the shadow-workflow checks remain the contract for post-adjudication
runs (hpf-fk02 lineage). Its own runner is:

- `lane_bundle.py build` — closed bundle from the batch (`blind/` `stems/` `distractor/` via
  `make_sheets.build`, or full units with `generator_meta`/`repair_log`/`_seed` stripped, or the
  full unit + its canonical records + its reviews for audits); `manifest.json` with inventory
  sha256 and source-candidate sha256; instructions + report schema copied from `gates/lanes/`;
  forbidden-pattern scan (blind: `"key"`, `"rationale"`, `"generator_meta"`, `"family"`,
  `"repair_log"`, `.git`; stems additionally `"passage"`, `"title"`; keyed: rationale/meta;
  full-unit: meta/repair_log); deterministic rebuild check; `bundle-digests.txt`.
- `lane_bundle.py verify-report` — jsonschema (draft 2020-12) against the class schema; run/lane
  ids and inventory must match the bundle; per-class coverage (every unit × target answered; vote
  and gate match the bundle params).
- `lane_bundle.py ingest` — verify-bundle + verify-report, then writes the exact record shapes
  `promote.py`, `vfinal_fold.py`, `adjudicate_fold.py` read; append-forward, refuses existing
  identities and existing per-unit files.
- `apply_exact_fixes.py` — the only repair: last review record per unit, `fixes[]` of
  `{path, old, new}`, exactly one occurrence required, all-or-nothing per batch, repair_log entry,
  review record `CORRECTED` by `coordinator/exact-fix-applied`; prints the changed unit ids that
  select the re-validation lanes.
- The existing scripts unchanged: `assemble_verdicts`, `gkey_resolve`, `vfinal_fold`, `aggregate`,
  `promote --require-clean` (decision only), `build_adjudication_flags`, `adjudicate_fold`.

## 4. Mechanism — hpf-gehr lane, as executed

Run root `/home/loucmane/gascity/evidence-runs/<bead>-b2N-completion-20260902-001/` with
`manifest.json`, `authorization-envelope.json` (verbatim grant + `request_sha256`), controller
events, and `lanes/<lane-id>/{bundle/, bundle-digests.txt, reports/, controller/}`. Per lane: child
bead (`--parent`) naming the run-relative bundle and report paths, the closed inventory, the schema
and the exact allowlisted `gc` forms → `controller/00-allowlist.json` → `gc rig resume hpfetcher` →
`gc sling --no-formula --no-convoy hpfetcher/evidence-reviewer <bead>` (route JSON captured) →
`gc session list` watch (sessions = 1, non-reviewer = 0) → report → `verify-report` → sha →
worker closes bead → `gc rig suspend hpfetcher` → zero-residue proof → **write-scope proof**
(tree digest of evidence-runs before/after: only `lanes/<id>/reports/report.json` differs;
`completion_digests verify` on the subject: identical) → `01-lane-complete.json`. Convoy: one
owned convoy per batch, every lane slung `--no-convoy`, closed at release. Raw route / catalog:
no public P5 formula exists; raw routing is precedent-backed but run-scoped grants do not carry, so
it is request item 1.

## 5. Isolation — configured boundary, honestly

`agents/evidence-reviewer/agent.toml`: provider codex-evidence (gpt-5.6-sol, xhigh, approval
never), sandbox `workspace-write` with `sandbox_workspace_write.writable_roots=[]`,
`work_dir = /home/loucmane/gascity/evidence-runs` (one shared directory for every run and lane),
`max_active_sessions = 1`.

- **Enforced by the sandbox (per its configuration):** writes are confined to the working
  directory tree — that is the whole `evidence-runs` tree, not one lane. Reads are **not**
  confined: the project checkout, Git metadata, the vault and other runs are readable. Network:
  the codex sandbox default for workspace-write, **not verified here**.
- **Prompt-level only:** "read only the declared bundle", "write only the declared report", the
  allowlisted `gc` forms.
- **Not measured:** an offline `codex sandbox` probe of exactly these flags was prepared and
  declined by the operator's permission gate, so no boundary is reported as tested.
- **Consequences adopted:** blind separation rests on bundle closure and instruction, verified
  indirectly — the per-lane write-scope proof (writes), the subject `verify` (no drift), and a
  coordinator read of every blind report for material that is not in its bundle (manual, recorded
  in `01-lane-complete.json`). Request item 7 requires, before any blind lane: (a) the
  **operator-run** `sandbox_probe.py` (benign temp fixture; the exact `codex sandbox` command with
  the agent's flags; expected reads unconfined / writes confined to cwd / network denied; parsed
  report filed as `controller/sandbox-probe.json`; STOP if incomplete or contradicted) and (b) the
  `smoke` lane, which asks the reviewer only to answer an embedded fixture question under its
  unchanged production instructions and never to inspect its environment.

## 6. Lanes — batch20 (batch21 identical after step 0)

All report-only; one session each; workspace = the shared evidence-runs tree (§5), bundle =
`lanes/<id>/bundle/`, writable output = `lanes/<id>/reports/report.json`; model gpt-5.6-sol xhigh;
closeout = schema-valid report + sha + bead closed by the worker + drain-ack + suspend +
zero-residue + write-scope proof.

| id | class | units | bundle | ingests to |
|---|---|---|---|---|
| S00 | smoke | embedded fixture | smoke.json (one question) — no environment questions | nothing (report stays in the run root); the sandbox probe is operator-run, §5 |
| L01 | review-language | 7 | units.json (meta stripped) | reviews/language.jsonl |
| L02 | review-pedagogy | 7 | units.json | reviews/pedagogy.jsonl |
| L03 | review-integrated | 7 | units.json + verdicts.jsonl + carry_ins.json | reviews/integrated.jsonl |
| P1 | coordinator | pending fixes | `check_review_integrity` then `plan_revalidation` — complete path counted BEFORE any repair; > 5 sessions → STOP with nothing applied and every `FIX_PROPOSED` preserved (re-request; a `DEFERRED` record keeps the HOLD visible; no coordinator record may clear an unapplied fix) | `reval-plan.json` in the run root |
| D1 | coordinator | changed only | `apply_exact_fixes` (transactional) → `make_sheets` → `run_mech` → lint → snapshot d1 | candidates, sheets, repair_log, exact-fix-backups/ |
| L21–L25 | conditional, round-bound, exactly as planned by P1 (≤ 5 sessions): reval-gstem / reval-gkey ×2 / reval-gdistractor on the changed units + one reval-language lane per gate | as planned | stems.json / blind.json / distractor.json / units.json | `verdicts/verdicts-{gstem,gkey-<v>,gdistractor,lang}-r5.jsonl` → `gkey_resolve` → `assemble_verdicts` |
| L04 | vfinal-gkey vote 1 | 7 | blind.json | verdicts-vfinal/verdicts-gkey-1.jsonl |
| L05 | vfinal-gkey vote 2 | 7 | blind.json (separate bundle) | verdicts-vfinal/verdicts-gkey-2.jsonl → `gkey_resolve` |
| L06 | vfinal-gdistractor | 7 | distractor.json | verdicts-vfinal/verdicts-gdistractor.jsonl |
| L07–L13 | vfinal-audit ×7 | 1 each | unit.json + verdicts.jsonl + reviews.jsonl | audits/<cid>.json |
| D2 | coordinator | — | `check_review_integrity` → `vfinal_fold` → `aggregate` → `promote --require-clean` → snapshot s3 | reviews/final_verify.jsonl, report-final.json |
| L14–L20 | fresh-eyes ×7 | 1 each | blind.json | adjudication-evidence/<cid>.json |
| D3 | coordinator | — | `build_adjudication_flags` → `adjudicate_fold` → STATUS.md + ADJUDICATION.md → snapshot s4 → release → signed commit → snapshot s5 | package |

Separation of duties: reviewers propose; the coordinator applies only exact strings through a
script that refuses ambiguity; blind legs and fresh-eyes see no keys, rationales, reviews or
history; audits see history but cannot write; promotion is a script decision; acceptance is the
owner's PAKETDOM, outside this package.

**Batch21 step 0 (coordinator):** `assemble_verdicts --batch-dir batch21 --out verdicts.jsonl`
(projection 152 rec / 0 kills) → `aggregate` → snapshot s0, after its baseline is re-taken from the
post-batch20-commit head.

## 7. Bounds, ordering, preservation

Per batch: S00 + 20 fixed + ≤ 5 conditional sessions = ≤ 26 sessions; ≤ 52 total; sequential; one
session alive at any time; rig suspended between lanes. The conditional budget is counted by
`plan_revalidation` before any repair: an ELF-only student-facing repair is exactly 5; a mixed
ELF + LÄS student-facing repair is 6 and does not fit → STOP before applying and re-request. An
unapplied fix stays `FIX_PROPOSED` or becomes `DEFERRED`; either keeps the unit on HOLD, and the
integrity check refuses any journal that clears it. A second re-validation round is not covered. Closeout per batch: release event → signed commit → post-commit
snapshot (ALLOWED) → bead closeout note; batch21 starts after that. Expiry 96 h from grant, never
before verified closeout. batch18/19, PRs #370/#371, bank, `candidates-final/`, owner rulings,
push, merge, deploy: untouched / excluded.

## 8. Dry-run record (rig suspended)

`gc rig status hpfetcher` → Suspended: yes · `gc sling -n --no-formula --no-convoy
hpfetcher/evidence-reviewer hpf-ldjj` → target resolves to the evidence agent (non-expanding
template), route command shown, not executed, JSON `{"dry_run":true,"method":"bead","routed":false}`
· `gc bd create --dry-run` of the first lane bead previewed · `gc session list` → none · no convoy
references hpf-ldjj / hpf-mjml · lane bundles for all nine classes built from the real batch20 into
a scratch run root: deterministic, forbidden-scan clean, `verify-bundle` matches; batch20 untouched.

---
request_sha256 (GC-COMPLETION-AUTHREQ-b20-b21.txt): 7554f079779db28bd60dc1fe676fd53108c920eafdc500fe01ef0543e91f3531
