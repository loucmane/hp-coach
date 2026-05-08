// Replay picker — covers:
//   1) Resolves due-mistake qids to real Question objects
//   2) Caps at the requested count even when more are due
//   3) Skips qids that don't resolve in the bank (parser drift)
//   4) Skips stub questions (parsing_status="answer_only")
//   5) Preserves the server-provided ordering (most-frequent first)

import { beforeAll, describe, expect, it } from 'vitest'

import type { Mistake } from '@/api/hooks/useMistakes'
import { loadBank } from '@/data/questions'

import { pickReplayQuestions } from './replay'

// Resolved once per file from the lazy bank — keeps test bodies tight.
let ordQids: string[]
let stubQid: string

beforeAll(async () => {
  const bank = await loadBank()
  ordQids = bank
    .filter((q) => q.section === 'ORD' && q.parsing_status === 'complete')
    .map((q) => q.qid)
    .slice(0, 5)
  stubQid = bank.find((q) => q.parsing_status === 'answer_only')?.qid ?? ''
})

function mistake(questionId: string, errorCount = 1): Mistake {
  return {
    id: Math.floor(Math.random() * 1e6),
    userId: 1,
    questionId,
    layer1Ids: null,
    status: 'active',
    errorCount7d: errorCount,
    lastErrorAt: null,
    nextReviewAt: null,
  }
}

describe('pickReplayQuestions', () => {
  it('resolves due qids to fully-parsed Question objects', async () => {
    const due = ordQids.map((q) => mistake(q))
    const items = await pickReplayQuestions(due, 10)
    expect(items.length).toBe(ordQids.length)
    for (const it of items) {
      expect(it.question.parsing_status).toBe('complete')
      expect(it.question.options).not.toBeNull()
    }
  })

  it('caps at the requested count', async () => {
    const due = ordQids.map((q) => mistake(q))
    const items = await pickReplayQuestions(due, 2)
    expect(items.length).toBe(2)
  })

  it('skips qids that no longer resolve in the bank', async () => {
    const due = [mistake('var-2026-verb1-ORD-999'), mistake(ordQids[0])]
    const items = await pickReplayQuestions(due, 10)
    expect(items.length).toBe(1)
    expect(items[0].question.qid).toBe(ordQids[0])
  })

  it('skips stub (answer_only) questions', async () => {
    if (!stubQid) return // no stubs in fixture, nothing to assert
    const due = [mistake(stubQid), mistake(ordQids[0])]
    const items = await pickReplayQuestions(due, 10)
    const ids = items.map((i) => i.question.qid)
    expect(ids).not.toContain(stubQid)
    expect(ids).toContain(ordQids[0])
  })

  it('preserves server-provided ordering', async () => {
    const due = [mistake(ordQids[3]), mistake(ordQids[0]), mistake(ordQids[2])]
    const items = await pickReplayQuestions(due, 10)
    expect(items.map((i) => i.question.qid)).toEqual([ordQids[3], ordQids[0], ordQids[2]])
  })
})
