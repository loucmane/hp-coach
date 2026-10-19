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
// Any question shape (kit v2's drill core): math renders wherever it stands
// (the options, your answer, the right answer and every part of the
// explanation), image options show their figure, and a question without an
// explanation yet gets the verdict and the way on, nothing else.
// The set ends the same way: the coach sums up and proposes the plan's next
// part as a reply.

import { Check, X } from 'lucide-react'
import { type Ref, useState } from 'react'

import type {
  DrillCoreActions,
  DrillCoreRefs,
  DrillCoreView,
} from '@/components/devbake/redesign/drillCore'
import type { DrillOption, PlanItemView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import type { Section } from '@/data/questions'
import { Cites, Coach, count, Divider, Kbd, Replies, Rich, words, You } from './SamtalParts'

type Act = Pick<DrillCoreActions, 'cite' | 'goToStep' | 'toggleStep'>

/** The coach's one question after a wrong answer: what tempted you. The
 *  reply is yours to give or skip; the explanation never waits on it. The
 *  replies fit the kind of question. */
export function luresFor(section: Section): readonly string[] {
  if (section === 'DTK') return ['Jag läste fel i underlaget', 'Jag räknade fel', 'Jag chansade']
  if (section === 'XYZ' || section === 'KVA' || section === 'NOG') {
    return ['Jag räknade fel', 'Jag tolkade frågan fel', 'Jag chansade']
  }
  return ['Orden liknade texten', 'Det lät rimligt', 'Jag chansade']
}

/** The part the reader points at (hover or focus): its quotations and
 *  paragraph numbers light up in the passage. */
export type Pointing = { active: string | null; point: (source: string | null) => void }

/** The explanation's folds — the detail steps and the other options — and
 *  "Visa allt", which opens or closes them together. `any` is false when
 *  there is nothing to fold (no explanation yet). */
export type Folds = {
  others: ReadonlySet<string>
  toggleOther: (letter: string) => void
  allOpen: boolean
  any: boolean
  showAll: () => void
}

type Hover = (source: string) => {
  onMouseEnter: () => void
  onMouseLeave: () => void
  onFocus: () => void
  onBlur: () => void
}

function optionOf(view: DrillCoreView, letter: string | null): DrillOption | undefined {
  return view.question.options?.find((o) => o.letter === letter)
}

/** An option's words, its math rendered; an image option shows its figure
 *  (its text is the image's name). */
export function OptionBody({ option }: { option: DrillOption }) {
  if (option.figure) {
    return (
      <span className="sa-opt-figure">
        <img
          src={`/${option.figure.src}`}
          alt={option.figure.alt}
          width={option.figure.width}
          height={option.figure.height}
          loading="lazy"
        />
      </span>
    )
  }
  return <MathText>{option.text}</MathText>
}

/** Your answer, as your turn in the conversation. */
export function YourAnswer({ view }: { view: DrillCoreView }) {
  const o = optionOf(view, view.picked)
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
          <OptionBody option={o} />
        </span>
      </p>
    </You>
  )
}

/** The coach's verdict: a ringed glyph and a word, never colour alone, and
 *  the right answer in full. The compact form sits in the phone tray's
 *  peek, a summary of the verdict that waits behind it, so only the full
 *  one carries rd-verdict. */
export function Verdict({
  view,
  compact = false,
  ref,
}: {
  view: DrillCoreView
  compact?: boolean
  ref?: Ref<HTMLElement>
}) {
  const correct = view.correct === true
  const key = optionOf(view, view.question.answer)
  return (
    <Coach
      kind={compact ? 'sa-verdict sa-verdict--compact' : 'sa-verdict'}
      data-correct={String(correct)}
      data-testid={compact ? undefined : 'rd-verdict'}
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
            <OptionBody option={key} />
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
 *  your pick, then the notes. Without an explanation yet, one quiet line. */
export function Explanation({
  view,
  act,
  refs,
  active,
  point,
  folds,
  lures,
  frameworks,
}: {
  view: DrillCoreView
  act: Act
  refs: DrillCoreRefs
  folds: Folds
  lures: readonly string[]
  frameworks: Record<string, string>
} & Pointing) {
  const e = view.explanation
  const q = view.question
  if (!e) {
    return (
      <Coach>
        <p className="sa-say">Förklaringen till den här frågan är inte klar än.</p>
      </Coach>
    )
  }
  const mine = view.correct ? null : (e.distractors.find((d) => d.letter === view.picked) ?? null)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const framework = e.framework_id ? frameworks[e.framework_id] : undefined
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
          lures={lures}
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
            <p className="sa-say">
              <MathText>{e.pitfall}</MathText>
            </p>
          </div>
        ) : null}

        <div className="sa-notes-item" data-testid="rd-technique">
          <h4 className="sa-notes-item-h">Nästa gång</h4>
          <p className="sa-say">
            <MathText>{e.technique}</MathText>
          </p>
        </div>

        <div className="sa-notes-item">
          <h4 className="sa-notes-item-h">Så hittar du {q.answer}</h4>
          <p className="sa-say">
            <MathText>{e.solution_path}</MathText>
          </p>
        </div>

        {e.steps?.length ? (
          <div className="sa-notes-item">
            <h4 className="sa-notes-item-h">Steg för steg</h4>
            <ol className="sa-steps">
              {e.steps.map((s) => (
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
        ) : null}

        {others.length ? (
          <div className="sa-notes-item">
            <h4 className="sa-notes-item-h">
              {mine ? 'De andra alternativen' : 'Varför inte de andra?'}
            </h4>
            {others.map((d) => (
              <Other
                key={d.letter}
                d={d}
                option={optionOf(view, d.letter)}
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
  lures,
  active,
  hover,
}: {
  d: DistractorExplanation
  view: DrillCoreView
  act: Act
  lures: readonly string[]
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
          {lures.map((l) => (
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
  view: DrillCoreView
  act: Act
  refs: DrillCoreRefs
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
          <MathText>{step.title}</MathText>
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
  option,
  cites,
  act,
  open,
  toggle,
  active,
  hover,
}: {
  d: DistractorExplanation
  option: DrillOption | undefined
  cites: { tempting: number[]; wrong: number[] }
  act: Act
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
          {option ? <OptionBody option={option} /> : null}
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

/** The end of a set: the coach sums up, then proposes the plan's next part
 *  as the one filled reply — anchored low, where the thumb is, as the newest
 *  turns of a conversation are. No confetti. Without a next part, the quiet
 *  way out is the one action. */
export function Closing({
  view,
  title,
  divider,
  repetition = false,
  clock,
  out,
  next,
  onNext,
  ref,
}: {
  view: DrillCoreView
  /** The set's name, said first ("Magasinet i Hökaryd"). */
  title: string
  /** The line the closing opens with ("Texten är läst"). */
  divider: string
  /** A repetition round: its misses are already in the pile. */
  repetition?: boolean
  /** Whether the set kept a clock (then the coach says how long it took). */
  clock: boolean
  /** The quiet way out ("Till Idag", "Till Öva"). */
  out: { label: string; onClick: () => void }
  next: PlanItemView | null
  onNext: () => void
  ref?: Ref<HTMLElement>
}) {
  const right = view.results.filter((r) => r.correct).length
  const misses = view.results.length - right
  const minutes = Math.max(1, Math.round(view.elapsed / 60))
  return (
    <div className="sa-closing" data-testid="rd-done">
      <Divider>{divider}</Divider>
      <div className="sa-thread">
        <Coach
          as="section"
          kind="sa-turn--lead"
          aria-labelledby="sa-done-h"
          tabIndex={-1}
          ref={ref}
        >
          <p className="sa-hello">{title}</p>
          <h2 className="sa-lead-q" id="sa-done-h">
            Klart. {count(view.results.length, 'fråga', 'frågor')}, {right}&nbsp;rätt.
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
            {repetition
              ? 'Klart för den här omgången.'
              : misses === 0
                ? 'Inga missar att repetera.'
                : misses === 1
                  ? 'Missen lägger jag i nästa repetition.'
                  : `De ${words(misses)} missarna lägger jag i nästa repetition.`}
            {clock ? ` Det tog ${minutes} minuter.` : null}
          </p>
        </Coach>
        {next ? (
          <Coach>
            <p className="sa-say">
              Nästa i planen är {next.title.toLowerCase()}, ungefär {next.minutes} minuter. Ska vi
              ta den nu?
            </p>
          </Coach>
        ) : null}
        {/* The quiet way out first, the one action last: on the thumb side. */}
        <Replies>
          <button
            type="button"
            className={next ? 'sa-chip sa-chip--big' : 'sa-chip sa-chip--primary sa-chip--big'}
            onClick={out.onClick}
          >
            {out.label}
            {next ? null : <Kbd>↵</Kbd>}
          </button>
          {next ? (
            <button
              type="button"
              className="sa-chip sa-chip--primary sa-chip--big"
              onClick={onNext}
              data-testid="rd-done-next"
            >
              Ja, {next.title.toLowerCase()} · {next.minutes}&nbsp;min
              <Kbd>↵</Kbd>
            </button>
          ) : null}
        </Replies>
      </div>
    </div>
  )
}
