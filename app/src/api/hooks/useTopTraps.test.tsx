// useTopTraps — P5 infold PR 3 (docs/p5-infold-design.md Amendment 1 E): the
// Home trap clusters are an automatic trap count, so a P5 mistake counts only
// when its explanation names a framework of the question's own section.
// Authentic mistakes count exactly as before.

import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const due: { current: Array<{ questionId: string }> } = { current: [] }
vi.mock('./useMistakes', () => ({ useDueMistakes: () => ({ data: due.current }) }))

// qid → the framework_id its explanation names (absent: none).
const FRAMEWORKS: Record<string, string | undefined> = {
  'p5-las-b19-002-r1-LÄS-001': 'LAS-TYPE-001',
  'p5-las-b19-002-r1-LÄS-002': 'LAS-TYPE-001',
  'p5-las-b14-002-r1-LÄS-002': 'ELF-TYPE-001',
  'p5-elf-b18-002-r1-ELF-001': undefined,
  'p5-elf-b18-002-r1-ELF-002': 'LAS-TYPE-001',
  'var-2024-verb1-LÄS-011': 'LAS-TYPE-001',
  'var-2024-verb2-ELF-031': 'ELF-TYPE-001',
}
const loadExplanation = vi.fn(async (qid: string) => {
  const framework_id = FRAMEWORKS[qid]
  return framework_id === undefined ? { solution_path: '…' } : { framework_id }
})
vi.mock('@/data/explanations', () => ({ loadExplanation: (qid: string) => loadExplanation(qid) }))

import { __resetTopTrapsCache, useTopTraps } from './useTopTraps'

beforeEach(() => {
  loadExplanation.mockClear()
  __resetTopTrapsCache()
  window.localStorage.clear()
})

describe('useTopTraps — P5 mistakes need a valid framework id', () => {
  it('counts valid P5 mistakes with authentic ones and skips the rest', async () => {
    due.current = [
      'p5-las-b19-002-r1-LÄS-001',
      'p5-las-b19-002-r1-LÄS-002',
      'p5-las-b14-002-r1-LÄS-002', // ELF framework on a LÄS question: skipped
      'p5-elf-b18-002-r1-ELF-001', // no framework: skipped
      'p5-elf-b18-002-r1-ELF-002', // LÄS framework on an ELF question: skipped
      'var-2024-verb1-LÄS-011',
      'var-2024-verb2-ELF-031',
    ].map((questionId) => ({ questionId }))
    const { result } = renderHook(() => useTopTraps())
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0]).toMatchObject({
      framework_id: 'LAS-TYPE-001',
      section: 'LÄS',
      count: 3,
    })
  })

  it('surfaces a cluster from valid P5 mistakes alone', async () => {
    due.current = ['p5-las-b19-002-r1-LÄS-001', 'p5-las-b19-002-r1-LÄS-002'].map((questionId) => ({
      questionId,
    }))
    const { result } = renderHook(() => useTopTraps())
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0]).toMatchObject({ framework_id: 'LAS-TYPE-001', count: 2 })
  })
})
