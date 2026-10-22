import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type DailyPlan, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'
import { ReturnLink } from './ReturnLink'

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
const invitation = 'Lägg morgondagens pass i kalendern →'
const storageKey = 'hpc-return-prompt:student-a'

function expand() {
  fireEvent.click(screen.getByRole('button', { name: invitation }))
}

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

describe('ReturnLink', () => {
  it('starts with one quiet invitation and leaves the day available across Home visits', () => {
    const view = render(<ReturnLink {...props} />)
    expect(screen.getByRole('button', { name: invitation })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /I morgon/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(localStorage.getItem(storageKey)).toBeNull()
    view.unmount()
    render(<ReturnLink {...props} />)
    expect(screen.getByRole('button', { name: invitation })).toBeInTheDocument()
  })

  it('survives StrictMode without claiming the day on presentation', () => {
    render(
      <StrictMode>
        <ReturnLink {...props} />
      </StrictMode>,
    )
    expect(screen.getByRole('button', { name: invitation })).toBeInTheDocument()
    expect(localStorage.getItem(storageKey)).toBeNull()
    expand()
    expect(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' })).toHaveFocus()
    expect(localStorage.getItem(storageKey)).toBeNull()
  })

  it('expands on tap without consuming the day or creating a calendar', () => {
    const view = render(<ReturnLink {...props} />)
    expand()
    expect(screen.queryByRole('button', { name: invitation })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inte nu' })).toBeInTheDocument()
    expect(localStorage.getItem(storageKey)).toBeNull()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    view.unmount()
    render(<ReturnLink {...props} />)
    expect(screen.getByRole('button', { name: invitation })).toBeInTheDocument()
  })

  it.each([
    '{Enter}',
    ' ',
  ])('supports keyboard expansion with %s and moves focus to the choice', async (key) => {
    const user = userEvent.setup()
    render(<ReturnLink {...props} />)
    await user.tab()
    expect(screen.getByRole('button', { name: invitation })).toHaveFocus()
    await user.keyboard(key)
    expect(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Inte nu' })).toHaveFocus()
  })

  it('has no session-ending or pressure copy at any visible stage', () => {
    const view = render(<ReturnLink {...props} />)
    const forbidden = /nästa gång|klart för idag|räcker|missade|streak|daysAway|sluta|vila|\bnog\b/i
    expect(view.container.textContent).not.toMatch(forbidden)
    expand()
    expect(view.container.textContent).not.toMatch(forbidden)
    fireEvent.click(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' }))
    expect(view.container.textContent).not.toMatch(forbidden)
  })

  it('dismisses for the day', () => {
    const view = render(<ReturnLink {...props} />)
    expand()
    fireEvent.click(screen.getByRole('button', { name: 'Inte nu' }))
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    expect(localStorage.getItem(storageKey)).toBe(plan.date)
    view.unmount()
    render(<ReturnLink {...props} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('offers two calendar links after choosing the time, and releases the Blob on unmount', async () => {
    const view = render(<ReturnLink {...props} />)
    expand()
    fireEvent.click(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' }))
    const download = screen.getByRole('link', { name: 'Lägg i kalendern (.ics)' })
    expect(download).toHaveFocus()
    expect(localStorage.getItem(storageKey)).toBe(plan.date)
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
    render(<ReturnLink {...props} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
  })

  it('waits for history and never prompts without a time or on day zero', () => {
    const view = render(<ReturnLink {...props} history={[]} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    view.rerender(<ReturnLink {...props} history={[history[0]]} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    view.rerender(<ReturnLink {...props} />)
    expect(screen.getByRole('button', { name: invitation })).toBeInTheDocument()
  })

  it('never prompts for a cold-start plan or a stale plan', () => {
    const cold = { ...plan, items: [{ ...plan.items[0], id: 'cold-2026-10-21' }] }
    const view = render(<ReturnLink {...props} plan={cold} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    view.rerender(<ReturnLink {...props} plan={{ ...plan, date: '2026-10-20' }} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
  })

  it('isolates account changes and suppresses signed-out users', () => {
    const view = render(<ReturnLink {...props} />)
    expand()
    fireEvent.click(screen.getByRole('button', { name: 'Inte nu' }))
    identity.userId = 'student-b'
    view.rerender(<ReturnLink {...props} />)
    expect(screen.getByRole('button', { name: invitation })).toBeInTheDocument()
    identity.userId = 'student-a'
    view.rerender(<ReturnLink {...props} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    identity.userId = null
    view.rerender(<ReturnLink {...props} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
  })

  it('suppresses when localStorage cannot be read', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    render(<ReturnLink {...props} />)
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
  })

  it('does not create an export when the explicit daily claim cannot be saved', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    render(<ReturnLink {...props} />)
    expand()
    fireEvent.click(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' }))
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('rechecks the daily claim when another Home has used the offer', () => {
    render(<ReturnLink {...props} />)
    expand()
    localStorage.setItem(storageKey, plan.date)
    fireEvent.click(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' }))
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it.each([
    'collapsed',
    'expanded',
    'dismissed',
    'chosen',
  ])('expires the %s offer at midnight and permits the next completed local day', (stage) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 21, 23, 59, 59))
    const view = render(<ReturnLink plan={plan} history={history} />)
    expect(screen.getByRole('button', { name: invitation })).toBeInTheDocument()
    if (stage !== 'collapsed') expand()
    if (stage === 'dismissed') fireEvent.click(screen.getByRole('button', { name: 'Inte nu' }))
    if (stage === 'chosen') {
      fireEvent.click(screen.getByRole('button', { name: 'I morgon 07:50 (som idag)' }))
    }
    act(() => vi.advanceTimersByTime(1_100))
    expect(screen.queryByTestId('return-prompt')).not.toBeInTheDocument()
    if (stage === 'chosen') {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:return-calendar')
    }
    view.rerender(
      <ReturnLink
        plan={{ ...plan, date: '2026-10-22' }}
        history={[{ startedAt: new Date(2026, 9, 22).toISOString() }, ...history]}
      />,
    )
    expect(screen.getByRole('button', { name: invitation })).toBeInTheDocument()
  })
})
