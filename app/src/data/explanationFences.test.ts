// Explanation math fences must contain whole, parseable LaTeX (hpf-hhlz, hpf-hhrn).
// Visit every string, including titles, distractors and nested steps.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from '@testing-library/react'
import katex from 'katex'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { MathText } from '@/components/MathText'

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/explanations')
const MATH_OPEN = '\uE000'
const MATH_CLOSE = '\uE001'
const EXAMS = readdirSync(DATA)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => ({
    file,
    entries: JSON.parse(readFileSync(path.join(DATA, file), 'utf8')) as Record<string, unknown>,
  }))

function* strings(value: unknown, field = ''): Generator<[string, string]> {
  if (typeof value === 'string') {
    yield [field, value]
  } else if (Array.isArray(value)) {
    for (const [index, child] of value.entries()) yield* strings(child, `${field}[${index}]`)
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      yield* strings(child, field ? `${field}.${key}` : key)
    }
  }
}

function balancedGroups(latex: string): boolean {
  let depth = 0
  // Consume escaped characters first: \{ is literal, \\ followed by { is not.
  for (const token of latex.match(/\\.|[{}]/gs) ?? []) {
    if (token === '{') depth++
    if (token === '}' && --depth < 0) return false
  }
  return depth === 0
}

function fenceIssues(text: string): string[] {
  const issues: string[] = []
  let start: number | undefined
  let span = 0
  for (let index = 0; index < text.length; index++) {
    if (text[index] === MATH_OPEN) {
      span++
      if (start !== undefined) issues.push(`span ${span}: nested opening fence`)
      start = index + 1
    } else if (text[index] === MATH_CLOSE) {
      if (start === undefined) issues.push(`span ${span}: closing fence without opener`)
      else if (!balancedGroups(text.slice(start, index))) {
        issues.push(`span ${span}: unbalanced braces`)
      }
      start = undefined
    }
  }
  if (start !== undefined) issues.push(`span ${span}: opening fence without closer`)
  return issues
}

describe('fence audit semantics', () => {
  it.each([
    ['nested groups', '\uE000\\frac{1}{\\sqrt{2}}\uE001', false],
    ['escaped opening brace', '\uE000\\{x\uE001', false],
    ['escaped closing brace', '\uE000x\\}\uE001', false],
    ['line break then group', '\uE000\\\\{x}\uE001', false],
    ['line break then unclosed group', '\uE000\\\\{x\uE001', true],
    ['split fraction', '\uE000\\dfrac{2 \\cdot\uE001 9}{7}', true],
    ['braces split across spans', '\uE000{x\uE001 prose \uE000y}\uE001', true],
    ['wrong brace order', '\uE000}{\uE001', true],
    ['unclosed fence', '\uE000{x}', true],
    ['orphan closer', '{x}\uE001', true],
    ['nested fences', '\uE000\uE000{x}\uE001\uE001', true],
  ])('%s', (_label, text, invalid) => {
    expect(fenceIssues(text).length > 0).toBe(invalid)
  })
})

describe('explanation math fences', () => {
  it('checks every fenced span in every served explanation file', () => {
    expect(EXAMS.length).toBeGreaterThan(0)
    let spans = 0
    const offenders: string[] = []
    for (const { file, entries } of EXAMS) {
      for (const [qid, entry] of Object.entries(entries)) {
        for (const [field, text] of strings(entry)) {
          spans += text.split(MATH_OPEN).length - 1
          for (const issue of fenceIssues(text)) {
            offenders.push(`${file} | ${qid} | ${field} | ${issue}`)
          }
        }
      }
    }
    expect(spans).toBeGreaterThan(0)
    expect(offenders).toEqual([])
  })

  it('KaTeX-parses every fenced span in every served explanation file', () => {
    expect(EXAMS.length).toBeGreaterThan(0)
    let spans = 0
    const offenders: string[] = []
    for (const { file, entries } of EXAMS) {
      for (const [qid, entry] of Object.entries(entries)) {
        for (const [field, text] of strings(entry)) {
          for (const [index, match] of [
            ...text.matchAll(/\uE000([^\uE000\uE001]*)\uE001/g),
          ].entries()) {
            spans++
            try {
              katex.renderToString(match[1], { throwOnError: true, strict: 'ignore' })
            } catch (error) {
              offenders.push(`${file} | ${qid} | ${field} | span ${index + 1}: ${String(error)}`)
            }
          }
        }
      }
    }
    expect(spans).toBeGreaterThan(0)
    expect(offenders).toEqual([])
  })

  it.each([
    ['host-2016.json', 'host-2016-kvant2-XYZ-009', 'solution_path'],
    ['host-2017.json', 'host-2017-kvant1-XYZ-007', 'steps[7].text'],
    ['host-2018.json', 'host-2018-kvant1-XYZ-010', 'steps[2].text'],
    ['host-2016.json', 'host-2016-kvant2-XYZ-008', 'steps[0].text'],
    ['host-2016.json', 'host-2016-kvant1-NOG-026', 'steps[4].text'],
    ['host-2018.json', 'host-2018-kvant2-KVA-017', 'pitfall'],
    ['host-2020.json', 'host-2020-kvant2-NOG-028', 'technique'],
    ['host-2022.json', 'host-2022-kvant1-XYZ-002', 'technique'],
  ])('renders repaired %s | %s | %s without a KaTeX error', (file, qid, field) => {
    const entry = EXAMS.find((exam) => exam.file === file)?.entries[qid]
    const text = [...strings(entry)].find(([key]) => key === field)?.[1]
    expect(text).toBeDefined()
    const { container } = render(createElement(MathText, null, text))
    expect(container.querySelectorAll('.katex').length).toBeGreaterThan(0)
    expect(container.querySelector('.katex-error')).toBeNull()
  })

  it('renders XYZ-009 step 9 as two complete formulas without a KaTeX error', () => {
    const entry = EXAMS.find(({ file }) => file === 'host-2025.json')?.entries[
      'host-2025-kvant2-XYZ-009'
    ] as { steps: { title: string; text: string }[] }
    const step = entry.steps[8]
    expect(step.title).toBe('Förkorta 63 mot 7')
    expect(step.text).toBe(
      '\uE00063 = 7 \\cdot 9\uE001, så \uE000\\dfrac{2}{7} \\cdot 63 = \\dfrac{2 \\cdot 7 \\cdot 9}{7} = 2 \\cdot 9 = 18\uE001.',
    )
    const { container } = render(createElement(MathText, null, step.text))
    expect(container.querySelector('.katex-error')).toBeNull()
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    expect(container.textContent).not.toMatch(/\\[a-zA-Z]+|[{}]/)
  })
})
