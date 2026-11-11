import type { LessonProgress } from '@/api/hooks/useLessonProgress'
import type { Mistake } from '@/api/hooks/useMistakes'
import type { Stats } from '@/api/hooks/useStats'
import type { Framework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { DEFAULT_DRILL_LENGTH, type DrillCount } from '@/lib/drill'
import { countsBySection } from '@/lib/dueBySection'
import { ORD_ROUND_SIZE } from '@/lib/ordWords'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { type DailyPlan, repetitionCopy } from '@/lib/scheduler'
import { honestSectionScores, rankWeakness, type SectionStats, scoreBand } from '@/lib/scoring'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { timedDrill } from '@/lib/timedDrill'

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
  plan: QueryState<DailyPlan | null>
  lesson: QueryState<Pick<LessonProgress, 'section' | 'frameworkId'> | null>
  reads: QueryState<ReadonlySet<string>>
  catalogs: Partial<Record<Section, Framework>>
  smartDrill: boolean
  count?: DrillCount
}
export type OvaSection = {
  section: Section
  half: 'verbal' | 'kvant'
  name: string
  gloss: string
  low: number | null
  high: number | null
  attempts: number
  gain: string | null
  href: string
}
type Step = { title: string; href: string; minutes: number | null }
type Family = Step & { ids: readonly string[]; count: DrillCount }
type Lead = {
  kind: 'loading' | 'lesson' | 'family' | 'section' | 'mixed'
  title: string
  detail: string | null
  label: string
  href: string | null
  section: Section | null
  steps: Step[]
  family: Family | null
}
export type OvaView = ReturnType<typeof buildOvaView>

/** Interim KVA group, only until every catalog provides explicit families. */
export const KVA_FALLBACK_TRAPS = Array.from(
  { length: 12 },
  (_, i) => `KVA-TRAP-${String(i + 1).padStart(3, '0')}`,
)
const GLOSS: Record<Section, string> = {
  ORD: 'Vilket ord betyder ungefär samma sak?',
  LÄS: 'Svenska texter med frågor om innehåll',
  MEK: 'Meningar med luckor att fylla',
  ELF: 'Engelska texter med frågor om innehåll',
  XYZ: 'Räkna, förenkla och lös',
  KVA: 'Vilken av två kvantiteter är störst?',
  NOG: 'Räcker (1), (2) eller båda?',
  DTK: 'Hela figursidor, några frågor per sida',
}
const drillHref = (section: Section) => `/drill?section=${encodeURIComponent(section)}&start=1`
const isSection = (s: string | undefined): s is Section => SECTION_KEYS.includes(s as Section)
const estimate = (n: number | undefined): number | null =>
  n != null && Number.isFinite(n) && n > 0 ? n : null

function familyFor(
  input: OvaInput,
  section: Section,
  id: string,
  count: DrillCount,
): Family | null {
  if (!new RegExp(`^${section}-TRAP-\\d{3}$`).test(id)) return null
  const catalog = input.catalogs[section]
  const entry = catalog?.entries.find((e) => e.id === id)
  const name = entry && 'family' in entry ? entry.family : undefined
  const knownFamily =
    name && catalog && 'families' in catalog && catalog.families?.some((f) => f.name === name)
  const ids = knownFamily
    ? catalog.entries.filter((e) => 'family' in e && e.family === name).map((e) => e.id)
    : section === 'KVA' && KVA_FALLBACK_TRAPS.includes(id)
      ? KVA_FALLBACK_TRAPS
      : [id]
  const title = knownFamily
    ? `Frågor · ${name}`
    : ids === KVA_FALLBACK_TRAPS
      ? 'Frågor med fällorna 1–12'
      : 'Frågor med samma fälla'
  return {
    ids,
    title,
    count,
    minutes: Math.ceil((SECTION_DURATIONS[section] * count) / DEFAULT_DRILL_LENGTH),
    href: `/drill?section=${encodeURIComponent(section)}&traps=${encodeURIComponent(ids.join(','))}&count=${count}&start=1`,
  }
}

function suggestion(input: OvaInput, suggested: Section | null, count: DrillCount): Lead {
  const items = input.plan.data?.items ?? []
  const reads = input.reads.data
  const bookmark = isSection(input.lesson.data?.section) ? input.lesson.data : null
  // Keep today's completed lesson as the family anchor when no bookmark was
  // written (offline reading or a second device). Completion changes the action.
  const planLesson = items.find((i) => i.kind === 'lesson' && i.estimatedMinutes > 0)
  const planDrill = items.find((i) => i.kind === 'drill' && !i.completed)
  const section = isSection(bookmark?.section)
    ? bookmark.section
    : (planLesson?.section ?? planDrill?.section ?? suggested)
  const id = isSection(bookmark?.section)
    ? bookmark.frameworkId
    : (planLesson?.framework ?? planDrill?.framework)
  const item = items.find((i) => i.kind === 'lesson' && i.section === section && i.framework === id)
  const entry =
    section && id ? input.catalogs[section]?.entries.find((e) => e.id === id) : undefined
  // Never fall back to headword/tldr or cached plan copy: those can give the answer away.
  const question = entry && 'question_title' in entry ? entry.question_title : undefined
  const lessonTitle = question || `Lektion · ${section}`
  const family = section && id ? familyFor(input, section, id, count) : null
  const lessonNeeded =
    section && (bookmark || planLesson) && !item?.completed && (!id || !reads?.has(id))
  if (lessonNeeded) {
    const href = `/lektion?section=${encodeURIComponent(section)}${id ? `#${encodeURIComponent(id)}` : ''}`
    const minutes = estimate(item?.estimatedMinutes)
    const drill = family ?? {
      title: `${section}-övning`,
      href: drillHref(section),
      minutes: SECTION_DURATIONS[section],
    }
    return {
      kind: 'lesson',
      section,
      title: 'Läs klart, öva sedan',
      detail: 'Fortsätt lektionen. Sedan kan du öva det du läst medan det är färskt.',
      label: `Fortsätt lektionen${minutes ? ` · ca ${minutes} min` : ''}`,
      href,
      family,
      steps: [{ title: lessonTitle, href, minutes }, drill],
    }
  }
  if (section && family)
    return {
      kind: 'family',
      section,
      title: question || family.title,
      detail: 'Öva frågor i samma familj.',
      label: `Öva ${count} frågor · ca ${family.minutes} min`,
      href: family.href,
      family,
      steps: [],
    }
  if (!bookmark && !planLesson && planDrill) {
    const diagnostic = planDrill.href.startsWith('/diagnostik')
    const title = section
      ? sectionLongLabel(section)
      : diagnostic
        ? 'Börja här · 10 frågor'
        : 'Blandad övning'
    const minutes = estimate(planDrill.estimatedMinutes)
    const [path, search = ''] = planDrill.href.split('?')
    const params = new URLSearchParams(search)
    params.set('start', '1')
    return {
      kind: section ? 'section' : 'mixed',
      section,
      title,
      detail: section ? GLOSS[section] : '10 frågor från riktiga prov',
      label: `${section ? `Öva ${section}` : 'Börja öva'}${minutes ? ` · ca ${minutes} min` : ''}`,
      href: `${path}?${params.toString()}`,
      family: null,
      steps: [],
    }
  }
  return section
    ? {
        kind: 'section',
        section,
        title: sectionLongLabel(section),
        detail: GLOSS[section],
        label: `Öva ${section} · ca ${SECTION_DURATIONS[section]} min`,
        href: drillHref(section),
        family: null,
        steps: [],
      }
    : {
        kind: 'mixed',
        section: null,
        title: 'Blandad övning',
        detail: `${DEFAULT_DRILL_LENGTH} frågor från alla åtta delprov`,
        label: 'Börja blandad övning',
        href: '/drill?mixed=1&start=1',
        family: null,
        steps: [],
      }
}

/** Present existing plan, score and queue facts without deriving a new prognosis. */
export function buildOvaView(input: OvaInput, now = new Date()) {
  const queries = [input.stats, input.pile, input.due, input.plan, input.lesson, input.reads]
  const state = queries.some((q) => q.isError && q.data === undefined)
    ? 'error'
    : queries.some((q) => q.isPending || q.data === undefined)
      ? 'loading'
      : 'ready'
  const scores = honestSectionScores(input.stats.data?.bySection ?? {}, now)
  const suggested = rankWeakness(scores)[0]?.section ?? null
  const ready = countsBySection(input.due.data)
  const sections: OvaSection[] = SECTION_KEYS.map((section, index) => {
    const score = scores.find((s) => s.section === section)
    const value = score?.score ?? null
    const attempts = score?.attempts90d ?? 0
    const band = scoreBand(value, attempts)
    return {
      section,
      half: index < 4 ? 'verbal' : 'kvant',
      name: sectionLongLabel(section),
      gloss: GLOSS[section],
      attempts,
      low: value != null && band != null ? Math.max(0, value - band) : null,
      high: value != null && band != null ? Math.min(2, value + band) : null,
      gain:
        ready[section] > 0
          ? `Mest att vinna: ${ready[section]} frågor på väg tillbaka`
          : suggested === section
            ? 'Mest att vinna utifrån dina första svar'
            : null,
      href: drillHref(section),
    }
  })
  const dueNow = input.due.data?.length ?? null
  const round = Math.min(dueNow ?? 0, REPETITION_SESSION_SIZE)
  const count = input.count ?? DEFAULT_DRILL_LENGTH
  const lead: Lead =
    state === 'ready'
      ? suggestion(input, suggested, count)
      : {
          kind: 'loading',
          title: state === 'error' ? 'Kunde inte hämta förslaget' : 'Laddar ditt förslag…',
          detail: null,
          label: 'Laddar förslag',
          href: null,
          section: null,
          steps: [],
          family: null,
        }
  return {
    state,
    statusLine:
      state === 'error'
        ? 'Gick inte att hämta just nu — försöker igen automatiskt.'
        : state === 'loading'
          ? 'Laddar dina övningar…'
          : null,
    standfirst: 'Ett förslag ligger framme. Allt annat väljer du fritt, så många pass du vill.',
    sections,
    lead,
    smartDrill: input.smartDrill,
    repetition: {
      dueNow,
      round,
      minutes: repetitionCopy(round).estimatedMinutes,
      href: round > 0 ? '/repetition?start=1' : '/repetition',
    },
    mixed: { questions: DEFAULT_DRILL_LENGTH, href: '/drill?mixed=1&start=1' },
    words: { count: ORD_ROUND_SIZE, href: '/drill?section=ORD&words=1&start=1' },
    timed: (['ORD', 'LÄS'] as const).map((section) => {
      const spec = timedDrill(section)!
      return {
        section,
        count: spec.count,
        minutes: Math.round(spec.budgetMs / 60_000),
        href: `/drill?section=${encodeURIComponent(section)}&timed=1&start=1`,
      }
    }),
  }
}
