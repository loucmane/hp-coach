import { describe, expect, it } from 'vitest'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import type { Stats } from '@/api/hooks/useStats'
import { SECTION_KEYS } from '@/data/questions'
import { computeHonestProjected, type SectionStats } from '@/lib/scoring'
import { buildFramstegView, buildTrend, focusRankLine, scoreLabel } from './framstegView'

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
  it.each([
    'verbal',
    'quant',
  ] as const)('hides a %s half supported only by single answers, preserving the total and interval', (half) => {
    const data = stats({
      bySection: {
        ORD: section(),
        KVA: section(),
      } as Stats['bySection'],
    })
    const sparseSection = half === 'verbal' ? 'ORD' : 'KVA'
    data.bySection[sparseSection] = section({ firstTry90d: 1, firstTryCorrect90d: 1 })
    const projected = computeHonestProjected(data.bySection)
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.prognosis[half]).toBeNull()
    expect(view.prognosis[half === 'verbal' ? 'quant' : 'verbal']).toBeCloseTo(1.2)
    expect(view.prognosis.total).toBe(projected.total)
    expect(view.prognosis.band).toBe(projected.band)
    expect(view.prognosis.low).toBe(Math.max(0, projected.total! - projected.band!))
    expect(view.prognosis.high).toBe(Math.min(2, projected.total! + projected.band!))
  })
  it('requires a band in each half, not just two answers across different sections', () => {
    const oneAnswer = section({ firstTry90d: 1, firstTryCorrect90d: 1 })
    const data = stats({
      bySection: {
        ORD: oneAnswer,
        MEK: oneAnswer,
        XYZ: oneAnswer,
        KVA: oneAnswer,
      } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.prognosis).toMatchObject({ verbal: null, quant: null, total: 2 })
    expect(view.sections.every((s) => s.bandLabel == null)).toBe(true)
    data.bySection.KVA = section({ firstTry90d: 2, firstTryCorrect90d: 0 })
    const supported = buildFramstegView({ stats: { data } }, now)
    expect(supported.prognosis.verbal).toBeNull()
    expect(supported.prognosis.quant).toBe(0)
    expect(supported.sections.find((s) => s.section === 'KVA')?.bandLabel).not.toBeNull()
  })
  it.each([
    ['verbal', 'ORD', 'MEK', 'LÄS'],
    ['quant', 'XYZ', 'KVA', 'NOG'],
  ] as const)('averages only band-supported sections in a mixed %s half', (half, solid, thin, second) => {
    const data = stats({
      bySection: {
        ORD: section(),
        XYZ: section(),
        [thin]: section({ firstTry90d: 1, firstTryCorrect90d: 1 }),
      } as Stats['bySection'],
    })
    const projected = computeHonestProjected(data.bySection)
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.sections.find((s) => s.section === solid)?.score).toBe(1.2)
    expect(view.sections.find((s) => s.section === thin)?.bandLabel).toBeNull()
    expect(view.prognosis[half]).toBe(1.2)
    expect(view.prognosis.total).toBe(projected.total)
    expect(view.prognosis.band).toBe(projected.band)
    expect(view.prognosis.low).toBe(Math.max(0, projected.total! - projected.band!))
    expect(view.prognosis.high).toBe(Math.min(2, projected.total! + projected.band!))
    data.bySection[second] = section({ firstTry90d: 2, firstTryCorrect90d: 0 })
    const withSecond = buildFramstegView({ stats: { data } }, now)
    // A qualifying zero counts equally, even with fewer answers than the other section.
    expect(withSecond.prognosis[half]).toBe(0.6)
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
    expect(focusRankLine(0, 1)).toBe('Enda sektionen med en skattning')
    expect(focusRankLine(0, 2)).toBe('Lägsta sektionen just nu')
    expect(focusRankLine(1, 3)).toBe('Näst lägst just nu')
    const data = stats({ bySection: { ORD: section() } as Stats['bySection'] })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.focus[0].reason).not.toMatch(/lägst/i)
    expect(view.sections.filter((s) => s.score != null)).toHaveLength(1)
  })
  it.each([30, 50])('hides a verbal-only delta with %s recent correct answers', (correct) => {
    const data = stats({
      bySection: { ORD: section({ firstTryCorrect7d: correct }) } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.dayZero).toBe(true)
    expect(view.prognosis.total).toBeNull()
    expect(view.prognosis.deltaLabel).toBeNull()
  })
  it.each([
    { patch: { lastAttemptedAt: now.getTime() - 42 * 86400000 }, reason: /inte övad på 42 dagar/i },
    { patch: { firstTryCorrect7d: 10, firstTryCorrect7to14d: 40 }, reason: /på väg ner/i },
  ])('explains urgency instead of mislabelling a higher score as lowest: $reason', ({
    patch,
    reason,
  }) => {
    const data = stats({
      bySection: {
        ORD: section({ firstTryCorrect90d: 90, ...patch }),
        XYZ: section({ firstTryCorrect90d: 75 }),
      } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.sections.find((s) => s.section === 'ORD')?.scoreLabel).toBe('1,8')
    expect(view.sections.find((s) => s.section === 'XYZ')?.scoreLabel).toBe('1,5')
    expect(view.focus[0].section).toBe('ORD')
    expect(view.focus[0].reason).toMatch(reason)
    expect(view.primary?.reason).toMatch(reason)
    expect(view.focus[1].reason).not.toMatch(/näst lägst/i)
  })
  it('uses lowest and next-lowest only when recommendation order matches displayed scores', () => {
    const data = stats({
      bySection: {
        ORD: section({ firstTryCorrect90d: 90 }),
        XYZ: section({ firstTryCorrect90d: 75 }),
      } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.focus.map((s) => [s.section, s.reason])).toEqual([
      ['XYZ', 'Lägsta sektionen just nu'],
      ['ORD', 'Näst lägst just nu'],
    ])
    data.bySection.MEK = section({ firstTry90d: 2, firstTryCorrect90d: 0 })
    const withSparseLowerScore = buildFramstegView({ stats: { data } }, now)
    expect(withSparseLowerScore.focus[0].section).toBe('XYZ')
    expect(withSparseLowerScore.focus[0].reason).not.toMatch(/lägst/i)
  })
  describe.each(['upp', 'ner'] as const)('%s trend wording', (direction) => {
    it.each([
      [1, 1, false],
      [4, 5, false],
      [5, 4, false],
      [0, 5, false],
      [5, 0, false],
      [5, 5, true],
      [6, 5, true],
    ] as const)('requires both first-try weeks to qualify (%s, %s)', (recent, previous, eligible) => {
      const data = stats({
        bySection: {
          ORD: section({
            firstTry7d: recent,
            firstTryCorrect7d: direction === 'upp' ? recent : 0,
            firstTry7to14d: previous,
            firstTryCorrect7to14d: direction === 'ner' ? previous : 0,
          }),
          XYZ: section({ firstTryCorrect90d: 80 }),
        } as Stats['bySection'],
      })
      const view = buildFramstegView({ stats: { data } }, now)
      const row = view.sections.find((s) => s.section === 'ORD')!
      expect(row.trend).toBe(eligible ? direction : '—')
      expect(row.up.text).toBe(
        `Ett ORD-pass med fokus på missarna${eligible ? ` – trenden pekar ${direction}` : ''}.`,
      )
      if (eligible && direction === 'ner') {
        expect(view.primary?.reason).toBe('ORD · På väg ner')
      } else if (!eligible) {
        expect(view.primary?.reason).not.toMatch(/på väg (ner|upp)/i)
        expect(view.focus.every((s) => !/på väg (ner|upp)/i.test(s.reason))).toBe(true)
      }
    })
  })
  it.each([
    4, 5,
  ])('uses the legacy weekly counts when first-try fields are absent (%s)', (previous) => {
    const data = stats({
      bySection: {
        ORD: section({
          firstTry7d: undefined,
          firstTryCorrect7d: undefined,
          firstTry7to14d: undefined,
          firstTryCorrect7to14d: undefined,
          attempts7d: 5,
          correct7d: 0,
          attempts7to14d: previous,
          correct7to14d: previous,
        }),
        XYZ: section(),
      } as Stats['bySection'],
    })
    const row = buildFramstegView({ stats: { data } }, now).sections[0]
    expect(row.trend).toBe(previous === 5 ? 'ner' : '—')
  })
  it.each([
    0, 1,
  ])('does not present %s first tries as a scored section or ranked practice step', (n) => {
    const data = stats({
      bySection: {
        MEK: section({ firstTry90d: n, firstTryCorrect90d: n }),
        XYZ: section(),
      } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.sections.find((s) => s.section === 'MEK')).toMatchObject({
      score: null,
      scoreLabel: '—',
      bandLabel: null,
      attempts: n,
      up: { level: null, text: 'Fler MEK-frågor ger ett tydligare underlag.' },
    })
    expect(view.focus.map((s) => s.section)).toEqual(['XYZ'])
    expect(view.focus[0].reason).toBe('Enda sektionen med en skattning')
    if (!view.dayZero) expect(view.primary?.label).toBe('Öva XYZ')
  })
  it.each([
    [75, 75],
    [74, 76],
  ])('labels displayed ties as shared lowest (%s and %s correct)', (ord, xyz) => {
    const data = stats({
      bySection: {
        ORD: section({ firstTryCorrect90d: ord }),
        XYZ: section({ firstTryCorrect90d: xyz }),
      } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.sections.filter((s) => s.score != null).map((s) => s.scoreLabel)).toEqual([
      '1,5',
      '1,5',
    ])
    expect(view.focus.find((s) => s.section === 'ORD')?.reason).toBe('Lägst, tillsammans med XYZ')
    expect(view.focus.find((s) => s.section === 'XYZ')?.reason).toBe('Lägst, tillsammans med ORD')
    expect(view.primary?.reason).toMatch(/Lägst, tillsammans med/)
  })
  it('does not give distinct ranks to a tie above the lowest score', () => {
    const data = stats({
      bySection: {
        ORD: section({ firstTryCorrect90d: 50 }),
        MEK: section({ firstTryCorrect90d: 75 }),
        XYZ: section({ firstTryCorrect90d: 75 }),
      } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.focus[0].reason).toBe('Lägsta sektionen just nu')
    expect(view.focus.find((s) => s.section === 'MEK')?.reason).toBe('Samma nivå som XYZ')
    expect(view.focus.find((s) => s.section === 'XYZ')?.reason).toBe('Samma nivå som MEK')
  })
  it('includes tied scores outside the recommendation shortlist but excludes unscored sections', () => {
    const data = stats({
      bySection: {
        ORD: section(),
        LÄS: section(),
        MEK: section(),
        XYZ: section({ firstTry90d: 10, firstTryCorrect90d: 6 }),
        KVA: section({ firstTry90d: 1, firstTryCorrect90d: 1 }),
      } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.focus.map((s) => s.section)).toEqual(['ORD', 'LÄS', 'MEK'])
    expect(view.focus[0].reason).toBe('Lägst, tillsammans med LÄS, MEK och XYZ')
    expect(view.focus.every((s) => !/näst|tredje|KVA/i.test(s.reason))).toBe(true)
  })
  it('joins two tied peers with och in the lead and following steps', () => {
    const data = stats({
      bySection: { ORD: section(), LÄS: section(), XYZ: section() } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.primary?.reason).toBe('ORD · Lägst, tillsammans med LÄS och XYZ')
    expect(view.focus.map((s) => s.reason)).toEqual([
      'Lägst, tillsammans med LÄS och XYZ',
      'Lägst, tillsammans med ORD och XYZ',
      'Lägst, tillsammans med ORD och LÄS',
    ])
  })
  it('does not make a lead or following step out of single-answer sections', () => {
    const data = stats({
      bySection: {
        MEK: section({ firstTry90d: 1, firstTryCorrect90d: 0 }),
        XYZ: section({ firstTry90d: 1, firstTryCorrect90d: 1 }),
      } as Stats['bySection'],
    })
    const view = buildFramstegView({ stats: { data } }, now)
    expect(view.focus).toEqual([])
    expect(view.primary?.href).toBe('/drill?mixed=1&start=1')
  })
  it.each([0, 1, 2])('keeps a low-confidence score of %s out of the level promise', (score) => {
    const data = stats()
    data.bySection.ORD = section({ firstTry90d: 8, firstTryCorrect90d: score * 4 })
    const row = buildFramstegView({ stats: { data } }, now).sections[0]
    expect(row.score).toBe(score)
    expect(row.bandLabel).toMatch(/^±/)
    expect(row.up.level).toBeNull()
    expect(row.up.text).toBe('Fler ORD-frågor ger ett tydligare underlag.')
  })
  it.each([0, 0.95, 1])('keeps tiny displayed uncertainty nonzero at fraction %s', (fraction) => {
    const data = stats()
    for (const s of SECTION_KEYS)
      data.bySection[s] = section({ firstTry90d: 10000, firstTryCorrect90d: fraction * 10000 })
    const view = buildFramstegView({ stats: { data } }, now)
    for (const row of view.sections) expect(row.bandLabel).toBe('±0,1')
    expect(view.prognosis.band).toBeLessThan(0.05)
    expect(scoreLabel(view.prognosis.low)).not.toBe(scoreLabel(view.prognosis.high))
    expect(view.prognosis.low).toBeGreaterThanOrEqual(0)
    expect(view.prognosis.high).toBeLessThanOrEqual(2)
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

  it.each([
    ['ORD,MEK', 'ORD och MEK'],
    ['LÄS, MEK, XYZ', 'LÄS, MEK och XYZ'],
    ['ord,mek', 'ORD och MEK'],
    [' läs, MeK, xyz ', 'LÄS, MEK och XYZ'],
    ['elf', 'ELF'],
    ['ORD', 'ORD'],
    ['ORD · PÅ TID', 'ORD på tid'],
    ['ORD · ORDBANK', 'Ordbank'],
    ['ord · ordbank', 'Ordbank'],
    ['ar:LÄS:LÄS-TRAP-001', 'LÄS · repetition'],
    ['ORD, custom label', 'ORD, custom label'],
    [null, 'Övning'],
  ])('formats history section lists without changing special labels (%s)', (sections, label) => {
    const history: SessionHistoryRow[] = [
      {
        id: 1,
        kind: 'drill',
        sections,
        endedAt: '2026-10-22T10:00:00Z',
        total: 10,
        correct: 8,
      },
    ]
    expect(
      buildFramstegView({ stats: { data: stats() }, history: { data: history } }, now).history[0]
        .label,
    ).toBe(label)
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
