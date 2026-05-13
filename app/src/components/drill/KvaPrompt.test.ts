import { describe, expect, it } from 'vitest'

import { splitKvaPrompt } from './KvaPrompt'

describe('splitKvaPrompt', () => {
  it('splits a canonical condition + Kvantitet I + Kvantitet II prompt', () => {
    // Real shape emitted by the quant parser — note the TAB (U+0009)
    // after each "Kvantitet N:" colon, where the PDF had a column
    // separator. The split should drop that TAB along with surrounding
    // spaces.
    const prompt = 'b = a + 1 Kvantitet I:\t ab – 2a^{2} Kvantitet II:\t a(b – 2a)'
    const split = splitKvaPrompt(prompt)
    expect(split).not.toBeNull()
    expect(split?.condition).toBe('b = a + 1')
    expect(split?.kvI).toBe('ab – 2a^{2}')
    expect(split?.kvII).toBe('a(b – 2a)')
  })

  it('handles prompts with no leading condition', () => {
    const prompt = 'Kvantitet I: 12 Kvantitet II: 3 · 4'
    const split = splitKvaPrompt(prompt)
    expect(split?.condition).toBe('')
    expect(split?.kvI).toBe('12')
    expect(split?.kvII).toBe('3 · 4')
  })

  it('still splits when Kvantitet II has parser-garbled suffix', () => {
    // var-2022-1 sample: `Kvantitet II:_{2} 16 π` — the colon is
    // there but the parser concatenated `_{2}` directly after it.
    // The split still finds the marker; the kvII just inherits the
    // garbage. Better an imperfect split than a run-on fallback.
    const prompt = 'Kvantitet I:\t c m 3 Kvantitet II:_{2} 16 π'
    const split = splitKvaPrompt(prompt)
    expect(split?.kvI).toBe('c m 3')
    expect(split?.kvII).toBe('_{2} 16 π')
  })

  it('returns null when one quantity is empty', () => {
    const prompt = 'Kvantitet I: Kvantitet II: 7'
    expect(splitKvaPrompt(prompt)).toBeNull()
  })

  it('returns null on a non-KVA prompt', () => {
    expect(splitKvaPrompt('Vilket av följande är störst?')).toBeNull()
  })

  it('does not break when "Kvantitet I" appears inside other text', () => {
    // Edge case: a prose mention of "Kvantitet I" without the colon
    // shouldn't be picked up.
    expect(splitKvaPrompt('Kvantitet I är inte definierad.')).toBeNull()
  })
})
