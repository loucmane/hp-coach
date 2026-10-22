import { lazy } from 'react'
import type { Question } from '@/data/questions'

// This is the only runtime dependency SessionPlayer takes on the drill stage.
export const LazyFolioSessionStage = lazy(() => import('@/folio/screens/drill/FolioSessionStage'))

export function supportsFolioDrill(q: Question | undefined): boolean {
  return (
    !!q?.options?.length &&
    ['ORD', 'MEK', 'XYZ', 'KVA', 'NOG', 'LÄS', 'ELF', 'DTK'].includes(q.section)
  )
}

/** Half-open contiguous block, matching the product's DTK block convention. */
export function folioBlock(
  plan: readonly Question[],
  index: number,
): { start: number; end: number } {
  const q = plan[index]
  const same = (other: Question | undefined) =>
    !!other &&
    other.section === q.section &&
    supportsFolioDrill(other) &&
    (q.context
      ? other.context === q.context
      : !!q.figure?.src && other.figure?.src === q.figure.src)
  let start = index
  let end = index + 1
  while (start > 0 && same(plan[start - 1])) start--
  while (end < plan.length && same(plan[end])) end++
  return { start, end }
}
