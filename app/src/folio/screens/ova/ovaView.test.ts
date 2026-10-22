import { describe, expect, it } from 'vitest'
import { SECTION_KEYS } from '@/data/questions'
import { DEFAULT_DRILL_LENGTH } from '@/lib/drill'
import { ORD_ROUND_SIZE } from '@/lib/ordWords'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { repetitionCopy } from '@/lib/scheduler'
import { honestSectionScores, rankWeakness, type SectionStats } from '@/lib/scoring'
import { timedDrill } from '@/lib/timedDrill'
import { buildOvaView, type OvaInput } from './ovaView'

const now = new Date(2026, 9, 22, 10)
const section = (attempts: number, correct: number): SectionStats => ({
  attempts7d: 100,
  correct7d: 100,
  attempts7to14d: 0,
  correct7to14d: 0,
  attempts90d: 100,
  correct90d: 100,
  attemptsToday: 0,
  avgTimeMs: null,
  lastAttemptedAt: now.getTime(),
  firstTry7d: attempts,
  firstTryCorrect7d: correct,
  firstTry7to14d: 0,
  firstTryCorrect7to14d: 0,
  firstTry90d: attempts,
  firstTryCorrect90d: correct,
})
const rows = (s: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({ questionId: `2025-v-p1-${s}-${i + 1}` }))
const input = (overrides: Partial<OvaInput> = {}): OvaInput => ({
  stats: { data: { attempts: { total: 0 }, mistakes: { resolved: 0 }, bySection: {} } },
  pile: { data: [] },
  due: { data: [] },
  smartDrill: true,
  ...overrides,
})

describe('Folio Öva view', () => {
  it('keeps all eight sections in exam order with honest null, zero and low scores', () => {
    const view = buildOvaView(
      input({
        stats: {
          data: {
            attempts: { total: 100 },
            mistakes: { resolved: 0 },
            bySection: { KVA: section(20, 0), ORD: section(3, 1), LÄS: section(0, 0) },
          },
        },
      }),
      now,
    )
    expect(view.sections.map((s) => s.section)).toEqual(SECTION_KEYS)
    expect(view.sections[0]).toMatchObject({ score: 2 / 3, confidence: 'low', attempts: 3 })
    expect(view.sections[1].score).toBeNull()
    expect(view.sections[2].score).toBeNull()
    expect(view.sections[5]).toMatchObject({ score: 0, confidence: 'medium', attempts: 20 })
    expect(view.scoreless).toBe(true)
  })

  it('agrees with the Idag first-try suggestion without reordering sections', () => {
    const bySection = { KVA: section(20, 4), ORD: section(25, 20), NOG: section(3, 0) }
    const view = buildOvaView(
      input({
        stats: {
          data: {
            attempts: { total: 200 },
            mistakes: { resolved: 0 },
            bySection,
          },
        },
      }),
      now,
    )
    expect(view.suggested).toBe(rankWeakness(honestSectionScores(bySection, now))[0].section)
    expect(view.suggested).toBe('KVA')
    expect(view.lead).toMatchObject({ kind: 'section', href: '/drill?section=KVA&start=1' })
    expect(view.sections.map((s) => s.section)).toEqual(SECTION_KEYS)
    expect(view.standfirst).toContain('Schemat föreslår KVA just nu')
  })

  it('separates pile from due per section and caps the playable round', () => {
    const view = buildOvaView(
      input({
        pile: { data: [...rows('ORD', 15), ...rows('LÄS', 3)] },
        due: { data: [...rows('ORD', 12), ...rows('LÄS', 1)] },
      }),
      now,
    )
    expect(view.sections[0]).toMatchObject({ waiting: 15, dueNow: 12 })
    expect(view.sections[1]).toMatchObject({ waiting: 3, dueNow: 1 })
    expect(view.repetition).toMatchObject({
      pile: 18,
      dueNow: 13,
      round: REPETITION_SESSION_SIZE,
      minutes: repetitionCopy(13).estimatedMinutes,
      href: '/repetition?start=1',
    })
    expect(view.lead.kind).toBe('repetera')
    expect(view.lead.title).toBe('10 av 13 missar, ungefär 8 minuter')
    expect(view.lead.detail).not.toMatch(/senare idag/)
  })

  it('uses singular copy for one due miss', () => {
    const view = buildOvaView(
      input({ pile: { data: rows('ORD', 1) }, due: { data: rows('ORD', 1) } }),
      now,
    )
    expect(view.lead.title).toBe('1 miss, ungefär 1 minut')
  })

  it('offers mixed practice and an overview link with nothing due', () => {
    const view = buildOvaView(input(), now)
    expect(view.lead).toMatchObject({ kind: 'mixed', href: '/drill?mixed=1&start=1' })
    expect(view.mixed.questions).toBe(DEFAULT_DRILL_LENGTH)
    expect(view.repetition.href).toBe('/repetition')
    expect(view.dayZero).toBe(true)
    expect(view.relearned).toBe(false)
    expect(view.queueLine).toContain('Inga missar än')
  })

  it('distinguishes relearned, untouched and waiting queues', () => {
    const stats = { data: { attempts: { total: 15 }, mistakes: { resolved: 2 }, bySection: {} } }
    const relearned = buildOvaView(input({ stats }), now)
    expect(relearned.relearned).toBe(true)
    expect(relearned.dayZero).toBe(false)
    expect(relearned.queueLine).toContain('återlärt')
    const waiting = buildOvaView(input({ stats, pile: { data: rows('KVA', 2) } }), now)
    expect(waiting.relearned).toBe(false)
    expect(waiting.queueLine).toContain('2 missar')
    expect(waiting.queueLine).not.toContain('återlärt')
    expect(waiting.repetition.href).toBe('/repetition')
    expect(
      buildOvaView(input({ stats: { data: { ...stats.data, mistakes: { resolved: 0 } } } }), now)
        .queueLine,
    ).not.toContain('återlärt')
  })

  it.each(['stats', 'pile', 'due'] as const)('keeps a missing %s query unknown', (key) => {
    const pending = buildOvaView(input({ [key]: { isPending: true } }), now)
    expect(pending.state).toBe('loading')
    expect(pending.queueLine).toBeNull()
    const failed = buildOvaView(input({ [key]: { isError: true } }), now)
    expect(failed.state).toBe('error')
    expect(failed.statusLine).toBe('Gick inte att hämta just nu — försöker igen automatiskt.')
    expect(failed.queueLine).toBeNull()
  })

  it('does not invent section counts when only one queue resolves', () => {
    const view = buildOvaView(
      input({ pile: { isError: true }, due: { data: rows('ORD', 1) } }),
      now,
    )
    expect(view.sections[0]).toMatchObject({ waiting: null, dueNow: 1 })
    expect(view.repetition.pile).toBeNull()
    expect(view.lead.kind).toBe('repetera')
  })

  it('derives word-bank size and timed counts and minutes from live constants', () => {
    const view = buildOvaView(input(), now)
    expect(view.words).toEqual({
      label: `Ordbank · ${ORD_ROUND_SIZE} ord`,
      href: '/drill?section=ORD&words=1&start=1',
    })
    expect(view.timed.map((t) => t.minutes)).toEqual([3, 9])
    for (const link of view.timed) {
      const spec = timedDrill(link.section)
      expect(link.count).toBe(spec?.count)
      expect(link.minutes).toBe(Math.round((spec?.budgetMs ?? 0) / 60_000))
      expect(link.href).toBe(`/drill?section=${encodeURIComponent(link.section)}&timed=1&start=1`)
    }
  })

  it('names the rising trap and links directly to its section and framework', () => {
    const view = buildOvaView(
      input({
        topTraps: [
          {
            framework_id: 'NOG-TRAP-001',
            section: 'NOG',
            count: 5,
            headline: null,
            trend: { kind: 'unknown' },
          },
          {
            framework_id: 'KVA-TRAP-001',
            section: 'KVA',
            count: 3,
            headline: 'Pröva flera värden.',
            trend: { kind: 'delta', delta: 2, daysAgo: 7 },
          },
        ],
        trapNames: { 'KVA-TRAP-001': 'Teckenbyte' },
      }),
      now,
    )
    expect(view.trap).toMatchObject({
      name: 'Teckenbyte',
      rising: true,
      count: 3,
      href: '/drill?section=KVA&framework=KVA-TRAP-001&start=1',
    })
  })
})
