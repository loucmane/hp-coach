/// <reference types="node" />
// Vitest global setup — runs once per test file.
// Loads jest-dom matchers (toBeInTheDocument, toHaveStyle, etc.) and resets
// document.body between tests so DOM state never leaks across cases.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom does not implement matchMedia. Several components (and the .reveal
// keyframe's prefers-reduced-motion guard) inspect it, so polyfill before
// any component renders.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom defaults `window.innerWidth` to 1024 → `useViewport()` returns
// 'reader' → `<Page>` mounts its desktop running-head chrome, including
// the inline NavLinks that call TanStack Router's `useLocation()`. Tests
// render screens standalone (no <RouterProvider>) so that hook throws.
//
// All screen tests today pass `forceLayout='phone'` to the screen they
// render — they intend to test phone composition. Pinning jsdom's
// innerWidth to a phone width aligns `useViewport()` with that intent
// without touching every test.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })
}

// Shim `fetch` for the question-bank loader. The dataset moved out of
// the JS bundle into app/public/data/*.json, served as a static asset
// in production. In vitest we have neither a dev server nor a real
// fetch — but we know the files are on disk relative to the app root,
// so we read them directly and respond with a Response shape.
//
// We only intercept URLs that start with /data/; anything else falls
// through to the existing global fetch (or undefined, which is the
// default in jsdom — those tests would fail loudly, which is fine).
const HERE = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.resolve(HERE, '..', '..', 'public')
const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (url.startsWith('/data/')) {
    try {
      const body = readFileSync(path.join(PUBLIC_DIR, url), 'utf-8')
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      return new Response('not found', { status: 404 })
    }
  }
  if (!realFetch) throw new Error(`No fetch available for ${url}`)
  return realFetch(input, init)
}) as typeof fetch
