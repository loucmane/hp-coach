// Diagnostic picker tests — verify section coverage, count, and that
// the picker tolerates empty sections gracefully.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetBankCache, type AnswerLetter, type Question, type Section } from '@/data/questions'
import { DIAGNOSTIC_LENGTH, pickDiagnosticQuestions } from './diagnostic'

const SECTIONS: Section[] = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK']

function makeQuestion(qid: string, section: Section): Question {
  // Minimal fields required for `questionsInSection` to include the row.
  return {
    qid,
    section,
    parsing_status: 'complete',
    options: (['A', 'B', 'C', 'D', 'E'] as AnswerLetter[]).map((letter) => ({
      letter,
      body: 'opt',
    })),
    // Fields below are required by Question type but not relevant here.
    prompt: 'p',
    answer: 'A',
    exam: 'var-2024',
    provpass: 'verb1',
  } as unknown as Question
}

function mockBank(perSection: Record<Section, number>): Question[] {
  const bank: Question[] = []
  for (const section of SECTIONS) {
    const count = perSection[section]
    for (let i = 0; i < count; i++) {
      bank.push(makeQuestion(`${section}-${i}`, section))
    }
  }
  return bank
}

const ABUNDANT: Record<Section, number> = {
  ORD: 50,
  LÄS: 20,
  MEK: 20,
  ELF: 20,
  XYZ: 12,
  KVA: 12,
  NOG: 12,
  DTK: 12,
}

beforeEach(() => {
  __resetBankCache()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Stub `fetch` so loadBank's multi-step pipeline (index → per-exam
// shards → DTK figures) resolves to our synthetic bank. Treats every
// non-index URL as "the exam payload" so a single mock bank flows
// through. DTK figures index is intentionally absent → loader treats
// that as "no figures available".
function stubBank(bank: Question[]) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : (input as Request).url
    if (url.endsWith('/_index.json')) {
      return new Response(JSON.stringify({ exams: [{ exam_id: 'var-test' }] }), { status: 200 })
    }
    if (url.includes('/figures/dtk/')) {
      return new Response('', { status: 404 })
    }
    return new Response(JSON.stringify(bank), { status: 200 })
  })
}

// Deterministic RNG so the count assertions don't flake on the
// section-shuffle step (different section orders → same total).
const seededRng = (seed: number) => {
  let s = seed >>> 0
  return () => {
    s = (1103515245 * s + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

describe('pickDiagnosticQuestions', () => {
  it('returns exactly DIAGNOSTIC_LENGTH questions when every section has ≥2 questions', async () => {
    stubBank(mockBank(ABUNDANT))
    const picked = await pickDiagnosticQuestions(DIAGNOSTIC_LENGTH, seededRng(1))
    expect(picked).toHaveLength(DIAGNOSTIC_LENGTH)
  })

  it('covers every section that has at least one question', async () => {
    stubBank(mockBank(ABUNDANT))
    const picked = await pickDiagnosticQuestions(DIAGNOSTIC_LENGTH, seededRng(1))
    const sectionsHit = new Set(picked.map((q) => q.section))
    // 10 questions across 8 sections → all 8 covered, two get a 2nd.
    expect(sectionsHit.size).toBe(8)
  })

  it('returns no duplicate qids', async () => {
    stubBank(mockBank(ABUNDANT))
    const picked = await pickDiagnosticQuestions(DIAGNOSTIC_LENGTH, seededRng(7))
    const ids = picked.map((q) => q.qid)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('skips sections with zero parsed questions instead of crashing', async () => {
    const bank = mockBank({ ...ABUNDANT, DTK: 0, ELF: 0 })
    stubBank(bank)
    const picked = await pickDiagnosticQuestions(DIAGNOSTIC_LENGTH, seededRng(1))
    const sectionsHit = new Set(picked.map((q) => q.section))
    expect(sectionsHit.has('DTK')).toBe(false)
    expect(sectionsHit.has('ELF')).toBe(false)
    // Falls back to picking only from sections that have content. We
    // don't reshuffle to backfill empty slots in v1 — accept a short
    // list rather than over-sampling a single section.
    expect(picked.length).toBeLessThanOrEqual(DIAGNOSTIC_LENGTH)
    expect(picked.length).toBeGreaterThan(0)
  })

  it('returns empty array when the bank is empty', async () => {
    stubBank([])
    const picked = await pickDiagnosticQuestions(DIAGNOSTIC_LENGTH, seededRng(1))
    expect(picked).toEqual([])
  })

  it('honors a custom count', async () => {
    stubBank(mockBank(ABUNDANT))
    const picked = await pickDiagnosticQuestions(5, seededRng(1))
    expect(picked).toHaveLength(5)
    // 5/8 sections covered; the rest get 0.
    expect(new Set(picked.map((q) => q.section)).size).toBe(5)
  })

  it('shuffles the final order so questions alternate across sections', async () => {
    stubBank(mockBank(ABUNDANT))
    const picked = await pickDiagnosticQuestions(DIAGNOSTIC_LENGTH, seededRng(1))
    // The picker assembles per-section then shuffles. After shuffle,
    // adjacent questions are unlikely to all be from the same section.
    // Smoke check: not every adjacent pair shares a section.
    let sameSectionPairs = 0
    for (let i = 0; i < picked.length - 1; i++) {
      if (picked[i].section === picked[i + 1].section) sameSectionPairs++
    }
    expect(sameSectionPairs).toBeLessThan(picked.length - 1)
  })
})
