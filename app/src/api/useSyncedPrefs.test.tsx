import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode, StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useExamStore, useSitting } from '@/stores/examStore'

import type { UserPrefsPatch } from './hooks/useUserPrefs'
import { useHydratePrefs, useSyncedPrefs } from './useSyncedPrefs'

const { auth, getPrefs, patchPrefs } = vi.hoisted(() => ({
  auth: { userId: 'user-a' as string | null | undefined },
  getPrefs: vi.fn(),
  patchPrefs: vi.fn(),
}))

vi.mock('@clerk/clerk-react', () => ({ useAuth: () => auth }))

vi.mock('./useApiClient', () => ({
  useApiClient: () => ({ api: { me: { prefs: { $get: getPrefs, $patch: patchPrefs } } } }),
}))

const PREFS_KEY = ['me', 'prefs']
const OWNER_KEY = 'hpc-exam-owner'
const prefs = (targetSittingId: string | null) => ({ targetSittingId })
const response = (targetSittingId: string | null) => ({
  ok: true,
  json: async () => ({ prefs: prefs(targetSittingId) }),
})

function harness(targetSittingId: string | null = null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  qc.setQueryData(PREFS_KEY, prefs(targetSittingId), { updatedAt: 1 })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StrictMode>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </StrictMode>
  )
  return { qc, wrapper }
}

beforeEach(() => {
  auth.userId = 'user-a'
  localStorage.clear()
  useExamStore.setState({ sittingId: null })
  getPrefs.mockReset().mockResolvedValue(response(null))
  patchPrefs.mockReset().mockImplementation(async ({ json }: { json: UserPrefsPatch }) => {
    return response(json.targetSittingId ?? null)
  })
})

afterEach(() => vi.restoreAllMocks())

describe('synced exam sitting', () => {
  it('updates locally before PATCH completes, then publishes the confirmed preference', async () => {
    const { qc, wrapper } = harness()
    let confirm!: (value: ReturnType<typeof response>) => void
    patchPrefs.mockReturnValueOnce(new Promise((resolve) => (confirm = resolve)))
    const { result } = renderHook(
      () => {
        useHydratePrefs()
        return useSyncedPrefs()
      },
      { wrapper },
    )

    let pending!: Promise<void>
    act(() => {
      pending = result.current.setSitting('var-2027')
    })
    expect(useExamStore.getState().sittingId).toBe('var-2027')
    expect(localStorage.getItem(OWNER_KEY)).toBe('user-a')
    expect(qc.getQueryData(PREFS_KEY)).toEqual(prefs(null))
    await waitFor(() => {
      expect(patchPrefs).toHaveBeenCalledExactlyOnceWith({ json: { targetSittingId: 'var-2027' } })
    })

    await act(async () => {
      confirm(response('var-2027'))
      await pending
    })
    expect(qc.getQueryData(PREFS_KEY)).toEqual(prefs('var-2027'))
    expect(useExamStore.getState().sittingId).toBe('var-2027')
    expect(patchPrefs).toHaveBeenCalledTimes(1)
  })

  it.each([
    null,
    'host-2026',
  ])('restores the previous local sitting (%s) on PATCH failure', async (id) => {
    auth.userId = 'user-b'
    if (id) localStorage.setItem(OWNER_KEY, 'user-a')
    useExamStore.setState({ sittingId: id })
    patchPrefs.mockResolvedValueOnce({ ok: false, status: 503 })
    const { qc, wrapper } = harness(id)
    const { result } = renderHook(() => useSyncedPrefs(), { wrapper })

    await act(async () => {
      await expect(result.current.setSitting('var-2027')).rejects.toThrow(
        'PATCH /api/me/prefs failed: 503',
      )
    })
    expect(useExamStore.getState().sittingId).toBe(id)
    expect(JSON.parse(localStorage.getItem('hpc-exam')!).state.sittingId).toBe(id)
    expect(localStorage.getItem(OWNER_KEY)).toBe(id ? 'user-a' : null)
    expect(qc.getQueryData(PREFS_KEY)).toEqual(prefs(id))
  })
})

describe('exam sitting hydration and backfill', () => {
  it('backfills a saved local id once and never loops on the successful PATCH or refetch', async () => {
    useExamStore.setState({ sittingId: 'var-2027' })
    localStorage.setItem(OWNER_KEY, 'user-a')
    const { qc, wrapper } = harness()
    const { rerender } = renderHook(() => useHydratePrefs(), { wrapper })

    await waitFor(() => expect(qc.getQueryData(PREFS_KEY)).toEqual(prefs('var-2027')))
    getPrefs.mockResolvedValue(response('var-2027'))
    await act(async () => {
      await qc.refetchQueries({ queryKey: PREFS_KEY })
    })
    rerender()
    expect(patchPrefs).toHaveBeenCalledExactlyOnceWith({ json: { targetSittingId: 'var-2027' } })
    expect(useExamStore.getState().sittingId).toBe('var-2027')
  })

  it('keeps the local selection on backfill failure and does not retry on later null reads', async () => {
    useExamStore.setState({ sittingId: 'var-2027' })
    localStorage.setItem(OWNER_KEY, 'user-a')
    patchPrefs.mockResolvedValueOnce({ ok: false, status: 503 })
    const { qc, wrapper } = harness()
    renderHook(() => useHydratePrefs(), { wrapper })

    await waitFor(() => expect(qc.getMutationCache().getAll()[0]?.state.status).toBe('error'))
    await act(async () => {
      await qc.refetchQueries({ queryKey: PREFS_KEY })
    })
    expect(patchPrefs).toHaveBeenCalledTimes(1)
    expect(useExamStore.getState().sittingId).toBe('var-2027')
    expect(qc.getQueryData(PREFS_KEY)).toEqual(prefs(null))
  })

  it('hydrates a non-null server value without writing the different local selection back', () => {
    useExamStore.setState({ sittingId: 'host-2026' })
    const { wrapper } = harness('var-2027')
    renderHook(() => useHydratePrefs(), { wrapper })
    expect(useExamStore.getState().sittingId).toBe('var-2027')
    expect(localStorage.getItem(OWNER_KEY)).toBe('user-a')
    expect(patchPrefs).not.toHaveBeenCalled()
  })

  it('does not overwrite an unknown non-null server id', () => {
    auth.userId = 'user-b'
    localStorage.setItem(OWNER_KEY, 'user-a')
    useExamStore.setState({ sittingId: 'var-2027' })
    const { wrapper } = harness('future-sitting')
    renderHook(() => useHydratePrefs(), { wrapper })
    expect(useExamStore.getState().sittingId).toBe('var-2027')
    expect(localStorage.getItem(OWNER_KEY)).toBe('user-a')
    expect(patchPrefs).not.toHaveBeenCalled()
  })

  it('does not persist the derived default when no sitting was chosen', () => {
    const { wrapper } = harness()
    const { result } = renderHook(
      () => {
        useHydratePrefs()
        return useSitting(new Date(2026, 9, 21))
      },
      { wrapper },
    )
    expect(result.current.id).toBe('var-2027')
    expect(useExamStore.getState().sittingId).toBeNull()
    expect(patchPrefs).not.toHaveBeenCalled()
  })

  it('backfills the stored past sitting, not its rolled-forward display id', async () => {
    useExamStore.setState({ sittingId: 'host-2026' })
    localStorage.setItem(OWNER_KEY, 'user-a')
    const { qc, wrapper } = harness()
    const { result } = renderHook(
      () => {
        useHydratePrefs()
        return useSitting(new Date(2026, 9, 21))
      },
      { wrapper },
    )
    await waitFor(() => expect(qc.getQueryData(PREFS_KEY)).toEqual(prefs('host-2026')))
    expect(result.current.id).toBe('var-2027')
    expect(patchPrefs).toHaveBeenCalledExactlyOnceWith({ json: { targetSittingId: 'host-2026' } })
    expect(useExamStore.getState().sittingId).toBe('host-2026')
  })
})

describe('exam sitting ownership', () => {
  it.each([
    'server hydration',
    'local choice',
  ])('does not backfill user A’s %s into user B on the same device', async (source) => {
    const first = harness(source === 'server hydration' ? 'var-2027' : null)
    const signedInA = renderHook(
      () => {
        useHydratePrefs()
        return useSyncedPrefs()
      },
      { wrapper: first.wrapper },
    )
    if (source === 'local choice') {
      await act(async () => signedInA.result.current.setSitting('var-2027'))
    }
    signedInA.unmount()
    patchPrefs.mockClear()

    // AuthQueryProvider gives B a fresh query client; device storage survives.
    auth.userId = 'user-b'
    const second = harness()
    await act(async () => {
      renderHook(() => useHydratePrefs(), { wrapper: second.wrapper })
    })

    expect(patchPrefs).not.toHaveBeenCalled()
    expect(second.qc.getQueryData(PREFS_KEY)).toEqual(prefs(null))
    expect(useExamStore.getState().sittingId).toBe('var-2027')
    expect(localStorage.getItem(OWNER_KEY)).toBe('user-a')
  })

  it('backfills once when the same user signs back in', async () => {
    const first = harness('var-2027')
    const signedIn = renderHook(() => useHydratePrefs(), { wrapper: first.wrapper })
    signedIn.unmount()

    const second = harness()
    const { rerender } = renderHook(() => useHydratePrefs(), { wrapper: second.wrapper })
    await waitFor(() => expect(second.qc.getQueryData(PREFS_KEY)).toEqual(prefs('var-2027')))
    await act(async () => {
      await second.qc.refetchQueries({ queryKey: PREFS_KEY })
    })
    rerender()

    expect(patchPrefs).toHaveBeenCalledExactlyOnceWith({ json: { targetSittingId: 'var-2027' } })
  })

  it('leaves a legacy choice without an owner marker for display only', async () => {
    useExamStore.setState({ sittingId: 'var-2027' })
    const { qc, wrapper } = harness()
    await act(async () => {
      renderHook(() => useHydratePrefs(), { wrapper })
    })

    expect(patchPrefs).not.toHaveBeenCalled()
    expect(qc.getQueryData(PREFS_KEY)).toEqual(prefs(null))
    expect(useExamStore.getState().sittingId).toBe('var-2027')
    expect(localStorage.getItem(OWNER_KEY)).toBeNull()
  })

  it.each([null, undefined])('does not backfill when the user id is %s', async (userId) => {
    auth.userId = userId
    useExamStore.setState({ sittingId: 'var-2027' })
    localStorage.setItem(OWNER_KEY, 'user-a')
    const { qc, wrapper } = harness()
    await act(async () => {
      renderHook(() => useHydratePrefs(), { wrapper })
    })

    expect(patchPrefs).not.toHaveBeenCalled()
    expect(qc.getQueryData(PREFS_KEY)).toEqual(prefs(null))
    expect(useExamStore.getState().sittingId).toBe('var-2027')
  })

  it('does not backfill when the owner marker cannot be read', async () => {
    useExamStore.setState({ sittingId: 'var-2027' })
    localStorage.setItem(OWNER_KEY, 'user-a')
    const getItem = Storage.prototype.getItem
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (key === OWNER_KEY) throw new Error('storage blocked')
      return getItem.call(this, key)
    })
    const { wrapper } = harness()
    await act(async () => {
      renderHook(() => useHydratePrefs(), { wrapper })
    })
    expect(patchPrefs).not.toHaveBeenCalled()
  })

  it.each([
    'setItem',
    'removeItem',
  ] as const)('keeps explicit sitting writes working when owner %s fails', async (method) => {
    if (method === 'setItem') localStorage.setItem(OWNER_KEY, 'user-b')
    auth.userId = method === 'setItem' ? 'user-a' : undefined
    const original = Storage.prototype[method]
    vi.spyOn(Storage.prototype, method).mockImplementation(function (
      this: Storage,
      key: string,
      value?: string,
    ) {
      if (key === OWNER_KEY) throw new Error('storage blocked')
      return original.call(this, key, value!)
    })
    const { wrapper } = harness()
    const { result } = renderHook(() => useSyncedPrefs(), { wrapper })

    await act(async () => result.current.setSitting('var-2027'))
    expect(useExamStore.getState().sittingId).toBe('var-2027')
    expect(patchPrefs).toHaveBeenCalledExactlyOnceWith({ json: { targetSittingId: 'var-2027' } })
    expect(localStorage.getItem(OWNER_KEY)).toBeNull()
  })
})
