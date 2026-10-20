import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtScore } from '@/components/devbake/redesign/r1Kit'
import type { FrameworkEntry, FrameworkStatus } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { Hub, type HubProps } from './LagerOva'

const STATUS: Record<FrameworkStatus, string> = {
  untaught: 'Inte påbörjad',
  learning: 'Lär in',
  practicing: 'Övar',
  retaining: 'Repeterar',
  mastered: 'Befäst',
}

export function LagerUppslag(props: HubProps) {
  const { data, actions } = useDirectionData()
  const { sections, open: lesson } = data.uppslag
  const [selected, setSelected] = useState(lesson.section)
  const section = sections.find((s) => s.section === selected) ?? sections[0]
  const [outline, setOutline] = useState(false)
  const [large, setLarge] = useState(false)
  const [requestedLesson, setRequestedLesson] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const outlineButton = useRef<HTMLButtonElement>(null)
  const directory = useRef<HTMLElement>(null)
  const previousLesson = useRef(lesson.id)
  useEffect(() => {
    if (previousLesson.current === lesson.id) return
    previousLesson.current = lesson.id
    setRequestedLesson(false)
    setSelected(lesson.section)
    setOutline(false)
    heading.current?.focus({ preventScroll: true })
    heading.current?.scrollIntoView?.({ block: 'nearest' })
  }, [lesson.id, lesson.section])
  const contents = (
    <>
      <h2 className="la-ref-heading" tabIndex={-1}>
        Innehåll
      </h2>
      <fieldset className="la-ref-sections">
        <legend className="la-sr">Delprov</legend>
        {sections.map((s) => (
          <button
            type="button"
            key={s.section}
            className="la-ref-section"
            aria-pressed={section?.section === s.section}
            data-testid={`rd-uppslag-section-${s.section === 'LÄS' ? 'las' : s.section.toLowerCase()}`}
            onClick={() => setSelected(s.section)}
          >
            <span>{s.section}</span>
            <span className="la-sr"> – {s.name}</span>
          </button>
        ))}
      </fieldset>
      {section ? (
        <p className="la-ref-section-name">
          {section.name}
          {section.score != null ? ` · ${fmtScore(section.score)}` : ''}
        </p>
      ) : null}
      {section?.entries.length ? (
        <ol className="la-ref-entries">
          {section.entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="la-ref-entry"
                aria-current={entry.id === lesson.id ? 'page' : undefined}
                data-testid={`rd-uppslag-entry-${entry.id}`}
                onClick={() => {
                  actions.openLesson(entry.id)
                  setRequestedLesson(entry.id !== lesson.id)
                }}
              >
                <span className="la-ref-entry-title">{entry.title}</span>
                {entry.summary ? <span>{entry.summary}</span> : null}
                <span className="la-ref-state">
                  {entry.read ? <Check size={14} aria-hidden /> : null}
                  {entry.read ? 'Läst' : 'Oläst'}
                  {entry.status ? ` · ${STATUS[entry.status]}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p>Inget innehåll här ännu.{sections.length ? ' Välj ett annat delprov.' : ''}</p>
      )}
    </>
  )
  return (
    <Hub {...props} title="Uppslag">
      <div className="la-ref-toolbar">
        <button
          type="button"
          className="la-quiet"
          onClick={() => {
            if (props.width === 'phone') {
              setOutline(true)
              outlineButton.current?.focus()
            } else {
              directory.current?.querySelector<HTMLElement>('h2')?.focus()
              directory.current?.scrollIntoView?.({ block: 'nearest' })
            }
          }}
        >
          <ArrowLeft size={17} aria-hidden />
          Till Uppslag
        </button>
        <div className="la-pill la-glass">
          <button
            type="button"
            className="la-pill-btn la-ref-outline-toggle"
            ref={outlineButton}
            aria-expanded={outline}
            aria-controls="la-ref-outline"
            onClick={() => setOutline(!outline)}
          >
            Innehåll
            <ChevronDown size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="la-pill-btn"
            aria-pressed={large}
            onClick={() => setLarge(!large)}
          >
            Aa<span className="la-sr"> – större text</span>
          </button>
        </div>
      </div>
      <p role="status">
        {requestedLesson
          ? 'Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats.'
          : ''}
      </p>
      <div className="la-reference">
        <section
          aria-label="Innehåll"
          className="la-sheet la-ref-outline"
          data-depth="1"
          id="la-ref-outline"
          data-open={String(outline)}
          ref={directory}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && outline) {
              e.preventDefault()
              setOutline(false)
              outlineButton.current?.focus()
            }
          }}
        >
          {contents}
        </section>
        <article
          className={`la-sheet la-lesson${props.live ? ' la-rise' : ''}`}
          data-depth="2"
          data-size={large ? 'large' : 'normal'}
          data-testid="rd-lesson"
          aria-labelledby="la-lesson-title"
        >
          <span className="la-chip la-sec" data-sec={lesson.section}>
            {lesson.section} · Lektion
          </span>
          <h2 id="la-lesson-title" ref={heading} tabIndex={-1}>
            {lesson.title}
          </h2>
          <div className="la-lesson-prose">
            <LessonContent entry={lesson.entry} />
          </div>
          <div className="la-lesson-foot">
            <button
              type="button"
              className="la-quiet"
              data-testid="rd-lesson-read"
              aria-pressed={lesson.read}
              onClick={() => actions.toggleLessonRead(lesson.id)}
            >
              {lesson.read ? <Check size={17} aria-hidden /> : null}
              {lesson.read ? 'Markerad som läst · Ångra' : 'Markera som läst'}
            </button>
            {lesson.status ? <p>{STATUS[lesson.status]}</p> : null}
            <button
              type="button"
              className="la-btn"
              data-testid="rd-lesson-practice"
              disabled={lesson.practice.questions === 0}
              onClick={() =>
                actions.startDrill({
                  kind: 'framework',
                  frameworkId: lesson.id,
                  section: lesson.section,
                })
              }
            >
              Öva detta mönster
              <ArrowRight size={18} aria-hidden />
            </button>
            <p>
              {lesson.practice.questions
                ? `${lesson.practice.questions} exempelfrågor att öva på`
                : 'Inga exempelfrågor tillgängliga ännu.'}
            </p>
          </div>
        </article>
      </div>
    </Hub>
  )
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="la-lesson-part">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function Text({ children }: { children: string }) {
  return (
    <p>
      <MathText>{children}</MathText>
    </p>
  )
}

/** Family-specific authored content, never a generated exercise or example. */
function LessonContent({ entry }: { entry: FrameworkEntry }) {
  return (
    <>
      {'pattern_description' in entry ? (
        <>
          {entry.tldr ? <Text>{entry.tldr}</Text> : null}
          <Part title="Mönstret">
            <Text>{entry.pattern_description}</Text>
          </Part>
          {entry.recognition_cue ? (
            <Part title="När du ska reagera">
              <Text>{entry.recognition_cue}</Text>
            </Part>
          ) : null}
          <Part title="Varför det händer">
            <Text>{entry.why_it_occurs}</Text>
          </Part>
          <Part title="Fällans tecken">
            <Text>{entry.common_distractor_signature}</Text>
          </Part>
          <Part title="Så tar du dig förbi">
            <Text>{entry.countermeasure}</Text>
          </Part>
          {entry.worked_example ? (
            <Part title="Ett genomarbetat exempel">
              <Part title="Förutsättning">
                <Text>{entry.worked_example.setup}</Text>
              </Part>
              <Part title="Fällans tanke">
                <Text>{entry.worked_example.trap_thinking}</Text>
              </Part>
              <Part title="Korrekt tanke">
                <Text>{entry.worked_example.correct_thinking}</Text>
              </Part>
              <Part title="Svar">
                <Text>{entry.worked_example.answer}</Text>
              </Part>
            </Part>
          ) : null}
          {entry.counter_example ? (
            <details className="la-lesson-detail">
              <summary>När mönstret inte gäller</summary>
              <Text>{entry.counter_example}</Text>
            </details>
          ) : null}
        </>
      ) : 'attack_protocol' in entry ? (
        <>
          <Part title="Arbetsgång">
            <ol className="la-lesson-steps">
              {entry.attack_protocol.map((step) => (
                <li key={step}>
                  <MathText>{step}</MathText>
                </li>
              ))}
            </ol>
          </Part>
          <Part title="Vanliga felsvar">
            {entry.common_distractors.map((d) => (
              <details key={d.pattern} className="la-lesson-detail">
                <summary>
                  <MathText>{d.pattern}</MathText>
                </summary>
                <Text>{d.why_it_traps}</Text>
              </details>
            ))}
          </Part>
        </>
      ) : 'tactic' in entry ? (
        <>
          <Part title="Metod">
            <Text>{entry.tactic}</Text>
          </Part>
          <Part title="När den hjälper">
            <Text>{entry.when_to_apply}</Text>
          </Part>
        </>
      ) : 'constraint_type' in entry ? (
        <>
          <Part title="Sambandet">
            <Text>{entry.constraint_type}</Text>
          </Part>
          <Part title="Regel">
            <Text>{entry.rule}</Text>
          </Part>
        </>
      ) : (
        <>
          <Part title="Rot och ursprung">
            <Text>{`${entry.root} · ${entry.origin}`}</Text>
          </Part>
          <Part title="Betydelse">
            <Text>{entry.meaning}</Text>
          </Part>
          <Part title="Ord med roten">
            <ul>
              {entry.example_words.map((word) => (
                <li key={word}>
                  <MathText>{word}</MathText>
                </li>
              ))}
            </ul>
          </Part>
        </>
      )}
      {entry.notes ? (
        <details className="la-lesson-detail">
          <summary>Fördjupning</summary>
          <Text>{entry.notes}</Text>
        </details>
      ) : null}
    </>
  )
}
