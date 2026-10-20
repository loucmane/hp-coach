// Samtal · Uppslag och lektion — the open lesson as a document in the
// coach's turn, practice as the reply, the whole framework below it.
//
// The page opens with its date and "Alla delprov", the way to the eight
// sections. The coach says where the reader stands ("LÄS · 2 av 8
// frågetyper lästa") and one useful sentence about the open lesson ("Läs
// igenom den här frågetypen, så övar vi sedan på den."), and hands the
// lesson over as a calm, opaque Lora document across the column: its
// section and kind, how long it takes to read and whether it is read, its
// title, then the catalog entry verbatim, in the order the app's own reader
// keeps for its family —
//   - a question type (LÄS, ELF): how to attack the question, step by step,
//     and its common traps;
//   - a trap (XYZ, KVA, NOG): the rule in short, the pattern, why it
//     happens, how to recognise it and the countermeasure; the worked
//     example and when the trap does not apply on request ("Fler detaljer");
//   - a tactic (DTK), a rule (MEK), a root (ORD): their own fields.
// "Markera som läst" closes the document: read is only what the reader
// marks, never what was opened or scrolled. The replies: the whole section,
// quietly, and the one filled plum, practising this entry with its count.
// An entry without example questions cannot be practised: its reply is
// visibly off and says why, and the section's practice leads instead.
// Below a quiet line, the framework itself: the eight sections in the
// exam's stable order as reply-shaped doors, each with how much is read,
// and the chosen section's entries as rows — title, kicker, read and
// progress. A door shows its section's entries; a row asks for that
// lesson. If the host does not open it (the bake-off cannot), the coach
// says it has been asked for and the open text stays until the new one
// has come; when it comes, its title takes focus. Nothing is made up: only
// the open lesson has a body, and only what the kit gives is shown.

import { ArrowDown, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, type RefObject, useEffect, useId, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  FrameworkEntry,
  FrameworkFamily,
  FrameworkStatus,
  LessonView,
  UppslagEntryView,
  UppslagSectionView,
} from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { Section } from '@/data/questions'
import { VERBAL_SECTIONS } from '@/lib/scoring'
import { slug } from './SamtalOva'
import { bringIntoView, Coach, count, cx, Divider, Kbd, Replies } from './SamtalParts'

/** How each family is named: one, many, "the one" and its practice, as the
 *  app's own reader says it (ProtocolCard, TrapCard, LexiconCard). */
const FAMILY: Record<
  FrameworkFamily,
  { kind: string; one: string; many: string; the: string; practise: string }
> = {
  las_taxonomy: {
    kind: 'Frågetyp',
    one: 'frågetyp',
    many: 'frågetyper',
    the: 'frågetypen',
    practise: 'Öva denna frågetyp',
  },
  elf_taxonomy: {
    kind: 'Frågetyp',
    one: 'frågetyp',
    many: 'frågetyper',
    the: 'frågetypen',
    practise: 'Öva denna frågetyp',
  },
  xyz_traps: {
    kind: 'Fälla',
    one: 'fälla',
    many: 'fällor',
    the: 'fällan',
    practise: 'Öva detta mönster',
  },
  kva_traps: {
    kind: 'Fälla',
    one: 'fälla',
    many: 'fällor',
    the: 'fällan',
    practise: 'Öva detta mönster',
  },
  nog_traps: {
    kind: 'Fälla',
    one: 'fälla',
    many: 'fällor',
    the: 'fällan',
    practise: 'Öva detta mönster',
  },
  dtk_tactics: {
    kind: 'Taktik',
    one: 'taktik',
    many: 'taktiker',
    the: 'taktiken',
    practise: 'Öva denna taktik',
  },
  mek_protocol: {
    kind: 'Regel',
    one: 'regel',
    many: 'regler',
    the: 'regeln',
    practise: 'Öva denna regel',
  },
  ord_roots: {
    kind: 'Rot',
    one: 'rot',
    many: 'rötter',
    the: 'roten',
    practise: 'Öva ord med denna rot',
  },
}

/** Where the reader is with an entry (the progress rows), said briefly in a
 *  row and as a sentence in the lesson. An untaught entry says nothing. */
const STATUS: Record<FrameworkStatus, { row: string; say: string } | null> = {
  untaught: null,
  learning: { row: 'lär dig', say: 'Du lär dig den' },
  practicing: { row: 'övar', say: 'Du övar på den' },
  retaining: { row: 'repeterar', say: 'Du repeterar den' },
  mastered: { row: 'sitter', say: 'Den sitter' },
}

const GROUPS: { verbal: boolean; label: string }[] = [
  { verbal: true, label: 'Verbal del' },
  { verbal: false, label: 'Kvantitativ del' },
]

/** A long catalog shows this many rows, the rest on request. */
const FOLD = 8

function readCount(entries: readonly UppslagEntryView[]): number {
  return entries.filter((e) => e.read).length
}

/** Minutes to read an entry: its words at 200 a minute, as the app's own
 *  reader estimates a lesson. */
function readMinutes(entry: FrameworkEntry): number {
  let n = 0
  const add = (v: unknown) => {
    if (typeof v === 'string') n += v.trim() ? v.trim().split(/\s+/).length : 0
    else if (Array.isArray(v)) for (const x of v) add(x)
    else if (v && typeof v === 'object') for (const x of Object.values(v)) add(x)
  }
  for (const [key, value] of Object.entries(entry)) {
    if (key !== 'id' && key !== 'example_questions' && key !== 'notes') add(value)
  }
  return Math.max(1, Math.round(n / 200))
}

export function SamtalUppslag({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const { sections, open } = data.uppslag
  const fam = FAMILY[open.family]
  // The section whose entries are listed: the open lesson's, until the
  // reader picks another door. One the provider no longer has falls back.
  const [chosen, setChosen] = useState<Section>(open.section)
  const shown =
    sections.find((s) => s.section === chosen) ??
    sections.find((s) => s.section === open.section) ??
    sections[0] ??
    null
  // A lesson the reader asked for that has not come yet.
  const [asked, setAsked] = useState<string | null>(null)
  const askedRef = useRef(asked)
  askedRef.current = asked
  const titleRef = useRef<HTMLHeadingElement>(null)
  const listRef = useRef<HTMLHeadingElement>(null)
  const indexRef = useRef<HTMLHeadingElement>(null)
  const leadId = useId()
  const noPracticeId = useId()

  // Another lesson has come: its section is listed, the request is met, and
  // — when it is the one the reader asked for — its title takes focus.
  const lastOpen = useRef(open.id)
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a new open lesson only
  useEffect(() => {
    if (lastOpen.current === open.id) return
    lastOpen.current = open.id
    setChosen(open.section)
    const wanted = askedRef.current === open.id
    setAsked(null)
    if (wanted && live) {
      titleRef.current?.focus({ preventScroll: true })
      bringIntoView(titleRef.current)
    }
  }, [open.id])

  const goTo = (el: HTMLElement | null) => {
    if (!live || !el) return
    el.focus({ preventScroll: true })
    bringIntoView(el)
  }
  const askFor = (entry: UppslagEntryView) => {
    // The open one is right here: go to it, ask for nothing.
    if (entry.id === open.id) {
      goTo(titleRef.current)
      return
    }
    setAsked(entry.id)
    actions.openLesson(entry.id)
  }
  // A door the reader chose: its section's entries, right under the doors,
  // take focus once they show.
  const toList = useRef(false)
  const choose = (section: Section) => {
    if (section === shown?.section) {
      goTo(listRef.current)
      return
    }
    toList.current = true
    setChosen(section)
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a newly listed section only
  useEffect(() => {
    if (!toList.current) return
    toList.current = false
    goTo(listRef.current)
  }, [shown?.section])

  const canPractise = open.practice.questions > 0
  const practise = () => {
    if (!canPractise) return
    actions.startDrill({ kind: 'framework', frameworkId: open.id, section: open.section })
  }
  const practiseSection = () => actions.startDrill({ kind: 'section', section: open.section })
  useKeyMap({ Enter: canPractise ? practise : practiseSection }, live)

  const own = sections.find((s) => s.section === open.section)
  const lead = open.read
    ? canPractise
      ? `Du har läst den här ${fam.the}. Ska vi öva på den?`
      : `Du har läst den här ${fam.the}.`
    : canPractise
      ? `Läs igenom den här ${fam.the}, så övar vi sedan på den.`
      : `Läs igenom den här ${fam.the}.`

  return (
    <div className="sa-upp" data-width={width}>
      <Divider>{data.home.today.dateLabel}</Divider>
      <p className="sa-upp-nav">
        <button type="button" className="sa-quiet" onClick={() => goTo(indexRef.current)}>
          <ArrowDown size={16} strokeWidth={1.75} aria-hidden />
          Alla delprov
        </button>
      </p>

      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby={leadId}>
          <p className="sa-hello">
            <b>{open.section}</b>
            {own ? ` · ${readCount(own.entries)} av ${own.entries.length} ${fam.many} lästa` : null}
          </p>
          <h1 className="sa-lead-q" id={leadId} tabIndex={-1}>
            {lead}
          </h1>
        </Coach>
        {/* The coach hands the lesson over as a document, across the
         *  column: the teaching itself is never retold as chat. Another
         *  lesson opens with its details folded. */}
        <LessonDocument key={open.id} lesson={open} titleRef={titleRef} />
        <Replies>
          <button
            type="button"
            className={cx('sa-chip', 'sa-chip--big', !canPractise && 'sa-chip--primary')}
            onClick={practiseSection}
          >
            Öva hela {open.section}
            {canPractise ? null : <Kbd>↵</Kbd>}
          </button>
          <button
            type="button"
            className={cx('sa-chip', 'sa-chip--big', canPractise && 'sa-chip--primary')}
            data-testid="rd-lesson-practice"
            disabled={!canPractise}
            aria-describedby={canPractise ? undefined : noPracticeId}
            onClick={practise}
          >
            {fam.practise}
            {canPractise ? (
              <>
                {' · '}
                {count(open.practice.questions, 'fråga', 'frågor')}
                <Kbd>↵</Kbd>
              </>
            ) : null}
          </button>
        </Replies>
        {canPractise ? null : (
          <p className="sa-upp-why" id={noPracticeId}>
            Det finns inga övningsfrågor till {fam.the} än.
          </p>
        )}
      </div>

      <div className="sa-later">
        <Divider quiet>Hela ramverket</Divider>
        <div className="sa-cards">
          <SectionDoors
            sections={sections}
            shown={shown?.section ?? null}
            open={open.section}
            headRef={indexRef}
            onChoose={choose}
          />
          {shown ? (
            <Catalog
              key={shown.section}
              section={shown}
              open={open.id}
              asked={asked}
              headRef={listRef}
              onAsk={askFor}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** The open lesson, as a document attached to the coach's turn: its head
 *  (section, kind, reading time, read or not), its title (rd-lesson), the
 *  entry verbatim and, at its foot, the read mark. */
function LessonDocument({
  lesson,
  titleRef,
}: {
  lesson: LessonView
  titleRef: RefObject<HTMLHeadingElement | null>
}) {
  const { actions } = useDirectionData()
  const fam = FAMILY[lesson.family]
  const titleId = useId()
  const status = lesson.status ? STATUS[lesson.status] : null
  const e = lesson.entry
  const kicker = 'tldr' in e && e.tldr ? e.tldr : null
  return (
    <article className="sa-lesson" aria-labelledby={titleId}>
      <header className="sa-lesson-head">
        <span className="sa-doc-tag">
          <span>{lesson.section}</span>
          <span className="sa-doc-name">{fam.kind}</span>
        </span>
        <span className="sa-lesson-time">ca {readMinutes(e)} min läsning</span>
      </header>
      <div className="sa-lesson-inner">
        {kicker ? (
          <p className="sa-lesson-kicker">
            <MathText>{kicker}</MathText>
          </p>
        ) : null}
        <h2
          className="sa-lesson-title"
          id={titleId}
          data-testid="rd-lesson"
          tabIndex={-1}
          ref={titleRef}
        >
          <MathText>{lesson.title}</MathText>
        </h2>
        <p className="sa-lesson-state">
          <span data-read={String(lesson.read)}>
            {lesson.read ? (
              <>
                <Check size={14} strokeWidth={2.4} aria-hidden /> Läst
              </>
            ) : (
              'Inte läst'
            )}
          </span>
          {status ? <span>{status.say}</span> : null}
        </p>
        <LessonBody lesson={lesson} />
      </div>
      <footer className="sa-lesson-foot">
        <button
          type="button"
          className="sa-readmark"
          data-testid="rd-lesson-read"
          aria-pressed={lesson.read}
          onClick={() => actions.toggleLessonRead(lesson.id)}
        >
          <span className="sa-readmark-box" aria-hidden>
            {lesson.read ? <Check size={14} strokeWidth={2.6} /> : null}
          </span>
          Markera som läst
        </button>
        <span className="sa-lesson-foot-say">
          {lesson.read
            ? 'Tryck igen för att ta bort markeringen.'
            : 'Den räknas som läst först när du markerar den.'}
        </span>
      </footer>
    </article>
  )
}

/** A labelled part of the entry, its words verbatim (math set). Left out
 *  when the entry has none. */
function Part({ label, text }: { label: string; text?: string | null }) {
  if (!text?.trim()) return null
  return (
    <section className="sa-lesson-part">
      <h3>{label}</h3>
      <p>
        <MathText>{text}</MathText>
      </p>
    </section>
  )
}

/** The entry in its family's order. Optional parts disclose on request. */
function LessonBody({ lesson }: { lesson: LessonView }) {
  const e = lesson.entry
  const [more, setMore] = useState(false)
  const moreId = useId()
  if ('attack_protocol' in e) {
    return (
      <>
        {e.attack_protocol.length ? (
          <section className="sa-lesson-part">
            <h3>Så angriper du frågan</h3>
            <ol className="sa-lesson-steps">
              {e.attack_protocol.map((step, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the method's steps keep their order
                <li key={i}>
                  <span className="sa-step-n" aria-hidden>
                    {i + 1}
                  </span>
                  <p>
                    <span className="sa-sr">Steg {i + 1}: </span>
                    <MathText>{step}</MathText>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {e.common_distractors.length ? (
          <section className="sa-lesson-part">
            <h3>Vanliga fällor</h3>
            <dl className="sa-lesson-traps">
              {e.common_distractors.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the catalog's own order
                <div key={i}>
                  <dt>
                    <MathText>{d.pattern}</MathText>
                  </dt>
                  <dd>
                    <MathText>{d.why_it_traps}</MathText>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </>
    )
  }
  if ('pattern_description' in e) {
    const example = e.worked_example
    const extra = Boolean(example || e.counter_example || e.common_distractor_signature)
    return (
      <>
        {e.pattern_description.trim() !== lesson.title.trim() ? (
          <Part label="Mönstret" text={e.pattern_description} />
        ) : null}
        <Part label="Varför det händer" text={e.why_it_occurs} />
        <Part label="Igenkänningstecken" text={e.recognition_cue} />
        <Part label="Motåtgärd" text={e.countermeasure} />
        {extra ? (
          <div className="sa-lesson-more">
            <button
              type="button"
              className="sa-ask-more"
              aria-expanded={more}
              aria-controls={moreId}
              onClick={() => setMore((m) => !m)}
            >
              {more ? 'Färre detaljer' : 'Fler detaljer'}
              {more ? (
                <ChevronUp size={15} strokeWidth={1.75} aria-hidden />
              ) : (
                <ChevronDown size={15} strokeWidth={1.75} aria-hidden />
              )}
            </button>
            <div id={moreId} hidden={!more}>
              {example ? (
                <section className="sa-lesson-part">
                  <h3>Räkneexempel</h3>
                  <dl className="sa-lesson-example">
                    <Beat label="Förutsättning" text={example.setup} />
                    <Beat label="Fällans tanke" text={example.trap_thinking} />
                    <Beat label="Korrekt tanke" text={example.correct_thinking} />
                    <Beat label="Svar" text={example.answer} />
                  </dl>
                </section>
              ) : null}
              <Part label="När fällan inte gäller" text={e.counter_example} />
              <Part label="Så ser felsvaret ut" text={e.common_distractor_signature} />
            </div>
          </div>
        ) : null}
      </>
    )
  }
  if ('tactic' in e) return <Part label="Igenkänningstecken" text={e.when_to_apply} />
  if ('rule' in e) return <Part label="Mönsterregel" text={e.rule} />
  if ('root' in e) {
    return (
      <>
        <Part label="Ursprung" text={e.origin} />
        <Part label="Betydelse" text={e.meaning} />
        {e.example_words.length ? (
          <section className="sa-lesson-part">
            <h3>Exempel</h3>
            <ul className="sa-lesson-words">
              {e.example_words.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </>
    )
  }
  return null
}

function Beat({ label, text }: { label: string; text: string }): ReactNode {
  if (!text.trim()) return null
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <MathText>{text}</MathText>
      </dd>
    </div>
  )
}

/** The eight sections, in the exam's stable order and its two groups, as
 *  reply-shaped doors: each with its family and how much is read. The one
 *  whose entries are listed is pressed; the open lesson's is tagged. */
function SectionDoors({
  sections,
  shown,
  open,
  headRef,
  onChoose,
}: {
  sections: readonly UppslagSectionView[]
  shown: Section | null
  open: Section
  headRef: RefObject<HTMLHeadingElement | null>
  onChoose: (section: Section) => void
}) {
  const id = useId()
  return (
    <section className="sa-card sa-card--doors" aria-labelledby={id}>
      <header className="sa-card-head">
        <h2 id={id} ref={headRef} tabIndex={-1}>
          Alla delprov
        </h2>
        <span>I provets ordning</span>
      </header>
      {sections.length ? (
        GROUPS.map((g) => {
          const group = sections.filter((s) => VERBAL_SECTIONS.includes(s.section) === g.verbal)
          if (!group.length) return null
          return (
            <div className="sa-doorgroup" key={g.label}>
              <h3 className="sa-doorgroup-h" id={`${id}-${g.verbal ? 'v' : 'k'}`}>
                {g.label}
              </h3>
              <ul className="sa-practice" aria-labelledby={`${id}-${g.verbal ? 'v' : 'k'}`}>
                {group.map((s) => {
                  const fam = FAMILY[s.family]
                  return (
                    <li key={s.section}>
                      <button
                        type="button"
                        className="sa-practice-door sa-upp-door"
                        data-testid={`rd-uppslag-section-${slug(s.section)}`}
                        aria-pressed={s.section === shown}
                        onClick={() => onChoose(s.section)}
                      >
                        <span className="sa-practice-top">
                          <span className="sa-sr">{s.name},</span>{' '}
                          <span className="sa-practice-code">{s.section}</span>
                          {s.section === open ? (
                            <>
                              {' '}
                              <span className="sa-plan-tag">Öppen</span>
                            </>
                          ) : null}
                        </span>{' '}
                        <span className="sa-practice-meta">
                          <span>{s.entries.length ? fam.many : 'inget än'}</span>{' '}
                          {s.entries.length ? (
                            <span>
                              {readCount(s.entries)}&nbsp;av&nbsp;{s.entries.length} lästa
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })
      ) : (
        <p className="sa-queue-none">Uppslaget är tomt just nu.</p>
      )}
    </section>
  )
}

/** A section's entries as rows: title, kicker, read and progress, and how
 *  many questions to practise on. A row asks for its lesson; the open one
 *  is marked and goes to it. A long catalog folds after its first rows
 *  (the open entry always shows). */
function Catalog({
  section,
  open,
  asked,
  headRef,
  onAsk,
}: {
  section: UppslagSectionView
  open: string
  asked: string | null
  headRef: RefObject<HTMLHeadingElement | null>
  onAsk: (entry: UppslagEntryView) => void
}) {
  const id = useId()
  const listId = useId()
  const [all, setAll] = useState(false)
  const fam = FAMILY[section.family]
  const n = section.entries.length
  const waiting = asked != null && asked !== open && section.entries.some((e) => e.id === asked)
  return (
    <section className="sa-card sa-card--catalog" aria-labelledby={id}>
      <header className="sa-card-head">
        <h2 id={id} ref={headRef} tabIndex={-1}>
          {section.section} · {section.name}
        </h2>
        {n ? (
          <span>
            {readCount(section.entries)} av {n} {fam.many} lästa
          </span>
        ) : null}
      </header>
      <p className="sa-upp-notice" role="status">
        {waiting ? 'Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats.' : null}
      </p>
      {n ? (
        <ol className="sa-catalog" id={listId}>
          {section.entries.map((e, i) => {
            const here = e.id === open
            const status = e.status ? STATUS[e.status] : null
            return (
              <li key={e.id} hidden={!all && i >= FOLD && !here}>
                <button
                  type="button"
                  className="sa-cat-row"
                  data-testid={`rd-uppslag-entry-${e.id}`}
                  aria-current={here ? 'true' : undefined}
                  onClick={() => onAsk(e)}
                >
                  <span className="sa-cat-n" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="sa-cat-body">
                    <span className="sa-cat-title">
                      <MathText>{e.title}</MathText>
                    </span>
                    {e.summary ? (
                      <span className="sa-cat-sum">
                        <MathText>{e.summary}</MathText>
                      </span>
                    ) : null}
                    <span className="sa-cat-meta">
                      {here ? (
                        <span className="sa-plan-tag">Öppen ovan</span>
                      ) : e.id === asked ? (
                        <span className="sa-plan-tag">Begärd</span>
                      ) : null}
                      <span data-read={String(e.read)}>
                        {e.read ? (
                          <>
                            <Check size={13} strokeWidth={2.4} aria-hidden /> Läst
                          </>
                        ) : (
                          'Inte läst'
                        )}
                      </span>
                      {status ? <span>{status.row}</span> : null}
                      <span>
                        {e.examples
                          ? count(e.examples, 'övningsfråga', 'övningsfrågor')
                          : 'inga övningsfrågor'}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="sa-queue-none">Det finns inget att läsa i {section.section} än.</p>
      )}
      {n > FOLD ? (
        <button
          type="button"
          className="sa-queue-fold"
          aria-expanded={all}
          aria-controls={listId}
          onClick={() => setAll((v) => !v)}
        >
          <span>{all ? 'Visa färre' : `Visa alla ${n} ${fam.many}`}</span>
          {all ? (
            <ChevronUp size={16} strokeWidth={1.75} aria-hidden />
          ) : (
            <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
          )}
        </button>
      ) : null}
    </section>
  )
}
