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
