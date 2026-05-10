// Explanation feedback capture — the second of the three migration
// seams (see docs/explanations.md "Migration seams").
//
// v1: writes to localStorage. The dogfood user is the QA reviewer;
// their 👍/👎 marks accumulate locally, get exported via a one-liner
// pasted into devtools, and feed pipeline/explanations/regen.py for
// batch regeneration of 👎'd explanations.
//
// v2: swap the localStorage backend for a fetch() to
// `/api/explanations/feedback`. The shape of `FeedbackEntry` already
// matches the future D1 row exactly, so the migration is mechanical.

const STORAGE_PREFIX = 'hpc:explanation-feedback:'

export type FeedbackStatus = 'approved' | 'rejected'

export type FeedbackEntry = {
  qid: string
  status: FeedbackStatus
  /** Optional reviewer comment — surfaces in regen.py as feedback
   *  context for the next prompt run on this qid. */
  notes?: string
  /** Carried from the explanation's _meta block — lets us correlate
   *  feedback to the model + prompt-revision that produced the
   *  explanation. */
  model: string
  generated_at: number
  /** When the user pressed 👍/👎. */
  reviewed_at: number
}

/** Persist feedback for a single qid. Overwrites any prior feedback
 *  for the same qid — a 👎 followed by a 👍 wins. */
export function submitFeedback(entry: FeedbackEntry): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + entry.qid, JSON.stringify(entry))
  } catch {
    // localStorage can be disabled (private browsing on iOS Safari)
    // or full (5 MB quota). Feedback is a soft enhancement; we
    // silently no-op rather than break the explanation panel.
  }
}

/** Read the most recent feedback for a qid. Returns null if no
 *  feedback exists or storage is unreadable. */
export function getFeedback(qid: string): FeedbackEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + qid)
    if (!raw) return null
    return JSON.parse(raw) as FeedbackEntry
  } catch {
    return null
  }
}

/** Read every stored feedback entry. Used by the export-to-regen
 *  workflow — the user pastes a one-liner into devtools to dump
 *  this as JSON, runs pipeline/explanations/regen.py against the
 *  output. */
export function getAllFeedback(): FeedbackEntry[] {
  const out: FeedbackEntry[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith(STORAGE_PREFIX)) continue
      const raw = localStorage.getItem(k)
      if (!raw) continue
      try {
        out.push(JSON.parse(raw) as FeedbackEntry)
      } catch {
        // skip malformed entries
      }
    }
  } catch {
    // see submitFeedback
  }
  return out
}

/** Clear stored feedback. Used after a successful regen run so the
 *  next round of feedback isn't fighting against stale 👎s on
 *  newly-improved explanations. */
export function clearFeedback(qid?: string): void {
  try {
    if (qid) {
      localStorage.removeItem(STORAGE_PREFIX + qid)
      return
    }
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k)
    }
    for (const k of keys) localStorage.removeItem(k)
  } catch {
    // see submitFeedback
  }
}
