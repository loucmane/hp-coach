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
import { useRef, useState } from 'react'
import type { DataExportEnvelope } from '@/api/hooks/useDataExport'
import {
  downloadExport,
  parseImportFile,
  useExportData,
  useImportData,
} from '@/api/hooks/useDataExport'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Btn, Eyebrow, Hairline, Mono, Stack } from '@/components/primitives'
import { ImportConfirmSheet } from '@/components/settings/ImportConfirmSheet'
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

  // ── Data export/import (task #28) ─────────────────────────────────────
  const exportData = useExportData()
  const importData = useImportData()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingImport, setPendingImport] = useState<DataExportEnvelope | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importDone, setImportDone] = useState(false)

  const handleExportClick = async () => {
    setImportError(null)
    const envelope = await exportData.mutateAsync()
    downloadExport(envelope)
  }

  const handleImportFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file later
    if (!file) return
    setImportError(null)
    setImportDone(false)
    try {
      const envelope = await parseImportFile(file)
      setPendingImport(envelope)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Kunde inte läsa filen.')
    }
  }

  const handleImportConfirm = async () => {
    if (!pendingImport) return
    try {
      await importData.mutateAsync(pendingImport)
      setImportDone(true)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Importen misslyckades.')
    } finally {
      setPendingImport(null)
    }
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
              <Mono>Din data</Mono>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                Exportera allt HP-Coach vet om dig — pass, misstag, inställningar, provresultat —
                som en JSON-fil. Bra som backup, eller om du vill ta med dig din data.
              </div>
              <Btn
                onClick={handleExportClick}
                data-testid="avancerat-export-data"
                variant="ghost"
                disabled={exportData.isPending}
              >
                {exportData.isPending ? 'Exporterar…' : 'Exportera min data'}
              </Btn>

              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)', marginTop: 8 }}>
                Importera en tidigare export. Detta ersätter all din nuvarande data — du får
                bekräfta innan något skrivs.
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                data-testid="avancerat-import-file-input"
                onChange={handleImportFileChosen}
                style={{ display: 'none' }}
              />
              <Btn
                onClick={() => fileInputRef.current?.click()}
                data-testid="avancerat-import-data"
                variant="ghost"
                disabled={importData.isPending}
              >
                {importData.isPending ? 'Importerar…' : 'Importera data'}
              </Btn>
              {importError && (
                <div
                  data-testid="avancerat-import-error"
                  style={{ fontSize: 13, color: 'var(--danger, #b3261e)' }}
                >
                  {importError}
                </div>
              )}
              {importDone && (
                <div
                  data-testid="avancerat-import-done"
                  style={{ fontSize: 13, color: 'var(--accent)' }}
                >
                  Klart — din data är återställd.
                </div>
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
      {pendingImport && (
        <ImportConfirmSheet
          onConfirm={handleImportConfirm}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </MobileFrame>
  )
}
