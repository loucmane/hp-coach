// L12 derivative round — M3: "Boksidan" (the book page).
// Recipe 2: F's chassis carrying L12's typesetting. The hairline axis spine,
// mono margin-label rail and flush composition come from F · Axis; into that
// frame is poured L12's reading machinery — bold serif solution lede between
// rules, serif step numerals, ~75ch book-page measure, the localized "1,4",
// and the italic accent "Rätt." verdict entering with a calm draw, left-
// aligned where the pick landed. A typeset book page on a drafting frame.
// Token-only color and fonts. Imports only react + ../redesign/fixtures.

import { type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const KEY_TO_LETTER: Record<string, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
  e: 'E',
}

const CSS = `
.m3-reset {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: inherit;
  appearance: none;
  cursor: pointer;
}

.m3-root {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

.m3-frame {
  max-width: 880px;
  margin: 0 auto;
  padding: 56px 24px 96px;
}

/* ----- the chassis (from F): margin rail | vertical hairline | page ----- */

.m3-row {
  display: grid;
  grid-template-columns: 128px 1px 1fr;
  column-gap: 28px;
}

.m3-spine {
  background: var(--hairline);
  align-self: stretch;
}

.m3-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: right;
  padding-top: 5px;
  font-variant-numeric: tabular-nums;
  animation: m3-in-x 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m3-meta strong {
  display: block;
  color: var(--ink-2);
  font-weight: 500;
}

.m3-content {
  min-width: 0;
  animation: m3-in-y 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 60ms;
}

.m3-section { margin-top: 64px; }
.m3-section:first-child { margin-top: 0; }

.m3-rule {
  height: 1px;
  background: var(--hairline);
  border: 0;
  margin: 0 0 20px;
  transform-origin: left center;
  animation: m3-draw 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m3-h {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-2);
  margin: 0 0 6px;
}

.m3-mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

/* ----- display type (the page's voice) ----- */

.m3-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.m3-display {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  color: var(--ink);
  font-size: clamp(44px, 6vw, 64px);
  line-height: 1.05;
  letter-spacing: -0.01em;
  margin: 10px 0 0;
  animation: m3-settle 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ----- home ----- */

.m3-stats {
  display: flex;
  gap: 48px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--hairline);
}

.m3-stat-n {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 30px;
  line-height: 1.1;
  color: var(--ink);
}

.m3-stat-l {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.m3-stat-d {
  font-size: 12px;
  color: var(--ok);
  margin-top: 2px;
}

.m3-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--accent-soft);
  padding: 16px 20px;
  margin-top: 4px;
}

.m3-resume-t {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
}

.m3-resume-s {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  margin-top: 3px;
  font-variant-numeric: tabular-nums;
}

.m3-cta {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-ink);
  background: var(--accent);
  padding: 10px 20px;
  white-space: nowrap;
  transition: opacity 160ms ease;
}

.m3-cta:hover { opacity: 0.88; }

.m3-cta:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.m3-plan-item {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 16px;
  align-items: baseline;
  padding: 14px 0;
  border-bottom: 1px solid var(--hairline-2);
}

.m3-plan-item:last-child { border-bottom: 0; }

.m3-plan-n {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 19px;
  line-height: 1.2;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.m3-plan-t {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 17px;
  line-height: 1.35;
  color: var(--ink);
}

.m3-plan-r {
  font-size: 13px;
  color: var(--muted);
  margin-top: 3px;
  max-width: 56ch;
}

.m3-plan-min {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.m3-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
  border: 1px solid var(--hairline);
  padding: 1px 6px;
  margin-right: 8px;
  vertical-align: 2px;
}

.m3-trap {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding: 13px 0;
  border-bottom: 1px solid var(--hairline-2);
}

.m3-trap:last-child { border-bottom: 0; }

.m3-trap-t {
  font-size: 14.5px;
  color: var(--ink);
}

.m3-trap-n {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ----- drill: tactic, options ----- */

.m3-tactic {
  margin-top: 24px;
  padding: 14px 18px;
  border-left: 1px solid var(--hairline);
}

.m3-tactic-h {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}

.m3-tactic-t {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 16px;
  line-height: 1.5;
  color: var(--ink-2);
  margin-top: 4px;
  max-width: 60ch;
}

.m3-opts {
  margin-top: 8px;
  border-top: 1px solid var(--hairline);
}

.m3-opt {
  display: grid;
  grid-template-columns: 3px 36px 1fr auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  border-bottom: 1px solid var(--hairline-2);
  color: var(--ink);
  transition:
    background 160ms ease,
    color 160ms ease;
}

.m3-opt:disabled { cursor: default; }

.m3-opt:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.m3-ind {
  width: 3px;
  align-self: stretch;
  background: transparent;
  transform: scaleY(0);
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.m3-opt:hover:not(:disabled) .m3-ind {
  background: var(--accent);
  transform: scaleY(1);
}

.m3-opt-k {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted-2);
  padding: 15px 0;
}

.m3-opt-t {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 450;
  padding: 15px 0;
}

.m3-opt-v {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-right: 14px;
}

.m3-opt.is-ok { background: var(--ok-soft); }
.m3-opt.is-ok .m3-ind { background: var(--ok); transform: scaleY(1); }
.m3-opt.is-ok .m3-opt-t,
.m3-opt.is-ok .m3-opt-k,
.m3-opt.is-ok .m3-opt-v { color: var(--ok); }

.m3-opt.is-bad { background: var(--bad-soft); }
.m3-opt.is-bad .m3-ind { background: var(--bad); transform: scaleY(1); }
.m3-opt.is-bad .m3-opt-t,
.m3-opt.is-bad .m3-opt-k,
.m3-opt.is-bad .m3-opt-v { color: var(--bad); }

.m3-opt.is-bad .m3-opt-t {
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
}

.m3-opt.is-dim .m3-opt-t,
.m3-opt.is-dim .m3-opt-k { color: var(--muted-2); }

.m3-keys {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted-2);
  margin-top: 14px;
  letter-spacing: 0.06em;
}

/* ----- the verdict: L12's italic word, drawn calmly, set left ----- */

.m3-ped {
  animation: m3-in-y 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m3-verdict {
  padding: 4px 0 0;
}

.m3-verdict-word {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: clamp(34px, 5vw, 46px);
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--ink);
  display: inline-block;
  animation: m3-verdict-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m3-verdict-word.is-ok { color: var(--accent); }

.m3-verdict-sub {
  margin-top: 10px;
  font-size: 15px;
  color: var(--ink-2);
  max-width: 60ch;
  animation: m3-in-y 320ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both;
}

/* ----- the book page: L12's reading machinery in F's column ----- */

.m3-solution {
  margin-top: 22px;
  padding: 18px 0;
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--hairline);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 19px;
  line-height: 1.5;
  color: var(--ink);
  max-width: 75ch;
  animation: m3-in-y 320ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
}

.m3-step {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--hairline-2);
  animation: m3-in-y 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m3-step:last-child { border-bottom: 0; }

.m3-step-n {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 21px;
  line-height: 1.2;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.m3-step-h {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  line-height: 1.3;
  color: var(--ink);
  margin: 0;
}

.m3-step-tier {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted-2);
  margin-left: 10px;
  vertical-align: 3px;
}

.m3-step-t {
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink-2);
  margin: 6px 0 0;
  max-width: 75ch;
}

.m3-dis {
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline-2);
  animation: m3-in-y 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m3-dis:last-child { border-bottom: 0; }

.m3-dis-h {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  color: var(--ink);
}

.m3-dis-h .m3-dis-k {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 12px;
  color: var(--muted-2);
  margin-right: 8px;
}

.m3-dis-h s { text-decoration-thickness: 1.5px; }

.m3-dis-l {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 8px 0 2px;
}

.m3-dis-p {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0;
  max-width: 75ch;
}

.m3-next-row {
  margin-top: 36px;
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ----- motion: calm draws only — no stamps, no blur ----- */

@keyframes m3-in-y {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}

@keyframes m3-in-x {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: none; }
}

@keyframes m3-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes m3-settle {
  from { opacity: 0; letter-spacing: 0.01em; }
  to { opacity: 1; letter-spacing: -0.01em; }
}

@keyframes m3-verdict-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .m3-root *,
  .m3-root *::before,
  .m3-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 900px) {
  .m3-row { grid-template-columns: 96px 1px 1fr; column-gap: 20px; }
  .m3-frame { padding: 40px 18px 72px; }
}
`

function svDecimal(value: string): string {
  return value.replace('.', ',')
}

function Section({
  meta,
  title,
  delay,
  children,
}: {
  meta: ReactNode
  title?: string
  delay: number
  children: ReactNode
}): ReactElement {
  const d = { animationDelay: `${delay}ms` }
  return (
    <section className="m3-section">
      <hr className="m3-rule" style={d} />
      <div className="m3-row">
        <div className="m3-meta" style={d}>
          {meta}
        </div>
        <div className="m3-spine" />
        <div className="m3-content" style={{ animationDelay: `${delay + 60}ms` }}>
          {title ? <h2 className="m3-h">{title}</h2> : null}
          {children}
        </div>
      </div>
    </section>
  )
}

function HomeScreen(): ReactElement {
  return (
    <div className="m3-frame">
      <section className="m3-section">
        <div className="m3-row">
          <div className="m3-meta">
            <strong>{HOME.dateLabel}</strong>
          </div>
          <div className="m3-spine" />
          <div className="m3-content">
            <h1 className="m3-display">{HOME.greeting}</h1>
            <div className="m3-stats">
              <div>
                <div className="m3-stat-n">{svDecimal(HOME.projectedScore)}</div>
                <div className="m3-stat-l">prognos av 2,0</div>
                <div className="m3-stat-d">{HOME.scoreDelta}</div>
              </div>
              <div>
                <div className="m3-stat-n">{HOME.streakDays}</div>
                <div className="m3-stat-l">dagar i rad</div>
              </div>
              <div>
                <div className="m3-stat-n">{HOME.estimatedMinutes}</div>
                <div className="m3-stat-l">min idag</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section meta={<>Påbörjad</>} delay={120}>
        <div className="m3-resume">
          <div>
            <div className="m3-resume-t">
              {HOME.resume.kind} · {HOME.resume.section}
            </div>
            <div className="m3-resume-s">
              fråga {HOME.resume.position} av {HOME.resume.total} · {HOME.resume.device} ·{' '}
              {HOME.resume.when}
            </div>
          </div>
          <button type="button" className="m3-reset m3-cta">
            Fortsätt här
          </button>
        </div>
      </Section>

      <Section
        meta={
          <>
            <strong>{HOME.estimatedMinutes} min</strong>3 moment
          </>
        }
        title="Dagens plan"
        delay={220}
      >
        <div>
          {HOME.plan.map((p, i) => (
            <div className="m3-plan-item" key={p.id}>
              <span className="m3-plan-n">{i + 1}.</span>
              <div>
                <div className="m3-plan-t">
                  {p.section ? <span className="m3-tag">{p.section}</span> : null}
                  {p.headline}
                </div>
                <div className="m3-plan-r">{p.rationale}</div>
              </div>
              <span className="m3-plan-min">{p.minutes} min</span>
            </div>
          ))}
        </div>
      </Section>

      <Section meta={<>Mönster</>} title="Dina fällor just nu" delay={320}>
        <div>
          {HOME.traps.map((t) => (
            <div className="m3-trap" key={t.id}>
              <span className="m3-trap-t">
                <span className="m3-tag">{t.section}</span>
                {t.headline}
              </span>
              <span className="m3-trap-n">{t.count} ggr</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function DrillScreen(): ReactElement {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const wasCorrect = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!graded) {
        const letter = KEY_TO_LETTER[e.key.toLowerCase()]
        if (letter) {
          e.preventDefault()
          setPicked(letter)
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        setPicked(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graded])

  return (
    <div className="m3-frame">
      <section className="m3-section">
        <div className="m3-row">
          <div className="m3-meta">
            <strong>{QUESTION.section}</strong>
            {QUESTION.number} / {QUESTION.total}
          </div>
          <div className="m3-spine" />
          <div className="m3-content">
            <div className="m3-eyebrow">
              {QUESTION.sectionLabel.toUpperCase()} · FRÅGA {QUESTION.number} AV {QUESTION.total}
            </div>
            <h1 className="m3-display">{QUESTION.prompt}</h1>
            {!graded ? (
              <aside className="m3-tactic">
                <p className="m3-tactic-h">Taktik · {EXPLANATION.pregradeTactic.handle}</p>
                <p className="m3-tactic-t">{EXPLANATION.pregradeTactic.move}</p>
              </aside>
            ) : null}
          </div>
        </div>
      </section>

      <Section meta={<>Välj synonym</>} delay={100}>
        <div className="m3-opts">
          {QUESTION.options.map((o) => {
            const isPick = picked === o.letter
            const isAnswer = o.letter === QUESTION.answer
            let cls = 'm3-reset m3-opt'
            if (graded) {
              if (isAnswer) cls += ' is-ok'
              else if (isPick) cls += ' is-bad'
              else cls += ' is-dim'
            }
            return (
              <button
                key={o.letter}
                type="button"
                className={cls}
                disabled={graded}
                onClick={() => setPicked(o.letter)}
              >
                <span className="m3-ind" />
                <span className="m3-opt-k">{o.letter.toLowerCase()}</span>
                <span className="m3-opt-t">{o.text}</span>
                <span className="m3-opt-v">
                  {graded && isAnswer ? 'Rätt svar' : graded && isPick ? 'Ditt svar' : ''}
                </span>
              </button>
            )
          })}
        </div>
        {!graded ? (
          <div className="m3-keys">Tangenter a–e väljer · klick fungerar också</div>
        ) : null}
      </Section>

      {graded ? (
        <div className="m3-ped">
          <Section meta={<>Utfall</>} delay={0}>
            <div className="m3-verdict">
              <span className={`m3-verdict-word${wasCorrect ? ' is-ok' : ''}`}>
                {wasCorrect ? 'Rätt.' : 'Fel.'}
              </span>
              <p className="m3-verdict-sub">
                {wasCorrect
                  ? 'Snyggt — taktiken höll hela vägen.'
                  : `Rätt svar är ${QUESTION.answer.toLowerCase()}) vilja ha. Häng med i varför.`}
              </p>
            </div>
            <p className="m3-solution">{EXPLANATION.solution}</p>
          </Section>

          <Section meta={<>3 steg</>} title="Så löser du den" delay={140}>
            <div>
              {EXPLANATION.steps.map((s, i) => (
                <div className="m3-step" key={s.n} style={{ animationDelay: `${220 + i * 80}ms` }}>
                  <span className="m3-step-n">{s.n}.</span>
                  <div>
                    <h3 className="m3-step-h">
                      {s.title}
                      <span className="m3-step-tier">
                        {s.tier === 'essential' ? 'kärna' : 'detalj'}
                      </span>
                    </h3>
                    <p className="m3-step-t">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section meta={<>4 fällor</>} title="Varför de andra lockar" delay={280}>
            <div>
              {EXPLANATION.distractors.map((d, i) => (
                <div
                  className="m3-dis"
                  key={d.letter}
                  style={{ animationDelay: `${360 + i * 80}ms` }}
                >
                  <p className="m3-dis-h">
                    <span className="m3-dis-k">{d.letter.toLowerCase()})</span>
                    <s>{d.text}</s>
                  </p>
                  <p className="m3-dis-l">Varför det lockar</p>
                  <p className="m3-dis-p">{d.whyTempting}</p>
                  <p className="m3-dis-l">Varför det är fel</p>
                  <p className="m3-dis-p">{d.whyWrong}</p>
                </div>
              ))}
            </div>
          </Section>

          <div className="m3-next-row">
            <button type="button" className="m3-reset m3-cta" onClick={() => setPicked(null)}>
              Nästa fråga
            </button>
            <span className="m3-keys">Enter går vidare</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function M3({ screen }: { screen: RedesignScreen }): ReactElement {
  return (
    <div className="m3-root">
      <style>{CSS}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
