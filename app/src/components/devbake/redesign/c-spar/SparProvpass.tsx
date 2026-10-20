// Spår · Provpass (9) and Provpassresultat (10) — a whole half of the test
// as one stretch of four legs.
//
//   - The hub: "Hela sträckan". The suggested pass is the station, its band
//     the route ribbon (the pass's legs in their sections' hues, labelled
//     with their ranges). The register lists every sitting of the half
//     with its two passes as rings that fill with what you have seen;
//     choosing one makes it the station's pass. "Starta provpasset" grows
//     the station into its rules in place (phone: an edge sheet), and
//     "Starta nu" starts the clock.
//   - The running pass: a focus frame in exam mode, calm enforced. The top
//     bar has "Avbryt" (it voids the pass, so it asks first), the ribbon
//     with a tick where you are, the count, a clock that turns inverse ink
//     at 10 and 5 minutes (never red), the overview and "Lämna in". The
//     question sits in its section's layout with no hint, verdict or
//     facit: choosing is answering, ⚑ marks it. The overview draws the
//     questions as a switchback that turns like a mountain trail. At 0:00
//     the pass hands itself in, once; a pass already at 0:00 when it opens
//     cannot be resumed and hands nothing in. A hand-in the host could not
//     take is never tried again: the pass stays, read-only, says so, and
//     the frame's navigation comes back.
//   - The result: the raw count as the display line, the score on Idag's
//     scale with its basis in words, each leg's count and its time against
//     its share of the 55 minutes, and earlier passes. The result keeps no
//     ordered per-question outcomes, so nothing is said question by
//     question.
//
// Kit v2: the hub, the running pass and the result come from
// useDirectionData().data.provpass, and starting, handing in and opening a
// result go through its actions. The kit has no action that records a
// pass's answers or marks, so a running pass keeps them here.

import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Flag,
  Hourglass,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCw,
  Undo2,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  fmtClock,
  fmtScore,
  isForeignKey,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillOption,
  DrillPassage,
  DrillQuestion,
  Half,
  ProvPassOptionView,
  ProvResultView,
  ProvRunningView,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { flattenMathText, MathText } from '@/components/MathText'
import type { AnswerLetter, Section } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { Options, type OptionsLayout } from './SparDrill'
import {
  cap,
  count,
  inWords,
  Kbd,
  KVANT,
  Mark,
  SparDialog,
  SparNavItems,
  SparPageHead,
  SparScale,
  SparSegmented,
  SparStop,
  type StopState,
  sectionName,
  sectionSlug,
  useInPlace,
  VERBAL,
} from './sparParts'

const HALF_LABEL: Record<Half, string> = { verbal: 'Verbal', kvant: 'Kvantitativ' }
const HALF_SHORT: Record<Half, string> = { verbal: 'Verbal', kvant: 'Kvant' }
/** "Tidigare kvantitativa pass". */
const HALF_ADJ: Record<Half, string> = { verbal: 'verbala', kvant: 'kvantitativa' }
/** A pass is 55 minutes and 40 questions when the data says nothing else. */
const PASS_MINUTES = 55
const PASS_SIZE = 40

/** A pass id in a test id: 'host-2025:kvant1' → 'host-2025-kvant1' (the
 *  contract's passSlug; that module is test-only). */
function passSlug(id: string): string {
  return id.replace(':', '-')
}

// ── Legs and the route ribbon ────────────────────────────────────────

/** One leg of a pass: its section and its questions, 1-based, inclusive. */
type Leg = { section: Section; start: number; end: number }

function legsOf(sections: readonly { section: Section; count: number }[]): Leg[] {
  const out: Leg[] = []
  let at = 1
  for (const s of sections) {
    if (s.count <= 0) continue
    out.push({ section: s.section, start: at, end: at + s.count - 1 })
    at += s.count
  }
  return out
}

/** A run of questions as legs: consecutive questions of one section. */
function legsOfQuestions(questions: readonly DrillQuestion[]): Leg[] {
  const out: Leg[] = []
  questions.forEach((q, i) => {
    const last = out[out.length - 1]
    if (last && last.section === q.section) last.end = i + 1
    else out.push({ section: q.section, start: i + 1, end: i + 1 })
  })
  return out
}

/**
 * The route ribbon: one rounded bar split into a pass's legs, each as long
 * as its questions. On the hub each leg wears its section's hue; in a
 * running pass the legs fill in ink as questions are answered (never
 * green: nothing is graded) and a tick marks where you are. Labels sit
 * under their legs: the code, and on the hub the range. A picture: its
 * name says the legs (and the place) in words.
 */
function RouteRibbon({
  legs,
  half,
  done,
  at,
  labels = 'range',
}: {
  legs: readonly Leg[]
  half: Half
  /** Answered questions per leg, in a running pass. */
  done?: readonly number[]
  /** The question on screen, 1-based. */
  at?: number
  labels?: 'range' | 'code'
}) {
  const name = `${HALF_LABEL[half]}: ${legs
    .map((l, i) => `${l.section} ${i === 0 ? 'fråga ' : ''}${l.start}–${l.end}`)
    .join(', ')}${at != null ? `, du är på fråga ${at}` : ''}`
  return (
    <div className="sp-ribbon" data-run={String(done != null)} role="img" aria-label={name}>
      <span className="sp-ribbon-bar">
        {legs.map((l, i) => {
          const size = l.end - l.start + 1
          const here = at != null && at >= l.start && at <= l.end
          return (
            <span
              key={`${l.section}-${l.start}`}
              className="sp-ribbon-leg"
              data-sec={l.section}
              style={{ flexGrow: size }}
            >
              {done ? (
                <i
                  className="sp-ribbon-fill"
                  style={{ width: `${Math.min(1, (done[i] ?? 0) / size) * 100}%` }}
                />
              ) : null}
              {here && at != null ? (
                <b
                  className="sp-ribbon-tick"
                  style={{ left: `${((at - l.start + 0.5) / size) * 100}%` }}
                />
              ) : null}
            </span>
          )
        })}
      </span>
      <span className="sp-ribbon-labels" aria-hidden>
        {legs.map((l) => (
          <span
            key={`${l.section}-${l.start}`}
            className="sp-ribbon-label"
            data-here={String(at != null && at >= l.start && at <= l.end)}
            style={{ flexGrow: l.end - l.start + 1 }}
          >
            <b>{l.section}</b>
            {labels === 'range' ? (
              <span className="sp-num">
                {l.start}–{l.end}
              </span>
            ) : null}
          </span>
        ))}
      </span>
    </div>
  )
}

/** A pass in the register: a ring as full as the share of its questions
 *  you have met before (Idag's NodeRing, in ink). */
function PassRing({ seen, total }: { seen: number; total: number }) {
  const r = 13
  const c = 2 * Math.PI * r
  const share = total > 0 ? Math.min(1, Math.max(0, seen / total)) : 0
  return (
    <svg className="sp-passring" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <circle className="sp-passring-face" cx="18" cy="18" r="17" />
      <circle className="sp-passring-track" cx="18" cy="18" r={r} />
      {share > 0 ? (
        <circle
          className="sp-passring-value"
          cx="18"
          cy="18"
          r={r}
          strokeDasharray={`${share * c} ${c}`}
          transform="rotate(-90 18 18)"
        />
      ) : null}
    </svg>
  )
}

// ── The hub ──────────────────────────────────────────────────────────

/** A sitting's place in time for "newest first": the year, autumn after
 *  spring, then its provtillfälle and version. Unknown ids sort last. */
function sittingOrder(examId: string): number {
  const m = /^(var|host)-(?:ver(\d+)-)?(\d{4})(?:-(\d+))?$/.exec(examId)
  if (!m) return -1
  return Number(m[3]) * 100 + (m[1] === 'host' ? 50 : 0) + Number(m[4] ?? 0) * 4 + Number(m[2] ?? 0)
}

/** "ingen paus" → "Ingen paus." */
function sentence(rule: string): string {
  const s = cap(rule.trim())
  return /[.!?]$/.test(s) ? s : `${s}.`
}

/** Each rule's glyph, by what it says (the order may change). */
function ruleGlyph(rule: string): ReactNode {
  const r = rule.toLocaleLowerCase('sv-SE')
  if (r.includes('paus')) return <Hourglass size={18} strokeWidth={2.25} />
  if (r.includes('ändra')) return <Undo2 size={18} strokeWidth={2.25} />
  if (r.includes('avbryt')) return <X size={18} strokeWidth={2.5} />
  if (r.includes('obesvarad') || r.includes('avdrag')) return <Check size={18} strokeWidth={2.5} />
  return <span className="sp-prov-rule-dot" />
}

function seenLine(pass: ProvPassOptionView): string {
  if (pass.seenBefore <= 0) return 'Du har inte sett någon av frågorna tidigare.'
  return `Du har sett ${pass.seenBefore} av ${pass.presented} frågor tidigare.`
}

export function SparProvHub({
  width,
  live,
  voided,
  onStart,
}: {
  width: WidthKey
  live: boolean
  /** The last pass was voided ("Avbryt passet"): say so above the station. */
  voided: boolean
  /** "Starta nu": start the pass with this id. */
  onStart: (passId: string) => void
}) {
  const { data, actions } = useDirectionData()
  const hub = data.provpass.hub
  const phone = width === 'phone'
  const id = useId()
  const [half, setHalf] = useState<Half>(hub.half)
  const [chosen, setChosen] = useState<string | null>(null)
  const place = useInPlace()
  const halfView = hub.halves.find((h) => h.half === half) ?? null
  const passes = hub.passes.filter((p) => p.half === half)
  // The station's pass: the one chosen in the register, else the half's
  // suggestion — the suggestion again if the chosen one leaves the list.
  const pass =
    passes.find((p) => p.id === chosen) ?? passes.find((p) => p.suggested) ?? passes[0] ?? null
  const legs = legsOf(halfView?.sections ?? [])
  const minutes = halfView?.minutes ?? PASS_MINUTES
  const size = halfView?.questions ?? PASS_SIZE
  const first = hub.results.length === 0
  const other: Half = half === 'verbal' ? 'kvant' : 'verbal'
  const otherHas = hub.passes.some((p) => p.half === other)

  const switchHalf = (h: Half) => {
    setHalf(h)
    setChosen(null)
    place.setOpen(false)
  }
  const choose = (passId: string) => {
    setChosen(passId)
    place.setOpen(false)
  }
  const confirm = () => {
    if (pass) onStart(pass.id)
  }
  const instead = otherHas
    ? {
        label: `Visa ${HALF_ADJ[other]} pass`,
        run: () => switchHalf(other),
      }
    : { label: 'Till Öva', run: () => actions.go('ova') }
  // Enter is the one green step: open the rules, then start. On phone the
  // rules sheet keeps its own keys.
  const keys: Record<string, () => void> = {
    Enter: pass ? (place.open ? confirm : place.toggle) : instead.run,
  }
  if (place.open && !phone) keys.Escape = () => place.setOpen(false)
  useKeyMap(keys, live && !(phone && place.open))

  const rules = pass ? (
    <Rules
      id={id}
      pass={pass}
      rules={hub.rules}
      headRef={place.headRef}
      onKeyDown={phone ? undefined : place.onKeyDown}
      onConfirm={confirm}
      onCancel={() => place.setOpen(false)}
    />
  ) : null

  const station = pass ? (
    <article
      className="sp-now sp-prov-station"
      data-open={String(place.open && !phone)}
      aria-labelledby={place.open && !phone ? `${id}-rules` : `${id}-st`}
    >
      <div className="sp-prov-route">
        <RouteRibbon legs={legs} half={half} labels={phone ? 'code' : 'range'} />
      </div>
      <div className="sp-now-body">
        {place.open && !phone ? (
          rules
        ) : (
          <>
            <p className="sp-prov-kicker">
              {first
                ? 'Ditt första provpass'
                : pass.suggested
                  ? 'Föreslås · minst sett'
                  : 'Valt pass'}
            </p>
            <h2 className="sp-now-title" id={`${id}-st`}>
              {pass.sitting} · {pass.pass}
            </h2>
            <p className="sp-prov-facts">
              {HALF_LABEL[half]} ·{' '}
              <span className="sp-num">{count(pass.presented, 'fråga', 'frågor')}</span> ·{' '}
              <span className="sp-num">{minutes}</span> minuter
            </p>
            <p className="sp-prov-seen">{seenLine(pass)}</p>
            {first ? (
              <p className="sp-prov-seen">Ett första pass ger en baslinje att jämföra med.</p>
            ) : null}
            {pass.presented < size ? (
              <p className="sp-prov-seen">
                {count(size - pass.presented, 'fråga', 'frågor')} gick inte att läsa in, så passet
                rättas av {pass.presented}.
              </p>
            ) : null}
            <div className="sp-now-foot">
              <button
                type="button"
                className="sp-btn sp-btn--primary sp-btn--lg"
                data-testid="rd-prov-start"
                ref={place.buttonRef}
                aria-expanded={phone ? undefined : place.open}
                aria-haspopup={phone ? 'dialog' : undefined}
                onClick={place.toggle}
              >
                Starta provpasset
                <Kbd>↵</Kbd>
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  ) : (
    <article className="sp-now sp-prov-station" data-empty="true" aria-labelledby={`${id}-st`}>
      <div className="sp-now-body">
        <h2 className="sp-now-title" id={`${id}-st`}>
          Inga riktiga pass för {HALF_LABEL[half].toLocaleLowerCase('sv-SE')} just nu
        </h2>
        <p className="sp-prov-seen">
          {otherHas
            ? `Det finns ${HALF_ADJ[other]} pass att göra under tiden.`
            : 'Passen kommer när provbanken är inläst.'}
        </p>
        <div className="sp-now-foot">
          <button type="button" className="sp-btn sp-btn--primary sp-btn--lg" onClick={instead.run}>
            {instead.label}
            <Kbd>↵</Kbd>
          </button>
        </div>
      </div>
    </article>
  )

  const sittings = groupSittings(passes)
  const register =
    sittings.length > 0 ? (
      <section className="sp-prov-reg" aria-labelledby={`${id}-reg`}>
        <div className="sp-side-head">
          <h2 className="sp-h3" id={`${id}-reg`}>
            Alla provtillfällen · {HALF_LABEL[half]}
          </h2>
          <span className="sp-side-meta">
            {count(sittings.length, 'provtillfälle', 'provtillfällen')}
          </span>
        </div>
        <ul className="sp-prov-sittings">
          {sittings.map((s) => (
            <li key={s.examId} className="sp-prov-sitting">
              <span className="sp-prov-sitting-name">{s.sitting}</span>
              <ul className="sp-prov-passes" aria-label={s.sitting}>
                {s.passes.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="sp-prov-pass"
                      data-testid={`rd-prov-pass-${passSlug(p.id)}`}
                      aria-pressed={p.id === pass?.id}
                      aria-label={`${p.pass}, ${p.sitting}: du har sett ${p.seenBefore} av ${p.presented}${p.suggested ? ', föreslås' : ''}`}
                      onClick={() => choose(p.id)}
                    >
                      <PassRing seen={p.seenBefore} total={p.presented} />
                      <span className="sp-prov-pass-text">
                        <span className="sp-prov-pass-name">{p.pass}</span>
                        <span className="sp-prov-pass-seen">
                          <span className="sp-num">
                            {p.seenBefore}/{p.presented}
                          </span>{' '}
                          sedda
                        </span>
                      </span>
                      {p.suggested ? <span className="sp-next-chip">Föreslås</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    ) : null

  const p = hub.prescription
  const rhythm = p ? (
    <p className="sp-prov-rhythm">
      {p.due
        ? `Dags för ett ${p.half === 'verbal' ? 'verbalt' : 'kvantitativt'} pass.`
        : p.daysUntilNext <= 0
          ? `${HALF_SHORT[p.half]} står på tur idag.`
          : `${HALF_SHORT[p.half]} står på tur om ${p.daysUntilNext === 1 ? 'en dag' : `${inWords(p.daysUntilNext)} dagar`}.`}
      {p.daysSinceLast != null
        ? ` Ditt senaste pass var för ${p.daysSinceLast === 1 ? 'en dag' : `${inWords(p.daysSinceLast)} dagar`} sedan.`
        : null}
    </p>
  ) : null

  const recent =
    hub.results.length > 0 ? (
      <section className="sp-prov-recent" aria-labelledby={`${id}-recent`}>
        <div className="sp-side-head">
          <h2 className="sp-h3" id={`${id}-recent`}>
            Dina senaste pass
          </h2>
        </div>
        <ul className="sp-tiles sp-prov-tiles">
          {hub.results.slice(0, 6).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="sp-tile sp-prov-tile"
                data-sec="REP"
                aria-label={`${HALF_SHORT[r.half]}${r.sitting ? `, ${r.sitting}` : ''}${r.pass ? ` ${r.pass}` : ''}: ${r.correct} av ${r.presented} rätt${r.score != null ? `, ungefär ${fmtScore(r.score)}` : ''}, ${r.when}`}
                onClick={() => actions.openProvResult(r.id)}
              >
                <span className="sp-tile-label">{HALF_SHORT[r.half]}</span>
                <b className="sp-tile-score">
                  {r.correct}
                  <span>/{r.presented}</span>
                </b>
                {r.score != null ? (
                  <span className="sp-prov-tile-norm">≈ {fmtScore(r.score)}</span>
                ) : null}
                <span className="sp-tile-when">{r.when}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    ) : null

  return (
    <div className="sp-page sp-prov" data-phone={String(phone)}>
      <SparPageHead
        phone={phone}
        eyebrow="Provpass"
        title="Hela sträckan"
        lede={`${count(size, 'fråga', 'frågor')} på ${minutes} minuter, som på provdagen. Inget facit förrän du lämnar in.`}
        tools={
          <SparSegmented
            label="Provets halva"
            options={hub.halves.map((h) => ({
              key: h.half,
              label: h.label,
              testid: `rd-prov-half-${h.half}`,
            }))}
            value={half}
            onChange={switchHalf}
          />
        }
      />
      {voided ? (
        <p className="sp-prov-notice" role="status">
          Provpasset avbröts och räknas inte. Det du svarat fel på ligger i Repetera.
        </p>
      ) : null}
      <div className="sp-prov-top">
        <div className="sp-prov-main">{station}</div>
        {phone ? null : (
          <aside className="sp-prov-side" aria-label="Rytmen och dina senaste pass">
            {rhythm}
            {recent}
          </aside>
        )}
      </div>
      {register}
      {phone ? (
        <div className="sp-prov-after">
          {rhythm}
          {recent}
        </div>
      ) : null}
      {phone && pass ? (
        <SparDialog
          open={place.open}
          onClose={() => place.setOpen(false)}
          phone
          labelledBy={`${id}-rules`}
          onEnter={confirm}
          className="sp-prov-rules-sheet"
        >
          {rules}
        </SparDialog>
      ) : null}
    </div>
  )
}

function groupSittings(passes: readonly ProvPassOptionView[]) {
  const by = new Map<string, { examId: string; sitting: string; passes: ProvPassOptionView[] }>()
  for (const p of passes) {
    const s = by.get(p.examId) ?? { examId: p.examId, sitting: p.sitting, passes: [] }
    s.passes.push(p)
    by.set(p.examId, s)
  }
  return [...by.values()]
    .map((s) => ({
      ...s,
      passes: [...s.passes].sort((a, b) => a.provpass.localeCompare(b.provpass)),
    }))
    .sort((a, b) => sittingOrder(b.examId) - sittingOrder(a.examId))
}

/** The four rules, once, before the clock starts: in place on desktop, in
 *  an edge sheet on phone. "Starta nu" is the gate's accept. */
function Rules({
  id,
  pass,
  rules,
  headRef,
  onKeyDown,
  onConfirm,
  onCancel,
}: {
  id: string
  pass: ProvPassOptionView
  rules: readonly string[]
  headRef: ReturnType<typeof useInPlace>['headRef']
  onKeyDown?: ReturnType<typeof useInPlace>['onKeyDown']
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <section className="sp-prov-rules" aria-labelledby={`${id}-rules`} onKeyDown={onKeyDown}>
      <h3 className="sp-prov-rules-h" id={`${id}-rules`} ref={headRef} tabIndex={-1}>
        Innan du startar
        <span className="sp-prov-rules-pass">
          {pass.sitting} · {pass.pass}
        </span>
      </h3>
      <ul className="sp-prov-rules-list">
        {rules.map((r) => (
          <li key={r} className="sp-prov-rule">
            <span className="sp-prov-rule-glyph" aria-hidden>
              {ruleGlyph(r)}
            </span>
            <span>{sentence(r)}</span>
          </li>
        ))}
      </ul>
      <div className="sp-prov-rules-foot">
        <button
          type="button"
          className="sp-btn sp-btn--primary sp-btn--lg"
          data-testid="rd-confirm"
          onClick={onConfirm}
        >
          Starta nu
          <Kbd>↵</Kbd>
        </button>
        <button type="button" className="sp-btn sp-btn--quiet" onClick={onCancel}>
          Inte nu
        </button>
      </div>
    </section>
  )
}

// ── Required images ──────────────────────────────────────────────────

type ImgState = 'loading' | 'ok' | 'failed'

/** The images a question cannot be answered without: its figure or page,
 *  and its option charts. */
function requiredImages(q: DrillQuestion): string[] {
  const out = new Set<string>()
  if (q.figure) out.add(q.figure.src)
  for (const o of q.options ?? []) if (o.figure) out.add(o.figure.src)
  return [...out]
}

/**
 * Load states of the question's required images, by source: each is the
 * state of the image element mounted for it now. It stands while that
 * element stays — the next question on the same page is ready at once. A
 * new element for a source (a page that returns, a retry, a page zoomed
 * into its pan region) waits for its own load, unless it is already
 * complete when it mounts (cached). A source that leaves the screen
 * forgets its state.
 */
function useImages(srcs: readonly string[]) {
  const [map, setMap] = useState<Readonly<Record<string, { state: ImgState; nonce: number }>>>({})
  // The element each source's state belongs to: a load or an error from
  // any other element is not news about this one.
  const mounted = useRef(new Map<string, HTMLImageElement>())
  const set = useCallback((src: string, state: ImgState, bump = false) => {
    setMap((m) => {
      const prev = m[src]
      if (prev && prev.state === state && !bump) return m
      return { ...m, [src]: { state, nonce: (prev?.nonce ?? 0) + (bump ? 1 : 0) } }
    })
  }, [])
  const key = srcs.join('\n')
  // biome-ignore lint/correctness/useExhaustiveDependencies: prunes when the sources change only
  useLayoutEffect(() => {
    for (const src of [...mounted.current.keys()]) {
      if (!srcs.includes(src)) mounted.current.delete(src)
    }
    setMap((m) => {
      const kept = Object.fromEntries(Object.entries(m).filter(([src]) => srcs.includes(src)))
      return Object.keys(kept).length === Object.keys(m).length ? m : kept
    })
  }, [key])
  const stateOf = (src: string): ImgState => map[src]?.state ?? 'loading'
  const owns = (src: string, img: EventTarget) => mounted.current.get(src) === img
  return {
    stateOf,
    ready: srcs.every((s) => stateOf(s) === 'ok'),
    failed: srcs.filter((s) => stateOf(s) === 'failed'),
    bind: (src: string) => ({
      key: `${src}#${map[src]?.nonce ?? 0}`,
      ref: (img: HTMLImageElement | null) => {
        // Every render hands the same element back; its state stands.
        if (!img || owns(src, img)) return
        mounted.current.set(src, img)
        set(src, img.complete && img.naturalWidth > 0 ? 'ok' : 'loading')
      },
      onLoad: (e: SyntheticEvent<HTMLImageElement>) => {
        if (owns(src, e.currentTarget)) set(src, 'ok')
      },
      onError: (e: SyntheticEvent<HTMLImageElement>) => {
        if (owns(src, e.currentTarget)) set(src, 'failed')
      },
    }),
    retry: (src: string) => set(src, 'loading', true),
  }
}

type Images = ReturnType<typeof useImages>

function PassImage({
  images,
  src,
  alt,
  width,
  height,
  style,
}: {
  images: Images
  src: string
  alt: string
  width?: number
  height?: number
  style?: CSSProperties
}) {
  const { key, ...on } = images.bind(src)
  return (
    <img key={key} {...on} src={`/${src}`} alt={alt} width={width} height={height} style={style} />
  )
}

function ImageFailed({ what, retry }: { what: string; retry: () => void }) {
  return (
    <div className="sp-mat-fail" role="status">
      <p>{what} gick inte att hämta.</p>
      <button type="button" className="sp-btn sp-btn--quiet sp-btn--sm" onClick={retry}>
        <RefreshCw size={16} strokeWidth={2.25} aria-hidden />
        Försök igen
      </button>
    </div>
  )
}

// ── The clock ────────────────────────────────────────────────────────

/**
 * Seconds left. The host's count sets the deadline whenever it changes (a
 * provider that ticks every second simply keeps it in step); in between,
 * while live, it counts down here. Stills stand still.
 */
function useCountdown(remaining: number, live: boolean): number {
  const deadline = useRef(Date.now() + remaining * 1000)
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil(remaining)))
  useEffect(() => {
    deadline.current = Date.now() + remaining * 1000
    setLeft(Math.max(0, Math.ceil(remaining)))
  }, [remaining])
  useEffect(() => {
    if (!live) return
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)))
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [live])
  return left
}

/** The pass's clock: the largest thing in the bar, tabular, and inverse
 *  ink from 10 minutes left — never red or amber. */
function SparClock({ left, compact = false }: { left: number; compact?: boolean }) {
  return (
    <span
      className="sp-clock"
      data-low={String(left <= 600)}
      data-compact={String(compact)}
      role="timer"
      aria-live="off"
      aria-label={`${fmtClock(left)} kvar`}
      data-testid="rd-prov-timer"
    >
      {compact ? null : <Hourglass size={18} strokeWidth={2.25} aria-hidden />}
      <span aria-hidden>{fmtClock(left)}</span>
    </span>
  )
}

// ── The switchback ───────────────────────────────────────────────────

type Cell = {
  n: number
  key: string
  section: Section
  state: StopState
  /** Spoken: "Fråga 14, Läsförståelse, besvarad, markerad". */
  label: string
  answered?: boolean
  current?: boolean
  flagged?: boolean
  dim?: boolean
}

/**
 * A pass's questions as a switchback: rows that turn back at each end like
 * a trail climbing a slope, one stop per question, its leg's code where a
 * leg starts. With `onPick` every stop is a button to its question;
 * without, the trail is one picture named by `label`. Rows hold ten (five
 * on phone, where ten would leave no room for a finger).
 */
function Switchback({
  cells,
  legs,
  perRow,
  label,
  compact = false,
  onPick,
  testids = false,
}: {
  cells: readonly Cell[]
  legs: readonly Leg[]
  perRow: number
  label: string
  compact?: boolean
  onPick?: (index: number) => void
  testids?: boolean
}) {
  const starts = new Map(legs.map((l) => [l.start, l.section]))
  const rows = Math.ceil(cells.length / perRow)
  return (
    <ol
      className="sp-sw"
      data-compact={String(compact)}
      data-testid={testids ? 'rd-prov-grid' : undefined}
      role={onPick ? undefined : 'img'}
      aria-label={label}
      style={{ '--sw-cols': perRow, '--sw-rows': rows } as CSSProperties}
    >
      {cells.map((c, i) => {
        const row = Math.floor(i / perRow)
        const col = i % perRow
        const back = row % 2 === 1
        const end = col === perRow - 1
        const link =
          i === cells.length - 1
            ? 'none'
            : end
              ? back
                ? 'turn-left'
                : 'turn-right'
              : back
                ? 'left'
                : 'right'
        const leg = starts.get(c.n)
        const stop = (
          <>
            <SparStop state={c.state} size={compact ? 24 : 32} label={c.n} />
            {c.flagged && c.state !== 'flagged' ? (
              <Flag className="sp-sw-badge" size={11} strokeWidth={2.75} aria-hidden />
            ) : null}
          </>
        )
        return (
          <li
            key={c.key}
            className="sp-sw-cell"
            data-link={link}
            data-from={c.state}
            data-dim={c.dim ? 'true' : undefined}
            style={{ gridRow: row + 1, gridColumn: back ? perRow - col : col + 1 }}
          >
            {leg ? (
              <span className="sp-sw-leg" aria-hidden>
                {leg}
              </span>
            ) : null}
            {onPick ? (
              <button
                type="button"
                className="sp-sw-stop"
                data-testid={testids ? `rd-prov-cell-${c.n}` : undefined}
                data-answered={String(c.answered === true)}
                data-current={String(c.current === true)}
                aria-current={c.current ? 'step' : undefined}
                aria-label={c.label}
                onClick={() => onPick(i)}
              >
                {stop}
              </button>
            ) : (
              <span className="sp-sw-stop" data-answered={String(c.answered === true)}>
                {stop}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** The switchback's key: what each stop means. */
function SwitchbackKey() {
  return (
    <p className="sp-sw-key" aria-hidden>
      <span>
        <SparStop state="answered" size={20} label="" /> besvarad
      </span>
      <span>
        <SparStop state="now" size={20} label="" /> här
      </span>
      <span>
        <SparStop state="flagged" size={20} /> markerad
      </span>
      <span>
        <SparStop state="todo" size={20} label="" /> obesvarad
      </span>
    </p>
  )
}

// ── The question in exam mode ────────────────────────────────────────

const NOG_TAIL = 'Tillräcklig information för lösningen erhålls'

/** KVA's four fixed options and the relation each one states. */
const KVA_REL: Record<string, string> = {
  'I är större än II': 'I > II',
  'II är större än I': 'II > I',
  'I är lika med II': 'I = II',
  'informationen är otillräcklig': '?',
}

/** NOG's five fixed options and the statements each one uses. */
type NogUse = 'one' | 'two' | 'together' | 'each' | 'neither'
const NOG_USE: Record<string, NogUse> = {
  'i (1) men ej i (2)': 'one',
  'i (2) men ej i (1)': 'two',
  'i (1) tillsammans med (2)': 'together',
  'i (1) och (2) var för sig': 'each',
  'ej genom de båda påståendena': 'neither',
}

/** A NOG option as plain words ("(₁ )" reads "(1)" again). */
function nogWords(text: string): string {
  return flattenMathText(text)
    .replace(/\(\s*([12])\s*\)?/g, '($1)')
    .replace(/\s+/g, ' ')
    .trim()
}

/** How a question's options are laid out (as on Kvantfråga). */
function optionKind(q: DrillQuestion): 'kva' | 'nog' | 'images' | 'short' | 'long' {
  const options = q.options ?? []
  if (options.some((o) => o.figure)) return 'images'
  if (q.section === 'KVA' && options.every((o) => KVA_REL[o.text])) return 'kva'
  if (q.section === 'NOG' && options.every((o) => NOG_USE[nogWords(o.text)])) return 'nog'
  return options.every((o) => flattenMathText(o.text).length <= 14) ? 'short' : 'long'
}

/** Whether a question is read off a printed DTK page. */
function onPage(q: DrillQuestion): boolean {
  return q.section === 'DTK'
}

type PageView = { rot: number; zoom: boolean }
const PAGE: PageView = { rot: 0, zoom: false }

/** A page turned a quarter: the image keeps its own proportions and turns
 *  about the mat's centre (the mat takes the turned aspect). */
function rotated(figure: DrillFigure, rot: number): CSSProperties | undefined {
  if (rot === 0) return undefined
  if (rot === 180) return { transform: 'rotate(180deg)' }
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: `${(figure.width / figure.height) * 100}%`,
    height: `${(figure.height / figure.width) * 100}%`,
    maxWidth: 'none',
    transform: `translate(-50%, -50%) rotate(${rot}deg)`,
  }
}

/** The question's own card in its section's layout: a DTK page on its
 *  white mat, or a problem card (figure, passage, stem) — the same shapes
 *  as Kvantfråga and DTK, with nothing that grades or hints. */
function ExamCard({
  q,
  images,
  pageNo,
  pageCount,
  view,
  setView,
  phone,
  tools,
}: {
  q: DrillQuestion
  images: Images
  pageNo: number
  pageCount: number
  view: PageView
  setView: (patch: Partial<PageView>) => void
  phone: boolean
  /** A page's Förstora and Rotera. */
  tools: boolean
}) {
  const { data } = useDirectionData()
  if (onPage(q)) {
    return (
      <ExamPage
        q={q}
        images={images}
        pageNo={pageNo}
        pageCount={pageCount}
        view={view}
        setView={setView}
        phone={phone}
        tools={tools}
      />
    )
  }
  return (
    <article className="sp-pcard" data-sec={q.section} aria-labelledby="sp-run-card-h">
      <header className="sp-pcard-band">
        <h1 className="sp-pcard-name" id="sp-run-card-h">
          {sectionName(q.section)}
        </h1>
        {q.passage?.synthetic ? (
          <span className="sp-badge-chip sp-badge-chip--sm">{data.copy.ovningstextBadge}</span>
        ) : null}
      </header>
      <div className="sp-pcard-body">
        {q.figure ? <ExamFigure figure={q.figure} images={images} /> : null}
        {q.passage ? <ExamPassage passage={q.passage} /> : <ExamStem q={q} />}
      </div>
    </article>
  )
}

function ExamFigure({ figure, images }: { figure: DrillFigure; images: Images }) {
  const state = images.stateOf(figure.src)
  return (
    <div
      className="sp-fig"
      style={{ '--sp-fig-ratio': String(figure.width / figure.height) } as CSSProperties}
    >
      <figure
        className="sp-mat"
        data-state={state}
        style={{ aspectRatio: `${figure.width} / ${figure.height}` }}
      >
        {state === 'failed' ? (
          <ImageFailed what="Figuren" retry={() => images.retry(figure.src)} />
        ) : (
          <>
            <span className="sp-mat-wait" aria-hidden>
              Hämtar figuren…
            </span>
            <PassImage
              images={images}
              src={figure.src}
              alt={figure.alt}
              width={figure.width}
              height={figure.height}
            />
          </>
        )}
      </figure>
    </div>
  )
}

/** A text the question belongs to (a LÄS or ELF leg): numbered paragraphs,
 *  read-only; an English text is marked so. */
function ExamPassage({ passage }: { passage: DrillPassage }) {
  return (
    <div className="sp-qpassage sp-run-passage" lang={passage.lang === 'en' ? 'en' : undefined}>
      {passage.title ? <h2 className="sp-run-ptitle">{passage.title}</h2> : null}
      {passage.paragraphs.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the paragraphs of one fixed text
        <p key={i} className="sp-qpara" data-n={i + 1}>
          <span className="sp-qpnum" aria-hidden>
            {i + 1}
          </span>
          {p}
        </p>
      ))}
      {passage.byline ? <p className="sp-byline">{passage.byline}</p> : null}
    </div>
  )
}

/** The stem: KVA's two quantities, NOG's statements, an ORD headword, a
 *  MEK sentence with its gaps, or plain math. */
function ExamStem({ q }: { q: DrillQuestion }) {
  if (q.prompt == null || q.options == null) {
    return (
      <div className="sp-stem">
        <p className="sp-stem-missing">Frågan saknar fullständig text.</p>
      </div>
    )
  }
  if (q.section === 'KVA') {
    const split = splitKvaPrompt(q.prompt)
    if (split) {
      return (
        <div className="sp-stem">
          {split.condition ? (
            <p className="sp-kva-cond">
              <MathText>{split.condition}</MathText>
            </p>
          ) : null}
          <fieldset className="sp-kva">
            <legend className="sp-sr">Jämförelsen</legend>
            {(['I', 'II'] as const).map((n) => (
              <section key={n} className="sp-kva-q" aria-label={`Kvantitet ${n}`}>
                <span className="sp-kva-head">
                  <SparStop state="todo" size={32} sec="KVA" glyph={n} />
                  <span className="sp-kva-label" aria-hidden>
                    Kvantitet {n}
                  </span>
                </span>
                <span className="sp-kva-val">
                  <MathText>{n === 'I' ? split.kvI : split.kvII}</MathText>
                </span>
              </section>
            ))}
          </fieldset>
        </div>
      )
    }
  }
  if (q.section === 'NOG') {
    const parts = parseNogPrompt(q.prompt)
    if (parts) {
      return (
        <div className="sp-stem">
          <p className="sp-stem-text">
            <MathText>{parts.question}</MathText>
          </p>
          <ol className="sp-nog" aria-label="Påståenden">
            {([1, 2] as const).map((n) => (
              <li key={n} className="sp-nog-item">
                <SparStop state="todo" size={32} sec="NOG" label={n} />
                <span className="sp-nog-text">
                  <span className="sp-sr">Påstående {n}:</span>{' '}
                  <MathText>{n === 1 ? parts.statement1 : parts.statement2}</MathText>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )
    }
  }
  if (q.section === 'ORD') {
    return (
      <div className="sp-stem">
        <p className="sp-stem-word">{q.prompt}</p>
      </div>
    )
  }
  const parts = q.prompt.split(/_{3,}/)
  return (
    <div className="sp-stem">
      <p className="sp-stem-text">
        {parts.length === 1 ? (
          <MathText>{q.prompt}</MathText>
        ) : (
          parts.map((part, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the pieces of one fixed sentence
            <span key={i}>
              <MathText>{part}</MathText>
              {i < parts.length - 1 ? (
                <span className="sp-gap">
                  <span className="sp-sr">lucka {i + 1}</span>
                </span>
              ) : null}
            </span>
          ))
        )}
      </p>
    </div>
  )
}

/** A printed DTK page on its white mat: turned a quarter at a time (R),
 *  and twice as wide in a pan region of its own (Z). */
function ExamPage({
  q,
  images,
  pageNo,
  pageCount,
  view,
  setView,
  phone,
  tools,
}: {
  q: DrillQuestion
  images: Images
  pageNo: number
  pageCount: number
  view: PageView
  setView: (patch: Partial<PageView>) => void
  phone: boolean
  tools: boolean
}) {
  const figure = q.figure
  const state = figure ? images.stateOf(figure.src) : 'failed'
  const turned = view.rot % 180 !== 0
  const label = `sida ${pageNo} av ${pageCount}`
  const mat = figure ? (
    <figure
      className="sp-mat sp-mat--page"
      data-state={state}
      data-turned={String(turned)}
      style={{
        aspectRatio: turned
          ? `${figure.height} / ${figure.width}`
          : `${figure.width} / ${figure.height}`,
      }}
    >
      {state === 'failed' ? (
        <ImageFailed what="Sidan" retry={() => images.retry(figure.src)} />
      ) : (
        <>
          <span className="sp-mat-wait" aria-hidden>
            Hämtar sidan…
          </span>
          <PassImage
            images={images}
            src={figure.src}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            style={rotated(figure, view.rot)}
          />
        </>
      )}
    </figure>
  ) : null
  return (
    <article className="sp-pcard sp-pagecard" data-sec="DTK" aria-labelledby="sp-run-card-h">
      <header className="sp-pcard-band">
        <h1 className="sp-pcard-name" id="sp-run-card-h">
          {phone ? (
            <span>{cap(label)}</span>
          ) : (
            <>
              {sectionName('DTK')}
              <span className="sp-pcard-page"> · {label}</span>
            </>
          )}
        </h1>
        {tools && figure && state !== 'failed' ? (
          <div className="sp-pcard-tools">
            <button
              type="button"
              className="sp-btn sp-btn--quiet sp-btn--sm"
              aria-pressed={view.zoom}
              title="Förstora (Z)"
              onClick={() => setView({ zoom: !view.zoom })}
            >
              {view.zoom ? (
                <Minimize2 size={17} strokeWidth={2.25} aria-hidden />
              ) : (
                <Maximize2 size={17} strokeWidth={2.25} aria-hidden />
              )}
              Förstora
            </button>
            <button
              type="button"
              className="sp-icon-btn"
              aria-label="Rotera sidan"
              title="Rotera (R)"
              onClick={() => setView({ rot: (view.rot + 90) % 360 })}
            >
              <RotateCw size={19} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        ) : null}
      </header>
      <div className="sp-pcard-body">
        {figure ? (
          view.zoom ? (
            // Zoomed, the page pans in a region of its own: arrows scroll it
            // and the bake-off's switcher leaves them alone there.
            <section
              className="sp-run-pan"
              data-zoom="true"
              data-rd-keyscope=""
              // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region takes focus so the arrows can pan it
              tabIndex={0}
              aria-label="Sidan förstorad: panorera med pilarna"
            >
              {mat}
            </section>
          ) : (
            <div className="sp-run-pan" data-zoom="false">
              {mat}
            </div>
          )
        ) : (
          <div className="sp-mat sp-mat--page" data-state="failed">
            <div className="sp-mat-fail" role="status">
              <p>Sidan saknas.</p>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

/** Which of NOG's statements an option uses (a reading aid; the words
 *  stay). */
function NogGlyph({ use }: { use: NogUse }) {
  const first = use === 'one' || use === 'together' || use === 'each'
  const second = use === 'two' || use === 'together' || use === 'each'
  return (
    <span className="sp-nogg" data-use={use} aria-hidden>
      <i data-on={String(first)} />
      <b />
      <i data-on={String(second)} />
    </span>
  )
}

/** The options as on Kvantfråga: choosing is answering. Struck options
 *  stay struck for the pass. Nothing can be chosen while a required image
 *  is missing. */
function ExamOptions({
  q,
  answer,
  struck,
  choose,
  strike,
  blocked,
  phone,
  images,
}: {
  q: DrillQuestion
  answer: AnswerLetter | null
  struck: readonly AnswerLetter[]
  choose: (letter: AnswerLetter) => void
  strike: (letter: AnswerLetter) => void
  blocked: boolean
  phone: boolean
  images: Images
}) {
  const kind = optionKind(q)
  const layout: OptionsLayout =
    kind === 'images'
      ? 'images'
      : kind === 'kva'
        ? phone
          ? 'column'
          : 'grid'
        : kind === 'short' && !phone
          ? 'row'
          : 'column'
  const content =
    kind === 'kva'
      ? (o: DrillOption) => (
          <span className="sp-relrow">
            <span className="sp-rel" aria-hidden>
              {KVA_REL[o.text]}
            </span>
            <span>{o.text}</span>
          </span>
        )
      : kind === 'nog'
        ? (o: DrillOption) => {
            const words = nogWords(o.text)
            return (
              <span className="sp-relrow sp-relrow--nog">
                <NogGlyph use={NOG_USE[words]} />
                <span>{words}</span>
              </span>
            )
          }
        : kind === 'images'
          ? (o: DrillOption) => (
              <>
                <span
                  className="sp-optimg"
                  data-state={o.figure ? images.stateOf(o.figure.src) : 'failed'}
                >
                  {o.figure && images.stateOf(o.figure.src) !== 'failed' ? (
                    <PassImage images={images} src={o.figure.src} alt="" />
                  ) : (
                    <span className="sp-optimg-fail">Bilden saknas</span>
                  )}
                </span>
                <span className="sp-optimg-label">{o.text}</span>
              </>
            )
          : undefined
  const parts = q.section === 'NOG' && q.prompt ? parseNogPrompt(q.prompt) : null
  const eliminated = useMemo(() => new Set(struck), [struck])
  return (
    <>
      {kind === 'nog' ? <p className="sp-nog-cap">{parts?.tail ?? NOG_TAIL}</p> : null}
      <Options
        view={{ question: q, selected: answer, eliminated }}
        act={{ select: choose, toggleEliminate: strike }}
        layout={layout}
        content={content}
        disabled={blocked}
      />
    </>
  )
}

// ── The running pass ─────────────────────────────────────────────────

type Gate = 'abort' | 'handin' | null
type Filter = 'alla' | 'obesvarade' | 'markerade'

function clampIndex(i: number, total: number): number {
  return Math.min(Math.max(0, Math.round(i) || 0), Math.max(0, total - 1))
}

/** Where the clock is: 0 above ten minutes, 1 under ten, 2 under five. */
function timeBand(seconds: number): number {
  return seconds <= 300 ? 2 : seconds <= 600 ? 1 : 0
}

/** "5 minuter", "1 minut". */
function minutesWord(seconds: number): string {
  const m = Math.max(1, Math.ceil(seconds / 60))
  return `${m} ${m === 1 ? 'minut' : 'minuter'}`
}

type RunProps = {
  width: WidthKey
  live: boolean
  /** "Avbryt passet": the pass is void; back to the hub. */
  onAbort: () => void
  /** Nothing to run: back to the hub, quietly. */
  onLeave: () => void
  /** Hands the pass in, by the reader or by the clock at 0:00: true once
   *  the host has it, false when the hand-in failed. */
  onHandIn: (timedOut: boolean) => boolean
  /** Out of a pass whose hand-in failed: a destination ('provpass' is the
   *  hub). */
  onGo: (d: Destination) => void
}

export function SparProvRun(props: RunProps) {
  const { data } = useDirectionData()
  const running = data.provpass.running
  if (running.questions.length === 0) {
    return (
      <RunNotice
        live={props.live}
        title="Passet kunde inte starta"
        lede="Passets frågor gick inte att hämta. Klockan har inte börjat."
        onLeave={props.onLeave}
      />
    )
  }
  // A new sitting starts over: its own place, answers, marks and clock.
  return <PassEntry key={running.passId} {...props} running={running} />
}

/** A pass's time is judged once, as it opens: one already at 0:00 cannot
 *  be resumed, and nothing hands it in; a pass that opens with time left
 *  and runs out hands itself in. */
function PassEntry({ onLeave, ...props }: RunProps & { running: ProvRunningView }) {
  const [stale] = useState(() => props.running.remainingSeconds <= 0)
  if (stale) {
    return (
      <RunNotice
        live={props.live}
        title="Det tidigare passet kan inte återupptas"
        lede="Tiden för passet gick ut medan du var borta."
        onLeave={onLeave}
      />
    )
  }
  return <RunningPass {...props} />
}

/** A pass that cannot run, in the focus frame: what happened and the way
 *  back to the hub. The clock is not running, and nothing is handed in. */
function RunNotice({
  live,
  title,
  lede,
  onLeave,
}: {
  live: boolean
  title: string
  lede: string
  onLeave: () => void
}) {
  const id = useId()
  const headRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (live) headRef.current?.focus({ preventScroll: true })
  }, [live])
  return (
    <div className="sp-drill">
      <header className="sp-top">
        <div className="sp-top-left">
          <button type="button" className="sp-btn sp-btn--quiet" onClick={onLeave}>
            <X size={18} strokeWidth={2.25} aria-hidden />
            Stäng
          </button>
        </div>
      </header>
      <div className="sp-body sp-body--done">
        <section className="sp-done" aria-labelledby={`${id}-h`}>
          <h1 className="sp-display" id={`${id}-h`} ref={headRef} tabIndex={-1}>
            {title}
          </h1>
          <p className="sp-lede">{lede}</p>
          <div className="sp-done-actions">
            <button type="button" className="sp-btn sp-btn--primary sp-btn--lg" onClick={onLeave}>
              Tillbaka till Provpass
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function RunningPass({
  width,
  live,
  running,
  onAbort,
  onHandIn,
  onGo,
}: Omit<RunProps, 'onLeave'> & { running: ProvRunningView }) {
  const { data } = useDirectionData()
  const phone = width === 'phone'
  const id = useId()
  const qs = running.questions
  const total = qs.length
  const [at, setAt] = useState(() => clampIndex(running.current, total))
  // A list that shrinks under us never leaves the place out of range.
  const index = clampIndex(at, total)
  const q = qs[index]
  const last = index === total - 1
  const [answers, setAnswers] = useState<Partial<Record<string, AnswerLetter>>>(() => ({
    ...running.answers,
  }))
  const [flags, setFlags] = useState<ReadonlySet<string>>(
    () => new Set(running.flags ?? running.grid.filter((c) => c.flagged).map((c) => c.qid)),
  )
  const [strikes, setStrikes] = useState<Readonly<Record<string, readonly AnswerLetter[]>>>({})
  const [overview, setOverview] = useState(false)
  const [filter, setFilter] = useState<Filter>('alla')
  const [gate, setGate] = useState<Gate>(null)
  const [tray, setTray] = useState<'open' | 'folded'>('open')
  const [pageViews, setPageViews] = useState<Record<string, PageView>>({})
  // The host could not take the hand-in. Kit v2 has no safe way to try
  // again, so nothing does: the pass stays read-only with the way out, the
  // clock stops, and the keys and the frame's navigation are let go.
  const [failed, setFailed] = useState(false)
  const left = useCountdown(running.remainingSeconds, live && !failed)

  // Handed in once, whoever asks first: the reader or the clock. The
  // clock's 0:00 always hands in — it never voids the pass.
  const handedIn = useRef(false)
  const handIn = useCallback(
    (timedOut: boolean) => {
      if (handedIn.current) return
      handedIn.current = true
      if (onHandIn(timedOut)) return
      setGate(null)
      setOverview(false)
      // No dialog, and no zoomed page's pan region, stays to keep the keys.
      setPageViews((all) =>
        Object.fromEntries(Object.entries(all).map(([k, v]) => [k, { ...v, zoom: false }])),
      )
      setFailed(true)
    },
    [onHandIn],
  )
  useEffect(() => {
    if (live && left <= 0) handIn(true)
  }, [live, left, handIn])
  // The failure takes focus to the way out, outside every key scope.
  const outRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (failed) outRef.current?.focus({ preventScroll: true })
  }, [failed])

  // 10 and 5 minutes left are said once each, as they pass; never once a
  // hand-in has failed (the clock no longer counts for anything).
  const [announce, setAnnounce] = useState('')
  const said = useRef(timeBand(left))
  useEffect(() => {
    const b = timeBand(left)
    if (b > said.current && !failed) setAnnounce(b === 2 ? '5 minuter kvar' : '10 minuter kvar')
    said.current = b
  }, [left, failed])

  // The bake-off's switcher never takes a running pass away: its digits
  // and ←/→ are marked handled here, whatever has focus — except in a
  // pan region or a form field, which the switcher leaves alone anyway.
  // A failed hand-in lets them go.
  useEffect(() => {
    if (!live || failed) return
    const guard = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isForeignKey(e)) return
      if (e.target instanceof Element && e.target.closest('[data-rd-keyscope]')) return
      if (/^[0-9]$/.test(e.key) || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', guard, true)
    return () => window.removeEventListener('keydown', guard, true)
  }, [live, failed])

  // Legs: the view's section runs when they cover the questions, else the
  // questions' own runs.
  const legs = useMemo(() => {
    const view = running.sections.map((s) => ({
      section: s.section,
      start: s.start + 1,
      end: s.end,
    }))
    const whole =
      view.length > 0 &&
      view[0].start === 1 &&
      view[view.length - 1].end === qs.length &&
      view.every((l, i) => i === 0 || l.start === view[i - 1].end + 1)
    return whole ? view : legsOfQuestions(qs)
  }, [running.sections, qs])

  const letters = (q.options ?? []).map((o) => o.letter)
  const answer = answers[q.qid] ?? null
  const struck = strikes[q.qid] ?? []
  const flagged = flags.has(q.qid)
  const isPage = onPage(q)
  const srcs = useMemo(() => requiredImages(q), [q])
  const images = useImages(srcs)
  const missingPage = isPage && !q.figure
  const blocked = missingPage || !images.ready
  const why = missingPage
    ? 'Frågan behöver sidan.'
    : images.failed.length > 0
      ? isPage
        ? 'Frågan behöver sidan.'
        : q.figure && images.stateOf(q.figure.src) === 'failed'
          ? 'Frågan behöver figuren.'
          : 'Frågan behöver bilderna.'
      : null
  const optionImagesFailed = images.failed.filter((s) => s !== q.figure?.src)

  // DTK pages in order, where this question's page is, and its view.
  const pageKeys = useMemo(() => {
    const keys: string[] = []
    for (const x of qs) {
      if (!onPage(x)) continue
      const key = x.figure?.src ?? x.qid
      if (!keys.includes(key)) keys.push(key)
    }
    return keys
  }, [qs])
  const pageKey = isPage ? (q.figure?.src ?? q.qid) : null
  const pageView = (pageKey && pageViews[pageKey]) || PAGE
  const setPageView = (patch: Partial<PageView>) => {
    if (!pageKey) return
    setPageViews((all) => ({ ...all, [pageKey]: { ...(all[pageKey] ?? PAGE), ...patch } }))
  }

  // After a failed hand-in the answers are read-only.
  const choose = (letter: AnswerLetter) => {
    if (failed || blocked || !letters.includes(letter)) return
    setAnswers((a) => ({ ...a, [q.qid]: letter }))
  }
  const strike = (letter: AnswerLetter) => {
    if (failed || !letters.includes(letter)) return
    setStrikes((s) => {
      const cur = s[q.qid] ?? []
      return {
        ...s,
        [q.qid]: cur.includes(letter) ? cur.filter((l) => l !== letter) : [...cur, letter],
      }
    })
  }
  const toggleFlag = () => {
    if (failed) return
    setFlags((f) => {
      const next = new Set(f)
      if (next.has(q.qid)) next.delete(q.qid)
      else next.add(q.qid)
      return next
    })
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  // The column turns to the top for a new problem or page; the next
  // question on the same page keeps it still.
  const seen = useRef(pageKey ?? q.qid)
  useEffect(() => {
    const key = pageKey ?? q.qid
    if (seen.current === key) return
    seen.current = key
    scrollRef.current?.scrollTo?.({ top: 0 })
  }, [pageKey, q.qid])

  const goTo = (i: number) => {
    setAt(clampIndex(i, total))
    setOverview(false)
    setTray('open')
  }
  // At the last question it opens the hand-in, unless a hand-in failed.
  const next = () => {
    if (!last) goTo(index + 1)
    else if (!failed) setGate('handin')
  }
  const prev = () => {
    if (index > 0) goTo(index - 1)
  }
  const openOverview = (f: Filter = 'alla') => {
    setFilter(f)
    setOverview(true)
  }

  // Enter moves on; Space too once the question has an answer — until then
  // it keeps scrolling a long text or page.
  const keys: Record<string, () => void> = { Enter: next }
  if (answer) keys[' '] = next
  if (!phone) keys.t = () => setTray((t) => (t === 'open' ? 'folded' : 'open'))
  if (isPage && q.figure) {
    keys.r = () => setPageView({ rot: (pageView.rot + 90) % 360 })
    keys.z = () => setPageView({ zoom: !pageView.zoom })
  }
  for (const l of letters) {
    const k = l.toLowerCase()
    keys[k] = () => choose(l)
    keys[`Shift+${k}`] = () => strike(l)
  }
  // A failed pass takes no keys: they are its buttons' and the switcher's.
  useKeyMap(keys, live && gate == null && !overview && !failed)

  const blanks = qs.filter((x) => answers[x.qid] == null)
  const marked = qs.filter((x) => flags.has(x.qid))
  const done = legs.map(
    (l) => qs.slice(l.start - 1, l.end).filter((x) => answers[x.qid] != null).length,
  )
  const cells = (dimmed: boolean): Cell[] =>
    qs.map((x, i) => {
      const answered = answers[x.qid] != null
      const isFlagged = flags.has(x.qid)
      const current = i === index
      const words = [
        answered ? 'besvarad' : 'obesvarad',
        isFlagged ? 'markerad' : null,
        current ? 'här' : null,
      ]
        .filter(Boolean)
        .join(', ')
      return {
        n: i + 1,
        key: x.qid,
        section: x.section,
        state: current ? 'now' : isFlagged ? 'flagged' : answered ? 'answered' : 'todo',
        label: `Fråga ${i + 1}, ${sectionName(x.section)}, ${words}`,
        answered,
        current,
        flagged: isFlagged,
        dim:
          dimmed &&
          (filter === 'obesvarade' ? answered : filter === 'markerade' ? !isFlagged : false),
      }
    })
  const blankLine =
    blanks.length === 0
      ? `Alla ${total} är besvarade.`
      : blanks.length === 1
        ? '1 fråga är obesvarad.'
        : `${blanks.length} frågor är obesvarade.`

  const abortButton = (
    <button
      type="button"
      className={phone ? 'sp-btn sp-btn--quiet sp-btn--sm' : 'sp-btn sp-btn--quiet'}
      data-testid="sp-prov-abort"
      title="Avbryter du blir provet ogiltigt"
      onClick={() => setGate('abort')}
    >
      <X size={phone ? 17 : 18} strokeWidth={2.25} aria-hidden />
      Avbryt
    </button>
  )
  const flagButton = (
    <button
      type="button"
      className="sp-btn sp-btn--quiet sp-btn--sm sp-run-flag"
      data-testid="rd-prov-flag"
      aria-pressed={flagged}
      title="Markera frågan och kom tillbaka till den"
      onClick={toggleFlag}
    >
      <Flag size={16} strokeWidth={2.25} aria-hidden />
      Markera
    </button>
  )
  const overviewButton = (
    <button
      type="button"
      className={phone ? 'sp-btn sp-btn--quiet sp-btn--sm' : 'sp-btn sp-btn--quiet'}
      aria-haspopup="dialog"
      aria-expanded={overview}
      onClick={() => openOverview()}
    >
      <MapIcon size={phone ? 16 : 18} strokeWidth={2.25} aria-hidden />
      Översikt
    </button>
  )
  const submitButton = (
    <button
      type="button"
      className={phone ? 'sp-btn sp-btn--quiet sp-btn--sm' : 'sp-btn sp-btn--quiet'}
      data-testid="rd-prov-submit"
      aria-haspopup="dialog"
      onClick={() => setGate('handin')}
    >
      Lämna in
    </button>
  )
  const nextLabel = last && !failed ? 'Granska och lämna in' : 'Nästa fråga'
  // Failed, the way out is the one green step and "Nästa" only reads on.
  const nextClass = failed ? 'sp-btn sp-btn--quiet' : 'sp-btn sp-btn--primary'
  const showPrompt = q.prompt != null && (q.passage != null || isPage)
  const reason = why ? (
    <p className="sp-qtray-why">
      {why}
      {optionImagesFailed.length > 0 ? (
        <button
          type="button"
          className="sp-link sp-link--inline"
          onClick={() => {
            for (const s of optionImagesFailed) images.retry(s)
          }}
        >
          Försök igen
        </button>
      ) : null}
    </p>
  ) : null
  const options = (
    <ExamOptions
      q={q}
      answer={answer}
      struck={struck}
      choose={choose}
      strike={strike}
      blocked={blocked || failed}
      phone={phone}
      images={images}
    />
  )
  const card = (
    <ExamCard
      q={q}
      images={images}
      pageNo={pageKey ? pageKeys.indexOf(pageKey) + 1 : 0}
      pageCount={pageKeys.length}
      view={pageView}
      setView={setPageView}
      phone={phone}
      tools={!failed}
    />
  )
  const failure = failed ? (
    <div className="sp-run-failed">
      <p className="sp-run-failed-text" role="alert">
        <b>Inlämningen gick inte fram.</b> Passet har inte lämnats in och kan inte skickas igen
        härifrån. Dina svar syns kvar här tills du går vidare.
      </p>
      <button
        type="button"
        className="sp-btn sp-btn--primary"
        ref={outRef}
        onClick={() => onGo('provpass')}
      >
        Till Provpass
      </button>
    </div>
  ) : null
  const note =
    left > 0 && left <= 300 && !failed ? (
      <p className="sp-run-note">
        {cap(minutesWord(left))} kvar.{' '}
        {blanks.length > 0 ? (
          <>
            {blankLine.replace(/\.$/, '')} — fel ger inga avdrag.{' '}
            <button
              type="button"
              className="sp-link sp-link--inline"
              onClick={() => openOverview('obesvarade')}
            >
              Visa dem
            </button>
          </>
        ) : (
          'Alla frågor är besvarade.'
        )}
      </p>
    ) : null

  const overviewLayer = (
    <SparDialog
      open={overview}
      onClose={() => setOverview(false)}
      phone={phone}
      labelledBy={`${id}-ov`}
      placement="top"
      keepMounted
      className="sp-run-ov"
    >
      <div className="sp-run-ov-head">
        <h2 className="sp-h3" id={`${id}-ov`} tabIndex={-1}>
          Översikt
          <span className="sp-h3-meta">
            {total - blanks.length} av {total} besvarade
          </span>
        </h2>
        <button
          type="button"
          className="sp-icon-btn sp-icon-btn--sm"
          aria-label="Stäng översikten"
          onClick={() => setOverview(false)}
        >
          <X size={18} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
      <fieldset className="sp-run-ov-filter">
        <legend className="sp-sr">Visa</legend>
        {(
          [
            ['alla', 'Alla'],
            ['obesvarade', `Obesvarade (${blanks.length})`],
            ['markerade', `Markerade (${marked.length})`],
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            type="button"
            className="sp-run-ov-chip"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {text}
          </button>
        ))}
      </fieldset>
      <Switchback
        cells={cells(true)}
        legs={legs}
        perRow={phone ? 5 : 10}
        label="Passets frågor"
        onPick={goTo}
        testids
      />
      <SwitchbackKey />
      {failed ? null : (
        <div className="sp-run-ov-foot">
          <button
            type="button"
            className="sp-btn sp-btn--quiet"
            onClick={() => {
              setOverview(false)
              setGate('handin')
            }}
          >
            Lämna in
          </button>
        </div>
      )}
    </SparDialog>
  )
  const handInLayer = (
    <SparDialog
      open={gate === 'handin'}
      onClose={() => setGate(null)}
      phone={phone}
      labelledBy={`${id}-hand`}
      onEnter={() => handIn(false)}
      className="sp-run-gate"
    >
      <h2 className="sp-dialog-h" id={`${id}-hand`} tabIndex={-1}>
        Lämna in provpasset?
      </h2>
      <Switchback
        cells={cells(false)}
        legs={legs}
        perRow={10}
        compact
        label={`${total - blanks.length} av ${total} besvarade`}
      />
      <p className="sp-dialog-p">
        {blankLine}
        {blanks.length > 0 ? ' Fel ger inga avdrag.' : ''}
      </p>
      <div className="sp-dialog-foot">
        <button
          type="button"
          className="sp-btn sp-btn--primary sp-btn--lg"
          data-testid="rd-confirm"
          onClick={() => handIn(false)}
        >
          Lämna in
          <Kbd>↵</Kbd>
        </button>
        <button type="button" className="sp-btn sp-btn--quiet" onClick={() => setGate(null)}>
          Fortsätt svara
        </button>
      </div>
    </SparDialog>
  )
  const keepRef = useRef<HTMLButtonElement>(null)
  const abortLayer = (
    <SparDialog
      open={gate === 'abort'}
      onClose={() => setGate(null)}
      phone={phone}
      labelledBy={`${id}-abort`}
      initialFocus={keepRef}
      className="sp-run-gate"
    >
      <h2 className="sp-dialog-h" id={`${id}-abort`} tabIndex={-1}>
        Avbryta provpasset?
      </h2>
      <p className="sp-dialog-p">
        Passet blir ogiltigt och räknas inte. Det du svarat fel på hittills läggs i Repetera.
      </p>
      <div className="sp-dialog-foot">
        <button
          type="button"
          className="sp-btn sp-btn--primary sp-btn--lg"
          ref={keepRef}
          onClick={() => setGate(null)}
        >
          Fortsätt provpasset
        </button>
        <button
          type="button"
          className="sp-btn sp-btn--quiet"
          data-testid="rd-confirm"
          onClick={() => {
            if (handedIn.current) return
            setGate(null)
            onAbort()
          }}
        >
          Avbryt passet
        </button>
      </div>
    </SparDialog>
  )
  const layers = (
    <>
      {overviewLayer}
      {handInLayer}
      {abortLayer}
      <span className="sp-sr" aria-live="polite">
        {announce}
      </span>
    </>
  )

  // A failed hand-in brings the frame's navigation back, around the pass
  // as it stands: the nodes before it keep their places, so nothing in the
  // pass is mounted again.
  const due = data.home.ovaDue > 0

  if (phone) {
    return (
      <div
        className="sp-run sp-run--phone"
        data-testid="rd-prov-running"
        data-mode={isPage ? 'page' : 'problem'}
        data-exam="true"
        data-failed={String(failed)}
      >
        <header className="sp-run-ptop">
          <div className="sp-run-prow">
            {failed ? <span /> : abortButton}
            <span className="sp-run-pcount">
              Fråga {index + 1} av {total}
            </span>
            {failed ? <span /> : <SparClock left={left} compact />}
          </div>
          <RouteRibbon legs={legs} half={running.half} done={done} at={index + 1} labels="code" />
        </header>
        <div className="sp-run-notes">{failure ?? note}</div>
        <div className="sp-run-pscroll" ref={scrollRef}>
          {card}
          <section className="sp-run-popts" aria-label={`Fråga ${index + 1}`}>
            {showPrompt ? (
              <h2 className="sp-prompt">
                <MathText>{q.prompt}</MathText>
              </h2>
            ) : null}
            {failed ? null : reason}
            {options}
          </section>
        </div>
        <div className="sp-run-pbar">
          {failed ? null : (
            <div className="sp-run-ptools">
              {flagButton}
              {overviewButton}
              {submitButton}
            </div>
          )}
          <div className="sp-run-pnav">
            <button
              type="button"
              className="sp-icon-btn sp-icon-btn--soft"
              aria-label="Föregående fråga"
              disabled={index === 0}
              onClick={prev}
            >
              <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
            </button>
            <span className="sp-sr" aria-live="polite">
              {answer ? `Ditt svar: ${answer}` : ''}
            </span>
            <button
              type="button"
              className={`${nextClass} sp-btn--lg sp-btn--grow`}
              disabled={failed && last}
              onClick={next}
            >
              {nextLabel}
            </button>
          </div>
        </div>
        {layers}
        {failed ? (
          <nav className="sp-navbar" aria-label="Huvudmeny">
            <SparNavItems bar current="provpass" due={due} onGo={onGo} />
          </nav>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={failed ? 'sp-app sp-run-frame' : 'sp-run-frame'}
      data-expanded="false"
      data-failed={String(failed)}
    >
      {failed ? (
        <nav className="sp-rail" aria-label="Huvudmeny">
          <div className="sp-rail-top">
            <span className="sp-brand">
              <Mark size={40} />
              <span className="sp-brand-name">HP-Coach</span>
            </span>
          </div>
          <div className="sp-rail-items">
            <SparNavItems current="provpass" due={due} onGo={onGo} />
          </div>
        </nav>
      ) : null}
      <div
        className="sp-drill sp-run"
        data-testid="rd-prov-running"
        data-mode={isPage ? 'page' : 'problem'}
        data-exam="true"
      >
        <header className="sp-top sp-run-top">
          <div className="sp-top-left">{failed ? null : abortButton}</div>
          <div className="sp-top-mid">
            <span className="sp-run-half">{HALF_LABEL[running.half]}</span>
            <span className="sp-sec-chip" data-sec={q.section} title={sectionName(q.section)}>
              {q.section}
            </span>
            <RouteRibbon legs={legs} half={running.half} done={done} at={index + 1} labels="code" />
            <span className="sp-top-count">
              Fråga {index + 1} av {total}
            </span>
          </div>
          <div className="sp-top-right">
            {failed ? null : (
              <>
                <SparClock left={left} />
                {overviewButton}
                {submitButton}
              </>
            )}
          </div>
        </header>
        <div className="sp-run-notes">{failure ?? note}</div>
        <div className="sp-body">
          <div className="sp-scroll sp-qscroll sp-run-scroll" ref={scrollRef}>
            <div className="sp-qcol" data-wide={String(isPage)}>
              {card}
              <RunDock scrollRef={scrollRef}>
                <section className="sp-qtray sp-run-tray" aria-label={`Fråga ${index + 1}`}>
                  <div className="sp-run-tray-head">
                    {showPrompt ? (
                      <h2 className="sp-prompt">
                        <MathText>{q.prompt}</MathText>
                      </h2>
                    ) : (
                      <p className="sp-run-tray-q">Fråga {index + 1}</p>
                    )}
                    {failed ? null : flagButton}
                  </div>
                  {tray === 'open' ? null : (
                    <button
                      type="button"
                      className="sp-show"
                      aria-expanded={false}
                      aria-controls={`${id}-opts`}
                      onClick={() => setTray('open')}
                    >
                      Visa alternativen ({letters.length})
                      <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
                      <Kbd>T</Kbd>
                    </button>
                  )}
                  <div className="sp-tray-body" id={`${id}-opts`} hidden={tray !== 'open'}>
                    {failed ? null : reason}
                    {options}
                  </div>
                  <div className="sp-tray-foot sp-run-foot">
                    {tray === 'open' ? (
                      <button
                        type="button"
                        className="sp-icon-btn sp-icon-btn--soft"
                        aria-expanded
                        aria-controls={`${id}-opts`}
                        aria-label="Dölj alternativen"
                        title="Dölj alternativen (T)"
                        onClick={() => setTray('folded')}
                      >
                        <ChevronDown size={22} strokeWidth={2.25} aria-hidden />
                      </button>
                    ) : null}
                    <span className="sp-echo" aria-live="polite">
                      {answer ? `Ditt svar: ${answer}` : 'Inget svar än'}
                    </span>
                    <button
                      type="button"
                      className="sp-btn sp-btn--quiet"
                      disabled={index === 0}
                      onClick={prev}
                    >
                      <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
                      Föregående
                    </button>
                    <button
                      type="button"
                      className={nextClass}
                      disabled={failed && last}
                      onClick={next}
                    >
                      {nextLabel}
                      {failed ? null : <Kbd>↵</Kbd>}
                    </button>
                  </div>
                </section>
              </RunDock>
            </div>
          </div>
        </div>
        {layers}
      </div>
    </div>
  )
}

/** The tray's dock under the question: it sits under a short problem and
 *  sticks to the bottom edge when the card is taller than the room (the
 *  card then fades under it). */
function RunDock({
  scrollRef,
  children,
}: {
  scrollRef: { current: HTMLDivElement | null }
  children: ReactNode
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = endRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      root: scrollRef.current,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [scrollRef])
  return (
    <>
      <div className="sp-qdock" data-stuck={String(stuck)}>
        {children}
      </div>
      <div ref={endRef} className="sp-qend" aria-hidden />
    </>
  )
}

// ── The result ───────────────────────────────────────────────────────

/** The test's own order: the verbal sections, then the quantitative. */
const EXAM_ORDER: readonly Section[] = [...VERBAL, ...KVANT]

/** A result's sections in exam order, whatever order they arrive in. */
function inExamOrder(sections: ProvResultView['sections']): ProvResultView['sections'] {
  return [...sections].sort((a, b) => EXAM_ORDER.indexOf(a.section) - EXAM_ORDER.indexOf(b.section))
}

/** "Starkast på KVA, mest tid per fråga på NOG." — from the legs. */
function readLine(sections: ProvResultView['sections']): string | null {
  const legs = sections.filter((s) => s.presented > 0)
  if (legs.length === 0) return null
  const best = legs.reduce((a, b) => (b.correct / b.presented > a.correct / a.presented ? b : a))
  const slow = legs.reduce((a, b) =>
    b.timeSeconds / b.presented > a.timeSeconds / a.presented ? b : a,
  )
  if (best.section === slow.section) return `Starkast på ${best.section}.`
  return `Starkast på ${best.section}, mest tid per fråga på ${slow.section}.`
}

/**
 * A handed-in pass. The result keeps each leg's counts, not how each
 * question went: `missed` holds the wrong answers' ids (the app's reducer
 * leaves blanks out) without their place in the pass. So Sträckan gives
 * the legs, and no question is called right or missed one by one.
 */
export function SparProvResult({
  width,
  live,
  timedOut,
}: {
  width: WidthKey
  live: boolean
  /** The clock handed this pass in. */
  timedOut: boolean
}) {
  const { data, actions } = useDirectionData()
  const r = data.provpass.result
  const sections = inExamOrder(r.sections)
  const trap = r.trap ?? null
  const phone = width === 'phone'
  const id = useId()
  const size = data.provpass.hub.halves.find((h) => h.half === r.half)?.questions ?? PASS_SIZE
  const wrong = Math.max(0, r.answered - r.correct)
  const blank = Math.max(0, r.presented - r.answered)
  const misses = Math.max(0, r.presented - r.correct)
  const primary =
    misses === 0
      ? { label: 'Till Idag', run: () => actions.go('idag') }
      : wrong > 0
        ? { label: 'Till Repetera', run: actions.openRepetera }
        : { label: 'Till Provpass', run: () => actions.go('provpass') }
  useKeyMap({ Enter: primary.run }, live)

  const scoreLabel = r.score.derived === 'official-derived' ? 'Normerat (härlett)' : 'Skattad poäng'
  // P5 practice texts feed LÄS and ELF; the approved caveat goes with any
  // pass that has those legs.
  const p5 = sections.some((s) => s.section === 'LÄS' || s.section === 'ELF')
  const eyebrow = [
    'Provpass',
    r.sitting,
    r.pass,
    HALF_LABEL[r.half],
    r.mode === 'synthetic' ? 'genererat pass' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const score = (
    <section className="sp-res-score" data-testid="rd-prov-score" aria-labelledby={`${id}-score`}>
      <h2 className="sp-h4 sp-res-score-h" id={`${id}-score`}>
        {scoreLabel}
      </h2>
      {r.score.value != null ? (
        <>
          <p className="sp-progn-n">
            <span aria-hidden>≈</span>
            <span className="sp-sr">ungefär </span>
            {fmtScore(r.score.value)}
            <span className="sp-progn-of">av 2,0</span>
          </p>
          <SparScale
            value={r.score.value}
            label={`${r.score.derived === 'official-derived' ? 'Normerat' : 'Skattat'} ungefär ${fmtScore(r.score.value)} på skalan 0 till 2,0`}
          />
        </>
      ) : (
        <p className="sp-res-basis">Poängen går inte att räkna ut för det här passet.</p>
      )}
      <p className="sp-res-basis">
        {r.score.derived === 'official-derived'
          ? 'Härlett ur UHR:s normeringstabell för detta provtillfälle. UHR normerar hela delprovet (80 frågor) — ett provpass på 40 frågor har ingen officiell tabell, så poängen skalas upp och läses av tabellen.'
          : 'Linjär skattning — indikativ, inte UHR-normerad.'}
      </p>
      {r.total ? (
        <p className="sp-halves">
          {[
            r.total.verbal != null ? `Verbal ${fmtScore(r.total.verbal)}` : null,
            r.total.kvant != null ? `Kvant ${fmtScore(r.total.kvant)}` : null,
            r.total.total != null ? `Totalt ${fmtScore(r.total.total)}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}
      {p5 ? <p className="sp-caveat">{data.copy.estimateCaveat}</p> : null}
    </section>
  )

  return (
    <div className="sp-page sp-res" data-phone={String(phone)} data-testid="rd-prov-result">
      <SparPageHead
        phone={phone}
        eyebrow={eyebrow}
        title={
          <>
            {r.correct} av {r.presented} rätt
          </>
        }
        lede={readLine(sections)}
      />
      {timedOut || r.presented < size ? (
        <div className="sp-res-notes">
          {timedOut ? (
            <p className="sp-res-note">Tiden tog slut, så passet lämnades in automatiskt.</p>
          ) : null}
          {r.presented < size ? (
            <p className="sp-res-note">
              {count(size - r.presented, 'fråga saknas', 'frågor saknas')} ur detta pass — rättat av{' '}
              {r.presented}.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="sp-res-top">
        <div className="sp-res-act">
          <p className="sp-res-misses">
            {misses === 0
              ? 'Inga missar. Hela passet satt.'
              : [
                  wrong > 0 ? `Dina ${wrong} fel ligger redan i Repetera.` : null,
                  blank > 0
                    ? `${blank === 1 ? 'En fråga' : `${cap(inWords(blank))} frågor`} lämnades obesvarade.`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
          </p>
          <div className="sp-res-actions">
            <button
              type="button"
              className="sp-btn sp-btn--primary sp-btn--lg"
              onClick={primary.run}
            >
              {primary.label}
              <Kbd>↵</Kbd>
            </button>
            {primary.label === 'Till Provpass' ? null : (
              <button type="button" className="sp-link" onClick={() => actions.go('provpass')}>
                Till Provpass
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </button>
            )}
          </div>
        </div>
        {score}
      </div>

      <section className="sp-res-route" aria-labelledby={`${id}-route`}>
        <div className="sp-side-head">
          <h2 className="sp-h3" id={`${id}-route`}>
            Sträckan
          </h2>
          <span className="sp-side-meta sp-num">
            {fmtClock(r.durationSeconds)} av {fmtClock(PASS_MINUTES * 60)}
          </span>
        </div>
        <ul className="sp-res-legs">
          {sections.map((s) => {
            const over = s.timeSeconds > s.quotaSeconds
            return (
              <li
                key={s.section}
                className="sp-res-leg"
                data-sec={s.section}
                data-testid={`rd-prov-section-${sectionSlug(s.section)}`}
              >
                <SparStop state="section" size={36} sec={s.section} label={s.section} />
                <span className="sp-res-leg-text">
                  <span className="sp-res-leg-name">{sectionName(s.section)}</span>
                  <span className="sp-res-leg-facts">
                    <b className="sp-num">
                      {s.correct} av {s.presented}
                    </b>
                    <span className="sp-res-leg-time">
                      {' · '}
                      <span className="sp-num">
                        {fmtClock(s.timeSeconds)} av {fmtClock(s.quotaSeconds)}
                      </span>
                      {over ? ' · över budget' : ''}
                    </span>
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="sp-res-more">
        {trap ? (
          <section className="sp-res-trap" aria-labelledby={`${id}-trap`}>
            <h2 className="sp-h3" id={`${id}-trap`}>
              Återkommande fälla
            </h2>
            <div className="sp-trapnote" data-sec={trap.section}>
              <span className="sp-sec-chip sp-sec-chip--sm">{trap.section}</span>
              {trap.headline ? <p className="sp-trapnote-name">{trap.headline}</p> : null}
              <p className="sp-trapnote-text">
                {cap(inWords(trap.count))} av dina missar föll i samma fälla.
              </p>
              <button
                type="button"
                className="sp-link"
                onClick={() => actions.openLesson(trap.frameworkId)}
              >
                Läs i Uppslag
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </button>
            </div>
          </section>
        ) : null}
        <section className="sp-res-exp" aria-labelledby={`${id}-exp`}>
          <h2 className="sp-h3" id={`${id}-exp`}>
            Exponering
          </h2>
          <p className="sp-res-exp-text">
            Du hade sett <span className="sp-num">{r.seenBefore}</span> av{' '}
            <span className="sp-num">{r.presented}</span> frågor innan.
            {blank > 0 ? ` ${count(blank, 'fråga', 'frågor')} lämnades obesvarade.` : ''}
          </p>
        </section>
        <section className="sp-res-hist" aria-labelledby={`${id}-hist`}>
          <h2 className="sp-h3" id={`${id}-hist`}>
            Tidigare {HALF_ADJ[r.half]} pass
          </h2>
          {r.history.length === 0 ? (
            <p className="sp-res-exp-text">Det här är ditt första {HALF_ADJ[r.half]} pass.</p>
          ) : null}
          <ol className="sp-res-hist-list" data-testid="rd-prov-history">
            {r.history.map((h, i) => (
              <li key={h.id} data-testid={`rd-prov-history-item-${i + 1}`}>
                <button
                  type="button"
                  className="sp-res-hist-row"
                  onClick={() => actions.openProvResult(h.id)}
                >
                  <span className="sp-res-hist-when">{h.when}</span>
                  <span className="sp-res-hist-name">
                    {[h.sitting, h.pass].filter(Boolean).join(' · ') || 'Provpass'}
                  </span>
                  <span className="sp-res-hist-n sp-num">
                    {h.correct}/{h.presented}
                    {h.score != null ? ` · ≈ ${fmtScore(h.score)}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
