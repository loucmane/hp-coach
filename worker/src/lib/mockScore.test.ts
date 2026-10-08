// The stored Provpass result and what it rests on (lib/mockScore.ts) — P5
// infold PR 3, review fix hpf-0jyp:
//   B1 — an unknown question never feeds the stored result;
//   B2 — calibrated / estimateBasis come from the server's classification of
//        the session's actual questions and attempts, never from the plan
//        alone; anything synthetic or unclassifiable makes it uncalibrated.

import { describe, expect, it } from 'vitest'

import {
  type MockBreakdown,
  type ReportedMockSummary,
  type SessionAttempt,
  scoreMockResult,
} from './mockScore'
import { classifyAttemptSource } from './provenance'

const ORD_1 = 'var-2024-verb1-ORD-001'
const ORD_2 = 'var-2024-verb1-ORD-002'
const MEK_21 = 'var-2024-verb1-MEK-021'
const LAS_P5 = 'p5-las-b19-002-r1-LÄS-001'
const LAS_P5_2 = 'p5-las-b19-002-r1-LÄS-002'
const ELF_P5 = 'p5-elf-b19-003-r1-ELF-001'
// Unknown, whatever their shape suggests: a revised-away P5 revision, a
// retired P5 unit, a bank-shaped qid the bank does not hold, a seed id.
const REVOKED = 'p5-las-b7-002-r1-LÄS-001'
const RETIRED = 'p5-elf-b14-002-r1-ELF-001'
const FABRICATED = 'var-2024-verb1-ORD-015'
const SEED = 'q1'

/** One stored attempt, its source classified as POST /api/attempts stores it. */
function answer(questionId: string, correct: boolean): SessionAttempt {
  return {
    questionId,
    selectedAnswer: correct ? 'A' : 'B',
    correct,
    source: classifyAttemptSource(questionId),
  }
}

/** What app/src/lib/mock.ts computeMockSummary posts for `plan`, given the
 *  final pick per question (absent = blank) and a dwell per question. */
function clientSummary(
  plan: readonly { qid: string; section: string }[],
  picks: Record<string, boolean>,
  seenBefore = 0,
  dwellMs = 1000,
): ReportedMockSummary {
  const perSection: MockBreakdown['perSection'] = {}
  const missedQids: string[] = []
  let answered = 0
  let correct = 0
  for (const q of plan) {
    perSection[q.section] ??= { presented: 0, correct: 0, timeMs: 0 }
    const row = perSection[q.section]
    row.presented += 1
    row.timeMs += dwellMs
    if (!(q.qid in picks)) continue
    answered += 1
    if (picks[q.qid]) {
      correct += 1
      row.correct += 1
    } else missedQids.push(q.qid)
  }
  return {
    presented: plan.length,
    answered,
    correct,
    seenBefore,
    breakdown: { perSection, missedQids, version: 1 },
  }
}

const q = (qid: string, section: string) => ({ qid, section })

describe('a pass of authentic and synthetic questions — the client summary as it came', () => {
  it('an authentic pass is stored exactly as reported, and calibrated', () => {
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(MEK_21, 'MEK')]
    const picks = { [ORD_1]: true, [ORD_2]: false }
    const reported = clientSummary(plan, picks, 1)
    const scored = scoreMockResult(
      plan.map((p) => p.qid),
      [answer(ORD_1, true), answer(ORD_2, false)],
      reported,
    )
    expect(scored).toEqual({
      ...reported,
      estimateBasis: {
        authentic: 3,
        synthetic: 0,
        unknown: 0,
        unclassified: 0,
        calibrated: true,
        perSection: {
          ORD: { authentic: 2, synthetic: 0, unknown: 0, calibrated: true },
          MEK: { authentic: 1, synthetic: 0, unknown: 0, calibrated: true },
        },
      },
    })
    // The stored breakdown is the very object that was posted.
    expect(scored.breakdown).toBe(reported.breakdown)
  })

  it('keeps the reported summary when an answer never reached the server (no rescoring)', () => {
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD')]
    const reported = clientSummary(plan, { [ORD_1]: true, [ORD_2]: true })
    // ORD_2's attempt was lost in flight: the summary still fits the plan.
    expect(scoreMockResult([ORD_1, ORD_2], [answer(ORD_1, true)], reported)).toMatchObject({
      presented: 2,
      answered: 2,
      correct: 2,
      estimateBasis: { authentic: 2, unknown: 0, unclassified: 0, calibrated: true },
    })
  })

  it('a pass with P5 questions counts them and is uncalibrated, overall and in their sections', () => {
    const plan = [q(ORD_1, 'ORD'), q(LAS_P5, 'LÄS'), q(LAS_P5_2, 'LÄS'), q(ELF_P5, 'ELF')]
    const picks = { [ORD_1]: true, [LAS_P5]: true, [LAS_P5_2]: false }
    const reported = clientSummary(plan, picks)
    const scored = scoreMockResult(
      plan.map((p) => p.qid),
      [answer(ORD_1, true), answer(LAS_P5, true), answer(LAS_P5_2, false)],
      reported,
    )
    expect(scored).toMatchObject({ presented: 4, answered: 3, correct: 2 })
    expect(scored.estimateBasis).toEqual({
      authentic: 1,
      synthetic: 3,
      unknown: 0,
      unclassified: 0,
      calibrated: false,
      perSection: {
        ORD: { authentic: 1, synthetic: 0, unknown: 0, calibrated: true },
        LÄS: { authentic: 0, synthetic: 2, unknown: 0, calibrated: false },
        ELF: { authentic: 0, synthetic: 1, unknown: 0, calibrated: false },
      },
    })
  })

  it('classifies an answered question by the source its attempt was stored with', () => {
    // A P5 answer stored synthetic stays synthetic in the result even if its
    // unit has since left the registry; a blank is classified now.
    const stale: SessionAttempt = { ...answer(REVOKED, true), source: 'synthetic' }
    const plan = [q(ORD_1, 'ORD'), q(REVOKED, 'LÄS')]
    const reported = clientSummary(plan, { [ORD_1]: true, [REVOKED]: true })
    const scored = scoreMockResult([ORD_1, REVOKED], [answer(ORD_1, true), stale], reported)
    expect(scored).toMatchObject({ presented: 2, correct: 2 })
    expect(scored.estimateBasis).toMatchObject({ authentic: 1, synthetic: 1, unknown: 0 })
    expect(scored.estimateBasis.calibrated).toBe(false)
  })
})

// Review finding B1 (hpf-aaqr): unknown questions still counted in Provpass
// scores. They must never feed the stored result; they stay in the record.
describe('B1 — an unknown question never feeds the stored result', () => {
  it.each([
    ['a revised-away P5 revision', REVOKED, 'LÄS'],
    ['a retired P5 unit', RETIRED, 'ELF'],
    ['a bank-shaped qid the bank does not hold', FABRICATED, 'ORD'],
  ])('answered correctly: %s', (_label, unknownQid, section) => {
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(unknownQid, section)]
    const picks = { [ORD_1]: true, [ORD_2]: false, [unknownQid]: true }
    const reported = clientSummary(plan, picks, 0, 2000)
    // The client counted it: 2 of 3 correct.
    expect(reported).toMatchObject({ presented: 3, answered: 3, correct: 2 })
    const scored = scoreMockResult(
      plan.map((p) => p.qid),
      [answer(ORD_1, true), answer(ORD_2, false), answer(unknownQid, true)],
      reported,
    )
    expect(scored).toMatchObject({ presented: 2, answered: 2, correct: 1, seenBefore: 0 })
    expect(scored.breakdown.missedQids).toEqual([ORD_2])
    expect(scored.breakdown.perSection.ORD).toMatchObject({ presented: 2, correct: 1 })
    if (section !== 'ORD') expect(scored.breakdown.perSection[section]).toBeUndefined()
    expect(scored.estimateBasis).toMatchObject({ authentic: 2, synthetic: 0, unknown: 1 })
    expect(scored.estimateBasis.perSection[section].unknown).toBe(1)
    // Left out of the result, an unknown question does not uncalibrate it.
    expect(scored.estimateBasis.calibrated).toBe(true)
  })

  it('answered wrongly: its miss is not stored, nor its question', () => {
    const plan = [q(ORD_1, 'ORD'), q(FABRICATED, 'ORD')]
    const reported = clientSummary(plan, { [ORD_1]: true, [FABRICATED]: false })
    const scored = scoreMockResult(
      [ORD_1, FABRICATED],
      [answer(ORD_1, true), answer(FABRICATED, false)],
      reported,
    )
    expect(scored).toMatchObject({ presented: 1, answered: 1, correct: 1 })
    expect(scored.breakdown).toEqual({
      perSection: { ORD: { presented: 1, correct: 1, timeMs: 2000 } },
      missedQids: [],
      version: 1,
    })
  })

  it('left blank: it is not presented in the stored result', () => {
    const plan = [q(ORD_1, 'ORD'), q(RETIRED, 'ELF')]
    const reported = clientSummary(plan, { [ORD_1]: false })
    const scored = scoreMockResult([ORD_1, RETIRED], [answer(ORD_1, false)], reported)
    expect(scored).toMatchObject({ presented: 1, answered: 1, correct: 0 })
    expect(scored.breakdown.missedQids).toEqual([ORD_1])
    expect(Object.keys(scored.breakdown.perSection)).toEqual(['ORD'])
  })

  it('answered outside the plan: it never counts, and a sectionless qid neither', () => {
    const plan = [q(ORD_1, 'ORD')]
    const reported = clientSummary(plan, { [ORD_1]: true })
    const scored = scoreMockResult(
      [ORD_1],
      [answer(SEED, true), answer(ORD_1, true), answer(FABRICATED, true)],
      reported,
    )
    expect(scored).toMatchObject({ presented: 1, answered: 1, correct: 1 })
    expect(scored.estimateBasis).toMatchObject({ authentic: 1, unknown: 2, calibrated: true })
    // q1 has no section: it counts overall only.
    expect(scored.estimateBasis.perSection).toEqual({
      ORD: { authentic: 1, synthetic: 0, unknown: 1, calibrated: true },
    })
  })

  it('an attempt stored unknown is unknown, even on a bank question', () => {
    // An answer the pre-migration worker wrote and the backfill has not reached.
    const stale: SessionAttempt = { ...answer(ORD_2, true), source: 'unknown' }
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD')]
    const reported = clientSummary(plan, { [ORD_1]: true, [ORD_2]: true })
    const scored = scoreMockResult([ORD_1, ORD_2], [answer(ORD_1, true), stale], reported)
    expect(scored).toMatchObject({ presented: 1, answered: 1, correct: 1 })
    expect(scored.estimateBasis).toMatchObject({ authentic: 1, unknown: 1 })
  })

  it('keeps the reported dwell of a scored section and caps seenBefore at presented', () => {
    const plan = [q(ORD_1, 'ORD'), q(REVOKED, 'LÄS'), q(RETIRED, 'ELF')]
    const reported = clientSummary(plan, { [ORD_1]: true }, 3, 5000)
    const scored = scoreMockResult(
      plan.map((p) => p.qid),
      [answer(ORD_1, true)],
      reported,
    )
    expect(scored.breakdown.perSection).toEqual({
      ORD: { presented: 1, correct: 1, timeMs: 5000 },
    })
    expect(scored.seenBefore).toBe(1)
  })
})

// Review finding B2 (hpf-aaqr): a missing or inconsistent session plan let a
// P5 Provpass be marked calibrated.
describe('B2 — calibrated only when nothing synthetic or unclassifiable is in the result', () => {
  it('no stored plan: the P5 answers the session stored make it uncalibrated', () => {
    const plan = [q(ORD_1, 'ORD'), q(LAS_P5, 'LÄS'), q(ELF_P5, 'ELF')]
    const reported = clientSummary(plan, { [ORD_1]: true, [LAS_P5]: true, [ELF_P5]: false })
    const scored = scoreMockResult(
      null,
      [answer(ORD_1, true), answer(LAS_P5, true), answer(ELF_P5, false)],
      reported,
    )
    expect(scored).toMatchObject({ presented: 3, answered: 3, correct: 2 })
    expect(scored.estimateBasis).toMatchObject({
      authentic: 1,
      synthetic: 2,
      unknown: 0,
      unclassified: 0,
      calibrated: false,
    })
  })

  it('no stored plan: blanks the server cannot identify are unclassified, never scored', () => {
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(MEK_21, 'MEK')]
    // Two blanks the server never saw.
    const reported = clientSummary(plan, { [ORD_1]: true })
    const scored = scoreMockResult(null, [answer(ORD_1, true)], reported)
    expect(scored).toMatchObject({ presented: 1, answered: 1, correct: 1 })
    expect(scored.estimateBasis).toMatchObject({
      authentic: 1,
      synthetic: 0,
      unknown: 0,
      unclassified: 2,
      calibrated: false,
    })
  })

  it('no stored plan and no attempt: nothing is scored and nothing is calibrated', () => {
    const reported = clientSummary([q(ORD_1, 'ORD'), q(ORD_2, 'ORD')], {})
    const scored = scoreMockResult(null, [], reported)
    expect(scored).toMatchObject({ presented: 0, answered: 0, correct: 0, seenBefore: 0 })
    expect(scored.breakdown).toEqual({ perSection: {}, missedQids: [], version: 1 })
    expect(scored.estimateBasis).toMatchObject({ unclassified: 2, calibrated: false })
  })

  it('an authentic plan with P5 answers outside it: the answers count, uncalibrated', () => {
    // The client claims the P5 answers on top of the plan it stored.
    const claimed = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(LAS_P5, 'LÄS'), q(LAS_P5_2, 'LÄS')]
    const reported = clientSummary(claimed, {
      [ORD_1]: true,
      [ORD_2]: true,
      [LAS_P5]: true,
      [LAS_P5_2]: true,
    })
    const scored = scoreMockResult(
      [ORD_1, ORD_2],
      [answer(ORD_1, true), answer(ORD_2, true), answer(LAS_P5, true), answer(LAS_P5_2, true)],
      reported,
    )
    expect(scored).toMatchObject({ presented: 4, answered: 4, correct: 4 })
    expect(scored.estimateBasis).toMatchObject({
      authentic: 2,
      synthetic: 2,
      unclassified: 0,
      calibrated: false,
    })
  })

  it('an authentic plan and a summary larger than it: the excess is unclassified', () => {
    const claimed = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(LAS_P5, 'LÄS')]
    const reported = clientSummary(claimed, { [ORD_1]: true, [ORD_2]: true, [LAS_P5]: true })
    const scored = scoreMockResult(
      [ORD_1, ORD_2],
      [answer(ORD_1, true), answer(ORD_2, true)],
      reported,
    )
    expect(scored).toMatchObject({ presented: 2, answered: 2, correct: 2 })
    expect(scored.estimateBasis).toMatchObject({
      authentic: 2,
      synthetic: 0,
      unclassified: 1,
      calibrated: false,
    })
  })

  it.each([
    ['a section the plan does not hold', { LÄS: { presented: 1, correct: 1, timeMs: 0 } }, 1, []],
    [
      'more of a section than the plan holds',
      { ORD: { presented: 2, correct: 2, timeMs: 0 } },
      2,
      [],
    ],
    ['rows that do not sum to the totals', { ORD: { presented: 1, correct: 0, timeMs: 0 } }, 1, []],
    [
      'a missed qid outside the plan',
      { ORD: { presented: 1, correct: 1, timeMs: 0 } },
      1,
      [LAS_P5],
    ],
  ] as const)('a summary that does not fit its plan is rescored: %s', (_label, perSection, presented, missed) => {
    const reported: ReportedMockSummary = {
      presented,
      answered: presented,
      correct: presented,
      seenBefore: 0,
      breakdown: { perSection: { ...perSection }, missedQids: [...missed], version: 1 },
    }
    const scored = scoreMockResult([ORD_1], [answer(ORD_1, false)], reported)
    // The server's own record: one ORD question, answered wrongly.
    expect(scored).toMatchObject({ presented: 1, answered: 1, correct: 0 })
    expect(scored.breakdown.missedQids).toEqual([ORD_1])
    expect(scored.estimateBasis).toMatchObject({ authentic: 1, synthetic: 0, unknown: 0 })
  })

  it('an unreadable breakdown is never stored; the server rescores', () => {
    const scored = scoreMockResult([ORD_1, ORD_2], [answer(ORD_1, true)], {
      presented: 2,
      answered: 1,
      correct: 1,
      seenBefore: 0,
      breakdown: null,
    })
    expect(scored).toMatchObject({ presented: 2, answered: 1, correct: 1 })
    expect(scored.breakdown).toEqual({
      perSection: { ORD: { presented: 2, correct: 1, timeMs: 0 } },
      missedQids: [],
      version: 1,
    })
    expect(scored.estimateBasis.calibrated).toBe(true)
  })

  it('rescoring counts the last stored answer to each question', () => {
    const reported = clientSummary([q(ORD_1, 'ORD')], { [ORD_1]: true })
    const scored = scoreMockResult(
      null,
      [answer(ORD_1, false), answer(ORD_1, true), answer(ORD_1, false)],
      reported,
    )
    expect(scored).toMatchObject({ presented: 1, answered: 1, correct: 0 })
    expect(scored.breakdown.missedQids).toEqual([ORD_1])
    expect(scored.estimateBasis).toMatchObject({ authentic: 1, unclassified: 0, calibrated: true })
  })
})
