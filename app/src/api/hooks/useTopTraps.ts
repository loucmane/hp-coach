// useTopTraps — recent-misses grouped by framework_id.
//
// The DiagnosticReport surfaces the dominant trap from a single
// 10-question diagnostic ("X av dina missar tappade samma mönster").
// useTopTraps is the same idea but continuous: aggregate across the
// user's *due* miss queue so Home can surface the ongoing pattern
// signal every day, not just post-diagnostic.
//
// Approach:
//   1. Read `useDueMistakes()` — full active queue (capped at 500).
//   2. Load explanation for each mistake's qid (per-exam cached).
//   3. Group by framework_id, count.
//   4. Return the top N where count >= MIN_COUNT.
//
// Sections without rich-schema framework_id (MEK/DTK/LÄS/ELF/ORD)
// won't cluster — that's correct: there's no trap entry to deep-link.
// KVA/NOG/XYZ are backfilled.

import { useEffect, useMemo, useState } from 'react'

import { loadExplanation } from '@/data/explanations'
import type { Section } from '@/data/questions'
import { computeTrapTrend, recordTrapSnapshot, type TrapTrend } from '@/lib/trapHistory'

import { useDueMistakes } from './useMistakes'

export type TopTrap = {
  framework_id: string
  section: Section
  count: number
  /** tldr or pattern_description from the framework JSON; null when
   *  the framework file isn't loaded yet (or doesn't define one). */
  headline: string | null
  /** Week-over-week trend. Computed against a snapshot taken ~7 days
   *  ago (any in the [5, 10]-day band). `unknown` when there's no
   *  historical signal yet (cold start). */
  trend: TrapTrend
}

const FRAMEWORK_FILES: Record<string, string> = {
  KVA: '/frameworks/kva_traps.json',
  NOG: '/frameworks/nog_traps.json',
  XYZ: '/frameworks/xyz_traps.json',
}

const frameworkHeadlines = new Map<string, Promise<Record<string, string>>>()

async function loadFrameworkHeadlines(section: string): Promise<Record<string, string>> {
  const url = FRAMEWORK_FILES[section]
  if (!url) return {}
  let p = frameworkHeadlines.get(url)
  if (!p) {
    p = fetch(url)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{
              entries: Array<{ id: string; tldr?: string; pattern_description?: string }>
            }>)
          : null,
      )
      .then((data) => {
        const map: Record<string, string> = {}
        for (const e of data?.entries ?? []) {
          map[e.id] = e.tldr ?? e.pattern_description ?? ''
        }
        return map
      })
      .catch(() => ({}))
    frameworkHeadlines.set(url, p)
  }
  return p
}

function sectionFromFrameworkId(id: string): Section | null {
  const prefix = id.split('-', 1)[0]
  if (prefix === 'KVA' || prefix === 'NOG' || prefix === 'XYZ') return prefix
  return null
}

type UseTopTrapsOptions = {
  /** Maximum number of traps to return, sorted by count desc. */
  limit?: number
  /** Minimum miss count for a trap to qualify. Default 2 — a single
   *  miss isn't a pattern. */
  minCount?: number
}

export function useTopTraps(opts: UseTopTrapsOptions = {}): TopTrap[] {
  const { limit = 3, minCount = 2 } = opts
  const { data: mistakes } = useDueMistakes()
  const [traps, setTraps] = useState<TopTrap[]>([])

  // Memoize the qid array so we don't refetch on every parent re-render.
  // The TanStack Query background refetch (30s) is the right cadence —
  // we don't want to thrash the explanation loader cache.
  const qids = useMemo(() => (mistakes ?? []).map((m) => m.questionId), [mistakes])

  useEffect(() => {
    let alive = true
    if (qids.length === 0) {
      setTraps((prev) => (prev.length === 0 ? prev : []))
      return
    }
    void (async () => {
      const entries = await Promise.all(qids.map((qid) => loadExplanation(qid)))
      if (!alive) return
      // Count by framework_id.
      const counts = new Map<string, number>()
      for (const e of entries) {
        if (!e?.framework_id) continue
        counts.set(e.framework_id, (counts.get(e.framework_id) ?? 0) + 1)
      }
      // Build candidate list — filter by minCount, pair with section.
      const candidates: { framework_id: string; section: Section; count: number }[] = []
      for (const [framework_id, count] of counts) {
        if (count < minCount) continue
        const section = sectionFromFrameworkId(framework_id)
        if (!section) continue
        candidates.push({ framework_id, section, count })
      }
      candidates.sort((a, b) => b.count - a.count || a.framework_id.localeCompare(b.framework_id))
      const top = candidates.slice(0, limit)
      if (top.length === 0) {
        setTraps((prev) => (prev.length === 0 ? prev : []))
        return
      }
      // Record today's snapshot — drives the week-over-week trend
      // computation below. Idempotent within a day (replaces same-date).
      const now = new Date()
      const history = recordTrapSnapshot(
        now,
        candidates.map((c) => ({ framework_id: c.framework_id, count: c.count })),
      )

      // Best-effort headline lookup per unique section.
      const sections = Array.from(new Set(top.map((t) => t.section)))
      const maps = await Promise.all(sections.map((s) => loadFrameworkHeadlines(s)))
      if (!alive) return
      const merged: Record<string, string> = {}
      for (const m of maps) Object.assign(merged, m)
      const next = top.map((t) => ({
        framework_id: t.framework_id,
        section: t.section,
        count: t.count,
        headline: merged[t.framework_id] || null,
        trend: computeTrapTrend(now, t.framework_id, t.count, history),
      }))
      // Functional update + equality short-circuit — keeps React from
      // tripping the "Maximum update depth" guard when the resolved
      // value matches what's already in state. The deep-eq cost here
      // is tiny (top-N ≤ 3).
      setTraps((prev) => (sameTraps(prev, next) ? prev : next))
    })()
    return () => {
      alive = false
    }
  }, [qids, limit, minCount])

  return traps
}

function sameTraps(a: TopTrap[], b: TopTrap[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (x.framework_id !== y.framework_id) return false
    if (x.count !== y.count) return false
    if (x.headline !== y.headline) return false
    if (x.trend.kind !== y.trend.kind) return false
    if (x.trend.kind === 'delta' && y.trend.kind === 'delta') {
      if (x.trend.delta !== y.trend.delta || x.trend.daysAgo !== y.trend.daysAgo) return false
    }
  }
  return true
}

/** Test-only: clear the framework headline cache. */
export function __resetTopTrapsCache(): void {
  frameworkHeadlines.clear()
}
