// Trap clustering — shared hook for grouping missed-question explanations
// by framework_id to surface the dominant trap pattern.
//
// Extracted from `DiagnosticReport.useTrapCluster` so `DrillResult` can
// reuse the same logic to name the trap in the `Klart.` payoff's
// `FÄLLA · <name>` eyebrow. Both surfaces ask the same question: of
// the questions the user just missed, which mistake did they make
// most often?
//
// Sections without rich-schema framework files (MEK / DTK / LÄS / ELF /
// ORD) won't cluster — `sectionFromFrameworkId` returns null and the
// cluster is dropped. KVA / NOG / XYZ do cluster.

import { useEffect, useState } from 'react'

import { loadExplanation } from '@/data/explanations'
import type { Section } from '@/data/questions'

export type TrapCluster = {
  framework_id: string
  section: Section
  count: number
  headline: string | null
}

/**
 * Load explanations for each missed qid, group by `framework_id`, and
 * return the dominant cluster when ≥2 misses share the same trap.
 * Caller passes a stable (memoized) array so the effect doesn't thrash
 * on every parent render.
 *
 * Returns null when no cluster reaches the 2-miss threshold or when
 * the missed qids resolve to no framework-tagged explanations.
 */
export function useTrapCluster(missedQids: string[]): TrapCluster | null {
  const [cluster, setCluster] = useState<TrapCluster | null>(null)

  useEffect(() => {
    let alive = true
    if (missedQids.length === 0) {
      setCluster(null)
      return
    }
    Promise.all(missedQids.map((qid) => loadExplanation(qid))).then((entries) => {
      if (!alive) return
      const counts = new Map<string, { count: number; qids: string[] }>()
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i]
        if (!e?.framework_id) continue
        const slot = counts.get(e.framework_id) ?? { count: 0, qids: [] }
        slot.count += 1
        slot.qids.push(missedQids[i])
        counts.set(e.framework_id, slot)
      }
      let best: TrapCluster | null = null
      for (const [framework_id, { count }] of counts) {
        if (count < 2) continue
        const section = sectionFromFrameworkId(framework_id)
        if (!section) continue
        if (!best || count > best.count) {
          best = { framework_id, section, count, headline: null }
        }
      }
      if (best) {
        // Resolve a one-line headline from the trap entry's tldr or
        // pattern_description. Best-effort — the cluster still renders
        // without it (callers fall back to the framework_id string).
        loadTrapHeadline(best.framework_id).then((headline) => {
          if (!alive) return
          setCluster(best ? { ...best, headline } : null)
        })
      } else {
        setCluster(null)
      }
    })
    return () => {
      alive = false
    }
  }, [missedQids])

  return cluster
}

export function sectionFromFrameworkId(id: string): Section | null {
  const prefix = id.split('-', 1)[0]
  if (['KVA', 'NOG', 'XYZ'].includes(prefix)) return prefix as Section
  return null
}

const FRAMEWORK_FILES: Record<string, string> = {
  KVA: '/frameworks/kva_traps.json',
  NOG: '/frameworks/nog_traps.json',
  XYZ: '/frameworks/xyz_traps.json',
}
const frameworkCache = new Map<string, Promise<Record<string, string>>>()

async function loadTrapHeadline(framework_id: string): Promise<string | null> {
  const section = sectionFromFrameworkId(framework_id)
  if (!section) return null
  const url = FRAMEWORK_FILES[section]
  if (!url) return null
  let promise = frameworkCache.get(url)
  if (!promise) {
    promise = fetch(url)
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
    frameworkCache.set(url, promise)
  }
  const map = await promise
  return map[framework_id] || null
}
