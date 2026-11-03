// Bank math delimiters (bead hpf-wmp8). MathText typesets LaTeX only
// between the parser's private-use delimiters, U+E000 … U+E001, and
// shows everything else as it stands. A command outside a pair reaches
// the learner as raw source, e.g. "\sqrt{3} \cdot x = 6". Nine
// questions shipped like that: the hand-fix scripts that wrote them
// wrapped their LaTeX with delimiter constants saved as empty strings.
// The scan reads every served file, not just the manifest's exams.

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { MathText } from '@/components/MathText'
import type { Question } from './questions'

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/data')
const MATH_OPEN = '\uE000'
const MATH_CLOSE = '\uE001'
const COMMAND = /\\[a-zA-Z]+/

// _index.json is the manifest; every other served file is one exam.
const EXAM_FILES = readdirSync(DATA)
  .filter((file) => file.endsWith('.json') && file !== '_index.json')
  .sort()
  .map((file) => ({
    file,
    questions: JSON.parse(readFileSync(path.join(DATA, file), 'utf8')) as Question[],
  }))

/** A question's learner-visible strings: the prompt and each option. */
function fieldsOf(q: Question): Array<[where: string, text: string]> {
  const fields: Array<[string, string]> = []
  if (q.prompt) fields.push(['prompt', q.prompt])
  for (const option of q.options ?? []) fields.push([`option ${option.letter}`, option.text])
  return fields
}

/** The runs of `text` MathText shows as prose, split as it splits them:
 *  a math segment runs from an opener to the next closer, and after an
 *  unclosed opener the rest is prose. */
function proseRuns(text: string): string[] {
  const runs: string[] = []
  let i = 0
  while (i < text.length) {
    const start = text.indexOf(MATH_OPEN, i)
    if (start === -1) {
      runs.push(text.slice(i))
      break
    }
    runs.push(text.slice(i, start))
    const end = text.indexOf(MATH_CLOSE, start + 1)
    if (end === -1) {
      runs.push(text.slice(start + 1))
      break
    }
    i = end + 1
  }
  return runs
}

/** `text` with its delimiters drawn as ⟦ ⟧, for a readable failure. */
const shown = (text: string) => text.replace(/\uE000/g, '⟦').replace(/\uE001/g, '⟧')

describe('bank math delimiters', () => {
  it('scans every exam the manifest lists', () => {
    const manifest = JSON.parse(readFileSync(path.join(DATA, '_index.json'), 'utf8')) as {
      exams: { exam_id: string }[]
    }
    const scanned = EXAM_FILES.map(({ file }) => file)
    expect(manifest.exams.length).toBeGreaterThan(0)
    for (const { exam_id } of manifest.exams) expect(scanned).toContain(`${exam_id}.json`)
    for (const { file, questions } of EXAM_FILES) expect(questions.length, file).toBeGreaterThan(0)
  })

  it('has no LaTeX command outside a delimiter pair in any prompt or option', () => {
    const offenders: string[] = []
    for (const { questions } of EXAM_FILES) {
      for (const q of questions) {
        for (const [where, text] of fieldsOf(q)) {
          const command = proseRuns(text)
            .map((run) => run.match(COMMAND)?.[0])
            .find(Boolean)
          if (command) offenders.push(`${q.qid} ${where}: ${command} in ${shown(text)}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

// The questions this bead repaired, typeset by the real MathText. KaTeX
// rejects \mathrm inside \text, and MathText rewrites a unit like `cm`
// as \mathrm{cm}, so var-2024-kvant2-XYZ-008 writes its unit
// \mathrm{cm}, as the rest of the bank does.
const REPAIRED = [
  'host-2017-kvant1-KVA-018',
  'host-2020-kvant2-KVA-015',
  'host-2024-kvant1-XYZ-002',
  'host-ver1-2019-kvant1-XYZ-009',
  'host-ver2-2019-kvant1-XYZ-009',
  'var-2018-1-kvant2-KVA-022',
  'var-2022-2-kvant1-XYZ-006',
  'var-2024-kvant2-XYZ-008',
  'var-2026-kvant1-XYZ-012',
]

describe('repaired math questions', () => {
  const byQid = new Map(
    EXAM_FILES.flatMap(({ questions }) => questions.map((q) => [q.qid, q] as const)),
  )

  it.each(REPAIRED)('%s typesets without a KaTeX error or a raw command', (qid) => {
    const q = byQid.get(qid)
    if (!q) throw new Error(`${qid} is not in the served bank`)
    expect(q.parsing_status).toBe('complete')
    for (const [where, text] of fieldsOf(q)) {
      const { container } = render(createElement(MathText, null, text))
      expect(container.querySelector('.katex-error'), where).toBeNull()
      expect(container.textContent, where).not.toMatch(COMMAND)
    }
  })
})
