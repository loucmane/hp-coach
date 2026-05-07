// Vitest global setup — runs once per test file.
// Loads jest-dom matchers (toBeInTheDocument, toHaveStyle, etc.) and resets
// document.body between tests so DOM state never leaks across cases.

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
