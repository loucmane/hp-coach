// /diagnostik — 10-question onboarding diagnostic (B4).
//
// Thin route over SessionPlayer with a custom picker that samples
// across all 8 sections in a balanced distribution. Results record
// like any other session, so the next plan generation has real
// per-section signal. The cold-start scheduler item
// (`Diagnos · några frågor`) deep-links here.
//
// Visible to authenticated users; reachable any time the user wants
// to re-baseline. After completion the user lands on the coached
// `DiagnosticReport` ("Vad vi tror nu") instead of the generic
// DrillResult — see #140.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useRecordMistake } from '@/api/hooks/useMistakes'
import { DiagnosticReport } from '@/components/diagnostic/DiagnosticReport'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { DIAGNOSTIC_LENGTH, pickDiagnosticQuestions } from '@/lib/diagnostic'

type DiagnostikSearch = { qid?: string }

function validateSearch(input: Record<string, unknown>): DiagnostikSearch {
  const qid = input.qid
  if (typeof qid === 'string' && qid.length > 0 && qid.length < 80) {
    return { qid }
  }
  return {}
}

export const Route = createFileRoute('/diagnostik')({
  validateSearch,
  component: DiagnostikScreen,
})

function DiagnostikScreen() {
  const recordMistake = useRecordMistake()
  const navigate = useNavigate()
  const { qid: urlQid } = Route.useSearch()

  const setUrlQid = useCallback(
    (next: string | null) => {
      navigate({
        to: '/diagnostik',
        search: next ? { qid: next } : {},
        replace: true,
      })
    },
    [navigate],
  )

  return (
    <SessionPlayer
      sessionKind="mock_diagnostic"
      sections="diagnostic"
      activeTab="ova"
      urlSyncedQid={{ qid: urlQid ?? null, setQid: setUrlQid }}
      pickQuestions={pickDiagnosticQuestions}
      idleEyebrow="Diagnos"
      idleHeadline="Var står du?"
      idleSubcopy={`${DIAGNOSTIC_LENGTH} frågor från riktiga prov, spridda över alla sektioner. Vi ser vart du står innan vi börjar.`}
      idleMeta={`~ 12 minuter · ingen tid pressar`}
      emptyCopy="Inga frågor klara just nu — försök igen senare."
      onWrong={(q) => {
        // Same as /drill: record the miss so the repetition queue
        // picks it up. Fire-and-forget; a failed write doesn't block.
        recordMistake.mutate({ questionId: q.qid })
      }}
      renderDone={({ summary, onReplay, onHome }) => (
        <DiagnosticReport summary={summary} onReplay={onReplay} onHome={onHome} />
      )}
    />
  )
}
