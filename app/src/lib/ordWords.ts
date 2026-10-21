import { type Question, questionsInSection } from '@/data/questions'

import type { OrdDeck } from './ordDeck'

export type OrdWord = { id: string; qids: string[]; roots: string[] }
export const ORD_ROUND_SIZE = 10
// Readable in Home's existing session label; its resume URL carries this
// through `section`. The drill route decodes it back to ORD + words=true.
export const ORD_WORDS_SECTIONS = 'ORD · ORDBANK'

let cache: Promise<readonly OrdWord[]> | null = null

function isWord(value: unknown): value is OrdWord {
  if (!value || typeof value !== 'object') return false
  const word = value as Partial<OrdWord>
  return (
    typeof word.id === 'string' &&
    word.id.length > 0 &&
    Array.isArray(word.qids) &&
    word.qids.includes(word.id) &&
    word.qids.every((qid) => typeof qid === 'string' && qid.length > 0) &&
    Array.isArray(word.roots) &&
    word.roots.every((root) => typeof root === 'string')
  )
}

/** Public IDs only. Failures are retryable; never silently treat them as an empty deck. */
export function loadOrdWords(): Promise<readonly OrdWord[]> {
  if (cache) return cache
  const pending = (async () => {
    const response = await fetch('/ord-words.json')
    if (!response.ok) throw new Error(`Failed to load word index: HTTP ${response.status}`)
    const data = (await response.json()) as { version?: unknown; words?: unknown } | null
    if (data?.version !== 1 || !Array.isArray(data.words) || !data.words.every(isWord)) {
      throw new Error('Invalid word index')
    }
    return data.words as OrdWord[]
  })()
  cache = pending
  pending.catch(() => {
    if (cache === pending) cache = null
  })
  return pending
}

/** Due first (oldest first), then new in manifest order. Never pull future
 * reviews forward to pad a short round. Each selected question retains the
 * bank's original headword, answer and distractors. */
export function pickOrdWords(
  words: readonly OrdWord[],
  bank: readonly Question[],
  deck: OrdDeck,
  now = Date.now(),
): Question[] {
  const states = new Map(Object.entries(deck))
  const state = (id: string) => states.get(id)
  const due = words
    .filter((word) => {
      const entry = state(word.id)
      return entry && entry.dueAt <= now
    })
    .sort((a, b) => (state(a.id)?.dueAt ?? 0) - (state(b.id)?.dueAt ?? 0))
  const unseen = words.filter((word) => !state(word.id))
  const byQid = new Map(questionsInSection(bank, 'ORD').map((q) => [q.qid, q]))
  const picked: Question[] = []
  const pickedWords = new Set<string>()
  for (const word of [...due, ...unseen]) {
    if (pickedWords.has(word.id)) continue
    const candidates = word.qids.filter((qid) => byQid.has(qid))
    const seen = state(word.id)?.seenQids ?? []
    const qid = candidates.find((id) => !seen.includes(id)) ?? candidates[0]
    if (!qid) continue
    picked.push(byQid.get(qid) as Question)
    pickedWords.add(word.id)
    if (picked.length === ORD_ROUND_SIZE) break
  }
  return picked
}

/** Test-only. */
export function __resetOrdWordsCache(): void {
  cache = null
}
