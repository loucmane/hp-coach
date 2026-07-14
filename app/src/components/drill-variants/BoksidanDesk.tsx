// BoksidanDesk — the desktop (reader / studio) drill in the Boksidan
// chassis. Task 81.
//
// A thin shell: the editorial running head (HP · COACH · SECTION +
// NavLinks + the live EditionStrip picker) over a two-column StudyDesk
// — the rail-chassis question column on the left, the pedagogy column
// flowing past on the right — plus a sticky "Nästa fråga" control that
// appears once the question is graded.
//
// All question + pedagogy rendering is delegated to the shared
// DrillQuestion (rail chassis) and PedagogyPanel via StudyDesk, so the
// desktop and phone surfaces stay in lockstep. The keyboard model
// (a–e to pick, Enter to advance, Esc to parent) lives in SessionPlayer
// and drives onPick / onReset here unchanged.

import type { ReactNode } from 'react'

import { QuestionPan } from '@/components/motion/QuestionPan'
import { RailShell } from '@/components/NavRail'
import { StudyDesk } from '@/components/StudyDesk'
import type { VariantData } from './DrillVariantShell'

export function BoksidanDesk({
  question,
  picked,
  graded,
  onPick,
  onReset,
  position,
  total,
  blockPosition,
  dueStation,
}: VariantData & {
  /** The due-numeral header station (DueHeaderStation), mounted INSIDE
   *  the centered reading canvas so its sticky strip shares the exact
   *  880px column frame as StudyDesk — column-aligned, not viewport-
   *  glued. Rendered before the QuestionPan so it never rides the
   *  question sheet's exit/enter pan. */
  dueStation?: ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* B+: the shared NavRail, mounted COLLAPSED — the drill keeps
       *  the focus-mode-bare decision; ⌘B / » peeks the compass back. */}
      <RailShell defaultCollapsed>
        {/* Centered editorial canvas. StudyDesk owns the 880px frame +
         *  its own padding; we just center it like a printed page. */}
        <main style={{ flex: 1, width: '100%', maxWidth: 1320, margin: '0 auto' }}>
          {dueStation}
          {/* A2 ribbon camera: between questions the graded sheet exits
           *  upward while the next arrives from below — see QuestionPan. */}
          <QuestionPan id={question.qid}>
            <StudyDesk
              question={question}
              picked={picked}
              graded={graded}
              onPick={onPick}
              position={position}
              total={total}
              blockPosition={blockPosition}
            />
          </QuestionPan>
        </main>

        {/* Sticky "Nästa fråga" — appears once graded. A frosted-glass
         *  control right-aligned at the bottom; the bare wrapper ignores
         *  pointer events so wheel + clicks pass through to the pedagogy
         *  scrolling behind it, the button opts back in. */}
        {graded && (
          <div
            style={{
              position: 'sticky',
              bottom: 'clamp(24px, 4vh, 48px)',
              zIndex: 5,
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0 clamp(48px, 6vw, 96px)',
              pointerEvents: 'none',
            }}
          >
            <button
              type="button"
              data-testid="drill-next"
              onClick={onReset}
              className="hpc-btn"
              style={{
                all: 'unset',
                pointerEvents: 'auto',
                cursor: 'pointer',
                minWidth: 168,
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '14px 24px',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--bg)',
                background: 'color-mix(in oklch, var(--ink) 92%, transparent)',
                backdropFilter: 'saturate(150%) blur(16px)',
                WebkitBackdropFilter: 'saturate(150%) blur(16px)',
                boxShadow: '0 18px 40px -16px rgba(0, 0, 0, 0.28)',
              }}
            >
              Nästa fråga
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>↵</span>
            </button>
          </div>
        )}
      </RailShell>
    </div>
  )
}
