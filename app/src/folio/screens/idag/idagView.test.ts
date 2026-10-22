import { describe, expect, it } from 'vitest'
import type { FormattedResumption } from '@/components/home/useResumptionCandidate'
import { PLAN_SCHEMA_VERSION, type PlanItem } from '@/lib/scheduler'
import { buildIdagView, daySteps, nextUp, shortItem, tomorrowLine } from './idagView'

const now = new Date(2026, 9, 22, 9)
const item: PlanItem = {
  id: 'drill-ORD',
  kind: 'drill',
  section: 'ORD',
  headline: 'ORD-övning · 10 frågor · blandat',
  rationale: 'Träna på orden.',
  estimatedMinutes: 8,
  href: '/drill?section=ORD',
  completed: false,
}
const plan = {
  version: PLAN_SCHEMA_VERSION,
  date: '2026-10-22',
  items: [item],
  estimatedMinutes: 8,
}
const resume: FormattedResumption = {
  subject: 'ORD-övning',
  progress: 'vid fråga 3 av 10',
  href: '/drill?section=ORD&qid=one',
  headline: 'ORD-övning · pausad',
  relativeLabel: 'Idag · 07:52',
  device: 'phone',
  deviceLabel: 'telefon',
  freshAt: now.getTime(),
  stale: false,
}
const base = { plan, now, allComplete: false, examDate: new Date(2027, 3, 10), daysLeft: 170 }

describe('buildIdagView', () => {
  it('splits only the first headline separator and retains the live plan contract', () => {
    const view = buildIdagView(base)
    expect(view.plan.items[0]).toMatchObject({
      title: 'ORD-övning',
      detail: '10 frågor · blandat',
      minutes: 8,
      href: item.href,
      kind: 'drill',
      completed: false,
    })
    expect(plan.items[0]).toEqual(item)
    expect(view.today.greeting).toBe('God morgon')
    expect(view.today.dateLabel).toMatch(/22 oktober/)
  })
  it.each([0, 1, 18])('uses the live repetition count %s with neutral copy', (dueCount) => {
    const view = buildIdagView({
      ...base,
      dueCount,
      pileCount: 24,
      plan: {
        ...plan,
        items: [
          {
            ...item,
            id: 'rep',
            kind: 'repetition',
            headline: 'Repetition · 50 missar',
            rationale: 'förlorar effekt',
            href: '/repetition',
          },
        ],
      },
    })
    const row = view.plan.items[0]
    expect(row.rationale).not.toMatch(/förlorar/)
    expect(row.completed).toBe(dueCount === 0)
    expect(row.detail).toBe(
      dueCount === 0 ? 'Kön är tom just nu' : `${Math.min(dueCount, 10)} av 24 missar`,
    )
    expect(row.minutes).toBe(dueCount === 0 ? 0 : Math.ceil(Math.min(dueCount, 10) * 0.75))
  })
  it('neutralizes cached repetition copy even while live counts load', () => {
    const view = buildIdagView({
      ...base,
      plan: { ...plan, items: [{ ...item, kind: 'repetition', rationale: 'förlorar effekt' }] },
    })
    expect(view.plan.items[0].rationale).toBe('De äldsta missarna först.')
  })
  it('mock links open the picker without a prescribed/start bypass', () => {
    const view = buildIdagView({
      ...base,
      plan: {
        ...plan,
        items: [
          {
            ...item,
            kind: 'mock',
            headline: 'Provpass · Kvant',
            href: '/prov?half=kvant&prescribed=1&start=1',
          },
        ],
      },
    })
    expect(view.plan.items[0].href).toBe('/prov?half=kvant')
  })
  it.each([
    ['cold-today', 'cold'],
    ['onboarding-today', 'onboarding'],
  ])('recognizes %s', (id, state) => {
    expect(buildIdagView({ ...base, plan: { ...plan, items: [{ ...item, id }] } }).state).toBe(
      state,
    )
  })
  it('does not call an unresolved or empty plan complete', () => {
    expect(buildIdagView({ ...base, plan: null }).state).toBe('loading')
    expect(buildIdagView({ ...base, plan: null, planError: true }).state).toBe('error')
    expect(buildIdagView({ ...base, plan: { ...plan, items: [] } }).state).toBe('empty')
    expect(buildIdagView({ ...base, planError: true }).state).toBe('active')
  })
  it('parses question progress and carries device, age and original destination', () => {
    expect(buildIdagView({ ...base, resume }).resume).toMatchObject({
      title: 'ORD-övning',
      position: 3,
      total: 10,
      answered: 2,
      pausedAt: 'Idag · 07:52',
      device: 'telefon',
      stale: false,
      href: resume.href,
    })
  })
  it('leaves lesson positions absent and retains the lesson anchor', () => {
    const lesson = {
      ...resume,
      subject: 'XYZ-lektion',
      progress: 'vid XYZ-TRAP-016',
      href: '/lektion?section=XYZ#XYZ-TRAP-016',
      stale: true,
    }
    const result = buildIdagView({ ...base, resume: lesson }).resume
    expect(result?.position).toBeUndefined()
    expect(result?.total).toBeUndefined()
    expect(result?.href).toBe(lesson.href)
    expect(result?.stale).toBe(true)
  })
  it.each([
    'vid fråga 0 av 10',
    'vid fråga 11 av 10',
    'vid fråga x av 10',
  ])('does not invent progress from %s', (progress) => {
    expect(
      buildIdagView({ ...base, resume: { ...resume, progress } }).resume?.position,
    ).toBeUndefined()
  })
  it.each([0.1, 1.9])('clamps the honest prognosis band at %s', (total) => {
    const p = buildIdagView({
      ...base,
      projected: { total, verbal: total, quant: total, band: 0.4 },
    }).prognosis
    expect(p.low).toBe(Math.max(0, total - 0.4))
    expect(p.high).toBe(Math.min(2, total + 0.4))
  })
  it('keeps an uncalibrated prognosis caveat', () => {
    const view = buildIdagView({
      ...base,
      bySection: {
        LÄS: { attempts90d: 1, estimateBasis: { authentic: 0, synthetic: 1, calibrated: false } },
      } as never,
    })
    expect(view.prognosis.caveat).toBe(
      'Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.',
    )
    expect(buildIdagView(base).prognosis.caveat).toBeNull()
  })
  it.each([
    [{ kind: 'stable', band: 0.2 }, 'stabil, inom felmarginalen'],
    [{ kind: 'change', band: 0.1, delta: -0.2 }, '−0,2 sedan förra veckan'],
    [{ kind: 'change', band: 0.1, delta: 0.2 }, '+0,2 sedan förra veckan'],
    [null, null],
  ])('maps honest delta %j', (projectedDelta, expected) => {
    expect(
      buildIdagView({ ...base, projectedDelta: projectedDelta as never }).prognosis.deltaLabel,
    ).toBe(expected)
  })
  it('uses history labels, limits recent passes and routes repetition results', () => {
    const history = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      kind: i === 0 ? 'adaptive_review' : 'drill',
      sections: 'ORD',
      endedAt: now.toISOString(),
      total: 10,
      correct: 7,
    }))
    const view = buildIdagView({ ...base, history: history as never })
    expect(view.recent).toHaveLength(3)
    expect(view.recent[0]).toMatchObject({ label: 'Rep', href: '/repetition?done=0', when: 'Idag' })
    expect(view.recent[1].href).toBe('/drill?done=1')
  })
  it('resolves traps from headwords with id fallback and a neutral rising marker', () => {
    const traps = [
      {
        framework_id: 'NOG-TRAP-007',
        section: 'NOG',
        count: 4,
        headline: 'Ett mönster',
        trend: { kind: 'delta', delta: 2 },
      },
    ]
    const view = buildIdagView({
      ...base,
      topTraps: traps as never,
      trapNames: { 'NOG-TRAP-007': 'Var för sig' },
    })
    expect(view.traps[0]).toMatchObject({
      name: 'Var för sig',
      rising: true,
      href: '/drill?framework=NOG-TRAP-007',
    })
    expect(buildIdagView({ ...base, topTraps: traps as never }).traps[0].name).toBe('NOG-TRAP-007')
  })
  it('counts unique active UTC days Monday through today without a goal or streak', () => {
    const attemptsDaily = ['2026-10-18', '2026-10-19', '2026-10-22', '2026-10-23'].map((date) => ({
      date,
      n: 1,
      verbal: 1,
      quant: 0,
    }))
    expect(buildIdagView({ ...base, attemptsDaily, minutesToday: 9 }).week).toEqual({
      minutesToday: 9,
      daysPractised: 2,
    })
  })
})

describe('day recommendations', () => {
  it('orders completed steps, resume, then open steps, all with destinations', () => {
    const view = buildIdagView({
      ...base,
      resume,
      plan: { ...plan, items: [item, { ...item, id: 'done', completed: true }] },
    })
    expect(daySteps(view).map((s) => [s.key, s.state, s.href])).toEqual([
      ['done', 'done', item.href],
      ['resume', 'now', resume.href],
      [item.id, 'next', item.href],
    ])
  })
  it('prioritizes a capped ready repetition round, then weakest, then Öva', () => {
    expect(nextUp(buildIdagView({ ...base, dueCount: 20 }))).toMatchObject({
      label: 'Repetera 10 missar · 8 min',
      href: '/repetition?start=1',
    })
    expect(nextUp({ ...buildIdagView(base), weakest: 'NOG' })).toMatchObject({
      href: '/drill?section=NOG',
      label: 'Öva NOG',
    })
    expect(nextUp(buildIdagView(base)).href).toBe('/ova')
  })
  it('uses known tomorrow review dates and never promises an undated queue', () => {
    const pile = [
      { questionId: 'ORD-one', nextReviewAt: new Date(2026, 9, 23, 9).toISOString() },
      { questionId: 'ORD-two', nextReviewAt: new Date(2026, 9, 25, 9).getTime() },
    ]
    expect(tomorrowLine(buildIdagView({ ...base, pileMistakes: pile }))).toBe(
      'I morgon börjar du med: Repetera 1 miss · 1 min',
    )
    expect(tomorrowLine(buildIdagView({ ...base, pileCount: 7 }))).toBeNull()
  })
  it('offers the shortest open item fitting five minutes, but never a completed one', () => {
    const view = buildIdagView({
      ...base,
      plan: {
        ...plan,
        items: [
          item,
          { ...item, id: 'quick', estimatedMinutes: 4 },
          { ...item, id: 'done', estimatedMinutes: 1, completed: true },
        ],
      },
    })
    expect(shortItem(view)).toMatchObject({ minutes: 4, href: item.href })
    expect(shortItem(buildIdagView({ ...base, allComplete: true }))).toBeNull()
    expect(
      shortItem(
        buildIdagView({ ...base, plan: { ...plan, items: [{ ...item, estimatedMinutes: 4 }] } }),
      ),
    ).toBeNull()
  })
  it('cuts a repetition lead to a real ready section that fits five minutes', () => {
    const dueMistakes = Array.from({ length: 4 }, (_, i) => ({
      questionId: `2024-spring-ORD-${i}`,
      nextReviewAt: null,
    }))
    const view = buildIdagView({
      ...base,
      dueCount: 20,
      dueMistakes,
      plan: { ...plan, items: [{ ...item, kind: 'repetition', href: '/repetition' }] },
    })
    expect(shortItem(view)).toMatchObject({ minutes: 3, href: '/repetition?start=1&section=ORD' })
  })
})
