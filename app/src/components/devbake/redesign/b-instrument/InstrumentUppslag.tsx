import { ArrowLeft, ArrowRight, BookOpen, Check } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { MathText } from '@/components/MathText'
import { useDirectionData } from '../directionData'
import type { WidthKey } from '../r1Kit'
import type { FrameworkEntry, FrameworkStatus, LessonView } from '../viewModel'

const STATUS: Record<FrameworkStatus, string> = {
  untaught: 'Inte övat',
  learning: 'Lär in',
  practicing: 'Övar',
  retaining: 'Repeterar',
  mastered: 'Befäst',
}
const slug = (section: string) => section.toLowerCase().replace('ä', 'a')

export function InstrumentUppslag({ width }: { width: WidthKey }) {
  const { data, actions } = useDirectionData()
  const { sections, open } = data.uppslag
  const [selected, setSelected] = useState(open.section)
  const [index, setIndex] = useState(false)
  const [notice, setNotice] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const group = sections.find((item) => item.section === selected) ?? sections[0]
  // A provider/deep-link change owns the selected lesson; arriving read marks
  // do not reorder the contents or reset the reading position.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a deep link to another entry in the same section must focus its heading
  useEffect(() => {
    setSelected(open.section)
    setIndex(false)
    setNotice('')
    heading.current?.focus({ preventScroll: true })
  }, [open.id, open.section])
  const lesson = !index && group?.section === open.section ? open : null
  return (
    <div className="in-hub in-library">
      <header className="in-library-heading">
        <div>
          <span className="in-code">Referens</span>
          <h1>Uppslag</h1>
        </div>
        <p>Läs en regel. Pröva den i en fråga.</p>
      </header>
      <details className="in-library-sections" open={index}>
        <summary>
          Alla sektioner <span className="in-num">{sections.length}</span>
        </summary>
        <div className="in-library-register">
          {sections.map((section) => (
            <button
              type="button"
              key={section.section}
              data-testid={`rd-uppslag-section-${slug(section.section)}`}
              aria-pressed={group?.section === section.section}
              onClick={() => {
                setSelected(section.section)
                setIndex(false)
                setNotice('')
              }}
            >
              <b className="in-code">{section.section}</b>
              <span>
                {section.name}
                <small>
                  {section.entries.length
                    ? `${section.entries.filter((entry) => entry.read).length} av ${section.entries.length} lästa`
                    : 'Innehåll saknas ännu'}
                </small>
              </span>
              <ArrowRight size={16} aria-hidden />
            </button>
          ))}
        </div>
      </details>
      {group ? (
        <div className="in-library-workbench">
          <details className="in-contents" open={width !== 'phone'}>
            <summary>
              Innehåll · {group.section}
              <span className="in-num">{group.entries.length}</span>
            </summary>
            <nav aria-label={`Lektioner i ${group.section}`}>
              {group.entries.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  data-testid={`rd-uppslag-entry-${entry.id}`}
                  aria-current={lesson?.id === entry.id ? 'true' : undefined}
                  onClick={() => {
                    setIndex(false)
                    actions.openLesson(entry.id)
                    setNotice(
                      entry.id === open.id
                        ? ''
                        : 'Lektion begärd. Den öppna texten ligger kvar tills innehållet är tillgängligt.',
                    )
                    if (entry.id === open.id) heading.current?.focus()
                  }}
                >
                  <span>
                    {entry.title}
                    <small>
                      {entry.read ? 'Läst' : 'Oläst'}
                      {entry.status ? ` · ${STATUS[entry.status]}` : ''}
                    </small>
                  </span>
                  {entry.read ? (
                    <Check size={15} aria-hidden />
                  ) : (
                    <BookOpen size={15} aria-hidden />
                  )}
                </button>
              ))}
              {!group.entries.length ? <p>Innehåll saknas ännu.</p> : null}
            </nav>
          </details>
          <section className="in-lesson-pane" aria-label="Lektion">
            <div className="in-pane-head">
              <span className="in-pane-label">Uppslag / {group.section}</span>
              <span className="in-spacer" />
              <button type="button" className="in-ghost" onClick={() => setIndex(true)}>
                <ArrowLeft size={15} aria-hidden />
                Alla sektioner
              </button>
            </div>
            {notice ? (
              <p className="in-lesson-notice" role="status">
                {notice}
              </p>
            ) : null}
            {lesson ? (
              <article className="in-lesson" data-testid="rd-lesson">
                <span className="in-code">
                  {lesson.section} · {lesson.read ? 'Läst' : 'Oläst'}
                </span>
                <h2 ref={heading} tabIndex={-1}>
                  {lesson.title}
                </h2>
                {lesson.status ? (
                  <p className="in-sub">Övningsläge: {STATUS[lesson.status]}</p>
                ) : null}
                <LessonContent entry={lesson.entry} />
                <footer className="in-lesson-actions">
                  <button
                    type="button"
                    className="in-btn2"
                    data-testid="rd-lesson-read"
                    aria-pressed={lesson.read}
                    onClick={() => actions.toggleLessonRead(lesson.id)}
                  >
                    <Check size={16} aria-hidden />
                    {lesson.read ? 'Markera som oläst' : 'Markera som läst'}
                  </button>
                  <p>Läst betyder att du har gått igenom texten. Övningen visar vad som sitter.</p>
                  <button
                    type="button"
                    className="in-btn"
                    data-testid="rd-lesson-practice"
                    disabled={lesson.practice.questions <= 0}
                    onClick={() =>
                      actions.startDrill({
                        kind: 'framework',
                        frameworkId: lesson.id,
                        section: lesson.section,
                      })
                    }
                  >
                    {practiceLabel(lesson)}
                    <ArrowRight size={16} aria-hidden />
                  </button>
                  <p>
                    {lesson.practice.questions > 0
                      ? `${lesson.practice.questions} exempelfrågor`
                      : 'Inga övningsfrågor är tillgängliga för detta innehåll.'}
                  </p>
                </footer>
              </article>
            ) : (
              <div className="in-lesson">
                <h2>{group.name}</h2>
                <p>
                  {group.entries.length
                    ? 'Välj ett uppslag i innehållsförteckningen.'
                    : 'Innehåll saknas ännu.'}
                </p>
                {group.entries.length ? (
                  <button
                    type="button"
                    className="in-btn"
                    onClick={() => {
                      actions.openLesson(group.entries[0].id)
                      if (group.section === open.section) setIndex(false)
                      else setNotice('Lektionsinnehållet är inte tillgängligt här ännu.')
                    }}
                  >
                    Läs {group.section}
                  </button>
                ) : null}
              </div>
            )}
          </section>
        </div>
      ) : (
        <p>Innehåll saknas ännu.</p>
      )}
    </div>
  )
}

function practiceLabel(lesson: LessonView) {
  if (lesson.family === 'dtk_tactics') return 'Öva denna taktik'
  if (lesson.family === 'mek_protocol') return 'Öva denna regel'
  if (lesson.family === 'ord_roots') return 'Öva denna rot'
  if (lesson.family === 'las_taxonomy' || lesson.family === 'elf_taxonomy')
    return 'Öva denna frågetyp'
  return 'Öva detta mönster'
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="in-lesson-block">
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

function LessonContent({ entry }: { entry: FrameworkEntry }) {
  return (
    <>
      {'pattern_description' in entry ? (
        <>
          {entry.tldr ? <Text>{entry.tldr}</Text> : null}
          <Block title="Mönstret">
            <Text>{entry.pattern_description}</Text>
          </Block>
          {entry.recognition_cue ? (
            <Block title="Igenkänningstecken">
              <Text>{entry.recognition_cue}</Text>
            </Block>
          ) : null}
          <Block title="Varför det händer">
            <Text>{entry.why_it_occurs}</Text>
          </Block>
          <Block title="Motåtgärd">
            <Text>{entry.countermeasure}</Text>
          </Block>
          <Block title="Vanligt felsvar">
            <Text>{entry.common_distractor_signature}</Text>
          </Block>
          {entry.worked_example ? (
            <Block title="Genomarbetat exempel">
              <dl className="in-worked-example">
                {(
                  [
                    ['Uppgift', entry.worked_example.setup],
                    ['Fällan', entry.worked_example.trap_thinking],
                    ['Resonemang', entry.worked_example.correct_thinking],
                    ['Svar', entry.worked_example.answer],
                  ] as const
                ).map(([label, text]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      <MathText>{text}</MathText>
                    </dd>
                  </div>
                ))}
              </dl>
            </Block>
          ) : null}
          {entry.counter_example ? (
            <details className="in-lesson-detail">
              <summary>När mönstret inte gäller</summary>
              <Text>{entry.counter_example}</Text>
            </details>
          ) : null}
        </>
      ) : 'attack_protocol' in entry ? (
        <>
          <Block title="Angreppssätt">
            <ol className="in-protocol">
              {entry.attack_protocol.map((step, index) => (
                <li key={step}>
                  <span className="in-code" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <MathText>{step}</MathText>
                </li>
              ))}
            </ol>
          </Block>
          <Block title="Vanliga felsvar">
            {entry.common_distractors.map((item) => (
              <details key={item.pattern} className="in-lesson-detail">
                <summary>{item.pattern}</summary>
                <Text>{item.why_it_traps}</Text>
              </details>
            ))}
          </Block>
        </>
      ) : 'root' in entry ? (
        <>
          <Block title="Ordrot">
            <Text>{entry.root}</Text>
          </Block>
          <Block title="Ursprung">
            <Text>{entry.origin}</Text>
          </Block>
          <Block title="Betydelse">
            <Text>{entry.meaning}</Text>
          </Block>
          <Block title="Exempelord">
            <ul>
              {entry.example_words.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          </Block>
        </>
      ) : 'tactic' in entry ? (
        <>
          <Block title="Taktik">
            <Text>{entry.tactic}</Text>
          </Block>
          <Block title="När den hjälper">
            <Text>{entry.when_to_apply}</Text>
          </Block>
        </>
      ) : (
        <>
          <Block title="Villkor">
            <Text>{entry.constraint_type}</Text>
          </Block>
          <Block title="Regel">
            <Text>{entry.rule}</Text>
          </Block>
        </>
      )}
      {entry.notes ? (
        <details className="in-lesson-detail">
          <summary>Fördjupning</summary>
          <Text>{entry.notes}</Text>
        </details>
      ) : null}
    </>
  )
}
