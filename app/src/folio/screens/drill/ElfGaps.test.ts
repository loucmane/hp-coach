import { describe, expect, it } from 'vitest'
import type { Question } from '@/data/questions'
import { findGapChain, gapNumbers, gapTokens } from './ElfGaps'
import { toDrillQuestion } from './toDrillQuestion'

function question(context: string, synthetic = false, prompt = '') {
  return toDrillQuestion({
    qid: synthetic ? 'p5-elf-test-r1-ELF-002' : 'host-2013-verb2-ELF-031',
    exam_id: 'host-2013',
    provpass: 'verb2',
    section: 'ELF',
    number: synthetic ? 2 : 31,
    prompt,
    context,
    options: [{ letter: 'A', text: 'read' }],
    answer: 'A',
    parsing_status: 'complete',
  } satisfies Question)
}
describe('ELF gap formats', () => {
  it('recognizes the authentic host-2013-verb2-ELF-031 passage', () => {
    const bank = JSON.parse(readFileSync('public/data/host-2013.json', 'utf8')) as Question[]
    const source = bank.find((q) => q.qid === 'host-2013-verb2-ELF-031')!
    const q = toDrillQuestion(source)
    expect(
      gapTokens(q)
        .flat()
        .map((token) => token.n),
    ).toEqual([31, 32, 33, 34, 35])
    expect(gapNumbers([q])[q.qid]).toBe(31)
  })
  it('recognizes printed chains without swallowing years, ages or percentages', () => {
    const text =
      'In 1960, 78% agreed. At age 35 we 31_____ an account. They 32 the result and 33 it.'
    expect([...findGapChain(text, 31)]).toEqual([31, 32, 33])
    const q = question(text)
    expect(
      gapTokens(q)
        .flat()
        .map((t) => text.slice(t.start, t.end)),
    ).toEqual(['31_____', '32', '33'])
    expect(gapNumbers([q])[q.qid]).toBe(31)
  })
  it('keeps normal numbers in reading comprehension prompts untouched', () => {
    expect(gapTokens(question('She was 31. He was 32.', false, 'What happened?'))).toEqual([])
  })
  it('keeps the cloze headword even if extraction lost the current gap glyph', () => {
    const q = question('The extracted sentence has no numbered gap.')
    expect(gapNumbers([q])[q.qid]).toBe(31)
  })
  it('numbers bare P5 blanks across paragraphs alongside explicit markers', () => {
    const q = question('They ___(1)___ it.\n\nWe ___ it.', true, 'Gap (2)')
    expect(
      gapTokens(q)
        .flat()
        .map((t) => t.n),
    ).toEqual([1, 2])
    expect(gapNumbers([q])[q.qid]).toBe(2)
  })
  it('numbers empty P5 prompts in passage order, independent of question numbers', () => {
    const first = question('They ___ it.\n\nWe ___ it.', true)
    const second = { ...first, qid: 'p5-elf-test-r1-ELF-009', number: 9 }
    const other = { ...question('Another ___ here.', true), qid: 'p5-elf-other-r1-ELF-007' }
    expect(gapNumbers([first, second, other])).toEqual({
      [first.qid]: 1,
      [second.qid]: 2,
      [other.qid]: 1,
    })
    expect(gapNumbers([{ ...first, prompt: 'Gap (1)' }, second])[second.qid]).toBe(2)
  })
  it('does not turn an empty synthetic reading prompt without blanks into a gap', () => {
    const q = question('A complete sentence.', true)
    expect(gapNumbers([q])).toEqual({})
  })
})

import { readFileSync } from 'node:fs'
