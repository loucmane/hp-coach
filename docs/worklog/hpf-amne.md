---
bead: "hpf-amne"
project: "hpfetcher"
status: "round_1_done_uncommitted"
---

# Worklog — hpf-amne

Main's app e2e went red on 2026-10-18, the HP exam day. `tests-e2e/landing.spec.ts` always expected the »om N dagar« countdown, and the public landing hides it on the exam day by design. Underneath sat a worse bug: the app had two exam calendars that disagreed. `lib/provdatum.ts` said 18 Oct 2026, while `lib/dates.ts` `EXAM_SITTINGS` (every in-app countdown) said 25 Oct 2026 and 21 Mar 2027. The bake-off content module held a third copy. The official dates (UHR, studera.nu, hogskoleprov.nu, per the bead) are Höstprov 26 on Sunday 18 October 2026 and Vårprov 27 on Saturday 10 April 2027.

Round 1 implements the operator decision of 2026-10-18: one calendar, roll to the next sitting not yet over, roll saved targets forward on the read side only, and frozen-clock tests.

## Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-amne`, assignee and route `hpfetcher/gc.implementation-worker`). `bd show hpf-amne --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` → `b2dc6c036bf39de00e993c23cd8b9bf1b0fc5118` (detached, = origin/main per the bead).
- No git writes, no network, no dependency changes. Server, worker and sync API untouched. The untracked runtime, skill and sandbox paths present at start are untouched.
- `gc.check_path` is the post-close dispatcher check `…/gascity/assets/scripts/checks/build-artifact-valid.sh`. This bead names no validator, so this worker ran none.

## Deliverables (uncommitted)

| Path | Change |
|---|---|
| `app/src/lib/dates.ts` | `EXAM_SITTINGS` carries the official dates (`host-2026` = `new Date(2026, 9, 18)`, `var-2027` = `new Date(2027, 3, 10)`; ids unchanged). New `nextSitting(now)` and `resolveSitting(id, now)` |
| `app/src/lib/provdatum.ts` | `PROV_DATE` removed: the landing's `Provdatum` is the next sitting not yet over, formatted by the new `formatProvdatum(date, now)` |
| `app/src/stores/examStore.ts` | `useSitting(now)` resolves the saved id through `resolveSitting` (roll-forward, read-side only). Default target `null` = the next sitting not yet over. Documented fallback once every sitting is over |
| `app/src/screens/HomeMobile.tsx` | `useSitting(now)`: the label resolves at the same instant as the count |
| `app/src/components/devbake/LandingBakeoffR4C.content.ts` | `PROV_DATE` / `PROV_DATE_LABEL` / `PROV_DATE_SHORT` / `daysUntilProv` read the calendar. New `PROV_DATE_DAY_MONTH` |
| `app/src/components/devbake/LandingBakeoffR5A.tsx` | The two hard-coded »18 oktober« strings read `PROV_DATE_LABEL` / `PROV_DATE_DAY_MONTH` (see Notes) |
| `app/src/components/devbake/redesign/r1Fixtures.ts` | `EXAM` fixture: 18 Oct, `söndag 18 oktober`, `18 okt`, 9 days from its fixed TODAY (was 25 Oct / 16) |
| `app/src/components/devbake/redesign/r1Fixtures.test.ts` | Also pins `EXAM.dateLabel` / `shortDate` and »next sitting« to the calendar |
| `app/src/lib/dates.test.ts`, `app/src/lib/provdatum.test.ts`, `app/src/stores/stores.test.ts` | New and updated tests, all with an injected or frozen clock |
| `app/tests-e2e/landing.spec.ts` | Browser clock frozen with `page.clock.setFixedTime` before `page.goto`: before, on and after the exam day |
| `CLAUDE.md` | One sentence after the stale `readiness.sh` code block, verbatim from the bead. Nothing else changed |
| `docs/worklog/hpf-amne.md` | New: this evidence file |

## What changed

**One calendar.** `lib/dates.ts` is the only module with a sitting date. A sitting is *not over* through its whole exam day (`daysUntil(date, now) >= 0`, local calendar days) and *over* from the local midnight after it. `nextSitting(now)` returns the earliest sitting not yet over, or null once all are over. It relies on `EXAM_SITTINGS` being chronological, which a test pins. `resolveSitting(id, now)` keeps a saved sitting while it is not over. Otherwise (over, missing or unknown id) it returns `nextSitting(now)`, which may be null. Both functions are pure and default `now` to the clock. No sittings beyond `var-2027` were added.

**Landing (`lib/provdatum.ts`).** `getProvdatum(now)` formats `nextSitting(now)`. The contract is unchanged: `days` is 0 on the exam day itself (PublicLanding's existing `showCount` rule then shows the date without a count), and it never goes negative. The landing hides its dated pieces only when no sitting is upcoming. `days` now uses `daysUntil` (calendar days, the same count as the in-app countdowns) instead of `Math.ceil` of milliseconds; on every tested instant the two agree. `PublicLanding.tsx` itself needed no change.

**In-app (`stores/examStore.ts`).** `useSitting(now = new Date())` returns `resolveSitting(storedId, now)`, so a saved `host-2026` reads Vårprov 27 from 2026-10-19 00:00. Nothing writes back. The stored id stays as saved, `api/useSyncedPrefs.ts` is untouched, and the server is never called. The default `sittingId` is `null` instead of `EXAM_SITTINGS[0].id`, so with no saved target the next sitting not yet over is resolved at read time with the injected `now`, never at import time. Existing persisted ids load as before. Fallback, in a comment: once every configured sitting is over, the last configured sitting stands in. Its count goes negative and `examPhase` reads »provet är skrivet« until UHR's next dates are added. `useDaysRemaining(now)` passes its `now` through to `useSitting`.

**Bake-offs.** `LandingBakeoffR4C.content.ts` resolves the next sitting from the calendar when the module loads and formats it with `formatProvdatum`. The bake-offs have no dateless state, so once every sitting is over they hold on the last one with the count at 0, as the old fixed date did after it passed. R4C and R5B needed no change. No layout or copy changed and no bake-off was deleted.

**Fixtures.** `r1Fixtures.ts` keeps its fixed TODAY (Fri 9 Oct 2026). Its `EXAM` now says 18 Oct and 9 days, the truth from that TODAY. Its test already pinned `daysLeft` to the calendar; it now also pins the date strings and checks that `EXAM` is the next sitting from TODAY. `OvningstextSurfaces.tsx` needed no edit: it names no date and computes `daysUntil(EXAM_SITTINGS[0].date, TODAY)` from its own fixed TODAY, so its scenes now read »9 dagar«.

## Behaviour at the pinned instants

| Local instant | Landing dateline | In-app, saved `host-2026` | In-app, nothing saved |
|---|---|---|---|
| 2026-10-01 12:00 | Högskoleprovet · söndag 18 oktober / om 17 dagar | Höstprov 26, 17 | Höstprov 26, 17 |
| 2026-10-18 09:00 and 23:30 | Högskoleprovet · söndag 18 oktober (no count) | Höstprov 26, 0 | Höstprov 26, 0 |
| 2026-10-19 00:30 | Högskoleprovet · lördag 10 april / om 173 dagar | **Vårprov 27, 173** (stored id still `host-2026`) | Vårprov 27, 173 |
| 2027-04-10 23:30 | Högskoleprovet · lördag 10 april (no count) | Vårprov 27, 0 | Vårprov 27, 0 |
| 2027-04-11 00:30 | Högskoleprovet (dated pieces hidden) | Vårprov 27, −1 (fallback) | Vårprov 27, −1 (fallback) |

10 April 2027 formats as `lördag 10 april`, `10 april`, `10 apr` (sv-SE `apr.` with the period stripped).

## Tests

### Red first

The tests were written before any source change and run against the untouched sources.

- First run: 21 failed | 31 passed. One new test, »saves no target by default«, passed on the old code only because `afterEach` had already reset the store to null. It now reads `useExamStore.getInitialState()` and failed on the old code (`expected 'host-2026' to be null`).
- Final run of the final test files against the HEAD versions of `dates.ts`, `provdatum.ts`, `examStore.ts` and `r1Fixtures.ts` (restored temporarily from `git show HEAD:…`; sha256 of the new files identical before and after): **Tests 22 failed | 30 passed (52)**. Failing names:

```
src/lib/dates.test.ts > EXAM_SITTINGS > carries the official dates at local midnight
src/lib/dates.test.ts > nextSitting > is höstprov 26 before its exam day
src/lib/dates.test.ts > nextSitting > stays höstprov 26 through the whole exam day
src/lib/dates.test.ts > nextSitting > rolls to vårprov 27 from the local midnight after the exam day
src/lib/dates.test.ts > nextSitting > is null once every configured sitting is over
src/lib/dates.test.ts > nextSitting > reads the system clock when no instant is passed
src/lib/dates.test.ts > resolveSitting > keeps a saved target that is not over
src/lib/dates.test.ts > resolveSitting > rolls a saved höstprov 26 target forward to vårprov 27 on 19 October
src/lib/dates.test.ts > resolveSitting > resolves a missing or unknown id to the next sitting not yet over
src/lib/dates.test.ts > resolveSitting > is null once every configured sitting is over
src/lib/dates.test.ts > resolveSitting > reads the system clock when no instant is passed
src/lib/provdatum.test.ts > getProvdatum > rolls to vårprov 27 from the midnight after the exam day
src/lib/provdatum.test.ts > getProvdatum > returns null only once every configured sitting is over
src/lib/provdatum.test.ts > getProvdatum > reads the system clock when no instant is passed
src/stores/stores.test.ts > useExamStore + useSitting + useDaysRemaining > saves no target by default
src/stores/stores.test.ts > useExamStore + useSitting + useDaysRemaining > defaults to the next sitting not yet over
src/stores/stores.test.ts > useExamStore + useSitting + useDaysRemaining > useDaysRemaining computes against today=fixed
src/stores/stores.test.ts > useExamStore + useSitting + useDaysRemaining > counts 0 through the exam day of a saved target
src/stores/stores.test.ts > useExamStore + useSitting + useDaysRemaining > rolls a saved höstprov 26 target to vårprov 27 on 19 October, read-side only
src/stores/stores.test.ts > useExamStore + useSitting + useDaysRemaining > falls back to the last configured sitting once every sitting is over
src/stores/stores.test.ts > useExamStore + useSitting + useDaysRemaining > reads the system clock when no instant is passed
src/components/devbake/redesign/r1Fixtures.test.ts > redesign round-1 fixture > counts down to the next sitting from the fixture day
```

The r1 failure on the old code is the two-calendar bug itself: `expected 2026-10-17T22:00:00.000Z to deeply equal 2026-10-24T22:00:00.000Z`, provdatum's 18 Oct against `EXAM_SITTINGS`' 25 Oct.

### What the tests pin

Every new test injects `now` or freezes it with `vi.useFakeTimers()` + `vi.setSystemTime()`; none reads the real date. The instants are those in the bead: 2026-10-01 12:00, 2026-10-18 09:00 and 23:30, 2026-10-19 00:30, 2027-04-10 23:30 and 2027-04-11 00:30.

- `dates.test.ts`: official dates and weekdays, chronological order, `nextSitting` at every instant, `resolveSitting` (keeps a saved target that is not over, including a later `var-2027` target while `host-2026` is still ahead; rolls `host-2026` on 19 Oct; missing and unknown ids; null after the last sitting), default clock. The `daysUntil` examples now use 18 Oct (165 days from 6 May).
- `provdatum.test.ts`: the `if (!PROV_DATE) return` escapes are gone. Covers the before, exam-day, after and after-last instants, the 10 April strings, the evening before reading 1, and the default clock.
- `stores.test.ts`: null default, the next sitting not yet over, 0 days through a saved target's exam day, a `host-2026` target rolled to Vårprov 27 / 173 with the stored id unchanged, a kept `var-2027` target, the fallback (`var-2027`, −1), and the default clock. The hook helper unmounts right after reading, so the `afterEach` store reset never re-renders outside `act()`. The first version printed React act() warnings.
- `landing.spec.ts` (Playwright, not run here): `BEFORE_EXAM` / `EXAM_DAY` / `AFTER_EXAM` are noon UTC on 2026-10-01 / 18 / 19, the same calendar day from UTC−11 to UTC+11 (CI's UTC and Stockholm included). Before: the existing test plus the dateline contains `söndag 18 oktober` and `/om \d+ dagar/` is visible. Exam day: `.hpl-dateline` has text `Högskoleprovet · söndag 18 oktober` and `/om \d+ dagar/` has count 0. After: the dateline contains `lördag 10 april` and holds a visible count. The other landing assertions are unchanged.

### Mutation check

Each mutation was applied alone (M2 and M3 together, since they live in different functions and their failing names do not overlap), the four calendar test files run, then reverted. sha256 before and after: `dates.ts` `f4e429fd…`, `examStore.ts` `96e69697…`, identical.

| Mutation | Failing tests |
|---|---:|
| M1 `isOver` counts the exam day as over (`<= 0`) | 10 |
| M2 `resolveSitting` ignores the saved id | 2 |
| M3 fallback is `EXAM_SITTINGS[0]` instead of the last sitting | 1 |

### Throwaway render checks (deleted, never committed)

Two scratch vitest files under `app/src` were run once and deleted.
- `PublicLanding` rendered in jsdom with `Date` frozen at the e2e instants. `.hpl-dateline` textContent was `Högskoleprovet · söndag 18 oktoberom 17 dagar` / `Högskoleprovet · söndag 18 oktober` / `Högskoleprovet · lördag 10 aprilom 173 dagar`, plus `Högskoleprovet` on 2027-04-11. Exactly one `/om \d+ dagar/` leaf before and after, none on the exam day and after the last sitting. The station read `Provdagen · 18 okt` / `· 18 okt` / `· 10 apr` / bare `Provdagen`. This matches the e2e assertions.
- R5A (`LandV5A`), clock frozen before a fresh module import: dateline `Högskoleprovet · söndag 18 oktober` with `om 17` / `om 0 dagar` on 1 and 18 Oct (identical to the old literal), and `lördag 10 april` with `om 173 dagar` on 19 Oct. The prose reads `mot den 18 oktober, och` and later `mot den 10 april, och`.

## Checks (from `app/`)

- `pnpm typecheck` → `tsc -b --noEmit`, exit 0, no diagnostics.
- `pnpm lint` → `Checked 415 files in 143ms. No fixes applied.` / `Found 4 infos.` All four infos are pre-existing, in files this bead does not touch (`LandingBakeoffR3.tsx:452`, `LandingBakeoffR4A.tsx:438`, `LandingBakeoffR4C.tsx:362`, `l12/M3.tsx:1060`).
- `pnpm test` → `Test Files  88 passed (88)` / `Tests  1009 passed (1009)`.
- `tests-e2e/` is outside both `biome check src` (and ignored by biome.json) and every tsconfig. `landing.spec.ts` was typechecked alone: `tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext --moduleResolution bundler --types node tests-e2e/landing.spec.ts`, exit 0.
- Acceptance grep, `app/src` without tests: the only exam `Date`s are the two `EXAM_SITTINGS` entries. The other hits are doc-comment examples (`provdatum.ts`, `LandingBakeoffR4C.content.ts`, the R5B header's design description) and the r1 fixture's `söndag 18 oktober` / `18 okt`, which its test pins to the calendar. Fixed TODAYs: `r1Fixtures.ts` `2026-10-09T15:40:00` and `OvningstextSurfaces.tsx` `new Date(2026, 9, 9, 19, 0)`.

## Not run here (coordinator)

- **Playwright e2e** (`pnpm test:e2e`, at least `landing.spec.ts`). It needs network for Clerk's dev FAPI and the `@clerk/testing` global setup, the worker dev server and a browser, and the bead assigns e2e to the coordinator, so it was not attempted. One thing to watch: Clerk now loads under a frozen browser clock up to a day off real time. The landing is signed-out, so no session token is involved, but if `public-landing` never appears in only the frozen tests, clock skew in clerk-js is the first suspect.
- **PR 391**: rerun its CI and merge. That needs git and GitHub writes, which this lane does not do.

## Notes for the reviewer

- **R5A was edited.** `PublicLanding.tsx`'s header calls `LandingBakeoffR5A.tsx` »kept untouched as the historical reference«. The bead asks the bake-offs, R5A included, to read the shared calendar »so no third date exists«. R5A already took its count and station from the content module but hard-coded »söndag 18 oktober« in its dateline and »den 18 oktober« in prose. Left alone, from 19 Oct it would read »söndag 18 oktober … om 173 dagar« beside »Provdagen · 10 apr«. The two literals now read `PROV_DATE_LABEL` / `PROV_DATE_DAY_MONTH`. The rendered text through 2026-10-18 is identical (render check above); no layout or wording changed. If the owner prefers R5A frozen, revert those two lines; its count and station will then disagree with its dateline after 18 Oct.
- **`sittingId` type is now `string | null`.** Only `examStore.ts` and its test read it (searched). Hydration still applies a server id through `setSitting`, which ignores unknown ids. A `null` default never reaches the server: nothing in the sync path writes the sitting.
- **`daysUntilProv`** now counts calendar days via `daysUntil` instead of `Math.ceil` of milliseconds, matching the landing and Home. It is still clamped at 0.
- **Visible side effects of the date fix** (intended): the Övningstext and redesign bake-offs now read 9 days / 18 okt from their fixed 9 Oct TODAY (was 16 / 25 okt). From 2026-10-19 every in-app countdown targets Vårprov 27, including for users whose stored or server target is `host-2026`. The `dates.ts` header's illustrative »172 dagar kvar« now says 165, which is 6 May → 18 Oct, matching the `daysUntil` test.
- **home.spec.ts mobile failures** are out of scope per round 1. For triage: `tests-e2e/home.spec.ts` has no date, countdown or clock reference (`rg -i "dagar|höstprov|vårprov|provdag|countdown|clock|Date\("` → no hits), so those two tests do not look date-driven.
- `PublicLanding.tsx` is unchanged; its `useMemo(() => getProvdatum(), [])` resolves once per mount, as before.
