import { type ReactNode, useId, useRef, useState } from 'react'
import { getFeedback, submitFeedback } from '@/api/feedback'
import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import type { DistractorExplanation, Explanation } from '@/data/explanations'
import type { DrillCoreActions, DrillCoreRefs, DrillCoreView } from './drillCore'
import { FacitMap } from './FacitMap'
import { Cites, type FacitActions, FacitSteps, InLang, Rich } from './FacitSteps'
import { type FacitConfidence, type FacitSection, facitOrder } from './facitOrder'
import { refutes } from './refutes'
import './facit.css'

type Pointing = { active: string | null; point: (source: string | null) => void }
const FAMILY_WORD: Record<string, string> = {
  TRAP: 'fälla',
  TACTIC: 'taktik',
  TYPE: 'frågetyp',
  ROOT: 'ordrot',
  RULE: 'regel',
}

/** A readable headword, falling back to the framework id said in words. */
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
> & { confidence?: FacitConfidence | null }

/** All teaching content stays open. The map changes position, never visibility.
 * Confidence and an authored retrieval item are optional seams for LJ-24/C2. */
export function Facit({
  view,
  act,
  refs,
  active,
  point,
  frameworks,
  lockIn,
}: {
  view: FacitView
  act: FacitActions
  refs: Pick<DrillCoreRefs, 'step'>
  frameworks: Readonly<Record<string, string>>
  lockIn?: ReactNode
} & Pointing) {
  const id = useId()
  const body = useRef<HTMLDivElement>(null)
  const e = view.explanation
  if (!e)
    return (
      <div className="fa-facit">
        <p className="fa-empty fa-fsec">Förklaring saknas ännu för den här frågan.</p>
      </div>
    )
  const q = view.question
  const lang = q.section === 'ELF' ? 'en' : undefined
  const mine =
    view.correct === false ? e.distractors.find((d) => d.letter === view.picked) : undefined
  const others = e.distractors.filter((d) => d !== mine)
  const steps = resolveSteps(e)
  const framework = entryName(e.framework_id, frameworks)
  const labels: Record<FacitSection, string> = {
    own: 'Ditt val, först',
    core: 'Kärnan',
    steps: 'Lösningen',
    alternatives: mine ? 'De andra alternativen' : 'Alternativen',
    takeaway:
      e.pitfall && e.technique ? 'Fallgropen och tekniken' : e.pitfall ? 'Fallgropen' : 'Tekniken',
    framework: 'Ramverket',
    lock: 'Lås in det',
    feedback: 'Hjälpte förklaringen?',
  }
  const distractor = (d: DistractorExplanation) => (
    <Distractor
      key={d.letter}
      d={d}
      text={q.options?.find((option) => option.letter === d.letter)?.text ?? ''}
      cites={view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }}
      act={act}
      active={active}
      point={point}
      lang={lang}
      own={d === mine}
    />
  )
  const content: Record<FacitSection, ReactNode> = {
    own: mine ? distractor(mine) : null,
    core: e.solution_path ? (
      <p className="fa-prose" lang={lang}>
        <MathText>{e.solution_path}</MathText>
      </p>
    ) : null,
    steps: steps.length ? (
      <FacitSteps
        steps={steps}
        tags={refutes(steps, e.distractors)}
        picked={mine?.letter ?? null}
        cites={view.stepCites}
        act={act}
        refs={refs}
        point={point}
        lang={lang}
      />
    ) : null,
    alternatives: others.length ? (
      <div className="fa-facit-alternatives">{others.map(distractor)}</div>
    ) : null,
    takeaway:
      e.pitfall || e.technique ? (
        <div className="fa-facit-pair">
          {e.pitfall ? (
            <div className="fa-note-item" data-testid="fa-pitfall">
              <h4>Fallgropen</h4>
              <p className="fa-prose" lang={lang}>
                <MathText>{e.pitfall}</MathText>
              </p>
            </div>
          ) : null}
          {e.technique ? (
            <div className="fa-note-item" data-testid="fa-technique">
              <h4>Tekniken</h4>
              <p className="fa-prose" lang={lang}>
                <MathText>{e.technique}</MathText>
              </p>
            </div>
          ) : null}
        </div>
      ) : null,
    framework: framework ? (
      <p className="fa-facit-framework">
        <b>{framework}</b>
      </p>
    ) : null,
    lock: lockIn ?? null,
    feedback: <Feedback key={q.qid} qid={q.qid} explanation={e} />,
  }
  const order = facitOrder(view.correct, view.confidence).filter((section) =>
    Boolean(content[section]),
  )
  const entries = order.map((section) => ({ id: `${id}-${section}`, label: labels[section] }))
  return (
    <div className="fa-facit fa-facit--open">
      <FacitMap entries={entries} body={body} />
      <div className="fa-facit-body" ref={body}>
        {order.map((section, index) => (
          <section
            key={section}
            id={`${id}-${section}`}
            className={`fa-fsec fa-facit-${section}`}
            data-facit-section={section}
            aria-labelledby={`${id}-${section}-heading`}
          >
            <header className="fa-facit-heading">
              <h3 id={`${id}-${section}-heading`}>
                <span className="fa-map-n" aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                {labels[section]}
              </h3>
              {section === 'steps' ? <small>{steps.length} steg · alla visas</small> : null}
            </header>
            {content[section]}
          </section>
        ))}
      </div>
    </div>
  )
}

function Distractor({
  d,
  text,
  cites,
  act,
  active,
  point,
  lang,
  own,
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: Pick<DrillCoreActions, 'cite' | 'goToStep'>
  lang?: 'en'
  own: boolean
} & Pointing) {
  return (
    <article
      className="fa-dis"
      data-own={own}
      data-testid={`fa-distractor-${d.letter}`}
      data-active={active === `why-${d.letter}`}
      onMouseEnter={() => point(`why-${d.letter}`)}
      onMouseLeave={() => point(null)}
      onFocus={() => point(`why-${d.letter}`)}
      onBlur={() => point(null)}
    >
      <div className="fa-dis-head">
        <span className="fa-letter" aria-hidden>
          {d.letter}
        </span>
        <p className="fa-dis-opt">
          <span className="fa-sr">Alternativ {d.letter}: </span>
          <InLang lang={lang}>
            <MathText>{text}</MathText>
          </InLang>
        </p>
      </div>
      <div className="fa-dis-body">
        {d.why_tempting ? (
          <div>
            <h4>{own ? 'Varför det lockade' : 'Varför det lockar'}</h4>
            <p className="fa-prose" lang={lang}>
              <Rich text={d.why_tempting} act={act} />
            </p>
            <Cites list={cites.tempting} source={`why-${d.letter}`} act={act} />
          </div>
        ) : null}
        {d.why_wrong ? (
          <div>
            <h4>Varför det är fel</h4>
            <p className="fa-prose" lang={lang}>
              <Rich text={d.why_wrong} act={act} />
            </p>
            <Cites list={cites.wrong} source={`why-${d.letter}`} act={act} />
          </div>
        ) : null}
      </div>
    </article>
  )
}

/** Keep the existing local feedback store until LJ-26 supplies its data seam.
 * Partial feedback requests revision, with the student's exact choice in notes. */
function Feedback({ qid, explanation }: { qid: string; explanation: Explanation }) {
  const [saved, setSaved] = useState(() => getFeedback(qid))
  const selected =
    saved?.status === 'approved'
      ? 'Ja'
      : saved?.status === 'rejected'
        ? saved.notes === 'Delvis'
          ? 'Delvis'
          : 'Nej'
        : null
  const choose = (label: string) => {
    const entry = {
      qid,
      status: label === 'Ja' ? ('approved' as const) : ('rejected' as const),
      notes: label === 'Delvis' ? label : undefined,
      model: explanation._meta?.model ?? '',
      generated_at: explanation._meta?.generated_at ?? 0,
      reviewed_at: Date.now(),
    }
    submitFeedback(entry)
    setSaved(entry)
  }
  return (
    <div className="fa-facit-feedback-buttons">
      {['Ja', 'Delvis', 'Nej'].map((label) => (
        <button
          key={label}
          type="button"
          aria-pressed={label === selected}
          onClick={() => choose(label)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
