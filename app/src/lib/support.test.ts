// Support routing contract (P2.4) — one canonical address, defined once,
// used by /hjalp, /mer, the landing colophon and the ⌘K command. These
// tests pin the pieces every surface leans on.

import { describe, expect, it } from 'vitest'

import { APP_VERSION, SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_REPLY_LINE } from './support'

describe('support config', () => {
  it('exposes one canonical support address', () => {
    // Presumptive address until the domain purchase lands (TODO(owner) in
    // support.ts) — flipping it is one line, and every surface follows.
    expect(SUPPORT_EMAIL).toBe('support@hp-coach.se')
  })

  it('carries the owner-ratified reply-time line verbatim', () => {
    expect(SUPPORT_REPLY_LINE).toBe('Vi svarar inom en dag — det är en person, inte ett team.')
  })

  it('has an app version string (deploy SHA or dev fallback)', () => {
    expect(APP_VERSION).toBeTruthy()
    expect(typeof APP_VERSION).toBe('string')
  })

  it('builds a mailto that silently carries the app version', () => {
    expect(SUPPORT_MAILTO.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true)
    const decoded = decodeURIComponent(SUPPORT_MAILTO)
    expect(decoded).toContain(APP_VERSION)
  })
})
