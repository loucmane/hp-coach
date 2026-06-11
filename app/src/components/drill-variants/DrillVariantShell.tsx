// Drill-variant shell — shared scaffold for /drill-style-a|b|c.
//
// Each variant renders the same data (a single canonical question +
// its Layer-2 explanation) in a different layout. This shell handles
// the boring parts that don't change between variants:
//
//   - lazy-load the question bank + the explanation for the qid
//   - manage `picked` (the user's answer letter) and `graded` (have
//     they answered yet) — so each variant is fully interactive,
//     not a static mock
//   - expose `onPick(letter)` and `onReset()` to the variant
//
// The variant component owns ALL visual composition: running head,
// status line, question rendering, pedagogy rendering, CTA. The
// shell is deliberately layout-agnostic.

import { type ReactNode, useEffect, useState } from 'react'

import { type Explanation, loadExplanation } from '@/data/explanations'
import { type AnswerLetter, findQuestion, loadBank, type Question } from '@/data/questions'

export type VariantData = {
  question: Question
  explanation: Explanation | null
  picked: AnswerLetter | null
  graded: boolean
  correct: boolean
  onPick: (letter: AnswerLetter) => void
  onReset: () => void
  /** 1-indexed position in the current drill plan. Undefined when
   *  the variant is rendered outside a session (legacy /drill-style-*
   *  routes, bake-offs). Used by the pre-grade apparatus footer. */
  position?: number
  /** Total questions in the current plan. Same nullability as
   *  position — both present or both absent. */
  total?: number
}

type Props = {
  /** qid to render. Defaults to the canonical KVA pilot if absent. */
  qid?: string
  /** Render-prop: the variant layout. */
  children: (data: VariantData) => ReactNode
}

const DEFAULT_QID = 'host-2013-kvant2-KVA-016'

export function DrillVariantShell({ qid = DEFAULT_QID, children }: Props) {
  const [bank, setBank] = useState<readonly Question[] | null>(null)
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [picked, setPicked] = useState<AnswerLetter | null>(null)
  const [graded, setGraded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBank()
      .then(setBank)
      .catch((e: unknown) => setError(String(e)))
  }, [])

  useEffect(() => {
    setExplanation(null)
    loadExplanation(qid)
      .then(setExplanation)
      .catch((e: unknown) => setError(String(e)))
  }, [qid])

  if (error) {
    return (
      <div style={{ padding: 32, color: 'var(--bad)', fontFamily: 'var(--font-mono)' }}>
        Kunde inte ladda data: {error}
      </div>
    )
  }
  if (!bank) {
    return (
      <div style={{ padding: 32, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
        Laddar fråga…
      </div>
    )
  }

  const question = findQuestion(bank, qid)
  if (!question) {
    return (
      <div style={{ padding: 32, color: 'var(--bad)', fontFamily: 'var(--font-mono)' }}>
        Frågan {qid} hittades inte i banken.
      </div>
    )
  }

  return (
    <>
      {children({
        question,
        explanation,
        picked,
        graded,
        correct: picked === question.answer,
        onPick: (letter) => {
          if (graded) return
          setPicked(letter)
          setGraded(true)
        },
        onReset: () => {
          setPicked(null)
          setGraded(false)
        },
      })}
    </>
  )
}
