import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import type { PassOption } from '@/lib/mock'
import { logMockEvent } from '@/lib/mockEvents'
import { ConditionsSlip } from './ConditionsSlip'
import FolioProvpass, { type FolioProvpassProps } from './FolioProvpass'

const viewport = vi.hoisted(() => ({ value: 'studio' }))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => viewport.value }))
vi.mock('@/lib/mockEvents', () => ({ logMockEvent: vi.fn() }))
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
  viewport.value = 'studio'
})
describe('Folio Provpass hub and slip', () => {
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
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
    for (const button of screen.getAllByTestId(/^prov-pass-/)) expect(button.tagName).toBe('BUTTON')
    await user.click(screen.getByTestId('prov-pass-var-2024-verb1'))
    expect(screen.getByRole('heading', { name: 'Våren 2024 · Provpass 1' })).toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Våren 2024 · Provpass 1')
    expect(screen.getByTestId('prov-picker')).toHaveAttribute('inert')
    expect(screen.getByTestId('mock-confirm-start')).toHaveFocus()
    expect(container.querySelectorAll('.fa-btn')).toHaveLength(1)
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
    const rules = screen.getByRole('list', { name: 'Villkoren' })
    expect(rules.tagName).toBe('UL')
    expect(within(rules).getAllByRole('listitem')).toHaveLength(4)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('prov-start')).toHaveFocus()
    expect(logMockEvent).toHaveBeenCalledWith('confirm_backed_out')
    expect(beginRun).not.toHaveBeenCalled()
  })
  it('uses phone entries and expands the real sitting list', async () => {
    viewport.value = 'phone'
    const user = userEvent.setup()
    render(<Hub />)
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getAllByTestId(/^prov-pass-/)).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Visa alla 4 provtillfällen' }))
    expect(screen.getAllByTestId(/^prov-pass-/)).toHaveLength(4)
    expect(screen.getByTestId('prov-pass-var-2024-verb1')).toHaveTextContent('sett 6 gånger')
  })
  it('supports synthetic kvant and keeps void notice in neutral CSS', async () => {
    const user = userEvent.setup()
    render(<Hub />)
    await user.click(screen.getByTestId('prov-mode-synthetic'))
    await user.click(screen.getByTestId('prov-half-kvant'))
    expect(screen.getByText('40 frågor · XYZ 12 · KVA 10 · NOG 6 · DTK 12')).toBeVisible()
    expect(screen.getByTestId('prov-synthetic-note')).toHaveTextContent(
      'Indikativt resultat — inte ett riktigt pass.',
    )
    expect(screen.getByTestId('prov-void-notice')).toHaveClass('fa-status')
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
