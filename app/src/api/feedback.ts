// Explanation feedback capture — the second of the three migration
// seams (see docs/explanations.md "Migration seams").
//
// v1: writes to localStorage. The dogfood user is the QA reviewer;
// their 👍/👎 marks accumulate locally, get exported via a one-liner
// pasted into devtools, and feed pipeline/explanations/regen.py for
// batch regeneration of 👎'd explanations.
//
// v2 (LJ-16): localStorage stays the offline cache and the source of every
// read here, and the exported API is unchanged. Each answer is also PUT to
// `/api/explanations/feedback/:qid` (worker/src/routes/explanationFeedback.ts),
// so it reaches us and follows the student to another device.
//   - The PUT is fire-and-forget. submitFeedback still returns nothing, and
//     no failure (offline, a refused token, a 5xx) reaches the UI. PUTs for
//     the same question go one at a time, so the server keeps the latest.
//   - An answer whose PUT failed gets one retry, on the next submit or the
//     next app load (when this module loads), whichever comes first. The
//     retry sends the answer as it is stored by then, so a newer answer, or
//     a clearFeedback, wins over the one that failed.
//   - The local store belongs to the device, not to an account, so the list
//     of unsent answers keeps the Clerk user who gave each one (the token's
//     `sub`). A retry goes out only under that user's token.
//   - Without a token (signed out, or no Clerk in dev and tests) the local
//     save is all: nothing is sent and nothing waits to be sent.
//   - The status maps onto the server's verdict with nothing lost. approved
//     is Ja. The Facit stores Delvis as 'rejected' with the note 'Delvis'
//     (the student's exact choice), so that is Delvis. Any other rejection
//     is Nej. The note travels as it is, so a server row reads back as the
//     entry it came from.
// Reads stay local. GET /api/explanations/feedback is there for Konto.

import { contentAuthToken } from '@/data/contentSource'

import { makeApiClient } from './client'

const STORAGE_PREFIX = 'hpc:explanation-feedback:'

// Answers whose PUT failed and that still have their one retry: qid → the
// Clerk user who gave the answer. It is not under STORAGE_PREFIX, so
// getAllFeedback and clearFeedback never see it.
const UNSENT_KEY = 'hpc:explanation-feedback-unsent'

// The Facit stores a Delvis answer as 'rejected' with exactly this note.
const PARTIAL_NOTE = 'Delvis'

// The longest note and model id the server takes.
const NOTE_MAX = 500
const MODEL_MAX = 100

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
 *  for the same qid — a 👎 followed by a 👍 wins. Also sends it to the
 *  server in the background (v2); that never throws here. */
export function submitFeedback(entry: FeedbackEntry): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + entry.qid, JSON.stringify(entry))
  } catch {
    // localStorage can be disabled (private browsing on iOS Safari)
    // or full (5 MB quota). Feedback is a soft enhancement; we
    // silently no-op rather than break the explanation panel.
  }
  void sync(entry)
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

// ── Server sync (v2) ───────────────────────────────────────────────

type Verdict = 'ja' | 'delvis' | 'nej'

function verdictOf(entry: FeedbackEntry): Verdict {
  if (entry.status === 'approved') return 'ja'
  return entry.notes === PARTIAL_NOTE ? 'delvis' : 'nej'
}

/** The PUT body. A note longer than the server takes is cut to fit. A model
 *  id it would refuse ('' when the explanation names none) is left out. */
function bodyOf(entry: FeedbackEntry): { verdict: Verdict; note?: string; model?: string } {
  const body: { verdict: Verdict; note?: string; model?: string } = { verdict: verdictOf(entry) }
  if (entry.notes) body.note = entry.notes.slice(0, NOTE_MAX)
  if (entry.model && entry.model.length <= MODEL_MAX) body.model = entry.model
  return body
}

/** The Clerk user a session token belongs to (its `sub` claim), or null.
 *  Only compared on this device, to keep a retry with the account that gave
 *  the answer. The worker verifies the token itself. */
function userOf(token: string): string | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { sub } = JSON.parse(atob(payload)) as { sub?: unknown }
    return typeof sub === 'string' && sub !== '' ? sub : null
  } catch {
    return null
  }
}

type Unsent = Record<string, string>

function readUnsent(): Unsent {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(UNSENT_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Unsent) : {}
  } catch {
    return {}
  }
}

function writeUnsent(unsent: Unsent): void {
  try {
    if (Object.keys(unsent).length > 0) localStorage.setItem(UNSENT_KEY, JSON.stringify(unsent))
    else localStorage.removeItem(UNSENT_KEY)
  } catch {
    // Storage is off or full: the failed answer gets no retry.
  }
}

/** Take `user`'s unsent answers off the list for their one retry. `fresh`,
 *  a question answered just now, leaves the list whoever answered it before:
 *  the new answer is stored over the old one and is being sent itself. */
function takeUnsent(user: string | null, fresh?: string): string[] {
  const unsent = readUnsent()
  const kept: Unsent = {}
  const taken: string[] = []
  for (const [qid, owner] of Object.entries(unsent)) {
    if (qid === fresh) continue
    if (user !== null && owner === user) taken.push(qid)
    else kept[qid] = owner
  }
  if (Object.keys(kept).length !== Object.keys(unsent).length) writeUnsent(kept)
  return taken
}

function markUnsent(qid: string, user: string): void {
  writeUnsent({ ...readUnsent(), [qid]: user })
}

/** PUT one answer under `token`. True once the server has stored it. */
async function put(entry: FeedbackEntry, token: string): Promise<boolean> {
  try {
    const res = await makeApiClient(async () => token).api.explanations.feedback[':qid'].$put({
      param: { qid: encodeURIComponent(entry.qid) },
      json: bodyOf(entry),
    })
    return res.ok
  } catch {
    return false
  }
}

// The latest PUT per question. A new PUT for the same question starts once
// that one has settled, so two quick answers reach the server in the order
// they were given, and the later one is the one it keeps.
const lastPut = new Map<string, Promise<boolean>>()

function putInOrder(entry: FeedbackEntry, token: string): Promise<boolean> {
  const sent = (lastPut.get(entry.qid) ?? Promise.resolve(true)).then(() => put(entry, token))
  lastPut.set(entry.qid, sent)
  void sent.then(() => {
    if (lastPut.get(entry.qid) === sent) lastPut.delete(entry.qid)
  })
  return sent
}

/** Send `entry` (a submit) and give the signed-in user's earlier failed
 *  answers their one retry. Never throws. */
async function sync(entry?: FeedbackEntry): Promise<void> {
  try {
    const token = await contentAuthToken()
    if (!token) return
    const user = userOf(token)
    const retries = takeUnsent(user, entry?.qid)
      .map((qid) => getFeedback(qid))
      .filter((stored): stored is FeedbackEntry => stored !== null)
    const [sent] = await Promise.all([
      entry ? putInOrder(entry, token) : Promise.resolve(true),
      ...retries.map((stored) => putInOrder(stored, token)),
    ])
    // Without a user to tie it to, a failed answer gets no retry.
    if (!sent && entry && user) markUnsent(entry.qid, user)
  } catch {
    // The answer is saved locally either way; the UI never hears of this.
  }
}

// App load: answers whose PUT failed on an earlier visit get their one retry
// once a token is there.
try {
  if (localStorage.getItem(UNSENT_KEY) !== null) void sync()
} catch {
  // No localStorage, so nothing is waiting.
}
