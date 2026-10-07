// Attempt provenance (P5 infold PR 3, docs/p5-infold-design.md §E): the
// server-side classifier that every stats / fit / mastery filter keys on.
//
// Reads the committed authentic bank (app/public/data) and the committed P5
// qid registry (worker/data) so the classifier is checked against the real
// rosters, not hand-picked samples.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import registry from '../../data/p5-qid-registry.json'
import {
  ATTEMPT_SOURCES,
  AUTHENTIC_EXAM_IDS,
  classifyAttemptSource,
  isAuthenticQid,
  isRegisteredP5Qid,
} from './provenance'
import { extractSection } from './section'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const BANK_DIR = join(REPO, 'app/public/data')
const SAMPLE_BANK = join(REPO, 'pipeline/synthetic/infold/preview/sample/p5-bank-sample.json')

// Built from code points so the source shows what the qid holds.
const DECOMPOSED_LAS = `LA${String.fromCodePoint(0x0308)}S` // A + COMBINING DIAERESIS, not Ä
const ARABIC_INDIC_DIGITS = String.fromCodePoint(0x0660, 0x0661, 0x0662)

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

/** Every qid of the authentic bank the app serves (27 sittings × 160). */
function bankQids(): string[] {
  const out: string[] = []
  for (const file of readdirSync(BANK_DIR).sort()) {
    if (!file.endsWith('.json') || file.startsWith('_')) continue
    for (const row of readJson<Array<{ qid: string }>>(join(BANK_DIR, file))) out.push(row.qid)
  }
  return out
}

const registryQids = registry.units.flatMap((u) => u.qids)

describe('ATTEMPT_SOURCES', () => {
  it('is exactly authentic | synthetic | unknown', () => {
    expect([...ATTEMPT_SOURCES]).toEqual(['authentic', 'synthetic', 'unknown'])
  })
})

describe('authentic — the bank roster and its qid grammar', () => {
  it('the sitting roster is exactly the exams of app/public/data/_index.json', () => {
    const index = readJson<{ exams: Array<{ exam_id: string }> }>(join(BANK_DIR, '_index.json'))
    expect([...AUTHENTIC_EXAM_IDS].sort()).toEqual(index.exams.map((e) => e.exam_id).sort())
  })

  it('classifies every one of the 4320 bank qids authentic', () => {
    const qids = bankQids()
    expect(qids).toHaveLength(4320)
    const misfits = qids.filter((qid) => classifyAttemptSource(qid) !== 'authentic')
    expect(misfits).toEqual([])
  })

  it('accepts the legacy LAS spelling that lib/section.ts already normalises to LÄS', () => {
    expect(extractSection('var-2024-verb1-LAS-011')).toBe('LÄS')
    expect(isAuthenticQid('var-2024-verb1-LAS-011')).toBe(true)
  })

  it.each([
    ['no provpass token (an old test fixture shape)', 'var-2024-XYZ-001'],
    ['a sitting the bank does not hold', 'var-2099-verb1-ORD-001'],
    ['a quant section in a verbal pass', 'var-2024-verb1-XYZ-001'],
    ['a verbal section in a quant pass', 'var-2024-kvant2-LÄS-011'],
    ['an unknown provpass', 'var-2024-verb3-ORD-001'],
    ['a two-digit number', 'var-2024-verb1-ORD-01'],
    ['a four-digit number', 'var-2024-verb1-ORD-0001'],
    ['a lower-case section', 'var-2024-verb1-ord-001'],
    ['an upper-case sitting', 'VAR-2024-verb1-ORD-001'],
    ['surrounding whitespace', ' var-2024-verb1-ORD-001'],
    ['a trailing newline', 'var-2024-verb1-ORD-001\n'],
    ['a decomposed Ä', `var-2024-verb1-${DECOMPOSED_LAS}-011`],
    ['non-ASCII digits', `var-2024-verb1-ORD-${ARABIC_INDIC_DIGITS}`],
    ['a second qid glued on', 'var-2024-verb1-ORD-001-verb1-ORD-001'],
    ['a P5 qid', 'p5-las-b19-002-r1-LÄS-001'],
  ])('rejects %s', (_label, qid) => {
    expect(isAuthenticQid(qid)).toBe(false)
  })
})

describe('synthetic — the committed P5 qid registry', () => {
  it('is the exporter’s registry format and census', () => {
    expect(registry.format).toBe('p5-qid-registry-v1')
    expect(registry.unit_count).toBe(registry.units.length)
    expect(registry.qid_count).toBe(registryQids.length)
    expect(registryQids.length).toBeGreaterThan(0)
    expect(new Set(registryQids).size).toBe(registryQids.length)
  })

  it('classifies every registry qid synthetic', () => {
    const misfits = registryQids.filter((qid) => classifyAttemptSource(qid) !== 'synthetic')
    expect(misfits).toEqual([])
  })

  it('never overlaps the authentic bank', () => {
    const bank = new Set(bankQids())
    expect(registryQids.filter((qid) => bank.has(qid))).toEqual([])
  })

  it('registers the committed preview sample’s qids', () => {
    const sample = readJson<{ questions: Array<{ qid: string }> }>(SAMPLE_BANK)
    for (const row of sample.questions) expect(isRegisteredP5Qid(row.qid)).toBe(true)
  })

  it('keeps P5 qids within the 60-character API limit and on a LÄS/ELF section', () => {
    for (const qid of registryQids) {
      expect(qid.length).toBeLessThanOrEqual(60)
      expect(['LÄS', 'ELF']).toContain(extractSection(qid))
    }
  })
})

describe('unknown — everything else fails closed', () => {
  it.each([
    ['a seed/test id', 'q1'],
    ['a malformed id', 'not-a-real-qid'],
    ['the empty string', ''],
    ['a retired unit (RETIRED.json)', 'p5-elf-b14-002-r1-ELF-001'],
    ['a superseded revision (las-b7-002 is at r2)', 'p5-las-b7-002-r1-LÄS-001'],
    ['a revision nobody approved', 'p5-las-b19-002-r2-LÄS-001'],
    ['a number past the unit’s questions', 'p5-las-b19-002-r1-LÄS-003'],
    ['the LAS spelling of a P5 qid', 'p5-las-b19-002-r1-LAS-001'],
    ['a P5 qid with a trailing space', 'p5-las-b19-002-r1-LÄS-001 '],
    ['a P5 qid in upper case', 'P5-LAS-B19-002-R1-LÄS-001'],
    ['an authentic-looking qid of an unknown sitting', 'host-2031-kvant1-NOG-024'],
  ])('%s', (_label, qid) => {
    expect(classifyAttemptSource(qid)).toBe('unknown')
    expect(isAuthenticQid(qid)).toBe(false)
    expect(isRegisteredP5Qid(qid)).toBe(false)
  })
})
