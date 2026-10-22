import type { Mistake } from '@/api/hooks/useMistakes'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import type { AttemptsDailyBucket, Stats, WeeklyBucket } from '@/api/hooks/useStats'
import type { TopTrap } from '@/api/hooks/useTopTraps'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { countsBySection } from '@/lib/dueBySection'
import {
  computeHonestDelta,
  computeHonestProjected,
  formatDeltaSv,
  formatScoreSv,
  formatSwedishDateShort,
  honestSectionScores,
  isoWeek,
  projectionBasis,
  rankWeakness,
  scoreBand,
  sectionBasis,
  weeklyScore,
} from '@/lib/scoring'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { passLabel } from '@/lib/sessionLabel'

type QueryState<T> = { data?: T; isPending?: boolean; isError?: boolean }
export type FramstegInput = {
  stats: QueryState<Stats>
  due?: QueryState<readonly Pick<Mistake, 'questionId'>[]>
  history?: QueryState<readonly SessionHistoryRow[]>
  topTraps?: readonly TopTrap[]
  trapNames?: Record<string, string>
}
export const FIRST_TRY_NOTE =
  'Prognosen räknar bara första försöket på varje fråga, inte repetitioner.'
const CAVEAT =
  'Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.'
export const RETRY_LINE = 'Gick inte att hämta just nu — försöker igen automatiskt.'
export const scoreLabel = formatScoreSv

// Derive comparisons from the displayed decimal too: binary half-ties can
// differ between Math.round(n * 10) and the shared toFixed(1) formatter.
const displayedTenths = (score: number) =>
  Math.round(Number(scoreLabel(score).replace(',', '.')) * 10)

function queryState<T>(query?: QueryState<T>): 'ready' | 'loading' | 'error' {
  if (query?.data !== undefined) return 'ready'
  return query?.isError ? 'error' : 'loading'
}

/** Same comparison semantics as classic Framsteg, without importing that screen. */
export function focusRankLine(index: number, scoredCount: number): string {
  if (scoredCount === 0) return 'Ett första underlag'
  if (scoredCount === 1) return 'Enda sektionen med försök hittills'
  return ['Lägsta sektionen just nu', 'Näst lägst just nu', 'Tredje lägst just nu'][
    Math.min(index, 2)
  ]
}

function whenLabel(iso: string | null, now: Date): string {
  if (iso == null) return ''
  const then = new Date(iso)
  if (!Number.isFinite(then.getTime())) return ''
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((midnight(now) - midnight(then)) / 86400000)
  if (days === 0) return 'Idag'
  if (days === 1) return 'Igår'
  if (days > 1 && days < 7) return then.toLocaleDateString('sv-SE', { weekday: 'long' })
  return formatSwedishDateShort(then)
}

function heatDays(days: readonly AttemptsDailyBucket[] | undefined, now: Date) {
  if (!days) return null
  const byDate = new Map(days.map((day) => [day.date, day]))
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Array.from({ length: 84 }, (_, i) => {
    const date = new Date(end - (83 - i) * 86400000).toISOString().slice(0, 10)
    const day = byDate.get(date) ?? { date, n: 0, verbal: 0, quant: 0 }
    return { ...day, level: day.n === 0 ? 0 : day.n < 5 ? 1 : 2 }
  })
}

/** Coordinates and gap bridges are pure so sparse weeks stay inspectable. */
export function buildTrend(weekly: readonly WeeklyBucket[], phone = false) {
  const width = phone ? 350 : 640
  const height = phone ? 200 : 220
  const left = 36
  const right = phone ? 52 : 64
  const top = 14
  const bottom = 30
  const raw = weekly.map((w, i) => ({
    i,
    score: weeklyScore(w),
    week: isoWeek(new Date(w.weekStart)),
    weekStart: w.weekStart,
  }))
  const known = raw.filter((p): p is typeof p & { score: number } => p.score != null)
  const lo = Math.max(0, Math.floor((Math.min(1, ...known.map((p) => p.score)) - 0.1) * 2) / 2)
  const x = (i: number) => left + (i / Math.max(1, raw.length - 1)) * (width - left - right)
  const y = (v: number) => top + (1 - (v - lo) / (2 - lo)) * (height - top - bottom)
  const at = (p: (typeof known)[number]) => `${x(p.i).toFixed(1)},${y(p.score).toFixed(1)}`
  const solid: string[] = []
  const bridges: string[] = []
  let run: string[] = []
  let prev: (typeof known)[number] | undefined
  for (const point of known) {
    if (prev && point.i - prev.i > 1) {
      bridges.push(`M${at(prev)} L${at(point)}`)
      if (run.length > 1) solid.push(run.join(' '))
      run = []
    }
    run.push(at(point))
    prev = point
  }
  if (run.length > 1) solid.push(run.join(' '))
  const first = known[0]
  const last = known[known.length - 1]
  const change = first && last ? displayedTenths(last.score) - displayedTenths(first.score) : 0
  return {
    ready: known.length >= 2,
    width,
    height,
    left,
    right,
    bottom,
    solid,
    bridges,
    points: raw.map((p) => ({ ...p, x: x(p.i), y: p.score == null ? null : y(p.score) })),
    last: last ? { ...last, x: x(last.i), y: y(last.score) } : null,
    ticks: [0, 0.5, 1, 1.5, 2].filter((v) => v >= lo).map((value) => ({ value, y: y(value) })),
    summary:
      first && last
        ? `Från ${scoreLabel(first.score)} i vecka ${first.week} till ${scoreLabel(last.score)} i vecka ${last.week} – ${change === 0 ? 'samma nivå' : `${change > 0 ? 'upp' : 'ner'} ${scoreLabel(Math.abs(change) / 10)}`}.`
        : '',
  }
}

export function buildFramstegView(input: FramstegInput, now = new Date()) {
  const data = input.stats.data
  const state = queryState(input.stats)
  const bySection: Partial<Stats['bySection']> = data?.bySection ?? {}
  const scores = honestSectionScores(bySection, now)
  const projected = computeHonestProjected(bySection)
  const delta = computeHonestDelta(bySection)
  const dayZero = state === 'ready' && projected.total == null
  const due = countsBySection(input.due?.data)
  const drillHref = (section: Section) => `/drill?section=${encodeURIComponent(section)}&start=1`
  const traps = (input.topTraps ?? []).map((t) => ({
    id: t.framework_id,
    section: t.section,
    name: input.trapNames?.[t.framework_id] ?? `Öva ${t.section}`,
    pattern: t.headline,
    count: t.count,
    countLabel: `${t.count} ${t.count === 1 ? 'gång' : 'gånger'}`,
    rising: t.trend.kind === 'delta' && t.trend.delta > 0,
    href: `/drill?section=${encodeURIComponent(t.section)}&framework=${encodeURIComponent(t.framework_id)}&start=1`,
  }))
  const sections = SECTION_KEYS.map((section) => {
    const s = scores.find((s) => s.section === section)
    const score = s?.score ?? null
    const attempts = s?.attempts90d ?? 0
    const band = scoreBand(score, attempts)
    const stale =
      score != null &&
      Number.isFinite(s?.daysSinceLastAttempt) &&
      (s?.daysSinceLastAttempt ?? 0) >= 14
    const trend =
      s?.trend == null ? '—' : s.trend > 0.05 ? 'upp' : s.trend < -0.05 ? 'ner' : 'stabil'
    const trap = traps
      .filter((t) => t.section === section)
      .sort((a, b) => Number(b.rising) - Number(a.rising) || b.count - a.count)[0]
    const level =
      score == null
        ? null
        : displayedTenths(score) >= 20
          ? 'Håll 2,0'
          : `${scoreLabel(score)} → ${scoreLabel((displayedTenths(score) + 1) / 10)}`
    let up = {
      level,
      label: `Öva ${section}`,
      href: drillHref(section),
      text: `Ett ${section}-pass med fokus på missarna.`,
    }
    if (score == null)
      up = { ...up, text: `Gör en första ${section}-runda, så finns en nivå att bygga på.` }
    else if (stale)
      up = {
        ...up,
        text: `En kort ${section}-runda – delprovet har vilat i ${s?.daysSinceLastAttempt} dagar.`,
      }
    else if (trap)
      up = {
        ...up,
        label: 'Öva fällan',
        href: trap.href,
        text: `Öva ${trap.name} – ${trap.countLabel}${trap.rising ? ', ökar' : ''}.`,
      }
    else if (due[section] > 0)
      up = {
        ...up,
        label: 'Repetera',
        href: `/repetition?section=${encodeURIComponent(section)}&start=1`,
        text: `${due[section]} ${section}-${due[section] === 1 ? 'miss' : 'missar'} redo att repetera.`,
      }
    else
      up = {
        ...up,
        text:
          score >= 2
            ? `Ett ${section}-pass för att hålla nivån.`
            : s?.confidence === 'low'
              ? `Fler ${section}-frågor ger ett tydligare underlag.`
              : `Ett ${section}-pass med fokus på missarna${trend === 'upp' || trend === 'ner' ? ` – trenden pekar ${trend}` : ''}.`,
      }
    return {
      section,
      name: sectionLongLabel(section),
      score,
      scoreLabel: scoreLabel(score),
      bandLabel: band == null ? null : `±${scoreLabel(band)}`,
      attempts,
      trend,
      marked: !!bySection[section] && !sectionBasis(bySection[section]).calibrated,
      staleLabel: stale ? `${s?.daysSinceLastAttempt} dagar sedan` : null,
      href: `/lektion?section=${encodeURIComponent(section)}`,
      up,
    }
  })
  const scoredCount = scores.filter((s) => s.score != null).length
  const focus = rankWeakness(scores)
    .slice(0, 3)
    .map((s, i) => ({
      section: s.section,
      name: sectionLongLabel(s.section),
      reason: focusRankLine(i, scoredCount),
      href: drillHref(s.section),
    }))
  const first = focus[0]
  const mixedHref = '/drill?mixed=1&start=1'
  const primary =
    state !== 'ready'
      ? null
      : dayZero
        ? {
            title: 'Ett första underlag',
            reason: 'Svara på frågor i båda delarna, så får prognosen något att bygga på.',
            label: 'Börja här · 10 frågor',
            href: '/diagnostik?start=1',
          }
        : first
          ? {
              title: first.name,
              reason: `${first.section} · ${first.reason}`,
              label: `Öva ${first.section}`,
              href: first.href,
            }
          : {
              title: 'Blandad övning',
              reason: 'Öva över alla åtta delprov.',
              label: 'Börja blandad övning',
              href: mixedHref,
            }
  return {
    state,
    dayZero,
    primary,
    sections,
    focus,
    traps,
    mixedHref,
    statusLine:
      state === 'error' ? RETRY_LINE : state === 'loading' ? 'Laddar dina framsteg…' : null,
    prognosis: {
      ...projected,
      scoreLabel: scoreLabel(projected.total),
      low:
        projected.total != null && projected.band != null
          ? Math.max(0, projected.total - projected.band)
          : null,
      high:
        projected.total != null && projected.band != null
          ? Math.min(2, projected.total + projected.band)
          : null,
      caveat: projectionBasis(bySection).total.calibrated ? null : CAVEAT,
      deltaLabel:
        delta?.kind === 'change'
          ? `${formatDeltaSv(delta.delta)} sedan förra veckan`
          : delta?.kind === 'stable'
            ? 'stabil, inom felmarginalen'
            : null,
    },
    weekSentence: data
      ? `${data.attempts.thisWeek} frågor den här veckan${data.accuracy7d == null ? '' : ` · ${Math.round(data.accuracy7d * 100)} % rätt`}.`
      : '',
    lifetime: data
      ? `${data.attempts.total} frågor totalt · ${data.attempts.today} idag · ${data.drills.thisWeek} pass denna vecka`
      : '',
    repetition: data?.mistakes ?? null,
    heat: heatDays(data?.attemptsDaily, now),
    weekly: data?.weekly ?? [],
    historyState: queryState(input.history),
    history: (input.history?.data ?? [])
      .filter((row) => row.kind === 'drill' || row.kind === 'adaptive_review')
      .slice(0, 5)
      .map((row) => ({
        id: row.id,
        label: passLabel(row),
        correct: row.correct,
        total: row.total,
        when: whenLabel(row.endedAt, now),
        href: `${row.kind === 'adaptive_review' ? '/repetition' : '/drill'}?done=${row.id}`,
      })),
  }
}
export type FramstegView = ReturnType<typeof buildFramstegView>
