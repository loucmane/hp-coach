import { ChevronRight } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import {
  type DrillCoreActions,
  type DrillCoreRefs,
  type DrillCoreView,
  splitStepRefs,
} from './drillCore'

type Pointing = { active: string | null; point: (source: string | null) => void }
function InLang({ lang, children }: { lang: 'en' | undefined; children: ReactNode }) {
  return lang ? <span lang={lang}>{children}</span> : children
}
const FAMILY_WORD: Record<string, string> = {
  TRAP: 'fälla',
  TACTIC: 'taktik',
  TYPE: 'frågetyp',
  ROOT: 'ordrot',
  RULE: 'regel',
}

/** A framework's readable name: its headword, else its id said in words
 *  ("XYZ · fälla 17"), never the raw id. */
export function entryName(
  id: string | undefined,
  names: Readonly<Record<string, string>>,
): string | null {
  if (!id) return null
  if (names[id]) return names[id]
  const m = /^([A-Z]+)-([A-Z]+)-0*(\d+)$/.exec(id)
  const word = m ? FAMILY_WORD[m[2]] : undefined
  if (!m || !word) return null
  return `${m[1] === 'LAS' ? 'LÄS' : m[1]} · ${word} ${m[3]}`
}

export type FacitView = Pick<
  DrillCoreView,
  'question' | 'explanation' | 'correct' | 'picked' | 'openSteps' | 'stepCites' | 'distractorCites'
>

type FacitAct = Pick<DrillCoreActions, 'cite' | 'goToStep' | 'toggleStep'>

/**
 * The explanation, ordered for learning: why the chosen option tempted
 * (and why it is wrong), what to take away (pitfall, technique), the
 * solution and its steps, and last the other options, folded. Without an
 * explanation yet, a plain line says so; the verdict above still stands.
 * An ELF explanation is English under Swedish heads: each body is
 * lang="en", and a missing body goes with its head. The framework line
 * names the pattern; navigation away from feedback is deferred.
 */
export function Facit({
  view,
  act,
  refs,
  active,
  point,
  frameworks,
}: {
  view: FacitView
  act: FacitAct
  refs: Pick<DrillCoreRefs, 'step'>
  frameworks: Readonly<Record<string, string>>
} & Pointing) {
  const [stepsShown, setStepsShown] = useState(false)
  const e = view.explanation
  if (!e) {
    return (
      <div className="fa-facit">
        <p className="fa-empty fa-fsec">Förklaring saknas ännu för den här frågan.</p>
      </div>
    )
  }
  const q = view.question
  const en = q.section === 'ELF' ? 'en' : undefined
  const optionText = (letter: string) => q.options?.find((o) => o.letter === letter)?.text ?? ''
  const mine = view.correct ? null : e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const frameworkId = e.framework_id
  const framework = entryName(frameworkId, frameworks)
  const steps = resolveSteps(e)
  const hover = (source: string) => ({
    onMouseEnter: () => point(source),
    onMouseLeave: () => point(null),
    onFocus: () => point(source),
    onBlur: () => point(null),
  })
  const stepAct = {
    ...act,
    goToStep: (n: number) => {
      setStepsShown(true)
      act.goToStep(n)
    },
  }
  return (
    <div className="fa-facit">
      {mine && (mine.why_tempting || mine.why_wrong) ? (
        <section
          className="fa-fsec fa-fsec--lure"
          data-testid={`fa-distractor-${mine.letter}`}
          {...hover(`why-${mine.letter}`)}
        >
          {/* Two siblings, so one heading style for both. */}
          {mine.why_tempting ? (
            <>
              <h3 className="fa-h3">Därför lockade {mine.letter}</h3>
              <p className="fa-prose" lang={en}>
                <Rich text={mine.why_tempting} act={stepAct} />
              </p>
              <Cites
                list={view.distractorCites[mine.letter]?.tempting ?? []}
                source={`why-${mine.letter}`}
                act={stepAct}
              />
            </>
          ) : null}
          {mine.why_wrong ? (
            <>
              <h3 className={mine.why_tempting ? 'fa-h3 fa-h3--next' : 'fa-h3'}>
                Varför {mine.letter} är fel
              </h3>
              <p className="fa-prose" lang={en}>
                <Rich text={mine.why_wrong} act={stepAct} />
              </p>
              <Cites
                list={view.distractorCites[mine.letter]?.wrong ?? []}
                source={`why-${mine.letter}`}
                act={stepAct}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {e.pitfall || e.technique ? (
        <section className="fa-fsec fa-notes">
          <h3 className="fa-h3">Att ta med dig</h3>
          {e.pitfall ? (
            <div className="fa-note-item" data-testid="fa-pitfall">
              <span className="fa-sub">Fallgropen</span>
              <p className="fa-prose" lang={en}>
                <MathText>{e.pitfall}</MathText>
              </p>
            </div>
          ) : null}
          {e.technique ? (
            <div className="fa-note-item" data-testid="fa-technique">
              <span className="fa-sub">Tekniken</span>
              <p className="fa-prose" lang={en}>
                <MathText>{e.technique}</MathText>
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {e.solution_path ? (
        <section className="fa-fsec">
          <h3 className="fa-h3">Lösningen</h3>
          <p className="fa-prose" lang={en}>
            <MathText>{e.solution_path}</MathText>
          </p>
        </section>
      ) : null}

      {steps.length ? (
        <section className="fa-fsec">
          <h3 className="fa-h3">Steg för steg</h3>
          <button
            type="button"
            className="fa-more"
            aria-expanded={stepsShown}
            onClick={() => setStepsShown(!stepsShown)}
          >
            {stepsShown ? 'Dölj steg för steg' : 'Visa steg för steg'}
          </button>
          {stepsShown ? (
            <ol>
              {steps.map((s) => (
                <Step
                  key={s.n}
                  step={s}
                  view={view}
                  act={stepAct}
                  refs={refs}
                  hover={hover}
                  lang={en}
                />
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      {others.length ? (
        <section className="fa-fsec">
          <h3 className="fa-h3">{mine ? 'De andra alternativen' : 'Alternativen'}</h3>
          {others.map((d) => (
            <Distractor
              key={d.letter}
              d={d}
              text={optionText(d.letter)}
              cites={view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }}
              act={stepAct}
              active={active}
              lang={en}
            />
          ))}
        </section>
      ) : null}

      {framework && frameworkId ? (
        <p className="fa-framework">
          Ramverk: <b>{framework}</b>
        </p>
      ) : null}
    </div>
  )
}

function Step({
  step,
  view,
  act,
  refs,
  hover,
  lang,
}: {
  step: ExplanationStep
  view: Pick<FacitView, 'openSteps' | 'stepCites'>
  act: FacitAct
  refs: Pick<DrillCoreRefs, 'step'>
  hover: (source: string) => Record<string, () => void>
  /** 'en' for an ELF explanation's title and text. */
  lang?: 'en'
}) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  const source = `step-${step.n}`
  return (
    <li
      className="fa-step"
      data-tier={step.tier ?? 'essential'}
      data-testid={`fa-step-${step.n}`}
      ref={refs.step(step.n)}
      {...hover(source)}
    >
      <span className="fa-step-n" aria-hidden>
        {step.n}
      </span>
      <div>
        <div className="fa-step-head">
          <h4 className="fa-step-title">
            <span className="fa-sr">Steg {step.n}: </span>
            <InLang lang={lang}>{step.title}</InLang>
          </h4>
          <Cites list={view.stepCites[step.n] ?? []} source={source} act={act} />
        </div>
        {open ? (
          <p className="fa-step-text" lang={lang}>
            <Rich text={step.text} act={act} />
          </p>
        ) : null}
        {detail ? (
          <button
            type="button"
            className="fa-more"
            data-testid={`fa-step-toggle-${step.n}`}
            aria-expanded={open}
            onClick={() => act.toggleStep(step.n)}
          >
            {open ? 'Dölj fördjupningen' : 'Fördjupning'}
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  )
}

function Distractor({
  d,
  text,
  cites,
  act,
  active,
  lang,
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: FacitAct
  active: string | null
  /** 'en' for an ELF option and its reasons. */
  lang?: 'en'
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `fa-dis-${d.letter}`
  const reasons = Boolean(d.why_tempting || d.why_wrong)
  return (
    <article
      className="fa-dis"
      data-testid={`fa-distractor-${d.letter}`}
      data-active={String(active === `why-${d.letter}`)}
    >
      <div className="fa-dis-head">
        <span className="fa-letter" aria-hidden>
          {d.letter}
        </span>
        <div>
          <p className="fa-dis-opt">
            <span className="fa-sr">Alternativ {d.letter}: </span>
            <InLang lang={lang}>
              <MathText>{text}</MathText>
            </InLang>
          </p>
          {/* Each disclosure is named by its own letter (one name for all
           *  of them told a screen reader nothing); its state is
           *  aria-expanded, and the chevron turns. */}
          {reasons ? (
            <button
              type="button"
              className="fa-more fa-dis-more"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => setOpen(!open)}
            >
              Varför inte {d.letter}
              <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      {open && reasons ? (
        <div className="fa-dis-body" id={bodyId}>
          {d.why_tempting ? (
            <>
              <span className="fa-sub">Varför det lockar</span>
              <p className="fa-prose" lang={lang}>
                <Rich text={d.why_tempting} act={act} />
              </p>
              <Cites list={cites.tempting} source={`why-${d.letter}`} act={act} />
            </>
          ) : null}
          {d.why_wrong ? (
            <>
              <span className="fa-sub">Varför det är fel</span>
              <p className="fa-prose" lang={lang}>
                <Rich text={d.why_wrong} act={act} />
              </p>
              <Cites list={cites.wrong} source={`why-${d.letter}`} act={act} />
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

/** Citations as a footnote's "see": inline ¶ references, no pills. */
function Cites({
  list,
  source,
  act,
}: {
  list: number[]
  source: string
  act: Pick<DrillCoreActions, 'cite'>
}) {
  if (list.length === 0) return null
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

/** Explanation text, verbatim (math rendered), with its "(steg 2)"
 *  references made into links to the step. */
function Rich({ text, act }: { text: string; act: Pick<DrillCoreActions, 'goToStep'> }) {
  let at = 0
  return (
    <>
      {splitStepRefs(text).map((seg) => {
        const key = at
        at += seg.text.length
        return seg.kind === 'text' ? (
          <span key={key}>
            <MathText>{seg.text}</MathText>
          </span>
        ) : (
          <button
            key={key}
            type="button"
            className="fa-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}
