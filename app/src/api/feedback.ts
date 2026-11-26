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
//     next app load (when this module loads), whichever comes first.
//   - The retry queue stores each answer with its Clerk user (the token's
//     `sub`). A retry uses that payload and the same user's token. A newer
//     answer from that user or an explicit clear supersedes the retry.
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

// Answers whose PUT failed and still have their one retry. The separate key
// keeps transport state out of the device's feedback reads.
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
  sync(entry)
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
  for (const [queuedQid, queue] of putQueues) {
    if (!qid || queuedQid === qid) queue.cleared = true
  }
  removeUnsent((answer) => !qid || answer.qid === qid)
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
type FeedbackBody = { verdict: Verdict; note?: string; model?: string }
type Answer = { qid: string; body: FeedbackBody }
type UnsentAnswer = Answer & { owner: string; id: string }

function verdictOf(entry: FeedbackEntry): Verdict {
  if (entry.status === 'approved') return 'ja'
  return entry.notes === PARTIAL_NOTE ? 'delvis' : 'nej'
}

/** The PUT body. A note longer than the server takes is cut to fit. A model
 *  id it would refuse ('' when the explanation names none) is left out. */
function bodyOf(entry: FeedbackEntry): FeedbackBody {
  const body: FeedbackBody = { verdict: verdictOf(entry) }
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

function readUnsent(): UnsentAnswer[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(UNSENT_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return (parsed as Partial<UnsentAnswer>[]).filter(
      (answer): answer is UnsentAnswer =>
        typeof answer?.owner === 'string' &&
        typeof answer.qid === 'string' &&
        typeof answer.id === 'string' &&
        !!answer.body,
    )
  } catch {
    return []
  }
}

function writeUnsent(unsent: UnsentAnswer[]): boolean {
  try {
    if (unsent.length > 0) localStorage.setItem(UNSENT_KEY, JSON.stringify(unsent))
    else localStorage.removeItem(UNSENT_KEY)
    return true
  } catch {
    // Without a storage update we cannot record or consume a retry.
    return false
  }
}

function removeUnsent(matches: (answer: UnsentAnswer) => boolean): boolean {
  const unsent = readUnsent()
  const kept = unsent.filter((answer) => !matches(answer))
  return kept.length !== unsent.length && writeUnsent(kept)
}

/** PUT one answer under `token`. True once the server has stored it. */
async function put(answer: Answer, token: string): Promise<boolean> {
  try {
    const res = await makeApiClient(async () => token).api.explanations.feedback[':qid'].$put({
      param: { qid: encodeURIComponent(answer.qid) },
      json: answer.body,
    })
    return res.ok
  } catch {
    return false
  }
}

type PutQueue = { tail: Promise<void>; cleared: boolean }
const putQueues = new Map<string, PutQueue>()

function enqueuePut(qid: string, send: (queue: PutQueue) => Promise<void>): void {
  const previous = putQueues.get(qid)
  const queue =
    previous && !previous.cleared
      ? previous
      : { tail: previous?.tail ?? Promise.resolve(), cleared: false }
  const done = queue.tail
    .then(() => send(queue))
    .catch(() => {
      // The local save stands even if background sync fails.
    })
  queue.tail = done
  putQueues.set(qid, queue)
  void done.then(() => {
    if (putQueues.get(qid)?.tail === done) putQueues.delete(qid)
  })
}

/** Send a fresh answer and retry the signed-in user's earlier failures. */
function sync(entry?: FeedbackEntry): void {
  const auth = contentAuthToken().catch(() => null)
  const answer = entry ? { qid: entry.qid, body: bodyOf(entry) } : undefined
  if (answer) {
    // Reserve the question's slot synchronously, before auth can reorder it.
    enqueuePut(answer.qid, async (queue) => {
      const token = await auth
      if (!token) return
      const owner = userOf(token)
      const replaces = (pending: UnsentAnswer) =>
        pending.owner === owner && pending.qid === answer.qid
      removeUnsent(replaces)
      const sent = await put(answer, token)
      if (!sent && owner && !queue.cleared) {
        // Record this result immediately even while other questions are retrying.
        writeUnsent([
          ...readUnsent().filter((pending) => !replaces(pending)),
          { ...answer, owner, id: crypto.randomUUID() },
        ])
      }
    })
  }

  void auth.then((token) => {
    if (!token) return
    const owner = userOf(token)
    if (!owner) return
    for (const pending of readUnsent()) {
      if (pending.owner !== owner || pending.qid === answer?.qid) continue
      enqueuePut(pending.qid, async (queue) => {
        // It may have been retried, replaced or cleared while waiting its turn.
        if (!queue.cleared && removeUnsent((queued) => queued.id === pending.id)) {
          await put(pending, token)
        }
      })
    }
  })
}

// App load: answers whose PUT failed on an earlier visit get their one retry
// once a token is there.
if (readUnsent().length > 0) sync()
