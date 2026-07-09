// Integration tests for /api/lesson-reads — the cross-device read set.
//
// Drives the REAL Hono route against an in-memory D1 (node:sqlite shim
// built from the generated migrations). Auth is stubbed by setting the
// `userId` context var directly — exactly the shape the Clerk verify
// middleware sets in production — so the tests exercise the same
// ensureUserRow scoping the live routes use, per user.

import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { lessonReadsRoute } from './lessonReads'

let d1: ShimD1

// Mount the route under a tiny app that injects a fixed user id, mirroring
// how requireAuth sets `userId`. Different `asUser` values prove scoping.
function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', lessonReadsRoute)
  return { app, env }
}

async function get(asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  const res = await app.request('/', {}, env)
  return { res, body: (await res.json()) as { entryIds: string[] } }
}

async function put(entryId: string, asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  return app.request(
    '/',
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entryId }),
    },
    env,
  )
}

async function del(entryId: string, asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  return app.request(`/${entryId}`, { method: 'DELETE' }, env)
}

beforeEach(() => {
  d1 = makeTestD1()
})

describe('GET /api/lesson-reads', () => {
  it('returns an empty set for a fresh user', async () => {
    const { res, body } = await get()
    expect(res.status).toBe(200)
    expect(body.entryIds).toEqual([])
  })

  it('returns the full set of marked entries', async () => {
    await put('NOG-TRAP-001')
    await put('KVA-NEG-002')
    const { body } = await get()
    expect(new Set(body.entryIds)).toEqual(new Set(['NOG-TRAP-001', 'KVA-NEG-002']))
  })
})

describe('PUT /api/lesson-reads', () => {
  it('marks an entry read', async () => {
    const res = await put('XYZ-FORMULA-003')
    expect(res.status).toBe(200)
    const { body } = await get()
    expect(body.entryIds).toContain('XYZ-FORMULA-003')
  })

  it('is idempotent — re-marking does not duplicate the row', async () => {
    await put('ORD-ROOT-010')
    await put('ORD-ROOT-010')
    const { body } = await get()
    expect(body.entryIds.filter((e) => e === 'ORD-ROOT-010')).toHaveLength(1)
  })

  it('rejects an empty entryId (zod validation)', async () => {
    const res = await put('')
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/lesson-reads/:entryId', () => {
  it('unmarks a previously-read entry', async () => {
    await put('MEK-PATTERN-005')
    const res = await del('MEK-PATTERN-005')
    expect(res.status).toBe(200)
    const { body } = await get()
    expect(body.entryIds).not.toContain('MEK-PATTERN-005')
  })

  it('is idempotent — deleting an absent entry succeeds with removed:0', async () => {
    const res = await del('never-marked')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { removed: number }
    expect(body.removed).toBe(0)
  })
})

describe('user scoping', () => {
  it('never leaks one user’s reads to another', async () => {
    await put('LÄS-STRUCT-001', 'user_a')
    await put('DTK-READ-009', 'user_b')

    const a = await get('user_a')
    const b = await get('user_b')

    expect(a.body.entryIds).toEqual(['LÄS-STRUCT-001'])
    expect(b.body.entryIds).toEqual(['DTK-READ-009'])
  })
})
