// StudyDesk — Phase A.5 multi-column drill orchestrator (reader/studio).
//
// Phone keeps the single-column DrillQuestion (with inline
// ExplanationPanel below). Reader and Studio promote the question +
// pedagogy to side-by-side columns so the student can see the
// solution walkthrough alongside the question without scrolling.
//
// Layout picks itself based on container width via CSS container
// queries (defined in index.css: --container-md/lg/xl). The component
// declares `containerType: inline-size` on its outer so its CHILDREN
// can use @container queries. Internally we keep the layout in
// inline styles rather than utility classes to mirror the rest of
// the codebase's pattern.
//
// Two layout strategies:
//
//   - No passage (ORD/MEK/XYZ/KVA/NOG):
//       2-column at container width ≥ 960px:
//         question column (left) ~ 60%   pedagogy column (right) ~ 40%
//       single column under 960px (reader-narrow fallback).
//
//   - Has passage (LÄS/ELF/DTK):
//       3-column at container width ≥ 1280px:
//         passage (sticky-scrolls)  question  pedagogy
//       2-column at 960-1279: passage on top spanning full width, then
//         a question | pedagogy row.
//
// The question column delegates to DrillQuestion with
// renderExplanation={false} so we don't render the explanation
// twice. The pedagogy column always renders PedagogyPanel — it shows
// the waiting state pre-answer and the full walkthrough once graded.

import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { PedagogyPanel } from '@/components/drill/PedagogyPanel'
import type { AnswerLetter, Question } from '@/data/questions'

type Props = {
  question: Question
  picked: AnswerLetter | null
  graded: boolean
  onPick: (letter: AnswerLetter) => void
}

export function StudyDesk({ question, picked, graded, onPick }: Props) {
  const hasPassage = !!question.context
  return (
    <div
      data-testid="study-desk"
      data-has-passage={hasPassage}
      style={{
        height: '100%',
        containerType: 'inline-size',
        overflow: 'hidden',
      }}
    >
      {hasPassage ? (
        <PassageLayout question={question} picked={picked} graded={graded} onPick={onPick} />
      ) : (
        <StandardLayout question={question} picked={picked} graded={graded} onPick={onPick} />
      )}
    </div>
  )
}

// ── Standard layout (no passage) ────────────────────────────────────
//
// Two-column at ≥ 960px container. The question column uses
// DrillQuestion with renderExplanation=false; the pedagogy column is
// PedagogyPanel, anchored at the top.

function StandardLayout({ question, picked, graded, onPick }: Props) {
  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        // 2-col at ≥960px container; 1-col below. Pedagogy slightly
        // wider (1.15fr : 1.25fr) — dense content gets more width.
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.25fr)',
        gap: 'clamp(20px, 2vw, 40px)',
        padding: 'clamp(16px, 1.5vw + 12px, 36px) clamp(16px, 2vw, 40px) 100px',
        // A.6V — page-body owns the scroll; the question column
        // sticks to the top of the viewport while the pedagogy
        // column scrolls past it naturally. Standard "sticky
        // sidebar" pattern (Notion/Linear/Stripe Press docs).
        // Dual-scroll columns require bounding the whole layout
        // chain (Frame → MobileFrame → Page → drillBody) which is
        // fragile across viewport changes; sticky just works.
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          minWidth: 0,
          // Sticky pins the question column at the top of the scroll
          // container while the user scrolls into the pedagogy. The
          // top offset accounts for the running-head's hairline.
          position: 'sticky',
          top: 'clamp(8px, 1vh, 24px)',
          alignSelf: 'flex-start',
          // Cap height so an overflowing question (long LÄS prompt)
          // still scrolls inside its column instead of pushing past
          // the viewport edge. Subtracts approximate chrome heights
          // (~64px running-head + ~60px status + padding).
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }}
      >
        <DrillQuestion
          question={question}
          picked={picked}
          graded={graded}
          onPick={onPick}
          renderExplanation={false}
        />
      </div>
      <div style={{ minWidth: 0 }}>
        <PedagogyPanel qid={question.qid} graded={graded} correct={picked === question.answer} />
      </div>
    </div>
  )
}

// ── Passage layout (LÄS/ELF/DTK) ────────────────────────────────────
//
// Three-column at ≥1280px container: passage | question | pedagogy.
// Same sticky-sidebar pattern as StandardLayout, scaled to three
// tracks: the OUTER scrolls (this layout's own scroll context), and
// the passage AND question columns are both `position: sticky` so
// they stay pinned at the top of the viewport while the pedagogy
// column flows naturally and pushes scroll. Both context columns
// stay visible — passage for re-reading, question for re-checking
// the prompt as the student walks through the pedagogy.
//
// Dual-/triple-scroll columns (one scroll context per column) require
// bounding the whole layout chain end-to-end which is fragile across
// viewport changes and breaks the moment any ancestor grows. Sticky
// is the boring, durable choice.

function PassageLayout({ question, picked, graded, onPick }: Props) {
  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        // Three explicit tracks at the wide canvas. Below container
        // ≤1280px the @container query in index.css folds passage
        // on top.
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1fr)',
        gap: 'clamp(20px, 2vw, 40px)',
        padding: 'clamp(16px, 1.5vw + 12px, 36px) clamp(16px, 2vw, 40px) 100px',
        // Outer owns the scroll; both context columns sticky inside.
        overflowY: 'auto',
      }}
    >
      <aside
        data-testid="passage-column"
        style={{
          minWidth: 0,
          // Sticky pins the passage at the top while pedagogy scrolls.
          position: 'sticky',
          top: 'clamp(8px, 1vh, 24px)',
          alignSelf: 'flex-start',
          // Cap the passage's own height so a long LÄS body scrolls
          // inside its column rather than pushing past the viewport.
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
          padding: '16px 18px',
          background: 'var(--panel-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 'calc(var(--radius) * 0.5)',
          fontFamily: 'var(--font-body, var(--font-display))',
          fontSize: 'clamp(14px, 0.8125rem + 0.3vw, 16px)',
          lineHeight: 1.6,
          color: 'var(--ink)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {question.context}
      </aside>
      <div
        style={{
          minWidth: 0,
          // Question column also sticky: student needs to re-check
          // the prompt as they walk through the pedagogy.
          position: 'sticky',
          top: 'clamp(8px, 1vh, 24px)',
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }}
      >
        {/* DrillQuestion still renders the passage internally as a
         *  fallback (it doesn't know we're hiding it). We hide its
         *  passage via a small CSS override targeting the testid. */}
        <style>{`
          [data-testid='drill-context'] { display: none; }
        `}</style>
        <DrillQuestion
          question={question}
          picked={picked}
          graded={graded}
          onPick={onPick}
          renderExplanation={false}
        />
      </div>
      <div style={{ minWidth: 0 }}>
        <PedagogyPanel qid={question.qid} graded={graded} correct={picked === question.answer} />
      </div>
    </div>
  )
}
