import { describe, expect, it } from 'vitest'

import { keepMathTogether } from './keepMathTogether'

// `~` marks an expected no-break space (U+00A0); no input contains a `~`.
const NB = '\u00A0'
const nb = (text: string) => text.replace(/~/g, NB)
// The parser's inline-math sentinels, kept as escapes: editors strip the literal characters.
const O = '\uE000'
const C = '\uE001'

describe('keepMathTogether: the R6 examples', () => {
  it.each([
    ['II − I = 1 − (−1) = 2', 'II~−~I~=~1~−~(−1)~=~2'],
    ['(−10, −1)', '(−10,~−1)'],
    ['40 m/s', '40~m/s'],
    ['I: x · II: 0', 'I:~x · II:~0'],
    ['basen b − 1', 'basen b~−~1'],
    ['x² = −5x', 'x²~=~−5x'],
  ])('%s', (input, expected) => {
    expect(keepMathTogether(input)).toBe(nb(expected))
  })

  it('keeps a whole Repetera stem breakable only between its segments', () => {
    expect(keepMathTogether('x ≠ 0 och x² = −5x · I: x · II: 0')).toBe(
      nb('x~≠~0 och x²~=~−5x · I:~x · II:~0'),
    )
  })
})

describe('keepMathTogether: every build.py rule', () => {
  it.each([
    // Each operator holds on to both operands.
    ['a = b', 'a~=~b'],
    ['a + b', 'a~+~b'],
    ['−1 < 1', '−1~<~1'],
    ['2 > −1', '2~>~−1'],
    ['a ≠ b', 'a~≠~b'],
    ['π ≈ 3,14', 'π~≈~3,14'],
    ['3 × 4', '3~×~4'],
    ['x ± 1', 'x~±~1'],
    ['x ≤ 2', 'x~≤~2'],
    ['y ≥ 0', 'y~≥~0'],
    // An operator at the start or the end of the text keeps its operand.
    ['= −1', '=~−1'],
    ['x =', 'x~='],
    // I: and II: keep their term.
    ['I: x, II: 2y', 'I:~x, II:~2y'],
    // A number keeps its unit.
    ['100 km/h', '100~km/h'],
    ['ca 12 km bort', 'ca 12~km bort'],
    // Products stay whole.
    ['5/6 · 5/6', '5/6~·~5/6'],
    ['(−2) · ½', '(−2)~·~½'],
    ['2 · (−1/2)', '2~·~(−1/2)'],
    ['k₁ · k₂ = −1', 'k₁~·~k₂~=~−1'],
  ])('%s', (input, expected) => {
    expect(keepMathTogether(input)).toBe(nb(expected))
  })

  it.each([
    'Vilket värde har x?',
    'Hur många procent av 40 är 10?',
    'I fallet VI: x',
    'III: 3',
    'Del 2 - kvant',
    'x · y',
    '40 m/sek',
    '',
  ])('leaves plain prose alone: %j', (input) => {
    expect(keepMathTogether(input)).toBe(input)
  })
})

describe('keepMathTogether: math delimiters', () => {
  it('never touches the text inside a math pair', () => {
    const math = `${O}a = b \\cdot c, (1, 2)${C}`
    expect(keepMathTogether(math)).toBe(math)
  })

  it('joins the prose around a math pair, and never the math itself', () => {
    expect(keepMathTogether(`Om ${O}x^{2} = 4${C} = y gäller`)).toBe(
      nb(`Om ${O}x^{2} = 4${C}~=~y gäller`),
    )
  })

  it('treats each math pair as one operand', () => {
    expect(keepMathTogether(`${O}x${C} = ${O}y${C}`)).toBe(nb(`${O}x${C}~=~${O}y${C}`))
    expect(keepMathTogether(`${O}x${C}= 5`)).toBe(nb(`${O}x${C}=~5`))
    expect(keepMathTogether(`5 =${O}x${C}`)).toBe(nb(`5~=${O}x${C}`))
    expect(keepMathTogether(`(${O}a${C}, ${O}b${C})`)).toBe(nb(`(${O}a${C},~${O}b${C})`))
    expect(keepMathTogether(`${O}k_{1}${C} · ${O}k_{2}${C}`)).toBe(
      nb(`${O}k_{1}${C}~·~${O}k_{2}${C}`),
    )
  })

  it('keeps I:/II: segments apart when their terms are math', () => {
    expect(keepMathTogether(`I: ${O}\\frac{1}{2}${C} · II: ${O}0{,}5${C}`)).toBe(
      nb(`I:~${O}\\frac{1}{2}${C} · II:~${O}0{,}5${C}`),
    )
    expect(keepMathTogether(`Kvantitet I: ${O}\\dfrac{x}{3}${C}  Kvantitet II: y`)).toBe(
      nb(`Kvantitet I:~${O}\\dfrac{x}{3}${C}  Kvantitet II:~y`),
    )
  })

  it('leaves an unclosed math segment untouched to the end', () => {
    expect(keepMathTogether(`x = ${O}a = b`)).toBe(nb(`x~=~${O}a = b`))
  })
})

describe('keepMathTogether: stability', () => {
  it('is idempotent', () => {
    for (const input of [
      'II − I = 1 − (−1) = 2',
      'x ≠ 0 och x² = −5x · I: x · II: 0',
      '(−10, −1) och 40 m/s',
      `I: ${O}\\frac{1}{2}${C} · II: ${O}0{,}5${C}`,
      'k₁ · k₂ = −1',
    ]) {
      const once = keepMathTogether(input)
      expect(keepMathTogether(once)).toBe(once)
    }
  })
})
