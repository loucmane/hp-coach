// A user-scoped, device-local celebration of patterns that have held at least once.
// The server's current evidence can decay; this counter is not scheduler input.
const STORAGE_KEY = 'hpc:patterns-held:v1'

export function readPatternsHeld(userId?: string | null): number {
  if (!userId) return 0
  try {
    // The legacy shared key has no known owner, so it cannot be carried forward.
    const count = Number(localStorage.getItem(`${STORAGE_KEY}:${userId}`))
    return Number.isSafeInteger(count) && count >= 0 ? count : 0
  } catch {
    return 0
  }
}

export function rememberPatternsHeld(mastered: number, userId?: string | null): number {
  if (!userId) return mastered
  const count = Math.max(readPatternsHeld(userId), mastered)
  try {
    localStorage.setItem(`${STORAGE_KEY}:${userId}`, String(count))
  } catch {
    // Private mode, quota, or disabled storage must not prevent progress.
  }
  return count
}
