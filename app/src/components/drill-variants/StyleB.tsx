// Style B — Reader Single-Column.
//
// Thesis: kill the sidebar. The 2-column split fights reading flow.
// The question becomes a compact pinned strip at the top (one tight
// band with prompt + option pills inline), the pedagogy is one wide,
// generous reading column below. Maximum measure, maximum line-height,
// maximum focus. No floating CTA — inline at end of pedagogy +
// keyboard hint in status line.
//
// Substack × Khan Academy × Notion reading register.

import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import type { VariantData } from './DrillVariantShell'

export function StyleB({
  question,
  explanation,
  picked,
  graded,
  correct,
  onPick,
  onReset,
}: VariantData) {
  const steps = explanation ? resolveSteps(explanation) : []
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Running head — solid bg, sticky. */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 11,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
          padding: 'clamp(16px, 1.8vh, 24px) clamp(24px, 4vw, 48px) 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 16,
          maxWidth: 880,
          margin: '0 auto',
          width: '100%',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
        }}
      >
        <span>HP · COACH · {question.section}</span>
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
            textTransform: 'none',
          }}
        >
          pp. 1 / 1
        </span>
      </header>

      {/* Pinned question strip — the entire question compressed into one band. */}
      <section
        style={{
          position: 'sticky',
          top: 'clamp(48px, 6vh, 70px)',
          zIndex: 9,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
          padding: '18px clamp(24px, 4vw, 48px)',
          maxWidth: 880,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(17px, 0.95rem + 0.3vw, 19px)',
            lineHeight: 1.4,
            letterSpacing: '-0.008em',
            fontWeight: 500,
            margin: 0,
            marginBottom: 14,
            whiteSpace: 'pre-wrap',
          }}
        >
          <MathText>{question.prompt ?? ''}</MathText>
        </h1>
        {question.options && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 8,
            }}
          >
            {question.options.map((opt) => {
              const isPicked = picked === opt.letter
              const isCorrect = graded && opt.letter === question.answer
              const isWrong = graded && isPicked && !correct
              const bg = isCorrect
                ? 'color-mix(in oklch, var(--accent) 12%, transparent)'
                : isPicked && !graded
                  ? 'var(--ink)'
                  : isPicked
                    ? 'transparent'
                    : 'transparent'
              const fg =
                isPicked && !graded ? 'var(--bg)' : isWrong ? 'var(--muted-2)' : 'var(--ink)'
              const bdr = isCorrect
                ? 'var(--accent)'
                : isWrong
                  ? 'var(--bad)'
                  : isPicked
                    ? 'var(--ink)'
                    : 'var(--hairline)'
              return (
                <button
                  key={opt.letter}
                  type="button"
                  disabled={graded}
                  onClick={() => onPick(opt.letter)}
                  style={{
                    all: 'unset',
                    cursor: graded ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    padding: '10px 14px',
                    background: bg,
                    color: fg,
                    border: `1px solid ${bdr}`,
                    borderRadius: 4,
                    minHeight: 40,
                    transition: 'background 150ms, border-color 150ms, color 150ms',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.04em',
                      fontWeight: 600,
                    }}
                  >
                    {opt.letter.toLowerCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      lineHeight: 1.3,
                      letterSpacing: '-0.005em',
                      fontWeight: 500,
                    }}
                  >
                    <MathText>{opt.text}</MathText>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Pedagogy — one generous reading column. */}
      <main
        style={{
          flex: 1,
          maxWidth: 760,
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(40px, 6vh, 80px) clamp(24px, 4vw, 48px) clamp(120px, 14vh, 180px)',
        }}
      >
        {!graded ? (
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 19,
              lineHeight: 1.75,
              color: 'var(--muted)',
              fontStyle: 'italic',
              opacity: 0.7,
            }}
          >
            Förklaringen visas när du svarat.
          </p>
        ) : (
          explanation && (
            <div style={{ animation: 'hpc-reveal 220ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
              {steps.map((step) => (
                <article
                  key={step.n}
                  style={{
                    position: 'relative',
                    marginBottom: 'clamp(36px, 5vh, 56px)',
                  }}
                >
                  {/* Hanging step number + em-dash separator — the signature. */}
                  {step.title && (
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(22px, 1.1rem + 0.5vw, 28px)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.018em',
                        fontWeight: 500,
                        margin: 0,
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          letterSpacing: '0.06em',
                          fontWeight: 600,
                          color: 'var(--ink)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {String(step.n).padStart(2, '0')}
                      </span>
                      <span
                        style={{
                          color: 'var(--muted)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 400,
                        }}
                      >
                        ──
                      </span>
                      <span>
                        <MathText>{step.title}</MathText>
                      </span>
                    </h3>
                  )}
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(18px, 0.95rem + 0.45vw, 22px)',
                      lineHeight: 1.75,
                      letterSpacing: '-0.008em',
                      color: 'var(--ink-2)',
                    }}
                  >
                    <MathText>{step.text}</MathText>
                  </div>
                </article>
              ))}

              {/* Distractors */}
              {explanation.distractors.length > 0 && (
                <section style={{ marginTop: 80 }}>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      lineHeight: 1.2,
                      letterSpacing: '-0.018em',
                      fontWeight: 500,
                      margin: 0,
                      marginBottom: 28,
                    }}
                  >
                    Varför inte de andra
                  </h2>
                  {explanation.distractors.map((d) => (
                    <div
                      key={d.letter}
                      style={{
                        marginBottom: 24,
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          letterSpacing: '0.04em',
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}
                      >
                        {d.letter.toLowerCase()}.
                      </span>
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 18,
                            lineHeight: 1.55,
                            margin: 0,
                            marginBottom: 4,
                            color: 'var(--ink)',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              color: 'var(--muted)',
                              marginRight: 8,
                            }}
                          >
                            LOCKAR
                          </span>
                          <MathText>{d.why_tempting}</MathText>
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 18,
                            lineHeight: 1.55,
                            margin: 0,
                            color: 'var(--ink)',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              color: 'var(--muted)',
                              marginRight: 8,
                            }}
                          >
                            FEL
                          </span>
                          <MathText>{d.why_wrong}</MathText>
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Technique + Pitfall — underlines, not chips. */}
              {explanation.technique && (
                <section style={{ marginTop: 'clamp(48px, 6vh, 72px)' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    Teknik
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      lineHeight: 1.55,
                      margin: 0,
                      color: 'var(--ink)',
                      borderBottom: '1px solid var(--accent)',
                      paddingBottom: 4,
                      display: 'inline-block',
                      maxWidth: '90%',
                    }}
                  >
                    <MathText>{explanation.technique}</MathText>
                  </p>
                </section>
              )}
              {explanation.pitfall && (
                <section style={{ marginTop: 32 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    Fälla
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      lineHeight: 1.55,
                      margin: 0,
                      color: 'var(--ink)',
                      fontStyle: 'italic',
                      borderBottom: '1px solid var(--bad)',
                      paddingBottom: 4,
                      display: 'inline-block',
                      maxWidth: '90%',
                    }}
                  >
                    <MathText>{explanation.pitfall}</MathText>
                  </p>
                </section>
              )}

              {/* End-mark + inline CTA */}
              <div style={{ marginTop: 56 }}>
                <span
                  aria-hidden
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 1,
                    background: 'var(--hairline)',
                    opacity: 0.6,
                    marginBottom: 28,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={onReset}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 10,
                      borderBottom: '1px solid var(--ink)',
                      paddingBottom: 2,
                    }}
                  >
                    Nästa fråga →
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        color: 'var(--muted)',
                      }}
                    >
                      ↵
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Status line — two-row state machine borrowed from Cockpit. */}
      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          background: 'var(--panel-2)',
          borderTop: '1px solid var(--hairline)',
          padding: '8px clamp(24px, 4vw, 48px) 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.06em',
          color: 'var(--muted)',
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ color: graded ? 'var(--accent)' : 'var(--muted)' }}>
            -- {graded ? 'GRADERAD' : 'ÖVNING'} -- · {question.section.toLowerCase()} · fråga 1/1
          </span>
          <span style={{ display: 'inline-flex', gap: 14 }}>
            {graded ? (
              <span style={{ color: 'var(--ink)' }}>
                [{(picked ?? '').toLowerCase()}] {correct ? 'rätt' : 'fel'} · ↵ nästa →
              </span>
            ) : (
              <>
                <span>a / b / c / d välj</span>
                <span>esc tillbaka</span>
                <span>⌘k palett</span>
              </>
            )}
          </span>
        </div>
      </footer>
    </div>
  )
}
