import type { SessionKind } from '@/api/hooks/useSessions'
import type { Section } from '@/data/questions'

/** Product session labels; scheduling and repetition effects stay in the caller. */
export function drillSeam(kind: SessionKind, section: Section) {
  const repetition = kind === 'adaptive_review'
  return {
    label: repetition
      ? `Repetition · ${section}`
      : ['XYZ', 'KVA', 'NOG'].includes(section)
        ? `Kvant · ${section}`
        : section,
    unit: repetition ? 'Miss' : 'Fråga',
    next: repetition ? 'Nästa miss' : 'Nästa fråga',
    last: repetition ? 'Slutför genomgången' : 'Slutför övningen',
  }
}
