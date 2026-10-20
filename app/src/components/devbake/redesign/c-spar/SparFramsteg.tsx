// Spår · Framsteg (11) — where you stand and what moves you up, drawn as a
// climb. Two views, siblings switched in the head (Översikt · Historik):
//
//   - Översikt: the prognosis is the display title ("≈ 1,4 av 2,0") and the
//     week in words is its lede, the approved caveat under it. "Nästa steg
//     uppåt" names up to three sections, numbered stops ringed in their
//     hues; the first "Öva …" is the one green pill. Klättringen draws the
//     weekly estimate as an elevation line toward the goal's flag, weeks
//     without practice bridged with dots. Delproven are the eight sections
//     as rows — a section stop, the score ± its band, the trend as a glyph
//     and a word, a mini scale — each opening in place to "Öva" and "Läs".
//     Veckorna are earned dots per week: no streak to lose, a missed day
//     never drawn. Repetition counts the queue.
//   - Historik: every finished pass as a vertical stig grouped by day, each
//     pass a stop in its section's hue (↻ a repetition).
//
// Kit v2: everything comes from useDirectionData().data.framsteg (the
// countdown from data.home.exam, the ripe misses from data.repetera);
// practising, Uppslag and Repetera are its actions. The goal, the range
// and the weekly goal have no real source yet and are left out when
// absent.

import {
  ArrowRight,
  ChevronDown,
  Flag,
  RotateCcw,
  Shuffle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtDelta, fmtScore, useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  FramstegView,
  Half,
  HistoryRowView,
  SectionScoreView,
} from '@/components/devbake/redesign/viewModel'
import type { Section } from '@/data/questions'
import { isoWeek } from '@/lib/scoring'
import {
  cap,
  count,
  Kbd,
  KVANT,
  SparScale,
  SparSegmented,
  SparStop,
  sectionMinutes,
  sectionName,
  sectionSlug,
  VERBAL,
} from './sparParts'

export type FramstegTab = 'oversikt' | 'historik'

const CONFIDENCE: Record<SectionScoreView['confidence'], string> = {
  low: 'osäker',
  medium: 'rimlig',
  high: 'säker',
}

type Trend = 'up' | 'flat' | 'down'
const TREND_WORD: Record<Trend, string> = { up: 'uppåt', flat: 'stilla', down: 'nedåt' }

function trendOf(t: number | null): Trend | null {
  if (t == null) return null
  return t > 0.02 ? 'up' : t < -0.02 ? 'down' : 'flat'
}

/** A section gone quiet: "inte övad på 16 dagar" from two weeks. */
function staleDays(s: SectionScoreView): number | null {
  return s.daysSince != null && s.daysSince >= 14 ? s.daysSince : null
}

const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

/** One step up: a section to practise and why, or (no prognosis yet) the
 *  step that starts one. */
type Step = {
  key: string
  section: Section | null
  head: ReactNode
  label: string
  run: () => void
}

export function SparFramsteg({
  width,
  live,
  initialView,
}: {
  width: WidthKey
  live: boolean
  /** Idag's "Alla pass" lands on Historik. */
  initialView: FramstegTab
}) {
  const { data, actions } = useDirectionData()
  const f = data.framsteg
  const p = f.prognosis
  const exam = data.home.exam
  const phone = width === 'phone'
  const id = useId()
  const [view, setView] = useState<FramstegTab>(initialView)

  const practised = (half: Half) => f.sections.some((s) => s.half === half && s.attempts90d > 0)
  const fresh = !practised('verbal') && !practised('kvant')
  const missing: Half | null =
    p.total != null || fresh ? null : practised('verbal') ? 'kvant' : 'verbal'

  const practise = (section: Section) => actions.startDrill({ kind: 'section', section })
  const steps: Step[] = fresh
    ? [
        {
          key: 'start',
          section: null,
          head: 'En första blandad runda visar var du står.',
          label: `Börja här · ${count(data.ova.mixed.questions, 'fråga', 'frågor')}`,
          run: () => actions.startDrill({ kind: 'mixed' }),
        },
      ]
    : missing
      ? [missingStep(f, missing, practise)]
      : focusSteps(f, practise)

  const keys: Record<string, () => void> = {}
  if (view === 'oversikt' && steps[0]) keys.Enter = steps[0].run
  if (view === 'historik' && f.history.length === 0) keys.Enter = () => actions.go('ova')
  useKeyMap(keys, live)

  const segmented = (
    <SparSegmented
      label="Visa"
      options={[
        { key: 'oversikt', label: 'Översikt' },
        { key: 'historik', label: 'Historik' },
      ]}
      value={view}
      onChange={setView}
    />
  )
  const lede =
    view === 'historik'
      ? 'Dina avslutade pass, dag för dag.'
      : fresh
        ? 'Svara på några frågor så börjar den här sidan leva.'
        : missing
          ? `Prognosen behöver både verbal och kvant. Du har övat ${missing === 'kvant' ? 'verbal' : 'kvant'} — en ${missing === 'kvant' ? 'kvant' : 'verbal'}runda till så visas den.`
          : weekWords(f)
  const range = p.low != null && p.high != null ? { low: p.low, high: p.high } : null

  const next = (
    <section className="sp-fs-next" aria-labelledby={`${id}-next`}>
      <h2 className="sp-h3" id={`${id}-next`}>
        Nästa steg uppåt
      </h2>
      <ol className="sp-fs-steps">
        {steps.map((s, i) => (
          <li key={s.key} className="sp-fs-step">
            <SparStop state="todo" size={36} sec={s.section ?? undefined} label={i + 1} />
            <div className="sp-fs-step-body">
              <p className="sp-fs-step-head">{s.head}</p>
              <div className="sp-fs-step-actions">
                <button
                  type="button"
                  className={
                    i === 0
                      ? 'sp-btn sp-btn--primary sp-btn--lg'
                      : 'sp-btn sp-btn--quiet sp-btn--sm'
                  }
                  onClick={s.run}
                >
                  {s.label}
                  {i === 0 ? <Kbd>↵</Kbd> : null}
                </button>
                {s.section ? (
                  <button type="button" className="sp-link" onClick={() => actions.go('uppslag')}>
                    Läs i Uppslag
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
  const climb = <Climb f={f} id={id} fresh={fresh} />
  const sections = (
    <section className="sp-fs-secs" aria-labelledby={`${id}-secs`}>
      <h2 className="sp-h3" id={`${id}-secs`}>
        Delproven
      </h2>
      {(['verbal', 'kvant'] as const).map((half) => {
        const order = half === 'verbal' ? VERBAL : KVANT
        const list = order
          .map((code) => f.sections.find((s) => s.section === code))
          .filter((s): s is SectionScoreView => s != null)
        const score = half === 'verbal' ? p.verbal : p.quant
        if (list.length === 0) return null
        return (
          <div key={half} className="sp-fs-group">
            <h3 className="sp-fs-group-h">
              {half === 'verbal' ? 'Verbal' : 'Kvant'}
              {score != null ? <span className="sp-num"> · {fmtScore(score)}</span> : null}
            </h3>
            <ul className="sp-fs-lines">
              {list.map((s) => (
                <SectionLine key={s.section} s={s} />
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
  const weeks = <Weeks f={f} id={id} />
  const repetition = (
    <section className="sp-fs-rep" aria-labelledby={`${id}-rep`}>
      <div className="sp-side-head">
        <h2 className="sp-h3" id={`${id}-rep`}>
          Repetition
        </h2>
      </div>
      <p className="sp-fs-rep-n">
        <b className="sp-num">{data.repetera.dueNow}</b> redo nu ·{' '}
        <b className="sp-num">{f.totals.mistakesActive}</b> i kön ·{' '}
        <b className="sp-num">{f.totals.mistakesResolved}</b> inlärda
      </p>
      <div className="sp-fs-links">
        <button type="button" className="sp-link" onClick={actions.openRepetera}>
          Till Repetera
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
        </button>
        <button type="button" className="sp-link" onClick={() => setView('historik')}>
          Historik · {count(f.history.length, 'pass', 'pass')}
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </section>
  )

  return (
    <div className="sp-page sp-fs" data-phone={String(phone)} data-view={view}>
      <header className="sp-home-head">
        <div className="sp-home-intro">
          <p className="sp-eyebrow">
            {view === 'oversikt'
              ? `Framsteg · ${count(exam.daysLeft, 'dag', 'dagar')} till ${exam.label}`
              : 'Framsteg'}
          </p>
          {view === 'oversikt' ? (
            <h1
              className="sp-display sp-display--xl sp-fs-title"
              tabIndex={-1}
              data-testid="rd-framsteg-prognosis"
            >
              {p.total != null ? (
                <>
                  <span className="sp-sr">Prognos: ungefär</span> <span aria-hidden>≈ </span>
                  {fmtScore(p.total)} <span className="sp-fs-title-of">av 2,0</span>
                  {range ? (
                    <span className="sp-sr">
                      , osäkerhet {fmtScore(range.low)} till {fmtScore(range.high)}
                    </span>
                  ) : null}
                </>
              ) : (
                'Ingen prognos än'
              )}
            </h1>
          ) : (
            <h1 className="sp-display sp-display--xl" tabIndex={-1}>
              Historik
            </h1>
          )}
          <div className="sp-lede-row">
            <p className="sp-lede">{lede}</p>
            {phone ? segmented : null}
          </div>
          {view === 'oversikt' && p.caveat ? (
            <p className="sp-caveat sp-fs-caveat">{p.caveat}</p>
          ) : null}
        </div>
        {phone ? null : <div className="sp-home-tools">{segmented}</div>}
      </header>

      <div className="sp-fs-panel" hidden={view !== 'oversikt'}>
        {phone ? (
          <div className="sp-fs-stack">
            {next}
            {climb}
            {sections}
            {weeks}
            {repetition}
          </div>
        ) : (
          <div className="sp-fs-grid">
            <div className="sp-fs-main">
              {climb}
              {sections}
            </div>
            <aside className="sp-fs-side" aria-label="Nästa steg och veckorna">
              {next}
              {weeks}
              {repetition}
            </aside>
          </div>
        )}
      </div>
      <div className="sp-fs-panel" hidden={view !== 'historik'}>
        <Historik f={f} id={id} now={new Date(data.home.today.iso)} />
      </div>
    </div>
  )
}

/** The weakness ranking's sections, each with its reason in words. */
function focusSteps(f: FramstegView, practise: (s: Section) => void): Step[] {
  const scored = f.sections.filter((s) => s.score != null)
  const lowest = scored.reduce<SectionScoreView | null>(
    (a, b) => (a == null || (b.score as number) < (a.score as number) ? b : a),
    null,
  )
  return f.focus
    .map((code) => f.sections.find((s) => s.section === code))
    .filter((s): s is SectionScoreView => s != null)
    .slice(0, 3)
    .map((s) => {
      const quiet = staleDays(s)
      const trend = trendOf(s.trend)
      const why =
        quiet != null
          ? `Inte övad på ${quiet} dagar`
          : trend === 'down'
            ? 'På väg ner'
            : lowest?.section === s.section
              ? 'Lägst just nu'
              : 'Mycket att hämta'
      return {
        key: s.section,
        section: s.section,
        head: (
          <>
            <b>{s.section}</b> · {why}
            {s.score != null ? (
              <>
                {' · '}
                <span className="sp-num">{fmtScore(s.score)}</span>
              </>
            ) : null}
          </>
        ),
        label: `Öva ${s.section} · ca ${sectionMinutes(s.section)} min`,
        run: () => practise(s.section),
      }
    })
}

/** One half practised: the missing half's first ranked section (its first
 *  section when nothing ranks there yet). */
function missingStep(f: FramstegView, half: Half, practise: (s: Section) => void): Step {
  const ranked = f.focus.find((code) => (half === 'verbal' ? VERBAL : KVANT).includes(code))
  const section = ranked ?? (half === 'verbal' ? VERBAL[0] : KVANT[0])
  return {
    key: section,
    section,
    head: (
      <>
        <b>{section}</b> · {half === 'verbal' ? 'Verbal' : 'Kvant'} saknas i prognosen
      </>
    ),
    label: `Öva ${section} · ca ${sectionMinutes(section)} min`,
    run: () => practise(section),
  }
}

/** The week in words; each clause only when its data is there. */
function weekWords(f: FramstegView): string {
  const p = f.prognosis
  const first: string[] = []
  if (p.total != null && p.delta != null) {
    first.push(
      p.delta > 0
        ? `Prognosen steg ${fmtDelta(p.delta)} den här veckan`
        : p.delta < 0
          ? `Prognosen föll ${fmtDelta(p.delta)} den här veckan`
          : 'Prognosen låg still den här veckan',
    )
  }
  if (f.week.attemptsThisWeek > 0) {
    first.push(
      `${count(f.week.attemptsThisWeek, 'fråga', 'frågor')}${f.week.accuracy7d != null ? ` med ${Math.round(f.week.accuracy7d * 100)} % träffsäkerhet` : ''}`,
    )
  }
  const second: string[] = []
  if (p.verbal != null && p.quant != null) {
    const gap = p.verbal - p.quant
    second.push(
      gap >= 0.05
        ? `verbal (${fmtScore(p.verbal)}) drar ifrån kvant (${fmtScore(p.quant)})`
        : gap <= -0.05
          ? `kvant (${fmtScore(p.quant)}) drar ifrån verbal (${fmtScore(p.verbal)})`
          : `verbal och kvant ligger jämnt (${fmtScore(p.verbal)})`,
    )
  }
  const low = f.focus
    .map((code) => f.sections.find((s) => s.section === code))
    .filter((s): s is SectionScoreView => s?.score != null)
    .slice(0, 2)
  if (low.length > 0) {
    second.push(
      `mest att hämta finns i ${low.map((s) => `${s.section} (${fmtScore(s.score as number)})`).join(' och ')}`,
    )
  }
  const out: string[] = []
  if (first.length > 0) out.push(`${first.join(' — ')}.`)
  if (second.length > 0) out.push(`${cap(second.join('; '))}.`)
  return out.join(' ')
}

// ── Klättringen ──────────────────────────────────────────────────────

/**
 * The weekly estimate as an elevation line: solid between weeks in a row,
 * a dotted bridge over weeks without practice, a light wash under it. The
 * goal is a dashed line ending in the goal's flag; this week is the
 * current stop with its value beside it. A figure with its trend in words
 * and the values as a table on request. Lugnt läge keeps only the words.
 */
function Climb({ f, id, fresh }: { f: FramstegView; id: string; fresh: boolean }) {
  const [table, setTable] = useState(false)
  const weeks = f.weekly
  const known = weeks
    .map((w, i) => ({ i, score: w.score, weekStart: w.weekStart }))
    .filter((w): w is { i: number; score: number; weekStart: string } => w.score != null)
  const head = (
    <div className="sp-side-head">
      <h2 className="sp-h3" id={`${id}-climb`}>
        Klättringen
      </h2>
      {weeks.length > 0 ? (
        <span className="sp-side-meta">{count(weeks.length, 'vecka', 'veckor')}</span>
      ) : null}
    </div>
  )
  if (known.length < 2) {
    return (
      <section className="sp-fs-climb" aria-labelledby={`${id}-climb`}>
        {head}
        {fresh ? (
          <div className="sp-trail sp-climb-start" aria-hidden>
            <SparStop state="now" size={30} label="" />
            <SparStop state="goal" size={30} />
          </div>
        ) : null}
        <p className="sp-fs-little">Kurvan visas efter två veckor med övning.</p>
      </section>
    )
  }
  const target = f.prognosis.target ?? null
  const values = known.map((k) => k.score)
  const lo = Math.min(1, Math.floor(Math.min(...values) * 2) / 2)
  const hi = 2
  const n = weeks.length
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  const y = (v: number) => ((hi - Math.min(hi, Math.max(lo, v))) / (hi - lo)) * 100
  const ticks: number[] = []
  for (let t = lo; t <= hi + 1e-9; t += 0.5) ticks.push(Math.round(t * 10) / 10)
  const first = known[0]
  const last = known[known.length - 1]
  const now = weeks[n - 1]?.score != null ? last : null
  const range =
    now && f.prognosis.low != null && f.prognosis.high != null
      ? { low: f.prognosis.low, high: f.prognosis.high }
      : null
  const area = [
    `${x(first.i)},100`,
    ...known.map((k) => `${x(k.i)},${y(k.score)}`),
    `${x(last.i)},100`,
  ].join(' ')
  const caption = `Från ${fmtScore(first.score)} till ${fmtScore(last.score)} på ${count(last.i - first.i + 1, 'vecka', 'veckor')}${target != null ? `; målet är ${fmtScore(target)}` : ''}.`
  const week = (iso: string) => `v. ${isoWeek(new Date(iso))}`
  return (
    <section className="sp-fs-climb" aria-labelledby={`${id}-climb`}>
      {head}
      <figure className="sp-climb">
        <div className="sp-climb-plot" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="sp-climb-tick" style={{ top: `${y(t)}%` }}>
              {fmtScore(t)}
            </span>
          ))}
          <svg
            className="sp-climb-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <polygon className="sp-climb-area" points={area} />
            {target != null ? (
              <line className="sp-climb-goal" x1="0" x2="100" y1={y(target)} y2={y(target)} />
            ) : null}
            {known.slice(1).map((k, j) => {
              const a = known[j]
              return (
                <line
                  key={k.i}
                  className={k.i === a.i + 1 ? 'sp-climb-line' : 'sp-climb-bridge'}
                  x1={x(a.i)}
                  y1={y(a.score)}
                  x2={x(k.i)}
                  y2={y(k.score)}
                />
              )
            })}
          </svg>
          {range ? (
            <span
              className="sp-climb-range"
              style={{
                left: `${x(n - 1)}%`,
                top: `${y(range.high)}%`,
                height: `${y(range.low) - y(range.high)}%`,
              }}
            />
          ) : null}
          {target != null ? (
            <span className="sp-climb-flag" style={{ top: `${y(target)}%` }}>
              <SparStop state="goal" size={24} />
            </span>
          ) : null}
          {now ? (
            <span
              className="sp-climb-now"
              style={{ left: `${x(now.i)}%`, top: `${y(now.score)}%` }}
            >
              <SparStop state="now" size={20} label="" />
              <b className="sp-climb-now-n">≈ {fmtScore(now.score)}</b>
            </span>
          ) : null}
          <span className="sp-climb-week" data-at="start">
            {week(weeks[0].weekStart)}
          </span>
          <span className="sp-climb-week" data-at="end">
            {week(weeks[n - 1].weekStart)}
          </span>
        </div>
        <figcaption className="sp-climb-cap">
          {caption}
          <button
            type="button"
            className="sp-show sp-climb-toggle"
            aria-expanded={table}
            aria-controls={`${id}-table`}
            onClick={() => setTable(!table)}
          >
            {table ? 'Dölj tabellen' : 'Visa som tabell'}
            <ChevronDown
              size={16}
              strokeWidth={2.25}
              aria-hidden
              style={{ rotate: table ? '180deg' : '0deg' }}
            />
          </button>
        </figcaption>
        {table ? (
          <table className="sp-climb-table" id={`${id}-table`}>
            <caption className="sp-sr">Skattning per vecka</caption>
            <thead>
              <tr>
                <th scope="col">Vecka</th>
                <th scope="col">Skattning</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.weekStart}>
                  <th scope="row">{week(w.weekStart)}</th>
                  <td className="sp-num">{w.score != null ? fmtScore(w.score) : 'ingen övning'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </figure>
    </section>
  )
}

// ── Delproven ────────────────────────────────────────────────────────

/** A section: its stop, its name and facts, the score ± its band, the
 *  trend and a mini scale. It opens in place to its two quiet actions;
 *  Esc folds it back. Everything it shows is in its spoken name. */
function SectionLine({ s }: { s: SectionScoreView }) {
  const { actions } = useDirectionData()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const region = useId()
  const name = sectionName(s.section)
  const trend = trendOf(s.trend)
  const quiet = staleDays(s)
  const tried = s.attempts90d > 0
  const facts = tried
    ? [
        `${s.attempts90d} försök`,
        CONFIDENCE[s.confidence],
        quiet != null ? `inte övad på ${quiet} dagar` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'inget än'
  const spoken = [
    name,
    s.score != null
      ? `${fmtScore(s.score)}${s.band != null ? ` plus minus ${fmtScore(s.band)}` : ''}`
      : 'inget än',
    trend ? TREND_WORD[trend] : null,
    tried ? `${s.attempts90d} försök` : null,
    tried ? CONFIDENCE[s.confidence] : null,
    quiet != null ? `inte övad på ${quiet} dagar` : null,
  ]
    .filter(Boolean)
    .join(', ')
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Escape' || !open) return
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    buttonRef.current?.focus()
  }
  return (
    <li
      className="sp-fs-line"
      data-sec={s.section}
      data-open={String(open)}
      data-tried={String(tried)}
      data-testid={`rd-framsteg-section-${sectionSlug(s.section)}`}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className="sp-fs-line-main"
        ref={buttonRef}
        aria-expanded={open}
        aria-controls={region}
        aria-label={spoken}
        onClick={() => setOpen(!open)}
      >
        <SparStop state="section" size={36} sec={s.section} label={s.section} />
        <span className="sp-fs-line-text">
          <span className="sp-fs-line-name">{name}</span>
          <span className="sp-fs-line-facts">{facts}</span>
        </span>
        <span className="sp-fs-line-score sp-num">
          {s.score != null ? fmtScore(s.score) : '–'}
          {s.score != null && s.band != null ? (
            <span className="sp-fs-band"> ±{fmtScore(s.band)}</span>
          ) : null}
        </span>
        <span className="sp-fs-trend" data-trend={trend ?? 'none'}>
          {trend === 'up' ? (
            <TrendingUp size={17} strokeWidth={2.25} />
          ) : trend === 'down' ? (
            <TrendingDown size={17} strokeWidth={2.25} />
          ) : trend === 'flat' ? (
            <ArrowRight size={17} strokeWidth={2.25} />
          ) : null}
        </span>
        <span className="sp-fs-line-scale">
          {s.score != null ? (
            <SparScale
              value={s.score}
              band={s.band != null ? { low: s.score - s.band, high: s.score + s.band } : null}
              size="mini"
            />
          ) : null}
        </span>
        <ChevronDown className="sp-chev" size={18} strokeWidth={2.25} aria-hidden />
      </button>
      {open ? (
        <div className="sp-fs-line-more" id={region}>
          <button
            type="button"
            className="sp-btn sp-btn--quiet sp-btn--sm"
            onClick={() => actions.startDrill({ kind: 'section', section: s.section })}
          >
            Öva {s.section} · ca {sectionMinutes(s.section)} min
          </button>
          <button
            type="button"
            className="sp-btn sp-btn--quiet sp-btn--sm"
            onClick={() => actions.go('uppslag')}
          >
            Läs i Uppslag
          </button>
        </div>
      ) : null}
    </li>
  )
}

// ── Veckorna ─────────────────────────────────────────────────────────

/** Days with practice per week (Monday to Sunday), the last twelve weeks,
 *  oldest first. */
function weekColumns(days: readonly { date: string; n: number }[]) {
  const out: { start: string; days: number }[] = []
  for (const d of days) {
    const [yy, mm, dd] = d.date.split('-').map(Number)
    const date = new Date(yy, (mm || 1) - 1, dd || 1)
    if (Number.isNaN(date.getTime())) continue
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const start = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    const last = out[out.length - 1]
    if (last && last.start === start) last.days += d.n > 0 ? 1 : 0
    else out.push({ start, days: d.n > 0 ? 1 : 0 })
  }
  return out.slice(-12)
}

/** Earned dots only: a week is a column of the days it was practised, a
 *  week that met the goal gets a small flag. Nothing to lose. */
function Weeks({ f, id }: { f: FramstegView; id: string }) {
  const cols = weekColumns(f.days)
  const goal = f.week.goal ?? null
  const thisWeek = f.week.daysPractised ?? cols[cols.length - 1]?.days ?? 0
  const label = `Dagar med övning per vecka, senaste ${count(cols.length, 'veckan', 'veckorna')}: ${cols.map((c) => c.days).join(', ')}${goal != null ? `; målet ${goal}` : ''}`
  return (
    <section className="sp-fs-weeks" data-testid="rd-framsteg-week" aria-labelledby={`${id}-weeks`}>
      <div className="sp-side-head">
        <h2 className="sp-h3" id={`${id}-weeks`}>
          Veckorna
        </h2>
        {f.week.minutesToday != null ? (
          <span className="sp-side-meta">{f.week.minutesToday} min idag</span>
        ) : null}
      </div>
      {cols.length > 0 ? (
        <div
          className="sp-weeks"
          role="img"
          aria-label={label}
          style={{ '--sp-weeks': cols.length } as CSSProperties}
        >
          {cols.map((c) => (
            <span
              key={c.start}
              className="sp-weeks-col"
              data-met={String(goal != null && c.days >= goal)}
            >
              {Array.from({ length: Math.min(7, c.days) }, (_, d) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: a week's fixed days
                <i key={d} />
              ))}
              {goal != null && c.days >= goal ? (
                <Flag className="sp-weeks-flag" size={11} strokeWidth={2.75} aria-hidden />
              ) : null}
            </span>
          ))}
          {goal != null ? (
            <span
              className="sp-weeks-goal"
              style={{ '--sp-weeks-goal': Math.min(7, goal) } as CSSProperties}
            />
          ) : null}
        </div>
      ) : null}
      <p className="sp-goal-text">
        {goal != null ? (
          <>
            <b>
              {thisWeek} av {goal}
            </b>{' '}
            dagar den här veckan
          </>
        ) : (
          <>
            <b>{thisWeek}</b> {thisWeek === 1 ? 'dag' : 'dagar'} den här veckan
          </>
        )}
      </p>
    </section>
  )
}

// ── Historik ─────────────────────────────────────────────────────────

type HFilter = 'allt' | 'ovning' | 'repetition'

function passTitle(row: HistoryRowView): string {
  if (row.kind === 'adaptive_review') return 'Repetition'
  if (row.kind === 'mock' || row.kind === 'mock_diagnostic') return 'Provpass'
  if (row.kind === 'lesson') return 'Lektion'
  if (row.section) return `${row.section}-övning`
  return row.label === 'Övning' ? 'Blandad övning' : row.label
}

function passStop(row: HistoryRowView): ReactNode {
  if (row.kind === 'adaptive_review') {
    return (
      <SparStop
        state="section"
        size={36}
        sec="REP"
        glyph={<RotateCcw size={15} strokeWidth={2.5} />}
      />
    )
  }
  if (row.section)
    return <SparStop state="section" size={36} sec={row.section} label={row.section} />
  return (
    <SparStop state="section" size={36} sec="REP" glyph={<Shuffle size={15} strokeWidth={2.5} />} />
  )
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The passes grouped by day, newest first: "Idag", "Igår", "Onsdag 7 okt". */
function byDay(rows: readonly { row: HistoryRowView; n: number }[], now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const groups: { key: string; label: string; rows: { row: HistoryRowView; n: number }[] }[] = []
  for (const item of rows) {
    const ended = new Date(item.row.endedAt)
    const valid = item.row.endedAt !== '' && !Number.isNaN(ended.getTime())
    const key = valid ? dayKey(ended) : 'utan-datum'
    let group = groups.find((g) => g.key === key)
    if (!group) {
      const day = valid
        ? new Date(ended.getFullYear(), ended.getMonth(), ended.getDate()).getTime()
        : 0
      const ago = Math.round((today - day) / 86_400_000)
      const label = !valid
        ? 'Utan datum'
        : ago === 0
          ? 'Idag'
          : ago === 1
            ? 'Igår'
            : `${WEEKDAYS[ended.getDay()]} ${item.row.when}`
      group = { key, label, rows: [] }
      groups.push(group)
    }
    group.rows.push(item)
  }
  return groups
}

function timeOf(iso: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** The trail you have walked: every finished pass as a stop, grouped by
 *  day, newest first. The filter keeps a group's day heading whenever it
 *  keeps any of its passes. */
function Historik({ f, id, now }: { f: FramstegView; id: string; now: Date }) {
  const { actions } = useDirectionData()
  const [filter, setFilter] = useState<HFilter>('allt')
  const rows = f.history.map((row, i) => ({ row, n: i + 1 }))
  const shown = rows.filter(({ row }) =>
    filter === 'allt'
      ? true
      : filter === 'repetition'
        ? row.kind === 'adaptive_review'
        : row.kind !== 'adaptive_review',
  )
  const groups = byDay(shown, now)
  if (rows.length === 0) {
    return (
      <section className="sp-fs-hist" aria-labelledby={`${id}-hist`}>
        <h2 className="sp-sr" id={`${id}-hist`}>
          Avslutade pass
        </h2>
        <div className="sp-fs-empty">
          <p className="sp-lede">Inga avslutade pass än. Kör en övning så landar den här.</p>
          <button
            type="button"
            className="sp-btn sp-btn--primary sp-btn--lg"
            onClick={() => actions.go('ova')}
          >
            Till Öva
            <Kbd>↵</Kbd>
          </button>
        </div>
        <div className="sp-hist" data-testid="rd-framsteg-history" />
      </section>
    )
  }
  return (
    <section className="sp-fs-hist" aria-labelledby={`${id}-hist`}>
      <div className="sp-fs-hist-head">
        <h2 className="sp-h3" id={`${id}-hist`}>
          {count(rows.length, 'avslutat pass', 'avslutade pass')}
        </h2>
        <SparSegmented
          label="Visa"
          options={[
            { key: 'allt', label: 'Allt' },
            { key: 'ovning', label: 'Övning' },
            { key: 'repetition', label: 'Repetition' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <div className="sp-hist" data-testid="rd-framsteg-history">
        {groups.length === 0 ? <p className="sp-fs-little">Inga pass av det slaget än.</p> : null}
        {groups.map((g) => (
          <section key={g.key} className="sp-hday" aria-labelledby={`${id}-${g.key}`}>
            <h3 className="sp-hday-h" id={`${id}-${g.key}`}>
              {g.label}
            </h3>
            <ol className="sp-hlist">
              {g.rows.map(({ row, n }) => {
                const time = timeOf(row.endedAt)
                return (
                  <li
                    key={row.id}
                    className="sp-hrow"
                    data-kind={row.kind}
                    data-testid={`rd-framsteg-history-item-${n}`}
                  >
                    <span className="sp-hrow-stop" aria-hidden>
                      {passStop(row)}
                    </span>
                    <span className="sp-hrow-text">
                      <b className="sp-hrow-name">{passTitle(row)}</b>
                      <span className="sp-hrow-facts">
                        <span className="sp-num">
                          {row.correct} av {row.total} rätt
                        </span>
                        {time ? (
                          <>
                            {' · '}
                            <span className="sp-num">{time}</span>
                          </>
                        ) : null}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>
      <p className="sp-fs-hist-end">Har du äldre pass än de här kan de inte visas ännu.</p>
    </section>
  )
}
