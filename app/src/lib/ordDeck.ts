// Local-only Leitner deck, isolated by Clerk user ID. The public word ID is
// the stable lowest qid in its normalized-headword group; no text is stored.
// Box 0 (a miss): 10 minutes. Correct answers advance to boxes 1–5, due in
// 1, 3, 7, 14, 30 days. Box 5 stays at 30 days; any miss returns to box 0.
const DAY = 86_400_000
export const ORD_INTERVALS_MS = [600_000, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY] as const

export type OrdWordState = { box: number; dueAt: number; seenQids: string[] }
export type OrdDeck = Record<string, OrdWordState>

const storageKey = (userId: string) => `hpc-ord-deck-v1:${encodeURIComponent(userId)}`

function isWordState(value: unknown): value is OrdWordState {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<OrdWordState>
  return (
    Number.isInteger(entry.box) &&
    (entry.box as number) >= 0 &&
    (entry.box as number) < ORD_INTERVALS_MS.length &&
    typeof entry.dueAt === 'number' &&
    Number.isFinite(entry.dueAt) &&
    entry.dueAt >= 0 &&
    Array.isArray(entry.seenQids) &&
    entry.seenQids.every((qid) => typeof qid === 'string' && qid.length > 0)
  )
}

/** Missing identity never reads an anonymous or another user's deck. */
export function readOrdDeck(userId: string | null | undefined): OrdDeck {
  if (!userId || typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (
      data?.version !== 1 ||
      !data.words ||
      typeof data.words !== 'object' ||
      Array.isArray(data.words)
    ) {
      return {}
    }
    return Object.fromEntries(
      Object.entries(data.words).filter(([, value]) => isWordState(value)),
    ) as OrdDeck
  } catch {
    return {}
  }
}

/** Read before each answer so another tab's latest deck is preserved. */
export function recordOrdAnswer(
  userId: string | null | undefined,
  wordId: string,
  qid: string,
  correct: boolean,
  now = Date.now(),
): void {
  if (!userId || typeof window === 'undefined') return
  const deck = readOrdDeck(userId)
  const previous = new Map(Object.entries(deck)).get(wordId)
  const box = correct ? Math.min((previous?.box ?? 0) + 1, ORD_INTERVALS_MS.length - 1) : 0
  deck[wordId] = {
    box,
    dueAt: now + ORD_INTERVALS_MS[box],
    seenQids: [...new Set([...(previous?.seenQids ?? []), qid])],
  }
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify({ version: 1, words: deck }))
  } catch {
    // Private mode / quota: practice remains usable; no cross-user fallback.
  }
}
