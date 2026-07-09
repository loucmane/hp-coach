// /api/lesson-reads — the cross-device READ SET for framework entries.
//
// Distinct from /api/lesson-progress (a single per-section last-opened
// BOOKMARK): this is the FULL set of framework entries the user has
// marked read, one row per (user, entry). The SPA's daily-plan scheduler
// consumes it for lesson-item completion AND the next-unread-entry hint,
// both of which were device-local (localStorage) before this endpoint.
// localStorage stays as a write-through / offline cache; this table is the
// cross-device source of truth reconciled on the next GET.
//
//   - GET    /            → { entryIds: string[] } — the full set for this user
//   - PUT    /            → mark { entryId } read (idempotent upsert)
//   - DELETE /:entryId    → unmark one entry

import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { lessonReads } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const PutBody = z
  .object({
    entryId: z.string().min(1).max(80),
  })
  .strict()

const EntryIdParam = z.object({ entryId: z.string().min(1).max(80) })

export const lessonReadsRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // GET /api/lesson-reads — the full set of read entry ids for this user.
  // Returns bare ids (not rows) — the client only needs set membership.
  .get('/', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const rows = await db
      .select({ entryId: lessonReads.entryId })
      .from(lessonReads)
      .where(eq(lessonReads.userId, userId))
    return c.json({ entryIds: rows.map((r) => r.entryId) })
  })

  // PUT /api/lesson-reads — mark one entry read. The unique index on
  // (user_id, entry_id) makes this idempotent: re-marking an already-read
  // entry is a no-op update, so an offline client replaying its cache can
  // PUT freely without duplicate rows.
  .put('/', zValidator('json', PutBody), async (c) => {
    const { entryId } = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const now = new Date()
    await db
      .insert(lessonReads)
      .values({ userId, entryId, readAt: now })
      .onConflictDoUpdate({
        target: [lessonReads.userId, lessonReads.entryId],
        // No-op-ish update so RETURNING/idempotency hold; refresh readAt.
        set: { readAt: now },
      })
    return c.json({ ok: true as const, entryId })
  })

  // DELETE /api/lesson-reads/:entryId — unmark one entry. Idempotent:
  // deleting an absent entry succeeds with removed:0.
  .delete('/:entryId', zValidator('param', EntryIdParam), async (c) => {
    const { entryId } = c.req.valid('param')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const removed = await db
      .delete(lessonReads)
      .where(and(eq(lessonReads.userId, userId), eq(lessonReads.entryId, entryId)))
      .returning({ id: lessonReads.id })
    return c.json({ ok: true as const, entryId, removed: removed.length })
  })
