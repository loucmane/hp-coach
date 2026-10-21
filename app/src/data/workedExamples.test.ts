import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import type { Explanation } from './explanations'
import type { Question } from './questions'
import { WORKED_EXAMPLE_QIDS, WORKED_EXAMPLES } from './workedExamples.generated'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const readJson = (file: string) => JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'))
type Entry = { id: string; example_questions: string[] }
type Framework = { section: string; entries: Entry[] }
const { buildWorkedExamples } = createRequire(import.meta.url)(
  path.join(ROOT, 'scripts/build_worked_examples.mjs'),
) as {
  buildWorkedExamples: (
    frameworks: Framework[],
    bank: { qid: string; figure?: unknown }[],
    explanations: Record<string, unknown>,
  ) => { entryId: string; section: string; qid: string }[]
}

describe('worked example manifest', () => {
  it('selects the first eligible unused question in file order, then sorts IDs', () => {
    const steps = Array.from({ length: 3 }, () => ({ tier: 'essential' }))
    expect(
      buildWorkedExamples(
        [
          {
            section: 'NOG',
            entries: [
              { id: 'z', example_questions: ['missing', 'wrong', 'short', 'z1', 'z2'] },
              { id: 'a', example_questions: ['z1', 'a1'] },
              { id: 'empty', example_questions: ['missing'] },
            ],
          },
          { section: 'DTK', entries: [{ id: 'dtk', example_questions: ['dtk'] }] },
        ],
        ['wrong', 'short', 'z1', 'z2', 'a1', 'dtk'].map((qid) => ({ qid })),
        {
          wrong: { framework_id: 'other', steps },
          short: { framework_id: 'z', steps: [steps[0], steps[1], { tier: 'detail' }] },
          z1: { framework_id: 'z', steps },
          z2: { framework_id: 'z', steps },
          a1: { framework_id: 'a', steps },
          dtk: { framework_id: 'dtk', steps },
        },
      ),
    ).toEqual([
      { entryId: 'a', section: 'NOG', qid: 'a1' },
      { entryId: 'z', section: 'NOG', qid: 'z1' },
    ])
  })

  it('skips figure questions and chooses the next eligible example', () => {
    const steps = Array.from({ length: 3 }, () => ({ tier: 'essential' }))
    expect(
      buildWorkedExamples(
        [
          {
            section: 'XYZ',
            entries: [
              { id: 'with-fallback', example_questions: ['figure', 'text-only'] },
              { id: 'figure-only', example_questions: ['only-figure'] },
            ],
          },
        ],
        [
          { qid: 'figure', figure: { type: 'image', src: '/figure.png' } },
          { qid: 'text-only' },
          { qid: 'only-figure', figure: { type: 'image', src: '/other.png' } },
        ],
        {
          figure: { framework_id: 'with-fallback', steps },
          'text-only': { framework_id: 'with-fallback', steps },
          'only-figure': { framework_id: 'figure-only', steps },
        },
      ),
    ).toEqual([{ entryId: 'with-fallback', section: 'XYZ', qid: 'text-only' }])
  })

  it('matches the generator without modifying files', () => {
    execFileSync(
      process.execPath,
      [
        '--max-old-space-size=3072',
        path.join(ROOT, 'scripts/build_worked_examples.mjs'),
        '--check',
      ],
      { stdio: 'inherit' },
    )
  })

  it('contains only eligible IDs with unique entries and questions across four sections', () => {
    const index = readJson('app/public/data/_index.json') as { exams: { exam_id: string }[] }
    const bank = new Map(
      index.exams.flatMap(({ exam_id }) =>
        (readJson(`app/public/data/${exam_id}.json`) as Question[]).map((q) => [q.qid, q] as const),
      ),
    )
    expect(WORKED_EXAMPLES.length).toBeGreaterThan(0)
    expect(new Set(WORKED_EXAMPLES.map((x) => x.entryId)).size).toBe(WORKED_EXAMPLES.length)
    expect(WORKED_EXAMPLE_QIDS.size).toBe(WORKED_EXAMPLES.length)
    expect(WORKED_EXAMPLES.map((x) => x.entryId)).toEqual(
      WORKED_EXAMPLES.map((x) => x.entryId).sort(),
    )
    for (const example of WORKED_EXAMPLES) {
      expect(Object.keys(example).sort()).toEqual(['entryId', 'qid', 'section'])
      expect(['NOG', 'KVA', 'XYZ', 'MEK']).toContain(example.section)
      const question = bank.get(example.qid)
      expect(question?.section).toBe(example.section)
      expect(Boolean(question?.figure), example.qid).toBe(false)
      const explanation = readJson(`data/explanations/${question?.exam_id}.json`)[
        example.qid
      ] as Explanation
      expect(explanation.framework_id).toBe(example.entryId)
      expect(
        explanation.steps?.filter((step) => step.tier === 'essential').length,
      ).toBeGreaterThanOrEqual(3)
      expect(WORKED_EXAMPLE_QIDS.has(example.qid)).toBe(true)
    }
  })
})
