// PedagogyPanel — the graded pedagogy, M3 "Boksidan" (M2 of plan
// hashed-twirling-zephyr; spec devbake/l12/M3.tsx L1122-1220).
//
// Renders as a continuation of the drill's margin-rail chassis — three
// rail sections that follow the options:
//
//   UTFALL      verdict word (Rätt./Fel.) + verdict-sub stating the
//               correct answer + the bold-serif solution lede
//   N STEG      "Så löser du den" — numbered steps, serif ordinal in
//               cobalt, kärna/detalj tier badge, staggered entrance
//   N FÄLLOR    "Varför de andra lockar" — each distractor re-prints
//               the struck option text (the single-column page scrolls
//               the options away; the reprint keeps the pedagogy
//               self-contained), then whyTempting / whyWrong
//
// Live-only apparatus kept from the EDITION panel: the Layer-1
// framework deep-link and the QA bar (quiet tail of the last section).
// The coach-voice line is REPLACED by the verdict-sub; the Strategi and
// Teknik/Fällan blocks folded into the pre-grade tactic aside (M1).
//
// Pre-grade the panel renders NOTHING — M3 has no waiting pedagogy.

import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { type FeedbackEntry, getFeedback, submitFeedback } from '@/api/feedback'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MathText } from '@/components/MathText'
import { L1Chip, Mono } from '@/components/primitives'
import { type Explanation, type ExplanationStep, loadExplanation } from '@/data/explanations'
import { type AnswerLetter, type Option, SECTION_KEYS, type Section } from '@/data/questions'
import { optWordLayoutId, useArketMotion } from '@/lib/motion'
import { RAIL_OUTCOME } from '@/lib/sectionRailLabel'

type Props = {
  qid: string
  /** Whether the user has been graded yet. Pre-grade renders nothing. */
  graded: boolean
  /** Whether the user got it right. Drives the verdict word + sub. */
  correct: boolean
  /** Correct answer letter — the verdict-sub states it on a wrong pick
   *  (M3.tsx L1134). Optional so legacy mounts keep compiling; the sub
   *  degrades to the explanation hand-off line without it. */
  answer?: AnswerLetter
  /** Question options — the distractor rows re-print the struck option
   *  text and the verdict-sub quotes the correct one. */
  options?: Option[] | null
  /** A2 verdict morph (task): the letter the user picked. When set (and
   *  not a figure option / reduced motion), the verdict word IS the
   *  picked option word, flown here from its row via a shared layoutId,
   *  the semantic colour switching instantly and the "— rätt./— fel."
   *  drying in beside it. Omitted → the calm "Rätt./Fel." fallback. */
  picked?: AnswerLetter | null
  /** The picked option's text — the word that morphs into the verdict. */
  pickedText?: string
  /** Picked an image option — no clean word to morph, use the fallback. */
  pickedHasFigure?: boolean
  /** Release velocity inherited from a drag commit (0 on click/keyboard),
   *  carried into the verdict morph spring. */
  commitV?: number
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; explanation: Explanation }
  | { kind: 'missing' }
  | { kind: 'error'; message: string }

export function PedagogyPanel({
  qid,
  graded,
  correct,
  answer,
  options,
  picked,
  pickedText,
  pickedHasFigure,
  commitV = 0,
}: Props) {
  const ark = useArketMotion()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    loadExplanation(qid)
      .then((e) => {
        if (!alive) return
        if (e == null) setState({ kind: 'missing' })
        else setState({ kind: 'ready', explanation: e })
      })
      .catch((err) => {
        if (!alive) return
        setState({ kind: 'error', message: String(err?.message ?? err) })
      })
    return () => {
      alive = false
    }
  }, [qid])

  // M3 has no pre-grade pedagogy — the tactic aside (M1) covers the
  // "before you answer" moment inside the question itself.
  if (!graded) return null

  if (state.kind === 'error') {
    // Transport error (5xx etc.) — log silently and render nothing
    // rather than a half-broken card. Drill stays usable.
    console.warn(`[PedagogyPanel] failed to load ${qid}:`, state.message)
    return null
  }

  const explanation = state.kind === 'ready' ? state.explanation : null
  const steps = explanation ? resolveSteps(explanation) : []
  const distractors = explanation?.distractors ?? []
  const hasStructuredSteps = (explanation?.steps?.length ?? 0) > 0
  const correctText = answer ? options?.find((o) => o.letter === answer)?.text : undefined

  // Framework deep-link + QA bar — quiet tail of the LAST section.
  const tail = explanation ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
      {explanation.framework_id && <FrameworkChip frameworkId={explanation.framework_id} />}
      <QABar qid={qid} explanation={explanation} />
    </div>
  ) : null

  return (
    <div
      className="hpc-m3-ped"
      data-testid="pedagogy-panel"
      data-state="post-grade"
      data-correct={correct}
    >
      <DrillRailSection meta={RAIL_OUTCOME} delay={0}>
        {/* role=status + aria-live announce the outcome to screen readers
         *  the moment grading lands; aria-label spells out the terse ink
         *  word. */}
        <div
          className="hpc-m3-verdict"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={correct ? 'Rätt svar' : 'Fel svar'}
        >
          {picked && pickedText && !pickedHasFigure && !ark.rm ? (
            // The picked word flew up from its option row (shared
            // layoutId). Semantic colour switches instantly (no transition
            // on colour — A2's law); the "— rätt./— fel." dries in beside
            // it (tork). A wrong pick keeps its strike as it lands.
            <span
              aria-hidden
              style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}
            >
              <motion.span
                layoutId={optWordLayoutId(qid, picked)}
                transition={{ ...ark.arket, velocity: commitV }}
                className={`hpc-m3-verdict-word ${correct ? 'is-ok' : 'is-bad'}`}
                // Override the CSS translate-in entrance (A2: no
                // translate-in) — the layout morph is the entrance.
                style={{ animation: 'none' }}
              >
                <span
                  style={
                    correct
                      ? undefined
                      : { textDecoration: 'line-through', textDecorationThickness: '2px' }
                  }
                >
                  {pickedText}
                </span>
              </motion.span>
              <motion.span
                initial={ark.rm ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...ark.tork, delay: ark.rm ? 0 : 0.08 }}
                className={`hpc-m3-verdict-word ${correct ? 'is-ok' : 'is-bad'}`}
                style={{ animation: 'none', fontSize: 'clamp(20px, 3vw, 28px)' }}
              >
                {correct ? '— rätt.' : '— fel.'}
              </motion.span>
            </span>
          ) : (
            <span aria-hidden className={`hpc-m3-verdict-word ${correct ? 'is-ok' : 'is-bad'}`}>
              {correct ? 'Rätt.' : 'Fel.'}
            </span>
          )}
          <p className="hpc-m3-verdict-sub">
            {correct ? (
              'Snyggt — rätt tänkt hela vägen.'
            ) : (
              <>
                {answer && correctText ? (
                  <>
                    Rätt svar är {answer.toLowerCase()}) <MathText>{correctText}</MathText>.{' '}
                  </>
                ) : null}
                {explanation ? 'Häng med i varför.' : ''}
              </>
            )}
          </p>
        </div>
        {state.kind === 'loading' && <p className="hpc-m3-missing">Tänker igenom uppgiften…</p>}
        {state.kind === 'missing' && <MissingExplanation qid={qid} />}
        {explanation && hasStructuredSteps && explanation.solution_path && (
          <p className="hpc-m3-solution">
            <MathText>{explanation.solution_path}</MathText>
          </p>
        )}
        {explanation && steps.length === 0 && distractors.length === 0 && tail}
      </DrillRailSection>

      {steps.length > 0 && (
        <DrillRailSection meta={`${steps.length} steg`} delay={140}>
          <h2 className="hpc-m3-h">Så löser du den</h2>
          <StepList steps={steps} />
          {distractors.length === 0 && tail}
        </DrillRailSection>
      )}

      {distractors.length > 0 && (
        <DrillRailSection meta={`${distractors.length} fällor`} delay={280}>
          <h2 className="hpc-m3-h">Varför de andra lockar</h2>
          <div>
            {distractors.map((d, i) => (
              <DistractorRow
                key={d.letter}
                distractor={d}
                optionText={options?.find((o) => o.letter === d.letter)?.text}
                delay={360 + i * 80}
              />
            ))}
          </div>
          {tail}
        </DrillRailSection>
      )}
    </div>
  )
}

// ── Missing-explanation state ──────────────────────────────────────
//
// When Layer 2 hasn't been backfilled the M3 missing line renders in
// the Utfall section, with the flag-this CTA (writes a 'rejected'
// feedback entry so the next regen wave can prioritize by demand).

function MissingExplanation({ qid }: { qid: string }) {
  const [flagged, setFlagged] = useState<boolean>(() => getFeedback(qid)?.status === 'rejected')
  const flag = () => {
    submitFeedback({
      qid,
      status: 'rejected',
      model: 'missing-explanation',
      generated_at: 0,
      reviewed_at: Date.now(),
    })
    setFlagged(true)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
      <p className="hpc-m3-missing">Förklaring saknas ännu för den här frågan.</p>
      <button
        type="button"
        onClick={flag}
        disabled={flagged}
        data-testid="pedagogy-flag-missing"
        style={{
          background: 'transparent',
          border: '1px solid var(--hairline)',
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: flagged ? 'var(--muted)' : 'var(--ink)',
          cursor: flagged ? 'default' : 'pointer',
          borderRadius: 4,
        }}
      >
        {flagged ? '✓ Markerad — tack' : 'Markera som saknad'}
      </button>
    </div>
  )
}

// ── Framework chip (post-grade deep-link) ──────────────────────────

function sectionFromFrameworkId(id: string): Section | null {
  const prefix = id.split('-', 1)[0]
  if ((SECTION_KEYS as readonly string[]).includes(prefix)) return prefix as Section
  return null
}

/** Closes the Layer-1 ↔ Layer-2 loop: clicking the chip navigates to
 *  /lektion?section=SEC#FRAMEWORK_ID, where the reader opens the
 *  matching trap card and scrolls it into view. */
function FrameworkChip({ frameworkId }: { frameworkId: string }) {
  const navigate = useNavigate()
  const section = sectionFromFrameworkId(frameworkId)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Mono>Ramverk</Mono>
      <L1Chip
        id={frameworkId}
        locked={section === null}
        onClick={() => {
          if (!section) return
          navigate({ to: '/lektion', search: { section }, hash: frameworkId })
        }}
      />
    </div>
  )
}

// ── Step rendering ─────────────────────────────────────────────────

/** Reconcile the structured-steps path (A.6+) with the prose-only path
 *  (pre-A.6). Returns an array of ExplanationStep ready for rendering.
 *
 *  Exported so the phone ExplanationPanel can render the same
 *  step composition as desktop. */
export function resolveSteps(explanation: Explanation): ExplanationStep[] {
  if (explanation.steps && explanation.steps.length > 0) {
    return explanation.steps
  }
  return splitProseIntoSteps(explanation.solution_path)
}

/** Heuristic split for pre-A.6 corpus.
 *  - First tries blank-line separation (paragraphs).
 *  - Then tries numbered prefixes ("1.", "2.", "Step 1:").
 *  - Worst case: a single step containing the whole prose. */
function splitProseIntoSteps(prose: string): ExplanationStep[] {
  if (!prose) return []

  const paragraphs = prose
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length > 1) {
    return paragraphs.map((text, i) => ({ n: i + 1, text }))
  }

  // Try numbered prefixes inside a single paragraph: "1. blah 2. blah".
  // Splits on a digit followed by `.` or `)` after a whitespace
  // boundary. We require at least 2 numbered segments to claim a hit
  // so we don't accidentally split "Multiply 7. " mid-sentence.
  const numberedMatches = [...prose.matchAll(/(?:^|\s)([1-9])[.)]\s+/g)]
  if (numberedMatches.length >= 2) {
    const parts: ExplanationStep[] = []
    for (let i = 0; i < numberedMatches.length; i++) {
      const m = numberedMatches[i]
      const start = (m.index ?? 0) + m[0].length
      const end = numberedMatches[i + 1]?.index ?? prose.length
      parts.push({ n: Number(m[1]), text: prose.slice(start, end).trim() })
    }
    return parts
  }

  return [{ n: 1, text: prose }]
}

/** Corpus tiers beyond the canonical pair (deep/verification/support…)
 *  read as elaboration — badge them detalj. Absent tier = kärna (the
 *  pre-A.6V default). */
function tierLabel(tier: ExplanationStep['tier']): string {
  return tier == null || tier === 'essential' ? 'kärna' : 'detalj'
}

/** M3 step rows (M3.tsx L1158-1177): serif cobalt ordinal, title with
 *  tier badge, body. Staggered entrance from `baseDelay`.
 *
 *  Exported so the phone ExplanationPanel renders the same composition. */
export function StepList({
  steps,
  baseDelay = 220,
}: {
  steps: ExplanationStep[]
  baseDelay?: number
}) {
  if (steps.length === 0) return null
  return (
    <ol data-testid="pedagogy-steps" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {steps.map((step, i) => (
        <li
          key={step.n}
          className="hpc-m3-step"
          data-testid={`pedagogy-step-${step.n}`}
          style={{ animationDelay: `${baseDelay + i * 80}ms` }}
        >
          <span className="hpc-m3-step-n" aria-hidden>
            {step.n}.
          </span>
          <div>
            {step.title ? (
              <h3 className="hpc-m3-step-h">
                <MathText>{step.title}</MathText>
                <span className="hpc-m3-step-tier">{tierLabel(step.tier)}</span>
              </h3>
            ) : null}
            {/* is-pre (M3.tsx L1172): corpus step text can carry real
             *  newlines (NOG statement walk-throughs) — render them. */}
            <p className="hpc-m3-step-t is-pre">
              <MathText>{step.text}</MathText>
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ── Distractor rows ────────────────────────────────────────────────

function DistractorRow({
  distractor,
  optionText,
  delay,
}: {
  distractor: Explanation['distractors'][number]
  optionText?: string
  delay: number
}) {
  return (
    <div
      className="hpc-m3-dis"
      data-testid={`pedagogy-distractor-${distractor.letter}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="hpc-m3-dis-h">
        <span className="hpc-m3-dis-k">{distractor.letter.toLowerCase()})</span>
        {optionText ? (
          <s>
            <MathText>{optionText}</MathText>
          </s>
        ) : null}
      </p>
      <p className="hpc-m3-dis-l">Varför det lockar</p>
      <p className="hpc-m3-dis-p">
        <MathText>{distractor.why_tempting}</MathText>
      </p>
      <p className="hpc-m3-dis-l">Varför det är fel</p>
      <p className="hpc-m3-dis-p">
        <MathText>{distractor.why_wrong}</MathText>
      </p>
    </div>
  )
}

// ── QA bar ─────────────────────────────────────────────────────────

function QABar({ qid, explanation }: { qid: string; explanation: Explanation }) {
  const [feedback, setFeedback] = useState<FeedbackEntry | null>(() => getFeedback(qid))
  useEffect(() => {
    setFeedback(getFeedback(qid))
  }, [qid])

  const submit = (status: FeedbackEntry['status']) => {
    const entry: FeedbackEntry = {
      qid,
      status,
      model: explanation._meta?.model ?? 'unknown',
      generated_at: explanation._meta?.generated_at ?? 0,
      reviewed_at: Date.now(),
    }
    submitFeedback(entry)
    setFeedback(entry)
  }

  return (
    <div
      data-testid="pedagogy-qa"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        paddingTop: 10,
        borderTop: '1px solid var(--hairline-2)',
      }}
    >
      <span style={{ flex: 1 }}>
        <Mono>{feedback ? 'Tack för din feedback' : 'Hjälpte förklaringen?'}</Mono>
      </span>
      <QAButton
        active={feedback?.status === 'approved'}
        onClick={() => submit('approved')}
        ariaLabel="Markera förklaringen som bra"
      >
        👍
      </QAButton>
      <QAButton
        active={feedback?.status === 'rejected'}
        onClick={() => submit('rejected')}
        ariaLabel="Markera förklaringen som dålig"
      >
        👎
      </QAButton>
    </div>
  )
}

function QAButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean
  onClick: () => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 16,
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--hairline)'}`,
        cursor: 'pointer',
        fontSize: 14,
        transition: 'background 150ms, border-color 150ms',
      }}
    >
      {children}
    </button>
  )
}

// Export step-splitting heuristic for unit tests.
export const __test = { splitProseIntoSteps, resolveSteps }
