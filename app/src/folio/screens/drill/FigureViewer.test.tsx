import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { formatViolations, runAxe } from '@/test/a11y'
import { FigureViewer } from './FigureViewer'

it('traps focus, supports zoom and reset, and releases document scrolling', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  const priorOverflow = document.body.style.overflow
  const { container, unmount } = render(
    <div data-folio="" lang="sv">
      <div className="fa-drill">
        <FigureViewer
          figure={{ kind: 'raster', src: 'plate.jpg', alt: 'Diagram', width: 700, height: 1000 }}
          onClose={onClose}
        />
      </div>
    </div>,
  )
  const close = screen.getByRole('button', { name: 'Stäng' })
  expect(close).toHaveFocus()
  expect(document.body.style.overflow).toBe('hidden')
  await user.keyboard('{Shift>}{Tab}{/Shift}')
  expect(screen.getByRole('region')).toHaveFocus()
  await user.tab()
  expect(close).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
  expect(screen.getByRole('status')).toHaveTextContent('150 %')
  fireEvent.keyDown(document.body, { key: '+' })
  expect(screen.getByRole('status')).toHaveTextContent('200 %')
  fireEvent.click(screen.getByRole('button', { name: 'Anpassa' }))
  expect(screen.getByRole('status')).toHaveTextContent('100 %')
  expect(screen.getByRole('button', { name: 'Minska' })).toBeDisabled()
  const violations = await runAxe(container)
  expect(violations, formatViolations(violations)).toEqual([])
  fireEvent.keyDown(document.body, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
  unmount()
  expect(document.body.style.overflow).toBe(priorOverflow)
})

it('offers a close action when the image fails', () => {
  const onClose = vi.fn()
  render(
    <FigureViewer
      figure={{ kind: 'raster', src: 'missing.jpg', alt: 'Diagram', width: 700, height: 1000 }}
      onClose={onClose}
    />,
  )
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByText('Figuren kunde inte laddas.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Stäng' }))
  expect(onClose).toHaveBeenCalledTimes(1)
})
