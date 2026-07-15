// Integration tests for POST /api/webhooks/clerk — the Clerk → Worker sync
// webhook. Drives the REAL Hono route against an in-memory D1 (node:sqlite
// shim from the generated migrations) plus an in-memory KV shim, computing
// REAL Svix HMAC signatures with a test secret so the manual verification
// scheme is exercised end-to-end (no svix npm dependency in play).

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '../db/client'
import {
  attempts,
  dailyPlans,
  frameworkProgress,
  lessonProgress,
  lessonReads,
  mastery,
  mistakes,
  mockResults,
  sessions,
  srsState,
  users,
} from '../db/schema'
import { makeTestD1, type ShimD1 } from '../lib/testD1'
import type { Env, Vars } from '../types'
import { clerkWebhookRoute } from './clerkWebhook'

// A real `whsec_`-prefixed secret: the tail is base64 of 24 random-ish
// bytes. The verifier base64-decodes the tail to get the HMAC key, so the
// test must sign with those exact key bytes.
const SECRET_KEY_BYTES = new Uint8Array(Array.from({ length: 24 }, (_, i) => (i * 37 + 11) & 0xff))
const WEBHOOK_SECRET = `whsec_${btoa(String.fromCharCode(...SECRET_KEY_BYTES))}`

let d1: ShimD1
let kv: Map<string, string>

// Minimal in-memory KV shim — only get/put with expirationTtl are used.
function makeKV(store: Map<string, string>) {
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value)
    },
  } as unknown as KVNamespace
}

function envFor(overrides?: Partial<Env>): Env {
  return {
    DB: d1 as unknown as D1Database,
    RATE_LIMIT: makeKV(kv),
    CLERK_WEBHOOK_SECRET: WEBHOOK_SECRET,
    ENVIRONMENT: 'staging',
    ...overrides,
  } as unknown as Env
}

function appForWebhook() {
  return new Hono<{ Bindings: Env; Variables: Vars }>().route('/', clerkWebhookRoute)
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

// Compute the Svix v1 signature the way the worker expects to verify it.
async function signSvix(svixId: string, svixTimestamp: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    SECRET_KEY_BYTES,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${svixId}.${svixTimestamp}.${body}`),
  )
  return `v1,${bytesToBase64(new Uint8Array(sig))}`
}

// Post a webhook with valid Svix headers unless overridden.
async function postWebhook(opts: {
  body: unknown
  svixId?: string
  timestampSeconds?: number
  signature?: string // override to force a bad signature
  env?: Env
}) {
  const rawBody = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)
  const svixId = opts.svixId ?? `msg_${Math.random().toString(36).slice(2)}`
  const ts = String(opts.timestampSeconds ?? Math.floor(Date.now() / 1000))
  const signature = opts.signature ?? (await signSvix(svixId, ts, rawBody))
  const app = appForWebhook()
  const res = await app.request(
    '/',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': svixId,
        'svix-timestamp': ts,
        'svix-signature': signature,
      },
      body: rawBody,
    },
    opts.env ?? envFor(),
  )
  return { res, body: (await res.json()) as Record<string, unknown> }
}

// Seed one row in EVERY user-scoped table for a clerk user, returning the
// numeric user id.
async function seedFullUser(clerkUserId: string): Promise<number> {
  const db = getDb(d1 as unknown as D1Database)
  const [user] = await db.insert(users).values({ clerkUserId }).returning()
  const uid = user.id

  const [s] = await db
    .insert(sessions)
    .values({ userId: uid, kind: 'drill', endedAt: new Date() })
    .returning()
  await db
    .insert(attempts)
    .values({ userId: uid, sessionId: s.id, questionId: 'var-2024-XYZ-001', correct: true })
  await db
    .insert(mistakes)
    .values({ userId: uid, questionId: 'var-2024-KVA-002', status: 'active' })
  await db.insert(lessonProgress).values({ userId: uid, section: 'ord' })
  await db.insert(lessonReads).values({ userId: uid, entryId: 'ORD-ROOT-001' })
  await db.insert(dailyPlans).values({ userId: uid, date: '2026-07-15', plan: { items: [] } })
  await db.insert(srsState).values({ userId: uid, itemId: 'root_1', itemKind: 'ord_root' })
  await db.insert(mastery).values({ userId: uid, section: 'ord', layer1Id: 'ORD-SYN-001' })
  await db.insert(frameworkProgress).values({ userId: uid, layer1Id: 'ORD-SYN-001' })
  const [ms] = await db
    .insert(sessions)
    .values({ userId: uid, kind: 'mock', endedAt: new Date() })
    .returning()
  await db.insert(mockResults).values({
    userId: uid,
    sessionId: ms.id,
    mode: 'authentic',
    half: 'kvant',
    presented: 40,
    answered: 40,
    correct: 30,
    seenBefore: 0,
    durationMs: 1000,
    breakdown: {},
  })
  return uid
}

async function countAllUserRows(uid: number): Promise<number> {
  const db = getDb(d1 as unknown as D1Database)
  const tables = [
    db.select().from(sessions).where(eq(sessions.userId, uid)),
    db.select().from(attempts).where(eq(attempts.userId, uid)),
    db.select().from(mistakes).where(eq(mistakes.userId, uid)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, uid)),
    db.select().from(lessonReads).where(eq(lessonReads.userId, uid)),
    db.select().from(dailyPlans).where(eq(dailyPlans.userId, uid)),
    db.select().from(srsState).where(eq(srsState.userId, uid)),
    db.select().from(mastery).where(eq(mastery.userId, uid)),
    db.select().from(frameworkProgress).where(eq(frameworkProgress.userId, uid)),
    db.select().from(mockResults).where(eq(mockResults.userId, uid)),
    db.select().from(users).where(eq(users.id, uid)),
  ]
  const results = await Promise.all(tables)
  return results.reduce((n, rows) => n + rows.length, 0)
}

beforeEach(() => {
  d1 = makeTestD1()
  kv = new Map()
})

describe('POST /api/webhooks/clerk — signature verification', () => {
  it('accepts a request with a valid Svix signature', async () => {
    const { res, body } = await postWebhook({
      body: { type: 'user.created', data: { id: 'user_valid_1' } },
    })
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)

    const db = getDb(d1 as unknown as D1Database)
    const rows = await db.select().from(users).where(eq(users.clerkUserId, 'user_valid_1'))
    expect(rows).toHaveLength(1)
  })

  it('rejects a tampered body (signature no longer matches) with 401', async () => {
    const svixId = 'msg_tamper'
    const ts = String(Math.floor(Date.now() / 1000))
    const signedBody = JSON.stringify({ type: 'user.created', data: { id: 'user_a' } })
    const signature = await signSvix(svixId, ts, signedBody)

    // Send a DIFFERENT body under the signature computed for signedBody.
    const app = appForWebhook()
    const res = await app.request(
      '/',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': svixId,
          'svix-timestamp': ts,
          'svix-signature': signature,
        },
        body: JSON.stringify({ type: 'user.created', data: { id: 'user_EVIL' } }),
      },
      envFor(),
    )
    expect(res.status).toBe(401)

    const db = getDb(d1 as unknown as D1Database)
    expect(await db.select().from(users)).toHaveLength(0)
  })

  it('rejects an outright bad signature with 401', async () => {
    const { res } = await postWebhook({
      body: { type: 'user.created', data: { id: 'user_x' } },
      signature: 'v1,not-a-real-signature',
    })
    expect(res.status).toBe(401)
  })

  it('rejects a missing signature header with 4xx (400)', async () => {
    const { res } = await postWebhook({
      body: { type: 'user.created', data: { id: 'user_x' } },
      signature: '',
    })
    expect(res.status).toBe(400)
  })

  it('rejects a stale timestamp (older than ±5 min) with 401', async () => {
    const { res } = await postWebhook({
      body: { type: 'user.created', data: { id: 'user_stale' } },
      timestampSeconds: Math.floor(Date.now() / 1000) - 10 * 60,
    })
    expect(res.status).toBe(401)
  })

  it('rejects a future timestamp (beyond +5 min) with 401', async () => {
    const { res } = await postWebhook({
      body: { type: 'user.created', data: { id: 'user_future' } },
      timestampSeconds: Math.floor(Date.now() / 1000) + 10 * 60,
    })
    expect(res.status).toBe(401)
  })

  it('returns 500 when the webhook secret is not configured (Clerk should retry)', async () => {
    const { res } = await postWebhook({
      body: { type: 'user.created', data: { id: 'user_x' } },
      env: envFor({ CLERK_WEBHOOK_SECRET: undefined as unknown as string }),
    })
    expect(res.status).toBe(500)
  })

  it('never leaks the signature or which check failed in the error body', async () => {
    const { res, body } = await postWebhook({
      body: { type: 'user.created', data: { id: 'user_x' } },
      signature: 'v1,bogus',
    })
    expect(res.status).toBe(401)
    const asText = JSON.stringify(body)
    expect(asText).not.toContain('timestamp')
    expect(asText).not.toContain('hmac')
    expect(asText).not.toContain(WEBHOOK_SECRET)
  })
})

describe('POST /api/webhooks/clerk — events', () => {
  it('user.created provisions a user row (idempotent)', async () => {
    const { res } = await postWebhook({
      body: { type: 'user.created', data: { id: 'user_created_1' } },
    })
    expect(res.status).toBe(200)
    const db = getDb(d1 as unknown as D1Database)
    expect(
      await db.select().from(users).where(eq(users.clerkUserId, 'user_created_1')),
    ).toHaveLength(1)
  })

  it('user.deleted cascade-deletes rows across EVERY user-scoped table', async () => {
    const uid = await seedFullUser('user_del_1')
    // Sanity: rows exist in every table before deletion.
    expect(await countAllUserRows(uid)).toBeGreaterThanOrEqual(11)

    const { res } = await postWebhook({
      body: { type: 'user.deleted', data: { id: 'user_del_1', deleted: true } },
    })
    expect(res.status).toBe(200)

    expect(await countAllUserRows(uid)).toBe(0)
  })

  it('user.deleted only removes the target user, leaving others intact', async () => {
    const keepUid = await seedFullUser('user_keep')
    await seedFullUser('user_drop')

    await postWebhook({ body: { type: 'user.deleted', data: { id: 'user_drop' } } })

    expect(await countAllUserRows(keepUid)).toBeGreaterThanOrEqual(11)
    const db = getDb(d1 as unknown as D1Database)
    expect(await db.select().from(users).where(eq(users.clerkUserId, 'user_drop'))).toHaveLength(0)
  })

  it('user.deleted for an unknown user is a harmless 200 no-op', async () => {
    const { res } = await postWebhook({
      body: { type: 'user.deleted', data: { id: 'user_never_existed' } },
    })
    expect(res.status).toBe(200)
  })

  it('acks an unknown event type with 200 and does not touch the DB', async () => {
    const { res, body } = await postWebhook({
      body: { type: 'session.created', data: { id: 'sess_1' } },
    })
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    const db = getDb(d1 as unknown as D1Database)
    expect(await db.select().from(users)).toHaveLength(0)
  })
})

describe('POST /api/webhooks/clerk — replay dedupe', () => {
  it('a duplicate svix-id is acked 200 without reprocessing (no double cascade)', async () => {
    const uid = await seedFullUser('user_dupe')
    const svixId = 'msg_dupe_1'
    const body = { type: 'user.deleted', data: { id: 'user_dupe' } }

    const first = await postWebhook({ body, svixId })
    expect(first.res.status).toBe(200)
    expect(await countAllUserRows(uid)).toBe(0)

    // Re-seed the SAME clerk id — if the duplicate were reprocessed it
    // would cascade-delete these fresh rows too. Dedupe must short-circuit.
    const uid2 = await seedFullUser('user_dupe')
    const second = await postWebhook({ body, svixId })
    expect(second.res.status).toBe(200)
    expect(second.body.deduped).toBe(true)
    // Fresh rows survive because the second delivery was deduped.
    expect(await countAllUserRows(uid2)).toBeGreaterThanOrEqual(11)
  })

  it('records the svix-id in KV with a TTL after processing', async () => {
    const svixId = 'msg_kv_1'
    await postWebhook({ body: { type: 'user.created', data: { id: 'user_kv' } }, svixId })
    expect(kv.get(`webhook:svix:${svixId}`)).toBeTruthy()
  })
})
