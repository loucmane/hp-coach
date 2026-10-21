import { useUser } from '@clerk/clerk-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { QuestionFigure } from '@/components/drill/QuestionFigure'
import { MathText } from '@/components/MathText'
import { type ExplanationStep, loadExplanation } from '@/data/explanations'
import { loadBank, type Question } from '@/data/questions'
import { WORKED_EXAMPLES } from '@/data/workedExamples.generated'
import { completeWorkedExample, readWorkedExampleLevel } from '@/lib/workedExampleFade'

type Example = (typeof WORKED_EXAMPLES)[number]
type Loaded = { question: Question; essential: ExplanationStep[]; detail: ExplanationStep[] }

/** Entries outside the manifest keep their existing content without an auth dependency. */
export function WorkedExample({
  entryId,
  fallback = null,
}: {
  entryId: string
  fallback?: ReactNode
}) {
  const example = WORKED_EXAMPLES.find((x) => x.entryId === entryId)
  return example ? <SignedInExample example={example} fallback={fallback} /> : fallback
}

function SignedInExample({ example, fallback }: { example: Example; fallback: ReactNode }) {
  const { user, isLoaded } = useUser()
  if (!isLoaded || !user) return fallback
  // Account or entry changes must discard both gated content and reveal progress.
  return (
    <Reader
      key={`${user.id}:${example.qid}`}
      userId={user.id}
      example={example}
      fallback={fallback}
    />
  )
}

function Reader({
  userId,
  example,
  fallback,
}: {
  userId: string
  example: Example
  fallback: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Loaded | null>(null)
  const [failed, setFailed] = useState(false)
  const [level, setLevel] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const completed = useRef(false)

  useEffect(() => {
    if (!open || data) return
    let alive = true
    setFailed(false)
    setLevel(readWorkedExampleLevel(userId, example.section))
    Promise.all([loadBank(), loadExplanation(example.qid)])
      .then(([bank, explanation]) => {
        if (!alive) return
        const question = bank.find((q) => q.qid === example.qid)
        const essential = explanation?.steps?.filter((step) => step.tier === 'essential') ?? []
        if (
          !question?.prompt ||
          !question.options?.length ||
          explanation?.framework_id !== example.entryId ||
          essential.length < 3
        ) {
          setFailed(true)
          return
        }
        setData({
          question,
          essential,
          detail: explanation.steps?.filter((step) => step.tier === 'detail') ?? [],
        })
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [open, data, example, userId])

  const total = data?.essential.length ?? 0
  const done = !!data && revealed === total
  const independent = level > 0 && revealed >= Math.max(2, total - level)
  const reveal = () => {
    if (!data || done) return
    const next = revealed + 1
    setRevealed(next)
    if (next === total && !completed.current) {
      completed.current = true
      completeWorkedExample(userId, example.section)
    }
  }

  return (
    <>
      {!data && fallback}
      <details
        onToggle={(event) => {
          // Detail-step toggles must never change the outer reader state.
          if (event.target === event.currentTarget) setOpen(event.currentTarget.open)
        }}
        style={{
          marginTop: 28,
          borderTop: '1px solid var(--hairline)',
          paddingTop: 16,
          fontFamily: 'var(--font-display)',
          lineHeight: 1.55,
          color: 'var(--ink)',
        }}
      >
        <summary style={{ cursor: 'pointer', minHeight: 44 }}>Ett exempel, steg för steg</summary>
        {open && !data && (
          <p role="status">{failed ? 'Exemplet kunde inte hämtas.' : 'Laddar exempel …'}</p>
        )}
        {data && (
          <div>
            <p style={{ whiteSpace: 'pre-wrap' }}>
              <MathText>{data.question.prompt ?? ''}</MathText>
            </p>
            {data.question.figure && <QuestionFigure figure={data.question.figure} />}
            <ul style={{ listStyle: 'none', paddingLeft: 0 }} aria-label="Svarsalternativ">
              {data.question.options?.map((option) => (
                <li key={option.letter} style={{ marginBlock: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', marginRight: 10 }}>
                    {option.letter}
                  </span>
                  <MathText>{option.text}</MathText>
                </li>
              ))}
            </ul>
            <p aria-live="polite" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              steg {revealed} av {total}
            </p>
            <ol style={{ paddingLeft: '1.4em' }}>
              {data.essential.slice(0, revealed).map((step) => (
                <li key={step.n} style={{ marginBlock: 14, whiteSpace: 'pre-wrap' }}>
                  {step.title && (
                    <strong>
                      <MathText>{step.title}</MathText>
                      <br />
                    </strong>
                  )}
                  <MathText>{step.text}</MathText>
                </li>
              ))}
            </ol>
            {!done && (
              <button
                type="button"
                onClick={reveal}
                style={{ minHeight: 44, padding: '8px 16px', cursor: 'pointer' }}
              >
                {independent ? 'Försök själv först' : 'Nästa steg'}
              </button>
            )}
            {done && (
              <>
                <p>Svar: {data.question.answer}</p>
                {data.detail.map((step) => (
                  <details key={step.n} style={{ marginBlock: 12 }}>
                    <summary style={{ cursor: 'pointer' }}>{step.title ?? 'Fördjupning'}</summary>
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                      <MathText>{step.text}</MathText>
                    </p>
                  </details>
                ))}
              </>
            )}
          </div>
        )}
      </details>
    </>
  )
}
