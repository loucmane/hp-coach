// Read-side mirror of app/src/lib/dates.ts. sittings.test.ts pins every
// id/date against that source so calendar updates cannot silently drift.
// Dates use the same local-midnight convention as the app.
export const EXAM_SITTINGS: ReadonlyArray<{ id: string; date: Date }> = [
  { id: 'host-2026', date: new Date(2026, 9, 18) },
  { id: 'var-2027', date: new Date(2027, 3, 10) },
]

/** Saved sitting through its whole exam day, otherwise the next sitting.
 * Missing/unknown ids fall back too; an exhausted calendar returns null.
 * Like app resolveSitting, this never rewrites the saved preference. */
export function examFor(
  targetSittingId: string | null | undefined,
  now: Date = new Date(),
): Date | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const saved = EXAM_SITTINGS.find((sitting) => sitting.id === targetSittingId)
  if (saved && saved.date.getTime() >= today) return saved.date
  return EXAM_SITTINGS.find((sitting) => sitting.date.getTime() >= today)?.date ?? null
}
