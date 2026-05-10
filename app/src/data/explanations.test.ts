// Unit tests for the explanation loader. Two surfaces matter most:
//   1. exam_id extraction from qid — the parser ships exam_ids that
//      themselves contain hyphens (`host-ver1-2019`, `var-2022-1`),
//      so simple `split('-')[0]` doesn't work.
//   2. Cache memoisation — sibling qids in the same exam should
//      share one fetch, missing qids return null without throwing.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { __resetExplanationCache, type Explanation, loadExplanation } from './explanations'

const fakeExplanation = (qid: string): Explanation => ({
  solution_path: `path-${qid}`,
  distractors: [{ letter: 'A', why_tempting: 'tempt', why_wrong: 'wrong' }],
  technique: 'tech',
  pitfall: null,
  _meta: { model: 'claude-sonnet-4-6', generated_at: 1715000000000 },
})

describe('loadExplanation — exam_id extraction', () => {
  beforeEach(() => {
    __resetExplanationCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each([
    // Standard exam_ids
    ['host-2025-kvant1-XYZ-002', 'host-2025'],
    ['var-2026-kvant2-NOG-024', 'var-2026'],
    ['host-2020-verb1-ORD-001', 'host-2020'],
    ['var-2017-verb2-LÄS-011', 'var-2017'],
    // Multi-version exam_ids
    ['host-ver1-2019-kvant2-XYZ-010', 'host-ver1-2019'],
    ['host-ver2-2019-kvant1-KVA-018', 'host-ver2-2019'],
    // Multi-sitting exam_ids
    ['var-2022-1-kvant1-XYZ-005', 'var-2022-1'],
    ['var-2022-2-kvant2-XYZ-012', 'var-2022-2'],
    ['var-2018-1-kvant2-XYZ-001', 'var-2018-1'],
  ])('extracts exam_id from %s → %s', async (qid, expectedExamId) => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ [qid]: fakeExplanation(qid) }), { status: 200 }),
      )
    const result = await loadExplanation(qid)
    expect(fetchMock).toHaveBeenCalledWith(`/explanations/${expectedExamId}.json`)
    expect(result?.solution_path).toBe(`path-${qid}`)
  })
})

describe('loadExplanation — cache + missing handling', () => {
  beforeEach(() => {
    __resetExplanationCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('returns null when qid has no explanation', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    )
    const result = await loadExplanation('host-2025-kvant1-XYZ-002')
    expect(result).toBeNull()
  })

  test('returns null on 404 (un-backfilled exam)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not found', { status: 404 }))
    const result = await loadExplanation('host-2025-kvant1-XYZ-002')
    expect(result).toBeNull()
  })

  test('throws on 5xx — surfaces real transport failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 500 }))
    await expect(loadExplanation('host-2025-kvant1-XYZ-002')).rejects.toThrow(/HTTP 500/)
  })

  test('shares one fetch across sibling qids in the same exam', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          'host-2025-kvant1-XYZ-002': fakeExplanation('host-2025-kvant1-XYZ-002'),
          'host-2025-kvant1-XYZ-003': fakeExplanation('host-2025-kvant1-XYZ-003'),
        }),
        { status: 200 },
      ),
    )
    const [a, b] = await Promise.all([
      loadExplanation('host-2025-kvant1-XYZ-002'),
      loadExplanation('host-2025-kvant1-XYZ-003'),
    ])
    expect(a?.solution_path).toBe('path-host-2025-kvant1-XYZ-002')
    expect(b?.solution_path).toBe('path-host-2025-kvant1-XYZ-003')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('returns null for a qid that does not match the provpass pattern', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const result = await loadExplanation('not-a-real-qid')
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
