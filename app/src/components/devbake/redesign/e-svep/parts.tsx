// E · Svep — the pieces every screen shares: the deck on the table, its
// counter with visible arrows, the index as a row of small cards, the
// register beside a deck and its keys, the drill's progress as cards, the
// keycap, the section chip and the table's tint, the 0–2,0 scale, the
// confirmation card dealt over the table, and the words for small numbers.

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from 'react'

import { fmtScore, isForeignKey, useKeyMap } from '@/components/devbake/redesign/r1Kit'
import type { Section } from '@/data/questions'
import { cardPos, type Deck, dragStyle } from './deck'

/** The table's quiet tint: the section of the card in front. */
export type Tint = 'las' | 'elf' | 'ord' | 'rep' | 'none'

/** The sections with a table tint (and a chip colour) of their own. Every
 *  other section lies on the neutral table: its name is in the text. */
const SECTION_TINTS: Partial<Record<string, Tint>> = { LÄS: 'las', ELF: 'elf', ORD: 'ord' }

export function sectionTint(section: Section | string | null | undefined): Tint {
  return (section ? SECTION_TINTS[section] : undefined) ?? 'none'
}

/** A section in an id: lower-case ASCII ('LÄS' → 'las'), as the shared
 *  contract's sectionSlug (contract.ts is test-only, so not imported). */
export function sectionKey(section: Section): string {
  return section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
}

/** What a framework entry is to the reader, from its id's family
 *  (XYZ-TRAP-017, DTK-TACTIC-003, LAS-TYPE-003). */
export function frameworkKind(id: string): string {
  if (id.includes('-TRAP-')) return 'Fälla'
  if (id.includes('-TACTIC-')) return 'Taktik'
  if (id.includes('-TYPE-')) return 'Frågetyp'
  return 'Ramverk'
}

/** A section's chip. Cross-section items (repetition, a mixed drill) take
 *  the repetition lilac, as round 1's plan cards did. */
export function SecChip({ section, label }: { section: Section | null; label?: string }) {
  return (
    <span className="sv-sec" data-sec={section ? sectionTint(section) : 'rep'}>
      {label ?? section ?? 'Alla delprov'}
    </span>
  )
}

export const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']

export const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)

/** 4 → "fyra"; past ten, the figure. */
export const word = (n: number) => WORDS[n] ?? String(n)

export type DeckCard = {
  id: string
  /** The card's name in the counter and the index. */
  label: string
  body: ReactNode
  /** The table's tint while this card is in front. */
  tint?: Tint
  /** A card that tells rather than asks (Idag's "Läget"): the index marks
   *  it as a dot after a gap, so the to-dos count apart. */
  dot?: boolean
  /** The register's right-hand figure. */
  meta?: string
  /** The figure in words, for a screen reader, when `meta` is a short form
   *  ("6/40" → "6 av 40 sedda"). */
  metaSaid?: string
}

/** The kinds of deck on the table, for the stylesheet. */
export type DeckKind = 'home' | 'ova' | 'run' | 'prov' | 'res' | 'fs' | 'konto'

/**
 * The deck: every card is in the DOM, one is in front and the next two
 * show their edges behind it. The others are inert, as the hidden slides
 * of a WAI-ARIA carousel are; the counter, the arrows, the index and the
 * keys reach them. A horizontal pull moves it (deck.ts), unless `swipe` is
 * off: a deck whose cards hold choices (Konto) moves by its controls only.
 */
export function DeckStage({
  deck,
  cards,
  label,
  kind,
  live,
  swipe = true,
}: {
  deck: Deck
  cards: DeckCard[]
  label: string
  kind: DeckKind
  live: boolean
  swipe?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  // A card that leaves the front turns inert and would drop the focus on
  // the floor: hand it to the new front card instead.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the front card changes
  useLayoutEffect(() => {
    const active = document.activeElement
    const stage = ref.current
    if (!stage || !(active instanceof HTMLElement) || !stage.contains(active)) return
    if (!active.closest('[inert]')) return
    stage.querySelector<HTMLElement>('[data-pos="front"]')?.focus({ preventScroll: true })
  }, [deck.index])
  return (
    <section
      ref={ref}
      className="sv-deck"
      data-kind={kind}
      data-held={String(deck.drag !== 0)}
      data-moved={String(deck.moved)}
      aria-roledescription="kortlek"
      aria-label={label}
      {...(live && swipe ? deck.bind : {})}
    >
      {cards.map((c, i) => {
        const pos = cardPos(i, deck.index)
        return (
          <article
            key={c.id}
            className="sv-card sv-dcard"
            data-pos={pos}
            data-card={c.id}
            aria-roledescription="kort"
            aria-label={`${i + 1} av ${cards.length}: ${c.label}`}
            tabIndex={pos === 'front' ? -1 : undefined}
            inert={pos !== 'front'}
            style={dragStyle(pos, deck.drag)}
          >
            {c.body}
          </article>
        )
      })}
    </section>
  )
}

/** "‹ 2 / 7 ›" — the deck's counter between two visible arrows, so a
 *  mouse never has to swipe. At an end the arrow stays focusable and says
 *  so (aria-disabled) instead of dropping the focus. */
export function DeckCounter({
  deck,
  cards,
  arrows = true,
}: {
  deck: Deck
  cards: DeckCard[]
  /** Phone leaves the arrows out: the thumb swipes or taps the index. */
  arrows?: boolean
}) {
  const first = deck.index === 0
  const last = deck.index >= deck.count - 1
  const count = (
    <p className="sv-count" aria-live="polite">
      <span className="sv-count-n">
        <b>{deck.index + 1}</b>
        <span aria-hidden> / </span>
        <span className="sv-sr"> av </span>
        {deck.count}
      </span>
      <span className="sv-count-name">{cards[deck.index]?.label}</span>
    </p>
  )
  if (!arrows) return <div className="sv-counter">{count}</div>
  return (
    <div className="sv-counter">
      <button
        type="button"
        className="sv-arrow"
        aria-label="Föregående kort"
        aria-disabled={first}
        onClick={first ? undefined : deck.prev}
      >
        <ChevronLeft size={20} strokeWidth={2} aria-hidden />
      </button>
      {count}
      <button
        type="button"
        className="sv-arrow"
        aria-label="Nästa kort"
        aria-disabled={last}
        onClick={last ? undefined : deck.next}
      >
        <ChevronRight size={20} strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}

/** The deck's index as a row of small cards, one per card (phone and the
 *  facit run): the one in front stands up, the rest lie flat. */
export function DeckTicks({
  deck,
  cards,
  label,
}: {
  deck: Deck
  cards: DeckCard[]
  label: string
}) {
  return (
    <ol className="sv-ticks" aria-label={label}>
      {cards.map((c, i) => (
        <li key={c.id} data-gap={c.dot && !cards[i - 1]?.dot ? 'true' : undefined}>
          <button
            type="button"
            className="sv-tick"
            data-dot={c.dot ? 'true' : undefined}
            aria-current={i === deck.index ? 'true' : undefined}
            aria-label={`Kort ${i + 1}: ${c.label}`}
            title={c.label}
            onClick={() => deck.go(i)}
          >
            <i aria-hidden />
          </button>
        </li>
      ))}
    </ol>
  )
}

/** A unit's questions as small cards: answered, the one in front (null
 *  once it is answered too), waiting. */
export function QuestionCards({
  total,
  answered,
  current,
}: {
  total: number
  answered: number
  current: number | null
}) {
  return (
    <span className="sv-qcards" role="img" aria-label={`${answered} av ${total} besvarade`}>
      {Array.from({ length: total }, (_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length progress marks
          key={i}
          data-state={i === current ? 'now' : i < answered ? 'done' : 'todo'}
        />
      ))}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="sv-kbd" aria-hidden>
      {children}
    </kbd>
  )
}

/** The deck's register on the table: every card by its number and name,
 *  with its figure; a press brings that card to the front. */
export function DeckRegister({
  deck,
  cards,
  label,
  head,
}: {
  deck: Deck
  cards: DeckCard[]
  label: string
  head: ReactNode
}) {
  return (
    <nav className="sv-index sv-tri-register" aria-label={label}>
      <p className="sv-index-head">{head}</p>
      <ol>
        {cards.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className="sv-index-row"
              aria-current={i === deck.index ? 'true' : undefined}
              onClick={() => deck.go(i)}
            >
              <span className="sv-index-n" aria-hidden>
                {i + 1}
              </span>
              <span className="sv-index-name">{c.label}</span>
              {c.metaSaid ? (
                <span className="sv-index-meta">
                  <span aria-hidden>{c.meta}</span>
                  <span className="sv-sr">, {c.metaSaid}</span>
                </span>
              ) : (
                <span className="sv-index-meta">{c.meta ?? ''}</span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * A deck's keys, as on Idag: ←/→ move it and are left to the bake-off's
 * screen keys at either end, Home and End jump, and Enter takes the card
 * in front — once: a held Enter does not repeat, so the key that brought
 * the reader here never also starts what the new card offers. `enter` is
 * null while the card in front has nothing to take.
 */
export function useDeckKeys(deck: Deck, enter: (() => void) | null, live: boolean): void {
  useKeyMap(
    {
      ...(deck.index > 0 ? { ArrowLeft: deck.prev } : {}),
      ...(deck.index < deck.count - 1 ? { ArrowRight: deck.next } : {}),
      Home: () => deck.go(0),
      End: () => deck.go(deck.count - 1),
    },
    live,
  )
  const ref = useRef(enter)
  ref.current = enter
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || e.defaultPrevented || isForeignKey(e)) return
      // Enter on a focused control keeps its native meaning.
      const t = e.target
      if (t instanceof Element && t.closest('button, a[href], summary, [role="button"]')) return
      const take = ref.current
      if (!take) return
      e.preventDefault()
      take()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live])
}

// ── The 0–2,0 scale ──────────────────────────────────────────────────

/** The top of HP's scale: the bars and the scales are drawn against it. */
export const SCALE_MAX = 2

/** 1.25 → "1,25": a range keeps its two decimals (one would round it). */
export const fmtRange = (v: number) => v.toFixed(2).replace('.', ',')

/** The 0–2,0 scale: the estimate as a mark, and the likely range as a band
 *  when there is one. */
export function Scale({ total, low, high }: { total: number; low?: number; high?: number }) {
  const pct = (v: number) => `${(v / SCALE_MAX) * 100}%`
  const range = low != null && high != null ? `${fmtRange(low)}–${fmtRange(high)}` : null
  return (
    <div
      className="sv-scale"
      role="img"
      aria-label={
        range
          ? `Trolig nivå ${range} på skalan 0 till ${fmtScore(SCALE_MAX)}.`
          : `Prognos ${fmtScore(total)} på skalan 0 till ${fmtScore(SCALE_MAX)}.`
      }
    >
      {range && high != null && low != null ? (
        <>
          <span className="sv-scale-label" aria-hidden style={{ left: pct(high) }}>
            Troligt {range}
          </span>
          <span className="sv-scale-axis" aria-hidden />
          <span
            className="sv-scale-range"
            aria-hidden
            style={{ left: pct(low), width: pct(high - low) }}
          />
        </>
      ) : (
        <span className="sv-scale-axis" aria-hidden />
      )}
      <span className="sv-scale-mark" aria-hidden style={{ left: pct(total) }} />
      {[0, 0.5, 1, 1.5, 2].map((v) => (
        <span key={v} className="sv-scale-tick" aria-hidden style={{ left: pct(v) }}>
          {v === 0 ? '0' : fmtScore(v)}
        </span>
      ))}
    </div>
  )
}

// ── A confirmation dealt over the table ──────────────────────────────

type GateAction = { label: string; onClick: () => void }

/**
 * A confirmation as one card dealt over the table: a labelled modal over
 * the whole stage, the table behind dimmed and out of reach. The focus is
 * kept inside (Tab wraps) and goes first to its heading, so a held or a
 * second Enter never accepts it; Esc or a press on the table puts the card
 * back, and the focus returns to what opened it. The accept button carries
 * rd-confirm. The bake-off's switcher leaves every key pressed in it alone
 * (data-rd-keyscope).
 */
export function Gate({
  eyebrow,
  title,
  children,
  accept,
  dismiss,
  safe,
}: {
  eyebrow: string
  title: ReactNode
  children?: ReactNode
  accept: GateAction
  dismiss: GateAction
  /** The way back is the filled action: accepting loses something. */
  safe?: boolean
}) {
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    const opener = document.activeElement
    headRef.current?.focus({ preventScroll: true })
    return () => {
      // A frame later, once what opened the card can take the focus again.
      window.requestAnimationFrame(() => {
        if (opener instanceof HTMLElement && opener.isConnected) {
          opener.focus({ preventScroll: true })
        }
      })
    }
  }, [])
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      dismiss.onClick()
      return
    }
    if (e.key !== 'Tab' || !cardRef.current) return
    const stops = [
      ...cardRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
    ]
    if (stops.length === 0) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    const at = document.activeElement
    if (e.shiftKey && (at === first || at === headRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && at === last) {
      e.preventDefault()
      first.focus()
    }
  }
  const acceptBtn = (
    <button
      key="accept"
      type="button"
      className={`sv-btn ${safe ? 'sv-btn--tonal' : 'sv-btn--primary'} sv-btn--block sv-btn--lg`}
      data-testid="rd-confirm"
      onClick={accept.onClick}
    >
      {accept.label}
    </button>
  )
  const dismissBtn = (
    <button
      key="dismiss"
      type="button"
      className={`sv-btn ${safe ? 'sv-btn--primary' : 'sv-btn--quiet'} sv-btn--block${safe ? ' sv-btn--lg' : ''}`}
      onClick={dismiss.onClick}
    >
      {dismiss.label}
    </button>
  )
  return (
    <div className="sv-gate" data-rd-keyscope>
      <button
        type="button"
        className="sv-gate-scrim"
        tabIndex={-1}
        aria-label={dismiss.label}
        onClick={dismiss.onClick}
      />
      <div
        className="sv-card sv-gate-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={cardRef}
        onKeyDown={onKeyDown}
      >
        <p className="sv-rc-eyebrow">{eyebrow}</p>
        <h2 className="sv-gate-title" id={titleId} tabIndex={-1} ref={headRef}>
          {title}
        </h2>
        {children}
        <div className="sv-gate-actions">
          {safe ? [dismissBtn, acceptBtn] : [acceptBtn, dismissBtn]}
        </div>
      </div>
    </div>
  )
}
