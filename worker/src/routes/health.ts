// /health — liveness probe. Public, no auth.
//
// Returns environment + a fresh DB SELECT 1 round-trip so deploys can
// distinguish "Worker is up" from "Worker is up and D1 is reachable".

import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { getDb } from '../db/client'
import type { Env } from '../types'

export const healthRoute = new Hono<{ Bindings: Env }>()

healthRoute.get('/', async (c) => {
  const startedAt = Date.now()
  let dbOk = false
  try {
    const db = getDb(c.env.DB)
    const result = await db.run(sql`SELECT 1 as one`)
    dbOk = result !== null
  } catch {
    dbOk = false
  }
  return c.json({
    status: dbOk ? 'ok' : 'degraded',
    environment: c.env.ENVIRONMENT,
    db: dbOk,
    latencyMs: Date.now() - startedAt,
  })
})
