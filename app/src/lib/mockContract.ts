// CONTRACT — types that mirror an unmerged scheduler PR's planned exports
// from @/lib/scheduler. DELETE THIS FILE (and switch all imports below to
// @/lib/scheduler) once that PR merges. Do not add logic here — types only.
export type MockHalf = 'verbal' | 'kvant' // NOTE: already real in @/api/hooks/useMockResults — prefer importing THAT one in new code; this alias exists only for scheduler-shaped call sites.
export type MockPrescription = {
  due: boolean
  half: MockHalf
  daysSinceLast: number | null
  daysUntilNext: number
  interval: number
}
export function prescribeMock(_signals: unknown): MockPrescription {
  throw new Error('CONTRACT stub — replace with real @/lib/scheduler.prescribeMock once merged')
}

// Widened PlanItem — real scheduler.ts PlanItem.kind is 'lesson'|'drill'|'repetition'.
// This adds 'mock' for the Kallelse/DailyPlanCard call sites in THIS PR.
import type { PlanItem as RealPlanItem } from '@/lib/scheduler'
export type PlanItemWithMock = Omit<RealPlanItem, 'kind'> & { kind: RealPlanItem['kind'] | 'mock' }
