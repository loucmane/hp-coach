import { describe, expect, it } from 'vitest'
import { EXCLUDED_QUESTIONS } from '@/data/figureOverrides'
import type { Framework, ProtocolEntry } from '@/data/frameworks'
import { SECTION_KEYS } from '@/data/questions'
import { WORKED_EXAMPLE_QIDS } from '@/data/workedExamples.generated'
import type { SectionStats } from '@/lib/scoring'
import { buildUppslagView, nextUnread, readingMinutes, resolveEntry } from './uppslagView'

const entries: ProtocolEntry[] = ['A', 'B', 'C'].map((id) => ({
  id,
  question_type: `Typ ${id}`,
  attack_protocol: ['Läs texten.'],
  common_distractors: [],
  example_questions: [],
}))
const framework: Framework = {
  section: 'LÄS',
  family: 'las_taxonomy',
  version: 1,
  authored_at: '',
  entries,
}
const input = () => ({ catalogs: { LÄS: { data: framework } }, isRead: (id: string) => id === 'A' })
const sample = (correct: number): SectionStats => ({
  attempts90d: 20,
  correct90d: correct,
  attempts7d: 20,
  correct7d: correct,
  attempts7to14d: 0,
  correct7to14d: 0,
  attemptsToday: 0,
  avgTimeMs: null,
  lastAttemptedAt: Date.now(),
})

describe('Uppslag view', () => {
  it('keeps all eight chapters in exam order with stable numbers and two parts', () => {
    const view = buildUppslagView(input())
    expect(view.chapters.map((c) => c.section)).toEqual(SECTION_KEYS)
    expect(view.chapters.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(view.chapters.map((c) => c.half)).toEqual([
      'verbal',
      'verbal',
      'verbal',
      'verbal',
      'kvant',
      'kvant',
      'kvant',
      'kvant',
    ])
    expect(view.chapters[1]).toMatchObject({
      name: 'Svensk läsförståelse',
      readCount: 1,
      href: '/lektion?section=L%C3%84S#B',
    })
  })

  it('resolves hash, same-section bookmark, first unread, then first entry', () => {
    const read = (id: string) => id === 'A'
    expect(resolveEntry(framework, '#C', { section: 'LÄS', frameworkId: 'B' }, read)?.id).toBe('C')
    expect(resolveEntry(framework, 'unknown', { section: 'LÄS', frameworkId: 'C' }, read)?.id).toBe(
      'C',
    )
    expect(resolveEntry(framework, '', { section: 'ELF', frameworkId: 'C' }, read)?.id).toBe('B')
    expect(resolveEntry(framework, '', null, () => true)?.id).toBe('A')
    expect(resolveEntry({ ...framework, entries: [] }, '', null, read)).toBeNull()
    expect(resolveEntry(framework, '%ZZ', null, read)?.id).toBe('B')
  })

  it('finds the next unread entry with wrap and excludes the current entry', () => {
    expect(nextUnread(entries, 'C', (id) => id === 'B')?.id).toBe('A')
    expect(nextUnread(entries, 'C', (id) => id !== 'C')).toBeNull()
    expect(nextUnread(entries, 'A', () => true)).toBeNull()
  })

  it('filters held-out and excluded questions before exposing examples or practice', () => {
    const held = [...WORKED_EXAMPLE_QIDS][0]
    const excluded = [...EXCLUDED_QUESTIONS][0]
    const playable = 'host-2013-verb2-LÄS-020'
    const fw = {
      ...framework,
      entries: [{ ...entries[0], example_questions: [held, excluded, playable, playable] }],
    }
    const view = buildUppslagView({ ...input(), section: 'LÄS', catalogs: { LÄS: { data: fw } } })
    expect(view.open?.examples).toEqual([
      {
        qid: playable,
        label: 'Hösten 2013 · fråga 20',
        href: '/drill?qid=host-2013-verb2-L%C3%84S-020',
      },
    ])
    expect(view.open?.practiceHref).toBe('/drill?section=L%C3%84S&framework=A&start=1')
    const empty = buildUppslagView({ ...input(), section: 'LÄS' })
    expect(empty.open?.practiceHref).toBeNull()
  })

  it('counts nested prose at 200 words a minute, without counting ids and question ids', () => {
    expect(
      readingMinutes({
        ...entries[0],
        question_type: '',
        attack_protocol: ['ord '.repeat(400)],
        example_questions: ['qid '.repeat(500)],
      }),
    ).toBe(2)
    expect(
      readingMinutes({
        ...entries[0],
        question_type: '',
        attack_protocol: [],
        common_distractors: [{ pattern: '', why_it_traps: 'ord '.repeat(600) }],
      }),
    ).toBe(3)
    expect(readingMinutes(entries[0])).toBe(1)
  })

  it('constructs the chapter, direct-practice and conditional repetition links', () => {
    const view = buildUppslagView({
      ...input(),
      section: 'LÄS',
      dueCount: 2,
      trapSections: ['LÄS'],
    })
    expect(view.chapter?.practiceHref).toBe('/drill?section=L%C3%84S&start=1')
    expect(view.chapter?.weakHref).toBe('/drill?section=L%C3%84S&weak=1')
    expect(view.provteknikHref).toBe('/lektion?chapter=provteknik')
    expect(view.mixedHref).toBe('/drill?mixed=1&start=1')
    expect(view.repetitionHref).toBe('/repetition')
    expect(buildUppslagView(input()).repetitionHref).toBeNull()
    expect(view.chapter?.entries.map((e) => e.href)).toEqual(
      ['A', 'B', 'C'].map((id) => `/lektion?section=L%C3%84S#${id}`),
    )
  })

  it('picks Förslag from the shared ranking with zero, one and several scored sections', () => {
    expect(buildUppslagView(input()).suggested).toBeNull()
    expect(buildUppslagView({ ...input(), bySection: { KVA: sample(10) } }).suggested).toBe('KVA')
    expect(
      buildUppslagView({ ...input(), bySection: { KVA: sample(16), ORD: sample(5) } }).suggested,
    ).toBe('ORD')
  })

  it('distinguishes empty, pending and failed catalogs and never completes an empty chapter', () => {
    expect(
      buildUppslagView({ ...input(), section: 'ORD', catalogs: { ORD: { data: null } } }).chapter,
    ).toMatchObject({ state: 'empty', allRead: false })
    expect(
      buildUppslagView({ ...input(), section: 'ORD', catalogs: { ORD: { isError: true } } }).chapter
        ?.state,
    ).toBe('error')
    expect(buildUppslagView({ ...input(), section: 'ORD' }).chapter?.state).toBe('loading')
  })
})
