import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Explanation } from '@/data/explanations'
import type { Question } from '@/data/questions'
import { citeParagraphs, findQuotes } from './drillCore'
import { folioBlock, supportsFolioDrill } from './seam'
import { toDrillQuestion } from './toDrillQuestion'

const q: Question = {
  qid: 'host-2025-kvant1-XYZ-001',
  exam_id: 'host-2025',
  provpass: 'kvant1',
  section: 'XYZ',
  number: 1,
  prompt: 'Räkna',
  context: null,
  answer: 'A',
  options: [{ letter: 'A', text: 'Ett' }],
  parsing_status: 'complete',
}

describe('Folio question mapper and block seam', () => {
  it('keeps Lärlingstid? out of the paragraph ordinals in LÄS-012', () => {
    const bank = JSON.parse(readFileSync('public/data/var-2013.json', 'utf8')) as Question[]
    const explanations = JSON.parse(
      readFileSync('public/explanations/var-2013.json', 'utf8'),
    ) as Record<string, Explanation>
    const qid = 'var-2013-verb2-LÄS-012'
    const original = bank.find((q) => q.qid === qid)!
    const mapped = toDrillQuestion(original)
    expect(mapped.passage?.title).toBe('Lärlingstid?')
    expect(mapped.passage?.paragraphs[2]).toBe(original.context!.split(/\n\n+/)[3])
    expect(citeParagraphs(explanations[qid].steps![1].text, mapped.passage!.paragraphs)).toEqual([
      3,
    ])
  })
  it('recognizes an ELF question title after the instruction', () => {
    expect(
      toDrillQuestion({
        ...q,
        section: 'ELF',
        context: 'Read the following text.\n\nWhy read?\n\nFirst.\n\nSecond.',
      }).passage,
    ).toMatchObject({ title: 'Why read?', paragraphs: ['First.', 'Second.'] })
  })
  it('audits ordinal and quotation locations across the real reading bank', () => {
    const ordinals = 'första andra tredje fjärde femte sjätte sjunde åttonde nionde tionde'.split(
      ' ',
    )
    const ordinalRe = new RegExp(`(${ordinals.join('|')})\\s+stycket`, 'giu')
    function fields(value: unknown, path = ''): { path: string; text: string }[] {
      if (typeof value === 'string') return [{ path, text: value }]
      if (!value || typeof value !== 'object') return []
      return Object.entries(value).flatMap(([key, item]) => fields(item, `${path}.${key}`))
    }
    const summary = {
      explanations: 0,
      ordinalFields: 0,
      noMatchingQuote: 0,
      multipleLocations: 0,
      pairedFields: 0,
      beforeMismatches: 0,
      afterMismatches: 0,
    }
    const changed: { qid: string; path: string; ordinal: number; before: number; after: number }[] =
      []
    for (const file of readdirSync('public/explanations').filter(
      (name) => !name.startsWith('_') && name.endsWith('.json'),
    )) {
      const bank = JSON.parse(readFileSync(`public/data/${file}`, 'utf8')) as Question[]
      const explanations = JSON.parse(
        readFileSync(`public/explanations/${file}`, 'utf8'),
      ) as Record<string, unknown>
      for (const q of bank.filter((q) => ['LÄS', 'ELF'].includes(q.section))) {
        const passage = toDrillQuestion(q).passage
        if (!passage) continue
        const refs = fields(explanations[q.qid]).filter(({ text }) => text.match(ordinalRe))
        if (refs.length) summary.explanations++
        // Reconstruct the pre-fix numbering, retaining a question-mark title.
        const before = passage.title?.trim().endsWith('?')
          ? [passage.title, ...passage.paragraphs]
          : passage.paragraphs
        for (const { path, text } of refs) {
          summary.ordinalFields++
          const named = [
            ...new Set(
              [...text.matchAll(ordinalRe)].map((m) => ordinals.indexOf(m[1].toLowerCase()) + 1),
            ),
          ]
          const oldLocations = [...new Set(findQuotes(text, before).map((q) => q.para))]
          const locations = [...new Set(findQuotes(text, passage.paragraphs).map((q) => q.para))]
          if (!oldLocations.length || !locations.length) {
            summary.noMatchingQuote++
            continue
          }
          if (named.length !== 1 || oldLocations.length !== 1 || locations.length !== 1) {
            summary.multipleLocations++
            continue
          }
          summary.pairedFields++
          if (oldLocations[0] !== named[0]) summary.beforeMismatches++
          if (locations[0] !== named[0]) summary.afterMismatches++
          if (oldLocations[0] !== locations[0]) {
            changed.push({
              qid: q.qid,
              path,
              ordinal: named[0],
              before: oldLocations[0],
              after: locations[0],
            })
          }
        }
      }
    }
    // Other content/extraction mismatches are an audit result, not corrected by
    // this title rule. In var-2026 several original paragraphs are flattened.
    expect(changed).toEqual([
      { qid: 'var-2013-verb2-LÄS-012', path: '.steps.1.text', ordinal: 3, before: 4, after: 3 },
      { qid: 'var-2026-verb2-LÄS-017', path: '.steps.1.text', ordinal: 2, before: 2, after: 1 },
    ])
    console.info('Reading ordinal/quote audit (single-location fields):', summary)
  })
  it('aligns host-2022-verb1-LÄS-011 body numbering with its explanation', () => {
    const bank = JSON.parse(readFileSync('public/data/host-2022.json', 'utf8')) as Question[]
    const original = bank.find((q) => q.qid === 'host-2022-verb1-LÄS-011')!
    const mapped = toDrillQuestion(original)
    expect(mapped.passage?.title).toBe('Luther, Cranach och Twitter')
    expect(mapped.passage?.paragraphs[1]).toBe(original.context!.split(/\n\n+/)[2])
    expect(citeParagraphs('andra styckets början', mapped.passage!.paragraphs)).toEqual([2])
    const quote = mapped.passage!.paragraphs[1].slice(0, 50)
    expect(citeParagraphs(`"${quote}"`, mapped.passage!.paragraphs)).toContain(2)
  })
  it('maps P5 provenance from the qid, paragraphs and English language', () => {
    const mapped = toDrillQuestion({
      ...q,
      qid: 'p5-unit-r1-ELF-001',
      section: 'ELF',
      context: 'First.\n\nSecond.\n– Author',
    })
    expect(mapped.source.authentic).toBe(false)
    expect(mapped.passage).toEqual({
      paragraphs: ['First.', 'Second.'],
      byline: '– Author',
      lang: 'en',
      synthetic: true,
    })
  })
  it('preserves figure dimensions, option images and option math', () => {
    const mapped = toDrillQuestion({
      ...q,
      figure: { src: 'figure.svg', aspect_ratio: 1.5 },
      options: [
        { letter: 'A', text: '\uE000x^2\uE001', figure: { src: 'option.svg', aspect_ratio: 2 } },
      ],
    })
    expect(mapped.figure).toMatchObject({
      src: 'figure.svg',
      width: 1500,
      height: 1000,
      kind: 'svg',
    })
    expect(mapped.options?.[0].figure).toMatchObject({
      width: 2000,
      height: 1000,
      src: 'option.svg',
    })
    expect(mapped.math).toBe(true)
    expect(
      toDrillQuestion(
        { ...q, figure: { src: 'page.jpg', kind: 'raster', aspect_ratio: 1 } },
        { [q.qid]: { width: 640, height: 900 } },
      ).figure,
    ).toMatchObject({ width: 640, height: 900 })
    expect(toDrillQuestion({ ...q, prompt: '\uE000x\uE001' }).math).toBe(true)
    expect(toDrillQuestion(q).math).toBe(false)
  })
  it.each(['ORD', 'MEK', 'XYZ', 'KVA', 'NOG'] as const)('supports %s', (section) => {
    expect(supportsFolioDrill({ ...q, section })).toBe(true)
  })
  it.each(['LÄS', 'ELF', 'DTK'] as const)('supports %s with options', (section) => {
    expect(supportsFolioDrill({ ...q, section })).toBe(true)
    expect(supportsFolioDrill({ ...q, section, options: [] })).toBe(false)
    expect(supportsFolioDrill({ ...q, section, options: null })).toBe(false)
  })
  it('numbers only body paragraphs after the title and ELF instructions', () => {
    expect(
      toDrillQuestion({ ...q, section: 'LÄS', context: 'Rubrik\n\nFörsta.\n\nAndra.' }).passage,
    ).toMatchObject({ title: 'Rubrik', paragraphs: ['Första.', 'Andra.'] })
    expect(
      toDrillQuestion({
        ...q,
        section: 'ELF',
        context:
          'Read the following text and answer the questions.\n\nThe title\n\nFirst.\n\nSecond.',
      }).passage,
    ).toMatchObject({
      title: 'The title',
      instruction: 'Read the following text and answer the questions.',
      paragraphs: ['First.', 'Second.'],
    })
    expect(
      toDrillQuestion({ ...q, section: 'LÄS', context: `${'L'.repeat(91)}\n\nBody.` }).passage
        ?.paragraphs,
    ).toHaveLength(2)
  })
  it('uses contiguous blocks, not matching content elsewhere in the plan', () => {
    const same = { ...q, context: 'Samma text' }
    const plan = [same, { ...q, context: 'Annan text' }, same, same, q]
    expect(folioBlock(plan, 3)).toEqual({ start: 2, end: 4 })
    expect(folioBlock([q, q], 1)).toEqual({ start: 1, end: 2 })
    const figure = { ...q, figure: { src: 'figure.svg', aspect_ratio: 1 } }
    expect(folioBlock([q, figure, figure], 2)).toEqual({ start: 1, end: 3 })
    expect(folioBlock([figure, { ...figure, section: 'DTK' }], 0)).toEqual({ start: 0, end: 1 })
  })
})
