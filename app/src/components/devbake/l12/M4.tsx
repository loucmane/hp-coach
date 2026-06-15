// L12 derivative round — variant M4: "KVITTOT" (the receipt).
//
// Recipe: D's chassis and tempo everywhere (stat row, ONE filled resume button,
// flat hairline plan — rendered as L13's checkbox rows, single-axis drill,
// structured Lösning document). The grading moment is L13's: the picked letter
// chip becomes a self-drawing check (calm rust X on a miss, no shake; D's quiet
// ring on the actually-correct row), one held breath (~1s), then the pedagogy
// cascades. The verdict line is L12's: italic serif "Rätt." entering as settling
// ink — the only serif in the variant is the verdict line and the solution lede.

import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type Phase = 'idle' | 'graded' | 'pedagogy'

const LETTERS = 'abcde'
const BREATH_MS = 1000

const CSS = `
.m4-root {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.55;
}
.m4-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 72px 28px 120px;
}
.m4-num { font-variant-numeric: tabular-nums; }

.m4-reset {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  margin: 0;
  text-align: left;
  cursor: pointer;
  appearance: none;
}
.m4-root :focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 6px;
}

/* ---- shared type ---- */
.m4-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.m4-display {
  margin: 14px 0 0;
  font-size: 56px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
  color: var(--ink);
}
@media (max-width: 520px) {
  .m4-display { font-size: 40px; }
}

/* ---- motion ---- */
.m4-in { animation: m4-up 200ms var(--ease-reading) both; }
@keyframes m4-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
@keyframes m4-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@keyframes m4-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes m4-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
@keyframes m4-ink {
  from { opacity: 0; filter: blur(3px); transform: translateY(3px); }
  to { opacity: 1; filter: blur(0); transform: none; }
}
@keyframes m4-ring-in {
  from { box-shadow: inset 0 0 0 0 transparent; opacity: 0.4; }
  to { box-shadow: inset 0 0 0 1.5px var(--ok); opacity: 1; }
}

/* ---- drill ---- */
.m4-hint {
  margin-top: 28px;
  padding-left: 16px;
  border-left: 2px solid var(--hairline-2);
}
.m4-hint-handle {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-2);
}
.m4-hint-move {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--muted);
  max-width: 56ch;
}

.m4-opts {
  margin: 44px 0 0;
  padding: 0;
  border: 0;
  border-top: 1px solid var(--hairline);
  min-width: 0;
}
.m4-opt {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 14px;
  border-bottom: 1px solid var(--hairline);
  border-radius: 0;
  font-size: 18px;
  transition: background-color 150ms var(--ease-reading), opacity 200ms var(--ease-reading);
}
.m4-opt:hover:enabled { background: var(--panel); }
.m4-opt:disabled { cursor: default; }
.m4-chip {
  flex: none;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  border: 1px solid var(--hairline-2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  color: var(--muted);
}
.m4-mark {
  flex: none;
  width: 24px;
  height: 24px;
}
.m4-mark-svg { display: block; width: 24px; height: 24px; }
.m4-mark-path {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: m4-draw 300ms var(--ease-reading) 80ms forwards;
}
.m4-mark--ok { color: var(--ok); }
.m4-mark--bad { color: var(--bad); }
.m4-opt--picked-ok { background: var(--ok-soft); }
.m4-opt--picked-bad { background: var(--bad-soft); }
.m4-opt--picked-ok .m4-opt-text { color: var(--ink); font-weight: 550; }
.m4-opt--key {
  animation: m4-ring-in 200ms var(--ease-reading) 300ms both;
  border-radius: 8px;
}
.m4-opt--dim { opacity: 0.45; }

/* L12's verdict — the only serif moment, left-aligned at the picked row */
.m4-verdict {
  margin: 30px 0 0;
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
  animation: m4-ink 260ms var(--ease-reading) 250ms both;
}
.m4-verdict-word {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 32px;
  line-height: 1;
  letter-spacing: -0.01em;
}
.m4-verdict-word--ok { color: var(--ok); }
.m4-verdict-word--bad { color: var(--bad); }
.m4-verdict-tail { font-size: 14px; color: var(--muted); }

/* ---- pedagogy (D's structured document) ---- */
.m4-ped {
  margin-top: 48px;
  background: var(--panel);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 36px 36px 32px;
  animation: m4-rise 220ms var(--ease-reading) both;
}
@media (max-width: 520px) {
  .m4-ped { padding: 24px 20px; }
}
.m4-ped-solution {
  margin: 14px 0 0;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 500;
  letter-spacing: -0.005em;
  line-height: 1.5;
  max-width: 56ch;
  animation: m4-up 200ms var(--ease-reading) 60ms both;
}
.m4-step {
  margin-top: 32px;
  display: flex;
  gap: 18px;
  animation: m4-up 200ms var(--ease-reading) both;
}
.m4-step-n {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted-2);
  padding-top: 3px;
  flex: none;
  width: 14px;
}
.m4-step-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.005em;
}
.m4-step-text {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--ink-2);
  max-width: 58ch;
}
.m4-ped-sub {
  margin-top: 44px;
  padding-top: 24px;
  border-top: 1px solid var(--hairline);
}
.m4-dis {
  margin-top: 24px;
  animation: m4-up 200ms var(--ease-reading) both;
}
.m4-dis-head {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
}
.m4-dis-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-2);
  flex: none;
  width: 14px;
}
.m4-dis-body {
  margin: 8px 0 0;
  font-size: 13.5px;
  color: var(--ink-2);
  max-width: 58ch;
}
.m4-dis-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-2);
  margin-right: 6px;
}

.m4-next-row {
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 16px;
  animation: m4-fade 180ms var(--ease-reading) 260ms both;
}
.m4-primary {
  background: var(--accent);
  color: var(--accent-ink);
  border: 0;
  border-radius: 8px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 550;
  letter-spacing: -0.005em;
  text-align: center;
  transition: opacity 150ms var(--ease-reading), transform 150ms var(--ease-reading);
}
.m4-primary:hover { opacity: 0.92; }
.m4-primary:active { transform: translateY(1px); }
.m4-kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted-2);
}

/* ---- home ---- */
.m4-stats {
  margin-top: 56px;
  display: flex;
  gap: 64px;
  flex-wrap: wrap;
}
.m4-stat-value {
  margin: 8px 0 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
}
.m4-stat-sub {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--ok);
}
.m4-stat-sub--quiet { color: var(--muted); }

.m4-resume {
  margin-top: 64px;
  background: var(--panel);
  border-radius: 10px;
  padding: 26px 28px;
  box-shadow:
    0 1px 2px color-mix(in oklch, var(--ink) 6%, transparent),
    0 6px 20px color-mix(in oklch, var(--ink) 6%, transparent);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.m4-resume-main { flex: 1 1 280px; min-width: 0; }
.m4-resume-line {
  margin: 8px 0 0;
  font-size: 17px;
  font-weight: 550;
  letter-spacing: -0.01em;
}
.m4-resume-meta {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.m4-section { margin-top: 72px; }
.m4-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--hairline);
}

/* flat hairline plan — as L13's checkbox rows */
.m4-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  padding: 18px 4px;
  border-bottom: 1px solid var(--hairline);
  border-radius: 0;
  transition: background-color 150ms var(--ease-reading);
}
.m4-row--press:hover { background: var(--panel); }
.m4-circle {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border-radius: 50%;
  border: 1.5px solid var(--hairline-2);
  transition: border-color 150ms var(--ease-reading);
}
.m4-row--press:hover .m4-circle { border-color: var(--accent); }
.m4-row-main { flex: 1 1 auto; min-width: 0; }
.m4-row-headline {
  margin: 0;
  font-size: 15px;
  font-weight: 550;
  letter-spacing: -0.005em;
}
.m4-row-rationale {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.m4-row-end {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
  flex: none;
  padding-top: 3px;
}
.m4-row-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-2);
  width: 48px;
  flex: none;
  padding-top: 3px;
}

/* the contract sentence — closes the plan, stays sans, stays quiet */
.m4-contract {
  margin: 18px 0 0;
  padding: 0 4px;
  font-size: 13px;
  color: var(--muted);
  max-width: 56ch;
}

@media (prefers-reduced-motion: reduce) {
  .m4-root *, .m4-root *::before, .m4-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
  .m4-mark-path { stroke-dashoffset: 0; }
}
`

function delay(ms: number): { animationDelay: string } {
  return { animationDelay: `${ms}ms` }
}

function sv(n: string): string {
  return n.replace('.', ',')
}

// L13's grading mark: the chip becomes a self-drawing check (or a calm X).
function GradeMark({ correct }: { correct: boolean }): ReactElement {
  return (
    <span className={`m4-mark ${correct ? 'm4-mark--ok' : 'm4-mark--bad'}`} aria-hidden="true">
      <svg className="m4-mark-svg" viewBox="0 0 24 24" role="presentation" aria-hidden="true">
        {correct ? (
          <path className="m4-mark-path" pathLength={1} d="M5 12.5l4.6 4.6L19 7.6" />
        ) : (
          <path className="m4-mark-path" pathLength={1} d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
        )}
      </svg>
    </span>
  )
}

function Drill(): ReactElement {
  const [phase, setPhase] = useState<Phase>('idle')
  const [picked, setPicked] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const timerRef = useRef<number | null>(null)

  const correct = picked === QUESTION.answer
  const graded = phase !== 'idle'

  const pick = useCallback(
    (letter: string) => {
      if (phase !== 'idle') return
      setPicked(letter)
      setPhase('graded')
    },
    [phase],
  )

  const reset = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setPicked(null)
    setPhase('idle')
    setRound((r) => r + 1)
  }, [])

  // The held breath: ~1s between the drawn mark and the pedagogy cascade.
  useEffect(() => {
    if (phase !== 'graded') return
    timerRef.current = window.setTimeout(() => setPhase('pedagogy'), BREATH_MS)
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'idle') {
        const idx = LETTERS.indexOf(e.key.toLowerCase())
        const opt = QUESTION.options[idx]
        if (idx >= 0 && opt) pick(opt.letter)
      } else if (e.key === 'Enter') {
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pick, reset])

  return (
    <div className="m4-wrap" key={round}>
      <header>
        <p className="m4-eyebrow m4-num m4-in" style={delay(0)}>
          {QUESTION.sectionLabel.toUpperCase()} · FRÅGA {QUESTION.number} AV {QUESTION.total}
        </p>
        <h1 className="m4-display m4-in" style={delay(50)}>
          {QUESTION.prompt}
        </h1>
      </header>

      {!graded && (
        <aside className="m4-hint m4-in" style={delay(100)}>
          <p className="m4-hint-handle">{EXPLANATION.pregradeTactic.handle}</p>
          <p className="m4-hint-move">{EXPLANATION.pregradeTactic.move}</p>
        </aside>
      )}

      <fieldset className="m4-opts" aria-label="Svarsalternativ">
        {QUESTION.options.map((opt, i) => {
          const isPicked = picked === opt.letter
          const isKey = opt.letter === QUESTION.answer
          let stateClass = ''
          if (graded) {
            if (isPicked && isKey) stateClass = ' m4-opt--picked-ok'
            else if (isPicked) stateClass = ' m4-opt--picked-bad'
            else if (isKey) stateClass = ' m4-opt--key'
            else stateClass = ' m4-opt--dim'
          }
          return (
            <button
              key={opt.letter}
              type="button"
              className={`m4-opt m4-reset m4-in${stateClass}`}
              style={delay(140 + i * 40)}
              disabled={graded}
              onClick={() => pick(opt.letter)}
            >
              {graded && isPicked ? (
                <GradeMark correct={isKey} />
              ) : (
                <span className="m4-chip" aria-hidden="true">
                  {opt.letter.toLowerCase()}
                </span>
              )}
              <span className="m4-opt-text">{opt.text}</span>
            </button>
          )
        })}
      </fieldset>

      {graded && (
        <p className="m4-verdict" role="status">
          <span
            className={`m4-verdict-word ${correct ? 'm4-verdict-word--ok' : 'm4-verdict-word--bad'}`}
          >
            {correct ? 'Rätt.' : 'Fel.'}
          </span>
          <span className="m4-verdict-tail">
            {correct
              ? 'Snyggt — taktiken höll hela vägen.'
              : `Rätt svar är ${QUESTION.answer.toLowerCase()}) vilja ha. Häng med i varför.`}
          </span>
        </p>
      )}

      {phase === 'pedagogy' && (
        <>
          <section className="m4-ped" aria-label="Förklaring">
            <p className="m4-eyebrow">Lösning</p>
            <p className="m4-ped-solution">{EXPLANATION.solution}</p>

            {EXPLANATION.steps.map((step, i) => (
              <div key={step.n} className="m4-step" style={delay(120 + i * 60)}>
                <span className="m4-step-n m4-num">{step.n}</span>
                <div>
                  <h2 className="m4-step-title">{step.title}</h2>
                  <p className="m4-step-text">{step.text}</p>
                </div>
              </div>
            ))}

            <div className="m4-ped-sub">
              <p className="m4-eyebrow">Varför de andra lockar</p>
              {EXPLANATION.distractors.map((d, i) => (
                <div key={d.letter} className="m4-dis" style={delay(320 + i * 60)}>
                  <p className="m4-dis-head">
                    <span className="m4-dis-tag">{d.letter}</span>
                    <span>{d.text}</span>
                  </p>
                  <p className="m4-dis-body">
                    <span className="m4-dis-label">Lockar</span>
                    {d.whyTempting}
                  </p>
                  <p className="m4-dis-body">
                    <span className="m4-dis-label">Men</span>
                    {d.whyWrong}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="m4-next-row">
            <button type="button" className="m4-primary m4-reset" onClick={reset}>
              Nästa fråga
            </button>
            <span className="m4-kbd">Enter</span>
          </div>
        </>
      )}
    </div>
  )
}

function Home(): ReactElement {
  return (
    <div className="m4-wrap">
      <header>
        <p className="m4-eyebrow m4-in" style={delay(0)}>
          {HOME.dateLabel}
        </p>
        <h1 className="m4-display m4-in" style={delay(50)}>
          {HOME.greeting}
        </h1>
      </header>

      <div className="m4-stats">
        <div className="m4-in" style={delay(100)}>
          <p className="m4-eyebrow">Prognos</p>
          <p className="m4-stat-value m4-num">{sv(HOME.projectedScore)}</p>
          <p className="m4-stat-sub m4-num">{sv(HOME.scoreDelta)}</p>
        </div>
        <div className="m4-in" style={delay(140)}>
          <p className="m4-eyebrow">Svit</p>
          <p className="m4-stat-value m4-num">{HOME.streakDays} dagar</p>
          <p className="m4-stat-sub m4-stat-sub--quiet">utan avbrott</p>
        </div>
        <div className="m4-in" style={delay(180)}>
          <p className="m4-eyebrow">Idag</p>
          <p className="m4-stat-value m4-num">{HOME.estimatedMinutes} min</p>
          <p className="m4-stat-sub m4-stat-sub--quiet">{HOME.plan.length} moment</p>
        </div>
      </div>

      <section className="m4-resume m4-in" style={delay(220)} aria-label="Fortsätt här">
        <div className="m4-resume-main">
          <p className="m4-eyebrow">Fortsätt här</p>
          <p className="m4-resume-line m4-num">
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </p>
          <p className="m4-resume-meta m4-num">
            Pausad på {HOME.resume.device} · {HOME.resume.when}
          </p>
        </div>
        <button type="button" className="m4-primary m4-reset">
          Fortsätt
        </button>
      </section>

      <section className="m4-section m4-in" style={delay(280)} aria-label="Dagens plan">
        <div className="m4-section-head">
          <p className="m4-eyebrow">Dagens plan</p>
          <p className="m4-eyebrow m4-num">{HOME.estimatedMinutes} min</p>
        </div>
        {HOME.plan.map((item) => (
          <button key={item.id} type="button" className="m4-row m4-row--press m4-reset">
            <span className="m4-circle" aria-hidden="true" />
            <span className="m4-row-main">
              <span className="m4-row-headline m4-num" style={{ display: 'block' }}>
                {item.headline}
              </span>
              <span className="m4-row-rationale m4-num" style={{ display: 'block' }}>
                {item.rationale}
              </span>
            </span>
            <span className="m4-row-end m4-num">{item.minutes} min</span>
          </button>
        ))}
        <p className="m4-contract m4-num">
          Tre block, 16 minuter — sedan är dagen klar. Inget mer krävs.
        </p>
      </section>

      <section className="m4-section m4-in" style={delay(340)} aria-label="Dina fällor just nu">
        <div className="m4-section-head">
          <p className="m4-eyebrow">Dina fällor just nu</p>
        </div>
        {HOME.traps.map((trap) => (
          <div key={trap.id} className="m4-row">
            <span className="m4-row-tag">{trap.section}</span>
            <span className="m4-row-main">
              <span className="m4-row-headline" style={{ display: 'block' }}>
                {trap.headline}
              </span>
            </span>
            <span className="m4-row-end m4-num">×{trap.count}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

export function M4({ screen }: { screen: RedesignScreen }): ReactElement {
  return (
    <div className="m4-root">
      <style>{CSS}</style>
      {screen === 'drill' ? <Drill /> : <Home />}
    </div>
  )
}
