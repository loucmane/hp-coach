# Daily-study loop — empirical findings + improvement plan

**Date:** 2026-06-25. **Method:** a 5-lens probe that traced the loop in code AND
*executed* the real `generateDailyPlan` (scheduler.ts:148) on ~14 realistic dogfood
states via throwaway vitest harnesses. Every claim below is grounded in `file:line`
or an observed scheduler output. This doc is the spec/evidence for tasks #89 (SF1)
and #90 (SF2) and the strategic notes on Taskmaster #18 / #26.

## Verdict

The v1 daily-plan scheduler is **real, live, and mechanically correct** — wired
Home → `useDailyPlan` → `index.tsx` → `DailyPlanCard`, 39 passing tests, SRS done
right (worker `srs.ts` Leitner ladder; Rule 1 only surfaces truly-due items, so it
never crowds out new learning). The high-signal days fire well (cold-start →
diagnostik, reps-cap, all-three-fire, trap-drill from #148).

The real gaps are **NOT engine intelligence** — they are surgical holes in the
band where a 2.0-seeker actually lives (sections at 1.4–1.9), plus a loop that
can't *close* for the targeted user. **#26 (the richer adaptive engine) is
data-blocked and ranks LAST.** The pedagogically load-bearing *absence* is **#18
timed mock exams.**

## Confirmed bugs (the SF1 + SF2 work)

### 🔴 BLOCKER — the daily loop can't close for the 2.0-seeker
An all-mastered user's only generated item is a `section: null` mastery-maintenance
drill (scheduler.ts:403-414). `isItemComplete` returns `false` for any item with
`section == null` (useDailyPlan.ts:241-248 — the `item.section &&` guard falls
through), so `allComplete` is unreachable and the "Klart för idag / Perfect game"
`CompletePanel` (DailyPlanCard.tsx:154-202) is **dead UI for exactly the user the
app targets.** Same defect blanks the cold-start item within day 1 (self-heals next
day via diagnostik-seeded attempts). **Fix:** give `section: null` items a real
completion signal (e.g. complete the mastery drill when total `attempts7d` across
all sections grows ≥5 vs a global snapshot).

### 🔴 BLOCKER — the WEAKEST section gets no drill ("the dead zone")
*Found independently by 4 of 5 lenses.* Rule 2 (`needsLesson`) only fires at
score < 1.4 or stale > 7d (scheduler.ts:131,184). Rule 3 (`needsDrill`) is applied
**only to `ranked[1]`** (the *second*-weakest, scheduler.ts:199-207), never
`ranked[0]`. So a section in 1.40–1.79 and recent — the marginal section a 2.0 run
is won or lost on — receives **zero** targeted work; worse, `pickTrapForSection`
only searches the second-weakest, so a known recurring trap in the weakest section
is ignored. Observed: `ORD=1.1, lessons read → sole item drill/LÄS, ORD absent`;
`NOG weakest 1.40 + NOG-TRAP-007 with 8 misses → generic KVA drill`. **Fix:** when
no lesson is emitted for `ranked[0]`, let it receive its own trap-specific drill.

### 🟠 MAJOR — drill completion lags up to 60s (inconsistent feedback)
Drill items complete when `attempts7d` grows ≥5 vs the plan snapshot, but
`attempts7d` comes only from `useStats`, which has **no mutation invalidation**:
`useSubmitAttempt` is fire-and-forget (useAttempts.ts:22-34); `useStats` refetches
only on focus + every 60s. Reps feel instant because `useMistakes` invalidates
`DUE_KEY` (useMistakes.ts:70-74,93-95). **Fix:** add `onSuccess` invalidate of the
stats query to `useSubmitAttempt`.

### 🟠 MAJOR — lesson item href ≠ its completion signal
Lesson href is `/lektion?section=NOG` with **no `#entry` hash** (scheduler.ts:282),
but completion requires `lessonReads.has(item.framework)` where `framework` is the
first-unread entry id (useDailyPlan.ts:236-239). The reader supports a
`#ENTRY-ID` deep-link (LessonReader.tsx ~92-105) the scheduler never emits, so a
user can read the whole lesson and the item stays incomplete. **Fix:** emit
`/lektion?section=X#<framework-entry-id>`, and/or count any read in the section.

### 🟡 MINOR (the trust/polish batch)
- **Non-deterministic tie-break:** equal-weakness sections keep array order
  (scoring.ts:152-155); reversing the input flips the prescription
  (observed: all-1.7 → LÄS vs reversed → NOG). Add a stable tie-break.
- **Day-boundary staleness:** `now`/`today` frozen at mount (useDailyPlan.ts:66,74,116);
  an overnight-open tab serves yesterday's plan. Re-evaluate on day change.
- **Mislabel + rounding:** `drillRationale` calls a tied-strongest section "näst
  svagast"; `score.toFixed(1)` shows 1.79 as "1.8" to a careful user
  (scheduler.ts:375-377).
- **Mastery-endgame monotony:** `needsDrill` fires on any score < 1.8 unconditionally
  (scheduler.ts:222-227); a fresh, improving, already-practiced user gets the
  byte-identical drill every day (observed: 5 identical "KVA-drill · 10 frågor").
  Gate on trend/freshness; rotate the mixed-maintenance item by least-recently-touched.
- **Dead code:** `markItemComplete` (scheduler.ts:484-500) is defined + unit-tested
  but called nowhere; completion is entirely signal-derived. Delete or wire it.

### ✅ Confirmed working (do not touch)
Routing/`navigateHref` param-splitting (index.tsx:86-95); `/drill?framework=` trap
deep-link (drill.tsx:231-242); the SRS Leitner ladder (worker/src/lib/srs.ts:54-80);
cold-start, reps-cap, all-three-fire, long-break warm-up — all fire correctly.

## Why #26 ranks last (data-blocked, not logic-greenfield)

Of #26's five concepts, **zero have live data**; three need new instrumentation
*before any engine code runs*:
- `framework_progress` / `mastery` / `srs_state` tables exist (worker schema.ts:212)
  but are **write-dead** — no INSERT/UPDATE anywhere in `worker/src` (empty shells
  from the task-#24 schema port). The engine would read perpetually-empty tables.
- **No per-question difficulty** in the corpus (questions have 11 keys, none
  difficulty-like; 0 framework `difficulty_score`) — "cold-start by difficulty"
  silently falls back to position order, i.e. not adaptive.
- **No prerequisite graph** (`framework_prereqs.json` does not exist) — ~200 entries
  must be hand-authored.
- `trapCluster.ts` is a counting heuristic, not the lifecycle state machine #26 wants.
- The doc #26 claims to "follow exactly" (`docs/curriculum-scheduler.md`) is the **v1
  spec whose non-goals EXCLUDE adaptive scheduling** — so #26 has no design doc for
  the richer engine.

Honest decomposition: **5 instrumentation PRs** (author prereq graph; author/derive
difficulty; write `framework_progress`; write `mastery`; per-cluster rollup) before
the scheduler reads anything — the "feature is secretly a platform" signature. Its
*good intent* (drill the weakest near-mastery section, trap-specifically) is captured
by SF1 for near-zero cost.

## Recommended sequencing

1. **SF1 (#89) — loop-closer** (the two 🔴 blockers): one small PR. Makes the daily
   plan close for the 2.0-seeker and stop dropping the weakest section.
2. **SF2 (#90) — trust/consistency quick-wins** (the 🟠/🟡 batch): one small PR.
3. **#18 — mock exam modes** (the real next *feature*): design-first (no design doc
   exists), deps #8/#17 done, runs on the live question bank, and its errors feed the
   mistake queue the scheduler already consumes (Rule 1). The PRD MVP criterion
   ("score increase across two consecutive mock exams", PRD line 37) is *unmeasurable
   without it*.
4. **M3 drill rebuild** (M0→MC→M1→M2 from the M3 plan) — whenever the visual itch wins.
5. **#26 — adaptive engine** — only after the data writers exist; not now. Cheapest
   honest first step if ever queued: wire the `framework_progress`/`mastery` writers
   (one bounded PR) so future adaptivity has non-empty tables to read.

---

## Execution-vetted (2026-06-25) — corrected fix designs + TDD build order

A 4-lens execution pass (one agent *ran* the fixes) returned **GO-WITH-CHANGES**.
It caught that the originally-proposed F1 signal is **wrong and would re-create the
bug**. Build to the corrected designs below, not the first-draft ones above.

### F1 — REPLACE the signal: report-don't-derive (do NOT use attempt-count growth)
The proposed "complete the mastery drill when total `attempts7d` grows ≥5 vs a
snapshot" is unsound, verified by execution:
- **Window-slide:** `attempts7d` is a server-side *rolling* 7-day window
  (`worker/src/routes/me.ts:217`); the global total can *drop* overnight as old
  attempts age out — the probe observed total `30→21` (−9) **after the user did 6
  fresh questions today**, so the ≥5 gate is unreachable on the active-streak day it
  must fire.
- **Cross-contamination:** "grew ≥5 anywhere" completes the `section=null` mastery
  item when the user does a *different* item's 5-question section drill → fakes
  `allComplete`.
- **Wrong for cold-start:** the cold-start item is also `section=null` but
  `href=/diagnostik` — a distinct flow; the shared signal marks it "done" from
  unrelated drill attempts.

**Corrected design — wire the already-built-but-dead `markItemComplete`.**
`SessionPlayer` owns a clean done-transition (`SessionPlayer.tsx:332-342`,
`setPhase('done')` + `updateSession end:true`), and `markItemComplete` (scheduler.ts:484-500)
is written **and unit-tested** but called nowhere. Wire the session done-event to call
it for the plan item that session satisfies. **Load-bearing caveat:** `deriveCompletion`
recomputes from signals every render and treats persisted `completed` as a cache that
flips back to false — so `isItemComplete` must *also* honor a separate reported-done
flag (a `hpc-plan-item-done-<id>` localStorage key, mirroring `markLessonRead`) or the
wire is a no-op. This one mechanism collapses **3 of the 4 completion bugs** (section=null
dead-end, 60s drill lag, <5-question dead-end) into one correct path. **No
`PLAN_SCHEMA_VERSION` bump** (the flag lives outside the plan blob).

### F2 — sound, with 4 guards
Reuse `pickTrapForSection(topTraps, ranked[0].section)` (resolves by section, verified)
with a `drillItem` fallback. Guards: (1) place it **after** the long-break + cold-start
early returns and **before** the Rule 3 `ranked[1]` block (so the 3-item cap drops the
lower-value `ranked[1]` drill, not the weakest trap drill); (2) gate on
`!weakestLessonEmitted` — a boolean set **only inside the `hint !== null` lesson push**
(scheduler.ts:189-191), NOT on `!needsLesson` (the `hint===null` all-read case is exactly
where F2 must fire); (3) gate on `needsDrill(weakest)` so a 1.9 weakest isn't drilled;
(4) thread a rank/role flag so `drillRationale` stops labeling the weakest "näst svagast"
(scheduler.ts:376) — this becomes a *correctness* bug once F2 ships.

### New bug found: the mixed-drill routing lie
The mastery item href is bare `/drill` (scheduler.ts:411) but `/drill` defaults
`section ?? 'ORD'` (drill.tsx:89) — so **"Blandad övning · alla sektioner" actually plays
an ORD-only drill.** Fix in SF1: either make bare `/drill` genuinely random-across-sections,
or give the mastery item `section = least-recently-attempted` (from
`SectionScore.daysSinceLastAttempt`) + `href=/drill?section=X` — the latter also gives it a
real per-section completion path and powers SF2's rotation.

### SF2 corrections
- **Lesson-href hash is dead on arrival:** `navigateHref` splits only on `?`, so
  `/lektion?section=NOG#NOG-TRAP-001` yields `section="NOG#NOG-TRAP-001"`. **Recommended:**
  drop the hash; complete the lesson item when **any** entry of the section's framework is
  read (no router change; also dodges the first-unread-entry drift).
- **`markItemComplete`: WIRE it, don't delete** — it's the keystone of F1.
- **Day-boundary:** recompute `today` on `focus`/`visibilitychange`, NOT a midnight
  `setInterval` (a naive `now`-in-deps reintroduces the documented infinite render loop,
  useDailyPlan.ts:92-103); suppress regeneration while a session is active.
- **Mastery monotony:** the `needsDrill` freshness/trend gate is pure + safe (empty-plan
  fear unfounded — mastery fallback backstops). The *rotation* half depends on the
  mastery-section decision above; settle that in SF1 first.
- **stats-invalidate** on session-**end** only (not per-question → avoids ~10×/session
  refetch storm).

### PR split — THREE PRs (not two)
- **PR A = SF1 (#162/#89):** F2 (pure scheduler) first, then F1 (the report-don't-derive
  wire + reported-done flag + mixed-drill routing fix).
- **PR B = SF2a (pure):** rankWeakness tie-break, drillRationale label+precision,
  needsDrill freshness gate. scheduler.ts/scoring.ts + tests only, near-zero blast.
- **PR C = SF2b (hook/cache):** stats-invalidate, lesson-completion fix, day-boundary.
  Higher blast (hook/router/query-cache); land last.

### Test impact
Baseline 85 tests green. New test seam: **export `deriveCompletion`/`isItemComplete`** +
create `useDailyPlan.test.ts` (no hooks test exists today). Existing tests that flip:
`scheduler.test.ts:188-198` ("skips lesson when hint null" — now also gets a drill);
`:158` only if the hash-href design is kept (avoid it). `:308-311` ("mastery section
`toBeNull`") flips only if mastery gets a real section (decide first). Keep
`markItemComplete` describe (`:515-531`). No schema bump under the recommended designs.

### Owner decisions (recommendations adopted unless you object)
1. **Completion model → report-don't-derive** (unanimous; the count heuristic is
   empirically proven not to close the blocker). **Recommended + adopted.**
2. **Mastery item section → least-recently-attempted** (fixes the routing lie, gives a
   real completion path, powers rotation) vs keep `section=null`. **Recommended:
   least-recently-attempted.**
3. **Lesson completion → section-read** (no router change). **Recommended.**
4. Day-boundary via focus/visibilitychange, regen suppressed mid-session (or defer the
   overnight-tab case for the single dogfood user). **Recommended: implement.**
5. stats-invalidate on session-end. **Recommended.**

---

## Cross-device rework (2026-06-25) — SUPERSEDES the F1 done-flag design above

A 5-lens cross-device panel found the committed F1 done-flag core is BOTH (a) device-local —
wrong for a hard multi-device product (CLAUDE.md) — AND (b) never wired in production
(`markPlanItemDone` has no caller, so section=null items don't complete on ANY device today).
**Replace the localStorage done-flag with a server-derived signal.** Decision (owner-approved):

### The signal: `users.attemptsTotal` (lifetime, monotonic, cross-device, zero backend change)
`attempts.total` (stats payload, `useStats.ts:26`; `me.ts` `attemptsTotal`) is bumped +1 in the
same D1 write as every attempt (`attempts.ts:74`). It NEVER decrements — so it dodges both the
`attempts7d` rolling-window slide AND the `attemptsToday` UTC-vs-local-midnight mismatch
(`me.ts:72-73` gates `today` on UTC; the plan is local-date keyed — so `attemptsToday` was the
wrong signal). Cross-device because both devices read the same server counter.

### SF1 (reworked) — server-derived, simpler:
- **DELETE the device-local done-flag core**: `markPlanItemDone`, `loadDoneItems`,
  `ITEM_DONE_PREFIX`, the purge addition, and the `doneItems` param + branch in `isItemComplete`
  + its 4 call sites. Never wired → nothing regresses. (Reverses part of commit 43e9e05.)
- **section=null completion via `attempts.total` snapshot-diff**: snapshot `attempts.total` into
  the plan at gen (a `__total` key beside `attemptsSnapshot`); `isItemComplete` section=null
  branch returns `currentTotal − baseline >= 5`. No SessionPlayer wire, no sessionStorage, no
  new table/endpoint/migration.
- **Mixed-drill routing fix**: mastery item gets `section = least-recently-attempted`
  (from `daysSinceLastAttempt`) + `href=/drill?section=X` (bare `/drill` plays ORD-only). Turns
  it into a normal section drill on the existing per-section path; shrinks section=null to
  cold-start only (`href=/diagnostik`, self-heals next local-day; the total-diff is a safety net).
- **Pull in the stats-invalidation** (was SF2): `useSubmitAttempt` `onSuccess` invalidates the
  stats query (`useAttempts.ts` has none today; `useStats` polls 60s) — without it completion
  lags up to 60s and reads as broken, masking whether SF1 even works during verification.
- **F2 stays as-is** (committed 610a2e7).

### Lessons: OUT of SF1 (deferred). `lessonProgress` is a per-(user,section) BOOKMARK of the
last-opened entry (`schema.ts:105-120`), NOT a per-entry read set — it can't represent "which
entries are read". Cross-device lesson completion needs a NEW `lesson_reads(user_id, entry_id)`
table + endpoint + migration (clone the lessonProgress scaffolding) + `useLessonReads` rewire,
localStorage as a write-through cache. No zero-completion bug today (works single-device). → new
deferred task.

### Accepted residue (state plainly in the PR — do NOT call SF1 "fully cross-device"):
the completion BASELINE (`attemptsSnapshot` / `__total`) lives in the per-device localStorage
plan blob, so SF1 is cross-device on the SIGNAL but not the BASELINE — a mastery item completed
on phone can briefly still show actionable on desktop. Acceptable for a solo two-device user; the
design doc deferred the server `daily_plans` table until divergence is real friction. → deferred.

### Deferred backlog (with triggers):
- **Section-drill monotonic counter** (SF2): replace the `attempts7d`-delta drill gate with a
  per-section same-day monotonic counter (add `if ts>=todayStart: agg.attemptsToday++` to the
  `me.ts` loop, thread through `SectionStats`). Trigger: window-slide flips a finished drill back
  to incomplete intraday.
- **Lessons cross-device**: the `lesson_reads` table/endpoint/migration above. Trigger: a finished
  lesson re-recommended on the other device; likely folds in with Taskmaster #26 framework writers.
- **Plan baseline → server `daily_plans` table**: kills the per-device-baseline residue. Trigger:
  the design doc's bar — observed phone/desktop plan divergence. Relates to deferred #60 (Dexie
  queue) / #61 (Durable-Object sync). Subsumes any `plan_completions` table — don't build that
  separately.
