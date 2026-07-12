// Per-section due-repetition derivation for the Öva hub lanes.
//
// The hub's section rows carry the bake-off's live folio signal ("N
// väntar") — each lane shows how many due mistakes belong to THAT
// section, derived from the same due-mistakes rows the nav numeral
// reads. Real data or nothing: a section with zero due shows no number.
//
// Sections are derived from the qid, whose shape is stable across the
// whole corpus: `{exam}-{half}-{SECTION}-{number}` — the second-to-last
// dash segment is always the section literal (verified across all 4320
// bank rows, incl. LÄS with its Ä). Rows whose qid doesn't resolve to a
// known section are skipped (corpus drift / seed rows), matching how
// the replay picker drops unresolvable qids.

import type { Mistake } from '@/api/hooks/useMistakes'
import { SECTION_KEYS, type Section } from '@/data/questions'

const SECTION_SET: ReadonlySet<string> = new Set(SECTION_KEYS)

/** Section of a mistake's questionId, or null when the qid doesn't
 *  carry a recognisable section token. */
export function sectionOfQid(qid: string): Section | null {
  const parts = qid.split('-')
  const token = parts[parts.length - 2]
  return token && SECTION_SET.has(token) ? (token as Section) : null
}

/** Count due mistakes per section. Every section key is present (0 when
 *  clean) so consumers can index without guards; unresolvable rows are
 *  dropped, never mis-bucketed. */
export function dueCountsBySection(
  due: readonly Pick<Mistake, 'questionId'>[] | undefined,
): Record<Section, number> {
  const out = Object.fromEntries(SECTION_KEYS.map((s) => [s, 0])) as Record<Section, number>
  for (const row of due ?? []) {
    const section = sectionOfQid(row.questionId)
    if (section) out[section] += 1
  }
  return out
}
