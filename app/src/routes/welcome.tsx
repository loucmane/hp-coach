// /welcome — first-time visual-preference picker.
//
// Phase A.6V. The Edition Strip lives in the running head once the
// app is open, so technically the user could discover it themselves
// — but starting day one in the default Sand/Editorial/Light look
// without ever knowing the palettes exist is
// the kind of "I had no idea this existed" friction we keep hitting
// with editorial chrome. So we show the picker once, at full canvas,
// as a chapter-opening composition: "Make it yours. (You can change
// any of this later from the top of every page.)"
//
// Gated by the `hpc-welcomed` localStorage flag, written on Fortsätt.
// Existing dogfood users with state already in `hpc-ui` will never
// see this — they're presumed welcomed.
//
// Composition mirrors HomeMobile's editorial register: section
// eyebrow / hero headline / three picker rows / single CTA. No
// modal, no animation; one long page the user scrolls if needed.

import { useUser } from '@clerk/clerk-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { Btn, Eyebrow } from '@/components/primitives'
import type { PaletteKey } from '@/lib/tokens'
import { WELCOMED_KEY } from '@/lib/welcome'
import { useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/welcome')({
  component: WelcomeRoute,
})

function WelcomeRoute() {
  const navigate = useNavigate()
  const mode = useUiStore((s) => s.mode)
  const palette = useUiStore((s) => s.palette)
  // Write-through setters: local store (instant paint) + PATCH to the
  // server prefs row. Raw uiStore setters were a bug here — choices made
  // in onboarding never reached the server, so the next useHydratePrefs
  // pass reverted them (owner-reported on staging 2026-07-11: dark+spalt
  // picked in /welcome, reverted on reload).
  const { setMode, setPalette } = useSyncedPrefs()
  const { user } = useUser()
  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? null

  const onContinue = () => {
    try {
      localStorage.setItem(WELCOMED_KEY, '1')
    } catch (_) {
      /* private-mode storage failure → fall through; we just re-prompt */
    }
    navigate({ to: '/' })
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Centered single column, max-width matching the editorial
        // canvas elsewhere. Picker rows breathe at this width without
        // forcing eye-tracking jumps across studio-wide rails.
        padding: 'clamp(40px, 8vh, 96px) clamp(28px, 5vw, 80px)',
        gap: 'clamp(28px, 4vh, 48px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(28px, 4vh, 48px)',
        }}
      >
        {/* Masthead — same eyebrow / hero pattern as HomeMobile. */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Eyebrow>HP · Coach</Eyebrow>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(36px, 6vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            {firstName ? `${firstName}, gör den till din.` : 'Gör den till din.'}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(16px, 1.6vw, 19px)',
              lineHeight: 1.55,
              color: 'var(--ink-2)',
              maxWidth: '38ch',
              margin: 0,
            }}
          >
            Två val. Du kan ändra dem under Mer → Inställningar när som helst — det här är bara en
            mjuk start.
          </p>
        </header>

        {/* Mode picker — light or dark, single binary choice. */}
        <PickerRow label="Belysning">
          <PickerOption
            label="ljust"
            sublabel="dag · papper på bord"
            active={mode === 'light'}
            onClick={() => setMode('light')}
          />
          <PickerOption
            label="mörkt"
            sublabel="kväll · bläck på pergament"
            active={mode === 'dark'}
            onClick={() => setMode('dark')}
          />
        </PickerRow>

        {/* Palette picker — the five product palettes, default first. */}
        <PickerRow label="Palett">
          <PaletteOption
            p="spalt"
            label="spalt"
            sub="sval blågrön · standard"
            active={palette === 'spalt'}
            onClick={() => setPalette('spalt')}
          />
          <PaletteOption
            p="sand"
            label="sand"
            sub="varm tan"
            active={palette === 'sand'}
            onClick={() => setPalette('sand')}
          />
          <PaletteOption
            p="sage"
            label="sage"
            sub="grönaktig"
            active={palette === 'sage'}
            onClick={() => setPalette('sage')}
          />
          <PaletteOption
            p="ink"
            label="ink"
            sub="indigo · mörk"
            active={palette === 'ink'}
            onClick={() => setPalette('ink')}
          />
          <PaletteOption
            p="rose"
            label="rose"
            sub="mjuk rosa"
            active={palette === 'rose'}
            onClick={() => setPalette('rose')}
          />
        </PickerRow>

        {/* CTA — large, primary. Mirrors the start button on /drill. */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
          <Btn onClick={onContinue}>Fortsätt →</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Pickers ───────────────────────────────────────────────────────

function PickerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Eyebrow>{label}</Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {children}
      </div>
    </section>
  )
}

type OptionProps = {
  label: string
  sublabel?: string
  active: boolean
  onClick: () => void
  accent?: string
}

function PickerOption({ label, sublabel, active, onClick, accent }: OptionProps) {
  const ring = active ? (accent ?? 'var(--ink)') : 'var(--hairline)'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: 'transparent',
        border: `1px solid ${ring}`,
        borderRadius: 0 /* editorial — no rounded corners */,
        padding: '16px 18px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: 'pointer',
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        // 1px border swap is the active affordance; no fill, no
        // shadow. Same convention as the option rows in StyleA.
        transition: 'border-color 120ms ease, color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = 'var(--muted)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = 'var(--hairline)'
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: active ? 600 : 500,
          letterSpacing: '-0.01em',
          color: accent ?? 'var(--ink)',
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 'var(--font-mono-track)',
            color: 'var(--muted)',
          }}
        >
          {sublabel}
        </span>
      )}
    </button>
  )
}

// Per-palette accent so the picker SHOWS the palette via its own
// typography (matches EditionStrip's convention).
const PALETTE_ACCENTS: Record<PaletteKey, string> = {
  sand: 'oklch(0.61 0.13 42)',
  sage: 'oklch(0.52 0.13 195)',
  ink: 'oklch(0.36 0.13 265)',
  rose: 'oklch(0.58 0.14 15)',
  spalt: 'oklch(0.49 0.21 265)',
}

function PaletteOption({
  p,
  label,
  sub,
  active,
  onClick,
}: {
  p: PaletteKey
  label: string
  sub: string
  active: boolean
  onClick: () => void
}) {
  return (
    <PickerOption
      label={label}
      sublabel={sub}
      active={active}
      onClick={onClick}
      accent={PALETTE_ACCENTS[p]}
    />
  )
}
