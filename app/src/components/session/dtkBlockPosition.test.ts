import { describe, expect, it } from 'vitest'

import type { Question } from '@/data/questions'
import { dtkBlockPosition } from './SessionPlayer'

function q(qid: string, section: Question['section'], figSrc: string | null): Question {
  return {
    qid,
    exam_id: 'host-2014',
    provpass: 'kvant2',
    section,
    number: 1,
    prompt: qid,
    options: [{ letter: 'A', text: 'a' }],
    answer: 'A',
    context: null,
    figure: figSrc ? { src: figSrc, aspect_ratio: 0.7, kind: 'raster' } : null,
    parsing_status: 'complete',
  }
}

// A block-grouped DTK plan: page P has 3 questions, page Q has 2, then an
// XYZ question (no figure). This is the shape the picker produces.
const PLAN: Question[] = [
  q('d1', 'DTK', 'p18.jpg'),
  q('d2', 'DTK', 'p18.jpg'),
  q('d3', 'DTK', 'p18.jpg'),
  q('d4', 'DTK', 'p20.jpg'),
  q('d5', 'DTK', 'p20.jpg'),
  q('x1', 'XYZ', null),
]

describe('dtkBlockPosition', () => {
  it('reports 1-indexed position + block size across a block', () => {
    expect(dtkBlockPosition(PLAN, 0)).toEqual({ n: 1, m: 3 })
    expect(dtkBlockPosition(PLAN, 1)).toEqual({ n: 2, m: 3 })
    expect(dtkBlockPosition(PLAN, 2)).toEqual({ n: 3, m: 3 })
  })

  it('resets across a page boundary', () => {
    expect(dtkBlockPosition(PLAN, 3)).toEqual({ n: 1, m: 2 })
    expect(dtkBlockPosition(PLAN, 4)).toEqual({ n: 2, m: 2 })
  })

  it('is null for a non-DTK question', () => {
    expect(dtkBlockPosition(PLAN, 5)).toBeNull()
  })

  it('is null for a singleton block (one DTK question on its page)', () => {
    const solo = [q('a', 'DTK', 'solo.jpg'), q('b', 'DTK', 'other.jpg')]
    expect(dtkBlockPosition(solo, 0)).toBeNull()
  })

  it('is null for a figure-less DTK question', () => {
    expect(dtkBlockPosition([q('n', 'DTK', null)], 0)).toBeNull()
  })
})
