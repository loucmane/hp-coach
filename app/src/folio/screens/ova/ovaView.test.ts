import { describe, expect, it } from 'vitest'
import type { TrapCatalog } from '@/data/frameworks'
import { SECTION_KEYS } from '@/data/questions'
import { PLAN_SCHEMA_VERSION, type PlanItem } from '@/lib/scheduler'
import { honestSectionScores, type SectionStats, scoreBand } from '@/lib/scoring'
import { buildOvaView, KVA_FALLBACK_TRAPS, type OvaInput } from './ovaView'

const now = new Date('2026-11-05T12:00:00Z')
const item: PlanItem = {
  id: 'lesson',
  kind: 'lesson',
  section: 'KVA',
  framework: 'KVA-TRAP-001',
  headline: 'ANSWER IN CACHED PLAN',
  rationale: 'ANSWER IN RATIONALE',
  estimatedMinutes: 4,
  href: '/lektion?section=KVA#KVA-TRAP-001',
  completed: false,
}
const catalog: TrapCatalog = {
  section: 'KVA',
  family: 'kva_traps',
  version: 1,
  authored_at: '',
  families: [{ name: 'Jämförelser' }],
  entries: ['001', '003', '005'].map((n) => ({
    id: `KVA-TRAP-${n}`,
    family: 'Jämförelser',
    question_title: `Vilken kvantitet är störst i ${n}?`,
    pattern_description: 'ANSWER IN TRAP',
    tldr: 'ANSWER IN TLDR',
    why_it_occurs: '',
    common_distractor_signature: '',
    countermeasure: '',
    example_questions: [],
  })),
}
const input = (overrides: Partial<OvaInput> = {}): OvaInput => ({
  stats: { data: { attempts: { total: 0 }, mistakes: { resolved: 0 }, bySection: {} } },
  due: { data: [] },
  pile: { data: [] },
  smartDrill: true,
  plan: {
    data: {
      version: PLAN_SCHEMA_VERSION,
      date: '2026-11-05',
      items: [{ ...item }],
      estimatedMinutes: 4,
    },
  },
  lesson: { data: { section: 'KVA', frameworkId: 'KVA-TRAP-001' } },
  reads: { data: new Set() },
  catalogs: { KVA: catalog },
  ...overrides,
})

describe('Ljusbord Öva view', () => {
  it('builds the lesson then family chain from the bookmark, plan and catalog', () => {
    const view = buildOvaView(input(), now)
    expect(view.lead.kind).toBe('lesson')
    expect(view.lead.href).toBe(item.href)
    expect(view.lead.steps).toHaveLength(2)
    expect(view.lead.steps[0]).toMatchObject({
      title: catalog.entries[0].question_title,
      minutes: 4,
      href: item.href,
    })
    expect(view.lead.family?.ids).toEqual(catalog.entries.map((e) => e.id))
    expect(view.lead.family?.title).toContain('Jämförelser')
    expect(JSON.stringify(view)).not.toMatch(/ANSWER|minut från slutet/)
  })
  it.each([
    5, 10, 20,
  ] as const)('makes the completed lesson a family drill with %i questions', (count) => {
    const view = buildOvaView(input({ reads: { data: new Set([item.framework!]) }, count }), now)
    expect(view.lead.kind).toBe('family')
    const url = new URL(view.lead.href!, 'https://local.test')
    expect(url.searchParams.get('traps')).toBe(catalog.entries.map((e) => e.id).join(','))
    expect(url.searchParams.get('count')).toBe(String(count))
    expect(url.searchParams.get('start')).toBe('1')
    expect(view.lead.family?.minutes).toBe((count * 6) / 10)
    expect(view.lead.steps).toHaveLength(0)
  })
  it('honors a completed plan lesson before the read set catches up', () => {
    const data = input()
    data.plan!.data!.items[0] = { ...item, completed: true }
    expect(buildOvaView(data, now).lead.kind).toBe('family')
    data.lesson = { data: null }
    expect(buildOvaView(data, now).lead.kind).toBe('family')
  })
  it('preserves the real plan drill destination and minutes without its cached teaching copy', () => {
    const data = input({ lesson: { data: null } })
    data.plan.data!.items = [
      {
        ...item,
        kind: 'drill',
        section: null,
        framework: undefined,
        href: '/diagnostik?start=1',
        estimatedMinutes: 12,
      },
    ]
    const view = buildOvaView(data, now)
    expect(view.lead.href).toBe('/diagnostik?start=1')
    expect(view.lead.label).toContain('12 min')
    expect(JSON.stringify(view)).not.toContain('ANSWER')
  })
  it('uses the explicit 001–012 fallback only for members of that KVA group', () => {
    const view = buildOvaView(input({ catalogs: {} }), now)
    expect(KVA_FALLBACK_TRAPS).toHaveLength(12)
    expect(view.lead.family?.ids).toEqual(KVA_FALLBACK_TRAPS)
    expect(view.lead.steps[0].title).toBe('Lektion · KVA')
    expect(JSON.stringify(view)).not.toContain('ANSWER')
    const outside = buildOvaView(
      input({ catalogs: {}, lesson: { data: { section: 'KVA', frameworkId: 'KVA-TRAP-020' } } }),
      now,
    )
    expect(outside.lead.family?.ids).toEqual(['KVA-TRAP-020'])
    expect(outside.lead.steps[0].minutes).toBeNull()
  })
  it('keeps due counts distinct from the waiting pile', () => {
    const rows = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ questionId: `2025-v-p1-KVA-${i + 1}` }))
    const view = buildOvaView(input({ due: { data: rows(17) }, pile: { data: rows(30) } }), now)
    expect(view.repetition).toMatchObject({
      dueNow: 17,
      round: 10,
      minutes: 8,
      href: '/repetition?start=1',
    })
    expect(view.lead.kind).toBe('lesson')
    expect(view.sections.find((s) => s.section === 'KVA')?.gain).toContain('17')
  })
  it('uses existing honest bands and first tries, preserving delprov order', () => {
    const sample: SectionStats = {
      attempts7d: 90,
      correct7d: 90,
      attempts7to14d: 0,
      correct7to14d: 0,
      attempts90d: 90,
      correct90d: 90,
      attemptsToday: 0,
      avgTimeMs: null,
      lastAttemptedAt: now.getTime(),
      firstTry7d: 10,
      firstTryCorrect7d: 2,
      firstTry7to14d: 0,
      firstTryCorrect7to14d: 0,
      firstTry90d: 10,
      firstTryCorrect90d: 2,
    }
    const bySection = { KVA: sample }
    const view = buildOvaView(
      input({ stats: { data: { attempts: { total: 90 }, mistakes: { resolved: 0 }, bySection } } }),
      now,
    )
    const score = honestSectionScores(bySection, now).find((s) => s.section === 'KVA')!
    const band = scoreBand(score.score, score.attempts90d)!
    expect(view.sections.map((s) => s.section)).toEqual(SECTION_KEYS)
    expect(view.sections.find((s) => s.section === 'KVA')).toMatchObject({
      attempts: 10,
      low: Math.max(0, score.score! - band),
      high: Math.min(2, score.score! + band),
    })
    expect(view.sections.find((s) => s.section === 'ORD')?.low).toBeNull()
  })
  it.each([
    'stats',
    'due',
    'pile',
    'plan',
    'lesson',
    'reads',
  ] as const)('keeps %s loading/errors honest and cached results usable', (key) => {
    expect(buildOvaView(input({ [key]: { isPending: true } }), now).lead.href).toBeNull()
    expect(buildOvaView(input({ [key]: { isError: true } }), now).state).toBe('error')
    const cached = input()
    expect(buildOvaView({ ...cached, [key]: { ...cached[key], isError: true } }, now).state).toBe(
      'ready',
    )
  })
  it('keeps an empty-data mixed start and legacy format entry points', () => {
    const view = buildOvaView(input({ plan: { data: null }, lesson: { data: null } }), now)
    expect(view.lead.href).toBe('/drill?mixed=1&start=1')
    expect(view.words.href).toBe('/drill?section=ORD&words=1&start=1')
    expect(view.timed.map((f) => f.href)).toEqual([
      '/drill?section=ORD&timed=1&start=1',
      '/drill?section=L%C3%84S&timed=1&start=1',
    ])
  })
})
