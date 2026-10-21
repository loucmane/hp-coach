import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { EXAM_SITTINGS, examFor } from './sittings'

describe('worker sitting calendar', () => {
  it('mirrors every app sitting id and calendar date in the same order', () => {
    const source = readFileSync(new URL('../../../app/src/lib/dates.ts', import.meta.url), 'utf8')
    const calendar = source.match(/export const EXAM_SITTINGS[^=]*=\s*\[([\s\S]*?)\n\]/)?.[1]
    expect(calendar).toBeDefined()
    const entries = [...(calendar ?? '').matchAll(/\{[^}]*\}/g)]
    expect(entries.length).toBeGreaterThan(0)
    const appSittings = entries.map(([entry]) => {
      const id = entry.match(/id:\s*'([^']+)'/)?.[1]
      const date = entry.match(/date:\s*new Date\((\d+),\s*(\d+),\s*(\d+)\)/)
      expect(id).toBeDefined()
      expect(date).not.toBeNull()
      return { id, date: new Date(Number(date?.[1]), Number(date?.[2]), Number(date?.[3])) }
    })
    expect(EXAM_SITTINGS).toEqual(appSittings)
  })

  it('honours a saved future sitting even when another sitting is sooner', () => {
    expect(examFor('var-2027', new Date(2026, 8, 1))).toEqual(new Date(2027, 3, 10))
    expect(examFor('host-2027', new Date(2026, 8, 1))).toEqual(new Date(2027, 9, 24))
  })

  it.each([null, undefined, 'unknown'])('falls back to the next sitting for %s', (id) => {
    expect(examFor(id, new Date(2026, 8, 1))).toEqual(new Date(2026, 9, 18))
  })

  it('keeps a saved sitting through its whole exam day, then rolls forward', () => {
    expect(examFor('host-2026', new Date(2026, 9, 18, 23, 59, 59))).toEqual(new Date(2026, 9, 18))
    expect(examFor('host-2026', new Date(2026, 9, 19))).toEqual(new Date(2027, 3, 10))
  })

  it('also keeps the fallback sitting through exam day', () => {
    expect(examFor(null, new Date(2027, 3, 10, 23, 59, 59))).toEqual(new Date(2027, 3, 10))
  })

  it('keeps a saved spring sitting through its whole exam day', () => {
    expect(examFor('var-2027', new Date(2027, 3, 10, 23, 59, 59))).toEqual(new Date(2027, 3, 10))
  })

  it.each([
    'host-2026',
    'var-2027',
    'unknown',
    null,
    undefined,
  ])('rolls an expired, missing or unknown target (%s) to autumn after spring', (id) => {
    expect(examFor(id, new Date(2027, 3, 11))).toEqual(new Date(2027, 9, 24))
  })

  it.each(['host-2027', null])('keeps the final sitting through its whole exam day (%s)', (id) => {
    expect(examFor(id, new Date(2027, 9, 24, 23, 59, 59))).toEqual(new Date(2027, 9, 24))
  })

  it.each([
    'host-2026',
    'var-2027',
    'host-2027',
    'unknown',
    null,
    undefined,
  ])('returns null after the calendar ends, even for a saved id (%s)', (id) => {
    expect(examFor(id, new Date(2027, 9, 25))).toBeNull()
  })
})
