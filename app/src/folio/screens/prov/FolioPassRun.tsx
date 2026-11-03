import { useAuth } from '@clerk/clerk-react'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MOCK_DURATION_MS, type MockPassProps, useMockPass } from '@/components/mock/useMockPass'
import type { AnswerLetter } from '@/data/questions'
import type {
  DrillCoreActions,
  DrillCoreRefs,
  DrillCoreView,
} from '@/folio/screens/drill/drillCore'
import { FigureViewer } from '@/folio/screens/drill/FigureViewer'
import { Options } from '@/folio/screens/drill/Options'
import { QuantPage } from '@/folio/screens/drill/QuantPage'
import { ReadingSpread } from '@/folio/screens/drill/ReadingSpread'
import { folioBlock } from '@/folio/screens/drill/seam'
import { toDrillQuestion } from '@/folio/screens/drill/toDrillQuestion'
import type { DrillFigure, DrillQuestion } from '@/folio/screens/drill/types'
import { useShellFocus } from '@/folio/useShellFocus'
import { useViewport } from '@/hooks/useViewport'
import { PassHead } from './PassHead'
import { PassIndex } from './PassIndex'
import { PassSlip, type PassSlipKind } from './PassSlips'
import { blanksSentence } from './passPace'
import '../drill/drill.css'
import './passRun.css'

export default function FolioPassRun(props: MockPassProps) {
  const { userId } = useAuth()
  return <Pass key={JSON.stringify([userId, props.session.id])} {...props} userId={userId} />
}

function Pass(props: MockPassProps & { userId: string | null | undefined }) {
  const { plan, userId } = props
  const pass = useMockPass(props, userId)
  const { q, index, sheet, countdown, pick, goTo, toggleFlag, settle, abandon } = pass
  const [slip, setSlip] = useState<PassSlipKind | null>(null)
  const closeSlip = useCallback(() => setSlip(null), [])
  const [finishing, setFinishing] = useState(false)
  const finished = finishing || countdown.expired
  const [warning, setWarning] = useState<string | null>(null)
  const warned = useRef(false)
  const [viewer, setViewer] = useState<{ figure: DrillFigure; rotation: number } | null>(null)
  const zoomOpener = useRef<HTMLElement | null>(null)
  const closeViewer = useCallback(() => {
    setViewer(null)
    window.requestAnimationFrame(() => zoomOpener.current?.focus({ preventScroll: true }))
  }, [])
  const onZoom = (figure: DrillFigure, rotation: number) => {
    zoomOpener.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setViewer({ figure, rotation })
  }
  const blanks = blanksSentence(plan, sheet.answers)
  useEffect(() => {
    if (countdown.remainingMs > 0 && countdown.remainingMs <= 300_000 && !warned.current) {
      warned.current = true
      setWarning(`Fem minuter kvar. ${blanks}`)
    }
  }, [countdown.remainingMs, blanks])
  useShellFocus({
    active: !!q,
    onExit: () => {
      if (finished) return
      setViewer(null)
      setSlip('abort')
    },
  })
  if (!q) return null
  const { start, end } = folioBlock(plan, index)
  const flagged = sheet.flagged.has(q.qid)
  const suspended = finished || !!slip || !!viewer
  const navigation = (
    <div className="fa-pass-navigation">
      <button
        type="button"
        className="fa-pass-quiet"
        disabled={index === 0}
        onClick={() => goTo(index - 1)}
        aria-label="Föregående fråga"
      >
        ← Föregående
      </button>
      <button
        type="button"
        className="fa-pass-button fa-pass-flag"
        aria-pressed={flagged}
        aria-keyshortcuts="M"
        onClick={toggleFlag}
      >
        Markera
        {flagged ? (
          <span className="fa-pass-dog-ear" data-testid="prov-dog-ear" aria-hidden="true" />
        ) : null}
      </button>
      <button
        type="button"
        className="fa-pass-quiet"
        disabled={index === plan.length - 1}
        onClick={() => goTo(index + 1)}
        aria-label="Nästa fråga"
      >
        Nästa →
      </button>
    </div>
  )
  return (
    <div className="fa-pass fa-drill" data-testid="mock-runner" data-presentation="folio">
      <div className="fa-pass-content" inert={suspended || undefined}>
        <PassHead
          plan={plan}
          index={index}
          remainingMs={countdown.remainingMs}
          durationMs={props.durationMsOverride ?? MOCK_DURATION_MS}
          onOverview={() => setSlip('overview')}
          onSubmit={() => setSlip('submit')}
        />
        {warning && !finished ? (
          <aside className="fa-pass-warning" data-testid="prov-pace-warn">
            <p role="status">{warning}</p>
            <button
              type="button"
              className="fa-pass-quiet"
              aria-label="Stäng tidsnotisen"
              onClick={() => setWarning(null)}
            >
              Stäng
            </button>
          </aside>
        ) : null}
        <PassQuestion
          key={`${start}:${end}`}
          questions={plan.slice(start, end).map((item) => toDrillQuestion(item))}
          index={index - start}
          position={index}
          total={plan.length}
          picked={(sheet.answers.get(q.qid)?.letter as AnswerLetter | undefined) ?? null}
          onPick={pick}
          onMove={(delta) => goTo(index + delta)}
          onFlag={toggleFlag}
          suspended={suspended}
          action={navigation}
          onZoom={onZoom}
        />
        <footer className="fa-pass-footer">
          <button
            type="button"
            className="fa-pass-quiet"
            data-testid="mock-abandon"
            onClick={() => setSlip('abort')}
          >
            Avbryt provpass
          </button>
        </footer>
      </div>
      {finished ? (
        <p className="fa-pass-note" role="status">
          Lämnar in provpasset …
        </p>
      ) : slip ? (
        <PassSlip
          kind={slip}
          blanks={blanks}
          onClose={closeSlip}
          onSubmit={() => {
            setFinishing(true)
            setSlip(null)
            settle()
          }}
          onAbandon={() => {
            setFinishing(true)
            setSlip(null)
            abandon()
          }}
        >
          <PassIndex
            plan={plan}
            sheet={sheet}
            index={index}
            onJump={(next) => {
              setSlip(null)
              goTo(next)
            }}
          />
        </PassSlip>
      ) : null}
      {!finished && viewer ? (
        <FigureViewer
          figure={viewer.figure}
          initialRotation={viewer.rotation}
          onClose={closeViewer}
        />
      ) : null}
    </div>
  )
}

// The shared spread expects the drill's full interface. Pass mode supplies a
// permanently ungraded view and no grading actions; answer persistence belongs
// exclusively to useMockPass. In particular, results must stay empty for ELF
// gaps, whose drill history otherwise reveals the correct words.
const idle = () => {}
const ungradedActions: DrillCoreActions = {
  select: idle,
  toggleEliminate: idle,
  lock: () => false,
  next: () => null,
  exit: idle,
  setFocusPara: idle,
  moveFocusPara: idle,
  cite: idle,
  toggleStep: idle,
  goToStep: idle,
  restart: idle,
  gradeAs: idle,
  reopen: idle,
  reset: idle,
}
const emptyRefs: DrillCoreRefs = { para: () => idle, step: () => idle }

function PassQuestion({
  questions,
  index,
  position,
  total,
  picked,
  onPick,
  onMove,
  onFlag,
  suspended,
  action,
  onZoom,
}: {
  questions: DrillQuestion[]
  index: number
  position: number
  total: number
  picked: AnswerLetter | null
  onPick: (letter: AnswerLetter) => void
  onMove: (delta: number) => void
  onFlag: () => void
  suspended: boolean
  action: ReactNode
  onZoom: (figure: DrillFigure, rotation: number) => void
}) {
  const q = questions[index]
  const phone = useViewport() === 'phone'
  const root = useRef<HTMLDivElement>(null)
  const problem = useRef<HTMLElement>(null)
  const verdict = useRef<HTMLHeadingElement>(null)
  const [eliminations, setEliminations] = useState<Record<string, AnswerLetter[]>>({})
  const eliminated = useMemo(() => new Set(eliminations[q.qid] ?? []), [eliminations, q.qid])
  const letters = (q.options ?? []).map((option) => option.letter as AnswerLetter)
  const toggleEliminate = (letter: AnswerLetter) =>
    setEliminations((prior) => {
      const current = prior[q.qid] ?? []
      return {
        ...prior,
        [q.qid]: current.includes(letter)
          ? current.filter((item) => item !== letter)
          : [...current, letter],
      }
    })
  const view: DrillCoreView = {
    question: q,
    index,
    total: questions.length,
    phase: 'question',
    selected: picked,
    picked: null,
    correct: null,
    explanation: null,
    results: [],
    letters,
    eliminated,
    elapsed: 0,
    passage: q.passage ?? null,
    focusPara: null,
    flashPara: null,
    flashSource: null,
    openSteps: new Set(),
    stepCites: {},
    distractorCites: {},
    cited: [],
    marks: [],
  }
  const actions = { ...ungradedActions, select: onPick, toggleEliminate }
  // Only question changes move focus; dismissing a slip restores its own opener.
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus follows qid, not timer renders or overlays
  useEffect(() => {
    if (!suspended) problem.current?.focus({ preventScroll: phone })
  }, [q.qid])
  useEffect(() => {
    if (suspended) return
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable], [role="dialog"], [inert]')
      )
        return
      if (
        target instanceof HTMLElement &&
        target !== document.body &&
        !root.current?.closest('.fa-pass')?.contains(target)
      )
        return
      const key = event.key.toUpperCase()
      const letter = /^[1-5]$/.test(key) ? letters[Number(key) - 1] : (key as AnswerLetter)
      if (letter && letters.includes(letter)) {
        event.preventDefault()
        if (event.shiftKey) toggleEliminate(letter)
        else onPick(letter)
      } else if (event.shiftKey) return
      else if (key === 'M') {
        event.preventDefault()
        onFlag()
      } else if (key === 'J' || key === 'ARROWRIGHT') {
        event.preventDefault()
        onMove(1)
      } else if (key === 'K' || key === 'ARROWLEFT') {
        event.preventDefault()
        onMove(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const reading = ['LÄS', 'ELF', 'DTK'].includes(q.section)
  return (
    <div
      className="fa-pass-question"
      ref={root}
      data-testid="drill-question"
      data-qid={q.qid}
      data-phase="question"
    >
      {reading ? (
        <ReadingSpread
          view={view}
          act={actions}
          refs={emptyRefs}
          questions={questions}
          phone={phone}
          index={position}
          total={total}
          frameworks={{}}
          action={action}
          problem={problem}
          verdict={verdict}
          onZoom={(rotation) => {
            if (q.figure) onZoom(q.figure, rotation)
          }}
          suspended={suspended}
        />
      ) : (
        <div className="fa-qsheet">
          <section
            className="fa-qcol"
            ref={problem}
            tabIndex={-1}
            aria-label={`Uppgift ${position + 1}`}
          >
            <QuantPage
              q={q}
              n={position + 1}
              hang
              figure={q.figure ? <PassFigure key={q.figure.src} figure={q.figure} /> : null}
            />
            <Options view={view} act={actions} />
            {action}
          </section>
        </div>
      )}
      <p className="fa-pass-keys">
        A–{letters.at(-1) ?? 'E'} / 1–{letters.length} välj · ← → / J K byt fråga · M markera · ⇧ +
        bokstav stryk
      </p>
    </div>
  )
}

function PassFigure({ figure }: { figure: DrillFigure }) {
  const [failed, setFailed] = useState(false)
  return (
    <figure className="fa-figure">
      {failed ? (
        <p className="fa-pass-note">
          Figuren kunde inte laddas.{' '}
          <button type="button" className="fa-pass-quiet" onClick={() => setFailed(false)}>
            Försök igen
          </button>
        </p>
      ) : (
        <img
          src={`/${figure.src}`}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          onError={() => setFailed(true)}
        />
      )}
    </figure>
  )
}
