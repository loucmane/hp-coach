# Worklog — hpf-qr0p.51.11 (LJ-15: mock result breakdown v2 and half runs)

Marker: LJ15 MOCKV2

## Findings

- 2026-11-03: claimed on branch `codex/hpf-qr0p.51.11-ljusbord-lj-15-mock-result-breakdown-v2-and-half-runs`, base `a5772305dca188e37bdaa65e75106d6a5b977241` (origin/main, which already has migration 0016 and `mock_results.half_run_id`). The tracked tree was clean. The untracked dotfiles at the repo root are sandbox artifacts; I didn't touch or stage them. `app/node_modules` and `worker/node_modules` were present.
- What I read:
  - the rebuild map §0, and the §2 rows "Markera in mock passes", "Per-question pacing in Provpass results" and "Hel halva";
  - the LJ-15, LJ-31, LJ-39 and LJ-11 entries in §4;
  - `r6/A/provresultat.html` and `direction.md`;
  - `lib/mockScore.ts`, `routes/mockResults.ts` and their tests;
  - `routes/export.ts` (import), `routes/attempts.ts` and `db/schema.ts`;
  - the app's `lib/mock.ts`, `lib/mockSheet.ts`, `components/mock/useMockPass.ts` and `api/hooks/useMockResults.ts`.
- **Row shape.** The bead's shape wins over map §2. A row is `{ qid, correct, timeMs }`, where the map had `{qid, ms, correct, answered, flagged}`.
  - With no `answered`, a blank is `correct: null`, so a row still carries all three outcomes: right, wrong and blank.
  - Marks live in `flaggedQids` only.
- **A Provpass attempt's `timeTakenMs` is the question's dwell so far, not a slice.** `useMockPass` `pick` posts `dwellFor(sheet, qid, now)`.
  - So a re-answered question has several rows with growing totals, and its last answer holds the time. Summing them over-counts.
  - The app's `sheetFromAttempts` sums per qid, because its comment assumes slices. That over-counts a re-answered question after a reload. It is outside this write set; see the notes at the end.
- **The import path reads mock rows as version 1 only.** `routes/export.ts` reads imported rows with `MockBreakdownSchema` and builds `SessionAttempt`s without `timeTakenMs`.
  - If that schema accepted version 2, a rescored imported v2 row would get a time of 0 on every row.
  - So `MockBreakdownSchema` stays version 1 only, and the route uses a new union.
  - An imported v2 row is therefore rescored as version 1. That is what happens today to any breakdown the import cannot read.
- **Marks.** No route writes `sessions.marks` yet (PATCH marks is LJ-12). The server has no record of marks of its own, so they come from the report.
- **The app's typed client is unaffected.**
  - The request's `breakdown` becomes a union that includes v1, and `halfRunId` is optional.
  - The response row type is unchanged: the DB schema did not change, and v2 lives inside the `breakdown` JSON.
  - `pnpm typecheck` passes in app/.
  - A v1 body always comes back as v1, so no v2 row can exist until a client posts one.

## Decisions

- **Schemas (`lib/mockScore.ts`).**
  - `MockBreakdownSchema` (v1) is unchanged.
  - `MockBreakdownV2Schema` is v1 `.extend`ed with:
    - `perQuestion`, strict rows `{ qid: string, correct: boolean | null, timeMs: int ≥ 0 }`;
    - `flaggedQids: string[]`;
    - `version: 2`.
  - `AnyMockBreakdownSchema` is a discriminated union on `version`, and the route takes it.
  - These are 400s at the route: a negative or fractional time, an unknown row key, a missing `flaggedQids`, or an unknown version. A negative per-section time is already a 400 there.
- **Version 1 is untouched.**
  - A v1 body is stored as it came, or rescored, exactly as before, and it stays version 1: it never gains rows.
  - No pre-existing assertion changed. Two test helpers gained an optional time parameter and a narrower return type.
- **A v2 summary is stored as it came only if it passes every v1 rule, and also these:**
  1. one row per planned question, in the pass's order. This catches a bad qid, an extra row, a missing qid, a duplicate and a wrong order;
  2. every time is whole ms ≥ 0. This is re-checked in the lib, so the lib doesn't depend on the caller having parsed the body;
  3. the rows agree with the summary:
     - `presented` equals the number of rows;
     - `answered` equals the rows with an outcome, and `correct` the right rows;
     - per section, the right rows match `perSection.correct`;
     - `missedQids` is the wrong rows, in the pass's order;
  4. every mark is on a planned question, once.

  Rule 3 goes beyond the bead's list. Without it, a stored v2 result could say "10 av 12" in its totals while its rows show 11 ✓, which breaks honest numbers.

  The row times don't have to sum to `perSection.timeMs`. The existing code treats time as practice effort, not assessment.
- **A v2 summary that does not fit is rescored, not rejected.** This is the existing fail-closed pattern: a student's finished pass always lands. The server rebuilds the rows from the attempts:
  - one row per scored question, meaning assessed and with a section. Unknown questions get no row (B1). Planned questions come first;
  - `correct` comes from the last stored answer, and is null for a blank;
  - `timeMs` is that answer's `timeTakenMs`, never the client's. It is 0 when none is stored, and clamped at 0;
  - the marks are the reported ones that name a question in the result, each once, in the pass's order;
  - per-section `timeMs` stays the reported dwell (existing logic). So in a rescored v2 result, a section's time can exceed the sum of its rows. The attempts only know the dwell up to each answer.
- **No new score field.** `presented`, `answered`, `correct`, `seenBefore`, `perSection`, `missedQids` and `estimateBasis` are computed exactly as before. A table test pins that v1 and v2 give identical numbers for six passes, covering both the stored-as-it-came and the rescored paths.
- **`halfRunId`.**
  - Optional. It is a string of 1 to 64 characters, or null.
  - It is stored in `mock_results.half_run_id`, as null when absent, and returned with the row on POST and GET.
  - Like every other field, a retried POST overwrites it.
  - The server doesn't enforce pairing (exactly two passes, same half). LJ-39 and LJ-31 own the run and the normering span.

## Progress

- **Red first.** The tests were written, with the lib and the route unchanged. Command: `pnpm -C worker exec vitest run src/lib/mockScore.test.ts src/routes/mockResults.test.ts`.
  - Result: exit 1. Test Files 2 failed (2); Tests **35 failed | 61 passed (96)**.
  - `mockScore.test.ts`, **62 tests, 30 failed**:
    - 6 rescored passes came back without rows ("not a version 2 breakdown");
    - all 14 cases where the rows or marks don't fit failed;
    - both rebuild tests failed;
    - all 8 schema tests failed (`AnyMockBreakdownSchema` undefined).
  - `mockResults.test.ts`, **34 tests, 5 failed**:
    - the fitting v2 body got a 400 (the schema was v1 only);
    - both rescore cases and the rebuild test got a 400;
    - the `halfRunId` pairing test got a 400 (the body is strict).
  - Some new tests passed in red. They are guards that must hold before and after:
    - v2 stored as it came (the lib keeps whatever breakdown object fits);
    - `MockBreakdownSchema` rejects v2;
    - the route's 400 cases;
    - the v1 body test.
  - `pnpm -C worker typecheck` failed too, as expected:
    - TS2724: `AnyMockBreakdownSchema` and `MockBreakdownV2` not exported;
    - TS2353: `timeTakenMs` not in `SessionAttempt`;
    - TS2322, TS2367 and TS7006 follow from those.
- **Green.** Same command: Test Files 2 passed (2); Tests **96 passed (96)**.
- **Worker checks.**
  - `pnpm typecheck` passed.
  - `pnpm lint` passed (62 files) after two formatter re-wraps in `mockScore.test.ts`.
  - `pnpm test` passed: **25 files, 592 tests**.
  - `vitest run src/routes/assessmentGolden.test.ts`: 3 passed, and the snapshot was not re-recorded. `git status` shows only the four source files changed; `__snapshots__/assessmentGolden.test.ts.snap` is untouched.
- **App checks.**
  - `pnpm typecheck` passed.
  - `pnpm lint` passed (758 files, with 4 informational notices in devbake files I didn't touch).
  - The full `pnpm test`, run once without `--maxWorkers`, passed: **198 files, 5574 tests** in 53.20 s.
- `git diff --check` is clean. The changed paths are exactly the write set. They are staged, not committed.

## Notes for the coordinator (outside this write set)

- **LJ-17.** The app's `MockBreakdown` in `api/hooks/useMockResults.ts` is version 1 only and needs the v2 type.
- **LJ-17/LJ-31, the client v2 builder.** The server rescores the pass unless the builder emits:
  - rows in plan order;
  - `correct: null` for blanks;
  - `missedQids` in plan order;
  - unique marks.
- **LJ-31, the "attempts otherwise" fallback for v1 rows.** It should take the last answer's `timeTakenMs` per qid, not the sum `sheetFromAttempts` computes, so that it agrees with the server rebuild.
- **LJ-11 (import).** To round-trip v2, it should:
  - parse imported rows with `AnyMockBreakdownSchema`;
  - pass `timeTakenMs` into each `SessionAttempt`;
  - restore `halfRunId`.
- **LJ-12.** Once PATCH `sessions.marks` lands, a rescore could take its marks from `sessions.marks` instead of from the report.
- **LJ-39.** The server doesn't cap a run at two results or check that both share a half. If that matters, enforce it there or in a follow-up.
