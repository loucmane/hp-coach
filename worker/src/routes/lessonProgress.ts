// /api/lesson-progress — a per-section reading bookmark.
//
// Lessons are a read-only reference surface (no attempts, no natural
// "end"), so they're NOT modelled as sessions — that left zombie active
// rows. This is a bookmark: one row per (user, section), upserted in
// place as the reader opens entries. It feeds the Home resumption panel's
// cross-device "fortsätt läsa" offer alongside the active sessions.
//
// The bookmark also carries the lesson-step resume (LJ-12, rebuild map §2):
// `step` is the step of the 5-step lesson the reader is on ("steg 2 av 5"),
// and `guess` is the option they chose in "Gissa först". Both are optional,
// so a client that sends neither keeps working.
//
//   - PUT /   → upsert { section, frameworkId?, device?, step?, guess? }
//               for this user
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
    // The lesson step, 1–5, and the "Gissa först" option, a–e. Null or absent
    // means none, as on every bookmark from before the columns.
    step: z.number().int().min(1).max(5).nullable().optional(),
    guess: z.enum(['a', 'b', 'c', 'd', 'e']).nullable().optional(),
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
  //
  // Each PUT replaces the whole bookmark, the step and guess included: a PUT
  // that leaves them out stores null, just as it does for frameworkId. That
  // way a step can never outlive the entry it was taken on.
  .put('/', zValidator('json', PutBody), async (c) => {
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const now = new Date()
    const bookmark = {
      frameworkId: body.frameworkId ?? null,
      device: body.device ?? null,
      step: body.step ?? null,
      guess: body.guess ?? null,
      updatedAt: now,
    }
    const [row] = await db
      .insert(lessonProgress)
      .values({ userId, section: body.section, ...bookmark })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.section],
        set: bookmark,
      })
      .returning()
    return c.json({ progress: row })
  })
