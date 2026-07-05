// M1 pre-answer apparatus — the M3 eyebrow, tactic aside, and keys hint.
//
// The eyebrow (LONG_LABEL · FRÅGA n AV total) only renders when the caller
// threads position/total from the session plan; legacy mounts without a
// session must not render a broken "FRÅGA undefined AV undefined" line.

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import { DrillQuestion } from './DrillQuestion'

// Explanation fetch is out of scope (test fetch shim only serves /data/).
vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
}))

const ORD_QUESTION: Question = {
  qid: 'var-2019-verb1-ORD-003',
  exam_id: 'var-2019',
  provpass: 'verb1',
  section: 'ORD',
  number: 3,
  prompt: 'begrunda',
  options: [
    { letter: 'A', text: 'fundera över' },
    { letter: 'B', text: 'motivera' },
    { letter: 'C', text: 'anklaga' },
    { letter: 'D', text: 'skryta' },
    { letter: 'E', text: 'undvika' },
  ],
  answer: 'A',
  context: null,
  parsing_status: 'complete',
}

describe('DrillQuestion pre-answer apparatus', () => {
  it('renders the eyebrow when position/total are threaded in', () => {
    render(
      <DrillQuestion
        question={ORD_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
        position={3}
        total={10}
      />,
    )
    expect(screen.getByTestId('drill-eyebrow')).toHaveTextContent('ORDFÖRSTÅELSE · FRÅGA 3 AV 10')
  })

  it('omits the eyebrow when position/total are missing', () => {
    render(<DrillQuestion question={ORD_QUESTION} picked={null} graded={false} onPick={() => {}} />)
    expect(screen.queryByTestId('drill-eyebrow')).not.toBeInTheDocument()
  })

  it('keeps drill-prompt textContent to just the headword (eyebrow is a sibling)', () => {
    render(
      <DrillQuestion
        question={ORD_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
        position={3}
        total={10}
      />,
    )
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent(/^begrunda$/)
  })

  it('shows the tactic aside pre-grade and hides it once graded', async () => {
    const { rerender } = render(
      <DrillQuestion question={ORD_QUESTION} picked={null} graded={false} onPick={() => {}} />,
    )
    // Corpus explanation is mocked away → hash-rotation fallback tactic.
    expect(await screen.findByText(/^Taktik · /)).toBeInTheDocument()
    rerender(<DrillQuestion question={ORD_QUESTION} picked={'B'} graded={true} onPick={() => {}} />)
    expect(screen.queryByText(/^Taktik · /)).not.toBeInTheDocument()
  })

  it("labels the ORD options rail 'Välj synonym' (M4; other sections keep 'Välj svar')", () => {
    render(<DrillQuestion question={ORD_QUESTION} picked={null} graded={false} onPick={() => {}} />)
    expect(screen.getByText('Välj synonym')).toBeInTheDocument()
    expect(screen.queryByText('Välj svar')).not.toBeInTheDocument()
  })

  it('shows the dynamic keys hint pre-grade and hides it once graded', () => {
    const { rerender } = render(
      <DrillQuestion question={ORD_QUESTION} picked={null} graded={false} onPick={() => {}} />,
    )
    expect(screen.getByText('Tangenter a–e väljer · klick fungerar också')).toBeInTheDocument()
    rerender(<DrillQuestion question={ORD_QUESTION} picked={'B'} graded={true} onPick={() => {}} />)
    expect(
      screen.queryByText('Tangenter a–e väljer · klick fungerar också'),
    ).not.toBeInTheDocument()
  })
})

// ── ELF cloze gaps ──────────────────────────────────────────────────
//
// The real exam draws each gap as a blank line with the question
// number in it; the PDF text layer only kept the bare number, which
// camouflages among the passage's real numbers. The renderer restores
// the affordance: gap numbers become marked blanks (the CURRENT
// question's gap emphasized) and the empty cloze prompt becomes the
// 'Lucka N' headword.

const ELF_CLOZE: Question = {
  qid: 'host-ver2-2019-verb2-ELF-034',
  exam_id: 'host-ver2-2019',
  provpass: 'verb2',
  section: 'ELF',
  number: 34,
  prompt: '',
  options: [
    { letter: 'A', text: 'attention' },
    { letter: 'B', text: 'dependence' },
    { letter: 'C', text: 'relation' },
    { letter: 'D', text: 'income' },
  ],
  answer: 'D',
  context:
    'In the following text there are gaps which indicate that something has been left out.\n\n' +
    'Marrying Women\n\n' +
    'Fully 78% of American women, combined with these 33 preferences, ' +
    'were vying for their 34 . For every hundred aged 25–34, there were 139 in 1960.',
  parsing_status: 'complete',
}

describe('DrillQuestion — ELF cloze gaps', () => {
  it('renders gap numbers as marked blanks, the current one emphasized', () => {
    render(<DrillQuestion question={ELF_CLOZE} picked={null} graded={false} onPick={() => {}} />)
    const gaps = screen.getAllByTestId(/^cloze-gap-/)
    expect(gaps.map((g) => g.getAttribute('data-testid'))).toEqual(['cloze-gap-33', 'cloze-gap-34'])
    expect(screen.getByTestId('cloze-gap-34')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('cloze-gap-33')).toHaveAttribute('data-active', 'false')
  })

  it('does NOT mark content numbers (percent, ranges, years, out-of-band)', () => {
    render(<DrillQuestion question={ELF_CLOZE} picked={null} graded={false} onPick={() => {}} />)
    const text = screen.getByTestId('drill-context').textContent ?? ''
    // 78%, 25–34, 139, 1960 all survive as plain text
    expect(text).toContain('78%')
    expect(text).toContain('25–34')
    expect(text).toContain('139')
    expect(text).toContain('1960')
  })

  it("gives the empty cloze prompt the 'Lucka N' headword", () => {
    render(<DrillQuestion question={ELF_CLOZE} picked={null} graded={false} onPick={() => {}} />)
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('Lucka 34')
  })

  // Regression: 5 cloze passages (e.g. host-2020-verb2-ELF-032) don't
  // carry the "gaps which indicate" instruction line, so the old probe
  // left their gaps as bare numbers. Detection now keys on the reliable
  // signal — an ELF item with no stem prompt is a cloze — so these
  // render their gaps too.
  const ELF_CLOZE_NO_INSTRUCTION: Question = {
    ...ELF_CLOZE,
    qid: 'host-2020-verb2-ELF-032',
    number: 32,
    answer: 'C',
    context:
      'Two Drinks a Day?\n\n' +
      'However, any more than that 31 the risk of the most deadly strokes. ' +
      'The study adds to the 32 around the health benefits of light drinking, ' +
      'resulting from a blockage in the blood 33 to the brain.',
  }

  it('renders gaps for a cloze WITHOUT the instruction line', () => {
    render(
      <DrillQuestion
        question={ELF_CLOZE_NO_INSTRUCTION}
        picked={null}
        graded={false}
        onPick={() => {}}
      />,
    )
    const gaps = screen.getAllByTestId(/^cloze-gap-/)
    expect(gaps.map((g) => g.getAttribute('data-testid'))).toEqual([
      'cloze-gap-31',
      'cloze-gap-32',
      'cloze-gap-33',
    ])
    expect(screen.getByTestId('cloze-gap-32')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('drill-prompt')).toHaveTextContent('Lucka 32')
  })
})
