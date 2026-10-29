import { describe, expect, it } from 'vitest'
import type { Question, Section } from '@/data/questions'
import { uhrTimeMs } from '@/lib/uhrPacing'
import { blanksSentence, numberRuns, paceAt, runsOf } from './passPace'

const plan = (...sections: Section[]) =>
  sections.map((section, i) => ({ section, qid: `q${i}` }) as Question)

describe('pass pacing', () => {
  it('keeps contiguous section runs in plan order and numbers actual questions', () => {
    const questions = plan('ORD', 'ORD', 'LÄS', 'ORD')
    expect(runsOf(questions)).toEqual([
      { section: 'ORD', start: 0, end: 2 },
      { section: 'LÄS', start: 2, end: 3 },
      { section: 'ORD', start: 3, end: 4 },
    ])
    expect(numberRuns(questions).map((run) => run.label)).toEqual(['ORD 1–2', 'LÄS 3', 'ORD 4'])
    expect(runsOf([])).toEqual([])
  })
  it('uses section-specific UHR times, including thin passes, at boundaries and within runs', () => {
    const questions = plan('ORD', 'ORD', 'LÄS')
    const ord = uhrTimeMs('ORD', 2)!
    const las = uhrTimeMs('LÄS', 1)!
    expect(paceAt(questions, -1)).toBe(0)
    expect(paceAt(questions, ord / 2)).toBe(1)
    expect(paceAt(questions, ord)).toBe(2)
    expect(paceAt(questions, ord + las / 2)).toBe(2.5)
    expect(paceAt(questions, ord + las)).toBe(3)
    expect(paceAt(questions, 55 * 60_000)).toBe(3)
    expect(paceAt([], 60_000)).toBe(0)
  })
  it('names blanks by position in this pass, including singular and complete sheets', () => {
    const questions = plan('ORD', 'ORD', 'LÄS')
    const answers = new Map([['q1', { letter: 'A' }]])
    expect(blanksSentence(questions, answers)).toBe('2 frågor är obesvarade: 1, 3.')
    answers.set('q0', { letter: 'B' })
    expect(blanksSentence(questions, answers)).toBe('1 fråga är obesvarad: 3.')
    answers.set('q2', { letter: 'A' })
    expect(blanksSentence(questions, answers)).toBe('Alla frågor är besvarade.')
  })
  it.each([
    { blanks: [], sentence: 'Alla frågor är besvarade.' },
    { blanks: [7], sentence: '1 fråga är obesvarad: 7.' },
    { blanks: [3, 4, 5, 6], sentence: '4 frågor är obesvarade: 3–6.' },
    { blanks: [4, 9, 10, 11, 17], sentence: '5 frågor är obesvarade: 4, 9–11, 17.' },
    { blanks: [1, 2, 4, 5, 40], sentence: '5 frågor är obesvarade: 1–2, 4–5, 40.' },
    {
      blanks: Array.from({ length: 38 }, (_, i) => i + 3),
      sentence: '38 frågor är obesvarade: 3–40.',
    },
    {
      blanks: Array.from({ length: 40 }, (_, i) => i + 1),
      sentence: '40 frågor är obesvarade: 1–40.',
    },
  ])('compacts blank positions: $sentence', ({ blanks, sentence }) => {
    const questions = plan(...Array<Section>(40).fill('ORD'))
    const answers = new Map(
      questions.flatMap((q, i) =>
        blanks.includes(i + 1) ? [] : [[q.qid, { letter: 'A' }] as const],
      ),
    )
    expect(blanksSentence(questions, answers)).toBe(sentence)
  })
  it('has no blanks for an empty pass', () => {
    expect(blanksSentence([], new Map())).toBe('Alla frågor är besvarade.')
  })
})
