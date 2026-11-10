import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { Question } from '@/data/questions'
import { listAuthenticPasses, type PassOption } from '@/lib/mock'
import { sheetFromAttempts } from '@/lib/mockSheet'
import type { NormeringSitting } from '@/lib/normering'
import { buildHubView, buildResultView } from './provView'

const pass = (examId: string, seenBefore = 0): PassOption => ({
  examId,
  provpass: 'verb1',
  half: 'verbal',
  presented: 40,
  seenBefore,
  totalExposure: seenBefore * 2,
})
const bank: Question[] = ['ORD', 'LÄS'].map((section, i) => ({
  qid: `q${i}`,
  section: section as Question['section'],
  number: i + 1,
  exam_id: 'var-2024',
  provpass: 'verb1',
  prompt: 'Fråga',
  options: [
    { letter: 'A', text: 'Ett' },
    { letter: 'B', text: 'Två' },
  ],
  answer: 'A',
  context: null,
  figure: null,
  parsing_status: 'complete',
}))
const row: MockResultRow = {
  id: 5,
  userId: 1,
  sessionId: 3,
  mode: 'authentic',
  half: 'verbal',
  examId: 'var-2024',
  provpass: 'verb1',
  presented: 40,
  answered: 39,
  correct: 38,
  seenBefore: 4,
  durationMs: 3_300_000,
  createdAt: 100,
  breakdown: {
    version: 1,
    missedQids: ['q0'],
    perSection: {
      LÄS: { presented: 10, correct: 9, timeMs: 21 * 60_000 },
      ORD: { presented: 10, correct: 9, timeMs: 3 * 60_000 },
    },
  },
}
const answers = sheetFromAttempts([
  { questionId: 'q0', selectedAnswer: 'B', timeTakenMs: 1, createdAt: 1 },
  { questionId: 'q1', selectedAnswer: 'A', timeTakenMs: 1, createdAt: 2 },
]).answers

describe('Provpass view builders', () => {
  it('preserves the least-exposed suggestion while ordering the register by sitting', () => {
    const view = buildHubView({
      half: 'verbal',
      mode: 'authentic',
      passes: [pass('var-2023'), pass('host-2025', 5)],
      picked: null,
    })
    expect(view.chosen?.examId).toBe('var-2023')
    expect(view.eyebrow).toBe('Föreslaget · minst sett')
    expect(view.sittings.map((s) => s.examId)).toEqual(['host-2025', 'var-2023'])
    expect(view.sittings[0].passes[0]?.totalExposure).toBe(10)
    expect(view.quota).toBe('40 frågor') // no invented per-section counts while the bank loads
    const kvant = buildHubView({ half: 'kvant', mode: 'synthetic', passes: [], picked: null })
    expect(kvant.quota).toBe('40 frågor · XYZ 12 · KVA 10 · NOG 6 · DTK 12')
    expect(kvant.note).toBe('Ingen poäng: det är inte normerat.')
  })
  it('maps the real 27-sitting corpus into year × term × pass without duplicating variants', () => {
    const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
    const index = read('../../../../public/data/_index.json') as { exams: { exam_id: string }[] }
    const corpus = index.exams.flatMap(({ exam_id }) =>
      read(`../../../../public/data/${exam_id}.json`),
    ) as Question[]
    const exposed = corpus.find((q) => q.exam_id === 'var-2026' && q.provpass === 'verb1')!
    const passes = listAuthenticPasses(corpus, { [exposed.qid]: { n: 3, last: 1 } })
    const view = buildHubView({
      half: 'verbal',
      mode: 'authentic',
      passes,
      picked: null,
      bank: corpus,
    })
    expect(view.sittings).toHaveLength(27)
    const cells = view.matrix.flatMap((r) => [r.spring, r.autumn])
    expect(cells.flatMap((c) => c.passes).filter(Boolean)).toHaveLength(54)
    expect(cells.filter((c) => c.status === 'cancelled')).toHaveLength(2)
    expect(view.matrix.filter((r) => r.year === 2022)).toHaveLength(2)
    expect(view.matrix.filter((r) => r.year === 2019)).toHaveLength(2)
    const ids = cells.flatMap((c) => (c.examId ? [c.examId] : []))
    expect(new Set(ids).size).toBe(27)
    expect(ids).toContain('var-2018-1')
    expect(view.sections.reduce((n, s) => n + s.count, 0)).toBe(view.chosen?.presented)
  })
  it('uses actual available section counts and never labels missing data as cancelled', () => {
    const passes = listAuthenticPasses(bank, {})
    const view = buildHubView({ half: 'verbal', mode: 'authentic', passes, picked: null, bank })
    expect(view.sections).toEqual([
      { section: 'ORD', count: 1 },
      { section: 'LÄS', count: 1 },
    ])
    expect(view.quota).toBe('2 frågor · ORD 1 · LÄS 1')
    expect(view.matrix[0].autumn.status).toBe('unavailable')
    expect(view.short).toMatchObject({
      count: 10,
      minutes: 3,
      href: '/drill?section=ORD&timed=1&start=1',
    })
  })
  it('uses the official table only for authentic passes and explains both score bases', () => {
    const table: NormeringSitting = {
      exam_id: 'var-2024',
      source_url: '',
      verbal: { source_pdf: '', bands: [], table: Array(81).fill(1.25) },
    }
    const view = buildResultView({ row, bank, answers, table })
    expect(view.score).toBe(1.25)
    expect(view.scoreLabel).toBe('normerat (härlett) · av 2,0')
    expect(view.footnote).toContain('80 frågor')
    const synthetic = buildResultView({ row: { ...row, mode: 'synthetic' }, bank, answers, table })
    expect(synthetic.score).toBe(1.9)
    expect(synthetic.footnote).toContain('Linjär skattning')
  })
  it('keeps actual misses, blanks, UHR order and neutral tempo distinct', () => {
    const view = buildResultView({ row, bank, answers })
    expect(view.missed).toEqual(['q0'])
    expect(view.blanks).toBe(1)
    expect(view.sections.map((s) => s.section)).toEqual(['ORD', 'LÄS'])
    expect(view.sections[0].uhrMs).toBe(3 * 60_000)
    expect(view.sections[0].note).toBe('i takt')
    expect(view.sections[1].note).toBe('1 min mindre än UHR:s tid')
    expect(view.pattern?.section).toBe('ORD') // LÄS's missing answer is not an answered mistake
  })
  it('shows only matching, answered-right flags and chooses trap before section', () => {
    const flags = { resultId: 5, flagged: ['q0', 'q1', 'missing', 'q1'] }
    expect(buildResultView({ row, bank, answers, flags }).flaggedRight).toEqual(['q1'])
    expect(
      buildResultView({ row, bank, answers, flags: { ...flags, resultId: 6 } }).flaggedRight,
    ).toEqual([])
    expect(buildResultView({ row, bank, answers }).flaggedRight).toEqual([])
    const cluster = { framework_id: 'ORD-X', section: 'ORD' as const, count: 2, headline: 'Fällan' }
    expect(
      buildResultView({ row, bank, answers, cluster, frameworkName: 'Betydelsen' }).pattern,
    ).toMatchObject({
      title: 'Återkommande fälla',
      name: 'Betydelsen',
      href: '/drill?section=ORD&framework=ORD-X&start=1',
    })
  })
  it('keeps a zero-time answered section distinct from an unvisited section', () => {
    const view = buildResultView({
      row: {
        ...row,
        breakdown: {
          ...row.breakdown,
          perSection: {
            ORD: { presented: 10, correct: 0, timeMs: 0 },
            MEK: { presented: 10, correct: 0, timeMs: 0 },
            LÄS: { presented: 10, correct: 1, timeMs: 0 },
            ELF: { presented: 10, correct: 0, timeMs: 1000 },
          },
        },
      },
      bank,
      answers,
    })
    expect(view.sections.find((s) => s.section === 'MEK')?.note).toBe('—')
    for (const section of ['ORD', 'LÄS', 'ELF'])
      expect(view.sections.find((s) => s.section === section)?.note).not.toBe('—')
  })
  it('filters history, preserves P5 disclosure and offers a new pass without misses', () => {
    const basis = {
      authentic: 39,
      synthetic: 1,
      unknown: 0,
      unclassified: 0,
      calibrated: false,
      perSection: {},
    }
    const view = buildResultView({
      row: { ...row, estimateBasis: basis },
      bank,
      answers,
      history: [row, { ...row, id: 6 }, { ...row, id: 7, half: 'kvant' }],
    })
    expect(view.caveat).toContain('ännu inte är kalibrerad')
    expect(view.history.map((r) => r.id)).toEqual([6])
    expect(view.primaryHref).toBe('/repetition')
    expect(
      buildResultView({
        row: { ...row, breakdown: { ...row.breakdown, missedQids: [] } },
        bank,
        answers,
      }).primaryHref,
    ).toBe('/prov')
  })
})
