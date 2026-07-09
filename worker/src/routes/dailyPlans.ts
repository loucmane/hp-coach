// /api/daily-plans — the per-day plan baseline, server-authoritative.
//
// The localStorage `hpc-daily-plan-<date>` blob is the fast-path/offline
// cache; this table is the cross-device baseline so both devices adopt the
// SAME generated plan for a local date (first-generator-wins). Flow the
// SPA drives:
//   - GET /:date  BEFORE generating — if a row exists, adopt it verbatim.
//   - PUT /:date  after a local generation (adopt-or-overwrite). On a
//     genuine conflict (server row already exists) the SPA re-reads and
//     the server wins; "Generera om" intentionally overwrites via PUT.
//
// `plan` is stored/returned verbatim as the client's DailyPlan JSON blob
// (items + attemptsSnapshot + totalAttemptsSnapshot + version), so all
// completion derivation stays client-side and unchanged — only the
// storage location moved. This SUBSUMES any plan_completions concept.

import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { dailyPlans } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

// YYYY-MM-DD local-date, matching the client's localDateString keying.
const DateParam = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })

// The plan blob is opaque to the server — it's the client's DailyPlan
// shape and evolves under PLAN_SCHEMA_VERSION on the client. We only
// require it to be a JSON object so we never persist a primitive/garbage.
const PutBody = z.object({ plan: z.record(z.unknown()) }).strict()

export const dailyPlansRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // GET /api/daily-plans/:date — this user's plan for that local date, or
  // null. The client calls this BEFORE generating so a plan authored on
  // another device is adopted rather than re-rolled.
  .get('/:date', zValidator('param', DateParam), async (c) => {
    const { date } = c.req.valid('param')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const [row] = await db
      .select({ plan: dailyPlans.plan })
      .from(dailyPlans)
      .where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.date, date)))
      .limit(1)
    return c.json({ plan: row ? row.plan : null })
  })

  // PUT /api/daily-plans/:date — upsert the plan for this user+date. The
  // unique index on (user_id, date) makes first-generator-wins a plain
  // upsert: the first device inserts; a later PUT (adoption re-save or
  // "Generera om") updates in place. The SPA reconciles conflicts by
  // GETting first and adopting the server row when present.
  .put('/:date', zValidator('param', DateParam), zValidator('json', PutBody), async (c) => {
    const { date } = c.req.valid('param')
    const { plan } = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const now = new Date()
    await db
      .insert(dailyPlans)
      .values({ userId, date, plan, updatedAt: now })
      .onConflictDoUpdate({
        target: [dailyPlans.userId, dailyPlans.date],
        set: { plan, updatedAt: now },
      })
    return c.json({ ok: true as const, date, plan })
  })
