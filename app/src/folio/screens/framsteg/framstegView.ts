import type { Mistake } from '@/api/hooks/useMistakes'
import type { Stats } from '@/api/hooks/useStats'
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
  type SectionStats,
  scoreBand,
  sectionBasis,
  VERBAL_SECTIONS,
} from '@/lib/scoring'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { UHR_DELPROV } from '@/lib/uhrPacing'

type QueryState<T> = { data?: T; isPending?: boolean; isError?: boolean }
export type PrognosisWeek = {
  iso: string
  end: string
  bySection: Partial<
    Record<
      (typeof SECTION_KEYS)[number],
      Required<
        Pick<
          SectionStats,
          | 'firstTry90d'
          | 'firstTryCorrect90d'
          | 'firstTry7d'
          | 'firstTryCorrect7d'
          | 'firstTry7to14d'
          | 'firstTryCorrect7to14d'
        >
      >
    >
  >
}
export type FramstegInput = {
  stats: QueryState<Stats>
  weekly?: QueryState<readonly PrognosisWeek[]>
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

/** Weekly snapshots use the exact headline scorer and display range. */
export function buildTrend(
  weekly: readonly PrognosisWeek[],
  headline?: Partial<Stats['bySection']>,
  now = new Date(),
) {
  const thursday = new Date(now)
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7))
  const currentIso = `${thursday.getUTCFullYear()}-W${String(isoWeek(now)).padStart(2, '0')}`
  const weeks = weekly
    .filter((w) => w.iso <= currentIso)
    .map((w) => {
      const current = w.iso === currentIso
      // The endpoint provides only first-try counts. The neutral ancillary fields
      // satisfy SectionStats; firstTryStats supplies every score input unchanged.
      const snapshot: Partial<Stats['bySection']> = Object.fromEntries(
        Object.entries(w.bySection).map(([key, counts]) => [
          key,
          {
            attempts90d: 0,
            correct90d: 0,
            attempts7d: 0,
            correct7d: 0,
            attempts7to14d: 0,
            correct7to14d: 0,
            attemptsToday: 0,
            avgTimeMs: null,
            lastAttemptedAt: null,
            ...counts,
          },
        ]),
      )
      // Independent queries can refresh in either order. The current column is
      // the same estimate the student is reading at the top of this render.
      const bySection = current && headline !== undefined ? headline : snapshot
      const projected = computeHonestProjected(bySection)
      const band = range(projected.total, projected.band)
      const hasEvidence = Object.values(bySection).some((s) => firstTryStats(s).attempts90d > 0)
      const state = band.rangeLabel ? 'scored' : hasEvidence ? 'thin' : 'empty'
      return {
        iso: w.iso,
        week: Number(w.iso.slice(-2)),
        current,
        state,
        ...band,
        label: band.rangeLabel ?? (hasEvidence ? 'för lite underlag' : 'inget underlag'),
        bottom: band.low == null ? null : band.low * 50,
        height: band.low == null || band.high == null ? null : (band.high - band.low) * 50,
      }
    })
  const scored = weeks.filter((w) => w.low != null && w.high != null)
  const first = scored[0]
  const last = scored[scored.length - 1]
  const width = (w: typeof first) => displayedTenths(w.high!) - displayedTenths(w.low!)
  const summary =
    scored.length < 2
      ? null
      : `${width(last) < width(first) ? 'Intervallet har smalnat från' : 'Intervallet var'} ${first.rangeLabel} ${width(last) < width(first) ? 'till' : 'och är'} ${last.rangeLabel} mellan vecka ${first.week} och vecka ${last.week}.`
  return { weeks, summary }
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
    weekly: {
      ...buildTrend(input.weekly?.data ?? [], data?.bySection, now),
      statusLine: input.weekly?.isError
        ? RETRY_LINE
        : input.weekly?.data === undefined
          ? 'Laddar veckornas intervall…'
          : null,
    },
  }
}
export type FramstegView = ReturnType<typeof buildFramstegView>
