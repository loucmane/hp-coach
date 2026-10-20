// Samtal · Framsteg, with Historik — one observation, then the evidence.
//
// The page has two views, tabs at its top: Översikt and Historik. The
// Framsteg door opens the overview; Idag's "Alla pass i Framsteg" opens the
// history (the frame holds which, SamtalNav).
//
// Översikt: the coach says one thing the data supports — the prognosis and
// its change — and, once at least two sections are scored, where there is
// most to win; one reply practises that section, the other opens Öva. Below
// a quiet line, the evidence as the coach's attachments:
//   - the prognosis on HP's scale, its caveat as the card's footnote (a
//     supplied target is named on the scale, nothing else);
//   - the weeks: share right per week on the 0–2,0 scale, a gap where a week
//     had no answers, the first and last values labelled, each week to
//     inspect by pointer or keys, and the same as a table on request;
//   - the eight sections as one ledger in their two groups: level and its
//     band, the answers behind it and how sure that is, the week's change;
//   - the week's rhythm, said plainly with nothing to lose, the last 84 days
//     folded under it, and what waits in Repetera;
//   - the last finished practice, as Idag says it, and the way to Historik.
// Historik: "Här finns dina avslutade övningar." and every finished drill
// and repetition, newest first; Provpass results live in Provpass, and the
// coach says so. One reply goes back to the overview, the other to Öva.
//
// Kit v2: everything comes from useDirectionData().data.framsteg. What has
// no real source (a range, a target, a weekly goal) shows only when
// supplied; a trend needs two observed weeks. The kit has no way to open a
// finished drill, so its rows are records, not links.

import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtScore, useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  FramstegView,
  Half,
  HistoryRowView,
  SectionScoreView,
} from '@/components/devbake/redesign/viewModel'
import { formatSwedishDateShort } from '@/lib/scoring'
import { slug } from './SamtalOva'
import { Coach, count, Divider, Kbd, Replies, ScoreCard, words } from './SamtalParts'

export type FramstegTab = 'oversikt' | 'historik'

const TABS: { id: FramstegTab; label: string }[] = [
  { id: 'oversikt', label: 'Översikt' },
  { id: 'historik', label: 'Historik' },
]

const GROUPS: { half: Half; label: string }[] = [
  { half: 'verbal', label: 'Verbal del' },
  { half: 'kvant', label: 'Kvantitativ del' },
]

const CONFIDENCE: Record<SectionScoreView['confidence'], string> = {
  low: 'låg säkerhet',
  medium: 'medelsäkert',
  high: 'säkert',
}

function sentence(s: string): string {
  return s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)
}

/** "12 maj" from an ISO date (a week's Monday, a day). */
function shortDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime()) ? '' : formatSwedishDateShort(d)
}

export function SamtalFramsteg({
  width,
  live,
  tab,
  onTab,
}: {
  width: WidthKey
  live: boolean
  tab: FramstegTab
  onTab: (tab: FramstegTab) => void
}) {
  const { data } = useDirectionData()
  const f = data.framsteg
  const base = useId()
  const tabId = (t: FramstegTab) => `${base}-tab-${t}`
  const panelId = (t: FramstegTab) => `${base}-panel-${t}`
  const headings = {
    oversikt: useRef<HTMLHeadingElement>(null),
    historik: useRef<HTMLHeadingElement>(null),
  }
  // A move to the other view from inside a view ("Hela historiken", "Till
  // översikten") takes focus to that view's heading once it shows.
  const focusNext = useRef<FramstegTab | null>(null)
  const show = (t: FramstegTab) => {
    focusNext.current = t
    onTab(t)
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a tab change only
  useEffect(() => {
    if (focusNext.current !== tab) return
    focusNext.current = null
    if (live) headings[tab].current?.focus()
  }, [tab])

  return (
    <div className="sa-fram" data-width={width}>
      <Divider>{data.home.today.dateLabel}</Divider>
      <ViewTabs
        tab={tab}
        onTab={onTab}
        tabId={tabId}
        panelId={panelId}
        history={f.history.length}
      />
      <div
        role="tabpanel"
        id={panelId('oversikt')}
        aria-labelledby={tabId('oversikt')}
        hidden={tab !== 'oversikt'}
      >
        <Overview
          f={f}
          live={live && tab === 'oversikt'}
          phone={width === 'phone'}
          headingRef={headings.oversikt}
          onHistory={() => show('historik')}
        />
      </div>
      <div
        role="tabpanel"
        id={panelId('historik')}
        aria-labelledby={tabId('historik')}
        hidden={tab !== 'historik'}
      >
        <History
          f={f}
          live={live && tab === 'historik'}
          headingRef={headings.historik}
          onOverview={() => show('oversikt')}
        />
      </div>
    </div>
  )
}

/** The two views as tabs: chosen with a tint and its line, never the
 *  filled plum, which is the coach's one reply. ←/→, Home and End move
 *  between them (and stay out of the bake-off's switcher). */
function ViewTabs({
  tab,
  onTab,
  tabId,
  panelId,
  history,
}: {
  tab: FramstegTab
  onTab: (tab: FramstegTab) => void
  tabId: (t: FramstegTab) => string
  panelId: (t: FramstegTab) => string
  history: number
}) {
  const refs = useRef<Partial<Record<FramstegTab, HTMLButtonElement | null>>>({})
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === tab)
    const to =
      e.key === 'ArrowRight'
        ? TABS[(i + 1) % TABS.length]
        : e.key === 'ArrowLeft'
          ? TABS[(i - 1 + TABS.length) % TABS.length]
          : e.key === 'Home'
            ? TABS[0]
            : e.key === 'End'
              ? TABS[TABS.length - 1]
              : null
    if (!to) return
    e.preventDefault()
    onTab(to.id)
    refs.current[to.id]?.focus()
  }
  return (
    <div
      className="sa-views"
      role="tablist"
      aria-label="Framsteg"
      data-rd-keyscope=""
      onKeyDown={onKeyDown}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          className="sa-view"
          id={tabId(t.id)}
          aria-selected={tab === t.id}
          aria-controls={panelId(t.id)}
          tabIndex={tab === t.id ? 0 : -1}
          data-testid={`sa-framsteg-tab-${t.id}`}
          ref={(el) => {
            refs.current[t.id] = el
          }}
          onClick={() => onTab(t.id)}
        >
          {t.label}
          {t.id === 'historik' && history ? (
            <>
              {' '}
              <span className="sa-view-n">{history}</span>
            </>
          ) : null}
        </button>
      ))}
    </div>
  )
}

// ── Översikt ─────────────────────────────────────────────────────────

/** The coach's one supported observation: the prognosis and its change. */
function observation(f: FramstegView, scored: number): string {
  const p = f.prognosis
  if (p.total == null) {
    return scored
      ? 'Prognosen visas när du har svarat i båda delarna.'
      : 'Här syns dina framsteg när du har börjat öva.'
  }
  if (p.delta != null && Math.abs(p.delta) >= 0.05) {
    return `Din prognos är ${fmtScore(p.total)} – ${p.delta > 0 ? 'upp' : 'ner'} ${fmtScore(Math.abs(p.delta))} sedan förra veckan.`
  }
  if (p.delta != null) return `Din prognos ligger kvar på ${fmtScore(p.total)}.`
  return `Din prognos är ${fmtScore(p.total)} av 2,0.`
}

function Overview({
  f,
  live,
  phone,
  headingRef,
  onHistory,
}: {
  f: FramstegView
  live: boolean
  phone: boolean
  headingRef: RefObject<HTMLHeadingElement | null>
  onHistory: () => void
}) {
  const { data, actions } = useDirectionData()
  const leadId = useId()
  const scored = f.sections.filter((s) => s.score != null).length
  // One scored section cannot be the weakest of eight: a focus needs two.
  const focusCode = scored >= 2 ? (f.focus[0] ?? null) : null
  const focus = focusCode ? (f.sections.find((s) => s.section === focusCode) ?? null) : null
  const toOva = () => actions.go('ova')
  const primary = focus
    ? {
        label: `Öva ${focus.section}`,
        onClick: () => actions.startDrill({ kind: 'section', section: focus.section }),
      }
    : { label: 'Välj övning', onClick: toOva }
  useKeyMap({ Enter: primary.onClick }, live)
  const week = f.week.attemptsThisWeek
  const hello =
    week > 0 ? `${count(week, 'svar', 'svar')} den här veckan.` : 'Inga svar än den här veckan.'

  return (
    <>
      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby={leadId}>
          <p className="sa-hello">{hello}</p>
          <h1 className="sa-lead-q" id={leadId} tabIndex={-1} ref={headingRef}>
            {observation(f, scored)}
          </h1>
          {focus ? (
            <p className="sa-say sa-fram-focus">
              Mest att vinna just nu finns i <b>{focus.section}</b>,{' '}
              {focus.name.toLocaleLowerCase('sv-SE')}.
            </p>
          ) : null}
        </Coach>
        <Replies>
          {focus ? (
            <button type="button" className="sa-chip sa-chip--big" onClick={toOva}>
              Välj övning
            </button>
          ) : null}
          <button
            type="button"
            className="sa-chip sa-chip--primary sa-chip--big"
            onClick={primary.onClick}
          >
            {primary.label}
            <Kbd>↵</Kbd>
          </button>
        </Replies>
      </div>

      <div className="sa-later">
        <Divider quiet>Underlaget</Divider>
        <div className="sa-cards">
          <ScoreCard p={f.prognosis} withTarget testId="rd-framsteg-prognosis" />
          <WeeklyTrend weekly={f.weekly} />
          <SectionLedger sections={f.sections} focus={focusCode} phone={phone} />
          <WeekRhythm
            f={f}
            showStreak={data.konto.prefs.showStreak}
            onRepetera={actions.openRepetera}
          />
          {f.history.length ? (
            <Coach as="section" kind="sa-turn--line" aria-labelledby={`${leadId}-recent`}>
              <h2 className="sa-line-h" id={`${leadId}-recent`}>
                Senast avslutat
              </h2>
              <ul className="sa-recent">
                {f.history.slice(0, 3).map((h) => (
                  <li key={h.id}>
                    <b>{h.label}</b>{' '}
                    <span className="sa-recent-score">
                      {h.correct}/{h.total}
                    </span>{' '}
                    <span className="sa-recent-when">{h.when}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="sa-link" onClick={onHistory}>
                Hela historiken
                <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
              </button>
            </Coach>
          ) : null}
        </div>
      </div>
    </>
  )
}

/** The weeks on HP's scale: share right per week, a gap where a week had no
 *  answers. One plum line on hairline rules; the first and last weeks carry
 *  their values; a week is inspected by pointer or, with the chart in focus,
 *  by ←/→ (the readout under it says it); the same numbers as a table on
 *  request. Fewer than two observed weeks: no curve, and the coach says so. */
function WeeklyTrend({ weekly }: { weekly: FramstegView['weekly'] }) {
  const id = useId()
  const readId = useId()
  const tableId = useId()
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(0)
  const [chosen, setAt] = useState<number | null>(null)
  // The week chosen is read against the weeks there are now: a shorter
  // series from the provider keeps a week it has (its last).
  const at = chosen == null || weekly.length === 0 ? null : Math.min(chosen, weekly.length - 1)
  const [table, setTable] = useState(false)
  const observed = weekly
    .map((x, i) => ({ i, v: x.score }))
    .filter((x): x is { i: number; v: number } => x.v != null)
  // The chart is drawn at its own width (type stays at its size on a
  // phone); measured once it shows.
  const drawn = observed.length >= 2
  useLayoutEffect(() => {
    const el = box.current
    if (!drawn || !el) return
    const measure = () => setW(el.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    return () => watch.disconnect()
  }, [drawn])
  const head = (
    <header className="sa-card-head">
      <h2 id={id}>Veckorna</h2>
      <span>Andel rätt per vecka, på skalan 0–2,0</span>
    </header>
  )
  if (observed.length < 2) {
    return (
      <section className="sa-card sa-card--trend" aria-labelledby={id}>
        {head}
        <p className="sa-say sa-say--quiet">Kurvan visas när du har övat två veckor.</p>
      </section>
    )
  }

  const W = w > 0 ? w : 560
  const H = 176
  const pad = { l: 34, r: 34, t: 14, b: 30 }
  const x = (i: number) =>
    pad.l + (weekly.length > 1 ? i / (weekly.length - 1) : 0.5) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - Math.min(2, Math.max(0, v)) / 2) * (H - pad.t - pad.b)
  // The line runs only between observed neighbours: a missing week is a gap.
  const runs: { i: number; v: number }[][] = []
  for (const p of observed) {
    const last = runs[runs.length - 1]
    if (last && last[last.length - 1].i === p.i - 1) last.push(p)
    else runs.push([p])
  }
  const first = observed[0]
  const final = observed[observed.length - 1]
  const shown = at ?? final.i
  const shownWeek = weekly[shown]
  const readout =
    shownWeek.score != null
      ? `Veckan från ${shortDate(shownWeek.weekStart)}: ${fmtScore(shownWeek.score)}`
      : `Veckan från ${shortDate(shownWeek.weekStart)}: inga svar`
  const summary = `Andel rätt per vecka de senaste ${weekly.length} veckorna, från ${fmtScore(first.v)} till ${fmtScore(final.v)} på skalan 0 till 2,0.`
  const pick = (clientX: number) => {
    const el = box.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = ((clientX - r.left) / (r.width || W)) * W
    const step = (W - pad.l - pad.r) / Math.max(1, weekly.length - 1)
    setAt(Math.min(weekly.length - 1, Math.max(0, Math.round((px - pad.l) / step))))
  }
  const onKey = (e: ReactKeyboardEvent<HTMLElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (e.key === 'Home' || e.key === 'End' || step) e.preventDefault()
    if (e.key === 'Home') setAt(0)
    else if (e.key === 'End') setAt(weekly.length - 1)
    else if (step) setAt(Math.min(weekly.length - 1, Math.max(0, shown + step)))
  }

  return (
    <section className="sa-card sa-card--trend" aria-labelledby={id}>
      {head}
      <figure
        className="sa-trend"
        ref={box}
        data-rd-keyscope=""
        aria-labelledby={id}
        aria-describedby={readId}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the weeks are inspected with ←/→
        tabIndex={0}
        onKeyDown={onKey}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerLeave={() => setAt(null)}
        onBlur={() => setAt(null)}
      >
        <svg
          className="sa-trend-svg"
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={summary}
        >
          {[0, 1, 2].map((v) => (
            <g key={v}>
              <line className="sa-trend-rule" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
              <text className="sa-trend-tick" x={pad.l - 8} y={y(v)} dy="0.32em" textAnchor="end">
                {v === 0 ? '0' : fmtScore(v)}
              </text>
            </g>
          ))}
          {at != null ? (
            <line className="sa-trend-cross" x1={x(at)} x2={x(at)} y1={pad.t} y2={H - pad.b} />
          ) : null}
          {runs.map((run) =>
            run.length > 1 ? (
              <polyline
                key={run[0].i}
                className="sa-trend-line"
                points={run.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}
              />
            ) : null,
          )}
          {observed.map((p) => (
            <circle
              key={p.i}
              className="sa-trend-dot"
              data-on={String(p.i === at)}
              cx={x(p.i)}
              cy={y(p.v)}
              r={p.i === at ? 5 : 4}
            />
          ))}
          <text className="sa-trend-value" x={x(first.i)} y={y(first.v) - 12} textAnchor="middle">
            {fmtScore(first.v)}
          </text>
          <text className="sa-trend-value" x={x(final.i)} y={y(final.v) - 12} textAnchor="middle">
            {fmtScore(final.v)}
          </text>
          <text className="sa-trend-tick" x={x(0)} y={H - 8} textAnchor="start">
            {shortDate(weekly[0].weekStart)}
          </text>
          <text className="sa-trend-tick" x={x(weekly.length - 1)} y={H - 8} textAnchor="end">
            {shortDate(weekly[weekly.length - 1].weekStart)}
          </text>
        </svg>
      </figure>
      <p className="sa-trend-read" id={readId} aria-live="polite">
        {readout}
      </p>
      <button
        type="button"
        className="sa-queue-fold sa-trend-fold"
        aria-expanded={table}
        aria-controls={tableId}
        onClick={() => setTable((v) => !v)}
      >
        <span>{table ? 'Dölj tabellen' : 'Visa som tabell'}</span>
        {table ? (
          <ChevronUp size={16} strokeWidth={1.75} aria-hidden />
        ) : (
          <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
        )}
      </button>
      <table className="sa-trend-table" id={tableId} hidden={!table}>
        <caption className="sa-sr">Andel rätt per vecka</caption>
        <thead>
          <tr>
            <th scope="col">Veckan från</th>
            <th scope="col">Nivå</th>
          </tr>
        </thead>
        <tbody>
          {weekly.map((wk) => (
            <tr key={wk.weekStart}>
              <th scope="row">{shortDate(wk.weekStart)}</th>
              <td>{wk.score != null ? fmtScore(wk.score) : 'inga svar'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/** The week's change as words, the number for the exact: "uppåt" past a
 *  point either way. */
function trendWords(t: number | null): { shown: string; said: string } {
  if (t == null) return { shown: '–', said: 'ingen jämförelse med förra veckan' }
  const pp = Math.round(Math.abs(t) * 100)
  if (pp < 1) return { shown: 'stilla', said: 'som förra veckan' }
  const up = t > 0
  return {
    shown: `${up ? '↗ uppåt' : '↘ nedåt'} ${pp}`,
    said: `${up ? 'upp' : 'ner'} ${pp} procentenheter rätt jämfört med förra veckan`,
  }
}

/** The eight sections as one ledger, in the exam's order and its two
 *  groups: the level and its band, the answers behind it, the week's
 *  change. A table on the desktop; on the phone the evidence wraps under
 *  each name. The focus is tagged, never moved. */
function SectionLedger({
  sections,
  focus,
  phone,
}: {
  sections: SectionScoreView[]
  focus: string | null
  phone: boolean
}) {
  const id = useId()
  const level = (s: SectionScoreView) =>
    s.score == null
      ? 'inte övat än'
      : s.band != null
        ? `${fmtScore(s.score)} ± ${fmtScore(s.band)}`
        : fmtScore(s.score)
  const basis = (s: SectionScoreView) =>
    s.attempts90d > 0
      ? `${count(s.attempts90d, 'svar', 'svar')} · ${CONFIDENCE[s.confidence]}`
      : 'inga svar'
  return (
    <section className="sa-card sa-card--ledger" aria-labelledby={id}>
      <header className="sa-card-head">
        <h2 id={id}>Delproven</h2>
        <span>Nivå av 2,0 · svar senaste 90 dagarna · veckan</span>
      </header>
      {GROUPS.map((g) => {
        const rows = sections.filter((s) => s.half === g.half)
        if (!rows.length) return null
        return phone ? (
          <div className="sa-doorgroup" key={g.half}>
            <h3 className="sa-doorgroup-h">{g.label}</h3>
            <ul className="sa-ledger-rows">
              {rows.map((s) => {
                const t = trendWords(s.trend)
                return (
                  <li key={s.section} data-testid={`rd-framsteg-section-${slug(s.section)}`}>
                    <span className="sa-ledger-name">
                      <b>{s.section}</b> {s.name}
                      {s.section === focus ? (
                        <>
                          {' '}
                          <span className="sa-plan-tag">Fokus</span>
                        </>
                      ) : null}
                    </span>{' '}
                    <span className="sa-ledger-vals">
                      <span>nivå {level(s)}</span> <span>{basis(s)}</span>{' '}
                      <span>
                        <span aria-hidden>veckan {t.shown}</span>
                        <span className="sa-sr">{t.said}</span>
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <table className="sa-ledger" key={g.half}>
            <caption className="sa-doorgroup-h">{g.label}</caption>
            <thead>
              <tr>
                <th scope="col">Delprov</th>
                <th scope="col">Nivå</th>
                <th scope="col">Underlag</th>
                <th scope="col">Veckan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const t = trendWords(s.trend)
                return (
                  <tr key={s.section} data-testid={`rd-framsteg-section-${slug(s.section)}`}>
                    <th scope="row">
                      <span className="sa-ledger-code">{s.section}</span>{' '}
                      <span className="sa-ledger-long">{s.name}</span>
                      {s.section === focus ? (
                        <>
                          {' '}
                          <span className="sa-plan-tag">Fokus</span>
                        </>
                      ) : null}
                    </th>
                    <td>{level(s)}</td>
                    <td>{basis(s)}</td>
                    <td>
                      <span aria-hidden>{t.shown}</span>
                      <span className="sa-sr">{t.said}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )
      })}
    </section>
  )
}

/** "Fyra dagar den här veckan · 180 svar · 14 minuter idag", from what is
 *  known: a goal only when supplied, a run of days only when the reader
 *  keeps it on, and never a loss to fear. */
function WeekRhythm({
  f,
  showStreak,
  onRepetera,
}: {
  f: FramstegView
  showStreak: boolean
  onRepetera: () => void
}) {
  const id = useId()
  const daysId = useId()
  const [open, setOpen] = useState(false)
  const w = f.week
  const parts: string[] = []
  const answers = count(w.attemptsThisWeek, 'svar', 'svar')
  if (w.daysPractised != null) {
    const daysSaid =
      w.goal != null
        ? `${words(w.daysPractised)} av ${words(w.goal)} dagar`
        : `${words(w.daysPractised)} ${w.daysPractised === 1 ? 'dag' : 'dagar'}`
    parts.push(`${daysSaid} och ${answers} den här veckan`)
  } else parts.push(`${answers} den här veckan`)
  if (w.accuracy7d != null) {
    parts.push(`${Math.round(w.accuracy7d * 100)} % rätt de senaste sju dagarna`)
  }
  if (w.minutesToday != null) {
    parts.push(`${w.minutesToday} ${w.minutesToday === 1 ? 'minut' : 'minuter'} idag`)
  }
  const run =
    showStreak && w.streakDays > 0
      ? `${sentence(words(w.streakDays))} ${w.streakDays === 1 ? 'dag' : 'dagar'} i rad just nu${
          w.record != null && w.record > w.streakDays ? `; som längst ${words(w.record)} dagar` : ''
        }.`
      : null
  const t = f.totals
  return (
    <section className="sa-card sa-card--week" aria-labelledby={id} data-testid="rd-framsteg-week">
      <header className="sa-card-head">
        <h2 id={id}>Veckans rytm</h2>
        <span>Det här har du gjort</span>
      </header>
      <p className="sa-week-say">{sentence(parts.join(' · '))}.</p>
      {run ? <p className="sa-week-run">{run}</p> : null}
      {f.days.length ? (
        <>
          <button
            type="button"
            className="sa-queue-fold"
            aria-expanded={open}
            aria-controls={daysId}
            onClick={() => setOpen((v) => !v)}
          >
            <span>De senaste {f.days.length} dagarna</span>
            {open ? (
              <ChevronUp size={16} strokeWidth={1.75} aria-hidden />
            ) : (
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
            )}
          </button>
          <div id={daysId} hidden={!open}>
            <Heat days={f.days} />
          </div>
        </>
      ) : null}
      <div className="sa-rep-row sa-week-rep">
        <p className="sa-rep-now">
          {t.mistakesActive > 0 ? (
            <>
              <b>{t.mistakesActive}</b> {t.mistakesActive === 1 ? 'miss' : 'missar'} att repetera
              {t.mistakesResolved > 0 ? `, ${t.mistakesResolved} lösta` : null}.
            </>
          ) : (
            'Inga missar att repetera.'
          )}
        </p>
        <button type="button" className="sa-chip" onClick={onRepetera}>
          Till Repetera
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </section>
  )
}

/** The days as a quiet calendar, weeks across and Monday to Sunday down:
 *  one plum, lighter for fewer answers (four steps of the day's share of
 *  the busiest), an outline for a day without. Said in words for a screen
 *  reader, and week by week as a table. */
function Heat({ days }: { days: FramstegView['days'] }) {
  const max = days.reduce((m, d) => Math.max(m, d.n), 0)
  const weekday = (iso: string) => (new Date(`${iso}T12:00:00`).getDay() + 6) % 7
  const offset = days.length ? weekday(days[0].date) : 0
  const active = days.filter((d) => d.n > 0).length
  // Week by week (from each Monday), for the table.
  const weeks: { from: string; n: number; active: number }[] = []
  days.forEach((d, i) => {
    if (i === 0 || weekday(d.date) === 0) weeks.push({ from: d.date, n: 0, active: 0 })
    const wk = weeks[weeks.length - 1]
    wk.n += d.n
    if (d.n > 0) wk.active += 1
  })
  const said = `Övat ${active} av de senaste ${days.length} dagarna; som mest ${count(max, 'svar', 'svar')} på en dag.`
  return (
    <div className="sa-heat-wrap">
      <div className="sa-heat" role="img" aria-label={said}>
        {Array.from({ length: offset }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the empty days before the first
          <span key={`pad-${i}`} className="sa-heat-cell" data-level="none" />
        ))}
        {days.map((d) => (
          <span
            key={d.date}
            className="sa-heat-cell"
            data-level={d.n === 0 || max === 0 ? 0 : Math.max(1, Math.ceil((4 * d.n) / max))}
            title={`${shortDate(d.date)}: ${count(d.n, 'svar', 'svar')}`}
          />
        ))}
      </div>
      <p className="sa-heat-key" aria-hidden>
        <span>Inga</span>
        <span className="sa-heat-cell" data-level={0} />
        <span className="sa-heat-cell" data-level={1} />
        <span className="sa-heat-cell" data-level={2} />
        <span className="sa-heat-cell" data-level={3} />
        <span className="sa-heat-cell" data-level={4} />
        <span>flest svar</span>
      </p>
      <table className="sa-sr">
        <caption>Svar vecka för vecka</caption>
        <thead>
          <tr>
            <th scope="col">Veckan från</th>
            <th scope="col">Svar</th>
            <th scope="col">Dagar</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((wk) => (
            <tr key={wk.from}>
              <th scope="row">{shortDate(wk.from)}</th>
              <td>{wk.n}</td>
              <td>{wk.active}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Historik ─────────────────────────────────────────────────────────

const KIND_WORD: Record<HistoryRowView['kind'], string> = {
  drill: 'Övning',
  adaptive_review: 'Repetition',
  mock: 'Provpass',
  mock_diagnostic: 'Provpass',
  lesson: 'Lektion',
}

function History({
  f,
  live,
  headingRef,
  onOverview,
}: {
  f: FramstegView
  live: boolean
  headingRef: RefObject<HTMLHeadingElement | null>
  onOverview: () => void
}) {
  const { actions } = useDirectionData()
  const leadId = useId()
  const listId = useId()
  const toOva = () => actions.go('ova')
  useKeyMap({ Enter: toOva }, live)
  const n = f.history.length
  return (
    <>
      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby={leadId}>
          <p className="sa-hello">
            <b>Historik</b>
            {n ? ` · ${count(n, 'avslutad övning', 'avslutade övningar')}` : null}
          </p>
          <h1 className="sa-lead-q" id={leadId} tabIndex={-1} ref={headingRef}>
            {n
              ? 'Här finns dina avslutade övningar.'
              : 'Här hamnar dina övningar när du har avslutat dem.'}
          </h1>
          <p className="sa-say sa-say--quiet">Provpassen och deras resultat finns i Provpass.</p>
        </Coach>
        <Replies>
          <button type="button" className="sa-chip sa-chip--big" onClick={onOverview}>
            Till översikten
          </button>
          <button type="button" className="sa-chip sa-chip--primary sa-chip--big" onClick={toOva}>
            Till Öva
            <Kbd>↵</Kbd>
          </button>
        </Replies>
      </div>

      <div className="sa-later">
        <Divider quiet>Senaste först</Divider>
        <section
          className="sa-card sa-card--hist"
          aria-labelledby={listId}
          data-testid="rd-framsteg-history"
        >
          <header className="sa-card-head">
            <h2 id={listId}>Övningar och repetitioner</h2>
            <span>{count(n, 'pass', 'pass')}</span>
          </header>
          {n ? (
            <ol className="sa-hist">
              {f.history.map((h, i) => (
                <li
                  key={h.id}
                  className="sa-hist-row"
                  data-testid={`rd-framsteg-history-item-${i + 1}`}
                >
                  <span className="sa-hist-when">{h.when}</span>{' '}
                  <span className="sa-hist-what">
                    <b>{h.label}</b>
                    {h.label !== KIND_WORD[h.kind] ? (
                      <span className="sa-hist-kind">
                        {' '}
                        · {KIND_WORD[h.kind].toLocaleLowerCase('sv-SE')}
                      </span>
                    ) : null}
                  </span>{' '}
                  <span className="sa-hist-n">
                    {h.correct} av {h.total} rätt
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="sa-queue-none">Inga avslutade övningar än.</p>
          )}
          <button
            type="button"
            className="sa-link sa-hist-prov"
            onClick={() => actions.go('provpass')}
          >
            Till Provpass och resultaten
            <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </section>
      </div>
    </>
  )
}
