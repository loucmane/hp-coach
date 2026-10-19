import { Check, ChevronDown, X } from 'lucide-react'
import { FRAMEWORK_NAMES } from '@/components/devbake/redesign/r1Fixtures'
import { citeParagraphs } from '@/components/devbake/redesign/r1Kit'
import type { DistractorExplanation } from '@/data/explanations'
import { Cites, type Reading, Rich } from './LjuskaglaParts'

export function LjuskaglaFeedback({ view, act, refs }: Reading) {
  const { explanation: e, question: q } = view
  const mine = view.correct ? null : e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const right = q.options.find((option) => option.letter === q.answer)
  const reasons = (d: DistractorExplanation) => (
    <>
      <h3>Därför lockade {d.letter}</h3>
      <p>
        <Rich text={d.why_tempting} act={act} />
      </p>
      <Cites
        list={view.distractorCites[d.letter]?.tempting ?? []}
        source={`why-${d.letter}`}
        act={act}
      />
      <h3>Varför {d.letter} är fel</h3>
      <p>
        <Rich text={d.why_wrong} act={act} />
      </p>
      <Cites
        list={view.distractorCites[d.letter]?.wrong ?? []}
        source={`why-${d.letter}`}
        act={act}
      />
    </>
  )
  return (
    <div className="lj-feedback" data-testid="rd-feedback">
      <section
        className="lj-verdict"
        data-testid="rd-verdict"
        data-correct={String(view.correct === true)}
      >
        <div className="lj-verdict-heading">
          {view.correct ? <Check size={24} aria-hidden /> : <X size={24} aria-hidden />}
          <h2>{view.correct ? 'Rätt svar.' : 'Fel svar.'}</h2>
        </div>
        <p className="lj-eyebrow">
          {view.correct ? 'Du valde' : 'Rätt svar är'} {q.answer}
          {!view.correct && ` · du valde ${view.picked}`}
        </p>
        <p>{right?.text}</p>
      </section>
      {mine && (
        <section
          className="lj-feedback-section lj-picked"
          data-testid={`rd-distractor-${mine.letter}`}
        >
          {reasons(mine)}
        </section>
      )}
      <section className="lj-feedback-section">
        {e.pitfall && (
          <div data-testid="rd-pitfall">
            <h3>Fallgropen</h3>
            <p>{e.pitfall}</p>
          </div>
        )}
        <div data-testid="rd-technique">
          <h3>Tekniken att ta med</h3>
          <p>{e.technique}</p>
        </div>
      </section>
      <section className="lj-feedback-section" data-testid="rd-solution">
        <h3>Lösningen</h3>
        <p>{e.solution_path}</p>
        <Cites list={citeParagraphs(e.solution_path, view.passage.paragraphs)} act={act} />
      </section>
      <section className="lj-feedback-section">
        <h3>Steg för steg</h3>
        <ol className="lj-steps">
          {(e.steps ?? []).map((step) => {
            const detail = step.tier === 'detail'
            const open = !detail || view.openSteps.has(step.n)
            return (
              <li
                key={step.n}
                ref={refs.step(step.n)}
                data-testid={`rd-step-${step.n}`}
                data-tier={step.tier ?? 'essential'}
              >
                <span className="lj-step-number" aria-hidden>
                  {step.n}
                </span>
                <div>
                  <h4>{step.title}</h4>
                  {open && (
                    <>
                      <p>
                        <Rich text={step.text} act={act} />
                      </p>
                      <Cites
                        list={view.stepCites[step.n] ?? []}
                        source={`step-${step.n}`}
                        act={act}
                      />
                    </>
                  )}
                  {detail && (
                    <button
                      className="lj-text-button"
                      type="button"
                      data-testid={`rd-step-toggle-${step.n}`}
                      aria-expanded={open}
                      onClick={() => act.toggleStep(step.n)}
                    >
                      {open ? 'Dölj fördjupning' : 'Läs fördjupning'}
                      <ChevronDown size={16} aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>
      <section className="lj-feedback-section" data-testid="rd-other-options">
        <h3>De andra alternativen</h3>
        {others.map((d) => (
          <details key={d.letter} data-testid={`rd-distractor-${d.letter}`}>
            <summary>
              {d.letter} · {q.options.find((option) => option.letter === d.letter)?.text}
            </summary>
            {reasons(d)}
          </details>
        ))}
      </section>
      {e.framework_id && (
        <p className="lj-framework">
          Uppslag · {FRAMEWORK_NAMES[e.framework_id] ?? e.framework_id}
        </p>
      )}
    </div>
  )
}
