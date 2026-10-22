import type { Mistake } from '@/api/hooks/useMistakes'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { Stats } from '@/api/hooks/useStats'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { canAdoptActiveSession } from '@/components/session/canAdoptSession'
import { findQuestion, type Question, SECTION_KEYS, type Section } from '@/data/questions'
import { sectionOfQid } from '@/lib/dueBySection'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { repetitionCopy } from '@/lib/scheduler'
import { honestSectionScores, rankWeakness } from '@/lib/scoring'

export type RepeteraInput = {
  now: Date
  section?: Section
  dueMistakes?: readonly Mistake[]
  dueError?: boolean
  pileMistakes?: readonly Mistake[]
  pileError?: boolean
  bank?: readonly Question[]
  stats?: Pick<Stats, 'attempts' | 'mistakes' | 'bySection'>
  roundSession?: ActiveSession | null
  roundEnded?: boolean
}
export type RepeteraItem = {
  mistakeId: number
  section: Section | null
  stem: string | null
  dueNow: boolean
  dueLabel: string
  href: string
}
export type QueueSection = {
  section: Section
  name: string
  ready: number
  laterToday: number
  laterDays: number
  href: string
}
export type RepeteraView = {
  state: 'loading' | 'error' | 'ready' | 'empty'
  ready: number
  round: number
  minutes: number
  pile: number
  pileKnown: boolean
  items: RepeteraItem[]
  due: RepeteraItem[]
  laterToday: RepeteraItem[]
  laterDays: RepeteraItem[]
  queue: QueueSection[]
  resume: { position: number; total: number } | null
  primary: { href: string | null; label: string; fallback: boolean }
  emptyLine: string
}

const SECTION_NAMES: Record<Section, string> = {
  ORD: 'Ordförståelse',
  LÄS: 'Läsförståelse',
  MEK: 'Meningskomplettering',
  ELF: 'Engelsk läsförståelse',
  XYZ: 'Matematisk problemlösning',
  KVA: 'Kvantitativa jämförelser',
  NOG: 'Kvantitativa resonemang',
  DTK: 'Diagram, tabeller och kartor',
}

/** Calendar ordinals avoid both time-of-day rounding and DST's 23/25-hour days. */
const day = (date: Date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000

export function dueLabel(at: Mistake['nextReviewAt'], now: Date): string {
  if (at == null) return 'nu'
  const date = new Date(at)
  if (!Number.isFinite(date.getTime())) return 'tid ej tillgänglig'
  if (date.getTime() <= now.getTime()) return 'nu'
  const days = day(date) - day(now)
  if (days === 0) return 'senare idag'
  if (days === 1) return 'imorgon'
  return `om ${days} dagar`
}

/** A short preview of the question, never its trap or answer. */
export function questionStem(q: { prompt: string | null; section: Section }): string | null {
  const prompt = q.prompt?.trim()
  if (!prompt) return null
  if (q.section === 'NOG') return parseNogPrompt(prompt)?.question ?? prompt
  if (q.section === 'KVA') {
    const kva = splitKvaPrompt(prompt)
    if (!kva) return prompt
    const pair = `I: ${kva.kvI} · II: ${kva.kvII}`
    return kva.condition ? `${kva.condition} · ${pair}` : pair
  }
  for (const match of prompt.matchAll(/[.?!](?=\s)/g)) {
    const at = match.index
    // The bank marks math with paired private-use delimiters.
    const inMath = prompt.lastIndexOf('\uE000', at) > prompt.lastIndexOf('\uE001', at)
    if (at >= 24 && at < prompt.length - 24 && !inMath) return prompt.slice(0, at + 1)
  }
  return prompt
}

function repetitionHref(section?: Section | null, start = false): string {
  const search = new URLSearchParams()
  if (start) search.set('start', '1')
  if (section) search.set('section', section)
  return `/repetition${search.size ? `?${search}` : ''}`
}

export function buildRepeteraView(input: RepeteraInput): RepeteraView {
  const { now, roundSession } = input
  // The due query owns playability and order. Pile and due can be from
  // different refetches; dedupe their union, keeping the due version first.
  const dueIds = new Set(input.dueMistakes?.map((m) => m.id))
  const rows = new Map<number, Mistake>()
  for (const row of [...(input.dueMistakes ?? []), ...(input.pileMistakes ?? [])]) {
    if (!rows.has(row.id)) rows.set(row.id, row)
  }
  const items = [...rows.values()].map((row): RepeteraItem => {
    const question = input.bank ? findQuestion(input.bank, row.questionId) : undefined
    const section = question?.section ?? sectionOfQid(row.questionId)
    const dueNow = dueIds.has(row.id)
    return {
      mistakeId: row.id,
      section,
      stem: question ? questionStem(question) : null,
      dueNow,
      dueLabel: dueNow ? 'nu' : dueLabel(row.nextReviewAt, now),
      href: repetitionHref(section, dueNow),
    }
  })
  const due = items.filter((i) => i.dueNow)
  const laterToday = items.filter((i) => !i.dueNow && i.dueLabel === 'senare idag')
  // A pile-only elapsed row can briefly precede the due query's refetch.
  // Keep its actual label, but don't advertise a start from the stale pile.
  const laterDays = items.filter((i) => !i.dueNow && i.dueLabel !== 'senare idag')
  const ready = due.length
  const round = Math.min(ready, REPETITION_SESSION_SIZE)
  const queue = SECTION_KEYS.map((section): QueueSection => {
    const count = due.filter((i) => i.section === section).length
    return {
      section,
      name: SECTION_NAMES[section],
      ready: count,
      laterToday: laterToday.filter((i) => i.section === section).length,
      laterDays: laterDays.filter((i) => i.section === section).length,
      href: repetitionHref(section, count > 0),
    }
  }).filter((s) => s.ready + s.laterToday + s.laterDays > 0)
  const resume =
    canAdoptActiveSession(roundSession, input.section ?? 'alla', false, input.roundEnded) &&
    Number.isInteger(roundSession.position) &&
    roundSession.position >= 0 &&
    roundSession.position < roundSession.plan.length
      ? { position: roundSession.position + 1, total: roundSession.plan.length }
      : null
  const state =
    input.dueMistakes === undefined
      ? input.dueError
        ? 'error'
        : 'loading'
      : ready || resume
        ? 'ready'
        : 'empty'
  const weakest = rankWeakness(honestSectionScores(input.stats?.bySection ?? {}, now))[0]?.section
  const drillSection = input.section ?? weakest
  const fallback = state === 'empty'
  const primary = {
    href:
      state === 'loading' || state === 'error'
        ? null
        : fallback
          ? `/drill?${drillSection ? `section=${encodeURIComponent(drillSection)}&` : ''}start=1`
          : repetitionHref(input.section, true),
    label: resume
      ? `Fortsätt omgången · fråga ${resume.position} av ${resume.total}`
      : fallback
        ? `Börja en övning${drillSection ? ` i ${drillSection}` : ''}`
        : 'Börja repetera',
    fallback,
  }
  const pileKnown = input.pileMistakes !== undefined
  const emptyLine =
    laterToday.length > 0
      ? `Inget är redo just nu – ${laterToday.length} ${laterToday.length === 1 ? 'miss blir' : 'missar blir'} redo senare idag.`
      : !pileKnown
        ? 'Inget är redo just nu.'
        : items.length === 0 &&
            input.stats?.mistakes.active === 0 &&
            input.stats.mistakes.resolved > 0
          ? 'Kön är tom just nu – allt du missat är återlärt.'
          : items.length === 0 && input.stats?.attempts.total === 0
            ? 'Här samlas dina missar från övningarna.'
            : input.stats !== undefined
              ? 'Inget är redo just nu – nästa repetition följer din planering.'
              : ''
  return {
    state,
    ready,
    round,
    minutes: repetitionCopy(round).estimatedMinutes,
    pile: items.length,
    pileKnown,
    items,
    due,
    laterToday,
    laterDays,
    queue,
    resume,
    primary,
    emptyLine,
  }
}
