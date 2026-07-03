// StudyDesk — the desktop drill page, M3 "Boksidan" single column.
//
// M2 of the M3 faithful rebuild demolished the old 2-column seam
// (sticky question left, pedagogy right): the owner's MD layout call
// is ONE reading column — question, options, then the graded pedagogy
// flowing beneath, exactly like the phone but on a wider page. The
// flip was gated on M2's distractor reprint (post-grade the options
// scroll away; the M3 distractor rows re-print the struck option text
// so the pedagogy is self-contained).
//
// This shell now only provides the printed-page frame: the M3 880px
// column (M3.tsx `.m3-frame`), centered, with bottom clearance for the
// floating "Nästa fråga" control. DrillQuestion renders everything —
// including PedagogyPanel — via its own rail chassis.
//
// Scroll model: the page BODY owns scroll. No `overflow` here.

import { DrillQuestion } from '@/components/drill/DrillQuestion'
import type { AnswerLetter, Question } from '@/data/questions'

type Props = {
  question: Question
  picked: AnswerLetter | null
  graded: boolean
  onPick: (letter: AnswerLetter) => void
  /** M1 — 1-indexed plan position for the M3 eyebrow; both present or
   *  both absent (the eyebrow is omitted without them). */
  position?: number
  total?: number
}

export function StudyDesk({ question, picked, graded, onPick, position, total }: Props) {
  return (
    <div data-testid="study-desk" style={{ containerType: 'inline-size' }}>
      <div className="hpc-studydesk">
        <DrillQuestion
          question={question}
          picked={picked}
          graded={graded}
          onPick={onPick}
          fill={false}
          position={position}
          total={total}
        />
      </div>
    </div>
  )
}
