// /api/me — the authenticated user's own preferences row.
//
// First real cross-device data: HomeMobile (and Onboarding) read/write
// these via the typed API client. Coach voice, palette/font/density,
// target sitting, and daily minutes all live here.

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { getDb } from '../db/client'
import { users } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

export const meRoute = new Hono<{ Bindings: Env; Variables: Vars }>()

// GET /api/me/prefs — current user prefs. Lazy-creates the row.
meRoute.get('/prefs', async (c) => {
  const db = getDb(c.env.DB)
  const id = await ensureUserRow(db, c.var.userId)
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!row) return c.json({ error: { code: 'not_found', message: 'User row missing' } }, 500)
  return c.json({ prefs: row })
})

// PATCH /api/me/prefs — partial update. Validates each field's enum.
const PrefsPatch = z
  .object({
    daysToExam: z.number().int().min(0).max(2000).nullable().optional(),
    dailyMinutes: z.number().int().min(5).max(240).optional(),
    targetSittingId: z.string().min(1).max(40).nullable().optional(),
    coach: z.enum(['kompis', 'professor', 'taktiker']).optional(),
    palette: z.enum(['sand', 'sage', 'ink', 'rose']).optional(),
    mode: z.enum(['light', 'dark']).optional(),
    font: z.enum(['literary', 'geometric', 'editorial', 'hyperlegible']).optional(),
    density: z.enum(['compact', 'regular', 'comfy']).optional(),
    showStreak: z.boolean().optional(),
  })
  .strict()

meRoute.patch('/prefs', zValidator('json', PrefsPatch), async (c) => {
  const patch = c.req.valid('json')
  const db = getDb(c.env.DB)
  const id = await ensureUserRow(db, c.var.userId)
  const [row] = await db.update(users).set(patch).where(eq(users.id, id)).returning()
  return c.json({ prefs: row })
})
