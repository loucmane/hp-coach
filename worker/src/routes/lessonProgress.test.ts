// Integration tests for /api/lesson-progress — the per-section reading
// bookmark behind Home's "fortsätt läsa", and the lesson-step resume it now
// carries (LJ-12, rebuild map §2): `step`, the step of the 5-step lesson the
// reader is on (1–5), and `guess`, the option chosen in "Gissa först" (a–e).
// Both are optional, so a client that sends neither keeps working unchanged.
//
// Drives the REAL Hono route against an in-memory D1 (lib/testD1.ts). Auth is
// stubbed by setting the `userId` context var, as the Clerk middleware does.

import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDb } from '../db/client'
import { lessonProgress } from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { lessonProgressRoute } from './lessonProgress'

let d1: ShimD1

function appFor(asUser: string) {
  const env = { DB: d1 } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
    .use('*', async (c, next) => {
      c.set('userId', asUser)
      await next()
    })
    .route('/', lessonProgressRoute)
  return { app, env }
}

type Progress = {
  section: string
  frameworkId: string | null
  device: string | null
  step: number | null
  guess: string | null
}

async function put(body: unknown, asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  return app.request(
    '/',
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    env,
  )
}

async function get(asUser = 'user_a') {
  const { app, env } = appFor(asUser)
  const res = await app.request('/', {}, env)
  return (await res.json()) as { progress: Progress | null }
}

function storedRows() {
  return getDb(d1 as unknown as D1Database)
    .select()
    .from(lessonProgress)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-03T10:00:00Z'))
  d1 = makeTestD1()
})

afterEach(() => vi.useRealTimers())

describe('PUT /api/lesson-progress — lesson step and guess', () => {
  it('stores the step and the guess, and returns them on the PUT and on GET', async () => {
    const bookmark = {
      section: 'KVA',
      frameworkId: 'KVA-TRAP-012',
      device: 'phone',
      step: 2,
      guess: 'c',
    }
    const res = await put(bookmark)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ progress: bookmark })
    expect((await get()).progress).toMatchObject(bookmark)
  })

  it('takes every step 1–5 and every guess a–e, moving the one row in place', async () => {
    for (const step of [1, 2, 3, 4, 5]) {
      expect((await put({ section: 'NOG', step })).status).toBe(200)
      expect((await get()).progress?.step).toBe(step)
    }
    for (const guess of ['a', 'b', 'c', 'd', 'e']) {
      expect((await put({ section: 'NOG', step: 2, guess })).status).toBe(200)
      expect((await get()).progress).toMatchObject({ step: 2, guess })
    }
    expect(await storedRows()).toHaveLength(1)
  })

  it('refuses a step outside 1–5 and a guess outside a–e, writing nothing', async () => {
    const kept = { section: 'KVA', frameworkId: 'KVA-TRAP-012', step: 2, guess: 'b' }
    expect((await put(kept)).status).toBe(200)
    for (const step of [0, 6, -1, 2.5, '2', true]) {
      expect((await put({ ...kept, frameworkId: 'KVA-TRAP-013', step })).status).toBe(400)
    }
    for (const guess of ['f', 'A', 'ab', '', 1]) {
      expect((await put({ ...kept, frameworkId: 'KVA-TRAP-013', guess })).status).toBe(400)
    }
    expect((await get()).progress).toMatchObject(kept)
    expect(await storedRows()).toHaveLength(1)
  })

  it('clears the step and the guess when they are sent as null', async () => {
    expect((await put({ section: 'XYZ', step: 3, guess: 'a' })).status).toBe(200)
    expect((await put({ section: 'XYZ', step: null, guess: null })).status).toBe(200)
    expect((await get()).progress).toMatchObject({ section: 'XYZ', step: null, guess: null })
  })

  it('keeps each user’s step to that user', async () => {
    expect((await put({ section: 'KVA', step: 4, guess: 'd' }, 'user_a')).status).toBe(200)
    expect((await get('user_a')).progress).toMatchObject({ step: 4, guess: 'd' })
    expect((await get('user_b')).progress).toBeNull()
  })
})

describe('PUT /api/lesson-progress — a client that sends no step or guess', () => {
  it('stores the bookmark as before, and GET reads null for both', async () => {
    const res = await put({ section: 'ORD', frameworkId: 'ORD-ROOT-010', device: 'desktop' })
    expect(res.status).toBe(200)
    expect((await get()).progress).toMatchObject({
      section: 'ORD',
      frameworkId: 'ORD-ROOT-010',
      device: 'desktop',
      step: null,
      guess: null,
    })
  })

  it('replaces the whole bookmark, as it always has, so a step never moves to another entry', async () => {
    await put({ section: 'KVA', frameworkId: 'KVA-TRAP-012', device: 'phone', step: 2, guess: 'c' })
    expect((await put({ section: 'KVA', frameworkId: 'KVA-TRAP-020' })).status).toBe(200)
    expect((await get()).progress).toMatchObject({
      frameworkId: 'KVA-TRAP-020',
      device: null,
      step: null,
      guess: null,
    })
    expect(await storedRows()).toHaveLength(1)
  })
})
