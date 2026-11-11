import { asc, eq, type SQL, sql } from 'drizzle-orm'

import type { Db } from '../db/client'
import { attempts, firstTries as ledger, sessions } from '../db/schema'
import type { AttemptSource } from './provenance'
import { extractSection, SECTIONS, type Section } from './section'

export type FirstTryAgg = {
  firstTry7d: number
  firstTryCorrect7d: number
  firstTry7to14d: number
  firstTryCorrect7to14d: number
  firstTry90d: number
  firstTryCorrect90d: number
}

export type KindedAnswer = {
  id: number
  sessionId: number
  questionId: string
  correct: boolean | null
  createdAt: Date | null
  source: AttemptSource
  kind: string | null
}

export const canonicalQuestion = (qid: string) => qid.split('-LAS-').join('-LÄS-')
export const answeredAt = (a: KindedAnswer) => a.createdAt?.getTime() ?? 0

/** SQLite ASC puts NULL first, then timestamp, then the insertion id. */
function answerOrder(a: KindedAnswer, b: KindedAnswer) {
  if (a.createdAt === null && b.createdAt !== null) return -1
  if (b.createdAt === null && a.createdAt !== null) return 1
  return answeredAt(a) - answeredAt(b) || a.id - b.id
}

/** The original selection rule. Callers supply (createdAt, id) order and
 * cut at an as-of boundary BEFORE selecting the last pick of a first mock.
 * Unknown sources still mark a question seen. Onboarding/review firsts
 * suppress all later retries, and LAS is the same question as LÄS. */
export function firstTries(answers: readonly KindedAnswer[]): KindedAnswer[] {
  const byQuestion = new Map<string, { first: KindedAnswer; answer: KindedAnswer }>()
  for (const a of answers) {
    const question = canonicalQuestion(a.questionId)
    const seen = byQuestion.get(question)
    if (!seen) byQuestion.set(question, { first: a, answer: a })
    else if (seen.first.kind === 'mock' && a.sessionId === seen.first.sessionId) seen.answer = a
  }
  return [...byQuestion.values()]
    .filter(({ first }) => first.kind !== 'adaptive_review' && first.kind !== 'onboarding')
    .map(({ answer }) => answer)
}

export function retainedAnswerHistory(db: Db, userId: number) {
  return db
    .select({
      id: attempts.id,
      sessionId: attempts.sessionId,
      questionId: attempts.questionId,
      correct: attempts.correct,
      createdAt: attempts.createdAt,
      source: attempts.source,
      kind: sessions.kind,
    })
    .from(attempts)
    .leftJoin(sessions, eq(attempts.sessionId, sessions.id))
    .where(eq(attempts.userId, userId))
    .orderBy(asc(attempts.createdAt), asc(attempts.id))
}

/** Ledger presence is authoritative even for excluded/undated answers.
 * Only questions without a ledger row use the retained-history fallback.
 * Reads never populate the ledger or lazily provision an account. */
export async function firstTryHistory(db: Db, userId: number, retained?: KindedAnswer[]) {
  const rows = await db.select().from(ledger).where(eq(ledger.userId, userId))
  const known = new Set(rows.map((r) => r.questionId))
  const history = (retained ?? (await retainedAnswerHistory(db, userId))).filter(
    (a) => !known.has(canonicalQuestion(a.questionId)),
  )
  for (const row of rows) {
    const anchor = { ...row, id: row.attemptId }
    history.push(anchor)
    for (const pick of row.mockAnswers) {
      history.push({
        ...anchor,
        ...pick,
        createdAt: pick.createdAt === null ? null : new Date(pick.createdAt * 1000),
      })
    }
  }
  return history.sort(answerOrder)
}

/** The same six rolling-window fields and key order as /me/stats. */
export function firstTryAggregates(
  history: readonly KindedAnswer[],
  asOf: Date,
): Record<Section, FirstTryAgg> {
  const day = 86_400_000
  const out = Object.fromEntries(
    SECTIONS.map((s) => [
      s,
      {
        firstTry7d: 0,
        firstTryCorrect7d: 0,
        firstTry7to14d: 0,
        firstTryCorrect7to14d: 0,
        firstTry90d: 0,
        firstTryCorrect90d: 0,
      },
    ]),
  ) as Record<Section, FirstTryAgg>
  for (const a of firstTries(history)) {
    if (a.source === 'unknown') continue
    const section = extractSection(a.questionId)
    if (!section || answeredAt(a) < +asOf - 90 * day) continue
    const agg = out[section]
    const right = a.correct ? 1 : 0
    agg.firstTry90d++
    agg.firstTryCorrect90d += right
    if (answeredAt(a) >= +asOf - 7 * day) {
      agg.firstTry7d++
      agg.firstTryCorrect7d += right
    } else if (answeredAt(a) >= +asOf - 14 * day) {
      agg.firstTry7to14d++
      agg.firstTryCorrect7to14d += right
    }
  }
  return out
}

/** Select anchors and bounded mock evidence from retained attempts AND the
 * durable ledger. Kept equivalent to the 0017 backfill, tested on the same
 * histories. Execute inside the attempt's D1 batch, never read/modify/write
 * in JS: overlapping requests and older offline arrivals must compose.
 *
 * 40 latest nonempty UTC weeks cover the 26-week endpoint plus its 90-day
 * windows. The earliest anchor always survives separately. Even an open
 * mock running for years cannot grow the row without bound. */
export function ledgerSelectionSql(userId?: number, questionId?: string): SQL {
  const storedWhere =
    userId === undefined
      ? sql``
      : sql`WHERE user_id = ${userId}
    ${questionId === undefined ? sql`` : sql`AND question_id = ${canonicalQuestion(questionId)}`}`
  const attemptsWhere =
    userId === undefined
      ? sql``
      : sql`WHERE a.user_id = ${userId}
    ${questionId === undefined ? sql`` : sql`AND replace(a.question_id, '-LAS-', '-LÄS-') = ${canonicalQuestion(questionId)}`}`
  return sql`WITH stored AS (SELECT * FROM first_tries ${storedWhere}),
    candidates AS (
      SELECT user_id, question_id, session_id, attempt_id, created_at, correct, source, kind, 0 AS priority FROM stored
      UNION ALL
      SELECT s.user_id, s.question_id, s.session_id,
        json_extract(j.value, '$.id'), json_extract(j.value, '$.createdAt'),
        json_extract(j.value, '$.correct'), json_extract(j.value, '$.source'), s.kind, 0
      FROM stored s, json_each(s.mock_answers) j
      UNION ALL
      SELECT a.user_id, replace(a.question_id, '-LAS-', '-LÄS-'), a.session_id,
        a.id, a.created_at, a.correct, a.source, s.kind, 1
      FROM attempts a LEFT JOIN sessions s ON s.id = a.session_id ${attemptsWhere}
    ), ordered AS (
      SELECT *, row_number() OVER (PARTITION BY user_id, question_id ORDER BY created_at, attempt_id, priority) AS position
      FROM candidates
    ), firsts AS (SELECT * FROM ordered WHERE position = 1), mock_picks AS (
      SELECT c.*, row_number() OVER (PARTITION BY c.user_id, c.question_id,
        date(c.created_at, 'unixepoch', 'weekday 0', '-6 days')
        ORDER BY c.created_at DESC, c.attempt_id DESC, c.priority) AS week_position
      FROM candidates c JOIN firsts f ON c.user_id = f.user_id AND c.question_id = f.question_id
        AND c.session_id = f.session_id WHERE f.kind = 'mock'
    )
    SELECT f.user_id, f.question_id, f.session_id, f.attempt_id, f.created_at, f.correct, f.source, f.kind,
      (SELECT json_group_array(json_object('id', p.attempt_id, 'createdAt', p.created_at,
        'correct', json(CASE p.correct WHEN 1 THEN 'true' WHEN 0 THEN 'false' ELSE 'null' END), 'source', p.source))
       FROM (SELECT * FROM mock_picks m WHERE m.user_id = f.user_id AND m.question_id = f.question_id
         AND week_position = 1 ORDER BY created_at DESC, attempt_id DESC LIMIT 40) p) AS mock_answers
    FROM firsts f WHERE true`
}

export function writeFirstTries(db: Db, userId: number, questionId?: string) {
  return db
    .insert(ledger)
    .select(ledgerSelectionSql(userId, questionId))
    .onConflictDoUpdate({
      target: [ledger.userId, ledger.questionId],
      set: {
        sessionId: sql`excluded.session_id`,
        attemptId: sql`excluded.attempt_id`,
        createdAt: sql`excluded.created_at`,
        correct: sql`excluded.correct`,
        source: sql`excluded.source`,
        kind: sql`excluded.kind`,
        mockAnswers: sql`excluded.mock_answers`,
      },
    })
}
