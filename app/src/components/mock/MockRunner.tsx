// Classic Provpass view over the shared pass lifecycle.
import { useAuth } from '@clerk/clerk-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { BoksidanDesk } from '@/components/drill-variants/BoksidanDesk'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn } from '@/components/primitives'
import { dtkBlockPosition } from '@/components/session/SessionPlayer'
import type { AnswerLetter, Question, Section } from '@/data/questions'
import { useDismiss } from '@/folio/lib/useDismiss'
import { useShellFocus } from '@/folio/useShellFocus'
import { useViewport } from '@/hooks/useViewport'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import { type MockPassProps as Props, useMockPass } from './useMockPass'

export type { MockSheetState } from '@/lib/mockSheet'
export { MOCK_DURATION_MS, type MockResultExtras, type MockRunnerSession } from './useMockPass'

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Section-boundary labels for the grid header — one entry per section
 *  run, e.g. "ORD 1–10". Built from the plan's actual composition (not
 *  a hardcoded quota table) so it degrades gracefully for a thin
 *  authentic pass (33/40, etc). */
function sectionBoundaries(
  plan: Question[],
): Array<{ section: Section; start: number; end: number }> {
  const out: Array<{ section: Section; start: number; end: number }> = []
  for (let i = 0; i < plan.length; i++) {
    const section = plan[i].section
    const last = out[out.length - 1]
    if (last && last.section === section) {
      last.end = i + 1
    } else {
      out.push({ section, start: i + 1, end: i + 1 })
    }
  }
  return out
}

export function MockRunner(props: Props) {
  const { userId } = useAuth()
  // A different account or session gets its own answer sheet and settlement
  // guard, even if a parent reuses this component without unmounting it.
  return (
    <MockRunnerPass key={JSON.stringify([userId, props.session.id])} {...props} userId={userId} />
  )
}

function MockRunnerPass(props: Props & { userId: string | null | undefined }) {
  const { plan, userId } = props
  const { index, sheet, q, countdown, pick, goTo, toggleFlag, settle, abandon } = useMockPass(
    props,
    userId,
  )
  const isPhone = useViewport() === 'phone'
  const blockPosition = useMemo(() => dtkBlockPosition(plan, index), [plan, index])
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const continuePass = useCallback(() => setLeaveConfirmOpen(false), [])

  // Keyboard: a–e pick, ←/→ navigate, M toggles uncertainty. No Enter-advance.
  useEffect(() => {
    if (leaveConfirmOpen) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toUpperCase()
      if (key === 'M') {
        e.preventDefault()
        if (!e.repeat) toggleFlag()
        return
      }
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        e.preventDefault()
        pick(key as AnswerLetter)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goTo(index + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goTo(index - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pick, goTo, index, toggleFlag, leaveConfirmOpen])

  const handleSubmitClick = useCallback(() => {
    const unanswered = plan.filter(
      (question) => sheet.answers.get(question.qid)?.letter == null,
    ).length
    const msg =
      unanswered > 0 ? `${unanswered} frågor är obesvarade. Lämna in ändå?` : 'Lämna in provpasset?'
    // House pattern for a confirm-then-act flow (routes/coach.tsx) — no
    // Dialog primitive exists yet for this.
    if (confirm(msg)) settle()
  }, [plan, sheet, settle])

  const handleAbandonClick = useCallback(() => {
    if (confirm('Avbryter du blir provet ogiltigt.')) abandon()
  }, [abandon])

  // Folio's exit confirms that leaving voids this pass, without pushing history.
  useShellFocus({ active: !!q, onExit: () => setLeaveConfirmOpen(true) })

  if (!q) return null

  const boundaries = sectionBoundaries(plan)
  const picked = (sheet.answers.get(q.qid)?.letter as AnswerLetter | undefined) ?? null
  const remaining = countdown.remainingMs
  const underFiveMinutes = remaining < 5 * 60_000

  const header = (
    <MockHeader
      index={index}
      total={plan.length}
      section={q.section}
      remainingMs={remaining}
      urgent={underFiveMinutes}
      onSubmit={handleSubmitClick}
    />
  )

  const grid = (
    <MockGrid
      plan={plan}
      boundaries={boundaries}
      answers={sheet.answers}
      flagged={sheet.flagged}
      currentIndex={index}
      onJump={goTo}
      onToggleFlag={toggleFlag}
    />
  )

  const questionBody = isPhone ? (
    <DrillQuestion
      question={q}
      picked={picked}
      graded={false}
      onPick={pick}
      position={index + 1}
      total={plan.length}
      blockPosition={blockPosition}
    />
  ) : (
    <BoksidanDesk
      question={q}
      explanation={null}
      picked={picked}
      graded={false}
      correct={false}
      onPick={pick}
      onReset={() => {}}
      position={index + 1}
      total={plan.length}
      blockPosition={blockPosition}
    />
  )

  return (
    <MobileFrame tabs={false}>
      <div
        data-testid="mock-runner"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {header}
        {grid}
        <div style={{ flex: 1, minHeight: 0, overflowY: isPhone ? undefined : 'auto' }}>
          {questionBody}
        </div>
        <div style={{ padding: 'var(--pad-md)', textAlign: 'center' }}>
          <button
            type="button"
            data-testid="mock-abandon"
            onClick={handleAbandonClick}
            className="hpc-btn"
            style={{
              all: 'unset',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}
          >
            Avbryt provpass
          </button>
        </div>
        {leaveConfirmOpen && (
          <MockLeaveConfirm
            onContinue={continuePass}
            onLeave={() => {
              setLeaveConfirmOpen(false)
              abandon()
            }}
          />
        )}
      </div>
    </MobileFrame>
  )
}

function MockLeaveConfirm({
  onContinue,
  onLeave,
}: {
  onContinue: () => void
  onLeave: () => void
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef(
    document.activeElement instanceof HTMLButtonElement ? document.activeElement : null,
  )
  useDismiss(true, onContinue, panel, opener, true)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <button
        type="button"
        aria-label="Stäng bekräftelsen"
        tabIndex={-1}
        onClick={onContinue}
        style={{
          position: 'absolute',
          inset: 0,
          border: 0,
          background: 'color-mix(in oklch, var(--ink) 22%, transparent)',
        }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '20px 22px 30px',
          borderTop: '1px solid var(--hairline)',
          borderRadius: '24px 24px 0 0',
          background: 'var(--panel)',
          color: 'var(--ink)',
        }}
      >
        <h2 id={titleId} className="hpc-m3-display" style={{ fontSize: 24, margin: '0 0 14px' }}>
          Avbryt provpasset?
        </h2>
        <p id={descriptionId}>Avbryter du nu blir provpasset ogiltigt.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 24 }}>
          <Btn onClick={onContinue}>Fortsätt provpasset</Btn>
          <Btn variant="secondary" onClick={onLeave}>
            Avbryt provpasset
          </Btn>
        </div>
      </div>
    </div>
  )
}

function MockHeader({
  index,
  total,
  section,
  remainingMs,
  urgent,
  onSubmit,
}: {
  index: number
  total: number
  section: Section
  remainingMs: number
  urgent: boolean
  onSubmit: () => void
}) {
  return (
    <div
      data-testid="mock-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--pad-md)',
        padding: 'var(--pad-md)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>
        Fråga {index + 1}/{total} · {section}
      </div>
      <div
        data-testid="mock-countdown"
        style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 15,
          fontWeight: urgent ? 700 : 400,
          color: urgent ? 'var(--bad, #c0392b)' : 'var(--muted)',
        }}
      >
        {formatClock(remainingMs)}
      </div>
      <Btn size="sm" variant="secondary" data-testid="mock-submit" onClick={onSubmit}>
        Lämna in
      </Btn>
    </div>
  )
}

function MockGrid({
  plan,
  boundaries,
  answers,
  flagged,
  currentIndex,
  onJump,
  onToggleFlag,
}: {
  plan: Question[]
  boundaries: Array<{ section: Section; start: number; end: number }>
  answers: Map<string, { letter: string; lastAt: number }>
  flagged: ReadonlySet<string>
  currentIndex: number
  onJump: (index: number) => void
  onToggleFlag: () => void
}) {
  return (
    <div
      data-testid="mock-grid"
      style={{ padding: 'var(--pad-sm) var(--pad-md)', borderBottom: '1px solid var(--hairline)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <Btn
          size="sm"
          variant={flagged.has(plan[currentIndex].qid) ? 'soft' : 'secondary'}
          aria-pressed={flagged.has(plan[currentIndex].qid)}
          aria-keyshortcuts="M"
          title="Markera eller avmarkera som osäker (M)"
          onClick={onToggleFlag}
        >
          <span aria-hidden="true">?</span> Osäker
        </Btn>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          marginBottom: 4,
        }}
      >
        {boundaries.map((b) => (
          <span key={b.section} data-testid={`mock-boundary-${b.section}`}>
            {sectionLongLabel(b.section).slice(0, 3).toUpperCase()} {b.start}–{b.end}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
        {plan.map((question, i) => {
          const answered = answers.get(question.qid)?.letter != null
          const isCurrent = i === currentIndex
          const isFlagged = flagged.has(question.qid)
          return (
            <button
              key={question.qid}
              type="button"
              data-testid={`mock-cell-${i + 1}`}
              data-answered={answered ? 'true' : 'false'}
              data-current={isCurrent ? 'true' : 'false'}
              aria-label={`Fråga ${i + 1}${isFlagged ? ', osäker' : ''}`}
              onClick={() => onJump(i)}
              style={{
                position: 'relative',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                height: 28,
                borderRadius: 4,
                border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--hairline)',
                background: answered ? 'var(--panel-2)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {i + 1}
              {isFlagged && (
                <span
                  aria-hidden="true"
                  style={{ position: 'absolute', top: 0, right: 2, fontSize: 10 }}
                >
                  ?
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
