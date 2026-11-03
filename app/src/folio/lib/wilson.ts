/** z for a two-sided 95 % interval. */
const Z = 1.959963984540054

export type WilsonInterval = { low: number; high: number }

/**
 * The 95 % Wilson score interval for `k` right of `n`: the honest hit-rate
 * band (provresultat "10 av 12" → about 55–95 %). Unlike p ± z·se it stays
 * inside 0–1 and does not collapse to a point at 0 or n right.
 *
 * With no evidence (n = 0, or counts that are not numbers) it claims nothing
 * and returns the whole range. A k outside 0…n is clamped.
 */
export function wilson(k: number, n: number): WilsonInterval {
  if (!Number.isFinite(k) || !Number.isFinite(n) || n <= 0) return { low: 0, high: 1 }
  const right = Math.min(Math.max(k, 0), n)
  const p = right / n
  const z2 = Z * Z
  const scale = 1 + z2 / n
  const centre = (p + z2 / (2 * n)) / scale
  const half = (Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / scale
  return {
    low: right === 0 ? 0 : Math.max(0, centre - half),
    high: right === n ? 1 : Math.min(1, centre + half),
  }
}
