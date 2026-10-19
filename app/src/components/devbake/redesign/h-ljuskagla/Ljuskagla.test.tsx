import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  ESTIMATE_CAVEAT,
  EXPLANATIONS,
  OVNINGSTEXT_NOTE,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type DirectionProps,
  type ScreenKey,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { Ljuskagla } from './Ljuskagla'

beforeAll(() => {
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})
afterEach(() => vi.restoreAllMocks())

function Harness({
  initial,
  width,
  theme = 'dark',
  live = true,
}: {
  initial: ScreenKey
  width: WidthKey
  theme?: ThemeKey
  live?: boolean
}) {
  const [page, setPage] = useState(initial)
  const [appearance, setAppearance] = useState(theme)
  return (
    <Ljuskagla
      screen={page}
      width={width}
      theme={appearance}
      live={live}
      onScreen={setPage}
      onTheme={setAppearance}
    />
  )
}

function mount(initial: ScreenKey, width: WidthKey = 'desktop', theme: ThemeKey = 'dark') {
  return render(<Harness initial={initial} width={width} theme={theme} />)
}

function openSheet() {
  const sheet = screen.queryByTestId('rd-sheet')
  if (sheet?.dataset.state === 'peek')
    fireEvent.click(within(sheet).getByRole('button', { name: /Visa frågan|Tillbaka till facit/ }))
}

describe.each<WidthKey>(['desktop', 'phone'])('Ljuskägla on %s', (width) => {
  describe.each<ThemeKey>(['light', 'dark'])('%s theme', (theme) => {
    it.each<ScreenKey>([1, 2, 3, 4])('renders screen %s with its working contract', (initial) => {
      mount(initial, width, theme)
      expect(screen.getByTestId('rd-ljuskagla')).toHaveAttribute('data-theme', theme)
      if (initial === 1 || initial === 4) {
        for (const d of DESTINATIONS)
          expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
        expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
        expect(screen.getByText(ESTIMATE_CAVEAT)).toBeInTheDocument()
      } else {
        expect(screen.getByTestId('rd-exit')).toHaveTextContent('Avsluta')
        expect(screen.getByTestId('rd-passage')).toBeInTheDocument()
        expect(screen.getByTestId('rd-passage')).not.toContainElement(
          screen.getByTestId('rd-badge'),
        )
        for (let n = 1; n <= 9; n++) expect(screen.getByTestId(`rd-para-${n}`)).toBeInTheDocument()
        if (initial === 2) {
          if (width === 'phone')
            expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
          openSheet()
          for (const o of UNIT.questions[2].options) {
            expect(screen.getByTestId(`rd-option-${o.letter}`)).toHaveTextContent(o.text)
            expect(screen.getByTestId(`rd-eliminate-${o.letter}`)).toBeInTheDocument()
          }
          expect(screen.getByTestId('rd-lock')).toBeDisabled()
        } else {
          expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
          expect(screen.getByTestId('rd-verdict')).toHaveTextContent('D')
          expect(screen.getByTestId('rd-next')).toBeInTheDocument()
        }
      }
      expect(screen.getByTestId('rd-account')).toBeInTheDocument()
      if (initial === 4) {
        expect(screen.getByTestId('rd-account-menu')).toBeInTheDocument()
        fireEvent.click(screen.getByTestId('rd-theme-toggle'))
        expect(screen.getByTestId('rd-ljuskagla')).toHaveAttribute(
          'data-theme',
          theme === 'dark' ? 'light' : 'dark',
        )
      }
    })
  })

  it('resumes, discloses approved copy, eliminates, answers and completes the real unit', () => {
    mount(1, width)
    fireEvent.click(screen.getByTestId('rd-resume'))
    expect(screen.getByTestId('rd-note')).not.toBeVisible()
    fireEvent.click(screen.getByTestId('rd-note-toggle'))
    expect(screen.getByTestId('rd-note')).toHaveTextContent(OVNINGSTEXT_NOTE)
    openSheet()
    fireEvent.click(screen.getByTestId('rd-eliminate-A'))
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-option-A'))
    expect(screen.getByTestId('rd-eliminate-A')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByTestId('rd-ljuskagla')).toHaveTextContent(UNIT.questions[3].prompt)
    openSheet()
    fireEvent.click(screen.getByTestId('rd-option-B'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByTestId('rd-done')).toHaveTextContent('2 av 4 rätt')
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
  })

  it('keeps feedback ordered, opens detail steps and lights citations in the text', () => {
    mount(3, width)
    const explanation = EXPLANATIONS[UNIT.questions[2].qid]
    const detail = explanation.steps?.find((step) => step.tier === 'detail')
    if (!detail) throw new Error('fixture must have a detail step')
    expect(screen.queryByText(detail.text)).toBeNull()
    fireEvent.click(screen.getByTestId(`rd-step-toggle-${detail.n}`))
    expect(screen.getByText(detail.text)).toBeInTheDocument()
    expect(screen.getByTestId('rd-technique')).toHaveTextContent(explanation.technique)
    expect(screen.getByTestId('rd-pitfall')).toHaveTextContent(explanation.pitfall ?? '')
    expect(
      within(screen.getByTestId('rd-distractor-A')).getByText(
        explanation.distractors[0].why_tempting,
      ),
    ).toBeInTheDocument()
    const order = [
      'rd-verdict',
      'rd-distractor-A',
      'rd-pitfall',
      'rd-technique',
      'rd-solution',
      'rd-step-1',
      'rd-other-options',
    ]
    for (let i = 0; i < order.length - 1; i++)
      expect(
        screen.getByTestId(order[i]).compareDocumentPosition(screen.getByTestId(order[i + 1])) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    for (const d of explanation.distractors)
      expect(screen.getByTestId(`rd-distractor-${d.letter}`)).toBeInTheDocument()
    fireEvent.click(screen.getAllByTestId('rd-cite-6')[0])
    expect(screen.getByTestId('rd-para-6')).toHaveAttribute('data-lit', 'true')
    if (width === 'phone') {
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
      expect(screen.getByTestId('rd-passage').closest('[inert]')).toBeNull()
      openSheet()
      expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    }
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(screen.getByTestId('rd-resume')).toBeInTheDocument()
  })
})

describe('Ljuskägla spotlight and keyboard', () => {
  it('follows paragraphs, arrow keys and J/K, respects boundaries, and can switch off', () => {
    mount(2)
    expect(screen.getByTestId('rd-para-1')).toHaveAttribute('data-lit', 'true')
    fireEvent.keyDown(window, { key: 'j' })
    expect(screen.getByTestId('rd-para-2')).toHaveAttribute('data-lit', 'true')
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(screen.getByTestId('rd-para-3')).toHaveAttribute('data-lit', 'true')
    fireEvent.keyDown(window, { key: 'k' })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(screen.getByTestId('rd-para-1')).toHaveAttribute('data-lit', 'true')
    fireEvent.click(screen.getByTestId('rd-para-9').querySelector('p')!)
    fireEvent.keyDown(window, { key: 'j' })
    expect(screen.getByTestId('rd-para-9')).toHaveAttribute('data-lit', 'true')
    fireEvent.click(screen.getByTestId('rd-spotlight-toggle'))
    expect(screen.getByTestId('rd-spotlight-toggle')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('rd-para-9')).toHaveAttribute('data-lit', 'false')
    const scrollKey = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
    window.dispatchEvent(scrollKey)
    expect(scrollKey.defaultPrevented).toBe(false)
    fireEvent.click(screen.getByTestId('rd-spotlight-toggle'))
    expect(screen.getByTestId('rd-para-9')).toHaveAttribute('data-lit', 'true')
  })

  it('follows the paragraph intersecting the reading line when scrolled', () => {
    mount(2)
    const scroll = screen.getByTestId('rd-passage-scroll')
    vi.spyOn(scroll, 'getBoundingClientRect').mockReturnValue({ top: 0, height: 500 } as DOMRect)
    for (let n = 1; n <= 9; n++)
      vi.spyOn(screen.getByTestId(`rd-para-${n}`), 'getBoundingClientRect').mockReturnValue({
        top: (n - 3) * 200,
        bottom: (n - 2) * 200,
      } as DOMRect)
    fireEvent.scroll(scroll)
    expect(screen.getByTestId('rd-para-3')).toHaveAttribute('data-lit', 'true')
    fireEvent.click(screen.getByTestId('rd-spotlight-toggle'))
    expect(screen.getByTestId('rd-para-3')).toHaveAttribute('data-lit', 'false')
  })

  it('uses answer keys, Enter and Space while leaving Escape and 1–8 to their owners', () => {
    mount(2, 'phone')
    const digit = new KeyboardEvent('keydown', { key: '8', cancelable: true })
    window.dispatchEvent(digit)
    expect(digit.defaultPrevented).toBe(false)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('rd-passage')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'open')
    expect(screen.getByTestId('rd-option-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByTestId('rd-ljuskagla')).toHaveTextContent(UNIT.questions[3].prompt)
  })

  it('does not steal Enter from controls or answer while the account is open', () => {
    mount(2)
    fireEvent.keyDown(screen.getByTestId('rd-spotlight-toggle'), { key: 'Enter' })
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.click(screen.getByTestId('rd-account'))
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
    expect(screen.getByTestId('rd-passage')).toBeInTheDocument()
  })

  it('keeps thumbnails still and the expanded/collapsed navigation operable', () => {
    const props: DirectionProps = {
      screen: 2,
      width: 'desktop',
      theme: 'dark',
      live: false,
      onScreen: vi.fn(),
      onTheme: vi.fn(),
    }
    const { rerender } = render(<Ljuskagla {...props} />)
    fireEvent.keyDown(window, { key: 'j' })
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByTestId('rd-para-1')).toHaveAttribute('data-lit', 'true')
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    rerender(<Ljuskagla {...props} screen={4} />)
    expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByTestId('rd-collapse'))
    expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByTestId('rd-nav-framsteg'))
    expect(screen.getByRole('heading', { name: 'Framsteg' })).toBeInTheDocument()
  })
})
