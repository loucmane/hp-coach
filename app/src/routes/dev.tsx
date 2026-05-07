// /dev — design-time tweaks panel.
//
// Mirrors the prototype's HPTweaks: live coach voice, palette swatches,
// font pairing picker, theme mode toggle, density swap. Lets us screenshot
// every variant without rebuilding. Strictly dogfood/dev — would be hidden
// behind a feature flag in any public build.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

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
  const coach = useCoachStore((s) => s.coach)
  const setCoach = useCoachStore((s) => s.setCoach)

  const palette = useUiStore((s) => s.palette)
  const setPalette = useUiStore((s) => s.setPalette)
  const mode = useUiStore((s) => s.mode)
  const toggleMode = useUiStore((s) => s.toggleMode)
  const font = useUiStore((s) => s.font)
  const setFont = useUiStore((s) => s.setFont)
  const density = useUiStore((s) => s.density)
  const setDensity = useUiStore((s) => s.setDensity)

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
                <button key={c} type="button" onClick={() => setCoach(c)} style={pickerStyle(on)}>
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
                onClick={() => setPalette(k)}
              />
            ))}
          </div>
        </Section>

        <Section label="Tema">
          <Stack dir="row" gap="8px">
            <Btn
              variant={mode === 'light' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => mode !== 'light' && toggleMode()}
            >
              Ljus
            </Btn>
            <Btn
              variant={mode === 'dark' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => mode !== 'dark' && toggleMode()}
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
                <button key={k} type="button" onClick={() => setFont(k)} style={pickerStyle(on)}>
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
                onClick={() => setDensity(d)}
              >
                {DENSITIES[d].label}
              </Btn>
            ))}
          </Stack>
        </Section>
      </div>
    </MobileFrame>
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
