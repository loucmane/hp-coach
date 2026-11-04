# LJ-14 insights endpoints

## Findings

- 2026-11-04: Claimed hpf-qr0p.51.14 in its declared worktree; no molecule. Clean base: `72582a1c5aa5f583d5e2210595279745090b5219`.
- The implemented owner-approved confidence vocabulary is `gissar`, `tror`, `saker` (schema and attempts route), superseding the rebuild map's earlier English names. Insights will reuse that vocabulary.
- Attempts retain 120 days; mock picks are multiple rows per session/question. The in-memory D1 harness exercises real SQLite, auth, and the production route mount without network access.

## Decisions

- Calibration returns counts, the earliest eligible retained observation as `since` (ISO timestamp or null), and `verdictAt: 20`. Ungraded rows do not supply correctness evidence.
- Tempo returns seconds, linear-interpolated percentiles at `(n - 1) * p`, and chronological UTC ISO-week buckets including empty weeks. Default 9 weeks; accepted range 1–17 keeps complete week starts inside retention. Mock dwell is summed per session/question, assigned to the last observation's week. Unknown timing is omitted, never treated as zero.
- Outcomes returns a qid-keyed map of `{n, right, rightDays}`; optional positive `sessionId` restricts it to an owned session. Mock answer changes count once using the last pick. Distinct right days use UTC.
- All endpoints use SELECTs only, including for a new authenticated user. Scope both attempts and joined sessions to the user. Preserve `/me/stats` and its golden snapshot.
- Follow the bead-specific final handoff: leave code uncommitted, record checks, park deferred for coordinator review and signing, then drain.

## Progress

- Inspection complete; regression tests precede implementation.
- Red-first: `worker/ pnpm test src/routes/insights.test.ts src/routes/assessmentGolden.test.ts --maxWorkers=2` exited 1: 12 insights failures (expected 200, received 404), authentication passed, all 3 existing assessment golden tests passed. No snapshot updates.
- Green: the same focused command passed all 16 tests. Full `worker/ pnpm test --maxWorkers=8` passed 692 tests in 27 files. Worker `pnpm typecheck` and `pnpm lint` both exited 0; lint checked 65 files. `git diff --check` passed.
- App `pnpm lint` exited 0 (772 files, four existing informational findings in devbake files). App typecheck and full tests remain in progress.
- The first implementation failed the lowercase Swedish timed-marker fixture: SQLite `upper()` does not fold `å`. Replaced the SQL normalization with JavaScript's exact uppercase marker comparison; the same fixture now passes.

### Playbook-proposal — gas-city-coordinator

- 2026-11-04: A timed-session fixture using `ord · på tid` disappeared when SQL filtered on `upper(sections) = 'ORD · PÅ TID'`. SQLite's default case folding is ASCII-only and leaves `å` unchanged. Normalize Swedish mode labels in JavaScript before exact matching; keep a lowercase Swedish fixture in real-SQL route tests.
- Attempted the required proposal at `/home/loucmane/scratch/skill-gotchas/gas-city-coordinator.md`; the sandbox rejected the write as outside the project. Proposal retained here for coordinator forwarding; no permission workaround attempted.

## Handoff

- Implementation and verification pending. No source edits outside the declared write set.
- 2026-11-04 final verification supersedes the pending entries above: implementation complete; both app and worker typecheck/lint passed. Full worker suite passed 692/692; full app suite ran once at 8 workers, with 6,081 passing and one sandbox-blocked test (202 files passed, 1 failed). The sole failure is `src/lib/trapIndex.test.ts > committed trap index > equals what scripts/build_trap_index.mjs derives from the explanations`: child-process `spawnSync /usr/bin/node EPERM`. The generator and trap index are untouched and outside this bead's write set. Coordinator must run this check on the host before accepting delivery.
- Exact base/unchanged HEAD: `72582a1c5aa5f583d5e2210595279745090b5219`. No implementation commit: per contract, coordinator signs after host checks and independent review. `/me/stats` and its snapshot have no diff.
- Review disposition: self-inspected source and scope; independent cross-vendor review remains with the coordinator. No merge or publishing performed.
- Staging was attempted once with exactly the four allowed files and refused: the shared worktree `index.lock` path is read-only. Changes remain unstaged and uncommitted. Coordinator must stage them on the host as well as rerun the generator check; no signing/permission workaround attempted.
- Source SHA-256 evidence: `insights.ts` = `94864f93927009f0c351976d6269bd14eb6df5e61e3734b3b76420f2f2cacac7`; `insights.test.ts` = `881ff1441b6c0a0ff881b3d1041828cef9331974bfcd769782463d1e0b6517d5`; `index.ts` = `41a584ae607c49cd43494b8bfd1011c0a3928a24b21234676ce3b65a0c850285`.
- BLOCKED handoff: code and available checks complete; remaining help is host generator validation, staging, independent review, and signed delivery. Bead will be parked deferred with worker state blocked, not closed.
