import { describe, expect, it } from 'vitest'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import { buildHistorikView } from './historikView'

const pass = (
  id: number,
  endedAt: string | null,
  fields: Partial<SessionHistoryRow> = {},
): SessionHistoryRow => ({
  id,
  endedAt,
  kind: 'drill',
  sections: 'KVA',
  correct: 7,
  total: 10,
  ...fields,
})
const mock = (
  id: number,
  createdAt: MockResultRow['createdAt'],
  fields: Partial<MockResultRow> = {},
): MockResultRow => ({
  id,
  createdAt,
  userId: 1,
  sessionId: id,
  mode: 'authentic',
  half: 'verbal',
  examId: '2026v',
  provpass: '1',
  presented: 40,
  answered: 35,
  correct: 27,
  seenBefore: 0,
  durationMs: 3000,
  breakdown: { perSection: {}, missedQids: [], version: 1 },
  ...fields,
})

describe('Historik view', () => {
  it('groups by Monday with newest weeks and passes first without mutating input', () => {
    const rows = [
      pass(1, '2026-10-19T12:00:00'),
      pass(2, '2026-10-26T12:00:00'),
      pass(3, '2026-10-25T12:00:00'),
    ]
    const view = buildHistorikView(rows, [])
    expect(view.weeks.map((week) => week.label)).toEqual([
      'Vecka 44 · 26 oktober–1 november 2026',
      'Vecka 43 · 19–25 oktober 2026',
    ])
    expect(view.weeks.map((week) => week.rows.map((row) => row.id))).toEqual([[2], [3, 1]])
    expect(rows.map((row) => row.id)).toEqual([1, 2, 3])
  })
  it('keeps a cross-year ISO week together and distinguishes years', () => {
    const view = buildHistorikView(
      [
        pass(1, '2020-12-31T12:00:00'),
        pass(2, '2021-01-03T12:00:00'),
        pass(3, '2021-01-04T12:00:00'),
        pass(4, '2026-12-31T12:00:00'),
      ],
      [],
    )
    expect(view.weeks.map((week) => week.label)).toEqual([
      'Vecka 53 · 28 december 2026–3 januari 2027',
      'Vecka 1 · 4–10 januari 2021',
      'Vecka 53 · 28 december 2020–3 januari 2021',
    ])
    expect(view.weeks[2].rows.map((row) => row.id)).toEqual([2, 1])
  })
  it('uses passLabel, exact counts and only reconstructable practice destinations', () => {
    const view = buildHistorikView(
      [
        pass(1, '2026-10-20T12:00:00'),
        pass(2, '2026-10-19T12:00:00', { kind: 'adaptive_review', sections: null, correct: 0 }),
        pass(3, '2026-10-18T12:00:00', { kind: 'mock' }),
      ],
      [],
    )
    expect(view.weeks.flatMap((week) => week.rows)).toMatchObject([
      { id: 1, label: 'KVA', href: '/drill?done=1', score: '7 av 10', date: '20 okt. 2026' },
      { id: 2, label: 'Repetition', href: '/repetition?done=2', score: '0 av 10' },
    ])
  })
  it('preserves undated passes without inventing a date or a zero score', () => {
    const view = buildHistorikView(
      [pass(1, null, { total: 0, correct: 0 }), pass(2, 'invalid')],
      [],
    )
    expect(view.weeks).toHaveLength(1)
    expect(view.weeks[0].label).toBe('Datum saknas')
    expect(view.weeks[0].rows[0]).toMatchObject({ date: 'Datum saknas', score: '0 av 0' })
    expect(buildHistorikView([], [])).toEqual({ weeks: [], provpass: [] })
  })
  it('orders Provpass by date and uses presented rather than answered for the denominator', () => {
    const view = buildHistorikView(
      [],
      [
        mock(1, null),
        mock(2, new Date('2026-10-20T12:00:00').getTime()),
        mock(3, String(new Date('2026-10-21T12:00:00').getTime()), {
          mode: 'synthetic',
          half: 'kvant',
        }),
        mock(4, '2026-10-22T12:00:00'),
      ],
    )
    expect(view.provpass.map((row) => row.id)).toEqual([4, 3, 2, 1])
    expect(view.provpass[0]).toMatchObject({
      href: '/prov?result=4',
      score: '27 av 40',
      label: 'Verbal · tidigare prov',
    })
    expect(view.provpass[1].label).toBe('Kvant · blandat pass')
    expect(view.provpass[3].date).toBe('Datum saknas')
  })
})
