// Samtal · Provpass and Provpassresultat — a commitment made in one
// exchange, a timed pass with the coach gone quiet, and the result said
// plainly before its notes.
//
// The hub (9), in the frame's conversation column: the two halves as a
// quiet reply-shaped choice (Verbal, Kvantitativ — each with its questions,
// minutes and sections), then the coach's one offer: "Det här passet har du
// sett minst." with the pass attached like a document — sitting and pass,
// its size, what you have met before. The one action is "Välj det här
// passet"; it opens the one gate (PassConfirm), which names the exact pass
// and the conditions and starts the clock only on "Starta nu". "Inte nu",
// Esc or a press outside back out with nothing started. Below a quiet line:
// the half's other passes as a register by sitting, newest first (each goes
// through the same gate), the last results and the conditions.
//
// The running pass (9, started), in focus mode — no doors, no account: a
// strip with "Avbryt provpass", the place and the clock; the question as
// the coach's turn in quiet exam wording (no hints, no verdict), a passage
// or DTK page as the document beside it, the options as your replies. A
// choice records at once and stays yours to change; "Nästa fråga" moves on
// without grading, and on the last question "Granska svar" opens the
// hand-in gate. Under the conversation, the answer overview: every question
// by section, answered ones carrying your letter, the current one ringed,
// flags marked — each a way to that question — and "Lämna in …". The
// hand-in gate says how many are unanswered and offers each one; giving the
// pass up asks too, and says it makes the pass ogiltigt. Neither Esc nor a
// press outside ever ends the pass. The clock is the pass's own from the
// moment it starts: it runs through every gate, and at zero it hands the
// pass in, once. Phone: the head keeps the exit and the clock; the rest is
// one scroll — the document, the question, the options, a docked action bar
// and the overview. A scroll pane with focus — the passage, the DTK page,
// the conversation's own column — keeps its arrows.
//
// Handed in (PassHanded), the pass lets go of the screen and its keys: the
// frame and its doors come back with "Lämnar in …" until the result opens.
// A hand-in the host refuses says so, with the answers as they stood,
// read-only — it is never sent again — and the way on is the hub.
//
// The result (10): "Klart. 27 av 40 rätt." with the score attached and its
// basis said beside it, never behind a hover; the one reply is "Till Öva"
// (or practice on a trap the result names), "Till Provpass" beside it.
// Below "Genomgång": each section's right answers against its share of the
// 55 minutes (a table on the desktop, labelled rows on the phone), what you
// had met before, and the earlier passes of the same half and kind.
//
// Kit v2: everything comes from useDirectionData().data.provpass; starting,
// handing in and opening a result ask actions.startProvpass, submitProvpass
// and openProvResult. The kit has no action to record an answer, a flag or
// the place, or to give a pass up: those live in the screen until the
// hand-in (docs/worklog/hpf-qr0p.25.md, Spec gaps). Flags show only when the
// running pass carries them.

import {
  ArrowRight,
  Clock,
  Flag,
  Info,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  Timer,
  X,
} from 'lucide-react'
import { type Ref, type RefObject, useEffect, useId, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  fmtClock,
  isForeignKey,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillQuestion,
  Half,
  ProvHalfView,
  ProvPassOptionView,
  ProvPrescriptionView,
  ProvResultView,
  ProvRunningView,
} from '@/components/devbake/redesign/viewModel'
import { isProseCondition, splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import type { AnswerLetter, Section } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { optionImagesFailed } from './SamtalDrill'
import { OptionBody } from './SamtalFeedback'
import { slug } from './SamtalOva'
import {
  Coach,
  count,
  Divider,
  FIGURE_ZOOMS,
  FigureImg,
  FigureInspector,
  type FigureLoads,
  FigurePage,
  FigurePan,
  type FigureStatus,
  fmtDuration,
  fmtScore2,
  Gate,
  Kbd,
  pct,
  Replies,
  useFigureLoadState,
  words,
} from './SamtalParts'

// ── Words for the halves ─────────────────────────────────────────────

/** A half's name, and its adjective as "den verbala delen" and "ett
 *  verbalt pass" take it. */
const HALF: Record<Half, { label: string; adj: string; neut: string }> = {
  verbal: { label: 'Verbal', adj: 'verbala', neut: 'verbalt' },
  kvant: { label: 'Kvantitativ', adj: 'kvantitativa', neut: 'kvantitativt' },
}

const OTHER_HALF: Record<Half, Half> = { verbal: 'kvant', kvant: 'verbal' }

/** A nominal pass: 40 questions (the half's own count when known). */
const NOMINAL = 40

function days(n: number): string {
  return `${words(n)} ${n === 1 ? 'dag' : 'dagar'}`
}

/** 'host-2025:kvant1' → 'host-2025-kvant1' (the contract's pass id). */
function passSlug(id: string): string {
  return id.replace(':', '-')
}

/** "ingen paus" → "Ingen paus". */
function sentence(rule: string): string {
  return rule.charAt(0).toLocaleUpperCase('sv-SE') + rule.slice(1)
}

/** Newest sitting first: våren 2026, hösten 2025, våren 2022 · 1 … An id of
 *  another shape goes last. */
function sittingRank(examId: string): number {
  const m = /^(var|host)-(?:ver(\d+)-)?(\d{4})(?:-(\d+))?$/.exec(examId)
  if (!m) return -1
  const [, season, version, year, sitting] = m
  return Number(year) * 100 + (season === 'host' ? 50 : 0) + Number(sitting ?? version ?? 0)
}

/** The passes, as a register: one row per sitting, newest first, its
 *  passes in order. */
function bySitting(passes: readonly ProvPassOptionView[]) {
  const rows: { examId: string; sitting: string; passes: ProvPassOptionView[] }[] = []
  for (const p of [...passes].sort(
    (a, z) => sittingRank(z.examId) - sittingRank(a.examId) || a.provpass.localeCompare(z.provpass),
  )) {
    const row = rows.find((r) => r.examId === p.examId)
    if (row) row.passes.push(p)
    else rows.push({ examId: p.examId, sitting: p.sitting, passes: [p] })
  }
  return rows
}

/** "Ditt senaste provpass var för sex dagar sedan. Nästa kvantitativa pass
 *  står på tur om en dag." — from the rhythm, for its own half only. */
function rhythmLine(p: ProvPrescriptionView | null | undefined, half: Half): string | null {
  if (!p || p.half !== half) return null
  const since =
    p.daysSinceLast == null
      ? ''
      : p.daysSinceLast <= 0
        ? 'Ditt senaste provpass var idag. '
        : `Ditt senaste provpass var för ${days(p.daysSinceLast)} sedan. `
  const next = p.due
    ? `Nu är det dags för ett ${HALF[half].neut} pass.`
    : p.daysUntilNext <= 0
      ? `Nästa ${HALF[half].adj} pass står på tur idag.`
      : `Nästa ${HALF[half].adj} pass står på tur om ${days(p.daysUntilNext)}.`
  return since + next
}

/** "38 av 40 frågor finns med; passet rättas av 38." — said before a
 *  short pass starts, and on its result. */
function shortLine(presented: number, nominal: number): string | null {
  if (presented >= nominal) return null
  const gone = nominal - presented
  return `${count(gone, 'fråga saknas', 'frågor saknas')} i det här passet, så det rättas av ${presented}.`
}

// ── The hub ──────────────────────────────────────────────────────────

export function SamtalProvpassHub({
  width,
  live,
  onStart,
  onModal,
  notice = null,
}: {
  width: WidthKey
  live: boolean
  /** The pass has been started: the screen runs it. */
  onStart: (passId: string) => void
  /** A gate stands over the screen: the frame under it goes inert. Called
   *  in the same move that opens or closes the gate. */
  onModal?: (open: boolean) => void
  /** Said once at the top: the last pass was given up. */
  notice?: 'void' | null
}) {
  const { data, actions } = useDirectionData()
  const { hub } = data.provpass
  const [chosen, setHalf] = useState<Half>(hub.half)
  // A half the provider no longer lists gives way to the hub's own half,
  // else to the first it lists: the hub always shows a half it can name.
  const listed = (h: Half) => hub.halves.some((x) => x.half === h)
  const half = listed(chosen)
    ? chosen
    : listed(hub.half)
      ? hub.half
      : (hub.halves[0]?.half ?? chosen)
  // The pass the gate asks about, or null.
  const [asking, setAsking] = useState<ProvPassOptionView | null>(null)
  const leadId = useId()
  const registerRef = useRef<HTMLHeadingElement>(null)

  const halfView = hub.halves.find((h) => h.half === half) ?? null
  const nominal = halfView?.questions ?? NOMINAL
  const passes = hub.passes.filter((p) => p.half === half)
  const suggested = passes.find((p) => p.suggested) ?? passes[0] ?? null
  const others = passes.filter((p) => p.id !== suggested?.id)
  const other = OTHER_HALF[half]
  const otherHas = hub.passes.some((p) => p.half === other)

  const modal = useRef(onModal)
  modal.current = onModal
  // A screen change while a gate stands must not leave the frame inert.
  useEffect(() => () => modal.current?.(false), [])

  const ask = (p: ProvPassOptionView) => {
    setAsking(p)
    onModal?.(true)
  }
  const backOut = () => {
    setAsking(null)
    onModal?.(false)
  }
  const start = (p: ProvPassOptionView) => {
    setAsking(null)
    onModal?.(false)
    actions.startProvpass(p.id)
    onStart(p.id)
  }
  const switchHalf = () => setHalf(other)
  const toOva = () => actions.go('ova')
  useKeyMap(
    { Enter: suggested ? () => ask(suggested) : otherHas ? switchHalf : toOva },
    live && asking == null,
  )

  const rhythm = rhythmLine(hub.prescription, half)
  const lead = !suggested
    ? `Det finns inget riktigt ${HALF[half].neut} pass att göra just nu.`
    : passes.length === 1
      ? `Här är passet för den ${HALF[half].adj} delen.`
      : 'Det här passet har du sett minst.'
  const seen = passes.reduce((n, p) => n + p.seenBefore, 0)
  const of = passes.reduce((n, p) => n + p.presented, 0)

  return (
    <div className="sa-prov" data-width={width} inert={asking != null}>
      <Divider>{data.home.today.dateLabel}</Divider>
      {notice === 'void' ? (
        <p className="sa-prov-notice" role="status">
          Provpasset avbröts och blev ogiltigt.
        </p>
      ) : null}

      <fieldset className="sa-halves">
        <legend className="sa-sr">Del av provet</legend>
        {hub.halves.map((h) => (
          <HalfChoice key={h.half} h={h} on={h.half === half} onPick={() => setHalf(h.half)} />
        ))}
      </fieldset>

      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby={leadId}>
          {rhythm ? <p className="sa-hello">{rhythm}</p> : null}
          <h1 className="sa-lead-q" id={leadId} tabIndex={-1}>
            {lead}
          </h1>
          {suggested ? (
            <PassAttachment pass={suggested} half={halfView} nominal={nominal} />
          ) : (
            <p className="sa-say sa-say--quiet">
              {otherHas
                ? `Det finns ${HALF[other].adj} pass att välja i stället.`
                : 'Passen visas här när frågebanken har dem.'}
            </p>
          )}
        </Coach>
        <Replies>
          {suggested && others.length ? (
            <button
              type="button"
              className="sa-chip sa-chip--big"
              onClick={() => registerRef.current?.focus()}
            >
              Välj ett annat pass
            </button>
          ) : null}
          {suggested ? (
            <button
              type="button"
              className="sa-chip sa-chip--primary sa-chip--big"
              data-testid="rd-prov-start"
              onClick={() => ask(suggested)}
            >
              Välj det här passet
              <Kbd>↵</Kbd>
            </button>
          ) : otherHas ? (
            <button
              type="button"
              className="sa-chip sa-chip--primary sa-chip--big"
              onClick={switchHalf}
            >
              Visa {HALF[other].adj} pass
              <Kbd>↵</Kbd>
            </button>
          ) : (
            // No pass in either half: practice is the way on.
            <button type="button" className="sa-chip sa-chip--primary sa-chip--big" onClick={toOva}>
              Till Öva
              <Kbd>↵</Kbd>
            </button>
          )}
        </Replies>
      </div>

      <div className="sa-later">
        <Divider quiet>{others.length ? 'Andra pass' : 'Om provpassen'}</Divider>
        <div className="sa-cards">
          {others.length ? (
            <section className="sa-card sa-card--register" aria-labelledby={`${leadId}-reg`}>
              <header className="sa-card-head">
                <h2 id={`${leadId}-reg`} tabIndex={-1} ref={registerRef}>
                  Alla riktiga pass · {HALF[half].label}
                </h2>
                <span>
                  Sett förut: {seen} av {of} frågor
                </span>
              </header>
              <ul className="sa-register">
                {bySitting(others).map((row) => (
                  <li className="sa-register-row" key={row.examId}>
                    <span className="sa-register-sitting">{row.sitting}</span>
                    <span className="sa-register-passes">
                      {row.passes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="sa-register-pass"
                          data-testid={`rd-prov-pass-${passSlug(p.id)}`}
                          onClick={() => ask(p)}
                        >
                          <span className="sa-sr">{row.sitting}, </span>
                          <span className="sa-register-name">{p.pass}</span>{' '}
                          <span className="sa-register-seen">
                            sett {p.seenBefore} av {p.presented}
                          </span>
                        </button>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hub.results.length ? (
            <Coach as="section" kind="sa-turn--line" aria-labelledby={`${leadId}-res`}>
              <h2 className="sa-line-h" id={`${leadId}-res`}>
                Dina senaste provpass
              </h2>
              <ul className="sa-prov-results">
                {hub.results.slice(0, 4).map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="sa-prov-result"
                      onClick={() => actions.openProvResult(r.id)}
                    >
                      <b>{HALF[r.half].label}</b>{' '}
                      <span className="sa-recent-score">
                        {r.correct}/{r.presented}
                      </span>{' '}
                      <span className="sa-recent-when">{r.when.toLocaleLowerCase('sv-SE')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Coach>
          ) : null}

          <section className="sa-card sa-card--rules" aria-labelledby={`${leadId}-rules`}>
            <header className="sa-card-head">
              <h2 id={`${leadId}-rules`}>Så går ett provpass till</h2>
              {halfView ? (
                <span>
                  {halfView.questions} frågor · {halfView.minutes} min
                </span>
              ) : null}
            </header>
            <ul className="sa-rules">
              {hub.rules.map((r) => (
                <li key={r}>{sentence(r)}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {asking ? (
        <PassConfirm
          pass={asking}
          half={hub.halves.find((h) => h.half === asking.half) ?? null}
          rules={hub.rules}
          onCancel={backOut}
          onStart={() => start(asking)}
        />
      ) : null}
    </div>
  )
}

/** A half as a reply you can give: its name, its size and its sections.
 *  The chosen one takes your tint and line — never the filled plum, which
 *  is the offer's. */
function HalfChoice({ h, on, onPick }: { h: ProvHalfView; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      className="sa-half"
      data-testid={`rd-prov-half-${h.half}`}
      aria-pressed={on}
      onClick={onPick}
    >
      <span className="sa-half-name">{h.label}</span>{' '}
      <span className="sa-half-meta">
        {h.questions} frågor · {h.minutes} min
      </span>{' '}
      <span className="sa-half-secs">{h.sections.map((s) => s.section).join(' · ')}</span>
    </button>
  )
}

/** The offered pass, attached to the coach's turn like a document. */
function PassAttachment({
  pass,
  half,
  nominal,
}: {
  pass: ProvPassOptionView
  half: ProvHalfView | null
  nominal: number
}) {
  const short = shortLine(pass.presented, nominal)
  return (
    <div className="sa-attach sa-attach--pass" data-testid={`rd-prov-pass-${passSlug(pass.id)}`}>
      <span className="sa-attach-icon" aria-hidden>
        <Timer size={20} strokeWidth={1.6} />
      </span>
      <span className="sa-attach-body">
        <span className="sa-attach-title">
          {pass.sitting} · {pass.pass}
        </span>{' '}
        <span className="sa-attach-meta">
          <span>{HALF[pass.half].label}</span>{' '}
          <span>{count(pass.presented, 'fråga', 'frågor')}</span>
          {half ? (
            <>
              {' '}
              <span>{half.minutes} min</span>
            </>
          ) : null}
        </span>{' '}
        {half ? (
          <>
            <span className="sa-attach-secs">
              {half.sections.map((s) => `${s.section} ${s.count}`).join(' · ')}
            </span>{' '}
          </>
        ) : null}
        <span className="sa-attach-when">
          Sett förut: {pass.seenBefore} av {pass.presented} frågor
        </span>
        {short ? (
          <>
            {' '}
            <span className="sa-attach-when">{short}</span>
          </>
        ) : null}
      </span>
    </div>
  )
}

/** The one gate before the clock starts: the exact pass, its size, the
 *  conditions — then "Starta nu" or "Inte nu". */
function PassConfirm({
  pass,
  half,
  rules,
  onCancel,
  onStart,
}: {
  pass: ProvPassOptionView
  half: ProvHalfView | null
  rules: readonly string[]
  onCancel: () => void
  onStart: () => void
}) {
  const titleId = useId()
  const short = shortLine(pass.presented, half?.questions ?? NOMINAL)
  return (
    <Gate titleId={titleId} onDismiss={onCancel} testId="rd-prov-gate">
      <Coach as="section" kind="sa-turn--lead sa-gate-turn" aria-labelledby={titleId}>
        <p className="sa-hello">
          {HALF[pass.half].label} · {count(pass.presented, 'fråga', 'frågor')}
          {half ? ` · ${half.minutes} minuter` : null}
        </p>
        <h2 className="sa-lead-q sa-gate-q" id={titleId} tabIndex={-1} data-gate-title="">
          {pass.sitting} · {pass.pass}
        </h2>
        {short ? <p className="sa-say sa-gate-short">{short}</p> : null}
        <p className="sa-say">När du startar går klockan, och det här gäller:</p>
        <ul className="sa-rules sa-rules--gate">
          {rules.map((r) => (
            <li key={r}>{sentence(r)}</li>
          ))}
        </ul>
        <p className="sa-say sa-say--quiet">Facit och resultat får du när du har lämnat in.</p>
      </Coach>
      <Replies>
        <button type="button" className="sa-chip sa-chip--big" onClick={onCancel}>
          Inte nu
        </button>
        <button
          type="button"
          className="sa-chip sa-chip--primary sa-chip--big"
          data-testid="rd-confirm"
          onClick={onStart}
        >
          Starta nu
        </button>
      </Replies>
    </Gate>
  )
}

// ── The running pass ─────────────────────────────────────────────────

/**
 * A started pass. The runner plays the provider's running pass only when
 * it is the one started; otherwise, or with no questions, or with its time
 * already gone, the coach says why it cannot run and the way back is
 * Provpass. Whether the time was gone is decided once, when the run
 * starts: a later zero from a provider whose clock ticks is the time
 * running out — a hand-in — never this.
 */
export function SamtalPass({
  passId,
  width,
  live,
  onLeave,
  onHandIn,
  onHandInFailed,
}: {
  passId: string
  width: WidthKey
  live: boolean
  /** Back to the hub: the pass was given up ('void'), or never ran. */
  onLeave: (why: 'void' | 'back') => void
  /** The pass is handed in, its answers as they stood: the run ends. */
  onHandIn: (pass: HandedPass) => void
  /** The host refused that hand-in: its action threw, or its promise
   *  rejected. */
  onHandInFailed: (pass: HandedPass) => void
}) {
  const { data } = useDirectionData()
  const running = data.provpass.running
  const [expiredAtStart] = useState(() => running.remainingSeconds <= 0)
  const asked = data.provpass.hub.passes.find((p) => p.id === passId)
  const name = asked ? `${asked.sitting} · ${asked.pass}` : 'Passet'
  if (running.passId !== passId) {
    return (
      <PassNotRunning
        width={width}
        live={live}
        title={`${name} kan inte öppnas här just nu.`}
        say="Välj ett annat pass i Provpass."
        onBack={() => onLeave('back')}
      />
    )
  }
  if (!running.questions.length) {
    return (
      <PassNotRunning
        width={width}
        live={live}
        title="Passet har inga frågor att visa."
        say="Välj ett annat pass i Provpass."
        onBack={() => onLeave('back')}
      />
    )
  }
  if (expiredAtStart) {
    return (
      <PassNotRunning
        width={width}
        live={live}
        title="Tiden för det här passet har redan gått ut."
        say="Ett provpass kan inte pausas, så det här kan inte fortsätta. Starta ett nytt när du vill."
        onBack={() => onLeave('back')}
      />
    )
  }
  return (
    <PassRunner
      key={running.passId}
      r={running}
      width={width}
      live={live}
      onVoid={() => onLeave('void')}
      onHandIn={onHandIn}
      onHandInFailed={onHandInFailed}
    />
  )
}

/** A pass that cannot run: the coach says why, and the one way on is
 *  Provpass. No clock, no questions. */
function PassNotRunning({
  width,
  live,
  title,
  say,
  onBack,
}: {
  width: WidthKey
  live: boolean
  title: string
  say: string
  onBack: () => void
}) {
  const headingId = useId()
  const ref = useRef<HTMLElement>(null)
  useKeyMap({ Enter: onBack }, live)
  useEffect(() => {
    if (live) ref.current?.focus({ preventScroll: true })
  }, [live])
  const turn = (
    <div className="sa-closing">
      <Divider>Provpass</Divider>
      <div className="sa-thread">
        <Coach
          as="section"
          kind="sa-turn--lead"
          aria-labelledby={headingId}
          tabIndex={-1}
          ref={ref}
          data-testid="rd-prov-unavailable"
        >
          <h1 className="sa-lead-q" id={headingId}>
            {title}
          </h1>
          <p className="sa-say sa-say--quiet">{say}</p>
        </Coach>
        <Replies>
          <button type="button" className="sa-chip sa-chip--primary sa-chip--big" onClick={onBack}>
            Till Provpass
            <Kbd>↵</Kbd>
          </button>
        </Replies>
      </div>
    </div>
  )
  return width === 'phone' ? (
    <div className="sa-pdrill" data-phase="done">
      <div className="sa-pdone">{turn}</div>
    </div>
  ) : (
    <div className="sa-drill" data-phase="done">
      <div className="sa-done-scroll">
        <div className="sa-col">{turn}</div>
      </div>
    </div>
  )
}

/** Why a question cannot be answered yet, or null. A figure it needs — its
 *  DTK page or diagram, its options' images — still loading is a wait
 *  (`wait`), said calmly; a missing stem, options, text or page, or a figure
 *  that failed, stops the answer until a retry. The reader can always move
 *  on: an unanswered question is only unanswered. */
function passBlock(q: DrillQuestion, loads: FigureLoads): { reason: string; wait: boolean } | null {
  const stop = (reason: string) => ({ reason, wait: false })
  const gap = q.section === 'ELF' && q.prompt === ''
  if (!gap && !q.prompt?.trim()) return stop('Frågetexten saknas, så frågan kan inte besvaras.')
  if (!q.options?.length) return stop('Frågan saknar svarsalternativ och kan inte besvaras här.')
  if ((q.section === 'LÄS' || q.section === 'ELF') && !q.passage) {
    return stop('Texten saknas, så frågan kan inte besvaras.')
  }
  if (q.section === 'DTK' && !q.figure)
    return stop('Underlaget saknas, så frågan kan inte besvaras.')
  const page = q.figure?.kind === 'raster'
  const figure = q.figure ? loads.status(q.figure.src) : 'ready'
  const images = q.options.flatMap((o) =>
    o.figure ? [{ letter: o.letter, status: loads.status(o.figure.src) }] : [],
  )
  const failed = images.filter((i) => i.status === 'error').map((i) => i.letter)
  if (figure === 'error') {
    return stop(
      page
        ? 'Underlaget gick inte att ladda, så frågan kan inte besvaras.'
        : 'Figuren gick inte att ladda, så frågan kan inte besvaras.',
    )
  }
  if (failed.length) return stop(`${optionImagesFailed(failed)}, så frågan kan inte besvaras.`)
  if (figure === 'loading') {
    return {
      reason: page
        ? 'Underlaget laddas – du kan svara när det syns.'
        : 'Figuren laddas – du kan svara när den syns.',
      wait: true,
    }
  }
  if (images.some((i) => i.status === 'loading')) {
    return {
      reason: 'Bilderna till svarsalternativen laddas – du kan svara när de syns.',
      wait: true,
    }
  }
  return null
}

/** The section runs of a pass, from its questions (0-based, end exclusive). */
function runsOf(questions: readonly DrillQuestion[]) {
  const runs: { section: Section; start: number; end: number }[] = []
  questions.forEach((q, i) => {
    const last = runs[runs.length - 1]
    if (last && last.section === q.section) last.end = i + 1
    else runs.push({ section: q.section, start: i, end: i + 1 })
  })
  return runs
}

/** What a question reads beside it: its DTK page or its passage. */
function docKey(q: DrillQuestion | undefined): string | null {
  if (!q) return null
  if (q.figure?.kind === 'raster') return `page:${q.figure.src}`
  if (q.passage) {
    return `text:${q.passage.unitId ?? q.source.examId}:${q.passage.paragraphs[0]?.slice(0, 48) ?? ''}`
  }
  return null
}

/** A page's zoom (an index into FIGURE_ZOOMS) and rotation, in degrees. */
type PageView = { zoom: number; rotation: number }
const PAGE_START: PageView = { zoom: 0, rotation: 0 }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

function onControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('button, a[href], summary, [role="button"], [role="tab"]') != null
  )
}

/** The pass's own scroll panes, which keep their arrows and Space: the
 *  conversation's column when it has focus itself (the desktop thread, the
 *  phone's one scroll), and the document beside the question — the
 *  passage, the DTK page and its pan — wherever in it focus is. */
function inPane(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    (target.matches('.sa-thread--pass, .sa-ppass-scroll') || target.closest('.sa-pass-doc') != null)
  )
}

/** An action's answer that settles later: a promise, or another thenable. */
function settlesLater(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function'
}

type PassGate = 'review' | 'abort'

function PassRunner({
  r,
  width,
  live,
  onVoid,
  onHandIn,
  onHandInFailed,
}: {
  r: ProvRunningView
  width: WidthKey
  live: boolean
  onVoid: () => void
  onHandIn: (pass: HandedPass) => void
  onHandInFailed: (pass: HandedPass) => void
}) {
  const { actions } = useDirectionData()
  const phone = width === 'phone'
  const total = r.questions.length
  const [index, setIndex] = useState(() => clamp(r.current, 0, total - 1))
  // A list that shrinks under the reader keeps a real question on screen.
  const at = clamp(index, 0, total - 1)
  const q = r.questions[at]
  const page = q.figure?.kind === 'raster' ? q.figure : null
  const [answers, setAnswers] = useState<Partial<Record<string, AnswerLetter>>>(() => ({
    ...r.answers,
  }))
  const flagsOn = r.flags !== undefined
  const [flags, setFlags] = useState<ReadonlySet<string>>(() => new Set(r.flags ?? []))
  const [gate, setGate] = useState<PassGate | null>(null)
  const [inspecting, setInspecting] = useState(false)
  const [views, setViews] = useState<Record<string, PageView>>({})
  const loads = useFigureLoadState()

  // The pass's own clock: its deadline is taken once, when the run starts,
  // and it runs through every gate. A provider whose clock ticks may only
  // bring the end closer.
  const [deadline] = useState(() => Date.now() + r.remainingSeconds * 1000)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!live) return
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [live])
  const left = live
    ? Math.max(0, Math.min(Math.ceil((deadline - now) / 1000), r.remainingSeconds))
    : r.remainingSeconds

  // Handing in happens once — by the reader, or by the clock at zero. The
  // answers go to the screen as they stand (Samtal.tsx), which ends the run:
  // the frame comes back with "Lämnar in …", and this runner, its keys and
  // its key scope with it, is gone. An action that throws, or a promise from
  // it that rejects, is a refused hand-in, said with those answers; it is
  // never sent again (kit v2 has no safe way to send a pass twice).
  const handed = useRef(false)
  const handIn = (by: 'reader' | 'time') => {
    if (handed.current) return
    handed.current = true
    setGate(null)
    setInspecting(false)
    const pass: HandedPass = {
      name: `${r.sitting} · ${r.pass}`,
      by,
      questions: r.questions,
      answers,
      flags: flagsOn ? flags : null,
    }
    onHandIn(pass)
    const refused = () => onHandInFailed(pass)
    let sent: unknown
    try {
      sent = actions.submitProvpass()
    } catch {
      refused()
      return
    }
    if (settlesLater(sent)) sent.then(undefined, refused)
  }
  const handInNow = useRef(handIn)
  handInNow.current = handIn
  useEffect(() => {
    if (live && left === 0) handInNow.current('time')
  }, [live, left])

  const block = passBlock(q, loads)
  const picked = answers[q.qid] ?? null
  const answeredCount = r.questions.filter((x) => answers[x.qid] != null).length

  const pick = (letter: AnswerLetter) => {
    if (handed.current || block) return
    if (!q.options?.some((o) => o.letter === letter)) return
    setAnswers((a) => ({ ...a, [q.qid]: letter }))
  }
  const moved = useRef(true)
  const go = (i: number) => {
    const n = clamp(i, 0, total - 1)
    if (n === at) return
    moved.current = true
    setIndex(n)
  }
  const next = () => (at + 1 < total ? go(at + 1) : setGate('review'))
  const toggleFlag = () =>
    setFlags((s) => {
      const n = new Set(s)
      if (n.has(q.qid)) n.delete(q.qid)
      else n.add(q.qid)
      return n
    })

  // A new question after the reader's move starts at its top and takes
  // focus; one that reads the same document keeps the document where the
  // reader left it (on the phone, the scroll goes to the question).
  const scrollRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef<HTMLElement>(null)
  const overviewRef = useRef<HTMLHeadingElement>(null)
  const lastDoc = useRef<string | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a new question only
  useEffect(() => {
    const doc = docKey(q)
    const same = doc != null && doc === lastDoc.current
    lastDoc.current = doc
    if (!moved.current) return
    moved.current = false
    const box = scrollRef.current
    const turn = turnRef.current
    if (phone && same && turn) box?.scrollTo?.({ top: Math.max(0, turn.offsetTop - 12) })
    else box?.scrollTo?.({ top: 0 })
    if (live) turn?.focus({ preventScroll: true })
  }, [at])

  const toOverview = () => overviewRef.current?.focus()

  // "Förstora figur": the page over the whole pass, for as long as the
  // question has it. Esc or "Stäng figur" closes it; once the pass under it
  // is in reach again (no longer inert), focus goes back to the control
  // that opened it — or to the question, if that control went with the
  // page. A pass that ends under it hands focus to its hand-in instead.
  const showing = inspecting && page != null
  const opener = useRef<HTMLElement | null>(null)
  const wasShowing = useRef(false)
  useEffect(() => {
    if (showing) {
      wasShowing.current = true
      return
    }
    if (inspecting) setInspecting(false)
    if (!wasShowing.current) return
    wasShowing.current = false
    const back = opener.current
    opener.current = null
    if (back?.isConnected && !back.matches(':disabled')) back.focus({ preventScroll: true })
    else turnRef.current?.focus({ preventScroll: true })
  }, [showing, inspecting])
  const inspect = (from: HTMLElement) => {
    opener.current = from
    setInspecting(true)
  }

  // The keys. While the pass runs, the bake-off's switcher keys never leave
  // it: the digits never, whatever has focus; ←/→ neither, but a scroll
  // pane with focus keeps them (inPane) — there they scroll, or with Shift
  // select, natively, and the pass's key scope keeps them from the switcher
  // all the same. a–e answer only the letters the question has, from
  // anywhere but a gate or the enlarged page; ←/→ change the question unless
  // a control or a pane has focus; Enter moves on (on the last question:
  // Granska svar); Space moves on once answered, and otherwise scrolls. Esc
  // never gives the pass up. Handed in, the pass lets go of every key.
  const keys = useRef<(e: KeyboardEvent) => void>(() => {})
  keys.current = (e) => {
    if (handed.current || e.metaKey || e.ctrlKey || e.altKey) return
    const target = e.target
    const arrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
    const pane = inPane(target)
    if (/^[0-9]$/.test(e.key) || (arrow && !pane)) e.preventDefault()
    if (gate || showing || isForeignKey(e)) return
    const k = e.key.length === 1 ? e.key.toLocaleLowerCase('sv-SE') : e.key
    if (/^[a-e]$/.test(k)) {
      if (e.shiftKey) return
      const letter = k.toUpperCase() as AnswerLetter
      if (q.options?.some((o) => o.letter === letter)) {
        e.preventDefault()
        pick(letter)
      }
      return
    }
    if (arrow) {
      if (onControl(target) || pane) return
      go(at + (e.key === 'ArrowRight' ? 1 : -1))
      return
    }
    if (e.key === 'Enter') {
      if (onControl(target)) return
      e.preventDefault()
      next()
      return
    }
    if (e.key === ' ') {
      if (onControl(target) || pane || picked == null) return
      e.preventDefault()
      next()
    }
  }
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => keys.current(e)
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live])

  const view = page ? (views[page.src] ?? PAGE_START) : PAGE_START
  const setView = (patch: Partial<PageView>) => {
    if (!page) return
    setViews((m) => ({ ...m, [page.src]: { ...(m[page.src] ?? PAGE_START), ...patch } }))
  }
  const pageStatus: FigureStatus = page ? loads.status(page.src) : 'ready'
  const doc = page ? (
    <PassPage
      key={`page:${page.src}`}
      figure={page}
      view={view}
      status={pageStatus}
      attempt={loads.attempt(page.src)}
      phone={phone}
      run={pageRun(r.questions, at)}
      onZoom={(dir) => setView({ zoom: clamp(view.zoom + dir, 0, FIGURE_ZOOMS.length - 1) })}
      onRotate={() => setView({ rotation: (view.rotation + 90) % 360 })}
      onInspect={inspect}
      onStatus={(s) => loads.report(page.src, s)}
      onRetry={() => loads.retry(page.src)}
    />
  ) : q.passage ? (
    <PassPassage key={docKey(q) ?? undefined} q={q} scrolls={!phone} />
  ) : null

  const flagged = flagsOn && flags.has(q.qid)
  const turn = (
    <PassTurn
      q={q}
      n={at + 1}
      loads={loads}
      flag={flagsOn ? { on: flagged, toggle: toggleFlag } : null}
      ref={turnRef}
    />
  )
  const options = <PassOptions q={q} picked={picked} block={block} loads={loads} onPick={pick} />
  const dock = (
    <PassDock
      q={q}
      first={at === 0}
      last={at + 1 >= total}
      picked={picked}
      block={block}
      phone={phone}
      onPrev={() => go(at - 1)}
      onNext={next}
    />
  )
  const overview = (
    <AnswerOverview
      r={r}
      at={at}
      answers={answers}
      flags={flagsOn ? flags : null}
      headingRef={overviewRef}
      onGo={go}
      onHandIn={() => setGate('review')}
    />
  )
  const sub = (
    <p className="sa-pass-sub">
      {phone ? (
        <>
          <span>
            Fråga {at + 1} av {total} · {q.section}
          </span>{' '}
        </>
      ) : null}
      <span>
        {answeredCount} av {total} besvarade
      </span>{' '}
      <button type="button" className="sa-link sa-pass-sub-link" onClick={toOverview}>
        Visa svarsöversikt
      </button>
    </p>
  )
  const unanswered = r.questions
    .map((x, i) => (answers[x.qid] == null ? i + 1 : null))
    .filter((n): n is number => n != null)
  const flaggedNs = flagsOn
    ? r.questions
        .map((x, i) => (flags.has(x.qid) ? i + 1 : null))
        .filter((n): n is number => n != null)
    : []
  const busy = gate != null || showing

  const body = phone ? (
    <div className="sa-ppass">
      <header className="sa-phead sa-ppass-head">
        <AbortButton onClick={() => setGate('abort')} />
        <span aria-hidden />
        <PassClock left={left} live={live} />
      </header>
      <div className="sa-ppass-scroll" ref={scrollRef}>
        {sub}
        {doc ? <div className="sa-ppass-doc">{doc}</div> : null}
        <div className="sa-thread">
          {turn}
          {options}
        </div>
        {dock}
        {overview}
      </div>
    </div>
  ) : (
    <div className="sa-pass-desk">
      <header className="sa-strip sa-pass-strip">
        <AbortButton onClick={() => setGate('abort')} />
        <p className="sa-progress sa-pass-pos">
          Fråga {at + 1} av {total}{' '}
          <span className="sa-pass-sec">
            <span className="sa-sr">, </span>
            {q.section}
          </span>
        </p>
        <PassClock left={left} live={live} />
      </header>
      {sub}
      <div className={doc ? (page ? 'sa-dbody sa-dbody--figure' : 'sa-dbody') : 'sa-qbody'}>
        {doc}
        <section
          className={doc ? 'sa-talk' : 'sa-talk sa-talk--solo'}
          aria-label={`Fråga ${at + 1} av ${total}`}
        >
          <div className="sa-thread sa-thread--drill sa-thread--pass" ref={scrollRef}>
            {turn}
            {options}
            {dock}
            {overview}
          </div>
        </section>
      </div>
    </div>
  )

  return (
    <div
      className="sa-pass"
      data-testid="rd-prov-running"
      data-width={width}
      // While it runs, the whole pass is the reader's: the switcher leaves
      // its keys alone. Handed in, the runner and its scope are gone.
      data-rd-keyscope={live ? '' : undefined}
    >
      <h1 className="sa-sr">
        Provpass: {r.sitting} · {r.pass}
      </h1>
      <div className="sa-pass-main" inert={busy}>
        {body}
      </div>
      {gate === 'review' ? (
        <ReviewGate
          total={total}
          unanswered={unanswered}
          flagged={flaggedNs}
          left={left}
          onBack={() => setGate(null)}
          onGoTo={(n) => {
            setGate(null)
            go(n - 1)
          }}
          onHandIn={() => handIn('reader')}
        />
      ) : null}
      {gate === 'abort' ? (
        <AbortGate
          onBack={() => setGate(null)}
          onAbort={() => {
            handed.current = true
            setGate(null)
            onVoid()
          }}
        />
      ) : null}
      {showing && page ? (
        <FigureInspector
          figure={page}
          rotation={view.rotation}
          attempt={loads.attempt(page.src)}
          onRotate={() => setView({ rotation: (view.rotation + 90) % 360 })}
          // The enlarged page shows the page already there; the answer
          // waits on the page beside the question, not on this one.
          onStatus={() => {}}
          onClose={() => setInspecting(false)}
        />
      ) : null}
    </div>
  )
}

/** The run of questions on the same page as question `index`: its place in
 *  the run, or null when the page has one question. */
function pageRun(questions: readonly DrillQuestion[], index: number) {
  const src = questions[index]?.figure?.src
  if (!src) return null
  let first = index
  while (first > 0 && questions[first - 1].figure?.src === src) first--
  let last = index
  while (last + 1 < questions.length && questions[last + 1].figure?.src === src) last++
  return last > first ? { at: index - first + 1, of: last - first + 1 } : null
}

function AbortButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="sa-ghost sa-exit sa-pass-exit"
      onClick={onClick}
      data-testid="rd-exit"
      aria-haspopup="dialog"
    >
      <X size={18} strokeWidth={1.75} aria-hidden />
      <span className="sa-exit-word">Avbryt provpass</span>
    </button>
  )
}

/** The clock: what is left, in plain digits. It never announces every
 *  second; at ten, five and one minute left it says so once. */
function PassClock({ left, live }: { left: number; live: boolean }) {
  const stage = left <= 60 ? 1 : left <= 300 ? 5 : left <= 600 ? 10 : 0
  const last = useRef(stage)
  const [note, setNote] = useState('')
  useEffect(() => {
    if (live && stage !== last.current && stage > 0) {
      setNote(stage === 1 ? 'En minut kvar.' : `${sentence(words(stage))} minuter kvar.`)
    }
    last.current = stage
  }, [stage, live])
  return (
    <span className="sa-pass-clock-wrap">
      <span
        className="sa-clock sa-pass-clock"
        role="timer"
        data-testid="rd-prov-timer"
        data-low={stage > 0 && stage <= 5 ? 'true' : undefined}
      >
        <Clock size={15} strokeWidth={1.75} aria-hidden />
        <span className="sa-sr">Tid kvar: </span>
        <span>{fmtClock(left)}</span>{' '}
        <span className="sa-pass-clock-word" aria-hidden>
          kvar
        </span>
      </span>
      <span className="sa-sr" aria-live="polite">
        {note}
      </span>
    </span>
  )
}

/** The question as the coach's turn, in quiet exam wording: its place and
 *  section, the flag, and the problem — nothing that helps or grades. */
function PassTurn({
  q,
  n,
  loads,
  flag,
  ref,
}: {
  q: DrillQuestion
  n: number
  loads: FigureLoads
  flag: { on: boolean; toggle: () => void } | null
  ref?: Ref<HTMLElement>
}) {
  const headingId = useId()
  return (
    <Coach
      as="section"
      kind="sa-turn--q sa-turn--quant sa-turn--pass"
      aria-labelledby={headingId}
      tabIndex={-1}
      ref={ref}
    >
      <div className="sa-pass-turn-head">
        <p className="sa-turn-label">
          Fråga {n} · {q.section}
        </p>
        {flag ? (
          <button
            type="button"
            className="sa-tool sa-pass-flag"
            data-testid="rd-prov-flag"
            aria-pressed={flag.on}
            onClick={flag.toggle}
            title="Markera frågan för att komma tillbaka till den"
          >
            <Flag size={15} strokeWidth={1.75} aria-hidden />
            Markera
          </button>
        ) : null}
      </div>
      <PassProblem q={q} headingId={headingId} loads={loads} />
    </Coach>
  )
}

/** The problem, each shape kept whole: KVA's condition and quantities,
 *  NOG's statements and coda, an ELF gap as "Lucka N", everything else as
 *  the bank has it, math set by KaTeX. */
function PassProblem({
  q,
  headingId,
  loads,
}: {
  q: DrillQuestion
  headingId: string
  loads: FigureLoads
}) {
  const prompt = q.prompt ?? ''
  const kva = q.section === 'KVA' && prompt ? splitKvaPrompt(prompt) : null
  const nog = q.section === 'NOG' && prompt ? parseNogPrompt(prompt) : null
  const diagram =
    q.figure && q.figure.kind === 'svg' ? <PassDiagram figure={q.figure} loads={loads} /> : null

  if (kva) {
    const prose = kva.condition ? isProseCondition(kva.condition) : false
    return (
      <div className="sa-qprompt" data-testid="rd-prov-prompt">
        <h2 className="sa-q" id={headingId}>
          Jämför kvantiteterna.
        </h2>
        <div className="sa-problem">
          {kva.condition && prose ? (
            <p className="sa-problem-setup">
              <MathText>{kva.condition}</MathText>
            </p>
          ) : null}
          {kva.condition && !prose ? (
            <p className="sa-problem-cond">
              <span className="sa-problem-label">Villkor</span>
              <span className="sa-problem-math">
                <MathText>{kva.condition}</MathText>
              </span>
            </p>
          ) : null}
          {diagram}
          <dl className="sa-kva">
            <div className="sa-kva-q">
              <dt className="sa-problem-label">Kvantitet I</dt>
              <dd className="sa-problem-math">
                <MathText>{kva.kvI}</MathText>
              </dd>
            </div>
            <div className="sa-kva-q">
              <dt className="sa-problem-label">Kvantitet II</dt>
              <dd className="sa-problem-math">
                <MathText>{kva.kvII}</MathText>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    )
  }

  if (nog) {
    return (
      <div className="sa-qprompt" data-testid="rd-prov-prompt">
        <h2 className="sa-q" id={headingId}>
          <MathText>{nog.question}</MathText>
        </h2>
        <div className="sa-problem">
          {diagram}
          <ol className="sa-nog">
            <li>
              <span className="sa-nog-n" aria-hidden>
                (1)
              </span>
              <span className="sa-problem-math">
                <span className="sa-sr">Påstående 1: </span>
                <MathText>{nog.statement1}</MathText>
              </span>
            </li>
            <li>
              <span className="sa-nog-n" aria-hidden>
                (2)
              </span>
              <span className="sa-problem-math">
                <span className="sa-sr">Påstående 2: </span>
                <MathText>{nog.statement2}</MathText>
              </span>
            </li>
          </ol>
          {nog.tail ? <p className="sa-problem-coda">{nog.tail}</p> : null}
        </div>
      </div>
    )
  }

  const gap = q.section === 'ELF' && q.prompt === ''
  return (
    <div className="sa-qprompt" data-testid="rd-prov-prompt">
      <h2
        className="sa-q"
        id={headingId}
        lang={q.section === 'ELF' && !gap && prompt.trim() ? 'en' : undefined}
      >
        {gap ? (
          `Lucka ${q.number}`
        ) : prompt.trim() ? (
          <MathText>{prompt}</MathText>
        ) : (
          'Frågetexten saknas.'
        )}
      </h2>
      {diagram ? <div className="sa-problem">{diagram}</div> : null}
      {q.section === 'DTK' && !q.figure ? (
        <p className="sa-problem-missing">Underlaget saknas för den här frågan.</p>
      ) : null}
    </div>
  )
}

/** A quant diagram on its paper plate. Each mounted image is a load of its
 *  own; one that fails says so in place, with a real retry. */
function PassDiagram({ figure, loads }: { figure: DrillFigure; loads: FigureLoads }) {
  const { src } = figure
  if (loads.status(src) === 'error') {
    return (
      <div className="sa-problem-missing sa-problem-failed" role="alert">
        <p>Figuren gick inte att ladda.</p>
        <button type="button" className="sa-chip" onClick={() => loads.retry(src)}>
          Försök igen
        </button>
      </div>
    )
  }
  return (
    <figure className="sa-problem-fig">
      <FigureImg
        key={`${src}#${loads.attempt(src)}`}
        src={`/${src}`}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        fresh
        onStatus={(s) => loads.report(src, s)}
      />
    </figure>
  )
}

/** The options as your replies: a choice is your answer at once, tinted
 *  and lettered, and stays yours to change. While the question cannot be
 *  answered yet, the options rest (the action bar says why). */
function PassOptions({
  q,
  picked,
  block,
  loads,
  onPick,
}: {
  q: DrillQuestion
  picked: AnswerLetter | null
  block: { reason: string; wait: boolean } | null
  loads: FigureLoads
  onPick: (letter: AnswerLetter) => void
}) {
  const options = q.options ?? []
  if (!options.length) return null
  const en = q.section === 'ELF'
  const failed = options.flatMap((o) =>
    o.figure && loads.status(o.figure.src) === 'error'
      ? [{ letter: o.letter, src: o.figure.src }]
      : [],
  )
  return (
    <>
      <ol className="sa-opts sa-opts--pass" aria-label="Svarsalternativ">
        {options.map((o) => {
          const selected = picked === o.letter
          return (
            <li key={o.letter} className="sa-opt" data-state={selected ? 'selected' : undefined}>
              <button
                type="button"
                className="sa-opt-main"
                data-testid={`rd-prov-option-${o.letter}`}
                aria-pressed={selected}
                aria-disabled={block ? true : undefined}
                onClick={() => onPick(o.letter)}
              >
                <span className="sa-letter" aria-hidden>
                  {o.letter}
                </span>
                <span className="sa-opt-text">
                  <span className="sa-sr">Alternativ {o.letter}: </span>
                  <span lang={en ? 'en' : undefined}>
                    <OptionBody option={o} loads={loads} fresh />
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {failed.length ? (
        <div className="sa-problem-missing sa-problem-failed sa-opts-failed" role="alert">
          <p>{optionImagesFailed(failed.map((f) => f.letter))}.</p>
          <button
            type="button"
            className="sa-chip"
            onClick={() => {
              for (const f of failed) loads.retry(f.src)
            }}
          >
            Försök igen
          </button>
        </div>
      ) : null}
    </>
  )
}

/** The action bar: back, your answer as a receipt (or why there is none
 *  yet), and the one way on — "Nästa fråga", on the last question "Granska
 *  svar". Nothing is graded here. */
function PassDock({
  q,
  first,
  last,
  picked,
  block,
  phone,
  onPrev,
  onNext,
}: {
  q: DrillQuestion
  first: boolean
  last: boolean
  picked: AnswerLetter | null
  block: { reason: string; wait: boolean } | null
  phone: boolean
  onPrev: () => void
  onNext: () => void
}) {
  const letters = (q.options ?? []).map((o) => o.letter)
  return (
    <div className="sa-dock sa-pass-dock" data-blocked={block && !block.wait ? 'true' : undefined}>
      <p className="sa-dock-status" aria-live="polite">
        {block ? (
          block.reason
        ) : picked ? (
          <>
            Ditt svar: <b className="sa-dock-pick">{picked}</b>{' '}
            <span className="sa-dock-keys">du kan ändra det tills du lämnar in</span>
          </>
        ) : phone || !letters.length ? (
          'Inget svar än'
        ) : (
          <span className="sa-dock-keys">
            <Kbd>{letters[0]}</Kbd>–<Kbd>{letters[letters.length - 1]}</Kbd> svarar · <Kbd>←</Kbd>{' '}
            <Kbd>→</Kbd> byter fråga
          </span>
        )}
      </p>
      <span className="sa-dock-acts">
        <button type="button" className="sa-chip sa-chip--quiet" onClick={onPrev} disabled={first}>
          {phone ? 'Föregående' : 'Föregående fråga'}
        </button>
        <button type="button" className="sa-send" onClick={onNext} data-testid="rd-prov-next">
          {last ? 'Granska svar' : 'Nästa fråga'}
          <Kbd>↵</Kbd>
        </button>
      </span>
    </div>
  )
}

/** The answer overview under the conversation: every question by section,
 *  your letter on the answered ones, the current one ringed, the flagged
 *  ones marked — each a way to its question — and the way to hand in. */
function AnswerOverview({
  r,
  at,
  answers,
  flags,
  headingRef,
  onGo,
  onHandIn,
}: {
  r: ProvRunningView
  at: number
  answers: Partial<Record<string, AnswerLetter>>
  /** Null when the pass carries no flags. */
  flags: ReadonlySet<string> | null
  headingRef: RefObject<HTMLHeadingElement | null>
  onGo: (index: number) => void
  onHandIn: () => void
}) {
  const id = useId()
  const total = r.questions.length
  const answered = r.questions.filter((x) => answers[x.qid] != null).length
  const marked = flags ? r.questions.filter((x) => flags.has(x.qid)).length : 0
  return (
    <section className="sa-card sa-overview" aria-labelledby={id} data-testid="rd-prov-grid">
      <header className="sa-card-head">
        <h2 id={id} tabIndex={-1} ref={headingRef}>
          Svarsöversikt
        </h2>
        <span>
          {answered} av {total} besvarade
          {marked ? ` · ${marked} markerade` : null}
        </span>
      </header>
      {runsOf(r.questions).map((run) => (
        <div className="sa-overview-run" key={run.start}>
          <h3 className="sa-overview-h">
            {run.section}{' '}
            <span>
              {run.start + 1}–{run.end}
            </span>
          </h3>
          <ol className="sa-cells">
            {r.questions.slice(run.start, run.end).map((x, k) => {
              const n = run.start + k + 1
              const letter = answers[x.qid] ?? null
              const current = n - 1 === at
              const flagged = flags?.has(x.qid) ?? false
              const said = [
                `Fråga ${n}`,
                x.section,
                letter ? `svar ${letter}` : 'obesvarad',
                flagged ? 'markerad' : null,
                current ? 'här nu' : null,
              ]
                .filter(Boolean)
                .join(', ')
              return (
                <li key={x.qid}>
                  <button
                    type="button"
                    className="sa-cell"
                    data-testid={`rd-prov-cell-${n}`}
                    data-answered={String(letter != null)}
                    data-current={String(current)}
                    data-flagged={flagged ? 'true' : undefined}
                    aria-current={current ? 'step' : undefined}
                    aria-label={said}
                    onClick={() => onGo(n - 1)}
                  >
                    <span className="sa-cell-n" aria-hidden>
                      {n}
                    </span>
                    <span className="sa-cell-l" aria-hidden>
                      {letter ?? ''}
                    </span>
                    {flagged ? (
                      <Flag className="sa-cell-flag" size={11} strokeWidth={2} aria-hidden />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
      <footer className="sa-overview-foot">
        <p className="sa-overview-key" aria-hidden>
          <span className="sa-key-swatch" data-kind="answered" /> besvarad
          <span className="sa-key-swatch" data-kind="current" /> här nu
          {flags ? (
            <>
              <Flag size={11} strokeWidth={2} /> markerad
            </>
          ) : null}
        </p>
        <button type="button" className="sa-chip" data-testid="rd-prov-submit" onClick={onHandIn}>
          Lämna in …
        </button>
      </footer>
    </section>
  )
}

/** The hand-in gate: what is unanswered (each one a way back to it), what
 *  is flagged, the clock still running — then "Lämna in". */
function ReviewGate({
  total,
  unanswered,
  flagged,
  left,
  onBack,
  onGoTo,
  onHandIn,
}: {
  total: number
  unanswered: number[]
  flagged: number[]
  left: number
  onBack: () => void
  /** To question `n` (1-based). */
  onGoTo: (n: number) => void
  onHandIn: () => void
}) {
  const titleId = useId()
  const blank = unanswered.length
  const say =
    blank === 0
      ? `Alla ${total} frågor är besvarade.`
      : blank === 1
        ? `En fråga är obesvarad: fråga ${unanswered[0]}. Fel ger inga avdrag, så ett svar är bättre än inget.`
        : `${blank} frågor är obesvarade. Fel ger inga avdrag, så ett svar är bättre än inget.`
  const jumps = (list: number[]) =>
    list.length > 12 ? (
      <button type="button" className="sa-chip" onClick={() => onGoTo(list[0])}>
        Till fråga {list[0]}, den första
      </button>
    ) : (
      list.map((n) => (
        <button key={n} type="button" className="sa-chip" onClick={() => onGoTo(n)}>
          Fråga {n}
        </button>
      ))
    )
  return (
    <Gate titleId={titleId} onDismiss={onBack} testId="rd-prov-review">
      <Coach as="section" kind="sa-turn--lead sa-gate-turn" aria-labelledby={titleId}>
        <p className="sa-hello">
          {total - blank} av {total} besvarade · {fmtClock(left)} kvar
        </p>
        <h2 className="sa-lead-q sa-gate-q" id={titleId} tabIndex={-1} data-gate-title="">
          Lämna in passet?
        </h2>
        <p className="sa-say">{say}</p>
        {blank ? (
          <fieldset className="sa-gate-jumps" aria-label="Obesvarade frågor">
            {jumps(unanswered)}
          </fieldset>
        ) : null}
        {flagged.length ? (
          <>
            <p className="sa-say">
              {flagged.length === 1
                ? `Du markerade fråga ${flagged[0]}.`
                : `Du markerade ${words(flagged.length)} frågor.`}
            </p>
            <fieldset className="sa-gate-jumps" aria-label="Markerade frågor">
              {jumps(flagged)}
            </fieldset>
          </>
        ) : null}
        <p className="sa-say sa-say--quiet">
          Klockan går medan du granskar. När du har lämnat in går det inte att ändra något.
        </p>
      </Coach>
      <Replies>
        <button type="button" className="sa-chip sa-chip--big" onClick={onBack}>
          Tillbaka till passet
        </button>
        <button
          type="button"
          className="sa-chip sa-chip--primary sa-chip--big"
          data-testid="rd-confirm"
          onClick={onHandIn}
        >
          Lämna in
        </button>
      </Replies>
    </Gate>
  )
}

/** Giving the pass up asks first, and says what it costs. The safe reply
 *  is the filled one. */
function AbortGate({ onBack, onAbort }: { onBack: () => void; onAbort: () => void }) {
  const titleId = useId()
  return (
    <Gate titleId={titleId} onDismiss={onBack} testId="rd-prov-abort">
      <Coach as="section" kind="sa-turn--lead sa-gate-turn" aria-labelledby={titleId}>
        <h2 className="sa-lead-q sa-gate-q" id={titleId} tabIndex={-1} data-gate-title="">
          Avbryta provpasset?
        </h2>
        <p className="sa-say">
          Avbryter du blir provet ogiltigt, och passet får inget resultat. Klockan går medan du
          bestämmer dig.
        </p>
      </Coach>
      <Replies>
        <button
          type="button"
          className="sa-chip sa-chip--big"
          data-testid="rd-confirm"
          onClick={onAbort}
        >
          Avbryt provpasset
        </button>
        <button type="button" className="sa-chip sa-chip--primary sa-chip--big" onClick={onBack}>
          Fortsätt passet
        </button>
      </Replies>
    </Gate>
  )
}

// ── Handed in ────────────────────────────────────────────────────────

/** A pass handed in — by the reader or by the clock — with its answers as
 *  they stood. Samtal.tsx holds it while the host settles the hand-in;
 *  PassHanded shows it on Provpass. */
export type HandedPass = {
  /** "Hösten 2025 · Provpass 1" */
  name: string
  by: 'reader' | 'time'
  questions: readonly DrillQuestion[]
  answers: Partial<Record<string, AnswerLetter>>
  /** Null when the pass carries no flags. */
  flags: ReadonlySet<string> | null
}

/**
 * A handed-in pass, in the frame again with its doors: the answers are
 * locked and the coach says "Lämnar in …" until the host opens the result.
 * A hand-in the host refused says so — the answers as they stood beside
 * it, read-only, since nothing here sends them again — and the one way on
 * is the hub (↵). Its heading takes focus, and again when the hand-in
 * fails.
 */
export function PassHanded({
  pass,
  failed,
  width,
  live,
  onBack,
}: {
  pass: HandedPass
  failed: boolean
  width: WidthKey
  live: boolean
  /** To the hub. */
  onBack: () => void
}) {
  const headingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  useKeyMap({ Enter: onBack }, live && failed)
  // biome-ignore lint/correctness/useExhaustiveDependencies: again when the hand-in fails
  useEffect(() => {
    if (live) headingRef.current?.focus({ preventScroll: true })
  }, [live, failed])
  const total = pass.questions.length
  const answered = pass.questions.filter((x) => pass.answers[x.qid] != null).length
  return (
    <div
      className="sa-prov"
      data-width={width}
      data-testid={failed ? 'rd-prov-failed' : 'rd-prov-handing'}
    >
      <Divider>{pass.name}</Divider>
      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby={headingId}>
          {pass.by === 'time' ? <p className="sa-hello">Tiden är ute.</p> : null}
          <h1 className="sa-lead-q" id={headingId} tabIndex={-1} ref={headingRef}>
            {failed ? 'Passet kunde inte lämnas in.' : 'Lämnar in …'}
          </h1>
          {failed ? (
            <>
              <p className="sa-say" role="alert">
                Något gick fel när passet skulle lämnas in, så det finns inget resultat att visa.
              </p>
              <p className="sa-say sa-say--quiet">
                Dina svar står kvar nedan, som de var. De kan inte ändras, och passet kan inte
                lämnas in igen härifrån.
              </p>
            </>
          ) : (
            <p className="sa-say" role="status">
              {answered} av {total} frågor besvarade. Resultatet öppnas när det är klart.
            </p>
          )}
        </Coach>
        {failed ? (
          <Replies>
            <button
              type="button"
              className="sa-chip sa-chip--primary sa-chip--big"
              onClick={onBack}
            >
              Till Provpass
              <Kbd>↵</Kbd>
            </button>
          </Replies>
        ) : null}
      </div>
      {failed ? (
        <div className="sa-later">
          <Divider quiet>Dina svar</Divider>
          <div className="sa-cards">
            <AnswerRecord pass={pass} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** A refused pass's answers as they stood: every question by section with
 *  its letter and its flag, as the overview showed them — a record, with
 *  nothing to press. */
function AnswerRecord({ pass }: { pass: HandedPass }) {
  const id = useId()
  const { questions, answers, flags } = pass
  const answered = questions.filter((x) => answers[x.qid] != null).length
  const marked = flags ? questions.filter((x) => flags.has(x.qid)).length : 0
  return (
    <section
      className="sa-card sa-overview sa-overview--record"
      aria-labelledby={id}
      data-testid="rd-prov-record"
    >
      <header className="sa-card-head">
        <h2 id={id}>Svarsöversikt</h2>
        <span>
          {answered} av {questions.length} besvarade
          {marked ? ` · ${marked} markerade` : null}
        </span>
      </header>
      {runsOf(questions).map((run) => (
        <div className="sa-overview-run" key={run.start}>
          <h3 className="sa-overview-h">
            {run.section}{' '}
            <span>
              {run.start + 1}–{run.end}
            </span>
          </h3>
          <ol className="sa-cells">
            {questions.slice(run.start, run.end).map((x, k) => {
              const n = run.start + k + 1
              const letter = answers[x.qid] ?? null
              const flagged = flags?.has(x.qid) ?? false
              const said = [
                `Fråga ${n}`,
                x.section,
                letter ? `svar ${letter}` : 'obesvarad',
                flagged ? 'markerad' : null,
              ]
                .filter(Boolean)
                .join(', ')
              return (
                <li
                  key={x.qid}
                  className="sa-cell sa-cell--still"
                  data-answered={String(letter != null)}
                  data-flagged={flagged ? 'true' : undefined}
                >
                  <span className="sa-sr">{said}</span>
                  <span className="sa-cell-n" aria-hidden>
                    {n}
                  </span>
                  <span className="sa-cell-l" aria-hidden>
                    {letter ?? ''}
                  </span>
                  {flagged ? (
                    <Flag className="sa-cell-flag" size={11} strokeWidth={2} aria-hidden />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </section>
  )
}

/** "Magasinet i Hökaryd: en handbok …" → the title and its subtitle. */
function splitTitle(title: string): [string, string | null] {
  const cut = title.indexOf(': ')
  return cut === -1 ? [title, null] : [title.slice(0, cut), title.slice(cut + 2)]
}

/** A passage as the pass's document: ¶ numbers in its margin, the
 *  ÖVNINGSTEXT badge and "Om texten" for a practice text, English marked as
 *  English. Nothing points into it during a pass. Where it scrolls on its
 *  own (the desktop), it is a stop for the keyboard, which scrolls it. */
function PassPassage({ q, scrolls }: { q: DrillQuestion; scrolls: boolean }) {
  const { data } = useDirectionData()
  const p = q.passage
  const [note, setNote] = useState(false)
  const titleId = useId()
  const noteId = useId()
  if (!p) return null
  const lang = p.lang === 'en' ? 'en' : undefined
  const [title, subtitle] = p.title ? splitTitle(p.title) : [q.source.label, null]
  return (
    <article
      className="sa-doc sa-pass-doc"
      aria-labelledby={titleId}
      data-testid="rd-prov-passage"
      tabIndex={scrolls ? 0 : undefined}
    >
      <header className="sa-doc-head">
        <span className="sa-doc-tag">
          <span>{q.section}</span>
          {p.synthetic ? <span className="sa-badge">{data.copy.ovningstextBadge}</span> : null}
        </span>
        {p.synthetic ? (
          <span className="sa-doc-tools">
            <button
              type="button"
              className="sa-tool"
              aria-expanded={note}
              aria-controls={noteId}
              onClick={() => setNote(!note)}
            >
              <Info size={15} strokeWidth={1.75} aria-hidden />
              Om texten
            </button>
          </span>
        ) : null}
      </header>
      <div className="sa-doc-inner">
        {p.synthetic ? (
          <p className="sa-note" id={noteId} hidden={!note}>
            {data.copy.ovningstextNote}
          </p>
        ) : null}
        <h2 className="sa-doc-title" id={titleId} lang={p.title ? lang : undefined}>
          {title}
          {subtitle ? <span>{subtitle}</span> : null}
        </h2>
        <div className="sa-pbody" lang={lang}>
          {p.paragraphs.map((text, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a passage's paragraphs keep their order
            <p key={i} className="sa-para" data-n={i + 1}>
              <span className="sa-pnum sa-pnum--still" aria-hidden>
                {i + 1}
              </span>
              {text}
            </p>
          ))}
          {p.byline ? <p className="sa-byline">{p.byline}</p> : null}
        </div>
      </div>
    </article>
  )
}

/** A DTK page as the pass's document: zoom, rotate and enlarge in its head
 *  (the enlarged page is the phone's zoom), the page panning in its own
 *  region, its place among the questions on it. Each mounted page is a load
 *  of its own; one that fails says so, with a real retry. */
function PassPage({
  figure,
  view,
  status,
  attempt,
  phone,
  run,
  onZoom,
  onRotate,
  onInspect,
  onStatus,
  onRetry,
}: {
  figure: DrillFigure
  view: PageView
  status: FigureStatus
  attempt: number
  phone: boolean
  run: { at: number; of: number } | null
  onZoom: (dir: 1 | -1) => void
  onRotate: () => void
  /** Opens the enlarged page; `from` is the control focus goes back to. */
  onInspect: (from: HTMLElement) => void
  onStatus: (s: FigureStatus) => void
  onRetry: () => void
}) {
  const titleId = useId()
  const zoom = FIGURE_ZOOMS[view.zoom]
  const body = (
    <FigurePage
      figure={figure}
      rotation={view.rotation}
      width={phone ? '100%' : `${zoom * 100}%`}
      status={status}
      attempt={attempt}
      onStatus={onStatus}
      fresh
    />
  )
  return (
    <article
      className="sa-doc sa-figdoc sa-pass-doc"
      aria-labelledby={titleId}
      data-testid="rd-prov-figure"
    >
      <header className="sa-doc-head">
        <span className="sa-doc-tag">
          <span>DTK</span>
          <span className="sa-doc-name" id={titleId}>
            Underlag
          </span>
        </span>
        <fieldset className="sa-doc-tools" aria-label="Underlagets verktyg">
          {phone ? null : (
            <span className="sa-zoomctl">
              <button
                type="button"
                className="sa-tool sa-tool--icon"
                aria-label="Zooma ut"
                disabled={view.zoom === 0}
                onClick={() => onZoom(-1)}
              >
                <Minus size={16} strokeWidth={1.75} aria-hidden />
              </button>
              <span className="sa-zoom-n" aria-live="polite">
                {pct(zoom)}
              </span>
              <button
                type="button"
                className="sa-tool sa-tool--icon"
                aria-label="Zooma in"
                disabled={view.zoom === FIGURE_ZOOMS.length - 1}
                onClick={() => onZoom(1)}
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </span>
          )}
          <button
            type="button"
            className="sa-tool"
            aria-label="Rotera underlaget 90 grader"
            onClick={onRotate}
          >
            <RotateCw size={15} strokeWidth={1.75} aria-hidden />
            Rotera
          </button>
          <button
            type="button"
            className="sa-tool"
            aria-haspopup="dialog"
            disabled={status !== 'ready'}
            onClick={(e) => onInspect(e.currentTarget)}
          >
            <Maximize2 size={15} strokeWidth={1.75} aria-hidden />
            Förstora figur
          </button>
        </fieldset>
      </header>
      {run ? (
        <p className="sa-fig-run">
          Fråga {run.at} av {run.of} till samma underlag
        </p>
      ) : null}
      {phone ? (
        <div className="sa-fig-frame">{body}</div>
      ) : (
        <FigurePan className="sa-fig-scroll" label="Underlaget" onZoomKey={onZoom}>
          {body}
        </FigurePan>
      )}
      {status === 'error' ? (
        <div className="sa-fig-error" role="alert">
          <p>Underlaget gick inte att ladda.</p>
          <button type="button" className="sa-chip" onClick={onRetry}>
            Försök igen
          </button>
        </div>
      ) : null}
    </article>
  )
}

// ── The result ───────────────────────────────────────────────────────

export function SamtalResult({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const r = data.provpass.result
  const leadId = useId()
  const nominal = data.provpass.hub.halves.find((h) => h.half === r.half)?.questions ?? NOMINAL
  const trap = r.trap ?? null
  // The one way on: Öva — or practice on the trap the result names.
  const primary = trap
    ? {
        label: `Öva på fällan i ${trap.section}`,
        onClick: () =>
          actions.startDrill({
            kind: 'framework',
            frameworkId: trap.frameworkId,
            section: trap.section,
          }),
      }
    : { label: 'Till Öva', onClick: () => actions.go('ova') }
  useKeyMap({ Enter: primary.onClick }, live)

  const where = [r.sitting, r.pass].filter(Boolean).join(' · ')
  const short = shortLine(r.presented, nominal)
  const blank = Math.max(0, r.presented - r.answered)
  const kind = r.mode === 'authentic' ? 'riktigt pass' : 'genererat pass'

  return (
    <div className="sa-res" data-width={width}>
      <Divider>{where || `${HALF[r.half].label} · ${kind}`}</Divider>
      <div className="sa-thread">
        <Coach
          as="section"
          kind="sa-turn--lead"
          aria-labelledby={leadId}
          data-testid="rd-prov-result"
        >
          <p className="sa-hello">
            {HALF[r.half].label} · {kind}
          </p>
          <h1 className="sa-lead-q" id={leadId} tabIndex={-1}>
            Klart. {r.correct}&nbsp;av&nbsp;{r.presented} rätt.
          </h1>
          {short || blank ? (
            <p className="sa-say sa-res-counts">
              {short}
              {short && blank ? ' ' : null}
              {blank
                ? blank === 1
                  ? 'En fråga lämnades obesvarad.'
                  : `${blank} frågor lämnades obesvarade.`
                : null}
            </p>
          ) : null}
          <ResultScore r={r} />
        </Coach>
        <Replies>
          <button
            type="button"
            className="sa-chip sa-chip--big"
            onClick={() => actions.go('provpass')}
          >
            Till Provpass
          </button>
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
        <Divider quiet>Genomgång</Divider>
        <div className="sa-cards">
          <ResultSections
            r={r}
            phone={width === 'phone'}
            minutes={data.provpass.hub.halves.find((h) => h.half === r.half)?.minutes ?? null}
          />
          {trap ? (
            <Coach as="section" kind="sa-turn--line" aria-labelledby={`${leadId}-trap`}>
              <h2 className="sa-line-h" id={`${leadId}-trap`}>
                Samma fälla
              </h2>
              <span className="sa-res-trap">
                {sentence(words(trap.count))} av dina missar föll på samma sätt
                {trap.headline ? `: ${trap.headline}` : '.'}
              </span>
            </Coach>
          ) : null}
          <p className="sa-res-facts">
            <span>
              Sett tidigare: {r.seenBefore} av {r.presented} frågor
            </span>
            <span>Tid: {fmtDuration(r.durationSeconds)}</span>
          </p>
          <ResultHistory r={r} phone={width === 'phone'} onOpen={actions.openProvResult} />
        </div>
      </div>
    </div>
  )
}

/** The score, attached to the coach's turn, and how it was made — said
 *  beside it, never behind a hover. */
function ResultScore({ r }: { r: ProvResultView }) {
  const { value, derived, label } = r.score
  const half = HALF[r.half].adj
  const basis =
    derived === 'official-derived'
      ? `Härlett ur UHR:s normeringstabell för ${r.sitting ?? 'provtillfället'}. UHR normerar hela den ${half} delen, 80 frågor, och ett pass har ingen egen tabell. Därför räknas dina ${r.correct} av ${r.presented} om till 80 frågor och läses av i tabellen – en skattning, inte ett officiellt resultat.`
      : 'Det här passet har ingen normeringstabell, så poängen är en linjär skattning av andelen rätt – en fingervisning, inte UHR-normerad.'
  return (
    <div className="sa-attach sa-attach--score" data-testid="rd-prov-score">
      {value != null ? (
        <>
          <p className="sa-res-score">
            <span className="sa-score-n">{fmtScore2(value)}</span>{' '}
            <span className="sa-score-of">av 2,0 · {label}</span>
          </p>
          <p className="sa-res-basis">{basis}</p>
        </>
      ) : (
        <p className="sa-res-basis">Ingen poäng: inga frågor kunde rättas i passet.</p>
      )}
    </div>
  )
}

/** Each section: right answers of those shown, its time and its share of
 *  the 55 minutes. A table on the desktop; labelled rows on the phone. */
function ResultSections({
  r,
  phone,
  minutes,
}: {
  r: ProvResultView
  phone: boolean
  /** The pass's minutes, when the hub knows them. */
  minutes: number | null
}) {
  const id = useId()
  const over = (s: ProvResultView['sections'][number]) => s.timeSeconds - s.quotaSeconds
  return (
    <section className="sa-card sa-card--sections" aria-labelledby={id}>
      <header className="sa-card-head">
        <h2 id={id}>Delprov för delprov</h2>
        <span>
          {minutes != null ? `Tidsandel: delprovets del av ${minutes} minuter` : 'Rätt och tid'}
        </span>
      </header>
      {phone ? (
        <ul className="sa-res-rows">
          {r.sections.map((s) => (
            <li key={s.section} data-testid={`rd-prov-section-${slug(s.section)}`}>
              <span className="sa-res-sec">
                {s.section}
                <span className="sa-sr">, {sectionLongLabel(s.section)}</span>
              </span>
              <dl className="sa-res-vals">
                <div>
                  <dt>Rätt</dt>
                  <dd>
                    {s.correct} av {s.presented}
                  </dd>
                </div>
                <div>
                  <dt>Tid</dt>
                  <dd>
                    {fmtDuration(s.timeSeconds)}
                    {over(s) > 0 ? (
                      <span className="sa-res-over"> · {fmtDuration(over(s))} över</span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt>Tidsandel</dt>
                  <dd>{fmtDuration(s.quotaSeconds)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      ) : (
        <table className="sa-res-table">
          <caption className="sa-sr">Rätt svar och tid per delprov</caption>
          <thead>
            <tr>
              <th scope="col">Delprov</th>
              <th scope="col">Rätt</th>
              <th scope="col">Tid</th>
              <th scope="col">Tidsandel</th>
            </tr>
          </thead>
          <tbody>
            {r.sections.map((s) => (
              <tr key={s.section} data-testid={`rd-prov-section-${slug(s.section)}`}>
                <th scope="row">
                  <span className="sa-res-sec">{s.section}</span>{' '}
                  <span className="sa-res-name">{sectionLongLabel(s.section)}</span>
                </th>
                <td>
                  {s.correct} av {s.presented}
                </td>
                <td>
                  {fmtDuration(s.timeSeconds)}
                  {over(s) > 0 ? (
                    <span className="sa-res-over"> · {fmtDuration(over(s))} över</span>
                  ) : null}
                </td>
                <td>{fmtDuration(s.quotaSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

/** The earlier passes of the same half and kind, newest first, as raw
 *  counts (their scores were made on bases this list cannot show). Each
 *  opens its result. On the phone a fold under the report. */
function ResultHistory({
  r,
  phone,
  onOpen,
}: {
  r: ProvResultView
  phone: boolean
  onOpen: (id: string) => void
}) {
  const id = useId()
  const listId = useId()
  const [open, setOpen] = useState(!phone)
  const title = `Tidigare ${HALF[r.half].adj} pass, ${r.mode === 'authentic' ? 'riktiga' : 'genererade'}`
  const list = (
    <ol className="sa-res-history" id={listId} hidden={!open}>
      {r.history.map((h, i) => (
        <li key={h.id}>
          <button
            type="button"
            className="sa-res-history-row"
            data-testid={`rd-prov-history-item-${i + 1}`}
            onClick={() => onOpen(h.id)}
          >
            <span className="sa-res-history-when">{h.when}</span>{' '}
            <span className="sa-res-history-name">
              {[h.sitting, h.pass].filter(Boolean).join(' · ') || HALF[h.half].label}
            </span>{' '}
            <span className="sa-res-history-n">
              {h.correct} av {h.presented} rätt
            </span>
            <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </li>
      ))}
    </ol>
  )
  return (
    <section
      className="sa-card sa-card--history"
      aria-labelledby={id}
      data-testid="rd-prov-history"
    >
      <header className="sa-card-head">
        <h2 id={id}>{title}</h2>
        <span>{count(r.history.length, 'pass', 'pass')}</span>
      </header>
      {r.history.length === 0 ? (
        <p className="sa-queue-none">Inga tidigare pass av samma sort ännu.</p>
      ) : phone ? (
        <>
          <button
            type="button"
            className="sa-queue-fold"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((v) => !v)}
          >
            <span>{open ? 'Dölj tidigare pass' : 'Visa tidigare pass'}</span>
            <span className="sa-queue-fold-n">{r.history.length}</span>
          </button>
          {list}
        </>
      ) : (
        list
      )}
    </section>
  )
}
