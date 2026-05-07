// Exam target-date store.
//
// Owns: which sitting the user is preparing for, and (derived) how many
// calendar days remain. The day-counter on Daily Home reads from this.
//
// Persistence is a Phase-1 concern — we'll add Drizzle/SQLocal wiring once
// the parser feeds questions in. For now, in-memory is fine.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { daysUntil, EXAM_SITTINGS, type ExamSitting } from '@/lib/dates'

type ExamState = {
  sittingId: ExamSitting['id']
  setSitting: (id: ExamSitting['id']) => void
}

const DEFAULT_SITTING_ID = EXAM_SITTINGS[0].id // Höstprov 26

// Persist only the sitting id — Dates don't survive JSON.stringify, so we
// resolve the full sitting object via a selector on each read.
export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      sittingId: DEFAULT_SITTING_ID,
      setSitting: (id) => {
        if (EXAM_SITTINGS.some((s) => s.id === id)) set({ sittingId: id })
      },
    }),
    { name: 'hpc-exam' },
  ),
)

/** Hook: resolve the active sitting object from the store's id. */
export function useSitting(): ExamSitting {
  const id = useExamStore((s) => s.sittingId)
  return EXAM_SITTINGS.find((s) => s.id === id) ?? EXAM_SITTINGS[0]
}

/**
 * Hook: live days-remaining counter derived from the active sitting.
 * Recomputed on every render — fine at this scale; promote to a tick
 * effect if we ever show a live ticker on screen.
 */
export function useDaysRemaining(now: Date = new Date()): number {
  const sitting = useSitting()
  return daysUntil(sitting.date, now)
}
