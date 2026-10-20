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
//
// Kit v2: the day is the view model's (useDirectionData().data.home). The
// fields the real app has no source for (when and where the sitting was
// paused, its minutes left, the plan's primary marker, the prognosis range,
// target and weekly series, the weekly goal) are left out when absent. A
// day with nothing on it at all is one calm card, the way to Öva. A part of
// the plan already done says so and offers nothing to start; with every
// part done and nothing to resume, the deck opens on "Dagens plan är klar."

import { ArrowRight, Check } from 'lucide-react'
import { type CSSProperties, type ReactNode, useId, useLayoutEffect, useMemo } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtDelta, fmtScore, useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  DrillSessionView,
  HomeView,
  PlanItemKind,
  PlanItemView,
  PrognosisView,
  RecentPassView,
  ResumeView,
  TrapView,
  WeekView,
} from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { useDeck } from './deck'
import {
  cap,
  type DeckCard,
  DeckCounter,
  DeckStage,
  DeckTicks,
  Kbd,
  SCALE_MAX,
  Scale,
  SecChip,
  sectionTint,
  type Tint,
  word,
} from './parts'
import type { FrameNav } from './Svep'

const DEVICE_DEFINITE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

// A mock item opens the Provpass hub, where a pass is prepared and then
// confirmed: its button says so (it never starts a clock by itself).
const PLAN_VERB: Record<PlanItemKind, string> = {
  repetition: 'Starta repetitionen',
  lesson: 'Öppna lektionen',
  drill: 'Starta övningen',
  mock: 'Förbered provpasset',
}

/** The plan's parts still to do. A finished part is never offered again. */
function openItems(home: HomeView): PlanItemView[] {
  return home.plan.items.filter((i) => !i.completed)
}

/** Every part of today's plan done (and there was a plan). */
function planDone(home: HomeView): boolean {
  return home.plan.items.length > 0 && openItems(home).length === 0
}

/** The minutes the plan's open parts take: the plan's own estimate while
 *  nothing is done, else the parts left. */
function planMinutes(home: HomeView): number {
  const open = openItems(home)
  return open.length === home.plan.items.length
    ? home.plan.minutes
    : open.reduce((sum, i) => sum + i.minutes, 0)
}

/** The minutes the day's to-dos take, or null when the resume's are not
 *  known (never a sum that leaves a part out). */
function dayMinutes(home: HomeView): number | null {
  if (!home.resume) return planMinutes(home)
  return home.resume.minutesLeft == null ? null : planMinutes(home) + home.resume.minutesLeft
}

/** The day's to-dos: the sitting to resume and the plan's open parts. */
function dayCount(home: HomeView): number {
  return (home.resume ? 1 : 0) + openItems(home).length
}

/** The day in one line: how many things and how long, then where to start. */
function daySentence(home: HomeView): string {
  const things = dayCount(home)
  if (things === 0) return planDone(home) ? 'Dagens plan är klar.' : 'Inget inplanerat idag.'
  const minutes = dayMinutes(home)
  const long = minutes == null ? '' : `, ungefär ${minutes} minuter`
  return `${cap(word(things))} ${things === 1 ? 'sak' : 'saker'} idag${long}. Börja med kortet överst.`
}

type HomeCard = DeckCard & {
  /** What Enter does while the card is in front; null on a part already
   *  done (nothing to take). */
  action: (() => void) | null
  /** The index's right-hand figure. */
  meta: string
  group: 'todo' | 'status'
}

export function SvepHome({
  width,
  live,
  onResume,
  nav,
  onTint,
}: {
  width: WidthKey
  live: boolean
  onResume: () => void
  nav: FrameNav
  onTint: (t: Tint) => void
}) {
  const { data } = useDirectionData()
  const home = data.home
  const phone = width === 'phone'
  const caveatId = useId()
  const reading = data.drills.reading
  const cards = useMemo(
    () => homeCards({ home, reading, onResume, nav, caveatId }),
    [home, reading, onResume, nav, caveatId],
  )
  // Never empty (an empty day has its own card), and the deck keeps its
  // place inside the cards as the data changes.
  const deck = useDeck(cards)
  const front = cards[deck.index]

  const tint = front.tint ?? 'none'
  useLayoutEffect(() => onTint(tint), [tint, onTint])

  // ←/→ move the deck; at either end they are left to the bake-off's
  // screen keys. Enter takes the card in front.
  useKeyMap(
    {
      ...(deck.index > 0 ? { ArrowLeft: deck.prev } : {}),
      ...(deck.index < cards.length - 1 ? { ArrowRight: deck.next } : {}),
      Home: () => deck.go(0),
      End: () => deck.go(cards.length - 1),
      ...(front.action ? { Enter: front.action } : {}),
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
  const minutes = dayMinutes(home)

  if (phone) {
    return (
      <div className="sv-phome">
        <header className="sv-phome-head">
          <p className="sv-date">
            {home.today.dateLabel} · <b>{home.exam.daysLeft}&nbsp;dagar kvar</b>
          </p>
          <h1 className="sv-greet">{home.today.greeting}</h1>
          <p className="sv-day">{daySentence(home)}</p>
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
        <p className="sv-date">{home.today.dateLabel}</p>
        <h1 className="sv-greet">{home.today.greeting}.</h1>
        <p className="sv-day">{daySentence(home)}</p>
        <p className="sv-countdown">
          <span className="sv-countdown-n">{home.exam.daysLeft}</span>
          <span>
            dagar kvar till högskoleprovet,
            <br />
            {home.exam.dateLabel.replace(/(\d+) /, '$1 ')}
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
        <p className="sv-index-group">
          Att göra{minutes == null || dayCount(home) === 0 ? '' : ` · ${minutes} min`}
        </p>
        <ol>{todo.map(indexRow)}</ol>
        {status.length ? (
          <>
            <p className="sv-index-group">Läget</p>
            <ol>{status.map(indexRow)}</ol>
          </>
        ) : null}
      </nav>
    </div>
  )
}

// ── The cards ──────────────────────────────────────────────────────────

/** The trap that matters now: a rising one, else the first. */
function leadTrap(traps: TrapView[]): TrapView | undefined {
  return traps.find((t) => t.rising) ?? traps[0]
}

function homeCards({
  home,
  reading,
  onResume,
  nav,
  caveatId,
}: {
  home: HomeView
  reading: DrillSessionView
  onResume: () => void
  nav: FrameNav
  caveatId: string
}): HomeCard[] {
  const out: HomeCard[] = []
  const resume = home.resume
  if (resume) {
    out.push({
      id: 'resume',
      label: 'Fortsätt',
      tint: sectionTint(resume.section),
      group: 'todo',
      meta:
        resume.minutesLeft == null
          ? `${resume.position}/${resume.total}`
          : `${resume.minutesLeft} min`,
      action: onResume,
      body: <ResumeCard resume={resume} reading={reading} onResume={onResume} />,
    })
  }
  // Every part done and nothing to resume: the day says so first, with the
  // way to practise freely as its one filled action.
  if (!resume && planDone(home)) {
    out.push({
      id: 'klar',
      label: 'Planen är klar',
      tint: 'none',
      group: 'todo',
      meta: 'klart',
      action: () => nav.go('ova'),
      body: <PlanDoneCard parts={home.plan.items.length} onOva={() => nav.go('ova')} />,
    })
  }
  // The plan's order is its priority: the open part with the marker leads,
  // else the first open part (the day's one filled action with nothing to
  // resume). A part already done is never the next work: the open parts
  // come first, the done ones after them, each keeping its place number.
  const open = openItems(home)
  const lead = open.find((i) => i.primary) ?? open[0]
  const items = home.plan.items.map((item, i) => ({ item, i }))
  const ordered = [
    ...items.filter(({ item }) => !item.completed),
    ...items.filter(({ item }) => item.completed),
  ]
  for (const { item, i } of ordered) {
    out.push({
      id: item.id,
      label: item.title,
      tint: item.section ? sectionTint(item.section) : item.kind === 'repetition' ? 'rep' : 'none',
      group: 'todo',
      meta: item.completed ? 'klart' : `${item.minutes} min`,
      action: item.completed ? null : () => nav.openPlanItem(item),
      body: (
        <PlanCard
          item={item}
          n={i + 1}
          of={home.plan.items.length}
          lead={item === lead}
          filled={!resume && item === lead}
          onStart={() => nav.openPlanItem(item)}
        />
      ),
    })
  }
  const p = home.prognosis
  if (p.total != null) {
    out.push({
      id: 'prognos',
      label: 'Prognos',
      tint: 'none',
      group: 'status',
      dot: true,
      meta: fmtScore(p.total),
      action: () => nav.framsteg('oversikt'),
      body: (
        <PrognosisCard
          p={p}
          total={p.total}
          caveatId={caveatId}
          onMore={() => nav.framsteg('oversikt')}
        />
      ),
    })
  }
  const trap = leadTrap(home.traps)
  if (trap) {
    out.push({
      id: 'trap',
      label: 'Fälla',
      tint: sectionTint(trap.section),
      group: 'status',
      dot: true,
      meta: `${trap.count} ggr`,
      action: () => nav.go('ova'),
      body: <TrapCard trap={trap} more={home.traps.length - 1} onMore={() => nav.go('ova')} />,
    })
  }
  if (home.recent.length) {
    out.push({
      id: 'recent',
      label: 'Senaste passen',
      tint: 'none',
      group: 'status',
      dot: true,
      meta: `${home.recent.length} pass`,
      // The passes live in Framsteg's Historik: the link opens that card.
      action: () => nav.framsteg('historik'),
      body: (
        <RecentCard recent={home.recent} week={home.week} onMore={() => nav.framsteg('historik')} />
      ),
    })
  }
  if (out.length === 0) {
    // Nothing to resume, plan or tell: the deck still has its one card.
    out.push({
      id: 'empty',
      label: 'Öva fritt',
      tint: 'none',
      group: 'todo',
      meta: '',
      action: () => nav.go('ova'),
      body: <FreeCard onOva={() => nav.go('ova')} />,
    })
  }
  return out
}

function CardTop({
  section,
  sec,
  eyebrow,
  meta,
}: {
  /** A section chip: a section, or null for "Alla delprov". */
  section?: PlanItemView['section']
  /** No chip when false. */
  sec?: boolean
  eyebrow: string
  meta?: ReactNode
}) {
  return (
    <div className="sv-hc-top">
      {sec ? <SecChip section={section ?? null} /> : null}
      <span className="sv-hc-eyebrow">{eyebrow}</span>
      {meta ? <span className="sv-hc-meta">{meta}</span> : null}
    </div>
  )
}

/** "Pausad idag 07:52 på telefonen"; the parts the sitting does not know
 *  are left out. */
function pausedLine(resume: ResumeView): string {
  const when = resume.pausedAt ? ` ${resume.pausedAt.replace('Idag · ', 'idag ')}` : ''
  const where = resume.device ? ` på ${DEVICE_DEFINITE[resume.device] ?? resume.device}` : ''
  return `Pausad${when}${where}`
}

function ResumeCard({
  resume,
  reading,
  onResume,
}: {
  resume: ResumeView
  reading: DrillSessionView
  onResume: () => void
}) {
  // The question waiting where you stopped, in the text's own face: the
  // sitting it reopens is the reading drill's.
  const waiting = reading.questions[resume.position - 1]
  const prompt = waiting?.section === resume.section ? waiting.prompt : null
  return (
    <>
      <CardTop
        eyebrow={pausedLine(resume)}
        meta={resume.minutesLeft == null ? undefined : `ca ${resume.minutesLeft} min kvar`}
      />
      <div className="sv-hc-body">
        <p className="sv-hc-kicker">
          Fortsätt: {resume.section} · fråga {resume.position} av {resume.total}
        </p>
        <h2 className="sv-hc-title sv-hc-title--lead">{resume.title}</h2>
        {resume.subtitle ? <p className="sv-hc-sub">{resume.subtitle}</p> : null}
        <UnitHand resume={resume} />
        {prompt ? (
          <p className="sv-hc-next">
            <span className="sv-hc-next-label">Där du slutade</span>
            <span className="sv-hc-next-q">
              <MathText>{prompt}</MathText>
            </span>
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
function UnitHand({ resume }: { resume: ResumeView }) {
  return (
    <span
      className="sv-unit"
      role="img"
      aria-label={`Fråga ${resume.position} av ${resume.total}, ${resume.answered} besvarade`}
    >
      {Array.from({ length: resume.total }, (_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: one card per question of the unit
          key={i}
          data-state={i === resume.position - 1 ? 'now' : i < resume.answered ? 'done' : 'todo'}
          style={{ '--i': i - (resume.total - 1) / 2 } as CSSProperties}
        >
          {i < resume.answered ? null : i + 1}
        </i>
      ))}
    </span>
  )
}

function PlanCard({
  item,
  n,
  of,
  lead,
  filled,
  onStart,
}: {
  item: PlanItemView
  n: number
  of: number
  /** The item the plan puts first. */
  lead: boolean
  /** The day's one filled action (only with nothing to resume). */
  filled: boolean
  onStart: () => void
}) {
  if (item.completed) {
    // Done: said in a word and a glyph, with nothing left to start.
    return (
      <>
        <CardTop sec section={item.section} eyebrow={`Planen · del ${n} av ${of}`} />
        <div className="sv-hc-body">
          <h2 className="sv-hc-title">{item.title}</h2>
          {item.detail ? <p className="sv-hc-detail">{item.detail}</p> : null}
          <p className="sv-plan-done">
            <Check size={18} strokeWidth={2.5} aria-hidden />
            Klart för idag
          </p>
        </div>
        <p className="sv-hc-why">{item.rationale}</p>
      </>
    )
  }
  return (
    <>
      <CardTop
        sec
        section={item.section}
        eyebrow={lead ? 'Sedan · först i planen' : `Planen · del ${n} av ${of}`}
        meta={`${item.minutes} min`}
      />
      <div className="sv-hc-body">
        <h2 className="sv-hc-title">{item.title}</h2>
        {item.detail ? <p className="sv-hc-detail">{item.detail}</p> : null}
        <PlanFigure item={item} />
      </div>
      <p className="sv-hc-why">{item.rationale}</p>
      <div className="sv-hc-foot">
        <button
          type="button"
          className={`sv-btn ${filled ? 'sv-btn--primary' : 'sv-btn--tonal'} sv-btn--block`}
          onClick={onStart}
        >
          {PLAN_VERB[item.kind]}
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}

/** Today's plan, every part done: said plainly, and the one way on. */
function PlanDoneCard({ parts, onOva }: { parts: number; onOva: () => void }) {
  return (
    <>
      <CardTop eyebrow="Idag" />
      <div className="sv-hc-body">
        <h2 className="sv-hc-title">Dagens plan är klar.</h2>
        <p className="sv-hc-detail">
          {parts === 1 ? 'Planens enda del är gjord.' : `Alla ${word(parts)} delarna är gjorda.`}
        </p>
      </div>
      <p className="sv-hc-why">Vill du öva mer finns alla delprov och dina missar i Öva.</p>
      <div className="sv-hc-foot">
        <button
          type="button"
          className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
          onClick={onOva}
        >
          Till Öva
          <Kbd>↵</Kbd>
        </button>
      </div>
    </>
  )
}

/** Each plan card's one small figure: the misses as a fan of cards, the
 *  round's questions as marks. */
function PlanFigure({ item }: { item: PlanItemView }) {
  const n = Number.parseInt(item.detail ?? '', 10) || 0
  if (item.kind === 'repetition' && n > 0) {
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
  if (item.kind === 'drill' && n > 0) {
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

function PrognosisCard({
  p,
  total,
  caveatId,
  onMore,
}: {
  p: PrognosisView
  total: number
  caveatId: string
  onMore: () => void
}) {
  const halves = [
    p.verbal == null ? null : `Verbal ${fmtScore(p.verbal)}`,
    p.quant == null ? null : `Kvant ${fmtScore(p.quant)}`,
  ].filter(Boolean)
  return (
    <>
      <CardTop
        eyebrow="Prognos · hela provet"
        meta={p.target == null ? undefined : `Mål ${fmtScore(p.target)}`}
      />
      <div className="sv-hc-body">
        <div className="sv-prog-row">
          <p className="sv-prog">
            <span className="sv-prog-n" aria-describedby={p.caveat ? caveatId : undefined}>
              {fmtScore(total)}
              {p.caveat ? <sup aria-hidden>*</sup> : null}
            </span>
            {p.target == null ? null : <span className="sv-prog-of">av {fmtScore(p.target)}</span>}
          </p>
          {p.weeks && p.weeks.length > 1 ? <Weeks weeks={p.weeks} /> : null}
        </div>
        {p.delta != null || halves.length ? (
          <p className="sv-prog-halves">
            {p.delta != null ? (
              <>
                <b>{fmtDelta(p.delta)}</b> sedan förra veckan
                {halves.length ? ' · ' : ''}
              </>
            ) : null}
            {halves.join(' · ')}
          </p>
        ) : null}
        <Scale total={total} low={p.low} high={p.high} />
      </div>
      {p.caveat ? (
        <p className="sv-caveat" id={caveatId}>
          <b aria-hidden>*</b>
          <span>{p.caveat}</span>
        </p>
      ) : null}
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
function Weeks({ weeks }: { weeks: number[] }) {
  const n = cap(word(weeks.length))
  const from = fmtScore(weeks[0])
  const to = fmtScore(weeks[weeks.length - 1])
  return (
    <figure className="sv-weeks">
      <span
        className="sv-weeks-bars"
        role="img"
        aria-label={`Prognosen de senaste ${n.toLowerCase()} veckorna, från ${from} till ${to}`}
      >
        {weeks.map((v, i) => (
          <i
            // biome-ignore lint/suspicious/noArrayIndexKey: one bar per week, oldest first
            key={i}
            style={{ height: `${(v / SCALE_MAX) * 100}%` }}
            data-last={String(i === weeks.length - 1)}
          />
        ))}
      </span>
      <figcaption aria-hidden>
        {n} veckor · {from} → {to}
      </figcaption>
    </figure>
  )
}

/** The day with nothing on it: no placeholder figures, one way on — the
 *  screen's one filled action. */
function FreeCard({ onOva }: { onOva: () => void }) {
  return (
    <>
      <CardTop eyebrow="Idag" />
      <div className="sv-hc-body">
        <h2 className="sv-hc-title">Öva fritt</h2>
        <p className="sv-hc-detail">Alla delprov och dina missar finns i Öva.</p>
      </div>
      <div className="sv-hc-foot">
        <button
          type="button"
          className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
          onClick={onOva}
        >
          Till Öva
          <Kbd>↵</Kbd>
        </button>
      </div>
    </>
  )
}

function TrapCard({ trap, more, onMore }: { trap: TrapView; more: number; onMore: () => void }) {
  return (
    <>
      <CardTop sec section={trap.section} eyebrow="Din vanligaste fälla just nu" />
      <div className="sv-hc-body">
        <h2 className="sv-hc-title sv-hc-title--trap">{trap.pattern ?? trap.name}</h2>
        {trap.pattern ? <p className="sv-hc-detail">{trap.name}</p> : null}
        <p className="sv-trap-count">
          <b>{trap.count} gånger</b>
          {trap.rising ? (
            <span className="sv-trap-rise">
              <span aria-hidden>↑</span> ökar
            </span>
          ) : null}
        </p>
      </div>
      {more > 0 ? (
        <p className="sv-hc-why">{cap(word(more))} fällor till väntar i Framsteg.</p>
      ) : null}
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

function RecentCard({
  recent,
  week,
  onMore,
}: {
  recent: RecentPassView[]
  week: WeekView
  onMore: () => void
}) {
  const days = week.daysPractised
  return (
    <>
      <CardTop
        eyebrow="Senaste passen"
        meta={week.minutesToday == null ? undefined : `${week.minutesToday} min idag`}
      />
      <div className="sv-hc-body">
        <ul className="sv-recent">
          {recent.map((r) => (
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
        {days != null ? (
          <div className="sv-week">
            {week.goal ? (
              <span className="sv-week-days" aria-hidden>
                {Array.from({ length: week.goal }, (_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: one mark per goal day
                  <i key={i} data-on={String(i < days)} />
                ))}
              </span>
            ) : null}
            <span>
              {week.goal
                ? `${cap(word(days))} av ${word(week.goal)} dagar den här veckan`
                : `${cap(word(days))} dagar den här veckan`}
            </span>
          </div>
        ) : null}
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
