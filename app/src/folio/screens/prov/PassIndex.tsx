import type { Question } from '@/data/questions'
import type { MockSheetState } from '@/lib/mockSheet'
import { numberRuns } from './passPace'

export function PassIndex({
  plan,
  sheet,
  index,
  onJump,
}: {
  plan: readonly Question[]
  sheet: MockSheetState
  index: number
  onJump: (index: number) => void
}) {
  return (
    <nav className="fa-pass-index" aria-label="Frågorna i provpasset" data-testid="mock-grid">
      {numberRuns(plan).map((run) => (
        <section className="fa-pass-run" key={run.start} aria-label={run.label}>
          <h3 className="fa-pass-run-label">{run.label}</h3>
          <div className="fa-pass-cells">
            {plan.slice(run.start, run.end).map((q, offset) => {
              const position = run.start + offset
              const answered = sheet.answers.has(q.qid)
              const flagged = sheet.flagged.has(q.qid)
              return (
                <button
                  type="button"
                  className="fa-pass-cell"
                  key={q.qid}
                  data-testid={`mock-cell-${position + 1}`}
                  data-current={position === index}
                  data-answered={answered}
                  data-flagged={flagged}
                  aria-current={position === index ? 'step' : undefined}
                  aria-label={`Fråga ${position + 1}, ${q.section}, ${answered ? 'Besvarad' : 'Obesvarad'}${flagged ? ', Markerad' : ''}`}
                  onClick={() => onJump(position)}
                >
                  {position + 1}
                  {flagged ? <span className="fa-pass-dog-ear" aria-hidden="true" /> : null}
                </button>
              )
            })}
          </div>
        </section>
      ))}
      <p className="fa-pass-note">Fylld siffra: besvarad · Vikt hörn: markerad</p>
    </nav>
  )
}
