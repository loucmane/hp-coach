// Explanations must not contain the generating model thinking out loud
// (hpf-ydaz): "VÄNTA: faktiskt …", "Hmm.", "Vi går på facit". The facit shows
// every explanation section by default, so leaked reasoning reaches the
// learner verbatim. Visit every string, including titles, distractors and
// nested steps, in every served explanation file.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { MathText } from '@/components/MathText'
import type { Question } from './questions'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SERVED = path.join(ROOT, 'app/public/explanations')
const SOURCE = path.join(ROOT, 'data/explanations')
const BANK = path.join(ROOT, 'app/public/data')
const MATH_OPEN = ''
const MATH_CLOSE = ''

// Exam files only: _index.json and the audit notes start with "_".
const EXAM_FILES = readdirSync(SERVED)
  .filter((file) => /^[a-z0-9-]+\.json$/.test(file))
  .sort()

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T

// Case-sensitive. A letter on either side means the match sits inside another
// word (OVÄNTAT, FÖRVÄNTAN, VÄNTAN, hemma), which is ordinary Swedish. A bare
// "vänta," is ordinary too ("nöjer dig inte med att vänta, du …"); only a
// "vänta," that interrupts the text after a dash or an ellipsis is a marker.
const MARKERS: ReadonlyArray<readonly [name: string, pattern: RegExp]> = [
  ['VÄNTA', /(?<!\p{L})VÄNTA(?!\p{L})/u],
  ['Hmm', /(?<!\p{L})Hm+(?!\p{L})/u],
  ['Men vänta', /(?<!\p{L})Men vänta(?!\p{L})/u],
  ['— vänta,', /(?:—|–|…|\.\.\.)\s*vänta,/u],
  ['Vi går på facit', /(?<!\p{L})Vi går på facit(?!\p{L})/u],
  ['Mest sannolik tolkning', /(?<!\p{L})Mest sannolik tolkning(?!\p{L})/u],
  ['Okej, så', /(?<!\p{L})Okej, så(?!\p{L})/u],
  ['Ah,', /(?<!\p{L})Ah,/u],
]

// Genuine uses, by file, question and field. Keep this list small: every entry
// must still match (checked below), so a rewrite that drops the word also
// drops its exemption.
const ALLOWED: ReadonlyArray<{
  file: string
  qid: string
  field: string
  marker: string
  why: string
}> = [
  {
    file: 'var-2025.json',
    qid: 'var-2025-verb2-ORD-008',
    field: 'distractors[1].why_tempting',
    marker: 'VÄNTA',
    why: "the ALL-CAPS gloss 'VÄNTA SIG' of a tempting misreading, not reasoning",
  },
]

function markersIn(text: string): string[] {
  return MARKERS.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
}

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

const allowed = (file: string, qid: string, field: string, marker: string) =>
  ALLOWED.some(
    (entry) =>
      entry.file === file && entry.qid === qid && entry.field === field && entry.marker === marker,
  )

describe('reasoning marker semantics', () => {
  it.each([
    ['VÄNTA: faktiskt är Kvantitet I = x·x', 'VÄNTA'],
    ['utfallet var OVÄNTAT', null],
    ['POSITIV FÖRVÄNTAN', null],
    ['Tålmodig är om VÄNTAN', null],
    ['Hmm — det ger 1 år, inte 2.', 'Hmm'],
    ['Hm, s_3 ska vara 7.', 'Hmm'],
    ['de var hemma', null],
    ['Men vänta, 142 är 2005-talet.', 'Men vänta'],
    ['stora ≥ 43 ✓ — vänta, stora = 43 ✓', '— vänta,'],
    ['om Sandman… vänta, fel text.', '— vänta,'],
    ['du nöjer dig inte med att vänta, du sätter in kraft', null],
    ['om en afrikansk vår är att vänta, granskar', null],
    ['Vi går på facit: I = II.', 'Vi går på facit'],
    ['Mest sannolik tolkning', 'Mest sannolik tolkning'],
    ['Mest sannolikt 190 km', null],
    ['Okej, så testar vi', 'Okej, så'],
    ['Ah, då stämmer det.', 'Ah,'],
    ['Aha, sa hon.', null],
  ])('%j → %s', (text, marker) => {
    expect(markersIn(text)[0] ?? null).toBe(marker)
  })
})

describe('explanation reasoning leaks', () => {
  it('finds no generator reasoning in any served explanation', () => {
    expect(EXAM_FILES.length).toBeGreaterThan(0)
    let fields = 0
    const offenders: string[] = []
    for (const file of EXAM_FILES) {
      const entries = readJson<Record<string, unknown>>(path.join(SERVED, file))
      for (const [qid, entry] of Object.entries(entries)) {
        for (const [field, text] of strings(entry)) {
          fields++
          for (const marker of markersIn(text)) {
            if (!allowed(file, qid, field, marker)) {
              offenders.push(`${file} | ${qid} | ${field} | ${marker}`)
            }
          }
        }
      }
    }
    expect(fields).toBeGreaterThan(0)
    expect(offenders).toEqual([])
  })

  it.each(ALLOWED)('still needs the allow-list entry for $qid $field', (entry) => {
    const entries = readJson<Record<string, unknown>>(path.join(SERVED, entry.file))
    const text = [...strings(entries[entry.qid])].find(([field]) => field === entry.field)?.[1]
    expect(text).toBeDefined()
    expect(markersIn(text ?? '')).toContain(entry.marker)
  })

  it('keeps data/explanations byte-identical to the served store', () => {
    const drift = EXAM_FILES.filter(
      (file) =>
        readFileSync(path.join(SOURCE, file), 'utf8') !==
        readFileSync(path.join(SERVED, file), 'utf8'),
    )
    expect(drift).toEqual([])
  })
})

// Questions whose math the PDF text extraction lost (hpf-ydaz), restored
// against the exam PDFs. Each fixed field must keep the restored LaTeX as one
// typeset span and render without a KaTeX error or a raw command.
const REPAIRED: ReadonlyArray<readonly [qid: string, where: string, latex: string]> = [
  ['host-2018-kvant1-XYZ-001', 'option A', '14 \\cdot 46 + 35'],
  ['host-2018-kvant1-XYZ-001', 'option C', '14 \\cdot (46 + 35)'],
  ['host-2018-kvant1-XYZ-001', 'option D', '14^{(46 + 35)}'],
  ['host-2023-kvant2-KVA-013', 'prompt', '\\sqrt{x} \\cdot \\sqrt{x}'],
  ['var-2017-kvant2-KVA-013', 'prompt', '\\frac{3 \\cdot 5 \\cdot 26}{13 \\cdot 15}'],
]

function questionField(qid: string, where: string): string | undefined {
  const exam = qid.match(/^(.+)-(?:kvant|verb)[12]-/)?.[1]
  const question = readJson<Question[]>(path.join(BANK, `${exam}.json`)).find((q) => q.qid === qid)
  if (where === 'prompt') return question?.prompt ?? undefined
  return question?.options?.find((option) => `option ${option.letter}` === where)?.text
}

describe('hpf-ydaz repaired questions', () => {
  it.each(REPAIRED)('%s %s typesets %s', (qid, where, latex) => {
    const text = questionField(qid, where)
    expect(text).toContain(`${MATH_OPEN}${latex}${MATH_CLOSE}`)
    const { container } = render(createElement(MathText, null, text))
    expect(container.querySelector('.katex-error')).toBeNull()
    expect(container.textContent).not.toMatch(/\\[a-zA-Z]+/)
  })
})
