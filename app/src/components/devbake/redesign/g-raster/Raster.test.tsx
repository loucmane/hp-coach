import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  ESTIMATE_CAVEAT,
  EXAM,
  EXPLANATIONS,
  OVNINGSTEXT_NOTE,
  SESSION,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type DirectionProps,
  type ScreenKey,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { meta } from './meta'
import { Raster } from './Raster'

const widths: WidthKey[] = ['desktop', 'phone']
const themes: ThemeKey[] = ['light', 'dark']
const screens: ScreenKey[] = [1, 2, 3, 4]
const q = UNIT.questions[SESSION.startIndex]
const explanation = EXPLANATIONS[q.qid]

function mount(initial: ScreenKey, width: WidthKey, theme: ThemeKey = 'light', live = true) {
  const onScreen = vi.fn()
  const onTheme = vi.fn()
  const props: DirectionProps = { screen: initial, width, theme, live, onScreen, onTheme }
  const rendered = render(<Raster {...props} />)
  return {
    ...rendered,
    onScreen,
    onTheme,
    goTo: (s: ScreenKey) => rendered.rerender(<Raster {...props} screen={s} />),
  }
}

function openSheet(width: WidthKey) {
  if (width === 'phone')
    fireEvent.click(
      within(screen.getByTestId('rd-sheet')).getByRole('button', { name: /Fråga.*Visa/ }),
    )
}

describe.each(widths)('Raster at %s', (width) => {
  describe.each(themes)('%s theme', (theme) => {
    it.each(screens)('renders screen %s with its reading/navigation contract', (s) => {
      mount(s, width, theme)
      expect(screen.getByTestId('rd-raster')).toHaveAttribute('data-theme', theme)
      expect(screen.getByTestId('rd-account')).toBeInTheDocument()
      if (s === 1 || s === 4) {
        for (const dest of DESTINATIONS)
          expect(screen.getByTestId(`rd-nav-${dest.id}`)).toBeVisible()
        expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
        expect(screen.getByText(ESTIMATE_CAVEAT)).toBeVisible()
        expect(screen.getByText(String(EXAM.daysLeft).padStart(2, '0'))).toBeVisible()
        if (s === 4) expect(screen.getByTestId('rd-account-menu')).toBeVisible()
      } else {
        expect(screen.getByTestId('rd-exit')).toBeVisible()
        const passage = screen.getByTestId('rd-passage')
        expect(passage).not.toContainElement(screen.getByTestId('rd-badge'))
        for (let n = 1; n <= 9; n++) expect(screen.getByTestId(`rd-para-${n}`)).toBeInTheDocument()
        if (s === 2) {
          expect(screen.getByTestId('rd-note')).not.toBeVisible()
          fireEvent.click(screen.getByTestId('rd-note-toggle'))
          expect(screen.getByTestId('rd-note')).toHaveTextContent(OVNINGSTEXT_NOTE)
          if (width === 'phone')
            expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
          openSheet(width)
          for (const option of q.options)
            expect(screen.getByTestId(`rd-option-${option.letter}`)).toBeVisible()
          expect(screen.getByTestId('rd-lock')).toBeDisabled()
        } else {
          expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
          expect(screen.getByTestId('rd-verdict')).toHaveTextContent(q.answer)
          expect(screen.getByTestId('rd-pitfall')).toHaveTextContent(explanation.pitfall ?? '')
          expect(screen.getByTestId('rd-technique')).toHaveTextContent(explanation.technique)
          expect(screen.getByTestId('rd-next')).toBeVisible()
        }
      }
    })
  })

  it('resumes, eliminates, grades a wrong pick and completes the real unit', () => {
    const { onScreen, goTo } = mount(1, width)
    fireEvent.click(screen.getByTestId('rd-resume'))
    expect(onScreen).toHaveBeenLastCalledWith(2)
    goTo(2)
    openSheet(width)
    fireEvent.click(screen.getByTestId('rd-eliminate-B'))
    expect(screen.getByTestId('rd-eliminate-B')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-option-A'))
    expect(screen.getByTestId('rd-option-A')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(onScreen).toHaveBeenLastCalledWith(3)
    goTo(3)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(onScreen).toHaveBeenLastCalledWith(2)
    goTo(2)
    openSheet(width)
    const last = UNIT.questions[SESSION.startIndex + 1]
    expect(screen.getByRole('heading', { name: last.prompt })).toBeVisible()
    fireEvent.click(screen.getByTestId(`rd-option-${last.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    goTo(3)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByTestId('rd-done')).toBeVisible()
    fireEvent.click(screen.getByTestId('rd-done-next'))
    expect(onScreen).toHaveBeenLastCalledWith(1)
    goTo(1)
    expect(screen.getByRole('heading', { name: 'Öva' })).toBeVisible()
    expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
  })

  it('keeps the feedback order, reveals details and follows paragraph evidence', () => {
    mount(3, width)
    const picked = screen.getByTestId('rd-distractor-A')
    expect(within(picked).getByText(explanation.distractors[0].why_tempting)).toBeVisible()
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual([
      'Varför det lockade',
      'Varför det är fel',
      'Fällan',
      'Tekniken',
      'Lösningen',
      'Stegen',
      'De andra alternativen',
    ])
    const detail = explanation.steps?.find((s) => s.tier === 'detail')
    if (!detail) throw new Error('A detail step is required by the fixture')
    expect(screen.queryByText(detail.text)).toBeNull()
    fireEvent.click(screen.getByTestId(`rd-step-toggle-${detail.n}`))
    expect(screen.getByText(detail.text)).toBeVisible()
    for (const distractor of explanation.distractors)
      expect(screen.getByTestId(`rd-distractor-${distractor.letter}`)).toBeInTheDocument()
    fireEvent.click(screen.getAllByTestId('rd-cite-6')[0])
    expect(screen.getByTestId('rd-para-6')).toHaveAttribute('data-flash', 'true')
    if (width === 'phone') {
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
      fireEvent.click(
        within(screen.getByTestId('rd-sheet')).getByRole('button', { name: /Facit.*Visa/ }),
      )
      expect(screen.getByText(detail.text)).toBeVisible()
    }
  })

  it('leaves digit shortcuts alone, accepts a–d and Space/Enter, and never exits on Escape', () => {
    const { onScreen, goTo } = mount(2, width)
    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getByTestId('rd-option-C')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onScreen).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'a' })
    if (width === 'phone')
      expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'open')
    fireEvent.keyDown(window, { key: ' ' })
    expect(onScreen).toHaveBeenLastCalledWith(3)
    goTo(3)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onScreen).toHaveBeenLastCalledWith(2)
    goTo(2)
    fireEvent.click(screen.getByTestId('rd-exit'))
    expect(onScreen).toHaveBeenLastCalledWith(1)
  })

  it('exposes account and theme from every destination and drill', () => {
    const { onTheme, goTo } = mount(4, width)
    fireEvent.click(screen.getByTestId('rd-theme-toggle'))
    expect(onTheme).toHaveBeenLastCalledWith('dark')
    fireEvent.click(screen.getByRole('button', { name: 'Stäng kontot' }))
    for (const dest of DESTINATIONS) {
      fireEvent.click(screen.getByTestId(`rd-nav-${dest.id}`))
      expect(screen.getByTestId(`rd-nav-${dest.id}`)).toHaveAttribute('aria-current', 'page')
      expect(screen.getByTestId('rd-account')).toBeVisible()
    }
    goTo(2)
    fireEvent.click(screen.getByTestId('rd-account'))
    expect(screen.getByTestId('rd-account-menu')).toBeVisible()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('rd-account-menu')).toBeNull()
    expect(screen.getByTestId('rd-exit')).toBeVisible()
  })
})

it('has built metadata and keeps side-by-side stages inert', () => {
  expect(meta.stub).toBeUndefined()
  const { onScreen } = mount(2, 'desktop', 'light', false)
  fireEvent.keyDown(window, { key: 'a' })
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(onScreen).not.toHaveBeenCalled()
  expect(screen.getByTestId('rd-option-A')).toHaveAttribute('aria-pressed', 'false')
})

it('collapses the desktop index without losing destinations', () => {
  mount(1, 'desktop')
  fireEvent.click(screen.getByTestId('rd-collapse'))
  expect(screen.getByTestId('rd-collapse')).toHaveAttribute('aria-expanded', 'false')
  for (const dest of DESTINATIONS) expect(screen.getByTestId(`rd-nav-${dest.id}`)).toBeVisible()
})
