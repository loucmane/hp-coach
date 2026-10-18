// Exam target-date store.
//
// Owns: which sitting the user is preparing for, and (derived) how many
// calendar days remain. The day-counter on Daily Home reads from this.
//
// Persistence is a Phase-1 concern — we'll add Drizzle/SQLocal wiring once
// the parser feeds questions in. For now, in-memory is fine.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { daysUntil, EXAM_SITTINGS, type ExamSitting, resolveSitting } from '@/lib/dates'

type ExamState = {
  /** The saved target, or null when none is saved (useSitting then follows
   *  the next sitting not yet over). */
  sittingId: ExamSitting['id'] | null
  setSitting: (id: ExamSitting['id']) => void
}

// Persist only the sitting id — Dates don't survive JSON.stringify, so we
// resolve the full sitting object via a selector on each read.
export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      // No saved target by default: it resolves to the next sitting not yet
      // over at read time, so the default never points at a past exam.
      sittingId: null,
      setSitting: (id) => {
        if (EXAM_SITTINGS.some((s) => s.id === id)) set({ sittingId: id })
      },
    }),
    { name: 'hpc-exam' },
  ),
)

/**
 * Hook: the sitting the user is preparing for at `now`. A saved target
 * whose exam day is over rolls forward to the next sitting not yet over.
 * Read-side only: the stored id (and the server row it mirrors, see
 * api/useSyncedPrefs) stays as it is.
 *
 * Fallback: once every configured sitting is over there is nothing to
 * roll to, so the last configured sitting stands in. Its count goes
 * negative and examPhase reads "provet är skrivet" until UHR's next
 * dates are added to EXAM_SITTINGS.
 */
export function useSitting(now: Date = new Date()): ExamSitting {
  const id = useExamStore((s) => s.sittingId)
  return resolveSitting(id, now) ?? EXAM_SITTINGS[EXAM_SITTINGS.length - 1]
}

/**
 * Hook: live days-remaining counter derived from the active sitting.
 * Recomputed on every render — fine at this scale; promote to a tick
 * effect if we ever show a live ticker on screen.
 */
export function useDaysRemaining(now: Date = new Date()): number {
  const sitting = useSitting(now)
  return daysUntil(sitting.date, now)
}
