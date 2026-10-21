import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readPatternsHeld, rememberPatternsHeld } from './patternsHeld'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('patterns held on this device', () => {
  it('starts at zero and remembers only increases', () => {
    expect(readPatternsHeld()).toBe(0)
    expect(rememberPatternsHeld(14)).toBe(14)
    expect(rememberPatternsHeld(3)).toBe(14)
    expect(readPatternsHeld()).toBe(14)
    expect(rememberPatternsHeld(15)).toBe(15)
  })

  it.each([
    'garbage',
    '-1',
    'NaN',
    'Infinity',
    '1.5',
    '9007199254740992',
  ])('ignores corrupt stored counts: %s', (value) => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(value)
    expect(readPatternsHeld()).toBe(0)
  })

  it('tolerates unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readPatternsHeld()).toBe(0)
    expect(rememberPatternsHeld(14)).toBe(14)
  })

  it('keeps the stored peak when writes fail', () => {
    rememberPatternsHeld(14)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(rememberPatternsHeld(20)).toBe(20)
    expect(readPatternsHeld()).toBe(14)
  })
})
