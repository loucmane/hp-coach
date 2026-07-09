// prov.tsx — Provpass picker + instructions interstitial (PR 3,
// presentational only). Tests target the exported `Picker` and
// `Instructions` screens directly (no router harness needed — they
// take plain props/callbacks, same idiom as DrillResult/
// DiagnosticReport tests).

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { PassOption } from '@/components/mock/passOption'
import { Instructions, Picker } from './prov'

function pass(overrides: Partial<PassOption> = {}): PassOption {
  return {
    examId: 'var-2018-1',
    provpass: 'verb1',
    half: 'verbal',
    presented: 40,
    seenBefore: 3,
    totalExposure: 5,
    ...overrides,
  }
}

describe('Picker', () => {
  it('renders the mode and half toggles with the given value active', () => {
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('prov-mode-authentic')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('prov-mode-synthetic')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('prov-half-verbal')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('prov-half-kvant')).toHaveAttribute('aria-pressed', 'false')
  })

  it('fires onModeChange / onHalfChange when a toggle word is clicked', () => {
    const onModeChange = vi.fn()
    const onHalfChange = vi.fn()
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={onModeChange}
        onHalfChange={onHalfChange}
        passes={[]}
        onStart={() => {}}
      />,
    )
    fireEvent.click(screen.getByTestId('prov-mode-synthetic'))
    expect(onModeChange).toHaveBeenCalledWith('synthetic')
    fireEvent.click(screen.getByTestId('prov-half-kvant'))
    expect(onHalfChange).toHaveBeenCalledWith('kvant')
  })

  it('shows the empty state in authentic mode when no passes match the half', () => {
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('prov-authentic-empty')).toBeInTheDocument()
  })

  it('lists authentic passes filtered to the active half, exposure badge, suggested top row', () => {
    const passes = [
      pass({ examId: 'var-2019', provpass: 'verb1', seenBefore: 8, presented: 40 }),
      pass({ examId: 'var-2018-1', provpass: 'verb1', seenBefore: 1, presented: 40 }),
      pass({ examId: 'var-2020', provpass: 'kvant1', half: 'kvant', seenBefore: 0, presented: 40 }),
    ]
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={passes}
        onStart={() => {}}
      />,
    )
    // Only verbal passes render.
    expect(screen.getByTestId('prov-pass-var-2019-verb1')).toBeInTheDocument()
    expect(screen.getByTestId('prov-pass-var-2018-1-verb1')).toBeInTheDocument()
    expect(screen.queryByTestId('prov-pass-var-2020-kvant1')).not.toBeInTheDocument()
    // Exposure badge text.
    expect(screen.getByTestId('prov-pass-var-2019-verb1')).toHaveTextContent('sett 8/40')
    // Top (first) row is visually suggested.
    expect(
      screen
        .getByTestId('prov-pass-var-2019-verb1')
        .querySelector('[data-testid="prov-pass-suggested"]'),
    ).toBeInTheDocument()
    expect(
      screen
        .getByTestId('prov-pass-var-2018-1-verb1')
        .querySelector('[data-testid="prov-pass-suggested"]'),
    ).not.toBeInTheDocument()
  })

  it('shows a completeness badge only when presented < 40', () => {
    const passes = [
      pass({ examId: 'var-2018-1', provpass: 'verb1', presented: 39 }),
      pass({ examId: 'var-2019', provpass: 'verb1', presented: 40 }),
    ]
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={passes}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('prov-pass-var-2018-1-verb1')).toHaveTextContent('39/40 frågor')
    expect(screen.getByTestId('prov-pass-var-2019-verb1')).not.toHaveTextContent('40/40 frågor')
  })

  it('starting an authentic pass row fires onStart', () => {
    const onStart = vi.fn()
    render(
      <Picker
        mode="authentic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[pass()]}
        onStart={onStart}
      />,
    )
    fireEvent.click(screen.getByTestId('prov-pass-var-2018-1-verb1'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('renders the synthetic CTA card with the quota line and indikativ note', () => {
    render(
      <Picker
        mode="synthetic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={() => {}}
      />,
    )
    const cta = screen.getByTestId('prov-synthetic-cta')
    expect(cta).toHaveTextContent('40 frågor · ORD 10 · LÄS 10 · MEK 10 · ELF 10')
    expect(screen.getByTestId('prov-synthetic-note')).toHaveTextContent(
      'Indikativt resultat — inte ett riktigt pass.',
    )
  })

  it('renders the kvant quota line when half is kvant', () => {
    render(
      <Picker
        mode="synthetic"
        half="kvant"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={() => {}}
      />,
    )
    expect(screen.getByTestId('prov-synthetic-cta')).toHaveTextContent(
      '40 frågor · XYZ 12 · KVA 10 · NOG 6 · DTK 12',
    )
  })

  it('starting a synthetic pass fires onStart', () => {
    const onStart = vi.fn()
    render(
      <Picker
        mode="synthetic"
        half="verbal"
        onModeChange={() => {}}
        onHalfChange={() => {}}
        passes={[]}
        onStart={onStart}
      />,
    )
    fireEvent.click(screen.getByTestId('prov-synthetic-cta'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})

describe('Instructions', () => {
  it('renders the mandatory rules and a single start CTA', () => {
    render(<Instructions onStart={() => {}} onBack={() => {}} />)
    const rules = screen.getByTestId('prov-instructions-rules')
    expect(rules).toHaveTextContent('40 frågor')
    expect(rules).toHaveTextContent('55 minuter')
    expect(rules).toHaveTextContent('ingen paus')
    expect(rules).toHaveTextContent('du kan ändra svar tills tiden går ut')
    expect(rules).toHaveTextContent('avbryter du blir provet ogiltigt')
    expect(rules).toHaveTextContent('lämna ingen fråga obesvarad — fel ger inga avdrag')
    expect(screen.getByTestId('prov-instructions-start')).toHaveTextContent('Starta provpasset →')
  })

  it('fires onStart when the CTA is clicked', () => {
    const onStart = vi.fn()
    render(<Instructions onStart={onStart} onBack={() => {}} />)
    fireEvent.click(screen.getByTestId('prov-instructions-start'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('fires onBack when the back affordance is clicked', () => {
    const onBack = vi.fn()
    render(<Instructions onStart={() => {}} onBack={onBack} />)
    fireEvent.click(screen.getByTestId('prov-instructions-back'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
