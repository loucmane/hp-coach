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
 *  only one.
 *
 *  Phase A.6V Progressive Reveal: steps marked `tier: 'detail'`
 *  render as collapsed-preview cards (title-only, muted chrome,
 *  tap-to-expand) until the user opens them — either individually
 *  by tapping the card, or all at once via the "Jag förstår
 *  fortfarande inte" CTA below the list. Legacy explanations
 *  without `tier` default to 'essential' (always fully visible).
 */
export function StepList({ steps }: { steps: ExplanationStep[] }) {
  // Track which detail steps the user has individually expanded.
  // A.6V update: toggle direction — once you reveal a detail you can
  // also collapse it back. Per-step + nuclear-collapse-all at the
  // bottom. Original "no toggle back" was too rigid; users want to
  // simplify the panel back to scannable after they've absorbed a
  // detail they no longer need spread out.
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(() => new Set())
  const expandDetail = (n: number) =>
    setExpandedDetails((prev) => {
      const next = new Set(prev)
      next.add(n)
      return next
    })
  const collapseDetail = (n: number) =>
    setExpandedDetails((prev) => {
      const next = new Set(prev)
      next.delete(n)
      return next
    })

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

  // Three states for the bottom CTA:
  //   - some collapsed → "show all details" (expand-all)
  //   - none collapsed AND some expanded → "collapse all details"
  //   - no detail steps at all → no CTA
  const allDetailNs = steps.filter((s) => (s.tier ?? 'essential') === 'detail').map((s) => s.n)
  const collapsedDetailCount = allDetailNs.filter((n) => !expandedDetails.has(n)).length
  const expandedDetailCount = allDetailNs.length - collapsedDetailCount

  let cta: React.ReactNode = null
  if (collapsedDetailCount > 0) {
    cta = (
      <RevealAllDetailsCTA
        count={collapsedDetailCount}
        onClick={() => setExpandedDetails(new Set(allDetailNs))}
      />
    )
  } else if (expandedDetailCount > 0) {
    cta = (
      <CollapseAllDetailsCTA
        count={expandedDetailCount}
        onClick={() => setExpandedDetails(new Set())}
      />
    )
  }

  return (
    <div>
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
        {steps.map((step) => {
          const tier = step.tier ?? 'essential'
          if (tier === 'essential') {
            return <StepCard key={step.n} step={step} />
          }
          if (expandedDetails.has(step.n)) {
            // Expanded detail — render the full card with a small
            // "collapse" affordance in the top-right.
            return <StepCard key={step.n} step={step} onCollapse={() => collapseDetail(step.n)} />
          }
          return <StepPreview key={step.n} step={step} onExpand={() => expandDetail(step.n)} />
        })}
      </ol>
      {cta}
    </div>
  )
}

/** Collapsed-preview card for a `tier: 'detail'` step. Shows just the
 *  ordinal + title with a faint expand affordance. Tapping reveals
 *  the full StepCard in place. */
function StepPreview({ step, onExpand }: { step: ExplanationStep; onExpand: () => void }) {
  return (
    <li
      data-testid={`pedagogy-step-preview-${step.n}`}
      data-tier="detail"
      style={{
        position: 'relative',
        paddingLeft: 38,
        listStyle: 'none',
      }}
    >
      <button
        type="button"
        onClick={onExpand}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          width: '100%',
          padding: '6px 0',
          background: 'transparent',
          border: 0,
          borderLeft: 0,
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
          fontFamily: 'inherit',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: 'var(--font-mono-track)',
            color: 'var(--muted)',
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            opacity: 0.6,
          }}
        >
          {String(step.n).padStart(2, '0')}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(14px, 0.85rem + 0.25vw, 16px)',
            fontWeight: 400,
            color: 'var(--muted)',
            letterSpacing: '-0.005em',
            lineHeight: 1.3,
            flex: 1,
            fontStyle: 'italic',
          }}
        >
          {step.title ?? 'Detalj'}
        </span>
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 'var(--font-mono-track)',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            opacity: 0.7,
            flex: '0 0 auto',
          }}
        >
          se mer ↘
        </span>
      </button>
    </li>
  )
}

/** Bottom CTA below the step list: reveals every remaining collapsed
 *  detail at once. Disappears after all details are expanded. Modeled
 *  on the editorial "Show me more" reveal pattern (Khan Academy /
 *  Stripe Press hybrid) — one tap, no toggle back. */
function RevealAllDetailsCTA({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="pedagogy-reveal-all-details"
      style={{
        marginTop: 'clamp(16px, 2.5vw, 24px)',
        width: '100%',
        padding: '12px 16px',
        background: 'transparent',
        border: '1px dashed var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.4)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'flex-start',
        textAlign: 'left',
        color: 'inherit',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(14px, 0.85rem + 0.25vw, 16px)',
          fontWeight: 500,
          color: 'var(--ink)',
        }}
      >
        Jag förstår fortfarande inte
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          color: 'var(--muted)',
          textTransform: 'uppercase',
        }}
      >
        Visa alla {count} detaljerade steg ↘
      </span>
    </button>
  )
}

/** Bottom CTA when all details are currently expanded — collapses them
 *  all back to preview-card state. The mirror of RevealAllDetailsCTA. */
function CollapseAllDetailsCTA({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="pedagogy-collapse-all-details"
      style={{
        marginTop: 'clamp(16px, 2.5vw, 24px)',
        width: '100%',
        padding: '12px 16px',
        background: 'transparent',
        border: '1px dashed var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.4)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'flex-start',
        textAlign: 'left',
        color: 'inherit',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(14px, 0.85rem + 0.25vw, 16px)',
          fontWeight: 500,
          color: 'var(--ink)',
        }}
      >
        Korta ner förklaringen
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          color: 'var(--muted)',
          textTransform: 'uppercase',
        }}
      >
        Dölj alla {count} detaljerade steg ↗
      </span>
    </button>
  )
}

/** Single numbered step card. Exported alongside StepList so callers
 *  (currently just ExplanationPanel on phone) can compose ad-hoc step
 *  layouts without a parallel implementation.
 *
 *  Phase A.6V update: `onCollapse` is optional. When provided
 *  (i.e. the card is an EXPANDED detail step), renders a small
 *  "stäng" affordance in the top-right so the user can re-collapse
 *  this single step back to its preview state. Essential steps
 *  don't get a collapse handle. */
export function StepCard({ step, onCollapse }: { step: ExplanationStep; onCollapse?: () => void }) {
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
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          data-testid={`pedagogy-step-${step.n}-collapse`}
          aria-label="Dölj detta steg"
          style={{
            position: 'absolute',
            right: 0,
            top: 2,
            background: 'transparent',
            border: 0,
            padding: '2px 6px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 'var(--font-mono-track)',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}
        >
          dölj ↗
        </button>
      )}
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
