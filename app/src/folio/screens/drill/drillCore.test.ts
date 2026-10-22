// The kit's drill core for any question shape: A–E (NOG), A–D without a
// passage (XYZ, KVA), a figure (DTK), a LÄS/ELF passage with ¶ citations,
// a stub without options and a question with no explanation yet — and the
// controller that grades and hears the moves, the switcher's display
// moves, the clock and the paragraph aids.

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  citeParagraphs,
  type DrillController,
  type DrillCoreOptions,
  explanationCites,
  findQuotes,
  LOCAL_CONTROLLER,
  useDrillCore,
} from './drillCore'
import type { DrillQuestion } from './types'

it('locates ASCII, English and Swedish quotations without citing text between quotes', () => {
  const paragraphs = [
    'En inledning.',
    'ett långt citat ur texten',
    'en annan citerad mening',
    'texten mellan citaten',
  ]
  for (const [open, close] of [
    ['"', '"'],
    ['“', '”'],
    ['”', '”'],
  ]) {
    const text = `${open}ett långt citat ur texten${close} texten mellan citaten ${open}en annan citerad mening${close}`
    expect(citeParagraphs(text, paragraphs)).toEqual([2, 3])
    expect(findQuotes(text, paragraphs).map((m) => m.para)).toEqual([2, 3])
  }
  expect(citeParagraphs('"inledning"', paragraphs)).toEqual([])
  expect(citeParagraphs('andra styckets början', paragraphs)).toEqual([2])
})

function question(
  qid: string,
  section: DrillQuestion['section'],
  answer: DrillQuestion['answer'] = 'D',
): DrillQuestion {
  return {
    qid,
    section,
    answer,
    number: 1,
    prompt: 'Uppgift',
    math: true,
    source: { examId: 'host-2025', provpass: 'kvant1', authentic: true, label: 'Hösten 2025' },
    options: (section === 'NOG'
      ? (['A', 'B', 'C', 'D', 'E'] as const)
      : (['A', 'B', 'C', 'D'] as const)
    ).map((letter) => ({ letter, text: letter })),
  }
}
const quant = {
  questions: [
    question('xyz', 'XYZ'),
    {
      ...question('kva', 'KVA'),
      options: [
        { letter: 'A' as const, text: 'I är större än II' },
        { letter: 'B' as const, text: 'II är större än I' },
        { letter: 'C' as const, text: 'I är lika med II' },
        { letter: 'D' as const, text: 'informationen är otillräcklig' },
      ],
    },
    question('nog', 'NOG'),
  ],
  explanations: {
    xyz: { solution_path: 'Räkna.', distractors: [], technique: '', pitfall: null },
  } as Record<string, import('@/data/explanations').Explanation>,
}
const dtk = {
  questions: [
    {
      ...question('dtk', 'DTK'),
      figure: {
        src: 'figures/dtk/host-2025-kvant1-p16.jpg',
        kind: 'raster' as const,
        alt: 'Underlag',
        width: 700,
        height: 1000,
      },
    },
  ],
  explanations: {
    dtk: {
      solution_path: 'Läs av.',
      distractors: [],
      technique: '',
      pitfall: null,
      framework_id: 'DTK-TACTIC-003',
    },
  },
}
const passage = {
  paragraphs: [
    'Ett',
    'Två',
    'Tre',
    'Fyra',
    'Fem',
    'En längre mening här och ännu en längre mening.',
    'Sju',
    'Åtta',
    'Nio',
  ],
  byline: null,
  lang: 'sv' as const,
  synthetic: true,
}
const reading = {
  questions: [0, 1, 2, 3].map((n) => ({ ...question(`las${n}`, 'LÄS'), passage })),
  explanations: {
    las2: {
      solution_path: 'Läs texten.',
      technique: '',
      pitfall: null,
      steps: [
        { n: 2, text: 'Sjätte stycket: ”En längre mening här” och ”ännu en längre mening”.' },
        { n: 3, text: 'Sjunde stycket.' },
      ],
      distractors: [{ letter: 'B', why_tempting: 'Femte stycket.', why_wrong: 'Femte stycket.' }],
    },
  } as Record<string, import('@/data/explanations').Explanation>,
  start: {
    index: 2,
    results: [
      { qid: 'las0', pick: 'A' as const, correct: false },
      { qid: 'las1', pick: 'D' as const, correct: true },
    ],
  },
}
const elf = {
  questions: [
    {
      ...question('elf', 'ELF'),
      passage: {
        paragraphs: ['A practice paragraph.'],
        byline: '– Silas Ludderby',
        lang: 'en' as const,
        synthetic: true,
      },
    },
  ],
  explanations: {},
}

const [XYZ, KVA, NOG] = quant.questions

function setup(options: Partial<DrillCoreOptions> & Pick<DrillCoreOptions, 'questions'>) {
  return renderHook(
    (props: { live: boolean }) => useDrillCore({ explanations: {}, ...options, live: props.live }),
    { initialProps: { live: options.live ?? false } },
  )
}

afterEach(() => vi.useRealTimers())

describe('useDrillCore: question shapes', () => {
  it('locks and advances at most once before React renders again', () => {
    const controller = { lock: vi.fn(LOCAL_CONTROLLER.lock), next: vi.fn() }
    const { result } = setup({ questions: quant.questions, controller })
    act(() => result.current.act.select('A'))
    act(() => {
      result.current.act.lock()
      result.current.act.lock()
    })
    expect(controller.lock).toHaveBeenCalledTimes(1)
    act(() => {
      result.current.act.next()
      result.current.act.next()
    })
    expect(controller.next).toHaveBeenCalledTimes(1)
    expect(result.current.view.index).toBe(1)
  })
  it('takes A–E (NOG), grading through the controller and moving on to the end', () => {
    const controller: DrillController = {
      pick: vi.fn(),
      lock: vi.fn(LOCAL_CONTROLLER.lock),
      next: vi.fn(),
      exit: vi.fn(),
    }
    const { result } = setup({
      questions: quant.questions,
      explanations: quant.explanations,
      controller,
      start: { index: 2 },
    })
    expect(result.current.view.question.qid).toBe(NOG.qid)
    expect(result.current.view.letters).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(result.current.view.passage).toBeNull()
    act(() => result.current.act.select('E'))
    expect(controller.pick).toHaveBeenCalledWith(NOG, 'E')
    let locked = false
    act(() => {
      locked = result.current.act.lock()
    })
    expect(locked).toBe(true)
    expect(controller.lock).toHaveBeenCalledTimes(1)
    expect(controller.lock).toHaveBeenCalledWith(NOG, 'E')
    expect(result.current.view).toMatchObject({ phase: 'feedback', picked: 'E', correct: false })
    expect(result.current.view.results).toEqual([{ qid: NOG.qid, pick: 'E', correct: false }])
    let moved: string | null = null
    act(() => {
      moved = result.current.act.next()
    })
    expect(moved).toBe('done')
    expect(controller.next).toHaveBeenCalledWith(null)
    expect(result.current.view.phase).toBe('done')
    act(() => result.current.act.exit())
    expect(controller.exit).toHaveBeenCalled()
  })

  it('takes A–D without a passage (XYZ with math, KVA), ignoring letters it does not have', () => {
    const { result } = setup({ questions: quant.questions, explanations: quant.explanations })
    expect(XYZ.math).toBe(true)
    expect(result.current.view.letters).toEqual(['A', 'B', 'C', 'D'])
    act(() => result.current.act.select('E'))
    expect(result.current.view.selected).toBeNull()
    act(() => result.current.act.toggleEliminate('E'))
    expect(result.current.view.eliminated.size).toBe(0)
    // No passage: no citations, and the paragraph aid stays off.
    expect(result.current.view.cited).toEqual([])
    expect(result.current.view.marks).toEqual([])
    act(() => result.current.act.moveFocusPara(1))
    expect(result.current.view.focusPara).toBeNull()
    act(() => result.current.act.select(XYZ.answer))
    act(() => {
      result.current.act.lock()
    })
    expect(result.current.view.correct).toBe(true)
    expect(result.current.view.explanation).toBe(quant.explanations[XYZ.qid])
    act(() => {
      result.current.act.next()
    })
    expect(result.current.view.question.qid).toBe(KVA.qid)
    expect(result.current.view.question.options?.map((o) => o.text)).toEqual([
      'I är större än II',
      'II är större än I',
      'I är lika med II',
      'informationen är otillräcklig',
    ])
    expect(result.current.view).toMatchObject({ index: 1, total: 3, phase: 'question' })
    expect(result.current.view.selected).toBeNull()
  })

  it('takes a figure question (DTK) and keeps its figure', () => {
    const [q] = dtk.questions
    const { result } = setup({ questions: dtk.questions, explanations: dtk.explanations })
    expect(result.current.view.question.figure).toMatchObject({
      src: 'figures/dtk/host-2025-kvant1-p16.jpg',
      kind: 'raster',
    })
    act(() => result.current.act.select(q.answer))
    act(() => {
      result.current.act.lock()
    })
    expect(result.current.view.correct).toBe(true)
    expect(result.current.view.explanation?.framework_id).toBe('DTK-TACTIC-003')
  })

  it('takes a stub without options and a question without an explanation', () => {
    const stub: DrillQuestion = { ...XYZ, qid: 'stub-1', options: null }
    const { result } = setup({ questions: [stub] })
    expect(result.current.view.letters).toEqual([])
    expect(result.current.view.explanation).toBeNull()
    act(() => result.current.act.select('A'))
    let locked = true
    act(() => {
      locked = result.current.act.lock()
    })
    expect(locked).toBe(false)
    expect(result.current.view.phase).toBe('question')
    // The real loader's null: the verdict comes without an explanation.
    const { result: bare } = setup({ questions: [XYZ], explanations: { [XYZ.qid]: null } })
    act(() => bare.current.act.select('A'))
    act(() => {
      bare.current.act.lock()
    })
    expect(bare.current.view).toMatchObject({
      phase: 'feedback',
      explanation: null,
      correct: false,
    })
    expect(bare.current.view.stepCites).toEqual({})
  })

  it('reads an English passage (ELF) and cites nothing an explanation does not point at', () => {
    const [q] = elf.questions
    const { result } = setup({ questions: elf.questions, explanations: elf.explanations })
    expect(q.passage?.lang).toBe('en')
    expect(result.current.view.passage?.paragraphs).toHaveLength(1)
    expect(result.current.view.passage?.byline).toMatch(/^– Silas Ludderby/)
    act(() => result.current.act.moveFocusPara(1))
    expect(result.current.view.focusPara).toBe(1)
    act(() => result.current.act.moveFocusPara(1))
    expect(result.current.view.focusPara).toBe(1)
  })
})

describe('useDrillCore: a passage and its citations (LÄS)', () => {
  it('opens where the sitting left off and cites the paragraphs the explanation points at', () => {
    const { result } = setup({
      questions: reading.questions,
      explanations: reading.explanations,
      start: reading.start,
    })
    expect(result.current.view.index).toBe(2)
    expect(result.current.view.results).toHaveLength(2)
    expect(result.current.view.passage?.paragraphs).toHaveLength(9)
    expect(result.current.view.stepCites[2]).toEqual([6])
    expect(result.current.view.cited).toEqual(expect.arrayContaining([5, 6, 7]))
    const marks = result.current.view.marks
    expect(marks.filter((m) => m.source === 'step-2').map((m) => m.para)).toEqual([6, 6])
  })

  it('derives the same citations as a pure function', () => {
    const q = reading.questions[2]
    const e = reading.explanations[q.qid]
    const cites = explanationCites(e, q.passage?.paragraphs ?? null)
    expect(cites.distractorCites.B).toEqual({ tempting: [5], wrong: [5] })
    expect(explanationCites(e, null).cited).toEqual([])
    expect(explanationCites(null, q.passage?.paragraphs ?? null).cited).toEqual([])
  })

  it('marks a cited paragraph for a moment and clears it on the next question', () => {
    vi.useFakeTimers()
    const { result } = setup({
      questions: reading.questions,
      explanations: reading.explanations,
      start: { ...reading.start, graded: 'A' },
    })
    act(() => result.current.act.cite(6, 'step-2'))
    expect(result.current.view).toMatchObject({ flashPara: 6, flashSource: 'step-2' })
    act(() => vi.advanceTimersByTime(2400))
    expect(result.current.view).toMatchObject({ flashPara: null, flashSource: null })
    act(() => result.current.act.cite(7))
    act(() => {
      result.current.act.next()
    })
    expect(result.current.view.flashPara).toBeNull()
  })
})

describe('useDrillCore: opening graded and the switcher’s moves', () => {
  it('opens graded without calling the controller', () => {
    const controller = { lock: vi.fn(LOCAL_CONTROLLER.lock) }
    const { result } = setup({
      questions: reading.questions,
      explanations: reading.explanations,
      controller,
      start: { ...reading.start, graded: 'A' },
    })
    expect(result.current.view).toMatchObject({ phase: 'feedback', picked: 'A', correct: false })
    expect(result.current.view.results).toHaveLength(3)
    expect(controller.lock).not.toHaveBeenCalled()
  })

  it('grades a question for display, reopens it and starts over', () => {
    const { result } = setup({
      questions: reading.questions,
      explanations: reading.explanations,
      start: reading.start,
    })
    const q = reading.questions[2]
    act(() => result.current.act.gradeAs(() => 'A'))
    expect(result.current.view).toMatchObject({ phase: 'feedback', picked: 'A', correct: false })
    act(() => result.current.act.reopen())
    expect(result.current.view).toMatchObject({ phase: 'question', picked: null, correct: null })
    expect(result.current.view.results.map((r) => r.qid)).not.toContain(q.qid)
    // The selected option wins over the fallback.
    act(() => result.current.act.select('D'))
    act(() => result.current.act.gradeAs(() => 'A'))
    expect(result.current.view).toMatchObject({ picked: 'D', correct: true })
    act(() => {
      result.current.act.next()
    })
    act(() => result.current.act.reset())
    expect(result.current.view).toMatchObject({ index: 2, phase: 'question' })
    expect(result.current.view.results).toEqual(reading.start.results)
  })

  it('strikes options out, and a struck option cannot stay selected', () => {
    const { result } = setup({ questions: quant.questions })
    act(() => result.current.act.select('B'))
    act(() => result.current.act.toggleEliminate('B'))
    expect(result.current.view.eliminated.has('B')).toBe(true)
    expect(result.current.view.selected).toBeNull()
    act(() => result.current.act.select('B'))
    expect(result.current.view.eliminated.has('B')).toBe(false)
    expect(result.current.view.selected).toBe('B')
  })

  it('opens and goes to explanation steps, and closes them on the next question', () => {
    const { result } = setup({ questions: quant.questions, explanations: quant.explanations })
    act(() => result.current.act.toggleStep(3))
    expect(result.current.view.openSteps.has(3)).toBe(true)
    act(() => result.current.act.toggleStep(3))
    expect(result.current.view.openSteps.has(3)).toBe(false)
    act(() => result.current.act.goToStep(5))
    expect(result.current.view.openSteps.has(5)).toBe(true)
    act(() => result.current.act.select('A'))
    act(() => {
      result.current.act.lock()
    })
    expect(result.current.view.openSteps.size).toBe(0)
  })
})

describe('useDrillCore: the clock', () => {
  it('ticks while live and not finished, and restarts from the given time', () => {
    vi.useFakeTimers()
    const { result, rerender } = setup({
      questions: [NOG],
      explanations: quant.explanations,
      elapsed: 100,
      live: true,
    })
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.view.elapsed).toBe(103)
    rerender({ live: false })
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.view.elapsed).toBe(103)
    rerender({ live: true })
    act(() => result.current.act.select(NOG.answer))
    act(() => {
      result.current.act.lock()
    })
    act(() => {
      result.current.act.next()
    })
    expect(result.current.view.phase).toBe('done')
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.view.elapsed).toBe(103)
    act(() => result.current.act.restart())
    expect(result.current.view).toMatchObject({ elapsed: 100, phase: 'question' })
  })
})
