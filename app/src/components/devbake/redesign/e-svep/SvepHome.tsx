// Svep · Idag. The day is a deck of seven cards and only the top one asks
// for anything: "Fortsätt" (the text you are in the middle of, with the
// screen's one filled button), then the plan's three parts, then three
// cards that tell you where you stand — the prognosis with its caveat, the
// trap that matters now and the recent passes. Swipe, ←/→ (which hand over
// to the bake-off's screen keys at either end of the deck), the arrows or
// the index move it; Enter takes the card in front.
//
// Desktop: the deck sits centred with the next cards' edges peeking to the
// right; the day (date, greeting, countdown) stands to the left and the
// index of the deck — the overview — to the right. Phone: the greeting
// above, the deck, then the counter and the index as a row of small cards.

import { ArrowRight } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useId, useMemo } from 'react'

import {
  ESTIMATE_CAVEAT,
  EXAM,
  PLAN,
  type PlanItem,
  PROGNOSIS,
  RECENT,
  RESUME,
  TODAY,
  TRAPS,
  UNIT,
  WEEK,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type Destination,
  fmtDelta,
  fmtScore,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { useDeck } from './deck'
import { type DeckCard, DeckCounter, DeckStage, DeckTicks, Kbd, type Tint } from './parts'

const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)

const DEVICE_DEFINITE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

const PLAN_DEST: Record<PlanItem['kind'], Destination> = {
  repetition: 'ova',
  lektion: 'uppslag',
  övning: 'ova',
}

const PLAN_VERB: Record<PlanItem['kind'], string> = {
  repetition: 'Starta repetitionen',
  lektion: 'Öppna lektionen',
  övning: 'Starta övningen',
}

const SECTION_TINT: Record<string, Tint> = { LÄS: 'las', ELF: 'elf', ORD: 'ord' }

/** The day in one line: how many things and how long, then where to start. */
function daySentence(): string {
  const things = 1 + PLAN.items.length
  const minutes = PLAN.minutes + RESUME.minutesLeft
  return `${cap(WORDS[things] ?? String(things))} saker idag, ungefär ${minutes} minuter. Börja med kortet överst.`
}

type HomeCard = DeckCard & {
  /** What Enter does while the card is in front. */
  action: () => void
  /** The index's right-hand figure. */
  meta: string
  group: 'todo' | 'status'
}

export function SvepHome({
  width,
  live,
  onResume,
  onGo,
  onTint,
}: {
  width: WidthKey
  live: boolean
  onResume: () => void
  onGo: (d: Destination) => void
  onTint: (t: Tint) => void
}) {
  const phone = width === 'phone'
  const caveatId = useId()
  const cards = useMemo(() => homeCards({ onResume, onGo, caveatId }), [onResume, onGo, caveatId])
  const deck = useDeck(cards.length)
  const front = cards[deck.index]

  const tint = front.tint ?? 'none'
  useEffect(() => onTint(tint), [tint, onTint])

  // ←/→ move the deck; at either end they are left to the bake-off's
  // screen keys. Enter takes the card in front.
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
      label={`Idag, ${cards.length} kort`}
      kind="home"
      live={live}
    />
  )

  if (phone) {
    return (
      <div className="sv-phome">
        <header className="sv-phome-head">
          <p className="sv-date">
            {TODAY.dateLabel} · <b>{EXAM.daysLeft}&nbsp;dagar kvar</b>
          </p>
          <h1 className="sv-greet">{TODAY.greeting}</h1>
          <p className="sv-day">{daySentence()}</p>
        </header>
        <div className="sv-home-deck">{stage}</div>
        <div className="sv-phome-foot">
          <DeckCounter deck={deck} cards={cards} arrows={false} />
          <DeckTicks deck={deck} cards={cards} label="Kortregister" />
        </div>
      </div>
    )
  }

  const todo = cards.filter((c) => c.group === 'todo')
  const status = cards.filter((c) => c.group === 'status')
  const indexRow = (c: HomeCard) => {
    const i = cards.indexOf(c)
    return (
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
    )
  }

  return (
    <div className="sv-home">
      <aside className="sv-home-day" aria-label="Dagen">
        <p className="sv-date">{TODAY.dateLabel}</p>
        <h1 className="sv-greet">{TODAY.greeting}.</h1>
        <p className="sv-day">{daySentence()}</p>
        <p className="sv-countdown">
          <span className="sv-countdown-n">{EXAM.daysLeft}</span>
          <span>
            dagar kvar till högskoleprovet,
            <br />
            {EXAM.dateLabel.replace(/(\d+) /, '$1 ')}
          </span>
        </p>
      </aside>
      <div className="sv-home-deck">
        {stage}
        <DeckCounter deck={deck} cards={cards} />
        <p className="sv-deck-hint">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> bläddrar · <Kbd>↵</Kbd> öppnar kortet
        </p>
      </div>
      <nav className="sv-index" aria-label="Kortregister">
        <p className="sv-index-head">
          I leken <span>· {cards.length} kort</span>
        </p>
        <p className="sv-index-group">Att göra · {PLAN.minutes + RESUME.minutesLeft} min</p>
        <ol>{todo.map(indexRow)}</ol>
        <p className="sv-index-group">Läget</p>
        <ol>{status.map(indexRow)}</ol>
      </nav>
    </div>
  )
}

// ── The cards ──────────────────────────────────────────────────────────

function homeCards({
  onResume,
  onGo,
  caveatId,
}: {
  onResume: () => void
  onGo: (d: Destination) => void
  caveatId: string
}): HomeCard[] {
  const trap = TRAPS.find((t) => t.rising) ?? TRAPS[0]
  const plan: HomeCard[] = PLAN.items.map((item, i) => ({
    id: item.id,
    label: item.title,
    tint: item.section ? (SECTION_TINT[item.section] ?? 'none') : 'rep',
    group: 'todo',
    meta: `${item.minutes} min`,
    action: () => onGo(PLAN_DEST[item.kind]),
    body: <PlanCard item={item} n={i + 1} onStart={() => onGo(PLAN_DEST[item.kind])} />,
  }))
  return [
    {
      id: 'resume',
      label: 'Fortsätt',
      tint: 'las',
      group: 'todo',
      meta: `${RESUME.minutesLeft} min`,
      action: onResume,
      body: <ResumeCard onResume={onResume} />,
    },
    ...plan,
    {
      id: 'prognos',
      label: 'Prognos',
      tint: 'none',
      group: 'status',
      dot: true,
      meta: fmtScore(PROGNOSIS.total),
      action: () => onGo('framsteg'),
      body: <PrognosisCard caveatId={caveatId} onMore={() => onGo('framsteg')} />,
    },
    {
      id: 'trap',
      label: 'Fälla',
      tint: SECTION_TINT[trap.section] ?? 'none',
      group: 'status',
      dot: true,
      meta: `${trap.count} ggr`,
      action: () => onGo('ova'),
      body: <TrapCard onMore={() => onGo('ova')} />,
    },
    {
      id: 'recent',
      label: 'Senaste passen',
      tint: 'none',
      group: 'status',
      dot: true,
      meta: `${RECENT.length} pass`,
      action: () => onGo('framsteg'),
      body: <RecentCard onMore={() => onGo('framsteg')} />,
    },
  ]
}

function CardTop({ sec, eyebrow, meta }: { sec?: string; eyebrow: string; meta?: ReactNode }) {
  return (
    <div className="sv-hc-top">
      {sec ? (
        <span className="sv-sec" data-sec={SECTION_TINT[sec] ?? 'rep'}>
          {sec}
        </span>
      ) : null}
      <span className="sv-hc-eyebrow">{eyebrow}</span>
      {meta ? <span className="sv-hc-meta">{meta}</span> : null}
    </div>
  )
}

function ResumeCard({ onResume }: { onResume: () => void }) {
  const paused = RESUME.pausedAt.replace('Idag · ', 'idag ')
  // The question waiting where you stopped, in the text's own face.
  const waiting = UNIT.questions[RESUME.position - 1]
  return (
    <>
      <CardTop
        eyebrow={`Pausad ${paused} på ${DEVICE_DEFINITE[RESUME.device] ?? RESUME.device}`}
        meta={`ca ${RESUME.minutesLeft} min kvar`}
      />
      <div className="sv-hc-body">
        <p className="sv-hc-kicker">
          Fortsätt: {RESUME.section} · fråga {RESUME.position} av {RESUME.total}
        </p>
        <h2 className="sv-hc-title sv-hc-title--lead">{RESUME.title}</h2>
        <p className="sv-hc-sub">{RESUME.subtitle}</p>
        <UnitHand />
        {waiting ? (
          <p className="sv-hc-next">
            <span className="sv-hc-next-label">Där du slutade</span>
            <span className="sv-hc-next-q">{waiting.prompt}</span>
          </p>
        ) : null}
      </div>
      <div className="sv-hc-foot">
        <button
          type="button"
          className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
          data-testid="rd-resume"
          onClick={onResume}
        >
          Fortsätt läsa
          <Kbd>↵</Kbd>
        </button>
      </div>
    </>
  )
}

/** The text's questions as a small hand: the ones answered lie face down
 *  (no verdicts on Idag), the one you stopped at stands up, the rest wait. */
function UnitHand() {
  return (
    <span
      className="sv-unit"
      role="img"
      aria-label={`Fråga ${RESUME.position} av ${RESUME.total}, ${RESUME.answered} besvarade`}
    >
      {Array.from({ length: RESUME.total }, (_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: one card per question of the unit
          key={i}
          data-state={i === RESUME.position - 1 ? 'now' : i < RESUME.answered ? 'done' : 'todo'}
          style={{ '--i': i - (RESUME.total - 1) / 2 } as CSSProperties}
        >
          {i < RESUME.answered ? null : i + 1}
        </i>
      ))}
    </span>
  )
}

function PlanCard({ item, n, onStart }: { item: PlanItem; n: number; onStart: () => void }) {
  return (
    <>
      <CardTop
        sec={item.section ?? 'Alla delprov'}
        eyebrow={
          item.primary ? 'Sedan · först i planen' : `Planen · del ${n} av ${PLAN.items.length}`
        }
        meta={`${item.minutes} min`}
      />
      <div className="sv-hc-body">
        <h2 className="sv-hc-title">{item.title}</h2>
        <p className="sv-hc-detail">{item.detail}</p>
        <PlanFigure item={item} />
      </div>
      <p className="sv-hc-why">{item.rationale}</p>
      <div className="sv-hc-foot">
        <button type="button" className="sv-btn sv-btn--tonal sv-btn--block" onClick={onStart}>
          {PLAN_VERB[item.kind]}
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}

/** Each plan card's one small figure: the misses as a fan of cards, the
 *  round's questions as marks. */
function PlanFigure({ item }: { item: PlanItem }) {
  if (item.kind === 'repetition') {
    const n = Number.parseInt(item.detail, 10) || 0
    return (
      <span className="sv-fan" role="img" aria-label={`${n} kort att repetera`}>
        {Array.from({ length: n }, (_, i) => (
          <i
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed fan of cards
            key={i}
            style={{ '--i': i - (n - 1) / 2 } as CSSProperties}
          />
        ))}
      </span>
    )
  }
  if (item.kind === 'övning') {
    const n = Number.parseInt(item.detail, 10) || 0
    return (
      <span className="sv-marks" role="img" aria-label={`${n} frågor`}>
        {Array.from({ length: n }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length marks
          <i key={i} />
        ))}
      </span>
    )
  }
  return null
}

function PrognosisCard({ caveatId, onMore }: { caveatId: string; onMore: () => void }) {
  return (
    <>
      <CardTop eyebrow="Prognos · hela provet" meta={`Mål ${fmtScore(PROGNOSIS.target)}`} />
      <div className="sv-hc-body">
        <div className="sv-prog-row">
          <p className="sv-prog">
            <span className="sv-prog-n" aria-describedby={caveatId}>
              {fmtScore(PROGNOSIS.total)}
              <sup aria-hidden>*</sup>
            </span>
            <span className="sv-prog-of">av {fmtScore(PROGNOSIS.target)}</span>
          </p>
          <Weeks />
        </div>
        <p className="sv-prog-halves">
          <b>{fmtDelta(PROGNOSIS.delta)}</b> sedan förra veckan · Verbal{' '}
          {fmtScore(PROGNOSIS.verbal)} · Kvant {fmtScore(PROGNOSIS.quant)}
        </p>
        <Scale />
      </div>
      <p className="sv-caveat" id={caveatId}>
        <b aria-hidden>*</b>
        <span>{ESTIMATE_CAVEAT}</span>
      </p>
      <div className="sv-hc-foot">
        <button type="button" className="sv-btn sv-btn--quiet sv-btn--block" onClick={onMore}>
          Prognosen i Framsteg
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}

/** The last weeks' estimates as bars on the same 0–2,0 scale (no cropped
 *  axis): the honest rise, this week's bar in the accent. */
function Weeks() {
  const w = PROGNOSIS.weeks
  const n = cap(WORDS[w.length] ?? String(w.length))
  const from = fmtScore(w[0])
  const to = fmtScore(w[w.length - 1])
  return (
    <figure className="sv-weeks">
      <span
        className="sv-weeks-bars"
        role="img"
        aria-label={`Prognosen de senaste ${n.toLowerCase()} veckorna, från ${from} till ${to}`}
      >
        {w.map((v, i) => (
          <i
            // biome-ignore lint/suspicious/noArrayIndexKey: one bar per week, oldest first
            key={i}
            style={{ height: `${(v / PROGNOSIS.target) * 100}%` }}
            data-last={String(i === w.length - 1)}
          />
        ))}
      </span>
      <figcaption aria-hidden>
        {n} veckor · {from} → {to}
      </figcaption>
    </figure>
  )
}

/** 1.25 → "1,25": the range keeps its two decimals (one would round it). */
const fmtRange = (v: number) => v.toFixed(2).replace('.', ',')

/** The 0–2,0 scale: the likely range as a band, the estimate as a mark. */
function Scale() {
  const pct = (v: number) => `${(v / PROGNOSIS.target) * 100}%`
  const range = `${fmtRange(PROGNOSIS.low)}–${fmtRange(PROGNOSIS.high)}`
  return (
    <div
      className="sv-scale"
      role="img"
      aria-label={`Trolig nivå ${range} på skalan 0 till ${fmtScore(PROGNOSIS.target)}.`}
    >
      <span className="sv-scale-label" aria-hidden style={{ left: pct(PROGNOSIS.high) }}>
        Troligt {range}
      </span>
      <span className="sv-scale-axis" aria-hidden />
      <span
        className="sv-scale-range"
        aria-hidden
        style={{ left: pct(PROGNOSIS.low), width: pct(PROGNOSIS.high - PROGNOSIS.low) }}
      />
      <span className="sv-scale-mark" aria-hidden style={{ left: pct(PROGNOSIS.total) }} />
      {[0, 0.5, 1, 1.5, 2].map((v) => (
        <span key={v} className="sv-scale-tick" aria-hidden style={{ left: pct(v) }}>
          {v === 0 ? '0' : fmtScore(v)}
        </span>
      ))}
    </div>
  )
}

function TrapCard({ onMore }: { onMore: () => void }) {
  const trap = TRAPS.find((t) => t.rising) ?? TRAPS[0]
  const more = TRAPS.length - 1
  return (
    <>
      <CardTop sec={trap.section} eyebrow="Din vanligaste fälla just nu" />
      <div className="sv-hc-body">
        <h2 className="sv-hc-title sv-hc-title--trap">{trap.pattern}</h2>
        <p className="sv-hc-detail">{trap.name}</p>
        <p className="sv-trap-count">
          <b>{trap.count} gånger</b>
          {trap.rising ? (
            <span className="sv-trap-rise">
              <span aria-hidden>↑</span> ökar
            </span>
          ) : null}
        </p>
      </div>
      <p className="sv-hc-why">{cap(WORDS[more] ?? String(more))} fällor till väntar i Framsteg.</p>
      {/* The card's action does something about the trap, not only shows it. */}
      <div className="sv-hc-foot">
        <button type="button" className="sv-btn sv-btn--tonal sv-btn--block" onClick={onMore}>
          Öva på fällan
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}

function RecentCard({ onMore }: { onMore: () => void }) {
  return (
    <>
      <CardTop eyebrow="Senaste passen" meta={`${WEEK.minutesToday} min idag`} />
      <div className="sv-hc-body">
        <ul className="sv-recent">
          {RECENT.map((r) => (
            <li key={r.id}>
              <span className="sv-recent-name">{r.label}</span>
              <span
                className="sv-recent-bar"
                role="img"
                aria-label={`${r.correct} av ${r.total} rätt`}
              >
                <i style={{ width: `${(r.correct / r.total) * 100}%` }} />
              </span>
              <span className="sv-recent-score" aria-hidden>
                {r.correct}/{r.total}
              </span>
              <span className="sv-recent-when">{r.when}</span>
            </li>
          ))}
        </ul>
        <div className="sv-week">
          <span className="sv-week-days" aria-hidden>
            {Array.from({ length: WEEK.goal }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: one mark per goal day
              <i key={i} data-on={String(i < WEEK.daysPractised)} />
            ))}
          </span>
          <span>
            {cap(WORDS[WEEK.daysPractised] ?? String(WEEK.daysPractised))} av{' '}
            {WORDS[WEEK.goal] ?? WEEK.goal} dagar den här veckan
          </span>
        </div>
      </div>
      <div className="sv-hc-foot">
        <button type="button" className="sv-btn sv-btn--quiet sv-btn--block" onClick={onMore}>
          Alla pass i Framsteg
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}
