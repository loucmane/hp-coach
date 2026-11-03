import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { beforeEach, expect, it, vi } from 'vitest'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import FolioHistorik from './FolioHistorik'

const results = vi.hoisted(() => ({
  data: [] as MockResultRow[],
  isPending: false,
  isError: false,
  refetch: vi.fn(),
}))
vi.mock('@/api/hooks/useMockResults', () => ({ useMockResults: () => results }))
const navigateHref = vi.fn()
const refetch = vi.fn()
const rows: SessionHistoryRow[] = [
  { id: 7, kind: 'drill', sections: 'KVA', endedAt: '2026-10-20T12:00:00', correct: 7, total: 10 },
  {
    id: 8,
    kind: 'adaptive_review',
    sections: null,
    endedAt: '2026-10-19T12:00:00',
    correct: 3,
    total: 5,
  },
]
beforeEach(() => {
  vi.clearAllMocks()
  results.data = []
  results.isPending = false
  results.isError = false
})

it('renders dated full-row practice links and keeps keyboard and modified navigation native', async () => {
  const user = userEvent.setup()
  const { container } = render(
    <FolioHistorik history={{ data: rows, refetch }} navigateHref={navigateHref} />,
  )
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tidigare pass.')
  expect(screen.getByRole('heading', { name: 'Vecka 43 · 19–25 oktober 2026' })).toBeInTheDocument()
  const drill = screen.getByTestId('historik-pass-7')
  expect(drill).toHaveAttribute('href', '/drill?done=7')
  expect(drill).toHaveTextContent('7 av 10')
  expect(drill).toHaveTextContent('20 okt. 2026')
  expect(screen.getByTestId('historik-pass-8')).toHaveAttribute('href', '/repetition?done=8')
  drill.focus()
  await user.keyboard('{Enter}')
  expect(navigateHref).toHaveBeenCalledExactlyOnceWith('/drill?done=7')
  navigateHref.mockClear()
  fireEvent.click(drill, { ctrlKey: true })
  fireEvent.click(drill, { metaKey: true })
  expect(navigateHref).not.toHaveBeenCalled()
  expect(screen.queryByRole('heading', { name: 'Provpass' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Framsteg/ })).toHaveAttribute('href', '/progress')
  expect(container.textContent).not.toMatch(/missade|förlor|streak|sluta|pausa|vila|⌘K/i)
})

it('offers Öva for an empty practice history only after it resolves', () => {
  const { rerender } = render(
    <FolioHistorik history={{ isPending: true, refetch }} navigateHref={navigateHref} />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Laddar övningspass')
  expect(screen.queryByTestId('historik-empty-cta')).not.toBeInTheDocument()
  rerender(<FolioHistorik history={{ data: [], refetch }} navigateHref={navigateHref} />)
  expect(screen.getByText('Dina avslutade övningspass visas här.')).toBeInTheDocument()
  const link = screen.getByTestId('historik-empty-cta')
  expect(link).toHaveAttribute('href', '/ova')
  fireEvent.click(link)
  expect(navigateHref).toHaveBeenCalledWith('/ova')
})

it('retries errors independently and preserves cached rows without claiming an empty history', () => {
  results.isError = true
  const { rerender } = render(
    <FolioHistorik history={{ isError: true, refetch }} navigateHref={navigateHref} />,
  )
  const practice = screen.getByRole('region', { name: 'Övningspass' })
  const mocks = screen.getByRole('region', { name: 'Provpass' })
  fireEvent.click(within(practice).getByRole('button', { name: 'Försök igen' }))
  expect(refetch).toHaveBeenCalledOnce()
  expect(results.refetch).not.toHaveBeenCalled()
  fireEvent.click(within(mocks).getByRole('button', { name: 'Försök igen' }))
  expect(results.refetch).toHaveBeenCalledOnce()
  expect(screen.queryByTestId('historik-empty-cta')).not.toBeInTheDocument()
  rerender(
    <FolioHistorik history={{ data: rows, isError: true, refetch }} navigateHref={navigateHref} />,
  )
  expect(screen.getByTestId('historik-pass-7')).toBeInTheDocument()
  expect(within(practice).getByRole('status')).toHaveTextContent(
    'Kunde inte uppdatera övningspassen.',
  )
})

it('renders Provpass links with actual counts, independent loading and no fabricated estimate', () => {
  results.isPending = true
  const { rerender } = render(
    <FolioHistorik history={{ data: rows, refetch }} navigateHref={navigateHref} />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Laddar provpass')
  expect(screen.getByTestId('historik-pass-7')).toBeInTheDocument()
  results.isPending = false
  results.data = [
    {
      id: 22,
      userId: 1,
      sessionId: 33,
      half: 'kvant',
      mode: 'synthetic',
      examId: null,
      provpass: null,
      presented: 40,
      answered: 30,
      correct: 21,
      seenBefore: 10,
      durationMs: 3000,
      createdAt: '2026-10-20T12:00:00',
      breakdown: { perSection: {}, missedQids: [], version: 1 },
    },
  ]
  rerender(<FolioHistorik history={{ data: rows, refetch }} navigateHref={navigateHref} />)
  const link = screen.getByTestId('historik-provpass-22')
  expect(link).toHaveAttribute('href', '/prov?result=22')
  expect(link).toHaveTextContent('Kvant · blandat pass')
  expect(link).toHaveTextContent('21 av 40')
  fireEvent.click(link)
  expect(navigateHref).toHaveBeenCalledWith('/prov?result=22')
})

it.each([
  'ready',
  'empty',
  'error',
  'loading',
])('has no axe violations in the %s state', async (state) => {
  const history = {
    data: state === 'ready' ? rows : undefined,
    isPending: state === 'loading',
    isError: state === 'error',
    refetch,
  }
  const { container } = render(
    <main data-folio>
      <FolioHistorik history={history} navigateHref={navigateHref} />
    </main>,
  )
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  expect(result.violations).toEqual([])
})
