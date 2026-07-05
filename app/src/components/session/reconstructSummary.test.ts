import { describe, expect, it } from 'vitest'

import type { Question } from '@/data/questions'
import { reconstructSummary } from './reconstructSummary'

function q(qid: string, answer: 'A' | 'B'): Question {
  return {
    qid,
    exam_id: 'var-2019',
    provpass: 'verb1',
    section: 'ORD',
    number: 1,
    prompt: qid,
    options: [
      { letter: 'A', text: 'a' },
      { letter: 'B', text: 'b' },
    ],
    answer,
    context: null,
    parsing_status: 'complete',
  }
}

const BANK: Question[] = [q('a-1', 'A'), q('a-2', 'B'), q('a-3', 'A')]

describe('reconstructSummary', () => {
  it('rebuilds questions + picks in attempt order', () => {
    const summary = reconstructSummary(
      [
        { questionId: 'a-1', selectedAnswer: 'A' },
        { questionId: 'a-2', selectedAnswer: 'A' },
        { questionId: 'a-3', selectedAnswer: null },
      ],
      BANK,
    )
    expect(summary.questions.map((x) => x.qid)).toEqual(['a-1', 'a-2', 'a-3'])
    expect(summary.picks).toEqual(['A', 'A', null])
  })

  it('drops an unresolvable qid from BOTH arrays so they stay aligned', () => {
    const summary = reconstructSummary(
      [
        { questionId: 'a-1', selectedAnswer: 'A' },
        { questionId: 'gone', selectedAnswer: 'B' },
        { questionId: 'a-3', selectedAnswer: 'B' },
      ],
      BANK,
    )
    expect(summary.questions.map((x) => x.qid)).toEqual(['a-1', 'a-3'])
    // 'B' belongs to a-3, NOT to the dropped 'gone' — alignment preserved
    expect(summary.picks).toEqual(['A', 'B'])
  })

  it('handles an empty attempt list', () => {
    expect(reconstructSummary([], BANK)).toEqual({ questions: [], picks: [] })
  })
})
