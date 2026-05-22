// Diagnostic memory — persists "the last time the user finished /diagnostik".
//
// B4 (the onboarding diagnostic) shipped without a memory layer. After
// running the 10-question diagnostic, the seeded grade silently updates
// score numbers, but neither Home nor /progress acknowledges that the
// diagnostic ran. Per audit/_homescreen_audit.md, the dogfood user
// loses the connection between "I just baseline-tested" and "here's
// the score". Closing that loop:
//
//   1. DiagnosticReport calls `markDiagnosticComplete()` on render.
//   2. Home reads via `loadDiagnosticMemory()` and renders a one-line
//      kicker — "DIAGNOSTIK · 2 d sedan · baseline 0.62 · rebaseline →".
//
// LocalStorage instead of D1 keeps the scope tight — this is a single
// client-side fact, no cross-device requirement (the dogfood user is
// single-device). Migrating to D1 later is a 5-line worker route +
// schema column when sync matters.

const STORAGE_KEY = 'hpc-diagnostic-memory'
const SCHEMA_VERSION = 1

/** Persisted shape. `lastAt` is a Date.now() millisecond timestamp;
 *  `baselineScore` is the projected total at the moment of completion
 *  (0.0–2.0 or null if the diagnostic didn't produce a complete signal). */
export type DiagnosticMemory = {
  version: number
  lastAt: number
  baselineScore: number | null
}

/** Persist a "diagnostic just finished" event. Called from
 *  DiagnosticReport — by the time the report mounts, the underlying
 *  attempts have been recorded and the projected score is whatever
 *  /progress would compute. */
export function markDiagnosticComplete(baselineScore: number | null): void {
  if (typeof window === 'undefined') return
  try {
    const payload: DiagnosticMemory = {
      version: SCHEMA_VERSION,
      lastAt: Date.now(),
      baselineScore,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage quota / disabled / SSR — silent fail, the memory
    // line is a nice-to-have not a critical path.
  }
}

/** Read the most recent diagnostic event. Returns null when no
 *  diagnostic has ever been run, when the stored schema is from a
 *  future version, or when storage is inaccessible. */
export function loadDiagnosticMemory(): DiagnosticMemory | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DiagnosticMemory
    if (!parsed || typeof parsed.lastAt !== 'number') return null
    if (parsed.version !== SCHEMA_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

/** Test-only — wipe the persisted memory. */
export function clearDiagnosticMemory(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}

/** Formats elapsed time as a human "X d / X tim / nyss" string. */
export function formatTimeSince(lastAt: number, now: Date = new Date()): string {
  const elapsedMs = now.getTime() - lastAt
  if (elapsedMs < 60 * 1000) return 'just nu'
  const elapsedMin = Math.floor(elapsedMs / (60 * 1000))
  if (elapsedMin < 60) return `${elapsedMin} min sedan`
  const elapsedHr = Math.floor(elapsedMin / 60)
  if (elapsedHr < 24) return `${elapsedHr} ${elapsedHr === 1 ? 'timme' : 'timmar'} sedan`
  const elapsedDay = Math.floor(elapsedHr / 24)
  return `${elapsedDay} ${elapsedDay === 1 ? 'dag' : 'dagar'} sedan`
}
