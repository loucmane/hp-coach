// /avancerat — minor settings + dev affordances.
//
// Was a `StubBody` placeholder; the audit flagged it as dead chrome
// reachable from Home's trailing link with nothing inside. Populated
// here with the smallest set of dogfood-useful actions:
//
//   - Diagnostic reset (clears `lastDiagnosticAt` + score baseline so
//     the cold-start path re-appears; tests don't need this since they
//     don't render this surface, but it's the v1 "I broke the
//     diagnostic — let me restart" affordance)
//   - Cmd+K hint (palette is the real settings surface; pointing to it
//     instead of building a redundant settings panel)
//   - Link to Feedback (the renamed /coach surface)
//
// Future: data export, real account settings, theme overrides without
// Cmd+K. Keep flat for now.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Btn, Eyebrow, Hairline, Mono, Stack } from '@/components/primitives'
import { clearDiagnosticMemory, loadDiagnosticMemory } from '@/lib/diagnosticMemory'

export const Route = createFileRoute('/avancerat')({
  component: AvanceratScreen,
})

function AvanceratScreen() {
  const navigate = useNavigate()
  const [hasMemory, setHasMemory] = useState(() => loadDiagnosticMemory() !== null)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true)
      return
    }
    clearDiagnosticMemory()
    setHasMemory(false)
    setConfirmingReset(false)
  }

  return (
    <MobileFrame tabs={false}>
      <Page
        runningHead={['HP · COACH', 'Avancerat']}
        status={{
          mode: 'AVANCERAT',
          context: 'inställningar',
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <div data-testid="avancerat-body" style={{ padding: '20px 22px 24px', overflowY: 'auto' }}>
          <Stack gap={24}>
            <div>
              <Eyebrow>Avancerat</Eyebrow>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  marginTop: 6,
                  lineHeight: 1.15,
                  letterSpacing: '-0.012em',
                }}
              >
                Inställningar
              </div>
              <Mono style={{ marginTop: 8, color: 'var(--muted)' }}>
                Allt utöver vardagsflödet.
              </Mono>
            </div>

            <Hairline />

            <Stack gap={6}>
              <Mono>Tema, typografi, layout</Mono>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                Tryck <strong>⌘ + K</strong> för paletten. Där styr du palett, läge, typsnitt,
                densitet och övningens layout.
              </div>
            </Stack>

            <Hairline />

            <Stack gap={8}>
              <Mono>Diagnostik</Mono>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                {hasMemory
                  ? 'Din senaste diagnostik finns sparad. Återställ för att köra om från noll och få cold-start-flödet igen.'
                  : 'Ingen diagnostik körd ännu. Cold-start-flödet visas på Hem.'}
              </div>
              {hasMemory && (
                <Btn onClick={handleReset} data-testid="avancerat-reset-diagnostic" variant="ghost">
                  {confirmingReset ? 'Säkert? Tryck igen' : 'Återställ diagnostik'}
                </Btn>
              )}
            </Stack>

            <Hairline />

            <Stack gap={8}>
              <Mono>Feedback (dogfood)</Mono>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                Förklaringar du har markerat med 👎 hamnar i Feedback-fliken — exportera dem
                därifrån för regenerering.
              </div>
              <Btn
                onClick={() => navigate({ to: '/coach' })}
                data-testid="avancerat-open-feedback"
                variant="ghost"
              >
                Öppna Feedback →
              </Btn>
            </Stack>

            <Hairline />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn
                onClick={() => navigate({ to: '/' })}
                data-testid="avancerat-back-home"
                variant="ghost"
              >
                ← Tillbaka till hem
              </Btn>
            </div>
          </Stack>
        </div>
      </Page>
    </MobileFrame>
  )
}
