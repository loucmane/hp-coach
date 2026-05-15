// PreGradeFill — fills the right column of StyleA before the student
// grades. Two layers:
//
//   Top:    Named-tactic coaching note. Mono eyebrow with the
//           strategy handle ("Extremvärdestestet"), then the move
//           below in body display. Hash-rotated per qid so the
//           student sees varied tactics across a drill.
//
//   Bottom: Apparatus footer. Mono, 2 lines. Edition · provpass +
//           position counter. Editorial register grounding the page
//           in the EDITION identity without competing with the
//           coaching note for attention.
//
// The column flexes vertically so the coaching note hugs the top
// and the apparatus pins to the bottom — uses the full canvas
// height without filling it with content.

import type { Explanation } from '@/data/explanations'
import type { Question } from '@/data/questions'

import { pickTactic } from './pregrade-tactics'

type Props = {
  question: Question
  /** Loaded explanation, if available. When the entry carries a
   *  per-question `pregrade_tactic` (authored offline against the
   *  Variant-C corpus), we surface that. Otherwise fall back to the
   *  section-default hash-rotation catalog so non-Variant-C entries
   *  still get something coherent. */
  explanation?: Explanation | null
  /** 1-indexed position in the current session plan. */
  position?: number
  /** Total questions in the current plan. */
  total?: number
}

export function PreGradeFill({ question, explanation, position, total }: Props) {
  const tactic = explanation?.pregrade_tactic ?? pickTactic(question.qid, question.section)
  return (
    <div
      style={{
        // Parent <section> in StyleA owns paddingTop so pre-grade and
        // post-grade align. We just provide the vertical flex so the
        // apparatus footer sinks to the bottom of the column.
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingBottom: 'clamp(12px, 2vh, 24px)',
        minHeight: '48vh',
      }}
    >
      <TacticBlock handle={tactic.handle} move={tactic.move} />
      <ApparatusFooter qid={question.qid} position={position} total={total} />
    </div>
  )
}

function TacticBlock({ handle, move }: { handle: string; move: string }) {
  return (
    <div style={{ maxWidth: '52ch' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 12,
        }}
      >
        Strategi — innan du svarar
      </div>
      <h3
        style={{
          margin: '0 0 10px',
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
          fontSize: 17,
          lineHeight: 1.6,
          color: 'var(--ink-2)',
        }}
      >
        {move}
      </p>
    </div>
  )
}

// Mono apparatus footer. Parses the qid into its edition / provpass
// segments so the footer never needs explicit props beyond the qid
// itself. Position counter is optional — without it we degrade to
// just the edition coordinate.
function ApparatusFooter({
  qid,
  position,
  total,
}: {
  qid: string
  position?: number
  total?: number
}) {
  // qid: <exam>-<provpass>-<section>-<number>
  // exam can contain dashes (e.g. 'var-2018-1'), so we slice from the
  // back: last two parts are section + number, third-from-back is
  // provpass, everything before is the exam.
  const parts = qid.split('-')
  const provpass = parts[parts.length - 3]
  const exam = parts.slice(0, -3).join('-')

  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        paddingTop: 32,
        borderTop: '1px solid var(--hairline)',
        maxWidth: '52ch',
      }}
    >
      <div>
        {exam} · {provpass}
      </div>
      {position !== undefined && total !== undefined && (
        <div>
          {position} / {total}
        </div>
      )}
    </div>
  )
}
