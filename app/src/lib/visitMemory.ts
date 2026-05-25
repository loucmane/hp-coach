// Visit memory — persists "the last time the user opened Home".
//
// Tier 2. Without this, Home feels amnesiac: opening the app after a
// 3-day break and a same-day re-visit produce visually identical
// chrome. With it, Home picks up a one-line kicker — "TILLBAKA · 3
// dagar sedan" — that acknowledges the gap and signals "we noticed
// you were away".
//
// Sibling of diagnosticMemory.ts — same localStorage pattern, same
// SSR-safe try/catch wrapping, same single-fact scope. Sync to D1
// later if cross-device "where did I leave off" matters.

const STORAGE_KEY = 'hpc-visit-memory'
const SCHEMA_VERSION = 1

/** Persisted shape. `lastAt` is a Date.now() millisecond timestamp. */
export type VisitMemory = {
  version: number
  lastAt: number
}

/** Read the previous Home-visit timestamp WITHOUT updating it. Call
 *  this on mount BEFORE markVisit() so the "tillbaka efter X dagar"
 *  computation uses the visit BEFORE this one, not this one itself. */
export function loadPreviousVisit(): VisitMemory | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VisitMemory
    if (!parsed || typeof parsed.lastAt !== 'number') return null
    if (parsed.version !== SCHEMA_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

/** Stamp the current moment as "the user is visiting Home now". Idempotent
 *  per-render is fine — only the last write of a session matters. */
export function markVisit(): void {
  if (typeof window === 'undefined') return
  try {
    const payload: VisitMemory = {
      version: SCHEMA_VERSION,
      lastAt: Date.now(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage quota / disabled / SSR — silent fail; the kicker
    // is a nice-to-have, not a critical path.
  }
}

/** Test-only — wipe the persisted memory. */
export function clearVisitMemory(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}

/** Days between previous visit and now, rounded down. Returns null
 *  when there's no previous visit. */
export function daysSinceVisit(
  previous: VisitMemory | null,
  now: Date = new Date(),
): number | null {
  if (previous == null) return null
  const elapsedMs = now.getTime() - previous.lastAt
  return Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
}
