// Spår's small shared parts. Round 1: the trail mark, the destination
// icons, the section names, the keycap and the calm-mode switch. Round 2
// (batch 1) adds what every new screen is built from:
//   - SparStop: one stop of a stig, in one vocabulary of states (spec §1.2)
//   - SparPageHead: a destination page's head, lifted from Idag's
//   - SparSegmented: a small radio group (DTK's fit control)
//   - useInPlace: a card's in-place disclosure (spec §1.9): focus moves in,
//     Esc closes and hands focus back to its button
//   - the sections' facts: official names, halves, rough round lengths and
//     Swedish counts

import {
  Check,
  ChevronDown,
  Flag,
  Footprints,
  Hourglass,
  Leaf,
  Lightbulb,
  Mountain,
  RotateCcw,
  Route,
  X,
} from 'lucide-react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import type { Destination } from '@/components/devbake/redesign/r1Kit'
import type { Section } from '@/data/questions'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'

/** The högskoleprov sections by code, by the test's official names (the
 *  live app says "Svensk läsförståelse"; Spår keeps "Läsförståelse"). REP
 *  is cross-section repetition. The long word carries a soft hyphen
 *  (U+00AD), so a narrow tile breaks it "Menings-/komplettering". */
export const SECTION_NAMES: Record<string, string> = {
  ORD: 'Ordförståelse',
  LÄS: 'Läsförståelse',
  MEK: 'Menings­komplettering',
  ELF: 'Engelsk läsförståelse',
  XYZ: 'Matematisk problemlösning',
  KVA: 'Kvantitativa jämförelser',
  NOG: 'Kvantitativa resonemang',
  DTK: 'Diagram, tabeller och kartor',
  REP: 'Repetition',
}

export const VERBAL: readonly Section[] = ['ORD', 'LÄS', 'MEK', 'ELF']
export const KVANT: readonly Section[] = ['XYZ', 'KVA', 'NOG', 'DTK']

export function sectionName(code: string): string {
  return SECTION_NAMES[code] ?? code
}

/** A section code in a test id: 'LÄS' → 'las'. The same rule as the
 *  shared contract's sectionSlug, kept here because that module is
 *  test-only. */
export function sectionSlug(section: string): string {
  return section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
}

/** A label from the fixtures ("ORD", "Repetition") → its data-sec key. */
export function secOf(label: string | null): string {
  if (!label || label === 'Repetition') return 'REP'
  return label
}

/** A section round's rough length in minutes (lib/sectionDurations). */
export function sectionMinutes(section: Section): number {
  return SECTION_DURATIONS[section]
}

/** A mixed round's rough length: the mean of the eight sections' times
 *  (the live app has no estimate of its own for it). */
export const MIXED_MINUTES = Math.round(
  Object.values(SECTION_DURATIONS).reduce((a, b) => a + b, 0) /
    Object.values(SECTION_DURATIONS).length,
)

/** Rough minutes for a set of questions: each section's share of its
 *  ten-question round. Never under a minute. */
export function minutesFor(sections: readonly Section[]): number {
  const sum = sections.reduce((n, s) => n + SECTION_DURATIONS[s] / 10, 0)
  return Math.max(1, Math.round(sum))
}

const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']

export const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)

/** 3 → "tre"; past ten the figure stays. */
export function inWords(n: number): string {
  return WORDS[n] ?? String(n)
}

/** 1 → "1 fråga", 4 → "4 frågor". */
export function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Trail glyphs for the five destinations: Idag is today's route, Öva the
 *  steps you take, Framsteg the summit. */
export const NAV_ICONS: Record<Destination, (size: number) => ReactNode> = {
  idag: (s) => <Route size={s} strokeWidth={2} aria-hidden />,
  ova: (s) => <Footprints size={s} strokeWidth={2} aria-hidden />,
  provpass: (s) => <Hourglass size={s} strokeWidth={2} aria-hidden />,
  uppslag: (s) => <Lightbulb size={s} strokeWidth={2} aria-hidden />,
  framsteg: (s) => <Mountain size={s} strokeWidth={2} aria-hidden />,
}

/** The Spår mark: a rounded tile with a winding trail between two stops. */
export function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg
      className="sp-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="13" fill="var(--sp-primary)" />
      <path
        d="M12.5 29.5c0-6.5 15-3.5 15-10s-8.5-4.5-8.5-9.5"
        fill="none"
        stroke="var(--sp-on-primary)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="29.5" r="2.7" fill="var(--sp-on-primary)" />
      <circle cx="19" cy="10" r="2.7" fill="var(--sp-on-primary)" />
    </svg>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="sp-kbd" aria-hidden>
      {children}
    </kbd>
  )
}

/** "Lugnt läge" as a visible switch: fewer colours and numbers, no
 *  springs. On Home and in the drill's top bar, not only in a menu. */
export function CalmSwitch({
  calm,
  setCalm,
  compact = false,
  testid,
}: {
  calm: boolean
  setCalm: (calm: boolean) => void
  compact?: boolean
  testid: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={calm}
      className="sp-calm"
      data-compact={String(compact)}
      data-testid={testid}
      title="Lugnt läge: färre färger och siffror, inga studsar"
      onClick={() => setCalm(!calm)}
    >
      <Leaf size={18} strokeWidth={2} aria-hidden />
      <span className="sp-calm-label">{compact ? 'Lugnt' : 'Lugnt läge'}</span>
      <i className="sp-switch sp-switch--sm" aria-hidden />
    </button>
  )
}

// ── Stops ────────────────────────────────────────────────────────────

/**
 * A stop's state (spec §1.2): kvar, pågår, rätt/klar, lagd i Repetera,
 * besvarad and markerad (a running Provpass), obesvarad (its result), the
 * goal at a path's end, and a section stop (its code in a ring of its hue).
 */
export type StopState =
  | 'todo'
  | 'now'
  | 'right'
  | 'done'
  | 'miss'
  | 'answered'
  | 'flagged'
  | 'blank'
  | 'goal'
  | 'section'

export type StopSize = 20 | 24 | 30 | 32 | 36 | 44

const GLYPH_PX: Record<StopSize, number> = { 20: 10, 24: 12, 30: 13, 32: 14, 36: 15, 44: 18 }

/**
 * One stop of a stig: a disc with a state. `sec` rings a numbered stop in
 * a section's hue (and is the hue of a `section` stop); `glyph` replaces
 * the state's own mark (I and II on KVA's quantities); `outline` draws a
 * right stop as a ring where a fill would shout. The disc is decoration:
 * `word` speaks it, else the caller says what it means in words.
 */
export function SparStop({
  state,
  size = 32,
  sec,
  label,
  glyph,
  word,
  outline = false,
}: {
  state: StopState
  size?: StopSize
  sec?: string
  label?: ReactNode
  glyph?: ReactNode
  word?: string
  outline?: boolean
}) {
  const px = GLYPH_PX[size]
  const own =
    state === 'right' || state === 'done' ? (
      <Check size={px} strokeWidth={3.25} />
    ) : state === 'miss' ? (
      <RotateCcw size={size === 24 ? 11 : px - 2} strokeWidth={3} />
    ) : state === 'goal' || state === 'flagged' ? (
      <Flag size={state === 'flagged' ? 12 : px} strokeWidth={2.25} />
    ) : state === 'blank' ? (
      '–'
    ) : null
  return (
    <span
      className="sp-stop"
      data-state={state}
      data-size={size}
      data-sec={sec}
      data-outline={outline ? 'true' : undefined}
    >
      <span className="sp-stop-g" aria-hidden>
        {glyph ?? own ?? label}
      </span>
      {word ? <span className="sp-sr">{word}</span> : null}
    </span>
  )
}

// ── Page head ────────────────────────────────────────────────────────

/**
 * A destination page's head, Idag's own (`.sp-home-head`): an eyebrow, the
 * display title (the page's one h1, focusable for a page change) and a
 * lede on the left; the page's tools on the right on desktop and under the
 * lede on phone. A sub-page puts its back link above the eyebrow.
 */
export function SparPageHead({
  eyebrow,
  title,
  titleExtra,
  lede,
  tools,
  back,
  phone,
}: {
  eyebrow: ReactNode
  title: ReactNode
  /** Said with the title, not shown (a scope: ", bara Läsförståelse"). */
  titleExtra?: string
  lede?: ReactNode
  tools?: ReactNode
  back?: ReactNode
  phone: boolean
}) {
  return (
    <header className="sp-home-head">
      <div className="sp-home-intro">
        {back}
        <p className="sp-eyebrow">{eyebrow}</p>
        <h1 className="sp-display sp-display--xl" tabIndex={-1}>
          {title}
          {titleExtra ? <span className="sp-sr">{titleExtra}</span> : null}
        </h1>
        {lede || (phone && tools) ? (
          <div className="sp-lede-row">
            {lede ? <p className="sp-lede">{lede}</p> : null}
            {phone ? tools : null}
          </div>
        ) : null}
      </div>
      {!phone && tools ? <div className="sp-home-tools">{tools}</div> : null}
    </header>
  )
}

// ── Segmented control ────────────────────────────────────────────────

/**
 * A short radio group as one pill: the chosen part is an ink squircle.
 * Native radios, so ←/→ move the choice; the bake-off's own arrows leave
 * keys that come from a form field alone.
 */
export function SparSegmented<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { key: K; label: ReactNode }[]
  value: K
  onChange: (key: K) => void
}) {
  const name = useId()
  return (
    <fieldset className="sp-seg">
      <legend className="sp-sr">{label}</legend>
      {options.map((o) => (
        <label key={o.key} className="sp-seg-item">
          <input
            type="radio"
            className="sp-seg-input"
            name={name}
            value={o.key}
            checked={value === o.key}
            onChange={() => onChange(o.key)}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  )
}

// ── In-place disclosure ──────────────────────────────────────────────

/**
 * A card that grows into its next layer instead of opening a modal
 * (spec §1.9): opening moves focus to the new part's heading, Esc or the
 * button closes it and puts focus back on the button.
 */
export function useInPlace() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const headRef = useRef<HTMLHeadingElement>(null)
  const was = useRef(false)
  useEffect(() => {
    if (open) headRef.current?.focus({ preventScroll: true })
    else if (was.current) buttonRef.current?.focus({ preventScroll: true })
    was.current = open
  }, [open])
  const toggle = useCallback(() => setOpen((o) => !o), [])
  const onKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (e.key !== 'Escape') return
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
  }, [])
  return { open, setOpen, toggle, buttonRef, headRef, onKeyDown }
}

/** Keeps Tab inside a modal layer: from its last control to its first,
 *  and back with Shift. Focus can also rest outside the controls: on the
 *  heading the layer opens on (tabindex -1, before every control), from
 *  where Shift + Tab goes round to the last control too. */
export function trapTab(e: ReactKeyboardEvent, box: HTMLElement | null): void {
  if (e.key !== 'Tab' || !box) return
  const els = box.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  )
  if (els.length === 0) return
  const first = els[0]
  const last = els[els.length - 1]
  const at = document.activeElement
  const atStart = at === first || (at != null && precedes(at, first))
  const atEnd = at === last || (at != null && precedes(last, at))
  if (e.shiftKey && atStart) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && atEnd) {
    e.preventDefault()
    first.focus()
  }
}

/** Whether `a` comes before `b` in the document. */
function precedes(a: Node, b: Node): boolean {
  return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
}

// ── "Bara ett delprov" ───────────────────────────────────────────────

export type ScopeCount = { section: Section; n: number }

/**
 * "Bara ett delprov ⌄": the sections that have ripe misses, as quiet
 * choices that match the path's stops. On desktop the card grows in place
 * (§1.9) — put it in a wrapping row and its list takes a row of its own;
 * on phone it is a modal edge sheet (a scrim, focus kept inside, Esc or a
 * press outside closes it). `current` marks a scope already chosen; `all`
 * offers the way back to every section.
 */
export function ScopePicker({
  counts,
  onPick,
  phone,
  current = null,
  all = false,
}: {
  counts: readonly ScopeCount[]
  onPick: (section: Section | null) => void
  phone: boolean
  current?: Section | null
  all?: boolean
}) {
  const place = useInPlace()
  const id = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  // The phone sheet is a layer of the direction's root, above its frame.
  const [root, setRoot] = useState<HTMLElement | null>(null)
  const toggle = () => {
    if (phone) setRoot(place.buttonRef.current?.closest<HTMLElement>("[data-rd='spar']") ?? null)
    place.toggle()
  }
  if (counts.length === 0 && !current) return null
  const pick = (section: Section | null) => {
    place.setOpen(false)
    onPick(section)
  }
  const choices = (
    <ul className="sp-scope-list">
      {all && current ? (
        <li>
          <button type="button" className="sp-scope-item" onClick={() => pick(null)}>
            <SparStop state="section" size={36} sec="REP" label="Alla" />
            <span className="sp-scope-name">Alla delprov</span>
          </button>
        </li>
      ) : null}
      {counts.map((c) => (
        <li key={c.section}>
          <button
            type="button"
            className="sp-scope-item"
            aria-current={current === c.section ? 'true' : undefined}
            onClick={() => pick(c.section)}
          >
            <SparStop state="section" size={36} sec={c.section} label={c.section} />
            <span className="sp-scope-name">{sectionName(c.section)}</span>
            <span className="sp-scope-n">{c.n} redo</span>
          </button>
        </li>
      ))}
    </ul>
  )
  const head = (
    <h3 className="sp-scope-h" id={`${id}-h`} ref={place.headRef} tabIndex={-1}>
      Bara ett delprov
    </h3>
  )
  return (
    <>
      <button
        type="button"
        className="sp-btn sp-btn--quiet sp-scope-toggle"
        ref={place.buttonRef}
        aria-expanded={place.open}
        aria-controls={id}
        aria-haspopup={phone ? 'dialog' : undefined}
        onClick={toggle}
      >
        Bara ett delprov
        <ChevronDown
          size={18}
          strokeWidth={2.25}
          aria-hidden
          style={{ rotate: place.open && !phone ? '180deg' : '0deg' }}
        />
      </button>
      {place.open && !phone ? (
        <section
          className="sp-scope-region"
          id={id}
          aria-labelledby={`${id}-h`}
          onKeyDown={place.onKeyDown}
        >
          <div className="sp-scope-head">
            {head}
            <button
              type="button"
              className="sp-icon-btn sp-icon-btn--sm"
              aria-label="Stäng"
              onClick={() => place.setOpen(false)}
            >
              <X size={18} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
          {choices}
        </section>
      ) : null}
      {place.open && phone && root
        ? createPortal(
            <>
              <button
                type="button"
                className="sp-scrim"
                aria-label="Stäng"
                tabIndex={-1}
                onClick={() => place.setOpen(false)}
              />
              <div
                className="sp-menu sp-menu--sheet sp-scope-sheet"
                id={id}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-h`}
                ref={sheetRef}
                onKeyDown={(e) => {
                  place.onKeyDown(e)
                  trapTab(e, sheetRef.current)
                }}
              >
                <span className="sp-menu-grab" aria-hidden />
                <div className="sp-scope-head">
                  {head}
                  <button
                    type="button"
                    className="sp-icon-btn sp-icon-btn--sm"
                    aria-label="Stäng"
                    onClick={() => place.setOpen(false)}
                  >
                    <X size={18} strokeWidth={2.25} aria-hidden />
                  </button>
                </div>
                {choices}
              </div>
            </>,
            root,
          )
        : null}
    </>
  )
}
