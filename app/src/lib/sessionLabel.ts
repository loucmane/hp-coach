import { ORD_WORDS_SECTIONS } from '@/lib/ordWords'
import { parseTimedSections } from '@/lib/timedDrill'

/** Plain Swedish labels shared by Home and the history journal. */
export function passLabel(row: { kind: string; sections: string | null }): string {
  if (row.kind === 'adaptive_review') return 'Rep'
  if (row.sections?.toUpperCase() === ORD_WORDS_SECTIONS) return 'Ordbank'
  const timed = parseTimedSections(row.sections)
  return timed ? `${timed} på tid` : (row.sections ?? 'Övning')
}
