import { useId, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { citeParagraphs } from '@/components/devbake/redesign/r1Kit'
import { MathText } from '@/components/MathText'
import type { DistractorExplanation } from '@/data/explanations'
import { Cites, type RasterDrillState, RichText } from './RasterParts'

export function RasterFeedback({ view, act, refs }: RasterDrillState) {
  const { data, actions } = useDirectionData()
  const e = view.explanation
  const frameworkId = e?.framework_id
  const option = (letter: string | null) =>
    view.question.options?.find((o) => o.letter === letter)?.text
  const mine = view.correct ? undefined : e?.distractors.find((d) => d.letter === view.picked)
  const others = e?.distractors.filter((d) => d !== mine) ?? []
  const cites = (text: string) => citeParagraphs(text, view.passage?.paragraphs ?? [])
  return (
    <div className="ra-feedback">
      <p className="ra-label">{view.question.section} / Facit</p>
      <h2 className="ra-verdict" data-testid="rd-verdict" data-correct={String(view.correct)}>
        <span aria-hidden>{view.correct ? '✓' : '×'}</span>
        <span>
          {view.correct ? 'Rätt svar.' : 'Fel svar.'}
          <small>Rätt svar är {view.question.answer}.</small>
        </span>
      </h2>
      <dl className="ra-answer-ledger">
        <div>
          <dt>Ditt svar</dt>
          <dd>
            <b>{view.picked}</b>
            <span>
              <MathText>{option(view.picked)}</MathText>
            </span>
          </dd>
        </div>
        {!view.correct ? (
          <div data-right="true">
            <dt>Rätt svar</dt>
            <dd>
              <b>{view.question.answer}</b>
              <span>
                <MathText>{option(view.question.answer)}</MathText>
              </span>
            </dd>
          </div>
        ) : null}
      </dl>
      {!e ? (
        <p className="ra-missing">Förklaringen saknas för den här frågan.</p>
      ) : (
        <>
          {mine ? (
            <section className="ra-lure" data-testid={`rd-distractor-${mine.letter}`}>
              <div className="ra-feedback-row">
                <div className="ra-evidence-margin">
                  <Cites
                    list={view.distractorCites[mine.letter]?.tempting ?? []}
                    act={act}
                    source={`why-${mine.letter}`}
                  />
                </div>
                <div>
                  <h3>Varför det lockade</h3>
                  <p>
                    <RichText text={mine.why_tempting} act={act} />
                  </p>
                </div>
              </div>
              <div className="ra-feedback-row">
                <div className="ra-evidence-margin">
                  <Cites
                    list={view.distractorCites[mine.letter]?.wrong ?? []}
                    act={act}
                    source={`why-${mine.letter}`}
                  />
                </div>
                <div>
                  <h3>Varför det är fel</h3>
                  <p>
                    <RichText text={mine.why_wrong} act={act} />
                  </p>
                </div>
              </div>
            </section>
          ) : null}
          {e.pitfall ? (
            <section className="ra-feedback-row" data-testid="rd-pitfall">
              <div className="ra-evidence-margin">
                <Cites list={cites(e.pitfall)} act={act} />
              </div>
              <div>
                <h3>Fällan</h3>
                <p>
                  <MathText>{e.pitfall}</MathText>
                </p>
              </div>
            </section>
          ) : null}
          <section className="ra-feedback-row" data-testid="rd-technique">
            <div className="ra-evidence-margin">
              <Cites list={cites(e.technique)} act={act} />
            </div>
            <div>
              <h3>Tekniken</h3>
              <p>
                <MathText>{e.technique}</MathText>
              </p>
            </div>
          </section>
          <section className="ra-feedback-row">
            <div className="ra-evidence-margin">
              <Cites list={cites(e.solution_path)} act={act} />
            </div>
            <div>
              <h3>Lösningen</h3>
              <p>
                <MathText>{e.solution_path}</MathText>
              </p>
            </div>
          </section>
          <section className="ra-steps">
            <h3>Stegen</h3>
            <ol>
              {(e.steps ?? []).map((step) => {
                const detail = step.tier === 'detail'
                const open = !detail || view.openSteps.has(step.n)
                return (
                  <li
                    className="ra-feedback-row"
                    key={step.n}
                    ref={refs.step(step.n)}
                    data-testid={`rd-step-${step.n}`}
                    data-tier={step.tier}
                  >
                    <div className="ra-evidence-margin">
                      <span className="ra-step-number">{String(step.n).padStart(2, '0')}</span>
                      <Cites
                        list={view.stepCites[step.n] ?? []}
                        source={`step-${step.n}`}
                        act={act}
                      />
                    </div>
                    <div>
                      <h4>
                        <MathText>{step.title}</MathText>
                      </h4>
                      {open ? (
                        <p>
                          <RichText text={step.text} act={act} />
                        </p>
                      ) : null}
                      {detail ? (
                        <button
                          type="button"
                          className="ra-detail-toggle"
                          data-testid={`rd-step-toggle-${step.n}`}
                          aria-expanded={open}
                          onClick={() => act.toggleStep(step.n)}
                        >
                          {open ? 'Dölj fördjupningen −' : 'Fördjupning ＋'}
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
          <section className="ra-other-options">
            <h3>De andra alternativen</h3>
            {others.map((d) => (
              <OtherOption
                key={d.letter}
                d={d}
                option={option(d.letter) ?? ''}
                view={view}
                act={act}
                refs={refs}
              />
            ))}
          </section>
          {frameworkId ? (
            <p className="ra-framework">
              <button type="button" onClick={() => actions.openLesson(frameworkId)}>
                Ramverk: {data.frameworks[frameworkId] ?? frameworkId} · finns i Uppslag ↗
              </button>
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

function OtherOption({
  d,
  option,
  view,
  act,
}: RasterDrillState & { d: DistractorExplanation; option: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const cites = view.distractorCites[d.letter]
  return (
    <article className="ra-other-option" data-testid={`rd-distractor-${d.letter}`}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <b>{d.letter}</b>
        <span>
          <MathText>{option}</MathText>
        </span>
        <span aria-hidden>{open ? '−' : '＋'}</span>
      </button>
      <div id={id} hidden={!open}>
        {open ? (
          <>
            <h4>Varför det lockade</h4>
            <p>
              <RichText text={d.why_tempting} act={act} />
            </p>
            <Cites list={cites?.tempting ?? []} act={act} source={`why-${d.letter}`} />
            <h4>Varför det är fel</h4>
            <p>
              <RichText text={d.why_wrong} act={act} />
            </p>
            <Cites list={cites?.wrong ?? []} act={act} source={`why-${d.letter}`} />
          </>
        ) : null}
      </div>
    </article>
  )
}
