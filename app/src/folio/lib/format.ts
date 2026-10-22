export function fmtScore(score: number): string {
  return score.toFixed(1).replace('.', ',')
}

export function inWords(n: number): string {
  return (
    ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio'][n] ?? String(n)
  )
}

/** Prototype estimate, scaled to the ready queue rather than today's whole pile. */
export function roundMinutes(ready: number, estimate?: { count: number; minutes: number }): number {
  if (!estimate) return Math.max(1, ready)
  return Math.max(
    1,
    Math.round(estimate.count > 0 ? (estimate.minutes * ready) / estimate.count : estimate.minutes),
  )
}
