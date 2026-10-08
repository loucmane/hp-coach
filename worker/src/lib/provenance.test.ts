// Attempt provenance (P5 infold PR 3, docs/p5-infold-design.md Amendment 1 E):
// the server-side classifier that every stats / fit / mastery rule keys on.
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
  ASSESSED_SOURCES,
  ATTEMPT_SOURCES,
  AUTHENTIC_EXAM_IDS,
  classifyAttempt,
  classifyAttemptSource,
  estimateBasis,
  isAuthenticQid,
  isRegisteredP5Qid,
  masteryLayer1Ids,
  p5FrameworkId,
  planEstimateBasis,
} from './provenance'
import { extractSection } from './section'

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const BANK_DIR = join(REPO, 'app/public/data')
const SAMPLE_BANK = join(REPO, 'pipeline/synthetic/infold/preview/sample/p5-bank-sample.json')
const PILOT_SHARD = join(REPO, 'data/explanations/p5-pilot.json')

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
const frameworkIds = registry.framework_ids as Record<string, string>

describe('ATTEMPT_SOURCES', () => {
  it('is exactly authentic | synthetic | unknown, and only the first two are assessed', () => {
    expect([...ATTEMPT_SOURCES]).toEqual(['authentic', 'synthetic', 'unknown'])
    expect([...ASSESSED_SOURCES]).toEqual(['authentic', 'synthetic'])
  })
})

describe('authentic — the bank roster and its qid grammar', () => {
  it('the sitting roster is exactly the exams of app/public/data/_index.json', () => {
    const index = readJson<{ exams: Array<{ exam_id: string }> }>(join(BANK_DIR, '_index.json'))
    expect([...AUTHENTIC_EXAM_IDS].sort()).toEqual(index.exams.map((e) => e.exam_id).sort())
  })

  it('classifies every one of the 4320 bank qids authentic, with no item revision', () => {
    const qids = bankQids()
    expect(qids).toHaveLength(4320)
    const misfits = qids.filter((qid) => {
      const p = classifyAttempt(qid)
      return p.source !== 'authentic' || p.itemRevision !== null
    })
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
    expect(registryQids).toHaveLength(340)
    expect(new Set(registryQids).size).toBe(registryQids.length)
    expect(registry.framework_id_count).toBe(Object.keys(frameworkIds).length)
  })

  it('classifies every registry qid synthetic, carrying its unit revision', () => {
    for (const unit of registry.units) {
      for (const qid of unit.qids) {
        expect(classifyAttempt(qid)).toEqual({ source: 'synthetic', itemRevision: unit.revision })
      }
    }
    // las-b7-002 is the one unit at revision 2.
    expect(classifyAttempt('p5-las-b7-002-r2-LÄS-001')).toEqual({
      source: 'synthetic',
      itemRevision: 2,
    })
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
    expect(classifyAttempt(qid)).toEqual({ source: 'unknown', itemRevision: null })
    expect(classifyAttemptSource(qid)).toBe('unknown')
    expect(isAuthenticQid(qid)).toBe(false)
    expect(isRegisteredP5Qid(qid)).toBe(false)
  })
})

describe('P5 framework ids — from the reviewed explanation shard only', () => {
  it('are exactly the pilot shard’s framework ids for registered qids', () => {
    const pilot = readJson<Record<string, { framework_id?: string }>>(PILOT_SHARD)
    const expected = Object.fromEntries(
      Object.entries(pilot)
        .filter(([, e]) => e.framework_id !== undefined)
        .map(([qid, e]) => [qid, e.framework_id]),
    )
    expect(Object.keys(expected)).toHaveLength(14)
    for (const qid of registryQids) expect(p5FrameworkId(qid)).toBe(expected[qid] ?? null)
  })

  it('is a framework of the question’s own section', () => {
    for (const [qid, fid] of Object.entries(frameworkIds)) {
      const prefix = extractSection(qid) === 'LÄS' ? 'LAS-' : 'ELF-'
      expect(fid.startsWith(prefix)).toBe(true)
    }
  })

  it('is null for an unexplained P5 question, an authentic qid and an unknown qid', () => {
    expect(p5FrameworkId('p5-elf-b18-002-r1-ELF-001')).toBeNull() // cloze gap, no framework
    expect(p5FrameworkId('var-2024-kvant1-KVA-002')).toBeNull()
    expect(p5FrameworkId('p5-las-b7-002-r1-LÄS-001')).toBeNull() // revoked revision
  })
})

describe('masteryLayer1Ids — which tags may move mastery / framework_progress', () => {
  const P5_TAGGED = 'p5-las-b19-002-r1-LÄS-001' // LAS-TYPE-003 in the shard
  const P5_UNTAGGED = 'p5-elf-b18-002-r1-ELF-001'

  it('an authentic answer keeps every client tag, deduplicated in first-seen order', () => {
    expect(
      masteryLayer1Ids('var-2024-kvant1-KVA-002', 'authentic', [
        'KVA-NEG-001',
        'KVA-UNIT-004',
        'KVA-NEG-001',
      ]),
    ).toEqual(['KVA-NEG-001', 'KVA-UNIT-004'])
  })

  it('a synthetic answer keeps only the framework id its explanation carries', () => {
    expect(masteryLayer1Ids(P5_TAGGED, 'synthetic', ['LAS-TYPE-003'])).toEqual(['LAS-TYPE-003'])
    expect(
      masteryLayer1Ids(P5_TAGGED, 'synthetic', ['LAS-TYPE-001', 'LAS-TYPE-003', 'KVA-NEG-001']),
    ).toEqual(['LAS-TYPE-003'])
    // A tag the explanation does not carry, or no tag at all, moves nothing.
    expect(masteryLayer1Ids(P5_TAGGED, 'synthetic', ['LAS-TYPE-001'])).toEqual([])
    expect(masteryLayer1Ids(P5_TAGGED, 'synthetic', undefined)).toEqual([])
    // A P5 question without a framework id never moves mastery.
    expect(masteryLayer1Ids(P5_UNTAGGED, 'synthetic', ['ELF-TYPE-001'])).toEqual([])
  })

  it('an unknown answer never moves mastery', () => {
    expect(masteryLayer1Ids('q1', 'unknown', ['KVA-NEG-001'])).toEqual([])
    expect(masteryLayer1Ids('p5-las-b7-002-r1-LÄS-001', 'unknown', ['LAS-TYPE-001'])).toEqual([])
  })
})

describe('estimate bases', () => {
  it('an estimate is calibrated exactly when no synthetic answer is in it', () => {
    expect(estimateBasis(12, 0)).toEqual({ authentic: 12, synthetic: 0, calibrated: true })
    expect(estimateBasis(12, 1)).toEqual({ authentic: 12, synthetic: 1, calibrated: false })
    expect(estimateBasis(0, 0)).toEqual({ authentic: 0, synthetic: 0, calibrated: true })
  })

  it('a Provpass plan basis counts each presented qid by its server-side source', () => {
    const basis = planEstimateBasis([
      'var-2024-verb1-ORD-001',
      'var-2024-verb1-ORD-002',
      'p5-las-b19-002-r1-LÄS-001',
      'p5-las-b19-002-r1-LÄS-002',
      'var-2024-verb2-MEK-021',
      'p5-elf-b19-003-r1-ELF-001',
    ])
    expect(basis).toEqual({
      authentic: 3,
      synthetic: 3,
      unknown: 0,
      calibrated: false,
      perSection: {
        ORD: { authentic: 2, synthetic: 0, unknown: 0, calibrated: true },
        LÄS: { authentic: 0, synthetic: 2, unknown: 0, calibrated: false },
        MEK: { authentic: 1, synthetic: 0, unknown: 0, calibrated: true },
        ELF: { authentic: 0, synthetic: 1, unknown: 0, calibrated: false },
      },
    })
  })

  it('an authentic-only plan is calibrated; an unknown qid in a plan is not', () => {
    expect(planEstimateBasis(['var-2024-kvant1-XYZ-001']).calibrated).toBe(true)
    const withUnknown = planEstimateBasis(['var-2024-kvant1-XYZ-001', 'p5-las-b7-002-r1-LÄS-001'])
    expect(withUnknown).toMatchObject({ authentic: 1, synthetic: 0, unknown: 1, calibrated: false })
    expect(withUnknown.perSection.LÄS).toEqual({
      authentic: 0,
      synthetic: 0,
      unknown: 1,
      calibrated: false,
    })
    // A qid without a section counts as unknown overall, under no section.
    expect(planEstimateBasis(['q1'])).toEqual({
      authentic: 0,
      synthetic: 0,
      unknown: 1,
      calibrated: false,
      perSection: {},
    })
  })
})
