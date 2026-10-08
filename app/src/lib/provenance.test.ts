// Client-side provenance helpers (P5 infold PR 3, docs/p5-infold-design.md
// Amendment 1 E): reading the worker's estimateBasis, and the framework-id
// rule the automatic trap counts apply to P5 mistakes.

import { describe, expect, it } from 'vitest'

import { combineBases, frameworkSignal, isCalibrated, isP5Qid } from './provenance'

describe('isP5Qid', () => {
  it('is the exporter’s p5- namespace, which no authentic exam id carries', () => {
    expect(isP5Qid('p5-las-b19-002-r1-LÄS-001')).toBe(true)
    expect(isP5Qid('p5-elf-b18-002-r1-ELF-003')).toBe(true)
    expect(isP5Qid('var-2024-verb1-LÄS-011')).toBe(false)
    expect(isP5Qid('host-2025-kvant1-XYZ-002')).toBe(false)
  })
})

describe('isCalibrated', () => {
  it('follows the worker’s basis', () => {
    expect(isCalibrated({ authentic: 3, synthetic: 0, calibrated: true })).toBe(true)
    expect(isCalibrated({ authentic: 3, synthetic: 2, calibrated: false })).toBe(false)
  })

  it('reads an absent basis (an older worker, a row from before P5) as calibrated', () => {
    expect(isCalibrated(undefined)).toBe(true)
    expect(isCalibrated(null)).toBe(true)
  })
})

describe('combineBases', () => {
  it('sums the parts; the whole is calibrated only when every part is', () => {
    expect(
      combineBases([
        { authentic: 4, synthetic: 0, calibrated: true },
        { authentic: 1, synthetic: 3, calibrated: false },
        null,
        undefined,
      ]),
    ).toEqual({ authentic: 5, synthetic: 3, calibrated: false })
    expect(
      combineBases([
        { authentic: 4, synthetic: 0, calibrated: true },
        { authentic: 2, synthetic: 0, calibrated: true },
      ]),
    ).toEqual({ authentic: 6, synthetic: 0, calibrated: true })
  })

  it('an uncalibrated part with no synthetic answer (a Provpass unknown qid) still uncalibrates the whole', () => {
    expect(
      combineBases([
        { authentic: 4, synthetic: 0, calibrated: true },
        { authentic: 1, synthetic: 0, calibrated: false },
      ]),
    ).toEqual({ authentic: 5, synthetic: 0, calibrated: false })
  })

  it('is an empty, calibrated basis for no parts', () => {
    expect(combineBases([])).toEqual({ authentic: 0, synthetic: 0, calibrated: true })
  })
})

describe('frameworkSignal — what an automatic trap count may take from a mistake', () => {
  it('passes an authentic question’s framework id through unchanged', () => {
    expect(frameworkSignal('var-2024-kvant1-KVA-002', 'KVA-NEG-001')).toBe('KVA-NEG-001')
    // Unchanged behaviour: no section check for authentic questions.
    expect(frameworkSignal('var-2024-verb1-LÄS-011', 'KVA-NEG-001')).toBe('KVA-NEG-001')
    expect(frameworkSignal('var-2024-verb1-LÄS-011', undefined)).toBeNull()
  })

  it('takes a P5 question’s framework id only when it is a framework of the question’s section', () => {
    expect(frameworkSignal('p5-las-b19-002-r1-LÄS-001', 'LAS-TYPE-003')).toBe('LAS-TYPE-003')
    expect(frameworkSignal('p5-elf-b18-001-r1-ELF-004', 'ELF-TYPE-005')).toBe('ELF-TYPE-005')
    expect(frameworkSignal('p5-las-b19-002-r1-LÄS-001', 'ELF-TYPE-001')).toBeNull()
    expect(frameworkSignal('p5-elf-b18-001-r1-ELF-004', 'LAS-TYPE-001')).toBeNull()
    expect(frameworkSignal('p5-las-b19-002-r1-LÄS-001', 'KVA-NEG-001')).toBeNull()
    // Not a framework id at all, or spelled with the section's Ä.
    expect(frameworkSignal('p5-las-b19-002-r1-LÄS-001', 'LÄS-TYPE-003')).toBeNull()
    expect(frameworkSignal('p5-las-b19-002-r1-LÄS-001', 'LAS-CLOZE')).toBeNull()
  })

  it('takes nothing from a P5 question without a framework id', () => {
    expect(frameworkSignal('p5-elf-b18-002-r1-ELF-001', undefined)).toBeNull()
    expect(frameworkSignal('p5-elf-b18-002-r1-ELF-001', null)).toBeNull()
    expect(frameworkSignal('p5-elf-b18-002-r1-ELF-001', '')).toBeNull()
  })
})
