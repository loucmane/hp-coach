import { beforeEach, describe, expect, it, vi } from 'vitest'

import { completeWorkedExample, readWorkedExampleLevel } from './workedExampleFade'

describe('worked example fading', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('counts completed examples per user and section, capped at level two', () => {
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(0)
    completeWorkedExample('alice', 'NOG')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(1)
    expect(readWorkedExampleLevel('bob', 'NOG')).toBe(0)
    expect(readWorkedExampleLevel('alice', 'KVA')).toBe(0)
    completeWorkedExample('alice', 'NOG')
    completeWorkedExample('alice', 'NOG')
    expect(readWorkedExampleLevel('alice', 'NOG')).toBe(2)
  })

  it('tolerates unavailable storage and malformed counters', () => {
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
    expect(() => completeWorkedExample('alice', 'NOG')).not.toThrow()
  })
})
