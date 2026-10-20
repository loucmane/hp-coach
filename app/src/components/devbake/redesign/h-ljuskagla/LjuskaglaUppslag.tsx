import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  FrameworkEntry,
  FrameworkFamily,
  FrameworkStatus,
  UppslagEntryView,
  UppslagSectionView,
} from '@/components/devbake/redesign/viewModel'
import { flattenMathText, MathText } from '@/components/MathText'
import type { Section } from '@/data/questions'
import { bringToTop, count, sectionId } from './LjuskaglaParts'

/** A framework entry's progress, in words (useFrameworkProgress). */
const STATUS: Record<FrameworkStatus, string> = {
  untaught: 'inte påbörjad',
  learning: 'under inlärning',
  practicing: 'övas',
  retaining: 'repeteras',
  mastered: 'befäst',
}

/** Each family's word for its entries ("this one" as a sentence says it),
 *  and its practice action in the app's own words (TrapCard, ProtocolCard,
 *  LexiconCard). */
const FAMILY: Record<
  FrameworkFamily,
  { one: string; many: string; this: string; practice: string }
> = {
  las_taxonomy: {
    one: 'frågetyp',
    many: 'frågetyper',
    this: 'den här frågetypen',
    practice: 'Öva denna frågetyp',
  },
  elf_taxonomy: {
    one: 'frågetyp',
    many: 'frågetyper',
    this: 'den här frågetypen',
    practice: 'Öva denna frågetyp',
  },
  xyz_traps: {
    one: 'mönster',
    many: 'mönster',
    this: 'det här mönstret',
    practice: 'Öva detta mönster',
  },
  kva_traps: {
    one: 'mönster',
    many: 'mönster',
    this: 'det här mönstret',
    practice: 'Öva detta mönster',
  },
  nog_traps: {
    one: 'mönster',
    many: 'mönster',
    this: 'det här mönstret',
    practice: 'Öva detta mönster',
  },
  dtk_tactics: {
    one: 'taktik',
    many: 'taktiker',
    this: 'den här taktiken',
    practice: 'Öva denna taktik',
  },
  mek_protocol: {
    one: 'regel',
    many: 'regler',
    this: 'den här regeln',
    practice: 'Öva denna regel',
  },
  ord_roots: {
    one: 'ordrot',
    many: 'ordrötter',
    this: 'den här ordroten',
    practice: 'Öva ord med denna rot',
  },
}

/** Every piece of an entry's text, to estimate its reading time. */
function entryText(e: FrameworkEntry): (string | undefined)[] {
  if ('attack_protocol' in e) {
    return [
      ...e.attack_protocol,
      ...e.common_distractors.flatMap((d) => [d.pattern, d.why_it_traps]),
      e.notes,
    ]
  }
  if ('pattern_description' in e) {
    const w = e.worked_example
    return [
      e.tldr,
      e.pattern_description,
      e.recognition_cue,
      e.why_it_occurs,
      e.common_distractor_signature,
      e.countermeasure,
      w?.setup,
      w?.trap_thinking,
      w?.correct_thinking,
      w?.answer,
      e.counter_example,
      e.notes,
    ]
  }
  if ('tactic' in e) return [e.tactic, e.when_to_apply, e.notes]
  if ('rule' in e) return [e.constraint_type, e.rule, e.notes]
  return [e.root, e.origin, e.meaning, ...e.example_words, e.notes]
}

/** "Läses på ungefär 3 minuter", at a calm 180 words a minute. */
function readingTime(e: FrameworkEntry): string {
  const words = entryText(e).filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 180))
  return minutes === 1 ? 'Läses på ungefär en minut' : `Läses på ungefär ${minutes} minuter`
}

/** A titled piece of the lesson, left out when the entry has no text for it. */
function Block({ title, text }: { title: string; text: string | undefined }) {
  if (!text) return null
  return (
    <section className="lj-lesson-block">
      <h3>{title}</h3>
      <p>
        <MathText>{text}</MathText>
      </p>
    </section>
  )
}

/**
 * The open entry verbatim, in the shape its family has: a question type's
 * attack protocol and common wrong answers (LÄS, ELF), a trap's cue,
 * countermeasure and worked example (XYZ, KVA, NOG), a tactic (DTK), a rule
 * (MEK) or a root with its words (ORD). Never one generic card.
 */
function LessonBody({ entry: e }: { entry: FrameworkEntry }) {
  let body: ReactNode
  if ('attack_protocol' in e) {
    body = (
      <>
        {e.attack_protocol.length > 0 && (
          <section className="lj-lesson-block">
            <h3>Så tar du dig an frågan</h3>
            <ol className="lj-lesson-steps">
              {e.attack_protocol.map((step, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the protocol's own order; steps may repeat words
                <li key={i}>
                  <span className="lj-step-number" aria-hidden>
                    {i + 1}
                  </span>
                  <p>
                    <MathText>{step}</MathText>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
        {e.common_distractors.length > 0 && (
          <section className="lj-lesson-block">
            <h3>Vanliga felsvar</h3>
            <ul className="lj-lesson-traps">
              {e.common_distractors.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the catalog's own order
                <li key={i}>
                  <strong>
                    <MathText>{d.pattern}</MathText>
                  </strong>
                  <p>
                    <MathText>{d.why_it_traps}</MathText>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>
    )
  } else if ('pattern_description' in e) {
    const w = e.worked_example
    body = (
      <>
        {e.tldr && (
          <p className="lj-lesson-kicker">
            <MathText>{e.tldr}</MathText>
          </p>
        )}
        <Block title="Mönstret" text={e.pattern_description} />
        <Block title="Känn igen det" text={e.recognition_cue} />
        <Block title="Varför det lurar" text={e.why_it_occurs} />
        <Block title="Det lockande felsvaret" text={e.common_distractor_signature} />
        <Block title="Motdraget" text={e.countermeasure} />
        {w && (
          <section className="lj-lesson-block lj-lesson-example">
            <h3>Ett genomräknat exempel</h3>
            <dl>
              <div>
                <dt>Uppgiften</dt>
                <dd>
                  <MathText>{w.setup}</MathText>
                </dd>
              </div>
              <div>
                <dt>Tankefällan</dt>
                <dd>
                  <MathText>{w.trap_thinking}</MathText>
                </dd>
              </div>
              <div>
                <dt>Så tänker du rätt</dt>
                <dd>
                  <MathText>{w.correct_thinking}</MathText>
                </dd>
              </div>
              <div>
                <dt>Svar</dt>
                <dd>
                  <MathText>{w.answer}</MathText>
                </dd>
              </div>
            </dl>
          </section>
        )}
        <Block title="När mönstret inte gäller" text={e.counter_example} />
      </>
    )
  } else if ('tactic' in e) {
    body = (
      <>
        <Block title="Taktiken" text={e.tactic} />
        <Block title="När du använder den" text={e.when_to_apply} />
      </>
    )
  } else if ('rule' in e) {
    body = (
      <>
        <Block title="Villkoret" text={e.constraint_type} />
        <Block title="Regeln" text={e.rule} />
      </>
    )
  } else {
    body = (
      <>
        <p className="lj-lesson-root">{e.root}</p>
        <Block title="Ursprung" text={e.origin} />
        <Block title="Betydelse" text={e.meaning} />
        {e.example_words.length > 0 && (
          <section className="lj-lesson-block">
            <h3>Ord med roten</h3>
            <ul className="lj-lesson-words">
              {e.example_words.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          </section>
        )}
      </>
    )
  }
  return (
    <div className="lj-lesson-body">
      {body}
      <Block title="Att tänka på" text={e.notes} />
    </div>
  )
}

/** An entry's quiet second line: read or not, its progress, its place. */
function entryNote(entry: UppslagEntryView, open: boolean, asked: boolean): string {
  return [
    open ? 'öppen nu' : asked ? 'begärd' : null,
    entry.read ? 'läst' : 'inte läst',
    entry.status && entry.status !== 'untaught' ? STATUS[entry.status] : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * Uppslag & lektion: the lit reading place and a quiet directory beside it.
 * The open lesson is the one lamp — its family's own content in Spectral,
 * "Markera som läst" and one filled way to practise it. The directory holds
 * the eight sections in their stable order, how much of each is read, and
 * the entries of one section at a time, the open entry on the warm line. On
 * a phone the directory folds into "Innehåll" above the lesson.
 *
 * Asking for another entry asks the host; until the host supplies it, the
 * open text stays and says so, never a borrowed body. A lesson that arrives
 * after an ask takes focus at its title.
 */
export function LjuskaglaUppslag({ width }: { width: WidthKey }) {
  const { data, actions } = useDirectionData()
  const { sections, open } = data.uppslag
  const phone = width === 'phone'
  const [browse, setBrowse] = useState<Section | null>(open.section)
  const [requested, setRequested] = useState<{ id: string; title: string } | null>(null)
  const [indexOpen, setIndexOpen] = useState(false)
  const [said, setSaid] = useState('')
  const [shownId, setShownId] = useState(open.id)
  const heading = useRef<HTMLHeadingElement>(null)
  const askedLesson = useRef(false)
  const askedRead = useRef(false)
  const indexId = useId()
  const entriesId = useId()
  const lessonId = useId()

  // A newly supplied lesson opens its own section and ends the wait.
  if (shownId !== open.id) {
    setShownId(open.id)
    setBrowse(open.section)
    setRequested(null)
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: a lesson the reader asked for takes focus once it is here
  useEffect(() => {
    if (!askedLesson.current) return
    askedLesson.current = false
    setIndexOpen(false)
    bringToTop(heading.current)
  }, [open.id])
  // The read mark is the host's: it is said only once the host shows it.
  useEffect(() => {
    if (!askedRead.current) return
    askedRead.current = false
    setSaid(open.read ? 'Markerad som läst.' : 'Markeringen som läst är borttagen.')
  }, [open.read])

  const family = FAMILY[open.family]
  const catalog = sections.find((s) => s.section === open.section)
  const practicable = open.practice.questions > 0
  const choose = (s: UppslagSectionView) => setBrowse(browse === s.section ? null : s.section)
  const ask = (entry: UppslagEntryView) => {
    if (entry.id === open.id) {
      askedLesson.current = false
      setRequested(null)
      setIndexOpen(false)
      bringToTop(heading.current)
      return
    }
    askedLesson.current = true
    setRequested({ id: entry.id, title: entry.title })
    actions.openLesson(entry.id)
  }

  const index = (
    <nav className="lj-ref-index lj-shade" aria-label="Uppslagets innehåll">
      <h2 className="lj-ref-index-head">Delprov</h2>
      {sections.length === 0 ? (
        <p className="lj-hub-note">Inget innehåll här ännu.</p>
      ) : (
        <ol className="lj-ref-sections">
          {sections.map((s) => {
            const expanded = browse === s.section
            const read = s.entries.filter((e) => e.read).length
            const kind = FAMILY[s.family]
            const state =
              s.entries.length > 0
                ? `${read} av ${count(s.entries.length, kind.one, kind.many)} lästa`
                : 'Inget innehåll här ännu'
            return (
              <li key={s.section} data-expanded={String(expanded)}>
                <button
                  type="button"
                  className="lj-ref-section"
                  data-testid={`rd-uppslag-section-${sectionId(s.section)}`}
                  aria-label={`${s.section}, ${s.name}, ${state.toLocaleLowerCase('sv-SE')}`}
                  aria-expanded={expanded}
                  aria-controls={expanded ? entriesId : undefined}
                  onClick={() => choose(s)}
                >
                  <span className="lj-row-code">{s.section}</span>
                  <span className="lj-ref-section-main">
                    <strong>{s.name}</strong>
                    <span>{state}</span>
                  </span>
                  {expanded ? (
                    <ChevronUp size={18} aria-hidden />
                  ) : (
                    <ChevronDown size={18} aria-hidden />
                  )}
                </button>
                {expanded &&
                  (s.entries.length > 0 ? (
                    <ol
                      className="lj-ref-entries"
                      id={entriesId}
                      aria-label={`${s.name}: ${kind.many}`}
                    >
                      {s.entries.map((entry) => {
                        const isOpen = entry.id === open.id
                        const note = entryNote(entry, isOpen, requested?.id === entry.id)
                        return (
                          <li key={entry.id} data-open={String(isOpen)}>
                            <button
                              type="button"
                              className="lj-ref-entry"
                              data-testid={`rd-uppslag-entry-${entry.id}`}
                              aria-label={`${flattenMathText(entry.title)}, ${note}`}
                              aria-describedby={
                                entry.summary ? `${entriesId}-${entry.id}` : undefined
                              }
                              aria-current={isOpen ? 'true' : undefined}
                              onClick={() => ask(entry)}
                            >
                              <span className="lj-ref-entry-title">
                                <MathText>{entry.title}</MathText>
                              </span>
                              {entry.summary && (
                                <span
                                  className="lj-ref-entry-summary"
                                  id={`${entriesId}-${entry.id}`}
                                >
                                  <MathText>{entry.summary}</MathText>
                                </span>
                              )}
                              <span className="lj-ref-entry-note">
                                {entry.read && <Check size={13} aria-hidden />}
                                {note}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  ) : (
                    <p className="lj-ref-empty" id={entriesId}>
                      Inget innehåll här ännu. Välj ett annat delprov.
                    </p>
                  ))}
              </li>
            )
          })}
        </ol>
      )}
    </nav>
  )

  return (
    <div className="lj-page lj-ref">
      <header className="lj-page-head">
        <p className="lj-eyebrow">Uppslag</p>
        <h1>Ett mönster i taget.</h1>
      </header>
      <div className="lj-ref-grid">
        {phone ? (
          <div className="lj-ref-contents">
            <button
              type="button"
              className="lj-ref-toggle"
              aria-expanded={indexOpen}
              aria-controls={indexId}
              onClick={() => setIndexOpen(!indexOpen)}
            >
              <span className="lj-eyebrow">Innehåll</span>{' '}
              <span className="lj-ref-toggle-place">
                {open.section} · <MathText>{open.title}</MathText>
              </span>
              {indexOpen ? (
                <ChevronUp size={18} aria-hidden />
              ) : (
                <ChevronDown size={18} aria-hidden />
              )}
            </button>
            <div id={indexId} hidden={!indexOpen}>
              {index}
            </div>
          </div>
        ) : (
          index
        )}
        <article className="lj-lesson" aria-labelledby={lessonId}>
          <p className="lj-ref-notice" role="status">
            {requested
              ? `Lektion begärd: ${requested.title}. Den öppna texten ligger kvar tills den nya har laddats.`
              : ''}
          </p>
          <p className="lj-eyebrow">
            {open.section} · {catalog?.name ?? open.section} · {family.one}
          </p>
          <h2 id={lessonId} ref={heading} tabIndex={-1} data-testid="rd-lesson">
            <MathText>{open.title}</MathText>
          </h2>
          <p className="lj-lesson-meta">
            {[
              readingTime(open.entry),
              open.status && open.status !== 'untaught' ? STATUS[open.status] : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <LessonBody entry={open.entry} />
          <footer className="lj-lesson-actions">
            <button
              type="button"
              className="lj-tool lj-lesson-read"
              data-testid="rd-lesson-read"
              data-read={String(open.read)}
              onClick={() => {
                askedRead.current = true
                actions.toggleLessonRead(open.id)
              }}
            >
              {open.read ? (
                <>
                  <Check size={16} aria-hidden /> Läst · ångra
                </>
              ) : (
                'Markera som läst'
              )}
            </button>
            <p className="lj-lesson-said" role="status">
              {said}
            </p>
            <button
              type="button"
              className="lj-primary"
              data-testid="rd-lesson-practice"
              disabled={!practicable}
              onClick={() =>
                actions.startDrill({
                  kind: 'framework',
                  frameworkId: open.id,
                  section: open.section,
                })
              }
            >
              <span>
                {family.practice}
                {practicable && (
                  <span className="lj-lesson-count">
                    {' '}
                    · {count(open.practice.questions, 'exempelfråga', 'exempelfrågor')}
                  </span>
                )}
              </span>
              <ArrowRight size={20} aria-hidden />
            </button>
            {!practicable && (
              <p className="lj-lesson-none">Det finns inga exempelfrågor till {family.this} än.</p>
            )}
          </footer>
        </article>
      </div>
    </div>
  )
}
