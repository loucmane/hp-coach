// StudyDesk is the desktop drill column. It delegates all rendering to
// DrillQuestion — including the DTK "samma sida" block cue — so its one
// real responsibility is to forward every prop DrillQuestion needs.
//
// Regression: blockPosition was NOT in StudyDesk's Props, so on desktop
// the DTK block cue (which DrillQuestion already renders) never showed —
// the grouping worked but the "Fråga N av M · samma sida" orientation
// text was phone-only. This pins the forwarding.

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import { StudyDesk } from './StudyDesk'

// Explanation fetch is out of scope (test fetch shim only serves /data/).
vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
}))

const DTK_QUESTION: Question = {
  qid: 'host-2014-kvant2-DTK-018',
  exam_id: 'host-2014',
  provpass: 'kvant2',
  section: 'DTK',
  number: 18,
  prompt: 'Hur stor var ökningen mellan 2010 och 2011?',
  options: [
    { letter: 'A', text: '12 %' },
    { letter: 'B', text: '18 %' },
    { letter: 'C', text: '24 %' },
    { letter: 'D', text: '30 %' },
  ],
  answer: 'B',
  context: null,
  figure: { src: 'figures/dtk/host-2014-kvant2-p18.jpg', aspect_ratio: 0.7, kind: 'raster' },
  parsing_status: 'complete',
}

describe('StudyDesk — DTK block cue forwarding', () => {
  it('forwards blockPosition so the desktop figure shows the "samma sida" cue', () => {
    render(
      <StudyDesk
        question={DTK_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
        position={2}
        total={11}
        blockPosition={{ n: 2, m: 3 }}
      />,
    )
    expect(screen.getByTestId('dtk-block-cue')).toHaveTextContent('Fråga 2 av 3 · samma sida')
  })

  it('omits the cue for a singleton page (blockPosition null)', () => {
    render(
      <StudyDesk
        question={DTK_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
        blockPosition={null}
      />,
    )
    expect(screen.queryByTestId('dtk-block-cue')).not.toBeInTheDocument()
  })
})
