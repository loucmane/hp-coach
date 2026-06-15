// Redesign bake-off — Variant A: "EDITION II"
// The incumbent editorial identity pushed to print-grade, with the
// 'ink settles' motion system. Self-contained: imports only react + fixtures.

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import type { RedesignScreen } from './fixtures'
import { EXPLANATION, HOME, QUESTION } from './fixtures'

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500&display=swap');

.rda-root {
  --rda-paper: #FBF8F2;
  --rda-ink: #1C1A16;
  --rda-ink-soft: rgba(28, 26, 22, 0.62);
  --rda-ink-faint: rgba(28, 26, 22, 0.42);
  --rda-rule: rgba(28, 26, 22, 0.08);
  --rda-rule-strong: rgba(28, 26, 22, 0.22);
  --rda-sage: #5F7355;
  --rda-sage-deep: #4C5E44;
  --rda-red: #A4422F;
  --rda-ease: cubic-bezier(0.22, 1, 0.36, 1);
  min-height: 100dvh;
  background: var(--rda-paper);
  color: var(--rda-ink);
  font-family: 'Newsreader', Georgia, serif;
  font-optical-sizing: auto;
  font-feature-settings: 'liga' 1, 'kern' 1;
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
}
.rda-root *, .rda-root *::before, .rda-root *::after { box-sizing: border-box }

.rda-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 48px 96px;
}
@media (max-width: 900px) {
  .rda-page { padding: 32px 28px 80px }
}

.rda-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}

.rda-runhead {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rda-rule-strong);
  margin-bottom: 56px;
}
.rda-runhead .rda-mono { color: var(--rda-ink-soft) }

.rda-rule { border: 0; border-top: 1px solid var(--rda-rule); margin: 0 }
.rda-rule-double {
  border: 0;
  border-top: 1px solid var(--rda-rule-strong);
  border-bottom: 1px solid var(--rda-rule-strong);
  height: 4px;
  margin: 0;
}

/* ---- motion: ink settles ---- */
@keyframes rda-settle {
  from { opacity: 0; transform: translateY(8px); filter: blur(2px) }
  to { opacity: 1; transform: translateY(0); filter: blur(0) }
}
.rda-settle {
  animation: rda-settle 600ms var(--rda-ease) both;
}
@keyframes rda-draw {
  to { stroke-dashoffset: 0 }
}
.rda-underline path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: rda-draw 550ms var(--rda-ease) 80ms forwards;
}
@keyframes rda-stamp {
  from { opacity: 0; transform: rotate(3.5deg) translateY(-5px) scale(1.05) }
  60% { transform: rotate(-0.4deg) translateY(0) scale(1) }
  to { opacity: 1; transform: rotate(0.5deg) }
}
.rda-stamp {
  animation: rda-stamp 480ms var(--rda-ease) 240ms both;
  transform-origin: left center;
}
@media (prefers-reduced-motion: reduce) {
  .rda-settle, .rda-stamp { animation-duration: 1ms; animation-delay: 0ms }
  .rda-underline path { animation-duration: 1ms; animation-delay: 0ms }
}

/* ---- drill ---- */
.rda-eyebrow { color: var(--rda-ink-soft); margin-bottom: 20px }
.rda-headword {
  font-size: 84px;
  font-weight: 400;
  font-style: italic;
  line-height: 1;
  letter-spacing: -0.01em;
  margin: 0 0 40px -4px;
}
@media (max-width: 900px) { .rda-headword { font-size: 64px } }

.rda-tactic {
  margin: 0 0 40px;
  padding-left: 20px;
  border-left: 2px solid var(--rda-sage);
}
.rda-tactic .rda-mono { color: var(--rda-sage-deep); display: block; margin-bottom: 6px }
.rda-tactic p {
  margin: 0;
  font-style: italic;
  font-size: 18px;
  color: var(--rda-ink-soft);
  max-width: 56ch;
}

.rda-options { border-top: 1px solid var(--rda-rule); margin-bottom: 32px }
.rda-option {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: baseline;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  border-bottom: 1px solid var(--rda-rule);
  padding: 16px 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: padding-left 220ms var(--rda-ease);
}
.rda-option:not(:disabled):hover { padding-left: 8px }
.rda-option:not(:disabled):hover .rda-option-letter { color: var(--rda-sage-deep) }
.rda-option:disabled { cursor: default }
.rda-option-letter { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.08em; color: var(--rda-ink-faint) }
.rda-option-text { font-size: 22px; position: relative; display: inline-block; justify-self: start }
.rda-underline {
  position: absolute;
  left: -3px;
  right: -3px;
  bottom: -7px;
  width: calc(100% + 6px);
  height: 7px;
  overflow: visible;
}
.rda-annot { white-space: nowrap; padding-left: 24px }
.rda-annot-ratt { color: var(--rda-sage-deep) }
.rda-annot-fel { color: var(--rda-red) }
.rda-keyhint { color: var(--rda-ink-faint); margin-top: 24px }

/* ---- pedagogy ---- */
.rda-pedagogy { margin-top: 64px }
.rda-solution {
  font-size: 26px;
  font-style: italic;
  font-weight: 400;
  line-height: 1.4;
  margin: 0 0 56px;
  max-width: 30em;
}
.rda-step {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 0 0px;
  padding: 28px 0;
  border-top: 1px solid var(--rda-rule);
}
.rda-step-n {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--rda-ink-faint);
  padding-top: 7px;
}
.rda-step h3 {
  font-size: 21px;
  font-weight: 500;
  margin: 0 0 10px;
  line-height: 1.3;
}
.rda-step p { margin: 0; font-size: 17px; color: var(--rda-ink-soft); max-width: 62ch }
.rda-dropcap p::first-letter {
  float: left;
  font-size: 56px;
  line-height: 0.82;
  font-weight: 500;
  color: var(--rda-ink);
  padding: 5px 10px 0 0;
}
.rda-why { margin-top: 56px }
.rda-why-head { display: flex; justify-content: space-between; align-items: baseline; padding: 14px 0 32px }
.rda-why-head h2 { font-size: 28px; font-weight: 500; font-style: italic; margin: 0 }
.rda-distractor {
  display: grid;
  grid-template-columns: 64px 1fr;
  padding: 24px 0;
  border-top: 1px solid var(--rda-rule);
}
.rda-distractor-letter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--rda-red);
  padding-top: 6px;
}
.rda-distractor h4 { font-size: 19px; font-weight: 500; margin: 0 0 8px }
.rda-distractor p { margin: 0 0 8px; font-size: 16px; color: var(--rda-ink-soft); max-width: 62ch }
.rda-distractor p:last-child { margin-bottom: 0 }
.rda-distractor .rda-mono { color: var(--rda-ink-faint); margin-right: 8px }

.rda-next {
  margin-top: 56px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--rda-ink);
  color: var(--rda-paper);
  border: 0;
  padding: 16px 32px;
  cursor: pointer;
  transition: background 200ms var(--rda-ease);
}
.rda-next:hover { background: var(--rda-sage-deep) }
.rda-next span { opacity: 0.55; margin-left: 16px }

/* ---- home ---- */
.rda-greet-date { color: var(--rda-ink-soft); margin-bottom: 14px }
.rda-greet {
  font-size: 44px;
  font-weight: 400;
  font-style: italic;
  margin: 0 0 56px;
  line-height: 1.1;
}
.rda-hero { display: flex; align-items: baseline; gap: 40px; flex-wrap: wrap; padding-bottom: 48px }
.rda-score { font-size: 120px; line-height: 0.9; font-weight: 400; letter-spacing: -0.02em; font-variant-numeric: tabular-nums }
@media (max-width: 900px) { .rda-score { font-size: 88px } }
.rda-hero-meta { display: flex; flex-direction: column; gap: 10px; padding-bottom: 6px }
.rda-hero-meta .rda-mono { color: var(--rda-ink-soft) }
.rda-hero-meta .rda-delta { color: var(--rda-sage-deep) }

.rda-resume {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 24px;
  width: 100%;
  background: none;
  border: 0;
  border-top: 1px solid var(--rda-rule-strong);
  border-bottom: 1px solid var(--rda-rule);
  padding: 22px 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: padding-left 220ms var(--rda-ease);
}
.rda-resume:hover { padding-left: 8px }
.rda-resume-label { font-size: 22px; font-style: italic; font-weight: 500; color: var(--rda-sage-deep) }
.rda-resume-detail { color: var(--rda-ink-soft); white-space: nowrap }

.rda-section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 64px 0 0;
  padding-bottom: 14px;
}
.rda-section-head h2 { font-size: 26px; font-weight: 500; font-style: italic; margin: 0 }
.rda-section-head .rda-mono { color: var(--rda-ink-soft) }
.rda-plan-item {
  display: grid;
  grid-template-columns: 112px 1fr auto;
  align-items: baseline;
  padding: 20px 0;
  border-top: 1px solid var(--rda-rule);
}
.rda-plan-item > .rda-plan-kind { padding-right: 16px }
.rda-plan-kind { color: var(--rda-ink-faint) }
.rda-plan-item h3 { font-size: 20px; font-weight: 500; margin: 0 0 4px }
.rda-plan-item p { margin: 0; font-size: 15px; color: var(--rda-ink-soft); max-width: 52ch }
.rda-plan-min { color: var(--rda-ink-soft); padding-left: 24px; white-space: nowrap }

.rda-trap {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: baseline;
  padding: 18px 0;
  border-top: 1px solid var(--rda-rule);
}
.rda-trap .rda-mono { color: var(--rda-red) }
.rda-trap-text { font-size: 18px; max-width: 52ch }
.rda-trap-count { color: var(--rda-ink-soft); padding-left: 24px; white-space: nowrap }
`

const ease = (delayMs: number): CSSProperties => ({ animationDelay: `${delayMs}ms` })

const LETTERS = ['a', 'b', 'c', 'd', 'e']

function Underline({ wrong }: { wrong: boolean }) {
  return (
    <svg
      className="rda-underline"
      viewBox="0 0 100 7"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M1 4 C 18 2.2, 36 5.4, 54 3.4 S 86 4.8, 99 3.2"
        pathLength={1}
        fill="none"
        stroke={wrong ? '#A4422F' : '#5F7355'}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  )
}

function Drill() {
  const [picked, setPicked] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const graded = picked !== null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (graded) {
        if (e.key === 'Enter') {
          setPicked(null)
          setRound((r) => r + 1)
        }
        return
      }
      const i = LETTERS.indexOf(e.key.toLowerCase())
      if (i >= 0 && i < QUESTION.options.length) {
        setPicked(QUESTION.options[i].letter)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graded])

  const correct = picked === QUESTION.answer

  return (
    <div className="rda-page" key={round}>
      <header className="rda-runhead rda-settle">
        <span className="rda-mono">HP-COACH · ÖVNING · {QUESTION.section}</span>
        <span className="rda-mono">
          {String(QUESTION.number).padStart(2, '0')} / {QUESTION.total}
        </span>
      </header>

      <p className="rda-mono rda-eyebrow rda-settle" style={ease(80)}>
        {QUESTION.sectionLabel} · Fråga {QUESTION.number} av {QUESTION.total}
      </p>
      <h1 className="rda-headword rda-settle" style={ease(160)}>
        {QUESTION.prompt}
      </h1>

      <aside className="rda-tactic rda-settle" style={ease(240)}>
        <span className="rda-mono">Taktik · {EXPLANATION.pregradeTactic.handle}</span>
        <p>{EXPLANATION.pregradeTactic.move}</p>
      </aside>

      <div className="rda-options">
        {QUESTION.options.map((opt, i) => {
          const isPicked = picked === opt.letter
          const showsCorrectMark = graded && !correct && opt.letter === QUESTION.answer
          return (
            <button
              key={opt.letter}
              type="button"
              className="rda-option rda-settle"
              style={ease(320 + i * 70)}
              disabled={graded}
              onClick={() => setPicked(opt.letter)}
            >
              <span className="rda-option-letter">{opt.letter.toLowerCase()}</span>
              <span className="rda-option-text">
                {opt.text}
                {isPicked && <Underline wrong={!correct} />}
                {showsCorrectMark && <Underline wrong={false} />}
              </span>
              {isPicked && (
                <span
                  className={`rda-mono rda-annot rda-stamp ${correct ? 'rda-annot-ratt' : 'rda-annot-fel'}`}
                >
                  {correct ? 'Rätt' : `Fel · rätt svar ${QUESTION.answer}`}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {!graded && (
        <p className="rda-mono rda-keyhint rda-settle" style={ease(700)}>
          Tryck a–e för att svara
        </p>
      )}

      {graded && (
        <section className="rda-pedagogy">
          <p className="rda-solution rda-settle" style={ease(120)}>
            {EXPLANATION.solution}
          </p>

          {EXPLANATION.steps.map((step, i) => (
            <article
              key={step.n}
              className={`rda-step rda-settle ${i === 0 ? 'rda-dropcap' : ''}`}
              style={ease(280 + i * 120)}
            >
              <span className="rda-step-n">{String(step.n).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}

          <div className="rda-why rda-settle" style={ease(700)}>
            <hr className="rda-rule-double" />
            <div className="rda-why-head">
              <h2>Varför inte de andra</h2>
              <span className="rda-mono">Distraktoranalys</span>
            </div>
            {EXPLANATION.distractors.map((d, i) => (
              <article
                key={d.letter}
                className="rda-distractor rda-settle"
                style={ease(800 + i * 100)}
              >
                <span className="rda-distractor-letter">{d.letter.toLowerCase()}</span>
                <div>
                  <h4>{d.text}</h4>
                  <p>
                    <span className="rda-mono">Lockande</span>
                    {d.whyTempting}
                  </p>
                  <p>
                    <span className="rda-mono">Fel för att</span>
                    {d.whyWrong}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="rda-next rda-settle"
            style={ease(1240)}
            onClick={() => {
              setPicked(null)
              setRound((r) => r + 1)
            }}
          >
            Nästa fråga<span>Enter</span>
          </button>
        </section>
      )}
    </div>
  )
}

function Home() {
  return (
    <div className="rda-page">
      <header className="rda-runhead rda-settle">
        <span className="rda-mono">HP-COACH · HEM</span>
        <span className="rda-mono">Nº 01</span>
      </header>

      <p className="rda-mono rda-greet-date rda-settle" style={ease(80)}>
        {HOME.dateLabel}
      </p>
      <h1 className="rda-greet rda-settle" style={ease(140)}>
        {HOME.greeting}
      </h1>

      <div className="rda-hero rda-settle" style={ease(220)}>
        <span className="rda-score">{HOME.projectedScore}</span>
        <div className="rda-hero-meta">
          <span className="rda-mono">Prognos · normerat värde</span>
          <span className="rda-mono rda-delta">{HOME.scoreDelta}</span>
          <span className="rda-mono">{HOME.streakDays} dagar i rad</span>
        </div>
      </div>

      <button type="button" className="rda-resume rda-settle" style={ease(320)}>
        <span className="rda-resume-label">Fortsätt här</span>
        <span className="rda-mono rda-resume-detail">
          {HOME.resume.kind} {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
          {HOME.resume.total} · {HOME.resume.device} · {HOME.resume.when}
        </span>
      </button>

      <div className="rda-section-head rda-settle" style={ease(420)}>
        <h2>Dagens plan</h2>
        <span className="rda-mono">{HOME.estimatedMinutes} min</span>
      </div>
      {HOME.plan.map((item, i) => (
        <div key={item.id} className="rda-plan-item rda-settle" style={ease(480 + i * 90)}>
          <span className="rda-mono rda-plan-kind">{item.kind}</span>
          <div>
            <h3>{item.headline}</h3>
            <p>{item.rationale}</p>
          </div>
          <span className="rda-mono rda-plan-min">{item.minutes} min</span>
        </div>
      ))}

      <div className="rda-section-head rda-settle" style={ease(800)}>
        <h2>Dina fällor just nu</h2>
        <span className="rda-mono">{HOME.traps.length} aktiva</span>
      </div>
      {HOME.traps.map((trap, i) => (
        <div key={trap.id} className="rda-trap rda-settle" style={ease(860 + i * 90)}>
          <span className="rda-mono">{trap.section}</span>
          <span className="rda-trap-text">{trap.headline}</span>
          <span className="rda-mono rda-trap-count">{trap.count} ggr</span>
        </div>
      ))}
    </div>
  )
}

export function RedesignA({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="rda-root">
      <style>{STYLE}</style>
      {screen === 'drill' ? <Drill /> : <Home />}
    </div>
  )
}
