import type { Mistake } from '@/api/hooks/useMistakes'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { Stats } from '@/api/hooks/useStats'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { canAdoptActiveSession } from '@/components/session/canAdoptSession'
import { findQuestion, loadBank, type Question, SECTION_KEYS, type Section } from '@/data/questions'
import { sectionOfQid } from '@/lib/dueBySection'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { parsePlanEntry, pickReplayQuestions, REPETITION_SESSION_SIZE } from '@/lib/replay'
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
  playableMistakeIds?: readonly number[]
  stats?: Pick<Stats, 'attempts' | 'mistakes' | 'bySection'>
  roundSession?: ActiveSession | null
  roundEnded?: boolean
}
export type RepeteraItem = {
  mistakeId: number | null
  questionId: string
  section: Section | null
  stem: string
  stemLang?: 'en'
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
  preview: RepeteraItem[]
  previewTitle: string
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
export function questionStem(q: Pick<Question, 'prompt' | 'section' | 'number'>): string {
  const prompt = q.prompt?.trim()
  // ELF questions without a prompt are cloze gaps; the gap is the question.
  if (!prompt) return `${q.section === 'ELF' ? 'Lucka' : 'Fråga'} ${q.number}`
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

/** Share the session's full eligibility rule, including replacement siblings.
 * loadBank is memoized, so the picker and stems use the same bank read. */
export async function loadRepeteraPreview(due: readonly Mistake[]) {
  const [bank, playable] = await Promise.all([loadBank(), pickReplayQuestions(due, due.length)])
  return { bank, playableMistakeIds: playable.map((item) => item.mistakeId) }
}

function previewStem(questionId: string, bank?: readonly Question[]) {
  const question = bank ? findQuestion(bank, questionId) : undefined
  const number = Number(questionId.match(/-(\d+)$/)?.[1])
  return {
    questionId,
    section: question?.section ?? sectionOfQid(questionId),
    stem: question
      ? questionStem(question)
      : Number.isInteger(number) && number > 0
        ? `Fråga ${number}`
        : 'Fråga',
    stemLang: question?.section === 'ELF' && question.prompt?.trim() ? ('en' as const) : undefined,
  }
}

export function buildRepeteraView(input: RepeteraInput): RepeteraView {
  const { now, roundSession } = input
  // The due query owns order; the replay picker owns playability. Pile and due can be from
  // different refetches; dedupe their union, keeping the due version first.
  const dueIds = new Set(input.dueMistakes?.map((m) => m.id))
  const rows = new Map<number, Mistake>()
  for (const row of [...(input.dueMistakes ?? []), ...(input.pileMistakes ?? [])]) {
    if (!rows.has(row.id)) rows.set(row.id, row)
  }
  const playable = input.playableMistakeIds && new Set(input.playableMistakeIds)
  const items = [...rows.values()]
    .filter((row) => !dueIds.has(row.id) || !playable || playable.has(row.id))
    .map((row): RepeteraItem => {
      const stem = previewStem(row.questionId, input.bank)
      const dueNow = dueIds.has(row.id)
      return {
        ...stem,
        mistakeId: row.id,
        dueNow,
        dueLabel: dueNow ? 'nu' : dueLabel(row.nextReviewAt, now),
        href: repetitionHref(stem.section, dueNow),
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
  const remaining = resume ? roundSession?.plan?.slice(resume.position - 1) : undefined
  const previewRound =
    remaining?.length &&
    remaining.every((entry) => typeof entry === 'string' && parsePlanEntry(entry).qid.trim())
  const preview = previewRound
    ? remaining.map(
        (entry): RepeteraItem => ({
          ...previewStem(parsePlanEntry(entry).qid, input.bank),
          mistakeId: null,
          dueNow: true,
          dueLabel: 'nu',
          // Keep the saved round's scope, including an all-sections round.
          href: repetitionHref(input.section, true),
        }),
      )
    : due
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
    preview,
    previewTitle: previewRound ? 'Kvar i din påbörjade omgång' : 'Redo nu',
    laterToday,
    laterDays,
    queue,
    resume,
    primary,
    emptyLine,
  }
}
