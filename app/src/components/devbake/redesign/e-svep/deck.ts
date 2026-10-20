// E · Svep — the deck: one card in front, the rest stacked behind it.
//
// useDeck keeps the front card — its place and its name — and turns a
// horizontal drag on the deck into a move: a pull past SWIPE px (or a
// quick flick) deals the next card, a pull the other way brings the
// previous one back. Vertical drags are left to the page (touch-action:
// pan-y on the deck), and a drag never ends in a click on the card it
// started on. Keys and buttons call the same next/prev/go, so swiping is
// never the only way to move. The cards come from data that can change
// under the deck: the card in front stays in front while it is dealt, and
// the place never runs past the last card.
//
// cardPos names each card's place for the stylesheet: "gone" (dealt away
// to the left), "front", "next" and "after" (the two edges that peek from
// behind) and "deep" (further down the deck, hidden).

import {
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

/** A pull this long (px) moves the deck one card. */
const SWIPE = 56
/** …or a flick this fast (px per ms). */
const FLICK = 0.45
/** Past either end the card follows the finger only this much. */
const RESIST = 0.22

export type CardPos = 'gone' | 'front' | 'next' | 'after' | 'deep'

export function cardPos(i: number, index: number): CardPos {
  const d = i - index
  if (d < 0) return 'gone'
  if (d === 0) return 'front'
  if (d === 1) return 'next'
  if (d === 2) return 'after'
  return 'deep'
}

export type DeckBind = {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel: () => void
  onClickCapture: (e: SyntheticEvent) => void
}

export type Deck = {
  index: number
  count: number
  /** How the front card got there: by a move (animate) or not (a reset). */
  moved: boolean
  go: (i: number) => void
  next: () => void
  prev: () => void
  /** The front card's horizontal pull in px while it is held, else 0. */
  drag: number
  bind: DeckBind
}

/**
 * The deck's state for `cards` (only their ids count). `reset` (a string
 * or number) re-seats it at the first card, without a move, whenever it
 * changes: a new verdict, a new question. When the cards change (the data
 * behind them did), the card in front stays in front if it is still
 * dealt; if it is gone, the deck keeps its place, at most the last card.
 * Settled while rendering, so no one ever reads a card past the end.
 */
export function useDeck(cards: readonly { id: string }[], reset?: string | number): Deck {
  const count = cards.length
  const [front, setFront] = useState(() => ({ index: 0, id: cards[0]?.id }))
  const [moved, setMoved] = useState(false)
  const [drag, setDrag] = useState(0)

  let index = front.index
  if (cards[index]?.id !== front.id) {
    const kept = cards.findIndex((c) => c.id === front.id)
    index = kept === -1 ? Math.min(front.index, Math.max(0, count - 1)) : kept
    setFront({ index, id: cards[index]?.id })
    // A re-seat, not a move: no card flies.
    setMoved(false)
  }
  const indexRef = useRef(index)
  indexRef.current = index
  const cardsRef = useRef(cards)
  cardsRef.current = cards

  // Before paint, so the old position never shows for a frame.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new `reset` value re-seats the deck
  useLayoutEffect(() => {
    indexRef.current = 0
    const id = cardsRef.current[0]?.id
    setFront((f) => (f.index === 0 && f.id === id ? f : { index: 0, id }))
    setMoved(false)
    setDrag(0)
  }, [reset])

  const go = useCallback((i: number) => {
    const all = cardsRef.current
    if (all.length === 0) return
    const n = Math.min(all.length - 1, Math.max(0, i))
    if (n === indexRef.current) return
    indexRef.current = n
    setMoved(true)
    setFront({ index: n, id: all[n].id })
  }, [])
  const next = useCallback(() => go(indexRef.current + 1), [go])
  const prev = useCallback(() => go(indexRef.current - 1), [go])

  // The pointer's start and the axis it settled on (x moves the deck,
  // y belongs to the page).
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const axis = useRef<'x' | 'y' | null>(null)
  const pulled = useRef(false)

  const end = useCallback(() => {
    start.current = null
    axis.current = null
    setDrag(0)
  }, [])

  const bind: DeckBind = {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      start.current = { x: e.clientX, y: e.clientY, t: e.timeStamp }
      axis.current = null
      pulled.current = false
    },
    onPointerMove: (e) => {
      const s = start.current
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (!axis.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (axis.current === 'x') e.currentTarget.setPointerCapture?.(e.pointerId)
      }
      if (axis.current !== 'x') return
      pulled.current = true
      const atEnd = (dx > 0 && indexRef.current === 0) || (dx < 0 && indexRef.current >= count - 1)
      setDrag(atEnd ? dx * RESIST : dx)
    },
    onPointerUp: (e) => {
      const s = start.current
      if (s && axis.current === 'x') {
        const dx = e.clientX - s.x
        const v = dx / Math.max(1, e.timeStamp - s.t)
        if (dx < -SWIPE || v < -FLICK) next()
        else if (dx > SWIPE || v > FLICK) prev()
      }
      end()
    },
    onPointerCancel: end,
    onClickCapture: (e) => {
      // A pull is not a press: the card it started on keeps still.
      if (!pulled.current) return
      pulled.current = false
      e.preventDefault()
      e.stopPropagation()
    },
  }

  return { index, count, moved, go, next, prev, drag, bind }
}

/** Inline transform for a held card: the front one follows the finger. */
export function dragStyle(pos: CardPos, drag: number): { transform: string } | undefined {
  if (pos !== 'front' || drag === 0) return undefined
  return { transform: `translateX(${drag}px) rotate(${(drag * 0.025).toFixed(2)}deg)` }
}
