// Integration tests for /api/mistakes — the wrong-answer ledger + spaced
// replay queue. Drives the REAL Hono route against an in-memory D1
// (node:sqlite shim from the generated migrations), mirroring
// mockResults.test.ts / dailyPlans.test.ts.
//
// Focus: the GET /due endpoint's `scope` query param — `due` (default,
// nextReviewAt-gated) vs `all` (whole active queue, ungated). The two
// vocabularies must stay honest: `all` counts a fresh mistake scheduled
// for tomorrow; `due` does not until it ripens. Also the PATCH
// /:id/review path Repetera uses when a miss is repeated through a new
// question with the same trap, and the PUT /round/:sessionId path that
// stores which mistake each of a round's new questions repeats.

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { mistakes, sessions, users } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { mistakesRoute } from './mistakes'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', mistakesRoute)
  return { app, env }
}

/** Seed a mistake row directly so tests control status + nextReviewAt
 *  precisely (bypassing the SRS ladder the POST path would apply). */
async function seedMistake(
  d1_: ShimD1,
  clerkUserId: string,
  opts: {
    questionId: string
    status?: string
    nextReviewAt?: Date | null
    errorCount7d?: number
    intervalMinutes?: number
    lapseIntervalMinutes?: number | null
    /** When set, controls the row's lastErrorAt — the "touched today"
     *  signal scope=pile reads. Omitted → defaults to `now` (a fresh
     *  mistake). Pass a prior-day Date to model an older, dormant miss. */
    lastErrorAt?: Date
  },
): Promise<{ userId: number; id: number }> {
  const db = getDb(d1_ as unknown as D1Database)
  let [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId))
  if (!user) {
    ;[user] = await db.insert(users).values({ clerkUserId }).returning()
  }
  const [row] = await db
    .insert(mistakes)
    .values({
      userId: user.id,
      questionId: opts.questionId,
      status: opts.status ?? 'active',
      errorCount7d: opts.errorCount7d ?? 1,
      intervalMinutes: opts.intervalMinutes ?? 10,
      lapseIntervalMinutes: opts.lapseIntervalMinutes ?? null,
      lastErrorAt: opts.lastErrorAt ?? new Date(),
      nextReviewAt:
        opts.nextReviewAt === undefined ? new Date(Date.now() - 1000) : opts.nextReviewAt,
    })
    .returning()
  return { userId: user.id, id: row.id }
}

async function getDue(asUser: string, query: Record<string, string> = {}) {
  const { app, env } = appFor(asUser)
  const qs = new URLSearchParams(query).toString()
  const res = await app.request(`/due${qs ? `?${qs}` : ''}`, {}, env)
  return { res, body: (await res.json()) as { mistakes: Array<{ questionId: string }> } }
}

beforeEach(() => {
  d1 = makeTestD1()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GET /api/mistakes/due — scope param', () => {
  it('defaults to scope=due: only ripe (nextReviewAt ≤ now / NULL) mistakes', async () => {
    // one ripe (past), one scheduled for tomorrow (future)
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-001',
      nextReviewAt: new Date(Date.now() - 60_000),
    })
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-002',
      nextReviewAt: new Date(Date.now() + 24 * 3600_000),
    })

    const { res, body } = await getDue('u1')
    expect(res.status).toBe(200)
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('scope=all returns every active mistake regardless of nextReviewAt', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-001',
      nextReviewAt: new Date(Date.now() - 60_000),
    })
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-002',
      nextReviewAt: new Date(Date.now() + 24 * 3600_000),
    })

    const { res, body } = await getDue('u1', { scope: 'all' })
    expect(res.status).toBe(200)
    expect(body.mistakes.map((m) => m.questionId).sort()).toEqual([
      'var-2026-verb1-ORD-001',
      'var-2026-verb1-ORD-002',
    ])
  })

  it('scope=all still excludes resolved (graduated) mistakes', async () => {
    await seedMistake(d1, 'u1', { questionId: 'var-2026-verb1-ORD-001', status: 'active' })
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-002',
      status: 'resolved',
      nextReviewAt: null,
    })

    const { body } = await getDue('u1', { scope: 'all' })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('scope=all honours the section filter', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-001',
      nextReviewAt: new Date(Date.now() + 3600_000),
    })
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-kvant1-XYZ-004',
      nextReviewAt: new Date(Date.now() + 3600_000),
    })

    const { body } = await getDue('u1', { scope: 'all', section: 'ORD' })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('scope is per-user scoped (no cross-user leakage)', async () => {
    await seedMistake(d1, 'u1', { questionId: 'var-2026-verb1-ORD-001' })
    await seedMistake(d1, 'u2', { questionId: 'var-2026-verb1-ORD-009' })

    const { body } = await getDue('u1', { scope: 'all' })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('rejects an invalid scope value', async () => {
    const { res } = await getDue('u1', { scope: 'everything' })
    expect(res.status).toBe(400)
  })
})

describe("GET /api/mistakes/due — scope=pile (today's pile)", () => {
  // Client's local-midnight epoch, as the app sends it.
  const dayStart = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return String(d.getTime())
  })()
  const HOUR = 3600_000
  const DAY = 24 * HOUR

  it('includes a due-now item', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-001',
      nextReviewAt: new Date(Date.now() - 60_000),
      lastErrorAt: new Date(Date.now() - 3 * DAY),
    })
    const { res, body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(res.status).toBe(200)
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })

  it('includes a created-today item even when scheduled for tomorrow', async () => {
    // Made today (lastErrorAt now), then answered correct once → pushed to
    // tomorrow. Still on today's pile because it was touched today.
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-002',
      nextReviewAt: new Date(Date.now() + DAY),
      lastErrorAt: new Date(),
    })
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-002'])
  })

  it('EXCLUDES an old item scheduled for tomorrow (dormant, not touched today)', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-003',
      nextReviewAt: new Date(Date.now() + DAY),
      lastErrorAt: new Date(Date.now() - 3 * DAY),
    })
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes).toEqual([])
  })

  it('EXCLUDES resolved (graduated) mistakes', async () => {
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-004',
      status: 'resolved',
      nextReviewAt: null,
      lastErrorAt: new Date(),
    })
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes).toEqual([])
  })

  it('keeps a just-WRONGED older mistake in the pile (static, no phantom −1)', async () => {
    // The wrong-repetition invariant: an old mistake answered WRONG in
    // /repetition has nextReviewAt reset to +10 min (no longer "due") but
    // lastErrorAt bumped to now — so it must STAY on today's pile. If this
    // dropped, the numeral would tick down on a wrong answer (owner bug).
    await seedMistake(d1, 'u1', {
      questionId: 'var-2026-verb1-ORD-005',
      nextReviewAt: new Date(Date.now() + 10 * 60_000),
      lastErrorAt: new Date(),
    })
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-005'])
  })

  it('failing an existing active mistake does not duplicate its row (POST upsert)', async () => {
    // Record a wrong answer twice for the SAME question via the real POST
    // path → one row (upsert by questionId), so the pile can never double
    // count a repeated stumble.
    const { app, env } = appFor('u1')
    const record = (questionId: string) =>
      app.request(
        '/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ questionId }),
        },
        env,
      )
    await record('var-2026-verb1-ORD-006')
    await record('var-2026-verb1-ORD-006')
    const { body } = await getDue('u1', { scope: 'pile', dayStart })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-006'])
  })

  it('honours the section filter', async () => {
    await seedMistake(d1, 'u1', { questionId: 'var-2026-verb1-ORD-001', lastErrorAt: new Date() })
    await seedMistake(d1, 'u1', { questionId: 'var-2026-kvant1-XYZ-004', lastErrorAt: new Date() })
    const { body } = await getDue('u1', { scope: 'pile', dayStart, section: 'ORD' })
    expect(body.mistakes.map((m) => m.questionId)).toEqual(['var-2026-verb1-ORD-001'])
  })
})

describe('PATCH /api/mistakes/by-question — resolve by questionId', () => {
  it('advances/graduates the active row for the question and returns it', async () => {
    const { app, env } = appFor('u10')
    await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: 'var-2026-verb1-ORD-009' }),
      },
      env,
    )
    const res = await app.request(
      '/by-question',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: 'var-2026-verb1-ORD-009', resolve: true }),
      },
      env,
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      mistake: { questionId: string; nextReviewAt: string | null } | null
    }
    expect(body.mistake?.questionId).toBe('var-2026-verb1-ORD-009')
    // Advanced up the ladder: no longer due now → out of the due list.
    const due = await app.request('/due?limit=500', {}, env)
    const dueBody = (await due.json()) as { mistakes: Array<{ questionId: string }> }
    expect(dueBody.mistakes.find((m) => m.questionId === 'var-2026-verb1-ORD-009')).toBeUndefined()
  })

  it('returns { mistake: null } when no active row exists (drifted session plan)', async () => {
    const { app, env } = appFor('u11')
    const res = await app.request(
      '/by-question',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: 'never-missed-question', resolve: true }),
      },
      env,
    )
    expect(res.status).toBe(200)
    expect(((await res.json()) as { mistake: unknown }).mistake).toBeNull()
  })
})

describe('FSRS-lite lapse memory (PL-L.2) — a lapse remembers the height', () => {
  // Drive the real POST (wrong) + PATCH /by-question (correct) paths and
  // read the row back to prove the ladder resumes after a lapse instead of
  // restarting at day 1.
  const DAY_MIN = 24 * 60

  async function post(app: ReturnType<typeof appFor>['app'], env: Env, questionId: string) {
    return app.request(
      '/',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId }),
      },
      env,
    )
  }
  async function correct(app: ReturnType<typeof appFor>['app'], env: Env, questionId: string) {
    const res = await app.request(
      '/by-question',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId, resolve: true }),
      },
      env,
    )
    return (await res.json()) as {
      mistake: { intervalMinutes: number; lapseIntervalMinutes: number | null } | null
    }
  }

  it('correct-after-lapse resumes at half the climbed height and clears the stash', async () => {
    const { app, env } = appFor('u20')
    const q = 'var-2026-verb1-ORD-100'
    // Climb: wrong → 10min, then 4 corrects → 1d, 2d, 4d, 8d.
    await post(app, env, q)
    await correct(app, env, q) // → 1d
    await correct(app, env, q) // → 2d
    await correct(app, env, q) // → 4d
    const climbed = await correct(app, env, q) // → 8d
    expect(climbed.mistake?.intervalMinutes).toBe(8 * DAY_MIN)

    // Lapse: wrong answer stashes 8d, drops interval to the relearn rung.
    await post(app, env, q)
    // Read the row via scope=all so we can inspect the stash directly.
    const db = getDb(d1 as unknown as D1Database)
    const [row] = await db.select().from(mistakes).where(eq(mistakes.questionId, q))
    expect(row.intervalMinutes).toBe(10)
    expect(row.lapseIntervalMinutes).toBe(8 * DAY_MIN)

    // Correct: resume at floor(8d / 2) = 4d, NOT 1d, and clear the stash.
    const resumed = await correct(app, env, q)
    expect(resumed.mistake?.intervalMinutes).toBe(4 * DAY_MIN)
    expect(resumed.mistake?.lapseIntervalMinutes).toBeNull()
  })

  it('a second lapse during relearn keeps the higher banked height', async () => {
    const { app, env } = appFor('u21')
    const q = 'var-2026-verb1-ORD-101'
    await post(app, env, q)
    await correct(app, env, q) // 1d
    await correct(app, env, q) // 2d → climbed height 2d
    await post(app, env, q) // lapse: stash = 2d
    await post(app, env, q) // lapse again while at relearn: must keep 2d, not overwrite with 10
    const db = getDb(d1 as unknown as D1Database)
    const [row] = await db.select().from(mistakes).where(eq(mistakes.questionId, q))
    expect(row.lapseIntervalMinutes).toBe(2 * DAY_MIN)
    // Correct resumes at floor(2d/2)=1d (== FIRST floor) and clears.
    const resumed = await correct(app, env, q)
    expect(resumed.mistake?.intervalMinutes).toBe(DAY_MIN)
    expect(resumed.mistake?.lapseIntervalMinutes).toBeNull()
  })
})

describe('PATCH /api/mistakes/:id/review — a repeat answered on a question with the same trap', () => {
  // Repetera repeats a LÄS/MEK/ELF/quant miss through a NEW question with the
  // same trap (hpf-bz6f.2), so the answer arrives on another questionId than
  // the row's. The client addresses the source mistake by row id; the route
  // must move THAT row exactly as the existing paths move a same-question
  // repeat, so due / pile stay right — and must never create a row for the
  // question that was actually answered.
  const DAY_MIN = 24 * 60
  const dayStart = String(new Date().setHours(0, 0, 0, 0))

  async function seedRow(
    clerkUserId: string,
    opts: {
      questionId: string
      status?: string
      intervalMinutes?: number
      lapseIntervalMinutes?: number | null
      errorCount7d?: number
      lastErrorAt?: Date
      nextReviewAt?: Date | null
    },
  ): Promise<number> {
    const db = getDb(d1 as unknown as D1Database)
    let [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId))
    if (!user) {
      ;[user] = await db.insert(users).values({ clerkUserId }).returning()
    }
    const [row] = await db
      .insert(mistakes)
      .values({
        userId: user.id,
        questionId: opts.questionId,
        status: opts.status ?? 'active',
        intervalMinutes: opts.intervalMinutes ?? 10,
        lapseIntervalMinutes: opts.lapseIntervalMinutes ?? null,
        errorCount7d: opts.errorCount7d ?? 1,
        lastErrorAt: opts.lastErrorAt ?? new Date(Date.now() - 3 * DAY_MIN * 60_000),
        nextReviewAt:
          opts.nextReviewAt === undefined ? new Date(Date.now() - 60_000) : opts.nextReviewAt,
      })
      .returning()
    return row.id
  }

  async function review(asUser: string, id: number, body: unknown) {
    const { app, env } = appFor(asUser)
    const res = await app.request(
      `/${id}/review`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
      env,
    )
    return res
  }

  async function rowById(id: number) {
    const db = getDb(d1 as unknown as D1Database)
    const [row] = await db.select().from(mistakes).where(eq(mistakes.id, id))
    return row
  }

  async function listed(asUser: string, query: string) {
    const { app, env } = appFor(asUser)
    const res = await app.request(`/due?limit=500&${query}`, {}, env)
    return ((await res.json()) as { mistakes: Array<{ id: number }> }).mistakes.map((m) => m.id)
  }

  it('correct advances THAT row up the ladder and drops it from due and from today’s pile', async () => {
    const id = await seedRow('u30', { questionId: 'var-2026-verb1-LÄS-003' })
    expect(await listed('u30', 'scope=due')).toEqual([id])

    const res = await review('u30', id, { correct: true })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      mistake: { id: number; status: string; intervalMinutes: number }
    }
    expect(body.mistake.id).toBe(id)
    expect(body.mistake.status).toBe('active')
    expect(body.mistake.intervalMinutes).toBe(DAY_MIN)
    expect(await listed('u30', 'scope=due')).toEqual([])
    // An older miss (last error 3 days ago) answered right leaves the pile.
    expect(await listed('u30', `scope=pile&dayStart=${dayStart}`)).toEqual([])
  })

  it('correct at the 30-day cap graduates the row after the configured exam calendar ends', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2027, 3, 11))
    const id = await seedRow('u31', {
      questionId: 'var-2026-kvant1-NOG-002',
      intervalMinutes: 30 * DAY_MIN,
    })
    const res = await review('u31', id, { correct: true })
    expect(res.status).toBe(200)
    expect((await rowById(id)).status).toBe('resolved')
  })

  it('correct after a lapse resumes at half the banked height and clears the stash', async () => {
    const id = await seedRow('u32', {
      questionId: 'var-2026-verb2-MEK-011',
      intervalMinutes: 10,
      lapseIntervalMinutes: 8 * DAY_MIN,
    })
    await review('u32', id, { correct: true })
    const row = await rowById(id)
    expect(row.intervalMinutes).toBe(4 * DAY_MIN)
    expect(row.lapseIntervalMinutes).toBeNull()
  })

  it('wrong lapses THAT row like a wrong repeat: relearn rung, banked height, error count, pile', async () => {
    const id = await seedRow('u33', {
      questionId: 'var-2026-verb1-ELF-024',
      intervalMinutes: 8 * DAY_MIN,
      errorCount7d: 2,
    })
    const before = Date.now()
    const res = await review('u33', id, { correct: false })
    expect(res.status).toBe(200)
    const row = await rowById(id)
    expect(row.status).toBe('active')
    expect(row.intervalMinutes).toBe(10)
    expect(row.lapseIntervalMinutes).toBe(8 * DAY_MIN)
    expect(row.errorCount7d).toBe(3)
    // Timestamps are stored at second precision.
    expect(row.lastErrorAt?.getTime()).toBeGreaterThanOrEqual(before - 1000)
    expect(row.nextReviewAt?.getTime()).toBeGreaterThan(before)
    // Relearn rung, touched today → it stays on today's pile (static numeral).
    expect(await listed('u33', `scope=pile&dayStart=${dayStart}`)).toEqual([id])
  })

  it('a wrong answer never creates a mistake row for any other question', async () => {
    const id = await seedRow('u34', { questionId: 'var-2026-kvant2-XYZ-005' })
    await review('u34', id, { correct: false })
    await review('u34', id, { correct: false })
    const db = getDb(d1 as unknown as D1Database)
    const rows = await db.select().from(mistakes)
    expect(rows.map((r) => [r.id, r.questionId])).toEqual([[id, 'var-2026-kvant2-XYZ-005']])
  })

  it('a resolved row stays resolved on a correct answer and comes back on a wrong one', async () => {
    const id = await seedRow('u35', {
      questionId: 'var-2026-kvant1-KVA-007',
      status: 'resolved',
      intervalMinutes: 30 * DAY_MIN,
      nextReviewAt: null,
    })
    expect((await review('u35', id, { correct: true })).status).toBe(200)
    const kept = await rowById(id)
    expect(kept.status).toBe('resolved')
    expect(kept.intervalMinutes).toBe(30 * DAY_MIN)

    // Same as the POST upsert: a wrong answer re-activates the row.
    await review('u35', id, { correct: false })
    const back = await rowById(id)
    expect(back.status).toBe('active')
    expect(back.intervalMinutes).toBe(10)
    expect(back.lapseIntervalMinutes).toBe(30 * DAY_MIN)
  })

  it('another user’s row is a 404 and stays untouched', async () => {
    const id = await seedRow('u36', { questionId: 'var-2026-verb1-LÄS-009', errorCount7d: 4 })
    const before = await rowById(id)
    for (const correct of [true, false]) {
      const res = await review('u37', id, { correct })
      expect(res.status).toBe(404)
    }
    expect(await rowById(id)).toEqual(before)
  })

  it('an unknown id is a 404', async () => {
    const res = await review('u38', 999_999, { correct: true })
    expect(res.status).toBe(404)
  })

  it('rejects a body without a boolean `correct`', async () => {
    const id = await seedRow('u39', { questionId: 'var-2026-verb1-LÄS-010' })
    for (const body of [{}, { correct: 'yes' }, { correct: true, questionId: 'x' }]) {
      const res = await review('u39', id, body)
      expect(res.status).toBe(400)
    }
  })
})

describe('PUT /api/mistakes/round/:sessionId — a round stores the mistake each new question repeats', () => {
  // Repetera repeats a miss through a new question with the same trap
  // (hpf-bz6f.2). SessionPlayer stores the round's plan as plain qids; the
  // route then rewrites each new question as "<qid>~<sourceQid>" so a resume,
  // on any device, answers it against THAT mistake. It may only annotate the
  // open round: what the round plays never changes.
  const X = 'var-2026-verb1-LÄS-012'
  const Y = 'var-2026-verb1-LÄS-014'
  const O = 'var-2026-verb1-ORD-001'
  const PLAIN = [X, Y, O]
  const LINKED = [`${X}~var-2026-verb1-LÄS-011`, `${Y}~var-2026-verb1-LÄS-013`, O]

  async function seedSession(
    clerkUserId: string,
    opts: { kind?: string; plan?: string[] | null; endedAt?: Date | null } = {},
  ): Promise<number> {
    const db = getDb(d1 as unknown as D1Database)
    let [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId))
    if (!user) {
      ;[user] = await db.insert(users).values({ clerkUserId }).returning()
    }
    const [row] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        kind: opts.kind ?? 'adaptive_review',
        sections: 'alla',
        position: 1,
        currentQuestionId: Y,
        plan: opts.plan === undefined ? PLAIN : opts.plan,
        endedAt: opts.endedAt ?? null,
      })
      .returning()
    return row.id
  }

  async function link(asUser: string, sessionId: number, body: unknown) {
    const { app, env } = appFor(asUser)
    return app.request(
      `/round/${sessionId}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
      env,
    )
  }

  async function sessionById(id: number) {
    const db = getDb(d1 as unknown as D1Database)
    const [row] = await db.select().from(sessions).where(eq(sessions.id, id))
    return row
  }

  it('stores the linked entries in the open round’s plan and leaves its cursor alone', async () => {
    const id = await seedSession('u40')
    const res = await link('u40', id, { plan: LINKED })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { session: { id: number; plan: string[] } }
    expect(body.session.id).toBe(id)
    expect(body.session.plan).toEqual(LINKED)
    const row = await sessionById(id)
    expect(row.plan).toEqual(LINKED)
    expect(row.position).toBe(1)
    expect(row.currentQuestionId).toBe(Y)
    expect(row.endedAt).toBeNull()
  })

  it('stores the same links again on a retry', async () => {
    const id = await seedSession('u41', { plan: LINKED })
    expect((await link('u41', id, { plan: LINKED })).status).toBe(200)
    expect((await sessionById(id)).plan).toEqual(LINKED)
  })

  it('never changes what the round plays', async () => {
    const id = await seedSession('u42')
    const other = 'var-2026-verb1-LÄS-015'
    for (const plan of [
      [`${other}~${X}`, Y, O], // another question
      [LINKED[1], LINKED[0], O], // reordered
      LINKED.slice(0, 2), // shorter
      [...LINKED, other], // longer
    ]) {
      expect((await link('u42', id, { plan })).status).toBe(400)
    }
    expect((await sessionById(id)).plan).toEqual(PLAIN)
  })

  it('refuses a malformed link', async () => {
    const id = await seedSession('u43')
    for (const first of [`${X}~`, `${X}~a~b`, `~${X}`]) {
      expect((await link('u43', id, { plan: [first, Y, O] })).status).toBe(400)
    }
    expect((await sessionById(id)).plan).toEqual(PLAIN)
  })

  it('only links an open Repetera round', async () => {
    const drill = await seedSession('u44', { kind: 'drill' })
    expect((await link('u44', drill, { plan: LINKED })).status).toBe(400)
    expect((await sessionById(drill)).plan).toEqual(PLAIN)

    const ended = await seedSession('u44', { endedAt: new Date() })
    expect((await link('u44', ended, { plan: LINKED })).status).toBe(400)
    expect((await sessionById(ended)).plan).toEqual(PLAIN)
  })

  it('another user’s session is a 404 and stays untouched', async () => {
    const id = await seedSession('u45')
    expect((await link('u46', id, { plan: LINKED })).status).toBe(404)
    expect((await sessionById(id)).plan).toEqual(PLAIN)
  })

  it('holds a plan to the bounds a stored plan has', async () => {
    const id = await seedSession('u47')
    const tooLong = `${X}~${'x'.repeat(80)}`
    for (const body of [{ plan: [tooLong, Y, O] }, { plan: [] }, { plan: LINKED, extra: 1 }, {}]) {
      expect((await link('u47', id, body)).status).toBe(400)
    }
    expect((await sessionById(id)).plan).toEqual(PLAIN)
  })
})

describe('exam-aware review routes', () => {
  const DAY_MIN = 24 * 60
  const DAY_MS = 86_400_000
  const EXAM = new Date(2027, 3, 10)
  const daysBeforeExam = (days: number) => new Date(EXAM.getTime() - days * DAY_MS)

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(daysBeforeExam(20))
  })

  async function target(asUser: string, targetSittingId: string | null) {
    const db = getDb(d1 as unknown as D1Database)
    await db.update(users).set({ targetSittingId }).where(eq(users.clerkUserId, asUser))
  }

  async function answer(path: string, id: number, questionId: string) {
    const { app, env } = appFor('exam-user')
    const res = await app.request(
      path === 'by-question' ? '/by-question' : `/${id}${path === 'review' ? '/review' : ''}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          path === 'by-question'
            ? { questionId, resolve: true }
            : path === 'review'
              ? { correct: true }
              : { resolve: true },
        ),
      },
      env,
    )
    expect(res.status).toBe(200)
    const db = getDb(d1 as unknown as D1Database)
    const [row] = await db.select().from(mistakes).where(eq(mistakes.id, id))
    return row
  }

  describe.each(['review', 'by-question', 'id'])('%s', (path) => {
    it.each([
      'var-2027',
      'host-2026',
      null,
      'unknown',
    ])('caps the persisted due time using the saved or fallback exam (%s)', async (saved) => {
      const questionId = 'q-exam-cap'
      const { id } = await seedMistake(d1, 'exam-user', {
        questionId,
        intervalMinutes: 16 * DAY_MIN,
      })
      await target('exam-user', saved)
      const row = await answer(path, id, questionId)
      expect(row.status).toBe('active')
      expect(row.intervalMinutes).toBe(30 * DAY_MIN)
      expect(row.nextReviewAt).toEqual(daysBeforeExam(5))
    })

    it('reads this user’s saved later sitting instead of the earliest or another user’s', async () => {
      vi.setSystemTime(new Date(2026, 9, 1))
      const questionId = 'q-later-target'
      const { id } = await seedMistake(d1, 'exam-user', {
        questionId,
        intervalMinutes: 16 * DAY_MIN,
      })
      await target('exam-user', 'var-2027')
      await seedMistake(d1, 'other-user', { questionId })
      await target('other-user', 'host-2026')
      const row = await answer(path, id, questionId)
      expect(row.nextReviewAt).toEqual(new Date(Date.now() + 30 * DAY_MS))
    })

    it('holds a capped row active until its final-week confirmation', async () => {
      const questionId = 'q-graduate'
      const { id } = await seedMistake(d1, 'exam-user', {
        questionId,
        intervalMinutes: 30 * DAY_MIN,
      })
      expect((await answer(path, id, questionId)).status).toBe('active')
      vi.setSystemTime(daysBeforeExam(5))
      expect((await answer(path, id, questionId)).status).toBe('resolved')
    })

    it('caps lapse recovery and clears the stash', async () => {
      vi.setSystemTime(daysBeforeExam(10))
      const questionId = 'q-exam-lapse'
      const { id } = await seedMistake(d1, 'exam-user', {
        questionId,
        intervalMinutes: 10,
        lapseIntervalMinutes: 30 * DAY_MIN,
      })
      const row = await answer(path, id, questionId)
      expect(row.intervalMinutes).toBe(15 * DAY_MIN)
      expect(row.lapseIntervalMinutes).toBeNull()
      expect(row.nextReviewAt).toEqual(daysBeforeExam(5))
    })
  })

  async function seedQueue() {
    for (const [suffix, intervalMinutes, errorCount7d, days] of [
      ['old', 8 * DAY_MIN, 50, 12],
      ['low', 10, 1, 9],
      ['high-new', 10, 3, 8],
      ['high-old', 10, 3, 10],
    ] as const) {
      await seedMistake(d1, 'exam-user', {
        questionId: `var-2026-verb1-ORD-${suffix}`,
        intervalMinutes,
        errorCount7d,
        nextReviewAt: daysBeforeExam(days),
      })
    }
  }

  it.each([
    'due',
    'pile',
    'all',
  ])('orders scope=%s by consolidation, misses, then due time at exactly seven days', async (scope) => {
    vi.setSystemTime(daysBeforeExam(7))
    await seedQueue()
    const { res, body } = await getDue('exam-user', { scope })
    expect(res.status).toBe(200)
    expect(body.mistakes.map((row) => row.questionId)).toEqual(
      ['high-old', 'high-new', 'low', 'old'].map((suffix) => `var-2026-verb1-ORD-${suffix}`),
    )
  })

  it('keeps overdue-first ordering before the last week and after the calendar ends', async () => {
    vi.setSystemTime(daysBeforeExam(7.01))
    await seedQueue()
    for (const now of [daysBeforeExam(7.01), new Date(2027, 3, 11)]) {
      vi.setSystemTime(now)
      const { body } = await getDue('exam-user')
      expect(body.mistakes.map((row) => row.questionId)).toEqual(
        ['old', 'high-old', 'low', 'high-new'].map((suffix) => `var-2026-verb1-ORD-${suffix}`),
      )
    }
  })

  it('keeps limit, section, due-time, status and user filters before last-week sorting', async () => {
    vi.setSystemTime(daysBeforeExam(7))
    await seedQueue()
    await seedMistake(d1, 'exam-user', {
      questionId: 'var-2026-verb1-ORD-future',
      intervalMinutes: 0,
      nextReviewAt: daysBeforeExam(6),
    })
    await seedMistake(d1, 'exam-user', {
      questionId: 'var-2026-verb1-ORD-resolved',
      intervalMinutes: 0,
      status: 'resolved',
    })
    await seedMistake(d1, 'exam-user', {
      questionId: 'var-2026-kvant1-XYZ-other-section',
      intervalMinutes: 0,
    })
    await seedMistake(d1, 'other-user', {
      questionId: 'var-2026-verb1-ORD-other-user',
      intervalMinutes: 0,
    })
    const { body } = await getDue('exam-user', { limit: '2', section: 'ORD' })
    expect(body.mistakes.map((row) => row.questionId)).toEqual([
      'var-2026-verb1-ORD-high-old',
      'var-2026-verb1-ORD-high-new',
    ])
  })

  it('uses the saved later exam for queue ordering too', async () => {
    vi.setSystemTime(new Date(2026, 9, 15))
    await seedMistake(d1, 'exam-user', {
      questionId: 'old-consolidated',
      intervalMinutes: 8 * DAY_MIN,
      nextReviewAt: new Date(2026, 9, 10),
    })
    await seedMistake(d1, 'exam-user', {
      questionId: 'new-unconsolidated',
      intervalMinutes: 10,
      nextReviewAt: new Date(2026, 9, 14),
    })
    await target('exam-user', 'var-2027')
    expect((await getDue('exam-user')).body.mistakes.map((row) => row.questionId)).toEqual([
      'old-consolidated',
      'new-unconsolidated',
    ])
    await target('exam-user', 'host-2026')
    expect((await getDue('exam-user')).body.mistakes.map((row) => row.questionId)).toEqual([
      'new-unconsolidated',
      'old-consolidated',
    ])
  })
})

describe('scope=pile — same-day miss leaves the pile once correctly repeated', () => {
  it('correct repetition on a today-missed item → out of the pile; wrong → stays', async () => {
    const { app, env } = appFor('u12')
    const record = (questionId: string) =>
      app.request(
        '/',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ questionId }),
        },
        env,
      )
    await record('q-today-1')
    await record('q-today-2')
    const dayStart = new Date().setHours(0, 0, 0, 0)
    const pile = async () => {
      const res = await app.request(`/due?limit=500&scope=pile&dayStart=${dayStart}`, {}, env)
      return ((await res.json()) as { mistakes: Array<{ questionId: string }> }).mistakes
    }
    expect((await pile()).length).toBe(2)
    // correct repetition on q-today-1 → climbs off the relearn rung → −1
    await app.request(
      '/by-question',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: 'q-today-1', resolve: true }),
      },
      env,
    )
    const after = await pile()
    expect(after.length).toBe(1)
    expect(after[0]?.questionId).toBe('q-today-2')
    // wrong repetition on q-today-2 (re-record) → stays, no duplicate
    await record('q-today-2')
    expect((await pile()).length).toBe(1)
  })
})
