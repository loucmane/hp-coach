import type { MockHalf, MockMode, MockResultRow } from '@/api/hooks/useMockResults'
import { findQuestion, type Question } from '@/data/questions'
import { sectionOfQid } from '@/lib/dueBySection'
import { formatPass, formatSitting } from '@/lib/examNames'
import type { PassOption } from '@/lib/mock'
import type { MockSheetState } from '@/lib/mockSheet'
import { type NormeringSitting, normedScore } from '@/lib/normering'
import { isCalibrated } from '@/lib/provenance'
import { formatScore } from '@/lib/scoring'
import type { TrapCluster } from '@/lib/trapCluster'
import { paceNote, uhrRank, uhrTimeMs } from '@/lib/uhrPacing'

export type NavigateHref = (href: string) => void
export type ResultFlags = { resultId: number; flagged: readonly string[] }
export type ResultsState = { data?: MockResultRow[]; isLoading?: boolean; isError?: boolean }
export const HALF_LABEL = { verbal: 'Verbal', kvant: 'Kvantitativ' }
export const RULES = [
  'Ingen paus.',
  'Du kan ändra svar tills tiden går ut.',
  'Avbryter du blir provet ogiltigt.',
  'Lämna ingen fråga obesvarad — fel ger inga avdrag.',
]
const QUOTAS = {
  verbal: [
    ['ORD', 10],
    ['LÄS', 10],
    ['MEK', 10],
    ['ELF', 10],
  ],
  kvant: [
    ['XYZ', 12],
    ['KVA', 10],
    ['NOG', 6],
    ['DTK', 12],
  ],
} as const
export const passKey = (p: PassOption) => `${p.examId}:${p.provpass}`
export const passName = (p: Pick<PassOption, 'examId' | 'provpass'>) =>
  `${formatSitting(p.examId)} · ${formatPass(p.provpass)}`
export const scoreText = (score: number | null) =>
  score == null ? '—' : formatScore(score).replace('.', ',')
export function formatMs(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
function timeOf(t: MockResultRow['createdAt']) {
  return typeof t === 'number' ? t : t == null ? 0 : Date.parse(t) || 0
}
export function recentResults(rows: readonly MockResultRow[]) {
  return [...rows].sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
}
export function historyLabel(row: MockResultRow) {
  const date = timeOf(row.createdAt)
  const when = date
    ? new Date(date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
    : '—'
  return { when, half: HALF_LABEL[row.half] }
}
function sittingOrder(id: string) {
  const m = /^(var|host)-(?:ver(\d+)-)?(\d{4})(?:-(\d+))?$/.exec(id)
  return m ? Number(m[3]) * 100 + (m[1] === 'host' ? 50 : 0) + Number(m[4] ?? m[2] ?? 0) : 0
}
export function buildHubView(input: {
  half: MockHalf
  mode: MockMode
  passes: readonly PassOption[]
  picked: string | null
}) {
  const passes = input.passes.filter((p) => p.half === input.half)
  const suggested = passes[0]
  const chosen = passes.find((p) => passKey(p) === input.picked) ?? suggested
  const bySitting = new Map<
    string,
    { examId: string; passes: [PassOption | undefined, PassOption | undefined] }
  >()
  for (const p of passes) {
    const sitting = bySitting.get(p.examId) ?? { examId: p.examId, passes: [undefined, undefined] }
    sitting.passes[p.provpass.endsWith('2') ? 1 : 0] = p
    bySitting.set(p.examId, sitting)
  }
  return {
    chosen,
    suggested,
    eyebrow: chosen === suggested ? 'Förslag · minst sett' : 'Valt pass',
    quota: `40 frågor · ${QUOTAS[input.half].map(([s, n]) => `${s} ${n}`).join(' · ')}`,
    note: input.mode === 'synthetic' ? 'Indikativt resultat — inte ett riktigt pass.' : null,
    sittings: [...bySitting.values()].sort(
      (a, b) => sittingOrder(b.examId) - sittingOrder(a.examId) || b.examId.localeCompare(a.examId),
    ),
  }
}
export type HubView = ReturnType<typeof buildHubView>
export function buildResultView({
  row,
  bank,
  answers,
  table,
  flags,
  cluster,
  frameworkName,
  history = [],
}: {
  row: MockResultRow
  bank: readonly Question[]
  answers: MockSheetState['answers']
  table?: NormeringSitting | null
  flags?: ResultFlags | null
  cluster?: TrapCluster | null
  frameworkName?: string | null
  history?: readonly MockResultRow[]
}) {
  const normed = normedScore(
    row.mode === 'authentic' ? table : null,
    row.half,
    row.correct,
    row.presented,
  )
  const official = normed.derived === 'official-derived'
  const missed = [...new Set(row.breakdown.missedQids)]
  const flaggedRight =
    flags?.resultId === row.id
      ? [...new Set(flags.flagged)].filter((qid) => {
          const q = findQuestion(bank, qid)
          return q && !missed.includes(qid) && answers.get(qid)?.letter === q.answer
        })
      : []
  const missCounts = new Map<string, number>()
  for (const qid of missed) {
    const section = findQuestion(bank, qid)?.section ?? sectionOfQid(qid)
    if (section) missCounts.set(section, (missCounts.get(section) ?? 0) + 1)
  }
  const sections = Object.entries(row.breakdown.perSection)
    .sort(([a], [b]) => uhrRank(a) - uhrRank(b) || a.localeCompare(b))
    .map(([section, s]) => {
      const uhrMs = uhrTimeMs(section, s.presented)
      const unvisited = s.timeMs === 0 && s.correct === 0 && !missCounts.has(section)
      return {
        section,
        ...s,
        uhrMs,
        unvisited,
        note: unvisited ? '—' : uhrMs == null ? '' : paceNote(s.timeMs, uhrMs),
      }
    })
  const sectionPattern = [...missCounts].sort(
    ([a, x], [b, y]) => y - x || uhrRank(a) - uhrRank(b),
  )[0]
  const pattern =
    cluster && missed.length > 0
      ? {
          title: 'Återkommande fälla',
          section: cluster.section,
          name: frameworkName ?? cluster.headline ?? cluster.framework_id,
          href: `/drill?section=${encodeURIComponent(cluster.section)}&framework=${encodeURIComponent(cluster.framework_id)}&start=1`,
        }
      : sectionPattern
        ? {
            title: 'Ett mönster att öva på',
            section: sectionPattern[0],
            name: `${sectionPattern[0]} · ${sectionPattern[1]} ${sectionPattern[1] === 1 ? 'miss' : 'missar'}`,
            href: `/drill?section=${encodeURIComponent(sectionPattern[0])}&start=1`,
          }
        : null
  return {
    score: normed.score,
    scoreLabel: official ? 'normerat (härlett) · av 2,0' : 'skattad poäng · av 2,0',
    footnote: official
      ? 'Härlett ur UHR:s normeringstabell för detta provtillfälle. UHR normerar hela delprovet (80 frågor) — ett provpass på 40 frågor har ingen officiell tabell, så poängen skalas upp och läses av tabellen.'
      : 'Linjär skattning — indikativ, inte UHR-normerad.',
    caveat: isCalibrated(row.estimateBasis)
      ? null
      : 'Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.',
    sections,
    missed,
    flaggedRight,
    pattern,
    blanks: Math.max(0, row.presented - row.answered),
    primaryHref: missed.length ? '/repetition' : '/prov',
    primaryLabel: missed.length ? 'Till Repetera' : 'Nytt provpass',
    history: recentResults(
      history.filter((r) => r.id !== row.id && r.half === row.half && r.mode === row.mode),
    ),
  }
}
