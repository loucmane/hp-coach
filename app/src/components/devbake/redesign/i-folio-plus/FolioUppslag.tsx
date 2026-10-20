// Folio · Uppslag & lektion (screen 12) — the pattern library as a book's
// spread, which is what "uppslag" means.
//
// Desktop: the frame folds its contents to the thumb index to make room for
// two facing pages. The verso is the book's contents page: the chapter
// opener (its number, the section's name and what its entries are), the
// chapter's numbered contents with leader dots to "läst" or the open
// entry's reading time and the ribbon at the open entry, then the book's
// eight chapters in their two parts with how much of each is read. The
// recto is the open entry as a reference page under its own running head:
// the article set by its kind — a question type's attack protocol and
// common traps, a trap with its countermeasure as the one ruled note, a
// tactic, a rule, or a word root at the spread's largest size — then the
// one filled button (read, and on to the next unread entry) and the quiet
// way to practise it.
// Phone: one page. The entry comes first, where the ribbon left the
// reader; the contents and the chapters follow it as the book's back
// matter, a jump away from the head.
//
// Kit v2: data.uppslag holds every catalog's index and one open lesson.
// Another entry is the host's to open (actions.openLesson): until it
// arrives the open one stays, and a notice says so plainly. Marking read is
// actions.toggleLessonRead; the chapter's colophon opens only once the data
// says that every entry of the chapter is read.
//
// From a facit: a lesson a drill's feedback looked up comes with `back`,
// the way to the question it came from — "Tillbaka till frågan" at the top
// left (where Avsluta stands in a drill), and Esc.

import { ArrowDown, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react'

import './fpDrill.css'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  FrameworkEntry,
  FrameworkFamily,
  LessonView,
  UppslagEntryView,
  UppslagSectionView,
} from '@/components/devbake/redesign/viewModel'
import { flattenMathText, MathText } from '@/components/MathText'
import type {
  ConstraintEntry,
  LexiconEntry,
  ProtocolEntry,
  TacticEntry,
  TrapEntry,
} from '@/data/frameworks'
import type { Section } from '@/data/questions'
import { formatSitting } from '@/lib/examNames'
import { Colophon, Spread } from './FolioDrill'
import { capitalised, inWords, Masthead, PartHead, slug } from './FolioHome'

/** What an entry of each catalog is called, and its practice link. */
type Kind = { one: string; many: string; practice: string }

const TYPE: Kind = { one: 'frågetyp', many: 'frågetyper', practice: 'Öva denna frågetyp' }
const TRAP: Kind = { one: 'fälla', many: 'fällor', practice: 'Öva detta mönster' }

const KINDS: Record<FrameworkFamily, Kind> = {
  las_taxonomy: TYPE,
  elf_taxonomy: TYPE,
  mek_protocol: { one: 'regel', many: 'regler', practice: 'Öva denna regel' },
  dtk_tactics: { one: 'taktik', many: 'taktiker', practice: 'Öva denna taktik' },
  xyz_traps: TRAP,
  kva_traps: TRAP,
  nog_traps: TRAP,
  ord_roots: { one: 'rot', many: 'ordrötter', practice: 'Öva ord med denna rot' },
}

/** What a chapter holds, after its count (proposed copy). */
const CHAPTER_GLOSS: Record<FrameworkFamily, string> = {
  las_taxonomy: 'med angreppsprotokoll',
  elf_taxonomy: 'med angreppsprotokoll',
  mek_protocol: 'för luckorna i en mening',
  dtk_tactics: 'för figursidor',
  xyz_traps: 'i problemlösning',
  kva_traps: 'i jämförelser',
  nog_traps: 'i datasufficiens',
  ord_roots: 'och deras betydelser',
}

const VERBAL: ReadonlySet<Section> = new Set<Section>(['ORD', 'LÄS', 'MEK', 'ELF'])
const PARTS = [
  { half: 'verbal', title: 'Verbal del', has: (s: Section) => VERBAL.has(s) },
  { half: 'kvant', title: 'Kvantitativ del', has: (s: Section) => !VERBAL.has(s) },
] as const

/** A word root's origin, said in Swedish (the catalog says it in English). */
const ORIGIN: Record<string, string> = {
  Germanic: 'germanskt',
  Latin: 'latinskt',
  Greek: 'grekiskt',
  French: 'franskt',
}

/** Said while a lesson the reader asked for has not arrived: the open one
 *  stays until it does. */
const ASKED_NOTICE = 'Lektion begärd. Den öppna texten ligger kvar tills den nya har laddats.'

/** A count in prose and its noun: "Åtta frågetyper", "25 fällor". */
function counted(n: number, kind: Kind): string {
  return `${capitalised(inWords(n))} ${n === 1 ? kind.one : kind.many}`
}

/** An entry's line in the contents: its one-line summary when it has one
 *  (a trap's kicker), else its headword. */
function tocTitle(e: UppslagEntryView): string {
  return e.summary ?? e.title
}

/** The words an entry holds, for its reading time. */
function words(entry: FrameworkEntry): number {
  const texts: string[] = []
  const add = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) v.forEach(add)
    else if (v && typeof v === 'object') Object.values(v).forEach(add)
  }
  for (const [key, value] of Object.entries(entry)) {
    if (key !== 'id' && key !== 'example_questions') add(value)
  }
  return texts.join(' ').split(/\s+/).filter(Boolean).length
}

/** About how long the entry takes to read: study prose at 180 words a
 *  minute, never less than one. */
function readingMinutes(entry: FrameworkEntry): number {
  return Math.max(1, Math.round(words(entry) / 180))
}

/** An authentic question id's sitting: "host-2013-verb2-LÄS-020" →
 *  "host-2013". */
const QID_RE = /^((?:var|host)-.+?)-(?:verb|kvant)[12]-[A-ZÄÖÅ]+-\d+$/

/** Where an entry's example questions come from, in one sentence. */
function examplesLine(qids: readonly string[]): string {
  const n = qids.length
  const count = `${capitalised(inWords(n))} ${n === 1 ? 'fråga' : 'frågor'}`
  const exams = qids.map((q) => QID_RE.exec(q)?.[1])
  if (exams.some((e) => e == null)) return `${count} att öva på.`
  const order = (id: string) => {
    const year = Number(/(\d{4})/.exec(id)?.[1] ?? 0)
    return year * 2 + (id.startsWith('host') ? 1 : 0)
  }
  const sorted = (exams as string[]).sort((a, b) => order(a) - order(b))
  const season = (id: string) => formatSitting(id).split(' · ')[0].toLocaleLowerCase('sv-SE')
  const first = season(sorted[0])
  const last = season(sorted[sorted.length - 1])
  return first === last
    ? `${count} ur riktiga prov, alla från ${first}.`
    : `${count} ur riktiga prov, från ${first} till ${last}.`
}

/** The chapter's next unread entry after `id`, wrapping round; never `id`. */
function nextUnread(entries: readonly UppslagEntryView[], id: string): UppslagEntryView | null {
  const at = entries.findIndex((e) => e.id === id)
  for (let step = 1; step < entries.length; step++) {
    const e = entries[(at + step + entries.length) % entries.length]
    if (e && e.id !== id && !e.read) return e
  }
  return null
}

/** The weakest chapter by its section's score, once two can be compared. */
function weakestOf(sections: readonly UppslagSectionView[]): Section | null {
  const scored = sections.filter((s) => s.score != null)
  if (scored.length < 2) return null
  return scored.reduce((a, b) => ((b.score ?? 0) < (a.score ?? 0) ? b : a)).section
}

/** Brings `el` to the top of its own scroll box (never the stage around
 *  it): a move the reader asked for. */
function scrollToTop(el: HTMLElement | null): void {
  for (let n = el?.parentElement; n && el; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY
    if (y !== 'auto' && y !== 'scroll') continue
    if (typeof n.scrollTo !== 'function') return
    const top = el.getBoundingClientRect().top - n.getBoundingClientRect().top + n.scrollTop
    n.scrollTo({ top: Math.max(0, top - 24) })
    return
  }
}

/** The way back to where a lesson was looked up from (a drill's facit). */
export type UppslagBack = {
  /** The button's words (default "Tillbaka till frågan"). */
  label?: string
  onBack: () => void
}

export function FolioUppslag({
  width,
  live,
  asked,
  back: from = null,
}: {
  width: WidthKey
  live: boolean
  /** A lesson the reader asked for elsewhere (a plan row, a facit's "Slå
   *  upp"), read once on arrival. */
  asked: string | null
  /** Opened from a drill's feedback: the way back to that question. */
  back?: UppslagBack | null
}) {
  const { data, actions } = useDirectionData()
  const { sections, open } = data.uppslag
  const sectionOf = (id: string) => sections.find((s) => s.entries.some((e) => e.id === id))
  // An entry asked for and not yet open: the open one stays, said plainly.
  const [requested, setRequested] = useState<string | null>(() =>
    asked && asked !== open.id && sectionOf(asked) ? asked : null,
  )
  // The chapter the verso shows: the open lesson's, the asked-for entry's,
  // or one the reader turned to in the chapter list.
  const [shown, setShown] = useState<Section>(() =>
    requested ? (sectionOf(requested)?.section ?? open.section) : open.section,
  )
  // The reader asked for the chapter's end; it opens once all is read.
  const [wantEnd, setWantEnd] = useState(false)
  const lessonRef = useRef<HTMLElement>(null)
  const tocRef = useRef<HTMLElement>(null)

  // The host opened another lesson: the request is answered, and the spread
  // turns to the new lesson's chapter.
  const seen = useRef(open.id)
  useEffect(() => {
    if (seen.current === open.id) return
    seen.current = open.id
    setRequested((r) => (r === open.id ? null : r))
    setShown(open.section)
    setWantEnd(false)
  }, [open.id, open.section])

  const own = sections.find((s) => s.section === open.section)
  const chapter = sections.find((s) => s.section === shown) ?? own ?? sections[0]
  const entries = own?.entries ?? []
  const kind = KINDS[open.family]
  const pos =
    Math.max(
      0,
      entries.findIndex((e) => e.id === open.id),
    ) + 1
  const next = nextUnread(entries, open.id)
  const allRead = entries.length > 0 && entries.every((e) => e.read)
  const ending = wantEnd && allRead
  const pending = requested != null && requested !== open.id
  const minutes = readingMinutes(open.entry)
  const weakest = weakestOf(sections)
  const phone = width === 'phone'

  const request = (id: string) => {
    if (id === open.id) {
      // The open entry itself: back to it, nothing to ask for.
      setRequested(null)
      setShown(open.section)
      setWantEnd(false)
      lessonRef.current?.focus({ preventScroll: true })
      return
    }
    setRequested(id)
    setShown(sectionOf(id)?.section ?? shown)
    actions.openLesson(id)
  }
  const toggleRead = () => actions.toggleLessonRead(open.id)
  const practise = () =>
    actions.startDrill({ kind: 'framework', frameworkId: open.id, section: open.section })
  const practiseChapter = (section: Section) => actions.startDrill({ kind: 'section', section })

  // The filled button (spec screen 12, "The filled button goes to the next
  // unread entry"): it marks the open entry read and asks for the next
  // unread one after it, or turns to the chapter's end.
  const primary: { label: string; run: () => void } = !open.read
    ? next
      ? {
          label: `Läst – nästa ${kind.one}`,
          run: () => {
            toggleRead()
            request(next.id)
          },
        }
      : {
          label: 'Läst – slutför kapitlet',
          run: () => {
            toggleRead()
            setWantEnd(true)
          },
        }
    : next
      ? { label: `Nästa ${kind.one}`, run: () => request(next.id) }
      : { label: 'Till kapitlets slut', run: () => setWantEnd(true) }

  // J and K step through the chapter's entries from the one open (or asked
  // for); ↵ is the filled button, at the chapter's end its practice.
  const cursor = requested ?? open.id
  const step = (delta: 1 | -1) => {
    const list = (sectionOf(cursor) ?? own)?.entries ?? []
    const to = list[list.findIndex((e) => e.id === cursor) + delta]
    if (to) request(to.id)
  }
  // Esc goes back to the question the lesson was looked up from.
  const backKeys: Record<string, () => void> = from ? { Escape: from.onBack } : {}
  useKeyMap(
    chapter
      ? {
          Enter: ending ? () => practiseChapter(open.section) : primary.run,
          j: () => step(1),
          k: () => step(-1),
          ...backKeys,
        }
      : backKeys,
    live,
  )
  const returnBtn = from ? (
    <button type="button" className="fp-ghost fp-up-return" onClick={from.onBack} title="Esc">
      <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
      {from.label ?? 'Tillbaka till frågan'}
    </button>
  ) : null

  // No catalog to show yet: a blank page that says so (spec §1.7 "Empty").
  if (!chapter) {
    return (
      <div className={phone ? 'fp-phome' : 'fp-home'}>
        {returnBtn}
        <Masthead label="Uppslag" />
        <div className="fp-page-main">
          <h1 className="fp-greet">Läs först.</h1>
          <p className="fp-empty">Inget innehåll här ännu.</p>
        </div>
      </div>
    )
  }

  const page = (e: UppslagEntryView): string | null =>
    pending && e.id === requested
      ? 'begärd'
      : e.read
        ? 'läst'
        : e.id === open.id
          ? `${minutes} min`
          : null
  const chapterNo = Math.max(0, sections.indexOf(chapter)) + 1

  const back = (
    <>
      <Contents
        chapter={chapter}
        openId={open.id}
        page={page}
        onPick={request}
        ended={allRead && !ending && chapter.section === open.section}
        navRef={tocRef}
      />
      <Chapters
        sections={sections}
        shown={chapter.section}
        weakest={weakest}
        onTurn={(s) => setShown(s)}
      />
      <section className="fp-up-direct" aria-labelledby="fp-up-direct-h">
        <h2 className="fp-h3" id="fp-up-direct-h">
          Öva direkt
        </h2>
        <p className="fp-margin-note">
          Läs ett mönster, öva sedan på det. Varje mönster har egna frågor från provet.
        </p>
        <p className="fp-up-links">
          <button
            type="button"
            className="fp-link"
            onClick={() => actions.startDrill({ kind: 'mixed' })}
          >
            Blandad övning
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
          <button type="button" className="fp-link" onClick={actions.openRepetera}>
            Repetera dina missar
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </p>
      </section>
    </>
  )
  const notice = pending ? (
    <p className="fp-erratum fp-up-notice" role="status">
      {ASKED_NOTICE}
    </p>
  ) : null
  const lesson = ending ? (
    <ChapterEnd
      chapter={own ?? chapter}
      kind={kind}
      dateLabel={data.home.today.dateLabel}
      onPractise={() => practiseChapter(open.section)}
      onBack={() => setWantEnd(false)}
    />
  ) : (
    <Lesson
      open={open}
      kind={kind}
      phone={phone}
      primary={primary}
      onPractise={practise}
      onPractiseChapter={() => practiseChapter(open.section)}
      lessonRef={lessonRef}
    />
  )
  const readToggle = ending ? null : <ReadToggle read={open.read} onToggle={toggleRead} />
  const position = `${capitalised(kind.one)} ${pos} av ${entries.length}`
  const whole =
    ending && chapter.section === open.section ? null : (
      <button
        type="button"
        className={phone ? 'fp-quiet-btn fp-up-whole' : 'fp-ghost'}
        onClick={() => practiseChapter(chapter.section)}
      >
        Öva hela {chapter.section}
      </button>
    )

  if (phone) {
    return (
      <div className="fp-phome fp-up">
        {returnBtn}
        <Masthead label={`Uppslag · ${open.section}`}>
          <button
            type="button"
            className="fp-link fp-up-jump"
            onClick={() => {
              scrollToTop(tocRef.current)
              tocRef.current
                ?.querySelector<HTMLElement>('[aria-current="page"], button')
                ?.focus({ preventScroll: true })
            }}
          >
            Innehåll
            <ArrowDown size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </Masthead>
        <div className="fp-up-pagehead">
          <span className="fp-up-pos">{position}</span>
          {readToggle}
        </div>
        {notice}
        {lesson}
        <div className="fp-up-back">
          <ChapterOpener chapter={chapter} number={chapterNo} heading="h2" />
          {whole}
          {back}
        </div>
      </div>
    )
  }

  return (
    <div className="fp-drill fp-up-spread">
      <Spread
        start={0.46}
        rectoLabel={position}
        verso={
          <>
            <header className="fp-runhead fp-runhead--up">
              {returnBtn ? (
                <>
                  {returnBtn}
                  <span className="fp-label fp-runhead-title">Uppslag · {chapter.section}</span>
                </>
              ) : (
                <>
                  <span className="fp-label">Uppslag · {chapter.section}</span>
                  <span />
                </>
              )}
              {whole ?? <span />}
            </header>
            <div className="fp-up-verso">
              <ChapterOpener chapter={chapter} number={chapterNo} heading="h1" />
              {back}
            </div>
          </>
        }
        recto={
          <>
            <header className="fp-runhead fp-runhead--recto fp-runhead--up">
              <span className="fp-runhead-pos">{position}</span>
              {readToggle ?? <span />}
            </header>
            <div className="fp-recto-body fp-up-body">
              {notice}
              {lesson}
            </div>
          </>
        }
      />
    </div>
  )
}

// ── The verso: the chapter and the book's contents ───────────────────

function ChapterOpener({
  chapter,
  number,
  heading,
}: {
  chapter: UppslagSectionView
  number: number
  heading: 'h1' | 'h2'
}) {
  const H = heading
  return (
    <header className="fp-up-chapter">
      <p className="fp-label">Kapitel {number}</p>
      <H className="fp-up-chapter-title">{chapter.name}</H>
      <p className="fp-up-chapter-sub">
        {counted(chapter.entries.length, KINDS[chapter.family])} {CHAPTER_GLOSS[chapter.family]}
      </p>
    </header>
  )
}

/** The chapter's contents: a numbered list with leader dots to its "page
 *  number" — "läst", the open entry's minutes, or "begärd" — and the ribbon
 *  hanging at the open entry, which is also the bookmark. */
function Contents({
  chapter,
  openId,
  page,
  onPick,
  ended,
  navRef,
}: {
  chapter: UppslagSectionView
  openId: string
  page: (e: UppslagEntryView) => string | null
  onPick: (id: string) => void
  /** Every entry is read: the contents close with the colophon's line. */
  ended: boolean
  navRef: RefObject<HTMLElement | null>
}) {
  const traps = chapter.family.endsWith('_traps')
  return (
    <nav className="fp-up-toc" aria-label={`Innehåll: ${chapter.name}`} ref={navRef}>
      <h2 className="fp-h2 fp-up-toc-h">Innehåll</h2>
      {chapter.entries.length === 0 ? (
        <p className="fp-empty">Inget innehåll här ännu.</p>
      ) : (
        <ol>
          {chapter.entries.map((e, i) => {
            const here = e.id === openId
            const p = page(e)
            const title = tocTitle(e)
            return (
              <li key={e.id}>
                <button
                  type="button"
                  className="fp-up-entry"
                  data-testid={`rd-uppslag-entry-${e.id}`}
                  aria-current={here ? 'page' : undefined}
                  aria-label={`${flattenMathText(title)}${p ? `, ${p}` : ''}`}
                  onClick={() => onPick(e.id)}
                >
                  {here ? <span className="fp-ribbon fp-ribbon--toc" aria-hidden /> : null}
                  <span className="fp-plan-n" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="fp-up-entry-line" aria-hidden>
                    <span className="fp-up-entry-title">
                      {traps ? <MathText>{title}</MathText> : title}
                    </span>
                    {p ? (
                      <>
                        <span className="fp-leader" />
                        <span
                          className="fp-plan-min"
                          data-word={p === 'läst' ? 'read' : p === 'begärd' ? 'asked' : undefined}
                        >
                          {p}
                        </span>
                      </>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
      {ended ? (
        <p className="fp-up-ended">
          <span aria-hidden>⁂ </span>Kapitlet är läst.
        </p>
      ) : null}
    </nav>
  )
}

/** The book's eight chapters in their two parts, each with how much of it
 *  is read; the chapter on the verso is current. */
function Chapters({
  sections,
  shown,
  weakest,
  onTurn,
}: {
  sections: readonly UppslagSectionView[]
  shown: Section
  weakest: Section | null
  onTurn: (s: Section) => void
}) {
  return (
    <section className="fp-up-chapters" aria-labelledby="fp-up-chapters-h">
      <h2 className="fp-h2 fp-up-toc-h" id="fp-up-chapters-h">
        Kapitlen
      </h2>
      {PARTS.map((part) => (
        <div key={part.half} className="fp-part-block">
          <PartHead id={`fp-up-${part.half}`}>{part.title}</PartHead>
          <ul aria-labelledby={`fp-up-${part.half}`}>
            {sections
              .filter((s) => part.has(s.section))
              .map((s) => {
                const read = s.entries.filter((e) => e.read).length
                const all = s.entries.length
                const current = s.section === shown
                return (
                  <li key={s.section}>
                    <button
                      type="button"
                      className="fp-plan-row fp-up-ch"
                      data-testid={`rd-uppslag-section-${slug(s.section)}`}
                      aria-current={current ? 'true' : undefined}
                      aria-label={[
                        s.section,
                        s.name,
                        `${read} av ${all} lästa`,
                        s.section === weakest ? 'svagast just nu' : null,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                      onClick={() => onTurn(s.section)}
                    >
                      <span className="fp-entry-code" aria-hidden>
                        {s.section}
                      </span>
                      <span className="fp-plan-body" aria-hidden>
                        <span className="fp-plan-line">
                          <span className="fp-plan-title">{s.name}</span>
                          <span className="fp-leader" />
                          <span className="fp-plan-min" data-lining="true">
                            {all > 0 && read === all
                              ? `${read} av ${all} · läst`
                              : `${read} av ${all}`}
                          </span>
                        </span>
                        {/* The chapter on the verso is described in its
                         *  opener: its line here says only how far along. */}
                        {current && s.section !== weakest ? null : (
                          <span className="fp-plan-why">
                            {current
                              ? null
                              : `${counted(all, KINDS[s.family])} ${CHAPTER_GLOSS[s.family]}`}
                            {s.section === weakest ? (
                              <span className="fp-up-weak">
                                {current ? 'svagast just nu' : ' · svagast just nu'}
                              </span>
                            ) : null}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </section>
  )
}

// ── The recto: the open entry ────────────────────────────────────────

/** Markera som läst, or Läst with the way to undo it: one toggle. */
function ReadToggle({ read, onToggle }: { read: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="fp-ghost fp-up-read"
      data-testid="rd-lesson-read"
      aria-pressed={read}
      onClick={onToggle}
    >
      {read ? (
        <>
          <Check size={15} strokeWidth={2} aria-hidden />
          Läst
          <span className="fp-up-undo">Ångra</span>
        </>
      ) : (
        'Markera som läst'
      )}
    </button>
  )
}

/** The open entry as a reference page, set by its kind, then its foot: the
 *  filled button and, when the entry has questions to play, its practice
 *  (on phone the whole section's, when it has none). */
function Lesson({
  open,
  kind,
  phone,
  primary,
  onPractise,
  onPractiseChapter,
  lessonRef,
}: {
  open: LessonView
  kind: Kind
  phone: boolean
  primary: { label: string; run: () => void }
  onPractise: () => void
  onPractiseChapter: () => void
  lessonRef: RefObject<HTMLElement | null>
}) {
  // The phone page is the entry; on the spread the chapter holds the h1.
  const H = phone ? 'h1' : 'h2'
  const Sub = phone ? 'h2' : 'h3'
  const examples = open.entry.example_questions
  const playable = open.practice.questions > 0
  const practice = playable ? (
    <button
      type="button"
      className="fp-link fp-up-practice"
      data-testid="rd-lesson-practice"
      onClick={onPractise}
    >
      {kind.practice}
      <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
    </button>
  ) : phone ? (
    // No questions to play for this entry: its section's practice is one
    // quiet link away instead (spec screen 12, "Practice only when there
    // are questions to play").
    <button type="button" className="fp-link fp-up-practice" onClick={onPractiseChapter}>
      Öva hela {open.section}
      <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
    </button>
  ) : null
  const filled = (
    <button type="button" className="fp-btn" onClick={primary.run}>
      {primary.label}
      <kbd className="fp-kbd" aria-hidden>
        ↵
      </kbd>
    </button>
  )
  return (
    <article
      className="fp-up-lesson"
      data-testid="rd-lesson"
      aria-labelledby="fp-up-title"
      ref={lessonRef}
      tabIndex={-1}
    >
      <Article open={open} H={H} Sub={Sub} />
      {playable && examples.length > 0 ? (
        <section className="fp-up-block" aria-labelledby="fp-up-ex-h">
          <Sub className="fp-h3 fp-up-h" id="fp-up-ex-h">
            Exempelfrågor
          </Sub>
          <p className="fp-prose fp-up-ex">{examplesLine(examples)}</p>
        </section>
      ) : null}
      <footer className="fp-up-foot">
        {phone ? (
          <>
            {practice}
            {filled}
          </>
        ) : (
          <>
            {filled}
            {practice}
          </>
        )}
      </footer>
    </article>
  )
}

/** The article by its kind, its heads one level under its title. */
function Article({ open, H, Sub }: { open: LessonView; H: 'h1' | 'h2'; Sub: 'h2' | 'h3' }) {
  const e = open.entry
  const head = (text: string) => <Sub className="fp-h3 fp-up-h">{text}</Sub>
  switch (open.family) {
    case 'ord_roots': {
      const x = e as LexiconEntry
      return (
        <>
          <H className="fp-up-root" id="fp-up-title">
            {x.root}
          </H>
          <p className="fp-up-origin">{ORIGIN[x.origin] ?? x.origin}</p>
          <p className="fp-up-meaning">{x.meaning}</p>
          {x.example_words.length ? (
            <section className="fp-up-block">
              {head('Exempel')}
              <p className="fp-up-words">
                {x.example_words.map((w, i) => (
                  <span key={w}>
                    {i > 0 ? <span className="fp-up-dot"> · </span> : null}
                    {w}
                  </span>
                ))}
              </p>
            </section>
          ) : null}
        </>
      )
    }
    case 'dtk_tactics': {
      const x = e as TacticEntry
      return (
        <>
          <H className="fp-up-title" id="fp-up-title">
            {x.tactic}
          </H>
          <Prose head={head('Igenkänningstecken')} text={x.when_to_apply} />
        </>
      )
    }
    case 'mek_protocol': {
      const x = e as ConstraintEntry
      return (
        <>
          <H className="fp-up-title" id="fp-up-title">
            {x.constraint_type}
          </H>
          <Prose head={head('Mönsterregel')} text={x.rule} />
        </>
      )
    }
    case 'las_taxonomy':
    case 'elf_taxonomy': {
      const x = e as ProtocolEntry
      return (
        <>
          <H className="fp-up-title" id="fp-up-title">
            {x.question_type}
          </H>
          {x.attack_protocol.length ? (
            <section className="fp-up-block">
              {head('Angreppsprotokoll')}
              <ol className="fp-up-steps">
                {x.attack_protocol.map((s, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: the protocol's steps keep their order
                  <li key={i}>
                    <span className="fp-up-n" aria-hidden>
                      {i + 1}
                    </span>
                    <p className="fp-prose">
                      <MathText>{s}</MathText>
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {x.common_distractors.length ? (
            <section className="fp-up-block">
              {head('Vanliga fällor')}
              {x.common_distractors.map((d) => (
                <div key={d.pattern} className="fp-up-trap">
                  <p className="fp-up-trap-h">
                    <MathText>{d.pattern}</MathText>
                  </p>
                  <p className="fp-prose fp-up-trap-why">
                    <MathText>{d.why_it_traps}</MathText>
                  </p>
                </div>
              ))}
            </section>
          ) : null}
        </>
      )
    }
    default: {
      const x = e as TrapEntry
      return (
        <>
          <H className="fp-up-title" id="fp-up-title">
            <MathText>{x.tldr || x.pattern_description}</MathText>
          </H>
          {x.tldr ? <Prose head={head('Så gör man ofta')} text={x.pattern_description} /> : null}
          <Prose head={head('Varför det händer')} text={x.why_it_occurs} />
          {x.recognition_cue ? (
            <Prose head={head('Igenkänningstecken')} text={x.recognition_cue} />
          ) : null}
          {x.countermeasure ? (
            // The entry's takeaway, set as its one ruled note.
            <section className="fp-up-block fp-up-counter" aria-label="Motåtgärd">
              {head('Motåtgärd')}
              <p className="fp-up-counter-text">
                <MathText>{x.countermeasure}</MathText>
              </p>
            </section>
          ) : null}
          {x.worked_example ? (
            <section className="fp-up-block">
              {head('Räkneexempel')}
              <ol className="fp-up-steps">
                {(
                  [
                    ['Förutsättning', x.worked_example.setup],
                    ['Fällans tanke', x.worked_example.trap_thinking],
                    ['Korrekt tanke', x.worked_example.correct_thinking],
                    ['Svar', x.worked_example.answer],
                  ] as const
                ).map(([label, text], i) => (
                  <li key={label} data-beat={i === 1 ? 'trap' : undefined}>
                    <span className="fp-up-n" aria-hidden>
                      {i + 1}
                    </span>
                    <div>
                      <span className="fp-sub">{label}</span>
                      <p className="fp-prose">
                        <MathText>{text}</MathText>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {x.counter_example ? (
            <section className="fp-up-block">
              {head('När fällan inte gäller')}
              <p className="fp-prose fp-up-italic">
                <MathText>{x.counter_example}</MathText>
              </p>
            </section>
          ) : null}
          {x.common_distractor_signature ? (
            <p className="fp-footnote fp-footnote--plain fp-up-signature">
              Det typiska felsvaret: <MathText>{x.common_distractor_signature}</MathText>
            </p>
          ) : null}
        </>
      )
    }
  }
}

function Prose({ head, text }: { head: ReactNode; text: string }) {
  if (!text) return null
  return (
    <section className="fp-up-block">
      {head}
      <p className="fp-prose">
        <MathText>{text}</MathText>
      </p>
    </section>
  )
}

/** The chapter's end (spec screen 12, "The chapter's end"): ⁂, the facts,
 *  the whole chapter's practice as the one action, the way back. */
function ChapterEnd({
  chapter,
  kind,
  dateLabel,
  onPractise,
  onBack,
}: {
  chapter: UppslagSectionView
  kind: Kind
  dateLabel: string
  onPractise: () => void
  onBack: () => void
}) {
  // "Fredag 9 oktober" → "9 oktober".
  const day = dateLabel.split(' ').slice(1).join(' ')
  const n = chapter.entries.length
  return (
    <Colophon
      title="Kapitlet är läst."
      subtitle={chapter.name}
      facts={`${n} ${n === 1 ? kind.one : kind.many} · läst ${day}`}
      lines="Varje sida i kapitlet är läst. Öva nu på det, eller slå upp ett annat kapitel."
      next={{ label: `Öva hela ${chapter.section}`, onClick: onPractise }}
      back={{ label: 'Tillbaka till sidan', onClick: onBack }}
    />
  )
}
