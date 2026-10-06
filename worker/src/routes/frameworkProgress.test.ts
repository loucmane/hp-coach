// Exercise production route registration/auth and real Drizzle SQL over the
// existing in-memory D1 harness. Only Clerk verification and Sentry are stubbed.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { frameworkProgress } from '../db/schema'
import worker from '../index'
import { ensureUserRow } from '../lib/ensureUser'
import { FRAMEWORK_STATUSES, readFrameworkProgress } from '../lib/progress'
import { makeTestD1 } from '../lib/testD1'
import type { Env } from '../types'

const verifyToken = vi.hoisted(() => vi.fn())
vi.mock('@clerk/backend', () => ({ verifyToken, createClerkClient: vi.fn() }))
vi.mock('@sentry/cloudflare', () => ({
  withSentry: (_options: unknown, handler: unknown) => handler,
  captureException: vi.fn(),
}))

let env: Env
const older = new Date('2026-10-01T10:00:00Z')
const newer = new Date('2026-10-02T10:00:00Z')

beforeEach(() => {
  env = { DB: makeTestD1(), ENVIRONMENT: 'dev' } as unknown as Env
  verifyToken.mockReset().mockImplementation(async (token: string) => {
    if (token !== 'user_a' && token !== 'user_b') throw new Error('Invalid token')
    return { sub: token }
  })
})

async function seed(
  rows: Array<{ layer1Id: string; status: string; lastTransitionAt: Date | null }>,
  asUser = 'user_a',
) {
  const db = getDb(env.DB)
  const userId = await ensureUserRow(db, asUser)
  await db.insert(frameworkProgress).values(rows.map((row) => ({ ...row, userId })))
  return userId
}

function request(token: string | null = 'user_a', query = '') {
  return worker.fetch!(
    new Request(`https://test.invalid/api/framework-progress${query}`, {
      headers: token === null ? {} : { Authorization: `Bearer ${token}` },
    }),
    env,
    {} as ExecutionContext,
  )
}

async function get(asUser = 'user_a', query = '') {
  const res = await request(asUser, query)
  expect(res.status).toBe(200)
  return (await res.json()) as {
    progress: Array<{ layer1Id: string; status: string; lastTransitionAt: string | null }>
  }
}

describe('GET /api/framework-progress', () => {
  it('returns an empty list for a fresh user, including through the shared reader', async () => {
    expect(await get()).toEqual({ progress: [] })
    const db = getDb(env.DB)
    const userId = await ensureUserRow(db, 'user_a')
    expect(await readFrameworkProgress(db, userId)).toEqual([])
  })

  it('returns all five statuses and serialized timestamps without internal user/row ids', async () => {
    const rows = FRAMEWORK_STATUSES.map((status, i) => ({
      layer1Id: `entry-${i}`,
      status,
      lastTransitionAt: older,
    }))
    await seed(rows)
    const { progress } = await get()
    expect(progress).toHaveLength(5)
    expect(progress).toEqual(
      expect.arrayContaining(
        rows.map((row) => ({ ...row, lastTransitionAt: older.toISOString() })),
      ),
    )
  })

  it('collapses duplicates by latest transition, even when an older row has the higher id', async () => {
    const userId = await seed([
      { layer1Id: 'shared', status: 'retaining', lastTransitionAt: newer },
      { layer1Id: 'shared', status: 'mastered', lastTransitionAt: older },
    ])
    expect(await readFrameworkProgress(getDb(env.DB), userId)).toEqual([
      { layer1Id: 'shared', status: 'retaining', lastTransitionAt: newer },
    ])
    expect((await get()).progress).toEqual([
      { layer1Id: 'shared', status: 'retaining', lastTransitionAt: newer.toISOString() },
    ])
  })

  it('breaks equal-timestamp ties by highest row id, not status rank', async () => {
    await seed([
      { layer1Id: 'shared', status: 'mastered', lastTransitionAt: newer },
      { layer1Id: 'shared', status: 'learning', lastTransitionAt: newer },
    ])
    expect((await get()).progress).toEqual([
      { layer1Id: 'shared', status: 'learning', lastTransitionAt: newer.toISOString() },
    ])
  })

  it('ranks null timestamps behind dated rows and breaks null ties by highest id', async () => {
    await seed([
      { layer1Id: 'dated', status: 'learning', lastTransitionAt: older },
      { layer1Id: 'dated', status: 'mastered', lastTransitionAt: null },
      { layer1Id: 'undated', status: 'mastered', lastTransitionAt: null },
      { layer1Id: 'undated', status: 'practicing', lastTransitionAt: null },
    ])
    expect((await get()).progress).toEqual([
      { layer1Id: 'dated', status: 'learning', lastTransitionAt: older.toISOString() },
      { layer1Id: 'undated', status: 'practicing', lastTransitionAt: null },
    ])
  })

  it('normalizes unknown statuses on the winning row to untaught without repairing stored rows', async () => {
    await seed([
      { layer1Id: 'legacy', status: 'mastered', lastTransitionAt: older },
      { layer1Id: 'legacy', status: 'legacy-status', lastTransitionAt: newer },
      { layer1Id: 'unknown', status: '', lastTransitionAt: null },
    ])
    expect((await get()).progress).toEqual([
      { layer1Id: 'legacy', status: 'untaught', lastTransitionAt: newer.toISOString() },
      { layer1Id: 'unknown', status: 'untaught', lastTransitionAt: null },
    ])
    const stored = await getDb(env.DB).select().from(frameworkProgress)
    expect(stored.map((row) => row.status)).toEqual(['mastered', 'legacy-status', ''])
  })

  it('scopes rows before duplicate selection and ignores a forged userId query', async () => {
    const userA = await seed([
      { layer1Id: 'shared', status: 'mastered', lastTransitionAt: newer },
      { layer1Id: 'only-a', status: 'retaining', lastTransitionAt: newer },
    ])
    expect((await get('user_b')).progress).toEqual([])
    await seed([{ layer1Id: 'shared', status: 'learning', lastTransitionAt: older }], 'user_b')
    expect((await get('user_b', `?userId=${userA}`)).progress).toEqual([
      { layer1Id: 'shared', status: 'learning', lastTransitionAt: older.toISOString() },
    ])
    expect((await get('user_a')).progress).toHaveLength(2)
  })

  it('rejects a request without a bearer token with the sibling routes auth response', async () => {
    const res = await request(null)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({
      error: { code: 'unauthenticated', message: 'Missing bearer token' },
    })
    expect(verifyToken).not.toHaveBeenCalled()
  })

  it('rejects invalid bearer tokens', async () => {
    const res = await request('invalid')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({
      error: { code: 'unauthenticated', message: 'Invalid token' },
    })
  })
})
