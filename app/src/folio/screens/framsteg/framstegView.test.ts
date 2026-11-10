import { describe, expect, it } from 'vitest'
import type { Stats } from '@/api/hooks/useStats'
import { SECTION_KEYS } from '@/data/questions'
import { repetitionCopy } from '@/lib/scheduler'
import { computeHonestProjected, formatScoreSv, type SectionStats, scoreBand } from '@/lib/scoring'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'
import { buildFramstegView, buildTrend } from './framstegView'

const now = new Date('2026-11-05T12:00:00Z')
const section = (n = 20, correct = 12): SectionStats => ({
  attempts7d: 100,
  correct7d: 90,
  attempts7to14d: 100,
  correct7to14d: 90,
  attempts90d: 200,
  correct90d: 180,
  attemptsToday: 0,
  avgTimeMs: null,
  lastAttemptedAt: now.getTime(),
  firstTry90d: n,
  firstTryCorrect90d: correct,
  firstTry7d: 10,
  firstTryCorrect7d: 6,
  firstTry7to14d: 10,
  firstTryCorrect7to14d: 6,
})
const stats = (bySection = Object.fromEntries(SECTION_KEYS.map((s) => [s, section()]))): Stats => ({
  attempts: { total: 200, today: 10, thisWeek: 40 },
  drills: { total: 20, thisWeek: 4 },
  mistakes: { due: 3, active: 5, resolved: 8 },
  accuracy7d: 0.75,
  streakDays: 99,
  bySection: bySection as Stats['bySection'],
  weekly: [],
})

describe('Ljusbord Framsteg view', () => {
  it.each([
    0, 1, 2, 9, 10, 30,
  ])('keeps the shared half means and total with %s first tries', (n) => {
    const data = stats({ ORD: section(20, 12), MEK: section(n, n), KVA: section(10, 2) })
    const expected = computeHonestProjected(data.bySection)
    const p = buildFramstegView({ stats: { data } }, now).prognosis
    expect(p).toMatchObject(expected)
    expect((p.verbal! + p.quant!) / 2).toBe(p.total)
    expect(p.low).toBe(Math.max(0, p.total! - Math.max(0.1, expected.band!)))
    expect(p.high).toBe(Math.min(2, p.total! + Math.max(0.1, expected.band!)))
  })
  it('builds each half range from its own shared uncertainty, preserving the total', () => {
    const data = stats({ ORD: section(20, 12), MEK: section(3, 2), KVA: section(40, 10) })
    const shared = computeHonestProjected(data.bySection)
    const p = buildFramstegView({ stats: { data } }, now).prognosis
    expect(shared.verbalBand).not.toBe(shared.quantBand)
    for (const half of ['verbal', 'quant'] as const) {
      const band = shared[`${half}Band`]!
      expect(band).toBeGreaterThan(0.1)
      expect(p.halfRanges[half]).toEqual({
        low: shared[half]! - band,
        high: shared[half]! + band,
        rangeLabel: `${formatScoreSv(shared[half]! - band)}–${formatScoreSv(shared[half]! + band)}`,
      })
    }
    expect(p).toMatchObject(shared)
    expect((p.verbal! + p.quant!) / 2).toBe(p.total)
  })
  it.each([0, 20])('clamps both half ranges at the scale edges (%s correct)', (correct) => {
    const data = stats({ ORD: section(20, correct), KVA: section(20, correct) })
    const p = buildFramstegView({ stats: { data } }, now).prognosis
    for (const half of ['verbal', 'quant'] as const) {
      const range = p.halfRanges[half]
      expect(range.low).toBe(Math.max(0, p[half]! - p[`${half}Band`]!))
      expect(range.high).toBe(Math.min(2, p[half]! + p[`${half}Band`]!))
      expect(correct === 0 ? range.low : range.high).toBe(correct === 0 ? 0 : 2)
      expect(range.low).toBeLessThan(range.high!)
    }
  })
  it.each(['verbal', 'quant'] as const)('does not invent a range for an absent %s half', (half) => {
    const data = stats(half === 'verbal' ? { KVA: section() } : { ORD: section() })
    const p = buildFramstegView({ stats: { data } }, now).prognosis
    expect(p[`${half}Band`]).toBeNull()
    expect(p.halfRanges[half]).toEqual({ low: null, high: null, rangeLabel: null })
    expect(p.rangeLabel).toBeNull()
    const present = half === 'verbal' ? 'quant' : 'verbal'
    expect(p.halfRanges[present].rangeLabel).not.toBeNull()
  })
  it('uses the same rounding and minimum display width for halves and total', () => {
    const data = stats(Object.fromEntries(SECTION_KEYS.map((s) => [s, section(10000, 5750)])))
    const p = buildFramstegView({ stats: { data } }, now).prognosis
    expect(p.scoreLabel).toBe('1,1')
    for (const range of [p, p.halfRanges.verbal, p.halfRanges.quant]) {
      expect(range.low).toBeCloseTo(1.05)
      expect(range.high).toBe(1.25)
      // Use the shared binary-decimal rounding, not a separate half formatter.
      expect(range.rangeLabel).toBe('1,0–1,3')
    }
  })
  it.each([
    [0, 'empty'],
    [1, 'glimpse'],
    [9, 'glimpse'],
    [10, 'full'],
    [29, 'full'],
    [30, 'full'],
  ] as const)('uses first-try evidence: %s is %s despite 200 repeated attempts', (n, tier) => {
    const row = buildFramstegView(
      { stats: { data: stats({ ORD: section(n, n), KVA: section() }) } },
      now,
    ).sections[0]
    expect(row).toMatchObject({ attempts: n, correct: n, tier })
    if (n < 10) {
      expect(row.band).toBeNull()
      expect(row.rangeLabel).toBeNull()
    } else {
      expect(row.band).toBe(scoreBand(2, n))
      expect(row.low).toBeGreaterThanOrEqual(0)
      expect(row.high).toBe(2)
    }
  })
  it('preserves the shared older-worker fallback', () => {
    const old = section()
    delete old.firstTry90d
    delete old.firstTryCorrect90d
    const row = buildFramstegView({ stats: { data: stats({ ORD: old }) } }, now).sections[0]
    expect(row).toMatchObject({ attempts: 200, correct: 180, tier: 'full' })
  })
  it('chooses the largest untried delprov, deterministically, without predicting a gain', () => {
    const data = stats({ ORD: section(), KVA: section(10, 1), LÄS: section(3, 2) })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.primary).toMatchObject({
      section: 'XYZ',
      label: `Prova XYZ · 10 frågor, ca ${SECTION_DURATIONS.XYZ} min`,
      href: '/drill?section=XYZ&start=1',
    })
    expect(view.primary?.reason).toBe('XYZ är 12 av 40 frågor i kvantpasset och helt oprovat.')
    expect(view.primary?.reason).not.toMatch(/mest|poäng|→/)
    expect(view.evidence).toEqual({ full: 2, glimpse: 1, empty: 5, attempts: 33 })
  })
  it('fills the missing half first', () => {
    const view = buildFramstegView(
      { stats: { data: stats({ XYZ: section(), KVA: section() }) } },
      now,
    )
    expect(view.prognosis).toMatchObject({ verbal: null, quant: 1.2, total: null })
    expect(view.primary).toMatchObject({
      section: 'ORD',
      label: `Prova ORD · 10 frågor, ca ${SECTION_DURATIONS.ORD} min`,
    })
  })
  it('chooses thin evidence next, then observed practice signals once all qualify', () => {
    const data = stats()
    data.bySection.ORD = section(9, 4)
    data.bySection.MEK = section(2, 0)
    expect(buildFramstegView({ stats: { data } }, now).primary?.section).toBe('MEK')
    data.bySection.ORD = section()
    data.bySection.MEK = section()
    data.bySection.KVA = section(30, 3)
    expect(buildFramstegView({ stats: { data } }, now).primary).toMatchObject({
      section: 'KVA',
      label: `Öva KVA · 10 frågor, ca ${SECTION_DURATIONS.KVA} min`,
      href: '/drill?section=KVA&start=1',
    })
  })
  it('keeps empty, loading, error and cached data states distinct', () => {
    expect(buildFramstegView({ stats: { isPending: true } }, now)).toMatchObject({
      state: 'loading',
      primary: null,
    })
    expect(buildFramstegView({ stats: { isError: true } }, now)).toMatchObject({
      state: 'error',
      primary: null,
    })
    const empty = buildFramstegView({ stats: { data: stats({}) } }, now)
    expect(empty).toMatchObject({ dayZero: true, primary: { href: '/diagnostik?start=1' } })
    expect(empty.sections.every((s) => s.tier === 'empty' && s.dots.length === 0)).toBe(true)
    expect(empty.prognosis).toMatchObject({ total: null, verbal: null, quant: null, band: null })
    expect(buildFramstegView({ stats: { data: stats(), isError: true } }, now).state).toBe('ready')
  })
  it('uses real answered provpass questions and the active queue for rings', () => {
    const view = buildFramstegView(
      {
        stats: { data: stats({ LÄS: section(3, 2), KVA: section() }) },
        sample: {
          data: [
            { questionId: '2024v-1-LÄS-1', correct: false },
            { questionId: '2024v-1-LÄS-1', correct: true },
            { questionId: '2024v-1-LÄS-2', correct: false },
            { questionId: '2024v-1-LÄS-3', correct: true },
            { questionId: '2024v-1-LÄS-4', correct: null },
            { questionId: '2024v-1-LÄS-5', correct: true },
            { questionId: '2024v-1-LÄS-5', correct: null },
            { questionId: 'unknown', correct: true },
          ],
        },
        active: { data: [{ questionId: '2024v-1-LÄS-2' }, { questionId: '2024v-1-LÄS-3' }] },
      },
      now,
    )
    const row = view.sections.find((s) => s.section === 'LÄS')!
    expect(row.dots).toEqual([
      { questionId: '2024v-1-LÄS-1', correct: true, returning: false },
      { questionId: '2024v-1-LÄS-2', correct: false, returning: true },
      { questionId: '2024v-1-LÄS-3', correct: true, returning: true },
    ])
    expect(row).toMatchObject({ correct: 2, attempts: 3, band: null })
  })
  it('never manufactures dots or treats unknown queue state as a return', () => {
    const data = stats({ LÄS: section(3, 2) })
    expect(buildFramstegView({ stats: { data } }, now).sections[1].dots).toEqual([])
    const withSample = buildFramstegView(
      { stats: { data }, sample: { data: [{ questionId: '2024v-1-LÄS-1', correct: false }] } },
      now,
    ).sections[1]
    expect(withSample.dots[0].returning).toBeNull()
  })
  it.each([0, 0.95, 1])('keeps displayed uncertainty nonzero at fraction %s', (fraction) => {
    const data = stats(
      Object.fromEntries(SECTION_KEYS.map((s) => [s, section(10000, fraction * 10000)])),
    )
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.prognosis.low).toBeLessThan(view.prognosis.high!)
    for (const row of view.sections) {
      expect(row.low).toBeLessThan(row.high!)
      expect(row.rangeLabel?.split('–')[0]).not.toBe(row.rangeLabel?.split('–')[1])
    }
  })
  it('marks synthetic evidence on the affected section', () => {
    const data = stats()
    data.bySection.XYZ.estimateBasis = { authentic: 190, synthetic: 10, calibrated: false }
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.prognosis.caveat).toMatch(/inte är kalibrerad/)
    expect(view.sections.filter((s) => s.marked).map((s) => s.section)).toEqual(['XYZ'])
    delete data.bySection.XYZ.estimateBasis
    expect(buildFramstegView({ stats: { data } }, now).prognosis.caveat).toBeNull()
  })
  it('preserves weekly input and trend output, including gaps and phone geometry', () => {
    const data = stats()
    data.weekly = [0.5, null, 0.7].map((fraction, i) => ({
      weekStart: Date.UTC(2026, 9, 5 + i * 7),
      attempts: fraction == null ? 0 : 10,
      correct: fraction == null ? 0 : fraction * 10,
    }))
    expect(buildFramstegView({ stats: { data } }, now).weekly).toBe(data.weekly)
    const chart = buildTrend(data.weekly)
    expect(chart).toMatchObject({
      ready: true,
      width: 640,
      height: 220,
      solid: [],
      bridges: ['M36.0,131.3 L576.0,84.4'],
      summary: 'Från 1,0 i vecka 41 till 1,4 i vecka 43 – upp 0,4.',
    })
    expect(chart.points.map((p) => p.score)).toEqual([1, null, 1.4])
    expect(buildTrend(data.weekly, true)).toMatchObject({ width: 350, height: 200 })
    expect(buildTrend([]).ready).toBe(false)
    expect(buildTrend(data.weekly.slice(0, 1)).ready).toBe(false)
  })

  it('uses first tries consistently in the total, halves, section scores and bands', () => {
    const view = buildFramstegView({ stats: { data: stats() } }, now)
    expect(view.prognosis).toMatchObject({ total: 1.2, verbal: 1.2, quant: 1.2, scoreLabel: '1,2' })
    for (const row of view.sections) {
      expect(row).toMatchObject({ score: 1.2, attempts: 20, correct: 12 })
      expect(row.band).toBe(scoreBand(1.2, 20))
      expect(row.low).toBeCloseTo(1.2 - scoreBand(1.2, 20)!)
      expect(row.high).toBeCloseTo(1.2 + scoreBand(1.2, 20)!)
    }
  })
  it.each([0, 20])('clamps total and section ranges at the scale edges (%s correct)', (correct) => {
    const data = stats(Object.fromEntries(SECTION_KEYS.map((s) => [s, section(20, correct)])))
    const view = buildFramstegView({ stats: { data } }, now)
    for (const band of [view.prognosis, ...view.sections]) {
      expect(band.low).toBeGreaterThanOrEqual(0)
      expect(band.high).toBeLessThanOrEqual(2)
      expect(correct === 0 ? band.low : band.high).toBe(correct === 0 ? 0 : 2)
    }
  })
  it.each(SECTION_KEYS)('never makes a single-answer %s the lever', (single) => {
    const data = stats()
    data.bySection[single] = section(1, 0)
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.primary?.section).not.toBe(single)
    expect(view.primary).not.toBeNull()
    expect(view.sections.find((s) => s.section === single)).toMatchObject({
      tier: 'glimpse',
      band: null,
      rangeLabel: null,
    })
  })
  it('uses a mixed start when every section has just one answer', () => {
    const data = stats(Object.fromEntries(SECTION_KEYS.map((s) => [s, section(1, 0)])))
    expect(buildFramstegView({ stats: { data } }, now).primary).toMatchObject({
      section: null,
      href: '/drill?mixed=1&start=1',
    })
  })
  it.each([
    [75, 75],
    [74, 76],
  ])('keeps displayed ties neutral (%s and %s correct)', (ord, xyz) => {
    const data = stats()
    data.bySection.ORD = section(100, ord)
    data.bySection.XYZ = section(100, xyz)
    const view = buildFramstegView({ stats: { data } }, now)
    expect(formatScoreSv(view.sections.find((s) => s.section === 'ORD')!.score)).toBe('1,5')
    expect(formatScoreSv(view.sections.find((s) => s.section === 'XYZ')!.score)).toBe('1,5')
    expect(view.primary?.reason).not.toMatch(/lägst|näst|tredje|mest|sämst/i)
  })
  it('uses neutral comparison language for single, tied and stale evidence', () => {
    for (const keys of [['ORD'], ['ORD', 'XYZ'], ['ORD', 'LÄS', 'MEK', 'XYZ']] as const) {
      const data = stats(
        Object.fromEntries(
          keys.map((s) => [s, { ...section(), lastAttemptedAt: now.getTime() - 42 * 86400000 }]),
        ),
      )
      const view = buildFramstegView({ stats: { data } }, now)
      expect(view.primary?.reason).not.toMatch(/lägst|näst|tredje|mest|på väg ner|borde/i)
    }
  })
  it.each([
    ['verbal', 'MEK'],
    ['quant', 'KVA'],
  ] as const)('retains every shared section contribution in a mixed %s half', (half, single) => {
    const data = stats()
    data.bySection[single] = section(1, 1)
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.prognosis[half]).toBeCloseTo(1.4)
    expect(view.prognosis.total).toBeCloseTo(1.3)
    expect((view.prognosis.verbal! + view.prognosis.quant!) / 2).toBe(view.prognosis.total)
    expect(view.sections.find((s) => s.section === single)?.rangeLabel).toBeNull()
  })
  it('does not mislabel a higher stale recommendation as lowest', () => {
    const data = stats()
    data.bySection.ORD = { ...section(100, 90), lastAttemptedAt: now.getTime() - 42 * 86400000 }
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.primary?.section).toBe('ORD')
    expect(view.primary?.reason).not.toMatch(/lägst|sämst|på väg ner|borde/)
  })
  it.each([0, 1, 2])('keeps a thin score of %s out of a range or level promise', (score) => {
    const data = stats()
    data.bySection.ORD = section(8, score * 4)
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.sections[0]).toMatchObject({ score, band: null, rangeLabel: null, tier: 'glimpse' })
    expect(view.primary?.reason).not.toMatch(/Håll|öka|poäng/)
  })
  it('does not promise a zero-sized next level for a score that rounds to 2,0', () => {
    const data = stats()
    data.bySection.ORD = section(100, 98)
    const view = buildFramstegView({ stats: { data } }, now)
    expect(formatScoreSv(view.sections[0].score)).toBe('2,0')
    expect(view.primary?.reason).not.toMatch(/Håll|öka|→|2,0/)
  })
  it.each([
    0, 1, 9, 10, 15,
  ])('sizes repetition from the ready queue (%s), not the active pile', (n) => {
    const view = buildFramstegView(
      {
        stats: { data: stats() },
        due: {
          data: Array.from({ length: n }, (_, i) => ({ questionId: `2024v-1-ORD-${i + 1}` })),
        },
      },
      now,
    )
    expect(view.repetition.count).toBe(Math.min(10, n))
    expect(view.repetition.minutes).toBe(n ? repetitionCopy(n).estimatedMinutes : null)
    expect(view.repetition.href).toBe('/repetition')
  })
  it('does not invent a repetition size while the ready queue is absent', () => {
    expect(
      buildFramstegView({ stats: { data: stats() }, due: { isPending: true } }, now).repetition,
    ).toMatchObject({ count: null, minutes: null })
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
})
