import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type DailyPlan, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'
import { ReturnPrompt } from './ReturnPrompt'

const identity = vi.hoisted(() => ({ userId: 'student-a' as string | null }))
vi.mock('@clerk/clerk-react', () => ({ useAuth: () => identity }))

const now = new Date(2026, 9, 21, 18)
const history = [
  { startedAt: new Date(2026, 9, 21, 7, 52).toISOString() },
  { startedAt: new Date(2026, 9, 20, 10).toISOString() },
]
const plan: DailyPlan = {
  version: PLAN_SCHEMA_VERSION,
  date: '2026-10-21',
  estimatedMinutes: 0,
  items: [
    {
      id: 'drill-ORD',
      kind: 'drill',
      section: 'ORD',
      headline: 'ORD',
      rationale: '',
      estimatedMinutes: 6,
      href: '/drill?section=ORD',
      completed: true,
    },
  ],
}
const props = { plan, history, now }

beforeEach(() => {
  localStorage.clear()
  identity.userId = 'student-a'
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:return-calendar')
      static revokeObjectURL = vi.fn()
    },
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('ReturnPrompt', () => {
  it('asks once, creates nothing until the time is chosen, and has no pressure copy', () => {
    const view = render(<ReturnPrompt {...props} />)
    expect(screen.getByText('När kör du nästa gång?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(view.container.textContent).not.toMatch(/missade|streak|daysAway|sluta|vila|\bnog\b/i)
    view.unmount()
    render(<ReturnPrompt {...props} />)
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
  })

  it('survives the StrictMode effect replay without consuming the visible prompt twice', () => {
    render(
      <StrictMode>
        <ReturnPrompt {...props} />
      </StrictMode>,
    )
    expect(screen.getByText('När kör du nästa gång?')).toBeInTheDocument()
  })

  it('dismisses for the day', () => {
    const view = render(<ReturnPrompt {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inte nu' }))
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
    view.unmount()
    render(<ReturnPrompt {...props} />)
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('offers two calendar links after choosing the time, and releases the Blob on unmount', async () => {
    const view = render(<ReturnPrompt {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' }))
    const download = screen.getByRole('link', { name: 'Lägg i kalendern (.ics)' })
    expect(download).toHaveAttribute('href', 'blob:return-calendar')
    expect(download).toHaveAttribute('download', 'hp-coach.ics')
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/calendar;charset=utf-8')
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(blob)
    })
    expect(text).toContain('DTSTART:20261022T075000\r\nDTEND:20261022T082000')
    expect(text).toContain('SUMMARY:HP-Coach · ORD')
    const google = screen.getByRole('link', { name: 'Google Kalender' })
    expect(new URL(google.getAttribute('href')!).searchParams.get('text')).toBe('HP-Coach · ORD')
    view.unmount()
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:return-calendar'))
  })

  it('waits for history and never prompts without a time or on day zero', () => {
    const view = render(<ReturnPrompt {...props} history={[]} />)
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
    view.rerender(<ReturnPrompt {...props} history={[history[0]]} />)
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
    view.rerender(<ReturnPrompt {...props} />)
    expect(screen.getByText('När kör du nästa gång?')).toBeInTheDocument()
  })

  it('never prompts for a cold-start plan or a stale plan', () => {
    const cold = { ...plan, items: [{ ...plan.items[0], id: 'cold-2026-10-21' }] }
    const view = render(<ReturnPrompt {...props} plan={cold} />)
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
    view.rerender(<ReturnPrompt {...props} plan={{ ...plan, date: '2026-10-20' }} />)
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
  })

  it('isolates account changes and suppresses signed-out users', () => {
    const view = render(<ReturnPrompt {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inte nu' }))
    identity.userId = 'student-b'
    view.rerender(<ReturnPrompt {...props} />)
    expect(screen.getByText('När kör du nästa gång?')).toBeInTheDocument()
    identity.userId = null
    view.rerender(<ReturnPrompt {...props} />)
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
  })

  it('suppresses instead of repeating when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    render(<ReturnPrompt {...props} />)
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
  })

  it('removes a stale offer at midnight, then permits the next completed local day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 21, 23, 59, 59))
    const view = render(<ReturnPrompt plan={plan} history={history} />)
    expect(screen.getByText('När kör du nästa gång?')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1_100))
    expect(screen.queryByText('När kör du nästa gång?')).not.toBeInTheDocument()
    view.rerender(
      <ReturnPrompt
        plan={{ ...plan, date: '2026-10-22' }}
        history={[{ startedAt: new Date(2026, 9, 22).toISOString() }, ...history]}
      />,
    )
    expect(screen.getByText('När kör du nästa gång?')).toBeInTheDocument()
  })
})
