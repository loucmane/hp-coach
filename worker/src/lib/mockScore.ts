// The stored Provpass (mock exam) result — what the server keeps of a finished
// pass, and what it rests on. P5 infold PR 3 (docs/p5-infold-design.md
// Amendment 1 E), review fix hpf-0jyp (findings B1 and B2 of hpf-aaqr).
//
// The client summarises a finished pass (app/src/lib/mock.ts
// computeMockSummary) and posts it. The server stores that summary as it came
// only when it can attribute everything the summary may rest on to classified,
// assessed questions of the session:
//   · the session has a stored plan;
//   · every planned question is authentic or synthetic. An answered question
//     counts by the source its attempt was stored with (classified on the
//     server when it was answered, lib/provenance.ts); a blank one by its
//     classification now;
//   · every attempt of the session is on a planned question;
//   · the summary fits the plan. It counts no more questions than the plan
//     holds, overall or in any section, its per-section rows sum to its
//     totals, correct ≤ answered ≤ presented, seenBefore ≤ presented, and
//     every missed qid is planned.
// For a client that is working as intended, that is every pass whose
// questions are all authentic or synthetic, and the stored row is then exactly
// what it was before provenance.
//
// Otherwise the server scores the pass itself, from its own records: the
// session's plan and every attempt the session stored, the last answer per
// question counting. Only authentic and synthetic questions are scored.
//   · Unknown questions never feed the stored result (B1). They are counted in
//     its estimateBasis for the record, and they are left out of presented,
//     answered, correct, the per-section rows and missedQids.
//   · Each per-section timeMs stays the client's reported dwell. That is
//     practice effort, not assessment.
//   · seenBefore is capped at presented.
//
// estimateBasis comes from the same classification, never from the plan alone
// (B2):
//   · authentic / synthetic / unknown count the session's questions (planned
//     or answered) by source, overall and per section;
//   · `unclassified` counts the questions the client reported beyond every
//     question the server can identify. That happens for a pass without a
//     stored plan, or a summary larger than its plan.
// A result is calibrated only when nothing in it is synthetic or unclassified
// (fail closed). Unknown questions do not count against calibration because
// they are not in the result.

import { z } from 'zod'

import { type AttemptSource, classifyAttempt, isAssessedSource } from './provenance'
import { extractSection } from './section'

/** The per-pass breakdown blob, version 1 — the shape the client posts and
 *  mock_results.breakdown stores. */
export const MockBreakdownSchema = z
  .object({
    perSection: z.record(
      z.string(),
      z.object({
        presented: z.number().int().min(0),
        correct: z.number().int().min(0),
        timeMs: z.number().int().min(0),
      }),
    ),
    missedQids: z.array(z.string()),
    version: z.literal(1),
  })
  .strict()

export type MockBreakdown = z.infer<typeof MockBreakdownSchema>

/** A pass summary as the client (or an imported row) reports it. A breakdown
 *  that could not be read is null: the summary is then never stored as it
 *  came. */
export type ReportedMockSummary = {
  presented: number
  answered: number
  correct: number
  seenBefore: number
  breakdown: MockBreakdown | null
}

/** One stored attempt of the session, oldest first. */
export type SessionAttempt = {
  questionId: string
  selectedAnswer: string | null
  correct: boolean | null
  source: AttemptSource
}

/** One count of a result's questions by provenance. `calibrated` is false
 *  whenever a synthetic question is in it. */
export type MockBasisCounts = {
  authentic: number
  synthetic: number
  unknown: number
  calibrated: boolean
}

/** What a stored Provpass result rests on (mock_results.estimate_basis). */
export type MockEstimateBasis = MockBasisCounts & {
  /** Questions the client reported that the server could not identify. */
  unclassified: number
  perSection: Record<string, MockBasisCounts>
}

export type ScoredMockResult = {
  presented: number
  answered: number
  correct: number
  seenBefore: number
  breakdown: MockBreakdown
  estimateBasis: MockEstimateBasis
}

/**
 * The result the server stores for a finished pass: the reported summary when
 * the server can attribute it to classified, assessed questions of the
 * session, else the server's own score of the pass, with its estimate basis.
 */
export function scoreMockResult(
  plan: readonly string[] | null,
  attempts: readonly SessionAttempt[],
  reported: ReportedMockSummary,
): ScoredMockResult {
  // The last answer per question. A Map keeps each key's first position.
  const last = new Map<string, SessionAttempt>()
  for (const attempt of attempts) last.set(attempt.questionId, attempt)

  const planned = plan === null ? [] : [...new Set(plan)]
  const inPlan = new Set(planned)
  const unplanned = [...last.keys()].filter((qid) => !inPlan.has(qid))
  // Every question of the session the server knows of, planned first.
  const questions = [...planned, ...unplanned]
  const sourceOf = (qid: string): AttemptSource => {
    const source = last.get(qid)?.source ?? classifyAttempt(qid).source
    return isAssessedSource(source) ? source : 'unknown'
  }

  const unclassified = Math.max(0, reported.presented - questions.length)
  const estimateBasis = basisOf(questions, sourceOf, unclassified)

  const attributable =
    plan !== null &&
    unplanned.length === 0 &&
    estimateBasis.unknown === 0 &&
    fitsPlan(reported, planned)
  if (attributable && reported.breakdown !== null) {
    return {
      presented: reported.presented,
      answered: reported.answered,
      correct: reported.correct,
      seenBefore: reported.seenBefore,
      breakdown: reported.breakdown,
      estimateBasis,
    }
  }
  return { ...serverScore(questions, sourceOf, last, reported), estimateBasis }
}

/** Whether a reported summary can rest only on the planned questions. */
function fitsPlan(reported: ReportedMockSummary, planned: readonly string[]): boolean {
  const { presented, answered, correct, seenBefore, breakdown } = reported
  if (breakdown === null) return false
  if (!(correct >= 0 && correct <= answered && answered <= presented)) return false
  if (presented > planned.length || seenBefore < 0 || seenBefore > presented) return false
  const plannedBySection = new Map<string, number>()
  for (const qid of planned) {
    const section = extractSection(qid)
    if (section !== null) plannedBySection.set(section, (plannedBySection.get(section) ?? 0) + 1)
  }
  let sectionPresented = 0
  let sectionCorrect = 0
  for (const [section, row] of Object.entries(breakdown.perSection)) {
    if (row.correct > row.presented || row.presented > (plannedBySection.get(section) ?? 0)) {
      return false
    }
    sectionPresented += row.presented
    sectionCorrect += row.correct
  }
  if (sectionPresented !== presented || sectionCorrect !== correct) return false
  const inPlan = new Set(planned)
  return breakdown.missedQids.every((qid) => inPlan.has(qid))
}

/** The server's own score of the pass, over its authentic and synthetic
 *  questions, from the last stored answer to each. */
function serverScore(
  questions: readonly string[],
  sourceOf: (qid: string) => AttemptSource,
  last: ReadonlyMap<string, SessionAttempt>,
  reported: ReportedMockSummary,
): Omit<ScoredMockResult, 'estimateBasis'> {
  const perSection: MockBreakdown['perSection'] = {}
  const missedQids: string[] = []
  let presented = 0
  let answered = 0
  let correct = 0
  for (const qid of questions) {
    if (sourceOf(qid) === 'unknown') continue
    // Every bank and registry qid has a section; anything else is unscored.
    const section = extractSection(qid)
    if (section === null) continue
    presented += 1
    perSection[section] ??= {
      presented: 0,
      correct: 0,
      timeMs: reported.breakdown?.perSection[section]?.timeMs ?? 0,
    }
    const row = perSection[section]
    row.presented += 1
    const answer = last.get(qid)
    if (answer?.selectedAnswer == null) continue
    answered += 1
    if (answer.correct === true) {
      correct += 1
      row.correct += 1
    } else if (answer.correct === false) {
      missedQids.push(qid)
    }
  }
  return {
    presented,
    answered,
    correct,
    seenBefore: Math.min(Math.max(reported.seenBefore, 0), presented),
    breakdown: { perSection, missedQids, version: 1 },
  }
}

/** The session's questions counted by source, overall and per section
 *  (sections in first-seen order; a question without a section counts
 *  overall only). */
function basisOf(
  questions: readonly string[],
  sourceOf: (qid: string) => AttemptSource,
  unclassified: number,
): MockEstimateBasis {
  const seed = (): MockBasisCounts => ({ authentic: 0, synthetic: 0, unknown: 0, calibrated: true })
  const total = seed()
  const perSection: Record<string, MockBasisCounts> = {}
  for (const qid of questions) {
    const source = sourceOf(qid)
    const section = extractSection(qid)
    const counts = [total]
    if (section !== null) {
      perSection[section] ??= seed()
      counts.push(perSection[section])
    }
    for (const count of counts) {
      count[source] += 1
      count.calibrated = count.synthetic === 0
    }
  }
  return {
    authentic: total.authentic,
    synthetic: total.synthetic,
    unknown: total.unknown,
    unclassified,
    calibrated: total.synthetic === 0 && unclassified === 0,
    perSection,
  }
}
