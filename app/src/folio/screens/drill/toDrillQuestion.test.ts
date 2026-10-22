import { describe, expect, it } from 'vitest'
import type { Question } from '@/data/questions'
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
  it.each(['LÄS', 'ELF', 'DTK'] as const)('keeps %s classic', (section) => {
    expect(supportsFolioDrill({ ...q, section })).toBe(false)
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
