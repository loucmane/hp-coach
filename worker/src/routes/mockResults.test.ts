// Integration tests for /api/mock-results — the Provpass (mock exam)
// per-pass summary. Drives the REAL Hono route against an in-memory D1
// (node:sqlite shim from the generated migrations), mirroring
// dailyPlans.test.ts / lessonReads.test.ts. Answers go in through the real
// POST /api/attempts, as MockRunner posts them.

import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import { sessions, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { attemptsRoute } from './attempts'
import { mockResultsRoute } from './mockResults'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/attempts', attemptsRoute)
    .route('/', mockResultsRoute)
  return { app, env }
}

const pad = (n: number) => String(n).padStart(3, '0')
const span = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

// var-2024's first kvant pass, as resolveAuthentic plans it: XYZ 001-012,
// KVA 013-022, NOG 023-028, DTK 029-040.
const KVANT_PLAN = [
  ...span(1, 12).map((n) => `var-2024-kvant1-XYZ-${pad(n)}`),
  ...span(13, 22).map((n) => `var-2024-kvant1-KVA-${pad(n)}`),
  ...span(23, 28).map((n) => `var-2024-kvant1-NOG-${pad(n)}`),
  ...span(29, 40).map((n) => `var-2024-kvant1-DTK-${pad(n)}`),
]

/** A breakdown of the 40-question kvant pass with `correct` right answers,
 *  filled section by section, as computeMockSummary would report it. */
function kvantBreakdown(correct: number) {
  let left = correct
  const take = (n: number) => {
    const c = Math.min(n, left)
    left -= c
    return c
  }
  return {
    perSection: {
      XYZ: { presented: 12, correct: take(12), timeMs: 500_000 },
      KVA: { presented: 10, correct: take(10), timeMs: 400_000 },
      NOG: { presented: 6, correct: take(6), timeMs: 300_000 },
      DTK: { presented: 12, correct: take(12), timeMs: 600_000 },
    },
    missedQids: ['var-2024-kvant1-XYZ-003'],
    version: 1 as const,
  }
}

const BREAKDOWN = kvantBreakdown(30)

// Directly seed a session row (bypassing the sessions route) so tests can
// control kind/endedAt/plan precisely. Mirrors how the mock-results route
// reads sessions: scoped by (id, userId).
async function seedSession(
  d1_: ShimD1,
  clerkUserId: string,
  opts: { kind?: string; ended?: boolean; plan?: string[] | null } = {},
): Promise<{ userId: number; sessionId: number }> {
  const db = getDb(d1_ as unknown as D1Database)
  const [user] = await db.insert(users).values({ clerkUserId }).returning()
  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      kind: opts.kind ?? 'mock',
      endedAt: opts.ended === false ? null : new Date(),
      plan: opts.plan === undefined ? KVANT_PLAN : opts.plan,
    })
    .returning()
  return { userId: user.id, sessionId: session.id }
}

function postBody(sessionId: number, overrides: Record<string, unknown> = {}) {
  return {
    sessionId,
    mode: 'authentic',
    half: 'kvant',
    examId: 'var-2024',
    provpass: 'kvant-1',
    presented: 40,
    answered: 40,
    correct: 30,
    seenBefore: 5,
    durationMs: 3_600_000,
    breakdown: BREAKDOWN,
    ...overrides,
  }
}

async function post(asUser: string, body: unknown) {
  const { app, env } = appFor(asUser)
  return app.request(
    '/',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    env,
  )
}

async function get(asUser: string) {
  const { app, env } = appFor(asUser)
  const res = await app.request('/', {}, env)
  return { res, body: (await res.json()) as { results: unknown[] } }
}

/** Answer each question through POST /api/attempts, as MockRunner's pick does. */
async function answer(
  asUser: string,
  sessionId: number,
  answers: ReadonlyArray<readonly [string, boolean]>,
) {
  const { app, env } = appFor(asUser)
  for (const [questionId, correct] of answers) {
    const res = await app.request(
      '/attempts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId,
          selectedAnswer: correct ? 'A' : 'B',
          correct,
          timeTakenMs: 30_000,
        }),
      },
      env,
    )
    expect(res.status).toBe(201)
  }
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('POST /api/mock-results', () => {
  it('stores a mock result for an ended mock session', async () => {
    const { sessionId } = await seedSession(d1, 'user_a')
    const res = await post('user_a', postBody(sessionId))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { result: Record<string, unknown> }
    expect(body.result.sessionId).toBe(sessionId)
    expect(body.result.correct).toBe(30)
    expect(body.result.breakdown).toEqual(BREAKDOWN)
  })

  it('is idempotent — a retry with the same sessionId upserts, not duplicates', async () => {
    const { sessionId } = await seedSession(d1, 'user_a')
    await post('user_a', postBody(sessionId))
    const second = await post(
      'user_a',
      postBody(sessionId, { correct: 32, breakdown: kvantBreakdown(32) }),
    )
    expect(second.status).toBe(200)

    const { body } = await get('user_a')
    expect(body.results).toHaveLength(1)
    expect((body.results[0] as { correct: number }).correct).toBe(32)
  })

  it('404s on a forged/unowned sessionId', async () => {
    const { sessionId } = await seedSession(d1, 'user_a')
    const res = await post('user_b', postBody(sessionId))
    expect(res.status).toBe(404)
  })

  it('404s on a sessionId that does not exist at all', async () => {
    const res = await post('user_a', postBody(999_999))
    expect(res.status).toBe(404)
  })

  it('400s when the session kind is not "mock"', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { kind: 'drill' })
    const res = await post('user_a', postBody(sessionId))
    expect(res.status).toBe(400)
  })

  it('400s when the session has not been ended yet', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { ended: false })
    const res = await post('user_a', postBody(sessionId))
    expect(res.status).toBe(400)
  })

  it('rejects a malformed body (zod validation)', async () => {
    const { sessionId } = await seedSession(d1, 'user_a')
    const res = await post('user_a', postBody(sessionId, { mode: 'bogus' }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/mock-results', () => {
  it('returns this user’s rows newest-first with breakdown parsed to JSON', async () => {
    const s1 = await seedSession(d1, 'user_a')
    await post('user_a', postBody(s1.sessionId))

    const { userId } = s1
    // Second session for the same user, ended later.
    const db = getDb(d1 as unknown as D1Database)
    const [session2] = await db
      .insert(sessions)
      .values({ userId, kind: 'mock', endedAt: new Date(Date.now() + 10_000), plan: KVANT_PLAN })
      .returning()
    await post('user_a', postBody(session2.id, { correct: 20, breakdown: kvantBreakdown(20) }))

    const { body } = await get('user_a')
    expect(body.results).toHaveLength(2)
    const [newest, oldest] = body.results as Array<{
      sessionId: number
      correct: number
      breakdown: unknown
    }>
    expect(newest.sessionId).toBe(session2.id)
    expect(oldest.sessionId).toBe(s1.sessionId)
    expect(newest.correct).toBe(20)
    expect(newest.breakdown).toEqual(kvantBreakdown(20))
  })

  it('caps at 50 rows', async () => {
    const { sessionId, userId } = await seedSession(d1, 'user_a')
    await post('user_a', postBody(sessionId))
    const db = getDb(d1 as unknown as D1Database)
    for (let i = 0; i < 55; i++) {
      const [s] = await db
        .insert(sessions)
        .values({
          userId,
          kind: 'mock',
          endedAt: new Date(Date.now() + i * 1000),
          plan: KVANT_PLAN,
        })
        .returning()
      await post('user_a', postBody(s.id))
    }
    const { body } = await get('user_a')
    expect(body.results).toHaveLength(50)
  })

  it('never leaks one user’s mock results to another', async () => {
    const a = await seedSession(d1, 'user_a')
    const b = await seedSession(d1, 'user_b')
    await post('user_a', postBody(a.sessionId))
    await post('user_b', postBody(b.sessionId))

    const resA = await get('user_a')
    const resB = await get('user_b')
    expect(resA.body.results).toHaveLength(1)
    expect(resB.body.results).toHaveLength(1)
  })
})

// P5 infold PR 3 (docs/p5-infold-design.md Amendment 1 E): a Provpass result
// counts its P5 questions. What it rests on is decided on the server from the
// session's plan and attempts, never from the client, when it is posted.
describe('POST /api/mock-results — estimate basis', () => {
  const VERBAL_PLAN = [
    'var-2024-verb1-ORD-001',
    'var-2024-verb1-ORD-002',
    'p5-las-b19-002-r1-LÄS-001',
    'p5-las-b19-002-r1-LÄS-002',
    'var-2024-verb1-MEK-021',
    'p5-elf-b19-003-r1-ELF-001',
  ]

  async function seedPlanned(clerkUserId: string, plan: string[] | null) {
    return (await seedSession(d1, clerkUserId, { plan })).sessionId
  }

  function verbalBreakdown(lasCorrect: number) {
    return {
      perSection: {
        ORD: { presented: 2, correct: 1, timeMs: 60_000 },
        LÄS: { presented: 2, correct: lasCorrect, timeMs: 200_000 },
        MEK: { presented: 1, correct: 1, timeMs: 30_000 },
        ELF: { presented: 1, correct: 0, timeMs: 90_000 },
      },
      missedQids: ['var-2024-verb1-ORD-002', 'p5-elf-b19-003-r1-ELF-001'],
      version: 1,
    }
  }

  function verbalBody(sessionId: number, overrides: Record<string, unknown> = {}) {
    return postBody(sessionId, {
      mode: 'synthetic',
      half: 'verbal',
      examId: null,
      provpass: null,
      presented: VERBAL_PLAN.length,
      answered: 6,
      correct: 4,
      seenBefore: 0,
      breakdown: verbalBreakdown(2),
      ...overrides,
    })
  }

  const VERBAL_BASIS = {
    authentic: 3,
    synthetic: 3,
    unknown: 0,
    unclassified: 0,
    calibrated: false,
    perSection: {
      ORD: { authentic: 2, synthetic: 0, unknown: 0, calibrated: true },
      LÄS: { authentic: 0, synthetic: 2, unknown: 0, calibrated: false },
      MEK: { authentic: 1, synthetic: 0, unknown: 0, calibrated: true },
      ELF: { authentic: 0, synthetic: 1, unknown: 0, calibrated: false },
    },
  }

  it('stores the P5 questions in the result, and a basis the server derived', async () => {
    const sessionId = await seedPlanned('user_a', VERBAL_PLAN)
    const res = await post('user_a', verbalBody(sessionId))
    expect(res.status).toBe(200)
    const { result } = (await res.json()) as { result: Record<string, unknown> }
    expect(result).toMatchObject({ presented: 6, correct: 4, estimateBasis: VERBAL_BASIS })
    const { body } = await get('user_a')
    expect(body.results[0]).toMatchObject({ estimateBasis: VERBAL_BASIS })
  })

  it('ignores a client-sent basis, on the first post and on a retry', async () => {
    const sessionId = await seedPlanned('user_a', VERBAL_PLAN)
    const forged = {
      authentic: 6,
      synthetic: 0,
      unknown: 0,
      unclassified: 0,
      calibrated: true,
      perSection: {},
    }
    const first = await post('user_a', verbalBody(sessionId, { estimateBasis: forged }))
    expect(first.status).toBe(200)
    expect(
      ((await first.json()) as { result: { estimateBasis: unknown } }).result.estimateBasis,
    ).toEqual(VERBAL_BASIS)
    const retry = await post(
      'user_a',
      verbalBody(sessionId, { estimateBasis: forged, correct: 3, breakdown: verbalBreakdown(1) }),
    )
    expect(((await retry.json()) as { result: { estimateBasis: unknown } }).result).toMatchObject({
      correct: 3,
      estimateBasis: VERBAL_BASIS,
    })
  })

  it('an authentic-only pass is stored as posted, and calibrated', async () => {
    const sessionId = await seedPlanned('user_a', KVANT_PLAN)
    await answer('user_a', sessionId, [
      ['var-2024-kvant1-XYZ-001', true],
      ['var-2024-kvant1-XYZ-003', false],
      ['var-2024-kvant1-KVA-013', true],
    ])
    const res = await post('user_a', postBody(sessionId))
    const { result } = (await res.json()) as { result: Record<string, unknown> }
    expect(result).toMatchObject({
      presented: 40,
      answered: 40,
      correct: 30,
      seenBefore: 5,
      breakdown: BREAKDOWN,
      estimateBasis: {
        authentic: 40,
        synthetic: 0,
        unknown: 0,
        unclassified: 0,
        calibrated: true,
      },
    })
  })
})

// Review findings B1 and B2 of hpf-aaqr, reproduced through the real routes:
// the session's answers go in through POST /api/attempts, then the client's
// summary through POST /api/mock-results.
describe('POST /api/mock-results — review fix hpf-0jyp', () => {
  const ORD_1 = 'var-2024-verb1-ORD-001'
  const ORD_2 = 'var-2024-verb1-ORD-002'
  const MEK_21 = 'var-2024-verb1-MEK-021'
  const LAS_P5 = 'p5-las-b19-002-r1-LÄS-001'
  const ELF_P5 = 'p5-elf-b19-003-r1-ELF-001'
  const REVOKED = 'p5-las-b7-002-r1-LÄS-001' // las-b7-002 is at revision 2
  const FABRICATED = 'var-2024-verb1-ORD-015' // verb1's ORD questions are 001-010

  /** The summary computeMockSummary posts for these sections and answers. */
  function verbalSummary(
    sessionId: number,
    rows: ReadonlyArray<readonly [qid: string, section: string, correct: boolean | null]>,
  ) {
    const perSection: Record<string, { presented: number; correct: number; timeMs: number }> = {}
    const missedQids: string[] = []
    let answered = 0
    let correct = 0
    for (const [qid, section, ok] of rows) {
      perSection[section] ??= { presented: 0, correct: 0, timeMs: 0 }
      perSection[section].presented += 1
      perSection[section].timeMs += 30_000
      if (ok === null) continue
      answered += 1
      if (ok) {
        correct += 1
        perSection[section].correct += 1
      } else missedQids.push(qid)
    }
    return postBody(sessionId, {
      mode: 'synthetic',
      half: 'verbal',
      examId: null,
      provpass: null,
      presented: rows.length,
      answered,
      correct,
      seenBefore: 0,
      breakdown: { perSection, missedQids, version: 1 },
    })
  }

  async function stored(asUser: string) {
    const { body } = await get(asUser)
    return body.results[0] as Record<string, unknown>
  }

  it.each([
    ['a revised-away P5 revision', REVOKED, 'LÄS'],
    ['a bank-shaped qid the bank does not hold', FABRICATED, 'ORD'],
  ])('B1: an unknown question the client counted never feeds the stored result (%s)', async (_label, unknownQid, section) => {
    const { sessionId } = await seedSession(d1, 'user_a', {
      plan: [ORD_1, ORD_2, MEK_21, unknownQid],
    })
    await answer('user_a', sessionId, [
      [ORD_1, true],
      [ORD_2, false],
      [MEK_21, true],
      [unknownQid, true],
    ])
    const body = verbalSummary(sessionId, [
      [ORD_1, 'ORD', true],
      [ORD_2, 'ORD', false],
      [MEK_21, 'MEK', true],
      [unknownQid, section, true],
    ])
    // The client counted it: 3 of 4.
    expect(body).toMatchObject({ presented: 4, answered: 4, correct: 3 })
    const res = await post('user_a', body)
    expect(res.status).toBe(200)

    const row = await stored('user_a')
    expect(row).toMatchObject({ presented: 3, answered: 3, correct: 2, seenBefore: 0 })
    expect(row.breakdown).toEqual({
      perSection: {
        ORD: { presented: 2, correct: 1, timeMs: section === 'ORD' ? 90_000 : 60_000 },
        MEK: { presented: 1, correct: 1, timeMs: 30_000 },
      },
      missedQids: [ORD_2],
      version: 1,
    })
    expect(row.estimateBasis).toMatchObject({
      authentic: 3,
      synthetic: 0,
      unknown: 1,
      unclassified: 0,
      calibrated: true,
    })
  })

  it('B1: an unknown question left blank is not presented in the stored result', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { plan: [ORD_1, REVOKED] })
    await answer('user_a', sessionId, [[ORD_1, true]])
    await post(
      'user_a',
      verbalSummary(sessionId, [
        [ORD_1, 'ORD', true],
        [REVOKED, 'LÄS', null],
      ]),
    )
    expect(await stored('user_a')).toMatchObject({ presented: 1, answered: 1, correct: 1 })
  })

  it('B2: a session without a plan — the P5 answers it stored make the result uncalibrated', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { plan: null })
    await answer('user_a', sessionId, [
      [ORD_1, true],
      [LAS_P5, true],
      [ELF_P5, false],
    ])
    await post(
      'user_a',
      verbalSummary(sessionId, [
        [ORD_1, 'ORD', true],
        [LAS_P5, 'LÄS', true],
        [ELF_P5, 'ELF', false],
      ]),
    )
    const row = await stored('user_a')
    expect(row).toMatchObject({ presented: 3, answered: 3, correct: 2 })
    expect(row.estimateBasis).toEqual({
      authentic: 1,
      synthetic: 2,
      unknown: 0,
      unclassified: 0,
      calibrated: false,
      perSection: {
        ORD: { authentic: 1, synthetic: 0, unknown: 0, calibrated: true },
        LÄS: { authentic: 0, synthetic: 1, unknown: 0, calibrated: false },
        ELF: { authentic: 0, synthetic: 1, unknown: 0, calibrated: false },
      },
    })
  })

  it('B2: a session without a plan — blanks the server cannot identify are unclassified', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { plan: null })
    await answer('user_a', sessionId, [[ORD_1, true]])
    await post(
      'user_a',
      verbalSummary(sessionId, [
        [ORD_1, 'ORD', true],
        [ORD_2, 'ORD', null],
        [MEK_21, 'MEK', null],
      ]),
    )
    const row = await stored('user_a')
    expect(row).toMatchObject({ presented: 1, answered: 1, correct: 1 })
    expect(row.estimateBasis).toMatchObject({ unclassified: 2, calibrated: false })
  })

  it('B2: an authentic plan whose session answered P5 questions is not calibrated', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { plan: [ORD_1, ORD_2] })
    await answer('user_a', sessionId, [
      [ORD_1, true],
      [ORD_2, true],
      [LAS_P5, true],
    ])
    // Whether the client counts the P5 answer or not, the session answered it.
    for (const rows of [
      [
        [ORD_1, 'ORD', true],
        [ORD_2, 'ORD', true],
        [LAS_P5, 'LÄS', true],
      ],
      [
        [ORD_1, 'ORD', true],
        [ORD_2, 'ORD', true],
      ],
    ] as const) {
      await post('user_a', verbalSummary(sessionId, rows))
      const row = await stored('user_a')
      expect(row).toMatchObject({ presented: 3, answered: 3, correct: 3 })
      expect(row.estimateBasis).toMatchObject({
        authentic: 2,
        synthetic: 1,
        unknown: 0,
        unclassified: 0,
        calibrated: false,
      })
    }
  })

  it('B2: a summary larger than its plan is unclassified past the plan, and not scored', async () => {
    const { sessionId } = await seedSession(d1, 'user_a', { plan: [ORD_1, ORD_2] })
    await answer('user_a', sessionId, [
      [ORD_1, true],
      [ORD_2, true],
    ])
    await post(
      'user_a',
      verbalSummary(sessionId, [
        [ORD_1, 'ORD', true],
        [ORD_2, 'ORD', true],
        [LAS_P5, 'LÄS', true],
      ]),
    )
    const row = await stored('user_a')
    expect(row).toMatchObject({ presented: 2, answered: 2, correct: 2 })
    expect(row.estimateBasis).toMatchObject({
      authentic: 2,
      synthetic: 0,
      unclassified: 1,
      calibrated: false,
    })
  })
})
