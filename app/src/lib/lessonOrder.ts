import type { FrameworkLeverage } from '@/data/leverage'

/** Order a section's candidates before the stable soft-prerequisite grouping
 *  and hard gate. Pure: never mutates the catalog or the learner's signals.
 *  Missing coverage keeps the entire section in its original catalog order. */
export function orderLessonEntries<T extends { id: string }>(
  entries: readonly T[],
  leverage: FrameworkLeverage | null,
  misses: ReadonlyMap<string, number> = new Map(),
): T[] {
  if (!leverage || entries.some(({ id }) => !leverage.has(id))) return [...entries]
  return entries
    .map((entry, index) => {
      const { coverage, position } = leverage.get(entry.id)!
      const count = misses.get(entry.id) ?? 0
      const boundedMisses = Number.isFinite(count) ? Math.min(Math.max(count, 0), 4) : 0
      return { entry, index, priority: coverage * (1 + boundedMisses / 4), position }
    })
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        (a.position ?? Number.POSITIVE_INFINITY) - (b.position ?? Number.POSITIVE_INFINITY) ||
        a.index - b.index,
    )
    .map(({ entry }) => entry)
}
