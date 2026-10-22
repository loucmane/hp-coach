import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { formatViolations, runAxe } from '@/test/a11y'
import { FigureViewer } from './FigureViewer'

afterEach(() => vi.restoreAllMocks())

it('rotates with the button and R, fits the rotated box and preserves zoom while rotating', () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 800, 600),
  )
  render(
    <FigureViewer
      figure={{ kind: 'raster', src: 'plate.jpg', alt: 'Diagram', width: 700, height: 1000 }}
      onClose={vi.fn()}
    />,
  )
  const image = screen.getByRole('img')
  const box = image.parentElement!
  expect(box.style.width).toBe('420px')
  expect(box.style.height).toBe('600px')
  expect(Number.parseFloat(box.style.aspectRatio)).toBeCloseTo(0.7)
  fireEvent.click(screen.getByRole('button', { name: 'Rotera figur 90 grader' }))
  expect(image.style.transform).toContain('rotate(90deg)')
  expect(box.style.width).toBe('800px')
  expect(box.style.height).toBe('560px')
  expect(Number.parseFloat(box.style.aspectRatio)).toBeCloseTo(1 / 0.7)
  // Pre-transform dimensions swap too; the visible image fills the reserved box.
  expect(image.style.width).toBe('560px')
  expect(image.style.height).toBe('800px')
  fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
  expect(box.style.width).toBe('1200px')
  expect(box.style.height).toBe('840px')
  fireEvent.keyDown(document.body, { key: 'r' })
  expect(image.style.transform).toContain('rotate(180deg)')
  expect(screen.getByRole('status')).toHaveTextContent('150 %')
  expect(box.style.width).toBe('630px')
  expect(Number.parseFloat(box.style.height)).toBeCloseTo(900)
  fireEvent.keyDown(document.body, { key: 'R' })
  expect(image.style.transform).toContain('rotate(270deg)')
  expect(box.style.width).toBe('1200px')
  expect(box.style.height).toBe('840px')
  fireEvent.click(screen.getByRole('button', { name: 'Anpassa' }))
  expect(image.style.transform).toContain('rotate(270deg)')
  expect(box.style.width).toBe('800px')
  expect(box.style.height).toBe('560px')
  fireEvent.click(screen.getByRole('button', { name: 'Rotera figur 90 grader' }))
  expect(image.style.transform).toContain('rotate(0deg)')
  expect(Number.parseFloat(box.style.aspectRatio)).toBeCloseTo(0.7)
})

it('refits a rotated figure when the viewport changes and pans its zoomed box', () => {
  const bounds = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, 800, 600))
  render(
    <FigureViewer
      figure={{ kind: 'raster', src: 'plate.jpg', alt: 'Diagram', width: 700, height: 1000 }}
      onClose={vi.fn()}
    />,
  )
  fireEvent.keyDown(document.body, { key: 'r' })
  bounds.mockReturnValue(new DOMRect(0, 0, 400, 700))
  fireEvent(window, new Event('resize'))
  const box = screen.getByRole('img').parentElement!
  expect(box.style.width).toBe('400px')
  expect(box.style.height).toBe('280px')
  fireEvent.keyDown(document.body, { key: '+' })
  expect(box.style.width).toBe('600px')
  expect(box.style.height).toBe('420px')
  const area = screen.getByRole('region')
  area.setPointerCapture = vi.fn()
  area.scrollLeft = 30
  area.scrollTop = 40
  fireEvent.pointerDown(area, { pointerType: 'mouse', pointerId: 1, clientX: 100, clientY: 100 })
  fireEvent.pointerMove(area, { pointerId: 1, clientX: 60, clientY: 70 })
  expect(area.scrollLeft).toBe(70)
  expect(area.scrollTop).toBe(70)
  fireEvent.pointerUp(area, { pointerId: 1 })
  fireEvent.pointerMove(area, { pointerId: 1, clientX: 20, clientY: 20 })
  expect(area.scrollLeft).toBe(70)
})

it.each([
  { width: 800.75, height: 600.75 },
  { width: 400.75, height: 700.75 },
])('fits within fractional viewport dimensions $width x $height at every rotation', ({
  width,
  height,
}) => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(Math.round(width))
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(Math.round(height))
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, width, height),
  )
  render(
    <FigureViewer
      figure={{ kind: 'raster', src: 'plate.jpg', alt: 'Diagram', width: 700, height: 1000 }}
      onClose={vi.fn()}
    />,
  )
  const box = screen.getByRole('img').parentElement!
  for (const rotation of [0, 90, 180, 270]) {
    fireEvent.click(screen.getByRole('button', { name: 'Förstora' }))
    fireEvent.click(screen.getByRole('button', { name: 'Anpassa' }))
    const aspect = rotation === 90 || rotation === 270 ? 1000 / 700 : 700 / 1000
    expect(Number.parseFloat(box.style.width)).toBeLessThanOrEqual(Math.floor(width))
    expect(Number.parseFloat(box.style.height)).toBeLessThanOrEqual(Math.floor(height))
    expect(Number.parseFloat(box.style.width)).toBeCloseTo(
      Math.min(Math.floor(width), Math.floor(height) * aspect),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Rotera figur 90 grader' }))
  }
})

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
