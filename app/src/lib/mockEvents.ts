// Mock (Provpass) instrumentation — a small localStorage-backed ring
// buffer of UX events for the Kallelse / ProvpassStatusLine / ConfirmSheet
// surfaces. Dev-visible via /dev/mock-events; not sent anywhere (no
// analytics backend yet) — this is a lightweight local trail for verifying
// the funnel by eye during dogfooding.
//
// SSR-safe / storage-defensive, mirroring lib/visitMemory.ts's pattern.

const STORAGE_KEY = 'hpc-mock-events'
const MAX_EVENTS = 500

export type MockEventType =
  | 'provpassdag_shown'
  | 'confirm_shown'
  | 'confirm_started'
  | 'confirm_backed_out'
  | 'started_via_line'
  | 'window_slid'
  | 'voided'

export type MockEvent = {
  type: MockEventType
  meta?: Record<string, unknown>
  at: number
}

/** Append one event to the ring buffer. Oldest events are dropped once
 *  the buffer exceeds MAX_EVENTS. Silent no-op when storage is
 *  unavailable (SSR, quota, private mode). */
export function logMockEvent(type: MockEventType, meta?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    const events = loadMockEvents()
    events.push({ type, meta, at: Date.now() })
    const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage quota / disabled / SSR — silent fail; this is a
    // dev-visibility nice-to-have, not a critical path.
  }
}

/** Read the full event log, oldest first. Returns [] when empty, missing,
 *  or corrupt (never throws). */
export function loadMockEvents(): MockEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as MockEvent[]
  } catch {
    return []
  }
}

/** Test-only: wipe the event log. */
export function __resetMockEvents(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}
