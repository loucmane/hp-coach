import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getFeedback } from '@/api/feedback'
import type { Explanation } from '@/data/explanations'
import { useFolioPrefs } from '@/folio/lib/folioPrefs'
import { formatViolations, runAxe } from '@/test/a11y'
import { Facit, type FacitView } from './Facit'

const explanation: Explanation = {
  solution_path: 'Hela lösningen, utan förkortning.',
  steps: [
    { n: 1, title: 'Börja här', text: 'All kärntext.', tier: 'essential' },
    { n: 2, title: 'Kontrollera', text: 'All detaljtext.', tier: 'detail' },
    { n: 3, title: 'Slutsats', text: 'Även det sista steget.' },
  ],
  distractors: ['B', 'C', 'D'].map((letter) => ({
    letter,
    why_tempting: `Lockelsen för ${letter}.`,
    why_wrong: `${letter} faller på (steg 2).`,
  })),
  pitfall: 'Hela fallgropen.',
  technique: 'Hela tekniken.',
  framework_id: 'KVA-TRAP-017',
}
function view(overrides: Partial<FacitView> = {}): FacitView {
  return {
    question: {
      qid: 'test-kva-1',
      section: 'KVA',
      number: 1,
      prompt: 'Jämför.',
      answer: 'A',
      math: true,
      options: (['A', 'B', 'C', 'D'] as const).map((letter) => ({
        letter,
        text: `Val ${letter}`,
      })),
      source: { examId: 'test', provpass: null, authentic: false, label: 'Övning' },
    },
    explanation,
    correct: false,
    picked: 'D',
    openSteps: new Set(),
    stepCites: {},
    distractorCites: {},
    ...overrides,
  }
}
const actions = { cite: vi.fn(), goToStep: vi.fn(), toggleStep: vi.fn() }
function mount(v = view(), lockIn?: React.ReactNode) {
  return render(
    <div data-folio="true" lang="sv">
      <main className="fa-drill">
        <Facit
          view={v}
          act={actions}
          refs={{ step: () => () => {} }}
          frameworks={{ 'KVA-TRAP-017': 'Vinkelräta linjer' }}
          active={null}
          point={() => {}}
          lockIn={lockIn}
        />
        <button type="button">Utanför kartan</button>
      </main>
    </div>,
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useFolioPrefs.setState({ kbd: true, motion: 'none' })
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => vi.unstubAllGlobals())

describe('Facit substance', () => {
  it('shows every step and every wrong-option reason without opening anything', () => {
    const { container } = mount()
    for (const s of explanation.steps!) expect(screen.getByText(s.text)).toBeVisible()
    for (const d of explanation.distractors) {
      const option = within(screen.getByTestId(`fa-distractor-${d.letter}`))
      expect(option.getByText(d.why_tempting)).toBeVisible()
      expect(option.getByText(`${d.letter} faller på`, { exact: false })).toBeVisible()
      expect(option.getByText('Varför det är fel')).toBeVisible()
    }
    for (const text of [
      explanation.solution_path,
      explanation.pitfall!,
      explanation.technique,
      'Vinkelräta linjer',
    ]) {
      expect(screen.getByText(text)).toBeVisible()
    }
    expect(screen.getByRole('heading', { name: /Hjälpte förklaringen/ })).toBeVisible()
    expect(container.querySelector('[aria-expanded], details')).toBeNull()
    expect(screen.getByTestId('fa-step-1')).toHaveTextContent('Kärna')
    expect(screen.getByTestId('fa-step-2')).toHaveTextContent('Detalj')
    expect(screen.getByTestId('fa-step-2')).toHaveTextContent('motbevisar D · ditt val')
    expect(screen.getByTestId('fa-step-1')).not.toHaveTextContent('motbevisar')
    fireEvent.click(
      within(screen.getByTestId('fa-distractor-D')).getByRole('button', { name: '(steg 2)' }),
    )
    expect(actions.goToStep).toHaveBeenCalledWith(2)
  })
  it('lists every rendered section in the same order and never collapses one', () => {
    const { container } = mount()
    const map = screen.getByRole('navigation', { name: 'Allt i det här facit' })
    expect(map).toHaveTextContent('Allt i det här facit · inget är dolt')
    const links = within(map).getAllByRole('link')
    const sections = [...container.querySelectorAll<HTMLElement>('[data-facit-section]')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(sections.map((s) => `#${s.id}`))
    expect(links[0]).toHaveTextContent('Ditt val, först')
    for (const link of links) fireEvent.click(link)
    for (const s of explanation.steps!) expect(screen.getByText(s.text)).toBeVisible()
  })
  it('moves J/K only inside the map, including the account shortcut preference', () => {
    mount()
    const links = within(screen.getByRole('navigation')).getAllByRole('link')
    links[0].focus()
    fireEvent.keyDown(links[0], { key: 'j' })
    expect(links[1]).toHaveFocus()
    expect(links[1]).toHaveAttribute('aria-current', 'location')
    fireEvent.keyDown(links[1], { key: 'k' })
    expect(links[0]).toHaveFocus()
    const outside = screen.getByRole('button', { name: 'Utanför kartan' })
    outside.focus()
    fireEvent.keyDown(outside, { key: 'j' })
    expect(outside).toHaveFocus()
    act(() => useFolioPrefs.setState({ kbd: false }))
    links[0].focus()
    fireEvent.keyDown(links[0], { key: 'j' })
    expect(links[0]).toHaveFocus()
  })
  it('tracks sections in view and releases the observer on unmount', () => {
    let observeEntries: IntersectionObserverCallback = () => {}
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          observeEntries = callback
        }
        observe = observe
        disconnect = disconnect
      },
    )
    const { container, unmount } = mount()
    const target = container.querySelector('[data-facit-section="steps"]')!
    const previous = container.querySelector('[data-facit-section="core"]')!
    expect(observe).toHaveBeenCalledWith(target)
    act(() =>
      observeEntries(
        [
          { target: previous, isIntersecting: true } as IntersectionObserverEntry,
          { target, isIntersecting: true } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    )
    expect(
      within(screen.getByRole('navigation')).getByRole('link', { name: /Lösningen/ }),
    ).toHaveAttribute('aria-current', 'location')
    act(() =>
      observeEntries(
        [{ target, isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )
    expect(
      within(screen.getByRole('navigation')).getByRole('link', { name: 'Kärnan' }),
    ).toHaveAttribute('aria-current', 'location')
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
  it('omits missing retrieval, figure marks, framework and empty sections', () => {
    const { container } = mount(
      view({
        explanation: {
          ...explanation,
          steps: [],
          solution_path: '',
          distractors: [],
          technique: '',
          pitfall: null,
          framework_id: undefined,
        },
      }),
    )
    expect(container.querySelectorAll('[data-facit-section]')).toHaveLength(1)
    expect(screen.queryByText('Lås in det')).toBeNull()
    expect(screen.queryByRole('figure')).toBeNull()
    expect(screen.queryByText('Ramverket')).toBeNull()
  })
  it('orders a supplied retrieval item first only for right and sure', () => {
    const { container } = mount(
      view({ correct: true, picked: 'A', confidence: 'sure' }),
      <p>En riktig återkallningsfråga.</p>,
    )
    expect(container.querySelector('[data-facit-section]')).toHaveAttribute(
      'data-facit-section',
      'lock',
    )
    expect(screen.getByText('En riktig återkallningsfråga.')).toBeVisible()
  })
  it('captures feedback with the existing local feedback seam', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Ja' }))
    expect(getFeedback('test-kva-1')?.status).toBe('approved')
    expect(screen.getByRole('button', { name: 'Ja' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Delvis' }))
    expect(getFeedback('test-kva-1')).toMatchObject({ status: 'rejected', notes: 'Delvis' })
  })
  it('keeps missing explanations honest', () => {
    mount(view({ explanation: null }))
    expect(screen.getByText('Förklaring saknas ännu för den här frågan.')).toBeVisible()
    expect(screen.queryByRole('navigation')).toBeNull()
  })
  it('has no axe violations with all teaching content open', async () => {
    const { container } = mount()
    const violations = await runAxe(container)
    expect(violations, formatViolations(violations)).toEqual([])
  })
})
