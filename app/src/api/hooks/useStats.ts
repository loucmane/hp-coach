// /api/me/stats — aggregate progress numbers for /progress and the
// home-screen streak badge.
//
// Refetch on focus + every 60s while focused. The numbers don't move
// per-keystroke (they're derived from session/attempt rows) so a
// minute is generous — but a longer interval would let the home
// streak badge stay stale across an entire study session.

import { useQuery } from '@tanstack/react-query'

import type { Section } from '@/data/questions'
import type { SectionStats } from '@/lib/scoring'

import { useApiClient } from '../useApiClient'

export const STATS_KEY = ['me', 'stats'] as const

export type WeeklyBucket = {
  /** Unix-ms timestamp of the bucket's start. */
  weekStart: number
  attempts: number
  correct: number
}

/** P5 practice accuracy, reported apart from every authentic number:
 *  registered P5 answers over the last 90 and 7 days. */
export type PracticeSynthetic = {
  attempts90d: number
  correct90d: number
  attempts7d: number
  correct7d: number
}

// Provenance (P5 infold PR 3, docs/p5-infold-design.md §E): the worker
// classifies every attempt authentic / synthetic (P5 practice) / unknown.
// accuracy7d, the bySection score inputs and `weekly` read authentic answers
// only; attempts, timeMsToday, streakDays, attemptsDaily and
// bySection.attemptsToday are practice effort and count every answer.
export type Stats = {
  attempts: { total: number; today: number; thisWeek: number }
  drills: { total: number; thisWeek: number }
  mistakes: { active: number; due: number; resolved: number }
  /** 0–1 ratio over AUTHENTIC attempts in the last 7 days; null if none. */
  accuracy7d: number | null
  streakDays: number
  /** Exact sum of timeTakenMs over today's (UTC) attempts — backs the
   *  Home "minuter idag" elapsed counter. Optional during the worker
   *  rollout window; lib/scoring's minutesPracticedToday falls back to
   *  a per-section attemptsToday × avgTimeMs estimate when absent. */
  timeMsToday?: number
  /** Per-section rolling-90d aggregates that feed lib/scoring.ts.
   *  Worker computes these from raw attempts; the SPA computes the
   *  derived score / trend / weakness ranking in lib/scoring.ts. */
  bySection: Record<Section, SectionStats>
  /** 12-week rolling buckets, oldest first. Drives the trend chart. */
  weekly: WeeklyBucket[]
  /** Per-day attempt counts for the last 84 days, oldest first. Drives
   *  the consistency heatmap on /progress. Each entry's `n` is the
   *  total attempts that day; `verbal` and `quant` split it along the
   *  exam's two-halves axis. Pre-seeded with `n: 0` entries for gap
   *  days so the heatmap never has missing cells. Optional during the
   *  worker rollout window — components fall back to an empty grid
   *  when missing. */
  attemptsDaily?: AttemptsDailyBucket[]
  /** P5 practice accuracy, never merged into accuracy7d or a score.
   *  Optional: a worker without P5 provenance does not send it. */
  practiceSynthetic?: PracticeSynthetic
}

export type AttemptsDailyBucket = {
  /** UTC YYYY-MM-DD. */
  date: string
  /** Total attempts that day. */
  n: number
  /** Attempts in ORD / LÄS / MEK / ELF. */
  verbal: number
  /** Attempts in XYZ / KVA / NOG / DTK. */
  quant: number
}

export function useStats() {
  const api = useApiClient()
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: async (): Promise<Stats> => {
      const res = await api.api.me.stats.$get()
      if (!res.ok) {
        throw new Error(`GET /api/me/stats failed: ${res.status}`)
      }
      const body = await res.json()
      return body.stats as Stats
    },
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
  })
}
