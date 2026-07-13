// Curriculum scheduler — produces the daily plan rendered on Home.
//
// Pure sync function `generateDailyPlan(signals): DailyPlan`. Callers
// (the `useDailyPlan` hook in B3.2) resolve the async inputs — section
// scores from B2, due-mistake count from `useDueMistakes`, framework
// first-entry hints, lesson-read flags — and hand them in. Keeps the
// rule logic fully testable without DOM / network / async.
//
// See docs/curriculum-scheduler.md for the rule semantics. Five rules,
// applied in order:
//   1. Due repetitions (always first)
//   2. Weakest section needs a lesson (gated on score < 1.4 or stale > 7d)
//   3. Next-weakest section needs a drill (gated on score < 1.8 or
//      negative trend or stale > 14d)
//   4. Mastery maintenance — fallback when nothing else fires
//   5. Cold start — early return, replaces all other rules

import type { Section } from '@/data/questions'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { computeProjected, rankWeakness, type SectionScore } from '@/lib/scoring'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'

/** Average wall-clock minutes per repetition rep — used to estimate
 *  the daily-plan minutes budget. 10 reps at ~0.75 min/rep ≈ 8 min,
 *  which matches what the user actually experiences. The previous
 *  `Math.max(1, count)` produced ~50 min for 50 missar, contradicting
 *  the 10-question session cap. */
const MINUTES_PER_REP = 0.75

export type PlanItemKind = 'lesson' | 'drill' | 'repetition' | 'mock'

export type PlanItem = {
  /** Stable id for completion tracking. Deterministic per-day, so a
   *  regeneration on the same day produces the same id and the
   *  `completed` flag survives. */
  id: string
  kind: PlanItemKind
  /** Null for cross-section items (repetition, mixed-mastery drill). */
  section: Section | null
  /** Framework entry id when the item deep-links to a specific lesson
   *  entry — e.g. `NOG-TRAP-001` for the "Statement 1 ≠ Statement 2"
   *  pattern. Surfaced by the Home card as a subheading. */
  framework?: string
  /** Swedish display string. Second-person, ADHD-PI direct. */
  headline: string
  rationale: string
  estimatedMinutes: number
  href: string
  completed: boolean
}

/** Schema version for the stored DailyPlan. Bump when item shape,
 *  href format, OR the framework-data the headlines snapshot changes
 *  — `loadPlan` returns null on mismatch, forcing the hook to
 *  regenerate.
 *
 *  Bumps:
 *  - v2: split path/query in navigate; cache invalidated stale
 *    `/lektion/NOG`-style hrefs from before #47.
 *  - v3: KVA/MEK/DTK/LÄS/ELF framework copy translated to Swedish in
 *    #51. Lesson-item headlines capture the framework headword at
 *    plan-generation time, so plans cached before #51 still display
 *    English lesson titles.
 *  - v4: repetition session-size sanity (#74). Headline shape
 *    changed from `Repetition · 50 missar` to `Repetition · 10 av
 *    50 missar` when the backlog overflows the per-session cap;
 *    estimatedMinutes recalibrated to ~0.75 min/rep. Plans cached
 *    before #74 still show the misleading raw count.
 *  - v5: trap-aware drill rule. When a top-trap exists in the next-
 *    weakest section, the drill item now points to that specific
 *    trap (`/drill?framework=NOG-TRAP-007`, headline names the
 *    trap, rationale cites recent miss count). Plans cached before
 *    this still prescribe generic section drills.
 *  - v7: Provpass (mock exam) steering — "Kallelsen färgad" (PR #218).
 *    New `kind: 'mock'` anchor item (`/prov?half=X&prescribed=1`) can
 *    now occupy item 1 and reduce the day to at most one companion
 *    item. Plans cached before this never had a mock item even when
 *    one was due.
 *  - v8: adaptive-review hot-trap boost (task #16). When a hot trap is
 *    active, its trap-drill item is reordered to plan[0]. A plan cached
 *    before this could show the same items in a different order, so we
 *    invalidate to guarantee the boosted ordering takes effect. */
export const PLAN_SCHEMA_VERSION = 8

export type DailyPlan = {
  /** Schema version — see `PLAN_SCHEMA_VERSION`. Older plans are
   *  treated as cache misses and regenerated. */
  version: number
  /** Local-date the plan was generated for, ISO 8601 (YYYY-MM-DD). */
  date: string
  items: PlanItem[]
  /** Total estimated minutes across not-yet-completed items. */
  estimatedMinutes: number
  /** Per-section `attempts7d` snapshot taken when the plan was
   *  generated. Drives drill auto-completion: a drill item flips
   *  to `completed` once the section's current `attempts7d` has
   *  grown by enough to indicate the user actually drilled that
   *  section. Pure `generateDailyPlan` doesn't set this — the
   *  caller (e.g. `useDailyPlan`) attaches it after generation
   *  to keep the pure function free of UI concerns. */
  attemptsSnapshot?: Partial<Record<Section, number>>
  /** Lifetime `attempts.total` (server, monotonic) snapshot taken when the
   *  plan was generated. Drives completion for section=null items (mastery,
   *  cold-start) which have no per-section signal: the item flips to
   *  `completed` once the current server total has grown by enough to mean
   *  the user did ~half a session of practice. Cross-device because both
   *  devices read the same server counter. Caller-attached, like
   *  `attemptsSnapshot`. */
  totalAttemptsSnapshot?: number
}

/** Hint passed in for a section's framework first-entry. Lets the
 *  scheduler emit a lesson item whose headline names the entry
 *  (`"NOG-lektion · 2×2-tabellen"`) and whose `framework` field
 *  deep-links the eventual Home card. Three states:
 *   - `{ id, headword }` — entry to recommend
 *   - `null`             — user has read everything in this framework;
 *                          skip the lesson item
 *   - `undefined`        — no hint resolved (fall back to generic lesson)
 */
export type FrameworkHint = { id: string; headword: string } | null

export type SchedulerSignals = {
  /** Drives the plan's `date` field and the staleness comparisons in
   *  `daysSinceLastAttempt` (which is already computed in the
   *  SectionScores — `now` here is only for the date string). */
  now: Date
  sectionScores: SectionScore[]
  dueMistakeCount: number
  /** Per-section framework hints. Missing key === undefined === no hint. */
  firstUnreadEntry?: Partial<Record<Section, FrameworkHint>>
  /** Recurring trap patterns from the active mistake queue. When
   *  present and a trap belongs to the next-weakest section, the
   *  drill rule prefers a *trap-specific* drill ("Kvotjakten · 5
   *  frågor") over a generic section drill. Sorted by miss count
   *  descending. Empty / undefined → fall back to section drills. */
  topTraps?: Array<{
    framework_id: string
    section: Section
    count: number
    /** Display name from the framework's `tldr` field. Used in the
     *  plan item headline / rationale. May be null when the framework
     *  data hasn't loaded yet — caller decides whether to wait. */
    headline: string | null
  }>
  /** Provpass (mock exam) steering — "Kallelsen färgad" (owner-approved
   *  2026-07-10, PR #218). Optional so existing call sites/tests that
   *  don't care about mocks keep working; `prescribeMock` treats a
   *  missing/empty history as "never mocked" (baseline case). */
  mockHistory?: MockHistoryEntry[]
  /** Days remaining until the target exam sitting — from
   *  `daysUntil(sitting.date, now)` in `lib/dates.ts` (the same source
   *  NavRail's "Höstprov 26 · N dagar" reads). Drives the cadence
   *  interval. Missing defaults to the longest interval (14d) so an
   *  unresolved exam date never falsely under-primes cadence. */
  daysToExam?: number
  /** Adaptive-review hot trap (task #16) — a framework the user is
   *  actively falling for (≥3 misses in the last 7d), resolved by
   *  `detectHotTrap` in the hook layer. When present, its trap-drill
   *  item is BOOSTED to plan[0] — a light priority nudge on top of the
   *  existing trap-aware rules, NOT a structural change. Undefined /
   *  null → no boost (unchanged plan). */
  hotTrap?: { framework_id: string } | null
}

/** Minimal shape `prescribeMock` needs from a mock-results row — a
 *  structural subset of `MockResultRow` (app/src/api/hooks/
 *  useMockResults.ts) so the scheduler doesn't import the API hook
 *  module directly. */
export type MockHistoryEntry = {
  half: MockHalf
  createdAt: number | string | null
}

export type MockHalf = 'verbal' | 'kvant'

/** THE CONTRACT — a parallel surfaces-PR imports these exact names.
 *  See prescribeMock below for the cadence rules. */
export type MockPrescription = {
  due: boolean
  /** Which half to prescribe (stalest; tie → weaker-prognosis half). */
  half: MockHalf
  /** null = never mocked (either half). */
  daysSinceLast: number | null
  /** 0 when due; >= 1 otherwise. */
  daysUntilNext: number
  /** The active cadence interval (days) used for this prescription. */
  interval: number
}

const LESSON_SCORE_THRESHOLD = 1.4
const LESSON_STALE_DAYS = 7
const DRILL_SCORE_THRESHOLD = 1.8
const DRILL_TREND_THRESHOLD = -0.05
const DRILL_STALE_DAYS = 14
const LONG_BREAK_DAYS = 14
const MASTERY_FLOOR = 1.8
const MAX_ITEMS = 3

// ---------------------------------------------------------------------------
// Provpass (mock exam) steering — "Kallelsen färgad" (PR #218 design).
// ---------------------------------------------------------------------------

/** Cadence interval (days) by proximity to the exam — tightens as the
 *  exam approaches so staleness is caught sooner when it matters most. */
const MOCK_INTERVAL_FAR = 14 // daysToExam > 35
const MOCK_INTERVAL_MID = 10 // 14 <= daysToExam <= 35
const MOCK_INTERVAL_NEAR = 7 // daysToExam < 14
const MOCK_FAR_THRESHOLD = 35
const MOCK_NEAR_THRESHOLD = 14

const MOCK_MINUTES = 55

/** Cadence interval (days) for the given proximity to the exam. Missing
 *  `daysToExam` defaults to the longest (calmest) interval — an
 *  unresolved exam date should never manufacture urgency. */
export function mockCadenceInterval(daysToExam: number | undefined): number {
  if (daysToExam == null) return MOCK_INTERVAL_FAR
  if (daysToExam > MOCK_FAR_THRESHOLD) return MOCK_INTERVAL_FAR
  if (daysToExam >= MOCK_NEAR_THRESHOLD) return MOCK_INTERVAL_MID
  return MOCK_INTERVAL_NEAR
}

function toTimestamp(v: number | string | null): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  const parsed = new Date(v).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

/** Days between `now` and the most recent entry for a half, or null when
 *  the half has never been mocked. Calendrical (local-midnight-anchored,
 *  matching `daysUntil` in lib/dates.ts) so "practiced this morning,
 *  checked again this evening" doesn't read as 1 day stale. */
function daysSinceHalf(history: MockHistoryEntry[], half: MockHalf, now: Date): number | null {
  let latest: number | null = null
  for (const entry of history) {
    if (entry.half !== half) continue
    const ts = toTimestamp(entry.createdAt)
    if (ts == null) continue
    if (latest == null || ts > latest) latest = ts
  }
  if (latest == null) return null
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const b = new Date(latest)
  const bMid = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((a - bMid) / 86_400_000)
}

/** Prescribe the next Provpass (mock exam) — pure, exported, THE
 *  CONTRACT. See `MockPrescription` for the shape; a parallel
 *  surfaces-PR imports these exact names.
 *
 *  Cadence rules (STATIC, MVP — panel pedagogy spec):
 *   - Baseline: zero completed mocks ever → due immediately, half =
 *     the WEAKER half by prognosis (verbal vs kvant section scores).
 *   - Staleness: interval(daysToExam) is 14 / 10 / 7 by proximity (see
 *     `mockCadenceInterval`). Due when `daysSinceLast[half] >= interval`
 *     for the STALEST half (largest daysSinceLast; never-mocked half
 *     counts as infinitely stale). Tie on daysSinceLast → weaker-
 *     prognosis half.
 *   - The window slides silently: due stays true until a mock
 *     completes. There is no stored "already prescribed today" state —
 *     the result is purely signal-derived from `now` + history, so
 *     calling this again tomorrow without a new mock still returns
 *     `due: true` for the same (or a more overdue) half. */
export function prescribeMock(signals: SchedulerSignals): MockPrescription {
  const history = signals.mockHistory ?? []
  const interval = mockCadenceInterval(signals.daysToExam)
  const projected = computeProjected(signals.sectionScores)

  // Weaker-prognosis half: lower score is weaker. Nulls (no signal for
  // either half yet) fall back to 'verbal' — arbitrary but deterministic,
  // matching the "pick the first half" spirit of other scheduler ties.
  const weakerHalf: MockHalf =
    projected.verbal != null && projected.quant != null
      ? projected.quant < projected.verbal
        ? 'kvant'
        : 'verbal'
      : 'verbal'

  const daysSinceVerbal = daysSinceHalf(history, 'verbal', signals.now)
  const daysSinceKvant = daysSinceHalf(history, 'kvant', signals.now)

  const neverMocked = daysSinceVerbal == null && daysSinceKvant == null

  if (neverMocked) {
    return {
      due: true,
      half: weakerHalf,
      daysSinceLast: null,
      daysUntilNext: 0,
      interval,
    }
  }

  // Stalest half: largest daysSinceLast wins; a never-mocked half is
  // infinitely stale (Infinity sorts above any finite day count).
  const verbalStaleness = daysSinceVerbal ?? Number.POSITIVE_INFINITY
  const kvantStaleness = daysSinceKvant ?? Number.POSITIVE_INFINITY

  let stalestHalf: MockHalf
  if (verbalStaleness === kvantStaleness) {
    stalestHalf = weakerHalf
  } else {
    stalestHalf = verbalStaleness > kvantStaleness ? 'verbal' : 'kvant'
  }

  const stalestDaysSince = stalestHalf === 'verbal' ? daysSinceVerbal : daysSinceKvant
  const staleness = stalestHalf === 'verbal' ? verbalStaleness : kvantStaleness
  const due = staleness >= interval
  const daysUntilNext = due
    ? 0
    : // Finite because `due` already handles the Infinity (never-mocked) case.
      Math.max(1, interval - (stalestDaysSince as number))

  return {
    due,
    half: stalestHalf,
    daysSinceLast: stalestDaysSince,
    daysUntilNext,
    interval,
  }
}

// Freshness/trend exemption for needsDrill — a section practiced within
// this many days counts as "just practiced" for the exemption below.
const DRILL_FRESH_DAYS = 1
// A trend at or above this counts as "improving" for the exemption.
const DRILL_IMPROVING_TREND = 0.05

/** Convert a Date to a YYYY-MM-DD local-date string (not UTC). */
export function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function generateDailyPlan(signals: SchedulerSignals): DailyPlan {
  const { now, sectionScores, dueMistakeCount, firstUnreadEntry } = signals
  const date = localDateString(now)
  const hasAnyAttempt = sectionScores.some((s) => s.score != null)

  // Rule 0 — Provpass anchor. When a mock is due, it becomes the day's
  // ANCHOR: item 1, plus at most one cheap due-repetition item, nothing
  // else. Takes priority over cold start too — the baseline "never
  // mocked" case IS a due prescription, and a fresh user with a mock due
  // shouldn't get the generic diagnostic instead.
  //
  // Gated on `daysToExam` being provided: it's the signal that means
  // "the caller has opted into Provpass steering" (useDailyPlan always
  // supplies it in production). Callers/tests that only exercise the
  // pre-existing lesson/drill/repetition rules and never pass
  // `daysToExam` see unchanged behaviour — the mock feature simply
  // doesn't engage without its input.
  const mockPrescription = signals.daysToExam != null ? prescribeMock(signals) : null
  if (mockPrescription?.due) {
    const items: PlanItem[] = [mockItem(mockPrescription, date)]
    if (dueMistakeCount > 0 && items.length < MAX_ITEMS) {
      const rep = repetitionItem(dueMistakeCount, date)
      // "cheapest due-repetition item if any (≤5 min)" — cap the anchor
      // day's companion item so it never balloons the session past the
      // Provpass itself.
      if (rep.estimatedMinutes <= 5) items.push(rep)
    }
    return finalize(date, items)
  }

  // Rule 5 — cold start. Early return: a fresh user with no signal
  // shouldn't be drilled into a section we picked arbitrarily.
  if (!hasAnyAttempt && dueMistakeCount === 0) {
    return finalize(date, [coldStartItem(date)])
  }

  const items: PlanItem[] = []

  // Rule 1 — due repetitions, always first.
  if (dueMistakeCount > 0) {
    items.push(repetitionItem(dueMistakeCount, date))
  }

  // Long-break override: if every scored section is >14d stale, the
  // user is just coming back. Replace lesson + drill with a single
  // warm-up on their strongest section. Rule 1 (reps) still fires
  // first because aged reps are the most volatile signal.
  const allStale = sectionScores.every(
    (s) => s.score == null || s.daysSinceLastAttempt > LONG_BREAK_DAYS,
  )
  if (allStale && hasAnyAttempt) {
    if (items.length < MAX_ITEMS) {
      items.push(warmupItem(sectionScores, date))
    }
    return finalize(date, items)
  }

  const ranked = rankWeakness(sectionScores)

  // Rule 2 — weakest section needs a lesson.
  const weakest = ranked[0]
  let weakestLessonEmitted = false
  if (weakest && items.length < MAX_ITEMS && needsLesson(weakest)) {
    const hint = firstUnreadEntry?.[weakest.section]
    // `null` hint means the user has already read every entry in
    // this section's framework — skip the lesson rather than nag.
    // `undefined` means no hint resolved → emit a generic lesson item.
    if (hint !== null) {
      items.push(lessonItem(weakest, hint, date))
      weakestLessonEmitted = true
    }
  }

  // Rule 2b — the weakest section gets its OWN (trap-specific) drill when it
  // did NOT get a lesson. Before this, Rule 3 only ever drilled the
  // second-weakest, so the weakest section in the 1.4–1.8 dead zone — or one
  // whose lesson was skipped because every entry is read — received no
  // targeted work at all (it fell through to the mastery fallback). Gated on
  // `!weakestLessonEmitted` so the weakest is never double-prescribed a
  // lesson AND a drill, and placed before Rule 3 so the 3-item cap drops the
  // lower-value second-weakest drill rather than the weakest's.
  if (weakest && !weakestLessonEmitted && items.length < MAX_ITEMS && needsDrill(weakest)) {
    const trap = pickTrapForSection(signals.topTraps, weakest.section)
    items.push(trap ? trapDrillItem(trap, weakest, date) : drillItem(weakest, date, true))
  }

  // Rule 3 — next-weakest section needs a drill. When a top-trap
  // exists in that section, prescribe a trap-specific drill instead
  // of a generic 10-question section drill — concrete, targeted, and
  // threaded with the TopTrapsCard on Home. Falls back to a section
  // drill when no trap fits.
  const secondWeakest = ranked[1]
  if (secondWeakest && items.length < MAX_ITEMS && needsDrill(secondWeakest)) {
    const trap = pickTrapForSection(signals.topTraps, secondWeakest.section)
    if (trap) {
      items.push(trapDrillItem(trap, secondWeakest, date))
    } else {
      items.push(drillItem(secondWeakest, date))
    }
  }

  // Rule 4 — mastery maintenance fallback.
  if (items.length === 0) {
    items.push(masteryMaintenanceItem(sectionScores, date))
  }

  // Adaptive-review hot-trap boost (task #16). A light priority nudge:
  // when the user has an active hot trap, its trap-drill item sorts
  // FIRST so the plan leads with the pattern they keep falling for.
  // Applied last so it reorders the assembled plan without disturbing
  // which items got selected (the cap already ran). NOT applied on the
  // mock-anchor / cold-start early returns — those own their anchor.
  applyHotTrapBoost(items, signals.hotTrap)

  return finalize(date, items)
}

/** Move the hot trap's own drill item to position 0, in place. A trap
 *  drill item carries `framework: <id>` (see `trapDrillItem`); when one
 *  matches the hot trap we already prescribed it via the trap-aware rules,
 *  so this is a pure reorder — no new item, no duplication. No-op when no
 *  hot trap, or when none of the assembled items targets it. */
function applyHotTrapBoost(items: PlanItem[], hotTrap: SchedulerSignals['hotTrap']): void {
  if (!hotTrap) return
  const idx = items.findIndex((i) => i.framework === hotTrap.framework_id)
  if (idx <= 0) return // already first, or absent
  const [item] = items.splice(idx, 1)
  items.unshift(item)
}

function needsLesson(score: SectionScore): boolean {
  if (score.score == null) return false
  return score.score < LESSON_SCORE_THRESHOLD || score.daysSinceLastAttempt > LESSON_STALE_DAYS
}

function needsDrill(score: SectionScore): boolean {
  if (score.score == null) return false
  if (score.score < DRILL_SCORE_THRESHOLD) {
    // Mastery-endgame monotony guard: a section just below the 1.8 floor
    // that was JUST practiced AND is trending up doesn't need the
    // byte-identical re-drill every day — the user is already actively
    // closing the gap. Requires all three signals (fresh + improving +
    // below-floor) so this never suppresses a stale or declining section.
    const isFresh = score.daysSinceLastAttempt <= DRILL_FRESH_DAYS
    const isImproving = score.trend != null && score.trend >= DRILL_IMPROVING_TREND
    if (isFresh && isImproving) return false
    return true
  }
  if (score.trend != null && score.trend < DRILL_TREND_THRESHOLD) return true
  if (score.daysSinceLastAttempt > DRILL_STALE_DAYS) return true
  return false
}

function finalize(date: string, items: PlanItem[]): DailyPlan {
  const estimatedMinutes = items
    .filter((i) => !i.completed)
    .reduce((sum, i) => sum + i.estimatedMinutes, 0)
  return { version: PLAN_SCHEMA_VERSION, date, items, estimatedMinutes }
}

const MOCK_HALF_LABEL: Record<MockHalf, string> = {
  verbal: 'Verbal',
  kvant: 'Kvantitativ',
}

function mockItem(prescription: MockPrescription, date: string): PlanItem {
  const rationale =
    prescription.daysSinceLast == null
      ? 'Dags för ditt första provpass — vi behöver en baslinje.'
      : `${prescription.daysSinceLast} dagar sedan senaste — dags att mäta.`
  return {
    id: `mock-${prescription.half}-${date}`,
    kind: 'mock',
    section: null,
    headline: `Provpass · ${MOCK_HALF_LABEL[prescription.half]}`,
    rationale,
    estimatedMinutes: MOCK_MINUTES,
    href: `/prov?half=${prescription.half}&prescribed=1`,
    completed: false,
  }
}

/** The presentation triple (headline / rationale / estimatedMinutes) a
 *  repetition item shows. Extracted so the copy lives in ONE place:
 *  `repetitionItem` snapshots it at plan-generation time, and the Home
 *  render layer (DailyPlanCard) recomputes it from the LIVE counts to
 *  override a cached plan's stale strings — the repetition row's COUNT is
 *  live data, not a prescription decision.
 *
 *  `dueCount` is the DUE (ripe-now) count — what /repetition actually
 *  plays. `pileTotal` (optional) is today's whole "att repetera" pile —
 *  the context total M in "N av M missar"; it defaults to `dueCount` when
 *  the caller has no separate pile signal. Caller handles the dueCount === 0
 *  case (nothing to play). Plain Swedish only — no "mogna/mogen" (owner
 *  2026-07-13: the target user did not understand that vocabulary). */
export type RepetitionCopy = {
  headline: string
  rationale: string
  estimatedMinutes: number
}

export function repetitionCopy(dueCount: number, pileTotal?: number): RepetitionCopy {
  // `playable` is what /repetition plays this session (capped so the
  // prescription and the execution agree). `total` is today's whole pile —
  // surfaced as "N av M" only when it genuinely exceeds the playable slice,
  // so the user knows there's more behind today's session.
  const playable = Math.min(dueCount, REPETITION_SESSION_SIZE)
  const total = Math.max(pileTotal ?? dueCount, dueCount)
  const headline =
    total > playable
      ? `Repetition · ${playable} av ${total} missar`
      : `Repetition · ${playable} ${playable === 1 ? 'miss' : 'missar'}`
  const rationale =
    total > playable
      ? `${playable} av ${total} missar — de äldsta först, de förlorar effekt om de väntar för länge.`
      : dueCount === 1
        ? '1 miss är redo att repeteras nu — gör den först, den förlorar effekt om den väntar för länge.'
        : `${dueCount} missar är redo att repeteras nu — de äldsta först, de förlorar effekt om de väntar för länge.`
  return {
    headline,
    rationale,
    estimatedMinutes: Math.max(1, Math.ceil(playable * MINUTES_PER_REP)),
  }
}

function repetitionItem(count: number, date: string): PlanItem {
  const copy = repetitionCopy(count)
  return {
    id: `rep-${date}`,
    kind: 'repetition',
    section: null,
    headline: copy.headline,
    rationale: copy.rationale,
    estimatedMinutes: copy.estimatedMinutes,
    href: '/repetition',
    completed: false,
  }
}

function lessonItem(score: SectionScore, hint: FrameworkHint | undefined, date: string): PlanItem {
  // Trap-catalog headwords are full sentences (the `pattern_description`
  // field IS the canonical name; there's no short label). Truncate so
  // the plan-card row stays one or two lines on phone.
  const headword = hint?.headword ? truncateHeadword(hint.headword, 48) : null
  const headline = headword ? `${score.section}-lektion · ${headword}` : `${score.section}-lektion`
  return {
    id: `lesson-${score.section}-${date}`,
    kind: 'lesson',
    section: score.section,
    framework: hint?.id,
    headline,
    rationale: lessonRationale(score),
    estimatedMinutes: 5,
    // When the item names a specific trap, land ON it — LessonReader
    // opens + scrolls #hash anchors (the R1 deep-link). A bare section
    // href would drop the user at the top of a 25–55-entry catalog.
    href: hint?.id
      ? `/lektion?section=${score.section}#${hint.id}`
      : `/lektion?section=${score.section}`,
    completed: false,
  }
}

function truncateHeadword(s: string, max: number): string {
  if (s.length <= max) return s
  // Cut on a word boundary near the limit so we don't slice mid-word.
  const slice = s.slice(0, max - 1)
  const lastSpace = slice.lastIndexOf(' ')
  const trimmed = lastSpace > max - 16 ? slice.slice(0, lastSpace) : slice
  return `${trimmed.replace(/[ ,.;:—–-]+$/, '')}…`
}

function lessonRationale(score: SectionScore): string {
  if (score.score != null && score.score < LESSON_SCORE_THRESHOLD) {
    return `Svagaste sektionen — ${score.score.toFixed(1)}, börja med lektionen.`
  }
  if (score.daysSinceLastAttempt > LESSON_STALE_DAYS) {
    const days = Number.isFinite(score.daysSinceLastAttempt)
      ? Math.round(score.daysSinceLastAttempt)
      : 0
    return `Ingen aktivitet på ${days} dagar — friska upp grunderna.`
  }
  return 'Värt att börja med lektionen.'
}

function drillItem(score: SectionScore, date: string, weakest = false): PlanItem {
  return {
    id: `drill-${score.section}-${date}`,
    kind: 'drill',
    section: score.section,
    headline: `${score.section}-drill · 10 frågor`,
    rationale: drillRationale(score, weakest),
    estimatedMinutes: SECTION_DURATIONS[score.section],
    href: `/drill?section=${score.section}`,
    completed: false,
  }
}

/** Trap-specific drill — when a top-trap exists in the section that
 *  would otherwise get a generic drill, prescribe practice on that
 *  exact pattern instead. The drill route's `?framework=X` deep-link
 *  plays the framework entry's authored example_questions.
 *
 *  Estimated minutes is ~half a normal drill — example_questions are
 *  typically 5 entries, and the user has already seen these patterns.
 */
function trapDrillItem(
  trap: NonNullable<SchedulerSignals['topTraps']>[number],
  score: SectionScore,
  date: string,
): PlanItem {
  // Prefer the trap's editorial name when present; fall back to the
  // bare framework_id so something concrete still shows.
  const name = trap.headline?.trim() || trap.framework_id
  return {
    id: `drill-trap-${trap.framework_id}-${date}`,
    kind: 'drill',
    section: score.section,
    framework: trap.framework_id,
    headline: `${trap.framework_id} · ${EXAMPLE_QUESTIONS_PER_TRAP} frågor`,
    // Coaching line — names the pattern, cites the recent miss count,
    // ties to the "fokuserad drill" intention.
    rationale: `${name} — ${trap.count} missar senaste veckan. Fokuserad drill.`,
    estimatedMinutes: Math.max(3, Math.round(SECTION_DURATIONS[score.section] / 2)),
    href: `/drill?framework=${trap.framework_id}`,
    completed: false,
  }
}

/** Typical example_questions count per framework entry. Used for the
 *  trap-drill headline copy; the actual drill picks whatever the
 *  framework has authored. */
const EXAMPLE_QUESTIONS_PER_TRAP = 5

/** Pick the first top-trap that belongs to the given section. Returns
 *  null when no trap matches — caller falls back to a section drill. */
function pickTrapForSection(
  topTraps: SchedulerSignals['topTraps'],
  section: Section,
): NonNullable<SchedulerSignals['topTraps']>[number] | null {
  if (!topTraps || topTraps.length === 0) return null
  for (const trap of topTraps) {
    if (trap.section === section) return trap
  }
  return null
}

function drillRationale(score: SectionScore, weakest = false): string {
  if (score.trend != null && score.trend < DRILL_TREND_THRESHOLD) {
    return `${score.section}-resultat har trendat nedåt senaste veckan.`
  }
  if (score.score != null && score.score < DRILL_SCORE_THRESHOLD) {
    const rank = weakest ? 'Svagast' : 'Näst svagast'
    // Full precision, not toFixed(1) — 1.79 rounded to "1.8" reads as
    // indistinguishable from the 1.8 top-percentile threshold right next
    // to it, which misleads exactly the careful 2.0-seeker this rationale
    // is coaching.
    return `${rank} — ${score.score.toFixed(2)}, övning skärper formen.`
  }
  if (score.daysSinceLastAttempt > DRILL_STALE_DAYS) {
    const days = Number.isFinite(score.daysSinceLastAttempt)
      ? Math.round(score.daysSinceLastAttempt)
      : 0
    return `Inte rört på ${days} dagar — håll formen.`
  }
  return 'Värt en pass för att hålla formen.'
}

function warmupItem(scores: SectionScore[], date: string): PlanItem {
  // Strongest scored section. Filter out nulls first.
  const scored = scores.filter((s): s is SectionScore & { score: number } => s.score != null)
  const strongest = scored.reduce((best, s) => (s.score > best.score ? s : best), scored[0])
  return {
    id: `warmup-${strongest.section}-${date}`,
    kind: 'drill',
    section: strongest.section,
    headline: `${strongest.section}-drill · uppvärmning`,
    rationale: 'Du har varit borta ett tag — börja med din starkaste sektion.',
    estimatedMinutes: SECTION_DURATIONS[strongest.section],
    href: `/drill?section=${strongest.section}`,
    completed: false,
  }
}

function masteryMaintenanceItem(scores: SectionScore[], date: string): PlanItem {
  // Route the maintenance drill to the least-recently-attempted scored section
  // (highest `daysSinceLastAttempt`). This gives the item a real per-section
  // completion path (the `attemptsSnapshot` drill signal) instead of the loose
  // section=null total-diff fallback, fixes the "Blandad övning · alla
  // sektioner" → `?mixed=1`/bare-/drill routing lie, and powers SF2's
  // least-recently-touched rotation. Falls back to the interleaved mixed drill
  // only when no section has a score (degenerate — cold-start normally guards
  // this path).
  const coldest = pickColdestSection(scores)
  if (coldest) {
    return {
      id: `mastery-${date}`,
      kind: 'drill',
      section: coldest.section,
      headline: `Blandad övning · börja med ${coldest.section}`,
      rationale: 'Du är ifatt — sikta mot 2.0. Börja med sektionen du rört minst.',
      estimatedMinutes: SECTION_DURATIONS[coldest.section],
      href: `/drill?section=${coldest.section}`,
      completed: false,
    }
  }
  return {
    id: `mastery-${date}`,
    kind: 'drill',
    section: null,
    headline: 'Blandad övning · alla sektioner',
    rationale: 'Du är ifatt — sikta mot 2.0 med blandad övning.',
    estimatedMinutes: 10,
    // `?mixed=1` plays a genuinely interleaved drill across all 8 sections.
    // Bare `/drill` defaults to ORD-only, which would betray "alla sektioner".
    href: '/drill?mixed=1',
    completed: false,
  }
}

/** Pick the scored section with the largest `daysSinceLastAttempt` (the
 *  least-recently-attempted). Ties keep array order. Returns null when no
 *  section has a non-null score. */
function pickColdestSection(scores: SectionScore[]): SectionScore | null {
  let coldest: SectionScore | null = null
  for (const s of scores) {
    if (s.score == null) continue
    if (coldest === null || s.daysSinceLastAttempt > coldest.daysSinceLastAttempt) {
      coldest = s
    }
  }
  return coldest
}

function coldStartItem(date: string): PlanItem {
  // /diagnostik is the B4 onboarding flow — 10 questions across all
  // sections, seeds the score model so the next plan generation has
  // real signal.
  return {
    id: `cold-${date}`,
    kind: 'drill',
    section: null,
    headline: 'Diagnos · några frågor',
    rationale: 'Vi behöver några frågor först för att veta var du står.',
    estimatedMinutes: 12,
    href: '/diagnostik',
    completed: false,
  }
}

// ---------------------------------------------------------------------------
// Mastery check used by Home + tests to detect "all sections >1.8" without
// digging through the SectionScore list at every call site.
// ---------------------------------------------------------------------------

export function isAllMastered(scores: SectionScore[]): boolean {
  const scored = scores.filter((s) => s.score != null)
  if (scored.length === 0) return false
  return scored.every((s) => (s.score ?? 0) >= MASTERY_FLOOR)
}

// ---------------------------------------------------------------------------
// Storage helpers — localStorage v1. Promoted to D1 in a follow-up if
// multi-device divergence becomes a real friction point.
// ---------------------------------------------------------------------------

const PLAN_PREFIX = 'hpc-daily-plan-'
const LESSON_READ_PREFIX = 'hpc-lesson-read-'
const PLAN_RETENTION_DAYS = 30

/** Read today's plan from localStorage, or null when missing / corrupt. */
export function loadPlan(date: string, storage: Storage = localStorage): DailyPlan | null {
  const raw = storage.getItem(`${PLAN_PREFIX}${date}`)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DailyPlan
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.date !== date ||
      !Array.isArray(parsed.items)
    ) {
      return null
    }
    // Schema-version mismatch → treat as cache miss. Stale plans
    // would otherwise stick around with hrefs that no longer route
    // correctly (e.g. `/lektion/NOG` before the query-param fix).
    if (parsed.version !== PLAN_SCHEMA_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

/** Persist a plan and prune any plan keys older than 30 days. */
export function savePlan(plan: DailyPlan, storage: Storage = localStorage): void {
  storage.setItem(`${PLAN_PREFIX}${plan.date}`, JSON.stringify(plan))
  pruneOldPlans(plan.date, storage)
}

function pruneOldPlans(currentDate: string, storage: Storage): void {
  const cutoff = new Date(currentDate)
  cutoff.setDate(cutoff.getDate() - PLAN_RETENTION_DAYS)
  const cutoffStr = localDateString(cutoff)
  // Collect first, then delete — Storage iteration shifts indices on remove.
  const toDelete: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key?.startsWith(PLAN_PREFIX)) continue
    const date = key.slice(PLAN_PREFIX.length)
    if (date < cutoffStr) toDelete.push(key)
  }
  for (const key of toDelete) storage.removeItem(key)
}

/** Set of framework entry ids the user has marked as read. Lazily
 *  scanned from localStorage — no in-memory cache because the set is
 *  small (one flag per entry, ~150 entries across all 8 sections at
 *  most) and the scheduler only reads it once per Home mount. */
export function loadLessonReads(storage: Storage = localStorage): Set<string> {
  const out = new Set<string>()
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key?.startsWith(LESSON_READ_PREFIX)) continue
    out.add(key.slice(LESSON_READ_PREFIX.length))
  }
  return out
}

export function markLessonRead(entryId: string, storage: Storage = localStorage): void {
  storage.setItem(`${LESSON_READ_PREFIX}${entryId}`, '1')
}

/** Remove the localStorage read flag for one entry. Paired with the
 *  server DELETE in the write-through cache (useLessonReads). */
export function unmarkLessonRead(entryId: string, storage: Storage = localStorage): void {
  storage.removeItem(`${LESSON_READ_PREFIX}${entryId}`)
}

/** Test-only: wipe both plan and lesson-read keys. */
export function __resetSchedulerStorage(storage: Storage = localStorage): void {
  const toDelete: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key) continue
    if (key.startsWith(PLAN_PREFIX) || key.startsWith(LESSON_READ_PREFIX)) {
      toDelete.push(key)
    }
  }
  for (const key of toDelete) storage.removeItem(key)
}
