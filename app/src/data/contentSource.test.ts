// contentSource — flag-OFF default behavior.
//
// The whole point of the flag defaulting off is that dev / vitest /
// Playwright keep fetching the local static corpus with ZERO new setup.
// This asserts that, with VITE_CONTENT_FROM_API unset (the vitest
// default), contentFetch issues a plain same-origin `/data|/explanations`
// request — byte-identical to the historical fetch — and never awaits a
// Clerk token. (API-mode wiring is exercised end-to-end by the worker
// route tests + the e2e suite against a real deploy.)

import { afterEach, describe, expect, it, vi } from 'vitest'

import { contentFetch, contentFromApi } from './contentSource'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('contentFetch (flag off — the dev/e2e default)', () => {
  it('reports local mode', () => {
    expect(contentFromApi).toBe(false)
  })

  it('fetches data files from the local /data path unchanged', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', { status: 200 }))
    await contentFetch('data/var-2024.json')
    expect(spy).toHaveBeenCalledWith('/data/var-2024.json')
  })

  it('fetches explanations from the local /explanations path unchanged', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await contentFetch('explanations/host-2025.json')
    expect(spy).toHaveBeenCalledWith('/explanations/host-2025.json')
  })

  it('passes no auth header / init in local mode', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', { status: 200 }))
    await contentFetch('data/_index.json')
    // Single-arg call: no RequestInit, hence no Authorization header.
    expect(spy.mock.calls[0]).toHaveLength(1)
  })
})
