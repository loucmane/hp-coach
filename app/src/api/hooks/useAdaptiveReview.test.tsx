// useAdaptiveReview — P5 infold PR 3 (docs/p5-infold-design.md §E): the
// automatic hot-trap offer counts mistakes on authentic questions only. P5
// practice mistakes stay in the replay queue but never feed the count, even
// once a P5 explanation resolves a framework id. The detector itself is
// covered in lib/adaptiveReview.test.ts; this pins what the hook feeds it.

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const NOW = new Date('2026-10-07T12:00:00Z')
const HOUR = 60 * 60 * 1000

const due: { current: Array<{ questionId: string; lastErrorAt: number }> } = { current: [] }
vi.mock('./useMistakes', () => ({ useDueMistakes: () => ({ data: due.current }) }))
vi.mock('./useSessions', () => ({ useSessionHistory: () => ({ data: [] }) }))
vi.mock('@/lib/adaptiveEvents', () => ({ logAdaptiveEvent: () => {} }))
const loadExplanation = vi.fn(async (_qid: string) => ({ framework_id: 'LAS-TYPE-001' }))
vi.mock('@/data/explanations', () => ({ loadExplanation: (qid: string) => loadExplanation(qid) }))

import { __resetAdaptiveDeclines, useAdaptiveReview } from './useAdaptiveReview'

const AUTHENTIC = ['var-2024-verb1-LÄS-011', 'var-2024-verb1-LÄS-012', 'var-2023-verb2-LÄS-013']
const P5 = [
  'p5-las-b19-002-r1-LÄS-001',
  'p5-las-b19-002-r1-LÄS-002',
  'p5-las-b14-002-r1-LÄS-003',
  'p5-las-b7-002-r1-LÄS-001',
]

function mistakes(qids: string[]) {
  return qids.map((questionId, i) => ({ questionId, lastErrorAt: NOW.getTime() - (i + 1) * HOUR }))
}

beforeEach(() => {
  loadExplanation.mockClear()
  __resetAdaptiveDeclines()
})

describe('useAdaptiveReview — P5 mistakes never count toward a hot trap', () => {
  it('counts only the authentic mistakes of a mixed queue', async () => {
    due.current = mistakes([...P5, ...AUTHENTIC])
    const { result } = renderHook(() => useAdaptiveReview(NOW))
    await waitFor(() => expect(result.current.hotTrap).not.toBeNull())
    expect(result.current.hotTrap).toEqual({ framework_id: 'LAS-TYPE-001', count: 3 })
    const resolved = loadExplanation.mock.calls.map(([qid]) => qid)
    expect(resolved.sort()).toEqual([...AUTHENTIC].sort())
  })

  it('offers nothing for a queue of P5 mistakes, however many share a framework', async () => {
    due.current = mistakes(P5)
    const { result } = renderHook(() => useAdaptiveReview(NOW))
    await act(async () => {
      await Promise.resolve()
    })
    expect(loadExplanation).not.toHaveBeenCalled()
    expect(result.current.hotTrap).toBeNull()
  })
})
