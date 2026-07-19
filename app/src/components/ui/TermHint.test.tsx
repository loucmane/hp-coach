// TermHint — the label micro-glossary (P2.2). Every epistemic label a
// day-zero user meets gets a one-tap plain sentence, owner-ratified
// copy, revealed inline in the print idiom.

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GLOSSARY, TermHint } from './TermHint'

describe('GLOSSARY — owner-ratified copy, verbatim', () => {
  it('normerat (härlett)', () => {
    expect(GLOSSARY['normerat-harlett'].label).toBe('normerat (härlett)')
    expect(GLOSSARY['normerat-harlett'].sentence).toBe(
      'Rättat mot det riktiga provets poängtabell. Så nära en riktig normering det går utan UHR.',
    )
  })
  it('indikativ', () => {
    expect(GLOSSARY.indikativ.label).toBe('indikativ')
    expect(GLOSSARY.indikativ.sentence).toBe(
      'En grov uppskattning — passet är hopplockat, så det finns ingen riktig poängtabell. Använd den för tempo, inte för prognos.',
    )
  })
  it('preliminär', () => {
    expect(GLOSSARY.preliminar.label).toBe('preliminär')
    expect(GLOSSARY.preliminar.sentence).toBe(
      'Svårighetsgraden är beräknad, inte ännu bekräftad av riktiga svar.',
    )
  })
})

describe('TermHint', () => {
  it('renders the term as a button with aria-expanded=false and no sentence', () => {
    render(<TermHint term="indikativ" />)
    const btn = screen.getByRole('button', { name: /indikativ/ })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/grov uppskattning/)).toBeNull()
  })

  it('tap reveals the sentence inline; aria-expanded flips true', () => {
    render(<TermHint term="normerat-harlett" />)
    const btn = screen.getByRole('button', { name: /normerat/ })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Rättat mot det riktiga provets poängtabell/)).toBeInTheDocument()
  })

  it('second tap dismisses', () => {
    render(<TermHint term="indikativ" />)
    const btn = screen.getByRole('button', { name: /indikativ/ })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/grov uppskattning/)).toBeNull()
  })

  it('Escape dismisses', () => {
    render(<TermHint term="indikativ" />)
    fireEvent.click(screen.getByRole('button', { name: /indikativ/ }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText(/grov uppskattning/)).toBeNull()
  })

  it('tap outside dismisses', () => {
    render(
      <div>
        <TermHint term="indikativ" />
        <p data-testid="outside">annat</p>
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: /indikativ/ }))
    fireEvent.pointerDown(screen.getByTestId('outside'))
    expect(screen.queryByText(/grov uppskattning/)).toBeNull()
  })

  it('custom children render as the visible label (capitalised inline use)', () => {
    render(<TermHint term="indikativ">Indikativt</TermHint>)
    expect(screen.getByRole('button', { name: /Indikativt/ })).toBeInTheDocument()
  })

  it('button controls the note via aria-controls', () => {
    render(<TermHint term="preliminar" />)
    const btn = screen.getByRole('button', { name: /preliminär/ })
    fireEvent.click(btn)
    const id = btn.getAttribute('aria-controls')
    expect(id).toBeTruthy()
    expect(document.getElementById(id as string)?.textContent).toContain('Svårighetsgraden')
  })
})
