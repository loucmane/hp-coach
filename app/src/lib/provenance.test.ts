// The SPA's P5 guard (P5 infold PR 3, docs/p5-infold-design.md §E). The
// worker classifies everything it stores; this rule only keeps P5 practice
// out of the numbers the SPA computes itself.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { loadBank } from '@/data/questions'
import { isP5Qid, P5_QID_PREFIX, withoutP5 } from './provenance'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SAMPLE_BANK = path.resolve(
  HERE,
  '../../../pipeline/synthetic/infold/preview/sample/p5-bank-sample.json',
)

describe('isP5Qid', () => {
  it('flags every qid of the committed P5 sample bank', () => {
    const sample = JSON.parse(readFileSync(SAMPLE_BANK, 'utf8')) as {
      questions: Array<{ qid: string; exam_id: string }>
    }
    expect(sample.questions.length).toBeGreaterThan(0)
    for (const row of sample.questions) {
      expect(isP5Qid(row.qid)).toBe(true)
      expect(row.exam_id.startsWith(P5_QID_PREFIX)).toBe(true)
    }
  })

  it.each([
    'p5-las-b19-002-r1-LÄS-001',
    'p5-las-b7-002-r1-LÄS-001', // a superseded revision
    'p5-elf-b14-002-r1-ELF-001', // a retired unit
    'p5-not-a-real-unit',
  ])('flags %s: anything in the p5- namespace, current or not', (qid) => {
    expect(isP5Qid(qid)).toBe(true)
  })

  it.each([
    'var-2024-verb1-LÄS-011',
    'host-ver1-2019-kvant2-NOG-024',
    'q1',
    'xp5-las-b19-002-r1-LÄS-001',
    '',
  ])('does not flag %s', (qid) => {
    expect(isP5Qid(qid)).toBe(false)
  })

  it('never flags a question of the authentic bank', async () => {
    const bank = await loadBank()
    expect(bank).toHaveLength(4320)
    expect(bank.filter((q) => isP5Qid(q.qid))).toEqual([])
  })
})

describe('withoutP5', () => {
  it('drops the P5 rows and keeps every other row, in order', () => {
    const rows = [
      { questionId: 'var-2024-verb1-LÄS-011', n: 1 },
      { questionId: 'p5-las-b19-002-r1-LÄS-001', n: 2 },
      { questionId: 'q1', n: 3 },
      { questionId: 'p5-elf-b18-002-r1-ELF-004', n: 4 },
    ]
    expect(withoutP5(rows)).toEqual([rows[0], rows[2]])
    expect(withoutP5([])).toEqual([])
  })
})
