// UHR's recommended time per delprov ("Rekommenderad provtid"), as printed
// on the cover of every provpass booklet in the corpus (hp_databas.json:
// the same two tables in all 108 booklets; uhrPacing.test.ts pins them).
// A pass's delprov is paced against these, never against an even split of
// the 55 minutes: LÄS and ELF get 22 minutes for ten questions, ORD three.

export type UhrDelprov = { questions: number; minutes: number }

export const UHR_DELPROV = {
  ORD: { questions: 10, minutes: 3 },
  LÄS: { questions: 10, minutes: 22 },
  MEK: { questions: 10, minutes: 8 },
  ELF: { questions: 10, minutes: 22 },
  XYZ: { questions: 12, minutes: 12 },
  KVA: { questions: 10, minutes: 10 },
  NOG: { questions: 6, minutes: 10 },
  DTK: { questions: 12, minutes: 23 },
} as const satisfies Record<string, UhrDelprov>

/** The delprov in the order a pass presents them (verbal, then kvant). */
export const UHR_ORDER = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK'] as const

/** A section's place in the test, for sorting; unknown sections last. */
export function uhrRank(section: string): number {
  const i = (UHR_ORDER as readonly string[]).indexOf(section)
  return i < 0 ? UHR_ORDER.length : i
}

/** UHR's time for a delprov in ms, scaled by the questions a pass
 *  presented when it presented fewer than the booklet; null for an
 *  unknown section or an empty delprov. */
export function uhrTimeMs(section: string, presented: number): number | null {
  const d = (UHR_DELPROV as Record<string, UhrDelprov>)[section]
  if (!d || presented <= 0) return null
  return (d.minutes * 60_000 * Math.min(presented, d.questions)) / d.questions
}

/** The time used against UHR's, in neutral words: "i takt" within a
 *  minute, else the difference to the nearest half minute. */
export function paceNote(timeMs: number, uhrMs: number): string {
  const diff = timeMs - uhrMs
  if (Math.abs(diff) < 60_000) return 'i takt'
  const halves = Math.round(Math.abs(diff) / 30_000)
  const whole = Math.floor(halves / 2)
  const minutes = halves % 2 ? `${whole === 0 ? '' : whole}½` : String(whole)
  return `${minutes} min ${diff > 0 ? 'mer' : 'mindre'} än UHR:s tid`
}
