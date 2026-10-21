import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { CSSProperties, FunctionComponent, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AttemptInput } from '@/api/hooks/useAttempts'
import type { ActiveSession, SessionStartInput, SessionUpdatePatch } from '@/api/hooks/useSessions'
import { pickCandidate } from '@/components/home/useResumptionCandidate'
import type { AnswerLetter, Question } from '@/data/questions'
import { endedSessionIdsThisTab } from '@/lib/endedSessions'

const h = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
  session: null as ActiveSession | null,
  bank: [] as Question[],
  attempts: new Map<number, AttemptInput[]>(),
  listeners: new Set<() => void>(),
  navigate: vi.fn(),
  start: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
  record: vi.fn(),
  hotTrap: null as { framework_id: string } | null,
}))

vi.mock('@tanstack/react-router', async () => {
  const { createElement, useSyncExternalStore } = await import('react')
  const subscribe = (notify: () => void) => {
    h.listeners.add(notify)
    return () => {
      h.listeners.delete(notify)
    }
  }
  return {
    createFileRoute: () => (options: unknown) => ({
      options,
      useSearch: () => useSyncExternalStore(subscribe, () => h.search),
    }),
    useNavigate: () => h.navigate,
    Link: ({
      to,
      search,
      children,
      ...props
    }: {
      to: string
      search?: unknown
      children?: ReactNode
      style?: CSSProperties
    }) =>
      createElement('a', { ...props, href: to, 'data-search': JSON.stringify(search) }, children),
  }
})
vi.mock('@/data/questions', async (original) => ({
  ...(await original<typeof import('@/data/questions')>()),
  loadBank: async () => h.bank,
}))
vi.mock('@/api/hooks/useSessions', async () => {
  const { useSyncExternalStore } = await import('react')
  const subscribe = (notify: () => void) => {
    h.listeners.add(notify)
    return () => {
      h.listeners.delete(notify)
    }
  }
  const active = () => ({
    data: useSyncExternalStore(subscribe, () => h.session),
    isPending: false,
  })
  return {
    useActiveSession: active,
    useActiveSessionOfKind: active,
    useStartSession: () => ({ mutateAsync: h.start, isPending: false }),
    useUpdateSession: () => ({ mutate: h.update }),
    useSessionAttempts: (id: number | null) => ({
      data: id === null ? undefined : h.attempts.get(id),
      refetch: async () => ({ data: id === null ? undefined : h.attempts.get(id) }),
    }),
  }
})
vi.mock('@/api/hooks/useAttempts', () => ({ useSubmitAttempt: () => ({ mutate: h.submit }) }))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: [] }),
  usePileMistakes: () => ({ data: [] }),
  useRecordMistake: () => ({ mutate: h.record }),
}))
vi.mock('@/api/hooks/useAdaptiveReview', () => ({
  useAdaptiveReview: () => ({ hotTrap: h.hotTrap, trapName: 'Fälla', section: 'ORD' }),
}))
vi.mock('@/api/hooks/useItemStats', () => ({
  useItemStats: () => ({ data: {} }),
  useAbility: () => ({ data: {} }),
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: undefined }) }))
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => [] }))
vi.mock('@/components/drill/DrillQuestion', () => ({
  DrillQuestion: ({
    question,
    onPick,
  }: {
    question: Question
    onPick: (letter: AnswerLetter) => void
  }) => (
    <div data-testid="question" data-qid={question.qid}>
      <button type="button" onClick={() => onPick('A')}>
        Rätt svar
      </button>
      <button type="button" onClick={() => onPick('B')}>
        Fel svar
      </button>
    </div>
  ),
}))
vi.mock('@/components/drill/DrillResult', () => ({
  DrillResult: ({ onReplay, continuation }: { onReplay: () => void; continuation?: ReactNode }) => (
    <div data-testid="result">
      <button type="button" onClick={onReplay}>
        Öva igen
      </button>
      {continuation}
    </div>
  ),
}))
vi.mock('@/components/drill-variants/BoksidanDesk', () => ({ BoksidanDesk: () => null }))
vi.mock('@/components/drill-variants/DispatchedVariant', () => ({ DispatchedVariant: () => null }))
vi.mock('@/components/MobileFrame', () => ({
  MobileFrame: ({ children }: { children?: ReactNode }) => children,
}))
vi.mock('@/components/Page', () => ({ Page: ({ children }: { children?: ReactNode }) => children }))
vi.mock('@/components/motion/StageInk', () => ({
  StageInk: ({ children }: { children?: ReactNode }) => children,
}))
vi.mock('@/components/motion/QuestionPan', () => ({
  QuestionPan: ({ children }: { children?: ReactNode }) => children,
}))
vi.mock('@/components/motion/DueNumeral', () => ({ DueHeaderStation: () => null }))

import { Route } from './drill'
import { Route as OvaRoute } from './ova'

const Screen = Route.options.component as FunctionComponent
const Ova = OvaRoute.options.component as FunctionComponent
const validate = Route.options.validateSearch as (
  input: Record<string, unknown>,
) => Record<string, unknown>

function notify() {
  for (const listener of [...h.listeners]) listener()
}

function fixture(section: 'ORD' | 'LÄS', number: number, context: string | null = null): Question {
  return {
    qid: `${section}-${number}`,
    exam_id: '2024-var',
    provpass: 'verb1',
    section,
    number,
    prompt: 'Fråga',
    context,
    options: [
      { letter: 'A', text: 'Rätt' },
      { letter: 'B', text: 'Fel' },
    ],
    answer: 'A',
    parsing_status: 'complete',
  }
}

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  client.setQueryData(['question-bank'], h.bank)
  return render(
    <QueryClientProvider client={client}>
      <Screen />
    </QueryClientProvider>,
  )
}

async function start() {
  let view: ReturnType<typeof mount> | undefined
  await act(async () => {
    view = mount()
  })
  expect(screen.getByTestId('question')).toBeInTheDocument()
  return view as ReturnType<typeof mount>
}

async function answer(correct = true, ms = 16_000) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
    fireEvent.click(screen.getByRole('button', { name: correct ? 'Rätt svar' : 'Fel svar' }))
  })
}

async function next() {
  await act(async () => {
    fireEvent.click(screen.getByTestId('drill-next'))
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000_000)
  h.search = validate({ section: 'ORD', timed: '1', start: true })
  h.session = null
  h.attempts.clear()
  h.hotTrap = null
  h.bank = [
    ...Array.from({ length: 12 }, (_, i) => fixture('ORD', i)),
    ...Array.from({ length: 4 }, (_, i) => fixture('LÄS', i, 'En hel text')),
    ...Array.from({ length: 6 }, (_, i) => fixture('LÄS', i + 4, `Kort text ${Math.floor(i / 2)}`)),
  ]
  h.record.mockReset()
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
        notify()
      },
    )
  h.start.mockReset().mockImplementation(async (input: SessionStartInput) => {
    const id = h.attempts.size + 1
    h.session = {
      id,
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
    h.attempts.set(id, [])
    notify()
    return h.session
  })
  h.update.mockReset().mockImplementation(({ patch }: { patch: SessionUpdatePatch }) => {
    if (h.session) h.session = patch.end ? null : { ...h.session, ...patch }
    notify()
  })
  h.submit.mockReset().mockImplementation((input: AttemptInput) => {
    h.attempts.set(input.sessionId, [...(h.attempts.get(input.sessionId) ?? []), input])
    notify()
  })
  endedSessionIdsThisTab.clear()
  window.localStorage.clear()
})
afterEach(() => vi.useRealTimers())

describe('timed drill route with the real SessionPlayer', () => {
  it.each(['ORD', 'LÄS'])('decodes the stored %s timed marker', (section) => {
    expect(validate({ section: `${section} · PÅ TID` })).toEqual({ section, timed: true })
  })

  it.each([
    false,
    true,
  ])('does not adopt ORD across timed modes (initial timed: %s)', async (timed) => {
    h.search = validate({ section: 'ORD', timed, start: true })
    const view = await start()
    await answer(true, 240_000)
    await next()
    const oldId = h.session?.id
    view.unmount()
    h.search = validate({ section: 'ORD', timed: !timed, start: true })
    await start()
    expect(h.start).toHaveBeenCalledTimes(2)
    expect(h.session?.id).not.toBe(oldId)
    expect(h.session?.position).toBe(0)
    expect(h.session?.sections).toBe(timed ? 'ORD' : 'ORD · PÅ TID')
    if (!timed) expect(screen.getByRole('timer')).toHaveTextContent('3:00')
    else expect(screen.queryByRole('timer')).toBeNull()
  })

  it('accepts the literal ?timed=1 after the real router parses the URL', async () => {
    const { defaultParseSearch } =
      await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
    expect(validate(defaultParseSearch('?section=ORD&timed=1')).timed).toBe(true)
  })

  it('validates opt-in and ignores unsupported modes and false values', () => {
    expect(validate({ timed: '1' }).timed).toBe(true)
    expect(validate({ section: 'LÄS', timed: true }).timed).toBe(true)
    for (const input of [
      { timed: '0' },
      { timed: 'false' },
      { timed: false },
      { timed: true, section: 'DTK' },
      { timed: true, mixed: true },
      { timed: true, framework: 'ORD-ROOT-001' },
      { timed: true, weak: true },
    ]) {
      expect(validate(input).timed).toBeUndefined()
    }
  })

  it('starts ten ORD questions, pauses for either answer, and stays playable after zero', async () => {
    h.hotTrap = { framework_id: 'ORD-ROOT-001' }
    await start()
    expect(h.session?.plan).toHaveLength(10)
    expect(screen.getByRole('timer')).toHaveTextContent('3:00')
    await answer(true, 20_000)
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByRole('timer')).toHaveTextContent('2:40')
    await next()
    await answer(false, 10_000)
    expect(h.record).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByRole('timer')).toHaveTextContent('2:30')
    await next()
    act(() => vi.advanceTimersByTime(160_000))
    expect(screen.getByRole('timer')).toHaveTextContent('+0:10')
    expect(screen.queryByTestId('result')).toBeNull()
    expect(h.update.mock.calls.some(([v]) => v.patch.end)).toBe(false)
  })

  it('keeps timed and done through completion, reconstructs tempo on refresh, and resets on replay', async () => {
    const view = await start()
    for (let i = 0; i < 10; i++) {
      await answer()
      await next()
    }
    expect(h.search).toEqual(expect.objectContaining({ section: 'ORD', timed: true, done: 1 }))
    expect(h.search.qid).toBeUndefined()
    expect(screen.queryByRole('timer')).toBeNull()
    expect(screen.getByTestId('drill-tempo')).toHaveTextContent('2:40 · UHR:s tid 3:00 · 20 s kvar')
    view.unmount()
    await act(async () => {
      mount()
    })
    expect(screen.getByTestId('result')).toBeInTheDocument()
    expect(screen.getByTestId('drill-tempo')).toHaveTextContent('2:40 · UHR:s tid 3:00 · 20 s kvar')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Öva igen' }))
    })
    expect(h.start).toHaveBeenCalledTimes(2)
    expect(h.search.done).toBeUndefined()
    expect(h.search.timed).toBe(true)
    expect(screen.getByRole('timer')).toHaveTextContent('3:00')
  })

  it('starts one whole LÄS passage with an 8:48 budget', async () => {
    h.search = validate({ section: 'LÄS', timed: '1', start: true })
    await start()
    expect(h.session?.plan).toEqual(['LÄS-0', 'LÄS-1', 'LÄS-2', 'LÄS-3'])
    expect(screen.getByRole('timer')).toHaveTextContent('8:48')
  })

  it('does not adopt an ordinary LÄS plan when opening the one-text timed drill', async () => {
    h.search = validate({ section: 'LÄS', start: true })
    const view = await start()
    expect(h.session?.plan).toHaveLength(10)
    view.unmount()
    h.search = validate({ section: 'LÄS', timed: true, start: true })
    await start()
    expect(h.start).toHaveBeenCalledTimes(2)
    expect(h.session?.plan).toHaveLength(4)
  })

  it('resumes a matching timed plan with its prior answer time', async () => {
    const view = await start()
    await answer(true, 20_000)
    await next()
    const qid = h.search.qid
    view.unmount()
    act(() => vi.advanceTimersByTime(600_000))
    const candidate = pickCandidate([h.session as ActiveSession], null)
    const { defaultParseSearch } =
      await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
    h.search = validate(
      defaultParseSearch(new URL(candidate?.href ?? '', 'https://example.test').search),
    )
    expect(h.search.timed).toBe(true)
    await start()
    expect(h.start).toHaveBeenCalledTimes(1)
    expect(h.search.qid).toBe(qid)
    expect(screen.getByRole('timer')).toHaveTextContent('2:40')
    await answer(true, 10_000)
    expect(screen.getByRole('timer')).toHaveTextContent('2:30')
  })

  it('keeps a real framework detour untimed even if a timed flag is supplied', () => {
    const search = validate({ framework: 'ORD-ROOT-001', ar: true, back: 'XYZ', timed: true })
    expect(search).toEqual({ framework: 'ORD-ROOT-001', ar: true, back: 'XYZ' })
  })

  it('leaves ordinary drills untimed, including their result', async () => {
    h.search = validate({ section: 'ORD', start: true })
    await start()
    expect(screen.queryByRole('timer')).toBeNull()
    for (let i = 0; i < 10; i++) {
      await answer()
      await next()
    }
    expect(screen.getByTestId('result')).toBeInTheDocument()
    expect(screen.queryByTestId('drill-tempo')).toBeNull()
    expect(h.search.timed).toBeUndefined()
  })

  it('offers two quiet opt-in links on Öva while keeping ordinary section links untimed', () => {
    render(<Ova />)
    const ord = screen.getByRole('link', { name: 'ORD på tid · 10 frågor, 3 min' })
    const las = screen.getByRole('link', { name: 'En LÄS-text på tid · ca 9 min' })
    expect(JSON.parse(ord.getAttribute('data-search') ?? '')).toEqual({
      section: 'ORD',
      timed: true,
      start: true,
    })
    expect(JSON.parse(las.getAttribute('data-search') ?? '')).toEqual({
      section: 'LÄS',
      timed: true,
      start: true,
    })
    expect(
      JSON.parse(screen.getByTestId('ova-section-ORD').getAttribute('data-search') ?? ''),
    ).toEqual({ section: 'ORD', start: true })
  })
})
