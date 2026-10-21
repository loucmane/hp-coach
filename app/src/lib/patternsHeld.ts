// A device-local celebration of patterns that have held at least once.
// The server's current evidence can decay; this counter is not scheduler input.
const STORAGE_KEY = 'hpc:patterns-held:v1'

export function readPatternsHeld(): number {
  try {
    const count = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isSafeInteger(count) && count >= 0 ? count : 0
  } catch {
    return 0
  }
}

export function rememberPatternsHeld(mastered: number): number {
  const count = Math.max(readPatternsHeld(), mastered)
  try {
    localStorage.setItem(STORAGE_KEY, String(count))
  } catch {
    // Private mode, quota, or disabled storage must not prevent progress.
  }
  return count
}
