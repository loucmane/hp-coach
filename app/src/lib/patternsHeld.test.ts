import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readPatternsHeld, rememberPatternsHeld } from './patternsHeld'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('patterns held per user on this device', () => {
  it('starts at zero and remembers only increases', () => {
    expect(readPatternsHeld('user-a')).toBe(0)
    expect(rememberPatternsHeld(14, 'user-a')).toBe(14)
    expect(rememberPatternsHeld(3, 'user-a')).toBe(14)
    expect(readPatternsHeld('user-a')).toBe(14)
    expect(rememberPatternsHeld(15, 'user-a')).toBe(15)
  })

  it('does not share peaks between two accounts or adopt the old shared peak', () => {
    localStorage.setItem('hpc:patterns-held:v1', '99')
    expect(readPatternsHeld('user-a')).toBe(0)
    expect(rememberPatternsHeld(14, 'user-a')).toBe(14)
    expect(readPatternsHeld('user-b')).toBe(0)
    expect(rememberPatternsHeld(2, 'user-b')).toBe(2)
    expect(readPatternsHeld('user-a')).toBe(14)
    expect(readPatternsHeld('user-b')).toBe(2)
    expect(localStorage.getItem('hpc:patterns-held:v1:user-a')).toBe('14')
  })

  it.each([undefined, null, ''])('uses no stored peak without a user id: %s', (userId) => {
    rememberPatternsHeld(14, 'user-a')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    expect(readPatternsHeld(userId)).toBe(0)
    expect(rememberPatternsHeld(3, userId)).toBe(3)
    expect(rememberPatternsHeld(0, userId)).toBe(0)
    expect(getItem).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
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
    expect(readPatternsHeld('user-a')).toBe(0)
  })

  it('tolerates unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readPatternsHeld('user-a')).toBe(0)
    expect(rememberPatternsHeld(14, 'user-a')).toBe(14)
  })

  it('keeps the stored peak when writes fail', () => {
    rememberPatternsHeld(14, 'user-a')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(rememberPatternsHeld(20, 'user-a')).toBe(20)
    expect(readPatternsHeld('user-a')).toBe(14)
  })
})
