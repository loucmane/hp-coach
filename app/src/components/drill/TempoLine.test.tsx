import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TempoLine } from './TempoLine'

describe('TempoLine', () => {
  it('sums attempt time and shows the remaining time neutrally', () => {
    render(
      <TempoLine
        section="ORD"
        questionCount={10}
        attempts={Array.from({ length: 10 }, () => ({ timeTakenMs: 16_000 }))}
      />,
    )
    expect(screen.getByTestId('drill-tempo')).toHaveTextContent('2:40 · UHR:s tid 3:00 · 20 s kvar')
  })

  it.each([
    [222_000, '3:42 · UHR:s tid 3:00 · 42 s mer'],
    [162_000, '2:42 · UHR:s tid 3:00 · 18 s kvar'],
    [180_000, '3:00 · UHR:s tid 3:00 · i takt'],
    [282_000, '4:42 · UHR:s tid 3:00 · 1 min 42 s mer'],
  ])('describes %i ms with one UHR mention', (total, copy) => {
    render(
      <TempoLine
        section="ORD"
        questionCount={10}
        attempts={Array.from({ length: 10 }, () => ({ timeTakenMs: total / 10 }))}
      />,
    )
    expect(screen.getByTestId('drill-tempo').textContent).toBe(copy)
  })

  it('uses the four-question LÄS budget and reports slower and faster times neutrally', () => {
    const view = render(
      <TempoLine
        section="LÄS"
        questionCount={4}
        attempts={Array.from({ length: 4 }, () => ({ timeTakenMs: 162_000 }))}
      />,
    )
    expect(screen.getByTestId('drill-tempo')).toHaveTextContent(
      '10:48 · UHR:s tid 8:48 · 2 min mer',
    )
    expect(screen.getByTestId('drill-tempo').textContent?.match(/UHR:s tid/g)).toHaveLength(1)
    view.rerender(
      <TempoLine
        section="LÄS"
        questionCount={4}
        attempts={Array.from({ length: 4 }, () => ({ timeTakenMs: 102_000 }))}
      />,
    )
    expect(screen.getByTestId('drill-tempo')).toHaveTextContent(
      '6:48 · UHR:s tid 8:48 · 2 min kvar',
    )
    expect(screen.getByTestId('drill-tempo').textContent?.match(/UHR:s tid/g)).toHaveLength(1)
  })

  it('does not turn loading, missing or partial timing into a zero-time claim', () => {
    const view = render(<TempoLine section="ORD" questionCount={10} attempts={undefined} />)
    expect(screen.queryByText(/i takt|mindre än|mer än/)).toBeNull()
    view.rerender(
      <TempoLine section="ORD" questionCount={10} attempts={[{ timeTakenMs: 10_000 }]} />,
    )
    expect(screen.queryByText(/UHR:s tid/)).toBeNull()
    view.rerender(
      <TempoLine
        section="LÄS"
        questionCount={4}
        attempts={[
          { timeTakenMs: null },
          { timeTakenMs: 1 },
          { timeTakenMs: 1 },
          { timeTakenMs: 1 },
        ]}
      />,
    )
    expect(screen.queryByText(/UHR:s tid/)).toBeNull()
  })
})
