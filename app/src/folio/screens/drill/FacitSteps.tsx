import { type ReactNode, useRef, useState } from 'react'
import { MathText } from '@/components/MathText'
import type { ExplanationStep } from '@/data/explanations'
import { useScopedKeys } from '@/folio/lib/useScopedKeys'
import { type DrillCoreActions, type DrillCoreRefs, splitStepRefs } from './drillCore'

export type FacitActions = Pick<DrillCoreActions, 'cite' | 'goToStep' | 'toggleStep'>

export function FacitSteps({
  steps,
  tags,
  picked,
  cites,
  act,
  refs,
  point,
  lang,
}: {
  steps: readonly ExplanationStep[]
  tags: Readonly<Record<number, readonly string[]>>
  picked: string | null
  cites: Readonly<Record<number, number[]>>
  act: FacitActions
  refs: Pick<DrillCoreRefs, 'step'>
  point: (source: string | null) => void
  lang?: 'en'
}) {
  const region = useRef<HTMLOListElement>(null)
  const [lit, setLit] = useState<number | null>(null)
  const light = (n: number) => {
    setLit(n)
    point(`step-${n}`)
  }
  const move = (delta: number) => {
    const at = steps.findIndex((step) => step.n === lit)
    const step = steps[Math.max(0, Math.min(steps.length - 1, at + delta))]
    if (!step) return false
    light(step.n)
    act.goToStep(step.n)
    region.current
      ?.querySelector<HTMLButtonElement>(`[data-step-control="${step.n}"]`)
      ?.focus({ preventScroll: true })
  }
  useScopedKeys(region, { j: () => move(1), k: () => move(-1) })
  return (
    <>
      <p className="fa-facit-legend">
        <span>Kärna: följ dem för snabbaste vägen</span>
        <span>Detalj: kontroller och fördjupning</span>
      </p>
      <ol className="fa-facit-spine" ref={region}>
        {steps.map((step) => (
          <li
            key={step.n}
            className="fa-step"
            data-tier={step.tier ?? 'essential'}
            data-active={lit === step.n}
            data-testid={`fa-step-${step.n}`}
            ref={refs.step(step.n)}
            onMouseEnter={() => light(step.n)}
            onMouseLeave={() => point(null)}
            onFocus={() => light(step.n)}
            onBlur={() => point(null)}
          >
            <button
              type="button"
              className="fa-step-n"
              data-step-control={step.n}
              aria-label={`Steg ${step.n}`}
              aria-pressed={lit === step.n}
              onClick={() => {
                light(step.n)
                act.goToStep(step.n)
              }}
            >
              {step.n}
            </button>
            <div>
              <div className="fa-step-head">
                <h4 className="fa-step-title">
                  <span className="fa-sr">Steg {step.n}: </span>
                  <InLang lang={lang}>{step.title}</InLang>
                </h4>
                <span className="fa-facit-tier">{step.tier === 'detail' ? 'Detalj' : 'Kärna'}</span>
                {(tags[step.n] ?? []).map((letter) => (
                  <span key={letter} className="fa-refutes" data-mine={letter === picked}>
                    motbevisar {letter}
                    {letter === picked ? ' · ditt val' : ''}
                  </span>
                ))}
                <Cites list={cites[step.n] ?? []} source={`step-${step.n}`} act={act} />
              </div>
              <p className="fa-step-text" lang={lang}>
                <Rich text={step.text} act={act} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}

export function InLang({ lang, children }: { lang?: 'en'; children: ReactNode }) {
  return lang ? <span lang={lang}>{children}</span> : children
}

/** Preserve the reading drill's paragraph links and their quotation sources. */
export function Cites({
  list,
  source,
  act,
}: {
  list: number[]
  source: string
  act: Pick<DrillCoreActions, 'cite'>
}) {
  if (!list.length) return null
  return (
    <span className="fa-cites">
      <span className="fa-cites-see" aria-hidden>
        Se
      </span>
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="fa-cite"
          data-testid={`rd-cite-${n}`}
          data-fa-cite={`${source}:${n}`}
          onClick={() => act.cite(n, source)}
          aria-label={`Visa stycke ${n} i texten`}
        >
          ¶{n}
        </button>
      ))}
    </span>
  )
}

/** Keep the authored text, including the existing splitStepRefs behaviour. */
export function Rich({ text, act }: { text: string; act: Pick<DrillCoreActions, 'goToStep'> }) {
  let at = 0
  return (
    <>
      {splitStepRefs(text).map((segment) => {
        const key = at
        at += segment.text.length
        return segment.kind === 'text' ? (
          <span key={key}>
            <MathText>{segment.text}</MathText>
          </span>
        ) : (
          <button
            key={key}
            type="button"
            className="fa-stepref"
            onClick={() => act.goToStep(segment.steps[0])}
          >
            {segment.text}
          </button>
        )
      })}
    </>
  )
}
