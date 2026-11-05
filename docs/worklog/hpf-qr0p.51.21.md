# LJ-34w weekly prognosis history endpoint (LJ34W WEEKLY)

## Findings

- 2026-11-05: Claimed hpf-qr0p.51.21 through `gc hook --claim --json` and verified it with `bd show` (in_progress, assignee `ci-wisp-wgukak1`, routed to `hpfetcher/gc.implementation-worker`). Worktree branch `codex/hpf-qr0p.51.21-ljusbord-lj-34w-weekly-prognosis-history-endpoint`, base `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`. `worker/node_modules` was present, so no wait for dependencies was needed. `git status` was refused by the sandbox permission policy, so the clean-tree claim rests on the bead's starting state.
- `/me/stats?firstTry=1` (hpf-bz6f.4) reads the user's whole held history: `attempts` LEFT JOIN `sessions` for the kind, `attempts.user_id = ?`, oldest first by `(created_at, id)`. `firstTries` applies the rules: the earliest answer per question (LAS = LÄS), the last pick within a mock, no first try when the earliest answer is Repetera or onboarding. The windows run back from `now`: 90 days, 7 days, and 7–14 days. Unknown-source answers are skipped. There is no upper bound on `created_at`.
- The attempts route rejects a session id the user does not own (404), so an attempt/session ownership mismatch cannot be written through the API. LJ-14's insights inner-join both tables to the user. The new endpoint deliberately keeps `/me/stats`'s exact query instead, because its current week must equal `/me/stats?firstTry=1`.
- Retention: attempts are pruned at 120 days. A week's 90-day window lies fully inside the held history only if the week ended within the last 30 days. For an older week of a student active for more than 120 days, the pruned part of its window is missing. That is `/me/stats`'s documented "earliest is within retention" caveat, reaching further back. The bead fixes the range at 1–26 weeks (default 12), so this endpoint keeps that range and the chart bead must know about the caveat (see Handoff).

## Decisions

- Shared code in `worker/src/routes/me.ts`: `firstTryHistory(db, userId)` is the existing query, unchanged; `firstTryAggregates(history, asOf)` holds the existing window loop, anchored at `asOf`; and `answeredAt` holds the existing `created_at`-or-0 rule. `/me/stats` calls them with `now`, so its SQL, its arithmetic and its key order stay the same.
- `GET /me/insights/prognosis-weekly?weeks=N` (1–26, default 12) returns `{weeks:[{iso, end, bySection}]}`, oldest first, with all eight sections and their six first-try fields in `/me/stats` order.
  - A past week is computed as of its end, next Monday 00:00 UTC: only the answers given before it count, so a later answer can neither be a first try nor change a mock pick. Its 7-day window is then that ISO week, and its 7–14-day window the week before.
  - The current week has not ended. It is the same call `/me/stats` makes, with the same history and `now`, and its `end` is `now`.
  - Empty weeks are zero. A gap week after the first attempt shows the prognosis as it stood at that week's end; nothing is interpolated.
- The endpoint is SELECT-only like the rest of the insights module: no lazy user-row upsert, and a user with no row gets N zero weeks.

## Progress

- Tests first, in `worker/src/routes/insights.test.ts`:
  - `/prognosis-weekly` is added to the auth loop and to the SELECT-only, no-provisioning empty-history test.
  - The new `prognosis-weekly` block has seven tests:
    - each past week as of its end, across the Monday boundaries (23:59:59 vs 00:00:00, and the 90-day window sliding);
    - first tries only (a retry, a Repetera replay, first met in Repetera, an unknown source, an onboarding example, LAS = LÄS, a mock pick changed after midnight);
    - the current week equals `/me/stats?firstTry=1` field for field, key order included, for the default, 1 and 26 weeks, over a seeded 200-answer history with week-edge and undated answers;
    - each past week equals what `/me/stats?firstTry=1` returned at that week's end once the later answers are removed (all 11 past weeks);
    - zero weeks before the first answer, and a quiet week keeping its prognosis;
    - the `weeks` bounds (default 12; 1 and 26 accepted; `0`, `-1`, `27`, `1.5`, `bad` and empty rejected with 400);
    - user isolation.
- RED: `pnpm test src/routes/insights.test.ts src/routes/assessmentGolden.test.ts --maxWorkers=8` (from `worker/`) exited 1 with `Tests 8 failed | 15 passed (23)`. All 8 failures were `expected 404 to be 200`: the extended empty-history test plus the seven new tests. The auth check passed already (requireAuth answers 401 before routing). All 3 assessment golden tests passed, with no snapshot written.
- GREEN: `pnpm test src/routes/insights.test.ts src/routes/assessmentGolden.test.ts src/routes/me.test.ts --maxWorkers=8` gave `Test Files 3 passed (3)`, `Tests 62 passed (62)`. The golden snapshot is untouched, and `me.test.ts`'s first-try and query-shape tests pass on the extracted code.
- Worker: `pnpm typecheck` exit 0; `pnpm lint` exit 0 (`Checked 65 files … No fixes applied.`); the full `pnpm test --maxWorkers=8` gave `Test Files 27 passed (27)`, `Tests 699 passed (699)`. That is LJ-14's recorded 692 plus the 7 new tests; the base suite was not re-run separately.
- App: `pnpm typecheck` exit 0; `pnpm lint` exit 0 (`Checked 774 files`), with the same 4 informational findings in `src/components/devbake/*` as before (no app file changed).
- App, full suite once: `pnpm test --maxWorkers=8` gave `Test Files 203 passed (203)`, `Tests 6106 passed (6106)`, exit 0.
- Mutation check on the past-week cut. Changing `answeredAt(a) < +end` to `<=` in `insights.ts` first failed only the boundary test, because the seeded week-edge answers were all retries of one question. I then reseeded them as first tries of their own questions, plus a retry after an undated answer. Rerun on the same mutation, both the boundary test and the past-week `/me/stats` test failed (`Tests 2 failed | 18 passed (20)`). I reverted the mutation, and the final run is green.
- Final tree, after the test reseed: worker `pnpm test --maxWorkers=8` gave `Test Files 27 passed (27)`, `Tests 699 passed (699)`; `pnpm typecheck` exit 0; `pnpm lint` exit 0. The app checks above ran against this same source; the only later edits were to `insights.test.ts` and the reverted mutation.

## Final

State: **done**.

- Delivered `GET /api/me/insights/prognosis-weekly?weeks=N` (1–26, default 12), which returns `{weeks:[{iso:'2026-W45', end, bySection:{<all 8 sections>:{firstTry7d, firstTryCorrect7d, firstTry7to14d, firstTryCorrect7to14d, firstTry90d, firstTryCorrect90d}}}]}`, oldest first.
  - A past week stands as of its end, the next Monday 00:00 UTC.
  - The current week is `/me/stats?firstTry=1` as of now, and its `end` is now.
- `/me/stats` now calls the shared `firstTryHistory` / `firstTryAggregates(history, now)`. These are the same query and the same arithmetic, with the same key order, so its output is unchanged. `assessmentGolden.test.ts` passed before and after with no snapshot written, and `worker/src/routes/__snapshots__/` has no diff.
- Write set respected: only `worker/src/routes/insights.ts`, `worker/src/routes/insights.test.ts`, `worker/src/routes/me.ts` and this worklog changed. `worker/src/index.ts` needed no change. All four are staged and uncommitted; HEAD is still `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`. `git diff --cached --check` is clean.
- SHA-256 of the staged sources:
  - `insights.ts` = `7165545f2618f342c87e6653d70a0d653157d2af9951340305a8682f6ce72404`
  - `insights.test.ts` = `bd4a37d217109ab3184ca2e7e833e6482b34ba260bd2a51d149a9df2af600e4e`
  - `me.ts` = `3c377caa69e032fd31409373c9891764efd25bfb07f9c8f7d6fe8b3dc089290f`
- Bead note: one `bd update --append-notes` attempt, and it succeeded. Status untouched and the bead not closed; the coordinator parks it.

### For the coordinator and the chart bead

- **Retention vs 26 weeks (decision for the chart bead or owner).** Attempts are pruned at 120 days. A week that ended more than 30 days ago, for a student active more than 120 days, rests only on the held part of its 90-day window. That makes its first-try counts lower than the student saw at the time, and the band wider. The endpoint keeps the specified 1–26 range and documents the caveat in its route comment. The chart either asks only for weeks it can show as they stood, or a follow-up adds a horizon field such as `retainedSince`. I did not add an unrequested field.
- **Ownership semantics follow `/me/stats`, not LJ-14.** The shared query is attempts-scoped with a LEFT JOIN on sessions, which the current-week anchor requires. So an attempt whose session row is gone counts as an ordinary answer, as in `/me/stats`. The LJ-14 test "does not count inconsistent attempt/session ownership in any insight" deliberately does not list this endpoint. A foreign-session attempt cannot be written: the attempts route returns 404 for a session the user does not own.
- **Cost.** One history query per request, then one first-try pass per requested week: at most 26 passes over the user's held history.
- **Sandbox notes.** `git -C <worktree> status` was refused by the permission policy, though plain `git status`/`git diff` worked. `git status` lists untracked `.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile` and `.zshrc` at the worktree root. The ones inspected are `/dev/null` character devices (1,3), which are sandbox bind-mount placeholders, not files from this bead. They were left untouched and not staged.
- Remaining: host checks, independent review, and the signed commit.

LJ34W WEEKLY DONE: hpf-qr0p.51.21 — GET /me/insights/prognosis-weekly (1–26 weeks, first-try aggregates as of each week's end, current week == /me/stats?firstTry=1) with a shared me.ts query; worker 699/699, app 6106/6106, golden unchanged; staged, uncommitted

## 2026-11-05 coordinator host verification

- Host: worker typecheck and lint clean, worker suite 27/27 files, 699/699 tests (stats golden unchanged).
- Review: me.ts extracts the first-try window logic into `firstTryAggregates(history, asOf)` and `firstTryHistory`; /me/stats calls it as of now, so its output is unchanged. The weekly endpoint feeds each week only the answers given before that week's end.
- Open for the chart bead (not a defect here): weeks more than ~30 days old rest on a 90-day window that the 120-day attempt retention may have trimmed, so their bands can read wider than the student saw at the time. The chart must say so or limit its range.
