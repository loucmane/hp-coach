import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AnswerLetter } from '@/data/questions'
import { useFolioFonts } from '@/folio/lib/useFolioFonts'
import { firstSessionDoneLine } from '@/lib/firstSession'
import { useFirstContentSignal } from '@/lib/motion'
import { TodayPreview, WelcomeBrev } from './WelcomeBrev'
import { WelcomeFokus } from './WelcomeFokus'
import { WelcomeUppslag } from './WelcomeUppslag'
import {
  DIRECTIONS,
  PALETTES,
  QUESTIONS,
  type Selection,
  STEPS,
  upcomingSittings,
  type WelcomeFlow,
} from './welcomeFixtures'
import '@/folio/styles/tokens.css'
import '@/folio/styles/palette.css'
import './welcomeBakeoff.css'

export default function WelcomeBakeoff({
  sel,
  onSelect,
}: {
  sel: Selection
  onSelect: (next: Partial<Selection>) => void
}) {
  useFirstContentSignal()
  useFolioFonts()
  const [sittings] = useState(upcomingSittings)
  const [sittingId, setSitting] = useState(sittings[0]?.id ?? '')
  const [minutes, setMinutes] = useState(20)
  const [question, setQuestion] = useState(0)
  const [picks, setPicks] = useState<(AnswerLetter | null)[]>([null, null, null])
  const [revealed, setRevealed] = useState(false)
  const [destination, setDestination] = useState(false)
  const [completion, setCompletion] = useState(false)
  const stages = useRef<HTMLDivElement>(null)
  const previousStep = useRef(sel.s)
  const previousQuestion = useRef(question)
  useEffect(() => {
    if (previousStep.current !== sel.s || previousQuestion.current !== question) {
      const activeStage = document.activeElement?.closest('.wb-surface')
      ;(activeStage ?? stages.current)?.querySelector<HTMLElement>('.wb-title')?.focus()
      previousStep.current = sel.s
      previousQuestion.current = question
    }
  }, [sel.s, question])

  const select = (next: Partial<Selection>) => {
    if (next.s) setDestination(false)
    onSelect(next)
  }
  const flow: WelcomeFlow = {
    sel,
    select,
    sittings,
    sitting: sittings.find((s) => s.id === sittingId) ?? null,
    setSitting,
    minutes,
    setMinutes,
    question,
    picks,
    revealed,
    pick: (answer) =>
      setPicks((before) => before.map((pick, index) => (index === question ? answer : pick))),
    reveal: () => setRevealed(true),
    nextQuestion: () => {
      setRevealed(false)
      if (question === 2) {
        setCompletion(true)
        select({ s: 6 })
      } else setQuestion(question + 1)
    },
    // Direct step selection is a completed visual fixture; playing the
    // questions uses only the actual answers. The viewer labels the fixture.
    doneLine:
      firstSessionDoneLine(QUESTIONS, completion ? picks : QUESTIONS.map((q) => q.answer)) ??
      'Du är igång.',
    destination,
    goToday: () => setDestination(true),
    practice: () => {
      setQuestion(0)
      setPicks([null, null, null])
      setCompletion(false)
      setRevealed(false)
      select({ s: 5 })
    },
  }

  return (
    <main
      className="wb-viewer"
      data-folio=""
      data-theme={sel.t}
      data-palette={sel.p}
      data-testid="welcome-bakeoff"
    >
      <header className="wb-controls" data-testid="welcome-controls">
        <div className="wb-control-heading">
          <div>
            <p className="wb-eyebrow">Folio+ · designstudie</p>
            <h1>En första sida.</h1>
          </div>
          <p>Tre sätt att välkomna. Samma innehåll.</p>
        </div>
        <div className="wb-control-row">
          <ControlGroup label="Riktning">
            {DIRECTIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-pressed={sel.d === d.key && !sel.sbs}
                onClick={() => select({ d: d.key, sbs: false })}
              >
                {d.key.toUpperCase()} · {d.name}
              </button>
            ))}
          </ControlGroup>
          <ControlGroup label="Jämförelse">
            <button type="button" aria-pressed={sel.sbs} onClick={() => select({ sbs: !sel.sbs })}>
              Sida vid sida
            </button>
          </ControlGroup>
        </div>
        <div className="wb-control-row">
          <ControlGroup label="Steg">
            {STEPS.map((step) => (
              <button
                key={step.key}
                type="button"
                aria-pressed={sel.s === step.key && !destination}
                onClick={() => select({ s: step.key })}
              >
                {step.label}
              </button>
            ))}
          </ControlGroup>
        </div>
        <div className="wb-control-row">
          <ControlGroup label="Ram">
            {(['desktop', 'phone'] as const).map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={sel.w === w}
                onClick={() => select({ w })}
              >
                {w === 'desktop' ? 'Dator' : 'Telefon'}
              </button>
            ))}
          </ControlGroup>
          <ControlGroup label="Tema">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={sel.t === t}
                onClick={() => select({ t })}
              >
                {t === 'light' ? 'Ljust' : 'Mörkt'}
              </button>
            ))}
          </ControlGroup>
          <ControlGroup label="Färg">
            {PALETTES.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={sel.p === p.key}
                onClick={() => select({ p: p.key })}
              >
                {p.label}
              </button>
            ))}
          </ControlGroup>
        </div>
        <p className="wb-review-note">
          Förhandsvisning med Kim som exempel. Val och svar sparas bara här.
          {sel.s === 6 && !completion && !destination
            ? ' Klart visar ett exempel med tre rätta svar.'
            : ''}
          {destination ? ' Du ser nu Idag. Välj ett steg för att återgå till välkomsten.' : ''}
        </p>
      </header>
      <div ref={stages} className="wb-stages" data-side-by-side={sel.sbs} data-width={sel.w}>
        {DIRECTIONS.filter((d) => sel.sbs || d.key === sel.d).map((direction) => (
          <section
            className="wb-candidate"
            key={direction.key}
            aria-label={`${direction.key.toUpperCase()} · ${direction.name}`}
          >
            <header className="wb-caption">
              <span>
                <b>{direction.key.toUpperCase()}</b> {direction.name}
              </span>
              <p>{direction.description}</p>
            </header>
            <PreviewFrame width={sel.w}>
              <div
                className="wb-surface"
                data-folio=""
                data-theme={sel.t}
                data-palette={sel.p}
                data-width={sel.w}
                data-step={sel.s}
                data-testid={`welcome-${direction.key}`}
              >
                {destination ? (
                  <div className="wb-destination">
                    <TodayPreview flow={flow} />
                  </div>
                ) : direction.key === 'a' ? (
                  <WelcomeBrev flow={flow} />
                ) : direction.key === 'b' ? (
                  <WelcomeFokus flow={flow} />
                ) : (
                  <WelcomeUppslag flow={flow} />
                )}
              </div>
            </PreviewFrame>
          </section>
        ))}
      </div>
    </main>
  )
}

function PreviewFrame({ width, children }: { width: Selection['w']; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const element = frame.current
    if (!element) return
    const measure = () =>
      setScale(
        width === 'desktop' && element.clientWidth > 0
          ? Math.min(1, element.clientWidth / 1100)
          : 1,
      )
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [width])
  return (
    <div className="wb-frame" data-width={width} ref={frame}>
      <div
        className="wb-canvas"
        style={{ zoom: scale, width: width === 'desktop' && scale < 1 ? 1100 : '100%' }}
      >
        {children}
      </div>
    </div>
  )
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="wb-control-group">
      <legend className="wb-control-label">{label}</legend>
      <div>{children}</div>
    </fieldset>
  )
}
