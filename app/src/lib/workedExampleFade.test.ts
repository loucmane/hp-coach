import { beforeEach, describe, expect, it, vi } from 'vitest'

import { completeWorkedExample, readWorkedExampleLevel } from './workedExampleFade'

describe('worked example fading', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('counts distinct completed questions per user and section, capped at level two', () => {
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(0)
    completeWorkedExample('alice', 'NOG', 'first')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(1)
    expect(readWorkedExampleLevel('bob', 'NOG')).toBe(0)
    expect(readWorkedExampleLevel('alice', 'KVA')).toBe(0)
    completeWorkedExample('alice', 'NOG', 'first')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(1)
    completeWorkedExample('alice', 'NOG', 'second')
    completeWorkedExample('alice', 'NOG', 'third')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(2)
  })

  it('ignores legacy counters because they do not identify completed questions', () => {
    localStorage.setItem('hpc-worked-examples-v1:alice:NOG', '2')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(0)
    completeWorkedExample('alice', 'NOG', 'first')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(1)
  })

  it.each([
    'not json',
    '-2',
    '1.5',
    '{}',
    '[null]',
    '[1]',
    '[""]',
  ])('tolerates malformed stored question sets: %s', (value) => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(value)
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(0)
  })

  it('deduplicates persisted question IDs', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('["first", "first"]')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(1)
  })

  it('tolerates unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('not a count')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(0)
    vi.mocked(Storage.prototype.getItem).mockReturnValue('-2')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(0)
    vi.mocked(Storage.prototype.getItem).mockReturnValue('1.5')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(0)
    vi.mocked(Storage.prototype.getItem).mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(0)
    expect(() => completeWorkedExample('alice', 'NOG', 'first')).not.toThrow()
  })
})
