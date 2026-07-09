// mockSheet reducer — dwell accumulation across revisits, change-answer
// last-wins, and the summary adapter.

import { describe, expect, it } from 'vitest'

import {
  createMockSheet,
  dwellFor,
  type MockSheetState,
  mockSheetReducer,
  toSummarySheet,
} from './mockSheet'

function reduce(state: MockSheetState, ...actions: Parameters<typeof mockSheetReducer>[1][]) {
  return actions.reduce(mockSheetReducer, state)
}

describe('mockSheetReducer', () => {
  it('enter starts a dwell clock; leave flushes elapsed time', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 1000 })
    s = reduce(s, { type: 'leave', now: 4000 })
    expect(s.dwellMs.get('q1')).toBe(3000)
    expect(s.current).toBeNull()
  })

  it('revisiting the same question ACCUMULATES dwell, not resets', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 0 })
    s = reduce(s, { type: 'leave', now: 2000 }) // +2000
    s = reduce(s, { type: 'enter', qid: 'q2', now: 2000 })
    s = reduce(s, { type: 'leave', now: 3000 }) // q2 +1000
    s = reduce(s, { type: 'enter', qid: 'q1', now: 3000 })
    s = reduce(s, { type: 'leave', now: 3500 }) // q1 +500 → total 2500
    expect(s.dwellMs.get('q1')).toBe(2500)
    expect(s.dwellMs.get('q2')).toBe(1000)
  })

  it('pick with a changed answer is last-wins (overwrites the letter)', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'pick', qid: 'q1', letter: 'A', now: 100 })
    s = reduce(s, { type: 'pick', qid: 'q1', letter: 'C', now: 200 })
    expect(s.answers.get('q1')).toEqual({ letter: 'C', lastAt: 200 })
  })

  it('pick does not itself advance dwell — only enter/leave/settle do', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 0 })
    s = reduce(s, { type: 'pick', qid: 'q1', letter: 'A', now: 500 })
    expect(s.dwellMs.get('q1')).toBeUndefined()
    s = reduce(s, { type: 'leave', now: 1500 })
    expect(s.dwellMs.get('q1')).toBe(1500)
  })

  it('entering a new qid without leaving the previous one first still flushes it', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 0 })
    // No explicit leave — jump straight to q2 (grid navigation).
    s = reduce(s, { type: 'enter', qid: 'q2', now: 1000 })
    expect(s.dwellMs.get('q1')).toBe(1000)
    expect(s.current).toEqual({ qid: 'q2', enteredAt: 1000 })
  })

  it('settle flushes the in-flight visit like leave', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 0 })
    s = reduce(s, { type: 'settle', now: 5000 })
    expect(s.dwellMs.get('q1')).toBe(5000)
    expect(s.current).toBeNull()
  })

  it('leave with no current question is a no-op', () => {
    const s0 = createMockSheet()
    const s1 = reduce(s0, { type: 'leave', now: 1000 })
    expect(s1.dwellMs.size).toBe(0)
    expect(s1.current).toBeNull()
  })

  it('zero or negative elapsed time (clock jump) does not record negative dwell', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 5000 })
    s = reduce(s, { type: 'leave', now: 4000 }) // clock went backwards
    expect(s.dwellMs.has('q1')).toBe(false)
  })
})

describe('dwellFor', () => {
  it('includes the live in-flight visit when the qid is current', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 1000 })
    expect(dwellFor(s, 'q1', 4000)).toBe(3000)
  })

  it('returns the settled total for a non-current qid', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 0 })
    s = reduce(s, { type: 'leave', now: 2000 })
    expect(dwellFor(s, 'q1', 99_999)).toBe(2000)
  })

  it('returns 0 for a qid never visited', () => {
    expect(dwellFor(createMockSheet(), 'ghost', 1000)).toBe(0)
  })
})

describe('toSummarySheet', () => {
  it('maps blanks to a null letter and includes accrued dwell', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 0 })
    s = reduce(s, { type: 'leave', now: 1000 })
    const summary = toSummarySheet(s, 5000)
    expect(summary.get('q1')).toEqual({ letter: null, timeMs: 1000 })
  })

  it('includes the answered letter and its accumulated dwell', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 0 })
    s = reduce(s, { type: 'pick', qid: 'q1', letter: 'B', now: 500 })
    s = reduce(s, { type: 'leave', now: 1000 })
    const summary = toSummarySheet(s, 5000)
    expect(summary.get('q1')).toEqual({ letter: 'B', timeMs: 1000 })
  })

  it('includes the still-current question with its live dwell', () => {
    let s = createMockSheet()
    s = reduce(s, { type: 'enter', qid: 'q1', now: 0 })
    const summary = toSummarySheet(s, 2500)
    expect(summary.get('q1')).toEqual({ letter: null, timeMs: 2500 })
  })
})
