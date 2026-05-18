# Curriculum scheduler — design doc (B3)

**Status:** Draft for review. No code yet — implementation lives in
a follow-up PR after sign-off.

## Problem

Home today renders a hero CTA `Fortsätt övning` and three tiles.
The dogfood user named the friction plainly: *"the actual user
flow is still very non existant"*. The product knows enough to
prescribe — per-section grades from B2, due-mistake queue, lesson
completion state, recent activity. But Home offers no prescription.
The user has to decide every time: which section, drill or lesson,
clear repetitions first or after, study or maintenance.

For an ADHD-PI user aiming at 2.0, that's the wrong place to put
the decision load. The product should answer **"what should I study
now?"** the moment the user opens it.

## Goal

A scheduler that turns existing signals into a 1–3 item daily plan,
rendered as the Home hero. The plan answers:

- **What to do** (lesson, drill, or repetition)
- **Where** (which section, optionally which framework entry)
- **Why** (one-line rationale the user can trust)
- **How long** (rough time estimate)

Each item is a single tap to start. The plan persists within a day
so refreshing Home doesn't regenerate (the user shouldn't see the
plan churn under them).

## Non-goals

- Adaptive scheduling that learns from response patterns. v1 is a
  static rule engine over current signals; the response-pattern
  layer is PRD Phase 4.
- Time-of-day scheduling (`morning vs evening`). v1 is one plan
  per calendar day, regenerated on the next local midnight.
- Multi-device handoff. v1 stores plan state in localStorage; if
  the user opens HP-Coach on phone after using it on desktop, the
  plan may be slightly stale. Server-side persistence is a follow-up
  if that becomes a real friction point.
- A streak/gamification surface. The daily plan is the achievement;
  no separate streak counter unless the user asks for it later.

## Signals (already in the product)

The scheduler consumes signals that B1, B2, and existing infra
already expose. No new instrumentation should be needed for v1.

| Signal | Source | Used for |
|---|---|---|
| Per-section score (0.0–2.0) | `computeSectionScore` (B2) | Weakness ranking |
| Per-section trend (rising/flat/declining) | weekly buckets (B2) | Tie-breaker on weakness, "needs reinforcement" rationale |
| Last-attempt timestamp per section | attempts log (B2) | Staleness check; flags sections gone >7 days untouched |
| Due-mistake count | `useDueMistakes` | Repetition prescription |
| Lesson read state (per entry) | **does not exist yet** — see "Open questions" | Avoid recommending a lesson the user just read |
| Total attempts in last 24h | attempts log | Detects "already practiced today, suggest lighter follow-up" |

## Output shape

```ts
type DailyPlan = {
  /** Local-date the plan was generated for, ISO 8601 (YYYY-MM-DD). */
  date: string
  /** Ordered prescription. v1 emits 1–3 items. */
  items: PlanItem[]
  /** Total estimated minutes across not-yet-completed items. */
  estimatedMinutes: number
}

type PlanItem = {
  /** Stable id for completion tracking (e.g. 'rep-2026-05-18'). */
  id: string
  kind: 'lesson' | 'drill' | 'repetition'
  section: Section | null  // null for repetition (mixed sections)
  /** Optional framework deep-link (PR #41) for lesson and drill items. */
  framework?: string
  /** Display copy. Swedish, second-person, ADHD-PI direct. */
  headline: string         // e.g. "NOG-lektion"
  rationale: string        // e.g. "Svagast section — 1.2, ingen aktivitet på 11 dagar"
  estimatedMinutes: number
  /** Route the tap goes to. */
  href: string
  /** Marked true when the user completes the item. */
  completed: boolean
}
```

## Generation rules (v1, deterministic)

The rules are applied in order. Each rule may add at most one
item; the scheduler short-circuits when it has 3 items.

**Rule 1 — Due repetitions, always first.** If `useDueMistakes`
returns >0 due, the first item is a repetition. Rationale:
*"X missar väntar på repetition — gör dem först, de förlorar effekt
om de väntar för länge."*

**Rule 2 — Weakest section needs a lesson.** Find the section with
the lowest score (B2 weakness ranking). If its `daysSinceLastAttempt`
is >7 **or** its score is <1.4, prescribe a lesson in that section.
Use the framework's first non-mastered entry (initially: first entry
in the array). Rationale: *"Svagast i 14 dagar — börja med lektionen."*

**Rule 3 — Next-weakest section needs a drill.** Find the second-
weakest section by B2 ranking. Prescribe a 10-question random drill.
Rationale: *"KVA-resultat har trendat nedåt senaste veckan."* If the
section has a declining trend, use that as the rationale; otherwise
use staleness or absolute score.

**Rule 4 — Mastery maintenance fallback.** If after rules 1–3 we
have 0 items (i.e. no due reps, all sections >1.8 and recent), emit
a "mixed mastery" drill across all 8 sections. Rationale: *"Du är
ifatt — sikta mot 2.0 med blandad övning."*

**Rule 5 — Cold start.** If the user has zero attempts in their
history, the only item is a diagnostic CTA (the B4 deliverable when
that lands; for now it falls through to a section-picker prompt).
Rationale: *"Vi behöver några frågor först för att veta var du står."*

### Time estimates

Already exist in `SECTION_DURATIONS` (`app/src/routes/drill.tsx`).
Repetition is fixed at 1 min × due-count. Lesson uses the existing
masthead estimate (`~N min läsning`).

### Plan refresh

Generated once per local-day on Home mount. Cached in localStorage
under `hpc-daily-plan-{YYYY-MM-DD}`. A new local-date triggers
regeneration. Old keys age out after 30 days (cleanup on plan write).

A **"Generera om"** button on Home regenerates the same day's plan
(testing + change-of-mind, not the primary path).

### Completion

Each `PlanItem.completed` flips to `true` when the user finishes the
corresponding session. Plan re-renders to show progress. When all
items complete, the Home card flips to a *"Klar för idag — perfect
game"* state with a CTA to do an extra drill if they want more.

## UX

Home becomes a single-column daily plan card at the top, with the
existing tiles dropped below for manual access:

```
HP · COACH                                       MÅN 18 MAJ

  God morgon, Loucmane.

  IDAG · 32 MINUTER
  ─────────────────────────────────────────────
  •  Repetition · 3 missar              ~4 min →
     Förlorar effekt om de väntar längre
  •  NOG-lektion · 2×2-tabellen        ~6 min →
     Svagast section — 1.2, 11 dagar idle
  •  KVA-drill · 10 frågor             ~12 min →
     Trendat nedåt senaste veckan

  ─────────────────────────────────────────────
  GENERERA OM · TÖM · SE ALLT
```

After all items complete:

```
  ✓ KLART FÖR IDAG. PERFECT GAME.

  Total tid: 33 min · 1.62 → 1.67
  Imorgon: KVA-lektion väntar.

  [ Extra övning →  Repetition?  Lektion? ]
```

Existing tiles for free-form drill / lesson / progress / coach stay
below the daily plan card.

## Edge cases

| Case | Behaviour |
|---|---|
| Plan already complete for today, user opens Home | Show the "Klart för idag" state, offer optional extras |
| User skips a day | Next day's plan absorbs the missed weak-section lesson and adds *"Vi tog det igår dock — men igår missade vi."* |
| Long break (14+ days) | Warm-up drill across user's strongest section first, no lesson prescribed until day 2 |
| User completes item X but the rationale changes by tomorrow (e.g. they ground out the weakness) | Tomorrow's plan generates fresh; no cross-day continuity expected |
| New user with no attempts | Single-item plan: *"Vi behöver några frågor först — gör diagnosen."* Routes to /diagnostik (B4) or, until B4 lands, to /drill?section=ORD with a "we'll learn from this session" framing |

## Persistence

```
localStorage['hpc-daily-plan-2026-05-18'] = JSON.stringify(DailyPlan)
localStorage['hpc-daily-plan-2026-05-17'] = JSON.stringify(DailyPlan)
// ... keys older than 30 days deleted on each write
```

No D1 schema change in v1. If the user complains about plan
divergence between phone and desktop, promote to a D1 table:

```sql
CREATE TABLE daily_plans (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,         -- YYYY-MM-DD
  plan JSON NOT NULL,
  PRIMARY KEY (user_id, date)
);
```

## Implementation sequencing

Two PRs after this design doc lands:

1. **B3.1 — Scheduler core**
   - `app/src/lib/scheduler.ts` — pure function `generateDailyPlan(signals): DailyPlan`
   - Unit tests for each rule + each edge case
   - Storage helpers (`loadPlan`, `savePlan`, `markComplete`)
   - No UI yet

2. **B3.2 — Home UI**
   - Replace HomeMobile hero with daily-plan card
   - Wire `useDailyPlan()` hook to scheduler + storage
   - "Generera om" + tile fallback
   - Visual verification at phone + studio widths

## Open questions for review

1. **Track lesson reads server-side?** Without persistence, the
   scheduler can re-recommend the same lesson tomorrow. Cheapest
   v1: localStorage `hpc-lesson-read-{entry-id}` flag. Server-side
   would be a `lesson_reads` D1 table.

2. **Time-of-day awareness?** The plan refreshes at local midnight.
   A user who studies at 2 AM gets yesterday's plan replaced by
   today's right after they start. Should we use a 4 AM cutoff
   instead? **Default: midnight, revisit if it bites.**

3. **Total time visible at top?** The mockup shows "IDAG · 32
   MINUTER" prominently. Some users find time estimates motivating;
   ADHD-PI users sometimes find them demoralising when the actual
   time runs over. **Default: show the estimate, revisit if dogfood
   user finds it unhelpful.**

4. **Mastery-maintenance section choice?** When all sections are
   >1.8, Rule 4 picks a mixed-section drill. Should we instead
   prescribe the LEAST-recently-touched section to keep all 8
   "warm"? **Default: mixed, revisit if rotation matters.**

5. **What if the score-model signals are noisy on a small sample?**
   B2 already discounts for low confidence (under 10 attempts).
   The scheduler should re-use that — if the weakest-section
   signal is low-confidence, fall back to a section the user
   hasn't touched recently instead of one with possibly-spurious
   low scores. **Add: "low-confidence weakness → defer to
   staleness."**

## What success looks like

A dogfood session a week after B3 ships:

1. User opens HP-Coach at 09:14
2. Home: *"God morgon. Idag · 28 minuter: 3 repetitioner · NOG-
   lektion (Statement 1 ≠ Statement 2) · 10 ORD-frågor med rot
   'för-'."*
3. Tap repetition → done in 3 minutes
4. Tap NOG-lektion → reads, lands in NOG-TRAP-001 drill → done
5. Tap ORD drill → done
6. Home flips to "Klart för idag" with optional extras
7. /progress shows 1.62 → 1.65

The screen the user originally complained about ("non existant user
flow") becomes the screen that drives the daily session.
