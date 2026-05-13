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
        // 2-col at ≥960px container; 1-col below. The grid-template
        // uses minmax + auto-fit semantics via a manual breakpoint —
        // we'd love a pure @container query but inline styles don't
        // support those. The fallback under 960px just stacks.
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 'clamp(20px, 2vw, 40px)',
        padding: 'clamp(16px, 1.5vw + 12px, 36px) clamp(16px, 2vw, 40px) 100px',
        overflowY: 'auto',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <DrillQuestion
          question={question}
          picked={picked}
          graded={graded}
          onPick={onPick}
          renderExplanation={false}
        />
      </div>
      <div style={{ minWidth: 0, position: 'sticky', top: 'clamp(8px, 1vh, 24px)' }}>
        <PedagogyPanel qid={question.qid} graded={graded} correct={picked === question.answer} />
      </div>
    </div>
  )
}

// ── Passage layout (LÄS/ELF/DTK) ────────────────────────────────────
//
// Three-column at ≥1280px container: passage (sticky) | question |
// pedagogy. Below 1280px we stack passage on top of a 2-column
// question+pedagogy row. The passage's scroll-stickiness keeps it
// visible while the student scrolls through the options.

function PassageLayout({ question, picked, graded, onPick }: Props) {
  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        // Three explicit tracks. At ≤1280px container the layout
        // collapses via auto-fit semantics: we use a CSS class +
        // @container query in index.css for that fold; the
        // grid-template here is the wide-canvas case.
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1fr)',
        gap: 'clamp(20px, 2vw, 40px)',
        padding: 'clamp(16px, 1.5vw + 12px, 36px) clamp(16px, 2vw, 40px) 100px',
        overflowY: 'auto',
      }}
    >
      <aside
        data-testid="passage-column"
        style={{
          minWidth: 0,
          position: 'sticky',
          top: 'clamp(8px, 1vh, 24px)',
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 120px)',
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
      <div style={{ minWidth: 0 }}>
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
      <div style={{ minWidth: 0, position: 'sticky', top: 'clamp(8px, 1vh, 24px)' }}>
        <PedagogyPanel qid={question.qid} graded={graded} correct={picked === question.answer} />
      </div>
    </div>
  )
}
