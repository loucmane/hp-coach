// PedagogyPanel — Phase A.5 Study Desk explanation renderer.
//
// Replaces the wrapping role of ExplanationPanel at reader/studio
// widths. ExplanationPanel stays for phone-mode (collapsed/expanded
// accordion); PedagogyPanel renders the same data in an always-
// expanded, step-numbered layout that fits a side column.
//
// Two states:
//
//   - Waiting (pre-answer): a quiet placeholder card. Shows a peek
//     at the technique tag if present — gives the student a faint
//     "what kind of move does this question reward" hint without
//     spoiling the answer.
//
//   - Post-grade: the full Study Desk reveal. Step cards take priority
//     above the fold; distractors render expanded (the desktop width
//     can afford it); pitfall + technique sit in their familiar chips.
//
// Step rendering strategy:
//   1. If `explanation.steps[]` is present → render as numbered cards.
//   2. Else, split `explanation.solution_path` on paragraph boundaries
//      (`\n\n`) or "Step N" / "1." prefixes as a best-effort heuristic.
//   3. Worst case: render the entire `solution_path` as one card.
//
// Phase A.6 fills in real `steps[]` arrays from the generator; the
// heuristic-split fallback ships earlier so the UI works without
// waiting for corpus regen.

import { useEffect, useState } from 'react'

import { type FeedbackEntry, getFeedback, submitFeedback } from '@/api/feedback'
import { MathText } from '@/components/MathText'
import { Eyebrow, L1Chip, Mono } from '@/components/primitives'
import { type Explanation, type ExplanationStep, loadExplanation } from '@/data/explanations'

type Props = {
  qid: string
  /** Whether the user has been graded yet. Drives the waiting vs.
   *  post-grade state. */
  graded: boolean
  /** Whether the user got it right. Drives subtle colour cues on
   *  the eyebrow / framing copy. */
  correct: boolean
}

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; explanation: Explanation }
  | { kind: 'missing' }
  | { kind: 'error'; message: string }

export function PedagogyPanel({ qid, graded, correct }: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'idle' })

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

  if (state.kind === 'missing' || state.kind === 'error') {
    // Same posture as ExplanationPanel — missing / transport-error
    // both render nothing rather than a half-broken card. Drill stays
    // usable.
    if (state.kind === 'error') {
      console.warn(`[PedagogyPanel] failed to load ${qid}:`, state.message)
    }
    return null
  }

  return (
    <aside
      data-testid="pedagogy-panel"
      data-state={graded ? 'post-grade' : 'waiting'}
      data-correct={correct}
      style={{
        // Phase A.8 EDITION: drop the card chrome (border + radius
        // + background) — pedagogy panel becomes marginalia,
        // articulated by a single 1px hairline on its leading edge.
        // No box; just a column of text in the right margin.
        borderLeft: '1px solid var(--hairline)',
        paddingLeft: 'clamp(20px, 1.5vw + 12px, 36px)',
        paddingTop: 'clamp(28px, 4vh, 56px)',
        paddingRight: 0,
        paddingBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        containerType: 'inline-size',
      }}
    >
      {graded ? (
        state.kind === 'ready' ? (
          <PostGradeBody explanation={state.explanation} qid={qid} correct={correct} />
        ) : (
          <SkeletonBody />
        )
      ) : state.kind === 'ready' ? (
        <WaitingBody explanation={state.explanation} />
      ) : (
        <WaitingPlaceholder />
      )}
    </aside>
  )
}

// ── Waiting state ──────────────────────────────────────────────────

function WaitingBody({ explanation }: { explanation: Explanation }) {
  return (
    <>
      <Eyebrow style={{ color: 'var(--muted)' }}>Innan svaret</Eyebrow>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.9rem + 0.3vw, 18px)',
          lineHeight: 1.5,
          color: 'var(--ink-2)',
        }}
      >
        Välj ett alternativ — förklaringen visas här när du svarat.
      </p>
      {explanation.framework_id && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mono>Ramverk</Mono>
          <L1Chip id={explanation.framework_id} />
        </div>
      )}
      {explanation.technique && (
        <div>
          <Mono style={{ marginBottom: 4, display: 'inline-block' }}>Teknik</Mono>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              lineHeight: 1.45,
              color: 'var(--ink-2)',
              opacity: 0.55,
              fontStyle: 'italic',
            }}
          >
            (visas efter svar)
          </div>
        </div>
      )}
    </>
  )
}

function WaitingPlaceholder() {
  // Loading state for the waiting panel — same shape so the column
  // doesn't reflow when the explanation resolves.
  return (
    <>
      <Eyebrow style={{ color: 'var(--muted)' }}>Innan svaret</Eyebrow>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          color: 'var(--muted)',
        }}
      >
        Välj ett alternativ.
      </p>
    </>
  )
}

// ── Post-grade body ────────────────────────────────────────────────

function PostGradeBody({
  explanation,
  qid,
  correct,
}: {
  explanation: Explanation
  qid: string
  correct: boolean
}) {
  const eyebrow = correct ? 'Bra jobbat — så här tänkte HP-Coach' : 'Så här löses uppgiften'
  const steps = resolveSteps(explanation)
  return (
    <>
      <Eyebrow style={{ color: correct ? 'var(--ok)' : 'var(--ink-2)' }}>{eyebrow}</Eyebrow>
      {explanation.framework_id && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mono>Ramverk</Mono>
          <L1Chip id={explanation.framework_id} />
        </div>
      )}
      <StepList steps={steps} />
      {explanation.distractors.length > 0 && (
        <DistractorBlock distractors={explanation.distractors} />
      )}
      {(explanation.technique || explanation.pitfall) && (
        <MetaBlock technique={explanation.technique} pitfall={explanation.pitfall} />
      )}
      <QABar qid={qid} explanation={explanation} />
    </>
  )
}

// ── Step rendering ─────────────────────────────────────────────────

/** Reconcile the structured-steps path (A.6+) with the prose-only path
 *  (pre-A.6). Returns an array of ExplanationStep ready for rendering. */
function resolveSteps(explanation: Explanation): ExplanationStep[] {
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

function StepList({ steps }: { steps: ExplanationStep[] }) {
  if (steps.length === 0) return null
  if (steps.length === 1) {
    // Single step — render as a plain prose block, not a numbered
    // card. The card framing is overkill when there's only one.
    return (
      <div
        data-testid="pedagogy-solution"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.9rem + 0.3vw, 18px)',
          lineHeight: 1.55,
          color: 'var(--ink)',
        }}
      >
        <MathText>{steps[0].text}</MathText>
      </div>
    )
  }
  return (
    <ol
      data-testid="pedagogy-steps"
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {steps.map((step) => (
        <StepCard key={step.n} step={step} />
      ))}
    </ol>
  )
}

function StepCard({ step }: { step: ExplanationStep }) {
  return (
    <li
      data-testid={`pedagogy-step-${step.n}`}
      style={{
        background: 'var(--panel-2)',
        border: '1px solid var(--hairline-2)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 'var(--font-mono-track)',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          Steg {step.n}
        </span>
        {step.title && (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--ink)',
            }}
          >
            {step.title}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(14px, 0.875rem + 0.2vw, 16px)',
          lineHeight: 1.55,
          color: 'var(--ink)',
        }}
      >
        <MathText>{step.text}</MathText>
      </div>
    </li>
  )
}

// ── Distractor block ───────────────────────────────────────────────

function DistractorBlock({ distractors }: { distractors: Explanation['distractors'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Mono>Varför inte de andra</Mono>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {distractors.map((d) => (
          <div
            key={d.letter}
            data-testid={`pedagogy-distractor-${d.letter}`}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--hairline-2)',
              borderRadius: 'calc(var(--radius) * 0.4)',
              background: 'var(--panel-2)',
              display: 'flex',
              gap: 10,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: 11,
                background: 'var(--bg)',
                border: '1px solid var(--hairline)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--muted)',
                flexShrink: 0,
              }}
            >
              {d.letter}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-2)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Lockar för att: </strong>
                <MathText>{d.why_tempting}</MathText>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <strong style={{ fontWeight: 600 }}>Men fel för: </strong>
                <MathText>{d.why_wrong}</MathText>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Meta block (technique + pitfall) ───────────────────────────────

function MetaBlock({ technique, pitfall }: { technique: string; pitfall: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {technique && (
        <div
          data-testid="pedagogy-technique"
          style={{
            display: 'flex',
            gap: 10,
            padding: '10px 12px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--hairline)',
            borderRadius: 'calc(var(--radius) * 0.4)',
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          <Mono style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>Teknik</Mono>
          <span style={{ color: 'var(--ink)' }}>
            <MathText>{technique}</MathText>
          </span>
        </div>
      )}
      {pitfall && (
        <div
          data-testid="pedagogy-pitfall"
          style={{
            display: 'flex',
            gap: 10,
            padding: '10px 12px',
            background: 'var(--bad-soft)',
            border: '1px solid var(--hairline)',
            borderRadius: 'calc(var(--radius) * 0.4)',
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          <Mono style={{ color: 'var(--bad)', flexShrink: 0, marginTop: 2 }}>Fälla</Mono>
          <span style={{ color: 'var(--ink)' }}>
            <MathText>{pitfall}</MathText>
          </span>
        </div>
      )}
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

// ── Skeleton ───────────────────────────────────────────────────────

function SkeletonBody() {
  return (
    <>
      <Eyebrow style={{ color: 'var(--muted)' }}>Förklaringen</Eyebrow>
      <p style={{ margin: 0, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        Tänker igenom uppgiften…
      </p>
    </>
  )
}

// Export step-splitting heuristic for unit tests.
export const __test = { splitProseIntoSteps, resolveSteps }
