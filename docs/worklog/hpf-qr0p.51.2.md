# Worklog — hpf-qr0p.51.2 (LJ-10: D1 expand migration 0016)

Marker: LJ10 MIGRATION

## Findings

- 2026-11-03: claimed on branch `codex/hpf-qr0p.51.2-ljusbord-lj-10-d1-expand-migration-0016`, base `71d26f97511b269cb644f65ac1448fa819203efa`, worktree clean. `app/node_modules` and `worker/node_modules` were present.
- Read the rebuild map §0, §2 and the LJ-10 entry in §4. Read `schema.ts`, `migrations.test.ts`, `lib/testD1.ts`, `lib/cascade.ts`, `routes/export.ts`, `routes/me.ts`, migrations 0000–0015 and the 0015 snapshot.
- drizzle-kit writes no CHECK constraint for a SQLite text enum, and the snapshot does not record enum values. Enum values therefore live only in the TypeScript types of `schema.ts`; the SQL is the same either way.
- Every route that reads these tables uses `db.select()`, so the new columns appear additively in existing responses (`/api/me/prefs`, mistakes, sessions, mock results, export) with their defaults. No handler, validator or scheduling rule changed. Import row shapes are `.passthrough()`, so an export that now carries the new fields still imports; restoring them is LJ-11's job.
- `cascadeDeleteUser` lists tables explicitly but does not need to name `explanation_feedback`. Its `user_id` foreign key deletes the rows with the users row, which is how `user_ability` is erased today. A test covers this.
- `.github/workflows/deploy.yml` applies D1 migrations to `hpc-staging` automatically after CI succeeds on main, then deploys the staging worker. Merging this change therefore runs the staging half of G1 at merge time, with the migration before the worker, which is the right order. Production is still `workflow_dispatch` with `promote_prod` behind the environment gate, and that job also applies migrations before deploying the worker.

## Decisions

- **Confidence values:** `gissar` / `tror` / `saker`, as the bead's owner decision states. Map §2 lists `'guess', 'think', 'sure'` instead; I'm flagging the mismatch for the coordinator. Because the database keeps plain text, switching the values is a `schema.ts`-only change, with no SQL or snapshot change.
- **Typed text (enum):**
  - `attempts.confidence` and `mistakes.last_confidence` use `CONFIDENCE_LEVELS`.
  - `mistakes.reason` uses `MISTAKE_REASONS` (`wrong`, `lucky`, `flagged`, `manual`), default `'wrong'`.
  - `users.motion` is `system` / `less` / `none` (from §1.7).
  - `users.quant_repeat` is `new` / `same`.
- **Plain text:** `users.facit_timing` (default `'each'`), `users.text_size` (default `'normal'`), `lesson_progress.guess` and `explanation_feedback.verdict`. §2 fixes only their defaults, or no value set at all, so I invented none.
- **Pref flags:** `integer` in boolean mode, nullable with a default, like the existing prefs: `answer_confidence` 1, `show_my_time` 0, `mock_clock_visible` 1, `mock_reminder` 1, `shortcuts` 1, `mode_follow_system` 0. `target_score` is a nullable integer counting tenths.
- **`explanation_feedback`:** §2 lists it as optional for v1, so it is included now to keep a single expand step.
  - Columns are `user_id`, `qid`, `verdict`, `note`, `model` and `created_at`, named exactly as in §2. `qid` also matches the v1 `FeedbackEntry`.
  - I added an `id` autoincrement primary key, following the `lesson_reads` / `daily_plans` pattern, plus a unique index on (`user_id`, `qid`) and a foreign key with `ON DELETE CASCADE`.
- **Column placement:** new columns go at the end of each table, except the users prefs, which sit with the other prefs (the snapshot order differs from the physical order, as it already does for `smart_drill`).

## Progress

- **Red first.** Command: `pnpm -C worker exec vitest run src/db/migrations.test.ts`, before any schema change.
  - Result: exit 1, **9 failed | 45 passed (54)**.
  - The failures were the 7 new LJ-10 cases, the journal case (`slice(-5)` now ends with `0016_ljusbord_expand.sql`), and the `explanation_feedback` columns case.
  - Causes: ENOENT on `drizzle/0016_ljusbord_expand.sql`, `schema.explanationFeedback` and `schema.CONFIDENCE_LEVELS` undefined, and no `explanation_feedback` table.
- **Schema and generation.** Updated `worker/src/db/schema.ts`, then ran `pnpm -C worker db:generate --name ljusbord_expand` offline.
  - drizzle-kit wrote `drizzle/0016_ljusbord_expand.sql` directly, so no rename was needed.
  - It also wrote `meta/0016_snapshot.json` (its `prevId` is 0015's id `74046377-…`) and journal entry idx 16 with tag `0016_ljusbord_expand`.
  - SHA-256: `0016_ljusbord_expand.sql` ca8a7441398869ad2ad4bca6fb6f272e802de3fcb6aad661a2302dda5cc124d7; `0016_snapshot.json` dc2cc842b9bcce860a5f025aa30c1a40d1b478a9dabf190ede72e4ab69b9a0ba.
- **Hand check of the SQL.** It contains one `CREATE TABLE explanation_feedback`, its unique index, and 18 `ALTER TABLE … ADD` statements. Every ADD is nullable; 10 of them have a default. There is no DROP, no RENAME, and no `__new_` rebuild or PRAGMA. The test pins the exact DDL and re-asserts each of these points.
- **Green.** The same command gave **54 passed (54)**.
- **What the extended migration test covers:**
  - the exact DDL;
  - the added columns, derived from the database: exactly the §2 list, each nullable with its default, with every old column unchanged and in place, and exactly 11 users prefs;
  - the `explanation_feedback` columns, its unique index on (`user_id`, `qid`), and its foreign key with ON DELETE CASCADE;
  - the planned PUT upsert, that a duplicate row is refused, and that the rows are erased by `cascadeDeleteUser`;
  - a database at 0015 with rows in every table, upgraded with 0016, keeps every cell byte-equal. Each cell is compared as `typeof` + `quote()` + `hex()` by rowid. Every table and index keeps its root page, so there was no rebuild. `integrity_check` returns ok and `foreign_key_check` is empty;
  - pre-0016 rows, and rows the old worker inserts after 0016, read the defaults. This is checked both in raw storage (integer 1/0) and through drizzle;
  - the enum values (owner decision).
- **Local apply.** `pnpm -C worker -s db:apply:local` started from empty local state, listed migrations from `0000_initial.sql` and exited 0.
  - The run's output was too large to display, so I re-ran the same command, which printed `✅ No migrations to apply!`.
  - `wrangler d1 execute hpc-staging --local` showed `d1_migrations` newest-first as `0016_ljusbord_expand.sql`, then `0015_pre_r2b1_fit_reset.sql`.
  - Two sandbox limits produced noise but did not fail the run: wrangler could not write its debug log (`EROFS` on `~/.config/.wrangler/logs`), and its telemetry and update calls to cloudflare.com were blocked by the proxy.
- **Worker checks.**
  - `pnpm typecheck` passed.
  - `pnpm lint` passed after I reformatted three statements in `migrations.test.ts` by hand (62 files checked).
  - `pnpm test` passed: **25 files, 539 tests**. This includes `assessmentGolden.test.ts`, whose snapshot was not re-recorded.
- **App checks.**
  - `pnpm lint` passed (722 files; 4 informational notices in existing devbake files I didn't touch).
  - The full `pnpm test`, run once without `--maxWorkers`, passed: **182 files, 5289 tests** in 60.29 s.
  - **`pnpm typecheck` FAILED** with 2 errors, both TS2352, in `app/src/api/hooks/useMockResults.ts` at lines 83 and 100. They are the `as MockResultRow[]` and `as MockResultRow` casts.
- **Cause of the app typecheck failure.**
  - The app's hand-written `MockResultRow` has no `halfRunId`, while the response type inferred from `mock_results` now requires it. So the cast fails in that direction.
  - The other direction was already incomparable: an inferred `breakdown: JSONValue` is not comparable to `MockBreakdown`. With both directions failing, TypeScript refuses the cast.
- `git diff --check` is clean. The changed paths are exactly the write set.

## Handoff: BLOCKED (state: blocked)

- Everything in the write set is done: the schema, the migration, the snapshot, the journal, the migration test and this worklog. The changes are uncommitted.
- **Help needed:** the app typecheck needs one line in `app/src/api/hooks/useMockResults.ts`, which is outside this bead's write set (it is in LJ-17's). The proposed fix is to add `halfRunId?: string | null` to `MockResultRow`. It is optional for the same reason as `estimateBasis?`: an older worker doesn't send it.
  - I did not apply or verify this fix. My analysis says it restores both casts, because the target then has every key of the inferred row again.
  - Please either admit that file to this bead, or land the line in the same change (for example, pull it forward from LJ-17), then re-run `pnpm -C app typecheck`.
- **G1 notes:**
  - Never run a worker built from this schema against a database without 0016. drizzle's `select()` names every schema column and `insert()` writes every column, so it would fail with "no such column".
  - The old worker runs fine on a database with 0016; the tests cover this.
  - The deploy workflow already applies migrations before deploying the worker. A merge to main applies 0016 to staging automatically.
