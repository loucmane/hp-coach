import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TempoLine } from './TempoLine'

describe('TempoLine', () => {
  it('sums attempt time and uses the existing neutral paceNote wording', () => {
    render(
      <TempoLine
        section="ORD"
        questionCount={10}
        attempts={Array.from({ length: 10 }, () => ({ timeTakenMs: 16_000 }))}
      />,
    )
    expect(screen.getByTestId('drill-tempo')).toHaveTextContent('2:40 · UHR:s tid 3:00 · i takt')
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
      '10:48 · UHR:s tid 8:48 · 2 min mer än UHR:s tid',
    )
    view.rerender(
      <TempoLine
        section="LÄS"
        questionCount={4}
        attempts={Array.from({ length: 4 }, () => ({ timeTakenMs: 102_000 }))}
      />,
    )
    expect(screen.getByTestId('drill-tempo')).toHaveTextContent(
      '6:48 · UHR:s tid 8:48 · 2 min mindre än UHR:s tid',
    )
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
