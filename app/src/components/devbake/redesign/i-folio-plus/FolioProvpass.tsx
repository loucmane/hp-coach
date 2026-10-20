// Folio · Provpass (screen 9) and Provpassresultat (screen 10).
//
// The hub is a timed practice pass under real conditions, set as a page of
// the book: the title "Öva på tid.", the halves as a pair of words, and the
// suggestion — the pass the reader has seen least — set as the lead under
// the heavy rule with the screen's one filled button. "Alla pass" is a
// ruled table, leader dots running from each sitting to its two passes and
// what the reader has already seen of them; choosing a cell moves the lead
// (and its button) to that pass. Starta provpasset only opens the
// conditions, set as a numbered note on a slip; the slip's Starta nu starts
// the clock. The conditions, how a pass is scored and the latest passes are
// marginalia.
//
// The running pass is focus mode in its question's own drill layout — the
// single page for XYZ, KVA, NOG, ORD and MEK, the plate spread for DTK, the
// reading spread for LÄS and ELF — and is never graded: a choice is saved
// and said so, and Nästa fråga works with nothing chosen. The running heads
// keep Avbryt passet at the far left; the last head carries the position,
// Översikt, the clock as time left (foldable to its line, said in words at
// five minutes and at one) and Lämna in. Under it the pass index is cut
// into the page's edge like a booklet's thumb index: one segment a
// question, a gap between sections, answered in ink, the current one in the
// accent. Översikt, the hand-in and the abandon are slips; time running out
// hands the pass in. A marked question gets its page's corner folded.
//
// Folio+ (bead hpf-qr0p.48): on phone the head keeps Avbryt and the clock,
// and Spår's thumb row — Markera · Översikt · Lämna in — sits above Nästa;
// the index is its own strip of 24 px tap targets under the head. The
// hand-in slip sums up as Samtal and Ljuskägla do: the blanks as ranges and
// the marked as chips, each a way back to its question. Översikt and the
// hand-in open on their safe button, so ↵ never hands in by default. A
// press on Markera hands the focus back to the question (↵ is "nästa
// fråga" again), and every mark is said as well as drawn.
//
// A pass is handed in once — by Lämna in or when the time is up — and is
// then over, whatever the host answers: kit v2 has no way to say a second
// try is safe. A host that opens the result leaves the pass behind; one that
// stays on screen 9 gets the pass's closing page in the frame, "Passet är
// inlämnat." or, when the hand-in failed, the error, with the answers as they
// stood, read-only, and the way to the hub.
//
// The result is a book's closing page and appendix: ⁂ over "Provpasset
// klart.", one light figure with its numbered footnote and the 0–2,0 scale,
// "Per delprov" as a ruled table in test order with the tempo said in
// words, the misses as an errata list, and the earlier passes of the same
// kind, a recurring trap and the exposure in the margin. A pass known to
// rest on övningstexter (its own questions, or its misses, say so) adds the
// calibration caveat as a second footnote; unknown provenance claims none.
//
// Kit v2: everything reads useDirectionData(). The hub asks the host to
// start a pass (actions.startProvpass) and shows it running once the host's
// running view is that pass; Lämna in asks it to hand in
// (actions.submitProvpass). Fields the view model marks optional (the
// flags, a combined total) are left out when absent.
//
// The quant problem, the DTK plate, the inline figure, Förstora and the
// erratum are lifted from FolioQuant.tsx (screens 6–7), whose originals are
// private there and outside batch 2's write set; they are the same parts,
// set the same way. FolioQuant should export its own and these copies go.

import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  Fragment,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  fmtClock,
  isForeignKey,
  useHideOnScroll,
  useKeyMap,
  useSheet,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillQuestion,
  Half,
  ProvHalfView,
  ProvPassOptionView,
  ProvResultSummaryView,
  ProvRunningView,
  ProvSectionResultView,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { type AnswerLetter, SECTION_KEYS, type Section } from '@/data/questions'
import { sectionOfQid } from '@/lib/dueBySection'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { isP5Qid } from '@/lib/provenance'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import {
  FolioDialog,
  FolioSlip,
  GapText,
  Options,
  type PassageModel,
  PassageView,
  questionStem,
  Spread,
  TimeLine,
} from './FolioDrill'
import {
  ContentsEntry,
  capitalised,
  FolioPage,
  inWords,
  Lead,
  MarginBlock,
  Masthead,
  PartHead,
  ResultFigure,
  Scale,
  slug,
} from './FolioHome'
import './fpProvpass.css'

const HALF_WORD: Record<Half, string> = { verbal: 'Verbal', kvant: 'Kvantitativ' }
/** What UHR normerar: the whole half, two passes of 40. */
const HALF_PART: Record<Half, string> = {
  verbal: 'den verbala delen',
  kvant: 'den kvantitativa delen',
}
const HALF_QUESTIONS = 80
/** The clock's milestones, said once each: five minutes and one. */
const MILESTONES = [300, 60] as const
const ORDINALS = ['Första', 'Andra', 'Tredje', 'Fjärde', 'Femte', 'Sjätte', 'Sjunde', 'Åttonde']
/** Option counts in prose ("de fyra alternativen": neuter). */
const OPTION_WORDS = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem']
/** Förstora's zoom steps: 100 % is the whole page on the stage. */
const ZOOMS = [1, 1.5, 2, 3, 4, 6]
/** A focused control keeps ↵ and space for itself. */
const CONTROL = 'button, a[href], summary, [role="button"], [role="menuitem"]'
const NO_REF = () => {}
const NO_REFS = { para: () => NO_REF }

// ── Words and numbers ────────────────────────────────────────────────

/** "Hösten 2025, provpass 1": a pass as the notice names it. */
export function passName(sitting: string | null, pass: string | null): string {
  if (sitting && pass) {
    return `${sitting}, ${pass.charAt(0).toLocaleLowerCase('sv-SE')}${pass.slice(1)}`
  }
  return sitting ?? pass ?? 'Genererat pass'
}

/** A pass's score with HP's two decimals: 1.4 → "1,40". */
export function fmtPassScore(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

/** A pass id in a test id: 'host-2025:kvant1' → 'host-2025-kvant1' (the
 *  shared contract's passSlug; contract.ts itself is test-only). */
function passSlug(id: string): string {
  return id.replace(':', '-')
}

/** The half's sections as the notice prints them: "XYZ 12 · KVA 10 · …". */
function composition(h: ProvHalfView | undefined): string {
  return h ? h.sections.map((s) => `${s.section} ${s.count}`).join(' · ') : ''
}

/** A rule read out before a pass, as a sentence: "Ingen paus." */
function ruleSentence(rule: string): string {
  const text = capitalised(rule.trim().replace(/\s+—\s+/g, ' – '))
  return /[.!?]$/.test(text) ? text : `${text}.`
}

/** Sittings newest first: the year, and autumn after spring. */
function sittingRank(examId: string): number {
  const m = /^(var|host)-(?:ver\d+-)?(\d{4})/.exec(examId)
  return m ? Number(m[2]) * 2 + (m[1] === 'host' ? 1 : 0) : 0
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** "53 minuter": whole minutes used, never rounded up past the time. */
function minutesUsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${m} ${m === 1 ? 'minut' : 'minuter'}`
}

/** "31 minuter och 12 sekunder kvar": the clock as a sentence. */
function timeLeftSentence(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m} ${m === 1 ? 'minut' : 'minuter'} och ${s} ${s === 1 ? 'sekund' : 'sekunder'} kvar`
}

/** The section runs of a pass, in printed order. */
function runsOf(questions: readonly DrillQuestion[]) {
  const runs: { section: Section; start: number; end: number }[] = []
  questions.forEach((q, i) => {
    const last = runs[runs.length - 1]
    if (last && last.section === q.section) last.end = i + 1
    else runs.push({ section: q.section, start: i, end: i + 1 })
  })
  return runs
}

/** The printed page a DTK question stands on and the run of questions on
 *  it (they come consecutively in a pass). */
function plateGroup(questions: readonly DrillQuestion[], index: number) {
  const src = questions[index]?.figure?.src
  let first = index
  let last = index
  while (src && first > 0 && questions[first - 1].figure?.src === src) first--
  while (src && last + 1 < questions.length && questions[last + 1].figure?.src === src) last++
  return { pos: index - first, count: last - first + 1, first, last }
}

// ── The hub ──────────────────────────────────────────────────────────

/** Why the last pass did not count, said once above the lead until the
 *  next start. */
export type ProvNote = 'void' | 'expired' | 'missing' | null

const NOTE_TEXT: Record<Exclude<ProvNote, null>, string> = {
  void: 'Provet avbröts – ogiltigt. Dina missar ligger i Repetera.',
  expired: 'Passet hann ta slut innan det lämnades in. Det räknas inte.',
  missing: 'Passets frågor gick inte att visa. Inget har räknats.',
}

type Sitting = {
  examId: string
  sitting: string
  passes: [ProvPassOptionView | null, ProvPassOptionView | null]
}

/** The half's passes by sitting, newest first, with Provpass 1 and 2 in
 *  their columns (null where a sitting has no such pass). */
function register(passes: readonly ProvPassOptionView[]): Sitting[] {
  const by = new Map<string, Sitting>()
  for (const p of passes) {
    const s = by.get(p.examId) ?? { examId: p.examId, sitting: p.sitting, passes: [null, null] }
    const col = /2$/.test(p.provpass) ? 1 : 0
    if (!s.passes[col]) s.passes[col] = p
    by.set(p.examId, s)
  }
  return [...by.values()].sort((a, z) => sittingRank(z.examId) - sittingRank(a.examId))
}

function passLabel(p: ProvPassOptionView, chosen: boolean): string {
  return `${passName(p.sitting, p.pass)}, sett ${p.seenBefore} av ${p.presented}${
    p.suggested ? ', minst sett' : ''
  }${chosen ? ', valt' : ''}`
}

export function FolioProvpass({
  width,
  live,
  note,
  pending,
  onAsk,
  onCancel,
  onHistorik,
}: {
  width: WidthKey
  live: boolean
  note: ProvNote
  /** A started pass whose questions the host has not handed down yet. */
  pending: string | null
  /** Opens the conditions slip for a pass. */
  onAsk: (passId: string) => void
  /** From a pending pass back to the register. */
  onCancel: () => void
  /** "Alla pass i Historik". */
  onHistorik: () => void
}) {
  const { data, actions } = useDirectionData()
  const { hub } = data.provpass
  const phone = width === 'phone'
  const [half, setHalf] = useState<Half>(hub.half)
  const [picked, setPicked] = useState<string | null>(null)
  const [everySitting, setEverySitting] = useState(false)
  const passes = hub.passes.filter((p) => p.half === half)
  const suggested = passes.find((p) => p.suggested) ?? passes[0] ?? null
  const chosen = passes.find((p) => p.id === picked) ?? suggested
  // The lead follows a choice that is not the suggestion itself.
  const own = chosen != null && chosen.id === picked && !chosen.suggested
  const halfView = hub.halves.find((h) => h.half === half)
  const sittings = register(passes)
  const waiting = pending ? (hub.passes.find((p) => p.id === pending) ?? null) : null
  const ask = () => {
    if (chosen && !pending) onAsk(chosen.id)
  }
  useKeyMap(chosen && !pending ? { Enter: ask } : {}, live)
  const missing = chosen && halfView ? Math.max(0, halfView.questions - chosen.presented) : 0
  const minutes = halfView?.minutes ?? hub.halves[0]?.minutes
  const questions = halfView?.questions ?? hub.halves[0]?.questions

  const lead = waiting ? (
    <Lead labelledBy="fp-prov-lead">
      <div className="fp-resume-top">
        <span className="fp-label">Valt pass</span>
      </div>
      <h2 className="fp-lead-title" id="fp-prov-lead">
        {passName(waiting.sitting, waiting.pass)}
      </h2>
      <p className="fp-empty" role="status">
        Frågorna till passet är inte framme än.
      </p>
      <div className="fp-resume-foot">
        <button type="button" className="fp-quiet-btn" onClick={onCancel}>
          Välj ett annat pass
        </button>
      </div>
    </Lead>
  ) : chosen ? (
    <Lead labelledBy="fp-prov-lead">
      <div className="fp-resume-top">
        <span className="fp-label">{own ? 'Valt pass' : 'Förslag · minst sett'}</span>
      </div>
      <h2 className="fp-lead-title" id="fp-prov-lead">
        {passName(chosen.sitting, chosen.pass)}
      </h2>
      <p className="fp-lead-sub">
        {[HALF_WORD[half], composition(halfView)].filter(Boolean).join(' · ')}
      </p>
      <p className="fp-kallelse">
        Du har sett {chosen.seenBefore} av {chosen.presented} frågor.
      </p>
      {missing > 0 ? (
        <p className="fp-kallelse">
          Passet har {chosen.presented} frågor – {missing === 1 ? 'en' : inWords(missing)} saknas i
          källan.
        </p>
      ) : null}
      <div className="fp-resume-foot">
        <button
          type="button"
          className="fp-btn fp-btn--big"
          data-testid="rd-prov-start"
          onClick={ask}
        >
          Starta provpasset
          <kbd className="fp-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
        <span className="fp-hint">Villkoren först – klockan startar när du säger till.</span>
      </div>
    </Lead>
  ) : (
    <Lead labelledBy="fp-prov-lead">
      <p className="fp-empty fp-empty--lead" id="fp-prov-lead">
        Inga riktiga pass att välja i den här halvan just nu.
      </p>
    </Lead>
  )

  // Phone: the three newest sittings, and always the chosen pass's.
  const shownSittings =
    everySitting || sittings.length <= 3
      ? sittings
      : sittings.filter((s, i) => i < 3 || s.passes.some((p) => p != null && p.id === chosen?.id))

  const registerSection = passes.length ? (
    <section className="fp-section" aria-labelledby="fp-reg-h">
      <div className="fp-section-head">
        <h2 className="fp-h2" id="fp-reg-h">
          Alla pass
        </h2>
        <span className="fp-meta">
          {sittings.length} {sittings.length === 1 ? 'provtillfälle' : 'provtillfällen'}
        </span>
      </div>
      {phone ? (
        <div className="fp-register-phone">
          {shownSittings.map((s) => (
            <div className="fp-part-block" key={s.examId}>
              <PartHead id={`fp-reg-${s.examId}`}>{s.sitting}</PartHead>
              <ul aria-labelledby={`fp-reg-${s.examId}`}>
                {s.passes.map((p, k) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: the two pass columns keep their order
                  <li key={k}>
                    {p ? (
                      <div
                        className="fp-entry"
                        data-suggested={chosen?.id === p.id ? 'true' : undefined}
                      >
                        <ContentsEntry
                          code=""
                          title={p.pass}
                          page={`sett ${p.seenBefore}/${p.presented}`}
                          lining
                          label={passLabel(p, chosen?.id === p.id)}
                          testId={`rd-prov-pass-${passSlug(p.id)}`}
                          onClick={() => setPicked(p.id)}
                        />
                      </div>
                    ) : (
                      <ContentsEntry code="" title={`Provpass ${k + 1}`} page="—" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {sittings.length > 3 ? (
            <button
              type="button"
              className="fp-more"
              aria-expanded={everySitting}
              onClick={() => setEverySitting(!everySitting)}
            >
              {everySitting
                ? 'Visa bara de senaste provtillfällena'
                : `Visa alla ${sittings.length} provtillfällen`}
              <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>
      ) : (
        <table className="fp-table fp-register">
          <caption className="fp-sr">
            Alla pass: varje provtillfälle med provpass 1 och 2 och hur många av frågorna du har
            sett
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="fp-sr">Provtillfälle</span>
              </th>
              <th scope="col">Provpass 1</th>
              <th scope="col">Provpass 2</th>
            </tr>
          </thead>
          <tbody>
            {sittings.map((s) => (
              <tr key={s.examId}>
                <th scope="row">
                  <span className="fp-th-line">
                    <span className="fp-table-name">{s.sitting}</span>
                    <span className="fp-leader" aria-hidden />
                  </span>
                </th>
                {s.passes.map((p, k) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: the two pass columns keep their order
                  <td key={k}>
                    {p ? (
                      <button
                        type="button"
                        className="fp-cell"
                        data-testid={`rd-prov-pass-${passSlug(p.id)}`}
                        aria-pressed={chosen?.id === p.id}
                        aria-label={passLabel(p, false)}
                        onClick={() => setPicked(p.id)}
                      >
                        sett {p.seenBefore}/{p.presented}
                      </button>
                    ) : (
                      <span className="fp-table-none">
                        —<span className="fp-sr">inget pass</span>
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  ) : null

  const aside = (
    <>
      <MarginBlock id="fp-prov-rules-h" title="Villkoren">
        <p className="fp-margin-note">{hub.rules.map(ruleSentence).join(' ')}</p>
      </MarginBlock>
      <MarginBlock id="fp-prov-score-h" title="Poängen">
        <p className="fp-margin-note">
          Ett pass ur ett tidigare prov rättas mot det provets normeringstabell.
        </p>
      </MarginBlock>
      <MarginBlock id="fp-prov-last-h" title="Senaste passen">
        {hub.results.length ? (
          <ol className="fp-results">
            {hub.results.slice(0, 3).map((r) => (
              <li key={r.id}>
                <ResultRow r={r} onOpen={() => actions.openProvResult(r.id)} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="fp-margin-note">Inga pass ännu – det första blir din baslinje.</p>
        )}
        <button type="button" className="fp-link" onClick={onHistorik}>
          Alla pass i Historik
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </MarginBlock>
    </>
  )

  return (
    <FolioPage
      width={width}
      masthead={<Masthead label="Provpass" />}
      aside={aside}
      asideLabelledBy="fp-prov-rules-h"
    >
      <h1 className="fp-greet">Öva på tid.</h1>
      {questions != null && minutes != null ? (
        <p className="fp-day">
          Ett övningspass under riktiga provvillkor: {questions} frågor på {minutes} minuter – ingen
          feedback förrän du lämnar in.
        </p>
      ) : null}
      <div className="fp-choices">
        <span className="fp-choice-label" id="fp-half-label">
          Halva
        </span>
        <fieldset className="fp-seg fp-seg--words" aria-labelledby="fp-half-label">
          {hub.halves.map((h) => (
            <button
              type="button"
              key={h.half}
              data-testid={`rd-prov-half-${h.half}`}
              aria-pressed={h.half === half}
              onClick={() => {
                setHalf(h.half)
                setPicked(null)
              }}
            >
              {h.label}
            </button>
          ))}
        </fieldset>
      </div>
      {note ? (
        <div className="fp-erratum fp-prov-note" role="status">
          <p>{NOTE_TEXT[note]}</p>
        </div>
      ) : null}
      {lead}
      {waiting ? null : registerSection}
    </FolioPage>
  )
}

/** A finished pass in a list: the half, the raw count, the score on its
 *  own scale and when; it opens the pass's result page. */
function ResultRow({ r, onOpen }: { r: ProvResultSummaryView; onOpen: () => void }) {
  const score = r.score != null ? fmtPassScore(r.score) : null
  return (
    <button
      type="button"
      className="fp-result-row"
      onClick={onOpen}
      aria-label={`${HALF_WORD[r.half]}, ${passName(r.sitting, r.pass)}, ${r.correct} av ${
        r.presented
      } rätt${score ? `, ${score}` : ''}, ${r.when}. Visa resultatet`}
    >
      <span className="fp-result-row-what">{HALF_WORD[r.half]}</span>
      <span className="fp-result-row-raw">
        {r.correct}/{r.presented}
      </span>
      <span className="fp-result-row-score">{score ?? '—'}</span>
      <span className="fp-result-row-when">{r.when}</span>
    </button>
  )
}

/** The conditions, read out once before the clock starts (the hub's slip):
 *  the pass, its size and time, the four rules numbered, Starta nu (↵) and
 *  Inte nu (Esc). A second press of Starta nu starts nothing more. */
export function ConditionsSlip({
  passId,
  onStart,
  onClose,
}: {
  passId: string
  onStart: (passId: string) => void
  onClose: () => void
}) {
  const { data } = useDirectionData()
  const { hub } = data.provpass
  const started = useRef(false)
  const pass = hub.passes.find((p) => p.id === passId)
  if (!pass) return null
  const half = hub.halves.find((h) => h.half === pass.half)
  const missing = half ? Math.max(0, half.questions - pass.presented) : 0
  return (
    <FolioSlip id="fp-start" title="Starta provpass" onClose={onClose}>
      <p className="fp-slip-title">{passName(pass.sitting, pass.pass)}</p>
      <p className="fp-slip-sub">
        {HALF_WORD[pass.half]} · {pass.presented} frågor
        {half ? ` · ${half.minutes} minuter` : ''}
      </p>
      {missing > 0 ? (
        <p className="fp-slip-lede">
          {missing === 1 ? 'En fråga saknas' : `${capitalised(inWords(missing))} frågor saknas`} i
          källan, så passet rättas på {pass.presented}.
        </p>
      ) : null}
      <ol className="fp-slip-rules" aria-label="Villkoren">
        {hub.rules.map((rule, i) => (
          <li key={rule}>
            <span className="fp-slip-n" aria-hidden>
              {i + 1}
            </span>
            {ruleSentence(rule)}
          </li>
        ))}
      </ol>
      <div className="fp-slip-actions">
        <button
          type="button"
          className="fp-btn"
          data-testid="rd-confirm"
          data-autofocus
          onClick={() => {
            if (started.current) return
            started.current = true
            onStart(pass.id)
          }}
        >
          Starta nu
          <kbd className="fp-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
        <button type="button" className="fp-quiet-btn" onClick={onClose}>
          Inte nu
          <kbd className="fp-kbd" aria-hidden>
            Esc
          </kbd>
        </button>
      </div>
    </FolioSlip>
  )
}

// ── The running pass ─────────────────────────────────────────────────

type Slip = 'overview' | 'handin' | 'abort' | null

/** How a started pass ended once its one hand-in was tried: handed in (the
 *  host's action returned and it stayed on screen 9), or failed (the action
 *  threw). Either way the pass is over. */
export type PassEnd = {
  outcome: 'submitted' | 'failed'
  /** The pass as it ran: its closing page needs nothing more from the host. */
  run: Pick<ProvRunningView, 'passId' | 'half' | 'sitting' | 'pass' | 'mode' | 'questions'>
  /** The answers as they stood at the hand-in. */
  answers: Partial<Record<string, AnswerLetter>>
}

/**
 * The running pass (screen 9, once started). Whether its time is already
 * up is decided once, when it opens: such a pass never runs again and does
 * not count (the hub says so); a pass whose time runs out later is handed
 * in — never voided. The hand-in is tried once, and then the pass is over.
 */
export function FolioPassRun({
  width,
  live,
  onLeave,
  onEnd,
}: {
  width: WidthKey
  live: boolean
  /** Back to the hub, with the note that says why. */
  onLeave: (note: ProvNote) => void
  /** The hand-in was tried: the pass is over, with how it ended. */
  onEnd: (end: PassEnd) => void
}) {
  const { data } = useDirectionData()
  const run = data.provpass.running
  const [ended] = useState<ProvNote>(() =>
    run.remainingSeconds <= 0 ? 'expired' : run.questions.length === 0 ? 'missing' : null,
  )
  const leave = useRef(onLeave)
  leave.current = onLeave
  const end = useRef(onEnd)
  end.current = onEnd
  useLayoutEffect(() => {
    if (ended) leave.current(ended)
  }, [ended])
  if (ended) return null
  return (
    <PassRunner
      run={run}
      width={width}
      live={live}
      onLeave={(n) => leave.current(n)}
      onEnd={(e) => end.current(e)}
    />
  )
}

/** What the running pass's layouts read and do (one object, so the desktop
 *  and phone layouts stay in step). */
type PassChrome = {
  run: ProvRunningView
  q: DrillQuestion
  index: number
  total: number
  answers: Partial<Record<string, AnswerLetter>>
  chosen: AnswerLetter | null
  struck: AnswerLetter[]
  letters: AnswerLetter[]
  /** Null: the host has no flags, so there is no Markera. */
  flags: string[] | null
  flagged: boolean
  remaining: number
  urgent: boolean
  clockShown: boolean
  toggleClock: () => void
  /** No more answering: the time is up (the pass is being handed in). */
  locked: boolean
  /** The key line shows on the question the reader came in on. */
  showKeys: boolean
  rot: number
  focusPara: number | null
  setFocusPara: (n: number | null) => void
  note: boolean
  setNote: (open: boolean) => void
  headingRef: RefObject<HTMLHeadingElement | null>
  badge: string
  noteText: string
  live: boolean
  /** Touch first: no keyboard hint, the thumb row above Nästa. */
  phone: boolean
  act: {
    goTo: (i: number) => void
    advance: () => void
    pick: (l: AnswerLetter) => void
    strike: (l: AnswerLetter) => void
    /** `pointer`: pressed by mouse or touch, so the focus goes back to the
     *  question and ↵ is "nästa fråga" again. */
    toggleFlag: (pointer: boolean) => void
    ask: (s: Exclude<Slip, null>) => void
    rotate: () => void
    zoom: (figure: DrillFigure) => void
  }
}

function PassRunner({
  run,
  width,
  live,
  onLeave,
  onEnd,
}: {
  run: ProvRunningView
  width: WidthKey
  live: boolean
  onLeave: (note: ProvNote) => void
  onEnd: (end: PassEnd) => void
}) {
  const { data, actions } = useDirectionData()
  const questions = run.questions
  const total = questions.length
  // The pass owns its place: a host that hands down fewer questions never
  // leaves it past the end.
  const [pos, setPos] = useState(run.current)
  const index = clamp(pos, 0, Math.max(0, total - 1))
  if (total > 0 && pos !== index) setPos(index)
  const q: DrillQuestion | undefined = questions[index]
  const [startIndex] = useState(run.current)
  const [answers, setAnswers] = useState<Partial<Record<string, AnswerLetter>>>(() => ({
    ...run.answers,
  }))
  const [struck, setStruck] = useState<Partial<Record<string, AnswerLetter[]>>>({})
  const [flags, setFlags] = useState<string[] | null>(() => (run.flags ? [...run.flags] : null))
  const [slip, setSlip] = useState<Slip>(null)
  const [viewing, setViewing] = useState<DrillFigure | null>(null)
  const [rotations, setRotations] = useState<Record<string, number>>({})
  const viewerStates = useRef(new Map<string, ViewerState>())
  // The hand-in is tried once, by hand or at time out, and never again: not
  // after a failure, and not when either clock runs out afterwards. Kit v2
  // has no signal that a second try is safe, so once tried the pass is over.
  const attempted = useRef(false)
  const [focusPara, setFocusPara] = useState<number | null>(null)
  const [note, setNote] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // The clock: a deadline set once, when the pass opens; a host countdown
  // that ticks on its own can only bring the end closer.
  const [deadline] = useState(() => Date.now() + Math.max(0, run.remainingSeconds) * 1000)
  const [now, setNow] = useState(() => Date.now())
  const remaining = Math.min(
    Math.max(0, Math.ceil((deadline - now) / 1000)),
    Math.max(0, run.remainingSeconds),
  )
  const [clockShown, setClockShown] = useState(true)
  const [said, setSaid] = useState('')
  const [spoken] = useState(() => new Set<number>(MILESTONES.filter((m) => remaining <= m)))

  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [live])

  // What the hand-in takes with it: the answers as they stand.
  const latest = useRef({ run, answers })
  latest.current = { run, answers }
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  const submit = useCallback(() => {
    if (attempted.current) return
    attempted.current = true
    setSlip(null)
    setViewing(null)
    let outcome: PassEnd['outcome'] = 'submitted'
    try {
      actions.submitProvpass()
    } catch {
      outcome = 'failed'
    }
    // Over either way. A host that opens the result leaves this behind; one
    // that stays on screen 9 shows the pass's closing page instead.
    endRef.current({ outcome, run: latest.current.run, answers: latest.current.answers })
  }, [actions])
  const submitRef = useRef(submit)
  submitRef.current = submit

  // Time out: handed in, unless the hand-in was already tried.
  useEffect(() => {
    if (remaining <= 0) submitRef.current()
  }, [remaining])

  // Five minutes and one minute left: said once each, in words; at five
  // the folded clock comes back in place.
  useEffect(() => {
    for (const m of MILESTONES) {
      if (remaining > m || remaining <= 0 || spoken.has(m)) continue
      spoken.add(m)
      setSaid(m === 300 ? 'Fem minuter kvar' : 'En minut kvar')
      if (m === 300) setClockShown(true)
    }
  }, [remaining, spoken])

  // A move lands on the question's heading, which is how a screen reader
  // hears where it is; the passage aids start over.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a new question only
  useEffect(() => {
    if (!live) return
    headingRef.current?.focus({ preventScroll: true })
    setFocusPara(null)
    setNote(false)
  }, [index])

  /** Whether the pass takes input now; a deadline passed while the tab
   *  slept hands the pass in instead (unless it was already tried). */
  const canAct = (): boolean => {
    if (attempted.current) return false
    if (live && Date.now() >= deadline) {
      submitRef.current()
      return false
    }
    return remaining > 0
  }
  const goTo = (i: number) => {
    if (total === 0 || !canAct()) return
    setPos(clamp(i, 0, total - 1))
    setSlip(null)
  }
  const advance = () => {
    if (!canAct()) return
    if (index + 1 < total) goTo(index + 1)
    else setSlip('handin')
  }
  const has = (l: AnswerLetter) => q?.options?.some((o) => o.letter === l) ?? false
  const pick = (l: AnswerLetter) => {
    if (!q || !has(l) || !canAct()) return
    const qid = q.qid
    setAnswers((a) => ({ ...a, [qid]: l }))
    setStruck((s) => ({ ...s, [qid]: (s[qid] ?? []).filter((x) => x !== l) }))
  }
  const strike = (l: AnswerLetter) => {
    if (!q || !has(l) || !canAct()) return
    const qid = q.qid
    const on = (struck[qid] ?? []).includes(l)
    setStruck((s) => ({
      ...s,
      [qid]: on ? (s[qid] ?? []).filter((x) => x !== l) : [...(s[qid] ?? []), l],
    }))
    // Striking the saved choice takes it back, as in a drill.
    if (!on && answers[qid] === l) {
      setAnswers((a) => {
        const next = { ...a }
        delete next[qid]
        return next
      })
    }
  }
  const toggleFlag = (pointer: boolean) => {
    if (!q || !flags || !canAct()) return
    const qid = q.qid
    const on = !flags.includes(qid)
    setFlags((f) => (f ? (f.includes(qid) ? f.filter((x) => x !== qid) : [...f, qid]) : f))
    // Never silent: the mark is said as well as drawn.
    setSaid(
      on
        ? `Fråga ${index + 1} markerad för återkomst.`
        : `Markeringen på fråga ${index + 1} är borttagen.`,
    )
    // A press leaves the focus on Markera, where ↵ would take the mark back
    // instead of moving on: the question's heading takes it again. From the
    // keyboard the focus stays where the reader put it.
    if (pointer) headingRef.current?.focus({ preventScroll: true })
  }
  const ask = (s: Exclude<Slip, null>) => {
    if (canAct()) setSlip(s)
  }
  const rotate = () => {
    const src = q?.figure?.src
    if (src) setRotations((r) => ({ ...r, [src]: ((r[src] ?? 0) + 90) % 360 }))
  }
  const zoom = (figure: DrillFigure) => {
    if (canAct()) setViewing(figure)
  }

  // Keys, in the capture phase so the pass hears them first. The digits are
  // the bake-off switcher's: mid-pass they never change the direction,
  // whatever has focus. ←/→ change the question (and so never the screen)
  // from anywhere but a focused scroll surface itself, which keeps them and
  // space to scroll, its keyscope holding off the switcher; the heading that
  // has focus after every move is inside such a surface, and moves on. A–E
  // choose and save, ⇧ + letter strikes, ↵ and space move on (a focused
  // control keeps its own). Esc never leaves; a slip or Förstora takes the
  // keys while it is open. Once the hand-in is tried, none are the pass's.
  const keys = useRef({ goTo, advance, pick, strike, index, letters: [] as AnswerLetter[] })
  const blocked = slip != null || viewing != null
  keys.current = {
    goTo,
    advance,
    pick,
    strike,
    index,
    letters: q?.options?.map((o) => o.letter) ?? [],
  }
  const blockedRef = useRef(blocked)
  blockedRef.current = blocked
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (attempted.current || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target instanceof Element ? e.target : null
      // The scroll surface itself, never what is inside it.
      const region = t?.hasAttribute('data-fp-region') ?? false
      const arrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
      if ((arrow && !region) || /^[0-9]$/.test(e.key)) e.preventDefault()
      if (blockedRef.current || isForeignKey(e)) return
      const k = keys.current
      const control = t?.closest(CONTROL) != null
      if (arrow) {
        if (!region) k.goTo(k.index + (e.key === 'ArrowRight' ? 1 : -1))
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (control || (e.key === ' ' && region)) return
        e.preventDefault()
        if (!e.repeat) k.advance()
        return
      }
      const letter = e.key.length === 1 ? (e.key.toUpperCase() as AnswerLetter) : null
      if (letter && k.letters.includes(letter)) {
        e.preventDefault()
        if (e.shiftKey) k.strike(letter)
        else k.pick(letter)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live])

  if (!q) return <PassEmpty width={width} onBack={() => onLeave('missing')} />

  const chrome: PassChrome = {
    run,
    q,
    index,
    total,
    answers,
    chosen: answers[q.qid] ?? null,
    struck: struck[q.qid] ?? [],
    letters: q.options?.map((o) => o.letter) ?? [],
    flags,
    flagged: flags?.includes(q.qid) ?? false,
    remaining,
    urgent: remaining <= 300,
    clockShown,
    toggleClock: () => setClockShown((s) => !s),
    locked: remaining <= 0,
    showKeys: index === startIndex,
    rot: q.figure ? (rotations[q.figure.src] ?? 0) : 0,
    focusPara,
    setFocusPara,
    note,
    setNote,
    headingRef,
    badge: data.copy.ovningstextBadge,
    noteText: data.copy.ovningstextNote,
    live,
    phone: width === 'phone',
    act: { goTo, advance, pick, strike, toggleFlag, ask, rotate, zoom },
  }
  const modal = slip != null || viewing != null
  return (
    <>
      <div
        className="fp-passroot"
        data-testid="rd-prov-running"
        data-rd-keyscope
        inert={modal || undefined}
      >
        {width === 'phone' ? <PhonePass c={chrome} /> : <DeskPass c={chrome} />}
      </div>
      {/* Outside the page, so it is heard while a slip is open too. */}
      <span className="fp-sr" role="status">
        {said}
      </span>
      {slip === 'overview' ? (
        <OverviewSlip
          run={run}
          index={index}
          answers={answers}
          flags={flags}
          onGo={goTo}
          onHandin={() => setSlip('handin')}
          onClose={() => setSlip(null)}
        />
      ) : null}
      {slip === 'handin' ? (
        <HandinSlip
          questions={questions}
          answers={answers}
          flags={flags}
          onGo={goTo}
          onSubmit={submit}
          onClose={() => setSlip(null)}
        />
      ) : null}
      {slip === 'abort' ? (
        <AbortSlip onAbandon={() => onLeave('void')} onClose={() => setSlip(null)} />
      ) : null}
      {viewing ? (
        <FigureViewer
          figure={viewing}
          rot={rotations[viewing.src] ?? 0}
          rotate={() =>
            setRotations((r) => ({ ...r, [viewing.src]: ((r[viewing.src] ?? 0) + 90) % 360 }))
          }
          saved={viewerStates.current.get(viewing.src)}
          onClose={(state) => {
            viewerStates.current.set(viewing.src, state)
            setViewing(null)
          }}
        />
      ) : null}
    </>
  )
}

/** A pass with no question to show: a blank page that says so. */
function PassEmpty({ width, onBack }: { width: WidthKey; onBack: () => void }) {
  return (
    <div className={width === 'phone' ? 'fp-pdrill' : 'fp-drill'}>
      <div className="fp-main fp-done">
        <div className="fp-colophon">
          <h2>Passets frågor gick inte att visa.</h2>
          <p>Inget har räknats. Välj ett pass bland provpassen igen.</p>
          <div className="fp-colophon-actions">
            <button type="button" className="fp-btn" onClick={onBack}>
              Till provpassen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── The pass's parts ─────────────────────────────────────────────────

/** Avbryt passet: the verb that voids, at the far left of the first head. */
function AbortButton({ c, compact = false }: { c: PassChrome; compact?: boolean }) {
  return (
    <button
      type="button"
      className="fp-ghost"
      data-testid="rd-exit"
      onClick={() => c.act.ask('abort')}
      disabled={c.locked}
      aria-label={compact ? 'Avbryt passet' : undefined}
      title="Avbryter du blir provet ogiltigt"
    >
      <X size={18} strokeWidth={1.5} aria-hidden />
      {compact ? null : 'Avbryt passet'}
    </button>
  )
}

/** "PROVPASS · LÄS · ÖVNINGSTEXT": the head's centre (the badge lives here
 *  only, on desktop). */
function PassLabel({ c }: { c: PassChrome }) {
  return (
    <span className="fp-label fp-runhead-title">
      Provpass · {c.q.section}
      {c.q.passage?.synthetic ? ` · ${c.badge}` : ''}
    </span>
  )
}

/**
 * The clock as time left, a role="timer" named in words (never live). The
 * figures fold away to the head's line on a press and come back on their
 * own at five minutes; from there they are set heavier, in ink — never red,
 * never flashing.
 */
function Countdown({ c }: { c: PassChrome }) {
  return (
    <span
      className="fp-countdown"
      role="timer"
      aria-label={timeLeftSentence(c.remaining)}
      data-testid="rd-prov-timer"
      data-urgent={c.urgent ? 'true' : undefined}
    >
      <button
        type="button"
        className="fp-clock"
        aria-pressed={!c.clockShown}
        aria-label={c.clockShown ? 'Dölj klockan' : 'Visa klockan'}
        title={c.clockShown ? 'Dölj klockan – en tunn linje visar tiden' : 'Visa klockan'}
        onClick={c.toggleClock}
      >
        <Clock size={15} strokeWidth={1.5} aria-hidden className="fp-clock-icon" />
        {c.clockShown ? <span aria-hidden>{fmtClock(c.remaining)} kvar</span> : null}
      </button>
    </span>
  )
}

/** The last head's tools: the position, Översikt, the clock and Lämna in. */
function PassTools({ c, position = true }: { c: PassChrome; position?: boolean }) {
  return (
    <span className="fp-pass-tools">
      {position ? (
        <span className="fp-pass-pos">
          Fråga {c.index + 1} av {c.total}
        </span>
      ) : null}
      <button
        type="button"
        className="fp-ghost"
        aria-haspopup="dialog"
        disabled={c.locked}
        onClick={() => c.act.ask('overview')}
      >
        Översikt
      </button>
      <Countdown c={c} />
      <button
        type="button"
        className="fp-ghost"
        data-testid="rd-prov-submit"
        aria-haspopup="dialog"
        disabled={c.locked}
        onClick={() => c.act.ask('handin')}
      >
        Lämna in
      </button>
    </span>
  )
}

/**
 * The pass index: a strip cut into one segment a question, a gap between
 * sections, like a booklet's thumb index. Answered in ink, unanswered as a
 * rule, the current one in the accent; a marked one has a folded corner.
 * A press goes there and a hover pulls its tab out. It stays out of the
 * tab order: the keyboard has ←/→ and Översikt.
 *
 * On phone (`strip`) it is its own line under the head: every segment a
 * tap target of 24 × 24 px with the slim mark inside it, the strip
 * scrolling sideways to keep the current question in view.
 */
function PassIndex({ c, strip = false }: { c: PassChrome; strip?: boolean }) {
  const ref = useRef<HTMLFieldSetElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a new question only
  useLayoutEffect(() => {
    const box = ref.current
    if (!strip || !box) return
    const here = box.querySelector<HTMLElement>('[data-current="true"]')
    if (!here) return
    const left = here.offsetLeft - (box.clientWidth - here.offsetWidth) / 2
    box.scrollTo?.({ left: Math.max(0, left) })
  }, [c.index, strip])
  return (
    <fieldset
      ref={ref}
      className={`fp-passindex${strip ? ' fp-passindex--strip' : ''}`}
      data-testid="rd-prov-grid"
      aria-label="Passets frågor"
    >
      {runsOf(c.run.questions).map((r) => (
        <span className="fp-passindex-run" key={r.start} style={{ flexGrow: r.end - r.start }}>
          {c.run.questions.slice(r.start, r.end).map((x, k) => {
            const i = r.start + k
            const done = c.answers[x.qid] != null
            const marked = c.flags?.includes(x.qid) ?? false
            const here = i === c.index
            return (
              <button
                type="button"
                key={x.qid}
                className="fp-passindex-cell"
                tabIndex={-1}
                data-testid={`rd-prov-cell-${i + 1}`}
                data-answered={String(done)}
                data-current={String(here)}
                data-flagged={marked ? 'true' : undefined}
                aria-current={here ? 'step' : undefined}
                aria-label={`Fråga ${i + 1}, ${x.section}, ${done ? 'besvarad' : 'obesvarad'}${
                  marked ? ', markerad' : ''
                }`}
                onClick={() => c.act.goTo(i)}
              >
                {strip ? null : (
                  <span className="fp-passindex-tab" aria-hidden>
                    Fråga {i + 1} · {done ? 'besvarad' : 'obesvarad'}
                  </span>
                )}
              </button>
            )
          })}
        </span>
      ))}
    </fieldset>
  )
}

/** The question's heading, read when the reader arrives on it (visually
 *  the running head says it). */
function PassHeading({ c, level }: { c: PassChrome; level: 1 | 2 }) {
  const text = `${sectionLongLabel(c.q.section)}, fråga ${c.index + 1} av ${c.total}`
  return level === 1 ? (
    <h1 className="fp-sr" tabIndex={-1} ref={c.headingRef}>
      {text}
    </h1>
  ) : (
    <h2 className="fp-sr" tabIndex={-1} ref={c.headingRef}>
      {text}
    </h2>
  )
}

/** A dog-eared page: the glyph of Markera; the fold fills once marked. */
function DogEar() {
  return (
    <svg className="fp-dogear" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 2.5h6l3 3v8h-9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        className="fp-dogear-fold"
        d="M9.5 2.5v3h3z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Markera: folds the page's corner. */
function FlagButton({ c }: { c: PassChrome }) {
  return (
    <button
      type="button"
      className="fp-ghost fp-flag"
      data-testid="rd-prov-flag"
      aria-pressed={c.flagged}
      disabled={c.locked}
      title="Markera för återkomst"
      onClick={(e) => c.act.toggleFlag(e.detail > 0)}
    >
      <DogEar />
      Markera <span className="fp-sr">för återkomst</span>
    </button>
  )
}

/** Phone: Spår's thumb row — Markera · Översikt · Lämna in — above Nästa,
 *  where the thumb reaches (Lämna in no longer sits top right). */
function ThumbRow({ c }: { c: PassChrome }) {
  return (
    <fieldset className="fp-thumbrow" aria-label="Passets verktyg" data-tools={c.flags ? '3' : '2'}>
      {c.flags ? <FlagButton c={c} /> : null}
      <button
        type="button"
        className="fp-ghost"
        aria-haspopup="dialog"
        disabled={c.locked}
        onClick={() => c.act.ask('overview')}
      >
        Översikt
      </button>
      <button
        type="button"
        className="fp-ghost"
        data-testid="rd-prov-submit"
        aria-haspopup="dialog"
        disabled={c.locked}
        onClick={() => c.act.ask('handin')}
      >
        Lämna in
      </button>
    </fieldset>
  )
}

/** The pass's action line: Nästa fråga (↵), on the last question Lämna in;
 *  the saved choice said in words; Markera when the host has flags. On
 *  phone the thumb row stands between the saved choice and Nästa. */
function PassBar({ c }: { c: PassChrome }) {
  const last = c.index + 1 >= c.total
  const next = (
    <button type="button" className="fp-btn" onClick={c.act.advance} disabled={c.locked}>
      {last ? 'Lämna in' : 'Nästa fråga'}
      <kbd className="fp-kbd" aria-hidden>
        ↵
      </kbd>
    </button>
  )
  const echo = (
    <span className="fp-echo" aria-live="polite">
      {c.chosen ? `Ditt val: ${c.chosen} · sparat` : 'Inget svar än – du kan hoppa över frågan.'}
    </span>
  )
  if (c.phone) {
    return (
      <div className="fp-actionbar fp-pass-bar fp-pass-bar--thumb">
        {echo}
        <ThumbRow c={c} />
        {next}
      </div>
    )
  }
  return (
    <div className="fp-actionbar fp-pass-bar">
      {next}
      {echo}
      {c.flags ? <FlagButton c={c} /> : null}
    </div>
  )
}

/** The keys, said once — on the question the reader came in on. */
function PassKeys({ letters }: { letters: AnswerLetter[] }) {
  if (letters.length === 0) return null
  return (
    <p className="fp-keys">
      <span>
        <kbd className="fp-kbd">{letters[0]}</kbd>–
        <kbd className="fp-kbd">{letters[letters.length - 1]}</kbd> väljer och sparar
      </span>
      <span>
        <kbd className="fp-kbd">←</kbd> <kbd className="fp-kbd">→</kbd> byter fråga
      </span>
      <span>
        <kbd className="fp-kbd">⇧</kbd> + bokstav stryker
      </span>
      <span>
        <kbd className="fp-kbd">↵</kbd> nästa fråga
      </span>
    </p>
  )
}

/** "Andra av tre frågor till figuren", when the page has several. */
function plateCue(c: PassChrome): string | null {
  const g = plateGroup(c.run.questions, c.index)
  if (g.count < 2) return null
  return `${ORDINALS[g.pos] ?? `Fråga ${g.pos + 1}`} av ${inWords(g.count)} frågor till figuren`
}

/** "Hösten 2025 · Provpass 1 · uppgifterna 29–31": where the page is from. */
function plateCaption(c: PassChrome): string {
  const g = plateGroup(c.run.questions, c.index)
  const first = c.run.questions[g.first]?.number ?? c.q.number
  const last = c.run.questions[g.last]?.number ?? c.q.number
  const which = first === last ? `uppgift ${first}` : `uppgifterna ${first}–${last}`
  return `${c.q.source.label} · ${which}`
}

/** What a passage page reads in a pass: never graded, nothing marked. */
function passageModel(c: PassChrome): PassageModel {
  return {
    question: c.q,
    passage: c.q.passage ?? null,
    phase: 'question',
    marks: [],
    correct: null,
    picked: null,
    cited: [],
    focusPara: c.focusPara,
    flashPara: null,
    flashSource: null,
  }
}

/**
 * The question in its drill layout, never graded: the heading, the cue or
 * the problem, the options (a choice is saved, a strike stays), the key
 * line on the first question and, unless the phone anchors it, the bar.
 */
function PassQuestion({
  c,
  kind,
  className,
  bar = true,
}: {
  c: PassChrome
  kind: 'page' | 'plate' | 'reading'
  className: string
  bar?: boolean
}) {
  const { q } = c
  const figure =
    kind === 'page' && q.figure ? (
      <FigureInline figure={q.figure} onZoom={() => c.act.zoom(q.figure as DrillFigure)} />
    ) : null
  const cue = kind === 'plate' ? plateCue(c) : null
  return (
    <div
      className={className}
      data-dogear={c.flagged ? 'true' : undefined}
      lang={q.passage?.lang === 'en' ? 'en' : undefined}
    >
      <PassHeading c={c} level={kind === 'reading' ? 2 : 1} />
      {cue ? <p className="fp-cue">{cue}</p> : null}
      {kind === 'reading' ? (
        q.prompt ? (
          <p className="fp-prompt">
            <MathText>{q.prompt}</MathText>
          </p>
        ) : null
      ) : (
        <QuantProblem q={q} n={c.index + 1} hang={kind === 'page'} figure={figure} />
      )}
      <Options
        view={{ question: q, selected: c.chosen, eliminated: new Set(c.struck) }}
        act={{ select: c.act.pick, toggleEliminate: c.act.strike }}
        testId="rd-prov-option"
      />
      {/* Touch has no keyboard: the key line is the desktop's. */}
      {c.showKeys && !c.phone ? <PassKeys letters={c.letters} /> : null}
      {bar ? <PassBar c={c} /> : null}
    </div>
  )
}

// ── Desktop ──────────────────────────────────────────────────────────

function DeskPass({ c }: { c: PassChrome }) {
  const { q } = c
  const timeline = c.clockShown ? null : (
    <TimeLine seconds={c.remaining} pace={c.run.durationSeconds} />
  )
  if (q.passage || q.figure?.kind === 'raster') {
    const plate = !q.passage && q.figure ? q.figure : null
    const landscape = plate != null && plate.width > plate.height
    return (
      <div className="fp-drill fp-pass" data-layout={plate ? 'plate' : 'reading'}>
        <Spread
          key={plate ? (landscape ? 'plate-wide' : 'plate-tall') : 'reading'}
          start={plate ? (landscape ? 0.62 : 0.5) : undefined}
          rectoLabel={`Fråga ${c.index + 1}`}
          verso={
            <>
              <header className="fp-runhead">
                <AbortButton c={c} />
                <PassLabel c={c} />
                {plate ? (
                  <span className="fp-head-right">
                    <button
                      type="button"
                      className="fp-ghost"
                      disabled={c.locked}
                      onClick={() => c.act.zoom(plate)}
                    >
                      <Maximize2 size={15} strokeWidth={1.5} aria-hidden />
                      Förstora
                    </button>
                    <button
                      type="button"
                      className="fp-ghost"
                      disabled={c.locked}
                      onClick={c.act.rotate}
                      aria-label="Rotera figuren 90 grader"
                    >
                      <RotateCw size={15} strokeWidth={1.5} aria-hidden />
                      Rotera
                    </button>
                  </span>
                ) : (
                  <span />
                )}
              </header>
              {plate ? (
                <div className="fp-plate-page">
                  <FigurePlate
                    key={plate.src}
                    figure={plate}
                    rot={c.rot}
                    caption={plateCaption(c)}
                    live={c.live}
                  />
                </div>
              ) : (
                <PassageView
                  view={passageModel(c)}
                  act={{ setFocusPara: c.setFocusPara }}
                  refs={NO_REFS}
                  note={c.note}
                  setNote={c.setNote}
                  active={null}
                  badgeText={c.badge}
                  noteText={c.noteText}
                />
              )}
            </>
          }
          recto={
            <>
              <div className="fp-pass-rtop">
                <header className="fp-runhead fp-runhead--recto fp-runhead--pass">
                  <span className="fp-pass-pos">
                    Fråga {c.index + 1} av {c.total}
                  </span>
                  <PassTools c={c} position={false} />
                  {timeline}
                </header>
                <PassIndex c={c} />
              </div>
              <PassQuestion
                c={c}
                kind={plate ? 'plate' : 'reading'}
                className="fp-recto-body fp-pass-q"
              />
            </>
          }
        />
      </div>
    )
  }
  return (
    <div className="fp-drill fp-quant fp-pass" data-layout="page">
      <header className="fp-runhead fp-runhead--solo fp-runhead--pass">
        <AbortButton c={c} />
        <PassLabel c={c} />
        <PassTools c={c} />
        {timeline}
      </header>
      <PassIndex c={c} />
      <div className="fp-qscroll" data-rd-keyscope data-fp-region>
        <div className={`fp-qsheet${c.live ? ' fp-enter' : ''}`} key={q.qid}>
          <PassQuestion c={c} kind="page" className="fp-qcol fp-pass-q" />
        </div>
      </div>
    </div>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhonePass({ c }: { c: PassChrome }) {
  if (c.q.passage) return <PhonePassSheet c={c} kind="reading" />
  if (c.q.figure?.kind === 'raster') return <PhonePassSheet c={c} kind="plate" />
  return <PhonePassPage c={c} />
}

/** The phone pass's head: Avbryt and the clock, the pass index as its own
 *  strip of tap targets under them; it folds while reading. Översikt and
 *  Lämna in are in the thumb row at the foot. */
function PhonePassHead({ c, compact }: { c: PassChrome; compact: boolean }) {
  return (
    <header className="fp-pdrill-head fp-ppass-head" data-compact={String(compact)}>
      <AbortButton c={c} compact />
      <span />
      <div className="fp-head-right">
        <Countdown c={c} />
      </div>
      <PassIndex c={c} strip />
    </header>
  )
}

/** A single-page question on phone: one scrolling page, the bar anchored
 *  at the foot. The page names the question once (no slip here). */
function PhonePassPage({ c }: { c: PassChrome }) {
  const { hidden: compact, onScroll } = useHideOnScroll()
  const scrollRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new question starts at the top
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0 })
  }, [c.index])
  return (
    <div className="fp-pdrill fp-pquant fp-pass" data-layout="page">
      <PhonePassHead c={c} compact={compact} />
      <div
        className="fp-pdrill-scroll"
        ref={scrollRef}
        onScroll={onScroll}
        data-rd-keyscope
        data-fp-region
      >
        <div className="fp-pquant-page fp-ppass-page" key={c.q.qid}>
          <p className="fp-pass-where">
            <span className="fp-label">Provpass · {c.q.section}</span>
            <span>
              Fråga {c.index + 1} av {c.total}
            </span>
          </p>
          <PassQuestion c={c} kind="page" className="fp-pass-q" bar={false} />
        </div>
      </div>
      <div className="fp-pfoot">
        <PassBar c={c} />
      </div>
    </div>
  )
}

/** A reading or DTK question on phone: the passage or the plate is the
 *  page, the question on the slip that peeks, opens and names it. */
function PhonePassSheet({ c, kind }: { c: PassChrome; kind: 'reading' | 'plate' }) {
  const { q } = c
  const {
    state: sheet,
    setState: setSheet,
    toggle,
    grab,
  } = useSheet({
    phase: 'question',
    index: c.index,
  })
  const { hidden: compact, onScroll: onHeadScroll } = useHideOnScroll()
  // The passage's own badge has scrolled away: the slip carries it.
  const [badgeGone, setBadgeGone] = useState(false)
  const onScroll = (e: { currentTarget: HTMLElement }) => {
    onHeadScroll(e)
    setBadgeGone(e.currentTarget.scrollTop > 120)
  }
  const plate = kind === 'plate' && q.figure ? q.figure : null
  const g = plateGroup(c.run.questions, c.index)
  const count = q.options?.length ?? 0
  const prompt =
    kind === 'reading' ? (
      q.prompt ? (
        <p className="fp-prompt">
          <MathText>{q.prompt}</MathText>
        </p>
      ) : null
    ) : (
      <QuantProblem q={q} n={c.index + 1} />
    )
  return (
    <div className="fp-pdrill fp-pass" data-layout={kind}>
      <PhonePassHead c={c} compact={compact} />
      <div
        className="fp-pdrill-scroll"
        onScroll={onScroll}
        inert={sheet === 'full'}
        data-rd-keyscope
        data-fp-region
      >
        {plate ? (
          <div className="fp-pdtk-page">
            <span className="fp-label">Provpass · {q.section}</span>
            <FigurePlate
              key={plate.src}
              figure={plate}
              rot={c.rot}
              caption={plateCaption(c)}
              onOpen={() => c.act.zoom(plate)}
              live={c.live}
            />
          </div>
        ) : (
          <PassageView
            view={passageModel(c)}
            act={{ setFocusPara: c.setFocusPara }}
            refs={NO_REFS}
            note={c.note}
            setNote={c.setNote}
            active={null}
            badge
            badgeText={c.badge}
            noteText={c.noteText}
          />
        )}
        {/* Room to read the page's foot above the slip (its peek carries the
         *  thumb row too). */}
        <div style={{ height: sheet === 'peek' ? 340 : 120 }} aria-hidden />
      </div>
      <section
        className="fp-sheet"
        data-state={sheet}
        aria-label={`Fråga ${c.index + 1}`}
        lang={q.passage?.lang === 'en' ? 'en' : undefined}
      >
        <button
          type="button"
          className="fp-sheet-grab"
          tabIndex={-1}
          aria-label={sheet === 'peek' ? 'Visa frågan' : plate ? 'Visa figuren' : 'Visa texten'}
          aria-expanded={sheet !== 'peek'}
          {...grab}
        />
        <div className="fp-sheet-head">
          <span className="fp-label">
            Fråga {c.index + 1} av {c.total}
            {plate && g.count > 1
              ? ` · ${(ORDINALS[g.pos] ?? '').toLocaleLowerCase('sv-SE')} av ${inWords(g.count)}`
              : ''}
            {q.passage?.synthetic && badgeGone ? (
              <span className="fp-sheet-badge"> · {c.badge}</span>
            ) : null}
          </span>
          {sheet === 'peek' ? null : (
            <button
              type="button"
              className="fp-more fp-sheet-back"
              onClick={() => setSheet('peek')}
            >
              {plate ? 'Visa figuren' : 'Visa texten'}
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>
        <div className="fp-sheet-body">
          <PassHeading c={c} level={kind === 'reading' ? 2 : 1} />
          {prompt}
          {sheet === 'peek' ? (
            <button type="button" className="fp-btn fp-peek-btn" onClick={toggle}>
              {`Visa de ${OPTION_WORDS[count] ?? count} alternativen`}
              <ChevronUp size={18} strokeWidth={1.75} aria-hidden />
            </button>
          ) : (
            <Options
              view={{ question: q, selected: c.chosen, eliminated: new Set(c.struck) }}
              act={{ select: c.act.pick, toggleEliminate: c.act.strike }}
              testId="rd-prov-option"
            />
          )}
        </div>
        {sheet === 'peek' ? (
          <div className="fp-sheet-thumb">
            <ThumbRow c={c} />
          </div>
        ) : (
          <PassBar c={c} />
        )}
      </section>
    </div>
  )
}

// ── The pass's slips ─────────────────────────────────────────────────

/** Översikt: the pass's questions by section, each a numeral — underlined
 *  once answered, ringed where the reader is, a folded corner when marked —
 *  and Lämna in as the slip's one filled button. It opens on Tillbaka till
 *  passet, so ↵ never starts a hand-in by default. */
function OverviewSlip({
  run,
  index,
  answers,
  flags,
  onGo,
  onHandin,
  onClose,
}: {
  run: ProvRunningView
  index: number
  answers: Partial<Record<string, AnswerLetter>>
  flags: string[] | null
  onGo: (i: number) => void
  onHandin: () => void
  onClose: () => void
}) {
  const answered = run.questions.filter((q) => answers[q.qid] != null).length
  return (
    <FolioSlip
      id="fp-overview"
      title="Översikt"
      meta={`${answered} av ${run.questions.length} besvarade`}
      onClose={onClose}
    >
      <nav className="fp-overview" aria-label="Frågor i passet">
        {runsOf(run.questions).map((r) => (
          <div className="fp-overview-run" key={r.start}>
            <span className="fp-entry-code" id={`fp-ov-${r.start}`}>
              {r.section}
            </span>
            <ol aria-labelledby={`fp-ov-${r.start}`}>
              {run.questions.slice(r.start, r.end).map((q, k) => {
                const i = r.start + k
                const done = answers[q.qid] != null
                const marked = flags?.includes(q.qid) ?? false
                return (
                  <li key={q.qid}>
                    <button
                      type="button"
                      className="fp-ov-n"
                      data-answered={String(done)}
                      data-current={String(i === index)}
                      data-flagged={marked ? 'true' : undefined}
                      aria-current={i === index ? 'step' : undefined}
                      aria-label={`Fråga ${i + 1}, ${q.section}, ${done ? 'besvarad' : 'obesvarad'}${
                        marked ? ', markerad' : ''
                      }${i === index ? ', här är du' : ''}`}
                      onClick={() => onGo(i)}
                    >
                      {i + 1}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </nav>
      <p className="fp-slip-key">
        Understruken: besvarad. Ring: här är du.{flags ? ' Vikt hörn: markerad.' : ''}
      </p>
      <div className="fp-slip-actions">
        <button type="button" className="fp-btn" onClick={onHandin}>
          Lämna in
        </button>
        <button type="button" className="fp-quiet-btn" data-autofocus onClick={onClose}>
          Tillbaka till passet
          <kbd className="fp-kbd" aria-hidden>
            Esc
          </kbd>
        </button>
      </div>
    </FolioSlip>
  )
}

/** Question numbers as the slip prints them: a run of three or more as a
 *  range ("4–6"), the rest one by one — [4, 5, 6, 11] → 4–6, 11. */
function numberRuns(numbers: readonly number[]): { first: number; last: number }[] {
  const runs: { first: number; last: number }[] = []
  for (let i = 0; i < numbers.length; ) {
    let j = i
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++
    if (j - i >= 2) runs.push({ first: numbers[i], last: numbers[j] })
    else for (let k = i; k <= j; k++) runs.push({ first: numbers[k], last: numbers[k] })
    i = j + 1
  }
  return runs
}

/**
 * Lämna in, summed up first (Samtal's and Ljuskägla's hand-in): how many
 * are left blank (fel ger inga avdrag), the blanks as ranges and the
 * marked as chips, each a way back to its question. It opens on Tillbaka
 * till passet, so ↵ goes back and never hands in by default; Lämna in is
 * the slip's one filled button and needs its own press. It is the pass's
 * one hand-in: what follows is the result, or the pass's closing page
 * (FolioPassEnded).
 */
function HandinSlip({
  questions,
  answers,
  flags,
  onGo,
  onSubmit,
  onClose,
}: {
  questions: readonly DrillQuestion[]
  answers: Partial<Record<string, AnswerLetter>>
  flags: string[] | null
  onGo: (i: number) => void
  onSubmit: () => void
  onClose: () => void
}) {
  const blanks = questions.flatMap((q, i) => (answers[q.qid] == null ? [i + 1] : []))
  const marked = flags ? questions.flatMap((q, i) => (flags.includes(q.qid) ? [i + 1] : [])) : []
  const n = blanks.length
  const body =
    n === 0
      ? `Alla ${questions.length} frågor är besvarade.`
      : `${n === 1 ? 'En fråga är obesvarad' : `${capitalised(inWords(n))} frågor är obesvarade`} – fel ger inga avdrag, så gissa hellre.`
  return (
    <FolioSlip
      id="fp-handin"
      title="Lämna in provpasset?"
      meta={`${questions.length - n} av ${questions.length} besvarade`}
      onClose={onClose}
    >
      <p className="fp-slip-lede">{body}</p>
      {n > 0 ? (
        <fieldset className="fp-handin-line" aria-label="Obesvarade frågor">
          <span className="fp-handin-key">Obesvarade:</span>{' '}
          {numberRuns(blanks).map((r, k) => (
            <Fragment key={r.first}>
              {k > 0 ? ', ' : null}
              <button
                type="button"
                className="fp-link fp-handin-jump"
                aria-label={
                  r.first === r.last
                    ? `Till fråga ${r.first}, obesvarad`
                    : `Till fråga ${r.first}, första av de obesvarade ${r.first}–${r.last}`
                }
                onClick={() => onGo(r.first - 1)}
              >
                {r.first === r.last ? r.first : `${r.first}–${r.last}`}
              </button>
            </Fragment>
          ))}
        </fieldset>
      ) : null}
      {marked.length > 0 ? (
        <fieldset className="fp-handin-line" aria-label="Markerade frågor">
          <span className="fp-handin-key">Markerade:</span>{' '}
          <span className="fp-handin-chips">
            {marked.map((m) => (
              <button
                type="button"
                key={m}
                className="fp-handin-chip"
                aria-label={`Till fråga ${m}, markerad`}
                onClick={() => onGo(m - 1)}
              >
                <DogEar />
                {m}
              </button>
            ))}
          </span>
        </fieldset>
      ) : null}
      <p className="fp-slip-key">
        Klockan går medan du granskar. Efter inlämningen går svaren inte att ändra.
      </p>
      <div className="fp-slip-actions">
        <button type="button" className="fp-btn" data-testid="rd-confirm" onClick={onSubmit}>
          Lämna in
        </button>
        <button type="button" className="fp-quiet-btn" data-autofocus onClick={onClose}>
          Tillbaka till passet
          <kbd className="fp-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
      </div>
    </FolioSlip>
  )
}

/** Avbryta: the safe way, Fortsätt provpasset, is the filled button and
 *  holds ↵; the act that voids sits under a double rule, quiet. */
function AbortSlip({ onAbandon, onClose }: { onAbandon: () => void; onClose: () => void }) {
  return (
    <FolioSlip id="fp-abort" title="Avbryta provpasset?" onClose={onClose}>
      <p className="fp-slip-lede">
        Avbryter du blir provet ogiltigt. Dina missar hamnar i Repetera.
      </p>
      <div className="fp-slip-actions">
        <button type="button" className="fp-btn" data-autofocus onClick={onClose}>
          Fortsätt provpasset
          <kbd className="fp-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
      </div>
      <hr className="fp-menu-sep fp-slip-sep" />
      <div className="fp-slip-grave">
        <button type="button" className="fp-quiet-btn" data-testid="rd-confirm" onClick={onAbandon}>
          Avbryt passet
        </button>
      </div>
    </FolioSlip>
  )
}

// ── The pass, over ───────────────────────────────────────────────────

/**
 * Screen 9 after the pass's one hand-in, while the host stays there (a host
 * that opens the result never shows it). The frame is back around a closing
 * page: ⁂ over "Passet är inlämnat.", or, when the hand-in failed, its error
 * as a title and an erratum that stay; the pass named in the lead with the
 * screen's one filled button, Till provpassen ↵; and the answers as they stood,
 * by section, read-only. Nothing here hands the pass in again.
 */
export function FolioPassEnded({
  width,
  live,
  end,
  onHub,
}: {
  width: WidthKey
  live: boolean
  end: PassEnd
  /** Till provpassen: the hub, with nothing more to say. */
  onHub: () => void
}) {
  const { run, answers } = end
  const failed = end.outcome === 'failed'
  const answered = run.questions.filter((q) => answers[q.qid] != null).length
  const headingRef = useRef<HTMLHeadingElement>(null)
  // The page's title takes the focus the pass had, so the end is heard.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, on arrival
  useEffect(() => {
    if (live) headingRef.current?.focus({ preventScroll: true })
  }, [])
  // ↵ is Till provpassen's — pressed afresh: the repeat of a ↵ held down on
  // the hand-in never skips this page (or its error).
  const hub = useRef(onHub)
  hub.current = onHub
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || isForeignKey(e)) return
      if (e.target instanceof Element && e.target.closest(CONTROL)) return
      e.preventDefault()
      if (!e.repeat) hub.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live])
  return (
    <FolioPage width={width} masthead={<Masthead label="Provpass" />}>
      {failed ? null : (
        <span className="fp-colophon-mark fp-result-mark" aria-hidden>
          ⁂
        </span>
      )}
      <h1 className="fp-greet fp-ended-title" tabIndex={-1} ref={headingRef}>
        {failed ? 'Inlämningen gick inte fram.' : 'Passet är inlämnat.'}
      </h1>
      {failed ? (
        <div className="fp-erratum fp-prov-note">
          <p>
            Passet går inte att lämna in igen härifrån. Svaren nedan är dina, som de stod vid
            inlämningen.
          </p>
        </div>
      ) : (
        <p className="fp-day">Svaren nedan är de du lämnade in.</p>
      )}
      <Lead labelledBy="fp-end-lead" testId="rd-prov-ended">
        <div className="fp-resume-top">
          <span className="fp-label">
            {HALF_WORD[run.half]} · {run.mode === 'authentic' ? 'riktigt pass' : 'genererat pass'}
          </span>
        </div>
        <h2 className="fp-lead-title" id="fp-end-lead">
          {passName(run.sitting, run.pass)}
        </h2>
        <p className="fp-lead-sub">
          {answered} av {run.questions.length} frågor besvarade
        </p>
        <div className="fp-resume-foot">
          <button type="button" className="fp-btn fp-btn--big" onClick={onHub}>
            Till provpassen
            <kbd className="fp-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
        </div>
      </Lead>
      {run.questions.length ? (
        <section className="fp-section" aria-labelledby="fp-end-ans-h">
          <div className="fp-section-head">
            <h2 className="fp-h2" id="fp-end-ans-h">
              Dina svar
            </h2>
            <span className="fp-meta">i provets ordning</span>
          </div>
          <div className="fp-answers">
            {runsOf(run.questions).map((r) => (
              <div className="fp-answers-run" key={r.start}>
                <span className="fp-entry-code" id={`fp-end-${r.start}`}>
                  {r.section}
                </span>
                <ol aria-labelledby={`fp-end-${r.start}`}>
                  {run.questions.slice(r.start, r.end).map((q, k) => {
                    const n = r.start + k + 1
                    const letter = answers[q.qid]
                    return (
                      <li
                        key={q.qid}
                        className="fp-answers-cell"
                        data-answered={String(letter != null)}
                      >
                        <span className="fp-answers-n" aria-hidden>
                          {n}
                        </span>
                        <span className="fp-answers-l" aria-hidden>
                          {letter ?? '–'}
                        </span>
                        <span className="fp-sr">
                          {letter ? `Fråga ${n}, svar ${letter}` : `Fråga ${n}, obesvarad`}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </FolioPage>
  )
}

// ── Provpassresultat ─────────────────────────────────────────────────

/** "Elva missar ligger nu i Repetera; två lämnades obesvarade." */
function missesSentence(wrong: number, blank: number): string {
  const w = `${capitalised(inWords(wrong))} ${wrong === 1 ? 'miss ligger' : 'missar ligger'} nu i Repetera`
  const b = `${blank === 1 ? 'en' : inWords(blank)} lämnades obesvarade`
  if (wrong > 0 && blank > 0) return `${w}; ${b}.`
  if (wrong > 0) return `${w}.`
  return `${capitalised(b)} – de hamnar inte i Repetera.`
}

/** A section's share of the pass's time: the view model's quota, scaled to
 *  the questions a short pass really had. */
function budgetOf(
  s: ProvSectionResultView,
  all: readonly ProvSectionResultView[],
  minutes: number,
  nominal: number,
) {
  const presented = all.reduce((n, x) => n + x.presented, 0)
  if (presented >= nominal || presented === 0) return s.quotaSeconds
  return Math.round((minutes * 60 * s.presented) / presented)
}

export function FolioProvResult({
  width,
  live,
  onNewPass,
  onHistorik,
}: {
  width: WidthKey
  live: boolean
  /** Nytt provpass and Esc: the Provpass hub. */
  onNewPass: () => void
  onHistorik: () => void
}) {
  const { data, actions } = useDirectionData()
  const r = data.provpass.result
  const { running, hub } = data.provpass
  const nominal = hub.halves.find((h) => h.half === r.half)
  const minutes = nominal?.minutes ?? 55
  const missing = nominal ? Math.max(0, nominal.questions - r.presented) : 0
  const wrong = Math.max(0, r.answered - r.correct)
  const blank = Math.max(0, r.presented - r.answered)
  const misses = wrong + blank
  const timedOut = r.durationSeconds >= minutes * 60
  const official = r.score.derived === 'official-derived'
  const value = r.presented > 0 ? r.score.value : null
  // The pass's own questions, while the host still has them: the misses
  // can then be read by their stems.
  const questions = running.passId === r.passId ? running.questions : []
  // Whether the score rests on övningstexter, where the pass says so: a P5
  // text among its own questions, or a miss in the P5 namespace. A pass
  // whose provenance is not at hand claims nothing.
  const p5 = questions.some((q) => q.passage?.synthetic === true) || r.missed.some(isP5Qid)
  const sections = [...r.sections].sort(
    (a, z) => SECTION_KEYS.indexOf(a.section) - SECTION_KEYS.indexOf(z.section),
  )
  const primary = wrong > 0 ? actions.openRepetera : onNewPass
  useKeyMap({ Enter: primary, Escape: onNewPass }, live)
  const what = `${HALF_WORD[r.half]}, ${r.mode === 'authentic' ? 'riktigt pass' : 'genererat pass'}.`
  const ending = timedOut
    ? `Tiden tog slut – passet lämnades in automatiskt efter ${minutes} minuter.`
    : `Du lämnade in efter ${minutesUsed(r.durationSeconds)}.`
  const kind = official ? 'normerat och härlett' : 'skattad'
  const sentence =
    value != null
      ? `${fmtPassScore(value)} av 2,0, ${kind}, ${r.correct} av ${r.presented} rätt${
          p5 ? ', med förbehåll i fotnoten' : ''
        }`
      : `Ingen poäng för det här passet, ${r.correct} av ${r.presented} rätt`

  const main = (
    <>
      <span className="fp-colophon-mark fp-result-mark" aria-hidden>
        ⁂
      </span>
      <h1 className="fp-greet">Provpasset klart.</h1>
      <p className="fp-day">
        {what} {ending}
      </p>
      <Lead labelledBy="fp-res-lead" testId="rd-prov-result">
        <h2 className="fp-sr" id="fp-res-lead">
          Resultatet
        </h2>
        <ResultFigure
          testId="rd-prov-score"
          figure={value != null ? fmtPassScore(value) : '—'}
          mark={p5 ? '*,**' : '*'}
          of={official ? 'normerat (härlett) · av 2,0' : 'skattad poäng · av 2,0'}
          sentence={sentence}
        >
          <p className="fp-lead-sub">
            {r.correct} av {r.presented} rätt
          </p>
          {missing > 0 ? (
            <p className="fp-lead-sub">
              {missing === 1 ? 'En fråga saknas' : `${capitalised(inWords(missing))} frågor saknas`}{' '}
              i det här passet, så det rättades på {r.presented}.
            </p>
          ) : null}
          {value != null ? (
            <Scale mark={value} label={`${fmtPassScore(value)} på skalan 0 till 2,0`} />
          ) : null}
        </ResultFigure>
        <div className="fp-resume-foot">
          <button type="button" className="fp-btn fp-btn--big" onClick={primary}>
            {wrong > 0 ? 'Till Repetera' : 'Nytt provpass'}
            <kbd className="fp-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
          {wrong > 0 ? (
            <span className="fp-hint">
              {capitalised(inWords(wrong))} {wrong === 1 ? 'miss väntar' : 'missar väntar'} där, de
              äldsta först.
            </span>
          ) : null}
        </div>
      </Lead>

      <section className="fp-section" aria-labelledby="fp-res-sec-h">
        <div className="fp-section-head">
          <h2 className="fp-h2" id="fp-res-sec-h">
            Per delprov
          </h2>
          <span className="fp-meta">i provets ordning</span>
        </div>
        <table className="fp-table fp-res-table">
          <caption className="fp-sr">Per delprov: rätt, tid och budget</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="fp-sr">Delprov</span>
              </th>
              <th scope="col">Rätt</th>
              <th scope="col">Tid</th>
              <th scope="col">Budget</th>
              <th scope="col" className="fp-col-note">
                <span className="fp-sr">Tempo</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => {
              const budget = budgetOf(s, sections, minutes, nominal?.questions ?? r.presented)
              const over = s.timeSeconds > budget
              return (
                <tr key={s.section} data-testid={`rd-prov-section-${slug(s.section)}`}>
                  <th scope="row">
                    <span className="fp-th-line">
                      <span className="fp-table-name">
                        {s.section}
                        <span className="fp-sr">, {sectionLongLabel(s.section)}</span>
                      </span>
                      <span className="fp-leader" aria-hidden />
                    </span>
                  </th>
                  <td>
                    {s.correct}/{s.presented}
                  </td>
                  <td>
                    {fmtClock(s.timeSeconds)}
                    {/* Phone: the tempo drops under its row (its column is
                     *  folded away there). */}
                    {over ? <span className="fp-table-sub fp-phone-only">över budget</span> : null}
                  </td>
                  <td>{fmtClock(budget)}</td>
                  <td className="fp-col-note">{over ? 'över budget' : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="fp-section" aria-labelledby="fp-res-miss-h">
        <div className="fp-section-head">
          <h2 className="fp-h2" id="fp-res-miss-h">
            Missarna
          </h2>
          <span className="fp-meta">
            {misses} av {r.presented}
          </span>
        </div>
        {misses === 0 ? (
          <p className="fp-empty">Inga missar i det här passet.</p>
        ) : (
          <>
            <p className="fp-res-note">{missesSentence(wrong, blank)}</p>
            <ol className="fp-errata" aria-labelledby="fp-res-miss-h">
              {r.missed.map((qid) => (
                <MissedRow key={qid} qid={qid} questions={questions} />
              ))}
            </ol>
          </>
        )}
      </section>

      <div className="fp-footnotes">
        <p className={`fp-footnote${p5 ? ' fp-footnote--wide' : ''}`} id="fp-res-fn">
          <b aria-hidden>*</b>
          <span>
            {official
              ? `Härlett ur UHR:s normeringstabell för provtillfället. UHR normerar hela ${HALF_PART[r.half]} (${HALF_QUESTIONS} frågor) – ett provpass på ${r.presented} frågor har ingen officiell tabell, så poängen skalas upp och läses av tabellen.`
              : 'Linjär skattning – indikativ, inte UHR-normerad.'}
          </span>
        </p>
        {p5 ? (
          <p className="fp-footnote fp-footnote--wide">
            <b aria-hidden>**</b>
            <span>{data.copy.estimateCaveat}</span>
          </p>
        ) : null}
      </div>
    </>
  )

  const aside = (
    <>
      <MarginBlock id="fp-res-hist-h" title="Tidigare pass" testId="rd-prov-history">
        <p className="fp-margin-note">
          {HALF_WORD[r.half]} · {r.mode === 'authentic' ? 'riktiga pass' : 'genererade pass'}
        </p>
        {r.history.length ? (
          <ol className="fp-results">
            {r.history.map((h, i) => (
              <li key={h.id} data-testid={`rd-prov-history-item-${i + 1}`}>
                <ResultRow r={h} onOpen={() => actions.openProvResult(h.id)} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="fp-margin-note">Inga tidigare pass av samma sort ännu.</p>
        )}
        <button type="button" className="fp-link" onClick={onHistorik}>
          Alla pass i Historik
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </MarginBlock>
      {r.trap ? (
        <MarginBlock id="fp-res-trap-h" title="Återkommande fälla">
          <p className="fp-trap-meta">
            <b>{r.trap.section}</b>
            <span>{r.trap.count} missar</span>
          </p>
          <span className="fp-trap-name">
            {data.frameworks[r.trap.frameworkId] ?? r.trap.headline ?? 'En fälla som återkommer'}
          </span>
          {r.trap.headline && data.frameworks[r.trap.frameworkId] ? (
            <span className="fp-trap-pattern">{r.trap.headline}</span>
          ) : null}
          <button
            type="button"
            className="fp-link"
            onClick={() => actions.openLesson(r.trap?.frameworkId ?? '')}
          >
            Slå upp
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </MarginBlock>
      ) : null}
      <MarginBlock id="fp-res-seen-h" title="Exponering">
        <p className="fp-margin-note">
          Du hade sett {r.seenBefore} av {r.presented} frågor innan.
        </p>
      </MarginBlock>
    </>
  )

  return (
    <FolioPage
      width={width}
      masthead={
        <Masthead label="Provpass · Resultat">
          <span className="fp-count">
            {r.sitting || r.pass ? passName(r.sitting, r.pass) : 'Genererat pass'}
          </span>
        </Masthead>
      }
      aside={aside}
      asideLabelledBy="fp-res-hist-h"
    >
      {main}
    </FolioPage>
  )
}

/** One miss in the errata: its place, section and stem, and the right
 *  answer — when the pass's questions are still at hand; else what its id
 *  says. */
function MissedRow({ qid, questions }: { qid: string; questions: readonly DrillQuestion[] }) {
  const i = questions.findIndex((x) => x.qid === qid)
  const q = i === -1 ? null : questions[i]
  const section = q?.section ?? sectionOfQid(qid)
  const printed = q ? i + 1 : Number(/(\d+)$/.exec(qid)?.[1] ?? Number.NaN)
  const stem = q ? questionStem(q) : null
  return (
    <li className="fp-errata-row">
      <span className="fp-errata-n">{Number.isFinite(printed) ? printed : ''}</span>
      <span className="fp-entry-code">{section ?? ''}</span>
      <span className="fp-errata-stem">
        {stem ? <GapText text={stem} /> : section ? sectionLongLabel(section) : qid}
      </span>
      {q ? <span className="fp-errata-key">rätt {q.answer}</span> : null}
    </li>
  )
}

// ── Lifted from FolioQuant.tsx (screens 6–7) ─────────────────────────

/** ORD's single words are set at the page-title size, never larger. */
function isWord(q: DrillQuestion): boolean {
  return q.section === 'ORD' && (q.prompt?.trim().length ?? 0) <= 24
}

/**
 * A problem set the textbook way, per section: XYZ's prompt as it comes;
 * KVA's condition as its own line, then the two quantities side by side in
 * a ruled table; NOG's question, its statements hanging in the margin and
 * the italic lead-in; ORD's word at the title size; MEK's blanks as gaps.
 * With `hang`, the problem's number hangs in the margin.
 */
function QuantProblem({
  q,
  n,
  hang = false,
  figure,
}: {
  q: DrillQuestion
  n: number
  hang?: boolean
  figure?: ReactNode
}) {
  const prompt = q.prompt ?? ''
  const kva = q.section === 'KVA' ? splitKvaPrompt(prompt) : null
  const nog = q.section === 'NOG' ? parseNogPrompt(prompt) : null
  const num = hang ? (
    <span className="fp-qnum" aria-hidden>
      {n}
    </span>
  ) : null
  const headClass = 'fp-prompt fp-qprompt'
  return (
    <div className="fp-problem" data-section={q.section}>
      {figure}
      {kva ? (
        <>
          <h2 className={headClass}>
            {num}
            {kva.condition ? <MathText>{kva.condition}</MathText> : 'Jämför de två kvantiteterna.'}
          </h2>
          <table className="fp-kva">
            <thead>
              <tr>
                <th scope="col">Kvantitet I</th>
                <th scope="col">Kvantitet II</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <MathText>{kva.kvI}</MathText>
                </td>
                <td>
                  <MathText>{kva.kvII}</MathText>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : nog ? (
        <>
          <h2 className={headClass}>
            {num}
            <MathText>{nog.question}</MathText>
          </h2>
          <ol className="fp-nog" aria-label="Påståenden">
            <li>
              <span className="fp-nog-n" aria-hidden>
                (1)
              </span>
              <span className="fp-sr">Påstående 1: </span>
              <MathText>{nog.statement1}</MathText>
            </li>
            <li>
              <span className="fp-nog-n" aria-hidden>
                (2)
              </span>
              <span className="fp-sr">Påstående 2: </span>
              <MathText>{nog.statement2}</MathText>
            </li>
          </ol>
          <p className="fp-nog-tail">
            {nog.tail ?? 'Tillräcklig information för lösningen erhålls'}
          </p>
        </>
      ) : (
        <h2 className={headClass} data-word={isWord(q) ? 'true' : undefined}>
          {num}
          {q.section === 'MEK' ? <GapText text={prompt} /> : <MathText>{prompt}</MathText>}
        </h2>
      )}
    </div>
  )
}

/**
 * The DTK page as a plate tipped into the book: the printed page fitted to
 * the verso, a hairline frame, an italic caption. It stays a white printed
 * page in the dark theme, never inverted. While it loads it is a paper box
 * at the page's proportions; if it fails, an erratum in the frame — the
 * question can still be answered, by design (spec, screen 7). `onOpen`
 * (phone) makes a tap on the plate open Förstora.
 */
function FigurePlate({
  figure,
  rot,
  caption,
  onOpen,
  live,
}: {
  figure: DrillFigure
  rot: number
  caption: string
  onOpen?: () => void
  live: boolean
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const turned = rot % 180 !== 0
  const style = {
    '--fp-plate-ratio': String(
      turned ? figure.height / figure.width : figure.width / figure.height,
    ),
    '--fp-img-ratio': String(figure.width / figure.height),
    '--fp-rot': `${rot}deg`,
  } as CSSProperties
  return (
    <figure
      className={`fp-plate${live ? ' fp-enter' : ''}`}
      data-testid="rd-figure"
      data-turned={turned ? 'true' : undefined}
      style={style}
    >
      <div className="fp-plate-frame" data-state={state}>
        {state === 'error' ? (
          <Erratum
            text="Figuren gick inte att visa."
            onRetry={() => {
              setState('loading')
              setAttempt((a) => a + 1)
            }}
          />
        ) : (
          <img
            key={attempt}
            className="fp-plate-img"
            src={`/${figure.src}`}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            decoding="async"
            onLoad={() => setState('ready')}
            onError={() => setState('error')}
          />
        )}
        {onOpen && state !== 'error' ? (
          <button
            type="button"
            className="fp-plate-open"
            onClick={onOpen}
            aria-label="Förstora figuren"
          />
        ) : null}
      </div>
      <figcaption className="fp-plate-caption">{caption}</figcaption>
    </figure>
  )
}

/** An erratum (spec §1.7): plain words behind a 1 px rule, one way to try
 *  again; announced as a status, never a red box. */
function Erratum({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="fp-erratum" role="status">
      <p>{text}</p>
      <button type="button" className="fp-link" onClick={onRetry}>
        Försök igen
      </button>
    </div>
  )
}

const svgCache = new Map<string, Promise<string>>()

/** An SVG figure's markup, fetched once per page load, so its strokes take
 *  currentColor in both themes. Null fetches nothing. */
function useSvg(src: string | null) {
  const [state, setState] = useState<{ svg: string | null; failed: boolean }>({
    svg: null,
    failed: false,
  })
  const [attempt, setAttempt] = useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a retry refetches
  useEffect(() => {
    if (!src) return
    let alive = true
    setState({ svg: null, failed: false })
    let job = svgCache.get(src)
    if (!job) {
      job = fetch(`/${src}`).then((r) => {
        if (!r.ok) throw new Error(`figure ${r.status}`)
        return r.text()
      })
      svgCache.set(src, job)
    }
    job.then(
      (svg) => alive && setState({ svg, failed: false }),
      () => {
        svgCache.delete(src)
        if (alive) setState({ svg: null, failed: true })
      },
    )
    return () => {
      alive = false
    }
  }, [src, attempt])
  return { ...state, retry: () => setAttempt((a) => a + 1) }
}

/** The bank's SVG, made to fill its box and take the ink's colour. */
function fitSvg(svg: string): string {
  return svg.replace(/<svg([^>]*)>/, '<svg$1 width="100%" height="100%" style="display:block">')
}

/** An XYZ/KVA/NOG figure set like a book figure above the prompt, named by
 *  its alt; a ghost Förstora under its right edge. */
function FigureInline({ figure, onZoom }: { figure: DrillFigure; onZoom: () => void }) {
  if (figure.kind === 'raster') {
    return (
      <figure className="fp-figure">
        <img
          className="fp-figure-raster"
          src={`/${figure.src}`}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          decoding="async"
        />
        <ZoomButton onZoom={onZoom} />
      </figure>
    )
  }
  return <SvgFigure key={figure.src} figure={figure} onZoom={onZoom} />
}

function SvgFigure({ figure, onZoom }: { figure: DrillFigure; onZoom: () => void }) {
  const { svg, failed, retry } = useSvg(figure.src)
  const ratio = figure.width / figure.height
  return (
    <figure className="fp-figure">
      <div
        className="fp-figure-box"
        role="img"
        aria-label={figure.alt}
        style={{ aspectRatio: String(ratio), width: `min(100%, ${Math.round(280 * ratio)}px)` }}
      >
        {failed ? (
          <Erratum text="Figuren gick inte att visa." onRetry={retry} />
        ) : svg ? (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: the bank's own parser-emitted SVG, no user input
          <div className="fp-figure-svg" dangerouslySetInnerHTML={{ __html: fitSvg(svg) }} />
        ) : null}
      </div>
      {failed ? null : <ZoomButton onZoom={onZoom} />}
    </figure>
  )
}

function ZoomButton({ onZoom }: { onZoom: () => void }) {
  return (
    <button type="button" className="fp-ghost fp-figure-zoom" onClick={onZoom}>
      <Maximize2 size={15} strokeWidth={1.5} aria-hidden />
      Förstora
    </button>
  )
}

type ViewerState = { zoom: number; left: number; top: number }

/** The box a stage-sized element has (no layout in jsdom: zero). */
function useBox(ref: RefObject<HTMLElement | null>) {
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return box
}

/**
 * Förstora: the figure full-stage on the page's own paper. Fit to the
 * stage, drag to pan, ⌘/Ctrl + wheel to zoom from 100 to 600 %, a toolbar
 * of words; + / − / R / Esc on the keyboard, the arrows pan. The pass's
 * keys rest while it is open; closing gives focus back and keeps the zoom
 * and place for next time.
 */
function FigureViewer({
  figure,
  rot,
  rotate,
  saved,
  onClose,
}: {
  figure: DrillFigure
  rot: number
  rotate: () => void
  saved?: ViewerState
  onClose: (state: ViewerState) => void
}) {
  const [zoom, setZoom] = useState(saved?.zoom ?? 1)
  const areaRef = useRef<HTMLElement>(null)
  const area = useBox(areaRef)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const anchor = useRef<{ cx: number; cy: number } | null>(null)
  const { svg } = useSvg(figure.kind === 'svg' ? figure.src : null)

  const turned = rot % 180 !== 0
  const ratio = turned ? figure.height / figure.width : figure.width / figure.height
  const pad = 24
  const fitW = Math.max(0, Math.min(area.w - pad * 2, (area.h - pad * 2) * ratio))
  const boxW = fitW * zoom
  const boxH = ratio ? boxW / ratio : 0
  const canvasW = Math.max(boxW + pad * 2, area.w)
  const canvasH = Math.max(boxH + pad * 2, area.h)
  const imgW = turned ? boxH : boxW
  const imgH = turned ? boxW : boxH

  const close = useCallback(() => {
    const el = areaRef.current
    onClose({ zoom, left: el?.scrollLeft ?? 0, top: el?.scrollTop ?? 0 })
  }, [onClose, zoom])

  /** Zoom about the stage's centre, so the place being read stays put. */
  const zoomTo = useCallback((z: number) => {
    const el = areaRef.current
    if (el?.scrollWidth) {
      anchor.current = {
        cx: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        cy: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      }
    }
    setZoom(z)
  }, [])
  const step = useCallback(
    (dir: 1 | -1) => {
      const i = ZOOMS.findIndex((z) => z >= zoom - 0.001)
      zoomTo(ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (i === -1 ? 0 : i) + dir))])
    },
    [zoom, zoomTo],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: once the stage has a size
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el || !area.w || !saved) return
    el.scrollLeft = saved.left
    el.scrollTop = saved.top
  }, [area.w > 0])
  // biome-ignore lint/correctness/useExhaustiveDependencies: after a zoom only
  useLayoutEffect(() => {
    const el = areaRef.current
    const a = anchor.current
    anchor.current = null
    if (!el || !a) return
    el.scrollLeft = a.cx * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = a.cy * el.scrollHeight - el.clientHeight / 2
  }, [zoom])

  // Keys while open (Esc is the dialog's): +/− zoom, R turns, the arrows
  // pan. Handled keys never reach the pass or the bake-off's switcher.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = areaRef.current
      const pan: Record<string, [number, number]> = {
        ArrowLeft: [-48, 0],
        ArrowRight: [48, 0],
        ArrowUp: [0, -48],
        ArrowDown: [0, 48],
      }
      if (e.key === '+' || e.key === '=') step(1)
      else if (e.key === '-' || e.key === '−') step(-1)
      else if (e.key === 'r' || e.key === 'R') rotate()
      else if (pan[e.key]) el?.scrollBy?.({ left: pan[e.key][0], top: pan[e.key][1] })
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step, rotate])

  // ⌘/Ctrl + wheel zooms (a native listener: React's wheel is passive).
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      step(e.deltaY < 0 ? 1 : -1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [step])

  const onDown = (e: ReactPointerEvent<HTMLElement>) => {
    const el = areaRef.current
    if (!el || e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
  }
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    const el = areaRef.current
    const d = drag.current
    if (!el || !d) return
    el.scrollLeft = d.left - (e.clientX - d.x)
    el.scrollTop = d.top - (e.clientY - d.y)
  }
  const onUp = () => {
    drag.current = null
  }

  const imageStyle: CSSProperties = {
    width: imgW,
    height: imgH,
    transform: `translate(-50%, -50%) rotate(${rot}deg)`,
  }
  return (
    <FolioDialog label="Förstorad figur" onClose={close} className="fp-viewer">
      <div className="fp-viewer-bar">
        <span className="fp-viewer-title">{figure.alt}</span>
        <div className="fp-viewer-tools">
          <button
            type="button"
            className="fp-ghost"
            onClick={() => step(-1)}
            disabled={zoom <= ZOOMS[0]}
          >
            <Minus size={15} strokeWidth={1.5} aria-hidden />
            Mindre
          </button>
          <span className="fp-viewer-zoom" aria-live="polite">
            {Math.round(zoom * 100)}&nbsp;%
          </span>
          <button
            type="button"
            className="fp-ghost"
            onClick={() => step(1)}
            disabled={zoom >= ZOOMS[ZOOMS.length - 1]}
          >
            <Plus size={15} strokeWidth={1.5} aria-hidden />
            Större
          </button>
          <button
            type="button"
            className="fp-ghost"
            onClick={rotate}
            aria-label="Rotera figuren 90 grader"
          >
            <RotateCw size={15} strokeWidth={1.5} aria-hidden />
            Rotera
          </button>
          <button type="button" className="fp-ghost" onClick={() => zoomTo(1)}>
            Hela sidan
          </button>
        </div>
        <button type="button" className="fp-ghost" onClick={close} data-autofocus>
          <X size={16} strokeWidth={1.5} aria-hidden />
          Stäng
          <kbd className="fp-kbd" aria-hidden>
            Esc
          </kbd>
        </button>
      </div>
      <section
        className="fp-viewer-area"
        ref={areaRef}
        aria-label="Figuren, förstorad – dra för att flytta"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="fp-viewer-canvas" style={{ width: canvasW, height: canvasH }}>
          {figure.kind === 'svg' && svg ? (
            <div
              className="fp-viewer-img fp-viewer-svg"
              role="img"
              aria-label={figure.alt}
              style={imageStyle}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: the bank's own parser-emitted SVG, no user input
              dangerouslySetInnerHTML={{ __html: fitSvg(svg) }}
            />
          ) : (
            <img
              className="fp-viewer-img"
              src={`/${figure.src}`}
              alt={figure.alt}
              draggable={false}
              style={imageStyle}
            />
          )}
        </div>
      </section>
    </FolioDialog>
  )
}
