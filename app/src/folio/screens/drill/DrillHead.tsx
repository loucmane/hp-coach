import { ChevronRight } from 'lucide-react'
import { type RefCallback, useState } from 'react'
import { MathText } from '@/components/MathText'
import type { Explanation } from '@/data/explanations'
import type { DrillCoreView } from './drillCore'
import type { drillSeam } from './drillSeam'

export function DrillHead({
  seam,
  index,
  total,
}: {
  seam: ReturnType<typeof drillSeam>
  index: number
  total: number
}) {
  return (
    <header className="fa-runhead fa-runhead--solo">
      <h1 className="fa-label fa-runhead-title">{seam.label}</h1>
      <span className="fa-runhead-pos">
        {seam.unit} {index + 1} av {total}
      </span>
    </header>
  )
}
export function Verdict({
  view,
  focusRef,
}: {
  view: Pick<DrillCoreView, 'correct' | 'question'>
  focusRef: RefCallback<HTMLHeadingElement>
}) {
  return (
    <h2 className="fa-verdict" data-testid="fa-verdict" tabIndex={-1} ref={focusRef}>
      <span>
        <b>{view.correct ? 'Rätt.' : 'Fel.'}</b> {view.correct ? 'Svaret är' : 'Rätt svar är'}{' '}
        {view.question.answer}.
      </span>
    </h2>
  )
}
export function TacticNote({
  explanation,
  variant,
}: {
  explanation: Explanation | null
  variant: 'margin' | 'disclosure'
}) {
  const [open, setOpen] = useState(false)
  const tactic = explanation?.pregrade_tactic
  if (!tactic) return null
  const toggle = (
    <button
      type="button"
      className="fa-more fa-tactic-toggle"
      aria-expanded={open}
      aria-controls="fa-tactic-body"
      onClick={() => setOpen(!open)}
    >
      {open ? 'Dölj taktik' : 'Visa taktik'}
      <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
    </button>
  )
  if (variant === 'margin') {
    return (
      <div className="fa-tactic fa-tactic--ask" data-open={String(open)}>
        {toggle}
        {open ? (
          <aside aria-labelledby="fa-tactic-h" id="fa-tactic-body">
            <h2 className="fa-h3" id="fa-tactic-h">
              Taktik
            </h2>
            <p className="fa-tactic-handle">{tactic.handle}</p>
            <p className="fa-margin-note">
              <MathText>{tactic.move}</MathText>
            </p>
          </aside>
        ) : null}
      </div>
    )
  }
  return (
    <div className="fa-tactic-fold" data-open={String(open)}>
      {toggle}
      {open ? (
        <div className="fa-tactic-body" id="fa-tactic-body">
          <p className="fa-tactic-handle">{tactic.handle}</p>
          <p className="fa-margin-note">
            <MathText>{tactic.move}</MathText>
          </p>
        </div>
      ) : null}
    </div>
  )
}
