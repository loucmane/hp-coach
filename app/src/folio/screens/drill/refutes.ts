import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'

/** Invert authored wrong-reason references. Ordinary numbers and tempting
 * reasons are not evidence. Filter against real steps before expanding ranges. */
export function refutes(
  steps: readonly ExplanationStep[],
  distractors: readonly DistractorExplanation[],
): Record<number, string[]> {
  const result: Record<number, string[]> = {}
  for (const d of distractors) {
    const pattern = /\b(?:steg|steps?)\s+(\d+)(?:\s*(–|-|och|and)\s*(\d+))?/giu
    for (const match of d.why_wrong.matchAll(pattern)) {
      const from = Number(match[1])
      const to = match[3] ? Number(match[3]) : from
      const range = match[2] === '–' || match[2] === '-'
      for (const { n } of steps) {
        if (range ? n < from || n > to : n !== from && n !== to) continue
        result[n] ??= []
        const letters = result[n]
        if (!letters.includes(d.letter)) letters.push(d.letter)
      }
    }
  }
  return result
}
