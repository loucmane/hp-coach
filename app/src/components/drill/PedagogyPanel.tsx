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

import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { type FeedbackEntry, getFeedback, submitFeedback } from '@/api/feedback'
import { MathText } from '@/components/MathText'
import { CoachLine, Eyebrow, L1Chip, Mono } from '@/components/primitives'
import { type Explanation, type ExplanationStep, loadExplanation } from '@/data/explanations'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'

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

  if (state.kind === 'error') {
    // Transport error (5xx etc.) — log silently and render nothing
    // rather than a half-broken card. Drill stays usable.
    console.warn(`[PedagogyPanel] failed to load ${qid}:`, state.message)
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
        ) : state.kind === 'missing' ? (
          <MissingExplanation qid={qid} correct={correct} />
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

// ── Missing-explanation state ──────────────────────────────────────
//
// Phase A.8.1: when Layer 2 hasn't been backfilled for this qid we
// used to render nothing — the pedagogy column went silently empty,
// leaving the user with no idea why they got the answer wrong. Show
// a graceful placeholder card instead, with a flag-this CTA that
// writes a 'rejected' feedback entry so we can prioritize the next
// regen wave. The post-A.6 corpus regen will close the gap; this
// placeholder makes the gap visible and actionable until then.

function MissingExplanation({ qid, correct }: { qid: string; correct: boolean }) {
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
    <>
      <Eyebrow style={{ color: correct ? 'var(--ok)' : 'var(--muted)' }}>
        {correct ? 'Bra jobbat' : 'Förklaring saknas'}
      </Eyebrow>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.9rem + 0.3vw, 18px)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          maxWidth: '34ch',
        }}
      >
        Den här frågan har inte fått en pedagogisk genomgång än. Vi prioriterar backfill efter hur
        ofta varje fråga flaggas — markera den så hamnar den högre i kön.
      </p>
      <button
        type="button"
        onClick={flag}
        disabled={flagged}
        data-testid="pedagogy-flag-missing"
        style={{
          alignSelf: 'flex-start',
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
    </>
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
  const coach = useCoachStore((s) => s.coach)
  // Coach voice attribution sits between the eyebrow (category label)
  // and the apparatus (steps + distractors). The eyebrow stays
  // editorial chrome; the coach line is the personality. VOICE[coach]
  // is what makes this read as "Märta said this" instead of "the app
  // emitted a string."
  const voiceLine = correct ? VOICE[coach].feedbackRight : VOICE[coach].feedbackWrong
  const eyebrow = correct ? 'Post-mortem' : 'Så här löses uppgiften'
  const steps = resolveSteps(explanation)
  return (
    <>
      <Eyebrow style={{ color: correct ? 'var(--ok)' : 'var(--ink-2)' }}>{eyebrow}</Eyebrow>
      <CoachLine coach={coach} as="small" style={{ marginTop: 8, marginBottom: 12 }}>
        {voiceLine}
      </CoachLine>
      {explanation.framework_id && <FrameworkChip frameworkId={explanation.framework_id} />}
      {explanation.pregrade_tactic && (
        <StrategiBlock
          handle={explanation.pregrade_tactic.handle}
          move={explanation.pregrade_tactic.move}
        />
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

// ── Framework chip (post-grade deep-link) ──────────────────────────

function sectionFromFrameworkId(id: string): Section | null {
  const prefix = id.split('-', 1)[0]
  if ((SECTION_KEYS as readonly string[]).includes(prefix)) return prefix as Section
  return null
}

/** Closes the Layer-1 ↔ Layer-2 loop on desktop: clicking the chip
 *  navigates to /lektion?section=SEC#FRAMEWORK_ID, where the reader
 *  opens the matching trap card and scrolls it into view. */
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

// ── Strategi block (post-grade) ────────────────────────────────────

/** Surfaces the pre-grade named strategy on the post-grade view so the
 *  handle ("Linjärekvationsreceptet") and move ("Subtrahera den
 *  mindre x-termen…") get a second reading after the student grades —
 *  the moment they're most likely to internalize the handle. */
function StrategiBlock({ handle, move }: { handle: string; move: string }) {
  return (
    <div style={{ maxWidth: '52ch' }}>
      <Mono>Strategi</Mono>
      <h3
        style={{
          margin: '8px 0 8px',
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          letterSpacing: '-0.012em',
          lineHeight: 1.3,
          fontWeight: 500,
          color: 'var(--ink)',
        }}
      >
        {handle}
      </h3>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        {move}
      </p>
    </div>
  )
}

// ── Step rendering ─────────────────────────────────────────────────

/** Reconcile the structured-steps path (A.6+) with the prose-only path
 *  (pre-A.6). Returns an array of ExplanationStep ready for rendering.
 *
 *  Exported so the phone ExplanationPanel can render the same
 *  step-card composition as desktop (Phase A.6V.5 — phone bifurcation
 *  fix). */
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

/** Render an ordered list of explanation steps as the canonical
 *  numbered-card composition used in Study Desk's PedagogyPanel.
 *
 *  Exported so the phone ExplanationPanel can reuse the same look,
 *  rather than maintaining a parallel renderer (Phase A.6V.5).
 *  Single-step explanations render as a plain prose block instead of
 *  a numbered card — the card framing is overkill when there's
 *  only one. */
export function StepList({ steps }: { steps: ExplanationStep[] }) {
  if (steps.length === 0) return null
  if (steps.length === 1) {
    // Single step — render as a plain prose block, not a numbered
    // card. The card framing is overkill when there's only one.
    return (
      <div
        data-testid="pedagogy-solution"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'clamp(15px, 0.9rem + 0.3vw, 17px)',
          lineHeight: 1.6,
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
        // A.8.1 — generous step-to-step gap so each step reads as its
        // own moment in the worked example, not as a list item.
        // A.6V.5 — softened via clamp() so phone widths (where steps
        // stack inside the expanded ExplanationPanel accordion) get
        // tighter vertical rhythm; the same component renders happily
        // at studio width too.
        gap: 'clamp(14px, 2.5vw, 20px)',
      }}
    >
      {steps.map((step) => (
        <StepCard key={step.n} step={step} />
      ))}
    </ol>
  )
}

/** Single numbered step card. Exported alongside StepList so callers
 *  (currently just ExplanationPanel on phone) can compose ad-hoc step
 *  layouts without a parallel implementation. */
export function StepCard({ step }: { step: ExplanationStep }) {
  return (
    <li
      data-testid={`pedagogy-step-${step.n}`}
      style={{
        // A.8.1 — drop the card chrome on individual steps (matches
        // the EDITION rule). Each step is articulated by a hairline
        // rule on the leading edge + a hanging mono step number,
        // like a footnote in a typeset book.
        position: 'relative',
        paddingLeft: 38,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 4,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: 'var(--font-mono-track)',
          color: 'var(--accent)',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(step.n).padStart(2, '0')}
      </span>
      {step.title && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(16px, 0.9rem + 0.3vw, 19px)',
            fontWeight: 500,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          {step.title}
        </div>
      )}
      <div
        style={{
          // A.8.1 — sans body for step text (matches options),
          // generous leading for pedagogical readability.
          fontFamily: 'var(--font-ui)',
          fontSize: 'clamp(14px, 0.875rem + 0.2vw, 16px)',
          lineHeight: 1.65,
          color: 'var(--ink-2)',
          letterSpacing: 'var(--font-ui-track)',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Mono>Varför inte de andra</Mono>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {distractors.map((d) => (
          // A.8.1 — drop card chrome (border + radius + bg). Each
          // distractor is a typographic block: letter prefix in
          // mono, two short lines underneath (lockar/men fel).
          <div
            key={d.letter}
            data-testid={`pedagogy-distractor-${d.letter}`}
            style={{
              position: 'relative',
              paddingLeft: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                top: 2,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 'var(--font-mono-track)',
                color: 'var(--muted)',
                fontWeight: 600,
                textTransform: 'lowercase',
              }}
            >
              {d.letter.toLowerCase()}.
            </span>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--ink-2)',
              }}
            >
              <span style={{ color: 'var(--muted)' }}>Lockar för att </span>
              <MathText>{d.why_tempting}</MathText>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--ink)',
              }}
            >
              <span style={{ color: 'var(--muted)' }}>Men fel för att </span>
              <MathText>{d.why_wrong}</MathText>
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
          <Mono style={{ color: 'var(--bad)', flexShrink: 0, marginTop: 2 }}>Fällan här</Mono>
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
