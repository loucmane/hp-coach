// mockSheet — the Provpass answer sheet: a plain reducer (no React
// dependency) tracking, per question, the last-picked letter and the
// accumulated time spent looking at it.
//
// Model:
//   answers: Map<qid, { letter, lastAt }>   — latest pick wins; lastAt is
//                                              the wall-clock ms of that pick.
//   dwellMs: Map<qid, number>               — running total of time spent
//                                              on that question, across every
//                                              visit (revisits accumulate,
//                                              they don't reset).
//   current: { qid, enteredAt } | null      — the question in view right now
//                                              and when the visit started, so
//                                              `leave`/`settle` can compute
//                                              the elapsed slice to add.
//
// Actions:
//   enter(qid, now?)   — a new question comes into view. Starts its dwell
//                         clock. If another question was already current
//                         (caller forgot to `leave` first), its elapsed time
//                         up to `now` is flushed first so no time is lost.
//   pick(qid, letter, now?) — record an answer. Latest pick per qid wins
//                         (overwrites), Not a dwell event by itself — dwell
//                         only advances on enter/leave/settle boundaries.
//   leave(now?)        — the current question goes out of view (navigating
//                         to another one). Adds `now - enteredAt` to that
//                         qid's dwell total and clears `current`.
//   settle(now?)        — end of pass (submit / timeout / abandon). Same as
//                         `leave` (flush the in-flight dwell) but the caller
//                         is expected to stop dispatching after this.
//
// `now` defaults to Date.now() in every action; tests inject an explicit
// clock so dwell math is deterministic without faking global timers.

export type MockSheetAnswer = {
  letter: string
  lastAt: number
}

export type MockSheetState = {
  answers: Map<string, MockSheetAnswer>
  dwellMs: Map<string, number>
  current: { qid: string; enteredAt: number } | null
}

export function createMockSheet(): MockSheetState {
  return { answers: new Map(), dwellMs: new Map(), current: null }
}

function addDwell(state: MockSheetState, qid: string, ms: number): Map<string, number> {
  if (ms <= 0) return state.dwellMs
  const next = new Map(state.dwellMs)
  next.set(qid, (next.get(qid) ?? 0) + ms)
  return next
}

/** Flush the in-flight visit's elapsed time (if any) into dwellMs.
 *  Shared by leave/settle/enter(-of-a-different-qid). */
function flushCurrent(state: MockSheetState, now: number): Map<string, number> {
  if (!state.current) return state.dwellMs
  const elapsed = now - state.current.enteredAt
  return addDwell(state, state.current.qid, elapsed)
}

export type MockSheetAction =
  | { type: 'enter'; qid: string; now?: number }
  | { type: 'pick'; qid: string; letter: string; now?: number }
  | { type: 'leave'; now?: number }
  | { type: 'settle'; now?: number }

export function mockSheetReducer(state: MockSheetState, action: MockSheetAction): MockSheetState {
  const now = action.now ?? Date.now()
  switch (action.type) {
    case 'enter': {
      // Flush whatever was in-flight (defensive — normal flow always
      // leave()s before enter()ing the next question) before starting
      // the new question's clock. Re-entering the SAME qid (e.g. grid
      // jump back to the current question) still resets enteredAt —
      // dwell only accrues between enter and leave/settle.
      const dwellMs = flushCurrent(state, now)
      return { ...state, dwellMs, current: { qid: action.qid, enteredAt: now } }
    }
    case 'pick': {
      const answers = new Map(state.answers)
      answers.set(action.qid, { letter: action.letter, lastAt: now })
      return { ...state, answers }
    }
    case 'leave': {
      const dwellMs = flushCurrent(state, now)
      return { ...state, dwellMs, current: null }
    }
    case 'settle': {
      const dwellMs = flushCurrent(state, now)
      return { ...state, dwellMs, current: null }
    }
    default:
      return state
  }
}

/** Total dwell time for a qid, including any still-in-flight visit as of
 *  `now` (defaults to Date.now()) — used by the header/summary so the
 *  CURRENT question's live time counts without requiring a leave() first. */
export function dwellFor(state: MockSheetState, qid: string, now: number = Date.now()): number {
  const base = state.dwellMs.get(qid) ?? 0
  if (state.current?.qid === qid) return base + (now - state.current.enteredAt)
  return base
}

/** Adapts the reducer state into the `Map<qid,{letter,timeMs}>` shape
 *  `computeMockSummary` (lib/mock.ts) expects. Blanks are simply absent
 *  from `answers` — computeMockSummary already treats a missing entry
 *  as unanswered. */
export function toSummarySheet(
  state: MockSheetState,
  now: number = Date.now(),
): Map<string, { letter: string | null; timeMs: number }> {
  const qids = new Set<string>([...state.answers.keys(), ...state.dwellMs.keys()])
  if (state.current) qids.add(state.current.qid)
  const out = new Map<string, { letter: string | null; timeMs: number }>()
  for (const qid of qids) {
    out.set(qid, {
      letter: state.answers.get(qid)?.letter ?? null,
      timeMs: dwellFor(state, qid, now),
    })
  }
  return out
}
