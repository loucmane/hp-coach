// useAdaptiveReview — resolves the async signals the pure adaptiveReview
// detector needs, then exposes the hot-trap offer state + actions for the
// drill's session-start offer (task #16).
//
// Async pieces this hook owns (the lib stays pure):
//   1. Active mistakes → framework_id (via loadExplanation, same source as
//      useTopTraps) + lastErrorAt timestamp.
//   2. Completed adaptive-review detours → decoded from session history's
//      free-form `sections` marker (encodeTreatedMarker rides that field;
//      NO schema migration).
//   3. Per-framework decline records from localStorage (V1 residue —
//      documented; promote to D1 only if multi-device decline divergence
//      becomes real friction).
//   4. The hot trap's plain-Swedish catalog name (framework JSON).
//
// It does NOT gate the drill: while signals resolve, `hotTrap` is null and
// the offer simply doesn't show — the drill starts normally.

import { useCallback, useEffect, useMemo, useState } from 'react'

import { loadExplanation } from '@/data/explanations'
import { logAdaptiveEvent } from '@/lib/adaptiveEvents'
import {
  type DeclineRecord,
  decodeTreatedMarker,
  detectHotTrap,
  type HotTrap,
  recordDecline,
  sectionFromFrameworkId,
  type TreatedTrap,
} from '@/lib/adaptiveReview'

import { useDueMistakes } from './useMistakes'
import { useSessionHistory } from './useSessions'

const DECLINES_KEY = 'hpc:adaptive-review:declines'

// ── localStorage decline store (V1 residue — see module header) ────────────

function loadDeclines(): Record<string, DeclineRecord> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DECLINES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, DeclineRecord>
  } catch {
    return {}
  }
}

function saveDeclines(declines: Record<string, DeclineRecord>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DECLINES_KEY, JSON.stringify(declines))
  } catch {
    /* quota / private mode — offer suppression just won't persist */
  }
}

/** Test-only: wipe the decline store. */
export function __resetAdaptiveDeclines(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(DECLINES_KEY)
  } catch {
    /* noop */
  }
}

// ── Catalog name lookup (reuse the same framework JSON useTopTraps reads) ───

const FRAMEWORK_FILES: Record<string, string> = {
  KVA: '/frameworks/kva_traps.json',
  NOG: '/frameworks/nog_traps.json',
  XYZ: '/frameworks/xyz_traps.json',
  MEK: '/frameworks/mek_protocol.json',
  DTK: '/frameworks/dtk_tactics.json',
  LÄS: '/frameworks/las_taxonomy.json',
  ELF: '/frameworks/elf_taxonomy.json',
}
const nameCache = new Map<string, Promise<Record<string, string>>>()

type CatalogEntry = {
  id: string
  name?: string
  headword?: string
  tldr?: string
  pattern_description?: string
  constraint_type?: string
  question_type?: string
  tactic?: string
}

/** A short plain-Swedish name for the trap. Prefers an explicit name/headword
 *  field, then the quant `tldr`, then verbal/DTK type labels — enough to name
 *  the fälla in the offer headline. */
function nameFor(e: CatalogEntry): string {
  return (
    e.name ??
    e.headword ??
    e.tldr ??
    e.constraint_type ??
    e.question_type ??
    e.tactic ??
    e.pattern_description ??
    ''
  )
}

async function loadTrapName(framework_id: string): Promise<string | null> {
  const section = sectionFromFrameworkId(framework_id)
  const url = FRAMEWORK_FILES[section]
  if (!url) return null
  let p = nameCache.get(url)
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<{ entries: CatalogEntry[] }>) : null))
      .then((data) => {
        const map: Record<string, string> = {}
        for (const e of data?.entries ?? []) map[e.id] = nameFor(e)
        return map
      })
      .catch(() => ({}))
    nameCache.set(url, p)
  }
  const map = await p
  return map[framework_id] || null
}

/** Test-only: clear the trap-name cache. */
export function __resetAdaptiveNameCache(): void {
  nameCache.clear()
}

// ── The hook ────────────────────────────────────────────────────────────────

export type AdaptiveReviewState = {
  /** The hot trap eligible for an offer, or null. */
  hotTrap: HotTrap | null
  /** Section code for the detected trap (e.g. "DTK"). */
  section: string | null
  /** Plain-Swedish catalog name; falls back to framework_id. */
  trapName: string | null
  /** Deep-link the accepted detour navigates to. */
  detourHref: string | null
  /** Lektion anchor to surface at the top of the detour. */
  lektionHref: string | null
  /** Record a decline (2 → suppress until a new mistake). */
  decline: () => void
}

function toMs(v: string | number | null): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : null
}

export function useAdaptiveReview(now: Date = new Date()): AdaptiveReviewState {
  const { data: mistakes } = useDueMistakes()
  const history = useSessionHistory()

  // Freeze `now` once per mount so it doesn't churn the memos/effects below
  // on every parent render (a bare `new Date()` default is a fresh reference
  // each render). Detection cadence is a mount-level decision — the drill's
  // idle masthead — so a stable timestamp is exactly right.
  const [nowMs] = useState(() => now.getTime())

  // Resolve each active mistake's framework_id (async, cached per exam) +
  // lastErrorAt. Same explanation source as useTopTraps. `mistakes` is a
  // stable reference from react-query (only changes when the data does), so
  // depending on it directly is correct — mirrors useTopTraps' qids memo.
  const [resolved, setResolved] = useState<Array<{ framework_id: string; at: number }>>([])
  useEffect(() => {
    let alive = true
    const rows = mistakes ?? []
    if (rows.length === 0) {
      setResolved([])
      return
    }
    Promise.all(rows.map((m) => loadExplanation(m.questionId))).then((entries) => {
      if (!alive) return
      const out: Array<{ framework_id: string; at: number }> = []
      for (let i = 0; i < entries.length; i++) {
        const fid = entries[i]?.framework_id
        const at = toMs(rows[i].lastErrorAt)
        if (fid && at != null) out.push({ framework_id: fid, at })
      }
      setResolved(out)
    })
    return () => {
      alive = false
    }
  }, [mistakes])

  // Treated detours, decoded from session-history `sections` markers. `at`
  // is when the detour ended (falls back to the frozen mount time).
  const treated: TreatedTrap[] = useMemo(() => {
    const out: TreatedTrap[] = []
    for (const s of history.data ?? []) {
      const marker = decodeTreatedMarker(s.sections)
      if (!marker) continue
      const at = s.endedAt ? new Date(s.endedAt).getTime() : Number.NaN
      out.push({ framework_id: marker.framework_id, at: Number.isFinite(at) ? at : nowMs })
    }
    return out
  }, [history.data, nowMs])

  const declines = useMemo(() => loadDeclines(), [])

  const hotTrap = useMemo(
    () => detectHotTrap({ now: new Date(nowMs), mistakes: resolved, treated, declines }),
    [nowMs, resolved, treated, declines],
  )

  // Resolve the plain-Swedish trap name for the offer headline.
  const [trapName, setTrapName] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    if (!hotTrap) {
      setTrapName(null)
      return
    }
    loadTrapName(hotTrap.framework_id).then((n) => {
      if (alive) setTrapName(n)
    })
    return () => {
      alive = false
    }
  }, [hotTrap])

  // Fire offer_shown once per detected framework.
  const shownFor = hotTrap?.framework_id ?? null
  useEffect(() => {
    if (shownFor) logAdaptiveEvent('offer_shown', { framework_id: shownFor })
  }, [shownFor])

  const decline = useCallback(() => {
    if (!hotTrap) return
    const next = recordDecline(loadDeclines(), hotTrap.framework_id, new Date())
    saveDeclines(next)
    logAdaptiveEvent('offer_declined', {
      framework_id: hotTrap.framework_id,
      count: next[hotTrap.framework_id]?.count,
    })
  }, [hotTrap])

  const section = hotTrap ? sectionFromFrameworkId(hotTrap.framework_id) : null

  return {
    hotTrap,
    section,
    trapName: hotTrap ? (trapName ?? hotTrap.framework_id) : null,
    detourHref: hotTrap ? `/drill?framework=${hotTrap.framework_id}&ar=1` : null,
    lektionHref: hotTrap && section ? `/lektion?section=${section}#${hotTrap.framework_id}` : null,
    decline,
  }
}
