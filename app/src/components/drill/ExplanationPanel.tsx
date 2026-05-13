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

import { useEffect, useState } from 'react'
import { type FeedbackEntry, getFeedback, submitFeedback } from '@/api/feedback'
import { MathText } from '@/components/MathText'
import { type Explanation, loadExplanation } from '@/data/explanations'

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
          <Body explanation={state.explanation} qid={qid} />
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
  const eyebrow = correct ? 'Bra jobbat — så här tänkte HP-Coach' : 'Så här löses uppgiften'
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

function Body({ explanation, qid }: { explanation: Explanation; qid: string }) {
  return (
    <div style={{ padding: '14px 16px 16px' }}>
      <SolutionPath text={explanation.solution_path} />
      {explanation.distractors.length > 0 && (
        <DistractorList distractors={explanation.distractors} />
      )}
      <TechniqueRow technique={explanation.technique} />
      {explanation.pitfall && <Pitfall text={explanation.pitfall} />}
      <QABar qid={qid} explanation={explanation} />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

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
        Fälla
      </span>
      <span style={{ color: 'var(--ink)' }}>
        <MathText>{text}</MathText>
      </span>
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
