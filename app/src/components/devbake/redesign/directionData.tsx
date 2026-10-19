// The redesign kit's data context (kit v2, bead hpf-qr0p.7; docs/redesign/kit-v2.md).
//
// A direction's screens read what they show and ask for what they do here,
// not from the fixture files:
//
//   const { data, actions } = useDirectionData()
//
// The bake-off wraps its stage in a DirectionDataProvider fed by the
// fixtures (useBakeoffDirectionData maps every action onto its switcher,
// and prefs.mode is always the switcher's theme: useSessionPrefs).
// Outside a provider useDirectionData returns the same fixture data with
// actions that do nothing, so a direction's own tests can mount it bare.
// The real app will mount the provider with data from its hooks: the
// builders below already take the hooks' own shapes (Stats, Mistake[],
// SessionHistoryRow[], MockResultRow[], Question) and derive every screen
// with the app's own functions (scoring, normering, examNames, …).

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Mistake } from '@/api/hooks/useMistakes'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import type { Stats } from '@/api/hooks/useStats'
import {
  type DrillController,
  type DrillResult,
  LOCAL_CONTROLLER,
  parsePassage,
} from '@/components/devbake/redesign/drillCore'
import {
  ESTIMATE_CAVEAT,
  EXAM,
  EXPLANATIONS,
  OVNINGSTEXT_BADGE,
  OVNINGSTEXT_NOTE,
  PLAN,
  PROGNOSIS,
  RESUME,
  SESSION,
  TODAY,
  TRAPS,
  UNIT,
  WEEK,
} from '@/components/devbake/redesign/r1Fixtures'
import type { AppScreenKey, Destination, ThemeKey } from '@/components/devbake/redesign/r1Kit'
import {
  DTK_PAGES,
  DTK_QID,
  ELF_EXPLANATIONS,
  ELF_UNIT,
  FRAMEWORK_INDEX,
  FRAMEWORK_PROGRESS,
  HISTORY,
  IDENTITY,
  LESSON_READS,
  MOCK_PRESCRIPTION,
  MOCK_RESULTS,
  NORMERING,
  NOW_ISO,
  OPEN_LESSON,
  PASS_EXPOSURE,
  PASS_QUESTIONS,
  PASS_RESULT,
  PASS_SIZES,
  PILE,
  PILE_PROMPTS,
  PREFS,
  QUANT_EXPLANATIONS,
  QUANT_QUESTIONS,
  RUNNING_PASS,
  STATS,
} from '@/components/devbake/redesign/r2Fixtures'
import type {
  DirectionActions,
  DirectionData,
  DrillFigure,
  DrillQuestion,
  DrillRequest,
  DrillSessionView,
  FrameworkStatus,
  Half,
  HistoryRowView,
  HomeView,
  KontoView,
  OvaView,
  PlanItemKind,
  PrefsView,
  PrognosisView,
  ProvHalfView,
  ProvPassOptionView,
  ProvpassView,
  ProvResultSummaryView,
  ProvResultView,
  RepeteraView,
  SectionScoreView,
  TrapView,
  UppslagView,
} from '@/components/devbake/redesign/viewModel'
import type { Explanation } from '@/data/explanations'
import { type AnswerLetter, type Question, SECTION_KEYS, type Section } from '@/data/questions'
import { DEFAULT_DRILL_LENGTH } from '@/lib/drill'
import { countsBySection, sectionOfQid } from '@/lib/dueBySection'
import { formatPass, formatSitting } from '@/lib/examNames'
import { LEGAL_LINKS } from '@/lib/legal'
import { type NormeringSitting, normedScore } from '@/lib/normering'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import type { MockPrescription } from '@/lib/scheduler'
import {
  computeProjected,
  computeProjectedDelta,
  computeSectionScore,
  formatSwedishDateShort,
  minutesPracticedToday,
  projectionBasis,
  rankWeakness,
  type SectionScore,
  scoreBand,
  scoreFromFraction,
  VERBAL_SECTIONS,
  weeklyScore,
} from '@/lib/scoring'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { DENSITIES, FONTS, PALETTES } from '@/lib/tokens'
import { COACH_BLURBS, COACH_LABELS, type CoachKey } from '@/lib/voice'

// ── Shared pieces ────────────────────────────────────────────────────

/** U+E000, the bank's math-open marker (built from its code so no editor
 *  can strip a private-use character from this file). */
const MATH_OPEN = String.fromCharCode(0xe000)
const DAY_MS = 86_400_000
const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

/** A pass is 55 minutes and 40 questions in either half (lib/mock). */
export const PASS_MINUTES = 55
const PASS_QUESTIONS_N = 40
/** Each half's sections and their share of a pass (lib/mock's quotas). */
export const HALF_SECTIONS: Record<Half, { section: Section; count: number }[]> = {
  verbal: [
    { section: 'ORD', count: 10 },
    { section: 'LÄS', count: 10 },
    { section: 'MEK', count: 10 },
    { section: 'ELF', count: 10 },
  ],
  kvant: [
    { section: 'XYZ', count: 12 },
    { section: 'KVA', count: 10 },
    { section: 'NOG', count: 6 },
    { section: 'DTK', count: 12 },
  ],
}
/** The rules read out before a pass (components/mock/ConfirmSheet). */
export const PROV_RULES = [
  'ingen paus',
  'du kan ändra svar tills tiden går ut',
  'avbryter du blir provet ogiltigt',
  'lämna ingen fråga obesvarad — fel ger inga avdrag',
]

function halfOf(section: Section): Half {
  return VERBAL_SECTIONS.includes(section) ? 'verbal' : 'kvant'
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Whole local days from `then` to `now` (0 = the same day). */
function daysBetween(then: Date, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS)
}

/** "Idag", "Igår", a weekday within the week, else "12 maj". */
export function whenLabel(iso: string | number, now: Date): string {
  const then = new Date(iso)
  const days = daysBetween(then, now)
  if (days === 0) return 'Idag'
  if (days === 1) return 'Igår'
  if (days > 1 && days < 7) return WEEKDAYS[then.getDay()]
  return formatSwedishDateShort(then)
}

function isDue(m: Mistake, now: Date): boolean {
  return m.nextReviewAt == null || new Date(m.nextReviewAt).getTime() <= now.getTime()
}

/** framework id → headword, for every catalog entry. */
function frameworkNames(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const cat of FRAMEWORK_INDEX) for (const e of cat.entries) out[e.id] = e.headword
  return out
}

// ── Drill questions ──────────────────────────────────────────────────

function hasMath(text: string | null | undefined): boolean {
  return text?.includes(MATH_OPEN) ?? false
}

function figureOf(q: Question, pages: Record<string, { width: number; height: number }>) {
  if (!q.figure) return null
  const page = pages[q.qid]
  const kind = q.figure.kind ?? 'svg'
  const figure: DrillFigure = {
    src: q.figure.src,
    alt: kind === 'raster' ? `Underlag till uppgift ${q.number}` : `Figur till uppgift ${q.number}`,
    // The bank keeps a ratio; a DTK page's index has its pixels.
    width: page?.width ?? Math.round(1000 * q.figure.aspect_ratio),
    height: page?.height ?? 1000,
    kind,
  }
  return figure
}

/** A bank question as the drill core takes it. */
export function drillQuestion(
  q: Question,
  pages: Record<string, { width: number; height: number }> = {},
): DrillQuestion {
  const authentic = !q.exam_id.startsWith('p5-')
  const options =
    q.options?.map((o) => ({
      letter: o.letter,
      text: o.text,
      figure: o.figure
        ? {
            src: o.figure.src,
            alt: o.text,
            width: Math.round(1000 * o.figure.aspect_ratio),
            height: 1000,
          }
        : null,
    })) ?? null
  return {
    qid: q.qid,
    section: q.section,
    number: q.number,
    prompt: q.prompt,
    options,
    answer: q.answer,
    passage: q.context
      ? {
          ...parsePassage(q.context),
          lang: q.section === 'ELF' ? 'en' : 'sv',
          synthetic: !authentic,
        }
      : null,
    figure: figureOf(q, pages),
    math: hasMath(q.prompt) || (q.options ?? []).some((o) => hasMath(o.text)),
    source: {
      examId: q.exam_id,
      provpass: q.provpass,
      authentic,
      label: authentic ? `${formatSitting(q.exam_id)} · ${formatPass(q.provpass)}` : q.exam_id,
    },
  }
}

/** A P5 unit's questions, its passage parsed once. */
function unitQuestions(unit: {
  unitId: string
  revision: number
  section: Section
  title: string
  context: string
  questions: {
    qid: string
    number: number
    prompt: string
    options: Question['options']
    answer: AnswerLetter
  }[]
}): DrillQuestion[] {
  const passage = {
    ...parsePassage(unit.context),
    title: unit.title,
    lang: unit.section === 'ELF' ? ('en' as const) : ('sv' as const),
    synthetic: true,
    unitId: unit.unitId,
  }
  return unit.questions.map((q) => ({
    qid: q.qid,
    section: unit.section,
    number: q.number,
    prompt: q.prompt,
    options: q.options?.map(({ letter, text }) => ({ letter, text })) ?? null,
    answer: q.answer,
    passage,
    figure: null,
    math: false,
    source: {
      examId: `p5-${unit.unitId}-r${unit.revision}`,
      provpass: null,
      authentic: false,
      label: unit.title,
    },
  }))
}

function earlier(): DrillResult[] {
  return SESSION.earlier.map(({ qid, pick }) => {
    const q = UNIT.questions.find((x) => x.qid === qid)
    return { qid, pick, correct: q?.answer === pick }
  })
}

function pick(all: Record<string, Explanation>, qids: string[]): Record<string, Explanation> {
  return Object.fromEntries(qids.map((qid) => [qid, all[qid]]))
}

/** The four drill sittings: LÄS (2–3), Kvantfråga (6), DTK (7), ELF (14). */
export function fixtureDrills(): DirectionData['drills'] {
  const dtk = PASS_QUESTIONS.find((q) => q.qid === DTK_QID) as Question
  const reading: DrillSessionView = {
    id: 'reading',
    request: { kind: 'section', section: 'LÄS' },
    title: 'LÄS-övning',
    questions: unitQuestions(UNIT),
    explanations: EXPLANATIONS,
    start: { index: SESSION.startIndex, results: earlier() },
    elapsedSeconds: SESSION.elapsedSeconds,
    wrongPick: SESSION.wrongPick,
  }
  return {
    reading,
    quant: {
      id: 'quant',
      request: { kind: 'mixed' },
      title: 'Kvantitativ övning',
      questions: QUANT_QUESTIONS.map((q) => drillQuestion(q)),
      explanations: pick(
        QUANT_EXPLANATIONS,
        QUANT_QUESTIONS.map((q) => q.qid),
      ),
      start: { index: 0, results: [] },
    },
    dtk: {
      id: 'dtk',
      request: { kind: 'section', section: 'DTK' },
      title: 'DTK-övning',
      questions: [drillQuestion(dtk, DTK_PAGES)],
      explanations: pick(QUANT_EXPLANATIONS, [DTK_QID]),
      start: { index: 0, results: [] },
    },
    elf: {
      id: 'elf',
      request: { kind: 'section', section: 'ELF' },
      title: 'ELF-övning',
      questions: unitQuestions(ELF_UNIT),
      explanations: ELF_EXPLANATIONS,
      start: { index: 0, results: [] },
    },
  }
}

// ── Scores, Home and Framsteg ────────────────────────────────────────

export function sectionScores(stats: Stats, now: Date): SectionScore[] {
  return SECTION_KEYS.map((s) => computeSectionScore(s, stats.bySection[s], now))
}

function sectionScoreView(score: SectionScore): SectionScoreView {
  return {
    section: score.section,
    name: sectionLongLabel(score.section),
    half: halfOf(score.section),
    score: score.score,
    band: scoreBand(score.score, score.attempts90d),
    trend: score.trend,
    confidence: score.confidence,
    attempts90d: score.attempts90d,
    daysSince: Number.isFinite(score.daysSinceLastAttempt) ? score.daysSinceLastAttempt : null,
  }
}

/** The projection, its week-over-week delta and the weekly series, with
 *  the caveat while practice texts feed it. `extras` are the fields with
 *  no real source (a range, a target). */
export function prognosisView(
  stats: Stats,
  now: Date,
  extras: Pick<PrognosisView, 'low' | 'high' | 'target'> = {},
): PrognosisView {
  const projected = computeProjected(sectionScores(stats, now))
  const weeks = stats.weekly.map(weeklyScore).filter((s): s is number => s != null)
  return {
    total: projected.total,
    verbal: projected.verbal,
    quant: projected.quant,
    delta: computeProjectedDelta(stats.bySection),
    weeks: weeks.slice(-7),
    caveat: projectionBasis(stats.bySection).total.calibrated ? null : ESTIMATE_CAVEAT,
    ...extras,
  }
}

/** Days with answers in the current week, Monday to today. */
export function daysPractisedThisWeek(stats: Stats, now: Date): number {
  const monday = startOfDay(now) - ((now.getDay() + 6) % 7) * DAY_MS
  return (stats.attemptsDaily ?? []).filter((d) => {
    const t = new Date(`${d.date}T12:00:00`).getTime()
    return d.n > 0 && t >= monday && t <= now.getTime() + DAY_MS / 2
  }).length
}

/** The longest run of days with answers. */
export function longestRun(days: { n: number }[]): number {
  let best = 0
  let run = 0
  for (const d of days) {
    run = d.n > 0 ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

function historyLabel(row: SessionHistoryRow): string {
  if (row.kind === 'adaptive_review') return 'Repetition'
  return row.sections ?? 'Övning'
}

function historyRow(row: SessionHistoryRow): HistoryRowView {
  const section = row.sections && (SECTION_KEYS as readonly string[]).includes(row.sections)
  return {
    id: String(row.id),
    kind: row.kind,
    label: historyLabel(row),
    section: section ? (row.sections as Section) : null,
    correct: row.correct,
    total: row.total,
    endedAt: row.endedAt ?? '',
    when: row.endedAt ? formatSwedishDateShort(new Date(row.endedAt)) : '',
  }
}

const PLAN_KIND: Record<string, PlanItemKind> = {
  repetition: 'repetition',
  lektion: 'lesson',
  övning: 'drill',
}

function trapView(t: (typeof TRAPS)[number]): TrapView {
  return {
    frameworkId: t.frameworkId,
    section: t.section as Section,
    name: t.name,
    pattern: t.pattern,
    count: t.count,
    rising: t.rising,
  }
}

function prescriptionView(p: MockPrescription) {
  return {
    due: p.due,
    half: p.half,
    daysSinceLast: p.daysSinceLast,
    daysUntilNext: p.daysUntilNext,
  }
}

/** Idag. Round 1's Home (r1Fixtures) where the real app has no hook-shaped
 *  equivalent in the fixtures (plan, resume, traps), the rest derived from
 *  the reader's state. */
export function fixtureHome(now: Date): HomeView {
  // A lesson item names its framework; the same name can head an entry in
  // two catalogs (LÄS and ELF), so look in the item's section only.
  const frameworkOf = (section: string | null, name: string) =>
    FRAMEWORK_INDEX.find((c) => c.section === section)?.entries.find((e) => e.headword === name)?.id
  return {
    today: { ...TODAY, firstName: null },
    exam: { ...EXAM },
    resume: { ...RESUME },
    plan: {
      minutes: PLAN.minutes,
      allComplete: false,
      items: PLAN.items.map((item) => ({
        id: item.id,
        kind: PLAN_KIND[item.kind],
        section: item.section as Section | null,
        framework: item.kind === 'lektion' ? frameworkOf(item.section, item.detail) : undefined,
        title: item.title,
        detail: item.detail,
        rationale: item.rationale,
        minutes: item.minutes,
        completed: false,
        primary: item.primary,
      })),
    },
    prognosis: prognosisView(STATS, now, {
      low: PROGNOSIS.low,
      high: PROGNOSIS.high,
      target: PROGNOSIS.target,
    }),
    traps: TRAPS.map(trapView),
    recent: HISTORY.slice(0, 3).map((row) => ({
      id: String(row.id),
      label: historyLabel(row),
      correct: row.correct,
      total: row.total,
      when: row.endedAt ? whenLabel(row.endedAt, now) : '',
    })),
    week: {
      minutesToday: minutesPracticedToday(STATS),
      streakDays: STATS.streakDays,
      daysPractised: daysPractisedThisWeek(STATS, now),
      goal: WEEK.goal,
    },
    ovaDue: PILE.length,
    provpass: prescriptionView(MOCK_PRESCRIPTION),
  }
}

export function framstegView(
  stats: Stats,
  history: SessionHistoryRow[],
  now: Date,
  extras: { goal?: number; target?: number } = {},
): DirectionData['framsteg'] {
  const scores = sectionScores(stats, now)
  const days = (stats.attemptsDaily ?? []).map(({ date, n }) => ({ date, n }))
  return {
    prognosis: prognosisView(stats, now, { target: extras.target }),
    sections: scores.map(sectionScoreView),
    focus: rankWeakness(scores)
      .slice(0, 3)
      .map((s) => s.section),
    week: {
      streakDays: stats.streakDays,
      record: longestRun(days),
      attemptsThisWeek: stats.attempts.thisWeek,
      accuracy7d: stats.accuracy7d,
      minutesToday: minutesPracticedToday(stats),
      daysPractised: daysPractisedThisWeek(stats, now),
      goal: extras.goal,
    },
    days,
    weekly: stats.weekly.map((b) => ({
      weekStart: new Date(b.weekStart).toISOString(),
      score: weeklyScore(b),
    })),
    totals: {
      attempts: stats.attempts.total,
      drills: stats.drills.total,
      mistakesActive: stats.mistakes.active,
      mistakesResolved: stats.mistakes.resolved,
    },
    history: history
      .filter((row) => row.kind === 'drill' || row.kind === 'adaptive_review')
      .map(historyRow),
  }
}

// ── Öva and Repetera ─────────────────────────────────────────────────

export function ovaView(stats: Stats, pile: Mistake[], traps: TrapView[], now: Date): OvaView {
  const scores = sectionScores(stats, now)
  const waiting = countsBySection(pile)
  const dueNow = countsBySection(pile.filter((m) => isDue(m, now)))
  return {
    sections: scores.map((s) => ({
      ...sectionScoreView(s),
      waiting: waiting[s.section],
      dueNow: dueNow[s.section],
    })),
    weakest: rankWeakness(scores)[0]?.section ?? null,
    repetera: { dueNow: pile.filter((m) => isDue(m, now)).length, pile: pile.length },
    mixed: { questions: DEFAULT_DRILL_LENGTH },
    weakTraps: traps,
  }
}

function dueLabel(m: Mistake, now: Date): string {
  if (isDue(m, now)) return 'nu'
  const days = daysBetween(now, new Date(m.nextReviewAt as string | number))
  if (days <= 0) return 'senare idag'
  if (days === 1) return 'imorgon'
  return `om ${days} dagar`
}

/** Due first (the server's order), then the rest of today's pile. */
export function repeteraView(
  pile: Mistake[],
  prompts: Record<string, string | null>,
  names: Record<string, string>,
  now: Date,
): RepeteraView {
  const due = pile.filter((m) => isDue(m, now))
  const later = pile.filter((m) => !isDue(m, now))
  return {
    dueNow: due.length,
    pile: pile.length,
    sessionSize: REPETITION_SESSION_SIZE,
    items: [...due, ...later].map((m, i) => {
      const frameworkId = m.layer1Ids?.[0] ?? null
      return {
        n: i + 1,
        mistakeId: m.id,
        qid: m.questionId,
        section: sectionOfQid(m.questionId) ?? 'ORD',
        prompt: prompts[m.questionId] ?? null,
        errors: m.errorCount7d ?? 0,
        dueNow: isDue(m, now),
        dueLabel: dueLabel(m, now),
        frameworkId,
        frameworkName: frameworkId ? names[frameworkId] : undefined,
      }
    }),
  }
}

// ── Provpass ─────────────────────────────────────────────────────────

function passLabels(examId: string | null, provpass: string | null) {
  return {
    sitting: examId ? formatSitting(examId) : null,
    pass: provpass ? formatPass(provpass) : null,
  }
}

function resultScore(row: MockResultRow, normering: Record<string, NormeringSitting>) {
  const sitting = row.mode === 'authentic' && row.examId ? normering[row.examId] : null
  return normedScore(sitting, row.half, row.correct, row.presented)
}

function resultSummary(
  row: MockResultRow,
  normering: Record<string, NormeringSitting>,
  now: Date,
): ProvResultSummaryView {
  return {
    id: String(row.id),
    half: row.half,
    ...passLabels(row.examId, row.provpass),
    mode: row.mode,
    correct: row.correct,
    presented: row.presented,
    score: resultScore(row, normering).score,
    when: row.createdAt != null ? whenLabel(row.createdAt, now) : '',
  }
}

/** A handed-in pass (MockResult's screen). */
export function provResultView(
  row: MockResultRow,
  earlierRows: MockResultRow[],
  normering: Record<string, NormeringSitting>,
  now: Date,
): ProvResultView {
  const score = resultScore(row, normering)
  const quota = Object.fromEntries(HALF_SECTIONS[row.half].map((s) => [s.section, s.count]))
  return {
    id: String(row.id),
    passId: row.examId && row.provpass ? `${row.examId}:${row.provpass}` : null,
    half: row.half,
    ...passLabels(row.examId, row.provpass),
    mode: row.mode,
    presented: row.presented,
    answered: row.answered,
    correct: row.correct,
    score: {
      value: score.score,
      derived: score.derived,
      label: score.derived === 'official-derived' ? 'normerat (härlett)' : 'skattad',
    },
    sections: Object.entries(row.breakdown.perSection).map(([section, s]) => ({
      section: section as Section,
      presented: s.presented,
      correct: s.correct,
      timeSeconds: Math.round(s.timeMs / 1000),
      quotaSeconds: Math.round(
        (PASS_MINUTES * 60 * (quota[section] ?? s.presented)) / PASS_QUESTIONS_N,
      ),
      estimate: s.presented > 0 ? scoreFromFraction(s.correct / s.presented) : null,
    })),
    seenBefore: row.seenBefore,
    durationSeconds: Math.round(row.durationMs / 1000),
    missed: row.breakdown.missedQids,
    trap: null,
    history: earlierRows
      .filter((r) => r.id !== row.id && r.half === row.half && r.mode === row.mode)
      .map((r) => resultSummary(r, normering, now)),
  }
}

function sectionRuns(questions: Question[]) {
  const runs: { section: Section; start: number; end: number }[] = []
  questions.forEach((q, i) => {
    const last = runs[runs.length - 1]
    if (last && last.section === q.section) last.end = i + 1
    else runs.push({ section: q.section, start: i, end: i + 1 })
  })
  return runs
}

/** The running pass's answers so far: right, except where the reader
 *  misses the question in the end. */
function runningAnswers(): Partial<Record<string, AnswerLetter>> {
  const missed = new Set(RUNNING_PASS.missed)
  const out: Partial<Record<string, AnswerLetter>> = {}
  for (const q of PASS_QUESTIONS.slice(0, RUNNING_PASS.answered)) {
    const wrong = q.options?.find((o) => o.letter !== q.answer)?.letter
    out[q.qid] = missed.has(q.qid) && wrong ? wrong : q.answer
  }
  return out
}

export function fixtureProvpass(now: Date): ProvpassView {
  const halves: ProvHalfView[] = (['verbal', 'kvant'] as const).map((half) => ({
    half,
    label: half === 'verbal' ? 'Verbal' : 'Kvantitativ',
    minutes: PASS_MINUTES,
    questions: PASS_QUESTIONS_N,
    sections: HALF_SECTIONS[half],
  }))
  // lib/mock listAuthenticPasses: least exposed first, then most complete.
  const exposureOf = (id: string) => PASS_EXPOSURE[id] ?? { seenBefore: 0, totalExposure: 0 }
  const passes: ProvPassOptionView[] = Object.entries(PASS_SIZES)
    .sort(
      ([a, an], [z, zn]) => exposureOf(a).totalExposure - exposureOf(z).totalExposure || zn - an,
    )
    .map(([id, presented]) => {
      const [examId, provpass] = id.split(':')
      return {
        id,
        examId,
        provpass: provpass as Question['provpass'],
        half: provpass.startsWith('verb') ? 'verbal' : 'kvant',
        sitting: formatSitting(examId),
        pass: formatPass(provpass),
        presented,
        seenBefore: exposureOf(id).seenBefore,
        suggested: false,
      }
    })
  for (const half of ['verbal', 'kvant'] as const) {
    const first = passes.find((p) => p.half === half)
    if (first) first.suggested = true
  }
  const running = PASS_QUESTIONS
  const flags = new Set(RUNNING_PASS.flags)
  const answers = runningAnswers()
  const [examId, provpass] = RUNNING_PASS.passId.split(':')
  return {
    hub: {
      half: MOCK_PRESCRIPTION.half,
      halves,
      passes,
      results: MOCK_RESULTS.map((r) => resultSummary(r, NORMERING, now)),
      exposure: {
        seen: passes.reduce((n, p) => n + p.seenBefore, 0),
        total: passes.reduce((n, p) => n + p.presented, 0),
      },
      prescription: prescriptionView(MOCK_PRESCRIPTION),
      rules: PROV_RULES,
    },
    running: {
      passId: RUNNING_PASS.passId,
      half: 'kvant',
      sitting: formatSitting(examId),
      pass: formatPass(provpass),
      mode: 'authentic',
      durationSeconds: PASS_MINUTES * 60,
      remainingSeconds: RUNNING_PASS.remainingSeconds,
      questions: running.map((q) => drillQuestion(q, DTK_PAGES)),
      grid: running.map((q, i) => ({
        n: i + 1,
        qid: q.qid,
        section: q.section,
        answered: answers[q.qid] != null,
        flagged: flags.has(q.qid),
      })),
      sections: sectionRuns(running),
      current: RUNNING_PASS.current,
      answers,
      flags: RUNNING_PASS.flags,
    },
    result: provResultView(PASS_RESULT, [PASS_RESULT, ...MOCK_RESULTS], NORMERING, now),
  }
}

// ── Uppslag and Konto ────────────────────────────────────────────────

export function fixtureUppslag(stats: Stats, now: Date, reads: ReadonlySet<string>): UppslagView {
  const progress = new Map<string, FrameworkStatus>(
    FRAMEWORK_PROGRESS.map((r) => [r.layer1Id, r.status]),
  )
  const scores = new Map(sectionScores(stats, now).map((s) => [s.section, s.score]))
  const lessonSection = FRAMEWORK_INDEX.find((c) => c.entries.some((e) => e.id === OPEN_LESSON.id))
  return {
    sections: FRAMEWORK_INDEX.map((cat) => ({
      section: cat.section,
      name: sectionLongLabel(cat.section),
      family: cat.family,
      score: scores.get(cat.section) ?? null,
      entries: cat.entries.map((e) => ({
        id: e.id,
        title: e.headword,
        summary: e.kicker,
        read: reads.has(e.id),
        status: progress.get(e.id),
        examples: e.examples,
      })),
    })),
    open: {
      id: OPEN_LESSON.id,
      section: lessonSection?.section ?? 'LÄS',
      family: lessonSection?.family ?? 'las_taxonomy',
      title: OPEN_LESSON.question_type,
      entry: OPEN_LESSON,
      read: reads.has(OPEN_LESSON.id),
      status: progress.get(OPEN_LESSON.id),
      practice: { questions: OPEN_LESSON.example_questions.length },
    },
  }
}

export function fixtureKonto(prefs: PrefsView): KontoView {
  return {
    identity: { name: IDENTITY.name, email: IDENTITY.email, initials: IDENTITY.initials },
    exam: { label: EXAM.label, daysLeft: EXAM.daysLeft },
    prefs,
    options: {
      palette: (Object.keys(PALETTES) as (keyof typeof PALETTES)[]).map((key) => ({
        key,
        label: PALETTES[key].label,
      })),
      mode: [
        { key: 'light', label: 'Ljust' },
        { key: 'dark', label: 'Mörkt' },
      ],
      font: (Object.keys(FONTS) as (keyof typeof FONTS)[]).map((key) => ({
        key,
        label: FONTS[key].label,
      })),
      density: (Object.keys(DENSITIES) as (keyof typeof DENSITIES)[]).map((key) => ({
        key,
        label: DENSITIES[key].label,
      })),
      coach: (Object.keys(COACH_LABELS) as CoachKey[]).map((key) => ({
        key,
        label: COACH_LABELS[key],
        blurb: COACH_BLURBS[key],
      })),
    },
    links: [
      { label: 'Hjälp & support', href: '/hjalp' },
      ...LEGAL_LINKS.map((l) => ({ label: l.label, href: l.to })),
    ],
  }
}

// ── The fixture data ─────────────────────────────────────────────────

/** Every screen's data on the fixture day, from r1Fixtures and r2Fixtures. */
export function fixtureDirectionData(
  overrides: { prefs?: PrefsView; reads?: ReadonlySet<string> } = {},
): DirectionData {
  const now = new Date(NOW_ISO)
  const names = frameworkNames()
  const home = fixtureHome(now)
  const prompts: Record<string, string | null> = { ...PILE_PROMPTS }
  for (const q of [...PASS_QUESTIONS, ...QUANT_QUESTIONS]) prompts[q.qid] = q.prompt
  for (const q of [...UNIT.questions, ...ELF_UNIT.questions]) prompts[q.qid] = q.prompt
  return {
    home,
    drills: fixtureDrills(),
    ova: ovaView(STATS, PILE, home.traps, now),
    repetera: repeteraView(PILE, prompts, names, now),
    provpass: fixtureProvpass(now),
    framsteg: framstegView(STATS, HISTORY, now, { goal: WEEK.goal, target: PROGNOSIS.target }),
    uppslag: fixtureUppslag(STATS, now, overrides.reads ?? new Set(LESSON_READS)),
    konto: fixtureKonto(overrides.prefs ?? PREFS),
    copy: {
      ovningstextBadge: OVNINGSTEXT_BADGE,
      ovningstextNote: OVNINGSTEXT_NOTE,
      estimateCaveat: ESTIMATE_CAVEAT,
    },
    frameworks: names,
  }
}

export const FIXTURE_DATA: DirectionData = fixtureDirectionData()

// ── The context ──────────────────────────────────────────────────────

export type DirectionDataValue = { data: DirectionData; actions: DirectionActions }

const noop = () => {}

/** Actions that do nothing: a direction rendered outside a provider (its
 *  own tests) can still be clicked through. The drill still grades. */
export const NOOP_ACTIONS: DirectionActions = {
  go: noop,
  resume: noop,
  openPlanItem: noop,
  startDrill: noop,
  openRepetera: noop,
  openLesson: noop,
  toggleLessonRead: noop,
  openKonto: noop,
  startProvpass: noop,
  submitProvpass: noop,
  openProvResult: noop,
  setTheme: noop,
  setPrefs: noop,
  exportData: noop,
  deleteAccount: noop,
  signOut: noop,
  drill: LOCAL_CONTROLLER,
}

const DEFAULT_VALUE: DirectionDataValue = { data: FIXTURE_DATA, actions: NOOP_ACTIONS }

const DirectionDataContext = createContext<DirectionDataValue | null>(null)

/**
 * Feeds the screens below it. `data` defaults to the fixtures; `actions`
 * fill in over NOOP_ACTIONS, so a provider may implement only what its
 * host can do.
 */
export function DirectionDataProvider({
  data,
  actions,
  children,
}: {
  data?: DirectionData
  actions?: Partial<DirectionActions>
  children?: ReactNode
}) {
  const value = useMemo<DirectionDataValue>(
    () => ({ data: data ?? FIXTURE_DATA, actions: { ...NOOP_ACTIONS, ...actions } }),
    [data, actions],
  )
  return <DirectionDataContext.Provider value={value}>{children}</DirectionDataContext.Provider>
}

/** The view model and the actions of the nearest provider; the fixtures and
 *  NOOP_ACTIONS outside one. */
export function useDirectionData(): DirectionDataValue {
  return useContext(DirectionDataContext) ?? DEFAULT_VALUE
}

// ── Preferences and the theme ────────────────────────────────────────

/** `data` with Konto showing `prefs`; every other screen keeps its objects. */
export function withPrefs(data: DirectionData, prefs: PrefsView): DirectionData {
  if (data.konto.prefs === prefs) return data
  return { ...data, konto: { ...data.konto, prefs } }
}

function withoutMode({ mode: _mode, ...rest }: PrefsView): Omit<PrefsView, 'mode'> {
  return rest
}

/**
 * The reader's preferences, kept for the session, with ONE authoritative
 * mode: `prefs.mode` is always `theme`, the theme on display, never a copy
 * of it. Every path that changes the mode — `setTheme(t)`,
 * `setPrefs({ mode })`, and a direction's own `onTheme`, which the host
 * wires to the same `onTheme` — asks the one owner of `theme` and comes
 * back as the next `theme`. So the displayed theme and `prefs.mode` agree
 * from the first render (a dark `?t=`) and after any change, whoever made
 * it. The bake-off's owner is its switcher; the contract's stage keeps its
 * own. The other preferences are kept here.
 */
export function useSessionPrefs({
  theme,
  onTheme,
  initial = PREFS,
}: {
  /** The theme on display. */
  theme: ThemeKey
  /** Asks the owner of `theme` for another. */
  onTheme: (theme: ThemeKey) => void
  initial?: PrefsView
}): { prefs: PrefsView } & Pick<DirectionActions, 'setTheme' | 'setPrefs'> {
  const [kept, setKept] = useState(() => withoutMode(initial))
  const prefs = useMemo<PrefsView>(() => ({ ...kept, mode: theme }), [kept, theme])
  const setTheme = useCallback((t: ThemeKey) => onTheme(t), [onTheme])
  const setPrefs = useCallback(
    ({ mode, ...rest }: Partial<PrefsView>) => {
      if (Object.keys(rest).length > 0) setKept((p) => ({ ...p, ...rest }))
      if (mode) onTheme(mode)
    },
    [onTheme],
  )
  return { prefs, setTheme, setPrefs }
}

// ── The bake-off's provider ──────────────────────────────────────────

/** The screen each destination opens in the bake-off. */
export const DESTINATION_SCREEN: Record<Destination, AppScreenKey> = {
  idag: 1,
  ova: 5,
  provpass: 9,
  uppslag: 12,
  framsteg: 11,
}

/** Screens in focus mode: a drill, with Avsluta instead of the menu. */
export const DRILL_SCREENS: readonly AppScreenKey[] = [2, 3, 6, 7, 14]

const SECTION_SCREEN: Partial<Record<Section, AppScreenKey>> = {
  LÄS: 2,
  ELF: 14,
  XYZ: 6,
  KVA: 6,
  NOG: 6,
  DTK: 7,
}

/** The bake-off screen a drill request opens, or null when the bake-off has
 *  none for it (ORD and MEK drills). A repetition opens on its first due
 *  question's kind: the fixture pile leads with KVA. */
export function drillScreen(request: DrillRequest): AppScreenKey | null {
  if (request.kind === 'mixed' || request.kind === 'repetition') return 6
  return SECTION_SCREEN[request.section] ?? null
}

const PLAN_SCREEN: Record<PlanItemKind, AppScreenKey | null> = {
  repetition: 8,
  lesson: 12,
  mock: 9,
  drill: null,
}

/**
 * The bake-off's provider value: the fixtures, with the reader's own
 * preferences and read lessons kept for the session, and every action
 * mapped onto the switcher. `prefs.mode` is the switcher's theme
 * (useSessionPrefs): setTheme and setPrefs({ mode }) ask the switcher
 * through `onTheme`, the callback the stage also hands a direction as
 * DirectionProps.onTheme. A drill's Avsluta returns to the screen it was
 * started from.
 */
export function useBakeoffDirectionData({
  screen,
  theme,
  onScreen,
  onTheme,
}: {
  screen: AppScreenKey
  /** The theme on display: the switcher's `t` (`?t=`, the bar's Tema). */
  theme: ThemeKey
  onScreen: (screen: AppScreenKey) => void
  /** Sets the switcher's `t`. */
  onTheme: (theme: ThemeKey) => void
}): DirectionDataValue {
  const { prefs, setTheme, setPrefs } = useSessionPrefs({ theme, onTheme })
  const [reads, setReads] = useState<ReadonlySet<string>>(() => new Set(LESSON_READS))
  const hub = useRef<AppScreenKey>(1)
  if (!DRILL_SCREENS.includes(screen)) hub.current = screen

  const show = useCallback(
    (s: AppScreenKey | null) => {
      if (s != null) onScreen(s)
    },
    [onScreen],
  )

  // A theme or preference change touches Konto only: the drills and every
  // other screen keep their objects.
  const base = useMemo(() => fixtureDirectionData({ reads }), [reads])
  const data = useMemo(() => withPrefs(base, prefs), [base, prefs])
  const actions = useMemo<DirectionActions>(() => {
    const drill: DrillController = {
      lock: LOCAL_CONTROLLER.lock,
      exit: () => show(hub.current),
    }
    return {
      go: (to) => show(DESTINATION_SCREEN[to]),
      resume: () => show(2),
      openPlanItem: (id) => {
        const item = base.home.plan.items.find((i) => i.id === id)
        if (!item) return
        show(
          item.kind === 'drill' && item.section
            ? drillScreen({ kind: 'section', section: item.section })
            : PLAN_SCREEN[item.kind],
        )
      },
      startDrill: (request) => show(drillScreen(request)),
      openRepetera: () => show(8),
      openLesson: () => show(12),
      toggleLessonRead: (id) =>
        setReads((r) => {
          const next = new Set(r)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        }),
      openKonto: () => show(13),
      startProvpass: () => show(9),
      submitProvpass: () => show(10),
      openProvResult: () => show(10),
      setTheme,
      setPrefs,
      exportData: noop,
      deleteAccount: noop,
      signOut: noop,
      drill,
    }
  }, [base, show, setTheme, setPrefs])

  return useMemo(() => ({ data, actions }), [data, actions])
}
