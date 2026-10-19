// E · Svep — the pieces Idag and the drill share: the deck on the table,
// its counter with visible arrows, the index as a row of small cards, the
// drill's progress as cards, and the keycap.

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type ReactNode, useLayoutEffect, useRef } from 'react'

import { cardPos, type Deck, dragStyle } from './deck'

/** The table's quiet tint: the section of the card in front. */
export type Tint = 'las' | 'elf' | 'ord' | 'rep' | 'none'

export type DeckCard = {
  id: string
  /** The card's name in the counter and the index. */
  label: string
  body: ReactNode
  /** Idag: the table's tint while this card is in front. */
  tint?: Tint
  /** A card that tells rather than asks (Idag's "Läget"): the index marks
   *  it as a dot after a gap, so the to-dos count apart. */
  dot?: boolean
}

/**
 * The deck: every card is in the DOM, one is in front and the next two
 * show their edges behind it. The others are inert, as the hidden slides
 * of a WAI-ARIA carousel are; the counter, the arrows, the index and the
 * keys reach them. A horizontal pull moves it (deck.ts).
 */
export function DeckStage({
  deck,
  cards,
  label,
  kind,
  live,
}: {
  deck: Deck
  cards: DeckCard[]
  label: string
  kind: 'home' | 'run'
  live: boolean
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
      {...(live ? deck.bind : {})}
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
