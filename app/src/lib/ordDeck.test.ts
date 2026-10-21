import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ORD_INTERVALS_MS, readOrdDeck, recordOrdAnswer } from './ordDeck'

const NOW = 1_000_000
const DAY = 86_400_000

beforeEach(() => window.localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('ORD Leitner deck', () => {
  it('advances through documented intervals and caps at thirty days', () => {
    expect(ORD_INTERVALS_MS).toEqual([600_000, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY])
    for (let box = 1; box <= 6; box++) {
      recordOrdAnswer('alice', 'word-1', `qid-${box}`, true, NOW)
      expect(readOrdDeck('alice')['word-1']).toEqual({
        box: Math.min(box, 5),
        dueAt: NOW + ORD_INTERVALS_MS[Math.min(box, 5)],
        seenQids: Array.from({ length: box }, (_, i) => `qid-${i + 1}`),
      })
    }
  })

  it('resets a missed word and deduplicates seen variants', () => {
    recordOrdAnswer('alice', 'word-1', 'qid-1', true, NOW)
    recordOrdAnswer('alice', 'word-1', 'qid-2', true, NOW)
    recordOrdAnswer('alice', 'word-1', 'qid-1', false, NOW)
    expect(readOrdDeck('alice')['word-1']).toEqual({
      box: 0,
      dueAt: NOW + 600_000,
      seenQids: ['qid-1', 'qid-2'],
    })
  })

  it('persists separately for each user and word, with no anonymous deck', () => {
    recordOrdAnswer('alice', 'word-1', 'qid-1', true, NOW)
    recordOrdAnswer('alice', 'word-2', 'qid-2', false, NOW)
    recordOrdAnswer('bob', 'word-1', 'qid-1', false, NOW)
    recordOrdAnswer(null, 'word-1', 'qid-1', true, NOW)
    recordOrdAnswer('', 'word-1', 'qid-1', true, NOW)
    expect(readOrdDeck('alice')['word-1'].box).toBe(1)
    expect(readOrdDeck('alice')['word-2'].box).toBe(0)
    expect(readOrdDeck('bob')).toEqual({
      'word-1': { box: 0, dueAt: NOW + 600_000, seenQids: ['qid-1'] },
    })
    expect(readOrdDeck(null)).toEqual({})
    expect(readOrdDeck('carol')).toEqual({})
    expect(window.localStorage.length).toBe(2)
  })

  it('ignores corrupt versions and malformed entries without poisoning valid words', () => {
    recordOrdAnswer('alice', 'word-1', 'qid-1', true, NOW)
    const key = window.localStorage.key(0) as string
    window.localStorage.setItem(key, 'not json')
    expect(readOrdDeck('alice')).toEqual({})
    window.localStorage.setItem(key, JSON.stringify({ version: 99, words: {} }))
    expect(readOrdDeck('alice')).toEqual({})
    window.localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        words: {
          good: { box: 2, dueAt: NOW, seenQids: ['q'] },
          badBox: { box: 6, dueAt: NOW, seenQids: [] },
          badDue: { box: 1, dueAt: 'tomorrow', seenQids: [] },
          badSeen: { box: 1, dueAt: NOW, seenQids: [3] },
          empty: null,
        },
      }),
    )
    expect(readOrdDeck('alice')).toEqual({ good: { box: 2, dueAt: NOW, seenQids: ['q'] } })
  })

  it('tolerates unavailable storage and quota errors', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(readOrdDeck('alice')).toEqual({})
    expect(() => recordOrdAnswer('alice', 'word-1', 'qid-1', true, NOW)).not.toThrow()
  })
})
