import type { ReactNode } from 'react'
import type { DrillCoreView } from './drillCore'
import type { DrillQuestion } from './types'

const CLOZE_GAP_RE = /(?<![\w–-])_{0,14}(\d{2})_{0,14}(?![\w–\-%])/g
const GAP_MARK_RE = /_{3,}(?:\((\d+)\)_{3,})?/g

/** The authentic bank's ascending chain; ordinary ages and percentages stay text. */
export function findGapChain(context: string, currentNumber: number): Set<number> {
  const cands = [...context.matchAll(CLOZE_GAP_RE)]
    .map((m) => Number(m[1]))
    .filter((n) => Math.abs(n - currentNumber) <= 6)
  let best: number[] = []
  for (let i = 0; i < cands.length; i++) {
    const chain = [cands[i]]
    for (let j = i + 1; j < cands.length; j++) {
      if (cands[j] === chain[chain.length - 1] + 1) chain.push(cands[j])
    }
    if (chain.includes(currentNumber) && chain.length > best.length) best = chain
  }
  return new Set(best.length ? best : cands)
}

export type GapToken = { start: number; end: number; n: number }
export function gapTokens(q: DrillQuestion): GapToken[][] {
  const passage = q.passage
  if (q.section !== 'ELF' || !passage) return []
  if (!passage.synthetic && q.prompt?.trim()) return []
  const chain = findGapChain(passage.paragraphs.join('\n\n'), q.number)
  let bare = 0
  return passage.paragraphs.map((text) =>
    [...text.matchAll(passage.synthetic ? GAP_MARK_RE : CLOZE_GAP_RE)].flatMap((m) => {
      if (passage.synthetic) bare++
      const n = passage.synthetic ? (m[1] ? Number(m[1]) : bare) : Number(m[1])
      if (!passage.synthetic && !chain.has(n)) return []
      return [{ start: m.index, end: m.index + m[0].length, n }]
    }),
  )
}

export function gapNumbers(questions: readonly DrillQuestion[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const q of questions) {
    if (q.section === 'ELF' && !q.prompt?.trim()) {
      out[q.qid] = q.number
      continue
    }
    const tokens = gapTokens(q).flat()
    if (!tokens.length) continue
    const named = /^\s*(?:gap|lucka)\s*\(?(\d+)\)?\s*$/i.exec(q.prompt ?? '')
    if (named) out[q.qid] = Number(named[1])
  }
  return out
}

export type GapModel = {
  current: number | null
  chosen: string | null
  graded: Record<number, { right: string; wrong: string | null }>
}
export function gapModel(view: DrillCoreView, questions: readonly DrillQuestion[]): GapModel {
  const numbers = gapNumbers(questions)
  const word = (q: DrillQuestion, letter: string | null) =>
    q.options?.find((o) => o.letter === letter)?.text ?? null
  const graded: GapModel['graded'] = {}
  for (const result of view.results) {
    const q = questions.find((q) => q.qid === result.qid)
    const n = numbers[result.qid]
    if (
      !q ||
      n == null ||
      q.passage?.paragraphs.join('\n\n') !== view.passage?.paragraphs.join('\n\n')
    )
      continue
    const right = word(q, q.answer)
    if (right) graded[n] = { right, wrong: result.correct ? null : word(q, result.pick) }
  }
  return {
    current: numbers[view.question.qid] ?? null,
    chosen: view.phase === 'question' ? word(view.question, view.selected) : null,
    graded,
  }
}

function GapMark({ n, model }: { n: number; model: GapModel }) {
  const graded = model.graded[n]
  const current = !graded && model.current === n
  const chosen = current ? model.chosen : null
  const word = graded?.right ?? chosen
  const label = graded?.wrong
    ? `lucka ${n}: ditt ord ${graded.wrong}, rätt ord ${graded.right}`
    : `lucka ${n}: ${word ?? 'tom'}`
  return (
    <span
      className="rd-gapmark"
      data-gap={n}
      data-state={graded ? (graded.wrong ? 'wrong' : 'right') : current ? 'current' : 'blank'}
    >
      <span className="fa-sr" lang="sv">
        {label}
      </span>
      <span aria-hidden>
        {graded?.wrong ? <s>{graded.wrong}</s> : null}
        {word ? <span className="rd-gapword">{word}</span> : null}
        <span className="rd-gapnumber">{n}</span>
      </span>
    </span>
  )
}

export function GapRun({
  text,
  tokens,
  model,
}: {
  text: string
  tokens: GapToken[]
  model: GapModel
}) {
  const out: ReactNode[] = []
  let at = 0
  for (const token of tokens) {
    out.push(text.slice(at, token.start))
    out.push(<GapMark key={token.start} n={token.n} model={model} />)
    at = token.end
  }
  out.push(text.slice(at))
  return <>{out}</>
}
