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

function makeApp(environment: Env['ENVIRONMENT'], kv: Env['RATE_LIMIT']) {
  const app = new Hono<{ Bindings: Env; Variables: Vars }>()
  app.use('*', async (c, next) => {
    c.set('userId', 42 as never)
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

  it('still limits in staging once the bucket is exhausted', async () => {
    const counts = new Map<string, string>()
    const { app, env } = makeApp('staging', makeKv(counts))
    let limited = 0
    for (let i = 0; i < 70; i++) {
      const res = await app.request('/api/thing', {}, env)
      if (res.status === 429) limited++
    }
    expect(limited).toBe(10)
  })
})
