// Paused-session store — drives the Home resumption panel (F1 pick).
//
// One slot per surface kind (lesson / drill / repetition). The most-
// recently-paused slot surfaces on Home as a "Fortsätt här →" panel
// in the right column at studio width. When the user resumes and
// finishes (or explicitly resets), the relevant slot clears.
//
// The activation-energy win is real: ADHD-PI brains read "continue
// what you were doing" as warm and "pick something new" as cold. The
// resumption surface turns every paused-yesterday morning from a
// re-locate / re-orient task into a one-tap continuation.
//
// Storage: localStorage via Zustand's `persist` middleware under
// `hpc-paused-sessions`. Cross-device sync is a follow-up.
//
// Pause semantics:
//   - LESSON: the user opened a lesson, scrolled to step N, then left
//     before finishing. We track the section, optional framework
//     deep-link anchor, the current step index, and total steps.
//   - DRILL: the user started a drill session (live qid in URL) and
//     left mid-flow. We track the section, the qid they were on, and
//     the question index within the session.
//   - REPETITION: same shape as drill but for the repetition queue.
//
// Surfacing rule: the panel renders the most-recently-paused slot.
// If nothing is paused, the right column is air.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Section } from '@/data/questions'

export type PausedLesson = {
  kind: 'lesson'
  section: Section
  /** Optional framework-entry deep-link anchor (e.g. `XYZ-TRAP-016`). */
  frameworkId?: string
  /** 1-based step index the user was on when they left. */
  step: number
  /** Total steps in the lesson, captured at pause time so the panel
   *  reads "steg 3 av 7" without re-fetching framework data. */
  totalSteps: number
  /** Unix ms when the pause was recorded. */
  pausedAt: number
}

export type PausedDrill = {
  kind: 'drill'
  /** Section filter applied to the session, when present. */
  section?: Section
  /** The qid the user was looking at when they left. Routes back via
   *  `/drill?qid=...`, which already exists. */
  qid: string
  /** 1-based question index within the session. */
  questionIndex: number
  /** Total questions in the session. */
  totalQuestions: number
  pausedAt: number
}

export type PausedRepetition = {
  kind: 'repetition'
  /** Resume qid for `/repetition?qid=...` deep-link. */
  qid: string
  questionIndex: number
  totalQuestions: number
  pausedAt: number
}

export type PausedSession = PausedLesson | PausedDrill | PausedRepetition

type State = {
  lesson: PausedLesson | null
  drill: PausedDrill | null
  repetition: PausedRepetition | null
}

type Actions = {
  setLesson: (s: PausedLesson) => void
  setDrill: (s: PausedDrill) => void
  setRepetition: (s: PausedRepetition) => void
  clearLesson: () => void
  clearDrill: () => void
  clearRepetition: () => void
  /** Wipe every slot — used by e2e and the share-debug reset path. */
  reset: () => void
}

const INITIAL: State = { lesson: null, drill: null, repetition: null }

export const usePausedSessionStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...INITIAL,
      setLesson: (s) => set({ lesson: s }),
      setDrill: (s) => set({ drill: s }),
      setRepetition: (s) => set({ repetition: s }),
      clearLesson: () => set({ lesson: null }),
      clearDrill: () => set({ drill: null }),
      clearRepetition: () => set({ repetition: null }),
      reset: () => set(INITIAL),
    }),
    { name: 'hpc-paused-sessions', version: 1 },
  ),
)

/**
 * Returns the most-recently-paused session across all three slots,
 * or null when nothing is paused. Consumers (the Home resumption
 * panel) render based on this single signal.
 */
export function pickMostRecent(state: State): PausedSession | null {
  const candidates: PausedSession[] = []
  if (state.lesson) candidates.push(state.lesson)
  if (state.drill) candidates.push(state.drill)
  if (state.repetition) candidates.push(state.repetition)
  if (candidates.length === 0) return null
  return candidates.reduce((best, s) => (s.pausedAt > best.pausedAt ? s : best))
}

/** Hook variant — re-renders the Home panel when any slot changes. */
export function useMostRecentPausedSession(): PausedSession | null {
  return usePausedSessionStore((s) => pickMostRecent(s))
}
