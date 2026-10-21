import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { CSSProperties, FunctionComponent, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AttemptInput } from '@/api/hooks/useAttempts'
import type { ActiveSession, SessionStartInput, SessionUpdatePatch } from '@/api/hooks/useSessions'
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
  userId: 'alice' as string | null,
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

import { readOrdDeck } from '@/lib/ordDeck'
import { __resetOrdWordsCache } from '@/lib/ordWords'

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ isLoaded: true, user: h.userId ? { id: h.userId } : null }),
}))

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
  expect(await screen.findByTestId('question')).toBeInTheDocument()
  return view as ReturnType<typeof mount>
}

async function answer(correct = true, ms = 16_000) {
  await act(async () => {
    vi.setSystemTime(Date.now() + ms)
    fireEvent.click(screen.getByRole('button', { name: correct ? 'Rätt svar' : 'Fel svar' }))
  })
}

async function next() {
  await act(async () => {
    fireEvent.click(screen.getByTestId('drill-next'))
  })
}

beforeEach(() => {
  // Freeze the clock, not React Query's notification timers.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(1_000_000)
  h.search = validate({ section: 'ORD', words: '1', start: true })
  h.session = null
  h.attempts.clear()
  h.hotTrap = null
  h.userId = 'alice'
  __resetOrdWordsCache()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({
        version: 1,
        generator: 'scripts/build_ord_words.mjs',
        words: h.bank
          .filter((q) => q.section === 'ORD')
          .map((q) => ({ id: q.qid, qids: [q.qid], roots: [] })),
      }),
    ),
  )
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
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('word rounds with the real SessionPlayer', () => {
  it('accepts parsed ?words=1 only for ORD without conflicting modes', async () => {
    const { defaultParseSearch } =
      await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
    expect(validate(defaultParseSearch('?section=ORD&words=1')).words).toBe(true)
    expect(validate({ words: true }).words).toBe(true)
    for (const input of [
      { words: '0' },
      { words: false },
      { words: 'false' },
      { words: true, section: 'MEK' },
      { words: true, mixed: true },
      { words: true, weak: true },
      { words: true, framework: 'ORD-ROOT-001' },
      { words: true, ar: true },
      { words: true, timed: true },
    ])
      expect(validate(input).words).toBeUndefined()
  })

  it('shows Swedish idle copy and offers the ten-word link on Öva', async () => {
    h.search = validate({ words: true })
    const view = mount()
    expect(await screen.findByTestId('drill-idle')).toHaveTextContent('Ordbank')
    expect(screen.getByTestId('drill-idle')).toHaveTextContent('10 ord')
    view.unmount()
    render(<Ova />)
    const link = screen.getByRole('link', { name: 'Ordbank · 10 ord' })
    expect(JSON.parse(link.getAttribute('data-search') ?? '')).toEqual({
      section: 'ORD',
      words: true,
      start: true,
    })
  })

  it('records both grades in the per-user deck and still records mistakes', async () => {
    h.hotTrap = { framework_id: 'ORD-ROOT-001' }
    await start()
    expect(h.session?.plan).toHaveLength(10)
    expect(h.session?.sections).toBe('ORD · ORDBANK')
    expect(screen.queryByRole('timer')).toBeNull()
    const first = h.search.qid as string
    await answer()
    expect(readOrdDeck('alice')[first].box).toBe(1)
    await next()
    const second = h.search.qid as string
    await answer(false)
    expect(readOrdDeck('alice')[second].box).toBe(0)
    expect(readOrdDeck('bob')).toEqual({})
    expect(h.record).toHaveBeenCalledExactlyOnceWith({ questionId: second })
  })

  it('preserves words and done on completion, refresh and replay, without early reviews', async () => {
    const view = await start()
    for (let i = 0; i < 10; i++) {
      await answer()
      await next()
    }
    expect(h.search).toEqual(expect.objectContaining({ section: 'ORD', words: true, done: 1 }))
    view.unmount()
    await act(async () => {
      mount()
    })
    expect(await screen.findByTestId('result')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Öva igen' }))
    })
    expect(h.start).toHaveBeenCalledTimes(2)
    expect(h.session?.plan).toEqual(['ORD-10', 'ORD-11'])
    expect(h.search.words).toBe(true)
    expect(h.search.done).toBeUndefined()
  })

  it('does not adopt an ordinary ORD session when opening the word bank', async () => {
    h.search = validate({ section: 'ORD', start: true })
    const view = await start()
    view.unmount()
    h.search = validate({ section: 'ORD', words: true, start: true })
    await start()
    expect(h.start).toHaveBeenCalledTimes(2)
    expect(h.session?.sections).toBe('ORD · ORDBANK')
  })

  it.each([
    false,
    true,
  ])('does not adopt a word round as an ordinary/timed ORD drill (%s)', async (timed) => {
    const view = await start()
    view.unmount()
    h.search = validate({ section: 'ORD', timed, start: true })
    await start()
    expect(h.start).toHaveBeenCalledTimes(2)
    expect(h.session?.sections).toBe('ORD')
  })

  it('resumes the exact paused word round through Home and keeps updating the deck', async () => {
    const view = await start()
    await answer()
    await next()
    const qid = h.search.qid as string
    const plan = h.session?.plan
    view.unmount()
    // Home uppercases sections and emits section=...&qid=..., without words.
    const { defaultParseSearch } =
      await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
    h.search = validate(
      defaultParseSearch(
        `?section=${encodeURIComponent(h.session?.sections?.toUpperCase() ?? '')}&qid=${qid}`,
      ),
    )
    expect(h.search).toEqual(expect.objectContaining({ section: 'ORD', words: true }))
    await start()
    expect(h.start).toHaveBeenCalledTimes(1)
    expect(h.session?.plan).toEqual(plan)
    expect(h.search.qid).toBe(qid)
    await answer()
    expect(readOrdDeck('alice')[qid].box).toBe(1)
  })

  it('keeps word mode when a qid is present without a resumable session', async () => {
    h.search = validate({ section: 'ORD', words: true, qid: 'ORD-4', start: true })
    await start()
    expect(h.session?.plan).toHaveLength(10)
  })

  it('does not start or write a shared deck without a signed-in user', async () => {
    h.userId = null
    await act(async () => {
      mount()
    })
    expect(h.start).not.toHaveBeenCalled()
    expect(window.localStorage.length).toBe(0)
  })
})
