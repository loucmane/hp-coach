import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { formatViolations, runAxe } from '@/test/a11y'
import { PhoneSheet, type ReadingTab } from './PhoneSheet'

function Harness() {
  const [tab, setTab] = useState<ReadingTab>('question')
  const [question, setQuestion] = useState(1)
  return (
    <main data-folio="" lang="sv">
      <div className="fa-drill">
        <PhoneSheet
          tab={tab}
          setTab={setTab}
          questionKey={String(question)}
          passage={<p>Textens innehåll</p>}
          action={
            <button
              type="button"
              onClick={() => {
                setQuestion((n) => n + 1)
                setTab('question')
              }}
            >
              Nästa fråga
            </button>
          }
        >
          <h2>Förklaringen</h2>
        </PhoneSheet>
      </div>
    </main>
  )
}
it('offers keyboard-accessible tabs without losing text or feedback', async () => {
  const { container } = render(<Harness />)
  const text = screen.getByRole('tab', { name: 'Texten' })
  const question = screen.getByRole('tab', { name: 'Frågan' })
  const explanation = screen.getByText('Förklaringen')
  for (const tab of [text, question, text, question]) {
    fireEvent.click(tab)
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(tab).toHaveAttribute('tabindex', '0')
    expect(tab).toHaveFocus()
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', tab.getAttribute('aria-controls'))
    expect(explanation.closest('[hidden]') !== null).toBe(tab === text)
    expect(screen.getByText('Textens innehåll').closest('[hidden]') !== null).toBe(tab === question)
    expect(screen.getByText('Förklaringen')).toBe(explanation)
    const violations = await runAxe(container)
    expect(violations, formatViolations(violations)).toEqual([])
  }
  for (const [key, target] of [
    ['ArrowRight', text],
    ['ArrowLeft', question],
    ['Home', text],
    ['End', question],
  ] as const) {
    fireEvent.keyDown(document.activeElement!, { key })
    expect(target).toHaveFocus()
    expect(target).toHaveAttribute('aria-selected', 'true')
  }
})

it('starts a new question at the top while retaining the passage position', () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const position = vi.spyOn(window, 'scrollY', 'get')
  try {
    render(<Harness />)
    position.mockReturnValue(240)
    fireEvent.scroll(window)
    fireEvent.click(screen.getByRole('tab', { name: 'Texten' }))
    position.mockReturnValue(880)
    fireEvent.scroll(window)
    fireEvent.click(screen.getByRole('button', { name: 'Nästa fråga' }))
    expect(screen.getByRole('tab', { name: 'Frågan' })).toHaveAttribute('aria-selected', 'true')
    expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
    position.mockReturnValue(0)
    fireEvent.click(screen.getByRole('tab', { name: 'Texten' }))
    expect(scroll).toHaveBeenLastCalledWith({ top: 880, behavior: 'instant' })
  } finally {
    scroll.mockRestore()
    position.mockRestore()
  }
})

it('offers Texten and Frågan tabs with independent scroll positions and a dock action', () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const position = vi.spyOn(window, 'scrollY', 'get')
  try {
    render(<Harness />)
    const text = screen.getByRole('tab', { name: 'Texten' })
    const question = screen.getByRole('tab', { name: 'Frågan' })
    expect(question).toHaveAttribute('aria-selected', 'true')
    position.mockReturnValue(240)
    fireEvent.scroll(window)
    fireEvent.click(text)
    expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
    position.mockReturnValue(880)
    fireEvent.scroll(window)
    fireEvent.click(question)
    expect(scroll).toHaveBeenLastCalledWith({ top: 240, behavior: 'instant' })
    position.mockReturnValue(240)
    fireEvent.click(text)
    expect(scroll).toHaveBeenLastCalledWith({ top: 880, behavior: 'instant' })
    const action = screen.getByRole('button', { name: 'Nästa fråga' })
    expect(action.closest('.rd-dock')).not.toBeNull()
    expect(action.closest('[data-lit="true"]')).toBeNull()
  } finally {
    scroll.mockRestore()
    position.mockRestore()
  }
})
