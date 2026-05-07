// /dev — design-time tweaks panel.
//
// Mirrors the prototype's HPTweaks: live coach voice, palette swatches,
// font pairing picker, theme mode toggle, density swap. Lets us screenshot
// every variant without rebuilding. Strictly dogfood/dev — would be hidden
// behind a feature flag in any public build.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useActiveSession, useStartSession, useUpdateSession } from '@/api/hooks/useSessions'
import { useUpdateUserPrefs, useUserPrefs } from '@/api/hooks/useUserPrefs'
import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Eyebrow, Hairline, Mono, Stack } from '@/components/primitives'
import {
  DENSITIES,
  type Density,
  FONTS,
  type FontKey,
  PALETTES,
  type PaletteKey,
} from '@/lib/tokens'
import { COACH_BLURBS, COACH_LABELS, type CoachKey } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/dev')({
  component: DevPanel,
})

const COACHES: CoachKey[] = ['kompis', 'professor', 'taktiker']
const PALETTE_KEYS: PaletteKey[] = ['sand', 'sage', 'ink', 'rose']
const FONT_KEYS: FontKey[] = ['literary', 'geometric', 'editorial', 'hyperlegible']
const DENSITY_KEYS: Density[] = ['compact', 'regular', 'comfy']

function DevPanel() {
  const navigate = useNavigate()
  // Read from local stores (instant), write through useSyncedPrefs (server +
  // local rollback on failure). The store values stay aligned with the
  // server because useHydratePrefs runs in __root.
  const coach = useCoachStore((s) => s.coach)
  const palette = useUiStore((s) => s.palette)
  const mode = useUiStore((s) => s.mode)
  const font = useUiStore((s) => s.font)
  const density = useUiStore((s) => s.density)
  const synced = useSyncedPrefs()

  return (
    <MobileFrame tabs={false}>
      <div
        style={{
          height: '100%',
          padding: '14px 22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          color: 'var(--ink)',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Mono>Dev · tweaks</Mono>
          <Btn variant="ghost" size="sm" onClick={() => navigate({ to: '/' })}>
            Klar
          </Btn>
        </div>

        <Section label="Coach">
          <Stack gap="6px">
            {COACHES.map((c) => {
              const on = coach === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    void synced.setCoach(c)
                  }}
                  style={pickerStyle(on)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{COACH_LABELS[c]}</span>
                    {on && <Mono size={10}>aktiv</Mono>}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--muted)',
                      marginTop: 4,
                      lineHeight: 1.45,
                    }}
                  >
                    {COACH_BLURBS[c]}
                  </div>
                </button>
              )
            })}
          </Stack>
        </Section>

        <Hairline />

        <Section label="Palett">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {PALETTE_KEYS.map((k) => (
              <PaletteSwatch
                key={k}
                paletteKey={k}
                active={palette === k}
                onClick={() => {
                  void synced.setPalette(k)
                }}
              />
            ))}
          </div>
        </Section>

        <Section label="Tema">
          <Stack dir="row" gap="8px">
            <Btn
              variant={mode === 'light' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                if (mode !== 'light') void synced.setMode('light')
              }}
            >
              Ljus
            </Btn>
            <Btn
              variant={mode === 'dark' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                if (mode !== 'dark') void synced.setMode('dark')
              }}
            >
              Mörk
            </Btn>
          </Stack>
        </Section>

        <Hairline />

        <Section label="Typografi">
          <Stack gap="6px">
            {FONT_KEYS.map((k) => {
              const on = font === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    void synced.setFont(k)
                  }}
                  style={pickerStyle(on)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONTS[k].display,
                        fontWeight: FONTS[k].displayWeight,
                        fontSize: 18,
                      }}
                    >
                      {FONTS[k].label}
                    </span>
                    {on && <Mono size={10}>aktiv</Mono>}
                  </div>
                </button>
              )
            })}
          </Stack>
        </Section>

        <Hairline />

        <Section label="Densitet">
          <Stack dir="row" gap="8px">
            {DENSITY_KEYS.map((d) => (
              <Btn
                key={d}
                variant={density === d ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  void synced.setDensity(d)
                }}
              >
                {DENSITIES[d].label}
              </Btn>
            ))}
          </Stack>
        </Section>

        <Hairline />

        <Section label="API self-check">
          <ApiSelfCheck />
        </Section>

        <Hairline />

        <Section label="Session resume">
          <SessionResumeCheck />
        </Section>
      </div>
    </MobileFrame>
  )
}

// ── API self-check ────────────────────────────────────────────────────
// Live readout of /api/me/prefs through the typed Hono client. Doubles as
// the E2E target that proves the SPA → Worker → D1 chain end-to-end.
function ApiSelfCheck() {
  const prefs = useUserPrefs()
  const update = useUpdateUserPrefs()

  return (
    <div data-testid="api-self-check">
      <div
        style={{
          padding: 12,
          background: 'var(--panel-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--ink-2)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {prefs.isLoading && <span data-testid="api-loading">laddar prefs…</span>}
        {prefs.isError && (
          <span data-testid="api-error" style={{ color: 'var(--bad)' }}>
            error: {String(prefs.error)}
          </span>
        )}
        {prefs.data && (
          <span data-testid="api-ok">
            ok · id={prefs.data.id} · coach={prefs.data.coach} · palette={prefs.data.palette}
          </span>
        )}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn
          variant="secondary"
          size="sm"
          onClick={() => update.mutate({ coach: 'kompis' })}
          disabled={update.isPending}
        >
          set coach=kompis
        </Btn>
        <Btn
          variant="secondary"
          size="sm"
          onClick={() => update.mutate({ coach: 'taktiker' })}
          disabled={update.isPending}
        >
          set coach=taktiker
        </Btn>
        {update.isError && (
          <span
            data-testid="mut-error"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 'var(--font-mono-track)',
              textTransform: 'uppercase',
              color: 'var(--bad)',
            }}
          >
            mut error
          </span>
        )}
        {update.isSuccess && (
          <span
            data-testid="mut-ok"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 'var(--font-mono-track)',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            mut ok
          </span>
        )}
      </div>
    </div>
  )
}

// ── Session resume ────────────────────────────────────────────────────
// Demonstrates + tests mid-exercise device-swap continuity. Reads the
// current active session, lets us start one, advance position, and end
// it. Refetches every 30s while focused so a swap from another device
// reflects within that window.
function SessionResumeCheck() {
  const active = useActiveSession()
  const start = useStartSession()
  const update = useUpdateSession()

  return (
    <div data-testid="session-resume">
      <div
        style={{
          padding: 12,
          background: 'var(--panel-2)',
          border: '1px solid var(--hairline)',
          borderRadius: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--ink-2)',
        }}
      >
        {active.isLoading && <span data-testid="session-loading">laddar session…</span>}
        {active.isError && (
          <span data-testid="session-error" style={{ color: 'var(--bad)' }}>
            error: {String(active.error)}
          </span>
        )}
        {active.data === null && <span data-testid="session-none">ingen aktiv session</span>}
        {active.data && (
          <span data-testid="session-active">
            id={active.data.id} · kind={active.data.kind} · pos={active.data.position}
          </span>
        )}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn
          variant="secondary"
          size="sm"
          disabled={start.isPending || !!active.data}
          onClick={() => start.mutate({ kind: 'drill', sections: 'ord' })}
        >
          start drill
        </Btn>
        <Btn
          variant="secondary"
          size="sm"
          disabled={!active.data || update.isPending}
          onClick={() => {
            if (active.data) {
              update.mutate({
                id: active.data.id,
                patch: { position: (active.data.position ?? 0) + 1 },
              })
            }
          }}
        >
          pos++
        </Btn>
        <Btn
          variant="secondary"
          size="sm"
          disabled={!active.data || update.isPending}
          onClick={() => {
            if (active.data) {
              update.mutate({ id: active.data.id, patch: { end: true } })
            }
          }}
        >
          end session
        </Btn>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>{label}</Eyebrow>
      {children}
    </div>
  )
}

function pickerStyle(active: boolean): React.CSSProperties {
  return {
    width: '100%',
    textAlign: 'left',
    padding: '12px 14px',
    background: active ? 'var(--panel-2)' : 'var(--panel)',
    border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
    borderRadius: 12,
    fontFamily: 'inherit',
    color: 'inherit',
    cursor: 'pointer',
  }
}

// Palette swatch — three-stripe pill (bg / panel / accent) so the user sees
// the actual character of each palette before applying it.
function PaletteSwatch({
  paletteKey,
  active,
  onClick,
}: {
  paletteKey: PaletteKey
  active: boolean
  onClick: () => void
}) {
  const p = PALETTES[paletteKey].light
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Palett: ${PALETTES[paletteKey].label}`}
      aria-pressed={active}
      style={{
        flex: '1 1 calc(50% - 5px)',
        minWidth: 110,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 10,
        border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
        borderRadius: 12,
        background: 'var(--panel)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          height: 26,
          borderRadius: 6,
          overflow: 'hidden',
          border: `1px solid ${p.hairline}`,
        }}
        aria-hidden
      >
        <div style={{ flex: 1, background: p.bg }} />
        <div style={{ flex: 1, background: p.panel2 }} />
        <div style={{ flex: 1, background: p.accent }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 500, fontSize: 13 }}>{PALETTES[paletteKey].label}</span>
        {active && <Mono size={10}>aktiv</Mono>}
      </div>
    </button>
  )
}
