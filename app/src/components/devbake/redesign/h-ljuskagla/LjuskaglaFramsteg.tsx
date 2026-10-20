import { ArrowRight, LampDesk } from 'lucide-react'
import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useId, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  fmtDelta,
  fmtScore,
  prefersReducedMotion,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  FramstegView,
  HistoryRowView,
  PrognosisView,
  ProvResultSummaryView,
  SectionScoreView,
} from '@/components/devbake/redesign/viewModel'
import { formatSwedishDateShort } from '@/lib/scoring'
import {
  count,
  fmtInt,
  fmtPercent,
  halfName,
  midLine,
  type OpenPage,
  sectionId,
} from './LjuskaglaParts'

const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

/** 0.0784 → "0,08". */
function fmtBand(band: number): string {
  return band.toFixed(2).replace('.', ',')
}

function recency(days: number | null): string | null {
  if (days == null) return null
  if (days === 0) return 'övat idag'
  if (days === 1) return 'övat igår'
  return `övat för ${days} dagar sedan`
}

/** This week's correct fraction against last week's, in words. */
function trendWords(trend: number | null): string | null {
  if (trend == null) return null
  const points = Math.round(Math.abs(trend) * 100)
  if (points === 0) return 'som förra veckan'
  return `${count(points, 'procentenhet', 'procentenheter')} ${trend > 0 ? 'högre' : 'lägre'} i veckan`
}

/** A section row's quiet second line: its evidence, never a zero. */
function evidence(s: SectionScoreView): string {
  if (s.score == null) return 'Inte övat än'
  const parts = [
    `${fmtInt(s.attempts90d)} svar`,
    s.confidence === 'low' ? 'för lite underlag än' : null,
    trendWords(s.trend),
    recency(s.daysSince),
  ].filter(Boolean)
  return parts.join(' · ')
}

/** Why the lamp suggests this section, from what the view model knows. */
function reason(s: SectionScoreView): string {
  const parts = [
    s.score != null
      ? `uppskattat ${fmtScore(s.score)} av 2,0 på ${fmtInt(s.attempts90d)} svar`
      : null,
    s.trend != null && Math.round(s.trend * 100) < 0 ? 'lite lägre än förra veckan' : null,
    s.daysSince != null && s.daysSince >= 7 ? `senast övat för ${s.daysSince} dagar sedan` : null,
    s.confidence === 'low' ? 'underlaget är ännu litet' : null,
  ].filter(Boolean)
  return parts.length
    ? `Behöver mest övning just nu: ${parts.join(', ')}.`
    : 'Behöver mest övning just nu.'
}

/** ["DTK", "KVA"] → "DTK och KVA". */
function andList(items: string[]): string {
  return items.length > 1
    ? `${items.slice(0, -1).join(', ')} och ${items[items.length - 1]}`
    : (items[0] ?? '')
}

const KIND_WORD: Record<HistoryRowView['kind'], string> = {
  drill: 'Övning',
  adaptive_review: 'Repetition',
  mock: 'Provpass',
  mock_diagnostic: 'Diagnos',
  lesson: 'Lektion',
}

/** Scrolls the frame's own scroller (never the stage around it) to `el`
 *  and gives it focus: a jump link inside Framsteg. */
function jumpTo(el: HTMLElement | null) {
  if (!el) return
  const box = el.closest<HTMLElement>('.lj-home-scroll')
  if (box && typeof box.scrollTo === 'function') {
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
    box.scrollTo({
      top: Math.max(0, top - 24),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }
  el.focus({ preventScroll: true })
}

// ── Overview ─────────────────────────────────────────────────────────

function Overview({ prognosis: p, id }: { prognosis: PrognosisView; id: string }) {
  const halves = [
    p.verbal != null ? `${halfName('verbal')} ${fmtScore(p.verbal)}` : null,
    p.quant != null ? `${halfName('kvant')} ${fmtScore(p.quant)}` : null,
  ].filter(Boolean)
  const facts = [
    p.delta != null ? `${fmtDelta(p.delta)} sedan förra veckan` : null,
    p.low != null && p.high != null ? `troligen ${fmtScore(p.low)}–${fmtScore(p.high)}` : null,
    p.target != null ? `mål ${fmtScore(p.target)}` : null,
  ].filter(Boolean)
  return (
    <section className="lj-fs-overview" data-testid="rd-framsteg-prognosis" aria-labelledby={id}>
      <h2 className="lj-eyebrow" id={id} tabIndex={-1}>
        Uppskattat HP-resultat
      </h2>
      {p.total == null ? (
        <p className="lj-fs-empty">
          Prognosen visas när du har svarat på frågor i båda provhalvorna.
        </p>
      ) : (
        <>
          <p className="lj-score lj-fs-score">
            <strong>{fmtScore(p.total)}</strong>
            <span>av 2,0</span>
          </p>
          <div className="lj-score-track lj-fs-track" aria-hidden>
            <i style={{ width: `${(p.total / 2) * 100}%` }} />
            {p.target != null && <b style={{ left: `${(p.target / 2) * 100}%` }} />}
          </div>
        </>
      )}
      {halves.length > 0 && <p className="lj-fs-halves">{halves.join(' · ')}</p>}
      {facts.length > 0 && <p className="lj-fs-facts-line">{facts.join(' · ')}</p>}
      {p.caveat && <p className="lj-caveat">{p.caveat}</p>}
    </section>
  )
}

// ── The weekly curve ─────────────────────────────────────────────────

/**
 * Week by week, pooled accuracy as a score: one accent line that breaks
 * where a week had no answers, its first and last values labelled, and the
 * target as a distinct dashed line. The words and the table say the same.
 */
function Trend({
  weekly,
  target,
  phone,
}: {
  weekly: FramstegView['weekly']
  target?: number
  phone: boolean
}) {
  const id = useId()
  const known = weekly.flatMap((w, i) => (w.score != null ? [{ i, score: w.score }] : []))
  const gaps = weekly.length - known.length
  const first = known[0]
  const last = known[known.length - 1]
  const W = phone ? 320 : 560
  const H = 150
  const pad = { l: 12, r: 52, t: 18, b: 26 }
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, weekly.length - 1)
  const y = (s: number) => pad.t + (1 - s / 2) * (H - pad.t - pad.b)
  // One path piece per run of weeks with answers.
  const runs: { i: number; score: number }[][] = []
  weekly.forEach((w, i) => {
    if (w.score == null) return
    const run = runs[runs.length - 1]
    const prev = run?.[run.length - 1]
    if (prev && prev.i === i - 1) run.push({ i, score: w.score })
    else runs.push([{ i, score: w.score }])
  })
  const date = (iso: string) => formatSwedishDateShort(new Date(iso))
  const summary =
    known.length === 0
      ? 'Inga veckor med svar än.'
      : known.length === 1 && first
        ? `En vecka med svar: ${fmtScore(first.score)}.`
        : `Från ${fmtScore(first?.score ?? 0)} till ${fmtScore(last?.score ?? 0)} över ${count(known.length, 'vecka', 'veckor')} med svar.${gaps > 0 ? ` ${count(gaps, 'vecka', 'veckor')} utan svar syns som ett glapp.` : ''}`
  return (
    <figure className="lj-shade lj-fs-trend" aria-labelledby={id}>
      <div className="lj-section-head">
        <h2 id={id}>Vecka för vecka</h2>
        <span>andel rätt som poäng, {count(weekly.length, 'vecka', 'veckor')}</span>
      </div>
      {known.length >= 2 && (
        <svg
          className="lj-trend"
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          aria-hidden="true"
          focusable="false"
        >
          <line className="lj-trend-base" x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} />
          {target != null && (
            <>
              <line
                className="lj-trend-target"
                x1={pad.l}
                x2={W - pad.r}
                y1={y(target)}
                y2={y(target)}
              />
              <text className="lj-trend-label" x={W - pad.r + 6} y={y(target) + 4}>
                mål {fmtScore(target)}
              </text>
            </>
          )}
          {weekly.map((w, i) => (
            <line
              key={w.weekStart}
              className="lj-trend-tick"
              x1={x(i)}
              x2={x(i)}
              y1={y(0)}
              y2={y(0) + 4}
            />
          ))}
          {runs.map((run) => (
            <polyline
              key={run[0].i}
              className="lj-trend-line"
              points={run.map((p) => `${x(p.i)},${y(p.score)}`).join(' ')}
            />
          ))}
          {known.map((p) => (
            <circle key={p.i} className="lj-trend-dot" cx={x(p.i)} cy={y(p.score)} r={3} />
          ))}
          {first && (
            <text
              className="lj-trend-value"
              x={x(first.i)}
              y={y(first.score) - 9}
              textAnchor="middle"
            >
              {fmtScore(first.score)}
            </text>
          )}
          {last && (
            <text
              className="lj-trend-value"
              x={x(last.i) + 8}
              // Below its point when the target's label would sit on it.
              y={
                target != null && Math.abs(y(last.score) - y(target)) < 14
                  ? y(last.score) + 16
                  : y(last.score) + 4
              }
            >
              {fmtScore(last.score)}
            </text>
          )}
          {weekly[0] && (
            <text className="lj-trend-label" x={x(0)} y={H - 6}>
              {date(weekly[0].weekStart)}
            </text>
          )}
          {weekly.length > 1 && (
            <text className="lj-trend-label" x={x(weekly.length - 1)} y={H - 6} textAnchor="end">
              {date(weekly[weekly.length - 1].weekStart)}
            </text>
          )}
        </svg>
      )}
      <figcaption className="lj-fs-summary">{summary}</figcaption>
      {weekly.length > 0 && (
        <details className="lj-fs-values">
          <summary>Visa värden</summary>
          <table className="lj-fs-table">
            <caption>Veckans andel rätt som poäng, äldst först.</caption>
            <thead>
              <tr>
                <th scope="col">Vecka från</th>
                <th scope="col">Poäng</th>
              </tr>
            </thead>
            <tbody>
              {weekly.map((w) => (
                <tr key={w.weekStart}>
                  <th scope="row">{date(w.weekStart)}</th>
                  <td>{w.score != null ? fmtScore(w.score) : 'inga svar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </figure>
  )
}

// ── The days ─────────────────────────────────────────────────────────

type Day = { date: string; n: number }

/** The days in calendar weeks, Monday first; days outside the record are
 *  null (unknown), not zero. */
function calendarWeeks(days: Day[]): { monday: string; days: (Day | null)[] }[] {
  const weeks: { monday: string; days: (Day | null)[] }[] = []
  for (const d of days) {
    const at = new Date(`${d.date}T12:00:00`)
    const weekday = (at.getDay() + 6) % 7
    const current = weeks[weeks.length - 1]
    if (!current || weekday === 0 || current.days[weekday] !== null) {
      const monday = new Date(at.getTime() - weekday * 86_400_000)
      weeks.push({ monday: formatSwedishDateShort(monday), days: Array(7).fill(null) })
    }
    weeks[weeks.length - 1].days[weekday] = d
  }
  return weeks
}

/**
 * The record of days as a quiet field: more answers, more light. It is a
 * picture only; the summary and the table under "Visa dagar" carry the
 * same facts, so no one has to step through 84 cells.
 */
function Activity({ days }: { days: Day[] }) {
  const id = useId()
  const weeks = calendarWeeks(days)
  const most = Math.max(0, ...days.map((d) => d.n))
  const level = (n: number) => (n === 0 ? 0 : n <= most / 3 ? 1 : n <= (2 * most) / 3 ? 2 : 3)
  const practised = days.filter((d) => d.n > 0).length
  const answers = days.reduce((sum, d) => sum + d.n, 0)
  return (
    <section className="lj-shade lj-fs-activity" aria-labelledby={id}>
      <div className="lj-section-head">
        <h2 id={id}>Dagarna</h2>
        <span>{count(weeks.length, 'vecka', 'veckor')}</span>
      </div>
      {days.length > 0 ? (
        <>
          <div className="lj-heat" aria-hidden>
            {weeks.map((w) => (
              <span className="lj-heat-week" key={w.monday}>
                {w.days.map((d, i) => (
                  <i
                    // biome-ignore lint/suspicious/noArrayIndexKey: a weekday's place in its week is fixed
                    key={i}
                    data-level={d ? level(d.n) : 'none'}
                  />
                ))}
              </span>
            ))}
          </div>
          <p className="lj-fs-summary">
            {practised} av {count(days.length, 'dag', 'dagar')} med övning, {fmtInt(answers)} svar
            totalt.
          </p>
          <details className="lj-fs-values">
            <summary>Visa dagar</summary>
            <table className="lj-fs-table lj-fs-days-table">
              <caption>
                Svar per dag, vecka för vecka. Ett streck: inget underlag för dagen.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Vecka från</th>
                  {WEEKDAYS.map((d) => (
                    <th scope="col" key={d}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
                  <tr key={w.monday}>
                    <th scope="row">{w.monday}</th>
                    {w.days.map((d, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: a weekday's place in its week is fixed
                      <td key={i}>{d ? d.n : '–'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      ) : (
        <p className="lj-fs-summary">Inga dagar med svar att visa än.</p>
      )}
    </section>
  )
}

// ── Historik ─────────────────────────────────────────────────────────

/**
 * Finished drills and repetitions, newest first, grouped by day, each with
 * its own result; Provpass results keep their own doorway below, since
 * they come from their own record. A row is a summary to read: there is no
 * finished session to reopen here yet.
 */
function History({
  rows,
  results,
  names,
  id,
  onOpenResult,
}: {
  rows: HistoryRowView[]
  results: ProvResultSummaryView[]
  names: Record<string, string>
  id: string
  onOpenResult: (id: string) => void
}) {
  const groups: { when: string; items: { row: HistoryRowView; n: number }[] }[] = []
  rows.forEach((row, i) => {
    const when = row.when || 'Utan datum'
    const group = groups[groups.length - 1]
    if (group && group.when === when) group.items.push({ row, n: i + 1 })
    else groups.push({ when, items: [{ row, n: i + 1 }] })
  })
  return (
    <section
      className="lj-shade lj-fs-history"
      data-testid="rd-framsteg-history"
      aria-labelledby={id}
    >
      <div className="lj-section-head">
        <h2 id={id} tabIndex={-1}>
          Historik
        </h2>
        <span>avslutade övningar och repetitioner, senaste först</span>
      </div>
      {rows.length === 0 ? (
        <p className="lj-hub-note">
          Inga avslutade övningar än. När du har gjort klart en övning hamnar den här.
        </p>
      ) : (
        <ol className="lj-fs-days">
          {groups.map((g) => (
            <li key={`${g.when}-${g.items[0].n}`} className="lj-fs-day">
              <h3>{g.when}</h3>
              <ol>
                {g.items.map(({ row, n }) => (
                  <li
                    key={row.id}
                    className="lj-fs-pass"
                    data-testid={`rd-framsteg-history-item-${n}`}
                  >
                    <span className="lj-fs-code">{row.section ?? ''}</span>
                    <span className="lj-fs-main">
                      <strong>
                        {row.section && names[row.section]
                          ? `${row.label} · ${names[row.section]}`
                          : row.label}
                      </strong>
                      <span>{KIND_WORD[row.kind]}</span>
                    </span>
                    <span className="lj-fs-result">
                      {row.correct} av {row.total} rätt
                    </span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}
      {results.length > 0 && (
        <section className="lj-fs-mock" aria-label="Provpassresultat">
          <h3>Provpassresultat</h3>
          <ul>
            {results.map((r) => (
              <li key={r.id}>
                <button type="button" className="lj-trap-row" onClick={() => onOpenResult(r.id)}>
                  <span className="lj-trap-pattern">
                    {r.correct} av {r.presented} rätt
                    {r.score != null ? ` · ${fmtScore(r.score)}` : ''}
                  </span>
                  <span>
                    {r.sitting ?? 'Genererat pass'}
                    {r.pass ? ` · ${r.pass}` : ''} · {halfName(r.half)} · {midLine(r.when)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}

// ── 11 · Framsteg ────────────────────────────────────────────────────

type View = 'oversikt' | 'historik'

/**
 * Framsteg: a quiet overview of the estimate, then one lit next step — the
 * section that needs practice most, and why — with the weekly curve and
 * all eight sections as an open ledger of evidence. The week's rhythm and
 * the days sit in the shade beside it; Historik follows below. On a phone
 * Översikt and Historik are two views of the same page.
 */
export function LjuskaglaFramsteg({ width, onOpen }: { width: WidthKey; onOpen: OpenPage }) {
  const { data, actions } = useDirectionData()
  const f = data.framsteg
  const phone = width === 'phone'
  const [view, setView] = useState<View>('oversikt')
  const overviewId = useId()
  const historyId = useId()
  const sectionsId = useId()
  const weekId = useId()
  const repId = useId()
  const tabs = { oversikt: useId(), historik: useId() }
  const panels = { oversikt: useId(), historik: useId() }
  const names = Object.fromEntries(f.sections.map((s) => [s.section, s.name]))
  const focus = f.focus
    .map((section) => f.sections.find((s) => s.section === section))
    .filter((s): s is SectionScoreView => s != null && s.score != null)
  const top = focus[0] ?? null
  const rest = focus.slice(1).map((s) => s.section)
  const w = f.week
  const openResult = (id: string) =>
    id === data.provpass.result.id
      ? onOpen('resultat', () => actions.openProvResult(id))
      : actions.openProvResult(id)

  const lamp = (
    <section className="lj-resume lj-fs-lamp" aria-label="Nästa steg">
      <div className="lj-resume-top">
        <span className="lj-eyebrow">Nästa steg</span>
        <LampDesk size={28} strokeWidth={1.3} aria-hidden />
      </div>
      {top ? (
        <>
          <h2>{top.name}</h2>
          <p className="lj-hub-lamp-meta">{reason(top)}</p>
          {rest.length > 0 && <p className="lj-fs-then">Sedan: {andList(rest)}.</p>}
          <button
            className="lj-primary"
            type="button"
            onClick={() => actions.startDrill({ kind: 'section', section: top.section })}
          >
            <span>Öva {top.section}</span>
            <ArrowRight size={20} aria-hidden />
          </button>
        </>
      ) : (
        <>
          <h2>Välj en övning</h2>
          <p className="lj-hub-lamp-meta">
            Det finns inte tillräckligt med svar för ett förslag än. Alla delprov finns under Öva.
          </p>
          <button
            className="lj-primary"
            type="button"
            onClick={() => onOpen('ova', () => actions.go('ova'))}
          >
            <span>Välj övning</span>
            <ArrowRight size={20} aria-hidden />
          </button>
        </>
      )}
    </section>
  )

  const sections = (
    <section className="lj-shade lj-fs-sections" aria-labelledby={sectionsId}>
      <div className="lj-section-head">
        <h2 id={sectionsId}>Alla delprov</h2>
        <span>senaste 90 dagarna</span>
      </div>
      <ol className="lj-rows lj-fs-rows">
        {f.sections.map((s) => (
          <li
            key={s.section}
            className="lj-fs-row"
            data-testid={`rd-framsteg-section-${sectionId(s.section)}`}
            data-known={String(s.score != null)}
          >
            <span className="lj-fs-code">{s.section}</span>
            <span className="lj-fs-main">
              <strong>{s.name}</strong>
              <span>{evidence(s)}</span>
            </span>
            <span className="lj-fs-figures">
              {s.score != null && <b>{fmtScore(s.score)}</b>}
              {s.band != null && <span>± {fmtBand(s.band)}</span>}
            </span>
          </li>
        ))}
      </ol>
      <p className="lj-hub-note">
        ± är skattningens osäkerhet: poängen ligger troligen inom det spannet. Ett delprov du inte
        har övat visas utan poäng, aldrig som noll.
      </p>
    </section>
  )

  const week = (
    <section
      className="lj-shade lj-fs-week"
      data-testid="rd-framsteg-week"
      aria-labelledby={weekId}
    >
      <h2 id={weekId}>Veckans rytm</h2>
      {w.daysPractised != null && (
        <p className="lj-door-count">
          <strong>{w.daysPractised}</strong>{' '}
          {w.goal != null
            ? `av ${w.goal} planerade dagar`
            : w.daysPractised === 1
              ? 'dag med övning'
              : 'dagar med övning'}
        </p>
      )}
      <ul className="lj-fs-facts">
        {w.streakDays > 0 && (
          <li>
            {count(w.streakDays, 'dag', 'dagar')} i följd just nu
            {w.record != null && w.record > w.streakDays ? ` · som längst ${w.record}` : ''}
          </li>
        )}
        <li>{fmtInt(w.attemptsThisWeek)} svar den här veckan</li>
        {w.accuracy7d != null && <li>{fmtPercent(w.accuracy7d)} rätt de senaste sju dagarna</li>}
        {w.minutesToday != null && <li>{count(w.minutesToday, 'minut', 'minuter')} idag</li>}
      </ul>
      <p className="lj-hub-note">En dag utan övning tar inte bort något du har byggt upp.</p>
    </section>
  )

  const repetition = (
    <section className="lj-shade lj-fs-rep" aria-labelledby={repId}>
      <h2 id={repId}>Repetition</h2>
      <p>
        {fmtInt(f.totals.mistakesActive)} missar väntar på repetition.{' '}
        {fmtInt(f.totals.mistakesResolved)} har du redan klarat.
      </p>
      <button
        className="lj-text-button"
        type="button"
        onClick={() => onOpen('repetera', () => actions.openRepetera())}
      >
        Öppna Repetera <ArrowRight size={16} aria-hidden />
      </button>
      <p className="lj-hub-note">
        Totalt {fmtInt(f.totals.attempts)} svar i {fmtInt(f.totals.drills)} övningar.
      </p>
    </section>
  )

  const overview = (
    <div className="lj-fs-grid">
      <div className="lj-fs-col">
        <Overview prognosis={f.prognosis} id={overviewId} />
        {lamp}
        <Trend weekly={f.weekly} target={f.prognosis.target} phone={phone} />
        {sections}
      </div>
      <div className="lj-fs-col lj-fs-side">
        {week}
        <Activity days={f.days} />
        {repetition}
      </div>
    </div>
  )

  const history = (
    <History
      rows={f.history}
      results={data.provpass.hub.results}
      names={names}
      id={historyId}
      onOpenResult={openResult}
    />
  )

  const order: View[] = ['oversikt', 'historik']
  const onTabKey = (e: ReactKeyboardEvent) => {
    const at = order.indexOf(view)
    const next =
      e.key === 'ArrowRight'
        ? order[(at + 1) % order.length]
        : e.key === 'ArrowLeft'
          ? order[(at + order.length - 1) % order.length]
          : e.key === 'Home'
            ? order[0]
            : e.key === 'End'
              ? order[order.length - 1]
              : null
    if (!next) return
    e.preventDefault()
    setView(next)
    document.getElementById(tabs[next])?.focus()
  }

  let content: ReactNode
  if (phone) {
    content = (
      <>
        <div
          className="lj-tabs"
          role="tablist"
          aria-label="Framsteg"
          // The arrows move between the two views here, not the switcher.
          data-rd-keyscope=""
          onKeyDown={onTabKey}
        >
          {order.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              id={tabs[v]}
              aria-selected={view === v}
              aria-controls={panels[v]}
              tabIndex={view === v ? 0 : -1}
              onClick={() => setView(v)}
            >
              {v === 'oversikt' ? 'Översikt' : 'Historik'}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={panels.oversikt}
          aria-labelledby={tabs.oversikt}
          hidden={view !== 'oversikt'}
        >
          {overview}
        </div>
        <div
          role="tabpanel"
          id={panels.historik}
          aria-labelledby={tabs.historik}
          hidden={view !== 'historik'}
        >
          {history}
        </div>
      </>
    )
  } else {
    content = (
      <>
        <nav className="lj-jump" aria-label="På sidan">
          <button type="button" onClick={() => jumpTo(document.getElementById(overviewId))}>
            Översikt
          </button>
          <button type="button" onClick={() => jumpTo(document.getElementById(historyId))}>
            Historik
          </button>
        </nav>
        {overview}
        {history}
      </>
    )
  }

  return (
    <div className="lj-page lj-framsteg">
      <header className="lj-page-head">
        <p className="lj-eyebrow">Framsteg</p>
        <h1>Var du står just nu.</h1>
      </header>
      {content}
    </div>
  )
}
