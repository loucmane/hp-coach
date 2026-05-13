// EditionStrip — Phase A.6V visual-preference picker.
//
// Lives top-right of the running-head band in Page.tsx, where the
// folio used to sit. Three orthogonal axes, each with its own
// typographic register:
//
//   ◐  sand sage ink rose  ·  editorial workbook cockpit  · egen
//   │  └──── palette ─────┘    └──────── edition ────────┘ │
//   │                                                       │
//   └─ mode glyph                                  divergence status
//
// Visual treatment, per docs/edition-strip.md § Visual treatment:
//   - Mono 11px lowercase, letter-spacing 0.14em
//   - Each palette word colored in its own accent (the picker SHOWS
//     the palette via its typography)
//   - Active word in each group gets a 1px under-rule exactly the
//     word's width — same signature as the folio in the original
//     Page.tsx implementation
//   - `egen` ("own") appears only when the user has nudged a sub-axis
//     outside the active edition's bundle. Rendered as <span>, not
//     <button> — it's a status, not an action.
//
// All store reads are scoped to leaf selectors so unrelated re-renders
// don't cascade through the strip (uiStore.persist + zustand subscribe
// already handles this).

import type { CSSProperties } from 'react'

import type { EditionKey, PaletteKey } from '@/lib/tokens'
import { useActiveEdition, useUiStore } from '@/stores/uiStore'

// ── Palette accents (per docs/edition-strip.md § Visual treatment) ──
//
// These are the swatch colors the four palette words render in. They
// match each palette's light-mode accent token — the picker can't
// pull from `var(--accent)` because that's set to the CURRENTLY
// ACTIVE palette only, and we need to color all four words distinctly
// regardless of which is active. So we hard-code the four accents
// here; if the palette accents change in tokens.ts these values stay
// in sync via the snapshot test on the palette table.

const PALETTE_ACCENTS: Record<PaletteKey, string> = {
  sand: 'oklch(0.61 0.13 42)' /* warm tan */,
  sage: 'oklch(0.52 0.13 195)' /* muted green-cyan (matches tokens.ts) */,
  ink: 'oklch(0.36 0.13 265)' /* near-black indigo */,
  rose: 'oklch(0.58 0.14 15)' /* rose pink */,
}

const PALETTE_ORDER: PaletteKey[] = ['sand', 'sage', 'ink', 'rose']
const EDITION_ORDER: EditionKey[] = ['editorial', 'workbook', 'cockpit']

// Mono cap height ≈ 0.6em per glyph + 0.4em side bleed. Mirrors the
// folio's hairline-width calculation in Page.tsx so the under-rule
// visually matches what the editorial chrome had before.
function ruleWidth(word: string): string {
  return `${word.length * 0.6 + 0.4}em`
}

type Props = {
  /** Bottom padding (px). Page.tsx's running head needs 14px so the
   *  picker baselines align with the wordmark; variants with tighter
   *  chrome (StyleB workbook 10px, StyleC cockpit 8px) pass 0. */
  paddingBottom?: number
}

export function EditionStrip({ paddingBottom = 0 }: Props = {}) {
  const mode = useUiStore((s) => s.mode)
  const palette = useUiStore((s) => s.palette)
  const setPalette = useUiStore((s) => s.setPalette)
  const setEdition = useUiStore((s) => s.setEdition)
  const toggleMode = useUiStore((s) => s.toggleMode)
  const activeEdition = useActiveEdition()
  const isCustom = activeEdition === 'custom'
  const isDark = mode === 'dark'

  return (
    <span
      data-testid="edition-strip"
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 14,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 'var(--font-mono-track)',
        paddingBottom,
      }}
    >
      {/* Mode glyph — ◐ for light, ◑ for dark. The user is "here"
       *  so the glyph reflects the current state; clicking it flips.
       *  Half-moon convention matches the day/night dichotomy without
       *  needing literal sun/moon icons that would break the mono
       *  typography register. */}
      <button
        type="button"
        onClick={toggleMode}
        aria-label={isDark ? 'Växla till ljust läge' : 'Växla till mörkt läge'}
        aria-pressed={isDark}
        style={{
          ...buttonReset,
          fontFamily: 'var(--font-mono)',
          fontSize: 13 /* slightly larger so the glyph reads at body */,
          lineHeight: 1,
          color: 'var(--muted)',
          padding: 0,
          cursor: 'pointer',
        }}
        onMouseEnter={hoverInk}
        onMouseLeave={hoverOff}
      >
        {isDark ? '◑' : '◐'}
      </button>

      {/* Palette group — four words, each in its own accent color.
       *  Active palette gets a 1px under-rule the exact width of the
       *  word. The picker is meant to *show* what each palette looks
       *  like just by reading it. */}
      <span style={groupStyle}>
        {PALETTE_ORDER.map((p) => (
          <PaletteWord key={p} palette={p} active={p === palette} onClick={() => setPalette(p)} />
        ))}
      </span>

      {/* Divider between the two semantic groups — palette is
       *  aesthetic, edition is work-shape. A single dimmed mid-dot
       *  is enough articulation. */}
      <span aria-hidden style={{ color: 'var(--hairline)' }}>
        ·
      </span>

      {/* Edition group — three lowercase mono words; active in
       *  --ink + under-rule + slight weight. Inactive in --muted. */}
      <span style={groupStyle}>
        {EDITION_ORDER.map((e) => (
          <EditionWord
            key={e}
            edition={e}
            active={!isCustom && e === activeEdition}
            onClick={() => setEdition(e)}
          />
        ))}
      </span>

      {/* Divergence indicator. Only renders when the user has nudged
       *  font/density/drillLayout outside the active bundle. Status,
       *  not action: rendered as <span>, no hover, --muted. */}
      {isCustom && (
        <>
          <span aria-hidden style={{ color: 'var(--hairline)' }}>
            ·
          </span>
          <span
            data-testid="edition-egen"
            role="status"
            aria-label="Egen kombination — avviker från en namngiven edition"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              color: 'var(--muted)',
            }}
          >
            <span>egen</span>
            <span
              aria-hidden
              style={{
                width: ruleWidth('egen'),
                height: 1,
                background: 'var(--muted)',
                opacity: 0.6,
              }}
            />
          </span>
        </>
      )}
    </span>
  )
}

// ── Word components ───────────────────────────────────────────────

function PaletteWord({
  palette,
  active,
  onClick,
}: {
  palette: PaletteKey
  active: boolean
  onClick: () => void
}) {
  const swatch = PALETTE_ACCENTS[palette]
  // Inactive words sit at 0.55 opacity of their accent — readable but
  // visibly "not picked". Hover lifts to full opacity (preview of
  // what selecting would land on). Active is full + under-rule.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Palett: ${palette}${active ? ' (aktiv)' : ''}`}
      aria-pressed={active}
      style={{
        ...buttonReset,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        cursor: 'pointer',
        color: swatch,
        opacity: active ? 1 : 0.55,
        fontWeight: active ? 600 : 500,
        transition: 'opacity 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = active ? '1' : '0.55'
      }}
    >
      <span>{palette}</span>
      <span
        aria-hidden
        style={{
          width: ruleWidth(palette),
          height: 1,
          background: swatch,
          opacity: active ? 0.85 : 0,
          transition: 'opacity 120ms ease',
        }}
      />
    </button>
  )
}

function EditionWord({
  edition,
  active,
  onClick,
}: {
  edition: EditionKey
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Edition: ${edition}${active ? ' (aktiv)' : ''}`}
      aria-pressed={active}
      style={{
        ...buttonReset,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        cursor: 'pointer',
        color: active ? 'var(--ink)' : 'var(--muted)',
        fontWeight: active ? 600 : 500,
        transition: 'color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--ink-2)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--muted)'
      }}
    >
      <span>{edition}</span>
      <span
        aria-hidden
        style={{
          width: ruleWidth(edition),
          height: 1,
          background: 'var(--ink)',
          opacity: active ? 0.85 : 0,
          transition: 'opacity 120ms ease',
        }}
      />
    </button>
  )
}

// ── Local style helpers ───────────────────────────────────────────

const buttonReset: CSSProperties = {
  background: 'none',
  border: 0,
  padding: 0,
  font: 'inherit',
  letterSpacing: 'inherit',
  textTransform: 'inherit',
  textAlign: 'left',
  outline: 'none',
}

const groupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 8,
}

function hoverInk(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.color = 'var(--ink)'
}
function hoverOff(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.color = 'var(--muted)'
}
