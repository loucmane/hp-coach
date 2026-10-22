import { describe, expect, it } from 'vitest'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import type { Stats } from '@/api/hooks/useStats'
import { SECTION_KEYS } from '@/data/questions'
import type { SectionStats } from '@/lib/scoring'
import { buildFramstegView, buildTrend, focusRankLine } from './framstegView'

const now = new Date('2026-10-22T12:00:00Z')
const section = (patch: Partial<SectionStats> = {}): SectionStats => ({
  attempts7d: 100,
  correct7d: 90,
  attempts7to14d: 100,
  correct7to14d: 90,
  attempts90d: 200,
  correct90d: 180,
  attemptsToday: 0,
  avgTimeMs: null,
  lastAttemptedAt: now.getTime(),
  firstTry90d: 100,
  firstTryCorrect90d: 60,
  firstTry7d: 50,
  firstTryCorrect7d: 30,
  firstTry7to14d: 50,
  firstTryCorrect7to14d: 30,
  ...patch,
})
const stats = (patch: Partial<Stats> = {}): Stats => ({
  attempts: { total: 200, today: 10, thisWeek: 40 },
  drills: { total: 20, thisWeek: 4 },
  mistakes: { due: 3, active: 5, resolved: 8 },
  accuracy7d: 0.75,
  streakDays: 99,
  bySection: Object.fromEntries(SECTION_KEYS.map((s) => [s, section()])) as Stats['bySection'],
  weekly: [],
  ...patch,
})

describe('Framsteg real-data view', () => {
  it('uses first tries consistently in the total, halves, section scores and bands', () => {
    const view = buildFramstegView({ stats: { data: stats() } }, now)
    expect(view.prognosis.total).toBeCloseTo(1.2)
    expect(view.prognosis.verbal).toBeCloseTo(1.2)
    expect(view.prognosis.quant).toBeCloseTo(1.2)
    expect(view.prognosis.low).toBeLessThan(1.2)
    expect(view.prognosis.high).toBeGreaterThan(1.2)
    expect(view.prognosis.scoreLabel).toBe('1,2')
    expect(view.sections[0]).toMatchObject({ scoreLabel: '1,2', attempts: 100, bandLabel: '±0,2' })
    expect(view.weekSentence).toBe('40 frågor den här veckan · 75 % rätt.')
    expect(view.lifetime).toBe('200 frågor totalt · 10 idag · 4 pass denna vecka')
  })
  it.each([0, 100])('clamps a score range at the scale edges (%s correct)', (correct) => {
    const data = stats()
    for (const s of SECTION_KEYS) data.bySection[s] = section({ firstTryCorrect90d: correct })
    const p = buildFramstegView({ stats: { data } }, now).prognosis
    expect(p.low).toBeGreaterThanOrEqual(0)
    expect(p.high).toBeLessThanOrEqual(2)
    expect(correct === 0 ? p.low : p.high).toBe(correct === 0 ? 0 : 2)
  })
  it('names a stable delta without a figure and prints only a significant change', () => {
    const data = stats()
    expect(buildFramstegView({ stats: { data } }, now).prognosis.deltaLabel).toBe(
      'stabil, inom felmarginalen',
    )
    for (const s of SECTION_KEYS) data.bySection[s].firstTryCorrect7d = 50
    expect(buildFramstegView({ stats: { data } }, now).prognosis.deltaLabel).toBe(
      '+0,8 sedan förra veckan',
    )
    for (const s of SECTION_KEYS) data.bySection[s].firstTryCorrect7d = 0
    expect(buildFramstegView({ stats: { data } }, now).prognosis.deltaLabel).toBe(
      '−1,2 sedan förra veckan',
    )
  })
  it('marks provenance on the actual affected section, including quant', () => {
    const data = stats()
    data.bySection.XYZ.estimateBasis = { authentic: 190, synthetic: 10, calibrated: false }
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.prognosis.caveat).toMatch(/inte är kalibrerad/)
    expect(view.sections.filter((s) => s.marked).map((s) => s.section)).toEqual(['XYZ'])
    delete data.bySection.XYZ.estimateBasis
    expect(buildFramstegView({ stats: { data } }, now).prognosis.caveat).toBeNull()
  })
  it('keeps absent data distinct from an account without a prognosis', () => {
    expect(buildFramstegView({ stats: { isPending: true } }, now)).toMatchObject({
      state: 'loading',
      dayZero: false,
      primary: null,
    })
    expect(buildFramstegView({ stats: { isError: true } }, now)).toMatchObject({
      state: 'error',
      dayZero: false,
      primary: null,
    })
    const view = buildFramstegView(
      { stats: { data: stats({ bySection: {} as Stats['bySection'] }) } },
      now,
    )
    expect(view).toMatchObject({
      state: 'ready',
      dayZero: true,
      primary: { href: '/diagnostik?start=1', label: 'Börja här · 10 frågor' },
    })
    expect(buildFramstegView({ stats: { isError: true, data: stats() } }, now).state).toBe('ready')
  })
  it('uses comparison language only with more than one scored section', () => {
    expect(focusRankLine(0, 0)).not.toMatch(/lägst/i)
    expect(focusRankLine(0, 1)).toBe('Enda sektionen med försök hittills')
    expect(focusRankLine(0, 2)).toBe('Lägsta sektionen just nu')
    expect(focusRankLine(1, 3)).toBe('Näst lägst just nu')
    const data = stats({ bySection: { ORD: section() } as Stats['bySection'] })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.focus[0].reason).not.toMatch(/lägst/i)
    expect(view.sections.filter((s) => s.score != null)).toHaveLength(1)
  })
  it('routes up-steps by first-round, stale, trap, due and practice priority', () => {
    const data = stats()
    data.bySection.ORD.firstTry90d = 0
    data.bySection.MEK.lastAttemptedAt = now.getTime() - 20 * 86400000
    const view = buildFramstegView(
      {
        stats: { data },
        due: { data: [{ questionId: '2024v-1-XYZ-1' }] },
        topTraps: [
          {
            framework_id: 'LAS-TYPE-001',
            section: 'LÄS',
            count: 1,
            headline: null,
            trend: { kind: 'unknown' },
          },
        ],
        trapNames: { 'LAS-TYPE-001': 'Detaljer' },
      },
      now,
    )
    expect(view.sections.find((s) => s.section === 'ORD')?.up.href).toBe(
      '/drill?section=ORD&start=1',
    )
    expect(view.sections.find((s) => s.section === 'MEK')?.staleLabel).toBe('20 dagar sedan')
    expect(view.sections.find((s) => s.section === 'LÄS')?.up.href).toBe(
      '/drill?section=L%C3%84S&framework=LAS-TYPE-001&start=1',
    )
    expect(view.sections.find((s) => s.section === 'XYZ')?.up.href).toBe(
      '/repetition?section=XYZ&start=1',
    )
    expect(view.sections.find((s) => s.section === 'KVA')?.up.href).toBe(
      '/drill?section=KVA&start=1',
    )
    expect(view.mixedHref).toBe('/drill?mixed=1&start=1')
    expect(view.traps[0].countLabel).toBe('1 gång')
  })
  it('builds an 84-day calendar with three heat levels and no streak data', () => {
    const data = stats({
      attemptsDaily: [
        { date: '2026-10-20', n: 1, verbal: 1, quant: 0 },
        { date: '2026-10-21', n: 4, verbal: 2, quant: 2 },
        { date: '2026-10-22', n: 12, verbal: 6, quant: 6 },
      ],
    })
    const heat = buildFramstegView({ stats: { data } }, now).heat
    expect(heat).toHaveLength(84)
    expect(heat?.slice(-4).map((d) => d.level)).toEqual([0, 1, 1, 2])
    expect(heat?.[83]).toMatchObject({ date: '2026-10-22', n: 12, verbal: 6, quant: 6 })
    expect(buildFramstegView({ stats: { data: stats() } }, now).heat).toBeNull()
  })
  it('filters history before taking five, using production labels and destinations', () => {
    const history: SessionHistoryRow[] = [
      'mock',
      'lesson',
      'adaptive_review',
      'drill',
      'drill',
      'drill',
      'drill',
      'drill',
    ].map((kind, i) => ({
      id: i + 1,
      kind: kind as SessionHistoryRow['kind'],
      sections: i === 3 ? 'ORD' : null,
      endedAt: '2026-10-22T10:00:00Z',
      total: 10,
      correct: 8,
    }))
    const rows = buildFramstegView(
      { stats: { data: stats() }, history: { data: history } },
      now,
    ).history
    expect(rows).toHaveLength(5)
    expect(rows[0]).toMatchObject({ label: 'Repetition', href: '/repetition?done=3', when: 'Idag' })
    expect(rows[1]).toMatchObject({ label: 'ORD', href: '/drill?done=4' })
    expect(
      buildFramstegView({ stats: { data: stats() }, history: { isPending: true } }, now)
        .historyState,
    ).toBe('loading')
  })
  it('shows a chart after two scored weeks, breaking runs over missing weeks', () => {
    const buckets = [null, 0.5, 0.6, null, 0.8, null].map((fraction, i) => ({
      weekStart: Date.UTC(2026, 8, 7 + i * 7),
      attempts: fraction == null ? 0 : 10,
      correct: fraction == null ? 0 : fraction * 10,
    }))
    const chart = buildTrend(buckets)
    expect(chart.ready).toBe(true)
    expect(chart.solid).toHaveLength(1)
    expect(chart.bridges).toHaveLength(1)
    expect(chart.summary).toMatch(/Från 1,0.*till 1,6.*upp 0,6/)
    expect(chart.points.map((p) => p.score)).toEqual([null, 1, 1.2, null, 1.6, null])
    expect(buildTrend(buckets.slice(0, 2)).ready).toBe(false)
    expect(buildTrend([]).ready).toBe(false)
  })

  it('describes chart changes using the same rounded numbers the reader sees', () => {
    const chart = buildTrend([
      { weekStart: Date.UTC(2026, 9, 5), attempts: 40, correct: 23 },
      { weekStart: Date.UTC(2026, 9, 12), attempts: 40, correct: 24 },
    ])
    expect(chart.summary).toMatch(/Från 1,1.*till 1,2.*upp 0,1/)
  })

  it('does not offer a zero-sized step when a near-perfect score prints as 2,0', () => {
    const data = stats()
    data.bySection.ORD.firstTryCorrect90d = 98
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.sections[0].scoreLabel).toBe('2,0')
    expect(view.sections[0].up.level).toBe('Håll 2,0')
  })
})
