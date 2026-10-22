import type { Mistake } from '@/api/hooks/useMistakes'
import type { Stats } from '@/api/hooks/useStats'
import type { TopTrap } from '@/api/hooks/useTopTraps'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { DEFAULT_DRILL_LENGTH } from '@/lib/drill'
import { countsBySection } from '@/lib/dueBySection'
import { ORD_ROUND_SIZE } from '@/lib/ordWords'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { repetitionCopy } from '@/lib/scheduler'
import {
  honestSectionScores,
  rankWeakness,
  type SectionScore,
  type SectionStats,
} from '@/lib/scoring'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { type TimedDrillSection, timedDrill } from '@/lib/timedDrill'

type QueryState<T> = { data?: T; isPending?: boolean; isError?: boolean }
type OvaStats = {
  attempts: Pick<Stats['attempts'], 'total'>
  mistakes: Pick<Stats['mistakes'], 'resolved'>
  bySection: Partial<Record<Section, SectionStats>>
}
export type OvaInput = {
  stats: QueryState<OvaStats>
  pile: QueryState<readonly Pick<Mistake, 'questionId'>[]>
  due: QueryState<readonly Pick<Mistake, 'questionId'>[]>
  smartDrill: boolean
  topTraps?: readonly TopTrap[]
  trapNames?: Record<string, string>
}
export type OvaSection = {
  section: Section
  half: 'verbal' | 'kvant'
  name: string
  gloss: string
  score: number | null
  confidence: SectionScore['confidence']
  attempts: number
  waiting: number | null
  dueNow: number | null
  href: string
  repetitionHref: string
}
export type OvaView = {
  state: 'ready' | 'loading' | 'error'
  statusLine: string | null
  standfirst: string
  queueLine: string | null
  sections: OvaSection[]
  suggested: Section | null
  scoreless: boolean
  dayZero: boolean
  relearned: boolean
  lead: {
    kind: 'repetera' | 'section' | 'mixed'
    eyebrow: string
    title: string
    detail: string | null
    label: string
    href: string
  }
  repetition: {
    pile: number | null
    dueNow: number | null
    round: number
    minutes: number
    href: string
  }
  mixed: { questions: number; href: string }
  words: { label: string; href: string }
  timed: {
    section: TimedDrillSection
    count: number
    minutes: number
    label: string
    href: string
  }[]
  trap: {
    section: Section
    name: string
    pattern: string | null
    count: number
    rising: boolean
    href: string
  } | null
  smartDrill: boolean
}

const GLOSS: Record<Section, string> = {
  ORD: 'Vilket ord betyder ungefär samma sak?',
  LÄS: 'Hela texter med frågor om innehåll',
  MEK: 'Meningar med luckor att fylla',
  ELF: 'Engelska texter med frågor om innehåll',
  XYZ: 'Räkna, förenkla och lös',
  KVA: 'Vilken av två kvantiteter är störst?',
  NOG: 'Räcker (1), (2) eller båda?',
  DTK: 'Hela figursidor med diagram, tabeller och kartor',
}
const missWord = (n: number) => (n === 1 ? 'miss' : 'missar')
const minuteWord = (n: number) => (n === 1 ? 'minut' : 'minuter')

/** Keep unknown query results distinct from a known empty queue. */
export function buildOvaView(input: OvaInput, now = new Date()): OvaView {
  const queries = [input.stats, input.pile, input.due]
  const state = queries.some((q) => q.isError)
    ? 'error'
    : queries.some((q) => q.isPending || q.data === undefined)
      ? 'loading'
      : 'ready'
  const scores = honestSectionScores(input.stats.data?.bySection ?? {}, now)
  const suggested = rankWeakness(scores)[0]?.section ?? null
  const waiting = countsBySection(input.pile.data)
  const ready = countsBySection(input.due.data)
  const sections: OvaSection[] = SECTION_KEYS.map((section, index) => {
    const score = scores.find((s) => s.section === section)
    return {
      section,
      half: index < 4 ? 'verbal' : 'kvant',
      name: sectionLongLabel(section),
      gloss: GLOSS[section],
      score: score?.score ?? null,
      confidence: score?.confidence ?? 'low',
      attempts: score?.attempts90d ?? 0,
      waiting: input.pile.data === undefined ? null : waiting[section],
      dueNow: input.due.data === undefined ? null : ready[section],
      href: `/drill?section=${encodeURIComponent(section)}&start=1`,
      repetitionHref: `/repetition?section=${encodeURIComponent(section)}&start=1`,
    }
  })
  const pile = input.pile.data?.length ?? null
  const dueNow = input.due.data?.length ?? null
  const round = Math.min(dueNow ?? 0, REPETITION_SESSION_SIZE)
  const minutes = repetitionCopy(round).estimatedMinutes
  const repetition = {
    pile,
    dueNow,
    round,
    minutes,
    href: round > 0 ? '/repetition?start=1' : '/repetition',
  }
  const mixed = { questions: DEFAULT_DRILL_LENGTH, href: '/drill?mixed=1&start=1' }
  const suggestedSection = sections.find((s) => s.section === suggested)
  const dayZero = input.stats.data?.attempts.total === 0
  const relearned = (input.stats.data?.mistakes.resolved ?? 0) > 0 && pile === 0
  const lead: OvaView['lead'] =
    round > 0
      ? {
          kind: 'repetera',
          eyebrow: 'Repetera · de äldsta först',
          title: `${dueNow != null && dueNow > round ? `${round} av ${dueNow}` : round} ${missWord(round)}, ungefär ${minutes} ${minuteWord(minutes)}`,
          detail:
            pile != null && dueNow != null && pile > dueNow
              ? `${pile - dueNow} ${missWord(pile - dueNow)} till väntar i dagens hög och blir redo senare.`
              : null,
          label: 'Börja repetera',
          href: repetition.href,
        }
      : suggestedSection
        ? {
            kind: 'section',
            eyebrow: `Förslag · ${suggestedSection.section}`,
            title: suggestedSection.name,
            detail: suggestedSection.gloss,
            label: `Börja med ${suggestedSection.section}`,
            href: suggestedSection.href,
          }
        : {
            kind: 'mixed',
            eyebrow: 'Börja här',
            title: 'Blandad övning',
            detail: `${mixed.questions} frågor över alla åtta delprov`,
            label: 'Börja blandad övning',
            href: mixed.href,
          }
  const queueLine =
    state !== 'ready' || round > 0
      ? null
      : pile != null && pile > 0
        ? `Inget är redo just nu — ${pile} ${missWord(pile)} i dagens hög blir redo senare.`
        : dayZero
          ? 'Inga missar än — när du svarar fel i en övning landar frågan här.'
          : relearned
            ? 'Kön är tom just nu — allt du missat är återlärt.'
            : 'Inga missar i dagens hög. Repetera finns kvar här.'
  const traps = input.topTraps ?? []
  const trap = traps.find((t) => t.trend.kind === 'delta' && t.trend.delta > 0) ?? traps[0]
  return {
    state,
    statusLine:
      state === 'error'
        ? 'Gick inte att hämta just nu — försöker igen automatiskt.'
        : state === 'loading'
          ? 'Laddar dina övningar och missar…'
          : null,
    standfirst: suggested
      ? `Schemat föreslår ${suggested} just nu. Välj fritt om du hellre tar något annat.`
      : 'Välj ett delprov att öva, eller ta en blandad övning över alla åtta.',
    queueLine,
    sections,
    suggested,
    scoreless: sections.some((s) => s.score == null),
    dayZero,
    relearned,
    lead,
    repetition,
    mixed,
    words: { label: `Ordbank · ${ORD_ROUND_SIZE} ord`, href: '/drill?section=ORD&words=1&start=1' },
    timed: (['ORD', 'LÄS'] as const).flatMap((section) => {
      const spec = timedDrill(section)
      if (!spec) return []
      const minutes = Math.round(spec.budgetMs / 60_000)
      return [
        {
          section,
          count: spec.count,
          minutes,
          label:
            section === 'ORD'
              ? `ORD på tid · ${spec.count} frågor, ${minutes} min`
              : `En LÄS-text på tid · ca ${minutes} min`,
          href: `/drill?section=${encodeURIComponent(section)}&timed=1&start=1`,
        },
      ]
    }),
    trap: trap
      ? {
          section: trap.section,
          name: input.trapNames?.[trap.framework_id] ?? `Öva ${trap.section}`,
          pattern: trap.headline,
          count: trap.count,
          rising: trap.trend.kind === 'delta' && trap.trend.delta > 0,
          href: `/drill?section=${encodeURIComponent(trap.section)}&framework=${encodeURIComponent(trap.framework_id)}&start=1`,
        }
      : null,
    smartDrill: input.smartDrill,
  }
}
