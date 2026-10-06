import type { InferResponseType } from 'hono/client'

import type { ApiClient } from '@/api/client'
import type { Framework } from '@/data/frameworks'

/** Normalized, deduplicated API rows; timestamps are ISO strings or null. */
export type FrameworkProgressRow = InferResponseType<
  ApiClient['api']['framework-progress']['$get']
>['progress'][number]
export type FrameworkStatus = FrameworkProgressRow['status']

export type ProgressSummary = {
  total: number
  counts: Record<FrameworkStatus, number>
  /** Unrounded percentage (0–100), with 0 for an empty catalog. */
  completionPercentage: number
  nextUntaught: Framework['entries'][number] | null
  /** Empty catalogs are not considered mastered. */
  allMastered: boolean
  /** No rows matched known entries; explicit untaught rows are data. */
  noData: boolean
}

export type FrameworkProgressSummary = {
  frameworks: Array<ProgressSummary & Pick<Framework, 'section' | 'family'>>
  overall: ProgressSummary
  orphans: FrameworkProgressRow[]
}

function summarizeEntries(
  entries: readonly Framework['entries'][number][],
  byId: ReadonlyMap<string, FrameworkProgressRow>,
): ProgressSummary {
  const counts: ProgressSummary['counts'] = {
    untaught: 0,
    learning: 0,
    practicing: 0,
    retaining: 0,
    mastered: 0,
  }
  let nextUntaught: ProgressSummary['nextUntaught'] = null
  let noData = true
  for (const entry of entries) {
    const row = byId.get(entry.id)
    if (row) noData = false
    const status = row?.status ?? 'untaught'
    counts[status]++
    if (status === 'untaught') nextUntaught ??= entry
  }
  const total = entries.length
  return {
    total,
    counts,
    completionPercentage: total === 0 ? 0 : (counts.mastered / total) * 100,
    nextUntaught,
    allMastered: total > 0 && counts.mastered === total,
    noData,
  }
}

/**
 * Summarize API rows against loaded Layer 1 catalogs from loadFramework.
 * Catalog entries define the denominator, even for sections with no progress
 * or question mappings (e.g. ORD). Unknown ids are returned as orphans only.
 * Readiness follows each catalog's entry order; overall follows the supplied
 * framework order too. Pass the full loaded catalog set to identify orphans
 * across all sections. Fetch/loading errors belong to the caller, not noData.
 */
export function summarizeFrameworkProgress(
  rows: readonly FrameworkProgressRow[],
  frameworks: readonly Framework[],
): FrameworkProgressSummary {
  const byId = new Map(rows.map((row) => [row.layer1Id, row]))
  const entries = frameworks.flatMap<Framework['entries'][number]>((framework) => framework.entries)
  const knownIds = new Set(entries.map((entry) => entry.id))
  return {
    frameworks: frameworks.map((framework) => ({
      section: framework.section,
      family: framework.family,
      ...summarizeEntries(framework.entries, byId),
    })),
    overall: summarizeEntries(entries, byId),
    orphans: rows.filter((row) => !knownIds.has(row.layer1Id)),
  }
}
