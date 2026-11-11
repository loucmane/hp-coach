import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import type { FunctionComponent, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActiveSession, SessionStartInput } from '@/api/hooks/useSessions'
import type { Question, Section } from '@/data/questions'
import { endedSessionIdsThisTab } from '@/lib/endedSessions'

const h = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
  session: null as ActiveSession | null,
  bank: [] as Question[],
  listeners: new Set<() => void>(),
  navigate: vi.fn(),
  start: vi.fn(),
  index: vi.fn(),
  entries: [] as { id: string; example_questions: string[] }[],
}))
vi.mock('@tanstack/react-router', async () => {
  const { useSyncExternalStore } = await import('react')
  return {
    createFileRoute: () => (options: unknown) => ({
      options,
      useSearch: () =>
        useSyncExternalStore(
          (notify) => {
            h.listeners.add(notify)
            return () => {
              h.listeners.delete(notify)
            }
          },
          () => h.search,
        ),
    }),
    useNavigate: () => h.navigate,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  }
})
vi.mock('@/data/questions', async (original) => ({
  ...(await original<typeof import('@/data/questions')>()),
  loadBank: async () => h.bank,
}))
vi.mock('@/lib/trapIndex', async (original) => ({
  ...(await original<typeof import('@/lib/trapIndex')>()),
  loadTrapIndex: h.index,
}))
vi.mock('@/data/frameworks', async (original) => ({
  ...(await original<typeof import('@/data/frameworks')>()),
  loadFramework: async () => ({ entries: h.entries }),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSession: () => ({ data: h.session, isPending: false }),
  useActiveSessionOfKind: () => ({ data: h.session, isPending: false }),
  useStartSession: () => ({ mutateAsync: h.start, isPending: false }),
  useUpdateSession: () => ({ mutate: vi.fn() }),
  useSessionAttempts: () => ({ data: [] }),
}))
vi.mock('@/api/hooks/useAttempts', () => ({ useSubmitAttempt: () => ({ mutate: vi.fn() }) }))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: [] }),
  usePileMistakes: () => ({ data: [] }),
  useRecordMistake: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/api/hooks/useAdaptiveReview', () => ({ useAdaptiveReview: () => ({ hotTrap: null }) }))
vi.mock('@/api/hooks/useItemStats', () => ({
  useItemStats: () => ({ data: {} }),
  useAbility: () => ({ data: {} }),
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: undefined }) }))
vi.mock('@/api/hooks/useTopTraps', () => ({
  useTopTraps: () => h.entries.map((e) => ({ framework_id: e.id, section: 'KVA' })),
}))
vi.mock('@/components/drill/DrillQuestion', () => ({
  DrillQuestion: ({ question }: { question: Question }) => (
    <div data-testid="question" data-qid={question.qid} />
  ),
}))
vi.mock('@/components/drill-variants/BoksidanDesk', () => ({ BoksidanDesk: () => null }))
vi.mock('@/components/drill-variants/DispatchedVariant', () => ({ DispatchedVariant: () => null }))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/Page', () => ({ Page: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/motion/StageInk', () => ({
  StageInk: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/motion/QuestionPan', () => ({
  QuestionPan: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/motion/DueNumeral', () => ({ DueHeaderStation: () => null }))

import { buildTrapIndex } from '@/lib/trapIndex'
import { Route } from './drill'

const Screen = Route.options.component as FunctionComponent
const validate = Route.options.validateSearch as (
  input: Record<string, unknown>,
) => Record<string, unknown>
const ids = ['KVA-TRAP-001', 'KVA-TRAP-002']
const fixture = (section: Section, number: number): Question => ({
  qid: `${section}-${number}`,
  section,
  exam_id: '2024-var',
  provpass: 'kvant1',
  number,
  prompt: 'Fråga',
  context: null,
  options: [
    { letter: 'A', text: 'Ett' },
    { letter: 'B', text: 'Två' },
  ],
  answer: 'A',
  parsing_status: 'complete',
})
async function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(['question-bank'], h.bank)
  await act(async () => {
    render(
      <QueryClientProvider client={client}>
        <Screen />
      </QueryClientProvider>,
    )
  })
  return screen.findByTestId('question')
}
beforeEach(() => {
  h.search = validate({ section: 'KVA', traps: ids.join(','), count: '10', start: '1' })
  h.session = null
  h.bank = [
    ...Array.from({ length: 25 }, (_, i) => fixture('KVA', i)),
    ...Array.from({ length: 15 }, (_, i) => fixture('ORD', i)),
  ]
  h.entries = [{ id: ids[0], example_questions: ['KVA-0', 'KVA-1'] }]
  h.index
    .mockReset()
    .mockResolvedValue(
      buildTrapIndex(
        Object.fromEntries(
          h.bank
            .filter((q) => q.section === 'KVA' && q.number < 20)
            .map((q) => [q.qid, ids[q.number % 2]]),
        ),
      ),
    )
  h.navigate
    .mockReset()
    .mockImplementation(
      ({
        search,
      }: {
        search?:
          | Record<string, unknown>
          | ((prev: Record<string, unknown>) => Record<string, unknown>)
      }) => {
        if (search) h.search = typeof search === 'function' ? search(h.search) : search
        for (const notify of h.listeners) notify()
      },
    )
  h.start.mockReset().mockImplementation(async (input: SessionStartInput) => {
    h.session = {
      id: 1,
      userId: 1,
      kind: input.kind,
      sections: input.sections ?? null,
      position: 0,
      currentQuestionId: input.plan?.[0] ?? null,
      plan: input.plan ?? null,
      device: null,
      startedAt: null,
      endedAt: null,
    }
    return h.session
  })
  endedSessionIdsThisTab.clear()
  localStorage.clear()
})

describe('trap drill route with the real SessionPlayer', () => {
  it('validates and retains trap ids and the 5/10/20 counts', () => {
    expect(h.search).toEqual({ section: 'KVA', traps: ids.join(','), count: 10, start: true })
    for (const count of [5, 10, 20]) expect(validate({ count: String(count) }).count).toBe(count)
    for (const count of [0, -1, 3, 10.5, 'ten', true, [10]])
      expect(validate({ count }).count).toBeUndefined()
    for (const traps of ['', '../x', ['KVA-TRAP-001'], 'KVA-TRAP-001,', 'KVA-TRAP-001,<script>'])
      expect(validate({ traps }).traps).toBeUndefined()
    expect(validate({ traps: `${ids[0]},${ids[0]}` }).traps).toBe(ids[0])
  })
  it.each([
    5, 10, 20,
  ])('starts a %i-question family plan and retains its URL through qid sync', async (count) => {
    h.search = validate({ section: 'KVA', traps: ids.join(','), count, start: true })
    await mount()
    expect(h.start).toHaveBeenCalledTimes(1)
    const plan = h.start.mock.calls[0][0].plan as string[]
    expect(plan).toHaveLength(count)
    expect(plan.every((id) => h.bank.find((q) => q.qid === id)!.number < 20)).toBe(true)
    expect(h.search).toMatchObject({ traps: ids.join(','), count, qid: plan[0] })
  })
  it('replays the saved plan and position even when the URL now requests a different family/count', async () => {
    h.session = {
      id: 7,
      userId: 1,
      kind: 'drill',
      sections: 'KVA',
      plan: ['KVA-23', 'KVA-21', 'KVA-22'],
      position: 1,
      currentQuestionId: 'KVA-21',
      device: null,
      startedAt: null,
      endedAt: null,
    }
    h.search = validate({
      section: 'KVA',
      traps: ids.join(','),
      count: 20,
      qid: 'KVA-21',
      start: true,
    })
    expect(await mount()).toHaveAttribute('data-qid', 'KVA-21')
    expect(h.start).not.toHaveBeenCalled()
    expect(h.index).not.toHaveBeenCalled()
    expect(h.session.plan).toEqual(['KVA-23', 'KVA-21', 'KVA-22'])
  })
  it.each([
    'ordinary',
    'qid',
    'framework',
    'weak',
    'mixed',
  ])('preserves the legacy %s picker and default size', async (mode) => {
    h.search = validate({
      section: 'KVA',
      start: true,
      ...(mode === 'ordinary'
        ? {}
        : { [mode]: mode === 'qid' ? 'KVA-24' : mode === 'framework' ? ids[0] : true }),
    })
    await mount()
    const plan = h.start.mock.calls[0][0].plan as string[]
    expect(plan).toHaveLength(mode === 'qid' ? 1 : mode === 'weak' || mode === 'framework' ? 2 : 10)
    if (mode === 'qid') expect(plan).toEqual(['KVA-24'])
    if (mode === 'mixed') expect(plan.some((id) => id.startsWith('ORD'))).toBe(true)
    expect(h.index).not.toHaveBeenCalled()
  })
  it('retains the old timed, words, completion and detour parameters', () => {
    expect(validate({ section: 'ORD', words: '1', start: '1' })).toEqual({
      section: 'ORD',
      words: true,
      start: true,
    })
    expect(validate({ section: 'ORD', timed: '1', start: '1' })).toEqual({
      section: 'ORD',
      timed: true,
      start: true,
    })
    expect(
      validate({ section: 'KVA', framework: ids[0], ar: '1', back: 'ORD', done: '7' }),
    ).toEqual({ section: 'KVA', framework: ids[0], ar: true, back: 'ORD', done: 7 })
  })
})
