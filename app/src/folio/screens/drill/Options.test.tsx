import { readFileSync } from 'node:fs'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { useFolioPrefs } from '@/folio/lib/folioPrefs'
import { formatViolations, runAxe } from '@/test/a11y'
import { useDrillCore } from './drillCore'
import { Options } from './Options'
import type { DrillQuestion } from './types'

const h = vi.hoisted(() => ({ phone: false }))
vi.mock('@/hooks/useViewport', () => ({ useViewport: () => (h.phone ? 'phone' : 'studio') }))
const question: DrillQuestion = {
  qid: 'host-2022-kvant2-KVA-017',
  section: 'KVA',
  number: 17,
  prompt: 'Kvantitet I: 2\nKvantitet II: 1',
  answer: 'A',
  math: false,
  source: {
    examId: 'host-2022',
    provpass: 'kvant2',
    authentic: true,
    label: 'Hösten 2022 · Provpass 2',
  },
  options: [
    { letter: 'A', text: 'I är större än II' },
    { letter: 'B', text: 'II är större än I' },
    { letter: 'C', text: 'I är lika med II' },
    { letter: 'D', text: 'informationen är otillräcklig' },
  ],
}
function Harness() {
  const { view, act } = useDrillCore({ questions: [question], explanations: {}, live: false })
  return (
    <main data-folio="true">
      <div className="fa-drill">
        <Options view={view} act={act} />
      </div>
    </main>
  )
}
beforeEach(() => {
  h.phone = false
  useFolioPrefs.setState({ kbd: true })
})

it('has one tab stop, roves with arrows and selects with native Space without submitting', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  const radios = within(screen.getByRole('radiogroup', { name: 'Svarsalternativ' })).getAllByRole(
    'radio',
  )
  expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1, -1, -1])
  expect(radios.every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true)
  await user.tab()
  expect(radios[0]).toHaveFocus()
  await user.keyboard('{ArrowLeft}')
  expect(radios[3]).toHaveFocus()
  expect(radios[3]).toHaveAttribute('aria-checked', 'true')
  await user.keyboard('{ArrowDown}')
  expect(radios[0]).toHaveFocus()
  expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1, -1, -1])
  fireEvent.click(screen.getByRole('button', { name: 'Stryk A' }))
  expect(radios[0]).toHaveAttribute('aria-checked', 'false')
  radios[0].focus()
  await user.keyboard(' ')
  expect(radios[0]).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('button', { name: 'Stryk A' })).toHaveAttribute('aria-pressed', 'false')
})

it('scopes letters and Shift+letter, respects the preference and keeps native radio arrows', async () => {
  const user = userEvent.setup()
  const { container } = render(<Harness />)
  fireEvent.keyDown(document.body, { key: 'b' })
  expect(screen.getByTestId('option-B')).toHaveAttribute('aria-checked', 'false')
  screen.getByTestId('option-A').focus()
  await user.keyboard('b')
  expect(screen.getByTestId('option-B')).toHaveFocus()
  expect(screen.getByTestId('option-B')).toHaveAttribute('aria-checked', 'true')
  await user.keyboard('{Shift>}b{/Shift}')
  expect(screen.getByRole('button', { name: 'Ångra strykningen av B' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  container.querySelector('[data-folio]')?.setAttribute('data-kbd', 'off')
  await user.keyboard('c')
  expect(screen.getByTestId('option-C')).toHaveAttribute('aria-checked', 'false')
  await user.keyboard('{ArrowRight}')
  expect(screen.getByTestId('option-C')).toHaveAttribute('aria-checked', 'true')
})

it('uses one phone toggle to expose and hide per-row strike controls', async () => {
  h.phone = true
  const user = userEvent.setup()
  render(<Harness />)
  expect(screen.queryByRole('button', { name: 'Stryk A' })).toBeNull()
  const toggle = screen.getByRole('button', { name: 'Stryk alternativ' })
  await user.click(toggle)
  expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await user.click(screen.getByRole('button', { name: 'Stryk A' }))
  expect(screen.getByRole('button', { name: 'Ångra strykningen av A' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await user.click(toggle)
  expect(screen.queryByRole('button', { name: 'Ångra strykningen av A' })).toBeNull()
})

it('reveals row controls on hover and focus and leaves them visible on touch', () => {
  const css = readFileSync('src/folio/screens/drill/drill.css', 'utf8')
  expect(css).toMatch(/\.fa-opt:hover \.fa-opt-x[\s\S]*?visibility:\s*visible/)
  expect(css).toMatch(/\.fa-opt:focus-within \.fa-opt-x[\s\S]*?visibility:\s*visible/)
  expect(css).toMatch(/@media\s*\(hover:\s*none\)[\s\S]*?\.fa-opt-x[\s\S]*?visibility:\s*visible/)
})

it.each([false, true])('has accessible radio and strike controls, phone=%s', async (phone) => {
  h.phone = phone
  const { container } = render(<Harness />)
  if (phone) fireEvent.click(screen.getByRole('button', { name: 'Stryk alternativ' }))
  const violations = await runAxe(container)
  expect(violations, formatViolations(violations)).toEqual([])
})
