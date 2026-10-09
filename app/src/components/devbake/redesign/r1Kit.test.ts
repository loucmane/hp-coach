// The redesign bake-off's shared kit: passage parsing, the ¶ citations the
// explanations point at (derived, never rewritten), "(steg N)" links,
// Swedish number formatting and the drill's state machine.

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EXPLANATIONS, UNIT } from '@/components/devbake/redesign/r1Fixtures'
import {
  citeParagraphs,
  findQuotes,
  fmtClock,
  fmtDelta,
  fmtScore,
  parsePassage,
  type ScreenKey,
  splitStepRefs,
  useDrill,
} from '@/components/devbake/redesign/r1Kit'

const { paragraphs, byline } = parsePassage(UNIT.context)
const [, , Q3, Q4] = UNIT.questions
const E3 = EXPLANATIONS[Q3.qid]
const E4 = EXPLANATIONS[Q4.qid]
const step = (e: typeof E3, n: number) => (e.steps ?? []).find((s) => s.n === n)?.text ?? ''
const distractor = (e: typeof E3, l: string) => e.distractors.find((d) => d.letter === l)

describe('parsePassage', () => {
  it('splits the exported context into nine paragraphs and the byline', () => {
    expect(paragraphs).toHaveLength(9)
    expect(byline).toBe('– Malena Karnell, historiker')
    expect(paragraphs[8].endsWith('har nu en bok att gå till.')).toBe(true)
    // Nothing is lost: the parts rebuild the context exactly.
    expect(`${paragraphs.join('\n\n')}\n${byline}`).toBe(UNIT.context)
  })
})

describe('citeParagraphs', () => {
  it('reads ordinal "stycket" references', () => {
    expect(citeParagraphs(step(E3, 2), paragraphs)).toEqual([6])
    expect(citeParagraphs(step(E3, 4), paragraphs)).toEqual([7])
    expect(citeParagraphs(step(E4, 2), paragraphs)).toEqual([8])
  })

  it('finds quotations and rare names in the passage', () => {
    const b = distractor(E3, 'B')
    expect(citeParagraphs(b?.why_tempting ?? '', paragraphs)).toEqual([5])
    expect(citeParagraphs(b?.why_wrong ?? '', paragraphs)).toEqual([5])
    expect(citeParagraphs(distractor(E3, 'A')?.why_wrong ?? '', paragraphs)).toEqual([7])
  })

  it('does not cite a common name through its genitive', () => {
    // "Grimlunds" occurs once in the passage (¶1) but "Grimlund" in many.
    expect(step(E3, 1)).toContain('Grimlunds')
    expect(citeParagraphs(step(E3, 1), paragraphs)).toEqual([])
  })

  it('returns nothing for general advice', () => {
    expect(citeParagraphs(E3.technique, paragraphs)).toEqual([])
  })

  it('pairs Swedish quotation marks, so a quote after a short one is still found', () => {
    // ”förbigår” is too short to count; the gap after it is not a quote.
    const text = distractor(E3, 'A')?.why_tempting ?? ''
    expect(text).toContain('”förbigår” ligger dessutom nära textens ”i förbigående”')
    expect(citeParagraphs(text, paragraphs)).toEqual(expect.arrayContaining([7]))
  })
})

describe('findQuotes', () => {
  it('locates each verbatim quotation as a character range in its paragraph', () => {
    const spans = findQuotes(step(E3, 2), paragraphs)
    expect(spans.map((s) => s.para)).toEqual([6, 6])
    for (const s of spans) {
      const quoted = paragraphs[s.para - 1].slice(s.start, s.end)
      expect(step(E3, 2)).toContain(quoted)
    }
    expect(paragraphs[5].slice(spans[0].start, spans[0].end)).toBe(
      'Svagare blir framställningen när den ska förklara varför magasinen försvann.',
    )
  })

  it('finds nothing where an explanation quotes the options, not the passage', () => {
    expect(findQuotes('Ordet ”kommunreformen trots allt” finns inte.', paragraphs)).toEqual([])
  })
})

describe('splitStepRefs', () => {
  it('turns step references into links and keeps the text verbatim', () => {
    for (const text of [
      'Svaret står i texten (steg 2).',
      'Se ovan (steg 2–3) och nedan.',
      'As shown (steps 2 and 3).',
      'Inga hänvisningar alls.',
    ]) {
      expect(
        splitStepRefs(text)
          .map((s) => s.text)
          .join(''),
      ).toBe(text)
    }
    expect(splitStepRefs('X (steg 2).').filter((s) => s.kind === 'ref')).toEqual([
      { kind: 'ref', text: '(steg 2)', steps: [2] },
    ])
    expect(splitStepRefs('X (steg 2–3)').find((s) => s.kind === 'ref')).toMatchObject({
      steps: [2, 3],
    })
    expect(splitStepRefs('X (steps 2 and 3)').find((s) => s.kind === 'ref')).toMatchObject({
      steps: [2, 3],
    })
  })
})

describe('Swedish number formatting', () => {
  it('uses a decimal comma, a real minus sign and a zero-padded clock', () => {
    expect(fmtScore(1.4)).toBe('1,4')
    expect(fmtDelta(0.1)).toBe('+0,1')
    expect(fmtDelta(-0.1)).toBe('−0,1')
    expect(fmtDelta(0)).toBe('±0,0')
    expect(fmtClock(564)).toBe('09:24')
  })
})

describe('useDrill', () => {
  function setup(screen: ScreenKey) {
    const onScreen = vi.fn()
    const hook = renderHook(
      (props: { screen: ScreenKey }) => useDrill({ screen: props.screen, onScreen, live: false }),
      { initialProps: { screen } },
    )
    return { ...hook, onScreen }
  }

  it('opens question 3 unanswered on Läsfråga, after two earlier answers', () => {
    const { result } = setup(2)
    expect(result.current.view.index).toBe(2)
    expect(result.current.view.phase).toBe('question')
    expect(result.current.view.results).toHaveLength(2)
    expect(result.current.view.passage.paragraphs).toHaveLength(9)
  })

  it('selects, locks (moving the switcher to Facit) and goes on to question 4', () => {
    const { result, onScreen } = setup(2)
    act(() => result.current.act.lock())
    expect(result.current.view.phase).toBe('question') // nothing selected yet
    act(() => result.current.act.select('A'))
    act(() => result.current.act.lock())
    expect(result.current.view.phase).toBe('feedback')
    expect(result.current.view.correct).toBe(false)
    expect(onScreen).toHaveBeenLastCalledWith(3)
    act(() => result.current.act.next())
    expect(result.current.view.index).toBe(3)
    expect(result.current.view.phase).toBe('question')
    expect(onScreen).toHaveBeenLastCalledWith(2)
  })

  it('opens Facit graded with the fixture’s wrong pick, and its citations', () => {
    const { result } = setup(3)
    expect(result.current.view.phase).toBe('feedback')
    expect(result.current.view.picked).toBe('A')
    expect(result.current.view.stepCites[2]).toEqual([6])
    expect(result.current.view.cited).toEqual(expect.arrayContaining([5, 6, 7]))
    // Sentence-level evidence: step 2's two quotes in ¶6, A's why_wrong in ¶7.
    const marks = result.current.view.marks
    expect(marks.filter((m) => m.source === 'step-2').map((m) => m.para)).toEqual([6, 6])
    expect(marks.filter((m) => m.source === 'why-A').map((m) => m.para)).toEqual([7])
  })

  it('marks the cited part when a ¶ link names it, and clears it on the next question', () => {
    const { result } = setup(3)
    act(() => result.current.act.cite(6, 'step-2'))
    expect(result.current.view.flashPara).toBe(6)
    expect(result.current.view.flashSource).toBe('step-2')
    act(() => result.current.act.next())
    expect(result.current.view.flashPara).toBeNull()
    expect(result.current.view.flashSource).toBeNull()
  })

  it('follows the switcher: Facit grades an open question, Läsfråga reopens it', () => {
    const { result, rerender } = setup(2)
    act(() => result.current.act.select('D'))
    rerender({ screen: 3 })
    expect(result.current.view.phase).toBe('feedback')
    expect(result.current.view.correct).toBe(true)
    rerender({ screen: 2 })
    expect(result.current.view.phase).toBe('question')
    expect(result.current.view.results).toHaveLength(2)
  })

  it('eliminates and restores options, and an eliminated option cannot stay selected', () => {
    const { result } = setup(2)
    act(() => result.current.act.select('B'))
    act(() => result.current.act.toggleEliminate('B'))
    expect(result.current.view.eliminated.has('B')).toBe(true)
    expect(result.current.view.selected).toBeNull()
    act(() => result.current.act.toggleEliminate('B'))
    expect(result.current.view.eliminated.has('B')).toBe(false)
  })

  it('finishes the unit after the last question', () => {
    const { result } = setup(2)
    act(() => result.current.act.select('D'))
    act(() => result.current.act.lock())
    act(() => result.current.act.next())
    act(() => result.current.act.select('B'))
    act(() => result.current.act.lock())
    act(() => result.current.act.next())
    expect(result.current.view.phase).toBe('done')
    expect(result.current.view.results.map((r) => r.correct)).toEqual([true, false, true, true])
  })
})
