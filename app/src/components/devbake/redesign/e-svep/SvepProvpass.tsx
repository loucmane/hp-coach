// Svep · Provpass and Provpassresultat — a timed pass as a dealt card.
//
// The hub (9) deals the passes of one half as a deck: the pass seen least
// in front, its card naming the sitting and the pass, its size and its 55
// minutes, the half's sections as a small hand, and how much of it you
// have met before. The two halves are door cards beside it, with the
// rhythm and the rules; the register and the earlier results lie on the
// other side. "Förbered provpass" deals one confirmation card over the
// table — the pass's identity and the rules, then "Starta provpasset" or
// "Inte nu" — so no swipe, key or stray Enter ever starts a clock.
//
// The running pass (9, started) is focus mode: Avsluta, the pass's name,
// the clock and a quiet Lämna in replace the menu. One question card at a
// time, a DTK page or a text as the reference card beside it, and the
// pass's hand as a register of every question: the answered ones face
// down, the current one standing, the flagged ones marked; any of them
// opens. An answer stays changeable until the hand-in and nothing is ever
// graded before it. The clock is decided once, when the pass starts, and
// its end hands the pass in, exactly once; Avsluta asks first and voids.
// A question that needs a picture (its page, its figure, picture options)
// cannot be answered until that picture is on screen.
//
// The result (10) is the pass turned over and read one evidence card at a
// time: the outcome and how its score was derived, each section against
// its questions, the time against each section's share of the 55 minutes,
// the misses, and the earlier passes of the same half.
//
// Kit v2: everything is the view model's (data.provpass) and every move is
// a request: startProvpass, submitProvpass, openProvResult, startDrill and
// go. The kit has no request for a pass's answers, its position, its flags
// or a voided pass, so those are kept here, seeded from the running view.

import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flag,
  Info,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCw,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtClock, isForeignKey, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  DrillFigure,
  DrillOption,
  DrillQuestion,
  Half,
  ProvHalfView,
  ProvHubView,
  ProvPassOptionView,
  ProvPrescriptionView,
  ProvResultSummaryView,
  ProvResultView,
  ProvSectionResultView,
} from '@/components/devbake/redesign/viewModel'
import { isProseCondition, splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { type AnswerLetter, SECTION_KEYS, type Section } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { useDeck } from './deck'
import {
  cap,
  type DeckCard,
  DeckCounter,
  DeckRegister,
  DeckStage,
  DeckTicks,
  Gate,
  Kbd,
  SecChip,
  sectionKey,
  sectionTint,
  useDeckKeys,
  word,
} from './parts'
import type { FrameNav } from './Svep'
import { ExitButton } from './SvepDrill'

const HALF_SHORT: Record<Half, string> = { verbal: 'Verbal', kvant: 'Kvant' }

/** "den verbala halvan": a half in a sentence. */
const HALF_IN_TEXT: Record<Half, string> = {
  verbal: 'den verbala halvan',
  kvant: 'den kvantitativa halvan',
}

/** "verbala pass": a half's passes. */
const HALF_PASSES: Record<Half, string> = {
  verbal: 'verbala pass',
  kvant: 'kvantitativa pass',
}

/** A pass in a test id: 'host-2025:kvant1' → 'host-2025-kvant1' (the shared
 *  contract's passSlug; contract.ts is test-only, so not imported). */
const passKey = (id: string) => id.replace(':', '-')

/** A normed score keeps its two decimals ("1,25"), as the real result. */
const fmtNormed = (v: number) => v.toFixed(2).replace('.', ',')

/** A pass is 55 minutes and 40 questions when the hub does not say. */
const PASS_MINUTES = 55

/** 0 → "idag", 1 → "igår", 6 → "för sex dagar sedan". */
function since(days: number): string {
  if (days <= 0) return 'idag'
  if (days === 1) return 'igår'
  return `för ${word(days)} dagar sedan`
}

/** 0 → "idag", 1 → "imorgon", 3 → "om tre dagar". */
function until(days: number): string {
  if (days <= 0) return 'idag'
  if (days === 1) return 'imorgon'
  return `om ${word(days)} dagar`
}

/** The Provpass rhythm in two short sentences, when there is one. */
function rhythmLine(p: ProvPrescriptionView | null | undefined): string | null {
  if (!p) return null
  const half = HALF_SHORT[p.half].toLowerCase()
  const last =
    p.daysSinceLast == null ? 'Inget pass än.' : `Senaste passet ${since(p.daysSinceLast)}.`
  const next = p.due
    ? `Dags för nästa nu: ${half}.`
    : `Nästa pass: ${half}, ${until(p.daysUntilNext)}.`
  return `${last} ${next}`
}

// ── The hub ──────────────────────────────────────────────────────────

type PassCard = DeckCard & {
  /** What Enter does while the card is in front. */
  action: (() => void) | null
}

export function SvepProvpass({
  width,
  live,
  nav,
  voided,
  onDismissVoid,
  onStart,
}: {
  width: WidthKey
  live: boolean
  nav: FrameNav
  /** The half of a pass just voided with Avsluta: the hub says so. */
  voided: Half | null
  onDismissVoid: () => void
  /** The pass confirmed at the gate: the stage turns to its run. */
  onStart: (pass: ProvPassOptionView) => void
}) {
  const { data, actions } = useDirectionData()
  const hub = data.provpass.hub
  const phone = width === 'phone'
  const [half, setHalf] = useState<Half>(voided ?? hub.half)
  // The pass under the confirmation card, by id: if it goes from the data
  // the card goes with it.
  const [gateId, setGateId] = useState<string | null>(null)
  const gatePass = gateId ? (hub.passes.find((p) => p.id === gateId) ?? null) : null
  const halfView = hub.halves.find((h) => h.half === half)
  const otherHalf = hub.halves.find(
    (h) => h.half !== half && hub.passes.some((p) => p.half === h.half),
  )

  const cards = useMemo(
    () =>
      passCards({
        hub,
        half,
        halfView,
        otherHalf: otherHalf ?? null,
        onPrepare: (p) => setGateId(p.id),
        onHalf: setHalf,
        onOva: () => nav.go('ova'),
      }),
    [hub, half, halfView, otherHalf, nav],
  )
  // A new half deals its own passes from the top.
  const deck = useDeck(cards, half)
  const front = cards[deck.index]
  useDeckKeys(deck, front?.action ?? null, live && !gatePass)

  const start = (p: ProvPassOptionView) => {
    setGateId(null)
    actions.startProvpass(p.id)
    onStart(p)
  }

  const stage = (
    <DeckStage
      deck={deck}
      cards={cards}
      label={`Provpass, ${cards.length} kort`}
      kind="prov"
      live={live && !gatePass}
    />
  )
  const notice = voided ? <VoidNotice onDismiss={onDismissVoid} /> : null
  const doors = <HalfDoors hub={hub} half={half} onPick={setHalf} />
  const rhythm = rhythmLine(hub.prescription)
  const rules = <Rules rules={hub.rules} />
  const results = <Results results={hub.results} onOpen={nav.openResult} />
  const gate = gatePass ? (
    <StartGate
      pass={gatePass}
      half={hub.halves.find((h) => h.half === gatePass.half)}
      rules={hub.rules}
      onStart={() => start(gatePass)}
      onClose={() => setGateId(null)}
    />
  ) : null
  const passFront = front?.id !== 'empty'

  if (phone) {
    return (
      <>
        <div className="sv-ptri sv-pprov" inert={gatePass != null}>
          <header className="sv-ptri-head">
            <h1 className="sv-greet">Provpass</h1>
            {rhythm ? <p className="sv-day">{rhythm}</p> : null}
          </header>
          {notice}
          {doors}
          <div className="sv-ptri-deck">{stage}</div>
          <div className="sv-phome-foot">
            <DeckCounter deck={deck} cards={cards} arrows={false} />
            <DeckTicks deck={deck} cards={cards} label="Passen" />
          </div>
          {results}
          {rules}
        </div>
        {gate}
      </>
    )
  }

  return (
    <>
      <div className="sv-tri sv-prov" inert={gatePass != null}>
        <aside className="sv-tri-side" aria-label="Provpass">
          <h1 className="sv-greet">Provpass</h1>
          <p className="sv-day">
            Ett helt pass under riktiga villkor. Facit kommer först när du har lämnat in.
          </p>
          {notice}
          {doors}
          {rhythm ? <p className="sv-prov-rhythm">{rhythm}</p> : null}
          {rules}
        </aside>
        <div className="sv-home-deck">
          {stage}
          <DeckCounter deck={deck} cards={cards} />
          <p className="sv-deck-hint">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd> bläddrar
            {passFront ? (
              <>
                {' '}
                · <Kbd>↵</Kbd> förbereder passet
              </>
            ) : null}
          </p>
        </div>
        <div className="sv-tri-end">
          <DeckRegister
            deck={deck}
            cards={cards}
            label="Passen"
            head={
              <>
                I leken <span>· {halfView?.label ?? HALF_SHORT[half]}</span>
              </>
            }
          />
          {results}
        </div>
      </div>
      {gate}
    </>
  )
}

function passCards({
  hub,
  half,
  halfView,
  otherHalf,
  onPrepare,
  onHalf,
  onOva,
}: {
  hub: ProvHubView
  half: Half
  halfView: ProvHalfView | undefined
  otherHalf: ProvHalfView | null
  onPrepare: (pass: ProvPassOptionView) => void
  onHalf: (half: Half) => void
  onOva: () => void
}): PassCard[] {
  const passes = hub.passes.filter((p) => p.half === half)
  if (passes.length === 0) {
    // Never a start on an empty half: the way to what there is instead.
    const other = otherHalf
    return [
      {
        id: 'empty',
        label: 'Inga pass här än',
        tint: 'none',
        meta: '',
        action: other ? () => onHalf(other.half) : onOva,
        body: (
          <NoPasses
            half={half}
            other={other}
            onOther={other ? () => onHalf(other.half) : null}
            onOva={onOva}
          />
        ),
      },
    ]
  }
  // The pass seen least leads; without a marked one, the first.
  const marked = passes.some((p) => p.suggested)
  return passes.map((p, i) => {
    const lead = marked ? p.suggested : i === 0
    return {
      id: p.id,
      label: `${p.sitting} · ${p.pass}`,
      tint: 'none',
      meta: `${p.seenBefore}/${p.presented}`,
      metaSaid: `${p.seenBefore} av ${p.presented} sedda tidigare`,
      action: () => onPrepare(p),
      body: <PassCardBody pass={p} half={halfView} lead={lead} onPrepare={() => onPrepare(p)} />,
    }
  })
}

function PassCardBody({
  pass,
  half,
  lead,
  onPrepare,
}: {
  pass: ProvPassOptionView
  half: ProvHalfView | undefined
  lead: boolean
  onPrepare: () => void
}) {
  const nominal = half?.questions ?? pass.presented
  const missing = Math.max(0, nominal - pass.presented)
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-sec" data-sec="none">
          {HALF_SHORT[pass.half]}
        </span>
        <span className="sv-hc-eyebrow">
          {lead ? 'Förslag · det pass du sett minst av' : 'Riktigt provpass'}
        </span>
        <span className="sv-hc-meta">{half?.minutes ?? PASS_MINUTES}&nbsp;min</span>
      </div>
      <div className="sv-hc-body" data-testid={`rd-prov-pass-${passKey(pass.id)}`}>
        <p className="sv-hc-kicker">
          {pass.pass} · {pass.presented}&nbsp;frågor
        </p>
        <h2 className="sv-hc-title">{pass.sitting}</h2>
        {/* The half's sections as a hand — only for a whole pass: a short
         *  one's own split is not known. */}
        {half && missing === 0 ? <PassHand half={half} /> : null}
        {missing > 0 ? (
          <p className="sv-hc-detail">
            {missing} {missing === 1 ? 'fråga saknas' : 'frågor saknas'} i banken: passet rättas av{' '}
            {pass.presented}.
          </p>
        ) : null}
        <Seen seen={pass.seenBefore} of={pass.presented} />
      </div>
      {lead ? (
        <p className="sv-hc-why">Ju färre frågor du mött förut, desto mer säger resultatet.</p>
      ) : null}
      <div className="sv-hc-foot">
        <button
          type="button"
          className={`sv-btn ${lead ? 'sv-btn--primary sv-btn--lg' : 'sv-btn--tonal'} sv-btn--block`}
          data-testid={lead ? 'rd-prov-start' : undefined}
          onClick={onPrepare}
        >
          Förbered provpass
          {lead ? <Kbd>↵</Kbd> : <ArrowRight size={18} strokeWidth={2} aria-hidden />}
        </button>
      </div>
    </>
  )
}

/** The half's sections as a small hand of cards, each with its share. */
function PassHand({ half }: { half: ProvHalfView }) {
  const n = half.sections.length
  return (
    <span
      className="sv-passhand"
      role="img"
      aria-label={`${half.questions} frågor: ${half.sections.map((s) => `${s.count} ${s.section}`).join(', ')}`}
    >
      {half.sections.map((s, i) => (
        <i
          key={s.section}
          data-sec={sectionTint(s.section)}
          style={{ '--i': i - (n - 1) / 2 } as CSSProperties}
        >
          <b>{s.section}</b>
          <span>{s.count}</span>
        </i>
      ))}
    </span>
  )
}

/** "6 av 40 sedda tidigare", with the share as a thin bar. */
function Seen({ seen, of }: { seen: number; of: number }) {
  const pct = of > 0 ? Math.min(100, (seen / of) * 100) : 0
  return (
    <p className="sv-seen">
      <span className="sv-seen-bar" aria-hidden>
        <i style={{ width: `${pct}%` }} />
      </span>
      <span>
        <b>{seen}</b> av {of} sedda tidigare
      </span>
    </p>
  )
}

function NoPasses({
  half,
  other,
  onOther,
  onOva,
}: {
  half: Half
  other: ProvHalfView | null
  onOther: (() => void) | null
  onOva: () => void
}) {
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-sec" data-sec="none">
          {HALF_SHORT[half]}
        </span>
        <span className="sv-hc-eyebrow">Riktiga provpass</span>
      </div>
      <div className="sv-hc-body">
        <h2 className="sv-hc-title">Inga pass här än</h2>
        <p className="sv-hc-detail">
          Banken har inga riktiga pass för {HALF_IN_TEXT[half]} just nu.
        </p>
      </div>
      <div className="sv-hc-foot">
        {other && onOther ? (
          <button
            type="button"
            className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
            onClick={onOther}
          >
            Visa {HALF_PASSES[other.half]}
            <Kbd>↵</Kbd>
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

/** The two halves as door cards: a press deals that half's passes. The half
 *  the rhythm says is next carries an index tab, in words. */
function HalfDoors({
  hub,
  half,
  onPick,
}: {
  hub: ProvHubView
  half: Half
  onPick: (half: Half) => void
}) {
  const headId = useId()
  const next = hub.prescription?.half ?? null
  return (
    <section className="sv-halfdoors" aria-labelledby={headId}>
      <h2 className="sv-index-group" id={headId}>
        Halvorna
      </h2>
      <div className="sv-halfdoors-row">
        {hub.halves.map((h) => (
          <button
            type="button"
            key={h.half}
            className="sv-halfdoor"
            data-testid={`rd-prov-half-${h.half}`}
            aria-pressed={h.half === half}
            onClick={() => onPick(h.half)}
          >
            <span className="sv-halfdoor-name">{h.label}</span>
            <span className="sv-halfdoor-size">
              {h.questions} frågor · {h.minutes} min
            </span>
            <span className="sv-halfdoor-secs">
              {h.sections.map((s) => (
                <span key={s.section}>
                  {s.section} {s.count}
                  <span className="sv-sr">,</span>
                </span>
              ))}
            </span>
            {next === h.half ? (
              <span className="sv-sdoor-tab">
                <span className="sv-sr">, </span>
                Näst på tur
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  )
}

/** The rules read out before a pass, as the source says them. */
function Rules({ rules }: { rules: string[] }) {
  const headId = useId()
  if (rules.length === 0) return null
  return (
    <section className="sv-prov-rules" aria-labelledby={headId}>
      <h2 className="sv-index-group" id={headId}>
        Villkoren
      </h2>
      <ul>
        {rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  )
}

/** "Verbal · Våren 2026 · Provpass 1": a result's name. */
function resultName(r: Pick<ProvResultSummaryView, 'half' | 'sitting' | 'pass' | 'mode'>): string {
  const where = r.sitting
    ? [r.sitting, r.pass].filter(Boolean).join(' · ')
    : r.mode === 'synthetic'
      ? 'Genererat pass'
      : 'Provpass'
  return `${HALF_SHORT[r.half]} · ${where}`
}

/** The passes handed in before, newest first; each opens its result. */
function Results({
  results,
  onOpen,
}: {
  results: ProvResultSummaryView[]
  onOpen: (id: string) => void
}) {
  const headId = useId()
  return (
    <section className="sv-prov-results" aria-labelledby={headId}>
      <h2 className="sv-index-group" id={headId}>
        Tidigare resultat
      </h2>
      {results.length ? (
        <ul>
          {results.map((r) => (
            <li key={r.id}>
              <button type="button" className="sv-resrow" onClick={() => onOpen(r.id)}>
                <span className="sv-resrow-name">{resultName(r)}</span>
                <span className="sv-resrow-meta">
                  <b aria-hidden>
                    {r.correct}/{r.presented}
                  </b>
                  <span className="sv-sr">
                    {r.correct} av {r.presented} rätt
                  </span>
                  {r.score != null ? <span> · {fmtNormed(r.score)}</span> : null}
                  {r.when ? <span> · {r.when}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sv-prov-empty">Inga inlämnade pass än.</p>
      )}
    </section>
  )
}

/** A pass voided with Avsluta: said once, on the hub, quietly. */
function VoidNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="sv-notice" aria-live="polite">
      <p>
        <b>Provpasset avbröts.</b> Det räknas inte som ett resultat.
      </p>
      <button
        type="button"
        className="sv-icon-btn"
        aria-label="Stäng meddelandet"
        onClick={onDismiss}
      >
        <X size={18} strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}

/** The one deliberate gate before the clock: the pass named exactly, the
 *  rules, then Starta provpasset or Inte nu. */
function StartGate({
  pass,
  half,
  rules,
  onStart,
  onClose,
}: {
  pass: ProvPassOptionView
  half: ProvHalfView | undefined
  rules: string[]
  onStart: () => void
  onClose: () => void
}) {
  const missing = half ? Math.max(0, half.questions - pass.presented) : 0
  return (
    <Gate
      eyebrow="Starta provpass"
      title={pass.sitting}
      accept={{ label: 'Starta provpasset', onClick: onStart }}
      dismiss={{ label: 'Inte nu', onClick: onClose }}
    >
      <p className="sv-gate-sub">
        {pass.pass} · {pass.presented} frågor · {half?.minutes ?? PASS_MINUTES} minuter
      </p>
      {missing > 0 ? (
        <p className="sv-gate-note">
          {missing} {missing === 1 ? 'fråga saknas' : 'frågor saknas'} i banken: passet rättas av{' '}
          {pass.presented}.
        </p>
      ) : null}
      <p className="sv-gate-note">
        Du har sett {pass.seenBefore} av {pass.presented} frågor förut.
      </p>
      {rules.length ? (
        <ul className="sv-gate-rules">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </Gate>
  )
}

// ── The running pass ─────────────────────────────────────────────────

type PictureState = 'loading' | 'ready' | 'error'

/** One place on screen that shows a picture: its src, what its own image
 *  holds, its tries so far, and whether the question is answered from it. */
type Place = { src: string; state: PictureState; attempt: number; need: boolean }

/**
 * The pictures a pass's questions need — DTK pages, figures, picture
 * options — as the places on screen that show them. Every place reports
 * what its own image holds and leaves when it unmounts, so no place ever
 * speaks for another: a picture is in once every place the question is
 * answered from holds it. A new place starts at loading unless the browser
 * already has its picture (a cached page counts at once). A page shared by
 * consecutive questions stays mounted, so it keeps its state; a new page,
 * or another try, mounts a fresh image. The enlarged page is a place the
 * question is not answered from: opening it, its load, its failure and
 * closing it never change what the question waits for.
 */
type RunPictures = {
  places: Readonly<Record<string, Place>>
  report: (place: string, src: string, state: PictureState, need: boolean) => void
  leave: (place: string) => void
  /** Another try for every place whose image of one of `srcs` failed. */
  retry: (srcs: readonly string[]) => void
}

function useRunPictures(): RunPictures {
  const [places, setPlaces] = useState<Record<string, Place>>({})
  const report = useCallback(
    (place: string, src: string, state: PictureState, need: boolean) =>
      setPlaces((p) => {
        const was = p[place]
        if (was?.src === src && was.state === state && was.need === need) return p
        // A place that shows another picture starts its tries afresh.
        const attempt = was?.src === src ? was.attempt : 0
        return { ...p, [place]: { src, state, attempt, need } }
      }),
    [],
  )
  const leave = useCallback(
    (place: string) =>
      setPlaces((p) => {
        if (!(place in p)) return p
        const { [place]: _gone, ...rest } = p
        return rest
      }),
    [],
  )
  const retry = useCallback(
    (srcs: readonly string[]) =>
      setPlaces((p) => {
        const failed = Object.keys(p).filter(
          (place) => p[place].state === 'error' && srcs.includes(p[place].src),
        )
        if (failed.length === 0) return p
        const next = { ...p }
        for (const place of failed) {
          next[place] = { ...p[place], state: 'loading', attempt: p[place].attempt + 1 }
        }
        return next
      }),
    [],
  )
  return { places, report, leave, retry }
}

/** What a question can count on for `src`: ready once every place it is
 *  answered from holds it, error once one of them failed, else loading —
 *  also while no such place is on screen. */
function needed(pictures: RunPictures, src: string): PictureState {
  const places = Object.values(pictures.places).filter((p) => p.need && p.src === src)
  if (places.some((p) => p.state === 'error')) return 'error'
  return places.length > 0 && places.every((p) => p.state === 'ready') ? 'ready' : 'loading'
}

/** One place's picture: what its own image holds, the key to mount the
 *  image under (another picture or another try is a fresh image) and the
 *  image's wiring. */
type Shown = {
  state: PictureState
  key: string
  ref: { current: HTMLImageElement | null }
  onLoad: () => void
  onError: () => void
}

/**
 * Makes the component calling it a place that shows `src` (`need`: the
 * question is answered from it). A failed image gives way to the place's
 * message while the place stays, so the failure holds until another try.
 */
function usePicture(pictures: RunPictures, src: string, need = true): Shown {
  const place = useId()
  const ref = useRef<HTMLImageElement>(null)
  const { report, leave } = pictures
  const mine = pictures.places[place]
  const own = mine?.src === src ? mine : undefined
  const attempt = own?.attempt ?? 0
  // Each image the place mounts — its first, another picture's, another
  // try's — counts at once when the browser already holds it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: another try mounts a fresh image
  useLayoutEffect(() => {
    const el = ref.current
    report(place, src, el?.complete && el.naturalWidth > 0 ? 'ready' : 'loading', need)
  }, [place, src, attempt, need, report])
  useLayoutEffect(() => () => leave(place), [place, leave])
  return {
    state: own?.state ?? 'loading',
    key: `${src}#${attempt}`,
    ref,
    onLoad: () => report(place, src, 'ready', need),
    onError: () => report(place, src, 'error', need),
  }
}

/** A place's image (usePicture). Mount it under `shown.key`. */
function Picture({
  shown,
  src,
  alt,
  width,
  height,
  className,
}: {
  shown: Shown
  src: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  return (
    <img
      ref={shown.ref}
      className={className}
      src={`/${src}`}
      alt={alt}
      width={width}
      height={height}
      draggable={false}
      onLoad={shown.onLoad}
      onError={shown.onError}
    />
  )
}

/** Whether the question can be answered now, and what to say if not. */
type Gating = { open: boolean; text: string | null; failed: boolean; retry?: () => void }

function gateFor(q: DrillQuestion, pictures: RunPictures): Gating {
  // A DTK question is read off its page: without one it cannot be answered.
  if (!q.figure && q.section === 'DTK') {
    return { open: false, text: 'Frågan kan inte besvaras utan underlaget.', failed: true }
  }
  const state = (src: string) => needed(pictures, src)
  const page = q.figure?.src
  const options = (q.options ?? []).flatMap((o) => (o.figure ? [o.figure.src] : []))
  if (page && state(page) === 'error') {
    return {
      open: false,
      text: 'Underlaget behövs för att svara.',
      failed: true,
      retry: () => pictures.retry([page]),
    }
  }
  const failed = options.filter((src) => state(src) === 'error').length
  if (failed > 0) {
    return {
      open: false,
      text:
        failed === 1
          ? 'En bild kunde inte laddas.'
          : `${cap(word(failed))} bilder kunde inte laddas.`,
      failed: true,
      retry: () => pictures.retry(options),
    }
  }
  if (page && state(page) !== 'ready') {
    return { open: false, text: 'Väntar på underlaget.', failed: false }
  }
  if (options.some((src) => state(src) !== 'ready')) {
    return { open: false, text: 'Väntar på bilderna.', failed: false }
  }
  return { open: true, text: null, failed: false }
}

/** The questions that share q's page, as their places in the pass. */
function pageBlock(
  questions: readonly DrillQuestion[],
  index: number,
): { from: number; to: number } | null {
  const src = questions[index]?.figure?.src
  if (!src) return null
  let a = index
  let b = index
  while (a > 0 && questions[a - 1].figure?.src === src) a--
  while (b < questions.length - 1 && questions[b + 1].figure?.src === src) b++
  return a === b ? null : { from: a + 1, to: b + 1 }
}

/** Runs of one section, 0-based start, end exclusive. */
function sectionRunsOf(questions: readonly DrillQuestion[]) {
  const runs: { section: Section; start: number; end: number }[] = []
  questions.forEach((q, i) => {
    const last = runs[runs.length - 1]
    if (last && last.section === q.section) last.end = i + 1
    else runs.push({ section: q.section, start: i, end: i + 1 })
  })
  return runs
}

/** Where the run's reference card comes from: the text, the page, or none
 *  (a figure of a quant question lies on the question card itself). */
function referenceOf(q: DrillQuestion): 'passage' | 'page' | null {
  if (q.passage) return 'passage'
  if (q.section === 'DTK' || q.figure?.kind === 'raster') return 'page'
  return null
}

type Sheet = {
  current: number
  answers: Partial<Record<string, AnswerLetter>>
  flags: ReadonlySet<string>
}

export function SvepPassRun({
  width,
  live,
  onAbandon,
}: {
  width: WidthKey
  live: boolean
  /** Avsluta, confirmed: the pass is void and the hub comes back. */
  onAbandon: () => void
}) {
  const { data, actions } = useDirectionData()
  const running = data.provpass.running
  const questions = running.questions
  const total = questions.length
  const phone = width === 'phone'

  // The answer sheet, seeded once from the running view.
  const [sheet, setSheet] = useState<Sheet>(() => ({
    current: running.current,
    answers: { ...running.answers },
    flags: new Set(running.flags ?? running.grid.filter((c) => c.flagged).map((c) => c.qid)),
  }))
  // Flags have no real source: without them in the data there is no flag.
  const flagsKnown =
    running.flags !== undefined || running.grid.some((c) => c.flagged !== undefined)
  // The data can shrink under the run: the position never runs past it.
  const index = total === 0 ? 0 : Math.min(Math.max(0, sheet.current), total - 1)
  const q: DrillQuestion | undefined = questions[index]

  // The clock, decided once when the pass starts: its deadline is fixed
  // then. A provider that counts down itself can only bring it closer (a
  // restored run never gets new minutes); a still one is counted here.
  const [clock] = useState(() => {
    const t0 = Date.now()
    return { t0, deadline: t0 + Math.max(0, running.remainingSeconds) * 1000 }
  })
  const [now, setNow] = useState(clock.t0)
  const [handedIn, setHandedIn] = useState<'manual' | 'time' | null>(null)
  const handed = useRef(false)
  useEffect(() => {
    if (!live || handedIn) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [live, handedIn])
  const counted = Math.max(0, Math.ceil((clock.deadline - now) / 1000))
  const remaining = Math.max(0, Math.min(Math.ceil(running.remainingSeconds), counted))

  const [gate, setGate] = useState<'submit' | 'abandon' | null>(null)
  const [viewer, setViewer] = useState(false)
  const [register, setRegister] = useState(false)
  // The question whose answer was refused while a picture was missing.
  const [refused, setRefused] = useState<string | null>(null)
  const pictures = useRunPictures()
  const lens = useLens(q?.figure?.src)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const regButtonRef = useRef<HTMLButtonElement>(null)
  const regId = useId()

  /** Hands the pass in, once — the clock's end or a confirmed Lämna in. */
  const handIn = useCallback(
    (why: 'manual' | 'time') => {
      if (handed.current) return
      handed.current = true
      setGate(null)
      setViewer(false)
      setRegister(false)
      setHandedIn(why)
      actions.submitProvpass()
    },
    [actions],
  )
  // The end of the time hands the pass in — never voids it.
  const expired = live && remaining <= 0
  useEffect(() => {
    if (expired) handIn('time')
  }, [expired, handIn])

  const abandon = () => {
    if (handed.current) return
    handed.current = true
    setGate(null)
    onAbandon()
  }

  // The run takes the focus when it starts (the gate that started it is gone).
  // biome-ignore lint/correctness/useExhaustiveDependencies: on mount only
  useEffect(() => {
    if (live) titleRef.current?.focus({ preventScroll: true })
  }, [])

  // The clock's thresholds are said once each, never every second.
  const band = remaining <= 60 ? 3 : remaining <= 300 ? 2 : remaining <= 600 ? 1 : 0
  const bandRef = useRef(band)
  const [said, setSaid] = useState('')
  useEffect(() => {
    if (band > bandRef.current) {
      setSaid(
        band === 3 ? 'En minut kvar.' : band === 2 ? 'Fem minuter kvar.' : 'Tio minuter kvar.',
      )
    }
    bandRef.current = band
  }, [band])

  const gating: Gating = q ? gateFor(q, pictures) : { open: false, text: null, failed: false }
  const letters = q?.options?.map((o) => o.letter) ?? []
  const pick = (letter: AnswerLetter) => {
    if (!q || handed.current || !letters.includes(letter)) return
    if (!gating.open) {
      setRefused(q.qid)
      return
    }
    setSheet((s) => ({ ...s, answers: { ...s.answers, [q.qid]: letter } }))
  }
  const go = (i: number) => {
    if (total === 0 || handed.current) return
    const n = Math.min(total - 1, Math.max(0, i))
    setSheet((s) => (s.current === n ? s : { ...s, current: n }))
    setRefused(null)
  }
  const toggleFlag = () => {
    if (!q || handed.current) return
    setSheet((s) => {
      const flags = new Set(s.flags)
      if (flags.has(q.qid)) flags.delete(q.qid)
      else flags.add(q.qid)
      return { ...s, flags }
    })
  }
  const closeViewer = () => {
    setViewer(false)
    window.requestAnimationFrame(() => openRef.current?.focus({ preventScroll: true }))
  }
  const closeRegister = () => {
    setRegister(false)
    window.requestAnimationFrame(() => regButtonRef.current?.focus({ preventScroll: true }))
  }
  const modal = gate != null || viewer || register

  // Keys while the pass runs. The bake-off's own keys (the digits, 0 and
  // ←/→) never leave it, whatever has the focus: the digits do nothing, the
  // arrows move between questions. Inside the text, a page or a dialog the
  // arrows are that region's (data-rd-keyscope): the text scrolls, a page
  // pans. The question's own letters answer, from the text too; Enter is
  // never a shortcut forward, and Esc never leaves.
  const keys = useRef({ pick, go, index, letters, modal, done: false })
  keys.current = { pick, go, index, letters, modal, done: handedIn != null }
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const k = keys.current
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        return
      }
      const t = e.target
      const scope = t instanceof Element ? t.closest('dialog[open], [data-rd-keyscope]') : null
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (scope) return
        e.preventDefault()
        if (!k.modal && !k.done) k.go(k.index + (e.key === 'ArrowRight' ? 1 : -1))
        return
      }
      // The text owns only its arrows: a reader who clicked into it still
      // answers on the letters.
      const owned = scope != null && scope.closest('.sv-run-text') == null
      if (owned || k.modal || k.done || isForeignKey(e) || e.key.length !== 1) return
      const letter = e.key.toUpperCase() as AnswerLetter
      if (!k.letters.includes(letter)) return
      e.preventDefault()
      k.pick(letter)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live])

  const answered = questions.filter((x) => sheet.answers[x.qid] != null).length
  const firstOpen = questions.findIndex((x) => sheet.answers[x.qid] == null)
  const unanswered = total - answered
  const minutes = Math.round(running.durationSeconds / 60)
  const name = `${HALF_SHORT[running.half]} · ${running.sitting} · ${running.pass}`
  const pending =
    handedIn === 'time'
      ? 'Tiden är ute. Provpasset lämnas in.'
      : handedIn === 'manual'
        ? 'Provpasset lämnas in.'
        : ''

  const exit = (
    <ExitButton
      act={{ exit: () => (handed.current ? undefined : setGate('abandon')) }}
      hint="Avbryter du blir provet ogiltigt"
    />
  )
  const timer = <PassTimer seconds={remaining} low={remaining <= 300} />
  const submit = (
    <button
      type="button"
      className="sv-btn sv-btn--quiet sv-run-submit"
      data-testid="rd-prov-submit"
      disabled={handedIn != null}
      onClick={() => setGate('submit')}
    >
      Lämna in
    </button>
  )
  const status = handedIn ? <span className="sv-run-pending">Lämnas in …</span> : null

  const registerNode = (
    <Register
      questions={questions}
      answers={sheet.answers}
      flags={sheet.flags}
      flagsKnown={flagsKnown}
      current={index}
      locked={handedIn != null}
      onJump={(i) => {
        go(i)
        if (phone) closeRegister()
      }}
    />
  )

  let body: ReactNode
  if (!q) {
    body = (
      <div className="sv-done-wrap">
        <section className="sv-card sv-stub" aria-labelledby={`${regId}-none`}>
          <h2 className="sv-stub-title" id={`${regId}-none`}>
            Frågorna kunde inte visas
          </h2>
          <p className="sv-stub-note">
            Klockan går vidare. Lämna in det du har svarat, eller avsluta passet.
          </p>
        </section>
      </div>
    )
  } else {
    const kind = referenceOf(q)
    const reference =
      kind === 'passage' ? (
        <PassPassage key={passageKey(q)} question={q} copy={data.copy} phone={phone} />
      ) : kind === 'page' ? (
        <PassFigureCard
          key={q.figure?.src ?? 'missing'}
          question={q}
          figure={q.figure ?? null}
          block={pageBlock(questions, index)}
          lens={lens}
          phone={phone}
          openRef={openRef}
          onOpen={() => setViewer(true)}
          pictures={pictures}
          onSkip={index + 1 < total ? () => go(index + 1) : null}
        />
      ) : null
    const card = (
      <RunQuestion
        question={q}
        n={index + 1}
        total={total}
        answer={sheet.answers[q.qid] ?? null}
        onPick={pick}
        gating={gating}
        refused={refused === q.qid}
        flag={flagsKnown ? { on: sheet.flags.has(q.qid), toggle: toggleFlag } : null}
        pictures={pictures}
        locked={handedIn != null}
        onPrev={() => go(index - 1)}
        onNext={() => go(index + 1)}
        onHandIn={() => setGate('submit')}
      />
    )
    // The questions still to come show as card edges behind this one.
    const waiting = Math.min(2, total - index - 1)
    const slot = (
      <div className="sv-qslot sv-run-slot" data-waiting={waiting}>
        {Array.from({ length: waiting }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the waiting questions' edges
          <span key={i} className="sv-qedge" data-n={i + 1} aria-hidden />
        ))}
        {card}
      </div>
    )
    body = phone ? (
      <div className="sv-prun-body">
        {reference}
        {card}
      </div>
    ) : (
      <div className={reference ? 'sv-run-pair' : 'sv-run-solo'} data-ref={kind ?? undefined}>
        {reference}
        {slot}
      </div>
    )
  }

  const gates =
    gate === 'submit' ? (
      <Gate
        eyebrow="Lämna in provpasset"
        title={
          unanswered === 0
            ? `Alla ${total} frågor är besvarade.`
            : unanswered === 1
              ? '1 fråga är obesvarad.'
              : `${unanswered} frågor är obesvarade.`
        }
        accept={{
          label: unanswered > 0 ? 'Lämna in ändå' : 'Lämna in',
          onClick: () => handIn('manual'),
        }}
        dismiss={{ label: 'Fortsätt provet', onClick: () => setGate(null) }}
      >
        <p className="sv-gate-sub">
          {fmtClock(remaining)} kvar av {minutes} minuter.
        </p>
        <p className="sv-gate-note">
          När du lämnar in rättas passet, och svaren går inte att ändra efteråt.
        </p>
        {unanswered > 0 && firstOpen !== -1 ? (
          <button
            type="button"
            className="sv-link"
            onClick={() => {
              setGate(null)
              go(firstOpen)
            }}
          >
            Till fråga {firstOpen + 1}, den första obesvarade
          </button>
        ) : null}
      </Gate>
    ) : gate === 'abandon' ? (
      <Gate
        safe
        eyebrow="Avsluta provpasset"
        title="Avbryter du blir provet ogiltigt."
        accept={{ label: 'Avbryt provpasset', onClick: abandon }}
        dismiss={{ label: 'Fortsätt provet', onClick: () => setGate(null) }}
      >
        <p className="sv-gate-note">
          Passet sparas inte som ett resultat. Vill du få det rättat, välj Lämna in i stället.
        </p>
      </Gate>
    ) : null

  const viewerNode =
    viewer && q?.figure ? (
      <PassViewer
        question={q}
        figure={q.figure}
        lens={lens}
        pictures={pictures}
        onClose={closeViewer}
      />
    ) : null

  const announce = (
    <p className="sv-sr" aria-live="polite">
      {pending || said}
    </p>
  )

  if (phone) {
    return (
      <>
        <div className="sv-prun" data-testid="rd-prov-running" inert={modal}>
          <header className="sv-pdhead sv-prun-head">
            {exit}
            <span className="sv-pdhead-pos">
              <span aria-hidden>
                {total ? index + 1 : 0}/{total}
              </span>
              <span className="sv-sr">
                Fråga {total ? index + 1 : 0} av {total}
              </span>
            </span>
            {timer}
            {submit}
          </header>
          <h1 className="sv-prun-title" ref={titleRef} tabIndex={-1}>
            {name}
            {status}
          </h1>
          {body}
          <footer className="sv-prun-foot">
            <button
              type="button"
              className="sv-prun-regbtn"
              ref={regButtonRef}
              aria-expanded={register}
              aria-controls={regId}
              onClick={() => setRegister(true)}
            >
              <QuestionHand questions={questions} answers={sheet.answers} current={index} />
              <span>
                <b>Frågeregister</b> · {answered} av {total} besvarade
              </span>
            </button>
          </footer>
        </div>
        <RegisterSheet id={regId} open={register} onClose={closeRegister}>
          {registerNode}
        </RegisterSheet>
        {viewerNode}
        {gates}
        {announce}
      </>
    )
  }

  return (
    <>
      <div className="sv-run" data-testid="rd-prov-running" inert={modal}>
        <header className="sv-run-top">
          {exit}
          <h1 className="sv-run-title" ref={titleRef} tabIndex={-1}>
            {name}
          </h1>
          <div className="sv-run-status">
            {status}
            {timer}
            {submit}
          </div>
        </header>
        <div className="sv-run-body">
          <div className="sv-run-main">{body}</div>
          <aside className="sv-run-end" aria-label="Passet">
            {registerNode}
          </aside>
        </div>
      </div>
      {viewerNode}
      {gates}
      {announce}
    </>
  )
}

/** The clock: time left, steady (it is not read out every second). Under
 *  five minutes it turns to ink, never red. */
function PassTimer({ seconds, low }: { seconds: number; low: boolean }) {
  return (
    <span
      className="sv-timer sv-timer--left"
      role="timer"
      data-testid="rd-prov-timer"
      data-low={low ? 'true' : undefined}
      aria-label={`Tid kvar ${fmtClock(seconds)}`}
    >
      <Clock size={15} strokeWidth={2} aria-hidden />
      <span aria-hidden>{fmtClock(seconds)}</span>
      <span className="sv-timer-unit" aria-hidden>
        kvar
      </span>
    </span>
  )
}

/** The pass as a thin hand on the phone's register button: answered face
 *  down, the current one standing. */
function QuestionHand({
  questions,
  answers,
  current,
}: {
  questions: readonly DrillQuestion[]
  answers: Partial<Record<string, AnswerLetter>>
  current: number
}) {
  return (
    <span className="sv-qhand" aria-hidden>
      {questions.map((q, i) => (
        <i
          key={q.qid}
          data-state={i === current ? 'now' : answers[q.qid] != null ? 'done' : 'todo'}
        />
      ))}
    </span>
  )
}

/** The question card of a pass: the problem, the choices and the way on.
 *  A choice is the answer; there is no Svara and no facit. */
function RunQuestion({
  question: q,
  n,
  total,
  answer,
  onPick,
  gating,
  refused,
  flag,
  pictures,
  locked,
  onPrev,
  onNext,
  onHandIn,
}: {
  question: DrillQuestion
  n: number
  total: number
  answer: AnswerLetter | null
  onPick: (letter: AnswerLetter) => void
  gating: Gating
  /** An answer was just refused: say why. */
  refused: boolean
  flag: { on: boolean; toggle: () => void } | null
  pictures: RunPictures
  /** Handed in: nothing changes any more. */
  locked: boolean
  onPrev: () => void
  onNext: () => void
  onHandIn: () => void
}) {
  const titleId = useId()
  const last = n >= total
  const quant =
    q.section === 'XYZ' || q.section === 'KVA' || q.section === 'NOG' || q.section === 'DTK'
  const wait = gating.open ? null : gating.failed || refused ? gating.text : null
  const echo = wait
    ? wait
    : answer
      ? `Svar ${answer}. Du kan ändra det tills tiden går ut.`
      : 'Inget svar än.'
  const svg = q.figure && referenceOf(q) == null ? q.figure : null
  return (
    <section
      className="sv-card sv-qcard sv-pq"
      aria-labelledby={titleId}
      data-quant={quant ? q.section : undefined}
    >
      <div className="sv-qcard-scroll">
        <div className="sv-qhead">
          <SecChip section={q.section} />
          <h2 className="sv-qlabel" id={titleId}>
            Fråga {n} <span>av {total}</span>
          </h2>
          {flag ? (
            <button
              type="button"
              className="sv-chip sv-flag"
              data-testid="rd-prov-flag"
              aria-pressed={flag.on}
              disabled={locked}
              onClick={flag.toggle}
            >
              <Flag size={15} strokeWidth={2} aria-hidden />
              {flag.on ? 'Markerad' : 'Markera'}
            </button>
          ) : null}
        </div>
        {svg ? <InlineFigure question={q} figure={svg} pictures={pictures} /> : null}
        <PassPrompt question={q} />
        {q.options ? (
          <PassOptions
            question={q}
            answer={answer}
            onPick={onPick}
            gated={!gating.open}
            locked={locked}
            pictures={pictures}
          />
        ) : (
          <p className="sv-qmissing">Frågan saknar svarsalternativ just nu.</p>
        )}
      </div>
      <div className="sv-pq-foot">
        <p className="sv-echo" data-wait={wait ? 'true' : undefined} aria-live="polite">
          {echo}
          {wait && gating.retry && !locked ? (
            <>
              {' '}
              <button type="button" className="sv-link" onClick={gating.retry}>
                Försök igen
              </button>
            </>
          ) : null}
        </p>
        <div className="sv-pq-nav">
          <button
            type="button"
            className="sv-btn sv-btn--quiet"
            aria-disabled={n <= 1 || locked}
            onClick={n <= 1 || locked ? undefined : onPrev}
          >
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            Föregående
          </button>
          {last ? (
            <button
              type="button"
              className="sv-btn sv-btn--primary"
              disabled={locked}
              onClick={onHandIn}
            >
              Lämna in
            </button>
          ) : (
            <button
              type="button"
              className="sv-btn sv-btn--primary"
              disabled={locked}
              onClick={onNext}
            >
              Nästa fråga
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/** The prompt as its section sets it, verbatim with its math rendered:
 *  KVA's condition above Kvantitet I and II, NOG's stem, statements and
 *  coda, an ELF item in English (a gap item framed in Swedish), anything
 *  else as one prompt. A prompt that does not split is shown whole. */
function PassPrompt({ question }: { question: DrillQuestion }) {
  const prompt = question.prompt ?? ''
  if (question.section === 'KVA') {
    const split = splitKvaPrompt(prompt)
    if (split) {
      return (
        <div className="sv-qprompt sv-kva">
          {split.condition ? (
            <p className="sv-kva-cond" data-prose={String(isProseCondition(split.condition))}>
              <MathText>{split.condition}</MathText>
            </p>
          ) : null}
          <div className="sv-kva-pair">
            <p className="sv-kva-q">
              <span className="sv-kva-label">Kvantitet I</span>
              <span className="sv-kva-expr">
                <MathText>{split.kvI}</MathText>
              </span>
            </p>
            <p className="sv-kva-q">
              <span className="sv-kva-label">Kvantitet II</span>
              <span className="sv-kva-expr">
                <MathText>{split.kvII}</MathText>
              </span>
            </p>
          </div>
        </div>
      )
    }
  }
  if (question.section === 'NOG') {
    const parts = parseNogPrompt(prompt)
    if (parts) {
      return (
        <div className="sv-qprompt sv-nog">
          <p className="sv-prompt">
            <MathText>{parts.question}</MathText>
          </p>
          <ol className="sv-nog-list">
            <li className="sv-nog-st">
              <span className="sv-nog-n" aria-hidden>
                (1)
              </span>
              <span className="sv-sr">Påstående 1: </span>
              <span className="sv-nog-text">
                <MathText>{parts.statement1}</MathText>
              </span>
            </li>
            <li className="sv-nog-st">
              <span className="sv-nog-n" aria-hidden>
                (2)
              </span>
              <span className="sv-sr">Påstående 2: </span>
              <span className="sv-nog-text">
                <MathText>{parts.statement2}</MathText>
              </span>
            </li>
          </ol>
          {parts.tail ? <p className="sv-nog-tail">{parts.tail}</p> : null}
        </div>
      )
    }
  }
  if (!prompt) {
    // An ELF gap item: its number in Swedish, the gap itself in the text.
    return question.section === 'ELF' ? (
      <div className="sv-qprompt">
        <p className="sv-prompt">Lucka {question.number}</p>
      </div>
    ) : null
  }
  return (
    <div className="sv-qprompt">
      <p className="sv-prompt" lang={question.section === 'ELF' ? 'en' : undefined}>
        <MathText>{prompt}</MathText>
      </p>
    </div>
  )
}

/** The choices as slips of card stock. Choosing one is the answer, and it
 *  can be changed; nothing is struck or graded in a pass. */
function PassOptions({
  question: q,
  answer,
  onPick,
  gated,
  locked,
  pictures,
}: {
  question: DrillQuestion
  answer: AnswerLetter | null
  onPick: (letter: AnswerLetter) => void
  /** A picture the question needs is not on screen: a press says why. */
  gated: boolean
  locked: boolean
  pictures: RunPictures
}) {
  const english = q.section === 'ELF'
  return (
    <ol className="sv-opts" aria-label="Svarsalternativ">
      {(q.options ?? []).map((o) => {
        const on = answer === o.letter
        return (
          <li
            key={o.letter}
            className="sv-opt sv-opt--exam"
            data-state={on ? 'selected' : undefined}
            data-figure={o.figure ? 'true' : undefined}
          >
            <button
              type="button"
              className="sv-opt-main"
              data-testid={`rd-prov-option-${o.letter}`}
              aria-pressed={on}
              aria-disabled={gated || locked || undefined}
              onClick={locked ? undefined : () => onPick(o.letter)}
            >
              <span className="sv-opt-key" aria-hidden>
                {o.letter}
              </span>
              <span className="sv-opt-text" lang={english ? 'en' : undefined}>
                <span className="sv-sr" lang="sv">
                  Alternativ {o.letter}:{' '}
                </span>
                <OptionFace option={o} pictures={pictures} />
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function OptionFace({ option, pictures }: { option: DrillOption; pictures: RunPictures }) {
  const f = option.figure
  if (!f) return <MathText>{option.text}</MathText>
  return <OptionPicture figure={f} alt={f.alt || option.text} pictures={pictures} />
}

/** A picture option's picture: a place of its own. */
function OptionPicture({
  figure: f,
  alt,
  pictures,
}: {
  figure: NonNullable<DrillOption['figure']>
  alt: string
  pictures: RunPictures
}) {
  const shown = usePicture(pictures, f.src)
  if (shown.state === 'error') {
    return <span className="sv-opt-img-failed">Bilden kunde inte laddas.</span>
  }
  return (
    <Picture
      key={shown.key}
      shown={shown}
      className="sv-opt-img"
      src={f.src}
      alt={alt}
      width={f.width}
      height={f.height}
    />
  )
}

/** A quant question's own figure, on the question card's light sheet. */
function InlineFigure({
  question,
  figure,
  pictures,
}: {
  question: DrillQuestion
  figure: DrillFigure
  pictures: RunPictures
}) {
  const shown = usePicture(pictures, figure.src)
  const failed = shown.state === 'error'
  return (
    <div
      className="sv-pq-figure"
      style={{ '--sv-fig-ratio': figure.width / figure.height } as CSSProperties}
    >
      {failed ? (
        <div className="sv-fig-failed" role="alert">
          <p>Figuren till uppgift {question.number} kunde inte laddas.</p>
          <button
            type="button"
            className="sv-btn sv-btn--tonal"
            onClick={() => pictures.retry([figure.src])}
          >
            Försök igen
          </button>
        </div>
      ) : (
        <Picture
          key={shown.key}
          shown={shown}
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
        />
      )}
    </div>
  )
}

/** A text's identity: its questions share one card, a new text a new one. */
function passageKey(q: DrillQuestion): string {
  const p = q.passage
  return p?.unitId ?? p?.title ?? p?.paragraphs[0]?.slice(0, 48) ?? q.qid
}

/** The text of a reading question as the tall reference card, in its own
 *  language, with its ¶ numbers in the margin. Practice texts carry their
 *  badge and the note on demand. */
function PassPassage({
  question: q,
  copy,
  phone,
}: {
  question: DrillQuestion
  copy: { ovningstextBadge: string; ovningstextNote: string }
  phone: boolean
}) {
  const titleId = useId()
  const noteId = useId()
  const [note, setNote] = useState(false)
  const p = q.passage
  if (!p) return null
  return (
    <div className="sv-card sv-pcard sv-run-text" data-phone={phone ? 'true' : undefined}>
      {/* The text scrolls on its own and owns its arrows (data-rd-keyscope):
       *  inside it they scroll it, and neither the run nor the switcher
       *  takes them. */}
      <section
        className="sv-pcard-scroll"
        aria-labelledby={titleId}
        data-rd-keyscope
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must take the keyboard (WCAG 2.1.1)
        tabIndex={0}
      >
        <div className="sv-pcard-head">
          <SecChip section={q.section} />
          {p.synthetic ? (
            <>
              <span className="sv-badge">{copy.ovningstextBadge}</span>
              <button
                type="button"
                className="sv-chip"
                aria-expanded={note}
                aria-controls={noteId}
                onClick={() => setNote(!note)}
              >
                <Info size={15} strokeWidth={2} aria-hidden />
                {note ? 'Dölj' : 'Om texten'}
              </button>
            </>
          ) : null}
        </div>
        {p.synthetic ? (
          <p className="sv-note" id={noteId} hidden={!note}>
            {copy.ovningstextNote}
          </p>
        ) : null}
        <h2 className="sv-ptitle" id={titleId} lang={p.title ? p.lang : undefined}>
          {p.title ?? q.source.label}
        </h2>
        <div className="sv-pbody" lang={p.lang}>
          {p.paragraphs.map((text, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a passage's paragraphs in their fixed order
            <p key={i} className="sv-para">
              <span className="sv-pnum" aria-hidden>
                {i + 1}
              </span>
              {text}
            </p>
          ))}
          {p.byline ? <p className="sv-byline">{p.byline}</p> : null}
        </div>
      </section>
    </div>
  )
}

// ── The page ─────────────────────────────────────────────────────────

/** The zoom steps: 1 fits the whole page in its card. */
const ZOOMS = [1, 1.5, 2, 3]

/** How far one press of an arrow pans the page (px). */
const PAN_STEP = 48

const PAN: Partial<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

/** An arrow pans the page's region one step, instantly (quick presses add
 *  up), and is marked used. True when it was an arrow. */
function panKey(e: ReactKeyboardEvent<Element>, box: HTMLElement | null): boolean {
  const step = PAN[e.key]
  if (!step || isForeignKey(e.nativeEvent)) return false
  e.preventDefault()
  if (box && typeof box.scrollBy === 'function') {
    box.scrollBy({ left: step[0] * PAN_STEP, top: step[1] * PAN_STEP, behavior: 'auto' })
  }
  return true
}

type Lens = {
  zoom: number
  /** Quarter turns clockwise, 0–3. */
  turn: number
  zoomIn: () => void
  zoomOut: () => void
  rotate: () => void
  fit: () => void
}

/** How the page is shown. A question on the same page keeps the lens; a
 *  new page starts fitted and upright. */
function useLens(src: string | undefined): Lens {
  const [lens, setLens] = useState({ src, zoom: 1, turn: 0 })
  if (lens.src !== src) setLens({ src, zoom: 1, turn: 0 })
  const step = (d: 1 | -1) =>
    setLens((l) => {
      const at = Math.max(0, ZOOMS.indexOf(l.zoom))
      return { ...l, zoom: ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, at + d))] }
    })
  return {
    zoom: lens.zoom,
    turn: lens.turn,
    zoomIn: () => step(1),
    zoomOut: () => step(-1),
    rotate: () => setLens((l) => ({ ...l, turn: (l.turn + 1) % 4 })),
    fit: () => setLens((l) => ({ ...l, zoom: 1, turn: 0 })),
  }
}

/** The page on its light sheet in a region that scrolls when zoomed. The
 *  region owns its arrows (data-rd-keyscope): they pan it. `need`: whether
 *  the question is answered from this page (the enlarged one is not). */
function PageSheet({
  figure,
  lens,
  label,
  pictures,
  boxRef,
  need = true,
}: {
  figure: DrillFigure
  lens: Lens
  label: string
  pictures: RunPictures
  boxRef?: { current: HTMLElement | null }
  need?: boolean
}) {
  const ratio = figure.width / figure.height
  const turned = lens.turn % 2 === 1
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || lens.zoom === 1) return
    const box = e.currentTarget
    drag.current = { x: e.clientX, y: e.clientY, left: box.scrollLeft, top: box.scrollTop }
    box.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    e.currentTarget.scrollLeft = d.left - (e.clientX - d.x)
    e.currentTarget.scrollTop = d.top - (e.clientY - d.y)
  }
  const end = () => {
    drag.current = null
  }
  const shown = usePicture(pictures, figure.src, need)
  const failed = shown.state === 'error'
  return (
    <section
      ref={boxRef}
      className="sv-fig-scroll"
      aria-label={label}
      data-zoom={lens.zoom === 1 ? 'fit' : 'in'}
      data-rd-keyscope
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must take the keyboard (WCAG 2.1.1)
      tabIndex={0}
      onKeyDown={(e) => panKey(e, e.currentTarget)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {failed ? (
        <div className="sv-fig-failed" role="alert">
          <p>Underlaget kunde inte laddas.</p>
          <button
            type="button"
            className="sv-btn sv-btn--tonal"
            onClick={() => pictures.retry([figure.src])}
          >
            Försök igen
          </button>
        </div>
      ) : (
        <div
          className="sv-fig-page"
          data-turned={String(turned)}
          style={
            {
              '--sv-fig-r': turned ? 1 / ratio : ratio,
              '--sv-fig-ratio': ratio,
              '--sv-fig-zoom': lens.zoom,
              '--sv-fig-rot': `${lens.turn * 90}deg`,
            } as CSSProperties
          }
        >
          <Picture
            key={shown.key}
            shown={shown}
            src={figure.src}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
          />
        </div>
      )}
    </section>
  )
}

/** The lens: zoom, turn, fit and enlarge — quiet, never a filled action. */
function LensTools({
  lens,
  onOpen,
  openRef,
  compact,
}: {
  lens: Lens
  onOpen?: () => void
  openRef?: { current: HTMLButtonElement | null }
  compact?: boolean
}) {
  const changed = lens.zoom !== 1 || lens.turn !== 0
  return (
    <div className="sv-lens">
      <button
        type="button"
        className="sv-lens-btn"
        aria-label="Zooma ut"
        disabled={lens.zoom === ZOOMS[0]}
        onClick={lens.zoomOut}
      >
        <Minus size={17} strokeWidth={2} aria-hidden />
      </button>
      <output className="sv-lens-zoom" aria-live="polite">
        {lens.zoom === 1 ? 'Hela sidan' : `${Math.round(lens.zoom * 100)} %`}
      </output>
      <button
        type="button"
        className="sv-lens-btn"
        aria-label="Zooma in"
        disabled={lens.zoom === ZOOMS[ZOOMS.length - 1]}
        onClick={lens.zoomIn}
      >
        <Plus size={17} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className="sv-lens-btn"
        aria-label="Vrid ett kvarts varv"
        title="Vrid ett kvarts varv"
        onClick={lens.rotate}
      >
        <RotateCw size={17} strokeWidth={2} aria-hidden />
        {compact ? null : <span>Vrid</span>}
      </button>
      {changed ? (
        <button
          type="button"
          className="sv-lens-btn"
          aria-label={compact ? 'Anpassa: hela sidan, rak' : undefined}
          title="Anpassa: hela sidan, rak"
          onClick={lens.fit}
        >
          {compact ? <Minimize2 size={16} strokeWidth={2} aria-hidden /> : <span>Anpassa</span>}
        </button>
      ) : null}
      {onOpen ? (
        <button
          type="button"
          className="sv-lens-btn sv-lens-btn--open"
          ref={openRef}
          aria-label={compact ? 'Förstora underlaget' : undefined}
          onClick={onOpen}
        >
          <Maximize2 size={16} strokeWidth={2} aria-hidden />
          {compact ? null : <span>Förstora</span>}
        </button>
      ) : null}
    </div>
  )
}

/** A DTK question's page as the tall reference card, named by the questions
 *  that share it. Without a page: said plainly, with the way on. */
function PassFigureCard({
  question,
  figure,
  block,
  lens,
  phone,
  openRef,
  onOpen,
  pictures,
  onSkip,
}: {
  question: DrillQuestion
  figure: DrillFigure | null
  block: { from: number; to: number } | null
  lens: Lens
  phone: boolean
  openRef: { current: HTMLButtonElement | null }
  onOpen: () => void
  pictures: RunPictures
  /** To the next question (none on the last). */
  onSkip: (() => void) | null
}) {
  return (
    <div className="sv-card sv-fcard sv-run-page">
      <div className="sv-fcard-head">
        <SecChip section={question.section} />
        {/* The pass's name is on the bar above: the page names the
         *  questions it serves instead. */}
        <h2 className="sv-fcard-title">
          Underlag
          {block ? (
            <span className="sv-fcard-block">
              {' '}
              · frågorna {block.from}–{block.to}
            </span>
          ) : null}
        </h2>
        {phone && figure ? (
          <LensTools lens={lens} onOpen={onOpen} openRef={openRef} compact />
        ) : null}
      </div>
      {figure ? (
        <PageSheet
          figure={figure}
          lens={lens}
          label={`Underlaget till uppgift ${question.number}`}
          pictures={pictures}
        />
      ) : (
        <div className="sv-fig-scroll" data-zoom="fit">
          <div className="sv-fig-failed">
            <p>Underlaget saknas just nu.</p>
            {onSkip ? (
              <button type="button" className="sv-btn sv-btn--tonal" onClick={onSkip}>
                Till nästa fråga
              </button>
            ) : null}
          </div>
        </div>
      )}
      {phone || !figure ? null : (
        <div className="sv-fcard-foot">
          <LensTools lens={lens} onOpen={onOpen} openRef={openRef} />
        </div>
      )}
    </div>
  )
}

/** The page enlarged over the whole stage: a labelled dialog that keeps the
 *  focus inside. Esc closes it (it never leaves the pass) and the focus
 *  goes back to Förstora; the arrows pan the page wherever the focus is.
 *  Its page is an image of its own, which the question is not answered
 *  from: loading, loaded or failed, it says so here and only here. */
function PassViewer({
  question,
  figure,
  lens,
  pictures,
  onClose,
}: {
  question: DrillQuestion
  figure: DrillFigure
  lens: Lens
  pictures: RunPictures
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const titleId = useId()
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }
    if (panKey(e, sheetRef.current)) return
    if (e.key !== 'Tab' || !ref.current) return
    const stops = [
      ...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
    ]
    if (stops.length === 0) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  return (
    <div
      className="sv-viewer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-rd-keyscope
      ref={ref}
      onKeyDown={onKeyDown}
    >
      <div className="sv-card sv-viewer-card">
        <div className="sv-viewer-bar">
          <h2 className="sv-viewer-title" id={titleId}>
            Underlaget <span>· uppgift {question.number}</span>
          </h2>
          <LensTools lens={lens} />
          <button
            type="button"
            className="sv-icon-btn sv-viewer-close"
            ref={closeRef}
            aria-label="Stäng förstoringen"
            onClick={onClose}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <PageSheet
          figure={figure}
          lens={lens}
          label={`Underlaget förstorat, uppgift ${question.number}`}
          pictures={pictures}
          boxRef={sheetRef}
          need={false}
        />
      </div>
    </div>
  )
}

// ── The register ─────────────────────────────────────────────────────

/** The pass's indexed hand: every question as a small card, grouped by its
 *  section — face down once answered, the current one standing, a flagged
 *  one marked. A press opens that question; nothing here grades. */
function Register({
  questions,
  answers,
  flags,
  flagsKnown,
  current,
  locked,
  onJump,
}: {
  questions: readonly DrillQuestion[]
  answers: Partial<Record<string, AnswerLetter>>
  flags: ReadonlySet<string>
  flagsKnown: boolean
  current: number
  locked: boolean
  onJump: (index: number) => void
}) {
  const answered = questions.filter((q) => answers[q.qid] != null).length
  return (
    <nav className="sv-reg" aria-label="Frågeregister" data-testid="rd-prov-grid">
      <p className="sv-index-head">
        Frågeregister{' '}
        <span>
          · {answered} av {questions.length} besvarade
        </span>
      </p>
      {sectionRunsOf(questions).map((run) => (
        <div key={`${run.section}-${run.start}`} className="sv-reg-run">
          <h3 className="sv-reg-run-head">
            <span>{run.section}</span> {run.start + 1}–{run.end}
          </h3>
          <ol className="sv-reg-grid">
            {questions.slice(run.start, run.end).map((q, k) => {
              const i = run.start + k
              const done = answers[q.qid] != null
              const flagged = flagsKnown && flags.has(q.qid)
              return (
                <li key={q.qid}>
                  <button
                    type="button"
                    className="sv-reg-cell"
                    data-testid={`rd-prov-cell-${i + 1}`}
                    data-answered={String(done)}
                    data-current={String(i === current)}
                    data-flagged={flagged ? 'true' : undefined}
                    aria-current={i === current ? 'step' : undefined}
                    aria-label={`Fråga ${i + 1}, ${done ? 'besvarad' : 'obesvarad'}${flagged ? ', markerad' : ''}`}
                    aria-disabled={locked || undefined}
                    onClick={locked ? undefined : () => onJump(i)}
                  >
                    <span aria-hidden>{i + 1}</span>
                    {flagged ? <i className="sv-reg-flag" aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
      <p className="sv-reg-legend" aria-hidden>
        <span>
          <i data-k="done" /> Besvarad
        </span>
        <span>
          <i data-k="todo" /> Obesvarad
        </span>
        {flagsKnown ? (
          <span>
            <i data-k="flag" /> Markerad
          </span>
        ) : null}
      </p>
    </nav>
  )
}

/** The phone's register: a sheet dealt over the pass with an explicit
 *  Stäng; Esc closes it and the focus returns to its button. It stays in
 *  the page while closed (hidden), so the register is always there. */
function RegisterSheet({
  id,
  open,
  onClose,
  children,
}: {
  id: string
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (open) closeRef.current?.focus({ preventScroll: true })
  }, [open])
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !ref.current) return
    const stops = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled])')]
    if (stops.length === 0) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  return (
    <div className="sv-regsheet" hidden={!open} data-rd-keyscope>
      <button
        type="button"
        className="sv-gate-scrim"
        tabIndex={-1}
        aria-label="Stäng frågeregistret"
        onClick={onClose}
      />
      <div
        className="sv-card sv-regsheet-card"
        id={id}
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-labelledby={titleId}
        ref={ref}
        onKeyDown={onKeyDown}
      >
        <div className="sv-regsheet-head">
          <h2 className="sv-regsheet-title" id={titleId}>
            Frågorna
          </h2>
          <button
            type="button"
            className="sv-icon-btn"
            ref={closeRef}
            aria-label="Stäng frågeregistret"
            onClick={onClose}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── The result ───────────────────────────────────────────────────────

type ResultCard = DeckCard & { action: (() => void) | null }

/** The section the pass gives evidence to practise: the lowest share right,
 *  at least two misses in it; ties go to more misses, then exam order.
 *  None when nothing was answered. */
export function weakSection(r: ProvResultView): ProvSectionResultView | null {
  if (r.answered === 0) return null
  const order = (s: Section) => SECTION_KEYS.indexOf(s)
  const ranked = r.sections
    .filter((s) => s.presented > 0 && s.presented - s.correct >= 2)
    .sort(
      (a, b) =>
        a.correct / a.presented - b.correct / b.presented ||
        b.presented - b.correct - (a.presented - a.correct) ||
        order(a.section) - order(b.section),
    )
  return ranked[0] ?? null
}

/** The misses by section, as their places in the pass ("XYZ 2 · 5 · 9"). */
function missedBySection(qids: readonly string[]): { section: Section; numbers: number[] }[] {
  const by = new Map<Section, number[]>()
  for (const qid of qids) {
    const m = /-([A-ZÄ]{3})-(\d+)$/.exec(qid)
    if (!m || !(SECTION_KEYS as readonly string[]).includes(m[1])) continue
    const section = m[1] as Section
    by.set(section, [...(by.get(section) ?? []), Number(m[2])])
  }
  return SECTION_KEYS.filter((s) => by.has(s)).map((s) => ({
    section: s,
    numbers: [...(by.get(s) ?? [])].sort((a, b) => a - b),
  }))
}

/** "Riktigt pass" or "Genererat pass". */
const modeLabel = (mode: ProvResultView['mode']) =>
  mode === 'authentic' ? 'Riktigt pass' : 'Genererat pass'

/** How the score was read: from the sitting's table, or a straight line. */
function derivation(r: ProvResultView): string {
  return r.score.derived === 'official-derived'
    ? 'Härlett ur UHR:s normeringstabell för detta provtillfälle. UHR normerar hela delprovet (80 frågor) — ett provpass på 40 frågor har ingen officiell tabell, så poängen skalas upp och läses av tabellen.'
    : 'Linjär skattning — indikativ, inte UHR-normerad.'
}

export function SvepResult({
  width,
  live,
  nav,
}: {
  width: WidthKey
  live: boolean
  nav: FrameNav
}) {
  const { data, actions } = useDirectionData()
  const r = data.provpass.result
  const half = data.provpass.hub.halves.find((h) => h.half === r.half)
  const phone = width === 'phone'
  const caveatId = useId()
  const cards = useMemo(
    () => resultCards({ r, half, caveatId, actions, nav }),
    [r, half, caveatId, actions, nav],
  )
  // Another result opens on its own outcome.
  const deck = useDeck(cards, r.id)
  const front = cards[deck.index]
  useDeckKeys(deck, front?.action ?? null, live)

  const stage = (
    <DeckStage
      deck={deck}
      cards={cards}
      label={`Resultatet, ${cards.length} kort`}
      kind="res"
      live={live}
    />
  )
  const where = [r.sitting, r.pass].filter(Boolean).join(' · ')
  const eyebrow = `${HALF_SHORT[r.half]} · ${modeLabel(r.mode)}`
  const back = (
    <button type="button" className="sv-link sv-rep-back" onClick={() => nav.go('provpass')}>
      <ArrowLeft size={16} strokeWidth={2} aria-hidden />
      Till Provpass
    </button>
  )

  if (phone) {
    return (
      <div className="sv-ptri sv-pres">
        <header className="sv-ptri-head">
          <p className="sv-date">
            {eyebrow}
            {where ? ` · ${where}` : ''}
          </p>
          <h1 className="sv-greet">Provpasset klart</h1>
        </header>
        <div className="sv-ptri-deck">{stage}</div>
        <div className="sv-phome-foot">
          <DeckCounter deck={deck} cards={cards} arrows={false} />
          <DeckTicks deck={deck} cards={cards} label="Resultatets kort" />
        </div>
        {back}
      </div>
    )
  }

  return (
    <div className="sv-tri sv-res">
      <aside className="sv-tri-side" aria-label="Provpassresultat">
        <p className="sv-date">{eyebrow}</p>
        <h1 className="sv-greet">Provpasset klart.</h1>
        <p className="sv-day">
          {where ? `${where}. ` : ''}Utfallet först, sedan ett kort i taget om var poängen kom
          ifrån.
        </p>
        {back}
      </aside>
      <div className="sv-home-deck">
        {stage}
        <DeckCounter deck={deck} cards={cards} />
        <p className="sv-deck-hint">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> bläddrar
          {front?.action ? (
            <>
              {' '}
              · <Kbd>↵</Kbd> tar kortet
            </>
          ) : null}
        </p>
      </div>
      <div className="sv-tri-end">
        <DeckRegister
          deck={deck}
          cards={cards}
          label="Resultatets kort"
          head={
            <>
              Resultatet <span>· {cards.length} kort</span>
            </>
          }
        />
      </div>
    </div>
  )
}

function resultCards({
  r,
  half,
  caveatId,
  actions,
  nav,
}: {
  r: ProvResultView
  half: ProvHalfView | undefined
  caveatId: string
  actions: DirectionActions
  nav: FrameNav
}): ResultCard[] {
  const weak = weakSection(r)
  // One next step: the section the pass shows most to win in, else Framsteg.
  const primary = weak
    ? {
        label: `Öva ${weak.section}`,
        onClick: () => actions.startDrill({ kind: 'section', section: weak.section }),
      }
    : { label: 'Till Framsteg', onClick: () => nav.go('framsteg') }
  const out: ResultCard[] = [
    {
      id: 'oversikt',
      label: 'Översikt',
      tint: 'none',
      meta: `${r.correct}/${r.presented}`,
      action: primary.onClick,
      body: <OverviewCard r={r} half={half} caveatId={caveatId} primary={primary} weak={weak} />,
    },
  ]
  const sections = [...r.sections].sort(
    (a, b) => SECTION_KEYS.indexOf(a.section) - SECTION_KEYS.indexOf(b.section),
  )
  if (sections.length) {
    out.push({
      id: 'delprov',
      label: 'Per delprov',
      tint: 'none',
      meta: `${sections.length} delprov`,
      action: null,
      body: <SectionsCard r={r} sections={sections} />,
    })
  }
  if (sections.some((s) => s.timeSeconds > 0)) {
    out.push({
      id: 'tempo',
      label: 'Tempo',
      tint: 'none',
      meta: fmtClock(r.durationSeconds),
      action: null,
      body: <TempoCard r={r} sections={sections} />,
    })
  }
  const trap = r.trap ?? null
  if (r.missed.length > 0 || trap) {
    const practise = trap
      ? () =>
          actions.startDrill({
            kind: 'framework',
            frameworkId: trap.frameworkId,
            section: trap.section,
          })
      : null
    out.push({
      id: 'missar',
      label: 'Missarna',
      tint: 'none',
      meta: `${r.missed.length}`,
      action: practise,
      body: <MissesCard r={r} onPractise={practise} />,
    })
  }
  if (r.history.length) {
    out.push({
      id: 'tidigare',
      label: 'Tidigare pass',
      tint: 'none',
      meta: `${r.history.length} pass`,
      action: null,
      body: <HistoryCard r={r} onOpen={nav.openResult} />,
    })
  }
  return out
}

function OverviewCard({
  r,
  half,
  caveatId,
  primary,
  weak,
}: {
  r: ProvResultView
  half: ProvHalfView | undefined
  caveatId: string
  primary: { label: string; onClick: () => void }
  /** The section the next step practises, with its evidence. */
  weak: ProvSectionResultView | null
}) {
  const unanswered = Math.max(0, r.presented - r.answered)
  const missing = Math.max(0, (half?.questions ?? r.presented) - r.presented)
  const where = [r.sitting, r.pass].filter(Boolean).join(' · ')
  const limit = half ? half.minutes * 60 : PASS_MINUTES * 60
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-sec" data-sec="none">
          {HALF_SHORT[r.half]}
        </span>
        <span className="sv-hc-eyebrow">
          {modeLabel(r.mode)}
          {where ? ` · ${where}` : ''}
        </span>
      </div>
      <div className="sv-hc-body">
        <p className="sv-res-raw" data-testid="rd-prov-result">
          <span className="sv-res-n">{r.correct}</span>
          <span className="sv-res-of">av {r.presented} rätt</span>
        </p>
        <p className="sv-res-line">
          {r.answered === 0
            ? 'Inga svar lämnades in i passet.'
            : unanswered > 0
              ? `${r.answered} besvarade · ${unanswered} obesvarade`
              : `Alla ${r.presented} besvarade`}
        </p>
        {missing > 0 ? (
          <p className="sv-res-line">
            {missing} {missing === 1 ? 'fråga saknas' : 'frågor saknas'} ur detta pass — rättat av{' '}
            {r.presented}.
          </p>
        ) : null}
        {r.score.value != null ? (
          <div className="sv-res-score" data-testid="rd-prov-score">
            <p className="sv-res-score-row">
              <span className="sv-res-score-n" aria-describedby={caveatId}>
                {fmtNormed(r.score.value)}
              </span>
              <span className="sv-res-score-label">{r.score.label} · av 2,00</span>
            </p>
            <p className="sv-caveat" id={caveatId}>
              <span>{derivation(r)}</span>
            </p>
          </div>
        ) : null}
        <p className="sv-res-facts">
          Du hade sett {r.seenBefore} av {r.presented} frågor innan. Passet tog{' '}
          {fmtClock(r.durationSeconds)} av {fmtClock(limit)}.
        </p>
      </div>
      {weak ? (
        <p className="sv-hc-why">
          Mest att hämta i {weak.section}: {weak.correct} av {weak.presented} rätt.
        </p>
      ) : null}
      <div className="sv-hc-foot">
        <button
          type="button"
          className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
          onClick={primary.onClick}
        >
          {primary.label}
          <Kbd>↵</Kbd>
        </button>
      </div>
    </>
  )
}

function SectionsCard({ r, sections }: { r: ProvResultView; sections: ProvSectionResultView[] }) {
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Per delprov</span>
        <span className="sv-hc-meta">
          {r.correct} av {r.presented} rätt
        </span>
      </div>
      <div className="sv-hc-body sv-hc-body--list">
        <h2 className="sv-rc-title">Så gick det per delprov</h2>
        <ul className="sv-secbars">
          {sections.map((s) => (
            <li
              key={s.section}
              className="sv-secbar"
              data-testid={`rd-prov-section-${sectionKey(s.section)}`}
            >
              <span className="sv-secbar-code">
                <SecChip section={s.section} />
              </span>
              <span className="sv-secbar-name">{sectionLongLabel(s.section)}</span>
              <span className="sv-secbar-bar" aria-hidden>
                <i style={{ width: `${s.presented > 0 ? (s.correct / s.presented) * 100 : 0}%` }} />
              </span>
              <span className="sv-secbar-n">
                <b>{s.correct}</b> av {s.presented}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

/** "1:00 över" or "2:10 kvar": a section's time against its share. */
function againstShare(used: number, share: number): string {
  const d = used - share
  if (Math.abs(d) < 30) return 'i takt'
  return d > 0 ? `${fmtClock(d)} över` : `${fmtClock(-d)} kvar`
}

function TempoCard({ r, sections }: { r: ProvResultView; sections: ProvSectionResultView[] }) {
  const top = Math.max(1, ...sections.flatMap((s) => [s.timeSeconds, s.quotaSeconds]))
  const limit = sections.reduce((n, s) => n + s.quotaSeconds, 0)
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Tempo · tiden mot delprovets andel</span>
        <span className="sv-hc-meta">{fmtClock(r.durationSeconds)}</span>
      </div>
      <div className="sv-hc-body sv-hc-body--list">
        <h2 className="sv-rc-title">Var tiden tog vägen</h2>
        <ul className="sv-tempo">
          {sections.map((s) => (
            <li key={s.section} className="sv-tempo-row">
              <span className="sv-tempo-code">
                <SecChip section={s.section} />
              </span>
              <span className="sv-tempo-bar" aria-hidden>
                <i style={{ width: `${(s.timeSeconds / top) * 100}%` }} />
                <b style={{ left: `${(s.quotaSeconds / top) * 100}%` }} />
              </span>
              <span className="sv-tempo-n">
                {fmtClock(s.timeSeconds)}
                <span> av {fmtClock(s.quotaSeconds)}</span>
              </span>
              <span className="sv-tempo-d">{againstShare(s.timeSeconds, s.quotaSeconds)}</span>
            </li>
          ))}
        </ul>
        <p className="sv-res-facts">
          Hela passet: {fmtClock(r.durationSeconds)}
          {limit > 0 ? ` av ${fmtClock(limit)}` : ''}. Strecket är delprovets andel av tiden.
        </p>
      </div>
    </>
  )
}

function MissesCard({ r, onPractise }: { r: ProvResultView; onPractise: (() => void) | null }) {
  const groups = missedBySection(r.missed)
  const unanswered = Math.max(0, r.presented - r.answered)
  const trap = r.trap ?? null
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Att öva vidare</span>
        <span className="sv-hc-meta">{r.missed.length}&nbsp;missar</span>
      </div>
      <div className="sv-hc-body sv-hc-body--list">
        <h2 className="sv-rc-title">
          {r.missed.length} {r.missed.length === 1 ? 'fråga' : 'frågor'} fel eller obesvarade
        </h2>
        {unanswered > 0 ? (
          <p className="sv-res-line">Av dem lämnades {unanswered} obesvarade.</p>
        ) : null}
        {trap ? (
          <div className="sv-res-trap">
            <p className="sv-res-trap-k">
              {trap.count} av missarna har samma mönster
              {trap.headline ? ':' : '.'}
            </p>
            {trap.headline ? <p className="sv-res-trap-h">{trap.headline}</p> : null}
          </div>
        ) : null}
        {groups.length ? (
          <ul className="sv-missed">
            {groups.map((g) => (
              <li key={g.section}>
                <SecChip section={g.section} />
                <span className="sv-sr">, frågorna </span>
                <span className="sv-missed-n">{g.numbers.join(' · ')}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {onPractise ? (
        <div className="sv-hc-foot">
          <button type="button" className="sv-btn sv-btn--tonal sv-btn--block" onClick={onPractise}>
            Öva på mönstret
            <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  )
}

function HistoryCard({ r, onOpen }: { r: ProvResultView; onOpen: (id: string) => void }) {
  const kind = r.mode === 'authentic' ? 'riktiga' : 'genererade'
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">
          Tidigare pass · {HALF_SHORT[r.half].toLowerCase()} · {kind}
        </span>
        <span className="sv-hc-meta">{r.history.length}&nbsp;pass</span>
      </div>
      <div className="sv-hc-body sv-hc-body--list">
        <h2 className="sv-rc-title">Jämfört med förut</h2>
        <div className="sv-res-hist">
          <p className="sv-res-hist-now">
            <span className="sv-recent-name">Det här passet</span>
            <span
              className="sv-recent-bar"
              role="img"
              aria-label={`${r.correct} av ${r.presented} rätt`}
            >
              <i style={{ width: `${r.presented ? (r.correct / r.presented) * 100 : 0}%` }} />
            </span>
            <span className="sv-recent-score" aria-hidden>
              {r.correct}/{r.presented}
            </span>
            <span className="sv-recent-when">
              {r.score.value != null ? fmtNormed(r.score.value) : ''}
            </span>
          </p>
          <ul data-testid="rd-prov-history">
            {r.history.map((h, i) => (
              <li key={h.id} data-testid={`rd-prov-history-item-${i + 1}`}>
                <button type="button" className="sv-res-hist-row" onClick={() => onOpen(h.id)}>
                  <span className="sv-recent-name">
                    {[h.sitting, h.pass].filter(Boolean).join(' · ') || 'Provpass'}
                  </span>
                  <span
                    className="sv-recent-bar"
                    role="img"
                    aria-label={`${h.correct} av ${h.presented} rätt`}
                  >
                    <i style={{ width: `${h.presented ? (h.correct / h.presented) * 100 : 0}%` }} />
                  </span>
                  <span className="sv-recent-score" aria-hidden>
                    {h.correct}/{h.presented}
                  </span>
                  <span className="sv-recent-when">
                    {[h.score != null ? fmtNormed(h.score) : null, h.when]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
