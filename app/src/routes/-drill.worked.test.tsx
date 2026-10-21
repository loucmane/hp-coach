import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render } from '@testing-library/react'
import type { FunctionComponent, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import { WORKED_EXAMPLES } from '@/data/workedExamples.generated'

const h = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
  bank: [] as Question[],
  entries: [] as { id: string; example_questions: string[] }[],
  pick: null as null | (() => Promise<Question[]>),
}))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => h.search }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))
vi.mock('@/data/questions', async (original) => ({
  ...(await original<typeof import('@/data/questions')>()),
  loadBank: async () => h.bank,
}))
vi.mock('@/data/frameworks', () => ({
  loadFramework: async () => ({ entries: h.entries }),
  entryHeadword: () => 'Mönster',
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSession: () => ({ data: null }),
  useActiveSessionOfKind: () => ({ data: null }),
  useSessionAttempts: () => ({ data: [] }),
}))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: [] }),
  useRecordMistake: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/api/hooks/useAdaptiveReview', () => ({ useAdaptiveReview: () => ({ hotTrap: null }) }))
vi.mock('@/api/hooks/useItemStats', () => ({
  useItemStats: () => ({ data: {} }),
  useAbility: () => ({ data: {} }),
}))
vi.mock('@/api/hooks/useTopTraps', () => ({
  useTopTraps: () => h.entries.map((e) => ({ framework_id: e.id, section: h.search.section })),
}))
vi.mock('@/components/session/SessionPlayer', () => ({
  SessionPlayer: ({ pickQuestions }: { pickQuestions: () => Promise<Question[]> }) => {
    h.pick = pickQuestions
    return null
  },
}))

import { Route } from './drill'

const Screen = Route.options.component as FunctionComponent

describe('worked example route selection', () => {
  it.each(['framework', 'weak', 'qid'])('honors the %s route contract', async (mode) => {
    const example = WORKED_EXAMPLES[0]
    const worked: Question = {
      qid: example.qid,
      section: example.section,
      exam_id: 'exam',
      provpass: 'kvant1',
      number: 1,
      prompt: 'Synthetic question',
      options: [{ letter: 'A', text: 'Option' }],
      answer: 'A',
      context: null,
      parsing_status: 'complete',
    }
    const ordinary = { ...worked, qid: 'ordinary' }
    h.bank = [worked, ordinary]
    h.entries = [{ id: example.entryId, example_questions: [worked.qid, ordinary.qid] }]
    h.search = {
      section: example.section,
      [mode]: mode === 'qid' ? worked.qid : mode === 'weak' ? true : example.entryId,
    }
    await act(async () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <Screen />
        </QueryClientProvider>,
      )
    })
    expect(await h.pick?.()).toEqual(mode === 'qid' ? [worked] : [ordinary])
  })
})
