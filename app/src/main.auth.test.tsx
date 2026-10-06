import { useAuth } from '@clerk/clerk-react'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { FRAMEWORK_PROGRESS_KEY, useFrameworkProgress } from './api/hooks/useFrameworkProgress'
import { STATS_KEY, useStats } from './api/hooks/useStats'
import { useUpdateUserPrefs } from './api/hooks/useUserPrefs'
import { endedSessionIdsThisTab, markSessionEnded } from './lib/endedSessions'

const clerk = vi.hoisted(() => {
  const listeners = new Set<() => void>()
  const identity = (userId: string | null | undefined) => ({
    userId,
    isLoaded: userId !== undefined,
    isSignedIn: Boolean(userId),
    getToken: async () => userId ?? null,
  })
  return { listeners, identity, current: identity('user-A') }
})
const boot = vi.hoisted(() => ({ render: vi.fn(), remount: false }))

vi.mock('@clerk/clerk-react', async () => {
  const { useSyncExternalStore } = await import('react')
  return {
    ClerkProvider: ({ children }: { children: ReactNode }) => children,
    useAuth: () =>
      useSyncExternalStore(
        (listener) => {
          clerk.listeners.add(listener)
          return () => clerk.listeners.delete(listener)
        },
        () => clerk.current,
      ),
  }
})
vi.mock('react-dom/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-dom/client')>()
  return {
    ...original,
    createRoot: (...args: Parameters<typeof original.createRoot>) =>
      (args[0] as Element).id === 'root' ? { render: boot.render } : original.createRoot(...args),
  }
})
vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }))
vi.mock('./lib/sentry', () => ({ initSentry: vi.fn(), sentryEnabled: false }))
vi.mock('./data/questions', () => ({ loadBank: async () => [] }))
vi.mock('./routeTree.gen', () => ({ routeTree: {} }))
vi.mock('@tanstack/react-router', () => ({
  createRouter: () => ({}),
  RouterProvider: () => {
    const { userId } = useAuth()
    activeClient = useQueryClient()
    return userId ? <Probe key={boot.remount ? userId : 'same-consumer'} /> : null
  },
}))

const progressA = [{ layer1Id: 'NOG-1', status: 'mastered', lastTransitionAt: null }]
const progressB = [{ layer1Id: 'NOG-1', status: 'learning', lastTransitionAt: null }]
const renders: Array<{ userId: string | null | undefined; progress: unknown; stats: unknown }> = []
const requests: Array<{ userId: string; path: string }> = []
let pendingA: Array<() => void> | undefined
let activeClient: QueryClient
let updatePrefs: ReturnType<typeof useUpdateUserPrefs>

function Probe() {
  const { userId } = useAuth()
  const progress = useFrameworkProgress()
  const stats = useStats()
  updatePrefs = useUpdateUserPrefs()
  // Record every render, not only the settled DOM: even a single B render
  // with A's data violates isolation (a post-render cache clear is too late).
  renders.push({ userId, progress: progress.data, stats: stats.data })
  return null
}

function switchUser(userId: string | null | undefined) {
  act(() => {
    clerk.current = clerk.identity(userId)
    for (const listener of clerk.listeners) listener()
  })
}

function expectNoDataFromA() {
  const otherRenders = renders.filter((row) => row.userId !== 'user-A')
  expect(otherRenders.length).toBeGreaterThan(0)
  for (const row of otherRenders) {
    expect.soft(row.progress).not.toEqual(progressA)
    expect.soft(row.stats).not.toEqual({ streakDays: 11 })
  }
}

async function expectLoaded(userId: string) {
  await waitFor(() => {
    expect(renders).toContainEqual({
      userId,
      progress: userId === 'user-A' ? progressA : progressB,
      stats: { streakDays: userId === 'user-A' ? 11 : 2 },
    })
  })
}

beforeAll(async () => {
  vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', 'pk_test_fixture')
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
  await import('./main')
  root.remove()
})

afterAll(() => vi.unstubAllEnvs())

beforeEach(() => {
  endedSessionIdsThisTab.clear()
  clerk.current = clerk.identity('user-A')
  boot.remount = false
  renders.length = 0
  requests.length = 0
  pendingA = undefined
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      )
      const userId = new Headers(init?.headers).get('Authorization')?.replace('Bearer ', '') ?? ''
      requests.push({ userId, path: url.pathname })
      if (userId !== 'user-A' && userId !== 'user-B') throw new Error('Unexpected identity')
      const body =
        url.pathname === '/api/framework-progress'
          ? { progress: userId === 'user-A' ? progressA : progressB }
          : url.pathname === '/api/me/stats'
            ? { stats: { streakDays: userId === 'user-A' ? 11 : 2 } }
            : url.pathname === '/api/me/prefs' && init?.method === 'PATCH'
              ? { prefs: { dailyMinutes: 42 } }
              : undefined
      if (!body) throw new Error(`Unexpected request: ${url.pathname}`)
      if (userId === 'user-A' && pendingA) {
        await new Promise<void>((resolve) => pendingA?.push(resolve))
      }
      return Response.json(body)
    }),
  )
})

afterEach(() => {
  cleanup()
  activeClient?.clear()
  endedSessionIdsThisTab.clear()
  vi.unstubAllGlobals()
})

describe('the app query provider across Clerk identities', () => {
  it.each([
    'remount',
    'in-place rerender',
  ])('isolates both progress and stats on %s', async (mode) => {
    boot.remount = mode === 'remount'
    render(boot.render.mock.calls[0][0] as ReactElement)
    await expectLoaded('user-A')
    markSessionEnded(101)

    switchUser('user-B')
    expect(endedSessionIdsThisTab.size).toBe(0)
    expectNoDataFromA()
    await expectLoaded('user-B')
    expectNoDataFromA()
    expect(requests.filter((request) => request.userId === 'user-B')).toHaveLength(2)
  })

  it('clears on sign-out before another user signs in', async () => {
    render(boot.render.mock.calls[0][0] as ReactElement)
    await expectLoaded('user-A')
    switchUser(null)
    expect(activeClient.getQueryData(FRAMEWORK_PROGRESS_KEY)).toBeUndefined()
    expect(activeClient.getQueryData(STATS_KEY)).toBeUndefined()

    switchUser('user-B')
    await expectLoaded('user-B')
    expectNoDataFromA()
  })

  it('discards late responses for A after switching to B', async () => {
    pendingA = []
    render(boot.render.mock.calls[0][0] as ReactElement)
    await waitFor(() => expect(pendingA).toHaveLength(2))
    switchUser('user-B')
    await expectLoaded('user-B')
    await act(async () => {
      for (const resolve of pendingA ?? []) resolve()
    })
    await expectLoaded('user-B')
    expectNoDataFromA()
    expect(activeClient.getQueryData(FRAMEWORK_PROGRESS_KEY)).toEqual(progressB)
    expect(activeClient.getQueryData(STATS_KEY)).toEqual({ streakDays: 2 })
  })

  it('isolates a late mutation callback that writes to the previous query cache', async () => {
    render(boot.render.mock.calls[0][0] as ReactElement)
    await expectLoaded('user-A')
    pendingA = []
    let mutation: Promise<unknown>
    act(() => {
      mutation = updatePrefs.mutateAsync({ dailyMinutes: 42 })
    })
    await waitFor(() => expect(pendingA).toHaveLength(1))
    switchUser('user-B')
    await expectLoaded('user-B')
    await act(async () => {
      for (const resolve of pendingA ?? []) resolve()
      await mutation
    })
    expect(activeClient.getQueryData(['me', 'prefs'])).toBeUndefined()
    expectNoDataFromA()
  })

  it('does not leak through a transient unloaded identity', async () => {
    render(boot.render.mock.calls[0][0] as ReactElement)
    await expectLoaded('user-A')
    switchUser(undefined)
    expect(activeClient.getQueryData(FRAMEWORK_PROGRESS_KEY)).toBeUndefined()
    switchUser('user-B')
    await expectLoaded('user-B')
    expectNoDataFromA()
  })

  it('discards pending queries even when the next identity is signed out', async () => {
    pendingA = []
    render(boot.render.mock.calls[0][0] as ReactElement)
    await waitFor(() => expect(pendingA).toHaveLength(2))
    const previousClient = activeClient
    switchUser(null)
    await act(async () => {
      for (const resolve of pendingA ?? []) resolve()
    })
    expect(previousClient.getQueryCache().getAll()).toHaveLength(0)
    expect(activeClient.getQueryCache().getAll()).toHaveLength(0)
    expect(requests).toHaveLength(2)
  })

  it('preserves cached data on initial Clerk load and same-user token refresh', async () => {
    clerk.current = clerk.identity(undefined)
    render(boot.render.mock.calls[0][0] as ReactElement)
    const initialClient = activeClient
    activeClient.setQueryData(FRAMEWORK_PROGRESS_KEY, progressA)
    activeClient.setQueryData(STATS_KEY, { streakDays: 11 })
    markSessionEnded(101)
    switchUser('user-A')
    await expectLoaded('user-A')
    switchUser('user-A')
    expect(activeClient).toBe(initialClient)
    expect(activeClient.getQueryData(FRAMEWORK_PROGRESS_KEY)).toEqual(progressA)
    expect(activeClient.getQueryData(STATS_KEY)).toEqual({ streakDays: 11 })
    expect(endedSessionIdsThisTab.has(101)).toBe(true)
    expect(requests).toHaveLength(0)
  })
})
