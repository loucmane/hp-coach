import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import type { FunctionComponent, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Framework, TrapEntry } from '@/data/frameworks'

const h = vi.hoisted(() => ({
  search: { section: 'KVA', framework: 'KVA-TRAP-007' },
  load: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => h.search }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/data/frameworks', async (original) => ({
  ...(await original<typeof import('@/data/frameworks')>()),
  loadFramework: h.load,
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
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => [] }))
vi.mock('@/components/session/SessionPlayer', () => ({
  SessionPlayer: ({ idleHeadline, idleEyebrow }: { idleHeadline: string; idleEyebrow: string }) => (
    <div>
      <p>{idleEyebrow}</p>
      <h1>{idleHeadline}</h1>
    </div>
  ),
}))

import { Route } from './drill'

const Screen = Route.options.component as FunctionComponent
const trap: TrapEntry = {
  id: 'KVA-TRAP-007',
  question_title: 'Låser x² = y² tecknet?',
  pattern_description: 'Negativa värden kan ge samma kvadrat.',
  tldr: 'Kvadrering döljer tecknet.',
  recognition_cue: 'Pröva ett negativt värde.',
  why_it_occurs: '',
  countermeasure: '',
  common_distractor_signature: '',
  example_questions: [],
}
const catalog = (question_title: string | undefined = trap.question_title): Framework => ({
  section: 'KVA',
  family: 'kva_traps',
  version: 1,
  authored_at: '',
  entries: [{ ...trap, question_title }],
})
async function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
    <QueryClientProvider client={client}>
      <Screen />
    </QueryClientProvider>,
  )
  await act(async () => {})
  return view
}
beforeEach(() => {
  h.search = { section: 'KVA', framework: trap.id }
  h.load.mockReset().mockResolvedValue(catalog())
})

describe('framework drill pre-answer headline', () => {
  it.each([
    ['Låser x² = y² tecknet?', 'Låser x²\u00a0=\u00a0y² tecknet?'],
    ['', 'fälla 7'],
    ['   ', 'fälla 7'],
  ])('uses safe text for question title %s', async (title, expected) => {
    h.load.mockResolvedValue(catalog(title))
    const { container } = await mount()
    expect(screen.getByRole('heading').textContent).toBe(expected)
    expect(screen.getByText('Mönsterövning')).toBeVisible()
    for (const answer of [trap.pattern_description, trap.tldr, trap.recognition_cue])
      expect(container.textContent).not.toContain(answer)
  })
  it('uses a neutral label while the catalog is unavailable', async () => {
    h.load.mockResolvedValue(null)
    await mount()
    expect(screen.getByRole('heading')).toHaveTextContent('Mönsterövning')
  })
  it('does not keep the previous title while a different framework loads', async () => {
    const view = await mount()
    h.load.mockImplementation(() => new Promise(() => {}))
    h.search = { section: 'KVA', framework: 'KVA-TRAP-008' }
    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <Screen />
      </QueryClientProvider>,
    )
    expect(screen.getByRole('heading')).toHaveTextContent('Mönsterövning')
  })
})
