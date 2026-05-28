// HomeVariantF3 — CENTERED COMPOSITION (UI lead's safe option).
//
// Drops the flush-left identity. The entire B left column moves to
// the canvas center with symmetric whitespace on both sides. No
// right content at all.
//
// System-cheap (no new primitives needed, just a max-width wrapper)
// but identity-regressive — the EDITION direction explicitly committed
// to flush-left composition in Phase A.8. This variant exists to test
// whether the user actually prefers symmetric breathing room over
// the editorial flush-left identity.

import { BLeftColumn } from './HomeRound2Shared'

export function HomeVariantF3() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        display: 'flex',
        justifyContent: 'center',
        color: 'var(--ink)',
        minHeight: 720,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
        }}
      >
        <BLeftColumn />
      </div>
    </div>
  )
}
