import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetLeverageCache, loadFrameworkLeverage } from './leverage'

const valid = {
  version: 1,
  generated_from: 'test corpus',
  entries: {
    'NOG-TRAP-001': { coverage: 12, position: 14.5 },
    'ORD-ROOT-001': { coverage: 187, position: null },
  },
}

beforeEach(() => {
  __resetLeverageCache()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('loadFrameworkLeverage', () => {
  it('loads and memoises a validated file, including concurrent callers', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => valid })
    vi.stubGlobal('fetch', fetcher)
    const [a, b] = await Promise.all([loadFrameworkLeverage(), loadFrameworkLeverage()])
    expect(a).toEqual(new Map(Object.entries(valid.entries)))
    expect(a).toBe(b)
    expect(await loadFrameworkLeverage()).toBe(a)
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('/leverage/framework_leverage.json')
    expect(console.warn).not.toHaveBeenCalled()
  })

  it.each([404, 500])('fails open and warns once for HTTP %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }))
    expect(await loadFrameworkLeverage()).toBeNull()
    expect(await loadFrameworkLeverage()).toBeNull()
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('fails open for network and JSON errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await loadFrameworkLeverage()).toBeNull()
    __resetLeverageCache()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('bad JSON')
        },
      }),
    )
    expect(await loadFrameworkLeverage()).toBeNull()
    expect(console.warn).toHaveBeenCalledTimes(2)
  })

  it.each([
    null,
    [],
    {},
    { ...valid, version: 2 },
    { ...valid, generated_from: '' },
    { ...valid, entries: [] },
    { ...valid, entries: {} },
    ...[
      { coverage: -1, position: null },
      { coverage: 1.5, position: 2 },
      { coverage: '3', position: 2 },
      { coverage: Number.POSITIVE_INFINITY, position: 2 },
      { coverage: 3, position: -1 },
      { coverage: 3, position: 0 },
      { coverage: 3, position: '2' },
      { coverage: 3, position: Number.NaN },
      { coverage: 3 },
      { coverage: 0, position: 2 },
      null,
    ].map((entry) => ({ ...valid, entries: { 'NOG-TRAP-001': entry } })),
  ])('fails open with a warning for invalid data %#', async (raw) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => raw }))
    expect(await loadFrameworkLeverage()).toBeNull()
    expect(console.warn).toHaveBeenCalledTimes(1)
  })
})
