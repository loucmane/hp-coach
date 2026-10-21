import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QuietClock } from './QuietClock'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000_000)
})
afterEach(() => vi.useRealTimers())

describe('QuietClock', () => {
  it('counts answering time and stays paused throughout feedback', () => {
    const began = Date.now()
    const view = render(<QuietClock budgetMs={180_000} elapsedMs={0} runningSince={began} />)
    expect(screen.getByRole('timer')).toHaveTextContent('3:00')
    act(() => vi.advanceTimersByTime(20_000))
    expect(screen.getByRole('timer')).toHaveTextContent('2:40')
    view.rerender(<QuietClock budgetMs={180_000} elapsedMs={20_000} runningSince={null} />)
    act(() => vi.advanceTimersByTime(90_000))
    expect(screen.getByRole('timer')).toHaveTextContent('2:40')
    expect(screen.getByText('Paus under återkoppling')).toBeInTheDocument()
    view.rerender(<QuietClock budgetMs={180_000} elapsedMs={20_000} runningSince={Date.now()} />)
    act(() => vi.advanceTimersByTime(10_000))
    expect(screen.getByRole('timer')).toHaveTextContent('2:30')
  })

  it('passes zero quietly, keeps counting overtime, and has no end action', () => {
    const view = render(<QuietClock budgetMs={3_000} elapsedMs={0} runningSince={Date.now()} />)
    act(() => vi.advanceTimersByTime(3_000))
    expect(screen.getByRole('timer')).toHaveTextContent('0:00')
    act(() => vi.advanceTimersByTime(65_000))
    expect(screen.getByRole('timer')).toHaveTextContent('+1:05')
    expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(view.container.querySelector('audio')).toBeNull()
  })

  it('recomputes from wall time after throttling instead of counting ticks', () => {
    render(<QuietClock budgetMs={180_000} elapsedMs={0} runningSince={Date.now()} />)
    act(() => {
      vi.setSystemTime(Date.now() + 195_000)
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByRole('timer')).toHaveTextContent('+0:15')
  })
})
