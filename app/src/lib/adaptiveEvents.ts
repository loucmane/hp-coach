// Adaptive-review instrumentation (task #16) — a small localStorage-backed
// ring buffer of the offer funnel, parallel to lib/mockEvents.ts. Dev-visible
// via /dev/mock-events (an "Adaptive review" section); not sent anywhere (no
// analytics backend yet) — a lightweight local trail for verifying the
// offer → accept/decline → treated funnel by eye during dogfooding.
//
// SSR-safe / storage-defensive, mirroring lib/mockEvents.ts.

const STORAGE_KEY = 'hpc-adaptive-events'
const MAX_EVENTS = 500

export type AdaptiveEventType =
  | 'offer_shown'
  | 'offer_accepted'
  | 'offer_declined'
  | 'detour_completed'
  | 'suppressed'

export type AdaptiveEvent = {
  type: AdaptiveEventType
  /** framework_id + any funnel context (e.g. decline count). */
  meta?: Record<string, unknown>
  at: number
}

/** Append one event to the ring buffer. Oldest events drop once the buffer
 *  exceeds MAX_EVENTS. Silent no-op when storage is unavailable (SSR,
 *  quota, private mode). */
export function logAdaptiveEvent(type: AdaptiveEventType, meta?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    const events = loadAdaptiveEvents()
    events.push({ type, meta, at: Date.now() })
    const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage quota / disabled / SSR — silent fail; dev-visibility
    // nice-to-have, not a critical path.
  }
}

/** Read the full event log, oldest first. Returns [] when empty, missing,
 *  or corrupt (never throws). */
export function loadAdaptiveEvents(): AdaptiveEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as AdaptiveEvent[]
  } catch {
    return []
  }
}

/** Test-only: wipe the event log. */
export function __resetAdaptiveEvents(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}
