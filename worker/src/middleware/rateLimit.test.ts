// The limiter is ONE global 60/min bucket per user across all routes.
// In dev (local wrangler, e2e CI) it must be a no-op — the e2e suite
// runs as a single Clerk user and exhausts the shared budget mid-suite
// otherwise (2026-07-10 CI: mistakes/prefs tests eating 429s). Staging
// and production keep the real limit.

import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { Env, Vars } from '../types'
import { rateLimit } from './rateLimit'

function makeKv(counts: Map<string, string>) {
  return {
    get: async (key: string) => counts.get(key) ?? null,
    put: async (key: string, value: string) => {
      counts.set(key, value)
    },
  } as unknown as Env['RATE_LIMIT']
}

function makeApp(environment: Env['ENVIRONMENT'], kv: Env['RATE_LIMIT'], userId = 42) {
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
  app.use('*', async (c, next) => {
    // Unique per test: the limiter's in-isolate memCounts Map is module
    // scoped (deliberately — that's the production behavior), so tests
    // sharing a userId would pollute each other's windows.
    c.set('userId', userId as never)
    await next()
  })
  app.use('*', rateLimit)
  app.get('/api/thing', (c) => c.json({ ok: true }))
  const env = { ENVIRONMENT: environment, RATE_LIMIT: kv } as Env
  return { app, env }
}

describe('rateLimit', () => {
  it('is a no-op in dev — burst well past the limit stays 200', async () => {
    const counts = new Map<string, string>()
    const { app, env } = makeApp('dev', makeKv(counts))
    for (let i = 0; i < 70; i++) {
      const res = await app.request('/api/thing', {}, env)
      expect(res.status).toBe(200)
    }
    // dev requests must not even touch the KV bucket
    expect(counts.size).toBe(0)
  })

  it('still limits in staging once the bucket is exhausted — and diets on KV writes', async () => {
    const counts = new Map<string, string>()
    let puts = 0
    const kv = makeKv(counts)
    const rawPut = kv.put.bind(kv)
    kv.put = (async (key: string, value: string) => {
      puts++
      return rawPut(key, value)
    }) as typeof kv.put
    const { app, env } = makeApp('staging', kv, 43)
    let limited = 0
    for (let i = 0; i < 130; i++) {
      const res = await app.request('/api/thing', {}, env)
      if (res.status === 429) limited++
    }
    // Memory-first: requests 1–29 never touch KV; durable accounting
    // starts at the half-limit escalation point; the 60-req limit still
    // bites (requests 120–130 → 11 rejections at the 2026-07-15
    // ceiling of 120/min).
    expect(limited).toBe(11)
    // The actual point of the 2026-07-11 change: a burst costs KV
    // writes only past ESCALATE_AT — and typical polling traffic
    // (< 30/min) costs ZERO.
    expect(puts).toBeLessThan(75)
    expect(puts).toBeGreaterThan(0)
  })

  it('polling-shaped traffic (under half the limit) costs zero KV operations', async () => {
    const counts = new Map<string, string>()
    let ops = 0
    const kv = makeKv(counts)
    const rawGet = kv.get.bind(kv)
    const rawPut = kv.put.bind(kv)
    kv.get = (async (key: string) => {
      ops++
      return rawGet(key)
    }) as typeof kv.get
    kv.put = (async (key: string, value: string) => {
      ops++
      return rawPut(key, value)
    }) as typeof kv.put
    const { app, env } = makeApp('staging', kv, 44)
    for (let i = 0; i < 20; i++) {
      const res = await app.request('/api/thing', {}, env)
      expect(res.status).toBe(200)
    }
    expect(ops).toBe(0)
  })
})
