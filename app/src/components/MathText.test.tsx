// flattenMathText / flattenLatex — plain-text projection of bank
// strings for attribute contexts (alt, aria-label) where KaTeX HTML
// can't render. The contract: never leak the U+E000/U+E001 sentinels
// or raw LaTeX control sequences into a plain string.

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { flattenLatex, flattenMathText, MathText } from './MathText'

const M = (latex: string) => `\uE000${latex}\uE001`

describe('flattenLatex', () => {
  it('drops subscript markup: L_{1} → L1', () => {
    expect(flattenLatex('L_{1}')).toBe('L1')
  })

  it('keeps a caret for superscripts: x^{2} → x^2', () => {
    expect(flattenLatex('x^{2}')).toBe('x^2')
  })

  it('fractions become slashes', () => {
    expect(flattenLatex('\\frac{3}{4}')).toBe('3/4')
  })

  it('common operators map to unicode', () => {
    expect(flattenLatex('a \\cdot b \\leq c')).toBe('a · b ≤ c')
  })

  it('unwraps \\mathrm units', () => {
    expect(flattenLatex('12 \\mathrm{dm}^{3}')).toBe('12 dm^3')
  })

  it('drops unknown commands and stray braces rather than leaking them', () => {
    expect(flattenLatex('\\overline{AB}')).toBe('AB')
  })
})

describe('flattenMathText', () => {
  it('passes plain prose through untouched', () => {
    expect(flattenMathText('fundera över')).toBe('fundera över')
  })

  it('handles null/undefined', () => {
    expect(flattenMathText(null)).toBe('')
    expect(flattenMathText(undefined)).toBe('')
  })

  it('flattens the NOG-023 option to readable text with no sentinels', () => {
    const raw = `i ${M('(_{1}')} ) tillsammans med ${M('(_{2}')} )`
    expect(flattenMathText(raw)).toBe('i (1 ) tillsammans med (2 )')
  })

  it('tolerates an unbalanced open sentinel', () => {
    expect(flattenMathText(`x ${'\uE000'}y_{1}`)).toBe('x y1')
  })
})

describe('MathText aria-label', () => {
  it('exposes flattened plain text, not raw LaTeX', () => {
    const { container } = render(<MathText>{`f ${M('L_{1}')}`}</MathText>)
    const math = container.querySelector('[role="math"]')
    expect(math?.getAttribute('aria-label')).toBe('L1')
  })
})
