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
import { extractSection, SECTIONS, type Section } from '../lib/section'
import { currentStreak, formatDayUTC, startOfUtcDay } from '../lib/stats'
import type { Env, Vars } from '../types'

const PrefsPatch = z
  .object({
    daysToExam: z.number().int().min(0).max(2000).nullable().optional(),
    dailyMinutes: z.number().int().min(5).max(240).optional(),
    targetSittingId: z.string().min(1).max(40).nullable().optional(),
    coach: z.enum(['kompis', 'professor', 'taktiker']).optional(),
    palette: z.enum(['sand', 'sage', 'ink', 'rose', 'spalt']).optional(),
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
    const todayStart = startOfUtcDay(now)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60_000)

    // Lifetime totals come from the O(1) counters on the user row, not a
    // count(*) over attempts/sessions — so they stay correct (and cheap)
    // after the retention cron prunes old rows. See lib/retention.ts.
    const [counters] = await db
      .select({ attemptsTotal: users.attemptsTotal, drillsTotal: users.drillsTotal })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const attemptsTotal = counters?.attemptsTotal ?? 0
    const drillsTotal = counters?.drillsTotal ?? 0

    // Attempts: today, this-week, plus correct-count for accuracy (windowed
    // reads — these stay on the attempts table, served by the (user,
    // created_at) index, within the retention window).
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

    // Drills: this-week (windowed). The all-time total is the counter
    // above (drillsTotal), so this no longer scans every drill row.
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

    // Per-section breakdown for the score model. Pull the rolling-90d
    // window of attempts in one go and aggregate in TS — cheaper than
    // 8 sections × 4 window queries against SQLite, and we don't have
    // a section column on the attempts table yet (B5 follow-up). For
    // a single dogfood user the row count is in the hundreds; comfortable.
    const ninetyDayStart = new Date(now.getTime() - 90 * 24 * 60 * 60_000)
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60_000)
    const recentAttempts = await db
      .select({
        questionId: attempts.questionId,
        correct: attempts.correct,
        timeTakenMs: attempts.timeTakenMs,
        createdAt: attempts.createdAt,
      })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), gte(attempts.createdAt, ninetyDayStart)))

    type SectionAgg = {
      attempts7d: number
      correct7d: number
      attempts7to14d: number
      correct7to14d: number
      attempts90d: number
      correct90d: number
      timeMsSum: number
      timeMsCount: number
      lastAttemptedAt: number | null
      attemptsToday: number
    }
    const seed = (): SectionAgg => ({
      attempts7d: 0,
      correct7d: 0,
      attempts7to14d: 0,
      correct7to14d: 0,
      attempts90d: 0,
      correct90d: 0,
      timeMsSum: 0,
      timeMsCount: 0,
      lastAttemptedAt: null,
      attemptsToday: 0,
    })
    const bySectionAgg: Record<Section, SectionAgg> = Object.fromEntries(
      SECTIONS.map((s) => [s, seed()]),
    ) as Record<Section, SectionAgg>

    for (const a of recentAttempts) {
      const section = extractSection(a.questionId)
      if (!section) continue
      const ts = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      const correct = a.correct ? 1 : 0
      const agg = bySectionAgg[section]
      agg.attempts90d += 1
      agg.correct90d += correct
      if (a.timeTakenMs != null && a.timeTakenMs > 0) {
        agg.timeMsSum += a.timeTakenMs
        agg.timeMsCount += 1
      }
      if (agg.lastAttemptedAt == null || ts > agg.lastAttemptedAt) {
        agg.lastAttemptedAt = ts
      }
      if (ts >= weekStart.getTime()) {
        agg.attempts7d += 1
        agg.correct7d += correct
      } else if (ts >= prevWeekStart.getTime()) {
        agg.attempts7to14d += 1
        agg.correct7to14d += correct
      }
      // Same-UTC-day monotonic counter — backs the section-drill
      // completion gate. Unlike attempts7d (a rolling window that can
      // DROP overnight as old attempts age out, flipping a finished
      // drill back to incomplete intraday), this only grows across the
      // UTC day and resets cleanly at the next UTC midnight. See
      // startOfUtcDay's docstring for the UTC-anchoring tradeoff.
      if (ts >= todayStart.getTime()) {
        agg.attemptsToday += 1
      }
    }

    const bySection: Record<
      Section,
      {
        attempts7d: number
        correct7d: number
        attempts7to14d: number
        correct7to14d: number
        attempts90d: number
        correct90d: number
        avgTimeMs: number | null
        lastAttemptedAt: number | null
        attemptsToday: number
      }
    > = Object.fromEntries(
      SECTIONS.map((s) => {
        const agg = bySectionAgg[s]
        return [
          s,
          {
            attempts7d: agg.attempts7d,
            correct7d: agg.correct7d,
            attempts7to14d: agg.attempts7to14d,
            correct7to14d: agg.correct7to14d,
            attempts90d: agg.attempts90d,
            correct90d: agg.correct90d,
            avgTimeMs: agg.timeMsCount > 0 ? Math.round(agg.timeMsSum / agg.timeMsCount) : null,
            lastAttemptedAt: agg.lastAttemptedAt,
            attemptsToday: agg.attemptsToday,
          },
        ]
      }),
    ) as never

    // Weekly time-series for the trend chart. 12 weeks back, indexed
    // 0 = oldest, 11 = current. Each bucket is a Sunday-anchored ISO
    // week boundary (UTC). When a week has zero attempts, score is
    // null and the SVG renderer skips the point.
    const WEEK_MS = 7 * 24 * 60 * 60_000
    const WEEKS = 12
    type WeeklyBucket = { weekStart: number; attempts: number; correct: number }
    const weekly: WeeklyBucket[] = []
    for (let i = WEEKS - 1; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * WEEK_MS)
      weekly.push({ weekStart: start.getTime(), attempts: 0, correct: 0 })
    }
    for (const a of recentAttempts) {
      const ts = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      // Find bucket index. weekly[0] starts WEEKS weeks ago. Anything
      // older falls outside the 12w window — skip.
      const weeksAgo = Math.floor((now.getTime() - ts) / WEEK_MS)
      if (weeksAgo < 0 || weeksAgo >= WEEKS) continue
      const idx = WEEKS - 1 - weeksAgo
      weekly[idx].attempts += 1
      if (a.correct) weekly[idx].correct += 1
    }

    // Daily attempt counts for the /progress consistency heatmap.
    // 84 days back (12 weeks × 7), keyed by UTC YYYY-MM-DD. Each entry
    // splits the count along the verbal/quant exam axis so the
    // heatmap can render two stacked strips — the HP-specific move
    // that flattens to one ramp would otherwise.
    const DAY_MS = 24 * 60 * 60_000
    const DAYS = 84
    const VERBAL = new Set<Section>(['ORD', 'LÄS', 'MEK', 'ELF'])
    type DailyBucket = { date: string; n: number; verbal: number; quant: number }
    const dailyByDate = new Map<string, DailyBucket>()
    // Pre-seed all 84 days so gap days surface as `n: 0` instead of
    // missing entries — the heatmap needs every cell rendered.
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY_MS)
      const ymd = formatDayUTC(d)
      dailyByDate.set(ymd, { date: ymd, n: 0, verbal: 0, quant: 0 })
    }
    for (const a of recentAttempts) {
      const ts = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      const daysAgo = Math.floor((now.getTime() - ts) / DAY_MS)
      if (daysAgo < 0 || daysAgo >= DAYS) continue
      const section = extractSection(a.questionId)
      if (!section) continue
      const d = new Date(ts)
      const ymd = formatDayUTC(d)
      const bucket = dailyByDate.get(ymd)
      if (!bucket) continue
      bucket.n += 1
      if (VERBAL.has(section)) bucket.verbal += 1
      else bucket.quant += 1
    }
    const attemptsDaily: DailyBucket[] = Array.from(dailyByDate.values())

    return c.json({
      stats: {
        attempts: {
          total: attemptsTotal,
          today: attemptsTodayRow?.c ?? 0,
          thisWeek: attemptsWeekRow?.c ?? 0,
        },
        drills: {
          total: drillsTotal,
          thisWeek: drillsWeekRow?.c ?? 0,
        },
        mistakes: {
          active: activeRow?.c ?? 0,
          due: dueRow?.c ?? 0,
          resolved: resolvedRow?.c ?? 0,
        },
        accuracy7d,
        streakDays,
        bySection,
        weekly,
        attemptsDaily,
      },
    })
  })
