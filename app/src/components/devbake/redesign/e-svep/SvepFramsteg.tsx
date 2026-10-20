// Svep · Framsteg, with Historik — progress as a small indexed evidence
// deck, one interpretation at a time. Översikt leads: the prognosis with
// its caveat, its likely range and the weeks behind it on the full 0–2,0
// scale, and the screen's one filled action — practise the first focus
// section. Then all eight sections on one comparison card (estimate,
// uncertainty, answers), the presence card (the week in plain numbers and
// the last twelve weeks as a heat of small cards: nothing to lose, no
// streak to break), the next focus, and Historik: the finished drills and
// repetitions as dated rows that scroll inside their own card.
//
// Desktop: the orientation to the left (the period, the countdown, the
// totals and Historik's own door), the deck in the middle, its register to
// the right. Phone: Översikt and Historik as two tabs over the one deck.
//
// Kit v2: everything is the view model's (data.framsteg). Its optional
// fields — the range, the target, the weekly goal — drop out when absent,
// and a chart's numbers are always there in words or a table.

import { ArrowRight, History } from 'lucide-react'
import { type ReactNode, useId, useLayoutEffect, useMemo } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtDelta, fmtScore, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  FramstegView,
  HistoryRowView,
  PrognosisView,
  RepeteraView,
  SectionScoreView,
} from '@/components/devbake/redesign/viewModel'
import type { Section } from '@/data/questions'
import { formatSwedishDateShort } from '@/lib/scoring'
import { useDeck } from './deck'
import {
  cap,
  type DeckCard,
  DeckCounter,
  DeckRegister,
  DeckStage,
  DeckTicks,
  fmtRange,
  Kbd,
  SCALE_MAX,
  Scale,
  SecChip,
  sectionKey,
  useDeckKeys,
  word,
} from './parts'
import type { FrameNav } from './Svep'

/** The cards a link can open Framsteg at. */
export type FramstegCardId = 'oversikt' | 'delprov' | 'narvaro' | 'fokus' | 'historik'

type FsCard = DeckCard & {
  id: FramstegCardId
  /** What Enter does while the card is in front. */
  action: (() => void) | null
}

const CONFIDENCE: Record<SectionScoreView['confidence'], string> = {
  low: 'låg säkerhet',
  medium: 'medelsäker',
  high: 'hög säkerhet',
}

/** A UTC day ('2026-10-09') at local noon, so its weekday never slips. */
const dayOf = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`)

/** "9 okt". */
const fmtDay = (iso: string) => formatSwedishDateShort(dayOf(iso))

const WEEKDAYS = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']

/** 2840 → "2 840". */
const fmtCount = (n: number) => n.toLocaleString('sv-SE')

export function SvepFramsteg({
  width,
  live,
  nav,
  card,
}: {
  width: WidthKey
  live: boolean
  nav: FrameNav
  /** The card to open at (Idag's estimate and recent passes). */
  card?: FramstegCardId
}) {
  const { data, actions } = useDirectionData()
  const f = data.framsteg
  const phone = width === 'phone'
  const caveatId = useId()
  const cards = useMemo(
    () => framstegCards({ f, repetera: data.repetera, actions, nav, caveatId }),
    [f, data.repetera, actions, nav, caveatId],
  )
  const deck = useDeck(cards)
  const front = cards[deck.index]
  const history = cards.findIndex((c) => c.id === 'historik')
  // Opened at a card: once, before the first paint, so nothing flies in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the card a link asked for, on mount only
  useLayoutEffect(() => {
    const at = card ? cards.findIndex((c) => c.id === card) : -1
    if (at > 0) deck.go(at)
  }, [])
  useDeckKeys(deck, front?.action ?? null, live)

  const stage = (
    <DeckStage
      deck={deck}
      cards={cards}
      label={`Framsteg, ${cards.length} kort`}
      kind="fs"
      live={live}
    />
  )

  if (phone) {
    return (
      <div className="sv-ptri sv-pfs">
        <header className="sv-ptri-head">
          <h1 className="sv-greet">Framsteg</h1>
        </header>
        <fieldset className="sv-seg sv-seg--two sv-fs-tabs">
          <legend className="sv-sr">Visa</legend>
          <button type="button" aria-pressed={front?.id !== 'historik'} onClick={() => deck.go(0)}>
            Översikt
          </button>
          <button
            type="button"
            aria-pressed={front?.id === 'historik'}
            onClick={() => deck.go(history)}
          >
            Historik
          </button>
        </fieldset>
        <div className="sv-ptri-deck">{stage}</div>
        <div className="sv-phome-foot">
          <DeckCounter deck={deck} cards={cards} arrows={false} />
          <DeckTicks deck={deck} cards={cards} label="Kortregister" />
        </div>
      </div>
    )
  }

  const weeks = f.weekly.length
  return (
    <div className="sv-tri sv-fs">
      <aside className="sv-tri-side" aria-label="Framsteg">
        {weeks ? <p className="sv-date">Senaste {word(weeks)} veckorna</p> : null}
        <h1 className="sv-greet">Framsteg</h1>
        <p className="sv-day">
          Ett kort i taget: prognosen, delproven, närvaron, fokus och historiken.
        </p>
        <p className="sv-countdown">
          <span className="sv-countdown-n">{data.home.exam.daysLeft}</span>
          <span>
            dagar kvar till högskoleprovet,
            <br />
            {data.home.exam.dateLabel}
          </span>
        </p>
        <p className="sv-fs-totals">
          {fmtCount(f.totals.attempts)} svar · {fmtCount(f.totals.drills)} pass hittills
        </p>
        <button
          type="button"
          className="sv-repdoor sv-fs-histdoor"
          onClick={() => deck.go(history)}
        >
          <span className="sv-fs-histdoor-icon" aria-hidden>
            <History size={20} strokeWidth={1.75} />
          </span>
          <span className="sv-repdoor-text">
            <b>Historik</b>
            <span>
              {f.history.length ? `${f.history.length} avslutade pass` : 'Inga avslutade pass än'}
            </span>
          </span>
          <ArrowRight size={20} strokeWidth={2} aria-hidden />
        </button>
      </aside>
      <div className="sv-home-deck">
        {stage}
        <DeckCounter deck={deck} cards={cards} />
        <p className="sv-deck-hint">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> bläddrar{front?.action ? ' · ' : ''}
          {front?.action ? (
            <>
              <Kbd>↵</Kbd> tar kortet
            </>
          ) : null}
        </p>
      </div>
      <div className="sv-tri-end">
        <DeckRegister
          deck={deck}
          cards={cards}
          label="Kortregister"
          head={
            <>
              I leken <span>· {cards.length} kort</span>
            </>
          }
        />
      </div>
    </div>
  )
}

function framstegCards({
  f,
  repetera,
  actions,
  nav,
  caveatId,
}: {
  f: FramstegView
  repetera: RepeteraView
  actions: DirectionActions
  nav: FrameNav
  caveatId: string
}): FsCard[] {
  const focus = f.focus[0] ?? null
  const practise = (s: Section) => actions.startDrill({ kind: 'section', section: s })
  // The one next step: the first focus section; with none, Öva.
  const next = focus ? () => practise(focus) : () => nav.go('ova')
  const p = f.prognosis
  const cards: FsCard[] = [
    {
      id: 'oversikt',
      label: 'Översikt',
      tint: 'none',
      meta: p.total == null ? 'ingen än' : fmtScore(p.total),
      action: next,
      body: (
        <OverviewCard p={p} weekly={f.weekly} caveatId={caveatId} focus={focus} onNext={next} />
      ),
    },
    {
      id: 'delprov',
      label: 'Delprov',
      tint: 'none',
      meta: `${f.sections.filter((s) => s.score != null).length} av ${f.sections.length}`,
      action: () => nav.go('ova'),
      body: <SectionsCard sections={f.sections} onOva={() => nav.go('ova')} />,
    },
    {
      id: 'narvaro',
      label: 'Närvaro',
      tint: 'none',
      meta: `${f.week.attemptsThisWeek} svar`,
      action: null,
      body: <PresenceCard week={f.week} days={f.days} />,
    },
  ]
  if (f.focus.length) {
    cards.push({
      id: 'fokus',
      label: 'Nästa fokus',
      tint: 'none',
      meta: f.focus.join(' · '),
      action: next,
      body: (
        <FocusCard
          f={f}
          dueNow={repetera.dueNow}
          onPractise={practise}
          onRepetera={actions.openRepetera}
        />
      ),
    })
  }
  cards.push({
    id: 'historik',
    label: 'Historik',
    tint: 'none',
    meta: `${f.history.length} pass`,
    action: f.history.length ? null : () => nav.go('ova'),
    body: (
      <HistoryCard
        history={f.history}
        onOva={() => nav.go('ova')}
        onProvpass={() => nav.go('provpass')}
      />
    ),
  })
  return cards
}

// ── Översikt ─────────────────────────────────────────────────────────

function OverviewCard({
  p,
  weekly,
  caveatId,
  focus,
  onNext,
}: {
  p: PrognosisView
  weekly: FramstegView['weekly']
  caveatId: string
  focus: Section | null
  onNext: () => void
}) {
  const caveat = p.caveat ? (
    <p className="sv-caveat" id={caveatId}>
      <b aria-hidden>*</b>
      <span>{p.caveat}</span>
    </p>
  ) : null
  const action = (
    <div className="sv-hc-foot">
      <button
        type="button"
        className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
        onClick={onNext}
      >
        {focus ? `Öva ${focus}` : 'Till Öva'}
        <Kbd>↵</Kbd>
      </button>
    </div>
  )
  if (p.total == null) {
    // Day zero: no estimate and no zero either — the way to the first answers.
    return (
      <>
        <div className="sv-hc-top">
          <span className="sv-hc-eyebrow">Prognos · hela provet</span>
        </div>
        <div className="sv-hc-body" data-testid="rd-framsteg-prognosis">
          <h2 className="sv-hc-title">Ingen prognos än</h2>
          <p className="sv-hc-detail">
            Prognosen räknas fram när du har svarat på frågor i båda halvorna.
          </p>
        </div>
        {caveat}
        {action}
      </>
    )
  }
  const halves = [
    p.verbal == null ? null : `Verbal ${fmtScore(p.verbal)}`,
    p.quant == null ? null : `Kvant ${fmtScore(p.quant)}`,
  ].filter(Boolean)
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Prognos · hela provet</span>
        {p.target == null ? null : <span className="sv-hc-meta">Mål {fmtScore(p.target)}</span>}
      </div>
      <div className="sv-hc-body sv-fs-prog" data-testid="rd-framsteg-prognosis">
        <p className="sv-prog">
          <span className="sv-prog-n" aria-describedby={p.caveat ? caveatId : undefined}>
            {fmtScore(p.total)}
            {p.caveat ? <sup aria-hidden>*</sup> : null}
          </span>
          {p.target == null ? null : <span className="sv-prog-of">av {fmtScore(p.target)}</span>}
        </p>
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
        <Scale total={p.total} low={p.low} high={p.high} />
        <WeekCurve weekly={weekly} target={p.target} />
      </div>
      {caveat}
      {action}
    </>
  )
}

/** The weekly scores as bars on the full 0–2,0 scale, oldest first, the
 *  weeks without answers left as gaps; the target as a line when there is
 *  one. The numbers are in a table for a screen reader. */
function WeekCurve({ weekly, target }: { weekly: FramstegView['weekly']; target?: number }) {
  const scored = weekly.filter((w) => w.score != null).length
  if (weekly.length === 0) return null
  if (scored < 2) {
    return <p className="sv-wk-sparse">För få veckor med svar för en kurva än.</p>
  }
  const pct = (v: number) => `${(Math.min(SCALE_MAX, Math.max(0, v)) / SCALE_MAX) * 100}%`
  const last = weekly.length - 1
  return (
    <figure className="sv-wk">
      <div className="sv-wk-plot" aria-hidden>
        {target == null ? null : (
          <span className="sv-wk-goal" style={{ bottom: pct(target) }}>
            <span>Mål</span>
          </span>
        )}
        {weekly.map((w, i) => (
          <i
            key={w.weekStart}
            data-empty={w.score == null ? 'true' : undefined}
            data-last={i === last ? 'true' : undefined}
            style={w.score == null ? undefined : { height: pct(w.score) }}
          />
        ))}
      </div>
      <figcaption>Vecka för vecka · andelen rätt omräknad till 0–{fmtScore(SCALE_MAX)}</figcaption>
      <table className="sv-sr">
        <caption>Vecka för vecka, andelen rätt på skalan 0 till 2,0</caption>
        <thead>
          <tr>
            <th scope="col">Veckan från</th>
            <th scope="col">Poäng</th>
          </tr>
        </thead>
        <tbody>
          {weekly.map((w) => (
            <tr key={w.weekStart}>
              <th scope="row">{fmtDay(w.weekStart)}</th>
              <td>{w.score == null ? 'inga svar' : fmtScore(w.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

// ── Delprov ──────────────────────────────────────────────────────────

/** A section's estimate on a slim 0–2,0 track, with its band. */
function MiniScale({ score, band }: { score: number; band: number | null }) {
  const pct = (v: number) => `${(Math.min(SCALE_MAX, Math.max(0, v)) / SCALE_MAX) * 100}%`
  const low = band ? Math.max(0, score - band) : null
  const high = band ? Math.min(SCALE_MAX, score + band) : null
  return (
    <span className="sv-fs-track" aria-hidden>
      {low != null && high != null ? (
        <span className="sv-fs-band" style={{ left: pct(low), width: pct(high - low) }} />
      ) : null}
      <span className="sv-fs-mark" style={{ left: pct(score) }} />
    </span>
  )
}

function SectionsCard({ sections, onOva }: { sections: SectionScoreView[]; onOva: () => void }) {
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Delprov · skattning och osäkerhet</span>
        <span className="sv-hc-meta">90 dagar</span>
      </div>
      <div className="sv-hc-body sv-hc-body--list">
        <h2 className="sv-rc-title">{cap(word(sections.length))} delprov</h2>
        <ul className="sv-fs-secs">
          {sections.map((s) => (
            <li
              key={s.section}
              className="sv-fs-sec"
              data-testid={`rd-framsteg-section-${sectionKey(s.section)}`}
            >
              <span className="sv-fs-sec-code">
                <SecChip section={s.section} />
              </span>
              <span className="sv-fs-sec-name">{s.name}</span>
              {s.score == null ? (
                <span className="sv-fs-sec-none">Inte övat än</span>
              ) : (
                <>
                  <span className="sv-fs-sec-score">
                    <b>{fmtScore(s.score)}</b>
                    {s.band ? <span> ±{fmtRange(s.band)}</span> : null}
                  </span>
                  <MiniScale score={s.score} band={s.band ?? null} />
                </>
              )}
              <span className="sv-fs-sec-n">
                {s.attempts90d} svar
                {s.score == null ? '' : ` · ${CONFIDENCE[s.confidence]}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="sv-hc-foot">
        <button type="button" className="sv-btn sv-btn--tonal sv-btn--block" onClick={onOva}>
          Alla delprov i Öva
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}

// ── Närvaro ──────────────────────────────────────────────────────────

/** A day's answers as a heat step: none, a few, more, many, most. */
function heat(n: number): number {
  if (n <= 0) return 0
  if (n < 10) return 1
  if (n < 25) return 2
  if (n < 40) return 3
  return 4
}

function PresenceCard({ week, days }: { week: FramstegView['week']; days: FramstegView['days'] }) {
  const practised = week.daysPractised
  const line =
    practised == null
      ? null
      : week.goal
        ? `${cap(word(practised))} av ${word(week.goal)} dagar den här veckan.`
        : `${cap(word(practised))} ${practised === 1 ? 'dag' : 'dagar'} den här veckan.`
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Närvaro · veckans rytm</span>
        {week.minutesToday == null ? null : (
          <span className="sv-hc-meta">{week.minutesToday}&nbsp;min idag</span>
        )}
      </div>
      <div className="sv-hc-body" data-testid="rd-framsteg-week">
        <div className="sv-fs-stats">
          <p className="sv-fs-stat">
            <b>{week.streakDays}</b>
            <span>{week.streakDays === 1 ? 'dag' : 'dagar'} i rad</span>
          </p>
          <p className="sv-fs-stat">
            <b>{fmtCount(week.attemptsThisWeek)}</b>
            <span>svar den här veckan</span>
          </p>
          {week.accuracy7d == null ? null : (
            <p className="sv-fs-stat">
              <b>{Math.round(week.accuracy7d * 100)}&nbsp;%</b>
              <span>rätt senaste veckan</span>
            </p>
          )}
        </div>
        <Heat days={days} />
        {line || week.record ? (
          <p className="sv-fs-note">
            {line}
            {line && week.record ? ' ' : ''}
            {week.record ? `Längsta svit hittills: ${word(week.record)} dagar.` : ''}
          </p>
        ) : null}
      </div>
    </>
  )
}

/** The days as a heat of small cards: a column a week, a row a weekday.
 *  It is a table, so a screen reader hears every date and count. */
function Heat({ days }: { days: FramstegView['days'] }) {
  if (days.length === 0) return null
  const cols = Math.ceil(days.length / 7)
  const columns = Array.from({ length: cols }, (_, c) => days[c * 7])
  const rows = days.slice(0, Math.min(7, days.length))
  return (
    <div className="sv-heat">
      <table className="sv-heat-table">
        <caption className="sv-sr">Svar per dag, {word(cols)} veckor, äldst till vänster</caption>
        <thead className="sv-sr">
          <tr>
            <td />
            {columns.map((d) => (
              <th key={d.date} scope="col">
                Veckan från {fmtDay(d.date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((first, r) => (
            <tr key={first.date}>
              <th scope="row" className="sv-heat-day">
                {WEEKDAYS[dayOf(first.date).getDay()]}
              </th>
              {columns.map((col, c) => {
                const d = days[c * 7 + r]
                // A day past the last one: an empty cell under its week.
                if (!d) return <td key={`${col.date}-after-${first.date}`} />
                return (
                  <td key={d.date} data-level={heat(d.n)} title={`${fmtDay(d.date)}: ${d.n} svar`}>
                    <span className="sv-sr">
                      {fmtDay(d.date)}: {d.n} svar
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sv-heat-legend" aria-hidden>
        <span>Inga</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} data-level={l} />
        ))}
        <span>Många svar</span>
      </p>
    </div>
  )
}

// ── Nästa fokus ──────────────────────────────────────────────────────

function FocusCard({
  f,
  dueNow,
  onPractise,
  onRepetera,
}: {
  f: FramstegView
  dueNow: number
  onPractise: (s: Section) => void
  onRepetera: () => void
}) {
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Nästa fokus · förslag utifrån dina svar</span>
      </div>
      <div className="sv-hc-body sv-hc-body--list">
        <h2 className="sv-rc-title">Öva på det här härnäst</h2>
        <ol className="sv-fs-focus">
          {f.focus.map((s, i) => {
            const v = f.sections.find((x) => x.section === s)
            return (
              <li key={s}>
                <button type="button" className="sv-fs-focus-row" onClick={() => onPractise(s)}>
                  <span className="sv-index-n" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="sv-fs-focus-text">
                    <b>{v?.name ?? s}</b>
                    <span>
                      {[
                        v?.score == null ? null : `skattning ${fmtScore(v.score)}`,
                        v ? `${v.attempts90d} svar` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="sv-fs-focus-go">
                    Öva {s}
                    <ArrowRight size={16} strokeWidth={2} aria-hidden />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="sv-fs-note">
          Repetera: {dueNow > 0 ? `${dueNow} redo nu` : 'inget redo just nu'} ·{' '}
          {fmtCount(f.totals.mistakesActive)} i kön · {fmtCount(f.totals.mistakesResolved)} utlärda
        </p>
      </div>
      <div className="sv-hc-foot">
        <button type="button" className="sv-btn sv-btn--tonal sv-btn--block" onClick={onRepetera}>
          Till Repetera
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  )
}

// ── Historik ─────────────────────────────────────────────────────────

function HistoryRow({ h, n }: { h: HistoryRowView; n: number }) {
  return (
    <li className="sv-hist-row" data-testid={`rd-framsteg-history-item-${n}`}>
      <span className="sv-hist-when">{h.when}</span>
      <span className="sv-hist-name">
        {h.section ? <SecChip section={h.section} /> : <SecChip section={null} label={h.label} />}
      </span>
      <span className="sv-recent-bar" role="img" aria-label={`${h.correct} av ${h.total} rätt`}>
        <i style={{ width: `${h.total ? (h.correct / h.total) * 100 : 0}%` }} />
      </span>
      <span className="sv-hist-score" aria-hidden>
        {h.correct}/{h.total}
      </span>
    </li>
  )
}

function HistoryCard({
  history,
  onOva,
  onProvpass,
}: {
  history: HistoryRowView[]
  onOva: () => void
  onProvpass: () => void
}) {
  let rows: ReactNode
  if (history.length) {
    rows = (
      <ol className="sv-hist">
        {history.map((h, i) => (
          <HistoryRow key={h.id} h={h} n={i + 1} />
        ))}
      </ol>
    )
  } else {
    rows = <p className="sv-hc-detail">Inga avslutade pass än. Kör en övning så landar den här.</p>
  }
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Historik · övningar och repetitioner</span>
        <span className="sv-hc-meta">{history.length}&nbsp;pass</span>
      </div>
      <div className="sv-hc-body sv-hc-body--list" data-testid="rd-framsteg-history">
        <h2 className="sv-rc-title">Avslutade pass</h2>
        {rows}
        <p className="sv-fs-note">Provpassen och deras resultat ligger under Provpass.</p>
      </div>
      <div className="sv-hc-foot">
        {history.length ? (
          <button type="button" className="sv-btn sv-btn--tonal sv-btn--block" onClick={onProvpass}>
            Till Provpass
            <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
            onClick={onOva}
          >
            Till Öva
            <Kbd>↵</Kbd>
          </button>
        )}
      </div>
    </>
  )
}
