import type { Mistake } from '@/api/hooks/useMistakes'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import type { AttemptsDailyBucket } from '@/api/hooks/useStats'
import type { TopTrap } from '@/api/hooks/useTopTraps'
import type { FormattedResumption } from '@/components/home/useResumptionCandidate'
import type { Framework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { fmtScore, inWords } from '@/folio/lib/format'
import { keepMathTogether } from '@/folio/lib/keepMathTogether'
import { countsBySection } from '@/lib/dueBySection'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import {
  type DailyPlan,
  localDateString,
  type MockPrescription,
  type PlanItem,
  repetitionCopy,
} from '@/lib/scheduler'
import {
  formatDeltaSv,
  formatSwedishDateShort,
  type HonestDelta,
  type HonestProjection,
  honestSectionScores,
  projectionBasis,
  rankWeakness,
  type SectionStats,
} from '@/lib/scoring'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'
import { passLabel } from '@/lib/sessionLabel'

export type QueueItem = Pick<Mistake, 'questionId' | 'nextReviewAt'>
export type IdagInput = {
  now: Date
  examDate: Date
  daysLeft: number
  plan: DailyPlan | null
  planError?: boolean
  allComplete?: boolean
  firstName?: string | null
  resume?: FormattedResumption | null
  projected?: HonestProjection | null
  projectedDelta?: HonestDelta | null
  bySection?: Partial<Record<Section, SectionStats>>
  attemptsDaily?: readonly AttemptsDailyBucket[]
  minutesToday?: number | null
  topTraps?: readonly TopTrap[]
  frameworks?: readonly Framework[]
  missFrameworks?: Readonly<Record<string, string | null>>
  mockPrescription?: MockPrescription | null
  dailyMinutes?: number
  history?: readonly SessionHistoryRow[]
  dueCount?: number
  pileCount?: number
  dueMistakes?: readonly QueueItem[]
  pileMistakes?: readonly QueueItem[]
}

export type PlanItemView = Omit<PlanItem, 'headline' | 'estimatedMinutes'> & {
  title: string
  detail?: string
  minutes: number
  questionTitle?: string
  whyNow?: string
}
export type ResumeView = {
  title: string
  section: Section | null
  href: string
  progress: string
  position?: number
  total?: number
  answered?: number
  pausedAt: string
  device: string | null
  stale: boolean
  questionTitle?: string
  whyNow?: string
  minutes?: number
  planItemId?: string
  lesson: boolean
}
export type HomeView = {
  state: 'loading' | 'error' | 'cold' | 'onboarding' | 'complete' | 'active' | 'empty'
  today: { greeting: string; firstName?: string | null; dateLabel: string }
  exam: { dateLabel: string; fullDateLabel: string; label: string; daysLeft: number }
  resume: ResumeView | null
  plan: { items: PlanItemView[]; minutes: number; allComplete: boolean; budget?: number }
  prognosis: {
    total: number | null
    verbal: number | null
    quant: number | null
    low?: number
    high?: number
    deltaLabel: string | null
    caveat: string | null
    basis: string
  }
  recent: {
    id: number
    label: string
    correct: number
    total: number
    returning: number
    section: Section | null
    when: string
    href: string
  }[]
  week: { minutesToday: number | null; daysPractised?: number }
  repetition: { ready: number; pile: number; tomorrow: number; sections: Record<Section, number> }
  weakest: Section | null
  mock: { dateLabel: string; half: string; interval: number; href: string } | null
}
export type DayStep = {
  key: string
  state: 'done' | 'now' | 'next'
  title: string
  gloss?: string
  page: string
  why?: string
  href: string
  item?: PlanItemView
  section?: Section | null
}
export type NextUp = { label: string; why?: string; href: string }
export type ShortItem = { what: string; minutes: number; href: string }

const CAVEAT =
  'Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.'
const missWord = (n: number) => (n === 1 ? 'miss' : 'missar')
const minuteWord = (n: number) => (n === 1 ? 'minut' : 'minuter')
const SESSION_LABELS: Partial<Record<string, string>> = {
  mock_diagnostic: 'Diagnos',
  diagnostic: 'Diagnos',
  mock: 'Provpass',
  adaptive_review: 'Repetition',
  onboarding: 'Första passet',
}
// Use the scheduler's measured round estimate, including the session cap.
const repMinutes = (n: number) => repetitionCopy(n).estimatedMinutes

function lessonId(href: string): string | undefined {
  return href.split('#')[1] || undefined
}

/** Only question-form titles cross into Idag; shared headwords can disclose the answer. */
function lessonCopy(input: IdagInput, id: string | undefined, section: Section | null) {
  const catalog = input.frameworks?.find((f) => f.section === section)
  const entry = catalog?.entries.find((e) => e.id === id)
  const questionTitle =
    entry && 'question_title' in entry && entry.question_title
      ? keepMathTogether(entry.question_title)
      : undefined
  const family = entry && 'family' in entry ? entry.family : undefined
  if (!family || !section) return { questionTitle }
  const queue = [
    ...new Map((input.dueMistakes ?? []).map((m) => [m.questionId, m])).values(),
  ].filter((m) => countsBySection([m])[section] > 0)
  let count = 0
  let known = 0
  for (const miss of queue) {
    const mapped = catalog?.entries.find((e) => e.id === input.missFrameworks?.[miss.questionId])
    if (!mapped || !('family' in mapped) || !mapped.family) continue
    known++
    if (mapped.family === family) count++
  }
  return {
    questionTitle,
    whyNow:
      count > 0
        ? `${known < queue.length ? 'Minst ' : ''}${count} av dina ${queue.length} ${section}-${missWord(queue.length)} som väntar hör till familjen ”${family}”.`
        : undefined,
  }
}

function planItem(item: PlanItem, input: IdagInput): PlanItemView {
  let live = item
  if (item.kind === 'repetition') {
    const count = input.dueCount
    live = {
      ...item,
      ...(count === undefined
        ? {}
        : count === 0
          ? { headline: 'Repetition · Kön är tom just nu', completed: true, estimatedMinutes: 0 }
          : { ...repetitionCopy(count, input.pileCount), completed: false }),
      rationale: count === 0 ? 'Inga missar att repetera just nu.' : 'De äldsta missarna först.',
    }
  }
  const [title, ...detail] = live.headline.split(' · ')
  const isLesson = live.kind === 'lesson'
  const framework = live.framework ?? (isLesson ? lessonId(live.href) : undefined)
  const copy = lessonCopy(input, framework, live.section)
  const safe = isLesson || !!framework
  let href = live.href
  if (live.kind === 'mock') {
    const half = new URLSearchParams(href.split('?')[1]).get('half')
    href = `/prov?half=${half === 'kvant' || live.headline.toLowerCase().includes('kvant') ? 'kvant' : 'verbal'}`
  }
  return {
    id: live.id,
    kind: live.kind,
    section: live.section,
    framework,
    title: safe
      ? isLesson
        ? `${live.section ?? ''}-lektion`
        : `Öva ${live.section ?? 'fällan'}`
      : title,
    detail: safe ? copy.questionTitle : detail.join(' · ') || undefined,
    ...copy,
    rationale: safe
      ? isLesson
        ? 'Svaret och fällans namn kommer i lektionen.'
        : 'Samma mönster som i lektionen, i riktiga provfrågor.'
      : live.rationale.replace(/\b1 missar\b/g, '1 miss'),
    minutes: live.estimatedMinutes,
    completed: live.completed,
    href,
  }
}

function resumeView(
  raw: FormattedResumption | null | undefined,
  input: IdagInput,
  items: PlanItemView[],
): ResumeView | null {
  if (!raw) return null
  const lesson = raw.href.startsWith('/lektion')
  const section = SECTION_KEYS.find((s) => raw.subject.startsWith(s)) ?? null
  const matchItem = items.find(
    (i) =>
      !i.completed &&
      lesson &&
      i.kind === 'lesson' &&
      i.section === section &&
      i.framework === lessonId(raw.href),
  )
  const copy = lessonCopy(input, lessonId(raw.href), section)
  const match = /^vid fråga (\d+) av (\d+)$/.exec(raw.progress)
  const position = match ? Number(match[1]) : 0
  const total = match ? Number(match[2]) : 0
  const valid = position > 0 && position <= total
  return {
    title: lesson ? `${section ?? ''}-lektion` : raw.subject,
    section,
    href: raw.href,
    progress: lesson ? 'Påbörjad lektion' : valid ? raw.progress : 'Påbörjad övning',
    ...(!lesson && valid ? { position, total, answered: position - 1 } : {}),
    pausedAt: raw.relativeLabel,
    device: raw.deviceLabel,
    stale: raw.stale,
    lesson,
    ...copy,
    ...(matchItem ? { minutes: matchItem.minutes, planItemId: matchItem.id } : {}),
  }
}

function hourGreeting(d: Date): string {
  const h = d.getHours()
  if (h < 5) return 'God natt'
  if (h < 10) return 'God morgon'
  if (h < 14) return 'God dag'
  if (h < 18) return 'God eftermiddag'
  if (h < 22) return 'God kväll'
  return 'God natt'
}

function daysPractisedThisWeek(days: readonly AttemptsDailyBucket[], now: Date): number {
  // The worker buckets effort in UTC. Keep week boundaries on that same clock.
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  const from = monday.toISOString().slice(0, 10)
  const to = now.toISOString().slice(0, 10)
  return new Set(days.filter((d) => d.n > 0 && d.date >= from && d.date <= to).map((d) => d.date))
    .size
}

export function whenLabel(iso: string | number | null, now: Date): string {
  if (iso == null) return ''
  const then = new Date(iso)
  if (!Number.isFinite(then.getTime())) return ''
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((midnight(now) - midnight(then)) / 86_400_000)
  if (days === 0) return 'Idag'
  if (days === 1) return 'Igår'
  if (days > 1 && days < 7) return then.toLocaleDateString('sv-SE', { weekday: 'long' })
  return formatSwedishDateShort(then)
}

/** Pure adapter: no query, storage, plan generation or fixture imports. */
export function buildIdagView(input: IdagInput): HomeView {
  const { plan, now } = input
  const items = (plan?.items ?? []).map((i) => planItem(i, input))
  const first = items.length === 1 ? items[0] : null
  const p = input.projected
  const delta = input.projectedDelta
  const prescription = input.mockPrescription
  const mockDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (prescription?.daysUntilNext ?? 0),
  )
  const supported = SECTION_KEYS.filter((s) => {
    const st = input.bySection?.[s]
    return st && (st.firstTry90d ?? st.attempts90d) > 0
  }).length
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowDate = localDateString(tomorrow)
  const state: HomeView['state'] = !plan
    ? input.planError
      ? 'error'
      : 'loading'
    : first?.id.startsWith('onboarding-')
      ? 'onboarding'
      : items.length === 0
        ? 'empty'
        : input.allComplete
          ? 'complete'
          : first?.id.startsWith('cold-')
            ? 'cold'
            : 'active'
  return {
    state,
    today: {
      greeting: hourGreeting(now),
      firstName: input.firstName,
      dateLabel: now.toLocaleDateString('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    },
    exam: {
      dateLabel: input.examDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }),
      fullDateLabel: input.examDate.toLocaleDateString('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      label: input.examDate.getMonth() < 6 ? 'Vårprovet' : 'Höstprovet',
      daysLeft: input.daysLeft,
    },
    resume: resumeView(input.resume, input, items),
    plan: {
      items,
      minutes: items.filter((i) => !i.completed).reduce((n, i) => n + i.minutes, 0),
      allComplete: input.allComplete ?? false,
      budget: input.dailyMinutes,
    },
    prognosis: {
      total: p?.total ?? null,
      verbal: p?.verbal ?? null,
      quant: p?.quant ?? null,
      ...(p?.total != null && p.band != null
        ? {
            // Round outward at display precision: the band's solid core and
            // its headline state the same range without narrowing uncertainty.
            low: Math.max(0, Math.floor((p.total - p.band) * 10 + 1e-9) / 10),
            high: Math.min(2, Math.ceil((p.total + p.band) * 10 - 1e-9) / 10),
          }
        : {}),
      deltaLabel:
        delta?.kind === 'change'
          ? `${formatDeltaSv(delta.delta)} sedan förra veckan`
          : delta?.kind === 'stable'
            ? 'stabil, inom felmarginalen'
            : null,
      caveat: projectionBasis(input.bySection ?? {}).total.calibrated ? null : CAVEAT,
      basis: input.bySection
        ? `Underlag från ${supported} av 8 delprov. Fler svar gör intervallet tydligare.`
        : 'Underlaget per delprov är ännu inte tillgängligt.',
    },
    recent: (input.history ?? []).slice(0, 3).map((row) => ({
      id: row.id,
      label: SESSION_LABELS[row.kind] ?? passLabel(row),
      correct: row.correct,
      total: row.total,
      returning: Math.max(0, row.total - row.correct),
      section:
        SECTION_KEYS.find((s) => row.sections === s || row.sections?.startsWith(`${s} ·`)) ?? null,
      when: whenLabel(row.endedAt, now),
      href: `${row.kind === 'adaptive_review' ? '/repetition' : '/drill'}?done=${row.id}`,
    })),
    week: {
      minutesToday: input.minutesToday ?? null,
      ...(input.attemptsDaily
        ? { daysPractised: daysPractisedThisWeek(input.attemptsDaily, now) }
        : {}),
    },
    repetition: {
      ready: input.dueCount ?? 0,
      pile: input.pileCount ?? 0,
      sections: countsBySection(input.dueMistakes),
      tomorrow: (input.pileMistakes ?? []).filter(
        (m) => m.nextReviewAt != null && localDateString(new Date(m.nextReviewAt)) === tomorrowDate,
      ).length,
    },
    weakest: rankWeakness(honestSectionScores(input.bySection ?? {}, now))[0]?.section ?? null,
    mock: prescription
      ? {
          dateLabel: prescription.due
            ? 'Idag'
            : mockDate.toLocaleDateString('sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }),
          half: prescription.half === 'kvant' ? 'Kvant' : 'Verbal',
          interval: prescription.interval,
          href: `/prov?half=${prescription.half}`,
        }
      : null,
  }
}

export function daySteps({ resume, plan }: HomeView): DayStep[] {
  const steps: DayStep[] = plan.items
    .filter((i) => i.completed)
    .map((item) => ({
      key: item.id,
      state: 'done',
      title: item.title,
      gloss: item.detail,
      page: 'klar',
      why: item.rationale,
      href: item.href,
      item,
      section: item.section,
    }))
  if (resume)
    steps.push({
      key: 'resume',
      state: 'now',
      title: resume.title,
      gloss: resume.section ?? undefined,
      page: resume.minutes != null ? `${resume.minutes} min` : 'Påbörjad',
      why: resume.questionTitle ?? resume.progress,
      href: resume.href,
      section: resume.section,
    })
  plan.items
    .filter((i) => !i.completed && i.id !== resume?.planItemId)
    .forEach((item, index) => {
      const current = !resume && index === 0
      steps.push({
        key: item.id,
        state: current ? 'now' : 'next',
        title: item.title,
        gloss: item.detail,
        page: `${item.minutes} min`,
        why: item.rationale,
        href: item.href,
        item,
        section: item.section,
      })
    })
  return steps
}

export function nextUp(view: HomeView): NextUp {
  if (view.repetition.ready > 0) {
    const round = Math.min(view.repetition.ready, REPETITION_SESSION_SIZE)
    return {
      label: `Repetera ${round} ${missWord(round)} · ${repMinutes(round)} min`,
      why: 'Redo nu, de äldsta först.',
      href: '/repetition?start=1',
    }
  }
  if (view.weakest)
    return {
      label: `Öva ${view.weakest}`,
      why: `${view.weakest} är din svagaste del just nu.`,
      href: `/drill?section=${encodeURIComponent(view.weakest)}`,
    }
  return { label: 'Till Öva', href: '/ova' }
}

export function tomorrowLine(view: HomeView): string | null {
  const round = Math.min(view.repetition.tomorrow, REPETITION_SESSION_SIZE)
  return round > 0
    ? `I morgon börjar du med: Repetera ${round} ${missWord(round)} · ${repMinutes(round)} min`
    : null
}

export function shortItem(view: HomeView): ShortItem | null {
  if (view.state !== 'active') return null
  const lead = view.resume ? null : view.plan.items.find((i) => !i.completed)
  if (lead?.kind === 'repetition') {
    const cut = SECTION_KEYS.map((section) => ({ section, n: view.repetition.sections[section] }))
      .filter((s) => s.n > 0 && repMinutes(s.n) <= 5)
      .sort((a, b) => b.n - a.n)[0]
    if (cut)
      return {
        what: `repetera bara ${cut.section}, ${cut.n} ${missWord(cut.n)}`,
        minutes: repMinutes(cut.n),
        href: `/repetition?start=1&section=${encodeURIComponent(cut.section)}`,
      }
  }
  const item = view.plan.items
    .filter((i) => !i.completed && i !== lead && i.minutes > 0 && i.minutes <= 5)
    .sort((a, b) => a.minutes - b.minutes)[0]
  return item
    ? {
        what: `${item.title}${item.detail ? `, ${item.detail}` : ''}`,
        minutes: item.minutes,
        href: item.href,
      }
    : {
        what: 'Tio ORD-ord',
        minutes: SECTION_DURATIONS.ORD,
        href: '/drill?section=ORD&words=1&start=1',
      }
}

export function daySentence(view: HomeView): string | null {
  if (['cold', 'loading', 'error', 'empty', 'onboarding'].includes(view.state)) return null
  const minutes = view.plan.minutes
  if (minutes <= 0) return 'Ett förslag i taget. Allt annat finns kvar när du vill ha det.'
  const subject =
    view.resume && view.resume.minutes == null ? 'Resten av dagens spår' : 'Dagens spår'
  return `Ett förslag i taget. ${subject} tar ungefär ${minutes} ${minuteWord(minutes)}, och allt annat finns kvar när du vill ha det.`
}

export function weekLine(week: HomeView['week']): string {
  return [
    week.minutesToday != null ? `${week.minutesToday} ${minuteWord(week.minutesToday)} idag` : null,
    week.daysPractised != null
      ? `${inWords(week.daysPractised)} ${week.daysPractised === 1 ? 'dag' : 'dagar'} den här veckan`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function scaleLabel(p: HomeView['prognosis']): string {
  return p.low != null && p.high != null
    ? `Trolig nivå ${fmtScore(p.low)} till ${fmtScore(p.high)} på skalan 0 till 2,0`
    : `Prognos ${fmtScore(p.total ?? 0)} på skalan 0 till 2,0`
}
