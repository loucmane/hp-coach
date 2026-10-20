import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Flag,
  LampDesk,
  Timer,
  X,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  type DirectionProps,
  fmtClock,
  fmtScore,
  isForeignKey,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillQuestion,
  Half,
  ProvPassOptionView,
  ProvResultSummaryView,
  ProvRunningView,
} from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { AnswerLetter, Section } from '@/data/questions'
import {
  Account,
  capitalize,
  count,
  FigurePane,
  FigureViewer,
  type FramePage,
  FrameShell,
  fmtInt,
  Gate,
  halfName,
  midLine,
  type OpenPage,
  PassageParagraphs,
  passId,
  problemParts,
  QuantProblem,
  sectionId,
  useFigureGate,
  useFigureView,
  useGate,
} from './LjuskaglaParts'

// ── Small words ──────────────────────────────────────────────────────

/** [3, 5, 6, 7, 39, 40] → "3, 5–7, 39 och 40": question numbers as a
 *  reader says them, runs of three or more folded. */
function numberList(numbers: number[]): string {
  const parts: string[] = []
  for (let i = 0; i < numbers.length; ) {
    let j = i
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++
    if (j - i >= 2) parts.push(`${numbers[i]}–${numbers[j]}`)
    else for (let k = i; k <= j; k++) parts.push(String(numbers[k]))
    i = j + 1
  }
  return parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} och ${parts[parts.length - 1]}`
    : (parts[0] ?? '')
}

/** 'kvant' → "ett kvantitativt pass". */
function passOfHalf(half: Half): string {
  return half === 'verbal' ? 'ett verbalt pass' : 'ett kvantitativt pass'
}

/** 75 → "1 min", 40 → "40 s": how far a section ran past its share. */
function overBy(seconds: number): string {
  return seconds < 60 ? `${seconds} s` : `${Math.round(seconds / 60)} min`
}

/** The pass's sections in printed order, from its own questions. */
function runsOf(questions: DrillQuestion[]) {
  const runs: { section: Section; start: number; end: number }[] = []
  questions.forEach((q, i) => {
    const last = runs[runs.length - 1]
    if (last && last.section === q.section) last.end = i + 1
    else runs.push({ section: q.section, start: i, end: i + 1 })
  })
  return runs
}

function resultName(r: Pick<ProvResultSummaryView, 'sitting' | 'pass'>): string {
  return `${r.sitting ?? 'Genererat pass'}${r.pass ? ` · ${r.pass}` : ''}`
}

// ── 9 · The hub ──────────────────────────────────────────────────────

/**
 * Provpass: the halves above one lit pass — the suggested one, the least
 * seen of its half, until the reader picks another from the register
 * below — with what it holds, what the reader has seen of it and the one
 * way in, which asks first. The rhythm, earlier results and the rules sit
 * quietly in the shade beside it. After a start the lamp waits until the
 * host supplies the pass's questions; the clock starts only then.
 */
export function LjuskaglaProvHub({
  requested,
  aborted,
  onAskStart,
  onCancelWait,
  onOpen,
}: {
  requested: string | null
  aborted: boolean
  onAskStart: (pass: ProvPassOptionView) => void
  onCancelWait: () => void
  onOpen: OpenPage
}) {
  const { data, actions } = useDirectionData()
  const { hub, result } = data.provpass
  const [half, setHalf] = useState<Half>(hub.half)
  const [picked, setPicked] = useState<string | null>(null)
  const lampId = useId()
  const registerId = useId()
  const waitRef = useRef<HTMLHeadingElement>(null)
  const noticeRef = useRef<HTMLParagraphElement>(null)
  const passes = hub.passes.filter((p) => p.half === half)
  const chosen =
    passes.find((p) => p.id === picked) ?? passes.find((p) => p.suggested) ?? passes[0] ?? null
  const halfView = hub.halves.find((h) => h.half === half)
  const nominal = halfView?.questions ?? null
  const waiting = requested ? (hub.passes.find((p) => p.id === requested) ?? null) : null
  const other = hub.halves.find((h) => h.half !== half && hub.passes.some((p) => p.half === h.half))
  const rhythm = hub.prescription
  const pickHalf = (next: Half) => {
    setHalf(next)
    setPicked(null)
  }
  // A result the frame can show itself is opened here too; any other is
  // only asked for (the host knows it, the frame does not).
  const openResult = (id: string) =>
    id === result.id
      ? onOpen('resultat', () => actions.openProvResult(id))
      : actions.openProvResult(id)

  // The wait takes focus from the confirmation that started it, and the
  // note after an abandoned pass from the pass that is gone.
  useEffect(() => {
    if (requested) waitRef.current?.focus({ preventScroll: true })
    else if (aborted) noticeRef.current?.focus({ preventScroll: true })
  }, [requested, aborted])

  let lamp: ReactNode
  if (requested) {
    lamp = (
      <>
        <div className="lj-resume-top">
          <span className="lj-eyebrow">Provpasset förbereds</span>
          <LampDesk size={28} strokeWidth={1.3} aria-hidden />
        </div>
        <h2 id={lampId} ref={waitRef} tabIndex={-1}>
          {waiting ? `${waiting.sitting} · ${waiting.pass}` : 'Ditt provpass'}
        </h2>
        <p className="lj-hub-lamp-meta" role="status">
          Frågorna hämtas. Klockan startar först när de finns på plats.
        </p>
        <button className="lj-text-button" type="button" onClick={onCancelWait}>
          <ArrowLeft size={16} aria-hidden /> Tillbaka till provpassen
        </button>
      </>
    )
  } else if (chosen) {
    const partial = nominal != null && chosen.presented < nominal
    lamp = (
      <>
        <div className="lj-resume-top">
          <span className="lj-eyebrow">
            {chosen.suggested ? 'Förslag · det pass du sett minst av' : 'Valt provpass'}
          </span>
          <LampDesk size={28} strokeWidth={1.3} aria-hidden />
        </div>
        <h2 id={lampId}>
          {chosen.sitting}
          <span className="lj-prov-pass-name">{chosen.pass}</span>
        </h2>
        <p className="lj-hub-lamp-meta">
          {halfName(half)} halva · {chosen.presented} frågor · {halfView?.minutes ?? 55} minuter
        </p>
        {partial && (
          <p className="lj-prov-partial">
            <strong>
              {chosen.presented} av {nominal} frågor tillgängliga.
            </strong>{' '}
            Passet rättas av dem som finns.
          </p>
        )}
        <dl className="lj-prov-facts">
          <div>
            <dt>Sett förut</dt>
            <dd>
              {chosen.seenBefore} av {chosen.presented} frågor
            </dd>
          </div>
          {halfView && (
            <div>
              <dt>Delprov</dt>
              <dd>{halfView.sections.map((s) => `${s.section} ${s.count}`).join(' · ')}</dd>
            </div>
          )}
        </dl>
        <button
          className="lj-primary"
          type="button"
          data-testid="rd-prov-start"
          onClick={() => onAskStart(chosen)}
        >
          <span>Starta provpass</span>
          <ArrowRight size={20} aria-hidden />
        </button>
        <p className="lj-resume-foot">
          Du får läsa villkoren först. Klockan startar när du bekräftar.
        </p>
      </>
    )
  } else {
    lamp = (
      <>
        <div className="lj-resume-top">
          <span className="lj-eyebrow">{halfName(half)} halva</span>
          <LampDesk size={28} strokeWidth={1.3} aria-hidden />
        </div>
        <h2 id={lampId}>Inga riktiga pass än</h2>
        <p className="lj-hub-lamp-meta">
          Frågebanken har inget riktigt provpass för den här halvan just nu.
        </p>
        {other ? (
          <button className="lj-primary" type="button" onClick={() => pickHalf(other.half)}>
            <span>Till {halfName(other.half).toLocaleLowerCase('sv-SE')} halva</span>
            <ArrowRight size={20} aria-hidden />
          </button>
        ) : (
          <button
            className="lj-primary"
            type="button"
            onClick={() => onOpen('ova', () => actions.go('ova'))}
          >
            <span>Till Öva</span>
            <ArrowRight size={20} aria-hidden />
          </button>
        )}
      </>
    )
  }

  return (
    <div className="lj-page lj-prov">
      <header className="lj-page-head">
        <p className="lj-eyebrow">Provpass</p>
        <h1>Välj ditt provpass.</h1>
      </header>
      <fieldset className="lj-filters lj-prov-halves" aria-label="Provhalva">
        {hub.halves.map((h) => (
          <button
            type="button"
            key={h.half}
            data-testid={`rd-prov-half-${h.half}`}
            aria-pressed={half === h.half}
            onClick={() => pickHalf(h.half)}
          >
            {h.label}{' '}
            <span>
              {h.questions} frågor · {h.minutes} min
            </span>
          </button>
        ))}
      </fieldset>
      {aborted && !requested && (
        <p className="lj-prov-notice" role="status" ref={noticeRef} tabIndex={-1}>
          Provpasset avbröts. Det räknas inte, och inget resultat sparades.
        </p>
      )}
      <div className="lj-hub-grid">
        <section className="lj-resume lj-hub-lamp lj-prov-lamp" aria-labelledby={lampId}>
          {lamp}
        </section>
        <aside className="lj-hub-door lj-shade lj-prov-rhythm" aria-label="Din rytm">
          <p className="lj-eyebrow">Din rytm</p>
          {rhythm && (
            <p className="lj-door-count">
              {rhythm.due
                ? `Dags för ${passOfHalf(rhythm.half)}.`
                : `Nästa: ${passOfHalf(rhythm.half)} om ${count(rhythm.daysUntilNext, 'dag', 'dagar')}.`}
            </p>
          )}
          {rhythm?.daysSinceLast != null && (
            <p>Förra passet gjorde du för {count(rhythm.daysSinceLast, 'dag', 'dagar')} sedan.</p>
          )}
          {hub.exposure.total > 0 && (
            <p>
              Du har sett {fmtInt(hub.exposure.seen)} av {fmtInt(hub.exposure.total)} frågor i de
              riktiga passen.
            </p>
          )}
        </aside>
        {passes.length > 0 && (
          <section className="lj-hub-rows lj-shade" aria-labelledby={registerId}>
            <div className="lj-section-head">
              <h2 id={registerId}>Riktiga pass · {halfName(half)}</h2>
              <span>Minst sedda först</span>
            </div>
            <ol className="lj-rows lj-pass-rows">
              {passes.map((p) => {
                const on = !requested && p.id === chosen?.id
                const partial = nominal != null && p.presented < nominal
                return (
                  <li key={p.id} data-chosen={String(on)}>
                    <button
                      type="button"
                      className="lj-pass-row"
                      data-testid={`rd-prov-pass-${passId(p.id)}`}
                      aria-pressed={on}
                      onClick={() => setPicked(p.id)}
                    >
                      <span className="lj-pass-row-main">
                        <strong>
                          {p.sitting} · {p.pass}
                        </strong>
                        <span>
                          {[
                            p.suggested ? 'Förslag' : null,
                            partial ? `${p.presented} av ${nominal} frågor` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || `${p.presented} frågor`}
                        </span>
                      </span>
                      <span className="lj-pass-row-seen">
                        sett {p.seenBefore} av {p.presented}
                      </span>
                      <ArrowRight size={18} aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )}
        <aside className="lj-hub-aside lj-shade">
          <section className="lj-hub-traps">
            <h2>Tidigare resultat</h2>
            {hub.results.length > 0 ? (
              <ul>
                {hub.results.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="lj-trap-row" onClick={() => openResult(r.id)}>
                      <span className="lj-trap-pattern">
                        {r.correct} av {r.presented} rätt
                        {r.score != null ? ` · ${fmtScore(r.score)}` : ''}
                      </span>
                      <span>
                        {resultName(r)} · {halfName(r.half)} · {midLine(r.when)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lj-hub-note">Inga provpass än. Ditt första resultat hamnar här.</p>
            )}
          </section>
          <section className="lj-prov-rules">
            <h2>Villkoren</h2>
            <ul>
              {hub.rules.map((rule) => (
                <li key={rule}>{capitalize(rule)}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

/** The start's confirmation: the chosen pass, what it holds and the rules,
 *  and "Starta nu" — the clock starts only on that. */
export function PassConfirmation({
  pass,
  onAccept,
  onCancel,
}: {
  pass: ProvPassOptionView
  onAccept: () => void
  onCancel: () => void
}) {
  const { data } = useDirectionData()
  const { hub } = data.provpass
  const halfView = hub.halves.find((h) => h.half === pass.half)
  const nominal = halfView?.questions ?? null
  return (
    <Gate
      eyebrow="Starta provpass"
      title={`${pass.sitting} · ${pass.pass}`}
      accept="Starta nu"
      cancel="Tillbaka"
      onAccept={onAccept}
      onCancel={onCancel}
    >
      <p className="lj-gate-lead">
        {halfName(pass.half)} halva · {pass.presented} frågor · {halfView?.minutes ?? 55} minuter
      </p>
      {nominal != null && pass.presented < nominal && (
        <p>
          <strong>
            {pass.presented} av {nominal} frågor tillgängliga.
          </strong>{' '}
          Passet rättas av dem som finns.
        </p>
      )}
      <p>
        Du har sett {pass.seenBefore} av {pass.presented} frågor förut.
      </p>
      <h3>Villkoren</h3>
      <ul className="lj-gate-rules">
        {hub.rules.map((rule) => (
          <li key={rule}>{capitalize(rule)}</li>
        ))}
      </ul>
    </Gate>
  )
}

// ── 9 · The running pass ─────────────────────────────────────────────

/** A running pass, then its one hand-in: handed in to a host that has not
 *  moved on to the result, or failed. */
type Settle = 'active' | 'handed-in' | 'failed'

/** Focus targets whose ←/→ are their own: a control (it is pressed, or it
 *  moves among its tabs, options or values) and a panning page. A text
 *  field's arrows are the kit's foreign keys. */
const OWN_ARROWS = [
  'button',
  'a[href]',
  'summary',
  '[data-lj-pan]',
  ...[
    'button',
    'link',
    'checkbox',
    'switch',
    'radio',
    'tab',
    'option',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'spinbutton',
    'combobox',
    'scrollbar',
    'gridcell',
    'treeitem',
  ].map((role) => `[role="${role}"]`),
].join(', ')

/** Whether the focused element scrolls its own content (the page itself
 *  aside): then the arrows scroll it, as a browser's arrows do. */
function scrollsItself(el: Element): boolean {
  if (el === document.body || el === document.documentElement) return false
  const style = getComputedStyle(el)
  return /auto|scroll/.test(`${style.overflowX} ${style.overflowY}`)
}

/** Whether ←/→ belong where they are pressed — a control, a panning page,
 *  a scroll region that has focus itself — rather than to the questions. */
function keepsArrows(target: EventTarget | null): boolean {
  return target instanceof Element && (target.closest(OWN_ARROWS) != null || scrollsItself(target))
}

/** "1 fråga är obesvarad", "2 frågor är obesvarade". */
function blanksLine(n: number): string {
  return n === 1 ? '1 fråga är obesvarad' : `${n} frågor är obesvarade`
}

/**
 * A running pass in focus mode. The head keeps Avbryt provpass, the place,
 * a steady countdown and a quiet Lämna in; under it the answer map, where
 * the warm line marks the question on screen. The question takes the same
 * surfaces as practice — a lit problem, a page on its warm edge or the
 * text in the reading room — without verdicts or explanations: choosing
 * an answer only records it, and it can change until time is up.
 *
 * The clock is decided once, when the pass opens: a deadline from the
 * remaining seconds it brings. It ticks locally; a host whose own clock
 * reaches zero first hands in just the same, exactly once. A pass that was
 * already out of time on entry shows that, never a result. Keys: the
 * question's letters choose, ←/→ change question (a control, a panning
 * page and a scroll region in focus keep their own arrows), and the
 * switcher's digits never leave a running pass.
 *
 * A hand-in ends the attempt, whether it fails or not: there is no second
 * one (kit v2 cannot tell a lost answer from a failed hand-in, so it could
 * count twice). A host that shows the result takes the pass away. One that
 * stays here, or a hand-in that fails, leaves the answers read-only in the
 * normal shell with its doors, a way back to the hub, and the switcher's
 * keys returned.
 */
export function LjuskaglaProvRunner({
  run,
  onLeave,
  ...props
}: DirectionProps & {
  run: ProvRunningView
  /** The pass is gone: abandoned, or ended (for `to`, when a door was taken). */
  onLeave: (why: 'aborted' | 'ended', to?: FramePage) => void
}) {
  const { data, actions } = useDirectionData()
  const { live } = props
  const phone = props.width === 'phone'
  const questions = run.questions
  const total = questions.length

  // The place: kept inside the pass even when it shrinks.
  const [position, setPosition] = useState(run.current)
  const index = Math.min(Math.max(0, position), Math.max(0, total - 1))
  if (position !== index) setPosition(index)
  const q: DrillQuestion | undefined = questions[index]

  // Answers and marks: what the pass brought, changed here.
  const [picks, setPicks] = useState<Partial<Record<string, AnswerLetter>>>({})
  const answers: Partial<Record<string, AnswerLetter>> = { ...run.answers, ...picks }
  const [flagEdits, setFlagEdits] = useState<Record<string, boolean>>({})
  const hasFlags = run.flags != null
  const isFlagged = (qid: string) => flagEdits[qid] ?? run.flags?.includes(qid) ?? false

  // The clock, decided once.
  const [deadline] = useState(() => Date.now() + run.remainingSeconds * 1000)
  const [expiredOnEntry] = useState(() => run.remainingSeconds <= 0)
  const [left, setLeft] = useState(() => Math.max(0, run.remainingSeconds))
  const remaining = Math.min(left, Math.max(0, run.remainingSeconds))
  const [settle, setSettle] = useState<Settle>('active')
  const [timeUp, setTimeUp] = useState(false)
  const settled = useRef(false)

  const gate = useGate<'submit' | 'abort'>()
  const [viewer, setViewer] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [lit, setLit] = useState<number | null>(null)
  const [note, setNote] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const statusRef = useRef<HTMLHeadingElement>(null)
  const enlargeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)
  const mapId = useId()
  const gridId = useId()
  const sheetId = useId()
  const noteId = useId()
  const figures = useFigureGate(q)
  const figureView = useFigureView(q?.figure)
  const sheet = useSheet({ phase: 'question', index })

  const active = live && !expiredOnEntry && settle === 'active'
  // Handed in or failed, the attempt has ended: the answers lock and the
  // pass gives up its keys.
  const locked = settle !== 'active'
  const failed = settle === 'failed'
  const covered = gate.gate != null || viewer

  const closeGate = gate.close
  const submit = useCallback(
    (why: 'hand-in' | 'time') => {
      if (settled.current) return
      settled.current = true
      if (why === 'time') {
        setTimeUp(true)
        setLeft(0)
      }
      closeGate()
      setViewer(false)
      // One attempt, whatever it comes to: no second hand-in, by the reader
      // or the clock (a lost answer would make it count twice). A host that
      // shows the result takes the pass away; one that stays leaves it here.
      try {
        actions.submitProvpass()
        setSettle('handed-in')
      } catch {
        setSettle('failed')
      }
    },
    [actions, closeGate],
  )
  const submitRef = useRef(submit)
  submitRef.current = submit

  // The local clock.
  useEffect(() => {
    if (!active) return
    const tick = () => {
      const s = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) submitRef.current('time')
    }
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [active, deadline])
  // A host's own clock may reach zero first: the same single hand-in.
  useEffect(() => {
    if (active && run.remainingSeconds <= 0) submitRef.current('time')
  }, [active, run.remainingSeconds])

  /** Whether the reader may still act. A timer can be held back in a
   *  background tab, so the deadline is checked at the moment of input. */
  const canAct = () => {
    if (settled.current || settle !== 'active' || expiredOnEntry) return false
    if (live && Date.now() >= deadline) {
      submit('time')
      return false
    }
    return true
  }
  const goTo = (i: number) => {
    if (!canAct() || total === 0) return
    setPosition(Math.min(Math.max(0, i), total - 1))
    setMapOpen(false)
  }
  const pick = (letter: AnswerLetter) => {
    if (!q || figures.blocked || !q.options?.some((o) => o.letter === letter)) return
    if (!canAct()) return
    setPicks((old) => ({ ...old, [q.qid]: letter }))
  }
  const toggleFlag = () => {
    if (q && canAct()) setFlagEdits((old) => ({ ...old, [q.qid]: !isFlagged(q.qid) }))
  }
  const ask = (which: 'submit' | 'abort') => {
    if (canAct()) gate.open(which)
  }
  const abort = () => {
    if (!canAct()) return
    gate.close()
    onLeave('aborted')
  }
  const leave = () => {
    actions.go('provpass')
    onLeave('ended')
  }
  /** A door taken from a pass that has ended: the host is asked, and the
   *  frame opens the page as well, for a host that does not navigate. */
  const goDoor = (door: Destination) => {
    actions.go(door)
    onLeave('ended', door)
  }

  // A new question takes focus at its heading, with the text unlit.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new question (index) resets these
  useEffect(() => {
    setLit(null)
    setNote(false)
    if (live) heading.current?.focus({ preventScroll: true })
  }, [index])
  // A hand-in moves focus to what is happening.
  useEffect(() => {
    if (settle !== 'active') statusRef.current?.focus({ preventScroll: true })
  }, [settle])
  // Closing the enlarged figure hands focus back to Förstora figur.
  useEffect(() => {
    if (viewer || !returnFocus.current) return
    returnFocus.current = false
    enlargeRef.current?.focus()
  }, [viewer])

  // Keys, ahead of the switcher (capture). Until the attempt ends, digits
  // are held wherever focus is, so a pass never changes direction or screen
  // under the reader. ←/→ change the question, except where they already
  // mean something: on a control, a panning page or a scroll region in
  // focus. Inside the pass those keep their native arrows (its key scope
  // keeps the switcher out); outside it they are only held.
  const keys = useRef({ suspended: true, letters: [] as AnswerLetter[], step: (_: 1 | -1) => {} })
  keys.current = {
    suspended: !active || covered || accountOpen,
    letters: q?.options?.map((o) => o.letter) ?? [],
    step: (d) => goTo(index + d),
  }
  const pickRef = useRef(pick)
  pickRef.current = pick
  const holdKeys = live && !expiredOnEntry && total > 0 && !locked
  useEffect(() => {
    if (!holdKeys) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = keys.current
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        return
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (isForeignKey(e)) return
        const own = keepsArrows(e.target)
        if (own && e.target instanceof Node && root.current?.contains(e.target)) return
        e.preventDefault()
        if (!own && !k.suspended) k.step(e.key === 'ArrowRight' ? 1 : -1)
        return
      }
      if (k.suspended || e.defaultPrevented || isForeignKey(e) || e.key.length !== 1) return
      const letter = e.key.toLocaleUpperCase('sv-SE') as AnswerLetter
      if (!k.letters.includes(letter)) return
      e.preventDefault()
      pickRef.current(letter)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [holdKeys])

  if (expiredOnEntry || !q) {
    return (
      <div className="lj-drill lj-run" data-testid="rd-prov-ended">
        <div className="lj-done" role="status">
          <Timer size={32} strokeWidth={1.5} aria-hidden />
          <p className="lj-eyebrow">
            {expiredOnEntry ? 'Provpasset är avslutat' : 'Provpasset går inte att visa'}
          </p>
          <h1>{expiredOnEntry ? 'Tiden gick ut.' : 'Frågorna saknas.'}</h1>
          <p>
            {expiredOnEntry
              ? 'Passet tog slut innan du kom tillbaka. Det finns inget resultat att visa för det.'
              : 'Det här passet har inga frågor att visa. Välj ett annat pass.'}
          </p>
          <button className="lj-primary" type="button" onClick={leave}>
            <span>Till Provpass</span>
            <ArrowRight size={20} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  const answered = questions.filter((x) => answers[x.qid] != null).length
  const blanks = questions.flatMap((x, i) => (answers[x.qid] == null ? [i + 1] : []))
  const marked = hasFlags ? questions.flatMap((x, i) => (isFlagged(x.qid) ? [i + 1] : [])) : []
  const last = index === total - 1
  const choice = answers[q.qid] ?? null
  const figure = q.figure ?? null
  const passage = q.passage ?? null
  const shape = passage ? 'passage' : figure?.kind === 'raster' ? 'figure' : 'problem'
  const sheetMode = phone && shape !== 'problem'
  const sheetVisible = !sheetMode || sheet.state !== 'peek'
  const parts = problemParts(q)
  const lead = parts.kind === 'nog' && parts.lead ? parts.lead : 'Välj svar'
  const letters = q.options?.map((o) => o.letter) ?? []
  const range = letters.length ? `${letters[0]}–${letters[letters.length - 1]}` : ''
  const sameFigure = figure ? questions.filter((x) => x.figure?.src === figure.src) : []
  const block =
    sameFigure.length > 1 ? { n: sameFigure.indexOf(q) + 1, total: sameFigure.length } : null
  const urgent = remaining <= 300
  const optionFailed = (q.options ?? []).some(
    (o) => o.figure && figures.status(`option-${o.letter}`, o.figure.src) === 'failed',
  )
  const figureFailed = figure ? figures.status('figure', figure.src) === 'failed' : false

  const head = (
    <header className="lj-drill-head lj-run-head" inert={covered}>
      <button
        type="button"
        className="lj-text-button lj-exit"
        data-testid="rd-exit"
        disabled={locked}
        onClick={() => ask('abort')}
      >
        <X size={18} aria-hidden />
        <span>Avbryt provpass</span>
      </button>
      <span className="lj-drill-progress">
        {q.section}{' '}
        <span>
          · fråga {index + 1} av {total}
        </span>
      </span>
      <span
        className="lj-run-clock"
        role="timer"
        data-testid="rd-prov-timer"
        data-urgent={String(urgent)}
      >
        {fmtClock(remaining)} <span>kvar</span>
      </span>
      <button
        type="button"
        className="lj-tool lj-run-submit"
        data-testid="rd-prov-submit"
        disabled={locked}
        onClick={() => ask('submit')}
      >
        Lämna in
      </button>
      <Account theme={props.theme} onTheme={props.onTheme} onOpenChange={setAccountOpen} />
      <span className="lj-progress-line" aria-hidden>
        <i style={{ width: `${(answered / total) * 100}%` }} />
      </span>
    </header>
  )

  const map = (
    <section className="lj-map" aria-labelledby={mapId}>
      {phone ? (
        <button
          type="button"
          className="lj-map-toggle"
          aria-expanded={mapOpen}
          aria-controls={gridId}
          onClick={() => setMapOpen(!mapOpen)}
        >
          <span id={mapId}>Svarsöversikt</span>
          <span>
            {answered} av {total} besvarade
          </span>
          {mapOpen ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
        </button>
      ) : (
        <div className="lj-map-head">
          <h2 className="lj-eyebrow" id={mapId}>
            Svarsöversikt
          </h2>
          <span>
            {answered} av {total} besvarade
            {marked.length > 0 ? ` · ${count(marked.length, 'markerad', 'markerade')}` : ''}
          </span>
        </div>
      )}
      <div className="lj-map-panel" id={gridId} hidden={phone && !mapOpen}>
        <div className="lj-map-grid" data-testid="rd-prov-grid">
          {runsOf(questions).map((r) => (
            <div className="lj-map-run" key={r.start}>
              <span className="lj-map-label" aria-hidden>
                {r.section}
              </span>
              <ol aria-label={`${r.section}, fråga ${r.start + 1}–${r.end}`}>
                {questions.slice(r.start, r.end).map((x, k) => {
                  const i = r.start + k
                  const done = answers[x.qid] != null
                  const here = i === index
                  const flag = hasFlags && isFlagged(x.qid)
                  return (
                    <li key={x.qid}>
                      <button
                        type="button"
                        className="lj-map-cell"
                        data-testid={`rd-prov-cell-${i + 1}`}
                        data-answered={String(done)}
                        data-current={String(here)}
                        data-flagged={String(flag)}
                        aria-current={here ? 'step' : undefined}
                        aria-label={[
                          `Fråga ${i + 1}`,
                          x.section,
                          done ? 'besvarad' : 'obesvarad',
                          flag ? 'markerad' : null,
                          here ? 'visas nu' : null,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        disabled={locked}
                        onClick={() => goTo(i)}
                      >
                        {i + 1}
                        {flag && <Flag size={11} aria-hidden />}
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </div>
        <p className="lj-map-key">
          Fylld ruta: besvarad. Streckad: obesvarad. Ljuslinjen visar var du är.
        </p>
      </div>
    </section>
  )

  // An attempt that has ended says how and leads back, never on to a result:
  // a failed hand-in may still have reached the host, and a pass handed in
  // may not be saved yet, so the copy promises neither.
  const status =
    settle === 'active' ? null : (
      <div className="lj-run-status" data-state={settle} role="status">
        <h2 ref={statusRef} tabIndex={-1}>
          {failed ? 'Provpasset kunde inte lämnas in.' : 'Passet är inlämnat.'}
        </h2>
        <p>
          {`${timeUp ? 'Tiden tog slut. ' : ''}Dina svar finns kvar här men går inte längre att ändra. `}
          {failed
            ? 'Om inlämningen ändå gick fram finns resultatet under Tidigare resultat.'
            : 'När resultatet är sparat finns det under Tidigare resultat.'}
        </p>
        <button className="lj-primary" type="button" onClick={leave}>
          <span>Till Provpass</span>
          <ArrowRight size={20} aria-hidden />
        </button>
      </div>
    )

  const questionHeading = (
    <h2 className="lj-eyebrow lj-run-heading" ref={heading} tabIndex={-1}>
      Fråga {index + 1} av {total} · {q.section}
    </h2>
  )

  const optionRows =
    q.options == null || q.options.length === 0 ? (
      <div className="lj-unavailable">
        <p>Frågan saknar svarsalternativ. Du kan gå vidare till nästa fråga.</p>
      </div>
    ) : (
      <ol className="lj-options lj-exam-options" aria-label={lead}>
        {q.options.map((option) => {
          const on = choice === option.letter
          const slot = `option-${option.letter}`
          const optionFigure = option.figure ?? null
          return (
            <li key={option.letter} data-selected={String(on)}>
              <button
                type="button"
                className="lj-option"
                data-testid={`rd-prov-option-${option.letter}`}
                aria-pressed={on}
                disabled={locked || figures.blocked}
                onClick={() => pick(option.letter)}
              >
                <kbd>{option.letter}</kbd>
                {optionFigure ? (
                  <span className="lj-option-figure">
                    <img
                      key={figures.key(slot, optionFigure.src)}
                      {...figures.img(slot, optionFigure.src)}
                      src={`/${optionFigure.src}`}
                      alt={optionFigure.alt}
                      width={optionFigure.width}
                      height={optionFigure.height}
                    />
                  </span>
                ) : (
                  <span>
                    <MathText>{option.text}</MathText>
                  </span>
                )}
                {on && <Check className="lj-selected-mark" size={16} aria-hidden />}
              </button>
              {optionFigure && figures.status(slot, optionFigure.src) === 'failed' && (
                <button
                  type="button"
                  className="lj-text-button lj-option-retry"
                  onClick={() => figures.retry(slot, optionFigure.src)}
                >
                  Hämta bilden för {option.letter} igen
                </button>
              )}
            </li>
          )
        })}
      </ol>
    )

  const answersBlock = (
    <>
      {shape !== 'problem' && (
        <p className="lj-prompt lj-run-prompt">
          <MathText>{q.prompt}</MathText>
        </p>
      )}
      {shape === 'problem' && q.options && <p className="lj-answer-lead">{lead}</p>}
      {optionRows}
      {figures.blocked && !locked && (
        <p className="lj-run-wait" role="status">
          {figureFailed || optionFailed
            ? 'En bild som frågan behöver kunde inte visas. Svaren går att välja när den har laddats.'
            : 'Svaren går att välja när underlaget har laddats.'}
        </p>
      )}
      <div className="lj-run-choice">
        <p>{choice ? `Ditt svar: ${choice}` : 'Inget svar valt än'}</p>
        {hasFlags && (
          <button
            type="button"
            className="lj-tool lj-run-flag"
            data-testid="rd-prov-flag"
            aria-pressed={isFlagged(q.qid)}
            disabled={locked}
            onClick={toggleFlag}
          >
            <Flag size={16} aria-hidden />
            <span>{isFlagged(q.qid) ? 'Markerad' : 'Markera'}</span>
          </button>
        )}
      </div>
    </>
  )

  // Moving on, and its keys, end with the attempt.
  const footer = locked ? null : (
    <footer className="lj-action-bar lj-run-foot">
      <div className="lj-run-steps">
        <button
          type="button"
          className="lj-text-button"
          disabled={locked || index === 0}
          onClick={() => goTo(index - 1)}
        >
          <ArrowLeft size={16} aria-hidden /> Föregående
        </button>
        <button
          type="button"
          className="lj-primary"
          disabled={locked}
          onClick={() => (last ? ask('submit') : goTo(index + 1))}
        >
          <span>{last ? 'Granska svar' : 'Nästa fråga'}</span>
          <ArrowRight size={20} aria-hidden />
        </button>
      </div>
      {!phone && (
        <p>
          {range ? `${range} väljer · ` : ''}← → byter fråga · svaren går att ändra tills tiden är
          ute
        </p>
      )}
    </footer>
  )

  const figurePane = figure && figureView.view && (
    <FigurePane
      key={figures.key('figure', figure.src)}
      figure={figure}
      source={q.source.label}
      block={block}
      rotation={figureView.view.rotation}
      onRotate={figureView.rotate}
      onEnlarge={() => setViewer(true)}
      enlargeRef={enlargeRef}
      img={figures.img('figure', figure.src)}
      load={figures.status('figure', figure.src)}
      onRetry={() => figures.retry('figure', figure.src)}
    />
  )

  const passageField = passage && (
    <div className="lj-passage-scroll">
      <header className="lj-passage-title">
        {passage.synthetic && (
          <>
            <div className="lj-disclosure">
              <span className="lj-eyebrow">{data.copy.ovningstextBadge}</span>
              <button
                type="button"
                className="lj-text-button"
                aria-expanded={note}
                aria-controls={noteId}
                onClick={() => setNote(!note)}
              >
                Om texten <ChevronDown size={15} aria-hidden />
              </button>
            </div>
            <p className="lj-note" id={noteId} hidden={!note}>
              {data.copy.ovningstextNote}
            </p>
          </>
        )}
        {passage.title && <h2 className="lj-run-passage-title">{passage.title}</h2>}
      </header>
      <article
        className="lj-passage"
        lang={passage.lang}
        aria-label={passage.title ?? 'Texten'}
        data-testid="rd-prov-passage"
      >
        <PassageParagraphs
          paragraphs={passage.paragraphs}
          byline={passage.byline}
          lit={(n) => lit === n}
          onLight={(n) => setLit(lit === n ? null : n)}
        />
      </article>
      <p className="lj-text-end">Slut på texten</p>
    </div>
  )

  let body: ReactNode
  if (shape === 'problem') {
    body = phone ? (
      <div className="lj-quant-phone">
        <div className="lj-quant-scroll">
          {questionHeading}
          <QuantProblem parts={parts} testId="rd-prov-prompt" />
          {figurePane}
          <div className="lj-quant-answers">{answersBlock}</div>
        </div>
        {footer}
      </div>
    ) : (
      <div className="lj-quant-layout">
        <div className="lj-problem-column">
          {questionHeading}
          <QuantProblem parts={parts} testId="rd-prov-prompt" />
          <p className="lj-problem-source">{q.source.label}</p>
          {figurePane}
        </div>
        <section className="lj-question" aria-label={`Svar på fråga ${index + 1}`}>
          <div className="lj-question-scroll">{answersBlock}</div>
          {footer}
        </section>
      </div>
    )
  } else {
    body = (
      <div className={`lj-reading-layout${shape === 'figure' ? ' lj-figure-layout' : ''}`}>
        <div className="lj-reading-column" inert={sheetMode && sheet.state === 'full'}>
          {shape === 'figure' ? figurePane : passageField}
        </div>
        <section
          className="lj-question"
          data-state={sheetMode ? sheet.state : 'open'}
          aria-label={`Fråga ${index + 1}`}
        >
          {sheetMode && (
            <button
              type="button"
              className="lj-sheet-handle"
              {...sheet.grab}
              aria-controls={sheetId}
              aria-expanded={sheetVisible}
            >
              <span className="lj-grip" aria-hidden />
              <span>
                {sheetVisible
                  ? shape === 'figure'
                    ? 'Visa underlaget'
                    : 'Visa texten'
                  : 'Visa frågan'}
                {sheetVisible ? (
                  <ChevronDown size={16} aria-hidden />
                ) : (
                  <ChevronUp size={16} aria-hidden />
                )}
              </span>
            </button>
          )}
          <div className="lj-question-scroll" id={sheetId}>
            {questionHeading}
            {sheetVisible ? (
              answersBlock
            ) : (
              <p className="lj-peek-prompt">
                <MathText>{q.prompt}</MathText>
                {choice && <span className="lj-run-peek-choice"> · ditt svar: {choice}</span>}
              </p>
            )}
          </div>
          {sheetVisible && footer}
        </section>
      </div>
    )
  }

  const enlarged = viewer && figure && figureView.view && (
    <FigureViewer
      figure={figure}
      source={q.source.label}
      view={figureView.view}
      onZoom={figureView.zoomBy}
      onRotate={figureView.rotate}
      onFit={figureView.fit}
      onClose={() => {
        returnFocus.current = true
        setViewer(false)
      }}
    />
  )

  // An attempt that has ended with no result shown: its answers, read-only,
  // in the normal shell, where the doors and the switcher's keys work again.
  if (locked) {
    return (
      <>
        <FrameShell
          door="provpass"
          onGo={goDoor}
          width={props.width}
          account={<Account theme={props.theme} onTheme={props.onTheme} />}
          inert={covered}
        >
          <main
            className="lj-drill lj-run"
            data-testid="rd-prov-running"
            data-shape={shape}
            data-spotlight={String(lit != null)}
            data-settle={settle}
          >
            <div className="lj-run-chrome">
              {status}
              {map}
            </div>
            <div className="lj-drill-body">{body}</div>
          </main>
        </FrameShell>
        {enlarged}
      </>
    )
  }

  return (
    <div
      ref={root}
      className="lj-drill lj-run"
      data-testid="rd-prov-running"
      // Keys inside a running pass are its own: the switcher leaves them.
      data-rd-keyscope=""
      data-shape={shape}
      data-spotlight={String(lit != null)}
      data-settle={settle}
    >
      {head}
      <div className="lj-run-chrome" inert={covered}>
        {urgent && settle === 'active' && remaining > 0 && (
          <p className="lj-run-notice" role="status">
            Fem minuter kvar. Ge varje obesvarad fråga ett svar.
          </p>
        )}
        {map}
      </div>
      <div className="lj-drill-body" inert={covered}>
        {body}
      </div>
      {gate.gate === 'submit' && (
        <Gate
          eyebrow="Lämna in"
          title="Lämna in provpasset?"
          accept="Lämna in"
          cancel="Tillbaka till frågorna"
          onAccept={() => submit('hand-in')}
          onCancel={gate.close}
        >
          <p className="lj-gate-lead">
            {answered} av {total} frågor har ett svar.
          </p>
          {blanks.length > 0 ? (
            <p>
              {blanksLine(blanks.length)}: {numberList(blanks)}. Fel svar ger inga avdrag, så ett
              svar på varje fråga lönar sig.
            </p>
          ) : (
            <p>Alla frågor har ett svar.</p>
          )}
          {marked.length > 0 && <p>Markerade: {numberList(marked)}.</p>}
          <p>Efter inlämningen går svaren inte att ändra.</p>
        </Gate>
      )}
      {gate.gate === 'abort' && (
        <Gate
          eyebrow="Avbryt provpass"
          title="Avbryta provpasset?"
          accept="Avbryt provpasset"
          cancel="Fortsätt provpasset"
          onAccept={abort}
          onCancel={gate.close}
        >
          <p className="lj-gate-lead">
            Avbryter du blir provet ogiltigt och inget resultat sparas.
          </p>
          <p>Det finns ingen paus: klockan går vidare även om du bara lämnar sidan.</p>
        </Gate>
      )}
      {enlarged}
    </div>
  )
}

// ── 10 · The result ──────────────────────────────────────────────────

/**
 * The handed-in pass as one lit receipt: the raw result first, then how
 * the score was derived (visible, never a tooltip), and one next step.
 * Each section's correct answers and time against its share of the pass
 * sit in an open ledger below; the pass's facts and earlier passes of the
 * same kind wait quietly beside it.
 */
export function LjuskaglaProvResult({ live, onOpen }: { live: boolean; onOpen: OpenPage }) {
  const { data, actions } = useDirectionData()
  const r = data.provpass.result
  const halfView = data.provpass.hub.halves.find((h) => h.half === r.half)
  const nominal = halfView?.questions ?? null
  const limit = (halfView?.minutes ?? 55) * 60
  const missing = nominal != null ? Math.max(0, nominal - r.presented) : 0
  const blanks = Math.max(0, r.presented - r.answered)
  const names = Object.fromEntries(data.framsteg.sections.map((s) => [s.section, s.name]))
  const heading = useRef<HTMLHeadingElement>(null)
  const ledgerId = useId()
  const historyId = useId()
  const trap = r.trap ?? null

  // The result is where a hand-in lands: it takes focus at its heading.
  useEffect(() => {
    if (live) heading.current?.focus({ preventScroll: true })
  }, [live])

  const next =
    r.missed.length === 0
      ? { label: 'Till Framsteg', go: () => onOpen('framsteg', () => actions.go('framsteg')) }
      : { label: 'Till Öva', go: () => onOpen('ova', () => actions.go('ova')) }
  const method =
    r.score.value == null
      ? 'Det gick inte att räkna fram en poäng för passet. Antalet rätt gäller.'
      : r.score.derived === 'official-derived'
        ? `Normerat (härlett): ${r.correct} rätt av ${r.presented} räknas om till en hel provhalva på 80 frågor och läses av i provtillfällets normeringstabell. Det är en uppskattning – ett enskilt provpass har ingen officiell poäng.`
        : 'Skattad poäng: andelen rätt omräknad till 0–2,0. Den är indikativ och inte normerad av UHR.'

  return (
    <div className="lj-page lj-result">
      <button
        className="lj-text-button lj-back"
        type="button"
        onClick={() => onOpen('provpass', () => actions.go('provpass'))}
      >
        <ArrowLeft size={16} aria-hidden /> Till Provpass
      </button>
      <header className="lj-page-head">
        <p className="lj-eyebrow">Provpass · resultat</p>
        <h1 ref={heading} tabIndex={-1}>
          Provpasset är klart.
        </h1>
      </header>
      <div className="lj-hub-grid">
        <section
          className="lj-resume lj-hub-lamp lj-receipt"
          data-testid="rd-prov-result"
          aria-label="Ditt resultat"
        >
          <div className="lj-resume-top">
            <span className="lj-eyebrow">
              {halfName(r.half)} halva ·{' '}
              {r.mode === 'authentic' ? 'riktigt prov' : 'genererat pass'}
            </span>
            <LampDesk size={28} strokeWidth={1.3} aria-hidden />
          </div>
          <p className="lj-receipt-count">
            <strong>{r.correct}</strong>
            <span>av {r.presented} rätt</span>
          </p>
          {missing > 0 && (
            <p className="lj-receipt-line">
              {missing === 1 ? '1 fråga saknas' : `${missing} frågor saknas`} i passet, så det
              rättades av {r.presented}.
            </p>
          )}
          <p className="lj-receipt-line">
            {r.answered} besvarade{blanks > 0 ? ` · ${blanks} obesvarade` : ''} · tid{' '}
            {fmtClock(r.durationSeconds)} av {fmtClock(limit)}
          </p>
          <div className="lj-receipt-score" data-testid="rd-prov-score">
            {r.score.value != null ? (
              <>
                <strong>{fmtScore(r.score.value)}</strong>
                <span>
                  {capitalize(r.score.label)}
                  <br />
                  av 2,0
                </span>
              </>
            ) : (
              <span>Ingen poäng för det här passet.</span>
            )}
          </div>
          <p className="lj-receipt-method">{method}</p>
          {r.missed.length > 0 && (
            <p className="lj-receipt-limit">
              Genomgången av frågorna du missade finns inte här än. Under tiden kan du öva vidare på
              delproven.
            </p>
          )}
          <button className="lj-primary" type="button" onClick={next.go}>
            <span>{next.label}</span>
            <ArrowRight size={20} aria-hidden />
          </button>
        </section>
        <aside className="lj-hub-door lj-shade lj-receipt-about" aria-label="Om passet">
          <p className="lj-eyebrow">Om passet</p>
          <dl className="lj-prov-facts">
            <div>
              <dt>Prov</dt>
              <dd>{resultName(r)}</dd>
            </div>
            <div>
              <dt>Sett förut</dt>
              <dd>
                {r.seenBefore} av {r.presented} frågor
              </dd>
            </div>
            <div>
              <dt>Tid</dt>
              <dd>
                {fmtClock(r.durationSeconds)} av {fmtClock(limit)}
              </dd>
            </div>
          </dl>
        </aside>
        <section className="lj-hub-rows lj-shade" aria-labelledby={ledgerId}>
          <div className="lj-section-head">
            <h2 id={ledgerId}>Delprov och tempo</h2>
          </div>
          <table className="lj-ledger">
            <caption>
              Rätt svar per delprov, och tiden mot delprovets andel av {Math.round(limit / 60)}{' '}
              minuter.
            </caption>
            <thead>
              <tr>
                <th scope="col">Delprov</th>
                <th scope="col">Rätt</th>
                <th scope="col">Tid</th>
              </tr>
            </thead>
            <tbody>
              {r.sections.map((s) => {
                const over = s.timeSeconds - s.quotaSeconds
                return (
                  <tr
                    key={s.section}
                    data-testid={`rd-prov-section-${sectionId(s.section)}`}
                    data-over={String(over > 0)}
                  >
                    <th scope="row">
                      <span className="lj-ledger-code">{s.section}</span>
                      {names[s.section] && <span>{names[s.section]}</span>}
                    </th>
                    <td>
                      <strong>{s.correct}</strong> av {s.presented}
                    </td>
                    <td>
                      {fmtClock(s.timeSeconds)}
                      <span> av {fmtClock(s.quotaSeconds)}</span>
                      {over > 0 && <em>{overBy(over)} över andelen</em>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {trap && (
            <div className="lj-receipt-trap">
              <p className="lj-eyebrow">Ett mönster att se</p>
              <p className="lj-trap-pattern">
                {trap.headline ?? data.frameworks[trap.frameworkId] ?? trap.frameworkId}
              </p>
              <p>
                {trap.section} · {count(trap.count, 'miss', 'missar')} av samma slag
              </p>
              <button
                className="lj-text-button"
                type="button"
                onClick={() => onOpen('uppslag', () => actions.openLesson(trap.frameworkId))}
              >
                Läs om mönstret <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          )}
        </section>
        <aside className="lj-hub-aside lj-shade">
          <section
            className="lj-hub-traps"
            data-testid="rd-prov-history"
            aria-labelledby={historyId}
          >
            <h2 id={historyId}>Tidigare pass av samma slag</h2>
            {r.history.length > 0 ? (
              <ol>
                {r.history.map((h, i) => (
                  <li key={h.id} data-testid={`rd-prov-history-item-${i + 1}`}>
                    <button
                      type="button"
                      className="lj-trap-row"
                      onClick={() => actions.openProvResult(h.id)}
                    >
                      <span className="lj-trap-pattern">
                        {h.correct} av {h.presented} rätt
                        {h.score != null ? ` · ${fmtScore(h.score)}` : ''}
                      </span>
                      <span>
                        {resultName(h)} · {midLine(h.when)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="lj-hub-note">Inga tidigare pass av samma slag än.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
