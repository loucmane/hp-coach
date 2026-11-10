import type { Mistake } from '@/api/hooks/useMistakes'
import type { Stats, WeeklyBucket } from '@/api/hooks/useStats'
import { SECTION_KEYS } from '@/data/questions'
import { DEFAULT_DRILL_LENGTH } from '@/lib/drill'
import { sectionOfQid } from '@/lib/dueBySection'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { repetitionCopy } from '@/lib/scheduler'
import {
  computeHonestProjected,
  firstTryStats,
  formatScoreSv,
  honestSectionScores,
  isoWeek,
  projectionBasis,
  rankWeakness,
  scoreBand,
  sectionBasis,
  VERBAL_SECTIONS,
  weeklyScore,
} from '@/lib/scoring'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { UHR_DELPROV } from '@/lib/uhrPacing'

type QueryState<T> = { data?: T; isPending?: boolean; isError?: boolean }
export type FramstegInput = {
  stats: QueryState<Stats>
  /** Recorded answers in the latest completed provpass of each half, oldest first. */
  sample?: QueryState<readonly { questionId: string; correct: boolean | null }[]>
  active?: QueryState<readonly Pick<Mistake, 'questionId'>[]>
  due?: QueryState<readonly Pick<Mistake, 'questionId'>[]>
}
export const FIRST_TRY_NOTE =
  'Prognosen räknar bara första försöket på varje fråga, inte repetitioner.'
const CAVEAT =
  'Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.'
export const RETRY_LINE = 'Gick inte att hämta just nu — försöker igen automatiskt.'
export const scoreLabel = formatScoreSv

// Match the shared displayed decimal, including binary half-ties.
const displayedTenths = (score: number) =>
  Math.round(Number(scoreLabel(score).replace(',', '.')) * 10)

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

/** Display precision must not turn nonzero uncertainty into a collapsed band. */
function range(score: number | null, band: number | null) {
  const low = score != null && band != null ? Math.max(0, score - Math.max(0.1, band)) : null
  const high = score != null && band != null ? Math.min(2, score + Math.max(0.1, band)) : null
  return {
    low,
    high,
    rangeLabel: low != null && high != null ? `${scoreLabel(low)}–${scoreLabel(high)}` : null,
  }
}

export function buildFramstegView(input: FramstegInput, now = new Date()) {
  const data = input.stats.data
  const state = data !== undefined ? 'ready' : input.stats.isError ? 'error' : 'loading'
  const bySection: Partial<Stats['bySection']> = data?.bySection ?? {}
  const scores = honestSectionScores(bySection, now)
  const projected = computeHonestProjected(bySection)
  const active = input.active?.data ? new Set(input.active.data.map((row) => row.questionId)) : null
  // A changed mock pick replaces the earlier pick, just as the submitted result does.
  const answered = new Map<string, boolean | null>()
  for (const answer of input.sample?.data ?? []) answered.set(answer.questionId, answer.correct)
  const sections = SECTION_KEYS.map((section) => {
    const raw = bySection[section]
    const counts = raw ? firstTryStats(raw) : null
    const attempts = counts?.attempts90d ?? 0
    const correct = counts?.correct90d ?? 0
    const tier = attempts === 0 ? 'empty' : attempts < 10 ? 'glimpse' : 'full'
    const score = scores.find((s) => s.section === section)?.score ?? null
    const band = tier === 'full' ? scoreBand(score, attempts) : null
    const dots =
      tier !== 'glimpse'
        ? []
        : [...answered].flatMap(([questionId, correct]) =>
            correct != null && sectionOfQid(questionId) === section
              ? [{ questionId, correct, returning: active?.has(questionId) ?? null }]
              : [],
          )
    return {
      section,
      name: sectionLongLabel(section),
      attempts,
      correct,
      tier,
      score,
      band,
      ...range(score, band),
      dots,
      marked: !!raw && !sectionBasis(raw).calibrated,
      href: `/lektion?section=${encodeURIComponent(section)}`,
    }
  })
  const evidence = {
    full: sections.filter((s) => s.tier === 'full').length,
    glimpse: sections.filter((s) => s.tier === 'glimpse').length,
    empty: sections.filter((s) => s.tier === 'empty').length,
    attempts: sections.reduce((sum, s) => sum + s.attempts, 0),
  }
  const dayZero = state === 'ready' && evidence.attempts === 0
  // Missing halves first, then untried coverage (largest exam share first),
  // then the thinnest sample. Only established evidence uses practice ranking.
  const missingHalf = projected.verbal == null ? 'verbal' : projected.quant == null ? 'quant' : null
  const candidates = sections.filter(
    (s) =>
      !missingHalf || (VERBAL_SECTIONS.includes(s.section) ? 'verbal' : 'quant') === missingHalf,
  )
  const untried = candidates
    .filter((s) => s.tier === 'empty')
    .sort((a, b) => UHR_DELPROV[b.section].questions - UHR_DELPROV[a.section].questions)[0]
  const thin = candidates
    .filter((s) => s.tier === 'glimpse' && s.attempts > 1)
    .sort((a, b) => a.attempts - b.attempts)[0]
  const practiced = rankWeakness(
    scores.filter((s) => sections.some((row) => row.section === s.section && row.tier === 'full')),
  )[0]
  const lever = untried ?? thin ?? sections.find((s) => s.section === practiced?.section)
  const primary =
    state !== 'ready'
      ? null
      : dayZero
        ? {
            section: null,
            label: 'Börja här · 10 frågor',
            href: '/diagnostik?start=1',
            reason: 'Svara på frågor i båda delarna, så får prognosen något att bygga på.',
          }
        : lever
          ? {
              section: lever.section,
              label: `${lever.tier === 'full' ? 'Öva' : 'Prova'} ${lever.section} · ${DEFAULT_DRILL_LENGTH} frågor, ca ${SECTION_DURATIONS[lever.section]} min`,
              href: `/drill?section=${encodeURIComponent(lever.section)}&start=1`,
              reason:
                lever.tier === 'empty'
                  ? `${lever.section} är ${UHR_DELPROV[lever.section].questions} av 40 frågor i ${VERBAL_SECTIONS.includes(lever.section) ? 'verbalpasset' : 'kvantpasset'} och helt oprovat.`
                  : `Fler ${lever.section}-frågor ger ett tydligare underlag.`,
            }
          : {
              section: null,
              label: `Blanda delprov · ${DEFAULT_DRILL_LENGTH} frågor`,
              href: '/drill?mixed=1&start=1',
              reason: 'Svara på frågor i båda delarna, så får prognosen något att bygga på.',
            }
  const dueCount = input.due?.data?.length ?? null
  const repetitionCount = dueCount == null ? null : Math.min(dueCount, REPETITION_SESSION_SIZE)
  return {
    state,
    dayZero,
    primary,
    sections,
    evidence,
    repetition: {
      count: repetitionCount,
      minutes: dueCount ? repetitionCopy(dueCount).estimatedMinutes : null,
      href: '/repetition',
    },
    statusLine:
      state === 'error' ? RETRY_LINE : state === 'loading' ? 'Laddar dina framsteg…' : null,
    prognosis: {
      ...projected,
      ...range(projected.total, projected.band),
      halfRanges: {
        verbal: range(projected.verbal, projected.verbalBand ?? null),
        quant: range(projected.quant, projected.quantBand ?? null),
      },
      scoreLabel: scoreLabel(projected.total),
      caveat: projectionBasis(bySection).total.calibrated ? null : CAVEAT,
    },
    weekly: data?.weekly ?? [],
  }
}
export type FramstegView = ReturnType<typeof buildFramstegView>
