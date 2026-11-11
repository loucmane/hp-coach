export type FacitConfidence = 'guess' | 'think' | 'sure'
export type FacitSection =
  | 'own'
  | 'core'
  | 'steps'
  | 'alternatives'
  | 'takeaway'
  | 'framework'
  | 'lock'
  | 'feedback'

/** The map and body share this order. Callers remove only absent content.
 * Unknown confidence is never treated as a confident correct answer. */
export function facitOrder(
  correct: boolean | null,
  confidence?: FacitConfidence | null,
): FacitSection[] {
  const learning: FacitSection[] = ['core', 'steps', 'alternatives', 'takeaway', 'framework']
  if (correct === true && confidence === 'sure') return ['lock', ...learning, 'feedback']
  return [...(correct === false ? ['own' as const] : []), ...learning, 'lock', 'feedback']
}
