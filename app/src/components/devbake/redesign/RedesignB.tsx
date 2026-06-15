import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { RedesignScreen } from './fixtures'
import { EXPLANATION, HOME, QUESTION } from './fixtures'

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.rdb-root {
  --rdb-paper: #FAFAF8;
  --rdb-ink: #16181B;
  --rdb-blue: #2447D6;
  --rdb-green: #1E7F4F;
  --rdb-red: #C03B2B;
  --rdb-rule: rgba(22, 24, 27, 0.045);
  --rdb-hairline: rgba(22, 24, 27, 0.14);
  --rdb-faint: rgba(22, 24, 27, 0.55);
  min-height: 100dvh;
  background: var(--rdb-paper);
  color: var(--rdb-ink);
  font-family: 'Inter Tight', sans-serif;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  padding-bottom: 64px;
  box-sizing: border-box;
}
.rdb-root *, .rdb-root *::before, .rdb-root *::after { box-sizing: border-box }

.rdb-frame {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  min-height: calc(100dvh - 64px);
  padding: 0 1px;
}
.rdb-gridlines {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 0;
}
.rdb-gridlines span { width: 1px; background: var(--rdb-rule) }

.rdb-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-content: start;
}

.rdb-mono {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rdb-faint { color: var(--rdb-faint) }
.rdb-blue { color: var(--rdb-blue) }

.rdb-topbar {
  grid-column: 1 / 13;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid var(--rdb-hairline);
}
.rdb-wordmark {
  font-family: 'Inter Tight', sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.rdb-wordmark em { font-style: normal; color: var(--rdb-blue) }

.rdb-statusbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 44px;
  background: var(--rdb-ink);
  color: var(--rdb-paper);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 -1px 0 rgba(22, 24, 27, 0.2);
  z-index: 10;
}
.rdb-statusbar .rdb-mono { letter-spacing: 0.1em }
.rdb-status-ok { color: #6EE7A8 }
.rdb-status-err { color: #F2A196 }

/* ---------- drill ---------- */
.rdb-qpane {
  grid-column: 1 / 8;
  padding: 36px 28px 48px 20px;
  transition: grid-column 160ms ease-out;
}
.rdb-qpane-full { grid-column: 3 / 11 }
.rdb-coord {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.rdb-meter {
  width: 96px;
  height: 3px;
  background: rgba(22, 24, 27, 0.1);
  position: relative;
  overflow: hidden;
}
.rdb-meter i {
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  transition: transform 180ms ease-out;
}
.rdb-meter-on i { transform: translateX(0) }
.rdb-meter-ok i { background: var(--rdb-green) }
.rdb-meter-err i { background: var(--rdb-red) }
.rdb-verdict {
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 140ms ease-out, transform 140ms ease-out;
}
.rdb-verdict-on { opacity: 1; transform: translateX(0) }
.rdb-verdict-ok { color: var(--rdb-green) }
.rdb-verdict-err { color: var(--rdb-red) }

.rdb-prompt {
  font-size: 44px;
  font-weight: 600;
  letter-spacing: -0.03em;
  margin: 18px 0 6px;
  line-height: 1;
}
.rdb-tactic {
  border-left: 2px solid var(--rdb-blue);
  padding: 10px 0 10px 14px;
  margin: 22px 0 26px;
  max-width: 540px;
}
.rdb-tactic p { margin: 6px 0 0; font-size: 14px; line-height: 1.5 }

.rdb-options { border-top: 1px solid var(--rdb-hairline) }
.rdb-opt {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--rdb-hairline);
  padding: 13px 12px 13px 10px;
  font: inherit;
  color: inherit;
  cursor: pointer;
  position: relative;
  transition: background 130ms ease-out, box-shadow 130ms ease-out;
}
.rdb-opt:hover:enabled {
  background: rgba(22, 24, 27, 0.02);
  box-shadow: inset 2px 0 0 var(--rdb-blue);
}
.rdb-opt:disabled { cursor: default }
.rdb-key {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rdb-hairline);
  border-radius: 2px;
  flex-shrink: 0;
  transition: border-color 130ms ease-out, color 130ms ease-out;
}
.rdb-opt-text { font-size: 16px; font-weight: 500 }
.rdb-opt-tag { margin-left: auto; opacity: 0; transition: opacity 140ms ease-out }
.rdb-opt-locked .rdb-opt-tag { opacity: 1 }
.rdb-opt-ok { box-shadow: inset 2px 0 0 var(--rdb-green) }
.rdb-opt-ok .rdb-key { border-color: var(--rdb-green); color: var(--rdb-green) }
.rdb-opt-ok .rdb-opt-tag { color: var(--rdb-green) }
.rdb-opt-err { box-shadow: inset 2px 0 0 var(--rdb-red) }
.rdb-opt-err .rdb-key { border-color: var(--rdb-red); color: var(--rdb-red) }
.rdb-opt-err .rdb-opt-tag { color: var(--rdb-red) }
.rdb-sweep {
  position: absolute;
  left: 0;
  bottom: -1px;
  height: 2px;
  width: 100%;
  transform: scaleX(0);
  transform-origin: left center;
  animation: rdb-sweep 170ms ease-out forwards;
}
.rdb-sweep-ok { background: var(--rdb-green) }
.rdb-sweep-err { background: var(--rdb-red) }
@keyframes rdb-sweep { to { transform: scaleX(1) } }

.rdb-next {
  margin-top: 28px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--rdb-blue);
  color: var(--rdb-paper);
  border: 0;
  border-radius: 2px;
  padding: 12px 22px;
  cursor: pointer;
  transition: background 130ms ease-out;
}
.rdb-next:hover { background: #1d3ab3 }

.rdb-ped {
  grid-column: 8 / 13;
  border-left: 1px solid var(--rdb-hairline);
  padding: 36px 20px 64px 28px;
  animation: rdb-slidein 160ms ease-out;
}
@keyframes rdb-slidein {
  from { opacity: 0; transform: translateX(12px) }
  to { opacity: 1; transform: translateX(0) }
}
.rdb-solution {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.5;
  margin: 12px 0 28px;
  letter-spacing: -0.015em;
}
.rdb-step {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 0 12px;
  padding: 14px 0;
  border-top: 1px solid var(--rdb-hairline);
  animation: rdb-slidein 160ms ease-out backwards;
}
.rdb-step:nth-of-type(1) { animation-delay: 60ms }
.rdb-step:nth-of-type(2) { animation-delay: 120ms }
.rdb-step:nth-of-type(3) { animation-delay: 180ms }
.rdb-step-title { font-size: 14px; font-weight: 600; margin: 0 0 4px }
.rdb-step-text { font-size: 13px; line-height: 1.55; margin: 0; color: rgba(22, 24, 27, 0.78) }
.rdb-dx {
  padding: 14px 0;
  border-top: 1px solid var(--rdb-hairline);
}
.rdb-dx-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px }
.rdb-dx p { font-size: 13px; line-height: 1.55; margin: 6px 0 0; color: rgba(22, 24, 27, 0.78) }
.rdb-dx b { font-weight: 600; color: var(--rdb-ink) }
.rdb-sect { margin: 32px 0 10px }

/* ---------- home ---------- */
.rdb-h-greet { grid-column: 1 / 13; padding: 32px 20px 8px }
.rdb-h-greet h1 { font-size: 26px; font-weight: 600; letter-spacing: -0.025em; margin: 6px 0 0 }
.rdb-hero {
  grid-column: 1 / 8;
  padding: 28px 36px 40px 20px;
}
.rdb-score {
  font-size: 112px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 0.95;
  margin: 10px 0 26px;
}
.rdb-score-anim { animation: rdb-settle 180ms ease-out }
@keyframes rdb-settle {
  from { opacity: 0; transform: translateY(6px) }
  to { opacity: 1; transform: translateY(0) }
}
.rdb-scale { position: relative; height: 26px; max-width: 520px }
.rdb-scale-rule { position: absolute; top: 12px; left: 0; right: 0; height: 1px; background: var(--rdb-hairline) }
.rdb-tick { position: absolute; top: 8px; width: 1px; height: 9px; background: var(--rdb-hairline) }
.rdb-tick-lab { position: absolute; top: 18px; transform: translateX(-50%); color: var(--rdb-faint) }
.rdb-marker {
  position: absolute;
  top: 4px;
  width: 2px;
  height: 17px;
  background: var(--rdb-blue);
  transform: translateX(-1px);
}
.rdb-rail {
  grid-column: 8 / 13;
  border-left: 1px solid var(--rdb-hairline);
  padding: 28px 20px 40px 28px;
}
.rdb-readout {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid var(--rdb-hairline);
}
.rdb-readout strong { font-size: 22px; font-weight: 600; letter-spacing: -0.02em }
.rdb-resume {
  display: block;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  margin-top: 24px;
  padding: 16px;
  background: transparent;
  border: 1px solid var(--rdb-ink);
  border-radius: 2px;
  cursor: pointer;
  transition: background 130ms ease-out, border-color 130ms ease-out;
}
.rdb-resume:hover { border-color: var(--rdb-blue); background: rgba(36, 71, 214, 0.04) }
.rdb-resume h3 { font-size: 16px; font-weight: 600; margin: 8px 0 4px; letter-spacing: -0.015em }
.rdb-plan { grid-column: 1 / 8; padding: 8px 36px 48px 20px }
.rdb-plan-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px }
.rdb-row {
  display: grid;
  grid-template-columns: 40px 1fr 70px;
  gap: 0 14px;
  align-items: baseline;
  padding: 14px 0;
  border-top: 1px solid var(--rdb-hairline);
  transition: background 130ms ease-out, box-shadow 130ms ease-out;
}
.rdb-row:hover { background: rgba(22, 24, 27, 0.02); box-shadow: inset 2px 0 0 var(--rdb-blue) }
.rdb-row h3 { font-size: 15px; font-weight: 600; margin: 0 0 3px; letter-spacing: -0.015em }
.rdb-row p { font-size: 13px; margin: 0; color: rgba(22, 24, 27, 0.66); line-height: 1.45 }
.rdb-min { text-align: right }
.rdb-traps { grid-column: 8 / 13; border-left: 1px solid var(--rdb-hairline); padding: 8px 20px 48px 28px }
.rdb-trap { padding: 13px 0; border-top: 1px solid var(--rdb-hairline) }
.rdb-trap-head { display: flex; justify-content: space-between; margin-bottom: 5px }
.rdb-trap p { font-size: 13px; margin: 0; line-height: 1.45; color: rgba(22, 24, 27, 0.78) }

@media (max-width: 1000px) {
  .rdb-qpane, .rdb-qpane-full, .rdb-ped, .rdb-hero, .rdb-rail, .rdb-plan, .rdb-traps { grid-column: 1 / 13 }
  .rdb-ped, .rdb-rail, .rdb-traps { border-left: 0; padding-left: 20px }
  .rdb-score { font-size: 96px }
}

@media (prefers-reduced-motion: reduce) {
  .rdb-root *, .rdb-root *::before, .rdb-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
`

const pad2 = (n: number) => String(n).padStart(2, '0')

// Static decorative column rules — keys are stable column ids, the set never reorders.
const GRID_COLS = Array.from({ length: 13 }, (_, i) => `col-${pad2(i)}`)

function GridLines() {
  return (
    <div className="rdb-gridlines" aria-hidden="true">
      {GRID_COLS.map((id) => (
        <span key={id} />
      ))}
    </div>
  )
}

function TopBar({ right }: { right: string }) {
  return (
    <header className="rdb-topbar">
      <div className="rdb-wordmark">
        HP<em>·</em>COACH
      </div>
      <div className="rdb-mono rdb-faint">{right}</div>
    </header>
  )
}

function StatusBar({ left, right }: { left: ReactNode; right: string }) {
  return (
    <footer className="rdb-statusbar">
      <span className="rdb-mono">{left}</span>
      <span className="rdb-mono">{right}</span>
    </footer>
  )
}

function ScoreScale() {
  const ticks = [0, 0.5, 1, 1.5, 2]
  const pos = (v: number) => `${(v / 2) * 100}%`
  return (
    <div className="rdb-scale" aria-hidden="true">
      <div className="rdb-scale-rule" />
      {ticks.map((t) => (
        <span key={t}>
          <i className="rdb-tick" style={{ left: pos(t) }} />
          <i className="rdb-tick-lab rdb-mono" style={{ left: pos(t), fontStyle: 'normal' }}>
            {t.toFixed(1)}
          </i>
        </span>
      ))}
      <i className="rdb-marker" style={{ left: pos(Number(HOME.projectedScore)) }} />
    </div>
  )
}

function HomeScreen() {
  return (
    <div className="rdb-frame">
      <GridLines />
      <div className="rdb-grid">
        <TopBar right={`${HOME.dateLabel} · SERIE ${HOME.streakDays}D`} />

        <section className="rdb-h-greet">
          <div className="rdb-mono rdb-faint">{HOME.dateLabel}</div>
          <h1>{HOME.greeting}</h1>
        </section>

        <section className="rdb-hero">
          <div className="rdb-mono rdb-faint">PROGNOS · NORMERAT VÄRDE</div>
          <div className="rdb-score rdb-score-anim">{HOME.projectedScore}</div>
          <ScoreScale />
          <div className="rdb-mono rdb-blue" style={{ marginTop: 14 }}>
            {HOME.scoreDelta}
          </div>
        </section>

        <aside className="rdb-rail">
          <div className="rdb-readout">
            <span className="rdb-mono rdb-faint">SERIE</span>
            <strong>{HOME.streakDays} dagar</strong>
          </div>
          <div className="rdb-readout">
            <span className="rdb-mono rdb-faint">DAGENS PLAN</span>
            <strong>{HOME.estimatedMinutes} min</strong>
          </div>
          <button type="button" className="rdb-resume">
            <span className="rdb-mono rdb-blue">FORTSÄTT HÄR</span>
            <h3>
              {HOME.resume.kind} {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
              {HOME.resume.total}
            </h3>
            <span className="rdb-mono rdb-faint">
              {HOME.resume.device} · {HOME.resume.when}
            </span>
          </button>
        </aside>

        <section className="rdb-plan">
          <div className="rdb-plan-head">
            <span className="rdb-mono">DAGENS PLAN · {HOME.estimatedMinutes} MIN</span>
            <span className="rdb-mono rdb-faint">{HOME.plan.length} PASS</span>
          </div>
          {HOME.plan.map((item, i) => (
            <div key={item.id} className="rdb-row">
              <span className="rdb-mono rdb-faint">{pad2(i + 1)}</span>
              <div>
                <h3>{item.headline}</h3>
                <p>{item.rationale}</p>
              </div>
              <span className="rdb-mono rdb-min">{item.minutes} MIN</span>
            </div>
          ))}
        </section>

        <aside className="rdb-traps">
          <div className="rdb-plan-head">
            <span className="rdb-mono">DINA FÄLLOR JUST NU</span>
          </div>
          {HOME.traps.map((trap) => (
            <div key={trap.id} className="rdb-trap">
              <div className="rdb-trap-head">
                <span className="rdb-mono rdb-faint">
                  {trap.section} · {trap.id}
                </span>
                <span className="rdb-mono">×{trap.count}</span>
              </div>
              <p>{trap.headline}</p>
            </div>
          ))}
        </aside>
      </div>

      <StatusBar
        left={`STATUS: REDO · ${HOME.plan.length} PASS · ${HOME.estimatedMinutes} MIN`}
        right={`PROGNOS ${HOME.projectedScore}/2.0`}
      />
    </div>
  )
}

function DrillScreen() {
  const [picked, setPicked] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const graded = picked !== null
  const correct = picked === QUESTION.answer

  useEffect(() => {
    if (graded) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [graded])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (graded) {
        if (e.key === 'Enter') {
          setPicked(null)
          setSeconds(0)
        }
        return
      }
      const letter = e.key.toUpperCase()
      if (['A', 'B', 'C', 'D', 'E'].includes(letter)) setPicked(letter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graded])

  const reset = () => {
    setPicked(null)
    setSeconds(0)
  }

  const coord = `${QUESTION.section}/${pad2(QUESTION.number).padStart(3, '0')} · FRÅGA ${pad2(QUESTION.number)}/${pad2(QUESTION.total)}`
  const statusLeft = graded ? (
    <>
      VAL: {picked} ·{' '}
      <span className={correct ? 'rdb-status-ok' : 'rdb-status-err'}>
        {correct ? 'RÄTT' : 'FEL'}
      </span>{' '}
      · ↵ NÄSTA
    </>
  ) : (
    'STATUS: VÄNTAR PÅ SVAR · TANGENT A–E'
  )

  return (
    <div className="rdb-frame">
      <GridLines />
      <div className="rdb-grid">
        <TopBar right={QUESTION.sectionLabel.toUpperCase()} />

        <section className={graded ? 'rdb-qpane' : 'rdb-qpane rdb-qpane-full'}>
          <div className="rdb-coord">
            <span className="rdb-mono rdb-faint">{coord}</span>
            <span
              className={[
                'rdb-mono',
                'rdb-verdict',
                graded ? 'rdb-verdict-on' : '',
                correct ? 'rdb-verdict-ok' : 'rdb-verdict-err',
              ].join(' ')}
            >
              {correct ? 'RÄTT' : 'FEL'}
            </span>
          </div>
          <div
            className={[
              'rdb-meter',
              graded ? 'rdb-meter-on' : '',
              correct ? 'rdb-meter-ok' : 'rdb-meter-err',
            ].join(' ')}
            aria-hidden="true"
          >
            <i />
          </div>

          <h2 className="rdb-prompt">{QUESTION.prompt}</h2>
          <div className="rdb-mono rdb-faint">VÄLJ NÄRMASTE SYNONYM</div>

          <div className="rdb-tactic">
            <span className="rdb-mono rdb-blue">TAKTIK · {EXPLANATION.pregradeTactic.handle}</span>
            <p>{EXPLANATION.pregradeTactic.move}</p>
          </div>

          <div className="rdb-options">
            {QUESTION.options.map((opt) => {
              const isPick = graded && picked === opt.letter
              const isAnswer = graded && opt.letter === QUESTION.answer
              const cls = ['rdb-opt']
              if (isAnswer) cls.push('rdb-opt-locked', 'rdb-opt-ok')
              else if (isPick) cls.push('rdb-opt-locked', 'rdb-opt-err')
              return (
                <button
                  key={opt.letter}
                  type="button"
                  className={cls.join(' ')}
                  disabled={graded}
                  onClick={() => setPicked(opt.letter)}
                >
                  <span className="rdb-key">{opt.letter}</span>
                  <span className="rdb-opt-text">{opt.text}</span>
                  {isAnswer && <span className="rdb-mono rdb-opt-tag">RÄTT SVAR</span>}
                  {isPick && !isAnswer && <span className="rdb-mono rdb-opt-tag">DITT VAL</span>}
                  {(isAnswer || isPick) && (
                    <i
                      className={isAnswer ? 'rdb-sweep rdb-sweep-ok' : 'rdb-sweep rdb-sweep-err'}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {graded && (
            <button type="button" className="rdb-next" onClick={reset}>
              Nästa fråga ↵
            </button>
          )}
        </section>

        {graded && (
          <aside className="rdb-ped">
            <div className="rdb-mono rdb-faint">LÖSNING · {QUESTION.qid.toUpperCase()}</div>
            <p className="rdb-solution">{EXPLANATION.solution}</p>

            <div className="rdb-mono" style={{ marginBottom: 4 }}>
              GENOMGÅNG · {pad2(EXPLANATION.steps.length)} STEG
            </div>
            {EXPLANATION.steps.map((step) => (
              <div key={step.n} className="rdb-step">
                <span className="rdb-mono rdb-blue">{pad2(step.n)}</span>
                <div>
                  <h3 className="rdb-step-title">{step.title}</h3>
                  <p className="rdb-step-text">{step.text}</p>
                </div>
              </div>
            ))}

            <div className="rdb-mono rdb-sect">VARFÖR INTE DE ANDRA</div>
            {EXPLANATION.distractors.map((d) => (
              <div key={d.letter} className="rdb-dx">
                <div className="rdb-dx-head">
                  <span className="rdb-key">{d.letter}</span>
                  <span className="rdb-mono rdb-faint">{d.text}</span>
                </div>
                <p>
                  <b>Lockande:</b> {d.whyTempting}
                </p>
                <p>
                  <b>Fel:</b> {d.whyWrong}
                </p>
              </div>
            ))}
          </aside>
        )}
      </div>

      <StatusBar left={statusLeft} right={`T+${String(seconds).padStart(3, '0')}S`} />
    </div>
  )
}

export function RedesignB({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="rdb-root">
      <style>{STYLE}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
