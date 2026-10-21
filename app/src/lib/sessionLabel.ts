import { decodeTreatedMarker } from '@/lib/adaptiveReview'
import { ORD_WORDS_SECTIONS } from '@/lib/ordWords'
import { parseTimedSections } from '@/lib/timedDrill'

/** Plain Swedish labels shared by Home and the history journal. */
export function passLabel(
  row: { kind: string; sections: string | null },
  { short = false }: { short?: boolean } = {},
): string {
  if (row.kind === 'adaptive_review') return short ? 'Rep' : 'Repetition'
  const detour = decodeTreatedMarker(row.sections)
  if (detour) return `${detour.section.toUpperCase()} · repetition`
  if (row.sections?.toUpperCase() === ORD_WORDS_SECTIONS) return 'Ordbank'
  const timed = parseTimedSections(row.sections)
  return timed ? `${timed} på tid` : (row.sections ?? 'Övning')
}
