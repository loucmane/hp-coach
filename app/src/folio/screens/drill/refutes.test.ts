import { describe, expect, it } from 'vitest'
import { refutes } from './refutes'

describe('refutes', () => {
  const steps = [1, 2, 3, 4, 7].map((n) => ({ n, text: `Step ${n}` }))
  it('uses only real why_wrong references, including prose, ranges and English', () => {
    expect(
      refutes(steps, [
        { letter: 'A', why_tempting: '(steg 1)', why_wrong: 'Steg 2–4 visar varför. (steg 2)' },
        { letter: 'C', why_tempting: '', why_wrong: 'Se (steg 4 och 7).' },
        { letter: 'D', why_tempting: '', why_wrong: 'Step 7 rules this out.' },
      ]),
    ).toEqual({ 2: ['A'], 3: ['A'], 4: ['A', 'C'], 7: ['C', 'D'] })
  })
  it('does not fabricate tags from numbers, titles, tempting reasons or absent steps', () => {
    expect(
      refutes(steps, [
        { letter: 'A', why_tempting: 'Steg 1', why_wrong: 'Svaret är 3. Se steg 8.' },
        { letter: 'C', why_tempting: '', why_wrong: 'Inget steg nämns.' },
      ]),
    ).toEqual({})
  })
  it('bounds ranges by the actual steps and ignores reversed references', () => {
    expect(
      refutes(steps, [{ letter: 'D', why_tempting: '', why_wrong: 'Steg 3–999999999. Steg 7–2.' }]),
    ).toEqual({ 3: ['D'], 4: ['D'], 7: ['D'] })
  })
})
