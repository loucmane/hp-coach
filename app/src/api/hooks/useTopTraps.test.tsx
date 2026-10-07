// useTopTraps — P5 infold PR 3 (docs/p5-infold-design.md §E): the Home
// trap clusters are an automatic trap count, so they read mistakes on
// authentic questions only. P5 practice mistakes stay in the replay queue.

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const due: { current: Array<{ questionId: string }> } = { current: [] }
vi.mock('./useMistakes', () => ({ useDueMistakes: () => ({ data: due.current }) }))
const loadExplanation = vi.fn(async (_qid: string) => ({ framework_id: 'LAS-TYPE-001' }))
vi.mock('@/data/explanations', () => ({ loadExplanation: (qid: string) => loadExplanation(qid) }))

import { __resetTopTrapsCache, useTopTraps } from './useTopTraps'

const AUTHENTIC = ['var-2024-verb1-LÄS-011', 'var-2024-verb1-LÄS-012']
const P5 = ['p5-las-b19-002-r1-LÄS-001', 'p5-las-b19-002-r1-LÄS-002', 'p5-las-b14-002-r1-LÄS-003']

beforeEach(() => {
  loadExplanation.mockClear()
  __resetTopTrapsCache()
  window.localStorage.clear()
})

describe('useTopTraps — P5 mistakes never count toward a trap cluster', () => {
  it('counts only the authentic mistakes of a mixed queue', async () => {
    due.current = [...P5, ...AUTHENTIC].map((questionId) => ({ questionId }))
    const { result } = renderHook(() => useTopTraps())
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0]).toMatchObject({
      framework_id: 'LAS-TYPE-001',
      section: 'LÄS',
      count: 2,
    })
    expect(loadExplanation.mock.calls.map(([qid]) => qid).sort()).toEqual([...AUTHENTIC].sort())
  })

  it('surfaces no cluster from P5 mistakes alone', async () => {
    due.current = P5.map((questionId) => ({ questionId }))
    const { result } = renderHook(() => useTopTraps())
    await act(async () => {
      await Promise.resolve()
    })
    expect(loadExplanation).not.toHaveBeenCalled()
    expect(result.current).toEqual([])
  })
})
