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
//         question column (sticky)   pedagogy column (flows)
//       single column under 960px (reader-narrow fallback).
//
//   - Has passage (LÄS/ELF/DTK):
//       3-column at container width ≥ 1280px:
//         passage (sticky)   question (sticky)   pedagogy (flows)
//
// Scroll model: the page BODY owns scroll. Sticky columns pin to the
// viewport while the pedagogy column flows past. This is the canonical
// "marginalia + body text" editorial pattern (Stripe Press, Linear
// docs, Notion docs). The key rule: NO `overflow:auto/hidden/scroll`
// on the layout containers — that would create a nested scroll
// container and break sticky positioning (sticky pins relative to
// the nearest overflow-non-visible ancestor; if that ancestor never
// actually scrolls, sticky has nothing to anchor to).
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
        // Container queries scope on this element. No `overflow` set:
        // any value other than `visible` makes this a scroll container
        // for sticky descendants, breaking their viewport pinning.
        // No `height` either: we let the layout grow with content
        // and the page body handle scroll naturally.
        containerType: 'inline-size',
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
        display: 'grid',
        // 2-col at ≥960px container; pedagogy slightly wider
        // (1.15fr : 1.25fr) because the right column carries 12+
        // step cards + distractors + technique + pitfall (dense),
        // while the question column carries 5 option pills (sparse).
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.25fr)',
        gap: 'clamp(20px, 2vw, 40px)',
        // Bottom padding clears the sticky status line (~40px) +
        // breathing room so the last pedagogy step doesn't tuck
        // under the bar.
        // Bottom clearance for status line (~40px sticky) + floating
        // CTA (~50px) + sticky offset (60-84px) + breath. The CTA is
        // a frosted-glass control so mid-scroll pedagogy intentionally
        // blurs through behind it; padding only matters at max-scroll
        // when sticky releases and CTA lands in natural flow.
        padding: 'clamp(16px, 1.5vw + 12px, 36px) clamp(16px, 2vw, 40px) clamp(140px, 16vh, 180px)',
        // NO overflow set. Body owns scroll; sticky descendants
        // anchor to the viewport directly. Setting overflow:auto here
        // would create a (non-scrolling, because nothing constrains
        // height) scroll container and silently break the sticky.
      }}
    >
      <div
        style={{
          minWidth: 0,
          // Sticky against the page body's scroll. The `top` value
          // matches the running-head's bottom edge so the question
          // pins immediately at scroll-start — without this, the
          // question would scroll UP from its natural position
          // (running-head + grid padding ≈ 96px) until it reached
          // the sticky threshold, reading as "the left column moves
          // a little before settling".
          position: 'sticky',
          top: 'clamp(72px, 9vh, 104px)',
          // `align-self: start` keeps the grid cell from stretching
          // the sticky box to the row height — without this, the box
          // would be as tall as the pedagogy column and have nothing
          // to "stick" within.
          alignSelf: 'start',
          // Cap so a tall question (long LÄS prompt) scrolls inside
          // its own column rather than extending past viewport.
          // Budget = running head (72-104) + status line (40) +
          // sticky CTA (80) + breath = ~210-240px.
          maxHeight: 'calc(100dvh - 240px)',
          overflowY: 'auto',
          // Hide the scrollbar in the column itself — the column is
          // a sticky panel, not a scroll surface. If the question
          // overflows, the user can still wheel-scroll inside it;
          // we just don't show track chrome that competes with the
          // page body's scrollbar. (Firefox via inline; Chromium
          // via the .hpc-scrollbar-ghost class on the element.)
          scrollbarWidth: 'none',
        }}
        className="hpc-scrollbar-ghost"
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
// Same body-scroll-with-sticky-columns pattern as StandardLayout,
// scaled to three tracks. Both passage AND question pin to viewport;
// pedagogy column flows past. The passage gets visual chrome (border
// + panel bg) because its content is a re-reading reference, not
// inline prose — the floating-bordered panel reads as a "document
// you're consulting" while pedagogy slides past as the main column.

function PassageLayout({ question, picked, graded, onPick }: Props) {
  // Sticky top matches the running-head's bottom edge so context
  // columns pin immediately at scroll-start (no scroll-up gap).
  // Max-height budgets running head + status line + sticky CTA.
  const stickyTop = 'clamp(72px, 9vh, 104px)'
  const stickyMaxH = 'calc(100dvh - 240px)'
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1fr)',
        gap: 'clamp(20px, 2vw, 40px)',
        // Bottom clearance for status line (~40px sticky) + floating
        // CTA (~50px) + sticky offset (60-84px) + breath. The CTA is
        // a frosted-glass control so mid-scroll pedagogy intentionally
        // blurs through behind it; padding only matters at max-scroll
        // when sticky releases and CTA lands in natural flow.
        padding: 'clamp(16px, 1.5vw + 12px, 36px) clamp(16px, 2vw, 40px) clamp(140px, 16vh, 180px)',
        // NO overflow set — body scroll + sticky descendants.
      }}
    >
      <aside
        data-testid="passage-column"
        style={{
          minWidth: 0,
          position: 'sticky',
          top: stickyTop,
          alignSelf: 'start',
          maxHeight: stickyMaxH,
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
          scrollbarWidth: 'thin',
        }}
      >
        {question.context}
      </aside>
      <div
        className="hpc-scrollbar-ghost"
        style={{
          minWidth: 0,
          position: 'sticky',
          top: stickyTop,
          alignSelf: 'start',
          maxHeight: stickyMaxH,
          overflowY: 'auto',
          scrollbarWidth: 'none',
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
