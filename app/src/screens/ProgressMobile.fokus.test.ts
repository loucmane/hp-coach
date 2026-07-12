import { describe, expect, it } from 'vitest'

import { fokusRankLine } from './ProgressMobile'

// Owner-reported 2026-07-12: with a single drilled section, Fokus
// claimed "Lägsta sektionen just nu" — a comparison with nothing to
// compare against (the section is equally the highest). And every
// rank in the top-3 list carried the same "lägsta" line.
describe('fokusRankLine', () => {
  it('never claims "lägsta" when only one section has data', () => {
    expect(fokusRankLine(0, 1)).toBe('Enda sektionen med försök hittills')
    expect(fokusRankLine(0, 0)).toBe('Enda sektionen med försök hittills')
  })

  it('states the actual rank when a comparison exists', () => {
    expect(fokusRankLine(0, 3)).toBe('Lägsta sektionen just nu')
    expect(fokusRankLine(1, 3)).toBe('Näst lägst just nu')
    expect(fokusRankLine(2, 8)).toBe('Tredje lägst just nu')
  })
})
