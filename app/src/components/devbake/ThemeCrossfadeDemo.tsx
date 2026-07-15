// ThemeCrossfadeDemo — "D2 · Temaövergången" (task W3).
//
// A minimal stage to judge the theme cross-fade in isolation: a button
// that calls the REAL `useUiStore().toggleMode()` — the same setter every
// production entry point (rail-foot toggle, /mer settings, palette
// picker, ⌘K) uses — so what's demoed here is exactly what ships, not a
// simulation. The setter itself decides whether to wrap the change in
// `document.startViewTransition` (see `withViewTransition` in
// lib/motion.ts, wired at the uiStore setter level, not here).
//
// DESIGN artifact: fixture only, no route changes beyond the bake-off
// chip stitch, no shared-file edits beyond that.

import type { CSSProperties } from 'react'
import { PALETTES, type PaletteKey } from '@/lib/tokens'
import { useUiStore } from '@/stores/uiStore'

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]

export function THEMEDEMO() {
  const mode = useUiStore((s) => s.mode)
  const palette = useUiStore((s) => s.palette)
  const toggleMode = useUiStore((s) => s.toggleMode)
  const setPalette = useUiStore((s) => s.setPalette)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={eyebrow}>D2 · Temaövergången</div>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, margin: '10px 0 20px' }}>
        Klicka upprepade gånger och bedöm övertoningen — hela sidan ska glida mellan lägena som EN
        bild (view transition), inte hundratals egenskaper som byter var för sig.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => toggleMode()}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 14,
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: 999,
            border: '1px solid var(--ink)',
            background: 'var(--ink)',
            color: 'var(--bg)',
            cursor: 'pointer',
          }}
        >
          Växla till {mode === 'dark' ? 'ljust' : 'mörkt'} läge
        </button>
        <span style={{ ...eyebrow, letterSpacing: '0.06em' }}>
          nuvarande: {mode} · {PALETTES[palette].label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {PALETTE_KEYS.map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => setPalette(p)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.04em',
              padding: '7px 14px',
              borderRadius: 999,
              border: `1px solid ${palette === p ? 'var(--ink)' : 'var(--hairline)'}`,
              background: palette === p ? 'var(--ink)' : 'transparent',
              color: palette === p ? 'var(--bg)' : 'var(--ink-2)',
              cursor: 'pointer',
            }}
          >
            {PALETTES[p].label}
          </button>
        ))}
      </div>

      <div
        style={{
          border: '1px solid var(--hairline)',
          borderRadius: 12,
          padding: 16,
          background: 'var(--panel)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
          Provsida
        </div>
        <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          Text, kant och accent uppdateras med bg/panel/ink/accent-tokens — det här kortet är bara
          här för att övertoningen ska ha något att jobba med.
        </p>
        <div
          style={{
            marginTop: 12,
            height: 8,
            borderRadius: 999,
            background: 'var(--accent)',
            width: '40%',
          }}
        />
      </div>

      <p
        style={{
          ...eyebrow,
          letterSpacing: '0.02em',
          textTransform: 'none',
          marginTop: 20,
          lineHeight: 1.5,
        }}
      >
        Firefox (och alla webbläsare utan <code>document.startViewTransition</code>) faller tillbaka
        till ett vanligt, direkt bytet — ingen övertoning, ingen polyfill. Med{' '}
        <code>prefers-reduced-motion: reduce</code> hoppar bytet också rakt över övertoningen och
        sker direkt.
      </p>
    </div>
  )
}
