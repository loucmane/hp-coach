// The stored Provpass result and what it rests on (lib/mockScore.ts) — P5
// infold PR 3, review fix hpf-0jyp:
//   B1 — an unknown question never feeds the stored result;
//   B2 — calibrated / estimateBasis come from the server's classification of
//        the session's actual questions and attempts, never from the plan
//        alone; anything synthetic or unclassifiable makes it uncalibrated.
// LJ-15 — breakdown version 2 (a row per question, and the marks) changes no
// number, fits its plan to be stored as it came, and is rebuilt from the
// attempts when the server scores the pass itself.

import { describe, expect, it } from 'vitest'

import {
  AnyMockBreakdownSchema,
  type MockBreakdown,
  MockBreakdownSchema,
  type MockBreakdownV2,
  type ReportedMockSummary,
  type ScoredMockResult,
  type SessionAttempt,
  scoreMockResult,
} from './mockScore'
import { classifyAttemptSource } from './provenance'

const ORD_1 = 'var-2024-verb1-ORD-001'
const ORD_2 = 'var-2024-verb1-ORD-002'
const ORD_3 = 'var-2024-verb1-ORD-003'
const ORD_4 = 'var-2024-verb1-ORD-004'
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

/** One stored attempt, its source classified as POST /api/attempts stores it,
 *  and the dwell it was stored with (a Provpass answer carries its question's
 *  dwell so far). */
function answer(
  questionId: string,
  correct: boolean,
  timeTakenMs: number | null = null,
): SessionAttempt {
  return {
    questionId,
    selectedAnswer: correct ? 'A' : 'B',
    correct,
    source: classifyAttemptSource(questionId),
    timeTakenMs,
  }
}

/** What app/src/lib/mock.ts computeMockSummary posts for `plan`, given the
 *  final pick per question (absent = blank) and a dwell per question. */
function clientSummary(
  plan: readonly { qid: string; section: string }[],
  picks: Record<string, boolean>,
  seenBefore = 0,
  dwellMs = 1000,
): ReportedMockSummary & { breakdown: MockBreakdown } {
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

// LJ-15 (rebuild map §2): breakdown version 2 adds what the Provresultat
// screen draws per question, a row with its outcome and time, and the
// questions marked with Markera, a pass's only uncertainty signal. Version 1
// is stored and scored exactly as before, and version 2 changes no number.
describe('LJ-15 — breakdown version 2', () => {
  /** The version 2 summary a client posts for the same pass: version 1 plus a
   *  row per planned question, in the pass's order (a blank's outcome is
   *  null), and the questions it marked. A question's time is 1000 ms unless
   *  `times` names it, and each section's time sums its questions'. */
  function clientSummaryV2(
    plan: readonly { qid: string; section: string }[],
    picks: Record<string, boolean>,
    { flagged = [], times = {} }: { flagged?: string[]; times?: Record<string, number> } = {},
  ): ReportedMockSummary & { breakdown: MockBreakdownV2 } {
    const { breakdown, ...totals } = clientSummary(plan, picks, 0, 0)
    const perQuestion = plan.map(({ qid, section }) => {
      const timeMs = times[qid] ?? 1000
      breakdown.perSection[section].timeMs += timeMs
      return { qid, correct: qid in picks ? picks[qid] : null, timeMs }
    })
    return {
      ...totals,
      breakdown: { ...breakdown, perQuestion, flaggedQids: flagged, version: 2 },
    }
  }

  /** A result's version 2 breakdown; throws on version 1. */
  function v2Of(scored: ScoredMockResult): MockBreakdownV2 {
    if (scored.breakdown.version !== 2) throw new Error('not a version 2 breakdown')
    return scored.breakdown
  }

  /** What a result counts, without the rows and marks version 2 adds. */
  function numbersOf({ breakdown, ...totals }: ScoredMockResult) {
    return { ...totals, perSection: breakdown.perSection, missedQids: breakdown.missedQids }
  }

  // Each pass as the server holds it (its stored plan and the attempts it
  // stored) and as the client reports it (its plan and final picks).
  const PASSES: {
    label: string
    plan: string[] | null
    attempts: SessionAttempt[]
    clientPlan: { qid: string; section: string }[]
    picks: Record<string, boolean>
  }[] = [
    {
      label: 'an authentic pass, stored as it came',
      plan: [ORD_1, ORD_2, MEK_21],
      attempts: [answer(ORD_1, true, 4000), answer(ORD_2, false, 6000)],
      clientPlan: [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(MEK_21, 'MEK')],
      picks: { [ORD_1]: true, [ORD_2]: false },
    },
    {
      label: 'a pass with P5 questions, stored as it came',
      plan: [ORD_1, LAS_P5, LAS_P5_2, ELF_P5],
      attempts: [answer(ORD_1, true, 4000), answer(LAS_P5, true, 9000), answer(LAS_P5_2, false)],
      clientPlan: [q(ORD_1, 'ORD'), q(LAS_P5, 'LÄS'), q(LAS_P5_2, 'LÄS'), q(ELF_P5, 'ELF')],
      picks: { [ORD_1]: true, [LAS_P5]: true, [LAS_P5_2]: false },
    },
    {
      label: 'a pass with an answer that never reached the server, stored as it came',
      plan: [ORD_1, ORD_2],
      attempts: [answer(ORD_1, true, 4000)],
      clientPlan: [q(ORD_1, 'ORD'), q(ORD_2, 'ORD')],
      picks: { [ORD_1]: true, [ORD_2]: true },
    },
    {
      label: 'a pass with an unknown question, rescored',
      plan: [ORD_1, ORD_2, REVOKED],
      attempts: [answer(ORD_1, true, 4000), answer(ORD_2, false, 6000), answer(REVOKED, true)],
      clientPlan: [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(REVOKED, 'LÄS')],
      picks: { [ORD_1]: true, [ORD_2]: false, [REVOKED]: true },
    },
    {
      label: 'a pass without a stored plan, rescored',
      plan: null,
      attempts: [answer(ORD_1, true, 4000), answer(LAS_P5, false, 9000)],
      clientPlan: [q(ORD_1, 'ORD'), q(LAS_P5, 'LÄS'), q(MEK_21, 'MEK')],
      picks: { [ORD_1]: true, [LAS_P5]: false },
    },
    {
      label: 'a summary larger than its plan, rescored',
      plan: [ORD_1, ORD_2],
      attempts: [answer(ORD_1, true, 4000), answer(ORD_2, true, 5000)],
      clientPlan: [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(LAS_P5, 'LÄS')],
      picks: { [ORD_1]: true, [ORD_2]: true, [LAS_P5]: true },
    },
  ]

  it.each(PASSES)('changes no number: $label', ({ plan, attempts, clientPlan, picks }) => {
    const v1 = scoreMockResult(plan, attempts, clientSummary(clientPlan, picks))
    const v2 = scoreMockResult(plan, attempts, clientSummaryV2(clientPlan, picks))
    expect(numbersOf(v2)).toEqual(numbersOf(v1))
    // Version 1 stays version 1, as it came or rescored.
    expect(v1.breakdown).toEqual({
      perSection: v1.breakdown.perSection,
      missedQids: v1.breakdown.missedQids,
      version: 1,
    })
    expect(v2Of(v2).version).toBe(2)
  })

  it.each(PASSES)('its rows count what the result counts: $label', (pass) => {
    const { plan, attempts, clientPlan, picks } = pass
    const scored = scoreMockResult(plan, attempts, clientSummaryV2(clientPlan, picks))
    const rows = v2Of(scored).perQuestion
    expect(rows).toHaveLength(scored.presented)
    expect(rows.filter((row) => row.correct !== null)).toHaveLength(scored.answered)
    expect(rows.filter((row) => row.correct === true)).toHaveLength(scored.correct)
    expect(rows.filter((row) => row.correct === false).map((row) => row.qid)).toEqual(
      scored.breakdown.missedQids,
    )
  })

  it('a version 2 summary that fits its plan is stored as it came, rows and marks too', () => {
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(MEK_21, 'MEK')]
    const reported = clientSummaryV2(
      plan,
      { [ORD_1]: true, [ORD_2]: false },
      {
        flagged: [MEK_21, ORD_1],
        times: { [ORD_1]: 12_000, [ORD_2]: 48_000, [MEK_21]: 30_000 },
      },
    )
    const scored = scoreMockResult(
      plan.map((p) => p.qid),
      [answer(ORD_1, true, 9000), answer(ORD_2, false, 40_000)],
      reported,
    )
    expect(scored.breakdown).toBe(reported.breakdown)
    expect(scored.breakdown).toEqual({
      perSection: {
        ORD: { presented: 2, correct: 1, timeMs: 60_000 },
        MEK: { presented: 1, correct: 0, timeMs: 30_000 },
      },
      missedQids: [ORD_2],
      perQuestion: [
        { qid: ORD_1, correct: true, timeMs: 12_000 },
        { qid: ORD_2, correct: false, timeMs: 48_000 },
        { qid: MEK_21, correct: null, timeMs: 30_000 },
      ],
      flaggedQids: [MEK_21, ORD_1],
      version: 2,
    })
  })

  // A version 2 summary is stored as it came only when its rows and marks fit
  // its plan. Each change below breaks one rule, so the server scores the pass
  // itself: the rows are rebuilt from the attempts, and the marks are kept
  // where they name a question in the result.
  describe('rows or marks that do not fit the plan: the server rescores', () => {
    const PLAN = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(ORD_3, 'ORD'), q(MEK_21, 'MEK')]
    const PICKS = { [ORD_1]: true, [ORD_2]: false, [ORD_3]: false }
    const ATTEMPTS = [
      answer(ORD_1, true, 11_000),
      answer(ORD_2, false, 22_000),
      answer(ORD_3, false, 33_000),
    ]
    const fitting = () => clientSummaryV2(PLAN, PICKS, { flagged: [MEK_21] })
    const row = (qid: string, correct: boolean | null, timeMs = 1000) => ({ qid, correct, timeMs })
    const [r0, r1, r2, r3] = fitting().breakdown.perQuestion

    function expectRescored(reported: ReportedMockSummary) {
      const scored = scoreMockResult(
        PLAN.map((p) => p.qid),
        ATTEMPTS,
        reported,
      )
      expect(scored.breakdown).not.toBe(reported.breakdown)
      expect(scored).toMatchObject({ presented: 4, answered: 3, correct: 1 })
      expect(v2Of(scored)).toMatchObject({
        missedQids: [ORD_2, ORD_3],
        perQuestion: [
          row(ORD_1, true, 11_000),
          row(ORD_2, false, 22_000),
          row(ORD_3, false, 33_000),
          row(MEK_21, null, 0),
        ],
        flaggedQids: [MEK_21],
      })
    }

    it('as posted, it fits: stored as it came', () => {
      const reported = fitting()
      expect(
        scoreMockResult(
          PLAN.map((p) => p.qid),
          ATTEMPTS,
          reported,
        ).breakdown,
      ).toBe(reported.breakdown)
    })

    it.each<[string, Partial<MockBreakdownV2>]>([
      ['a row for a question outside the plan', { perQuestion: [row(ORD_4, true), r1, r2, r3] }],
      ['an extra row', { perQuestion: [r0, r1, r2, r3, row(ORD_4, null)] }],
      ['a planned question without a row', { perQuestion: [r0, r1, r2] }],
      ['a planned question twice', { perQuestion: [r0, r1, r1, r3] }],
      ['rows out of the pass’s order', { perQuestion: [r3, r1, r2, r0] }],
      ['a negative time', { perQuestion: [{ ...r0, timeMs: -1 }, r1, r2, r3] }],
      ['a time that is not whole ms', { perQuestion: [{ ...r0, timeMs: 1.5 }, r1, r2, r3] }],
      [
        'a right answer in another section than the summary has it',
        { perQuestion: [{ ...r0, correct: null }, r1, r2, { ...r3, correct: true }] },
      ],
      ['missedQids that are not the wrong rows', { missedQids: [ORD_2] }],
      ['missedQids out of the pass’s order', { missedQids: [ORD_3, ORD_2] }],
      ['a mark on a question outside the plan', { flaggedQids: [MEK_21, ORD_4] }],
      ['a question marked twice', { flaggedQids: [MEK_21, MEK_21] }],
    ])('%s', (_label, change) => {
      const { breakdown, ...totals } = fitting()
      expectRescored({ ...totals, breakdown: { ...breakdown, ...change } })
    })

    it('totals that count an answer its rows leave blank', () => {
      expectRescored({ ...fitting(), answered: 4 })
    })

    it('rows for a question its totals leave out', () => {
      // It presents the three ORD questions, yet sends a row for MEK too.
      const { breakdown, ...totals } = clientSummaryV2(PLAN.slice(0, 3), PICKS, {
        flagged: [MEK_21],
      })
      expectRescored({
        ...totals,
        breakdown: { ...breakdown, perQuestion: [...breakdown.perQuestion, row(MEK_21, null)] },
      })
    })
  })

  it('rescoring rebuilds the rows from the attempts: each last answer and its time', () => {
    // REVOKED is unknown, so the server scores this pass itself.
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(MEK_21, 'MEK'), q(REVOKED, 'LÄS')]
    const reported = clientSummaryV2(
      plan,
      { [ORD_1]: true, [ORD_2]: false, [REVOKED]: true },
      {
        flagged: [REVOKED, MEK_21],
        times: { [ORD_1]: 25_000, [ORD_2]: 31_000, [MEK_21]: 12_000, [REVOKED]: 6000 },
      },
    )
    const scored = scoreMockResult(
      plan.map((p) => p.qid),
      [
        // ORD_1 was answered at 8 s and changed at 19 s. Each answer carries
        // its question's dwell so far, so the last one holds the time.
        answer(ORD_1, false, 8000),
        answer(ORD_2, false, 30_000),
        answer(ORD_1, true, 19_000),
        answer(REVOKED, true, 5000),
      ],
      reported,
    )
    expect(scored).toMatchObject({ presented: 3, answered: 2, correct: 1 })
    expect(scored.breakdown).toEqual({
      // Each section's time stays the reported dwell, as in version 1.
      perSection: {
        ORD: { presented: 2, correct: 1, timeMs: 56_000 },
        MEK: { presented: 1, correct: 0, timeMs: 12_000 },
      },
      missedQids: [ORD_2],
      // Not the client's rows: the blank has no answer and no time, and the
      // unknown question has no row.
      perQuestion: [
        { qid: ORD_1, correct: true, timeMs: 19_000 },
        { qid: ORD_2, correct: false, timeMs: 30_000 },
        { qid: MEK_21, correct: null, timeMs: 0 },
      ],
      // Only the marks on a question in the result.
      flaggedQids: [MEK_21],
      version: 2,
    })
  })

  it('rescoring counts no time for an answer stored without one', () => {
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD'), q(REVOKED, 'LÄS')]
    const reported = clientSummaryV2(plan, { [ORD_1]: true, [ORD_2]: true, [REVOKED]: true })
    // ORD_2's attempt as routes/export.ts builds one, with no time at all.
    const untimed: SessionAttempt = {
      questionId: ORD_2,
      selectedAnswer: 'A',
      correct: true,
      source: classifyAttemptSource(ORD_2),
    }
    const scored = scoreMockResult(
      plan.map((p) => p.qid),
      [answer(ORD_1, true), untimed, answer(REVOKED, true, 4000)],
      reported,
    )
    expect(v2Of(scored).perQuestion).toEqual([
      { qid: ORD_1, correct: true, timeMs: 0 },
      { qid: ORD_2, correct: true, timeMs: 0 },
    ])
  })

  describe('the breakdown schemas', () => {
    const plan = [q(ORD_1, 'ORD'), q(ORD_2, 'ORD')]
    const v1 = clientSummary(plan, { [ORD_1]: true }).breakdown
    const v2 = clientSummaryV2(plan, { [ORD_1]: true }, { flagged: [ORD_2] }).breakdown
    const [first, second] = v2.perQuestion

    it('POST /api/mock-results takes either version', () => {
      expect(AnyMockBreakdownSchema.parse(v1)).toEqual(v1)
      expect(AnyMockBreakdownSchema.parse(v2)).toEqual(v2)
    })

    it.each([
      ['a negative time', { ...v2, perQuestion: [{ ...first, timeMs: -1 }, second] }],
      ['a time that is not whole ms', { ...v2, perQuestion: [{ ...first, timeMs: 0.5 }, second] }],
      [
        'an outcome that is not true, false or null',
        { ...v2, perQuestion: [{ ...first, correct: 'A' }, second] },
      ],
      [
        'a row field it does not know',
        { ...v2, perQuestion: [{ ...first, flagged: true }, second] },
      ],
      [
        'no marks',
        {
          perSection: v2.perSection,
          missedQids: v2.missedQids,
          perQuestion: v2.perQuestion,
          version: 2,
        },
      ],
      ['rows on a version 1 breakdown', { ...v2, version: 1 }],
      ['a version it does not know', { ...v2, version: 3 }],
    ])('rejects %s', (_label, breakdown) => {
      expect(AnyMockBreakdownSchema.safeParse(breakdown).success).toBe(false)
    })

    it('version 1 alone, which routes/export.ts reads imported rows with, never reads version 2', () => {
      expect(MockBreakdownSchema.safeParse(v1).success).toBe(true)
      expect(MockBreakdownSchema.safeParse(v2).success).toBe(false)
    })
  })
})
