import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { lazy, type ReactNode, Suspense, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const registry = vi.hoisted(() => ({ loads: 0, fail: false }))
vi.mock('@/components/devbake/redesign/directions', () => {
  registry.loads++
  const Stage = (props: import('@/components/devbake/redesign/r1Kit').DirectionProps) => {
    if (registry.fail) throw new Error('stage failed')
    return (
      <div data-testid="stage">
        <span>{`${props.screen}:${props.width}:${props.theme}:${props.live}`}</span>
        <button type="button" onClick={() => props.onScreen(3)}>
          Local feedback
        </button>
        <button type="button" onClick={() => props.onTheme('dark')}>
          Dark theme
        </button>
      </div>
    )
  }
  return {
    STAGES: { a: Stage, b: Stage, c: Stage, d: Stage, e: Stage, f: Stage, g: Stage, h: Stage },
  }
})
vi.mock('@clerk/clerk-react', () => ({
  SignedIn: () => null,
  SignedOut: () => null,
  useAuth: () => ({}),
}))
vi.mock('@tanstack/react-router', () => ({
  createRootRoute: (options: unknown) => options,
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
  Outlet: () => null,
}))
vi.mock('@/api/useSyncedPrefs', () => ({ useHydratePrefs: () => {} }))
vi.mock('@/components/landing/PublicLanding', () => ({ PublicLanding: () => null }))
vi.mock('@/components/motion/RouteScene', () => ({
  RouteScene: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/lib/devSurface', () => ({ isDevSurface: vi.fn(() => true) }))

import { isDevSurface } from '@/lib/devSurface'
import { DirectionBoundary, DirectionContent } from '@/routes/__root'
import { DESIGN_DIRECTIONS, useDesignStore } from '@/stores/designStore'
import { useUiStore } from '@/stores/uiStore'

const normalMounted = vi.fn()
function NormalContent() {
  useEffect(() => {
    normalMounted()
  }, [])
  return <div>Normal routed content</div>
}

function content(pathname = '/') {
  return (
    <DirectionContent pathname={pathname}>
      <NormalContent />
    </DirectionContent>
  )
}

beforeEach(() => {
  normalMounted.mockClear()
  vi.mocked(isDevSurface).mockReturnValue(true)
  useDesignStore.setState({ direction: null })
  useUiStore.setState({ mode: 'light' })
  registry.fail = false
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
})
afterEach(() => vi.restoreAllMocks())

describe('dev direction takeover', () => {
  it('does not load direction code with a saved choice outside dev, off, or an uncovered route', () => {
    useDesignStore.setState({ direction: 'a' })
    vi.mocked(isDevSurface).mockReturnValue(false)
    const view = render(content())
    expect(screen.getByText('Normal routed content')).toBeInTheDocument()
    vi.mocked(isDevSurface).mockReturnValue(true)
    view.rerender(content('/mer'))
    act(() => useDesignStore.setState({ direction: null }))
    view.rerender(content())
    expect(registry.loads).toBe(0)
    expect(screen.queryByTestId('direction-shell')).toBeNull()
  })

  it.each(DESIGN_DIRECTIONS)('mounts $name on the home route and restores the real app', async ({
    key,
    name,
  }) => {
    useDesignStore.setState({ direction: key })
    render(content())
    expect(await screen.findByTestId('stage')).toHaveTextContent('1:phone:light:true')
    // A /drill?start=1 fallback can create a real session just by mounting.
    expect(normalMounted).not.toHaveBeenCalled()
    expect(screen.getByText(`Riktning: ${name}`)).toBeInTheDocument()
    expect(screen.queryByText('Normal routed content')).toBeNull()
    expect(screen.getByTestId('direction-shell').parentElement).toBe(document.body)
    fireEvent.click(screen.getByRole('button', { name: 'Vanliga appen' }))
    expect(screen.getByText('Normal routed content')).toBeInTheDocument()
    expect(screen.queryByTestId('direction-shell')).toBeNull()
  })

  it('binds /drill, theme and viewport; keeps navigation local; falls through on other routes', async () => {
    useDesignStore.setState({ direction: 'b' })
    const view = render(content('/drill'))
    expect(await screen.findByTestId('stage')).toHaveTextContent('2:phone:light:true')
    fireEvent.click(screen.getByRole('button', { name: 'Local feedback' }))
    expect(screen.getByTestId('stage')).toHaveTextContent('3:phone:light:true')
    fireEvent.click(screen.getByRole('button', { name: 'Dark theme' }))
    expect(useUiStore.getState().mode).toBe('dark')
    expect(screen.getByTestId('stage')).toHaveTextContent('3:phone:dark:true')
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
    fireEvent(window, new Event('resize'))
    expect(screen.getByTestId('stage')).toHaveTextContent('3:desktop:dark:true')
    act(() => useUiStore.setState({ mode: 'light' }))
    expect(screen.getByTestId('stage')).toHaveTextContent('3:desktop:light:true')
    view.rerender(content('/'))
    expect(await screen.findByTestId('stage')).toHaveTextContent('1:desktop:light:true')
    view.rerender(content('/progress'))
    expect(screen.getByText('Normal routed content')).toBeInTheDocument()
    expect(screen.queryByTestId('direction-shell')).toBeNull()
    expect(useDesignStore.getState().direction).toBe('b')
  })

  it('opens the chip switcher, marks the current choice and switches directions', async () => {
    useDesignStore.setState({ direction: 'a' })
    render(content())
    await screen.findByTestId('stage')
    fireEvent.click(screen.getByText('Byt'))
    const choices = await screen.findByRole('group', { name: 'Designriktning' })
    expect(within(choices).getAllByRole('button')).toHaveLength(9)
    expect(within(choices).getByRole('button', { name: 'Folio' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByTestId('stage')).toHaveTextContent('1:phone:light:false')
    fireEvent.click(within(choices).getByRole('button', { name: 'Ljuskägla' }))
    await waitFor(() =>
      expect(screen.getByTestId('direction-shell')).toHaveAttribute('data-direction', 'h'),
    )
    expect(screen.queryByRole('group', { name: 'Designriktning' })).toBeNull()
  })

  it('recovers from a direction render error with the normal app and a dismissable notice', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    registry.fail = true
    useDesignStore.setState({ direction: 'a' })
    render(content())
    expect(await screen.findByRole('alert')).toHaveTextContent('Designriktningen kunde inte visas')
    expect(screen.getByText('Normal routed content')).toBeInTheDocument()
    expect(screen.queryByTestId('direction-shell')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Dölj meddelandet' }))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('Normal routed content')).toBeInTheDocument()
    registry.fail = false
    act(() => useDesignStore.getState().setDirection('b'))
    expect(await screen.findByTestId('stage')).toBeInTheDocument()
  })

  it('also catches a rejected lazy chunk outside the lazy content', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const FailedChunk = lazy(() => Promise.reject(new Error('chunk unavailable')))
    render(
      <DirectionBoundary fallback={<div>Normal routed content</div>}>
        <Suspense fallback={<div>Loading chunk</div>}>
          <FailedChunk />
        </Suspense>
      </DirectionBoundary>,
    )
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Normal routed content')).toBeInTheDocument()
  })
})
