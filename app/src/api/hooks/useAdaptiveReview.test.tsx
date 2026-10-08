// useAdaptiveReview — P5 infold PR 3 (docs/p5-infold-design.md Amendment 1 E):
// the automatic hot-trap offer counts a P5 mistake only when its explanation
// names a framework of the question's own section; otherwise the mistake is
// skipped for the count (it stays in the replay queue). Authentic mistakes
// count exactly as before. The detector itself is covered in
// lib/adaptiveReview.test.ts; this pins what the hook feeds it.

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const NOW = new Date('2026-10-08T12:00:00Z')
const HOUR = 60 * 60 * 1000

const due: { current: Array<{ questionId: string; lastErrorAt: number }> } = { current: [] }
vi.mock('./useMistakes', () => ({ useDueMistakes: () => ({ data: due.current }) }))
vi.mock('./useSessions', () => ({ useSessionHistory: () => ({ data: [] }) }))
vi.mock('@/lib/adaptiveEvents', () => ({ logAdaptiveEvent: () => {} }))

// qid → the framework_id its explanation names (absent: none).
const FRAMEWORKS: Record<string, string | undefined> = {
  'p5-las-b19-002-r1-LÄS-001': 'LAS-TYPE-001',
  'p5-las-b19-002-r1-LÄS-002': 'LAS-TYPE-001',
  'p5-las-b14-002-r1-LÄS-001': 'LAS-TYPE-001',
  // Invalid for a P5 LÄS question: another section's framework, or none.
  'p5-las-b14-002-r1-LÄS-002': 'ELF-TYPE-001',
  'p5-las-b14-002-r1-LÄS-003': 'KVA-NEG-001',
  'p5-elf-b18-002-r1-ELF-001': undefined,
  'var-2024-verb1-LÄS-011': 'LAS-TYPE-001',
  'var-2024-verb1-LÄS-012': 'LAS-TYPE-001',
  // An authentic question keeps whatever its explanation names, as before.
  'var-2024-verb1-LÄS-013': 'KVA-NEG-001',
  'var-2024-kvant1-KVA-002': 'KVA-NEG-001',
  'var-2024-kvant1-KVA-003': 'KVA-NEG-001',
}
const loadExplanation = vi.fn(async (qid: string) => {
  const framework_id = FRAMEWORKS[qid]
  return framework_id === undefined ? { solution_path: '…' } : { framework_id }
})
vi.mock('@/data/explanations', () => ({ loadExplanation: (qid: string) => loadExplanation(qid) }))

import { __resetAdaptiveDeclines, useAdaptiveReview } from './useAdaptiveReview'

function mistakes(qids: string[]) {
  return qids.map((questionId, i) => ({ questionId, lastErrorAt: NOW.getTime() - (i + 1) * HOUR }))
}

async function hotTrapFor(qids: string[]) {
  due.current = mistakes(qids)
  const { result } = renderHook(() => useAdaptiveReview(NOW))
  await waitFor(() => expect(loadExplanation).toHaveBeenCalledTimes(qids.length))
  await act(async () => {
    await Promise.resolve()
  })
  return result.current.hotTrap
}

beforeEach(() => {
  loadExplanation.mockClear()
  __resetAdaptiveDeclines()
})

describe('useAdaptiveReview — P5 mistakes need a valid framework id', () => {
  it('counts P5 mistakes whose explanation names a framework of their section', async () => {
    expect(
      await hotTrapFor([
        'p5-las-b19-002-r1-LÄS-001',
        'p5-las-b19-002-r1-LÄS-002',
        'p5-las-b14-002-r1-LÄS-001',
      ]),
    ).toEqual({ framework_id: 'LAS-TYPE-001', count: 3 })
  })

  it('skips P5 mistakes without one, or with another section’s', async () => {
    // Two valid P5 mistakes are below the threshold of three; the invalid
    // ones add nothing — not to LAS-TYPE-001, ELF-TYPE-001 or KVA-NEG-001.
    expect(
      await hotTrapFor([
        'p5-las-b19-002-r1-LÄS-001',
        'p5-las-b19-002-r1-LÄS-002',
        'p5-las-b14-002-r1-LÄS-002',
        'p5-las-b14-002-r1-LÄS-003',
        'p5-elf-b18-002-r1-ELF-001',
        'var-2024-kvant1-KVA-002',
        'var-2024-kvant1-KVA-003',
      ]),
    ).toBeNull()
  })

  it('counts valid P5 and authentic mistakes on the same framework together', async () => {
    expect(
      await hotTrapFor([
        'p5-las-b19-002-r1-LÄS-001',
        'p5-las-b14-002-r1-LÄS-002',
        'var-2024-verb1-LÄS-011',
        'var-2024-verb1-LÄS-012',
      ]),
    ).toEqual({ framework_id: 'LAS-TYPE-001', count: 3 })
  })

  it('leaves authentic counting unchanged', async () => {
    expect(
      await hotTrapFor([
        'var-2024-verb1-LÄS-013',
        'var-2024-kvant1-KVA-002',
        'var-2024-kvant1-KVA-003',
      ]),
    ).toEqual({ framework_id: 'KVA-NEG-001', count: 3 })
  })
})
