// ExplanationPanel — reveals after a question is graded.
//
// Layer 2 of the pedagogical architecture (PRD § 3, § 5.10). Shows
// the AI-generated breakdown of the question: insight-first solution
// path, per-distractor analysis, technique tag, and (optional)
// pitfall callout. Plus a 👍/👎 QA bar that writes feedback to
// localStorage for the regen pipeline.
//
// Layout decisions:
// - Wrong answer → expanded by default. The student just lost the
//   question; the explanation is the most valuable content on screen.
// - Right answer → collapsed by default with a soft 'Visa förklaring'
//   link. Common ADHD-PI pattern is "I guessed correctly but want to
//   verify my reasoning" — don't bury it, don't shove it.
// - Distractor accordion: lazy-expand. Not every wrong-answer student
//   wants every distractor's analysis; collapsed-by-default keeps
//   the cognitive load down.
// - Technique chip + pitfall callout sit BELOW distractors. They're
//   meta-content; the question-specific work comes first.
//
// All design tokens come from src/index.css (--ink, --panel,
// --hairline, --accent, --bg, etc.) so this component themes
// automatically with the user's palette / mode / density choice.

import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { type FeedbackEntry, getFeedback, submitFeedback } from '@/api/feedback'
import { resolveSteps, StepList } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import { CoachLine } from '@/components/primitives'
import { type Explanation, loadExplanation } from '@/data/explanations'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'

type Props = {
  qid: string
  /** Whether the user got the question right. Drives the
   *  expanded-by-default behaviour. */
  correct: boolean
}

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; explanation: Explanation }
  | { kind: 'missing' }
  | { kind: 'error'; message: string }

export function ExplanationPanel({ qid, correct }: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'idle' })
  // Wrong → start open. Right → start closed; show a link to expand.
  const [expanded, setExpanded] = useState<boolean>(!correct)

  useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    setExpanded(!correct)
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
  }, [qid, correct])

  // No explanation backfilled for this question yet — render nothing
  // rather than an empty card. Drill stays usable.
  if (state.kind === 'missing') return null

  // Transport error (5xx etc.) — also render nothing, keep drill usable.
  // We log to console for the dev to see; not user-facing.
  if (state.kind === 'error') {
    console.warn(`[ExplanationPanel] failed to load ${qid}:`, state.message)
    return null
  }

  return (
    <div
      data-testid="explanation-panel"
      data-state={state.kind}
      data-correct={correct}
      style={{
        margin: '6px var(--pad-lg) 16px',
        padding: 0,
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.6)',
        overflow: 'hidden',
      }}
    >
      <Header correct={correct} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
      {expanded &&
        (state.kind === 'ready' ? (
          <Body explanation={state.explanation} qid={qid} correct={correct} />
        ) : (
          // idle (initial mount, useEffect hasn't fired yet) and loading
          // both render the skeleton; missing/error returned null earlier.
          <LoadingSkeleton />
        ))}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────

function Header({
  correct,
  expanded,
  onToggle,
}: {
  correct: boolean
  expanded: boolean
  onToggle: () => void
}) {
  // Subtle eyebrow — colour-coded by correctness so the user gets a
  // calm cue about what the panel is about to say. Green-ish on a
  // right answer ("verify your reasoning"), warm on a wrong answer
  // ("here's what to learn").
  // Eyebrow stays editorial chrome ("category label"); the warm coach
  // voice — VOICE[coach].feedbackRight/Wrong — renders in the Body
  // panel below where there's room for the line + byline.
  const eyebrow = correct ? 'Post-mortem' : 'Så här löses uppgiften'
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid="explanation-toggle"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'transparent',
        border: 0,
        borderBottom: expanded ? '1px solid var(--hairline)' : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 'var(--font-mono-track)',
        textTransform: 'uppercase',
        color: correct ? 'var(--ok)' : 'var(--ink-2)',
      }}
    >
      <span>{eyebrow}</span>
      <span style={{ color: 'var(--muted)' }}>{expanded ? '–' : '+'}</span>
    </button>
  )
}

// ── Body ──────────────────────────────────────────────────────────

function Body({
  explanation,
  qid,
  correct,
}: {
  explanation: Explanation
  qid: string
  correct: boolean
}) {
  const coach = useCoachStore((s) => s.coach)
  // Same coach-voice deployment as desktop PedagogyPanel: VOICE[coach]
  // .feedbackRight/Wrong renders as a coach-attributed beat directly
  // under the toggle header, before the strategi block. Mobile gets
  // the same personality as desktop now.
  const voiceLine = correct ? VOICE[coach].feedbackRight : VOICE[coach].feedbackWrong
  // A.6V.5 — Phone bifurcation: when the explanation carries structured
  // `steps[]` (Phase A.6 corpus), render the same numbered-card
  // composition as desktop's PedagogyPanel. When it doesn't (legacy
  // pre-A.6 entries), fall back to the prose `solution_path` blob.
  //
  // This matches what `PostGradeBody` does on desktop: when steps exist,
  // the prose summary is gone in favor of the cards. Rendering BOTH
  // would double-show the same content (resolveSteps falls back to
  // splitting solution_path when steps[] is empty).
  const hasSteps = (explanation.steps?.length ?? 0) > 0
  return (
    <div style={{ padding: '14px 16px 16px' }}>
      <CoachLine coach={coach} as="small" style={{ marginBottom: 14 }}>
        {voiceLine}
      </CoachLine>
      {explanation.pregrade_tactic && (
        <Strategi
          handle={explanation.pregrade_tactic.handle}
          move={explanation.pregrade_tactic.move}
        />
      )}
      {hasSteps ? (
        <div style={{ marginBottom: 16 }}>
          <StepList steps={resolveSteps(explanation)} />
        </div>
      ) : (
        <SolutionPath text={explanation.solution_path} />
      )}
      {explanation.distractors.length > 0 && (
        <DistractorList distractors={explanation.distractors} />
      )}
      <TechniqueRow technique={explanation.technique} />
      {explanation.pitfall && <Pitfall text={explanation.pitfall} />}
      {explanation.framework_id && <FrameworkLink frameworkId={explanation.framework_id} />}
      <QABar qid={qid} explanation={explanation} />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

// Surfaces the pre-grade named strategy on the post-grade view so the
// handle ("Linjärekvationsreceptet") and move ("Subtrahera den mindre
// x-termen…") get a second reading after grading — the moment the
// student is most likely to internalize the handle.
function Strategi({ handle, move }: { handle: string; move: string }) {
  return (
    <div
      data-testid="explanation-strategi"
      style={{
        marginBottom: 14,
        paddingBottom: 14,
        borderBottom: '1px solid var(--hairline-2)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 8,
        }}
      >
        Strategi
      </div>
      <h3
        style={{
          margin: '0 0 6px',
          fontFamily: 'var(--font-display)',
          fontSize: 18,
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
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        <MathText>{move}</MathText>
      </p>
    </div>
  )
}

function SolutionPath({ text }: { text: string }) {
  return (
    <div
      data-testid="explanation-solution-path"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        lineHeight: 1.5,
        color: 'var(--ink)',
        marginBottom: 14,
      }}
    >
      <MathText>{text}</MathText>
    </div>
  )
}

function DistractorList({ distractors }: { distractors: Explanation['distractors'] }) {
  return (
    <div
      data-testid="explanation-distractors"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginBottom: 14,
      }}
    >
      {distractors.map((d) => (
        <DistractorRow key={d.letter} distractor={d} />
      ))}
    </div>
  )
}

function DistractorRow({ distractor }: { distractor: Explanation['distractors'][number] }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        border: '1px solid var(--hairline-2)',
        borderRadius: 'calc(var(--radius) * 0.4)',
        background: 'var(--panel-2)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid={`distractor-toggle-${distractor.letter}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--ink)',
          fontSize: 13,
          fontFamily: 'inherit',
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
          }}
        >
          {distractor.letter}
        </span>
        <span style={{ flex: 1, color: 'var(--ink-2)' }}>
          <MathText>{distractor.why_tempting}</MathText>
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{open ? '–' : '+'}</span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 12px 10px 44px',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--ink)',
          }}
        >
          <MathText>{distractor.why_wrong}</MathText>
        </div>
      )}
    </div>
  )
}

function TechniqueRow({ technique }: { technique: string }) {
  return (
    <div
      data-testid="explanation-technique"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: '10px 12px',
        marginBottom: 8,
        background: 'var(--accent-soft)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.4)',
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        Teknik
      </span>
      <span style={{ color: 'var(--ink)' }}>
        <MathText>{technique}</MathText>
      </span>
    </div>
  )
}

function Pitfall({ text }: { text: string }) {
  return (
    <div
      data-testid="explanation-pitfall"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: '10px 12px',
        marginBottom: 8,
        background: 'var(--bad-soft)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.4)',
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--bad)',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        Fällan här
      </span>
      <span style={{ color: 'var(--ink)' }}>
        <MathText>{text}</MathText>
      </span>
    </div>
  )
}

// Parse the leading section code from a framework_id like
// "KVA-TRAP-001" → "KVA". Returns null if the prefix doesn't match a
// known section so the link silently disappears on malformed ids.
function sectionFromFrameworkId(id: string): Section | null {
  const prefix = id.split('-', 1)[0]
  if ((SECTION_KEYS as readonly string[]).includes(prefix)) return prefix as Section
  return null
}

// Closes the Layer-1 ↔ Layer-2 loop: after a missed question, surface
// the lektion entry this question is an example of. Deep-links to
// /lektion?section=SEC#FRAMEWORK_ID; the lektion route opens that
// entry and scrolls it into view.
function FrameworkLink({ frameworkId }: { frameworkId: string }) {
  const section = sectionFromFrameworkId(frameworkId)
  if (!section) return null
  return (
    <div
      data-testid="explanation-framework-link"
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: '1px solid var(--hairline-2)',
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        Mönster
      </span>
      <Link
        to="/lektion"
        search={{ section }}
        hash={frameworkId}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: 'var(--font-mono-track)',
          color: 'var(--ink)',
          textDecoration: 'none',
          borderBottom: '1px solid var(--ink-2)',
          paddingBottom: 1,
        }}
      >
        {frameworkId} →
      </Link>
    </div>
  )
}

function QABar({ qid, explanation }: { qid: string; explanation: Explanation }) {
  const [feedback, setFeedback] = useState<FeedbackEntry | null>(() => getFeedback(qid))
  // Refresh stored feedback when qid changes (panel reused across
  // questions in a session). Without this, navigating to a question
  // that has prior feedback would render the QA bar in default state.
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
      data-testid="explanation-qa"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 10,
        borderTop: '1px solid var(--hairline-2)',
      }}
    >
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {feedback ? 'Tack för din feedback' : 'Hjälpte förklaringen?'}
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

// ── Loading state ─────────────────────────────────────────────────

function LoadingSkeleton() {
  // A tiny shimmer is overkill for v1. Plain copy works — the panel
  // shouldn't show 'loading' often anyway: in v1 explanations are
  // static-fetched and Vite/CDN serves them in <50 ms.
  return (
    <div
      style={{
        padding: '20px 16px',
        textAlign: 'center',
        color: 'var(--muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 'var(--font-mono-track)',
      }}
    >
      Tänker igenom uppgiften…
    </div>
  )
}
