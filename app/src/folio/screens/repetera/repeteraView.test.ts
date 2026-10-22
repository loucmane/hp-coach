import { describe, expect, it } from 'vitest'
import type { Mistake } from '@/api/hooks/useMistakes'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { Stats } from '@/api/hooks/useStats'
import type { Question } from '@/data/questions'
import { buildRepeteraView, dueLabel, questionStem } from './repeteraView'

const now = new Date(2026, 9, 22, 12)
function miss(id: number, section = 'ORD', next: Date | null = null): Mistake {
  return {
    id,
    userId: 1,
    questionId: `2026-test-${section}-${id}`,
    layer1Ids: ['do-not-reveal'],
    status: 'active',
    errorCount7d: 2,
    lastErrorAt: null,
    nextReviewAt: next?.getTime() ?? null,
  }
}
const session: ActiveSession = {
  id: 42,
  userId: 1,
  kind: 'adaptive_review',
  sections: 'alla',
  position: 1,
  currentQuestionId: 'q2',
  plan: ['q1~1', 'q2~2', 'q3~3'],
  device: null,
  startedAt: null,
  endedAt: null,
}

describe('Repetera view', () => {
  it('preserves due order, unions an independently cached pile and omits trap data', () => {
    const due = [miss(3, 'LÄS'), miss(1)]
    const later = miss(2, 'MEK', new Date(2026, 9, 22, 14))
    const view = buildRepeteraView({ now, dueMistakes: due, pileMistakes: [later, due[1]] })
    expect(view.items.map((i) => i.mistakeId)).toEqual([3, 1, 2])
    expect(view.items.map((i) => i.dueNow)).toEqual([true, true, false])
    expect(view.ready).toBe(2)
    expect(view.pile).toBe(3)
    expect(JSON.stringify(view)).not.toContain('do-not-reveal')
    expect(due.map((i) => i.id)).toEqual([3, 1])
  })

  it('counts per section in exam order and keeps future days out of later-today counts', () => {
    const view = buildRepeteraView({
      now,
      dueMistakes: [miss(1, 'KVA'), miss(2)],
      pileMistakes: [
        miss(3, 'KVA', new Date(2026, 9, 22, 16)),
        miss(4, 'MEK', new Date(2026, 9, 23, 8)),
      ],
    })
    expect(
      view.queue.map(({ section, ready, laterToday, laterDays }) => ({
        section,
        ready,
        laterToday,
        laterDays,
      })),
    ).toEqual([
      { section: 'ORD', ready: 1, laterToday: 0, laterDays: 0 },
      { section: 'MEK', ready: 0, laterToday: 0, laterDays: 1 },
      { section: 'KVA', ready: 1, laterToday: 1, laterDays: 0 },
    ])
    expect(view.queue[0].href).toBe('/repetition?start=1&section=ORD')
    expect(view.queue[1].href).toBe('/repetition?section=MEK')
    expect(view.laterToday.map((i) => i.mistakeId)).toEqual([3])
    expect(view.laterDays.map((i) => i.mistakeId)).toEqual([4])
  })

  it('caps the round at ten without capping the ready count', () => {
    const view = buildRepeteraView({
      now,
      dueMistakes: Array.from({ length: 14 }, (_, i) => miss(i)),
    })
    expect(view.ready).toBe(14)
    expect(view.round).toBe(10)
    expect(view.minutes).toBeGreaterThan(0)
    expect(view.primary.href).toBe('/repetition?start=1')
  })

  it('resumes only a matching, unfinished and locally live round', () => {
    const input = { now, dueMistakes: [miss(1)], roundSession: session }
    expect(buildRepeteraView(input).resume).toEqual({ position: 2, total: 3 })
    expect(buildRepeteraView(input).primary.label).toBe('Fortsätt omgången · fråga 2 av 3')
    expect(buildRepeteraView({ ...input, section: 'ORD' }).resume).toBeNull()
    expect(buildRepeteraView({ ...input, roundEnded: true }).resume).toBeNull()
    expect(
      buildRepeteraView({ ...input, roundSession: { ...session, endedAt: 'today' } }).resume,
    ).toBeNull()
    expect(
      buildRepeteraView({ ...input, roundSession: { ...session, position: 3 } }).resume,
    ).toBeNull()
    expect(
      buildRepeteraView({ ...input, section: 'ORD', roundSession: { ...session, sections: 'ORD' } })
        .primary.href,
    ).toBe('/repetition?start=1&section=ORD')
  })

  it('does not treat a pending or failed due read as an empty queue', () => {
    expect(buildRepeteraView({ now }).state).toBe('loading')
    expect(buildRepeteraView({ now, dueError: true }).state).toBe('error')
    expect(buildRepeteraView({ now, dueError: true }).primary.href).toBeNull()
    expect(buildRepeteraView({ now, dueMistakes: [] }).state).toBe('empty')
    expect(buildRepeteraView({ now, dueMistakes: [], pileMistakes: [miss(2)] }).ready).toBe(0)
  })

  it('waits for stats before using the planning fallback for an empty pile', () => {
    const input = { now, dueMistakes: [], pileMistakes: [] }
    expect(buildRepeteraView(input).emptyLine).toBe('')
    const stats = {
      attempts: { total: 20 },
      mistakes: { active: 3, resolved: 4 },
      bySection: {},
    } as Stats
    expect(buildRepeteraView({ ...input, stats }).emptyLine).toBe(
      'Inget är redo just nu – nästa repetition följer din planering.',
    )
  })

  it('uses a bank section when available, and never invents ORD for an unknown qid', () => {
    const row = { ...miss(1), questionId: 'old-item' }
    expect(buildRepeteraView({ now, dueMistakes: [row] }).queue).toEqual([])
    expect(buildRepeteraView({ now, dueMistakes: [row] }).items[0].stem).toBe('Fråga')
    const bank = [{ qid: row.questionId, section: 'NOG', prompt: 'Vad är x?' }] as Question[]
    const view = buildRepeteraView({ now, dueMistakes: [row], bank })
    expect(view.queue[0].section).toBe('NOG')
    expect(view.items[0].stem).toBe('Vad är x?')
  })

  it('suggests the weakest measured section instead of a hardcoded ORD drill', () => {
    const stats = {
      bySection: {
        KVA: {
          attempts7d: 12,
          correct7d: 3,
          attempts7to14d: 0,
          correct7to14d: 0,
          attempts90d: 12,
          correct90d: 3,
          avgTimeMs: 60_000,
          lastAttemptedAt: now.getTime(),
          attemptsToday: 2,
        },
      },
    } as Stats
    expect(buildRepeteraView({ now, dueMistakes: [], stats }).primary).toMatchObject({
      href: '/drill?section=KVA&start=1',
      label: 'Börja en övning i KVA',
      fallback: true,
    })
    expect(buildRepeteraView({ now, dueMistakes: [], section: 'MEK', stats }).primary.href).toBe(
      '/drill?section=MEK&start=1',
    )
  })
})

describe('due labels use local calendar boundaries', () => {
  it.each([
    [null, 'nu'],
    [now.getTime(), 'nu'],
    [new Date(2026, 9, 22, 23, 59).getTime(), 'senare idag'],
    [new Date(2026, 9, 23, 0).toISOString(), 'imorgon'],
    [new Date(2026, 9, 25, 8).getTime(), 'om 3 dagar'],
  ])('%s → %s', (at, label) => expect(dueLabel(at, now)).toBe(label))

  it('counts calendar days across the autumn clock change', () => {
    expect(dueLabel(new Date(2026, 9, 26, 8).getTime(), new Date(2026, 9, 24, 23))).toBe(
      'om 2 dagar',
    )
  })
  it('does not emit NaN for an invalid persisted date', () => {
    expect(dueLabel('not a date', now)).toBe('tid ej tillgänglig')
  })
})

describe('question stems', () => {
  it.each([null, '', ' \n '])('labels a blank ELF stem (%s) as a cloze gap', (prompt) => {
    expect(questionStem({ section: 'ELF', number: 34, prompt })).toBe('Lucka 34')
  })
  it.each([null, '', ' \n '])('labels other blank stems (%s) by question number', (prompt) => {
    expect(questionStem({ section: 'XYZ', number: 8, prompt })).toBe('Fråga 8')
  })
  it('uses the NOG question without the sufficiency apparatus', () => {
    expect(
      questionStem({
        section: 'NOG',
        number: 1,
        prompt: 'Hur stor är x? (1) x > 2 (2) x < 5 Tillräcklig information för lösningen erhålls',
      }),
    ).toBe('Hur stor är x?')
  })
  it('keeps the KVA condition and both quantities', () => {
    expect(
      questionStem({
        section: 'KVA',
        number: 1,
        prompt: 'x > 0 Kvantitet I: x + 1 Kvantitet II: x',
      }),
    ).toBe('x > 0 · I: x + 1 · II: x')
    expect(
      questionStem({ section: 'KVA', number: 2, prompt: 'Kvantitet I: 2 Kvantitet II: 3' }),
    ).toBe('I: 2 · II: 3')
  })
  it('keeps gap markers for the local GapText and degrades absent stems gracefully', () => {
    expect(
      questionStem({ section: 'MEK', number: 1, prompt: 'Det var _____ att se _____ igen.' }),
    ).toBe('Det var _____ att se _____ igen.')
    expect(questionStem({ section: 'LÄS', number: 12, prompt: null })).toBe('Fråga 12')
    expect(
      questionStem({ section: 'NOG', number: 1, prompt: '  Ett osplittrat påstående  ' }),
    ).toBe('Ett osplittrat påstående')
  })
})
