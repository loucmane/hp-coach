// /api/me — the authenticated user's own preferences row + stats.
//
// First real cross-device data: HomeMobile (and Onboarding) read/write
// prefs via the typed API client. Coach voice, palette/font/density,
// target sitting, and daily minutes all live here. The /stats sub-
// route powers /progress and the home-screen streak badge.
//
// Chained route registration is required for Hono RPC types to flow
// through to the SPA's typed client.

import { zValidator } from '@hono/zod-validator'
import { and, count, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { attempts, mistakes, sessions, users } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import { currentStreak } from '../lib/stats'
import type { Env, Vars } from '../types'

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

export const meRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // GET /api/me/prefs — current user prefs. Lazy-creates the row.
  .get('/prefs', async (c) => {
    const db = getDb(c.env.DB)
    const id = await ensureUserRow(db, c.var.userId)
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!row) return c.json({ error: { code: 'not_found', message: 'User row missing' } }, 500)
    return c.json({ prefs: row })
  })
  // PATCH /api/me/prefs — partial update. Each field validated with Zod.
  .patch('/prefs', zValidator('json', PrefsPatch), async (c) => {
    const patch = c.req.valid('json')
    const db = getDb(c.env.DB)
    const id = await ensureUserRow(db, c.var.userId)
    const [row] = await db.update(users).set(patch).where(eq(users.id, id)).returning()
    return c.json({ prefs: row })
  })

  // GET /api/me/stats — aggregate progress numbers for /progress and
  // the home-screen streak badge.
  //
  // Cost: ~7 D1 queries — all cheap COUNT/SUM aggregations on indexed
  // user_id columns. We could fold them into one big SELECT with
  // CASE-when sums, but D1's HTTP cost dominates anyway and separate
  // queries read straightforwardly. Revisit only if /progress becomes
  // a hot path.
  //
  // Time windows are SERVER-clock UTC. Mismatched device clocks would
  // otherwise let a user "today" twice by jumping timezones. The
  // streak helper documents the same calendar choice in stats.ts.
  .get('/stats', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setUTCHours(0, 0, 0, 0)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60_000)

    // Attempts: total, today, this-week, plus correct-count for accuracy.
    const [attemptsTotalRow] = await db
      .select({ c: count() })
      .from(attempts)
      .where(eq(attempts.userId, userId))
    const [attemptsTodayRow] = await db
      .select({ c: count() })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), gte(attempts.createdAt, todayStart)))
    const [attemptsWeekRow] = await db
      .select({ c: count() })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), gte(attempts.createdAt, weekStart)))
    const [accuracyRow] = await db
      .select({
        total: count(),
        // SQLite stores booleans as 0/1; SUM gives us the correct count.
        correct: sql<number>`coalesce(sum(${attempts.correct}), 0)`,
      })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), gte(attempts.createdAt, weekStart)))

    // Drills: total + this-week. Filter by kind='drill' so adaptive_review
    // sessions don't inflate the "drills done" number.
    const [drillsTotalRow] = await db
      .select({ c: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.kind, 'drill')))
    const [drillsWeekRow] = await db
      .select({ c: count() })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.kind, 'drill'),
          gte(sessions.startedAt, weekStart),
        ),
      )

    // Mistakes: split by status. "due" further filters by SRS schedule.
    const [activeRow] = await db
      .select({ c: count() })
      .from(mistakes)
      .where(and(eq(mistakes.userId, userId), eq(mistakes.status, 'active')))
    const dueClause = or(isNull(mistakes.nextReviewAt), lte(mistakes.nextReviewAt, now))
    const dueConds = dueClause
      ? [eq(mistakes.userId, userId), eq(mistakes.status, 'active'), dueClause]
      : [eq(mistakes.userId, userId), eq(mistakes.status, 'active')]
    const [dueRow] = await db
      .select({ c: count() })
      .from(mistakes)
      .where(and(...dueConds))
    const [resolvedRow] = await db
      .select({ c: count() })
      .from(mistakes)
      .where(and(eq(mistakes.userId, userId), eq(mistakes.status, 'resolved')))

    // Streak: distinct activity days, descending. We cap at 90 because
    // the longest practical streak is bounded by exam-prep windows and
    // anything past that is decoration.
    const dayRows = await db
      .select({
        day: sql<string>`date(${attempts.createdAt}, 'unixepoch')`,
      })
      .from(attempts)
      .where(eq(attempts.userId, userId))
      .groupBy(sql`date(${attempts.createdAt}, 'unixepoch')`)
      .orderBy(sql`date(${attempts.createdAt}, 'unixepoch') desc`)
      .limit(90)
    const streakDays = currentStreak(
      dayRows.map((r) => r.day),
      now,
    )

    const accuracyTotal = accuracyRow?.total ?? 0
    const accuracyCorrect = accuracyRow?.correct ?? 0
    const accuracy7d = accuracyTotal > 0 ? accuracyCorrect / accuracyTotal : null

    return c.json({
      stats: {
        attempts: {
          total: attemptsTotalRow?.c ?? 0,
          today: attemptsTodayRow?.c ?? 0,
          thisWeek: attemptsWeekRow?.c ?? 0,
        },
        drills: {
          total: drillsTotalRow?.c ?? 0,
          thisWeek: drillsWeekRow?.c ?? 0,
        },
        mistakes: {
          active: activeRow?.c ?? 0,
          due: dueRow?.c ?? 0,
          resolved: resolvedRow?.c ?? 0,
        },
        accuracy7d,
        streakDays,
      },
    })
  })
