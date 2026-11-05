import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import type { Question } from '@/data/questions'
import { useFolioPrefs } from '@/folio/lib/folioPrefs'
import type { PassOption } from '@/lib/mock'
import { logMockEvent } from '@/lib/mockEvents'
import { ConditionsSlip } from './ConditionsSlip'
import FolioProvpass, { type FolioProvpassProps } from './FolioProvpass'
import { ProvMargin } from './ProvMargin'

const viewport = vi.hoisted(() => ({ value: 'studio' }))
const read = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8')
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => viewport.value }))
vi.mock('@/lib/mockEvents', () => ({ logMockEvent: vi.fn() }))
vi.mock('@/data/questions', async (original) => ({
  ...(await original<typeof import('@/data/questions')>()),
  loadBank: async () =>
    passes.flatMap((pass) =>
      ['ORD', 'LÄS', 'MEK', 'ELF'].flatMap((section) =>
        Array.from(
          { length: 10 },
          (_, i) =>
            ({
              qid: `${pass.examId}-${section}-${i}`,
              exam_id: pass.examId,
              provpass: pass.provpass,
              section,
              number: i + 1,
              prompt: 'Fråga',
              options: [{ letter: 'A', text: 'Ett' }],
              answer: 'A',
              context: null,
              parsing_status: 'complete',
            }) as Question,
        ),
      ),
    ),
}))
const passes: PassOption[] = ['host-2025', 'var-2025', 'host-2024', 'var-2024'].map(
  (examId, i) => ({
    examId,
    provpass: 'verb1',
    half: 'verbal',
    presented: 40,
    seenBefore: i,
    totalExposure: i * 2,
  }),
)
const beginRun = vi.fn()
const navigateHref = vi.fn()
function Hub({ ready = true }: { ready?: boolean }) {
  const [half, onHalfChange] = useState<MockHalf>('verbal')
  const [mode, onModeChange] = useState<MockMode>('authentic')
  const [pendingPass, setPass] = useState<PassOption | null>(null)
  const [slipOpen, setOpen] = useState(false)
  const props: FolioProvpassProps = {
    half,
    mode,
    onHalfChange,
    onModeChange,
    passes,
    ready,
    voidNotice: true,
    results: { data: [] },
    navigateHref,
    startAuthentic: (pass) => {
      setPass(pass)
      setOpen(true)
    },
    startSynthetic: () => {
      setPass(null)
      setOpen(true)
    },
    beginRun,
    slipOpen,
    pendingPass,
    onDismiss: () => setOpen(false),
    pending: false,
    error: false,
    durationMs: 55 * 60_000,
  }
  return (
    <div data-folio>
      <FolioProvpass {...props} />
    </div>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  beginRun.mockReturnValue(true)
  viewport.value = 'studio'
  useFolioPrefs.getState().resetPrefs()
})
describe('Folio Provpass hub and slip', () => {
  it('releases the start guard with a neutral message when no run can be created', () => {
    beginRun.mockReturnValue(false)
    const onClose = vi.fn()
    render(
      <ConditionsSlip
        half="verbal"
        mode="synthetic"
        pass={null}
        pending={false}
        error={false}
        minutes={55}
        onStart={beginRun}
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Inget pass kunde startas. Välj ett annat pass eller försök igen.',
    )
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(beginRun).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByTestId('mock-confirm-dismiss'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it.each(['mock-confirm-dismiss', 'scrim'])('dismisses via the %s pointer control', (target) => {
    render(<Hub />)
    fireEvent.click(screen.getByTestId('prov-start'))
    fireEvent.click(
      target === 'scrim'
        ? screen.getByRole('button', { name: 'Stäng villkoren' })
        : screen.getByTestId(target),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(beginRun).not.toHaveBeenCalled()
  })
  it('lists recent raw counts and dates without a second score', () => {
    render(
      <ProvMargin
        results={{
          data: [
            { id: 1, half: 'verbal', correct: 3, presented: 40, createdAt: '2026-10-22' } as never,
          ],
        }}
        navigateHref={navigateHref}
      />,
    )
    const result = screen.getByRole('link')
    expect(result).toHaveTextContent('3 av 40')
    expect(result).toHaveTextContent('22 okt')
    expect(result).not.toHaveTextContent('0,15')
    expect(result).not.toHaveAccessibleName(/linjär skattning/)
    expect(screen.queryByText(/Poängen i listan/)).toBeNull()
  })
  it('keeps focus inside the slip, blocks modified Enter and allows retry after a failed start', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const renderSlip = (pending: boolean, error: boolean) => (
      <ConditionsSlip
        half="verbal"
        mode="authentic"
        pass={passes[0]}
        pending={pending}
        error={error}
        minutes={55}
        onStart={beginRun}
        onClose={onClose}
      />
    )
    const { rerender } = render(renderSlip(false, false))
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(screen.getByTestId('mock-confirm-dismiss')).toHaveFocus()
    await user.tab()
    expect(screen.getByTestId('mock-confirm-start')).toHaveFocus()
    fireEvent.keyDown(document.body, { key: 'Enter', shiftKey: true })
    expect(beginRun).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    rerender(renderSlip(true, false))
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByTestId('mock-confirm-start')).toBeDisabled()
    rerender(renderSlip(false, true))
    fireEvent.click(screen.getByTestId('mock-confirm-start'))
    expect(beginRun).toHaveBeenCalledTimes(2)
  })
  it('selects a real register cell, then starts only through the slip and guards double confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<Hub />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Öva på tid.')
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    for (const button of screen.getAllByTestId(/^prov-pass-/)) expect(button.tagName).toBe('BUTTON')
    await user.click(screen.getByTestId('prov-pass-var-2024-verb1'))
    expect(screen.getByRole('heading', { name: 'Våren 2024 · Provpass 1' })).toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(screen.getByTestId('prov-picker'), { key: 'Enter' })
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Våren 2024 · Provpass 1')
    expect(screen.getByTestId('prov-picker')).toHaveAttribute('inert')
    expect(screen.getByTestId('mock-confirm-start')).toHaveFocus()
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
    expect(vi.mocked(logMockEvent).mock.calls.map(([event]) => event)).toEqual(['confirm_shown'])
    await user.dblClick(screen.getByTestId('mock-confirm-start'))
    expect(beginRun).toHaveBeenCalledTimes(1)
    expect(vi.mocked(logMockEvent).mock.calls.map(([event]) => event)).toEqual([
      'confirm_shown',
      'confirm_started',
    ])
  })
  it('closes with Esc, restores focus and logs back-out without starting', async () => {
    const user = userEvent.setup()
    render(<Hub />)
    await user.click(screen.getByTestId('prov-start'))
    const rules = within(screen.getByRole('dialog')).getByRole('list', { name: 'Villkoren' })
    expect(rules.tagName).toBe('UL')
    expect(within(rules).getAllByRole('listitem')).toHaveLength(4)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('prov-start')).toHaveFocus()
    expect(logMockEvent).toHaveBeenCalledWith('confirm_backed_out')
    expect(beginRun).not.toHaveBeenCalled()
  })
  it('keeps the complete year/term matrix on phone and docks the one action', async () => {
    viewport.value = 'phone'
    const user = userEvent.setup()
    render(<Hub />)
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.getAllByTestId(/^prov-pass-/)).toHaveLength(4)
    expect(screen.getByTestId('prov-pass-var-2024-verb1')).toHaveTextContent('3/40')
    expect(screen.getByTestId('prov-pass-var-2024-verb1')).toHaveAccessibleName(/sett 3 av 40/)
    expect(screen.getByTestId('prov-pass-host-2025-verb1')).not.toHaveTextContent('0/40')
    expect(screen.getByTestId('prov-start')).toHaveAttribute('data-dock')
    expect(screen.getByTestId('prov-start').closest('[data-lit]')).toBeNull()
    await user.click(screen.getByTestId('prov-pass-var-2024-verb1'))
    expect(screen.getByTestId('prov-start')).toHaveTextContent('Våren 2024')
  })
  it('supports synthetic kvant and keeps void notice in neutral CSS', async () => {
    const user = userEvent.setup()
    render(<Hub />)
    await user.click(screen.getByTestId('prov-mode-synthetic'))
    await user.click(screen.getByTestId('prov-half-kvant'))
    expect(screen.getByLabelText('40 frågor · XYZ 12 · KVA 10 · NOG 6 · DTK 12')).toBeVisible()
    expect(screen.getByTestId('prov-synthetic-note')).toHaveTextContent(
      'Ingen poäng: det är inte normerat.',
    )
    expect(screen.getByTestId('prov-void-notice')).toHaveClass('fa-status')
    const rule = read('./prov.css').match(/\[data-folio\] \.fa-prov \.fa-status\s*\{([^}]+)\}/)?.[1]
    expect(rule).toBeDefined()
    expect(rule).toMatch(/(?:^|;)\s*color:\s*var\(--fa-ink-2\)\s*;/)
    await user.click(screen.getByTestId('prov-start'))
    expect(screen.getByTestId('mock-confirm-heading')).toHaveTextContent('Genererat pass')
    await user.keyboard('{Enter}')
    expect(beginRun).toHaveBeenCalledTimes(1)
  })
  it('leaves Enter on controls, modifiers and loading states alone', () => {
    const { rerender } = render(<Hub ready={false} />)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(<Hub />)
    fireEvent.keyDown(screen.getByTestId('prov-half-verbal'), { key: 'Enter' })
    fireEvent.keyDown(document.body, { key: 'Enter', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'Enter', repeat: true })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('keeps alternatives honest, actionable and neutral', async () => {
    const { container } = render(<Hub />)
    expect(screen.getByRole('button', { name: /Hel halva/ })).toBeDisabled()
    expect(screen.getByText(/Kommer/)).toBeVisible()
    const short = screen.getByRole('link', { name: /Kort på tid/ })
    expect(short).toHaveAttribute('href', '/drill?section=ORD&timed=1&start=1')
    expect(short).toHaveTextContent('10 frågor · 3 min')
    fireEvent.click(short)
    expect(navigateHref).toHaveBeenCalledWith('/drill?section=ORD&timed=1&start=1')
    await waitFor(() =>
      expect(screen.getByLabelText('40 frågor · ORD 10 · LÄS 10 · MEK 10 · ELF 10')).toBeVisible(),
    )
    expect(container.textContent).not.toMatch(/Dålig dag|misslyck|streak|svit|borde|måste/i)
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('.fa-ui-go')).toHaveLength(1)
  })
  it('scopes the hub shortcut and honours the keyboard preference', () => {
    render(<Hub />)
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(screen.queryByRole('dialog')).toBeNull()
    act(() => useFolioPrefs.getState().setPrefs({ kbd: false }))
    fireEvent.keyDown(screen.getByTestId('prov-picker'), { key: 'Enter' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('passes axe on the hub and its conditions slip', async () => {
    const { container } = render(<Hub />)
    expect(
      (await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([])
    fireEvent.click(screen.getByTestId('prov-start'))
    expect(
      (await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([])
  })
})
