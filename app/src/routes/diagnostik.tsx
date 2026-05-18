// /diagnostik — 10-question onboarding diagnostic (B4).
//
// Thin route over SessionPlayer with a custom picker that samples
// across all 8 sections. Results record like any other session, so
// the next plan generation has real per-section signal. The cold-
// start scheduler item (`Diagnos · några frågor`) deep-links here.
//
// Visible to authenticated users; reachable any time the user wants
// to re-baseline. After completion the user lands on the standard
// DrillResult screen and taps "Hem →" to see a freshly-prescribed plan.

import { createFileRoute } from '@tanstack/react-router'
import { useRecordMistake } from '@/api/hooks/useMistakes'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { DIAGNOSTIC_LENGTH, pickDiagnosticQuestions } from '@/lib/diagnostic'

export const Route = createFileRoute('/diagnostik')({
  component: DiagnostikScreen,
})

function DiagnostikScreen() {
  const recordMistake = useRecordMistake()

  return (
    <SessionPlayer
      sessionKind="mock_diagnostic"
      sections="diagnostic"
      activeTab="drill"
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
    />
  )
}
