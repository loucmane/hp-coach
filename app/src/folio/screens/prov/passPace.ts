import type { Question, Section } from '@/data/questions'
import { uhrTimeMs } from '@/lib/uhrPacing'

export type PassRun = { section: Section; start: number; end: number }

/** Half-open contiguous runs; positions belong to this pass, not the source booklet. */
export function runsOf(plan: readonly Question[]): PassRun[] {
  const runs: PassRun[] = []
  plan.forEach((q, index) => {
    const last = runs.at(-1)
    if (last?.section === q.section) last.end = index + 1
    else runs.push({ section: q.section, start: index, end: index + 1 })
  })
  return runs
}

export function numberRuns(plan: readonly Question[]) {
  return runsOf(plan).map((run) => ({
    ...run,
    label: `${run.section} ${run.start + 1}${run.end > run.start + 1 ? `–${run.end}` : ''}`,
  }))
}

/** Fractional question position at elapsed time under UHR's section allocations. */
export function paceAt(plan: readonly Question[], elapsedMs: number): number {
  let remaining = Math.max(0, elapsedMs)
  for (const run of runsOf(plan)) {
    const count = run.end - run.start
    const duration = uhrTimeMs(run.section, count) ?? 0
    if (duration > 0 && remaining < duration) return run.start + (remaining / duration) * count
    remaining -= duration
  }
  return plan.length
}

export function blanksSentence(
  plan: readonly Question[],
  answers: ReadonlyMap<string, { letter: string }>,
): string {
  const blanks = plan.flatMap((q, i) => (answers.get(q.qid)?.letter == null ? [i + 1] : []))
  if (!blanks.length) return 'Alla frågor är besvarade.'
  return `${blanks.length} ${blanks.length === 1 ? 'fråga är obesvarad' : 'frågor är obesvarade'}: ${blanks.join(', ')}.`
}
