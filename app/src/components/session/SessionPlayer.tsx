// Reusable Q-by-Q session player.
//
// Handles the same state machine as the drill MVP shipped earlier
// (idle → answering → graded → done) but parameterised by:
//
//   - pickQuestions:  () => Question[] | Promise<Question[]>
//                     Resolves to the plan when the user clicks "Start".
//                     For /drill this is "10 random ORD"; for /repetition
//                     it's "10 most-frequent stumbles from the queue".
//
//   - sessionKind:    SessionKind passed to POST /api/sessions so the
//                     backend can later analytics-bucket drill vs review.
//
//   - sections:       optional CSV stored on the session row.
//
//   - onCorrect/onWrong:
//                     side-effects fired alongside the per-question
//                     attempt POST. /drill uses onWrong to record
//                     mistakes; /repetition uses onCorrect to resolve them.
//
//   - idleCopy:       hero text on the idle screen (Swedish product copy).
//
//   - emptyCopy:      shown when pickQuestions returns 0 (e.g. "Inga
//                     missar att repetera"). Replaces the start button.
//
// The component owns the session row's full lifecycle:
//   start  → POST /api/sessions
//   pick   → POST /api/attempts (always, regardless of correctness)
//   next   → PATCH /api/sessions/:id { position, currentQuestionId }
//   end    → PATCH /api/sessions/:id { end: true }
//
// Stale-session handling: useActiveSession is consulted on the idle
// screen so we surface "Avsluta tidigare övning" if a session of the
// same kind is still hanging open from another tab/device.

import { useNavigate } from '@tanstack/react-router'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from 'react'

import { useSubmitAttempt } from '@/api/hooks/useAttempts'
import {
  type SessionKind,
  useActiveSession,
  useStartSession,
  useUpdateSession,
} from '@/api/hooks/useSessions'
import { DrillProgress } from '@/components/drill/DrillProgress'
import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { DrillResult } from '@/components/drill/DrillResult'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Btn, Eyebrow, Mono } from '@/components/primitives'
import { StudyDesk } from '@/components/StudyDesk'
import type { AnswerLetter, Question } from '@/data/questions'
import { useViewport } from '@/hooks/useViewport'
import { TAB_ROUTE } from '@/lib/nav'

type Phase = 'idle' | 'answering' | 'graded' | 'done'

export type SessionPlayerProps = {
  /** Kind to pass to POST /api/sessions. */
  sessionKind: SessionKind
  /** Optional CSV stored on the session row, e.g. "ORD". */
  sections?: string
  /** Resolves to the plan when the user clicks Start. */
  pickQuestions: () => Promise<Question[]> | Question[]
  /** Hero copy on the idle screen — e.g. "10 synonymfrågor från riktiga prov." */
  idleEyebrow: string
  idleHeadline: string
  idleSubcopy: string
  idleMeta?: string
  /** Optional Swedish reassurance shown when pickQuestions returns []. */
  emptyCopy?: string
  /** Side-effects on each grade. Run after the local state flip. */
  onCorrect?: (q: Question) => void
  onWrong?: (q: Question) => void
  /** Active-tab to highlight in the bottom nav while idle/done. */
  activeTab: 'home' | 'drill' | 'coach' | 'progress'
  /** Optional extra content rendered on the idle screen, after the meta
   *  line. Used by /drill to surface a "repetera missar" hint. */
  idleExtra?: ReactNode
  /** Disable the primary "Starta övning" button — used when the consumer
   *  knows there's nothing to start (e.g. /repetition with empty queue). */
  disableStart?: boolean
  /** Replacement label shown on the disabled primary button. */
  disableStartLabel?: string
  /** Secondary CTA rendered just above the primary button. Used to give
   *  the user a way out when the primary action is disabled. */
  idleSecondaryCta?: ReactNode
}

export function SessionPlayer(props: SessionPlayerProps) {
  const navigate = useNavigate()
  const activeSession = useActiveSession()
  const startSession = useStartSession()
  const updateSession = useUpdateSession()
  const submitAttempt = useSubmitAttempt()
  // Phase A.5 — needs to be read at the top of the component before
  // any early returns (idle / done branches below) so React's
  // hook-rule isn't violated when the phase transitions through
  // different render paths.
  const viewport = useViewport()

  const [phase, setPhase] = useState<Phase>('idle')
  const [plan, setPlan] = useState<Question[]>([])
  const [picks, setPicks] = useState<(AnswerLetter | null)[]>([])
  const [index, setIndex] = useState(0)
  const [questionStartedAt, setQuestionStartedAt] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [emptyAttempted, setEmptyAttempted] = useState(false)
  // Tracks the full "user clicked Start" → "first question rendered"
  // window. startSession.isPending alone misses the pickQuestions phase,
  // which can include the very first dataset fetch (~6 MB) on a cold
  // load — that's long enough for a double-click to fire begin() twice.
  const [starting, setStarting] = useState(false)

  const begin = useCallback(async () => {
    if (starting) return
    setStarting(true)
    try {
      const picked = await props.pickQuestions()
      if (picked.length === 0) {
        setEmptyAttempted(true)
        return
      }
      const session = await startSession.mutateAsync({
        kind: props.sessionKind,
        sections: props.sections,
      })
      setSessionId(session.id)
      setPlan(picked)
      setPicks(new Array(picked.length).fill(null))
      setIndex(0)
      setPhase('answering')
      setQuestionStartedAt(Date.now())
      updateSession.mutate({
        id: session.id,
        patch: { position: 0, currentQuestionId: picked[0]?.qid ?? null },
      })
    } finally {
      setStarting(false)
    }
  }, [starting, props, startSession, updateSession])

  const onPick = useCallback(
    (letter: AnswerLetter) => {
      if (phase !== 'answering') return
      const q = plan[index]
      const correct = letter === q.answer
      setPicks((prev) => {
        const next = [...prev]
        next[index] = letter
        return next
      })
      setPhase('graded')
      if (sessionId !== null) {
        submitAttempt.mutate({
          sessionId,
          questionId: q.qid,
          selectedAnswer: letter,
          correct,
          timeTakenMs: Date.now() - questionStartedAt,
        })
      }
      if (correct) props.onCorrect?.(q)
      else props.onWrong?.(q)
    },
    [phase, plan, index, sessionId, submitAttempt, questionStartedAt, props],
  )

  const onNext = useCallback(() => {
    const last = index === plan.length - 1
    if (last) {
      if (sessionId !== null) {
        updateSession.mutate({ id: sessionId, patch: { end: true } })
      }
      setPhase('done')
      return
    }
    const nextIndex = index + 1
    setIndex(nextIndex)
    setPhase('answering')
    setQuestionStartedAt(Date.now())
    if (sessionId !== null) {
      updateSession.mutate({
        id: sessionId,
        patch: {
          position: nextIndex,
          currentQuestionId: plan[nextIndex]?.qid ?? null,
        },
      })
    }
  }, [index, plan, sessionId, updateSession])

  const onReplay = useCallback(() => {
    setPhase('idle')
    setPlan([])
    setPicks([])
    setIndex(0)
    setSessionId(null)
    setEmptyAttempted(false)
    void begin()
  }, [begin])

  const onHome = useCallback(() => navigate({ to: '/' }), [navigate])

  // Phase A.8 — keyboard handlers (EDITION's "stolen ideas" from
  // ATLAS + TERMINAL):
  //   - a/b/c/d/e: commit the answer directly while in `answering`
  //   - Enter / Space: advance from `graded` to the next question
  //   - Esc: leave the drill (back to home, via the done state)
  // These ride on top of the existing click/tap flow — they're
  // desktop-first, but harmless on phone (touch keyboards rarely fire
  // these keys). The active-element guard avoids hijacking keystrokes
  // inside form fields (Cmd+K palette input, etc.). The hook is at
  // the top of the component (above the early returns for idle/done)
  // so React's hook-rule isn't violated — the body just does nothing
  // when the phase is idle/done.
  useEffect(() => {
    if (phase !== 'answering' && phase !== 'graded') return
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'answering') {
        const key = e.key.toUpperCase()
        if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
          e.preventDefault()
          onPick(key as AnswerLetter)
        }
      } else if (phase === 'graded') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onNext()
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        if (sessionId !== null) {
          updateSession.mutate({ id: sessionId, patch: { end: true } })
        }
        setPhase('done')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onPick, onNext, sessionId, updateSession])

  if (phase === 'idle') {
    const stale =
      activeSession.data && activeSession.data.kind === props.sessionKind
        ? activeSession.data
        : null
    const isPhone = viewport === 'phone'
    const idleBody = (
      <IdleBody
        {...props}
        isPhone={isPhone}
        starting={starting || startSession.isPending}
        onStart={begin}
        stale={stale}
        onEndStale={() => {
          if (stale) updateSession.mutate({ id: stale.id, patch: { end: true } })
        }}
        emptyAttempted={emptyAttempted}
      />
    )
    if (isPhone) {
      return (
        <MobileFrame
          tabs
          activeTab={props.activeTab}
          onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
        >
          {idleBody}
        </MobileFrame>
      )
    }
    // Desktop idle gets the same Page chrome as the active drill phase
    // — running head + status line — so the chapter-opening composition
    // sits inside the editorial frame instead of floating in an
    // unchromed canvas. The section pulled from props.sections (or a
    // sensible fallback) lets the running head identify what the user
    // is about to drill.
    const sectionLabel = (props.sections || props.activeTab).toString().toUpperCase()
    return (
      <MobileFrame tabs={false}>
        <Page
          runningHead={['HP · Coach', sectionLabel]}
          status={{
            mode: 'Övning',
            context: 'redo',
            hints: ['esc hem', '⌘k palett'],
          }}
        >
          {idleBody}
        </Page>
      </MobileFrame>
    )
  }

  if (phase === 'done') {
    const isPhone = viewport === 'phone'
    if (isPhone) {
      return (
        <MobileFrame
          tabs
          activeTab={props.activeTab}
          onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
        >
          <DrillResult summary={{ questions: plan, picks }} onReplay={onReplay} onHome={onHome} />
        </MobileFrame>
      )
    }
    const sectionLabel = (props.sections || props.activeTab).toString().toUpperCase()
    return (
      <MobileFrame tabs={false}>
        <Page
          runningHead={['HP · Coach', sectionLabel]}
          status={{
            mode: 'Klar',
            context: 'resultat',
            hints: ['esc hem', '⌘k palett'],
          }}
        >
          <DrillResult summary={{ questions: plan, picks }} onReplay={onReplay} onHome={onHome} />
        </Page>
      </MobileFrame>
    )
  }

  const q = plan[index]
  const picked = picks[index]
  // Phase A.5 — reader/studio render the Study Desk (question +
  // pedagogy side-by-side). Phone keeps the single-column DrillQuestion
  // (the prototype's canonical layout). `viewport` is hoisted above
  // any early returns at the top of the component; we just consume
  // it here.
  const useStudyDesk = viewport !== 'phone'
  // Phase A.8 EDITION: status-line context and folio carry the
  // section + question count, so DrillProgress (the visible eyebrow)
  // can be tight against the headword instead of orphaned at the top
  // of the canvas. The Page's bottom status line shows the running
  // progress bar.
  const drillBody = (
    <div
      style={{
        height: useStudyDesk ? undefined : '100%',
        flex: useStudyDesk ? 1 : undefined,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: useStudyDesk ? 0 : 16,
        paddingBottom: useStudyDesk ? 0 : 22,
      }}
    >
      {/* Phone-only: DrillProgress sits as the top chrome since
       *  Page is a no-op at phone. At desktop the status line at the
       *  bottom shows section + progress, so we let DrillQuestion
       *  bring its own section-eyebrow tight to the headword. */}
      {!useStudyDesk && (
        <DrillProgress current={index + 1} total={plan.length} section={q.section} />
      )}
      <div style={{ flex: 1, minHeight: 0, marginTop: useStudyDesk ? 0 : 12 }}>
        {useStudyDesk ? (
          <StudyDesk question={q} picked={picked} graded={phase === 'graded'} onPick={onPick} />
        ) : (
          <DrillQuestion question={q} picked={picked} graded={phase === 'graded'} onPick={onPick} />
        )}
      </div>
      <div
        style={{
          padding: useStudyDesk
            ? 'clamp(16px, 2vh, 24px) clamp(48px, 5vw, 88px) clamp(16px, 2vh, 24px)'
            : '12px var(--pad-lg) 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          // Desktop right-aligns the Nästa CTA; phone keeps full-width
          // for thumb reach.
          alignItems: useStudyDesk ? 'flex-end' : 'stretch',
        }}
      >
        <Btn
          full={!useStudyDesk}
          size="lg"
          onClick={onNext}
          disabled={phase !== 'graded'}
          data-testid="drill-next"
          style={useStudyDesk ? { minWidth: 200 } : undefined}
          className="hpc-btn hpc-breathe"
        >
          {index === plan.length - 1 ? 'Avsluta' : 'Nästa'} →
        </Btn>
      </div>
    </div>
  )

  return (
    <MobileFrame tabs={false}>
      <Page
        runningHead={['HP · Coach', q.section]}
        folio={{ current: index + 1, total: plan.length }}
        status={{
          mode: 'Övning',
          context: `${q.section.toLowerCase()} · fråga ${index + 1}`,
          progress: (index + 1) / plan.length,
          hints: ['esc tillbaka', '⌘k palett'],
        }}
        // A.6V — at studio the drill uses dual-scroll columns inside
        // StudyDesk. `bound` tells the Page shell to bind itself to
        // 100dvh + clip overflow so the columns can claim their own
        // scroll regions. At phone (which short-circuits Page early)
        // this is a no-op.
        bound={useStudyDesk}
      >
        {drillBody}
      </Page>
    </MobileFrame>
  )
}

// ── Idle body ─────────────────────────────────────────────────────────────
type IdleBodyProps = SessionPlayerProps & {
  starting: boolean
  onStart: () => void
  stale: { id: number; kind: string; position: number } | null
  onEndStale: () => void
  emptyAttempted: boolean
  /** Phase A.8.2 — phone keeps the tight artboard composition; desktop
   *  uses the chapter-opening composition (hero headline, marginalia
   *  keyboard hints, bottom-right CTA). */
  isPhone: boolean
}

function IdleBody({
  idleEyebrow,
  idleHeadline,
  idleSubcopy,
  idleMeta,
  idleExtra,
  emptyCopy,
  starting,
  onStart,
  stale,
  onEndStale,
  emptyAttempted,
  disableStart,
  disableStartLabel,
  idleSecondaryCta,
  isPhone,
}: IdleBodyProps) {
  return (
    <div
      data-testid="drill-idle"
      style={{
        // Phase A.8.2 — height: 100% was ignored inside a flex column
        // (the parent's flex-basis: auto wins), so the inner flex:1
        // spacer collapsed and the CTA sat ~280px from the top of a
        // 900px viewport with 600px of empty space below. flex:1 here
        // makes the body actually fill the parent column.
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        // Phone keeps the tight pass-and-tabs padding. Desktop opens
        // into a chapter page: comfortable top margin so the eyebrow +
        // headword sit a third of the way down, with the CTA anchored
        // at the bottom of the page.
        padding: isPhone
          ? 'clamp(28px, 3vw + 16px, 56px) var(--pad-lg) var(--frame-tabbar)'
          : 'clamp(48px, 8vh, 96px) clamp(28px, 4vw, 64px) clamp(32px, 5vh, 56px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isPhone ? 'column' : 'row',
          alignItems: isPhone ? 'stretch' : 'flex-start',
          gap: isPhone ? 0 : 'clamp(32px, 4vw, 64px)',
        }}
      >
        {/* ── Headline column ──────────────────────────────────── */}
        <div style={{ flex: isPhone ? undefined : 1, minWidth: 0 }}>
          <Eyebrow>{idleEyebrow}</Eyebrow>
          <div
            style={{
              marginTop: isPhone ? 18 : 22,
              fontFamily: 'var(--font-display)',
              // Phase A.8.2: hero scale at desktop so the section name
              // ("KVA", "ORD", "Repetition") becomes the chapter title.
              // Phone keeps the compact 32→44px range.
              fontSize: isPhone
                ? 'clamp(32px, 3vw + 22px, 44px)'
                : 'clamp(56px, 5vw + 16px, 112px)',
              lineHeight: 1.02,
              color: 'var(--ink)',
              letterSpacing: '-0.03em',
              fontWeight: 400,
            }}
          >
            {idleHeadline}
          </div>
          {/* Hairline under the headword — book-chapter cue, sized
           *  to the word above (~2.5em). */}
          {!isPhone && (
            <div
              aria-hidden
              style={{
                marginTop: 18,
                width: '2.5em',
                maxWidth: 80,
                height: 1,
                background: 'var(--ink)',
                opacity: 0.4,
              }}
            />
          )}
          <div
            style={{
              marginTop: isPhone ? 8 : 26,
              maxWidth: isPhone ? undefined : '38ch',
              fontFamily: 'var(--font-display)',
              fontSize: isPhone
                ? 'clamp(16px, 0.875rem + 0.4vw, 20px)'
                : 'clamp(18px, 0.95rem + 0.4vw, 22px)',
              lineHeight: isPhone ? 1.35 : 1.5,
              color: 'var(--ink-2)',
            }}
          >
            {idleSubcopy}
          </div>
          {idleMeta && (
            <Mono style={{ marginTop: isPhone ? 20 : 28, display: 'block' }}>{idleMeta}</Mono>
          )}
          {idleExtra && <div style={{ marginTop: 20 }}>{idleExtra}</div>}
        </div>

        {/* ── Desktop marginalia: keyboard hints + session card ── */}
        {!isPhone && (
          <aside
            data-testid="drill-idle-marginalia"
            style={{
              width: 'clamp(220px, 22vw, 280px)',
              flexShrink: 0,
              borderLeft: '1px solid var(--hairline)',
              paddingLeft: 24,
              marginTop: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            <div>
              <Mono style={{ display: 'block', marginBottom: 10 }}>Tangentbord</Mono>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontFamily: 'var(--font-ui)',
                  fontSize: 13,
                  color: 'var(--ink-2)',
                  lineHeight: 1.45,
                }}
              >
                <li>
                  <kbd style={kbdStyle}>a–e</kbd> svar
                </li>
                <li>
                  <kbd style={kbdStyle}>enter</kbd> nästa fråga
                </li>
                <li>
                  <kbd style={kbdStyle}>esc</kbd> avbryt
                </li>
                <li>
                  <kbd style={kbdStyle}>⌘k</kbd> paletten
                </li>
              </ul>
            </div>
            <div>
              <Mono style={{ display: 'block', marginBottom: 10 }}>Anteckning</Mono>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'var(--ink-2)',
                  fontStyle: 'italic',
                }}
              >
                Inga poängavdrag för fel — gissa hellre än att lämna en fråga obesvarad.
              </p>
            </div>
          </aside>
        )}
      </div>

      {(emptyAttempted || disableStart) && emptyCopy && (
        <div
          data-testid="drill-empty"
          style={{
            marginTop: 24,
            padding: '12px 14px',
            background: 'var(--panel-2)',
            border: '1px solid var(--hairline)',
            borderRadius: 'calc(var(--radius) * 0.5)',
            fontSize: 14,
            color: 'var(--ink-2)',
            maxWidth: isPhone ? undefined : 520,
          }}
        >
          {emptyCopy}
        </div>
      )}

      {stale && (
        <div
          data-testid="drill-stale-warning"
          style={{
            marginTop: 24,
            padding: '12px 14px',
            background: 'var(--panel-2)',
            border: '1px solid var(--hairline)',
            borderRadius: 'calc(var(--radius) * 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: isPhone ? undefined : 520,
          }}
        >
          <Mono>Tidigare övning</Mono>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            Ett oavslutat pass från en annan flik eller enhet ligger kvar (vid fråga{' '}
            {stale.position + 1}).
          </div>
          <Btn size="sm" variant="secondary" onClick={onEndStale}>
            Avsluta tidigare
          </Btn>
        </div>
      )}

      {/* Pushes the CTA to the bottom of the page. With flex:1 on the
       *  outer container above, the spacer now actually grows. */}
      <div style={{ flex: 1, minHeight: isPhone ? 0 : 48 }} />

      <div
        style={{
          display: 'flex',
          flexDirection: isPhone ? 'column' : 'row',
          alignItems: isPhone ? 'stretch' : 'center',
          justifyContent: isPhone ? 'stretch' : 'flex-end',
          gap: 12,
        }}
      >
        {idleSecondaryCta && (
          <div
            style={isPhone ? { marginBottom: 10 } : { marginRight: 'auto' }}
            data-testid="drill-secondary-cta"
          >
            {idleSecondaryCta}
          </div>
        )}
        <Btn
          full={isPhone}
          size="xl"
          onClick={onStart}
          disabled={starting || !!disableStart}
          data-testid="drill-start"
          style={isPhone ? undefined : { minWidth: 260 }}
        >
          {starting
            ? 'Startar…'
            : disableStart
              ? (disableStartLabel ?? 'Inget att starta')
              : 'Starta övning →'}
        </Btn>
      </div>
    </div>
  )
}

const kbdStyle: CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  marginRight: 8,
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: 'var(--font-mono-track)',
  background: 'var(--panel-2)',
  border: '1px solid var(--hairline)',
  borderRadius: 4,
  color: 'var(--ink)',
}
