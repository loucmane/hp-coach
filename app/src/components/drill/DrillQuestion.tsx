// Single drill question, Boksidan (M3) margin-rail chassis.
//
// The question is composed of stacked rail sections — each a cobalt mono
// label in the left margin, a hairline spine, and the content column:
//
//   TEXTEN / UNDERLAGET   the passage or figure (LÄS/ELF/DTK)
//   FRÅGAN / UPPGIFTEN     the prompt (ORD headword, or a sentence/stem)
//   PÅSTÅENDEN            the NOG (1)/(2) sufficiency apparatus
//   VÄLJ SVAR             the options
//
// Two display modes:
//   - "answering": all options live, one click commits the answer
//   - "graded":    the picked option + the correct one are revealed —
//                  green (--ok) on the right answer, red (--bad) on a wrong
//                  pick. Grading is STATE, so it uses the semantic tokens,
//                  never the cobalt accent (which is reserved for structure).
//
// The chassis linearises on phone (rail label stacks above content); the
// same composition holds across phone/reader/studio. See index.css `.hpc-m3-*`
// and docs/design-system-conventions.md.

import { type ReactNode, useEffect, useRef } from 'react'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { KvaPrompt } from '@/components/drill/KvaPrompt'
import { PedagogyPanel } from '@/components/drill/PedagogyPanel'
import { QuestionFigure } from '@/components/drill/QuestionFigure'
import { useExplanation } from '@/components/drill-variants/useExplanation'
import { MathText } from '@/components/MathText'
import { pickTactic } from '@/components/pre-grade/pregrade-tactics'
import type { AnswerLetter, Option, Question } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { RAIL_STATEMENTS, railMeta, sectionLongLabel } from '@/lib/sectionRailLabel'

type Props = {
  question: Question
  /** Letter the user picked, or null if they haven't answered yet. */
  picked: AnswerLetter | null
  /** When true, options reveal correct/incorrect state and become readonly. */
  graded: boolean
  onPick: (letter: AnswerLetter) => void
  /** Phase A.5 — when DrillQuestion is rendered inside StudyDesk, the
   *  Study Desk's PedagogyPanel handles the explanation as a side
   *  column. Pass `renderExplanation={false}` to suppress the inline
   *  ExplanationPanel and avoid double-rendering. Defaults to true
   *  for backward compat with phone-mode callers. */
  renderExplanation?: boolean
  /** Phone fills a bounded flex container and owns its own scroll
   *  (`height:100%; overflow:auto`). On desktop the question sits in
   *  StudyDesk's sticky column, which already provides the scroll — so
   *  pass `fill={false}` to let the content flow at natural height
   *  instead of creating a nested scroll that clips the options. */
  fill?: boolean
  /** M1 (M3.tsx L881/L1034) — 1-indexed position in the session plan.
   *  When both position and total are present the M3 eyebrow renders
   *  ("ORDFÖRSTÅELSE · FRÅGA 3 AV 10"); when either is missing (legacy
   *  mounts without a session) the eyebrow is omitted entirely. */
  position?: number
  total?: number
  /** DTK block-grouping cue: the current question's place in its figure
   *  block ("Fråga 2 av 4 · samma sida"). Null/absent for non-block
   *  questions. The figure itself stays put across block-mates (the drill
   *  doesn't re-key DrillQuestion), so this just narrates that. */
  blockPosition?: { n: number; m: number } | null
}

export function DrillQuestion({
  question,
  picked,
  graded,
  onPick,
  renderExplanation = true,
  fill = true,
  position,
  total,
  blockPosition,
}: Props) {
  // Scroll back to the top whenever a new question loads. Without this
  // a long LÄS passage on Q1 leaves the inner overflow-y region
  // mid-scroll, so Q2 visually starts halfway down the screen.
  // We deliberately key on `qid` (not the whole question prop) so a
  // pick→graded transition on the SAME question doesn't re-scroll.
  const scrollerRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: qid identity is the trigger
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0
  }, [question.qid])

  // M1 tactic aside (M3.tsx L886/L1065) — the pre-grade named-strategy hint.
  // Corpus pregrade_tactic when the explanation carries one, else the
  // section-default hash-rotation catalog (same fallback as PreGradeFill).
  // The loader is cached per exam, so this shares PedagogyPanel's fetch.
  const explanation = useExplanation(question.qid)

  if (!question.options || question.parsing_status !== 'complete') {
    return (
      <div
        style={{
          padding: 'var(--pad-lg)',
          color: 'var(--muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        Frågan saknar fullständig text.
      </div>
    )
  }

  const meta = railMeta(question.section)
  const hasContext = !!question.context && meta.contextLabel !== null
  // ELF cloze passages: the real exam draws each gap as a blank line
  // with the question number in it — the PDF text layer only kept the
  // bare number, which camouflages among the passage's real numbers
  // (78%, 139, 1960…). Restore the affordance render-side (see
  // renderClozeText / the Lucka headword).
  //
  // Detection: an ELF item with NO stem prompt IS a cloze fill-in (the
  // gap is the question) — reading-comprehension items always carry a
  // prompt. Corpus check across all 27 exams: 135 empty-prompt ELF
  // items (all cloze), 0 prompted items with a gap chain — so this is
  // exact with zero false positives. The earlier probe keyed on the
  // literal "gaps which indicate" instruction, which 5 cloze passages
  // (e.g. host-2020-verb2-ELF-032) don't carry, so their gaps rendered
  // as bare numbers.
  const isCloze = question.section === 'ELF' && !(question.prompt ?? '').trim()
  const clozeGaps = isCloze
    ? findGapChain(question.context ?? '', question.number)
    : new Set<number>()
  // ORD-style single-word headwords get the large italic display setting;
  // sentence prompts get the tighter `.hpc-m3-q` scale.
  const promptIsShort = !question.prompt || question.prompt.length <= 18
  // NOG: split the flat prompt into stem + (1)/(2) statements + coda. Falls
  // back to rendering the raw prompt when the markers aren't present.
  const nog = meta.hasStatements && question.prompt ? parseNogPrompt(question.prompt) : null
  // Cloze questions have NO stem — the gap IS the question. Give the
  // empty prompt the 'Lucka N' headword so the page says which gap
  // you're solving.
  const promptStem =
    nog?.question ?? (isCloze && !question.prompt ? `Lucka ${question.number}` : question.prompt)

  // Running entrance stagger so the page reads top-to-bottom.
  let delay = 0
  const nextDelay = () => {
    const d = delay
    delay += 60
    return d
  }

  // M1 eyebrow (M3.tsx L881/L1034) — only when the caller threads the
  // session plan position through; legacy mounts render no eyebrow.
  const hasEyebrow = position != null && total != null
  // Short-prompt pages (the ORD specimen) fold the eyebrow into the prompt
  // section so the headword sits directly under it in one content column
  // (M3.tsx L873-893); multi-part pages give the eyebrow its own first rail
  // row (M3.tsx L1026-1039) so 'Texten'/'Frågan' labels stay on their rows.
  const mergeEyebrow = hasEyebrow && promptIsShort && !hasContext && !question.figure
  const eyebrowMeta = (
    <>
      <strong>{question.section}</strong>
      {position} / {total}
    </>
  )
  const eyebrowLine = (
    <div className="hpc-m3-eyebrow" data-testid="drill-eyebrow">
      {sectionLongLabel(question.section).toUpperCase()} · FRÅGA {position} AV {total}
    </div>
  )

  const tactic = graded
    ? null
    : (explanation?.pregrade_tactic ?? pickTactic(question.qid, question.section))
  const tacticAside = tactic ? (
    <aside className="hpc-m3-tactic">
      <p className="hpc-m3-tactic-h">Taktik · {tactic.handle}</p>
      <p className="hpc-m3-tactic-t">
        <MathText>{tactic.move}</MathText>
      </p>
    </aside>
  ) : null

  const lastKey = question.options[question.options.length - 1]?.letter.toLowerCase()

  const promptMeta = mergeEyebrow ? (
    eyebrowMeta
  ) : promptIsShort ? (
    <>
      <strong>{question.section}</strong>
      {question.section === 'ORD' ? 'synonymer' : null}
    </>
  ) : (
    meta.promptLabel
  )

  return (
    <div
      ref={scrollerRef}
      // hpc-m3-page: the M3 base type (15px/1.55). On desktop the
      // .hpc-studydesk frame already sets it; the PHONE path renders
      // this component bare, and without the base every em-derived
      // size inside drifts +1px (M6 sweep finding).
      className="hpc-m3-page"
      style={{
        height: fill ? '100%' : undefined,
        overflowY: fill ? 'auto' : undefined,
        // fill=false means StudyDesk's 880px frame owns the horizontal
        // gutters (M3.tsx L59) — doubling them here squeezed the content
        // column to ~567px vs the reference's 647px (M6 sweep finding).
        padding: fill ? '4px var(--pad-lg) 8px' : '4px 0 8px',
        containerType: 'inline-size',
      }}
    >
      {hasEyebrow && !mergeEyebrow && (
        <DrillRailSection meta={eyebrowMeta} delay={nextDelay()}>
          {eyebrowLine}
        </DrillRailSection>
      )}

      {hasContext && (
        <DrillRailSection meta={meta.contextLabel} delay={nextDelay()}>
          {/* data-testid on the passage content, not the rail section — the
           *  section also contains the mono rail label, which would pollute
           *  textContent that e2e reads. */}
          <div className="hpc-m3-passage" data-testid="drill-context">
            {question.context?.split(/\n{2,}/).map((para, i) => {
              // M4 (M3.tsx L1044): 880/1080 corpus passages open with a
              // real title line — short first paragraph with no terminal
              // sentence punctuation. Derive it into the M3 passage
              // heading; anything else stays a body paragraph.
              const isTitle = i === 0 && para.length <= 90 && !/[.!?]$/.test(para.trim())
              return isTitle ? (
                <h2 key={para.slice(0, 48)} className="hpc-m3-passage-h">
                  {para}
                </h2>
              ) : (
                // biome-ignore lint/suspicious/noArrayIndexKey: passage paragraphs are static text
                <p key={i}>{isCloze ? renderClozeText(para, question.number, clozeGaps) : para}</p>
              )
            })}
          </div>
        </DrillRailSection>
      )}

      {question.figure && (
        <DrillRailSection meta="Underlaget" delay={nextDelay()}>
          <figure className="hpc-m3-fig">
            <QuestionFigure figure={question.figure} />
          </figure>
          {blockPosition && blockPosition.m > 1 && (
            <div className="hpc-dtk-block-cue" data-testid="dtk-block-cue">
              <span className="hpc-dtk-block-dots" aria-hidden>
                {Array.from({ length: blockPosition.m }, (_, i) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional dots
                    key={i}
                    data-on={i < blockPosition.n ? 'true' : 'false'}
                    data-active={i === blockPosition.n - 1 ? 'true' : 'false'}
                  />
                ))}
              </span>
              Fråga {blockPosition.n} av {blockPosition.m} · samma sida
            </div>
          )}
        </DrillRailSection>
      )}

      {/* data-testid on the prompt CONTENT, not the rail section: the section
       *  wraps the mono rail label (e.g. "ORD synonymer") too, and e2e reads
       *  drill-prompt's textContent to resolve the answer — it must be just
       *  the headword/stem. */}
      <DrillRailSection meta={promptMeta} delay={nextDelay()}>
        {mergeEyebrow && eyebrowLine}
        {question.section === 'KVA' && question.prompt ? (
          <div className="hpc-m3-q" data-testid="drill-prompt">
            <KvaPrompt prompt={question.prompt} />
          </div>
        ) : promptIsShort ? (
          <h1 className="hpc-m3-display" data-testid="drill-prompt">
            <MathText>{promptStem}</MathText>
          </h1>
        ) : (
          <p className="hpc-m3-q" data-testid="drill-prompt">
            <MathText>{promptStem}</MathText>
          </p>
        )}
        {tacticAside}
      </DrillRailSection>

      {nog && (
        <DrillRailSection meta={RAIL_STATEMENTS} delay={nextDelay()}>
          <div className="hpc-m3-stmt">
            <span className="hpc-m3-stmt-n">(1)</span>
            <p className="hpc-m3-stmt-t">
              <MathText>{nog.statement1}</MathText>
            </p>
          </div>
          <div className="hpc-m3-stmt">
            <span className="hpc-m3-stmt-n">(2)</span>
            <p className="hpc-m3-stmt-t">
              <MathText>{nog.statement2}</MathText>
            </p>
          </div>
        </DrillRailSection>
      )}

      <DrillRailSection meta={meta.chooseLabel} delay={nextDelay()}>
        {nog?.tail && <p className="hpc-m3-coda">{nog.tail}</p>}
        <div className={meta.optionsProse ? 'hpc-m3-opts is-prose' : 'hpc-m3-opts'}>
          {question.options.map((opt) => (
            <OptionRow
              key={opt.letter}
              opt={opt}
              state={rowState(opt.letter, picked, question.answer, graded)}
              onClick={() => !graded && onPick(opt.letter)}
              disabled={graded}
            />
          ))}
        </div>
        {!graded && lastKey && (
          <div className="hpc-m3-keys">Tangenter a–{lastKey} väljer · klick fungerar också</div>
        )}
      </DrillRailSection>

      {/* M2: the panel renders its own rail sections (UTFALL / N STEG /
       *  N FÄLLOR) so the pedagogy continues the page's chassis. */}
      {renderExplanation && graded && picked != null && (
        <PedagogyPanel
          qid={question.qid}
          graded
          correct={picked === question.answer}
          answer={question.answer}
          options={question.options}
        />
      )}
    </div>
  )
}

type RowState = 'idle' | 'picked' | 'correct' | 'incorrect'

function rowState(
  letter: AnswerLetter,
  picked: AnswerLetter | null,
  answer: AnswerLetter,
  graded: boolean,
): RowState {
  if (!graded) return picked === letter ? 'picked' : 'idle'
  if (letter === answer) return 'correct'
  if (letter === picked) return 'incorrect'
  return 'idle'
}

// State → chassis class. Grading uses the semantic green/red tokens (is-ok /
// is-bad); a non-picked, non-answer row after grading dims (is-dim). The
// cobalt accent never signals correctness — it only appears on the hover
// indicator (structure / "this is clickable").
function rowClass(state: RowState, graded: boolean): string {
  switch (state) {
    case 'correct':
      return 'hpc-m3-opt is-ok'
    case 'incorrect':
      return 'hpc-m3-opt is-bad'
    case 'picked':
      return 'hpc-m3-opt is-picked'
    default:
      return graded ? 'hpc-m3-opt is-dim' : 'hpc-m3-opt'
  }
}

function OptionRow({
  opt,
  state,
  onClick,
  disabled,
}: {
  opt: Option
  state: RowState
  onClick: () => void
  disabled: boolean
}) {
  // Post-grade caption: the correct row is labelled "Rätt svar"; a wrong
  // pick is labelled "Ditt svar".
  const verdict = state === 'correct' ? 'Rätt svar' : state === 'incorrect' ? 'Ditt svar' : null
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={`option-${opt.letter}`}
      data-state={state}
      className={rowClass(state, disabled)}
    >
      <span aria-hidden className="hpc-m3-ind" />
      <span className="hpc-m3-opt-k">{opt.letter.toLowerCase()}</span>
      <span className="hpc-m3-opt-t">
        {opt.figure && (
          <img
            src={`/${opt.figure.src}`}
            alt={opt.text}
            loading="lazy"
            className="hpc-m3-opt-fig"
            style={{
              display: 'block',
              width: 'auto',
              height: 'clamp(120px, 22vw, 160px)',
              aspectRatio: String(opt.figure.aspect_ratio),
              objectFit: 'contain',
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: 'calc(var(--radius) * 0.5)',
              marginBottom: 8,
            }}
          />
        )}
        <MathText>{opt.text}</MathText>
      </span>
      <span className="hpc-m3-opt-v">{verdict}</span>
    </button>
  )
}

// ── ELF cloze gaps ──────────────────────────────────────────────────
//
// Restore the printed exam's gap affordance. A gap in the text layer
// is a bare standalone 2-digit number (the question number) — but the
// passage also contains REAL numbers, so a candidate only counts as a
// gap when:
//   - it is exactly 2 digits, not adjacent to another digit, a dash
//     (25–34 ranges) or a percent sign (78%)
//   - it falls within the passage's question band (±6 of the current
//     question — ELF cloze groups are 4–6 contiguous questions)
// The current question's gap is emphasized (accent); sibling gaps are
// quiet blanks, so the passage still reads as one text.

// Two corpus shapes: a bare number ('these 31 preferences') and a
// number glued to extracted underscores ('31_____ incapacity' — some
// PDFs' gap lines survived as literal underscores). The underscores
// are consumed into the match and replaced by the styled gap.
const CLOZE_GAP_RE = /(?<![\w–-])_{0,14}(\d{2})_{0,14}(?![\w–\-%])/g

/** Real gaps form an ASCENDING CONSECUTIVE run across the whole
 *  passage (31, 32, 33, …) — a content number like an age ("Around
 *  the age of 40") breaks the chain and is rejected even when it
 *  falls inside the band. Returns the set of accepted gap numbers. */
function findGapChain(context: string, currentNumber: number): Set<number> {
  const cands: number[] = []
  for (const m of context.matchAll(CLOZE_GAP_RE)) {
    const n = Number(m[1])
    if (Math.abs(n - currentNumber) <= 6) cands.push(n)
  }
  let best: number[] = []
  for (let i = 0; i < cands.length; i++) {
    const chain = [cands[i]]
    for (let j = i + 1; j < cands.length; j++) {
      if (cands[j] === chain[chain.length - 1] + 1) chain.push(cands[j])
    }
    if (chain.includes(currentNumber) && chain.length > best.length) best = chain
  }
  // A passage that lost some gap glyphs can leave the current number
  // outside any chain — fall back to marking just the in-band numbers
  // so SOMETHING is visible rather than nothing.
  return new Set(best.length > 0 ? best : cands)
}

function renderClozeText(text: string, currentNumber: number, gapSet: Set<number>): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(CLOZE_GAP_RE)) {
    const n = Number(m[1])
    if (!gapSet.has(n)) continue
    const idx = m.index ?? 0
    if (idx > last) out.push(text.slice(last, idx))
    const active = n === currentNumber
    out.push(
      <span
        key={`${n}-${idx}`}
        data-testid={`cloze-gap-${n}`}
        data-active={active ? 'true' : 'false'}
        style={{
          display: 'inline-block',
          padding: '0 14px 1px',
          margin: '0 2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8em',
          fontVariantNumeric: 'tabular-nums',
          color: active ? 'var(--accent)' : 'var(--muted)',
          fontWeight: active ? 700 : 400,
          background: active ? 'var(--accent-soft)' : 'transparent',
          borderBottom: `2px solid ${active ? 'var(--accent)' : 'var(--muted-2)'}`,
          lineHeight: 1.2,
        }}
      >
        {n}
      </span>,
    )
    last = idx + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
