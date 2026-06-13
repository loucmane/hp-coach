// StudyDesk — Boksidan desktop drill orchestrator (reader / studio).
//
// One responsive 2-column shell, gated on the StudyDesk container width by
// the `.hpc-studydesk` CSS (index.css, task 84):
//
//   - < 1200px container → single column: the question rail chassis, then
//     the pedagogy stacked beneath it. (The 2-col would crush both at
//     reader-narrow widths.)
//   - ≥ 1200px container → split: the question + rail pin sticky on the
//     left while the graded pedagogy scrolls past on the right — the
//     canonical "marginalia + body text" editorial pattern.
//
// The question column delegates to DrillQuestion (the rail chassis) with
// `renderExplanation={false}` so the pedagogy isn't double-rendered, and
// `fill={false}` so it flows at natural height instead of nesting a scroll
// that would clip the options. The pedagogy column renders PedagogyPanel
// `flush` (no built-in marginalia rule) — the rule lives on the wrapper and
// only appears in 2-col mode, so single-column reads clean and full-width.
//
// Scroll model: the page BODY owns scroll. No `overflow` on these
// containers — that would make them scroll containers and break the sticky
// pinning (sticky anchors to the nearest scrollable ancestor).

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
        // Container queries scope on this element; the `.hpc-studydesk` seam
        // reads against its width. No `overflow`/`height` — the page body
        // owns scroll so the sticky question pins to the viewport.
        containerType: 'inline-size',
      }}
    >
      <div className="hpc-studydesk">
        <div className="hpc-studydesk-q">
          <DrillQuestion
            question={question}
            picked={picked}
            graded={graded}
            onPick={onPick}
            renderExplanation={false}
            fill={false}
          />
        </div>
        <div className="hpc-studydesk-ped">
          <PedagogyPanel
            qid={question.qid}
            graded={graded}
            correct={picked === question.answer}
            flush
          />
        </div>
      </div>
    </div>
  )
}
