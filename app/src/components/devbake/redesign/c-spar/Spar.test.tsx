import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMemo, useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { MockResultRow } from '@/api/hooks/useMockResults'
import {
  describeDirectionContract,
  loadImages,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import {
  DirectionDataProvider,
  FIXTURE_DATA,
  provResultView,
} from '@/components/devbake/redesign/directionData'
import {
  Redesign2026Bakeoff,
  type Selection,
} from '@/components/devbake/redesign/Redesign2026Bakeoff'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import { NORMERING, PASS_QUESTIONS } from '@/components/devbake/redesign/r2Fixtures'
import type {
  DirectionActions,
  DirectionData,
  DrillQuestion,
  ProvResultView,
} from '@/components/devbake/redesign/viewModel'
import type { AnswerLetter, Question } from '@/data/questions'
import { computeMockSummary } from '@/lib/mock'
import { meta } from './meta'
import { Spar } from './Spar'

describeDirectionContract(meta, Spar)

function mount(
  s: DirectionProps['screen'],
  {
    data = FIXTURE_DATA,
    actions = {},
    width = 'desktop',
  }: {
    data?: DirectionData
    actions?: Partial<DirectionActions>
    width?: DirectionProps['width']
  } = {},
) {
  const onScreen = vi.fn()
  const utils = render(
    <DirectionDataProvider data={data} actions={actions}>
      <Spar screen={s} width={width} theme="light" live onScreen={onScreen} onTheme={vi.fn()} />
    </DirectionDataProvider>,
  )
  return { ...utils, onScreen }
}

const clone = () => structuredClone(FIXTURE_DATA)

describe('Spår batch 3', () => {
  beforeAll(stubLayout)

  it('opens the supplied lesson and requests another without inventing its body', () => {
    const openLesson = vi.fn()
    mount(12, { actions: { openLesson } })
    const open = FIXTURE_DATA.uppslag.open
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(open.title)
    const other = FIXTURE_DATA.uppslag.sections
      .find((s) => s.section === open.section)
      ?.entries.find((e) => e.id !== open.id)
    if (!other) throw new Error('fixture needs another entry')
    fireEvent.click(screen.getByTestId(`rd-uppslag-entry-${other.id}`))
    expect(openLesson).toHaveBeenCalledWith(other.id)
    expect(screen.getByRole('status')).toHaveTextContent('Lektion begärd')
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent(open.title)
  })

  it('disables practice when the supplied lesson has no examples', () => {
    const data = clone()
    data.uppslag.open.practice.questions = 0
    mount(12, { data })
    expect(screen.getByTestId('rd-lesson-practice')).toBeDisabled()
  })

  it('shows Konto with no current main destination and guards deletion by the exact word', () => {
    const deleteAccount = vi.fn()
    mount(13, { actions: { deleteAccount } })
    expect(screen.getByTestId('rd-konto-identity')).toHaveTextContent(
      FIXTURE_DATA.konto.identity.email,
    )
    expect(
      screen.getByRole('navigation', { name: 'Huvudmeny' }).querySelector('[aria-current]'),
    ).toBeNull()
    fireEvent.click(screen.getByTestId('rd-konto-delete'))
    expect(screen.getByTestId('rd-konto-delete-confirm')).toBeDisabled()
    fireEvent.change(screen.getByTestId('rd-konto-delete-word'), { target: { value: 'radera ' } })
    expect(screen.getByTestId('rd-konto-delete-confirm')).toBeDisabled()
    fireEvent.change(screen.getByTestId('rd-konto-delete-word'), { target: { value: 'radera' } })
    fireEvent.click(screen.getByTestId('rd-konto-delete-confirm'))
    expect(deleteAccount).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rd-spar')).not.toHaveTextContent(/Kontot är raderat|Raderar…|Sparat/)
  })

  it('grades ELF within screen 14, keeping English content and Swedish controls separate', () => {
    const lock = vi.fn((q: DrillQuestion, letter: AnswerLetter) => ({
      correct: q.answer === letter,
    }))
    const { onScreen } = mount(14, { actions: { drill: { lock } } })
    const q = FIXTURE_DATA.drills.elf.questions[0]
    expect(screen.getByTestId('rd-elf-passage')).toHaveAttribute('lang', 'en')
    expect(screen.getByTestId('rd-badge').closest('[lang]')).toHaveAttribute('lang', 'sv')
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(lock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    expect(screen.getByTestId('rd-verdict').closest('[lang]')).toHaveAttribute('lang', 'sv')
    expect(onScreen).not.toHaveBeenCalledWith(3)
  })

  it('says the plan is done when nothing is left to resume or start', () => {
    const data = clone()
    data.home.resume = null
    data.home.plan.items.forEach((item) => {
      item.completed = true
    })
    data.home.plan.allComplete = true
    const openPlanItem = vi.fn()
    mount(1, { data, actions: { openPlanItem } })
    expect(screen.getByTestId('rd-spar')).toHaveTextContent('Dagens plan är klar')
    for (const item of data.home.plan.items) {
      const row = screen.getByRole('button', { name: new RegExp(item.title) })
      expect(row).toBeDisabled()
      fireEvent.click(row)
    }
    expect(openPlanItem).not.toHaveBeenCalled()
  })

  it('updates the lesson only when the provider delivers it, including an empty catalogue', () => {
    const data = clone()
    const open = data.uppslag.open
    const other = data.uppslag.sections
      .find((s) => s.section === open.section)
      ?.entries.find((e) => e.id !== open.id)
    if (!other) throw new Error('fixture needs another entry')
    const tree = (value: DirectionData) => (
      <DirectionDataProvider data={value}>
        <Spar screen={12} width="desktop" theme="dark" live onScreen={vi.fn()} onTheme={vi.fn()} />
      </DirectionDataProvider>
    )
    const { rerender } = render(tree(data))
    fireEvent.click(screen.getByTestId(`rd-uppslag-entry-${other.id}`))
    const updated = clone()
    updated.uppslag.open = { ...open, id: other.id, title: 'Providerlevererad lektion' }
    rerender(tree(updated))
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent('Providerlevererad lektion')
    expect(screen.queryByText(/Lektion begärd/)).toBeNull()
    expect(screen.getByRole('heading', { name: 'Providerlevererad lektion' })).toHaveFocus()
    updated.uppslag.sections = []
    rerender(tree({ ...updated }))
    expect(screen.getByTestId('rd-lesson')).toHaveTextContent('Providerlevererad lektion')
    expect(screen.getByText('Inget innehåll här ännu.')).toBeInTheDocument()
  })

  it('searches catalogue summaries and labels section tiles as reading actions', () => {
    const openLesson = vi.fn()
    const startDrill = vi.fn()
    mount(12, { actions: { openLesson, startDrill } })
    const other = FIXTURE_DATA.uppslag.sections.find(
      (s) => s.section !== FIXTURE_DATA.uppslag.open.section,
    )
    if (!other?.entries[0]) throw new Error('fixture needs a section')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: other.entries[0].title } })
    const hits = screen.getByRole('region', { name: 'Sökresultat' })
    fireEvent.click(within(hits).getAllByRole('button')[0])
    expect(openLesson).toHaveBeenCalledWith(other.entries[0].id)
    expect(startDrill).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('rd-uppslag-section-ord'))
    expect(startDrill).not.toHaveBeenCalled()
  })

  it('uses the singular search count for exactly one catalogue hit', () => {
    const data = clone()
    data.uppslag.sections[0].entries[0].title = 'Unik sökträff'
    mount(12, { data })
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Unik sökträff' } })
    expect(
      within(screen.getByRole('region', { name: 'Sökresultat' })).getByRole('status'),
    ).toHaveTextContent(/^1 träff$/)
  })

  for (const width of ['desktop', 'phone'] as const) {
    it(`keeps the contents stop on the displayed lesson while another section loads, ${width}`, () => {
      const data = clone()
      const open = data.uppslag.open
      const other = data.uppslag.sections.find((s) => s.section !== open.section)
      if (!other?.entries[0]) throw new Error('fixture needs another section')
      const openLesson = vi.fn()
      const tree = (value: DirectionData) => (
        <DirectionDataProvider data={value} actions={{ openLesson }}>
          <Spar screen={12} width={width} theme="light" live onScreen={vi.fn()} onTheme={vi.fn()} />
        </DirectionDataProvider>
      )
      const { rerender } = render(tree(data))
      fireEvent.click(screen.getByTestId(`rd-uppslag-section-${other.section.toLowerCase()}`))
      expect(openLesson).toHaveBeenCalledWith(
        (other.entries.find((e) => !e.read) ?? other.entries[0]).id,
      )
      expect(screen.getByRole('status')).toHaveTextContent('Lektion begärd')
      expect(screen.getByTestId('rd-lesson')).toHaveTextContent(open.title)
      if (width === 'phone') {
        fireEvent.click(screen.getByRole('button', { name: /^Innehåll ·/ }))
      }
      expect(
        within(screen.getByRole('navigation', { name: 'Innehåll' })).getByTestId(
          `rd-uppslag-entry-${open.id}`,
        ),
      ).toHaveAttribute('aria-current', 'step')
      if (width === 'phone') fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

      const entry = other.entries.find((e) => !e.read) ?? other.entries[0]
      const updated = clone()
      updated.uppslag.open = { ...open, id: entry.id, title: entry.title, section: other.section }
      rerender(tree(updated))
      expect(screen.queryByText(/Lektion begärd/)).toBeNull()
      if (width === 'phone') {
        fireEvent.click(screen.getByRole('button', { name: /^Innehåll ·/ }))
      }
      expect(
        within(screen.getByRole('navigation', { name: 'Innehåll' })).getByTestId(
          `rd-uppslag-entry-${entry.id}`,
        ),
      ).toHaveAttribute('aria-current', 'step')
    })

    it(`consumes a menu Konto jump before a switcher return, ${width}`, async () => {
      await onDesktopStage(async () => {
        const scrolling = vi.spyOn(Element.prototype, 'scrollIntoView')
        try {
          render(<BakeoffPage initial={{ ...BAKEOFF_9, s: 1, w: width }} onSelect={vi.fn()} />)
          await screen.findByTestId('rd-spar')
          fireEvent.click(screen.getByTestId('rd-account'))
          fireEvent.click(screen.getByRole('menuitem', { name: 'Inställningar' }))
          expect(screen.getByRole('heading', { name: 'Utseende' })).toHaveFocus()
          expect(scrolling).toHaveBeenCalled()
          fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ArrowLeft' })
          expect(screen.getByTestId('rb26-stage')).toHaveAttribute('data-screen', '12')
          scrolling.mockClear()
          fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ArrowRight' })
          expect(screen.getByTestId('rb26-stage')).toHaveAttribute('data-screen', '13')
          expect(screen.getByRole('heading', { name: 'Ditt konto' })).toHaveFocus()
          expect(scrolling).not.toHaveBeenCalled()
          // Another explicit request to the same section still works.
          fireEvent.click(screen.getByTestId('rd-account'))
          fireEvent.click(screen.getByRole('menuitem', { name: 'Inställningar' }))
          expect(screen.getByRole('heading', { name: 'Utseende' })).toHaveFocus()
          expect(scrolling).toHaveBeenCalledTimes(1)
        } finally {
          scrolling.mockRestore()
        }
      })
    })

    it(`starts ELF with Om texten closed while retaining its disclosure, ${width}`, () => {
      mount(14, { width })
      const toggle = screen.getByTestId('rd-note-toggle')
      expect(toggle).toHaveTextContent('Om texten')
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByTestId('rd-note')).not.toBeVisible()
      fireEvent.click(toggle)
      expect(screen.getByTestId('rd-note')).toBeVisible()
    })
  }

  it('places the short ELF tray after the whole passage in the same desktop scroller', () => {
    const data = clone()
    const q = data.drills.elf.questions[0]
    q.passage = { ...q.passage!, paragraphs: ['A short English passage.'] }
    const { unmount } = mount(14, { data })
    const scroller = screen.getByTestId('rd-elf-passage').closest('.sp-scroll')
    const tray = screen.getByTestId('rd-option-A').closest('.sp-tray')
    expect(scroller).toContainElement(tray as HTMLElement)
    expect(screen.getByTestId('rd-option-A')).toBeVisible()
    expect(
      screen.getByTestId('rd-elf-passage').compareDocumentPosition(tray as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toBeInTheDocument()
    expect(scroller).not.toContainElement(screen.getByTestId('rd-verdict'))
    unmount()
    q.passage.paragraphs.push('A second paragraph makes this a longer text.')
    mount(14, { data })
    expect(screen.getByTestId('rd-elf-passage').closest('.sp-scroll')).not.toContainElement(
      screen.getByTestId('rd-option-A').closest('.sp-tray') as HTMLElement,
    )
  })

  it('uses distinct classes for ELF gap slots and the MEK underline blank', () => {
    const data = clone()
    const q = data.drills.elf.questions[0]
    q.prompt = 'Gap (1)'
    q.passage = { ...q.passage!, paragraphs: ['The ___(1)___ is clear.'] }
    const { unmount } = mount(14, { data })
    const gap = screen.getByTestId('rd-elf-passage').querySelector('[data-state]')
    expect(gap).toHaveClass('sp-gapslot')
    expect(gap).not.toHaveClass('sp-gap')
    unmount()
    const mek = { ...data.drills.quant.questions[0], section: 'MEK' as const, prompt: 'En ____.' }
    data.drills.quant.questions = [mek]
    data.drills.quant.start = { index: 0, results: [] }
    mount(6, { data })
    expect(screen.getByText('lucka 1').parentElement).toHaveClass('sp-gap')
    expect(screen.getByText('lucka 1').parentElement).not.toHaveClass('sp-gapslot')
  })

  it('renders trap, root, rule and tactic bodies from the supplied lesson', () => {
    const base = clone()
    const variants = [
      {
        ...base.uppslag.open,
        id: 'trap',
        family: 'nog_traps' as const,
        section: 'NOG' as const,
        title: 'Fällan',
        entry: {
          id: 'trap',
          pattern_description: 'Mönstret',
          why_it_occurs: 'Orsaken',
          common_distractor_signature: 'Felsvaret',
          countermeasure: 'Motåtgärden',
          example_questions: [],
          worked_example: {
            setup: 'Premissen',
            trap_thinking: 'Fel tanke',
            correct_thinking: 'Rätt tanke',
            answer: 'Svaret',
          },
        },
      },
      {
        ...base.uppslag.open,
        id: 'root',
        family: 'ord_roots' as const,
        section: 'ORD' as const,
        title: 'för-',
        entry: {
          id: 'root',
          root: 'för-',
          origin: 'GERMANIC',
          meaning: 'före',
          example_words: ['förhistoria'],
          example_questions: [],
        },
      },
      {
        ...base.uppslag.open,
        id: 'rule',
        family: 'mek_protocol' as const,
        section: 'MEK' as const,
        title: 'Regeln',
        entry: {
          id: 'rule',
          constraint_type: 'Syftning',
          rule: 'Kontrollera syftningen.',
          example_questions: [],
        },
      },
      {
        ...base.uppslag.open,
        id: 'tactic',
        family: 'dtk_tactics' as const,
        section: 'DTK' as const,
        title: 'Taktiken',
        entry: {
          id: 'tactic',
          tactic: 'Läs skalan.',
          when_to_apply: 'Olika skalor.',
          example_questions: [],
        },
      },
    ]
    const phrases = ['Fällans tanke', 'germanskt', 'Kontrollera syftningen.', 'Olika skalor.']
    for (const [i, lesson] of variants.entries()) {
      const data = { ...base, uppslag: { ...base.uppslag, open: lesson } }
      const mounted = mount(12, { data })
      expect(screen.getByTestId('rd-lesson')).toHaveTextContent(phrases[i])
      mounted.unmount()
    }
  })

  it('does not advance if marking the current lesson read throws', () => {
    const data = clone()
    const section = data.uppslag.sections.find((s) => s.section === data.uppslag.open.section)
    if (!section?.entries[0]) throw new Error('fixture needs entries')
    data.uppslag.open.id = section.entries[0].id
    data.uppslag.open.read = false
    const openLesson = vi.fn()
    mount(12, {
      data,
      actions: {
        openLesson,
        toggleLessonRead: () => {
          throw new Error('unavailable')
        },
      },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Nästa/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Läsmarkeringen gick inte')
    expect(openLesson).not.toHaveBeenCalled()
  })

  it('keeps direct Konto entry at the frame title and gives menu rows distinct targets', () => {
    const scrolling = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { unmount } = mount(13)
    expect(scrolling).not.toHaveBeenCalled()
    unmount()
    mount(1)
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Inställningar' }))
    expect(screen.getByRole('heading', { name: 'Utseende' })).toHaveFocus()
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hjälp' }))
    expect(screen.getByRole('heading', { name: 'Hjälp och villkor' })).toHaveFocus()
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Konto' }))
    expect(screen.getByRole('heading', { name: 'Konto' })).toHaveFocus()
    scrolling.mockRestore()
  })

  it('keeps phone dialog focus, closes its backdrop, and restores the opener before unmount', () => {
    mount(13, { width: 'phone' })
    const opener = screen.getByTestId('rd-account')
    opener.focus()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Konto' })
    expect(dialog.tagName).toBe('DIALOG')
    expect(dialog).toHaveAttribute('open')
    const close = vi.spyOn(dialog as HTMLDialogElement, 'close')
    fireEvent.click(dialog, { clientX: -10, clientY: -10 })
    expect(close).toHaveBeenCalled()
    expect(opener).toHaveFocus()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(opener)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(opener).toHaveFocus()
  })

  it('sends each preference patch separately, and does not claim a save on failure', () => {
    const setPrefs = vi.fn()
    const data = clone()
    data.konto.identity.name = ''
    delete data.konto.identity.plan
    mount(13, { data, actions: { setPrefs } })
    expect(screen.getByTestId('rd-konto-identity')).toHaveTextContent(data.konto.identity.email)
    for (const pref of ['font', 'density'] as const) {
      const option = data.konto.options[pref].find((o) => o.key !== data.konto.prefs[pref])
      if (!option) throw new Error('fixture needs a preference alternative')
      fireEvent.click(screen.getByTestId(`rd-konto-${pref}-${option.key}`))
      expect(setPrefs).toHaveBeenLastCalledWith({ [pref]: option.key })
    }
    fireEvent.click(screen.getByLabelText(data.konto.prefs.smartDrill ? 'Slumpat' : 'Smart'))
    expect(setPrefs).toHaveBeenLastCalledWith({ smartDrill: !data.konto.prefs.smartDrill })
    expect(screen.queryByTestId(`rd-konto-palette-${data.konto.prefs.palette}`)).toBeNull()
    expect(screen.queryByTestId(`rd-konto-coach-${data.konto.prefs.coach}`)).toBeNull()
    expect(screen.getByTestId('rd-spar')).not.toHaveTextContent(/Sparat|Synkat/)
  })

  it('handles export failure and uses the specified deletion failure copy', () => {
    const fail = () => {
      throw new Error('unavailable')
    }
    mount(13, { actions: { exportData: fail, deleteAccount: fail } })
    fireEvent.click(screen.getByTestId('rd-konto-export'))
    expect(screen.getByRole('alert')).toHaveTextContent('Kunde inte exportera')
    fireEvent.click(screen.getByTestId('rd-konto-delete'))
    fireEvent.change(screen.getByTestId('rd-konto-delete-word'), { target: { value: 'radera' } })
    fireEvent.click(screen.getByTestId('rd-konto-delete-confirm'))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Kunde inte radera kontot. Inget raderades — försök igen.',
    )
    expect(screen.getByTestId('rd-spar')).not.toHaveTextContent('Kontot är raderat')
  })

  it('requires both question and option image instances, including failure, retry and keyboard submission', () => {
    const data = clone()
    const q = data.drills.elf.questions[0]
    q.figure = { src: 'question.svg', alt: 'Question figure', width: 300, height: 200, kind: 'svg' }
    if (!q.options) throw new Error('fixture needs options')
    q.options[0].figure = { src: 'option.svg', alt: 'Option figure', width: 80, height: 80 }
    const lock = vi.fn(() => ({ correct: true }))
    mount(14, { data, actions: { drill: { lock } } })
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    const blocked = () => {
      expect(screen.getByTestId('rd-lock')).toBeDisabled()
      key('Enter')
      key(' ')
      expect(lock).not.toHaveBeenCalled()
    }
    blocked()
    fireEvent.load(screen.getByAltText('Question figure'))
    blocked()
    fireEvent.error(screen.getByAltText('Option figure'))
    blocked()
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    blocked()
    fireEvent.load(screen.getByAltText('Option figure'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    key('Enter')
    expect(lock).toHaveBeenCalledTimes(1)
  })

  it('accepts a cached image that is complete with a real natural width', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    const natural = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(100)
    try {
      const data = clone()
      data.drills.elf.questions[0].figure = {
        src: 'cached.svg',
        alt: 'Cached figure',
        width: 100,
        height: 100,
        kind: 'svg',
      }
      mount(14, { data })
      fireEvent.click(screen.getByTestId('rd-option-A'))
      expect(screen.getByTestId('rd-lock')).toBeEnabled()
    } finally {
      complete.mockRestore()
      natural.mockRestore()
    }
  })

  it('keeps a shared figure ready across questions and resets when its source changes', () => {
    const data = clone()
    const q = data.drills.elf.questions[0]
    q.figure = { src: 'shared.svg', alt: 'Shared figure', width: 100, height: 100, kind: 'svg' }
    data.drills.elf.questions = [q, { ...structuredClone(q), qid: 'second', number: 2 }]
    const tree = (value: DirectionData) => (
      <DirectionDataProvider data={value}>
        <Spar screen={14} width="desktop" theme="light" live onScreen={vi.fn()} onTheme={vi.fn()} />
      </DirectionDataProvider>
    )
    const { rerender } = render(tree(data))
    const image = screen.getByAltText('Shared figure')
    fireEvent.load(image)
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByAltText('Shared figure')).toBe(image)
    fireEvent.click(screen.getByTestId('rd-option-A'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    const update = structuredClone(data)
    const figure = update.drills.elf.questions[1].figure
    if (!figure) throw new Error('figure')
    figure.src = 'different.svg'
    rerender(tree(update))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.error(screen.getByAltText('Shared figure'))
    figure.src = 'third.svg'
    rerender(tree({ ...update }))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(screen.getByAltText('Shared figure'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
  })

  it('resets a changed session and a shrinking or emptied provider deck safely', () => {
    const data = clone()
    const q = data.drills.elf.questions[0]
    data.drills.elf.questions = [q, { ...q, qid: 'second' }]
    const tree = (value: DirectionData) => (
      <DirectionDataProvider data={value}>
        <Spar screen={14} width="desktop" theme="light" live onScreen={vi.fn()} onTheme={vi.fn()} />
      </DirectionDataProvider>
    )
    const { rerender } = render(tree(data))
    fireEvent.click(screen.getByTestId('rd-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    data.drills.elf.questions = [q]
    rerender(tree({ ...data }))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-option-A'))
    data.drills.elf.id = 'new-sitting'
    rerender(tree({ ...data }))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    data.drills.elf.questions = []
    rerender(tree({ ...data }))
    expect(screen.getByRole('heading', { name: 'Inga frågor här' })).toBeInTheDocument()
    expect(screen.getByTestId('rd-exit')).toBeInTheDocument()
  })

  it('renders gap sentences, previews a word, keeps the corrected word and cites English evidence', () => {
    const data = clone()
    const q = data.drills.elf.questions[0]
    q.prompt = 'Gap (1)'
    q.passage = {
      ...q.passage!,
      paragraphs: ['It takes its ___(1)___ on the mood.', 'The message is ___(2)___.'],
    }
    q.options = [
      { letter: 'A', text: 'toll' },
      { letter: 'B', text: 'cost' },
      { letter: 'C', text: 'charge' },
      { letter: 'D', text: 'price' },
    ]
    q.answer = 'A'
    const second = { ...structuredClone(q), qid: 'gap-2', number: 2, prompt: '' }
    data.drills.elf.questions = [q, second]
    const e = data.drills.elf.explanations[q.qid]
    if (!e) throw new Error('fixture needs explanation')
    e.steps = [
      {
        n: 1,
        title: 'Read the sentence',
        text: 'The first paragraph says “It takes its ___ on the mood.”',
        tier: 'essential',
      },
    ]
    mount(14, { data })
    expect(screen.queryByText('Gap (1)')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Lucka 1' })).toBeInTheDocument()
    const passage = screen.getByTestId('rd-elf-passage')
    fireEvent.click(screen.getByTestId('rd-option-B'))
    expect(passage.querySelector('.sp-gapslot[data-preview="true"]')).toHaveTextContent('cost')
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(
      passage.querySelector('.sp-gapslot[data-state="miss"] .sp-gap-visible'),
    ).toHaveTextContent('toll')
    expect(screen.getByTestId('rd-step-1')).toHaveTextContent('Read the sentence')
    expect(within(screen.getByTestId('rd-step-1')).getByTestId('rd-cite-1')).toBeInTheDocument()
    expect(
      screen
        .getByText('The first paragraph says “It takes its ___ on the mood.”')
        .closest('[lang]'),
    ).toHaveAttribute('lang', 'en')
    expect(screen.getByTestId('rd-cite-1').closest('[lang]')).toHaveAttribute('lang', 'sv')
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByRole('heading', { name: 'Lucka 2' })).toBeInTheDocument()
    expect(
      passage.querySelector('.sp-gapslot[data-state="miss"] .sp-gap-visible'),
    ).toHaveTextContent('toll')
    key('g')
    expect(within(passage).getByTestId('rd-para-2')).toHaveAttribute('data-flash', 'true')
  })

  for (const s of [2, 3, 12, 13, 14] as const) {
    for (const width of ['desktop', 'phone'] as const) {
      it(`lets host digits and arrows through focused content on screen ${s}, ${width}`, async () => {
        await onDesktopStage(async () => {
          const onSelect = vi.fn()
          render(<Redesign2026Bakeoff sel={{ ...BAKEOFF_9, s, w: width }} onSelect={onSelect} />)
          await screen.findByTestId('rd-spar')
          const check = (element: HTMLElement) => {
            element.focus()
            expect(element).toHaveFocus()
            onSelect.mockClear()
            fireEvent.keyDown(document.activeElement ?? document.body, { key: '3' })
            expect(onSelect).toHaveBeenLastCalledWith({ d: 'c', sbs: false })
            fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ArrowRight' })
            expect(onSelect).toHaveBeenLastCalledWith({ s: s === 14 ? 1 : s + 1 })
          }
          fireEvent.keyDown(document.activeElement ?? document.body, { key: '3' })
          expect(onSelect).toHaveBeenLastCalledWith({ d: 'c', sbs: false })
          if (s === 12) check(screen.getByTestId('rd-lesson-read'))
          else if (s === 13) check(screen.getByTestId('rd-konto-export'))
          else {
            check(screen.getByTestId('rd-para-1').querySelector('button') as HTMLElement)
            if (s !== 3) {
              const show = screen.queryByRole('button', { name: /Visa alternativen/ })
              if (show) fireEvent.click(show)
              check(screen.getByTestId('rd-option-A'))
              fireEvent.click(screen.getByTestId('rd-option-A'))
              fireEvent.click(screen.getByTestId('rd-lock'))
            }
            check(screen.getByTestId('rd-verdict').querySelector('h2') as HTMLElement)
            check(screen.getByTestId('rd-next'))
          }
        })
      })
    }
  }

  it('updates the real host theme in both directions from Konto', async () => {
    await onDesktopStage(async () => {
      render(<BakeoffPage initial={{ ...BAKEOFF_9, s: 13 }} onSelect={vi.fn()} />)
      await screen.findByTestId('rd-spar')
      for (const mode of ['dark', 'light'] as const) {
        fireEvent.click(screen.getByTestId(`rd-konto-mode-${mode}`))
        expect(screen.getByTestId('rd-spar')).toHaveAttribute('data-theme', mode)
        expect(screen.getByTestId('rb26')).toHaveAttribute('data-theme', mode)
      }
    })
  })

  it('blocks a replacement image instance when switching to the phone layout', () => {
    const data = clone()
    data.drills.elf.questions[0].figure = {
      src: 'shared.svg',
      alt: 'Responsive figure',
      width: 100,
      height: 100,
      kind: 'svg',
    }
    const tree = (width: DirectionProps['width']) => (
      <DirectionDataProvider data={data}>
        <Spar screen={14} width={width} theme="light" live onScreen={vi.fn()} onTheme={vi.fn()} />
      </DirectionDataProvider>
    )
    const { rerender } = render(tree('desktop'))
    const old = screen.getByAltText('Responsive figure')
    fireEvent.load(old)
    fireEvent.click(screen.getByTestId('rd-option-A'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    rerender(tree('phone'))
    expect(screen.getByAltText('Responsive figure')).not.toBe(old)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(screen.getByAltText('Responsive figure'))
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
  })

  it('shows a truthful way out when the passage is absent and submits no answer', () => {
    const data = clone()
    data.drills.elf.questions[0].passage = null
    const go = vi.fn()
    const lock = vi.fn(() => ({ correct: true }))
    mount(14, { data, actions: { go, drill: { lock } } })
    expect(screen.getByText(/Texten saknas just nu/)).toBeInTheDocument()
    key('a')
    key('Enter')
    expect(lock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Till Öva' }))
    expect(go).toHaveBeenCalledWith('ova')
  })

  it('opens phone lesson contents as a native modal and restores its opener on cancel', () => {
    mount(12, { width: 'phone' })
    expect(screen.queryByRole('dialog')).toBeNull()
    const opener = screen.getByRole('button', { name: /^Innehåll ·/ })
    opener.focus()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Innehåll' })
    expect(dialog.tagName).toBe('DIALOG')
    expect(
      within(dialog).getByTestId(`rd-uppslag-entry-${FIXTURE_DATA.uppslag.open.id}`),
    ).toHaveAttribute('aria-current', 'step')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(opener).toHaveFocus()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

/** The screen's green pills: filled primary buttons on screen. */
function greenPills(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.sp-btn--primary')).filter(
    (el) => !el.closest('[hidden]'),
  )
}

function key(k: string, init: KeyboardEventInit = {}) {
  fireEvent.keyDown(window, { key: k, ...init })
}

/** A box's place on screen, for the layout jsdom does not have. */
function rect(top: number, height: number): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }
}

/** Opens the phone's "Bara ett delprov" sheet on screen `s`, then checks
 *  that Tab never leaves it: from the heading it opens on, from its last
 *  control and from its first. Esc closes it with focus back on its
 *  button. */
async function expectScopeSheetKeepsFocus(s: DirectionProps['screen']) {
  const user = userEvent.setup()
  mount(s, { width: 'phone' })
  const toggle = screen.getByRole('button', { name: 'Bara ett delprov' })
  await user.click(toggle)
  const sheet = screen.getByRole('dialog', { name: 'Bara ett delprov' })
  expect(within(sheet).getByRole('heading', { name: 'Bara ett delprov' })).toHaveFocus()
  const controls = within(sheet).getAllByRole('button')
  const first = controls[0]
  const last = controls[controls.length - 1]
  expect(controls.length).toBeGreaterThan(1)
  // Straight from the heading, before anything else: round to the end.
  await user.tab({ shift: true })
  expect(last).toHaveFocus()
  await user.tab()
  expect(first).toHaveFocus()
  await user.tab({ shift: true })
  expect(last).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'Bara ett delprov' })).toBeNull()
  expect(toggle).toHaveFocus()
}

/** A mixed round whose first question is a LÄS question with its passage
 *  (Läsfråga's question 3, whose second step cites ¶ 6 with two
 *  quotations), as a repetition of misses from several sections plays. */
function passageRound(): { data: DirectionData; q: DrillQuestion } {
  const data = clone()
  const reading = data.drills.reading
  const q = reading.questions[2]
  data.drills.quant = {
    ...data.drills.quant,
    request: { kind: 'repetition' },
    questions: [q, ...data.drills.quant.questions],
    explanations: { ...data.drills.quant.explanations, [q.qid]: reading.explanations[q.qid] },
    start: { index: 0, results: [] },
  }
  return { data, q }
}

describe('Spår: data, states and interaction', () => {
  beforeAll(stubLayout)

  describe('Idag', () => {
    it('reads Home from the context and leaves out every optional it lacks', () => {
      const data = clone()
      const resume = data.home.resume
      if (!resume) throw new Error('the fixture resumes a sitting')
      delete resume.pausedAt
      delete resume.minutesLeft
      delete resume.device
      data.home.today.greeting = 'God kväll'
      data.home.prognosis = { ...data.home.prognosis, low: undefined, high: undefined, delta: null }
      data.home.week = { minutesToday: null, daysPractised: 3 }
      mount(1, { data })
      const root = screen.getByTestId('rd-spar')
      expect(root).toHaveTextContent('God kväll')
      expect(root).not.toHaveTextContent(/Pausad|min kvar|osäkerhet|sedan förra veckan/)
      expect(root).toHaveTextContent('3 dagar den här veckan')
      expect(root).not.toHaveTextContent(/undefined|NaN/)
      expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
    })

    it('opens a plan step through the host, and leads with the plan when nothing resumes', () => {
      const data = clone()
      data.home.resume = null
      const openPlanItem = vi.fn()
      mount(1, { data, actions: { openPlanItem } })
      expect(screen.queryByTestId('rd-resume')).toBeNull()
      const [first, second] = data.home.plan.items
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Börja · ${first.minutes}`) }))
      expect(openPlanItem).toHaveBeenLastCalledWith(first.id)
      fireEvent.click(screen.getByRole('button', { name: new RegExp(second.title) }))
      expect(openPlanItem).toHaveBeenLastCalledWith(second.id)
      expect(greenPills()).toHaveLength(1)
    })

    it('asks the host for a destination and the account, and keeps Avsluta-free navigation', () => {
      const go = vi.fn()
      const openKonto = vi.fn()
      const signOut = vi.fn()
      mount(1, { actions: { go, openKonto, signOut } })
      fireEvent.click(screen.getByTestId('rd-nav-ova'))
      expect(go).toHaveBeenCalledWith('ova')
      // A host that does not move still shows the page.
      expect(screen.getByRole('heading', { level: 1, name: 'Alla delprov' })).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-account'))
      fireEvent.click(screen.getByRole('menuitem', { name: 'Konto' }))
      expect(openKonto).toHaveBeenCalled()
      fireEvent.click(screen.getByTestId('rd-account'))
      fireEvent.click(screen.getByRole('menuitem', { name: 'Logga ut' }))
      expect(signOut).toHaveBeenCalled()
    })
  })

  describe('Öva', () => {
    it('leads with the ripe misses: one green pill that starts the round', () => {
      const startDrill = vi.fn()
      mount(5, { actions: { startDrill } })
      const { dueNow, pile } = FIXTURE_DATA.ova.repetera
      expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent(`${dueNow} missar är redo nu`)
      expect(screen.getByTestId('rd-spar')).toHaveTextContent(`${pile} i dagens hög`)
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent(`Repetera ${dueNow} · ca 9 min`)
      key('Enter')
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition' })
      // The path names the next misses' sections, in play order.
      const path = screen.getByRole('img', { name: /^Nästa missar:/ })
      const due = FIXTURE_DATA.repetera.items.filter((i) => i.dueNow).map((i) => i.section)
      expect(path).toHaveAccessibleName(`Nästa missar: ${due.join(', ')}`)
    })

    it('keeps the official section names, the halves and the round lengths', () => {
      mount(5)
      expect(screen.getByTestId('rd-ova-section-las')).toHaveTextContent('Läsförståelse')
      expect(screen.getByTestId('rd-ova-section-las')).not.toHaveTextContent('Svensk')
      expect(screen.getByTestId('rd-ova-section-dtk')).toHaveTextContent('10–13 frågor · ca 15 min')
      expect(screen.getByRole('heading', { name: 'Verbal del' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Kvantitativ del' })).toBeInTheDocument()
      expect(screen.getByTestId('rd-ova-section-xyz')).toHaveAccessibleName(
        /Matematisk problemlösning, 10 frågor, cirka 8 minuter, 5 väntar, föreslås/,
      )
    })

    it('moves the green pill to the suggested section when nothing is ripe', () => {
      const data = clone()
      data.ova.repetera = { dueNow: 0, pile: 7 }
      const startDrill = vi.fn()
      mount(5, { data, actions: { startDrill } })
      expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('Inget är redo just nu')
      expect(screen.getByTestId('rd-spar')).toHaveTextContent('7 missar ligger i dagens hög')
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent('Öva XYZ · ca 8 min')
      key('Enter')
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
    })

    it('offers a new reader a mixed round as the one green pill', () => {
      const data = clone()
      data.ova.repetera = { dueNow: 0, pile: 0 }
      data.ova.weakest = null
      for (const s of data.ova.sections) s.attempts90d = 0
      const startDrill = vi.fn()
      mount(5, { data, actions: { startDrill } })
      expect(screen.getByTestId('rd-ova-repetera')).toHaveTextContent('Här samlas dina missar')
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toBe(screen.getByTestId('rd-ova-mixed'))
      fireEvent.click(pills[0])
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'mixed' })
    })

    it('narrows the round to one section in place, and Esc hands focus back', () => {
      const startDrill = vi.fn()
      mount(5, { actions: { startDrill } })
      const toggle = screen.getByRole('button', { name: 'Bara ett delprov' })
      fireEvent.click(toggle)
      const region = screen.getByRole('region', { name: 'Bara ett delprov' })
      expect(within(region).getByRole('heading', { name: 'Bara ett delprov' })).toHaveFocus()
      const ripe = FIXTURE_DATA.ova.sections.filter((s) => s.dueNow > 0)
      expect(within(region).getAllByRole('button', { name: /redo$/ })).toHaveLength(ripe.length)
      fireEvent.keyDown(region, { key: 'Escape' })
      expect(screen.queryByRole('region', { name: 'Bara ett delprov' })).toBeNull()
      expect(toggle).toHaveFocus()
      fireEvent.click(toggle)
      const reopened = screen.getByRole('region', { name: 'Bara ett delprov' })
      fireEvent.click(within(reopened).getByRole('button', { name: /^Läsförståelse/ }))
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition', section: 'LÄS' })
    })

    it('opens "Bara ett delprov" as a modal edge sheet on phone', () => {
      mount(5, { width: 'phone' })
      fireEvent.click(screen.getByRole('button', { name: 'Bara ett delprov' }))
      const sheet = screen.getByRole('dialog', { name: 'Bara ett delprov' })
      expect(sheet).toHaveAttribute('aria-modal', 'true')
      fireEvent.keyDown(sheet, { key: 'Escape' })
      expect(screen.queryByRole('dialog', { name: 'Bara ett delprov' })).toBeNull()
    })

    it('keeps Tab inside the phone sheet, from the heading it opens on', async () => {
      await expectScopeSheetKeepsFocus(5)
    })

    it('gives a recurring trap a quiet home, only from three misses', () => {
      const startDrill = vi.fn()
      const { unmount } = mount(5, { actions: { startDrill } })
      const [trap] = FIXTURE_DATA.ova.weakTraps
      fireEvent.click(screen.getByRole('button', { name: /Riktad repetition/ }))
      expect(startDrill).toHaveBeenLastCalledWith({
        kind: 'framework',
        frameworkId: trap.frameworkId,
        section: trap.section,
      })
      unmount()
      const data = clone()
      for (const t of data.ova.weakTraps) t.count = 2
      mount(5, { data })
      expect(screen.queryByText('Återkommande fälla')).toBeNull()
    })
  })

  describe('Repetera', () => {
    it('shows the round as a path, the rest of the pile on request, and one start', () => {
      const startDrill = vi.fn()
      const go = vi.fn()
      mount(8, { actions: { startDrill, go } })
      const r = FIXTURE_DATA.repetera
      const due = r.items.filter((i) => i.dueNow)
      expect(screen.getByTestId('rd-spar')).toHaveTextContent(
        `Repetera ${due.length} av ${r.pile}, de äldsta först. Ungefär 9 minuter.`,
      )
      const queue = screen.getByRole('list', { name: 'Missar i den ordning de kommer' })
      expect(within(queue).getAllByTestId(/^rd-repetera-item-/)).toHaveLength(due.length)
      const later = r.items.filter((i) => !i.dueNow)
      expect(screen.queryByTestId(`rd-repetera-item-${later[0].n}`)).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Visa dem' }))
      expect(screen.getByTestId(`rd-repetera-item-${later[0].n}`)).toHaveTextContent(
        later[0].dueLabel,
      )
      expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent(
        `Starta repetition · ${due.length} frågor`,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Öva' }))
      expect(go).toHaveBeenCalledWith('ova')
    })

    it('rescopes the round to one section, and the start follows the scope', () => {
      const startDrill = vi.fn()
      mount(8, { actions: { startDrill } })
      fireEvent.click(screen.getByRole('button', { name: 'Bara ett delprov' }))
      fireEvent.click(screen.getByRole('button', { name: /Kvantitativa jämförelser/ }))
      expect(screen.getByText('Repetition · bara KVA')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
        'Dina missar, bara Kvantitativa jämförelser',
      )
      const kva = FIXTURE_DATA.repetera.items.filter((i) => i.dueNow && i.section === 'KVA')
      expect(screen.getAllByTestId(/^rd-repetera-item-/)).toHaveLength(kva.length)
      fireEvent.click(screen.getByTestId('rd-repetera-start'))
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'repetition', section: 'KVA' })
    })

    it('keeps Tab inside the phone scope sheet, from the heading it opens on', async () => {
      await expectScopeSheetKeepsFocus(8)
    })

    it('draws ten a round and says how many more wait', () => {
      const data = clone()
      const base = data.repetera.items[0]
      data.repetera.items = Array.from({ length: 14 }, (_, i) => ({
        ...base,
        n: i + 1,
        mistakeId: 1000 + i,
        dueNow: true,
      }))
      data.repetera.dueNow = 14
      mount(8, { data })
      expect(screen.getAllByTestId(/^rd-repetera-item-/)).toHaveLength(10)
      expect(screen.getByText(/\+ 4 till väntar i kön/)).toBeInTheDocument()
      expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent('10 frågor')
    })

    it('without ripe misses: no empty start, the green pill names a step that works', () => {
      const data = clone()
      data.repetera = {
        ...data.repetera,
        dueNow: 0,
        items: data.repetera.items.filter((i) => !i.dueNow),
      }
      const startDrill = vi.fn()
      const { unmount } = mount(8, { data, actions: { startDrill } })
      expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
      expect(screen.getByTestId('rd-spar')).toHaveTextContent('Inget är redo just nu.')
      fireEvent.click(screen.getByRole('button', { name: /^Öva XYZ · ca 8 min/ }))
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
      unmount()
      const empty = clone()
      empty.repetera = { ...empty.repetera, dueNow: 0, pile: 0, items: [] }
      const go = vi.fn()
      mount(8, { data: empty, actions: { go } })
      expect(screen.getByTestId('rd-spar')).toHaveTextContent('Inget väntar i kön idag.')
      expect(screen.getByTestId('rd-spar')).not.toHaveTextContent('återlärt')
      fireEvent.click(screen.getByRole('button', { name: /^Till Öva/ }))
      expect(go).toHaveBeenCalledWith('ova')
    })
  })

  describe('Kvantfråga', () => {
    it('lays out KVA as two quantities and NOG as two statements, words as the names', () => {
      const data = clone()
      data.drills.quant.start = { index: 1, results: [] }
      const { unmount } = mount(6, { data })
      expect(screen.getByRole('region', { name: 'Kvantitet I' })).toHaveTextContent('x - y')
      expect(screen.getByRole('region', { name: 'Kvantitet II' })).toHaveTextContent('3x - 2y')
      expect(screen.getByTestId('rd-quant-option-A')).toHaveAccessibleName(
        'Alternativ A: I är större än II',
      )
      expect(screen.getByTestId('rd-quant-option-A')).toHaveTextContent('I > II')
      unmount()
      data.drills.quant.start = { index: 2, results: [] }
      mount(6, { data })
      const statements = screen.getByRole('list', { name: 'Påståenden' })
      expect(within(statements).getAllByRole('listitem')).toHaveLength(2)
      expect(screen.getByText('Tillräcklig information för lösningen erhålls')).toBeInTheDocument()
      expect(screen.getByTestId('rd-quant-option-E')).toHaveAccessibleName(
        'Alternativ E: ej genom de båda påståendena',
      )
    })

    it('takes only its own letters, strikes with Shift, never leaves on Esc or a digit', () => {
      const exit = vi.fn()
      const lock = vi.fn(() => ({ correct: false }))
      mount(6, { actions: { drill: { lock, exit } } })
      key('e')
      expect(screen.queryByTestId('rd-quant-option-E')).toBeNull()
      key('a', { shiftKey: true })
      expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'true')
      key('Escape')
      key('2')
      expect(exit).not.toHaveBeenCalled()
      key('b')
      expect(screen.getByTestId('rd-quant-option-B')).toHaveAttribute('aria-pressed', 'true')
      key(' ')
      expect(lock).toHaveBeenCalledTimes(1)
      // The controller grades: its verdict stands, even on the right letter.
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
      expect(screen.getByTestId('rd-spar')).toHaveTextContent('Lagd i Repetera')
      key('Enter')
      expect(screen.getByTestId('rd-quant-option-A')).toHaveTextContent('I är större än II')
    })

    it('keeps the hint folded until asked for, and shows a verdict without an explanation', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      const tactic = data.drills.quant.explanations[xyz.qid]?.pregrade_tactic
      if (!tactic) throw new Error('the fixture XYZ has a tactic')
      mount(6, { data })
      expect(screen.queryByText(tactic.handle, { exact: false })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Taktik' }))
      expect(screen.getByText(`${tactic.handle}.`)).toBeInTheDocument()
    })

    it('stands without an explanation', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      data.drills.quant.explanations[xyz.qid] = null
      mount(6, { data })
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
      expect(screen.getByText('Förklaring saknas ännu för den här frågan.')).toBeInTheDocument()
      expect(screen.queryByTestId('rd-technique')).toBeNull()
    })

    it('ends with the plan’s next step and the way back to Öva', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      data.drills.quant.questions = [xyz]
      const openPlanItem = vi.fn()
      const go = vi.fn()
      const next = vi.fn()
      mount(6, {
        data,
        actions: { openPlanItem, go, drill: { lock: () => ({ correct: true }), next } },
      })
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
      expect(next).toHaveBeenCalledWith(null)
      const done = screen.getByTestId('rd-done')
      expect(done).toHaveTextContent('Kvantitativ övning är klar')
      expect(done).toHaveTextContent('1 av 1 rätt')
      const plan = data.home.plan.items[0]
      fireEvent.click(
        within(done).getByRole('button', {
          name: `Fortsätt med ${plan.title} · ${plan.minutes} min`,
        }),
      )
      expect(openPlanItem).toHaveBeenCalledWith(plan.id)
      fireEvent.click(within(done).getByRole('button', { name: 'Tillbaka till Öva' }))
      expect(go).toHaveBeenCalledWith('ova')
    })

    it('takes the step its end shows with Enter too, past the repetition just done', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      data.drills.quant.questions = [xyz]
      data.drills.quant.request = { kind: 'repetition' }
      const [rep, after] = data.home.plan.items
      expect(rep).toMatchObject({ kind: 'repetition', completed: false })
      expect(after.completed).toBe(false)
      const openPlanItem = vi.fn()
      mount(6, { data, actions: { openPlanItem } })
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
      const done = screen.getByTestId('rd-done')
      expect(done).toHaveTextContent('Repetition klar')
      const pill = within(done).getByRole('button', {
        name: `Fortsätt med ${after.title} · ${after.minutes} min`,
      })
      key('Enter')
      expect(openPlanItem).toHaveBeenCalledTimes(1)
      expect(openPlanItem).toHaveBeenLastCalledWith(after.id)
      fireEvent.click(pill)
      expect(openPlanItem).toHaveBeenLastCalledWith(after.id)
      expect(openPlanItem).not.toHaveBeenCalledWith(rep.id)
    })

    it('goes back with Enter when the repetition just done was the plan’s only step', () => {
      const data = clone()
      const [xyz] = data.drills.quant.questions
      data.drills.quant.questions = [xyz]
      data.drills.quant.request = { kind: 'repetition' }
      const rep = data.home.plan.items.find((i) => i.kind === 'repetition')
      if (!rep) throw new Error('the fixture plan has a repetition step')
      data.home.plan.items = [rep]
      const openPlanItem = vi.fn()
      const go = vi.fn()
      mount(6, { data, actions: { openPlanItem, go } })
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveAccessibleName('Tillbaka till Öva')
      key('Enter')
      expect(go).toHaveBeenCalledWith('ova')
      expect(openPlanItem).not.toHaveBeenCalled()
    })

    const widths = ['desktop', 'phone'] as const
    it.each(widths)('turns to a cited paragraph of a passage across sections (%s)', (width) => {
      const { data, q } = passageRound()
      mount(6, { data, width })
      const wrong = q.options?.find((o) => o.letter !== q.answer)?.letter ?? 'A'
      fireEvent.click(screen.getByTestId(`rd-quant-option-${wrong}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      const para = document.querySelector<HTMLElement>('.sp-qpara[data-n="6"]')
      if (!para) throw new Error('the passage shows its sixth paragraph')
      expect(para).toHaveAttribute('data-cited', 'true')
      expect(para).toHaveAttribute('data-flash', 'false')
      const column = para.closest<HTMLElement>(width === 'phone' ? '.sp-qpscroll' : '.sp-qscroll')
      if (!column) throw new Error('the passage sits in the drill’s column')
      // The layout jsdom lacks: the column scrolls and is 400 px tall,
      // paragraph 6 lies 900 px down it.
      column.style.overflowY = 'auto'
      const scrollTo = vi.fn()
      column.scrollTo = scrollTo
      vi.spyOn(column, 'getBoundingClientRect').mockReturnValue(rect(0, 400))
      vi.spyOn(para, 'getBoundingClientRect').mockReturnValue(rect(900, 60))
      const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0)
        return 0
      })
      try {
        fireEvent.click(within(screen.getByTestId('rd-step-2')).getByTestId('rd-cite-6'))
      } finally {
        frame.mockRestore()
      }
      // Centred in the column: 900 − (400 − 60) / 2.
      expect(scrollTo).toHaveBeenCalledWith({ top: 730, behavior: 'smooth' })
      expect(para).toHaveAttribute('data-flash', 'true')
      // The step's two quotations are marked where they stand.
      expect(para.querySelectorAll('mark')).toHaveLength(2)
      if (width === 'desktop') {
        // As on Läsfråga, Facit drops below half to leave the text in view.
        expect(document.querySelector('.sp-fsheet')).toHaveAttribute('data-state', 'half')
      }
    })

    it('marks a repetition: the REP chip, and the schedule in the verdict', () => {
      const data = clone()
      data.drills.quant.request = { kind: 'repetition' }
      mount(6, { data })
      expect(screen.getByTitle('Repetition')).toHaveTextContent('REP')
      const [xyz] = data.drills.quant.questions
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(screen.getByTestId('rd-verdict')).toHaveTextContent('Den flyttas fram')
    })

    it('answers from the phone’s sticky bar, then rises Facit as the edge sheet', () => {
      mount(6, { width: 'phone' })
      const [xyz] = FIXTURE_DATA.drills.quant.questions
      expect(screen.getByTestId('rd-lock')).toBeDisabled()
      fireEvent.click(screen.getByTestId(`rd-quant-option-${xyz.answer}`))
      expect(screen.getByText(`Ditt val: ${xyz.answer}`)).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'open')
      fireEvent.click(screen.getByRole('button', { name: 'Visa uppgiften' }))
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
    })
  })

  describe('DTK', () => {
    it('keeps the question unanswerable while its page has failed, then retries', () => {
      const lock = vi.fn(() => ({ correct: true }))
      mount(7, { actions: { drill: { lock } } })
      const figure = screen.getByTestId('rd-figure')
      fireEvent.error(within(figure).getByRole('img'))
      expect(screen.getByText('Sidan gick inte att hämta.')).toBeInTheDocument()
      expect(screen.getByText('Frågan behöver sidan.')).toBeInTheDocument()
      expect(screen.getByTestId('rd-quant-option-A')).toBeDisabled()
      key('a')
      key('Enter')
      expect(lock).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
      loadImages()
      expect(screen.getByTestId('rd-quant-option-A')).toBeEnabled()
      fireEvent.click(screen.getByTestId('rd-quant-option-C'))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(lock).toHaveBeenCalledTimes(1)
    })

    it('takes no answer before its page is on screen: loading, after a retry, then the same page', () => {
      const lock = vi.fn(() => ({ correct: true }))
      const data = clone()
      const [q] = data.drills.dtk.questions
      data.drills.dtk.questions = [q, { ...q, qid: `${q.qid}-2`, number: q.number + 1 }]
      mount(7, { data, actions: { drill: { lock } } })
      const option = () => screen.getByTestId('rd-quant-option-A')
      // Still loading: nothing to choose or answer yet.
      expect(option()).toBeDisabled()
      key('a')
      key('Enter')
      expect(option()).toHaveAttribute('aria-pressed', 'false')
      expect(lock).not.toHaveBeenCalled()
      // Failed, then retried: loading again, and still closed.
      fireEvent.error(within(screen.getByTestId('rd-figure')).getByRole('img'))
      fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
      expect(screen.queryByText('Frågan behöver sidan.')).toBeNull()
      expect(option()).toBeDisabled()
      key('a')
      key('Enter')
      expect(lock).not.toHaveBeenCalled()
      // On screen: answerable.
      loadImages()
      expect(option()).toBeEnabled()
      key(q.answer.toLowerCase())
      key('Enter')
      expect(lock).toHaveBeenCalledTimes(1)
      // The next question on the same page needs no new load.
      key('Enter')
      expect(screen.getByText('Fråga 2 av 2 på den här sidan')).toBeInTheDocument()
      expect(option()).toBeEnabled()
      key('a')
      key('Enter')
      expect(lock).toHaveBeenCalledTimes(2)
    })

    it('keeps the phone’s sheet and the viewer’s strip closed to answers until the page is on screen', () => {
      const lock = vi.fn(() => ({ correct: true }))
      const { unmount } = mount(7, { width: 'phone', actions: { drill: { lock } } })
      fireEvent.click(screen.getByRole('button', { name: /Visa alternativen/ }))
      expect(screen.getByTestId('rd-quant-option-A')).toBeDisabled()
      key('a')
      key('Enter')
      expect(lock).not.toHaveBeenCalled()
      loadImages()
      fireEvent.click(screen.getByTestId('rd-quant-option-A'))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(lock).toHaveBeenCalledTimes(1)
      unmount()
      mount(7, { actions: { drill: { lock } } })
      fireEvent.click(screen.getByRole('button', { name: /^Förstora/ }))
      const viewer = screen.getByRole('dialog', { name: 'Förstorad sida' })
      expect(within(viewer).getByRole('button', { name: /Alternativ A/ })).toBeDisabled()
      key('a')
      key('Enter')
      expect(lock).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('dialog', { name: 'Förstorad sida' })).toBeInTheDocument()
      loadImages()
      fireEvent.click(within(viewer).getByRole('button', { name: /Alternativ A/ }))
      key('Enter')
      expect(lock).toHaveBeenCalledTimes(2)
      expect(screen.queryByRole('dialog', { name: 'Förstorad sida' })).toBeNull()
    })

    it('says so when the page is missing', () => {
      const data = clone()
      data.drills.dtk.questions[0].figure = null
      mount(7, { data })
      expect(screen.getByText('Sidan saknas.')).toBeInTheDocument()
      expect(screen.getByTestId('rd-quant-option-A')).toBeDisabled()
    })

    it('fits the page to its width or whole, and turns it', () => {
      mount(7)
      const fit = screen.getByRole('group', { name: 'Visa sidan' })
      expect(within(fit).getByRole('radio', { name: 'Bredd' })).toBeChecked()
      fireEvent.click(within(fit).getByRole('radio', { name: 'Hela sidan' }))
      expect(within(fit).getByRole('radio', { name: 'Hela sidan' })).toBeChecked()
      expect(within(fit).getByRole('radio', { name: 'Bredd' })).not.toBeChecked()
      fireEvent.click(screen.getByRole('button', { name: 'Rotera sidan' }))
      expect(screen.getByTestId('rd-figure')).toHaveAttribute('data-turned', 'true')
    })

    it('opens the viewer: zoom, keys kept from the switcher, the question at hand, focus back', () => {
      const lock = vi.fn(() => ({ correct: true }))
      mount(7, { actions: { drill: { lock } } })
      // The page is on screen, so its question takes answers.
      loadImages()
      const opener = screen.getByRole('button', { name: /^Förstora/ })
      opener.focus()
      fireEvent.click(opener)
      const viewer = screen.getByRole('dialog', { name: 'Förstorad sida' })
      expect(within(viewer).getByRole('button', { name: /Stäng/ })).toHaveFocus()
      fireEvent.click(within(viewer).getByRole('button', { name: 'Zooma in' }))
      expect(within(viewer).getByText('150 %')).toBeInTheDocument()
      const switcher = vi.fn()
      window.addEventListener('keydown', (e) => {
        if (!e.defaultPrevented) switcher(e.key)
      })
      key('ArrowRight')
      expect(switcher).not.toHaveBeenCalled()
      key('-')
      expect(within(viewer).getByText('100 %')).toBeInTheDocument()
      // Answering while zoomed: the strip's options and Svara.
      fireEvent.click(within(viewer).getByRole('button', { name: /Alternativ C/ }))
      expect(screen.getByTestId('rd-quant-option-C')).toHaveAttribute('aria-pressed', 'true')
      key('Escape')
      expect(screen.queryByRole('dialog', { name: 'Förstorad sida' })).toBeNull()
      expect(opener).toHaveFocus()
      expect(lock).not.toHaveBeenCalled()
    })

    it('peeks the page’s question sheet on phone with the whole question', () => {
      mount(7, { width: 'phone' })
      const sheet = screen.getByTestId('rd-sheet')
      expect(sheet).toHaveAttribute('data-state', 'peek')
      const [q] = FIXTURE_DATA.drills.dtk.questions
      expect(within(sheet).getByTestId('rd-quant-prompt')).toHaveTextContent(q.prompt ?? '')
      fireEvent.click(within(sheet).getByRole('button', { name: /Visa alternativen/ }))
      expect(sheet).toHaveAttribute('data-state', 'open')
    })
  })

  describe('Läsfråga (kit v2)', () => {
    it('reads its session from the context and is graded by the controller', () => {
      const data = clone()
      const session = data.drills.reading
      const q = session.questions[session.start.index ?? 0]
      if (q.passage) q.passage.paragraphs = ['Den tillförda texten.', 'Ett andra stycke.']
      q.prompt = 'Vad säger den tillförda texten?'
      session.elapsedSeconds = undefined
      session.explanations[q.qid] = null
      const lock = vi.fn(() => ({ correct: false }))
      const { onScreen } = mount(2, { data, actions: { drill: { lock } } })
      expect(screen.getByTestId('rd-passage')).toHaveTextContent('Den tillförda texten.')
      expect(screen.getByRole('heading', { name: q.prompt })).toBeInTheDocument()
      // Resumed mid-sitting without its own seconds: no clock from zero.
      expect(screen.queryByRole('timer')).toBeNull()
      fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      expect(lock).toHaveBeenCalledWith(expect.objectContaining({ qid: q.qid }), q.answer)
      expect(onScreen).toHaveBeenCalledWith(3)
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
      expect(screen.getByText('Förklaring saknas ännu för den här frågan.')).toBeInTheDocument()
    })

    it('links the framework into Uppslag from Facit', () => {
      const openLesson = vi.fn()
      mount(3, { actions: { openLesson } })
      fireEvent.click(screen.getByRole('button', { name: /Slå upp i Uppslag/ }))
      expect(openLesson).toHaveBeenCalledWith(expect.stringMatching(/^LAS-/))
    })

    it('advances with Space only once there is something to advance', () => {
      const lock = vi.fn(() => ({ correct: true }))
      mount(2, { actions: { drill: { lock } } })
      key(' ')
      expect(lock).not.toHaveBeenCalled()
      key('a')
      act(() => {
        key(' ')
      })
      expect(lock).toHaveBeenCalledTimes(1)
    })
  })
})

// ── Batch 2: Provpass, Provpassresultat, Framsteg ────────────────────

/** Starts the hub's pass: "Starta provpasset", then the rules' "Starta nu". */
function startPass() {
  fireEvent.click(screen.getByTestId('rd-prov-start'))
  fireEvent.click(screen.getByTestId('rd-confirm'))
}

/** Screen 9 on a stage whose data can change under it (a provider that
 *  ticks, a list that shrinks). */
function mountLive(
  data: DirectionData,
  actions: Partial<DirectionActions> = {},
  width: DirectionProps['width'] = 'desktop',
) {
  const tree = (d: DirectionData) => (
    <DirectionDataProvider data={d} actions={actions}>
      <Spar screen={9} width={width} theme="light" live onScreen={vi.fn()} onTheme={vi.fn()} />
    </DirectionDataProvider>
  )
  const utils = render(tree(data))
  return { ...utils, update: (d: DirectionData) => utils.rerender(tree(d)) }
}

const cell = (n: number) => screen.getByTestId(`rd-prov-cell-${n}`)
const running = () => screen.getByTestId('rd-prov-running')

/** The overview's stop for question `n`: jump there. */
function goToQuestion(n: number) {
  fireEvent.click(screen.getByRole('button', { name: 'Översikt' }))
  fireEvent.click(cell(n))
}

/** The bake-off page itself: the selection is its state, as on the route. */
function BakeoffPage({
  initial,
  onSelect,
}: {
  initial: Selection
  onSelect: (next: Partial<Selection>) => void
}) {
  const [sel, setSel] = useState(initial)
  return (
    <Redesign2026Bakeoff
      sel={sel}
      onSelect={(next) => {
        onSelect(next)
        setSel((s) => ({ ...s, ...next }))
      }}
    />
  )
}

/** Spår's Provpass hub on the bake-off's desktop stage. */
const BAKEOFF_9: Selection = { d: 'c', s: 9, w: 'desktop', t: 'light', sbs: false, bare: false }

/** Runs `body` with the bake-off's stage measuring a 1440 × 848 window. */
async function onDesktopStage(body: () => Promise<void>) {
  const width = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
  const height = vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
  try {
    await body()
  } finally {
    width.mockRestore()
    height.mockRestore()
  }
}

/** A route that cannot open the result: the bake-off's own submitProvpass
 *  (its move to screen 10) throws. `handIns` counts its tries. */
function failingRoute() {
  const onSelect = vi.fn((next: Partial<Selection>) => {
    if (next.s === 10) throw new Error('Inlämningen nådde inte fram')
  })
  return { onSelect, handIns: () => onSelect.mock.calls.filter(([n]) => n.s === 10).length }
}

/**
 * A hand-in the host could not take: one try, the error in the runner and
 * no result (the host is still on 9), no dialog, the frame's navigation
 * back, focus on the way out, and the switcher's keys reach the host again
 * ("3" picks Spår, which stays mounted).
 */
function expectFailedHandIn(route: ReturnType<typeof failingRoute>) {
  expect(route.handIns()).toBe(1)
  expect(screen.getByRole('alert')).toHaveTextContent('Inlämningen gick inte fram.')
  expect(running()).toBeInTheDocument()
  expect(screen.queryByTestId('rd-prov-result')).toBeNull()
  expect(screen.queryByText(/lämnades in automatiskt/)).toBeNull()
  expect(screen.getByTestId('rb26-stage')).toHaveAttribute('data-screen', '9')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByTestId('rd-nav-idag')).toBeInTheDocument()
  const out = screen.getByRole('button', { name: 'Till Provpass' })
  expect(out).toHaveFocus()
  fireEvent.keyDown(out, { key: '3' })
  expect(route.onSelect).toHaveBeenLastCalledWith({ d: 'c', sbs: false })
  expect(running()).toBeInTheDocument()
}

/** A handed-in pass as the app reduces it (lib/mock computeMockSummary) and
 *  the kit views it (provResultView): `plan` in the order it ran, `picks`
 *  the letters given; a question without a pick is blank. */
function reducedResult(
  plan: readonly Question[],
  picks: Readonly<Record<string, AnswerLetter>>,
  pass: Pick<MockResultRow, 'mode' | 'examId' | 'provpass'> = {
    mode: 'authentic',
    examId: 'host-2025',
    provpass: 'kvant1',
  },
): ProvResultView {
  const sheet = new Map<string, { letter: string | null; timeMs: number }>()
  for (const q of plan) {
    const letter = picks[q.qid]
    if (letter) sheet.set(q.qid, { letter, timeMs: 60_000 })
  }
  const summary = computeMockSummary([...plan], sheet)
  const row: MockResultRow = {
    id: 401,
    userId: 1,
    sessionId: 5001,
    half: 'kvant',
    ...pass,
    presented: summary.presented,
    answered: summary.answered,
    correct: summary.correct,
    seenBefore: 0,
    durationMs: 3_000_000,
    breakdown: summary.breakdown,
    createdAt: '2026-10-09T13:58:00.000Z',
  }
  return provResultView(row, [row], NORMERING, new Date('2026-10-09T14:00:00.000Z'))
}

/** Every question of `plan` answered right. */
function rightPicks(plan: readonly Question[]): Record<string, AnswerLetter> {
  return Object.fromEntries(plan.map((q) => [q.qid, q.answer]))
}

/** A letter of `q` that is not its answer. */
function wrongPick(q: Question): AnswerLetter {
  const letter = q.options?.find((o) => o.letter !== q.answer)?.letter
  if (!letter) throw new Error(`${q.qid} has no wrong option`)
  return letter
}

/** Screen 10 showing `result`. */
function mountResult(result: ProvResultView) {
  const data = clone()
  data.provpass.result = result
  return mount(10, { data })
}

/** Nothing on the result calls a question right, or missed, one by one:
 *  the result keeps no ordered per-question outcomes. */
function expectNoQuestionVerdicts() {
  const page = screen.getByTestId('rd-prov-result')
  expect(
    page.querySelectorAll('.sp-stop[data-state="right"], .sp-stop[data-state="miss"]'),
  ).toHaveLength(0)
  expect(within(page).queryByRole('img', { name: /Missade frågor|rätt\./ })).toBeNull()
}

/** A host that moves: handing in shows screen 10, and opening a result
 *  shows it there (from `results`, by id). */
function ResultHost({
  initial,
  results,
}: {
  initial: DirectionData
  results: Readonly<Record<string, ProvResultView>>
}) {
  const [shown, setShown] = useState<DirectionProps['screen']>(9)
  const [data, setData] = useState(initial)
  const actions = useMemo<Partial<DirectionActions>>(
    () => ({
      submitProvpass: () => setShown(10),
      openProvResult: (id) => {
        setData((d) => ({ ...d, provpass: { ...d.provpass, result: results[id] } }))
        setShown(10)
      },
    }),
    [results],
  )
  return (
    <DirectionDataProvider data={data} actions={actions}>
      <Spar
        screen={shown}
        width="desktop"
        theme="light"
        live
        onScreen={setShown}
        onTheme={vi.fn()}
      />
    </DirectionDataProvider>
  )
}

describe('Spår: Provpass, Provpassresultat and Framsteg', () => {
  beforeAll(stubLayout)
  const { hub, result } = FIXTURE_DATA.provpass

  describe('Provpass · the hub', () => {
    it('leads with the suggested pass of the half that is next: its route, what you have seen, one green pill', () => {
      mount(9)
      const suggested = hub.passes.find((p) => p.suggested && p.half === hub.half)
      if (!suggested) throw new Error('the hub suggests a pass')
      expect(screen.getByRole('heading', { level: 1, name: 'Hela sträckan' })).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { level: 2, name: `${suggested.sitting} · ${suggested.pass}` }),
      ).toBeInTheDocument()
      expect(screen.getByText('Föreslås · minst sett')).toBeInTheDocument()
      expect(
        screen.getByRole('img', {
          name: 'Kvantitativ: XYZ fråga 1–12, KVA 13–22, NOG 23–28, DTK 29–40',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          `Du har sett ${suggested.seenBefore} av ${suggested.presented} frågor tidigare.`,
        ),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Kvant står på tur om en dag. Ditt senaste pass var för sex dagar sedan.'),
      ).toBeInTheDocument()
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent('Starta provpasset')
      expect(screen.getByTestId(`rd-prov-pass-${suggested.id.replace(':', '-')}`)).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    it('lists the half’s sittings newest first; the pass chosen there is the one that starts', () => {
      const startProvpass = vi.fn()
      mount(9, { actions: { startProvpass } })
      const reg = screen
        .getByRole('heading', { name: 'Alla provtillfällen · Kvantitativ' })
        .closest('section') as HTMLElement
      const sittings = Array.from(reg.querySelectorAll('.sp-prov-sitting-name')).map(
        (e) => e.textContent,
      )
      expect(sittings).toEqual(['Våren 2026', 'Hösten 2025'])
      const other = screen.getByRole('button', {
        name: 'Provpass 2, Våren 2026: du har sett 28 av 40',
      })
      fireEvent.click(other)
      expect(other).toHaveAttribute('aria-pressed', 'true')
      expect(
        screen.getByRole('heading', { level: 2, name: 'Våren 2026 · Provpass 2' }),
      ).toBeInTheDocument()
      expect(screen.getByText('Valt pass')).toBeInTheDocument()
      startPass()
      expect(startProvpass).toHaveBeenCalledWith('var-2026:kvant2')
    })

    it('switches the half: the other half’s suggestion, route and register', () => {
      mount(9)
      fireEvent.click(screen.getByTestId('rd-prov-half-verbal'))
      const verbal = hub.passes.find((p) => p.suggested && p.half === 'verbal')
      if (!verbal) throw new Error('the hub suggests a verbal pass')
      expect(
        screen.getByRole('heading', { level: 2, name: `${verbal.sitting} · ${verbal.pass}` }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('img', {
          name: 'Verbal: ORD fråga 1–10, LÄS 11–20, MEK 21–30, ELF 31–40',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Alla provtillfällen · Verbal' }),
      ).toBeInTheDocument()
    })

    it('grows the station into its rules in place: Esc is "Inte nu", nothing starts before "Starta nu"', () => {
      const startProvpass = vi.fn()
      mount(9, { actions: { startProvpass } })
      fireEvent.click(screen.getByTestId('rd-prov-start'))
      const head = screen.getByRole('heading', { name: /^Innan du startar/ })
      expect(head).toHaveFocus()
      for (const rule of [
        'Ingen paus.',
        'Du kan ändra svar tills tiden går ut.',
        'Avbryter du blir provet ogiltigt.',
        'Lämna ingen fråga obesvarad — fel ger inga avdrag.',
      ]) {
        expect(screen.getByText(rule)).toBeInTheDocument()
      }
      // In place, not a modal; still one green pill.
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(greenPills()).toHaveLength(1)
      fireEvent.keyDown(head, { key: 'Escape' })
      expect(screen.queryByText('Ingen paus.')).toBeNull()
      expect(screen.getByTestId('rd-prov-start')).toHaveFocus()
      expect(startProvpass).not.toHaveBeenCalled()
      // Enter opens the rules, Enter again starts.
      key('Enter')
      expect(screen.getByText('Ingen paus.')).toBeInTheDocument()
      expect(startProvpass).not.toHaveBeenCalled()
      key('Enter')
      expect(startProvpass).toHaveBeenCalledWith(FIXTURE_DATA.provpass.running.passId)
      expect(running()).toBeInTheDocument()
    })

    it('opens the rules as an edge sheet on phone that keeps focus inside and closes on Esc', async () => {
      const user = userEvent.setup()
      const startProvpass = vi.fn()
      mount(9, { width: 'phone', actions: { startProvpass } })
      const start = screen.getByTestId('rd-prov-start')
      await user.click(start)
      const sheet = screen.getByRole('dialog', { name: /^Innan du startar/ })
      expect(within(sheet).getByRole('heading', { name: /^Innan du startar/ })).toHaveFocus()
      const controls = within(sheet).getAllByRole('button')
      await user.tab({ shift: true })
      expect(controls[controls.length - 1]).toHaveFocus()
      await user.tab()
      expect(controls[0]).toHaveFocus()
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(start).toHaveFocus()
      expect(startProvpass).not.toHaveBeenCalled()
    })

    it('opens a recent result through the host', () => {
      const openProvResult = vi.fn()
      mount(9, { actions: { openProvResult } })
      const [latest] = hub.results
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(`${latest.correct} av ${latest.presented} rätt`),
        }),
      )
      expect(openProvResult).toHaveBeenCalledWith(latest.id)
    })

    it('names a first pass and leaves out what it does not have', () => {
      const data = clone()
      data.provpass.hub.results = []
      data.provpass.hub.prescription = null
      mount(9, { data })
      expect(screen.getByText('Ditt första provpass')).toBeInTheDocument()
      expect(
        screen.getByText('Ett första pass ger en baslinje att jämföra med.'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Dina senaste pass' })).toBeNull()
      expect(screen.getByTestId('rd-spar')).not.toHaveTextContent(/står på tur|undefined|NaN/)
    })

    it('says when a half has no real passes and offers the other half as the green step', () => {
      const data = clone()
      data.provpass.hub.passes = data.provpass.hub.passes.filter((p) => p.half !== 'kvant')
      mount(9, { data })
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Inga riktiga pass för kvantitativ just nu',
        }),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('rd-prov-start')).toBeNull()
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      fireEvent.click(pills[0])
      expect(screen.getByTestId('rd-prov-start')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Alla provtillfällen · Verbal' }),
      ).toBeInTheDocument()
    })

    it('falls back to the suggestion when the chosen pass leaves the list', () => {
      const { update } = mountLive(clone())
      fireEvent.click(screen.getByRole('button', { name: /^Provpass 2, Våren 2026/ }))
      const next = clone()
      next.provpass.hub.passes = next.provpass.hub.passes.filter((p) => p.id !== 'var-2026:kvant2')
      update(next)
      expect(
        screen.getByRole('heading', { level: 2, name: 'Hösten 2025 · Provpass 1' }),
      ).toBeInTheDocument()
    })
  })

  describe('Provpass · the running pass', () => {
    it('runs in a focus frame of its own: the clock, the count, calm enforced, nothing that grades', () => {
      mount(9)
      startPass()
      expect(screen.queryByTestId('rd-nav-idag')).toBeNull()
      expect(screen.getByTestId('rd-spar')).toHaveAttribute('data-calm', 'true')
      expect(screen.getByRole('timer')).toHaveTextContent('31:12')
      expect(running()).toHaveTextContent('Fråga 17 av 40')
      expect(screen.getByRole('img', { name: /, du är på fråga 17$/ })).toBeInTheDocument()
      expect(screen.queryByRole('switch')).toBeNull()
      expect(running()).not.toHaveTextContent(/Taktik|Rätt svar|Facit/)
      expect(screen.getByTestId('rd-option-A')).toBeEnabled()
    })

    it('answers by choosing — a click or a key, only the item’s letters — and moves on with Enter', () => {
      mount(9)
      startPass()
      expect(cell(17)).toHaveAttribute('data-answered', 'false')
      key('e')
      expect(cell(17)).toHaveAttribute('data-answered', 'false')
      // Space scrolls until there is an answer to move on from.
      key(' ')
      expect(running()).toHaveTextContent('Fråga 17 av 40')
      key('b')
      expect(cell(17)).toHaveAttribute('data-answered', 'true')
      expect(screen.getByTestId('rd-option-B')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText('Ditt svar: B')).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-option-C'))
      expect(screen.getByText('Ditt svar: C')).toBeInTheDocument()
      key('Enter')
      expect(running()).toHaveTextContent('Fråga 18 av 40')
      expect(cell(18)).toHaveAttribute('data-current', 'true')
      fireEvent.click(screen.getByRole('button', { name: /Föregående/ }))
      expect(running()).toHaveTextContent('Fråga 17 av 40')
      expect(screen.getByTestId('rd-option-C')).toHaveAttribute('aria-pressed', 'true')
      // Esc never leaves a pass.
      key('Escape')
      expect(running()).toBeInTheDocument()
    })

    it('takes no answer before a required page has loaded; the same page is ready at once, a new one waits', () => {
      mount(9)
      startPass()
      goToQuestion(29)
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(running()).toHaveTextContent('Fråga 29 av 40')
      expect(screen.getByTestId('rd-option-A')).toBeDisabled()
      key('a')
      expect(cell(29)).toHaveAttribute('data-answered', 'false')
      fireEvent.load(screen.getByRole('img', { name: 'Underlag till uppgift 29' }))
      expect(screen.getByTestId('rd-option-A')).toBeEnabled()
      key('a')
      expect(cell(29)).toHaveAttribute('data-answered', 'true')
      // 30 is on the same page: ready without a new load.
      key('Enter')
      expect(running()).toHaveTextContent('Fråga 30 av 40')
      expect(screen.getByTestId('rd-option-A')).toBeEnabled()
      // 32 is on the next page: it waits for its own.
      key('Enter')
      key('Enter')
      expect(running()).toHaveTextContent('Fråga 32 av 40')
      expect(screen.getByTestId('rd-option-A')).toBeDisabled()
      // Moving on never waits.
      expect(screen.getByRole('button', { name: /Nästa fråga/ })).toBeEnabled()
    })

    it('says a failed page and retries it; a failure is forgotten once its page has left', () => {
      mount(9)
      startPass()
      goToQuestion(29)
      fireEvent.error(screen.getByRole('img', { name: 'Underlag till uppgift 29' }))
      expect(screen.getByText('Sidan gick inte att hämta.')).toBeInTheDocument()
      expect(screen.getByText('Frågan behöver sidan.')).toBeInTheDocument()
      expect(screen.getByTestId('rd-option-A')).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
      expect(screen.queryByText('Sidan gick inte att hämta.')).toBeNull()
      // Retrying is still waiting.
      expect(screen.getByTestId('rd-option-A')).toBeDisabled()
      fireEvent.error(screen.getByRole('img', { name: 'Underlag till uppgift 29' }))
      goToQuestion(32)
      expect(screen.queryByText('Sidan gick inte att hämta.')).toBeNull()
      goToQuestion(29)
      expect(screen.queryByText('Sidan gick inte att hämta.')).toBeNull()
      expect(screen.getByTestId('rd-option-A')).toBeDisabled()
    })

    it('takes no answer from a zoomed page until its own new image has loaded; a cached one is ready at once', () => {
      mount(9)
      startPass()
      goToQuestion(29)
      const page = () => screen.getByRole('img', { name: 'Underlag till uppgift 29' })
      const first = page()
      fireEvent.load(first)
      expect(screen.getByTestId('rd-option-A')).toBeEnabled()
      // Z moves the page into a pan region of its own: a new image element,
      // not yet loaded, so the question waits for it — clicks and letters.
      key('z')
      expect(page()).not.toBe(first)
      expect(screen.getByTestId('rd-option-A')).toBeDisabled()
      fireEvent.click(screen.getByTestId('rd-option-A'))
      key('a')
      expect(cell(29)).toHaveAttribute('data-answered', 'false')
      fireEvent.load(page())
      expect(screen.getByTestId('rd-option-A')).toBeEnabled()
      key('a')
      expect(cell(29)).toHaveAttribute('data-answered', 'true')
      // Out of the zoom, the next new element is already complete (cached):
      // nothing to wait for.
      const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
      const natural = vi
        .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
        .mockReturnValue(1240)
      try {
        key('z')
        expect(page()).not.toBe(first)
        expect(screen.getByTestId('rd-option-B')).toBeEnabled()
      } finally {
        complete.mockRestore()
        natural.mockRestore()
      }
    })

    it('marks a question, and the overview finds the marks and the blanks', () => {
      mount(9)
      startPass()
      const flag = screen.getByTestId('rd-prov-flag')
      expect(flag).toHaveAttribute('aria-pressed', 'false')
      fireEvent.click(flag)
      expect(flag).toHaveAttribute('aria-pressed', 'true')
      const opener = screen.getByRole('button', { name: 'Översikt' })
      // A click focuses its button in a browser; fireEvent does not.
      opener.focus()
      fireEvent.click(opener)
      const overview = screen.getByRole('dialog', { name: /^Översikt/ })
      expect(within(overview).getByRole('heading', { name: /^Översikt/ })).toHaveFocus()
      expect(cell(17)).toHaveAccessibleName(
        'Fråga 17, Kvantitativa jämförelser, obesvarad, markerad, här',
      )
      expect(cell(17)).toHaveAttribute('aria-current', 'step')
      fireEvent.click(within(overview).getByRole('button', { name: 'Markerade (3)' }))
      expect(cell(9).closest('li')).not.toHaveAttribute('data-dim')
      expect(cell(1).closest('li')).toHaveAttribute('data-dim', 'true')
      fireEvent.click(within(overview).getByRole('button', { name: 'Obesvarade (24)' }))
      expect(cell(1).closest('li')).toHaveAttribute('data-dim', 'true')
      expect(cell(20).closest('li')).not.toHaveAttribute('data-dim')
      fireEvent.keyDown(overview, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(opener).toHaveFocus()
      fireEvent.click(opener)
      fireEvent.click(cell(20))
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(running()).toHaveTextContent('Fråga 20 av 40')
    })

    it('hands in once through its confirmation, then shows the result where the host does not move', () => {
      const submitProvpass = vi.fn()
      mount(9, { actions: { submitProvpass } })
      startPass()
      fireEvent.click(screen.getByTestId('rd-prov-submit'))
      const gate = screen.getByRole('dialog', { name: 'Lämna in provpasset?' })
      expect(gate).toHaveTextContent('24 frågor är obesvarade. Fel ger inga avdrag.')
      fireEvent.click(within(gate).getByRole('button', { name: 'Fortsätt svara' }))
      expect(submitProvpass).not.toHaveBeenCalled()
      fireEvent.click(screen.getByTestId('rd-prov-submit'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('rd-prov-running')).toBeNull()
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: `${result.correct} av ${result.presented} rätt`,
        }),
      ).toHaveFocus()
    })

    it('ends at the last question with "Granska och lämna in"', () => {
      mount(9)
      startPass()
      goToQuestion(40)
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent('Granska och lämna in')
      key('Enter')
      expect(screen.getByRole('dialog', { name: 'Lämna in provpasset?' })).toBeInTheDocument()
    })

    it('asks before voiding: "Fortsätt provpasset" is the default; voiding returns to the hub with its notice', () => {
      const submitProvpass = vi.fn()
      mount(9, { actions: { submitProvpass } })
      startPass()
      const abort = screen.getByTestId('sp-prov-abort')
      abort.focus()
      fireEvent.click(abort)
      const gate = screen.getByRole('dialog', { name: 'Avbryta provpasset?' })
      expect(within(gate).getByRole('button', { name: 'Fortsätt provpasset' })).toHaveFocus()
      fireEvent.keyDown(gate, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(abort).toHaveFocus()
      fireEvent.click(abort)
      fireEvent.click(screen.getByTestId('rd-confirm'))
      expect(screen.queryByTestId('rd-prov-running')).toBeNull()
      expect(screen.getByRole('status')).toHaveTextContent(
        'Provpasset avbröts och räknas inte. Det du svarat fel på ligger i Repetera.',
      )
      expect(screen.getByRole('heading', { level: 1, name: 'Hela sträckan' })).toHaveFocus()
      expect(submitProvpass).not.toHaveBeenCalled()
    })

    it('counts down while live, turns inverse ink at ten minutes and says so once', () => {
      vi.useFakeTimers()
      try {
        const data = clone()
        data.provpass.running.remainingSeconds = 602
        mount(9, { data })
        startPass()
        const clock = screen.getByRole('timer')
        expect(clock).toHaveTextContent('10:02')
        expect(clock).toHaveAttribute('data-low', 'false')
        act(() => {
          vi.advanceTimersByTime(2000)
        })
        expect(clock).toHaveTextContent('10:00')
        expect(clock).toHaveAttribute('data-low', 'true')
        expect(screen.getByText('10 minuter kvar')).toBeInTheDocument()
      } finally {
        vi.useRealTimers()
      }
    })

    it('turns the last five minutes into one step: answer the blanks', () => {
      const data = clone()
      data.provpass.running.remainingSeconds = 299
      mount(9, { data })
      startPass()
      expect(
        screen.getByText(/^5 minuter kvar\. 24 frågor är obesvarade — fel ger inga avdrag\./),
      ).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Visa dem' }))
      expect(screen.getByRole('dialog', { name: /^Översikt/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Obesvarade (24)' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    it('hands itself in once at 0:00 when its provider ticks, and never voids', () => {
      const submitProvpass = vi.fn()
      const actions = { submitProvpass }
      const at = (seconds: number) => {
        const d = clone()
        d.provpass.running.remainingSeconds = seconds
        return d
      }
      const { update } = mountLive(at(3), actions)
      startPass()
      update(at(2))
      update(at(1))
      expect(submitProvpass).not.toHaveBeenCalled()
      update(at(0))
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      update(at(0))
      update(at(-1))
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      expect(
        screen.getByText('Tiden tog slut, så passet lämnades in automatiskt.'),
      ).toBeInTheDocument()
      expect(screen.queryByText(/avbröts/)).toBeNull()
    })

    it('keeps "Tiden tog slut" on the result that timed out, never on another result opened after it', () => {
      vi.useFakeTimers()
      try {
        const data = clone()
        data.provpass.running.remainingSeconds = 2
        const timedOut = data.provpass.result
        const [earlier] = timedOut.history
        const other: ProvResultView = {
          ...timedOut,
          id: earlier.id,
          correct: earlier.correct,
          presented: earlier.presented,
          history: [
            {
              ...earlier,
              id: timedOut.id,
              correct: timedOut.correct,
              presented: timedOut.presented,
            },
          ],
        }
        render(
          <ResultHost initial={data} results={{ [timedOut.id]: timedOut, [other.id]: other }} />,
        )
        startPass()
        act(() => {
          vi.advanceTimersByTime(2500)
        })
        const notice = 'Tiden tog slut, så passet lämnades in automatiskt.'
        const title = (r: ProvResultView) =>
          screen.getByRole('heading', { level: 1, name: `${r.correct} av ${r.presented} rätt` })
        expect(title(timedOut)).toBeInTheDocument()
        expect(screen.getByText(notice)).toBeInTheDocument()
        // An earlier pass, opened on the same screen 10: it never timed out.
        fireEvent.click(within(screen.getByTestId('rd-prov-history-item-1')).getByRole('button'))
        expect(title(other)).toBeInTheDocument()
        expect(screen.queryByText(notice)).toBeNull()
        // The pass that did, opened again from there: the notice is its own.
        fireEvent.click(within(screen.getByTestId('rd-prov-history-item-1')).getByRole('button'))
        expect(title(timedOut)).toBeInTheDocument()
        expect(screen.getByText(notice)).toBeInTheDocument()
      } finally {
        vi.useRealTimers()
      }
    })

    it('neither resumes nor hands in a pass whose time is already up when it opens', () => {
      const submitProvpass = vi.fn()
      const at = (seconds: number) => {
        const d = clone()
        d.provpass.running.remainingSeconds = seconds
        return d
      }
      const { update } = mountLive(at(0), { submitProvpass })
      startPass()
      expect(
        screen.getByRole('heading', { level: 1, name: 'Det tidigare passet kan inte återupptas' }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('timer')).toBeNull()
      expect(screen.queryByTestId('rd-prov-submit')).toBeNull()
      // Decided once, as it opened: a provider still behind the clock
      // changes nothing.
      update(at(-30))
      expect(submitProvpass).not.toHaveBeenCalled()
      expect(screen.queryByText(/lämnades in automatiskt/)).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till Provpass' }))
      expect(screen.getByRole('heading', { level: 1, name: 'Hela sträckan' })).toBeInTheDocument()
      expect(screen.queryByRole('status')).toBeNull()
      expect(submitProvpass).not.toHaveBeenCalled()
    })

    it('keeps its place in range when the questions shrink, and starts over for a new sitting', () => {
      const { update } = mountLive(clone())
      startPass()
      expect(running()).toHaveTextContent('Fråga 17 av 40')
      const fewer = clone()
      fewer.provpass.running.questions = fewer.provpass.running.questions.slice(0, 10)
      update(fewer)
      expect(running()).toHaveTextContent('Fråga 10 av 10')
      expect(screen.queryByTestId('rd-prov-cell-11')).toBeNull()
      const next = clone()
      next.provpass.running.passId = 'var-2026:kvant1'
      next.provpass.running.current = 3
      update(next)
      expect(running()).toHaveTextContent('Fråga 4 av 40')
    })

    it('draws the phone overview five to a row, with one mark and one hand-in on screen', () => {
      mount(9, { width: 'phone' })
      startPass()
      expect(screen.getByTestId('rd-prov-grid').style.getPropertyValue('--sw-cols')).toBe('5')
      expect(screen.getAllByTestId('rd-prov-flag')).toHaveLength(1)
      expect(screen.getAllByTestId('rd-prov-submit')).toHaveLength(1)
      expect(screen.getByRole('timer')).toHaveTextContent('31:12')
    })

    it('keeps the bake-off’s switcher keys out of a running pass, whatever has focus', async () => {
      const width = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
      const height = vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(848)
      try {
        const onSelect = vi.fn()
        render(
          <BakeoffPage
            initial={{ d: 'c', s: 9, w: 'desktop', t: 'light', sbs: false, bare: false }}
            onSelect={onSelect}
          />,
        )
        await screen.findByTestId('rd-spar', {}, { timeout: 5000 })
        startPass()
        expect(running()).toBeInTheDocument()
        onSelect.mockClear()
        const flag = screen.getByTestId('rd-prov-flag')
        flag.focus()
        for (const k of ['2', '0', 'ArrowRight', 'ArrowLeft']) fireEvent.keyDown(flag, { key: k })
        fireEvent.click(screen.getByRole('button', { name: 'Översikt' }))
        const stop = cell(5)
        stop.focus()
        for (const k of ['3', 'ArrowLeft']) fireEvent.keyDown(stop, { key: k })
        expect(onSelect).not.toHaveBeenCalled()
        expect(running()).toBeInTheDocument()
        // Handing in moves the host to the result.
        fireEvent.keyDown(screen.getByRole('dialog', { name: /^Översikt/ }), { key: 'Escape' })
        fireEvent.click(screen.getByTestId('rd-prov-submit'))
        fireEvent.click(screen.getByTestId('rd-confirm'))
        expect(onSelect).toHaveBeenCalledWith({ s: 10 })
        expect(
          screen.getByRole('heading', {
            level: 1,
            name: `${result.correct} av ${result.presented} rätt`,
          }),
        ).toBeInTheDocument()
      } finally {
        width.mockRestore()
        height.mockRestore()
      }
    })

    it('keeps a hand-in the host could not take in the runner: the error, the answers read-only, the keys back, no second try', async () => {
      const route = failingRoute()
      await onDesktopStage(async () => {
        render(<BakeoffPage initial={BAKEOFF_9} onSelect={route.onSelect} />)
        await screen.findByTestId('rd-spar', {}, { timeout: 5000 })
        startPass()
        key('b')
        fireEvent.click(screen.getByTestId('rd-prov-submit'))
        fireEvent.click(screen.getByTestId('rd-confirm'))
        expectFailedHandIn(route)
        // The answers stay in view and cannot change.
        expect(screen.getByTestId('rd-option-B')).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByTestId('rd-option-B')).toBeDisabled()
        key('c')
        expect(screen.getByTestId('rd-option-B')).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText('Ditt svar: B')).toBeInTheDocument()
        // Nothing hands the pass in again: no button, and no key.
        expect(screen.queryByTestId('rd-prov-submit')).toBeNull()
        expect(screen.queryByRole('timer')).toBeNull()
        key('Enter')
        expect(screen.queryByRole('dialog')).toBeNull()
        expect(route.handIns()).toBe(1)
        // The way out: the hub, with the frame around it.
        fireEvent.click(screen.getByRole('button', { name: 'Till Provpass' }))
        expect(screen.getByRole('heading', { level: 1, name: 'Hela sträckan' })).toBeInTheDocument()
        expect(screen.queryByText(/avbröts/)).toBeNull()
        expect(route.handIns()).toBe(1)
      })
    })

    it('keeps a hand-in at 0:00 the host could not take in the runner; the clock never tries again', async () => {
      const route = failingRoute()
      await onDesktopStage(async () => {
        render(<BakeoffPage initial={BAKEOFF_9} onSelect={route.onSelect} />)
        await screen.findByTestId('rd-spar', {}, { timeout: 5000 })
        startPass()
        // The time runs out: one tick of the clock lands past 0:00.
        const now = Date.now()
        const clock = vi.spyOn(Date, 'now').mockReturnValue(now + 32 * 60_000)
        try {
          await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
          expectFailedHandIn(route)
          await act(() => new Promise((done) => setTimeout(done, 600)))
          expect(route.handIns()).toBe(1)
        } finally {
          clock.mockRestore()
        }
        // The frame's navigation works again: Idag, through the host.
        fireEvent.click(screen.getByTestId('rd-nav-idag'))
        expect(route.onSelect).toHaveBeenLastCalledWith({ s: 1 })
        expect(route.handIns()).toBe(1)
      })
    })

    it('brings the navbar back on phone when a hand-in fails, with the answers in view', () => {
      const submitProvpass = vi.fn(() => {
        throw new Error('Inlämningen nådde inte fram')
      })
      const go = vi.fn()
      mount(9, { width: 'phone', actions: { submitProvpass, go } })
      startPass()
      key('b')
      fireEvent.click(screen.getByTestId('rd-prov-submit'))
      fireEvent.click(screen.getByTestId('rd-confirm'))
      expect(submitProvpass).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('alert')).toHaveTextContent('Inlämningen gick inte fram.')
      expect(screen.queryByTestId('rd-prov-result')).toBeNull()
      expect(screen.getByTestId('rd-option-B')).toBeDisabled()
      expect(screen.getByTestId('rd-option-B')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.queryByTestId('rd-prov-flag')).toBeNull()
      expect(screen.queryByTestId('rd-prov-submit')).toBeNull()
      expect(screen.getByRole('button', { name: 'Till Provpass' })).toHaveFocus()
      const nav = screen.getByRole('navigation', { name: 'Huvudmeny' })
      expect(within(nav).getByTestId('rd-nav-provpass')).toHaveAttribute('aria-current', 'page')
      fireEvent.click(within(nav).getByTestId('rd-nav-framsteg'))
      expect(go).toHaveBeenCalledWith('framsteg')
      expect(screen.queryByTestId('rd-prov-running')).toBeNull()
      expect(submitProvpass).toHaveBeenCalledTimes(1)
    })
  })

  describe('Provpassresultat', () => {
    it('leads with the raw count, reads the legs in words and sends the misses to Repetera', () => {
      const openRepetera = vi.fn()
      mount(10, { actions: { openRepetera } })
      expect(screen.getByRole('heading', { level: 1, name: '27 av 40 rätt' })).toBeInTheDocument()
      expect(screen.getByText('Starkast på KVA, mest tid per fråga på NOG.')).toBeInTheDocument()
      expect(
        screen.getByText('Dina 11 fel ligger redan i Repetera. Två frågor lämnades obesvarade.'),
      ).toBeInTheDocument()
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent('Till Repetera')
      key('Enter')
      expect(openRepetera).toHaveBeenCalled()
    })

    it('gives the normed score with its basis, and each leg against its share of the time', () => {
      mount(10)
      const card = screen.getByTestId('rd-prov-score')
      expect(card).toHaveTextContent('Normerat (härlett)')
      expect(card).toHaveTextContent('Härlett ur UHR:s normeringstabell för detta provtillfälle.')
      expect(
        within(card).getByRole('img', { name: /^Normerat ungefär \d,\d på skalan 0 till 2,0$/ }),
      ).toBeInTheDocument()
      expect(card).not.toHaveTextContent(FIXTURE_DATA.copy.estimateCaveat)
      expect(screen.getByTestId('rd-prov-section-xyz')).toHaveTextContent(
        '8 av 12 · 17:30 av 16:30 · över budget',
      )
      expect(screen.getByTestId('rd-prov-section-kva')).toHaveTextContent(
        '7 av 10 · 12:00 av 13:45',
      )
      expect(screen.getByTestId('rd-prov-section-kva')).not.toHaveTextContent('över budget')
      expectNoQuestionVerdicts()
    })

    it('marks no question right in an all-blank pass: each leg’s count, nothing question by question', () => {
      const r = reducedResult(PASS_QUESTIONS, {})
      // The app's reducer leaves blanks out of the misses.
      expect(r.missed).toEqual([])
      mountResult(r)
      expect(screen.getByRole('heading', { level: 1, name: '0 av 40 rätt' })).toBeInTheDocument()
      expect(screen.getByText('40 frågor lämnades obesvarade.')).toBeInTheDocument()
      for (const [slug, n] of [
        ['xyz', 12],
        ['kva', 10],
        ['nog', 6],
        ['dtk', 12],
      ] as const) {
        expect(screen.getByTestId(`rd-prov-section-${slug}`)).toHaveTextContent(`0 av ${n}`)
      }
      expectNoQuestionVerdicts()
    })

    it('never moves a miss onto another question in a short pass', () => {
      // XYZ-001 could not be read, so 39 questions ran: KVA-013, the one
      // answered wrong, ran as the twelfth.
      const plan = PASS_QUESTIONS.filter((q) => !q.qid.endsWith('-XYZ-001'))
      const picks = rightPicks(plan)
      const missed = plan[11]
      expect(missed.qid).toBe('host-2025-kvant1-KVA-013')
      picks[missed.qid] = wrongPick(missed)
      const r = reducedResult(plan, picks)
      expect(r.missed).toEqual([missed.qid])
      mountResult(r)
      expect(screen.getByRole('heading', { level: 1, name: '38 av 39 rätt' })).toBeInTheDocument()
      expect(screen.getByText('1 fråga saknas ur detta pass — rättat av 39.')).toBeInTheDocument()
      expect(screen.getByTestId('rd-prov-section-xyz')).toHaveTextContent('11 av 11')
      expect(screen.getByTestId('rd-prov-section-kva')).toHaveTextContent('9 av 10')
      expectNoQuestionVerdicts()
    })

    it('claims nothing question by question for a generated pass drawn from several sittings', () => {
      // Its first question comes from Våren 2026, where it is number 12;
      // it is the one answered wrong.
      const [first, ...rest] = PASS_QUESTIONS
      const borrowed: Question = { ...first, qid: 'var-2026-kvant2-XYZ-012', exam_id: 'var-2026' }
      const plan = [borrowed, ...rest]
      const picks = rightPicks(plan)
      picks[borrowed.qid] = wrongPick(borrowed)
      const r = reducedResult(plan, picks, { mode: 'synthetic', examId: null, provpass: null })
      expect(r.missed).toEqual([borrowed.qid])
      mountResult(r)
      expect(screen.getByText('Provpass · Kvantitativ · genererat pass')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: '39 av 40 rätt' })).toBeInTheDocument()
      expect(screen.getByTestId('rd-prov-section-xyz')).toHaveTextContent('11 av 12')
      expectNoQuestionVerdicts()
    })

    it('opens earlier passes of the half through the host', () => {
      const openProvResult = vi.fn()
      mount(10, { actions: { openProvResult } })
      expect(
        screen.getByRole('heading', { name: 'Tidigare kvantitativa pass' }),
      ).toBeInTheDocument()
      fireEvent.click(within(screen.getByTestId('rd-prov-history-item-1')).getByRole('button'))
      expect(openProvResult).toHaveBeenCalledWith(result.history[0].id)
    })

    it('says each case the data brings and leaves out what it lacks', () => {
      const data = clone()
      const r = data.provpass.result
      r.score = { value: 1.1, derived: 'linear', label: 'skattad' }
      r.presented = 39
      r.answered = 39
      r.correct = 39
      r.trap = {
        frameworkId: 'KVA-TRAP-010',
        section: 'KVA',
        count: 3,
        headline: 'Kvantitet med en variabel',
      }
      r.history = []
      const go = vi.fn()
      const openLesson = vi.fn()
      mount(10, { data, actions: { go, openLesson } })
      const card = screen.getByTestId('rd-prov-score')
      expect(card).toHaveTextContent('Skattad poäng')
      expect(card).toHaveTextContent('Linjär skattning — indikativ, inte UHR-normerad.')
      expect(screen.getByText('1 fråga saknas ur detta pass — rättat av 39.')).toBeInTheDocument()
      expect(screen.getByText('Inga missar. Hela passet satt.')).toBeInTheDocument()
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      fireEvent.click(pills[0])
      expect(go).toHaveBeenCalledWith('idag')
      expect(screen.getByText('Det här är ditt första kvantitativa pass.')).toBeInTheDocument()
      expect(screen.getByText('Tre av dina missar föll i samma fälla.')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /Läs i Uppslag/ }))
      expect(openLesson).toHaveBeenCalledWith('KVA-TRAP-010')
      expect(screen.getByTestId('rd-spar')).not.toHaveTextContent(/undefined|NaN|Totalt/)
    })

    it('keeps the legs in the test’s order when the data comes alphabetical', () => {
      const data = clone()
      const r = data.provpass.result
      r.sections = [...r.sections].sort((a, b) => a.section.localeCompare(b.section))
      mount(10, { data })
      const legs = Array.from(document.querySelectorAll('[data-testid^="rd-prov-section-"]')).map(
        (el) => el.getAttribute('data-testid'),
      )
      expect(legs).toEqual([
        'rd-prov-section-xyz',
        'rd-prov-section-kva',
        'rd-prov-section-nog',
        'rd-prov-section-dtk',
      ])
      expect(screen.getByText('Starkast på KVA, mest tid per fråga på NOG.')).toBeInTheDocument()
    })

    it('puts the approved caveat on a pass with LÄS and ELF legs', () => {
      const data = clone()
      data.provpass.result.half = 'verbal'
      data.provpass.result.sections = (['ORD', 'LÄS', 'MEK', 'ELF'] as const).map((section) => ({
        section,
        presented: 10,
        correct: 7,
        timeSeconds: 800,
        quotaSeconds: 825,
      }))
      mount(10, { data })
      expect(screen.getByTestId('rd-prov-score')).toHaveTextContent(
        FIXTURE_DATA.copy.estimateCaveat,
      )
    })
  })

  describe('Framsteg', () => {
    it('sets the prognosis as the title, the week in words and the caveat; one green step up', () => {
      const startDrill = vi.fn()
      mount(11, { actions: { startDrill } })
      expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
        'Prognos: ungefär 1,4 av 2,0',
      )
      expect(
        screen.getByText(
          /^Prognosen steg \+0,1 den här veckan — 180 frågor med 70 % träffsäkerhet\. Verbal \(1,5\) drar ifrån kvant \(1,3\); mest att hämta finns i XYZ/,
        ),
      ).toBeInTheDocument()
      expect(screen.getAllByText(FIXTURE_DATA.copy.estimateCaveat).length).toBeGreaterThan(0)
      const steps = screen.getByRole('heading', { name: 'Nästa steg uppåt' }).closest('section')
      expect(steps).toHaveTextContent('Lägst just nu')
      expect(steps).toHaveTextContent('På väg ner')
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent('Öva XYZ · ca 8 min')
      key('Enter')
      expect(startDrill).toHaveBeenLastCalledWith({ kind: 'section', section: 'XYZ' })
    })

    it('reads every section in full and opens it in place to practise or look it up', () => {
      const startDrill = vi.fn()
      const go = vi.fn()
      mount(11, { actions: { startDrill, go } })
      const las = within(screen.getByTestId('rd-framsteg-section-las')).getByRole('button')
      expect(las).toHaveAccessibleName(
        /^Läsförståelse, \d,\d plus minus \d,\d, (uppåt|stilla|nedåt), 240 försök, (osäker|rimlig|säker)$/,
      )
      fireEvent.click(las)
      expect(las).toHaveAttribute('aria-expanded', 'true')
      const practise = screen.getByRole('button', { name: /^Öva LÄS · ca \d+ min$/ })
      fireEvent.click(practise)
      expect(startDrill).toHaveBeenCalledWith({ kind: 'section', section: 'LÄS' })
      fireEvent.keyDown(practise, { key: 'Escape' })
      expect(las).toHaveAttribute('aria-expanded', 'false')
      expect(las).toHaveFocus()
    })

    it('draws the climb as a figure with its trend in words and a table on request', () => {
      mount(11)
      const climb = screen.getByRole('figure')
      expect(climb).toHaveTextContent('Från 1,0 till 1,4 på 10 veckor; målet är 2,0.')
      fireEvent.click(within(climb).getByRole('button', { name: 'Visa som tabell' }))
      const rows = within(climb).getAllByRole('row')
      expect(rows).toHaveLength(13)
      expect(rows[1]).toHaveTextContent('ingen övning')
      expect(rows[12]).toHaveTextContent('1,4')
    })

    it('shows the weeks as earned dots, with this week’s days in words and no streak', () => {
      mount(11)
      const weeks = screen.getByTestId('rd-framsteg-week')
      expect(
        within(weeks).getByRole('img', {
          name: /^Dagar med övning per vecka, senaste 12 veckorna: (\d, ){11}\d; målet 5$/,
        }),
      ).toBeInTheDocument()
      expect(weeks).toHaveTextContent('4 av 5 dagar den här veckan')
      expect(weeks).not.toHaveTextContent(/serie|rekord/i)
    })

    it('lists Historik by day, newest first, and filters without dropping a kept day’s heading', () => {
      mount(11)
      fireEvent.click(screen.getByRole('radio', { name: 'Historik' }))
      expect(screen.getByRole('heading', { level: 1, name: 'Historik' })).toBeInTheDocument()
      const history = screen.getByTestId('rd-framsteg-history')
      const yesterday = within(history)
        .getByRole('heading', { name: 'Igår' })
        .closest('section') as HTMLElement
      expect(within(yesterday).getByText('ORD-övning')).toBeInTheDocument()
      expect(within(yesterday).getByText('Repetition')).toBeInTheDocument()
      expect(within(history).getByRole('heading', { name: 'Onsdag 7 okt' })).toBeInTheDocument()
      expect(greenPills()).toHaveLength(0)
      fireEvent.click(screen.getByRole('radio', { name: 'Repetition' }))
      expect(within(history).getAllByRole('listitem')).toHaveLength(2)
      expect(within(history).getByRole('heading', { name: 'Igår' })).toBeInTheDocument()
      expect(within(history).queryByRole('heading', { name: 'Onsdag 7 okt' })).toBeNull()
    })

    it('is reached from Idag: "Alla pass" opens Historik, "Prognosen i Framsteg" Översikt', () => {
      const go = vi.fn()
      mount(1, { actions: { go } })
      fireEvent.click(screen.getByRole('button', { name: /Alla pass/ }))
      expect(go).toHaveBeenLastCalledWith('framsteg')
      expect(screen.getByRole('heading', { level: 1, name: 'Historik' })).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('rd-nav-idag'))
      fireEvent.click(screen.getByRole('button', { name: /Prognosen i Framsteg/ }))
      expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
        'Prognos: ungefär 1,4 av 2,0',
      )
    })

    it('leaves out the goal and the target when the data has none', () => {
      const data = clone()
      data.framsteg.week.goal = undefined
      data.framsteg.prognosis.target = undefined
      mount(11, { data })
      const weeks = screen.getByTestId('rd-framsteg-week')
      expect(weeks).toHaveTextContent('4 dagar den här veckan')
      expect(within(weeks).getByRole('img')).not.toHaveAccessibleName(/målet/)
      expect(screen.getByRole('figure')).not.toHaveTextContent('målet')
      expect(screen.getByTestId('rd-spar')).not.toHaveTextContent(/undefined|NaN/)
    })

    it('starts a new reader with one green step and says what will appear', () => {
      const data = clone()
      const f = data.framsteg
      f.prognosis = { ...f.prognosis, total: null, verbal: null, quant: null, delta: null }
      f.sections = f.sections.map((s) => ({
        ...s,
        score: null,
        band: null,
        trend: null,
        attempts90d: 0,
        daysSince: null,
      }))
      f.focus = []
      f.weekly = f.weekly.map((w) => ({ ...w, score: null }))
      const startDrill = vi.fn()
      mount(11, { data, actions: { startDrill } })
      expect(
        screen.getByRole('heading', { level: 1, name: 'Ingen prognos än' }),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Svara på några frågor så börjar den här sidan leva.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Kurvan visas efter två veckor med övning.')).toBeInTheDocument()
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      expect(pills[0]).toHaveTextContent(`Börja här · ${data.ova.mixed.questions} frågor`)
      fireEvent.click(pills[0])
      expect(startDrill).toHaveBeenCalledWith({ kind: 'mixed' })
      expect(
        within(screen.getByTestId('rd-framsteg-section-las')).getByRole('button'),
      ).toHaveAccessibleName('Läsförståelse, inget än')
    })

    it('says why there is no prognosis when one half is practised, and starts the other', () => {
      const data = clone()
      const f = data.framsteg
      f.prognosis = { ...f.prognosis, total: null, quant: null, delta: null }
      f.sections = f.sections.map((s) =>
        s.half === 'kvant' ? { ...s, score: null, band: null, attempts90d: 0, daysSince: null } : s,
      )
      const startDrill = vi.fn()
      mount(11, { data, actions: { startDrill } })
      expect(
        screen.getByText(
          'Prognosen behöver både verbal och kvant. Du har övat verbal — en kvantrunda till så visas den.',
        ),
      ).toBeInTheDocument()
      const pills = greenPills()
      expect(pills).toHaveLength(1)
      fireEvent.click(pills[0])
      expect(startDrill).toHaveBeenCalledWith({ kind: 'section', section: 'XYZ' })
    })
  })
})
