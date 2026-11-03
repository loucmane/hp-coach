import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Question } from '@/data/questions'
import { createMockSheet, mockSheetReducer, saveMockFlags } from '@/lib/mockSheet'
import { type MockPassProps, useMockPass } from './useMockPass'

const h = vi.hoisted(() => ({
  attempt: vi.fn(),
  mistake: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
}))
vi.mock('@/api/hooks/useAttempts', () => ({ useSubmitAttempt: () => ({ mutate: h.attempt }) }))
vi.mock('@/api/hooks/useMistakes', () => ({ useRecordMistake: () => ({ mutate: h.mistake }) }))
vi.mock('@/api/hooks/useSessions', () => ({ useUpdateSession: () => ({ mutate: h.update }) }))
vi.mock('@/api/hooks/useMockResults', () => ({ useSubmitMockResult: () => ({ mutate: h.submit }) }))

const question: Question = {
  qid: 'q1',
  section: 'ORD',
  number: 1,
  exam_id: 'var-2024',
  provpass: 'verb1',
  prompt: 'Ord',
  options: [
    { letter: 'A', text: 'Ett' },
    { letter: 'B', text: 'Två' },
  ],
  answer: 'B',
  context: null,
  figure: null,
  parsing_status: 'complete',
}
function props(): MockPassProps {
  return {
    plan: [question],
    session: { id: 42, startedAt: new Date(), mode: 'authentic', half: 'verbal' },
    seenBefore: 1,
    onSettled: vi.fn(),
    onVoid: vi.fn(),
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('shared pass lifecycle', () => {
  it('takes one final snapshot and waits for PATCH success before POSTing the result', () => {
    const p = props()
    const { result } = renderHook(() => useMockPass(p, 'student'))
    act(() => result.current.pick('B'))
    act(() => result.current.toggleFlag())
    act(() => result.current.settle())
    act(() => result.current.settle())
    act(() => result.current.abandon())
    expect(h.update).toHaveBeenCalledTimes(1)
    expect(h.update.mock.calls[0][0]).toEqual({ id: 42, patch: { end: true } })
    expect(h.submit).not.toHaveBeenCalled()
    expect(p.onVoid).not.toHaveBeenCalled()
    act(() => h.update.mock.calls[0][1].onSuccess({}))
    expect(h.submit).toHaveBeenCalledTimes(1)
    expect(h.submit.mock.calls[0][0]).toMatchObject({
      answered: 1,
      correct: 1,
      presented: 1,
      seenBefore: 1,
    })
    act(() => h.submit.mock.calls[0][1].onSuccess({ id: 99 }))
    expect(p.onSettled).toHaveBeenCalledWith(
      { id: 99 },
      { flagged: ['q1'], answers: new Map([['q1', 'B']]) },
    )
    expect(h.mistake).toHaveBeenCalledTimes(1)
  })
  it('adopts persisted answers, position, flags and the original exam clock', () => {
    const p = props()
    p.plan = [question, { ...question, qid: 'q2', number: 2 }]
    p.initialSheet = mockSheetReducer(createMockSheet(), { type: 'pick', qid: 'q1', letter: 'A' })
    p.initialIndex = 1
    p.session.startedAt = new Date(Date.now() - 60_000)
    saveMockFlags('student', 42, new Set(['q2']))
    const { result } = renderHook(() => useMockPass(p, 'student'))
    expect(result.current.index).toBe(1)
    expect(result.current.sheet.answers.get('q1')?.letter).toBe('A')
    expect(result.current.sheet.flagged.has('q2')).toBe(true)
    expect(result.current.countdown.remainingMs).toBeGreaterThan(53 * 60_000)
    expect(result.current.countdown.remainingMs).toBeLessThanOrEqual(54 * 60_000)
    expect(h.attempt).not.toHaveBeenCalled()
  })
})
