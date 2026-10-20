import { useEffect, useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { FrameworkStatus, LessonView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { IndexNumber, rasterSlug } from './RasterParts'

const STATUS: Record<FrameworkStatus, string> = {
  untaught: 'Inte övat',
  learning: 'Introducerat',
  practicing: 'Övas',
  retaining: 'Repeteras',
  mastered: 'Befäst',
}

const PRACTICE: Record<LessonView['family'], string> = {
  nog_traps: 'Öva detta mönster',
  kva_traps: 'Öva detta mönster',
  xyz_traps: 'Öva detta mönster',
  dtk_tactics: 'Öva denna taktik',
  mek_protocol: 'Öva denna regel',
  las_taxonomy: 'Öva denna frågetyp',
  elf_taxonomy: 'Öva denna frågetyp',
  ord_roots: 'Öva ord med denna rot',
}

export function RasterUppslag({ width }: { width: WidthKey }) {
  const { data, actions } = useDirectionData()
  const { sections, open } = data.uppslag
  const [section, setSection] = useState(open.section)
  const [indexOnly, setIndexOnly] = useState(false)
  const [contentsOpen, setContentsOpen] = useState(width === 'desktop')
  const [requested, setRequested] = useState<{ id: string; title: string } | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const focusRequested = useRef(false)
  const contentsId = useId()
  const current = sections.find((s) => s.section === section)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a newly supplied entry is the navigation/focus boundary
  useEffect(() => {
    setSection(open.section)
    setIndexOnly(false)
    if (focusRequested.current) {
      heading.current?.focus()
      focusRequested.current = false
    }
  }, [open.id, open.section])
  const request = (id: string, title: string) => {
    setIndexOnly(false)
    setRequested({ id, title })
    if (id === open.id) window.requestAnimationFrame(() => heading.current?.focus())
    else focusRequested.current = true
    actions.openLesson(id)
  }
  const hasExamples = open.practice.questions > 0 && open.entry.example_questions.length > 0
  return (
    <div className="ra-register-page ra-library">
      <header className="ra-register-heading">
        <div>
          <p className="ra-label">04 / Uppslag</p>
          <h1>Läs. Känn igen. Använd.</h1>
        </div>
        <p>Metoderna bakom frågorna</p>
      </header>
      <nav className="ra-library-sections" aria-label="Uppslag per sektion">
        {sections.map((s) => (
          <button
            type="button"
            key={s.section}
            data-testid={`rd-uppslag-section-${rasterSlug(s.section)}`}
            aria-pressed={s.section === section}
            onClick={() => {
              setSection(s.section)
              setContentsOpen(true)
            }}
          >
            <b>{s.section}</b>
            <span>{s.name}</span>
            <small>
              {s.entries.length
                ? `${s.entries.filter((e) => e.read).length}/${s.entries.length} lästa`
                : 'Inget innehåll här ännu'}
            </small>
          </button>
        ))}
      </nav>
      {!sections.length ? <p>Inget innehåll här ännu.</p> : null}
      <div className="ra-library-grid">
        <aside className="ra-contents">
          <details
            open={contentsOpen}
            onToggle={(event) => setContentsOpen(event.currentTarget.open)}
          >
            <summary>Innehåll · {current?.section ?? section}</summary>
            <ol id={contentsId}>
              {current?.entries.map((entry, i) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    data-testid={`rd-uppslag-entry-${entry.id}`}
                    aria-current={!indexOnly && entry.id === open.id ? 'page' : undefined}
                    onClick={() => request(entry.id, entry.title)}
                  >
                    <IndexNumber value={i + 1} />
                    <span>
                      <strong>{entry.title}</strong>
                      {entry.summary ? <small>{entry.summary}</small> : null}
                      <small>
                        {entry.read ? 'Läst ✓' : 'Inte läst'}
                        {entry.status ? ` · ${STATUS[entry.status]}` : ''}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            {!current?.entries.length ? <p>Inget innehåll här ännu.</p> : null}
          </details>
        </aside>
        <div className="ra-lesson-column">
          {requested && requested.id !== open.id ? (
            <p role="status" className="ra-request-status">
              Lektion begärd: {requested.title}. Det öppna uppslaget visas tills lektionen är
              tillgänglig.
            </p>
          ) : null}
          {indexOnly ? (
            <section className="ra-library-intro">
              <h2>Välj ett uppslag i innehållet.</h2>
              <p>
                Läsningen och övningen har varsin markering. Att öppna ett uppslag markerar det inte
                som läst.
              </p>
              <button
                type="button"
                className="ra-primary"
                onClick={() => request(open.id, open.title)}
              >
                Öppna {open.title} ↗
              </button>
            </section>
          ) : (
            <article className="ra-lesson" data-testid="rd-lesson">
              <button type="button" className="ra-text-link" onClick={() => setIndexOnly(true)}>
                ← Till Uppslag
              </button>
              <p className="ra-label">{open.section} / Lektion</p>
              <h2 ref={heading} tabIndex={-1}>
                {open.title}
              </h2>
              {open.status ? (
                <p className="ra-lesson-status">Övning: {STATUS[open.status]}</p>
              ) : null}
              <LessonBody lesson={open} />
              <footer className="ra-lesson-actions">
                <button
                  type="button"
                  className="ra-outline"
                  data-testid="rd-lesson-read"
                  aria-pressed={open.read}
                  onClick={() => actions.toggleLessonRead(open.id)}
                >
                  {open.read ? 'Läst ✓ · Markera som oläst' : 'Markera som läst'}
                </button>
                <button
                  type="button"
                  className="ra-primary"
                  data-testid="rd-lesson-practice"
                  disabled={!hasExamples}
                  onClick={() => {
                    if (hasExamples)
                      actions.startDrill({
                        kind: 'framework',
                        frameworkId: open.id,
                        section: open.section,
                      })
                  }}
                >
                  {PRACTICE[open.family]} <span aria-hidden>↗</span>
                </button>
                {hasExamples ? (
                  <p>{open.practice.questions} övningsfrågor till uppslaget</p>
                ) : (
                  <p>Inga övningsfrågor till detta uppslag ännu.</p>
                )}
                <button
                  type="button"
                  className="ra-text-link"
                  onClick={() => actions.startDrill({ kind: 'section', section: open.section })}
                >
                  Öva hela {open.section} ↗
                </button>
              </footer>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}

function LessonText({ title, text }: { title: string; text?: string }) {
  if (!text) return null
  return (
    <section className="ra-lesson-block">
      <h3>{title}</h3>
      <p>
        <MathText>{text}</MathText>
      </p>
    </section>
  )
}

function LessonBody({ lesson }: { lesson: LessonView }) {
  const e = lesson.entry
  return (
    <div className="ra-lesson-body">
      {'pattern_description' in e ? (
        <>
          {e.tldr ? (
            <p className="ra-lesson-summary">
              <MathText>{e.tldr}</MathText>
            </p>
          ) : null}
          <LessonText title="Mönstret" text={e.pattern_description} />
          <LessonText title="Varför det händer" text={e.why_it_occurs} />
          <LessonText title="Känn igen det" text={e.recognition_cue} />
          <LessonText title="Det lockande felsvaret" text={e.common_distractor_signature} />
          <LessonText title="Motåtgärd" text={e.countermeasure} />
          {e.worked_example ? (
            <details className="ra-lesson-example">
              <summary>Genomräknat exempel</summary>
              <LessonText title="Uppgiften" text={e.worked_example.setup} />
              <LessonText title="Tankefällan" text={e.worked_example.trap_thinking} />
              <LessonText title="Så löser du det" text={e.worked_example.correct_thinking} />
              <LessonText title="Svar" text={e.worked_example.answer} />
            </details>
          ) : null}
          <LessonText title="När mönstret inte gäller" text={e.counter_example} />
        </>
      ) : 'attack_protocol' in e ? (
        <>
          {e.attack_protocol.length ? (
            <section className="ra-lesson-block">
              <h3>Så tar du dig an frågan</h3>
              <ol className="ra-protocol">
                {e.attack_protocol.map((step, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: ordered source steps may repeat
                  <li key={i}>
                    <IndexNumber value={i + 1} />
                    <p>
                      <MathText>{step}</MathText>
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {e.common_distractors.length ? (
            <section className="ra-lesson-block">
              <h3>Vanliga felsvar</h3>
              {e.common_distractors.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: immutable source order
                <div className="ra-lesson-distractor" key={i}>
                  <h4>
                    <MathText>{d.pattern}</MathText>
                  </h4>
                  <p>
                    <MathText>{d.why_it_traps}</MathText>
                  </p>
                </div>
              ))}
            </section>
          ) : null}
        </>
      ) : 'root' in e ? (
        <>
          <LessonText title="Rot" text={e.root} />
          <LessonText title="Ursprung" text={e.origin} />
          <LessonText title="Betydelse" text={e.meaning} />
          {e.example_words.length ? (
            <section className="ra-lesson-block">
              <h3>Exempelord</h3>
              <ul>
                {e.example_words.map((word) => (
                  <li key={word}>{word}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : 'tactic' in e ? (
        <>
          <LessonText title="Taktiken" text={e.tactic} />
          <LessonText title="När den används" text={e.when_to_apply} />
        </>
      ) : 'rule' in e ? (
        <>
          <LessonText title="Villkoret" text={e.constraint_type} />
          <LessonText title="Regeln" text={e.rule} />
        </>
      ) : null}
      <LessonText title="Fördjupning" text={e.notes} />
    </div>
  )
}
