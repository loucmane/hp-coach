// /dev — design-time tweaks panel.
//
// Mirrors the prototype's HPTweaks surface: live coach voice switching,
// theme toggle, density swap. Lets us screenshot every variant without
// rebuilding. Strictly dogfood/dev — would be hidden behind a feature
// flag in any public build.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Eyebrow, Hairline, Mono, Stack } from '@/components/primitives'
import type { Density } from '@/lib/tokens'
import { COACH_BLURBS, COACH_LABELS, type CoachKey } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/dev')({
  component: DevPanel,
})

const COACHES: CoachKey[] = ['kompis', 'professor', 'taktiker']
const DENSITIES: Density[] = ['regular', 'compact']

function DevPanel() {
  const navigate = useNavigate()
  const coach = useCoachStore((s) => s.coach)
  const setCoach = useCoachStore((s) => s.setCoach)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
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

        <Section label="Tema">
          <Stack dir="row" gap="8px">
            <Btn
              variant={theme === 'light' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => theme !== 'light' && toggleTheme()}
            >
              Ljus
            </Btn>
            <Btn
              variant={theme === 'dark' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => theme !== 'dark' && toggleTheme()}
            >
              Mörk
            </Btn>
          </Stack>
        </Section>

        <Hairline />

        <Section label="Densitet">
          <Stack dir="row" gap="8px">
            {DENSITIES.map((d) => (
              <Btn
                key={d}
                variant={density === d ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setDensity(d)}
              >
                {d === 'regular' ? 'Regular' : 'Kompakt'}
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
