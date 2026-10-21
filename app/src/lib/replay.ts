// Replay question selection.
//
// Takes the due-mistakes list (already sorted server-side by errorCount
// desc, lastErrorAt desc) and resolves each questionId to a real
// Question from the (lazily-loaded) bank. Mistakes whose questionId no
// longer resolves (parser changed, qid regenerated, etc.) are silently
// skipped — better to hand the user N-k usable questions than crash.
//
// Samma fälla, ny fråga (hpf-bz6f.2). After one facit, replaying the SAME
// LÄS/MEK/ELF/quant question tests memory of the key, not the skill. So a
// miss whose question carries a Layer 1 trap (lib/trapIndex.ts) is
// repeated through a NEW question with that trap: same section, playable,
// not already in the round and not itself a due miss — unseen first, else
// the least recently seen. The item stays linked to the source mistake, so
// the answer moves THAT row (PATCH /api/mistakes/:id/review): the miss
// counts as relearned only through right answers on new questions. ORD,
// untagged questions and traps with nothing left keep the missed question
// itself — word knowledge belongs to the word.
//
// The link is stored with the round (planEntry: "X~A" in the session's
// plan), and a resume reads exactly that link back (prunePlan). It is never
// re-derived from the due list, whose order and members change between a
// pause and a resume. New rounds store links in the session creation call.
// An older round whose links were lost plays its new questions on as plain
// questions and grades none of them; it never ends for want of its links
// or of the trap index.
//
// Only a question that repeats a due mistake is ever graded. A question the
// round has already answered (before its cursor) is history: kept for the
// cursor and the Klart summary, never reopened (resumeQid), never graded.

import type { Mistake } from '@/api/hooks/useMistakes'
import type { ExposureMap } from '@/api/hooks/useMockResults'
import { EXCLUDED_QUESTIONS } from '@/data/figureOverrides'
import { findQuestion, loadBank, type Question } from '@/data/questions'
import { WORKED_EXAMPLE_QIDS } from '@/data/workedExamples.generated'
import { EMPTY_TRAP_INDEX, loadTrapIndex, type TrapIndex } from '@/lib/trapIndex'

/** Single source of truth for the per-session repetition queue size.
 *  The replay route plays at most this many missed questions per
 *  session; the scheduler caps its "Repetition · N missar" prescription
 *  to the same number; the /drill banner advertises the same number.
 *  Without this constant, the three surfaces disagreed (50 / 71 / 10),
 *  which was the user's #1 complaint at dogfood pass 2. */
export const REPETITION_SESSION_SIZE = 10
/** @deprecated kept for backwards compatibility — prefer
 *  `REPETITION_SESSION_SIZE`. */
export const DEFAULT_REPLAY_LENGTH = REPETITION_SESSION_SIZE

export type ReplayItem = {
  question: Question
  /** The due mistake this item repeats — the row its answer moves. */
  mistakeId: number
  /** The missed question. Equals `question.qid` unless `sibling`. */
  sourceQid: string
  /** `question` is a new question with the source's trap. */
  sibling: boolean
}

export type ReplayPickOptions = {
  /** Per-question exposure (GET /api/me/exposure). Missing = unseen. */
  exposure?: ExposureMap
  /** The trap index to pick siblings from; loads the static one when
   *  omitted. */
  traps?: TrapIndex
}

export async function pickReplayQuestions(
  due: readonly Mistake[],
  count: number = DEFAULT_REPLAY_LENGTH,
  { exposure = {}, traps }: ReplayPickOptions = {},
): Promise<ReplayItem[]> {
  const [bank, index] = await Promise.all([loadBank(), traps ?? loadTrapsOrNone()])
  const byQid = new Map(bank.map((q) => [q.qid, q]))
  const dueQids = new Set(due.map((m) => m.questionId))
  const inRound = new Set<string>()
  const out: ReplayItem[] = []
  for (const m of due) {
    if (out.length >= count) break
    const source = byQid.get(m.questionId)
    if (!source) continue
    const sibling = pickSibling(source, index, byQid, exposure, inRound, dueQids)
    if (sibling) {
      inRound.add(sibling.qid)
      out.push({ question: sibling, mistakeId: m.id, sourceQid: source.qid, sibling: true })
      continue
    }
    if (source.parsing_status !== 'complete' || !source.options) continue
    inRound.add(source.qid)
    out.push({ question: source, mistakeId: m.id, sourceQid: source.qid, sibling: false })
  }
  return out
}

/** The trap index, or none when it can't load — a failed fetch must never
 *  cost the round; every miss is then replayed as itself. */
function loadTrapsOrNone(): Promise<TrapIndex> {
  return loadTrapIndex().catch(() => EMPTY_TRAP_INDEX)
}

/** A new question with `source`'s trap, or null. Unseen first, else the
 *  least recently seen; ties keep the index's qid order. */
function pickSibling(
  source: Question,
  traps: TrapIndex,
  byQid: ReadonlyMap<string, Question>,
  exposure: ExposureMap,
  inRound: ReadonlySet<string>,
  dueQids: ReadonlySet<string>,
): Question | null {
  // Word knowledge belongs to the word: ORD repeats the item itself.
  if (source.section === 'ORD') return null
  const trap = traps.trapOf(source.qid)
  if (!trap) return null
  let best: Question | null = null
  let bestLast = Number.POSITIVE_INFINITY
  for (const qid of traps.qidsFor(trap)) {
    if (qid === source.qid || inRound.has(qid) || dueQids.has(qid)) continue
    const q = byQid.get(qid)
    if (!q || q.section !== source.section || !playable(q)) continue
    const seen = exposure[qid]
    // Unseen sorts before every seen question (last = -1).
    const last = seen && seen.n > 0 ? Number(seen.last) || 0 : -1
    if (last < bestLast) {
      best = q
      bestLast = last
    }
  }
  return best
}

/** Fully parsed and not withheld by the figure audit — what a drill
 *  would serve (see questionsInSection). */
function playable(q: Question): boolean {
  return (
    q.parsing_status === 'complete' &&
    !!q.options &&
    !EXCLUDED_QUESTIONS.has(q.qid) &&
    !WORKED_EXAMPLE_QIDS.has(q.qid)
  )
}

/** Joins a new question to the question it repeats in a stored plan entry.
 *  Qids never contain it. */
const PLAN_LINK = '~'
/** The longest entry a session plan stores (worker routes/sessions.ts). */
const PLAN_ENTRY_MAX = 80

/** The entry a round stores for an item in its session plan: a new question
 *  as "<qid>~<sourceQid>", so a resume answers it against THAT mistake;
 *  any other question as its plain qid, which is all an older plan holds.
 *  A link too long to store is left out, and a resume then never guesses
 *  the question's source. */
export function planEntry(item: ReplayItem): string {
  const qid = item.question.qid
  if (!item.sibling) return qid
  const entry = `${qid}${PLAN_LINK}${item.sourceQid}`
  return entry.length <= PLAN_ENTRY_MAX ? entry : qid
}

/** A stored plan entry read back: the question it plays, and the question
 *  whose mistake it repeats — itself, for a plain qid. */
export function parsePlanEntry(entry: string): { qid: string; sourceQid: string } {
  const at = entry.indexOf(PLAN_LINK)
  if (at < 0) return { qid: entry, sourceQid: entry }
  return { qid: entry.slice(0, at), sourceQid: entry.slice(at + 1) }
}

/** Whether a stored plan carries any link. A round's links are stored
 *  together at creation (older bundles used a later PUT), so a plan with one
 *  link has them all, and a plan with none either had no new question or
 *  never got its links. */
function hasPlanLinks(entries: readonly string[]): boolean {
  return entries.some((entry) => entry.includes(PLAN_LINK))
}

/** Whether two stored plans play the same questions in the same order,
 *  whatever links their entries carry. */
export function samePlay(a: readonly string[], b: readonly string[]): boolean {
  return (
    a.length === b.length &&
    a.every((entry, i) => parsePlanEntry(entry).qid === parsePlanEntry(b[i]).qid)
  )
}

/** A stored plan entry, read back against the current due list. */
export type PlanLink = {
  qid: string
  /** The question whose mistake this entry repeats, as stored. */
  sourceQid: string
  /** A new question with the source's trap. */
  sibling: boolean
  /** The due mistake an answer on this entry reviews. Null when there is
   *  none to review: a question already answered (before the cursor), or
   *  one that may be a new question whose link was lost. */
  mistakeId: number | null
}

/** Ghost-replay guard (residual #290) — reads an adopted adaptive_review
 *  session's STORED plan back against the CURRENT due list. Without this,
 *  resuming/adopting an active repetition session replays its plan
 *  verbatim, including questions whose mistakes were since resolved (a
 *  correct answer elsewhere) or rescheduled out (SRS pushed nextReviewAt
 *  into the future) — the user replays a question that's already "done".
 *
 *  Each entry repeats the mistake on the question stored with it
 *  (parsePlanEntry), and only that one (hpf-bz6f.2). The due list is used
 *  only to see whether that mistake is still due, never to pick a source:
 *  its order and members change between a pause and a resume.
 *
 *  `position` is the session's saved cursor:
 *    - Before it: questions already answered. They are history: kept, so
 *      the cursor still points at the same question and the round's Klart
 *      summary still counts them, but never mapped to a mistake, so an
 *      answer there grades nothing, even while that mistake is still due.
 *    - From it on: kept while the mistake an entry repeats is still due,
 *      and each due mistake once. A question whose mistake has left the
 *      due list since the pick is skipped and the round goes on.
 *
 *  Lost links: a plan without any link may hold new questions whose links
 *  never reached the server, stored as plain qids. Their sources are
 *  unknown, so they are never guessed. From the cursor on, a plain entry
 *  without a due mistake of its own that `mayBeNew` admits (for
 *  resolveReplayPlan, any question outside ORD: a new question is never
 *  ORD) is kept but never mapped. It is played and graded nothing, its
 *  source stays due for a later round, and the round does not end for want
 *  of its links.
 *
 *  Pure and synchronous: no bank/network access, so it's trivial to
 *  unit-test and safe to run on every adopt. Preserves the STORED plan's
 *  own order — we only drop entries, never reorder.
 *
 *  Scope: only wired into /repetition's resolvePlan (kind=adaptive_review).
 *  Drill plans aren't mistake-backed, so pruning against the due-mistakes
 *  list would be meaningless there — drill's resolvePlan doesn't call this. */
export function prunePlan(
  entries: readonly string[],
  due: readonly Mistake[],
  position = 0,
  mayBeNew: (qid: string) => boolean = () => false,
): PlanLink[] {
  const dueByQid = new Map(due.map((m) => [m.questionId, m]))
  const linksLost = !hasPlanLinks(entries)
  const claimed = new Set<number>()
  const out: PlanLink[] = []
  entries.forEach((entry, i) => {
    const { qid, sourceQid } = parsePlanEntry(entry)
    const sibling = qid !== sourceQid
    if (i < position) {
      out.push({ qid, sourceQid, sibling, mistakeId: null })
      return
    }
    const source = dueByQid.get(sourceQid)
    if (source && !claimed.has(source.id)) {
      claimed.add(source.id)
      out.push({ qid, sourceQid, sibling, mistakeId: source.id })
    } else if (linksLost && mayBeNew(qid)) {
      // hpf-bz6f.12 follow-up: remove this legacy fallback with the worker
      // PUT after one release, once cached old bundles no longer create
      // unlinked rounds.
      out.push({ qid, sourceQid, sibling, mistakeId: null })
    }
  })
  return out
}

/** The question a resume may open when the URL names `qid`. That question
 *  while the round still has it ahead, at or after the stored cursor;
 *  otherwise the question the round was paused on, or the one at the
 *  cursor. A qid the round has answered, or does not hold, is never
 *  reopened: an answer there would grade an answered question. Null when
 *  nothing is left to open. */
export function resumeQid(
  qid: string,
  plan: readonly string[],
  position: number,
  currentQuestionId: string | null,
): string | null {
  const ahead = (q: string | null) =>
    q !== null && plan.findIndex((entry) => parsePlanEntry(entry).qid === q) >= position
  if (ahead(qid)) return qid
  if (ahead(currentQuestionId)) return currentQuestionId
  const atCursor = plan[position]
  return atCursor === undefined ? null : parsePlanEntry(atCursor).qid
}

/** A stored round, resolved to play on from its cursor. */
export type ResumedRound = {
  /** The questions to hand the player, in stored order (see prunePlan). */
  questions: Question[]
  /** Those that repeat a due mistake — what an answer reviews. Never an
   *  answered question. */
  items: ReplayItem[]
  /** How many questions are left from the cursor on; 0 = the round is over. */
  remaining: number
}

/** prunePlan, resolved against the bank: a stored qid that no longer
 *  resolves is dropped, never thrown. The /repetition resume path. It never
 *  reads the trap index: in a plan whose links were lost, any plain
 *  question outside ORD may be a new one, so an index that fails to load,
 *  is missing or has changed since the pick can never drop the round's new
 *  questions and end it. */
export async function resolveReplayPlan(
  entries: readonly string[],
  due: readonly Mistake[],
  position = 0,
): Promise<ResumedRound> {
  const bank = await loadBank()
  // A new question is never ORD: word knowledge belongs to the word.
  const mayBeNew = (qid: string) => findQuestion(bank, qid)?.section !== 'ORD'
  // prunePlan keeps every entry before the cursor, so these lead its output.
  const answered = Math.min(position, entries.length)
  const round: ResumedRound = { questions: [], items: [], remaining: 0 }
  prunePlan(entries, due, position, mayBeNew).forEach((link, i) => {
    const question = findQuestion(bank, link.qid)
    if (!question) return
    round.questions.push(question)
    if (i >= answered) round.remaining++
    if (link.mistakeId === null) return
    round.items.push({
      question,
      mistakeId: link.mistakeId,
      sourceQid: link.sourceQid,
      sibling: link.sibling,
    })
  })
  return round
}
