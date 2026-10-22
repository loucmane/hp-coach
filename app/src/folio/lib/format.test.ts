import { expect, it } from 'vitest'
import { fmtScore, inWords, roundMinutes } from './format'

it('formats Swedish scores and counts', () => {
  expect(fmtScore(1.45)).toBe('1,4')
  expect(inWords(1)).toBe('en')
  expect(inWords(12)).toBe('12')
})

it('scales round estimates, with safe defaults for missing counts', () => {
  expect(roundMinutes(8, { count: 10, minutes: 11 })).toBe(9)
  expect(roundMinutes(8, { count: 0, minutes: 9 })).toBe(9)
  expect(roundMinutes(0)).toBe(1)
  expect(roundMinutes(8)).toBe(8)
})
