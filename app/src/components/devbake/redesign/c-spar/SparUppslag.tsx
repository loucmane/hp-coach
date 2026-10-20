// Spår's catalogue is a contents path, with one provider-owned entry open.
// A request never substitutes an index summary for the missing lesson body.
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Flag, Search } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { LessonView, UppslagSectionView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { Section } from '@/data/questions'
import { Kbd, KVANT, SECTION_NAMES, SparModal, SparPageHead, SparStop, VERBAL } from './sparParts'

const slug = (section: string) => section.toLowerCase().replace('ä', 'a')
const kind = (s: Section) =>
  s === 'ORD'
    ? 'Rot'
    : s === 'MEK'
      ? 'Regel'
      : s === 'DTK'
        ? 'Taktik'
        : s === 'LÄS' || s === 'ELF'
          ? 'Frågetyp'
          : 'Fälla'
const plural = (s: Section) =>
  s === 'ORD'
    ? 'rötter'
    : s === 'MEK'
      ? 'regler'
      : s === 'DTK'
        ? 'taktiker'
        : s === 'LÄS' || s === 'ELF'
          ? 'frågetyper'
          : 'fällor'
const practiceLabel = (s: Section) =>
  s === 'ORD'
    ? 'Öva ord med denna rot'
    : s === 'MEK'
      ? 'Öva denna regel'
      : s === 'DTK'
        ? 'Öva denna taktik'
        : s === 'LÄS' || s === 'ELF'
          ? 'Öva denna frågetyp'
          : 'Öva detta mönster'
const statusNames = {
  untaught: 'Inte övat än',
  learning: 'Påbörjat',
  practicing: 'Övas',
  retaining: 'Repeteras',
  mastered: 'Befäst',
}

export function SparUppslag({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const { sections, open } = data.uppslag
  const phone = width === 'phone'
  const [library, setLibrary] = useState(false)
  const [chosen, setChosen] = useState(open.section)
  const [query, setQuery] = useState('')
  const [contents, setContents] = useState(false)
  const [requested, setRequested] = useState<string | null>(null)
  const [error, setError] = useState('')
  const entryHead = useRef<HTMLHeadingElement>(null)
  const requestFocus = useRef(false)
  const active =
    sections.find((s) => s.section === chosen) ??
    sections.find((s) => s.section === open.section) ??
    sections[0]
  const own = sections.find((s) => s.section === open.section)
  // The contents describe the displayed body until the provider replaces it.
  const contentsSection = own ?? active
  const index = own?.entries.findIndex((e) => e.id === open.id) ?? -1
  const next = index >= 0 ? own?.entries[index + 1] : undefined
  const previous = index > 0 ? own?.entries[index - 1] : undefined
  const lessonPlan = data.home.plan.items.find((i) => i.kind === 'lesson' && !i.completed)
  const needle = query.trim().toLocaleLowerCase('sv-SE')
  const results = needle
    ? sections.flatMap((s) =>
        s.entries
          .map((e, i) => ({ ...e, section: s.section, n: i + 1 }))
          .filter((e) =>
            `${e.title} ${e.summary ?? ''} ${e.section}`
              .toLocaleLowerCase('sv-SE')
              .includes(needle),
          ),
      )
    : []

  // biome-ignore lint/correctness/useExhaustiveDependencies: new entry identity settles the outstanding request
  useEffect(() => {
    setChosen(open.section)
    setRequested(null)
    if (requestFocus.current) entryHead.current?.focus({ preventScroll: true })
    requestFocus.current = false
  }, [open.id, open.section])

  const request = (id: string) => {
    setError('')
    setLibrary(false)
    if (id === open.id) {
      setRequested(null)
      entryHead.current?.focus({ preventScroll: true })
      return
    }
    try {
      requestFocus.current = true
      actions.openLesson(id)
      setRequested(id)
    } catch {
      requestFocus.current = false
      setError('Lektionen gick inte att öppna. Försök igen.')
    }
  }
  const toggleRead = () => {
    try {
      actions.toggleLessonRead(open.id)
      setError('')
      return true
    } catch {
      setError('Läsmarkeringen gick inte att ändra. Försök igen.')
      return false
    }
  }
  const advance = () => {
    if (requested && requested !== open.id) return
    if (next && !own?.entries.every((e) => e.read)) {
      if (!open.read && !toggleRead()) return
      request(next.id)
    } else {
      actions.startDrill({ kind: 'section', section: open.section })
    }
  }
  useKeyMap(library ? {} : { Enter: advance }, live && !contents && !query)

  const catalog = (compact: boolean) => (
    <div className={compact ? 'sp-catalog sp-catalog--compact' : 'sp-catalog'}>
      {[VERBAL, KVANT].map((half, h) => (
        <section
          key={h === 0 ? 'verbal' : 'kvant'}
          aria-label={h === 0 ? 'Verbal del' : 'Kvantitativ del'}
        >
          {!compact ? (
            <h2 className="sp-h3">{h === 0 ? 'Verbal del' : 'Kvantitativ del'}</h2>
          ) : null}
          <div className="sp-catalog-tiles">
            {half.map((code) => {
              const s = sections.find((x) => x.section === code)
              if (!s) return null
              const read = s.entries.filter((e) => e.read).length
              return (
                <button
                  type="button"
                  key={code}
                  className="sp-catalog-tile"
                  data-sec={code}
                  data-testid={`rd-uppslag-section-${slug(code)}`}
                  aria-pressed={!library && active?.section === code}
                  onClick={() => {
                    setChosen(code)
                    setLibrary(false)
                    const entry = s.entries.find((e) => !e.read) ?? s.entries[0]
                    if (entry) request(entry.id)
                  }}
                >
                  <span
                    className="sp-catalog-ring"
                    aria-hidden
                    style={
                      {
                        '--read-share': `${s.entries.length ? (read / s.entries.length) * 100 : 0}%`,
                      } as React.CSSProperties
                    }
                  >
                    {code}
                  </span>
                  <span>
                    <b>{compact ? code : s.name}</b>
                    <span>
                      {read} av {s.entries.length} lästa{!compact ? ` · ${plural(code)}` : ''}
                    </span>
                    {!compact && code === data.ova.weakest ? <small>Svagast just nu</small> : null}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
  const path = (close?: () => void) =>
    contentsSection ? (
      <Contents
        section={contentsSection}
        current={open.id}
        onOpen={(id) => {
          close?.()
          request(id)
        }}
      />
    ) : (
      <p>Inget innehåll här ännu.</p>
    )

  return (
    <div className="sp-uppslag sp-page" data-phone={String(phone)}>
      <SparPageHead
        phone={phone}
        eyebrow={library ? 'Uppslag' : `Uppslag · ${open.section}`}
        title={library ? 'Mönster att känna igen' : SECTION_NAMES[open.section]}
        lede={
          library
            ? 'Läs ett mönster, öva det direkt.'
            : `${own?.entries.length ?? 0} ${plural(open.section)} · ${own?.entries.filter((e) => e.read).length ?? 0} lästa`
        }
        back={
          !library ? (
            <button type="button" className="sp-link" onClick={() => setLibrary(true)}>
              <ArrowLeft size={18} aria-hidden /> Uppslag
            </button>
          ) : undefined
        }
        tools={
          <label className="sp-search">
            <Search size={19} aria-hidden />
            <span className="sp-sr">Sök i Uppslag</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök bland mönstren"
            />
          </label>
        }
      />
      {needle ? (
        <section className="sp-search-results" aria-label="Sökresultat">
          <p role="status">
            {results.length} {results.length === 1 ? 'träff' : 'träffar'}
          </p>
          {results.map((e) => (
            <button
              type="button"
              className="sp-search-hit"
              key={e.id}
              onClick={() => {
                setChosen(e.section)
                setQuery('')
                request(e.id)
              }}
            >
              <span className="sp-sec-chip" data-sec={e.section}>
                {e.section}
              </span>
              <span>
                <small>
                  {kind(e.section)} {e.n}
                </small>
                <b>{e.title}</b>
              </span>
              <ChevronRight size={18} aria-hidden />
            </button>
          ))}
        </section>
      ) : null}
      {library ? (
        <>
          <article className="sp-now sp-bookmark" data-sec={open.section}>
            <div className="sp-now-band">
              <BookOpen size={20} aria-hidden />
              <span className="sp-sec-chip">{open.section}</span>Öppen lektion
            </div>
            <div className="sp-now-body">
              <h2 className="sp-now-title">{open.title}</h2>
              <p>
                {index >= 0
                  ? `${kind(open.section)} ${index + 1} av ${own?.entries.length}`
                  : kind(open.section)}
              </p>
              <button
                type="button"
                className="sp-btn sp-btn--primary sp-btn--lg"
                onClick={() => request(open.id)}
              >
                Fortsätt läsa <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          </article>
          {lessonPlan ? (
            <button
              type="button"
              className="sp-lesson-plan sp-link"
              onClick={() => actions.openPlanItem(lessonPlan.id)}
            >
              Dagens lektion: {lessonPlan.title} · {lessonPlan.rationale}
            </button>
          ) : null}
          {catalog(false)}
          <div className="sp-library-foot">
            <span>Hellre öva direkt?</span>
            <button
              type="button"
              className="sp-link"
              onClick={() => actions.startDrill({ kind: 'mixed' })}
            >
              Blandad övning
            </button>
            <button type="button" className="sp-link" onClick={actions.openRepetera}>
              Repetera · {data.repetera.pile} missar
            </button>
          </div>
        </>
      ) : (
        <>
          {catalog(true)}
          {requested && requested !== open.id ? (
            <p className="sp-request-notice" role="status">
              Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats.
            </p>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          <div className="sp-lesson-layout">
            <aside className="sp-contents-panel">
              {phone ? (
                <button type="button" className="sp-link" onClick={() => setContents(true)}>
                  Innehåll · {contentsSection?.section}
                </button>
              ) : (
                path()
              )}
            </aside>
            <article
              className="sp-entry"
              data-testid="rd-lesson"
              data-sec={open.section}
              aria-labelledby="sp-entry-title"
            >
              <header className="sp-entry-head">
                <p className="sp-eyebrow">
                  {open.section} · {kind(open.section)}
                  {index >= 0 ? ` ${index + 1} av ${own?.entries.length}` : ''}
                </p>
                <h2 id="sp-entry-title" ref={entryHead} tabIndex={-1}>
                  {open.title}
                </h2>
                <div className="sp-entry-state">
                  <button
                    type="button"
                    className="sp-link"
                    data-testid="rd-lesson-read"
                    aria-pressed={open.read}
                    onClick={toggleRead}
                  >
                    {open.read ? (
                      <>
                        <Check size={17} aria-hidden /> Läst · Ångra
                      </>
                    ) : (
                      'Markera som läst'
                    )}
                  </button>
                  {open.status ? <span>{statusNames[open.status]}</span> : null}
                </div>
              </header>
              <LessonBody lesson={open} />
              <footer className="sp-entry-foot">
                <div>
                  <button
                    type="button"
                    className="sp-link"
                    data-testid="rd-lesson-practice"
                    disabled={open.practice.questions === 0}
                    onClick={() =>
                      actions.startDrill({
                        kind: 'framework',
                        frameworkId: open.id,
                        section: open.section,
                      })
                    }
                  >
                    {practiceLabel(open.section)} · {open.practice.questions} frågor
                  </button>
                  {open.practice.questions === 0 ? <p>Inga exempel att öva på ännu.</p> : null}
                </div>
                <div className="sp-entry-next">
                  {previous ? (
                    <button
                      type="button"
                      className="sp-btn sp-btn--quiet"
                      onClick={() => request(previous.id)}
                    >
                      Föregående
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="sp-btn sp-btn--primary"
                    disabled={!!requested && requested !== open.id}
                    onClick={advance}
                  >
                    {next && !own?.entries.every((e) => e.read)
                      ? 'Nästa'
                      : `Öva hela ${open.section}`}{' '}
                    <Kbd>↵</Kbd>
                  </button>
                </div>
              </footer>
            </article>
          </div>
        </>
      )}
      {phone ? (
        <SparModal title="Innehåll" phone open={contents} onClose={() => setContents(false)}>
          {(close) => path(close)}
        </SparModal>
      ) : null}
    </div>
  )
}

function Contents({
  section,
  current,
  onOpen,
}: {
  section: UppslagSectionView
  current: string
  onOpen: (id: string) => void
}) {
  const allRead = section.entries.length > 0 && section.entries.every((e) => e.read)
  return (
    <nav className="sp-contents" aria-label="Innehåll">
      <h2 className="sp-h3">Innehåll · {section.section}</h2>
      {section.entries.length === 0 ? (
        <p>Inget innehåll här ännu.</p>
      ) : (
        <ol>
          {section.entries.map((e, i) => (
            <li key={e.id}>
              <button
                type="button"
                data-testid={`rd-uppslag-entry-${e.id}`}
                aria-current={e.id === current ? 'step' : undefined}
                onClick={() => onOpen(e.id)}
              >
                <SparStop
                  state={e.id === current ? 'now' : e.read ? 'right' : 'todo'}
                  label={i + 1}
                  size={32}
                />
                <span>
                  {e.title}
                  <span className="sp-sr">{e.read ? ', läst' : ', inte läst'}</span>
                </span>
              </button>
            </li>
          ))}
          <li className="sp-contents-goal">
            <Flag size={20} aria-hidden />
            {allRead ? `Allt i ${section.section} är läst.` : 'Allt läst'}
          </li>
        </ol>
      )}
    </nav>
  )
}

function LessonBody({ lesson }: { lesson: LessonView }) {
  const e = lesson.entry
  // Protocols mix Swedish prose and English examples without language
  // annotations. Keep the text intact; do not guess that all quotes are English.
  const text = (value: string) => <MathText>{value}</MathText>
  const block = (title: string, body: ReactNode) => (
    <section className="sp-lesson-block">
      <h3 className="sp-h3">{title}</h3>
      {body}
    </section>
  )
  if ('pattern_description' in e)
    return (
      <div className="sp-entry-body">
        {block(
          'Mönstret',
          <>
            <p>{text(e.pattern_description)}</p>
            <p>{text(e.why_it_occurs)}</p>
          </>,
        )}
        {e.recognition_cue
          ? block(
              'Igenkänningstecken',
              <p className="sp-lesson-callout">{text(e.recognition_cue)}</p>,
            )
          : null}
        {block('Motåtgärd', <p className="sp-lesson-callout">{text(e.countermeasure)}</p>)}
        {e.worked_example
          ? block(
              'Räkneexempel',
              <ol className="sp-worked">
                {(['setup', 'trap_thinking', 'correct_thinking', 'answer'] as const).map(
                  (key, i) => (
                    <li key={key}>
                      <SparStop
                        state={i === 1 ? 'miss' : i === 2 ? 'right' : i === 3 ? 'goal' : 'todo'}
                        label={i + 1}
                        size={32}
                      />
                      <div>
                        <h4>{['Förutsättning', 'Fällans tanke', 'Korrekt tanke', 'Svar'][i]}</h4>
                        <p>{text(e.worked_example?.[key] ?? '')}</p>
                      </div>
                    </li>
                  ),
                )}
              </ol>,
            )
          : null}
        {e.counter_example
          ? block('När fällan inte gäller', <p>{text(e.counter_example)}</p>)
          : null}
        {block('Typiskt felsvar', <p>{text(e.common_distractor_signature)}</p>)}
      </div>
    )
  if ('attack_protocol' in e)
    return (
      <div className="sp-entry-body">
        {block(
          'Angreppsprotokoll',
          <ol className="sp-worked">
            {e.attack_protocol.map((step, i) => (
              <li key={step}>
                <SparStop state="todo" label={i + 1} size={32} />
                <p>{text(step)}</p>
              </li>
            ))}
          </ol>,
        )}
        {block(
          'Vanliga fällor',
          <div className="sp-lesson-traps">
            {e.common_distractors.map((trap) => (
              <section className="sp-lesson-trap" key={trap.pattern}>
                <h4>{text(trap.pattern)}</h4>
                <p>{text(trap.why_it_traps)}</p>
              </section>
            ))}
          </div>,
        )}
      </div>
    )
  if ('root' in e) {
    const origins: Record<string, string> = {
      GERMANIC: 'germanskt',
      LATIN: 'latinskt',
      GREEK: 'grekiskt',
      FRENCH: 'franskt',
    }
    return (
      <div className="sp-entry-body">
        <p className="sp-eyebrow">{origins[e.origin.toUpperCase()] ?? e.origin}</p>
        <p className="sp-root-word">{e.root}</p>
        <p>
          <em>{text(e.meaning)}</em>
        </p>
        {block(
          'Exempelord',
          <ul className="sp-root-examples">
            {e.example_words.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>,
        )}
      </div>
    )
  }
  if ('rule' in e)
    return <div className="sp-entry-body">{block('Mönsterregel', <p>{text(e.rule)}</p>)}</div>
  return (
    <div className="sp-entry-body">
      {block('Taktik', <p>{text(e.tactic)}</p>)}
      {block('Igenkänningstecken', <p className="sp-lesson-callout">{text(e.when_to_apply)}</p>)}
    </div>
  )
}
