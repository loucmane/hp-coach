// M1 pre-answer apparatus — the M3 eyebrow, tactic aside, and keys hint.
//
// The eyebrow (LONG_LABEL · FRÅGA n AV total) only renders when the caller
// threads position/total from the session plan; legacy mounts without a
// session must not render a broken "FRÅGA undefined AV undefined" line.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Question } from '@/data/questions'
import { formatViolations, runAxe } from '@/test/a11y'
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

  it('keeps the picked word rendered IN the option list after grading (also flies to utfall)', () => {
    // Owner regression: on a wrong answer the picked word used to vanish
    // from the "välj synonym" list (its layoutId instance flew to the
    // verdict, leaving a hidden spacer). It must now stay legible in the
    // row — a plain graded copy — while the verdict copy exists too.
    render(<DrillQuestion question={ORD_QUESTION} picked="B" graded onPick={() => {}} />)
    const pickedRow = screen.getByTestId('option-B')
    expect(pickedRow).toHaveAttribute('data-state', 'incorrect')
    // The word text is present and visible inside the row (not a
    // visibility:hidden spacer).
    const wordCell = pickedRow.querySelector('.hpc-m3-opt-t')
    expect(wordCell).not.toBeNull()
    expect(wordCell).toHaveTextContent('motivera')
    expect(wordCell?.querySelector('[style*="visibility: hidden"]')).toBeNull()
  })

  it('all five options remain legible post-grade', () => {
    render(<DrillQuestion question={ORD_QUESTION} picked="B" graded onPick={() => {}} />)
    const expected: Record<string, string> = {
      A: 'fundera över',
      B: 'motivera',
      C: 'anklaga',
      D: 'skryta',
      E: 'undvika',
    }
    for (const [letter, word] of Object.entries(expected)) {
      expect(screen.getByTestId(`option-${letter}`)).toHaveTextContent(word)
    }
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

  // WCAG 2.2 AA regression net (2026-07 a11y pass). jsdom can't compute
  // real layout/paint, so color-contrast is disabled here — that's
  // covered by the Playwright + @axe-core/playwright live audit instead
  // (see a11y-audit-{before,after}.json at the repo root). This catches
  // the DOM-shape classes of violation: missing accessible names,
  // landmark/label wiring, aria attribute misuse.
  it('has no axe violations pre-answer', async () => {
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
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
  })

  it('has no axe violations graded (options revealed correct/incorrect)', async () => {
    render(<DrillQuestion question={ORD_QUESTION} picked={'B'} graded={true} onPick={() => {}} />)
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
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

// ── Image answer options (task #176) ────────────────────────────────
//
// The 11 DTK questions whose four choices are printed as pie-chart
// images, not text. `option.figure` carries the crop; `option.text`
// stays a short accessible label ("Cirkeldiagram A") so every existing
// consumer that reads opt.text (copy fallback, PedagogyPanel's "rätt
// svar var X: {text}" line) keeps working without a special case.

const DTK_IMAGE_QUESTION: Question = {
  qid: 'var-2016-kvant2-DTK-030',
  exam_id: 'var-2016',
  provpass: 'kvant2',
  section: 'DTK',
  number: 30,
  prompt: 'Vilket cirkeldiagram visar fördelningen korrekt?',
  options: [
    {
      letter: 'A',
      text: 'Cirkeldiagram A',
      figure: { src: 'figures/options/var-2016-kvant2-DTK-030-A.png', aspect_ratio: 1 },
    },
    {
      letter: 'B',
      text: 'Cirkeldiagram B',
      figure: { src: 'figures/options/var-2016-kvant2-DTK-030-B.png', aspect_ratio: 1 },
    },
    {
      letter: 'C',
      text: 'Cirkeldiagram C',
      figure: { src: 'figures/options/var-2016-kvant2-DTK-030-C.png', aspect_ratio: 1 },
    },
    {
      letter: 'D',
      text: 'Cirkeldiagram D',
      figure: { src: 'figures/options/var-2016-kvant2-DTK-030-D.png', aspect_ratio: 1 },
    },
  ],
  answer: 'A',
  context: null,
  parsing_status: 'complete',
}

describe('DrillQuestion — image answer options', () => {
  it('renders an <img> inside each option row that carries a figure', () => {
    render(
      <DrillQuestion
        question={DTK_IMAGE_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
      />,
    )
    for (const letter of ['A', 'B', 'C', 'D']) {
      const row = screen.getByTestId(`option-${letter}`)
      const img = row.querySelector('img')
      expect(img).not.toBeNull()
      expect(img).toHaveAttribute('src', `/figures/options/var-2016-kvant2-DTK-030-${letter}.png`)
    }
  })

  it('still renders the accessible text label alongside the image', () => {
    render(
      <DrillQuestion
        question={DTK_IMAGE_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
      />,
    )
    expect(screen.getByTestId('option-A')).toHaveTextContent('Cirkeldiagram A')
  })

  it('does not reveal correctness pre-grade — no verdict text, no correct/incorrect data-state', async () => {
    const user = userEvent.setup()
    render(
      <DrillQuestion
        question={DTK_IMAGE_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
      />,
    )
    await user.click(screen.getByTestId('option-B'))
    expect(screen.queryByText('Rätt svar')).not.toBeInTheDocument()
    expect(screen.queryByText('Ditt svar')).not.toBeInTheDocument()
    expect(screen.getByTestId('option-A')).toHaveAttribute('data-state', 'idle')
    expect(screen.getByTestId('option-B')).toHaveAttribute('data-state', 'idle')
  })

  it('reveals correct/incorrect state once graded, same as text options', () => {
    render(
      <DrillQuestion question={DTK_IMAGE_QUESTION} picked="B" graded={true} onPick={() => {}} />,
    )
    expect(screen.getByTestId('option-A')).toHaveAttribute('data-state', 'correct')
    expect(screen.getByTestId('option-B')).toHaveAttribute('data-state', 'incorrect')
  })

  it('keyboard a-d picks an image option, same as text options', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <DrillQuestion question={DTK_IMAGE_QUESTION} picked={null} graded={false} onPick={onPick} />,
    )
    await user.click(screen.getByTestId('option-C'))
    expect(onPick).toHaveBeenCalledWith('C')
  })

  it('shows the a-d keys hint (only 4 options, no E)', () => {
    render(
      <DrillQuestion
        question={DTK_IMAGE_QUESTION}
        picked={null}
        graded={false}
        onPick={() => {}}
      />,
    )
    expect(screen.getByText('Tangenter a–d väljer · klick fungerar också')).toBeInTheDocument()
  })

  it('a text-only option in the same option list renders no image (mixed safety)', () => {
    const mixed: Question = {
      ...DTK_IMAGE_QUESTION,
      options: [
        { letter: 'A', text: 'Cirkeldiagram A', figure: DTK_IMAGE_QUESTION.options?.[0].figure },
        { letter: 'B', text: 'plain text option' },
        ...DTK_IMAGE_QUESTION.options!.slice(2),
      ],
    }
    render(<DrillQuestion question={mixed} picked={null} graded={false} onPick={() => {}} />)
    expect(screen.getByTestId('option-B').querySelector('img')).toBeNull()
    expect(screen.getByTestId('option-A').querySelector('img')).not.toBeNull()
  })
})
