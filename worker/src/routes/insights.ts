// Read-only Ljusbord insights. These are live 120-day aggregates, not durable
// result snapshots; old Provpass results use mock_results.breakdown instead.
import { zValidator } from '@hono/zod-validator'
import { and, asc, eq, gte, inArray, isNotNull, lte, ne, type SQL, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { type Db, getDb } from '../db/client'
import { attempts, CONFIDENCE_LEVELS, type Confidence, sessions, users } from '../db/schema'
import {
  answeredAt,
  firstTryAggregates,
  firstTryHistory,
  type KindedAnswer,
} from '../lib/firstTries'
import { retentionCutoff } from '../lib/retention'
import { extractSection, type Section } from '../lib/section'
import { formatDayUTC, startOfUtcDay } from '../lib/stats'
import type { Env, Vars } from '../types'

const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS
// Seventeen UTC weeks (including this one) fit inside the 120-day retention
// window, even on Sunday. Do not expose a misleading partial eighteenth week.
const TempoQuery = z.object({ weeks: z.coerce.number().int().min(1).max(17).default(9) })
const OutcomesQuery = z.object({ sessionId: z.coerce.number().int().positive().safe().optional() })
const PrognosisWeeklyQuery = z.object({
  weeks: z.coerce.number().int().min(1).max(26).default(12),
})

async function userIdFor(db: Db, clerkUserId: string): Promise<number | undefined> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)
  // A first visit has empty insights. Unlike mutation routes, this needs no
  // lazy user-row upsert: every query in this module is a SELECT.
  return user?.id
}

function retained(userId: number, now: Date) {
  return and(
    eq(attempts.userId, userId),
    eq(sessions.userId, userId),
    gte(attempts.createdAt, retentionCutoff(now)),
    lte(attempts.createdAt, now),
  )
}

function history(db: Db, userId: number, now: Date, filter?: SQL) {
  return db
    .select({
      sessionId: attempts.sessionId,
      questionId: attempts.questionId,
      correct: attempts.correct,
      timeTakenMs: attempts.timeTakenMs,
      createdAt: attempts.createdAt,
      kind: sessions.kind,
      sections: sessions.sections,
    })
    .from(attempts)
    .innerJoin(sessions, eq(sessions.id, attempts.sessionId))
    .where(and(retained(userId, now), filter))
    .orderBy(asc(attempts.createdAt), asc(attempts.id))
}

function mondayUTC(date: Date): Date {
  const day = startOfUtcDay(date)
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7))
  return day
}

function isoWeek(date: Date): string {
  const monday = mondayUTC(date)
  // The Thursday decides an ISO week's year, including at New Year.
  const year = new Date(+monday + 3 * DAY_MS).getUTCFullYear()
  const firstMonday = mondayUTC(new Date(Date.UTC(year, 0, 4)))
  const week = 1 + Math.round((+monday - +firstMonday) / WEEK_MS)
  return `${year}-W${String(week).padStart(2, '0')}`
}

type Pace = { n: number; p25: number; median: number; p75: number }

/** Linear interpolation over sorted seconds: rank = (n - 1) * p. */
function pace(seconds: number[]): Pace {
  seconds.sort((a, b) => a - b)
  const percentile = (p: number) => {
    const rank = (seconds.length - 1) * p
    const low = Math.floor(rank)
    return seconds[low] + (seconds[Math.ceil(rank)] - seconds[low]) * (rank - low)
  }
  return {
    n: seconds.length,
    p25: percentile(0.25),
    median: percentile(0.5),
    p75: percentile(0.75),
  }
}

function validTime(ms: number | null): ms is number {
  return ms !== null && Number.isFinite(ms) && ms >= 0
}

export const insightsRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // {since, levels:{gissar,tror,saker:{n,correct}}, verdictAt:20}.
  // Use the existing owner-approved confidence vocabulary (LJ-12). There is
  // deliberately no rate or verdict; the client owns the evidence threshold.
  .get('/calibration', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await userIdFor(db, c.var.userId)
    const levels: Record<Confidence, { n: number; correct: number }> = {
      gissar: { n: 0, correct: 0 },
      tror: { n: 0, correct: 0 },
      saker: { n: 0, correct: 0 },
    }
    let since: string | null = null
    if (userId !== undefined) {
      const rows = await db
        .select({
          confidence: attempts.confidence,
          n: sql<number>`count(*)`,
          correct: sql<number>`sum(case when ${attempts.correct} = 1 then 1 else 0 end)`,
          first: sql<number>`min(${attempts.createdAt})`,
        })
        .from(attempts)
        .innerJoin(sessions, eq(sessions.id, attempts.sessionId))
        .where(
          and(
            retained(userId, new Date()),
            ne(sessions.kind, 'mock'),
            inArray(attempts.confidence, CONFIDENCE_LEVELS),
            isNotNull(attempts.correct),
          ),
        )
        .groupBy(attempts.confidence)
      for (const row of rows) {
        if (row.confidence === null) continue
        levels[row.confidence] = { n: Number(row.n), correct: Number(row.correct) }
        const first = new Date(Number(row.first) * 1000).toISOString()
        if (since === null || first < since) since = first
      }
    }
    return c.json({ since, levels, verdictAt: 20 })
  })
  // {weeks:[{iso, bySection:{ORD:{n,p25,median,p75}}}]} — all times in
  // SECONDS. Includes empty weeks; an absent section has no timing evidence.
  .get('/tempo', zValidator('query', TempoQuery), async (c) => {
    const { weeks: count } = c.req.valid('query')
    const now = new Date()
    const firstMonday = +mondayUTC(now) - (count - 1) * WEEK_MS
    const buckets = new Map<string, Map<Section, number[]>>()
    for (let i = 0; i < count; i++) {
      buckets.set(isoWeek(new Date(firstMonday + i * WEEK_MS)), new Map())
    }
    const db = getDb(c.env.DB)
    const userId = await userIdFor(db, c.var.userId)
    if (userId !== undefined) {
      // Read retained mock picks BEFORE clipping to requested weeks, so a
      // Sunday/Monday revisit carries its entire dwell into its latest week.
      const rows = await history(
        db,
        userId,
        now,
        // Match the exact timed marker in JS below: SQLite upper() only
        // folds ASCII, so it cannot normalize the Swedish letters in PÅ TID.
        inArray(sessions.kind, ['mock', 'drill']),
      )
      type Sample = { section: Section; at: Date; ms: number | null }
      const mocks = new Map<string, Sample>()
      const add = ({ section, at, ms }: Sample) => {
        if (!validTime(ms)) return
        const bucket = buckets.get(isoWeek(at))
        if (!bucket) return
        const seconds = bucket.get(section) ?? []
        seconds.push(ms / 1000)
        bucket.set(section, seconds)
      }
      for (const row of rows) {
        const section = extractSection(row.questionId)
        if (!section || !row.createdAt) continue
        const ms = validTime(row.timeTakenMs) ? row.timeTakenMs : null
        if (row.kind === 'mock') {
          const key = `${row.sessionId}:${row.questionId}`
          const prior = mocks.get(key)
          mocks.set(key, {
            section,
            at: row.createdAt,
            // If any dwell is unknown, the question's total is unknown.
            ms: prior ? (prior.ms !== null && ms !== null ? prior.ms + ms : null) : ms,
          })
        } else if (row.sections?.toUpperCase() === `${section} · PÅ TID`) {
          add({ section, at: row.createdAt, ms })
        }
      }
      for (const sample of mocks.values()) add(sample)
    }
    const weeks = [...buckets].map(([iso, samples]) => ({
      iso,
      bySection: Object.fromEntries(
        [...samples].map(([section, seconds]) => [section, pace(seconds)]),
      ),
    }))
    return c.json({ weeks })
  })
  // A qid-keyed {n,right,rightDays} map. Optional sessionId uses the same
  // shape, returns 404 for a missing/foreign session, and never leaks its data.
  .get('/outcomes', zValidator('query', OutcomesQuery), async (c) => {
    const { sessionId } = c.req.valid('query')
    const db = getDb(c.env.DB)
    const userId = await userIdFor(db, c.var.userId)
    const outcomes = new Map<string, { n: number; right: number; days: Set<string> }>()
    if (sessionId !== undefined) {
      const [session] =
        userId === undefined
          ? []
          : await db
              .select({ id: sessions.id })
              .from(sessions)
              .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
              .limit(1)
      if (!session) {
        return c.json({ error: { code: 'not_found', message: 'Session not found' } }, 404)
      }
    }
    if (userId !== undefined) {
      const rows = await history(
        db,
        userId,
        new Date(),
        sessionId === undefined ? undefined : eq(attempts.sessionId, sessionId),
      )
      const mockAnswers = new Map<string, (typeof rows)[number]>()
      const add = (row: (typeof rows)[number]) => {
        if (row.correct === null || row.createdAt === null) return
        const entry = outcomes.get(row.questionId) ?? { n: 0, right: 0, days: new Set<string>() }
        entry.n++
        if (row.correct) {
          entry.right++
          entry.days.add(formatDayUTC(row.createdAt))
        }
        outcomes.set(row.questionId, entry)
      }
      for (const row of rows) {
        if (row.kind === 'mock') mockAnswers.set(`${row.sessionId}:${row.questionId}`, row)
        else add(row)
      }
      for (const row of mockAnswers.values()) add(row)
    }
    return c.json(
      Object.fromEntries(
        [...outcomes].map(([qid, { n, right, days }]) => [qid, { n, right, rightDays: days.size }]),
      ),
    )
  })
  // {weeks:[{iso, end, bySection:{ORD:{firstTry7d,…,firstTryCorrect90d}}}]},
  // oldest first: the honest prognosis's inputs, every section's
  // /me/stats?firstTry=1 aggregates as they stood at `end`. A past week ends
  // at the next Monday 00:00 UTC and counts only the answers given before
  // then. The current week has not ended, so it is /me/stats?firstTry=1 now:
  // the same history, the same call. A week before the first answer is all
  // zero; a quiet week keeps the prognosis it ended on. Ledger evidence
  // survives retention; only questions without a ledger use retained answers.
  .get('/prognosis-weekly', zValidator('query', PrognosisWeeklyQuery), async (c) => {
    const { weeks: count } = c.req.valid('query')
    const now = new Date()
    const firstMonday = +mondayUTC(now) - (count - 1) * WEEK_MS
    const db = getDb(c.env.DB)
    const userId = await userIdFor(db, c.var.userId)
    const history: KindedAnswer[] = userId === undefined ? [] : await firstTryHistory(db, userId)
    const weeks = Array.from({ length: count }, (_, i) => {
      const monday = firstMonday + i * WEEK_MS
      const current = i === count - 1
      const end = current ? now : new Date(monday + WEEK_MS)
      const held = current ? history : history.filter((a) => answeredAt(a) < +end)
      return {
        iso: isoWeek(new Date(monday)),
        end: end.toISOString(),
        bySection: firstTryAggregates(held, end),
      }
    })
    return c.json({ weeks })
  })
