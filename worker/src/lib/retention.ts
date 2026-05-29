// Attempts/sessions retention — keeps the append-only tables bounded.
//
// `attempts` grows one row per answered question, forever; at scale that's
// the table that eventually pressures D1's storage. We prune rows older
// than the longest read window. The lifetime totals the user sees live on
// the `users.attemptsTotal` / `drillsTotal` counters (incremented on each
// write), so pruning raw rows never changes a displayed number — it only
// reclaims space.
//
// Run from a daily Cron Trigger (see the `scheduled` handler in index.ts).
// Idempotent; safe to run repeatedly.

import { and, isNotNull, lt } from 'drizzle-orm'

import type { Db } from '../db/client'
import { attempts, sessions } from '../db/schema'

// Longest window any read touches is the rolling-90d section breakdown +
// the distinct-day streak (capped at 90). 120 days leaves comfortable
// headroom so a prune can never clip a live stat.
export const RETENTION_DAYS = 120

export function retentionCutoff(now: Date): Date {
  return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Delete attempts older than the retention window, and finished sessions
 * older than it. Only `endedAt`-not-null sessions are reaped — an old but
 * still-active session is never pruned out from under a resume.
 */
export async function runRetention(db: Db, now: Date = new Date()): Promise<{ cutoff: Date }> {
  const cutoff = retentionCutoff(now)
  await db.delete(attempts).where(lt(attempts.createdAt, cutoff))
  await db.delete(sessions).where(and(isNotNull(sessions.endedAt), lt(sessions.endedAt, cutoff)))
  return { cutoff }
}
