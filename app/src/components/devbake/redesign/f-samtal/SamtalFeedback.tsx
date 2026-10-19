// Samtal · Facit. After the answer the conversation goes on, then turns
// into notes. Your choice stands as your turn (right, a plum tint), and the
// coach answers in the shared content order:
//   - the dialogue, as turns: the verdict and the right answer; then one
//     real, optional question — "Vad lockade dig med A?" — with three reply
//     chips and "Hoppa över" (it never blocks: the coach's own answer is
//     already there below it); then what tempts in A and why A is wrong;
//   - the walk-through, as the coach's notes, untinted under a hairline: what
//     to watch for (the pitfall), what to do next time (the technique), how
//     to find the answer (the solution), step by step with the detail tier on
//     request ("Berätta mer"), and the other options, folded.
// Everything is there at once (a 120 ms fade, no typing). "Visa allt" in the
// action bar opens every fold together. Each ¶ link turns the passage to its
// paragraph and lights it, and a part under the pointer lights its own
// quotations in the text.
// The unit ends the same way: the coach sums up and proposes the plan's next
// part as a reply.

import { Check, X } from 'lucide-react'
import { type Ref, useState } from 'react'

import { FRAMEWORK_NAMES, PLAN, UNIT } from '@/components/devbake/redesign/r1Fixtures'
import type { DrillActions, DrillRefs, DrillView } from '@/components/devbake/redesign/r1Kit'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import { Cites, Coach, Divider, Kbd, Replies, Rich, You } from './SamtalParts'

const TITLE = UNIT.title.split(': ')[0]
/** The plan's next part, offered when the text is done. */
const NEXT = PLAN.items[0]
const WORDS = ['inga', 'en', 'två', 'tre', 'fyra', 'fem']
/** The coach's one question after a wrong answer: what tempted you. The
 *  reply is yours to give or skip; the explanation never waits on it. */
const LURES = ['Orden liknade texten', 'Det lät rimligt', 'Jag chansade']

/** The part the reader points at (hover or focus): its quotations and
 *  paragraph numbers light up in the passage. */
export type Pointing = { active: string | null; point: (source: string | null) => void }

/** The explanation's folds — the detail steps and the other options — and
 *  "Visa allt", which opens or closes them together. */
export type Folds = {
  others: ReadonlySet<string>
  toggleOther: (letter: string) => void
  allOpen: boolean
  showAll: () => void
}

type Hover = (source: string) => {
  onMouseEnter: () => void
  onMouseLeave: () => void
  onFocus: () => void
  onBlur: () => void
}

/** Your answer, as your turn in the conversation. */
export function YourAnswer({ view }: { view: DrillView }) {
  const o = view.question.options.find((x) => x.letter === view.picked)
  if (!o) return null
  return (
    <You kind="sa-turn--answer" data-anchor="answer">
      <p className="sa-turn-label">Ditt svar</p>
      <p className="sa-answer">
        <span className="sa-letter" aria-hidden>
          {o.letter}
        </span>
        <span className="sa-answer-text">
          <span className="sa-sr">alternativ {o.letter}: </span>
          {o.text}
        </span>
      </p>
    </You>
  )
}

/** The coach's verdict: a ringed glyph and a word, never colour alone, and
 *  the right answer in full. The compact form sits in the phone tray's
 *  peek. */
export function Verdict({
  view,
  compact = false,
  ref,
}: {
  view: DrillView
  compact?: boolean
  ref?: Ref<HTMLElement>
}) {
  const correct = view.correct === true
  const key = view.question.options.find((o) => o.letter === view.question.answer)
  return (
    <Coach
      kind={compact ? 'sa-verdict sa-verdict--compact' : 'sa-verdict'}
      data-correct={String(correct)}
      data-testid="rd-verdict"
      tabIndex={-1}
      ref={ref}
    >
      <p className="sa-verdict-line">
        <span className="sa-verdict-glyph" aria-hidden>
          {correct ? <Check size={17} strokeWidth={2.4} /> : <X size={17} strokeWidth={2.4} />}
        </span>
        <span>
          <b>{correct ? 'Rätt.' : 'Fel.'}</b>{' '}
          {correct ? `Svaret är ${view.question.answer}.` : `Rätt svar är ${view.question.answer}.`}
        </span>
      </p>
      {correct || compact || !key ? null : (
        <div className="sa-key">
          <span className="sa-letter" aria-hidden>
            {key.letter}
          </span>
          <p className="sa-key-text">
            <span className="sa-sr">Alternativ {key.letter}: </span>
            {key.text}
          </p>
          <span className="sa-key-tag">
            <Check size={14} strokeWidth={2.4} aria-hidden />
            Rätt svar
          </span>
        </div>
      )}
    </Coach>
  )
}

/** The rest of the coach's answer, in the shared order: the dialogue about
 *  your pick, then the notes. */
export function Explanation({
  view,
  act,
  refs,
  active,
  point,
  folds,
}: {
  view: DrillView
  act: DrillActions
  refs: DrillRefs
  folds: Folds
} & Pointing) {
  const e = view.explanation
  const q = view.question
  const optionText = (letter: string) => q.options.find((o) => o.letter === letter)?.text ?? ''
  const mine = view.correct ? null : (e.distractors.find((d) => d.letter === view.picked) ?? null)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const framework = e.framework_id ? FRAMEWORK_NAMES[e.framework_id] : undefined
  const hover: Hover = (source) => ({
    onMouseEnter: () => point(source),
    onMouseLeave: () => point(null),
    onFocus: () => point(source),
    onBlur: () => point(null),
  })

  return (
    <>
      {mine ? (
        <Lure
          key={q.qid}
          d={mine}
          view={view}
          act={act}
          active={active === `why-${mine.letter}`}
          hover={hover}
        />
      ) : null}

      {/* The walk-through: the coach's notes, not more bubbles. */}
      <section className="sa-notes" aria-labelledby="sa-notes-h">
        <h3 className="sa-notes-h" id="sa-notes-h">
          <span>Genomgång</span>
        </h3>

        {e.pitfall ? (
          <div className="sa-notes-item" data-testid="rd-pitfall">
            <h4 className="sa-notes-item-h">Se upp för</h4>
            <p className="sa-say">{e.pitfall}</p>
          </div>
        ) : null}

        <div className="sa-notes-item" data-testid="rd-technique">
          <h4 className="sa-notes-item-h">Nästa gång</h4>
          <p className="sa-say">{e.technique}</p>
        </div>

        <div className="sa-notes-item">
          <h4 className="sa-notes-item-h">Så hittar du {q.answer}</h4>
          <p className="sa-say">{e.solution_path}</p>
        </div>

        <div className="sa-notes-item">
          <h4 className="sa-notes-item-h">Steg för steg</h4>
          <ol className="sa-steps">
            {(e.steps ?? []).map((s) => (
              <Step
                key={s.n}
                step={s}
                view={view}
                act={act}
                refs={refs}
                hover={hover}
                active={active}
              />
            ))}
          </ol>
        </div>

        {others.length ? (
          <div className="sa-notes-item">
            <h4 className="sa-notes-item-h">
              {mine ? 'De andra alternativen' : 'Varför inte de andra?'}
            </h4>
            {others.map((d) => (
              <Other
                key={d.letter}
                d={d}
                text={optionText(d.letter)}
                cites={view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }}
                act={act}
                open={folds.others.has(d.letter)}
                toggle={() => folds.toggleOther(d.letter)}
                active={active}
                hover={hover}
              />
            ))}
          </div>
        ) : null}

        {framework ? (
          <p className="sa-sysnote">
            Ramverk: <b>{framework}</b> · finns att slå upp i Uppslag
          </p>
        ) : null}
      </section>
    </>
  )
}

/** The Socratic exchange about your pick: the coach asks what tempted you
 *  (reply or skip — it never blocks), then shows why it tempts and why it is
 *  wrong, citing the passage. */
function Lure({
  d,
  view,
  act,
  active,
  hover,
}: {
  d: DistractorExplanation
  view: DrillView
  act: DrillActions
  active: boolean
  hover: Hover
}) {
  // null: not answered yet; '': skipped; otherwise the reply given.
  const [said, setSaid] = useState<string | null>(null)
  const source = `why-${d.letter}`
  const cites = view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }
  return (
    <div
      className="sa-group"
      data-testid={`rd-distractor-${d.letter}`}
      data-active={String(active)}
      {...hover(source)}
    >
      <Coach as="section" aria-labelledby="sa-ask-lure">
        <h3 className="sa-ask sa-ask--real" id="sa-ask-lure">
          Vad lockade dig med {d.letter}?
        </h3>
      </Coach>
      {said == null ? (
        <Replies className="sa-replies--ask">
          {LURES.map((l) => (
            <button key={l} type="button" className="sa-chip" onClick={() => setSaid(l)}>
              {l}
            </button>
          ))}
          <button type="button" className="sa-quiet" onClick={() => setSaid('')}>
            Hoppa över
          </button>
        </Replies>
      ) : said ? (
        <You>
          <p>{said}</p>
        </You>
      ) : null}
      <Coach as="section" aria-labelledby="sa-why-lure">
        <h3 className="sa-ask" id="sa-why-lure">
          Det som lockar med {d.letter}
        </h3>
        <p className="sa-say">
          <Rich text={d.why_tempting} act={act} />
        </p>
        <Cites list={cites.tempting} source={source} act={act} />
      </Coach>
      <Coach as="section" aria-labelledby="sa-why-wrong">
        <h3 className="sa-ask" id="sa-why-wrong">
          Men därför är {d.letter} fel
        </h3>
        <p className="sa-say">
          <Rich text={d.why_wrong} act={act} />
        </p>
        <Cites list={cites.wrong} source={source} act={act} />
      </Coach>
    </div>
  )
}

function Step({
  step,
  view,
  act,
  refs,
  hover,
  active,
}: {
  step: ExplanationStep
  view: DrillView
  act: DrillActions
  refs: DrillRefs
  hover: Hover
  active: string | null
}) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  const source = `step-${step.n}`
  return (
    <li
      className="sa-step"
      data-tier={step.tier ?? 'essential'}
      data-testid={`rd-step-${step.n}`}
      data-active={String(active === source)}
      ref={refs.step(step.n)}
      {...hover(source)}
    >
      <span className="sa-step-n" aria-hidden>
        {step.n}
      </span>
      <div className="sa-step-main">
        <h5 className="sa-step-title">
          <span className="sa-sr">Steg {step.n}: </span>
          {step.title}
        </h5>
        {open ? (
          <p className="sa-step-text">
            <Rich text={step.text} act={act} />
          </p>
        ) : null}
        <div className="sa-step-foot">
          <Cites list={view.stepCites[step.n] ?? []} source={source} act={act} />
          {/* The detail tier on request: you ask the coach for more. */}
          {detail ? (
            <button
              type="button"
              className="sa-ask-more"
              data-testid={`rd-step-toggle-${step.n}`}
              aria-expanded={open}
              onClick={() => act.toggleStep(step.n)}
            >
              {open ? 'Dölj igen' : 'Berätta mer'}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function Other({
  d,
  text,
  cites,
  act,
  open,
  toggle,
  active,
  hover,
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: DrillActions
  open: boolean
  toggle: () => void
  active: string | null
  hover: Hover
}) {
  const id = `sa-other-${d.letter}`
  const source = `why-${d.letter}`
  return (
    <article
      className="sa-other"
      data-testid={`rd-distractor-${d.letter}`}
      data-open={String(open)}
      data-active={String(active === source)}
      {...(open ? hover(source) : {})}
    >
      <div className="sa-other-head">
        <span className="sa-letter" aria-hidden>
          {d.letter}
        </span>
        <p className="sa-other-text">
          <span className="sa-sr">Alternativ {d.letter}: </span>
          {text}
        </p>
      </div>
      <button
        type="button"
        className="sa-ask-more"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
      >
        {open ? 'Dölj igen' : `Varför lockar ${d.letter}?`}
      </button>
      {open ? (
        <div className="sa-other-body" id={id}>
          <p className="sa-other-sub">Därför lockar det</p>
          <p className="sa-say">
            <Rich text={d.why_tempting} act={act} />
          </p>
          <Cites list={cites.tempting} source={source} act={act} />
          <p className="sa-other-sub">Därför är det fel</p>
          <p className="sa-say">
            <Rich text={d.why_wrong} act={act} />
          </p>
          <Cites list={cites.wrong} source={source} act={act} />
        </div>
      ) : null}
    </article>
  )
}

/** The end of the unit: the coach sums up, then proposes the plan's next
 *  part as the one filled reply — anchored low, where the thumb is, as the
 *  newest turns of a conversation are. No confetti. */
export function Closing({
  view,
  onHome,
  onNext,
  ref,
}: {
  view: DrillView
  onHome: () => void
  onNext: () => void
  ref?: Ref<HTMLElement>
}) {
  const right = view.results.filter((r) => r.correct).length
  const misses = view.total - right
  const minutes = Math.max(1, Math.round(view.elapsed / 60))
  return (
    <div className="sa-closing" data-testid="rd-done">
      <Divider>Texten är läst</Divider>
      <div className="sa-thread">
        <Coach
          as="section"
          kind="sa-turn--lead"
          aria-labelledby="sa-done-h"
          tabIndex={-1}
          ref={ref}
        >
          <p className="sa-hello">{TITLE}</p>
          <h2 className="sa-lead-q" id="sa-done-h">
            Klart. {view.total}&nbsp;frågor, {right}&nbsp;rätt.
          </h2>
          <ol className="sa-tally" aria-label="Dina svar">
            {view.results.map((r, i) => (
              <li key={r.qid} data-correct={String(r.correct)}>
                <span className="sa-tally-glyph" aria-hidden>
                  {r.correct ? (
                    <Check size={14} strokeWidth={2.4} />
                  ) : (
                    <X size={14} strokeWidth={2.4} />
                  )}
                </span>
                <span>
                  Fråga {i + 1}
                  <span className="sa-sr">: {r.correct ? 'rätt' : 'fel'}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="sa-say">
            {misses === 0
              ? 'Inga missar att repetera.'
              : misses === 1
                ? 'Missen lägger jag i nästa repetition.'
                : `De ${WORDS[misses] ?? misses} missarna lägger jag i nästa repetition.`}{' '}
            Det tog {minutes} minuter.
          </p>
        </Coach>
        {NEXT ? (
          <Coach>
            <p className="sa-say">
              Nästa i planen är {NEXT.title.toLowerCase()}, ungefär {NEXT.minutes} minuter. Ska vi
              ta den nu?
            </p>
          </Coach>
        ) : null}
        {/* The quiet way out first, the one action last: on the thumb side. */}
        <Replies>
          <button type="button" className="sa-chip sa-chip--big" onClick={onHome}>
            Till Idag
          </button>
          {NEXT ? (
            <button
              type="button"
              className="sa-chip sa-chip--primary sa-chip--big"
              onClick={onNext}
              data-testid="rd-done-next"
            >
              Ja, {NEXT.title.toLowerCase()} · {NEXT.minutes}&nbsp;min
              <Kbd>↵</Kbd>
            </button>
          ) : null}
        </Replies>
      </div>
    </div>
  )
}
