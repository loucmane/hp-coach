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
import { rankWeakness, type SectionScore } from '@/lib/scoring'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'

export type PlanItemKind = 'lesson' | 'drill' | 'repetition'

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

/** Schema version for the stored DailyPlan. Bump when item shape or
 *  href format changes — `loadPlan` returns null on mismatch, forcing
 *  the hook to regenerate. Prevents users from being stuck with a
 *  yesterday-shaped plan whose hrefs point to routes that have since
 *  moved (e.g. `/lektion/NOG` before #47, now `/lektion?section=NOG`). */
export const PLAN_SCHEMA_VERSION = 2

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
}

const LESSON_SCORE_THRESHOLD = 1.4
const LESSON_STALE_DAYS = 7
const DRILL_SCORE_THRESHOLD = 1.8
const DRILL_TREND_THRESHOLD = -0.05
const DRILL_STALE_DAYS = 14
const LONG_BREAK_DAYS = 14
const MASTERY_FLOOR = 1.8
const MAX_ITEMS = 3

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
  if (weakest && items.length < MAX_ITEMS && needsLesson(weakest)) {
    const hint = firstUnreadEntry?.[weakest.section]
    // `null` hint means the user has already read every entry in
    // this section's framework — skip the lesson rather than nag.
    // `undefined` means no hint resolved → emit a generic lesson item.
    if (hint !== null) {
      items.push(lessonItem(weakest, hint, date))
    }
  }

  // Rule 3 — next-weakest section needs a drill.
  const secondWeakest = ranked[1]
  if (secondWeakest && items.length < MAX_ITEMS && needsDrill(secondWeakest)) {
    items.push(drillItem(secondWeakest, date))
  }

  // Rule 4 — mastery maintenance fallback.
  if (items.length === 0) {
    items.push(masteryMaintenanceItem(date))
  }

  return finalize(date, items)
}

function needsLesson(score: SectionScore): boolean {
  if (score.score == null) return false
  return score.score < LESSON_SCORE_THRESHOLD || score.daysSinceLastAttempt > LESSON_STALE_DAYS
}

function needsDrill(score: SectionScore): boolean {
  if (score.score == null) return false
  if (score.score < DRILL_SCORE_THRESHOLD) return true
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

function repetitionItem(count: number, date: string): PlanItem {
  const noun = count === 1 ? 'miss' : 'missar'
  const rationale =
    count === 1
      ? '1 miss väntar på repetition — gör den först, den förlorar effekt om den väntar för länge.'
      : `${count} missar väntar på repetition — gör dem först, de förlorar effekt om de väntar för länge.`
  return {
    id: `rep-${date}`,
    kind: 'repetition',
    section: null,
    headline: `Repetition · ${count} ${noun}`,
    rationale,
    estimatedMinutes: Math.max(1, count),
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
    href: `/lektion?section=${score.section}`,
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
    return `Svagast section — ${score.score.toFixed(1)}, börja med lektionen.`
  }
  if (score.daysSinceLastAttempt > LESSON_STALE_DAYS) {
    const days = Number.isFinite(score.daysSinceLastAttempt)
      ? Math.round(score.daysSinceLastAttempt)
      : 0
    return `Ingen aktivitet på ${days} dagar — friska upp grunderna.`
  }
  return 'Värt att börja med lektionen.'
}

function drillItem(score: SectionScore, date: string): PlanItem {
  return {
    id: `drill-${score.section}-${date}`,
    kind: 'drill',
    section: score.section,
    headline: `${score.section}-drill · 10 frågor`,
    rationale: drillRationale(score),
    estimatedMinutes: SECTION_DURATIONS[score.section],
    href: `/drill?section=${score.section}`,
    completed: false,
  }
}

function drillRationale(score: SectionScore): string {
  if (score.trend != null && score.trend < DRILL_TREND_THRESHOLD) {
    return `${score.section}-resultat har trendat nedåt senaste veckan.`
  }
  if (score.score != null && score.score < DRILL_SCORE_THRESHOLD) {
    return `Näst svagast — ${score.score.toFixed(1)}, övning skärper formen.`
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

function masteryMaintenanceItem(date: string): PlanItem {
  return {
    id: `mastery-${date}`,
    kind: 'drill',
    section: null,
    headline: 'Blandad övning · alla sektioner',
    rationale: 'Du är ifatt — sikta mot 2.0 med blandad övning.',
    estimatedMinutes: 10,
    href: '/drill',
    completed: false,
  }
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

/** Flip a plan item's `completed` flag and write back. No-op when the
 *  date or item isn't found. Returns the updated plan (or null). */
export function markItemComplete(
  date: string,
  itemId: string,
  storage: Storage = localStorage,
): DailyPlan | null {
  const plan = loadPlan(date, storage)
  if (!plan) return null
  const next: DailyPlan = {
    ...plan,
    items: plan.items.map((i) => (i.id === itemId ? { ...i, completed: true } : i)),
  }
  next.estimatedMinutes = next.items
    .filter((i) => !i.completed)
    .reduce((sum, i) => sum + i.estimatedMinutes, 0)
  savePlan(next, storage)
  return next
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
