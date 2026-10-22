import { type ReactNode, useId, useState } from 'react'
import type { DrillCoreRefs, DrillCoreView, QuoteMark } from './drillCore'
import { type GapModel, GapRun, gapTokens } from './ElfGaps'
import { OVNINGSTEXT_BADGE, OVNINGSTEXT_NOTE } from './ovningstext'

function marked(text: string, marks: QuoteMark[], view: DrillCoreView): ReactNode[] {
  const out: ReactNode[] = []
  let at = 0
  for (const m of [...marks].sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (m.start < at) continue
    out.push(text.slice(at, m.start))
    out.push(
      <mark
        key={`${m.source}-${m.start}`}
        className="rd-evidence"
        data-flash={view.flashSource === m.source && view.flashPara === m.para}
      >
        {text.slice(m.start, m.end)}
      </mark>,
    )
    at = m.end
  }
  out.push(text.slice(at))
  return out
}

export function PassageView({
  view,
  refs,
  gaps,
}: {
  view: DrillCoreView
  refs: Pick<DrillCoreRefs, 'para'>
  gaps: GapModel
}) {
  const [note, setNote] = useState(false)
  const id = useId()
  const passage = view.question.passage
  if (!passage) return null
  const tokens = gapTokens(view.question)
  const marks =
    view.phase === 'feedback'
      ? view.marks.filter(
          (m) =>
            m.source.startsWith('step-') || (!view.correct && m.source === `why-${view.picked}`),
        )
      : []
  return (
    <article className="rd-passage" lang={passage.lang} aria-labelledby={`${id}-title`}>
      {passage.synthetic ? (
        <>
          <div className="rd-tools" lang="sv">
            <span className="rd-badge fa-label" data-testid="rd-badge">
              {OVNINGSTEXT_BADGE}
            </span>
            <button
              type="button"
              className="fa-more"
              data-testid="rd-note-toggle"
              aria-expanded={note}
              aria-controls={`${id}-note`}
              onClick={() => setNote(!note)}
            >
              {note ? 'Dölj noten' : 'Om texten'}
            </button>
          </div>
          <p className="rd-note" id={`${id}-note`} data-testid="rd-note" hidden={!note} lang="sv">
            {OVNINGSTEXT_NOTE}
          </p>
        </>
      ) : null}
      {passage.instruction ? (
        <p className="rd-instruction" lang={passage.lang}>
          {passage.instruction}
        </p>
      ) : null}
      <h2 className="rd-title" id={`${id}-title`}>
        {passage.title ?? <span lang="sv">Texten</span>}
      </h2>
      <div data-testid={passage.lang === 'en' ? 'rd-elf-passage' : 'rd-passage'}>
        {passage.paragraphs.map((text, i) => {
          const n = i + 1
          const own = marks.filter((m) => m.para === n)
          return (
            <p
              key={n}
              ref={refs.para(n)}
              className="rd-para"
              data-testid={`rd-para-${n}`}
              data-n={n}
              data-cited={view.phase === 'feedback' && view.cited.includes(n)}
              data-flash={view.flashPara === n}
              tabIndex={-1}
            >
              <span className="rd-para-n" aria-hidden>
                {n}
              </span>
              {tokens[i]?.length ? (
                <GapRun text={text} tokens={tokens[i]} model={gaps} />
              ) : (
                marked(text, own, view)
              )}
            </p>
          )
        })}
        {passage.byline ? <p className="rd-byline">{passage.byline}</p> : null}
      </div>
    </article>
  )
}
