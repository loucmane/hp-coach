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

const STATS_KEY = ['me', 'stats'] as const

export type WeeklyBucket = {
  /** Unix-ms timestamp of the bucket's start. */
  weekStart: number
  attempts: number
  correct: number
}

export type Stats = {
  attempts: { total: number; today: number; thisWeek: number }
  drills: { total: number; thisWeek: number }
  mistakes: { active: number; due: number; resolved: number }
  /** 0–1 ratio over attempts in the last 7 days; null if zero attempts. */
  accuracy7d: number | null
  streakDays: number
  /** Per-section rolling-90d aggregates that feed lib/scoring.ts.
   *  Worker computes these from raw attempts; the SPA computes the
   *  derived score / trend / weakness ranking in lib/scoring.ts. */
  bySection: Record<Section, SectionStats>
  /** 12-week rolling buckets, oldest first. Drives the trend chart. */
  weekly: WeeklyBucket[]
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
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
