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
  MEK: '/frameworks/mek_protocol.json',
  DTK: '/frameworks/dtk_tactics.json',
  LÄS: '/frameworks/las_taxonomy.json',
  ELF: '/frameworks/elf_taxonomy.json',
}

const frameworkHeadlines = new Map<string, Promise<Record<string, string>>>()

/** Each verbal / DTK taxonomy file uses section-specific field names
 *  instead of the generic `tldr` the quant trap catalogs adopted.
 *  Map each one to a single line that fits the TopTrapsCard's
 *  italic-headline slot. */
type FrameworkEntry = {
  id: string
  // KVA/NOG/XYZ
  tldr?: string
  pattern_description?: string
  // MEK
  constraint_type?: string
  rule?: string
  // LÄS / ELF
  question_type?: string
  attack_protocol?: string[]
  // DTK
  tactic?: string
  when_to_apply?: string
}

function headlineFor(e: FrameworkEntry): string {
  // Quant — fall back to original fields first.
  if (e.tldr) return e.tldr
  if (e.pattern_description) return e.pattern_description
  // MEK — "Lexikal kollokation — vissa verb kräver ett specifikt objekt …"
  if (e.constraint_type && e.rule) {
    return `${e.constraint_type} — ${firstSentence(e.rule)}`
  }
  if (e.rule) return firstSentence(e.rule)
  // LÄS / ELF — "Direkt detalj — notera triggerfrasen 'enligt texten' …"
  if (e.question_type && e.attack_protocol?.[0]) {
    return `${e.question_type} — ${firstSentence(e.attack_protocol[0])}`
  }
  if (e.question_type) return e.question_type
  // DTK — the `tactic` field is already a complete sentence.
  if (e.tactic) return firstSentence(e.tactic)
  return ''
}

/** Trim to the first sentence to keep the headline single-line. */
function firstSentence(s: string): string {
  const idx = s.indexOf('. ')
  return idx === -1 ? s : s.slice(0, idx + 1).trim()
}

async function loadFrameworkHeadlines(section: string): Promise<Record<string, string>> {
  const url = FRAMEWORK_FILES[section]
  if (!url) return {}
  let p = frameworkHeadlines.get(url)
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<{ entries: FrameworkEntry[] }>) : null))
      .then((data) => {
        const map: Record<string, string> = {}
        for (const e of data?.entries ?? []) {
          map[e.id] = headlineFor(e)
        }
        return map
      })
      .catch(() => ({}))
    frameworkHeadlines.set(url, p)
  }
  return p
}

function sectionFromFrameworkId(id: string): Section | null {
  // Framework_id prefixes don't always match the section code 1:1.
  // The LÄS taxonomy uses `LAS-TYPE-NNN` (ASCII) because the Swedish
  // letters were dropped during authoring; map back here.
  const prefix = id.split('-', 1)[0]
  switch (prefix) {
    case 'KVA':
    case 'NOG':
    case 'XYZ':
    case 'MEK':
    case 'DTK':
    case 'ELF':
      return prefix
    case 'LAS':
      return 'LÄS'
    default:
      return null
  }
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
      setTraps([])
      return
    }
    Promise.all(qids.map((qid) => loadExplanation(qid))).then((entries) => {
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
        setTraps([])
        return
      }
      // Record today's snapshot — drives the week-over-week trend
      // computation below. Idempotent within a day (replaces same-date).
      // We record only the candidates that *qualified* as patterns
      // (count >= minCount); single-miss noise is intentionally excluded.
      const now = new Date()
      const history = recordTrapSnapshot(
        now,
        candidates.map((c) => ({ framework_id: c.framework_id, count: c.count })),
      )

      // Best-effort headline lookup per unique section.
      const sections = Array.from(new Set(top.map((t) => t.section)))
      Promise.all(sections.map((s) => loadFrameworkHeadlines(s))).then((maps) => {
        if (!alive) return
        const merged: Record<string, string> = {}
        for (const m of maps) Object.assign(merged, m)
        setTraps(
          top.map((t) => ({
            framework_id: t.framework_id,
            section: t.section,
            count: t.count,
            headline: merged[t.framework_id] || null,
            trend: computeTrapTrend(now, t.framework_id, t.count, history),
          })),
        )
      })
    })
    return () => {
      alive = false
    }
  }, [qids, limit, minCount])

  return traps
}

/** Test-only: clear the framework headline cache. */
export function __resetTopTrapsCache(): void {
  frameworkHeadlines.clear()
}
