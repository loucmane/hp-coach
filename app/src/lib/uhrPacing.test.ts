import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { paceNote, UHR_DELPROV, UHR_ORDER, uhrTimeMs } from './uhrPacing'

const MIN = 60_000

describe('UHR_DELPROV', () => {
  it('matches the "Rekommenderad provtid" table printed in every booklet of the corpus', () => {
    const corpus = readFileSync(path.resolve(process.cwd(), '../hp_databas.json'), 'utf8')
    const text = JSON.stringify(JSON.parse(corpus)).replace(/\\n/g, ' ').replace(/\s+/g, ' ')
    const tables = [...text.matchAll(/Rekommenderad provtid (.{0,120})/g)].map((m) => m[1])
    expect(tables.length).toBeGreaterThan(0)
    for (const table of tables) {
      const rows = [...table.matchAll(/([A-ZÅÄÖ]{3}) (\d+) \d+–\d+ (\d+) minuter/g)]
      expect(rows.length).toBe(4)
      for (const [, code, questions, minutes] of rows) {
        expect(UHR_DELPROV[code as keyof typeof UHR_DELPROV]).toEqual({
          questions: Number(questions),
          minutes: Number(minutes),
        })
      }
    }
  })

  it('gives each half its 55 minutes', () => {
    const minutes = (codes: string[]) =>
      codes.reduce((sum, c) => sum + UHR_DELPROV[c as keyof typeof UHR_DELPROV].minutes, 0)
    expect(minutes(UHR_ORDER.slice(0, 4))).toBe(55)
    expect(minutes(UHR_ORDER.slice(4))).toBe(55)
  })
})

describe('uhrTimeMs', () => {
  it('is the booklet time for a full delprov', () => {
    expect(uhrTimeMs('ORD', 10)).toBe(3 * MIN)
    expect(uhrTimeMs('LÄS', 10)).toBe(22 * MIN)
    expect(uhrTimeMs('DTK', 12)).toBe(23 * MIN)
  })

  it('scales by the questions presented when a pass has fewer', () => {
    expect(uhrTimeMs('NOG', 3)).toBe(5 * MIN)
  })

  it('has no time for an unknown section or an empty delprov', () => {
    expect(uhrTimeMs('XXX', 10)).toBeNull()
    expect(uhrTimeMs('ORD', 0)).toBeNull()
  })
})

describe('paceNote', () => {
  it('says "i takt" within a minute either way', () => {
    expect(paceNote(22 * MIN + 59_000, 22 * MIN)).toBe('i takt')
    expect(paceNote(21 * MIN + 1_000, 22 * MIN)).toBe('i takt')
  })

  it('says the difference in whole and half minutes, without judging it', () => {
    expect(paceNote(17.5 * MIN, 12 * MIN)).toBe('5½ min mer än UHR:s tid')
    expect(paceNote(14.5 * MIN, 23 * MIN)).toBe('8½ min mindre än UHR:s tid')
    expect(paceNote(4 * MIN, 3 * MIN)).toBe('1 min mer än UHR:s tid')
  })
})
