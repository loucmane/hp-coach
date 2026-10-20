// Svep · Uppslag och lektion — the reference, as cards on a table. Every
// section lies there as a small door card (how many entries it has and how
// many you have read); the open lesson is one tall reading card of the same
// stock as practice, the next entries' edges behind it; the section's
// contents are its register beside it. Choosing another section deals that
// section's card in front ("Öppna KVA"); an entry, an arrow or that card
// asks the host for the lesson. The text on screen is never swapped for
// content the data does not hold: while a lesson asked for is not the one
// open, the card says so and keeps the open text.
//
// The card reads top to bottom in one flow — the entry's method or pattern,
// its common wrong answers, its example — and ends in its two actions: the
// read marker (a reversible "Läst", never set by opening or scrolling) and
// the one filled action, practising this very entry (its label names what
// it practises; with no example questions it is off, and the whole section
// is offered instead, by that name).
//
// Desktop: the page and the doors to the left, the card in the middle with
// "‹ Avsnitt 3 av 8 ›" under it, the register to the right. Phone: one
// column — the doors, the card, its arrows and Innehåll, the register.
//
// Kit v2: everything is data.uppslag; requests go through actions
// (openLesson, toggleLessonRead, startDrill). The table takes the tint of
// the card in front (LÄS slate, ELF sea-grey, ORD sand, else stone). No
// keys are taken here: the arrows and digits stay the bake-off's, and the
// card scrolls as any text does.

import { ArrowRight, ChevronLeft, ChevronRight, ListOrdered } from 'lucide-react'
import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  FrameworkEntry,
  FrameworkFamily,
  FrameworkStatus,
  LessonView,
  UppslagEntryView,
  UppslagSectionView,
  UppslagView,
} from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { ConstraintEntry, LexiconEntry, ProtocolEntry, TacticEntry } from '@/data/frameworks'
import type { Section } from '@/data/questions'
import { SecChip, sectionKey, sectionTint, type Tint } from './parts'
import type { LessonAsk } from './Svep'

/** What an entry is to the reader, by its catalog's family. */
const KIND: Record<FrameworkFamily, string> = {
  nog_traps: 'Fälla',
  kva_traps: 'Fälla',
  xyz_traps: 'Fälla',
  dtk_tactics: 'Taktik',
  mek_protocol: 'Regel',
  las_taxonomy: 'Frågetyp',
  elf_taxonomy: 'Frågetyp',
  ord_roots: 'Ordrot',
}

/** The practice action, as the real lesson reader names it per family. */
const PRACTICE: Record<FrameworkFamily, string> = {
  nog_traps: 'Öva detta mönster',
  kva_traps: 'Öva detta mönster',
  xyz_traps: 'Öva detta mönster',
  dtk_tactics: 'Öva denna taktik',
  mek_protocol: 'Öva denna regel',
  las_taxonomy: 'Öva denna frågetyp',
  elf_taxonomy: 'Öva denna frågetyp',
  ord_roots: 'Öva ord med denna rot',
}

/** Where an entry stands in practice (the progress table's steps). */
const STATUS: Record<FrameworkStatus, string> = {
  untaught: 'Inte övat',
  learning: 'Lär in',
  practicing: 'Övar',
  retaining: 'Repeterar',
  mastered: 'Befäst',
}

const questions = (n: number) => `${n} ${n === 1 ? 'fråga' : 'frågor'}`

export function SvepUppslag({
  width,
  onTint,
  ask,
}: {
  width: WidthKey
  onTint: (t: Tint) => void
  /** A lesson asked for elsewhere (a plan's lesson), or null. */
  ask: LessonAsk | null
}) {
  const { data, actions } = useDirectionData()
  const u = data.uppslag
  const open = u.open
  const phone = width === 'phone'
  // The section whose contents the register shows (null: the open lesson's),
  // and the lesson last asked for.
  const [browse, setBrowse] = useState<Section | null>(null)
  const [requested, setRequested] = useState<string | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const registerRef = useRef<HTMLParagraphElement>(null)

  const pending = requested && requested !== open.id ? requested : null
  const shown = browse ?? open.section
  const shownSection = u.sections.find((s) => s.section === shown)
  const own = u.sections.find((s) => s.section === open.section)
  // Another section is in front until a lesson is asked for from it.
  const hub = !pending && shown !== open.section && shownSection != null

  const sectionOf = (id: string) => u.sections.find((s) => s.entries.some((e) => e.id === id))
  const request = (id: string) => {
    setRequested(id)
    setBrowse(sectionOf(id)?.section ?? null)
    actions.openLesson(id)
  }
  // The heading of the card in front takes the focus when the card under
  // the reader's pointer leaves (the section card for the lesson).
  const requestFromHub = (id: string) => {
    request(id)
    window.requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }))
  }

  // A lesson asked for elsewhere: said on arrival, its section's contents
  // in the register, the focus on the card's heading.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each new ask, once
  useLayoutEffect(() => {
    if (!ask) return
    setRequested(ask.id)
    setBrowse(sectionOf(ask.id)?.section ?? null)
    titleRef.current?.focus({ preventScroll: true })
  }, [ask?.n])

  const tint = sectionTint(hub ? shown : open.section)
  useLayoutEffect(() => onTint(tint), [tint, onTint])

  const pendingEntry = pending ? sectionOf(pending) : undefined
  const pendingView = pendingEntry?.entries.find((e) => e.id === pending)
  const doors = (
    <SectionDoors
      u={u}
      shown={shown}
      onPick={(s) => {
        setBrowse(s === open.section ? null : s)
        setRequested(null)
      }}
    />
  )
  const card = hub ? (
    <SectionCard
      s={shownSection as UppslagSectionView}
      fallback={own ?? null}
      onOpen={requestFromHub}
      onBack={() => setBrowse(null)}
    />
  ) : (
    <LessonCard
      open={open}
      own={own ?? null}
      titleRef={titleRef}
      scrolls={!phone}
      pending={
        pending
          ? {
              section: pendingEntry?.section ?? null,
              title: pendingView?.title ?? pending,
            }
          : null
      }
      onRead={() => actions.toggleLessonRead(open.id)}
      onPractice={() =>
        actions.startDrill({ kind: 'framework', frameworkId: open.id, section: open.section })
      }
      onSection={() => actions.startDrill({ kind: 'section', section: open.section })}
    />
  )
  const steps = hub ? null : (
    <EntrySteps
      own={own ?? null}
      open={open}
      onRequest={request}
      onContents={
        phone
          ? () => {
              registerRef.current?.focus({ preventScroll: true })
              registerRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
            }
          : undefined
      }
    />
  )
  const register = shownSection ? (
    <Contents
      s={shownSection}
      openId={open.id}
      pending={pending}
      onRequest={request}
      headRef={registerRef}
    />
  ) : null

  if (phone) {
    return (
      <div className="sv-ptri sv-pup">
        <header className="sv-ptri-head">
          <h1 className="sv-greet">Uppslag</h1>
          <p className="sv-day">Ett avsnitt i taget. Läst markerar du själv.</p>
        </header>
        {doors}
        <div className="sv-up-slot">{card}</div>
        {steps}
        {register}
      </div>
    )
  }

  return (
    <div className="sv-tri sv-up">
      <aside className="sv-tri-side" aria-label="Uppslag">
        <h1 className="sv-greet">Uppslag</h1>
        <p className="sv-day">Ett avsnitt i taget. Läst markerar du själv.</p>
        {doors}
      </aside>
      <div className="sv-up-center">
        <div className="sv-up-slot">{card}</div>
        {steps}
      </div>
      <div className="sv-tri-end">{register}</div>
    </div>
  )
}

// ── The sections ─────────────────────────────────────────────────────

/** Every section as a small door card: its entries and how many are read.
 *  The weakest section carries a tab — only with scores to compare. */
function SectionDoors({
  u,
  shown,
  onPick,
}: {
  u: UppslagView
  shown: Section
  onPick: (s: Section) => void
}) {
  const headId = useId()
  const scored = u.sections.filter((s) => s.score != null)
  const weakest =
    scored.length > 1
      ? scored.reduce((a, b) => ((b.score ?? 0) < (a.score ?? 0) ? b : a)).section
      : null
  return (
    <section className="sv-sdoors sv-up-doors" aria-labelledby={headId}>
      <h2 className="sv-index-head" id={headId}>
        Delprov <span>· {u.sections.length} ramverk</span>
      </h2>
      <ul className="sv-sdoors-grid">
        {u.sections.map((s) => {
          const read = s.entries.filter((e) => e.read).length
          return (
            <li key={s.section}>
              <button
                type="button"
                className="sv-sdoor sv-up-door"
                data-testid={`rd-uppslag-section-${sectionKey(s.section)}`}
                data-sec={sectionTint(s.section)}
                data-weakest={s.section === weakest ? 'true' : undefined}
                aria-pressed={s.section === shown}
                onClick={() => onPick(s.section)}
              >
                <span className="sv-sdoor-code">{s.section}</span>
                <span className="sv-sr">, {s.name}</span>
                {s.entries.length ? (
                  <>
                    <span className="sv-up-door-n">
                      <span className="sv-sr">, </span>
                      {s.entries.length}
                      <span className="sv-up-door-unit"> avsnitt</span>
                    </span>
                    <span className="sv-sdoor-wait">
                      <span className="sv-sr">, </span>
                      {read ? `${read} lästa` : 'Inget läst'}
                    </span>
                  </>
                ) : (
                  <span className="sv-sdoor-wait">
                    <span className="sv-sr">, </span>
                    Innehåll saknas ännu
                  </span>
                )}
                {s.section === weakest ? (
                  <span className="sv-sdoor-tab">
                    <span className="sv-sr">, </span>
                    Svagast
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Another section in front: what it holds, how much is read, and the way
 *  in — its first unread entry. A section without content says so and
 *  points back to one that has it. */
function SectionCard({
  s,
  fallback,
  onOpen,
  onBack,
}: {
  s: UppslagSectionView
  /** The open lesson's section, the way back from an empty one. */
  fallback: UppslagSectionView | null
  onOpen: (id: string) => void
  onBack: () => void
}) {
  const titleId = useId()
  const read = s.entries.filter((e) => e.read).length
  const next = s.entries.find((e) => !e.read) ?? s.entries[0]
  return (
    <>
      <Edges n={Math.min(2, Math.max(0, s.entries.length - 1))} />
      <article className="sv-card sv-up-card sv-up-hub" aria-labelledby={titleId}>
        <div className="sv-up-body">
          <div className="sv-up-head">
            <SecChip section={s.section} />
            <span className="sv-up-kind">{s.name}</span>
          </div>
          <h2 className="sv-up-title" id={titleId} tabIndex={-1}>
            {s.section} · {s.entries.length ? `${s.entries.length} avsnitt` : 'tomt än'}
          </h2>
          {s.entries.length ? (
            <>
              <p className="sv-up-lead">
                {read === s.entries.length
                  ? 'Allt är läst – slå upp vad du vill igen.'
                  : `${read} av ${s.entries.length} lästa.`}
              </p>
              {next ? (
                <p className="sv-up-next">
                  <span className="sv-up-next-label">
                    {next.read ? 'Först i registret' : 'Nästa olästa'}
                  </span>
                  <span className="sv-up-next-title">
                    <MathText>{next.title}</MathText>
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <p className="sv-up-lead">Innehåll saknas ännu.</p>
          )}
        </div>
        <div className="sv-up-foot">
          {next ? (
            <button
              type="button"
              className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
              onClick={() => onOpen(next.id)}
            >
              Öppna {s.section}
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          ) : fallback ? (
            <button
              type="button"
              className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
              onClick={onBack}
            >
              Till {fallback.section}
            </button>
          ) : null}
        </div>
      </article>
    </>
  )
}

/** The edges of the cards behind the one in front. */
function Edges({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the waiting entries' edges
        <span key={i} className="sv-qedge sv-up-edge" data-n={i + 1} aria-hidden />
      ))}
    </>
  )
}

// ── The open lesson ──────────────────────────────────────────────────

function LessonCard({
  open,
  own,
  titleRef,
  pending,
  scrolls,
  onRead,
  onPractice,
  onSection,
}: {
  open: LessonView
  own: UppslagSectionView | null
  titleRef: { current: HTMLHeadingElement | null }
  /** A lesson asked for that is not this one: its section and name. */
  pending: { section: Section | null; title: string } | null
  /** The card is a scrolling region of its own (desktop); on a phone the
   *  page scrolls and the card is as tall as its text. */
  scrolls: boolean
  onRead: () => void
  onPractice: () => void
  onSection: () => void
}) {
  const titleId = useId()
  const at = own ? own.entries.findIndex((e) => e.id === open.id) : -1
  const after = own && at >= 0 ? own.entries.length - at - 1 : 0
  const examples = open.practice.questions
  const meta = [KIND[open.family], open.status ? STATUS[open.status] : null]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <Edges n={Math.min(2, after)} />
      <article
        className="sv-card sv-up-card"
        id={`sv-entry-${open.id}`}
        data-family={open.family}
        aria-labelledby={titleId}
      >
        {/* On desktop the card's text scrolls on its own, so the keyboard
         *  reaches it; its arrows scroll it up and down, ← and → stay the
         *  bake-off's (no key scope: it only scrolls vertically). */}
        <section
          className="sv-up-body sv-up-scroll"
          aria-labelledby={titleId}
          tabIndex={scrolls ? 0 : undefined}
        >
          <div className="sv-up-head">
            <SecChip section={open.section} />
            <span className="sv-up-kind">{meta}</span>
            {own && at >= 0 ? (
              <span className="sv-up-pos">
                Avsnitt {at + 1} av {own.entries.length}
              </span>
            ) : null}
          </div>
          {pending ? (
            <p className="sv-note sv-up-pending" role="status">
              <b>Lektion begärd.</b> Den öppna texten ligger kvar tills den nya har laddats.
              <span className="sv-up-pending-what">
                Begärd: {pending.section ? `${pending.section} · ` : ''}
                <MathText>{pending.title}</MathText>
              </span>
            </p>
          ) : null}
          <h2
            className="sv-up-title"
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            data-testid="rd-lesson"
          >
            <MathText>{open.title}</MathText>
          </h2>
          <LessonBody entry={open.entry} />
        </section>
        <div className="sv-up-foot sv-up-foot--lesson">
          <button
            type="button"
            className="sv-btn sv-btn--quiet sv-up-read"
            data-testid="rd-lesson-read"
            aria-pressed={open.read}
            onClick={onRead}
          >
            {open.read ? 'Läst ✓' : 'Markera som läst'}
          </button>
          {examples > 0 ? (
            <button
              type="button"
              className="sv-btn sv-btn--primary sv-btn--lg sv-up-practice"
              data-testid="rd-lesson-practice"
              onClick={onPractice}
            >
              {PRACTICE[open.family]}
              <span className="sv-up-practice-n">{questions(examples)}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="sv-btn sv-btn--primary sv-btn--lg sv-up-practice"
                data-testid="rd-lesson-practice"
                disabled
              >
                Inga exempelfrågor än
              </button>
              <button type="button" className="sv-btn sv-btn--tonal" onClick={onSection}>
                Öva hela {open.section} i stället
              </button>
            </>
          )}
        </div>
      </article>
    </>
  )
}

/** "‹ Avsnitt 3 av 8 ›": the neighbours in the open lesson's section, by
 *  name; a press asks for that lesson. On a phone, Innehåll leads to the
 *  register under the card. */
function EntrySteps({
  own,
  open,
  onRequest,
  onContents,
}: {
  own: UppslagSectionView | null
  open: LessonView
  onRequest: (id: string) => void
  onContents?: () => void
}) {
  const at = own ? own.entries.findIndex((e) => e.id === open.id) : -1
  if (!own || at < 0) return null
  const prev: UppslagEntryView | undefined = own.entries[at - 1]
  const next: UppslagEntryView | undefined = own.entries[at + 1]
  return (
    <div className="sv-counter sv-up-steps">
      <button
        type="button"
        className="sv-arrow"
        aria-label={prev ? `Föregående avsnitt: ${prev.title}` : 'Inget föregående avsnitt'}
        aria-disabled={!prev}
        onClick={prev ? () => onRequest(prev.id) : undefined}
      >
        <ChevronLeft size={20} strokeWidth={2} aria-hidden />
      </button>
      <p className="sv-count">
        <span className="sv-count-n">
          Avsnitt <b>{at + 1}</b> av {own.entries.length}
        </span>
      </p>
      <button
        type="button"
        className="sv-arrow"
        aria-label={next ? `Nästa avsnitt: ${next.title}` : 'Inget nästa avsnitt'}
        aria-disabled={!next}
        onClick={next ? () => onRequest(next.id) : undefined}
      >
        <ChevronRight size={20} strokeWidth={2} aria-hidden />
      </button>
      {onContents ? (
        <button type="button" className="sv-chip sv-up-contents" onClick={onContents}>
          <ListOrdered size={16} strokeWidth={2} aria-hidden />
          Innehåll
        </button>
      ) : null}
    </div>
  )
}

/** The section's contents: every entry by its number and name, what you
 *  have read, the one open and the one asked for. A press asks for it. */
function Contents({
  s,
  openId,
  pending,
  onRequest,
  headRef,
}: {
  s: UppslagSectionView
  openId: string
  pending: string | null
  onRequest: (id: string) => void
  headRef: { current: HTMLParagraphElement | null }
}) {
  const read = s.entries.filter((e) => e.read).length
  return (
    <nav className="sv-index sv-tri-register sv-up-register" aria-label={`Innehåll, ${s.section}`}>
      <p className="sv-index-head" ref={headRef} tabIndex={-1}>
        Innehåll <span>· {s.section}</span>
      </p>
      <p className="sv-index-group">
        {s.entries.length ? `${s.entries.length} avsnitt · ${read} lästa` : 'Innehåll saknas ännu'}
      </p>
      <ol>
        {s.entries.map((e, i) => {
          const state =
            e.id === pending ? 'Begärd' : e.id === openId ? 'Öppen' : e.read ? 'Läst' : ''
          return (
            <li key={e.id}>
              <button
                type="button"
                className="sv-index-row sv-up-row"
                data-testid={`rd-uppslag-entry-${e.id}`}
                aria-current={e.id === openId ? 'true' : undefined}
                data-read={e.read ? 'true' : undefined}
                onClick={() => onRequest(e.id)}
              >
                <span className="sv-index-n" aria-hidden>
                  {i + 1}
                </span>
                <span className="sv-up-row-name">
                  <MathText>{e.title}</MathText>
                  {e.status && e.status !== 'untaught' ? (
                    <span className="sv-sr">, {STATUS[e.status]}</span>
                  ) : null}
                </span>
                <span className="sv-index-meta">
                  {state ? (
                    <>
                      <span className="sv-sr">, </span>
                      {state}
                    </>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ── The entry's content, by family ───────────────────────────────────

function isProtocol(e: FrameworkEntry): e is ProtocolEntry {
  return 'attack_protocol' in e
}
function isTactic(e: FrameworkEntry): e is TacticEntry {
  return 'tactic' in e
}
function isConstraint(e: FrameworkEntry): e is ConstraintEntry {
  return 'constraint_type' in e
}
function isLexicon(e: FrameworkEntry): e is LexiconEntry {
  return 'root' in e
}

/** One part of the card: a heading and its text, in the reading face. */
function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sv-up-part">
      <h3 className="sv-up-part-title">{title}</h3>
      {children}
    </section>
  )
}

function Prose({ text }: { text: string }) {
  return (
    <p className="sv-up-prose">
      <MathText>{text}</MathText>
    </p>
  )
}

/** The entry verbatim, in the order its family reads: a method and its
 *  wrong answers, a pattern and how to meet it, a rule, a root. Optional
 *  fields are left out, never shown empty. */
function LessonBody({ entry }: { entry: FrameworkEntry }) {
  const notes = entry.notes ? (
    <Part title="Att tänka på">
      <Prose text={entry.notes} />
    </Part>
  ) : null
  if (isProtocol(entry)) {
    return (
      <>
        <Part title="Så angriper du frågan">
          <ol className="sv-up-method">
            {entry.attack_protocol.map((step, i) => (
              <li key={step}>
                <span className="sv-up-method-n" aria-hidden>
                  {i + 1}
                </span>
                <span className="sv-up-prose">
                  <MathText>{step}</MathText>
                </span>
              </li>
            ))}
          </ol>
        </Part>
        {entry.common_distractors.length ? (
          <Part title="Vanliga felsvar">
            <ul className="sv-up-lures">
              {entry.common_distractors.map((d) => (
                <li key={d.pattern}>
                  <p className="sv-up-lure">
                    <MathText>{d.pattern}</MathText>
                  </p>
                  <p className="sv-up-prose">
                    <MathText>{d.why_it_traps}</MathText>
                  </p>
                </li>
              ))}
            </ul>
          </Part>
        ) : null}
        {notes}
      </>
    )
  }
  if (isTactic(entry)) {
    return (
      <>
        <Part title="När den passar">
          <Prose text={entry.when_to_apply} />
        </Part>
        {notes}
      </>
    )
  }
  if (isConstraint(entry)) {
    return (
      <>
        <Part title="Regeln">
          <Prose text={entry.rule} />
        </Part>
        {notes}
      </>
    )
  }
  if (isLexicon(entry)) {
    return (
      <>
        <Part title="Betydelse">
          <Prose text={entry.meaning} />
        </Part>
        <Part title="Ursprung">
          <Prose text={entry.origin} />
        </Part>
        {entry.example_words.length ? (
          <Part title="Exempelord">
            <ul className="sv-up-words">
              {entry.example_words.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Part>
        ) : null}
        {notes}
      </>
    )
  }
  // A trap (XYZ, KVA, NOG): the pattern is the card's title.
  const ex = entry.worked_example
  return (
    <>
      {entry.tldr ? (
        <p className="sv-up-lead">
          <MathText>{entry.tldr}</MathText>
        </p>
      ) : null}
      <Part title="Varför det händer">
        <Prose text={entry.why_it_occurs} />
      </Part>
      {entry.recognition_cue ? (
        <Part title="Känn igen den">
          <Prose text={entry.recognition_cue} />
        </Part>
      ) : null}
      <Part title="Så ser felsvaret ut">
        <Prose text={entry.common_distractor_signature} />
      </Part>
      <Part title="Motdraget">
        <Prose text={entry.countermeasure} />
      </Part>
      {ex ? (
        <Part title="Exempel">
          <dl className="sv-up-example">
            <dt>Uppgiften</dt>
            <dd>
              <MathText>{ex.setup}</MathText>
            </dd>
            <dt>Fällan</dt>
            <dd>
              <MathText>{ex.trap_thinking}</MathText>
            </dd>
            <dt>Rätt tänkt</dt>
            <dd>
              <MathText>{ex.correct_thinking}</MathText>
            </dd>
            <dt>Svar</dt>
            <dd>
              <MathText>{ex.answer}</MathText>
            </dd>
          </dl>
        </Part>
      ) : null}
      {entry.counter_example ? (
        <Part title="När det inte är en fälla">
          <Prose text={entry.counter_example} />
        </Part>
      ) : null}
      {notes}
    </>
  )
}
