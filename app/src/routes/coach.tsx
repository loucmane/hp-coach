// Coach tab — currently hosts the Layer-2 dogfood export tool.
//
// The user practices in /drill or /repetition, hits 👎 on confusing
// explanations (those qids accumulate in localStorage via
// app/src/api/feedback.ts:submitFeedback). To share that list with the
// regen pipeline, they click "Exportera feedback" here and paste the
// JSON into the next conversation. Two clicks vs the docs/explanations.md
// devtools-console snippet.
//
// When v2 ships (POST /api/explanations/feedback), this view becomes
// a server-backed feedback dashboard. For now: localStorage + clipboard.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { clearFeedback, getAllFeedback } from '@/api/feedback'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Btn, Card, Eyebrow, Mono, Stack } from '@/components/primitives'
import { TAB_ROUTE } from '@/lib/nav'

export const Route = createFileRoute('/coach')({
  component: CoachView,
})

type ToastState = { kind: 'success' | 'empty' | 'error'; message: string } | null

function CoachView() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<ToastState>(null)
  const [count, setCount] = useState<number>(() => getAllFeedback().length)

  async function exportFeedback() {
    const entries = getAllFeedback()
    if (entries.length === 0) {
      setToast({ kind: 'empty', message: 'Ingen feedback att exportera ännu' })
      return
    }
    try {
      // Sort newest first so the most recent 👎s land at the top of the
      // pasted JSON — easier for the human reader of the resulting blob.
      entries.sort((a, b) => b.reviewed_at - a.reviewed_at)
      await navigator.clipboard.writeText(JSON.stringify(entries, null, 2))
      setToast({
        kind: 'success',
        message: `Kopierat (${entries.length} feedback-poster) — klistra in i Claude-chatten`,
      })
    } catch {
      // Fallback for browsers that block clipboard.writeText (Safari
      // sometimes does this from non-secure contexts). Print to console
      // so the user can copy from there.
      // eslint-disable-next-line no-console
      console.log('HPC feedback export:', entries)
      setToast({
        kind: 'error',
        message: 'Klippblock nekat — feedback finns i konsolen istället',
      })
    }
  }

  function resetFeedback() {
    if (!confirm('Rensa all sparad feedback? Kan inte ångras.')) return
    clearFeedback()
    setCount(0)
    setToast({ kind: 'success', message: 'Feedback rensad' })
  }

  // Recompute count after any export (in case other tabs wrote to
  // localStorage in the meantime). Cheap; localStorage is sync.
  function refresh() {
    setCount(getAllFeedback().length)
  }

  return (
    <MobileFrame tabs activeTab="coach" onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}>
      <Page
        runningHead={['HP · COACH', 'Coach']}
        status={{
          mode: 'COACH',
          context: 'dogfood-feedback',
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <div style={{ padding: '20px 22px 24px', height: '100%', overflowY: 'auto' }}>
          <Stack gap={18}>
            <div>
              <Eyebrow>Coach</Eyebrow>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 6 }}>
                Dogfood-feedback
              </div>
            </div>

            <Card>
              <Stack gap={12}>
                <Mono>{count} sparade poster</Mono>
                <div style={{ fontSize: 14, lineHeight: 1.4, color: 'var(--ink-soft)' }}>
                  Träna i <strong>Övning</strong> eller <strong>Repetition</strong> och tryck 👎 på
                  förklaringar som var otydliga. Här exporterar du listan till Claude för
                  regenerering.
                </div>
                <Btn
                  onClick={() => {
                    exportFeedback().finally(refresh)
                  }}
                  full
                >
                  Exportera feedback till urklipp
                </Btn>
                {count > 0 && (
                  <Btn variant="secondary" onClick={resetFeedback}>
                    Rensa alla poster
                  </Btn>
                )}
              </Stack>
            </Card>

            {toast && (
              <Card
                padded
                style={{
                  background:
                    toast.kind === 'success'
                      ? 'var(--panel)'
                      : toast.kind === 'empty'
                        ? 'var(--panel)'
                        : 'var(--panel)',
                }}
              >
                <div style={{ fontSize: 13 }}>{toast.message}</div>
              </Card>
            )}
          </Stack>
        </div>
      </Page>
    </MobileFrame>
  )
}
