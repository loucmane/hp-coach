// Folio · Framsteg (screen 11), with its back matter: Historik and Fällor.
//
// Framsteg reads as a report set in a book: an editorial standfirst tells
// the week in one sentence; the lead under the heavy rule is one light
// display figure — the prognosis, its footnoted caveat attached — with its
// halves, the change said in words, the 0–2,0 scale with its goal tick and
// the one thing that would lift it most, the screen's filled button. Then
// the weekly curve drawn as a captioned book figure (its values a table on
// demand), "Delproven" as a ruled table with leader dots in test order, the
// next two suggestions as contents entries and the latest passes. In the
// margin: the traps, the repetition queue and the practice days, counted
// per calendar week as dots — never the days missed, and no streak.
//
// Historik is the back matter: a ledger by calendar week, each week a head
// over its rows (the weekday and date, the kind in words, the result), the
// finished provpass in a part of their own. Fällor is the index of traps by
// section, led by the one that is growing. Both keep Framsteg current in the
// contents; the masthead's "Framsteg" and Esc go back.
//
// Kit v2: everything reads useDirectionData() — data.framsteg, the traps of
// data.home and the finished passes of data.provpass.hub. What the view
// model marks optional (a range, the goal) is left out when absent.

import { ArrowRight, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  fmtDelta,
  fmtScore,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  FramstegView,
  HistoryRowView,
  SectionScoreView,
  TrapView,
} from '@/components/devbake/redesign/viewModel'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import {
  ContentsEntry,
  capitalised,
  FolioPage,
  inWords,
  Lead,
  MarginBlock,
  Masthead,
  PartHead,
  prognosisScaleLabel,
  ResultFigure,
  Scale,
  scoreOrDash,
  slug,
} from './FolioHome'
import { fmtPassScore, passName } from './FolioProvpass'

/** Framsteg's own pages: the report, its ledger and its index of traps. */
export type FramstegSub = 'overview' | 'historik' | 'fallor'

const DAY_MS = 86_400_000
const WEEKDAY_SHORT = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
const MONTHS = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
]
const CONFIDENCE: Record<SectionScoreView['confidence'], string> = {
  low: 'låg',
  medium: 'medel',
  high: 'hög',
}
const HALF_FIRST: Record<'verbal' | 'kvant', Section> = { verbal: 'ORD', kvant: 'XYZ' }

// ── Calendar ─────────────────────────────────────────────────────────

/** ISO 8601 week number of a local day. */
function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7)
}

/** The Monday a local day's calendar week starts on. */
function mondayOf(date: Date): Date {
  const m = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}

/** "Vecka 41 · 5–11 oktober"; across a month "28 september – 4 oktober". */
function weekLabel(monday: Date): string {
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  const range =
    monday.getMonth() === sunday.getMonth()
      ? `${monday.getDate()}–${sunday.getDate()} ${MONTHS[sunday.getMonth()]}`
      : `${monday.getDate()} ${MONTHS[monday.getMonth()]} – ${sunday.getDate()} ${MONTHS[sunday.getMonth()]}`
  return `Vecka ${isoWeek(monday)} · ${range}`
}

function validDate(iso: string): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Practice days per calendar week, oldest first; the last is this week. */
function calendarWeeks(days: FramstegView['days']) {
  const weeks: { key: number; week: number; count: number; current: boolean }[] = []
  for (const d of days) {
    const date = validDate(`${d.date}T12:00:00`)
    if (!date) continue
    const monday = mondayOf(date)
    let w = weeks[weeks.length - 1]
    if (!w || w.key !== monday.getTime()) {
      w = { key: monday.getTime(), week: isoWeek(monday), count: 0, current: false }
      weeks.push(w)
    }
    if (d.n > 0) w.count += 1
  }
  if (weeks.length) weeks[weeks.length - 1].current = true
  return weeks
}

// ── Words ────────────────────────────────────────────────────────────

/** Why a section is the one to practise, from what the view model says:
 *  untouched for two weeks, else its place among the scores and its trend. */
function focusReason(s: SectionScoreView, all: readonly SectionScoreView[]): string {
  if (s.daysSince != null && s.daysSince >= 14) return `inte övad på ${s.daysSince} dagar`
  if (s.score == null) return 'inget underlag än'
  const score = s.score
  const lower = all.filter((x) => x.score != null && x.score < score).length
  const rank =
    lower === 0
      ? 'lägst just nu'
      : lower === 1
        ? 'näst lägst just nu'
        : `nivå ${fmtScore(score)} just nu`
  const trend = trendOf(s.trend)
  if (trend?.word === 'ner') return `${rank} och på väg ner`
  if (trend?.word === 'upp') return `${rank} men på väg upp`
  return rank
}

/** A trend in words, the arrow beside it (the word carries it). */
function trendOf(t: number | null): { arrow: string; word: string } | null {
  if (t == null) return null
  if (t <= -0.02) return { arrow: '↘', word: 'ner' }
  if (t >= 0.02) return { arrow: '↗', word: 'upp' }
  return { arrow: '→', word: 'oförändrad' }
}

/** "180 frågor den här veckan med 70 % träffsäkerhet. Gapet …" */
function weekSentence(f: FramstegView): string {
  const p = f.prognosis
  const n = f.week.attemptsThisWeek
  if (p.total == null && p.verbal == null && p.quant == null && n === 0) {
    return 'Ingen prognos än – svara på några frågor så börjar den här sidan leva.'
  }
  const count =
    n === 0
      ? 'Inga frågor än den här veckan'
      : `${capitalised(inWords(n))} ${n === 1 ? 'fråga' : 'frågor'} den här veckan`
  const accuracy =
    n > 0 && f.week.accuracy7d != null
      ? ` med ${Math.round(f.week.accuracy7d * 100)} % träffsäkerhet`
      : ''
  const gap =
    p.target != null && f.focus.length >= 2
      ? ` Gapet upp till målet bärs framför allt av ${f.focus[0]} och ${f.focus[1]}.`
      : ''
  return `${count}${accuracy}.${gap}`
}

/** A finished drill's kind in words — never a raw tag, and a mixed set is
 *  never called by one section. */
function kindWord(row: HistoryRowView): string {
  if (row.kind === 'adaptive_review') return 'Repetition'
  if (row.kind === 'lesson') return 'Lektion'
  if (row.kind === 'mock' || row.kind === 'mock_diagnostic') return 'Provpass'
  return row.section ? `${row.section}-övning` : 'Blandad övning'
}

/** "fre 9 okt": the weekday and the view model's date. */
function dayOf(row: HistoryRowView): string {
  const d = validDate(row.endedAt)
  return d ? `${WEEKDAY_SHORT[d.getDay()]} ${row.when}` : row.when
}

// ── The page ─────────────────────────────────────────────────────────

export function FolioFramsteg({
  width,
  live,
  sub,
  onSub,
  onGo,
}: {
  width: WidthKey
  live: boolean
  sub: FramstegSub
  onSub: (sub: FramstegSub) => void
  /** "Till Öva" on an empty page. */
  onGo: (d: Destination) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // A sub-page opens at its top, as a turned page does.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a change of page only
  useEffect(() => {
    ref.current?.closest('.fp-main, .fp-pscroll')?.scrollTo?.({ top: 0 })
  }, [sub])
  const back = () => onSub('overview')
  // Historik is always set, folded away behind the report: it is the
  // report's back matter, one press away.
  return (
    <div ref={ref}>
      <div hidden={sub !== 'overview'}>
        <Overview width={width} live={live && sub === 'overview'} onSub={onSub} onGo={onGo} />
      </div>
      <div hidden={sub !== 'historik'}>
        <Historik width={width} live={live && sub === 'historik'} onBack={back} onGo={onGo} />
      </div>
      {sub === 'fallor' ? <Fallor width={width} live={live} onBack={back} onGo={onGo} /> : null}
    </div>
  )
}

function Overview({
  width,
  live,
  onSub,
  onGo,
}: {
  width: WidthKey
  live: boolean
  onSub: (sub: FramstegSub) => void
  onGo: (d: Destination) => void
}) {
  const { data, actions } = useDirectionData()
  const f = data.framsteg
  const p = f.prognosis
  const size = (s: Section) => (s === 'DTK' ? '' : ` · ${data.ova.mixed.questions} frågor`)
  const top = f.sections.find((s) => s.section === f.focus[0]) ?? null
  const oneHalf = p.total == null && (p.verbal == null) !== (p.quant == null)

  // The one thing that lifts the estimate most, or the way to an estimate.
  let primary: { label: string; run: () => void }
  if (p.total != null && top) {
    const s = top.section
    primary = {
      label: `Öva ${s}${size(s)}`,
      run: () => actions.startDrill({ kind: 'section', section: s }),
    }
  } else if (oneHalf) {
    const half = p.verbal == null ? 'verbal' : 'kvant'
    const s = HALF_FIRST[half]
    primary = {
      label: `Börja med ${half}: ${s}${size(s)}`,
      run: () => actions.startDrill({ kind: 'section', section: s }),
    }
  } else if (p.total == null) {
    primary = {
      label: `Börja här · ${data.ova.mixed.questions} frågor`,
      run: () => actions.startDrill({ kind: 'mixed' }),
    }
  } else {
    primary = { label: 'Till Öva', run: () => onGo('ova') }
  }
  useKeyMap({ Enter: primary.run }, live)

  // The footnotes, numbered by asterisks; the first qualifies the figure.
  const notes: { mark: string; text: string; caveat: boolean }[] = []
  if (oneHalf) {
    notes.push({
      mark: '',
      text: 'Totalen visas när du har svarat på frågor i båda halvorna.',
      caveat: false,
    })
  }
  if (p.caveat) notes.push({ mark: '', text: p.caveat, caveat: true })
  notes.forEach((n, i) => {
    n.mark = '*'.repeat(i + 1)
  })
  const caveatMark = notes.find((n) => n.caveat)?.mark
  const figureMark = p.total != null ? caveatMark : notes[0]?.mark
  const rest = f.focus
    .slice(1, 3)
    .map((s) => f.sections.find((x) => x.section === s))
    .filter((s): s is SectionScoreView => s != null)
  const traps = data.home.traps

  const sentence =
    p.total != null
      ? `Prognos ${fmtScore(p.total)} av 2,0${caveatMark ? ', med förbehåll i fotnoten' : ''}`
      : 'Ingen prognos än'

  const main = (
    <>
      <h1 className="fp-greet">Framsteg</h1>
      <p className="fp-day">{weekSentence(f)}</p>

      <Lead labelledBy="fp-fr-lead" testId="rd-framsteg-prognosis">
        <div className="fp-resume-top">
          <span className="fp-label" id="fp-fr-lead">
            Prognos
          </span>
        </div>
        <ResultFigure
          figure={p.total != null ? fmtScore(p.total) : '—'}
          mark={figureMark}
          of="av 2,0"
          sentence={sentence}
        >
          {p.delta != null ? (
            <p className="fp-delta">{fmtDelta(p.delta)} sedan förra veckan</p>
          ) : null}
          <p className="fp-halves">
            Verbal {scoreOrDash(p.verbal)} · Kvant {scoreOrDash(p.quant)}
          </p>
          {p.total != null ? (
            <div className="fp-scale-row">
              <Scale
                mark={p.total}
                low={p.low}
                high={p.high}
                goal={p.target}
                label={`${prognosisScaleLabel(p, p.total)}${
                  p.target != null ? `, mål ${fmtScore(p.target)}` : ''
                }`}
              />
              {p.target != null ? (
                <button type="button" className="fp-link fp-goal-link" onClick={actions.openKonto}>
                  mål {fmtScore(p.target)}
                  <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}
        </ResultFigure>
        {p.total != null && top ? (
          <p className="fp-lead-why">
            Mest att vinna: {top.section} – {focusReason(top, f.sections)}.
          </p>
        ) : null}
        <div className="fp-resume-foot">
          <button type="button" className="fp-btn fp-btn--big" onClick={primary.run}>
            {primary.label}
            <kbd className="fp-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
        </div>
      </Lead>

      <section className="fp-section" aria-labelledby="fp-fr-chart-h">
        <div className="fp-section-head">
          <h2 className="fp-h2" id="fp-fr-chart-h">
            Poäng över tid
          </h2>
        </div>
        <TrendChart weekly={f.weekly} goal={p.target} phone={width === 'phone'} />
      </section>

      <section className="fp-section" aria-labelledby="fp-fr-sec-h">
        <div className="fp-section-head">
          <h2 className="fp-h2" id="fp-fr-sec-h">
            Delproven
          </h2>
          <span className="fp-meta">underlag: 90 dagar</span>
        </div>
        <table className="fp-table fp-fr-table">
          <caption className="fp-sr">Delproven: prognos, osäkerhet, trend och underlag</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="fp-sr">Delprov</span>
              </th>
              <th scope="col">Prognos</th>
              <th scope="col" className="fp-col-wide">
                ±
              </th>
              <th scope="col">Trend</th>
              <th scope="col" className="fp-col-wide">
                Underlag
              </th>
            </tr>
          </thead>
          <tbody>
            {f.sections.map((s) => {
              const trend = trendOf(s.trend)
              const stale = s.daysSince != null && s.daysSince >= 14
              const band = s.band != null ? `±${s.band.toFixed(2).replace('.', ',')}` : null
              const basis = `${s.attempts90d} · ${CONFIDENCE[s.confidence]}`
              const marked = caveatMark != null && (s.section === 'LÄS' || s.section === 'ELF')
              return (
                <tr key={s.section} data-testid={`rd-framsteg-section-${slug(s.section)}`}>
                  <th scope="row">
                    <span className="fp-th-line">
                      <span className="fp-table-name">
                        {s.section}
                        <span className="fp-sr">, {s.name}</span>
                      </span>
                      <span className="fp-leader" aria-hidden />
                    </span>
                  </th>
                  <td>
                    {s.score != null ? (
                      <>
                        {fmtScore(s.score)}
                        {marked ? <sup className="fp-table-mark">{caveatMark}</sup> : null}
                      </>
                    ) : (
                      <span className="fp-table-none">inget än</span>
                    )}
                    {/* Phone: the band and the basis drop to a second line. */}
                    <span className="fp-table-sub fp-phone-only">
                      {[band, `${s.attempts90d} försök`, CONFIDENCE[s.confidence]]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </td>
                  <td className="fp-col-wide">{band ?? ''}</td>
                  <td>
                    {trend ? (
                      <>
                        <span aria-hidden>{trend.arrow} </span>
                        {trend.word}
                      </>
                    ) : (
                      <span className="fp-table-none">–</span>
                    )}
                  </td>
                  <td className="fp-col-wide">
                    {basis}
                    {stale ? <span className="fp-table-sub">{s.daysSince} dagar sedan</span> : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {p.total != null && rest.length ? (
        <section className="fp-section" aria-labelledby="fp-fr-next-h">
          <div className="fp-section-head">
            <h2 className="fp-h2" id="fp-fr-next-h">
              Sedan
            </h2>
          </div>
          <ol>
            {rest.map((s, i) => (
              <li key={s.section}>
                <ContentsEntry
                  code={i + 2}
                  title={s.section}
                  gloss={focusReason(s, f.sections)}
                  page={`Öva ${s.section}`}
                  label={`Öva ${s.section}, ${sectionLongLabel(s.section)}: ${focusReason(s, f.sections)}`}
                  onClick={() => actions.startDrill({ kind: 'section', section: s.section })}
                />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="fp-section" aria-labelledby="fp-fr-hist-h">
        <div className="fp-section-head">
          <h2 className="fp-h2" id="fp-fr-hist-h">
            Historik
          </h2>
          <button type="button" className="fp-link" onClick={() => onSub('historik')}>
            Alla pass
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {f.history.length ? (
          <ol className="fp-ledger">
            {f.history.slice(0, 5).map((row) => (
              <li key={row.id}>
                <LedgerRow row={row} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="fp-empty">Inga avslutade pass än. Kör en övning så landar den här.</p>
        )}
      </section>

      {notes.length ? (
        <div className="fp-footnotes">
          {notes.map((n) => (
            <p key={n.mark} className="fp-footnote fp-footnote--wide">
              <b aria-hidden>{n.mark}</b>
              <span>{n.text}</span>
            </p>
          ))}
        </div>
      ) : null}
    </>
  )

  const aside = (
    <>
      {traps.length ? (
        <MarginBlock id="fp-fr-traps-h" title="Fällor">
          <ul className="fp-trap-list">
            {traps.slice(0, 3).map((t) => (
              <li key={t.frameworkId}>
                <TrapLines t={t} />
              </li>
            ))}
          </ul>
          <button type="button" className="fp-link" onClick={() => onSub('fallor')}>
            Alla fällor
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </MarginBlock>
      ) : null}
      <MarginBlock id="fp-fr-rep-h" title="Repetitionen">
        {data.repetera.dueNow > 0 ? (
          <button type="button" className="fp-link fp-link--line" onClick={actions.openRepetera}>
            {data.repetera.dueNow} att repetera nu
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        ) : (
          <p className="fp-margin-note">Inget att repetera just nu.</p>
        )}
        <p className="fp-margin-note">
          {f.totals.mistakesActive} i kön · {f.totals.mistakesResolved} återlärda
        </p>
      </MarginBlock>
      <MarginBlock id="fp-fr-days-h" title="Övningsdagar" testId="rd-framsteg-week">
        <WeekDots days={f.days} goal={f.week.goal} />
      </MarginBlock>
    </>
  )

  return (
    <FolioPage
      width={width}
      masthead={
        <Masthead label="Framsteg">
          <span className="fp-count">Senaste 90 dagarna</span>
        </Masthead>
      }
      aside={aside}
      asideLabelledBy={traps.length ? 'fp-fr-traps-h' : 'fp-fr-rep-h'}
    >
      {main}
    </FolioPage>
  )
}

/** A trap in the margin, set as Idag sets it: section and count, its name
 *  and its pattern. */
function TrapLines({ t }: { t: TrapView }) {
  return (
    <>
      <p className="fp-trap-meta">
        <b>{t.section}</b>
        <span>
          {t.count} gånger
          {t.rising ? (
            <>
              <span aria-hidden> ↑</span>
              <span className="fp-sr">, ökar</span>
            </>
          ) : null}
        </span>
      </p>
      <span className="fp-trap-name">{t.name}</span>
      {t.pattern ? <span className="fp-trap-pattern">{t.pattern}</span> : null}
    </>
  )
}

/** One finished drill or repetition in the ledger: the day, the kind in
 *  words, leader dots to the result. Not a button: the view model keeps no
 *  end page for a finished drill. */
function LedgerRow({ row }: { row: HistoryRowView }) {
  return (
    <div className="fp-ledger-row">
      <span className="fp-ledger-day">{dayOf(row)}</span>
      <span className="fp-plan-line">
        <span className="fp-ledger-kind">{kindWord(row)}</span>
        <span className="fp-leader" aria-hidden />
        <span className="fp-ledger-score">
          {row.correct}/{row.total}
        </span>
      </span>
    </div>
  )
}

// ── The weekly curve ─────────────────────────────────────────────────

/**
 * The estimate over the weeks, drawn as a book figure: hairline axes, three
 * gridlines, the goal as a dashed line labelled at its end, the weeks as a
 * 1.5 px ink line with the last point an accent dot and its value; weeks
 * without practice are a dotted bridge. Below, an italic caption, and the
 * values as a table on demand, for everyone. Two active weeks first.
 */
function TrendChart({
  weekly,
  goal,
  phone,
}: {
  weekly: FramstegView['weekly']
  goal?: number
  phone: boolean
}) {
  const [table, setTable] = useState(false)
  const points = weekly.map((w, i) => {
    const start = validDate(w.weekStart)
    return { i, score: w.score, week: start ? isoWeek(start) : null }
  })
  const known = points.filter(
    (p): p is { i: number; score: number; week: number | null } => p.score != null,
  )
  if (known.length < 2) {
    return <p className="fp-empty">Kurvan börjar när du har övat två veckor.</p>
  }
  const W = phone ? 350 : 640
  const H = phone ? 200 : 220
  const L = 36
  const R = phone ? 52 : 64
  const T = 14
  const B = 30
  const lowest = Math.min(1, ...known.map((k) => k.score))
  const lo = Math.max(0, Math.floor((lowest - 0.1) * 2) / 2)
  const hi = 2
  const x = (i: number) => L + (i / Math.max(1, points.length - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - T - B)
  const at = (p: { i: number; score: number }) => `${x(p.i).toFixed(1)},${y(p.score).toFixed(1)}`
  const solid: string[] = []
  const bridges: string[] = []
  let run: string[] = []
  let prev: { i: number; score: number } | null = null
  for (const p of known) {
    if (prev && p.i - prev.i > 1) {
      bridges.push(`M${at(prev)} L${at(p)}`)
      if (run.length > 1) solid.push(run.join(' '))
      run = []
    }
    run.push(at(p))
    prev = p
  }
  if (run.length > 1) solid.push(run.join(' '))
  const first = known[0]
  const last = known[known.length - 1]
  const step = phone ? 3 : 2
  const gridlines = [1, 1.5, 2].filter((v) => v > lo)
  const weekCount = points.length
  const label = `Poäng per vecka de senaste ${inWords(weekCount)} veckorna, från ${fmtScore(
    first.score,
  )}${first.week != null ? ` i vecka ${first.week}` : ''} till ${fmtScore(last.score)}${
    last.week != null ? ` i vecka ${last.week}` : ''
  }${goal != null ? `; mål ${fmtScore(goal)}` : ''}.`
  return (
    <figure className="fp-chart">
      <svg
        className="fp-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        preserveAspectRatio="xMidYMid meet"
      >
        <line className="fp-chart-axis" x1={L} x2={W - R} y1={H - B} y2={H - B} />
        {gridlines.map((v) => (
          <g key={v}>
            <line className="fp-chart-grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text className="fp-chart-tick" x={L - 8} y={y(v) + 4} textAnchor="end">
              {fmtScore(v)}
            </text>
          </g>
        ))}
        {goal != null ? (
          <g>
            <line className="fp-chart-goal" x1={L} x2={W - R} y1={y(goal)} y2={y(goal)} />
            <text className="fp-chart-tick" x={W - R + 8} y={y(goal) + 4}>
              mål {fmtScore(goal)}
            </text>
          </g>
        ) : null}
        {bridges.map((d) => (
          <path key={d} className="fp-chart-bridge" d={d} />
        ))}
        {solid.map((pts) => (
          <polyline key={pts} className="fp-chart-line" points={pts} />
        ))}
        {known.map((p) => (
          <circle key={p.i} className="fp-chart-pt" cx={x(p.i)} cy={y(p.score)} r={2} />
        ))}
        <circle className="fp-chart-end" cx={x(last.i)} cy={y(last.score)} r={4} />
        <text
          className="fp-chart-value"
          x={x(last.i) + 8}
          y={y(last.score) + (goal != null && Math.abs(y(last.score) - y(goal)) < 14 ? 16 : 5)}
        >
          {fmtScore(last.score)}
        </text>
        {points
          .filter((p) => p.week != null && (points.length - 1 - p.i) % step === 0)
          .map((p) => (
            <text key={p.i} className="fp-chart-tick" x={x(p.i)} y={H - B + 18} textAnchor="middle">
              v.{p.week}
            </text>
          ))}
      </svg>
      <figcaption className="fp-chart-caption">
        Poäng per vecka, de senaste {inWords(weekCount)} veckorna.
        {bridges.length ? ' Prickat: veckor utan övning.' : ''}
      </figcaption>
      <button
        type="button"
        className="fp-more"
        aria-expanded={table}
        aria-controls="fp-chart-table"
        onClick={() => setTable(!table)}
      >
        {table ? 'Dölj tabellen' : 'Visa som tabell'}
        <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
      </button>
      {table ? (
        <table className="fp-table fp-chart-table" id="fp-chart-table">
          <caption className="fp-sr">Poäng per vecka</caption>
          <thead>
            <tr>
              <th scope="col">Vecka</th>
              <th scope="col">Poäng</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.i}>
                <th scope="row">{p.week != null ? `v.${p.week}` : '—'}</th>
                <td>
                  {p.score != null ? (
                    fmtScore(p.score)
                  ) : (
                    <span className="fp-table-none">ingen övning</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </figure>
  )
}

/** Practice days, one row a calendar week: a dot a day practised and the
 *  count in words — no empty places for the other days, no streak. */
function WeekDots({ days, goal }: { days: FramstegView['days']; goal?: number }) {
  const [all, setAll] = useState(false)
  const weeks = calendarWeeks(days)
  if (weeks.length === 0) {
    return <p className="fp-margin-note">Dagarna du övar samlas här, vecka för vecka.</p>
  }
  const shown = all ? weeks : weeks.slice(-6)
  return (
    <>
      <ol className="fp-weekdots">
        {shown.map((w) => {
          const words =
            w.current && goal != null
              ? `${inWords(w.count)} av ${inWords(goal)} dagar`
              : w.count === 0
                ? 'ingen dag'
                : `${inWords(w.count)} ${w.count === 1 ? 'dag' : 'dagar'}`
          return (
            <li key={w.key} className="fp-weekdot" data-current={w.current ? 'true' : undefined}>
              <span className="fp-weekdot-wk" aria-hidden>
                v.{w.week}
              </span>
              <span
                className="fp-weekdot-dots"
                role="img"
                aria-label={`Vecka ${w.week}${w.current ? ', den här veckan' : ''}: ${words}`}
              >
                {Array.from({ length: w.count }, (_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a row of identical marks
                  <i key={i} />
                ))}
              </span>
              <span className="fp-weekdot-n" aria-hidden>
                {words}
              </span>
            </li>
          )
        })}
      </ol>
      {weeks.length > 6 ? (
        <button type="button" className="fp-more" aria-expanded={all} onClick={() => setAll(!all)}>
          {all ? 'Visa de senaste sex veckorna' : `Visa alla ${weeks.length} veckor`}
          <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </>
  )
}

// ── Historik ─────────────────────────────────────────────────────────

/** The ledger's weeks, newest first, each with its rows and their place in
 *  the whole history (1-based). */
function byWeek(rows: readonly HistoryRowView[]) {
  const weeks: { key: string; label: string; rows: { row: HistoryRowView; n: number }[] }[] = []
  rows.forEach((row, i) => {
    const d = validDate(row.endedAt)
    const monday = d ? mondayOf(d) : null
    const key = monday ? String(monday.getTime()) : 'utan-datum'
    let week = weeks.find((w) => w.key === key)
    if (!week) {
      week = { key, label: monday ? weekLabel(monday) : 'Utan datum', rows: [] }
      weeks.push(week)
    }
    week.rows.push({ row, n: i + 1 })
  })
  return weeks
}

function Historik({
  width,
  live,
  onBack,
  onGo,
}: {
  width: WidthKey
  live: boolean
  onBack: () => void
  onGo: (d: Destination) => void
}) {
  const { data, actions } = useDirectionData()
  const rows = data.framsteg.history
  const results = data.provpass.hub.results
  const empty = rows.length === 0 && results.length === 0
  useKeyMap(empty ? { Escape: onBack, Enter: () => onGo('ova') } : { Escape: onBack }, live)
  const total = rows.length + results.length
  return (
    <FolioPage
      width={width}
      masthead={
        <Masthead label="Historik" crumb={{ label: 'Framsteg', onClick: onBack }}>
          <span className="fp-count">{total} pass</span>
        </Masthead>
      }
    >
      <h1 className="fp-greet">Tidigare pass.</h1>
      <p className="fp-day">
        Dina avslutade övningar och repetitioner, vecka för vecka – och provpassen för sig.
      </p>
      <div className="fp-historik" data-testid="rd-framsteg-history">
        {results.length ? (
          <section className="fp-section" aria-labelledby="fp-hist-prov-h">
            <div className="fp-section-head">
              <h2 className="fp-h2" id="fp-hist-prov-h">
                Provpass
              </h2>
              <span className="fp-meta">{results.length} pass</span>
            </div>
            <ol className="fp-ledger">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="fp-ledger-row"
                    onClick={() => actions.openProvResult(r.id)}
                    aria-label={`${r.when}, provpass ${r.half === 'verbal' ? 'verbal' : 'kvantitativ'}, ${passName(r.sitting, r.pass)}, ${r.correct} av ${r.presented}${r.score != null ? `, ${fmtPassScore(r.score)}` : ''}. Visa resultatet`}
                  >
                    <span className="fp-ledger-day">{r.when}</span>
                    <span className="fp-plan-line">
                      <span className="fp-ledger-kind">
                        Provpass · {r.half === 'verbal' ? 'Verbal' : 'Kvantitativ'},{' '}
                        {r.mode === 'authentic' ? 'riktigt' : 'genererat'}
                      </span>
                      <span className="fp-leader" aria-hidden />
                      <span className="fp-ledger-score">
                        {r.correct}/{r.presented}
                        {r.score != null ? ` · ${fmtPassScore(r.score)}` : ''}
                      </span>
                      <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {byWeek(rows).map((week) => (
          <section key={week.key} className="fp-section" aria-labelledby={`fp-wk-${week.key}`}>
            <div className="fp-section-head">
              <h2 className="fp-h2" id={`fp-wk-${week.key}`}>
                {week.label}
              </h2>
              <span className="fp-meta">{week.rows.length} pass</span>
            </div>
            <ol className="fp-ledger">
              {week.rows.map(({ row, n }) => (
                <li key={row.id} data-testid={`rd-framsteg-history-item-${n}`}>
                  <LedgerRow row={row} />
                </li>
              ))}
            </ol>
          </section>
        ))}
        {empty ? (
          <div className="fp-section">
            <p className="fp-empty">Inga avslutade pass än. Kör en övning så landar den här.</p>
            <div className="fp-resume-foot">
              <button type="button" className="fp-btn" onClick={() => onGo('ova')}>
                Till Öva
                <kbd className="fp-kbd" aria-hidden>
                  ↵
                </kbd>
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <p className="fp-footnote fp-footnote--plain">Ett avbrutet provpass räknas inte.</p>
    </FolioPage>
  )
}

// ── Fällor ───────────────────────────────────────────────────────────

function Fallor({
  width,
  live,
  onBack,
  onGo,
}: {
  width: WidthKey
  live: boolean
  onBack: () => void
  onGo: (d: Destination) => void
}) {
  const { data, actions } = useDirectionData()
  const traps = data.home.traps
  const lead = traps.find((t) => t.rising) ?? traps[0] ?? null
  const practise = (t: TrapView) =>
    actions.startDrill({ kind: 'framework', frameworkId: t.frameworkId, section: t.section })
  useKeyMap({ Escape: onBack, Enter: lead ? () => practise(lead) : () => onGo('ova') }, live)
  const groups = SECTION_KEYS.map((section) => ({
    section,
    traps: traps.filter((t) => t.section === section),
  })).filter((g) => g.traps.length > 0)
  return (
    <FolioPage
      width={width}
      masthead={<Masthead label="Fällor" crumb={{ label: 'Framsteg', onClick: onBack }} />}
    >
      <h1 className="fp-greet">Dina fällor.</h1>
      <p className="fp-day">Mönster som har lurat dig mer än en gång – de som ökar först.</p>
      {lead ? (
        <Lead labelledBy="fp-fall-lead">
          <div className="fp-resume-top">
            <span className="fp-label">
              {lead.section}
              {lead.rising ? ' · ökar' : ''}
            </span>
          </div>
          <h2 className="fp-lead-title" id="fp-fall-lead">
            {lead.name}
          </h2>
          {lead.pattern ? <p className="fp-lead-sub">{lead.pattern}</p> : null}
          <div className="fp-resume-foot">
            <button type="button" className="fp-btn fp-btn--big" onClick={() => practise(lead)}>
              Öva fällan
              <kbd className="fp-kbd" aria-hidden>
                ↵
              </kbd>
            </button>
          </div>
        </Lead>
      ) : (
        <Lead labelledBy="fp-fall-lead">
          <p className="fp-empty fp-empty--lead" id="fp-fall-lead">
            Inga återkommande fällor än – de syns här när samma mönster lurar dig mer än en gång.
          </p>
          <div className="fp-resume-foot">
            <button type="button" className="fp-btn fp-btn--big" onClick={() => onGo('ova')}>
              Till Öva
              <kbd className="fp-kbd" aria-hidden>
                ↵
              </kbd>
            </button>
          </div>
        </Lead>
      )}
      {groups.length ? (
        <section className="fp-section" aria-labelledby="fp-fall-reg-h">
          <div className="fp-section-head">
            <h2 className="fp-h2" id="fp-fall-reg-h">
              Register
            </h2>
            <span className="fp-meta">i provets ordning</span>
          </div>
          {groups.map((g) => (
            <div className="fp-part-block" key={g.section}>
              <PartHead id={`fp-fall-${slug(g.section)}`}>
                {g.section} · {sectionLongLabel(g.section)}
              </PartHead>
              <ul aria-labelledby={`fp-fall-${slug(g.section)}`}>
                {g.traps.map((t) => (
                  <li key={t.frameworkId} className="fp-trap-row">
                    <p className="fp-trap-row-head">
                      <span className="fp-trap-name">{t.name}</span>
                      <span className="fp-trap-count">
                        {t.count} gånger{t.rising ? ' · ökar' : ''}
                      </span>
                    </p>
                    {t.pattern ? <span className="fp-trap-pattern">{t.pattern}</span> : null}
                    <span className="fp-trap-links">
                      <button
                        type="button"
                        className="fp-link"
                        onClick={() => actions.openLesson(t.frameworkId)}
                        aria-label={`Slå upp ${t.name}`}
                      >
                        Slå upp
                        <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="fp-link"
                        onClick={() => practise(t)}
                        aria-label={`Öva ${t.name}`}
                      >
                        Öva
                        <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
    </FolioPage>
  )
}
