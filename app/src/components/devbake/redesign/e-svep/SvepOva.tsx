// Svep · Öva. Practice starts with one decision: a deck of three task
// cards — the suggestion (the section the estimates call weakest, with the
// evidence for it), mixed practice and Repetera — beside every section as a
// small door card that starts its drill at once, no start card between.
// The repetition pile has a door of its own (what is ready now, then
// today's whole pile), and the common traps are a short list to practise
// on. Only the suggestion's button is filled: the one raspberry action.
//
// Desktop: the orientation to the left (the page, Repetera's door, the
// traps), the deck in the middle with its counter, the section doors and
// the deck's register to the right. Phone: the doors above, Repetera's
// door, then the deck and its counter; the traps below the fold.
//
// Kit v2: everything is the view model's Öva (useDirectionData().data.ova)
// and every start is a request (actions.startDrill, actions.openRepetera):
// the bake-off maps them onto its screens, the real app onto its routes.
// Without enough answers there is no suggestion: the deck starts at Blandat.

import { ArrowRight, ChevronRight } from 'lucide-react'
import { type CSSProperties, useId, useLayoutEffect, useMemo } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtScore, useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  OvaSectionView,
  OvaView,
  TrapView,
} from '@/components/devbake/redesign/viewModel'
import { useDeck } from './deck'
import {
  type DeckCard,
  DeckCounter,
  DeckStage,
  DeckTicks,
  Kbd,
  SecChip,
  sectionKey,
  sectionTint,
  type Tint,
} from './parts'

/** The top of HP's scale. */
const SCALE_MAX = 2

type OvaCard = DeckCard & {
  /** What Enter does while the card is in front. */
  action: () => void
  /** The register's right-hand figure. */
  meta: string
}

/** "8 redo nu", or the calm word for none. */
const readyNow = (n: number) => (n > 0 ? `${n} redo nu` : 'Inget redo just nu')

export function SvepOva({
  width,
  live,
  onTint,
}: {
  width: WidthKey
  live: boolean
  onTint: (t: Tint) => void
}) {
  const { data, actions } = useDirectionData()
  const ova = data.ova
  const phone = width === 'phone'
  const cards = useMemo(
    () => ovaCards(ova, data.repetera.sessionSize, actions),
    [ova, data.repetera.sessionSize, actions],
  )
  // Blandat and Repetera are always dealt; the suggestion comes and goes
  // with the estimates, and the card in front stays in front when it does.
  const deck = useDeck(cards)
  const front = cards[deck.index]

  const tint = front.tint ?? 'none'
  useLayoutEffect(() => onTint(tint), [tint, onTint])

  // As on Idag: ←/→ move the deck and are left to the bake-off's screen
  // keys at its ends; Enter takes the card in front.
  useKeyMap(
    {
      ...(deck.index > 0 ? { ArrowLeft: deck.prev } : {}),
      ...(deck.index < cards.length - 1 ? { ArrowRight: deck.next } : {}),
      Home: () => deck.go(0),
      End: () => deck.go(cards.length - 1),
      Enter: front.action,
    },
    live,
  )

  const stage = (
    <DeckStage
      deck={deck}
      cards={cards}
      label={`Öva, ${cards.length} kort`}
      kind="ova"
      live={live}
    />
  )
  const doors = <SectionDoors ova={ova} actions={actions} />
  const repetera = <RepeteraDoor ova={ova} onOpen={actions.openRepetera} />
  const traps = <Traps traps={ova.weakTraps} actions={actions} />

  if (phone) {
    return (
      <div className="sv-pova">
        <header className="sv-pova-head">
          <h1 className="sv-greet">Öva</h1>
        </header>
        {doors}
        {repetera}
        <div className="sv-ova-deck">{stage}</div>
        <div className="sv-phome-foot">
          <DeckCounter deck={deck} cards={cards} arrows={false} />
          <DeckTicks deck={deck} cards={cards} label="Kortregister" />
        </div>
        {traps}
      </div>
    )
  }

  return (
    <div className="sv-ova">
      <aside className="sv-ova-side" aria-label="Öva">
        <h1 className="sv-greet">Öva</h1>
        <p className="sv-day">
          Ett kort i taget. Förslaget ligger överst, alla delprov till höger.
        </p>
        {repetera}
        {traps}
      </aside>
      <div className="sv-home-deck">
        {stage}
        <DeckCounter deck={deck} cards={cards} />
        <p className="sv-deck-hint">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> bläddrar · <Kbd>↵</Kbd> startar kortet
        </p>
      </div>
      <div className="sv-ova-end">
        {doors}
        <nav className="sv-index sv-ova-register" aria-label="Kortregister">
          <p className="sv-index-head">
            I leken <span>· {cards.length} kort</span>
          </p>
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
                  <span className="sv-index-meta">{c.meta}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}

// ── The deck ─────────────────────────────────────────────────────────

function ovaCards(ova: OvaView, sessionSize: number, actions: DirectionActions): OvaCard[] {
  const out: OvaCard[] = []
  const rec = ova.weakest ? ova.sections.find((s) => s.section === ova.weakest) : undefined
  if (rec) {
    const start = () => actions.startDrill({ kind: 'section', section: rec.section })
    out.push({
      id: 'forslag',
      label: `Öva ${rec.section}`,
      tint: sectionTint(rec.section),
      meta: rec.score == null ? 'förslag' : fmtScore(rec.score),
      action: start,
      body: <SuggestionCard s={rec} onStart={start} />,
    })
  }
  const mixed = () => actions.startDrill({ kind: 'mixed' })
  out.push({
    id: 'blandat',
    label: 'Blandat',
    tint: 'none',
    meta: `${ova.mixed.questions} frågor`,
    action: mixed,
    // Without a suggestion, mixed practice leads: its button is the filled one.
    body: <MixedCard n={ova.mixed.questions} lead={!rec} onStart={mixed} />,
  })
  out.push({
    id: 'repetera',
    label: 'Repetera',
    tint: 'rep',
    meta: ova.repetera.dueNow > 0 ? `${ova.repetera.dueNow} nu` : 'inget nu',
    action: actions.openRepetera,
    body: <RepeteraCard ova={ova} sessionSize={sessionSize} onOpen={actions.openRepetera} />,
  })
  return out
}

/** 1.25 → "1,25": a range keeps its two decimals. */
const fmtRange = (v: number) => v.toFixed(2).replace('.', ',')

function SuggestionCard({ s, onStart }: { s: OvaSectionView; onStart: () => void }) {
  return (
    <>
      <div className="sv-hc-top">
        <SecChip section={s.section} />
        <span className="sv-hc-eyebrow">Förslag · ditt svagaste delprov just nu</span>
      </div>
      <div className="sv-hc-body">
        <h2 className="sv-hc-title">{s.name}</h2>
        {s.score == null ? null : <SectionScale score={s.score} band={s.band ?? null} />}
      </div>
      <p className="sv-hc-why">
        {s.attempts90d > 0
          ? `Skattningen bygger på ${s.attempts90d} svar de senaste 90 dagarna.`
          : 'Du har inte övat det här delprovet än.'}
      </p>
      <div className="sv-hc-foot">
        <button
          type="button"
          className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
          onClick={onStart}
        >
          Öva {s.section}
          <Kbd>↵</Kbd>
        </button>
      </div>
    </>
  )
}

/** The section's estimate on the 0–2,0 scale: a mark, and its band. */
function SectionScale({ score, band }: { score: number; band: number | null }) {
  const pct = (v: number) => `${(Math.min(SCALE_MAX, Math.max(0, v)) / SCALE_MAX) * 100}%`
  const low = band ? Math.max(0, score - band) : null
  const high = band ? Math.min(SCALE_MAX, score + band) : null
  const range = low != null && high != null ? `${fmtRange(low)}–${fmtRange(high)}` : null
  return (
    <div className="sv-ova-figure">
      <p className="sv-ova-score">
        <span className="sv-ova-score-n">{fmtScore(score)}</span>
        <span className="sv-ova-score-of">skattning av {fmtScore(SCALE_MAX)}</span>
      </p>
      {/* A phone card has room for the range in words, not the scale. */}
      {range ? <p className="sv-ova-range">Troligt {range}</p> : null}
      <div
        className="sv-scale"
        role="img"
        aria-label={
          range
            ? `Skattning ${fmtScore(score)}, troligen ${range}, på skalan 0 till ${fmtScore(SCALE_MAX)}.`
            : `Skattning ${fmtScore(score)} på skalan 0 till ${fmtScore(SCALE_MAX)}.`
        }
      >
        {range && low != null && high != null ? (
          <span className="sv-scale-label" aria-hidden style={{ left: pct(high) }}>
            Troligt {range}
          </span>
        ) : null}
        <span className="sv-scale-axis" aria-hidden />
        {low != null && high != null ? (
          <span
            className="sv-scale-range"
            aria-hidden
            style={{ left: pct(low), width: pct(high - low) }}
          />
        ) : null}
        <span className="sv-scale-mark" aria-hidden style={{ left: pct(score) }} />
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <span key={v} className="sv-scale-tick" aria-hidden style={{ left: pct(v) }}>
            {v === 0 ? '0' : fmtScore(v)}
          </span>
        ))}
      </div>
    </div>
  )
}

function MixedCard({ n, lead, onStart }: { n: number; lead: boolean; onStart: () => void }) {
  return (
    <>
      <div className="sv-hc-top">
        <SecChip section={null} />
        <span className="sv-hc-eyebrow">Blandad övning</span>
        <span className="sv-hc-meta">{n}&nbsp;frågor</span>
      </div>
      <div className="sv-hc-body">
        <h2 className="sv-hc-title">Blandat</h2>
        <p className="sv-hc-detail">Frågor från alla åtta delprov, ett i taget.</p>
        <span className="sv-marks" role="img" aria-label={`${n} frågor`}>
          {Array.from({ length: n }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length marks
            <i key={i} />
          ))}
        </span>
      </div>
      <p className="sv-hc-why">Bra när du vill hålla allt varmt utan att välja delprov.</p>
      <div className="sv-hc-foot">
        <button
          type="button"
          className={`sv-btn ${lead ? 'sv-btn--primary' : 'sv-btn--tonal'} sv-btn--block`}
          data-testid="rd-ova-mixed"
          onClick={onStart}
        >
          Starta blandad övning
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}

function RepeteraCard({
  ova,
  sessionSize,
  onOpen,
}: {
  ova: OvaView
  sessionSize: number
  onOpen: () => void
}) {
  const { dueNow, pile } = ova.repetera
  const fan = Math.min(dueNow, sessionSize)
  return (
    <>
      <div className="sv-hc-top">
        <SecChip section={null} label="Repetition" />
        <span className="sv-hc-eyebrow">Dina missar</span>
        <span className="sv-hc-meta">{pile}&nbsp;i dagens hög</span>
      </div>
      <div className="sv-hc-body">
        <h2 className="sv-hc-title">Repetera</h2>
        <p className="sv-hc-detail">{readyNow(dueNow)}</p>
        {fan > 0 ? (
          <span className="sv-fan" role="img" aria-label={`${fan} kort redo att repeteras`}>
            {Array.from({ length: fan }, (_, i) => (
              <i
                // biome-ignore lint/suspicious/noArrayIndexKey: a fixed fan of cards
                key={i}
                style={{ '--i': i - (fan - 1) / 2 } as CSSProperties}
              />
            ))}
          </span>
        ) : null}
      </div>
      <p className="sv-hc-why">
        {pile === 0
          ? 'Inga missar än. Missar du en fråga läggs den här.'
          : `Högst ${sessionSize} frågor i en omgång, de som väntat längst först.`}
      </p>
      <div className="sv-hc-foot">
        <button type="button" className="sv-btn sv-btn--tonal sv-btn--block" onClick={onOpen}>
          Till Repetera
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}

// ── Beside the deck ──────────────────────────────────────────────────

/**
 * Every section as a small door card in the exam's order: its code, its
 * estimate and the misses waiting in it. The weakest carries an index tab.
 * A door starts its section's drill directly; it never moves the deck.
 */
function SectionDoors({ ova, actions }: { ova: OvaView; actions: DirectionActions }) {
  const headId = useId()
  return (
    <section className="sv-sdoors" aria-labelledby={headId}>
      <h2 className="sv-index-head" id={headId}>
        Alla delprov <span>· starta direkt</span>
      </h2>
      <ul className="sv-sdoors-grid">
        {ova.sections.map((s) => {
          const weakest = s.section === ova.weakest
          return (
            <li key={s.section}>
              <button
                type="button"
                className="sv-sdoor"
                data-testid={`rd-ova-section-${sectionKey(s.section)}`}
                data-sec={sectionTint(s.section)}
                data-weakest={weakest ? 'true' : undefined}
                onClick={() => actions.startDrill({ kind: 'section', section: s.section })}
              >
                {/* Read as "XYZ, Matematisk problemlösning, skattning 1,2,
                 *  5 väntar, svagast": the parts are said apart. */}
                <span className="sv-sdoor-code">{s.section}</span>
                <span className="sv-sr">, {s.name}</span>
                {s.score == null ? null : (
                  <span className="sv-sdoor-score">
                    <span className="sv-sr">, skattning </span>
                    {fmtScore(s.score)}
                  </span>
                )}
                <span className="sv-sdoor-wait">
                  <span className="sv-sr">, </span>
                  {s.waiting > 0 ? `${s.waiting} väntar` : 'Inga missar'}
                </span>
                {weakest ? (
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

/** Repetera's own door: what is ready now, then today's whole pile. It
 *  stays when nothing is ready. */
function RepeteraDoor({ ova, onOpen }: { ova: OvaView; onOpen: () => void }) {
  const { dueNow, pile } = ova.repetera
  return (
    <button type="button" className="sv-repdoor" data-testid="rd-ova-repetera" onClick={onOpen}>
      <span className="sv-repdoor-fan" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="sv-repdoor-text">
        <b>Repetera</b>
        <span>
          {readyNow(dueNow)}
          {pile > dueNow ? ` · ${pile} i dagens hög` : ''}
        </span>
      </span>
      <ChevronRight size={20} strokeWidth={2} aria-hidden />
    </button>
  )
}

/** The traps behind most misses: each opens practice on its own type. */
function Traps({ traps, actions }: { traps: TrapView[]; actions: DirectionActions }) {
  const headId = useId()
  if (traps.length === 0) return null
  return (
    <section className="sv-traps" aria-labelledby={headId}>
      <h2 className="sv-index-group" id={headId}>
        Vanliga fällor
      </h2>
      <ul>
        {traps.slice(0, 3).map((t) => (
          <li key={t.frameworkId}>
            <button
              type="button"
              className="sv-traprow"
              onClick={() =>
                actions.startDrill({
                  kind: 'framework',
                  frameworkId: t.frameworkId,
                  section: t.section,
                })
              }
            >
              <span className="sv-sr">Öva på fällan: </span>
              <span className="sv-traprow-pattern">{t.pattern ?? t.name}</span>
              <span className="sv-traprow-meta">
                <SecChip section={t.section} />
                <span>
                  {t.count}&nbsp;{t.count === 1 ? 'gång' : 'gånger'}
                  {t.rising ? ' · ökar' : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
