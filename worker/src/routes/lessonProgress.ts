// /api/lesson-progress — a per-section reading bookmark.
//
// Lessons are a read-only reference surface (no attempts, no natural
// "end"), so they're NOT modelled as sessions — that left zombie active
// rows. This is a bookmark: one row per (user, section), upserted in
// place as the reader opens entries. It feeds the Home resumption panel's
// cross-device "fortsätt läsa" offer alongside the active sessions.
//
//   - PUT /   → upsert { section, frameworkId?, device? } for this user
//   - GET /   → the freshest bookmark (most recently updated), or null

import { zValidator } from '@hono/zod-validator'
import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { DEVICE_KINDS, lessonProgress } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const PutBody = z
  .object({
    section: z.string().min(1).max(20),
    frameworkId: z.string().min(1).max(80).nullable().optional(),
    device: z.enum(DEVICE_KINDS).optional(),
  })
  .strict()

export const lessonProgressRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // GET /api/lesson-progress — the freshest reading bookmark, or null.
  .get('/', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const [row] = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId))
      .orderBy(desc(lessonProgress.updatedAt))
      .limit(1)
    return c.json({ progress: row ?? null })
  })

  // PUT /api/lesson-progress — upsert the bookmark for one section. The
  // unique index on (user_id, section) makes this idempotent: the first
  // open inserts, later opens update the anchor + bump updatedAt in place
  // (no row churn). Mirrors the ON CONFLICT DO UPDATE pattern in ensureUser.
  .put('/', zValidator('json', PutBody), async (c) => {
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const now = new Date()
    const [row] = await db
      .insert(lessonProgress)
      .values({
        userId,
        section: body.section,
        frameworkId: body.frameworkId ?? null,
        device: body.device ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.section],
        set: {
          frameworkId: body.frameworkId ?? null,
          device: body.device ?? null,
          updatedAt: now,
        },
      })
      .returning()
    return c.json({ progress: row })
  })
