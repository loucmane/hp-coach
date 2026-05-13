// Style C — Cockpit Terminal.
//
// Thesis: treat the whole drill page as a single tmux session. Mono
// everything on chrome and instruments; display serif only on
// pedagogy body. Information density per pixel. Three-row status bar
// with state machine. Keyboard primary, zero visible buttons.
// Bloomberg × vim × Linear command surface.

import { useEffect, useState } from 'react'

import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import type { VariantData } from './DrillVariantShell'
import { useProgressiveReveal } from './useProgressiveReveal'

export function StyleC({
  question,
  explanation,
  picked,
  graded,
  correct,
  onPick,
  onReset,
}: VariantData) {
  const steps = explanation ? resolveSteps(explanation) : []
  const reveal = useProgressiveReveal(steps)
  const [elapsed, setElapsed] = useState(0)
  // Tick the elapsed counter every second while still answering.
  useEffect(() => {
    if (graded) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [graded])

  // Keyboard bindings: a/b/c/d/e to pick, Enter to advance/reset.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (!graded && ['a', 'b', 'c', 'd', 'e'].includes(key)) {
        const letter = key.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E'
        if (question.options?.some((o) => o.letter === letter)) onPick(letter)
      } else if (graded && (key === 'enter' || e.key === 'Enter')) {
        onReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graded, onPick, onReset, question.options])

  return (
    <div
      data-variant="cockpit"
      style={
        {
          height: '100dvh',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          background: 'oklch(0.82 0.014 70)' /* shows through 1px gaps */,
          rowGap: 1,
          color: 'oklch(0.14 0.013 70)',
          // Token overrides scoped to this variant via CSS custom props.
          // Allows --accent etc. to be different in C without polluting
          // the rest of the app.
          '--ink': 'oklch(0.14 0.013 70)',
          '--ink-2': 'oklch(0.28 0.014 70)',
          '--muted': 'oklch(0.45 0.018 70)',
          '--muted-2': 'oklch(0.55 0.012 70)',
          '--hairline': 'oklch(0.82 0.014 70)',
          '--bg': 'oklch(0.99 0.005 78)',
          '--panel-2': 'oklch(0.96 0.008 78)',
          '--accent': 'oklch(0.55 0.18 145)' /* terminal green */,
          '--bad': 'oklch(0.55 0.20 25)' /* alert red */,
          '--warn': 'oklch(0.72 0.16 80)' /* amber */,
        } as React.CSSProperties
      }
    >
      {/* Top row — breadcrumb + folio */}
      <div
        style={{
          background: 'var(--panel-2)',
          padding: '8px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.06em',
          color: 'var(--ink-2)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          HP·COACH <span style={{ color: 'var(--muted)' }}>{'>'}</span> drill{' '}
          <span style={{ color: 'var(--muted)' }}>{'>'}</span> {question.section.toLowerCase()}{' '}
          <span style={{ color: 'var(--muted)' }}>{'>'}</span>{' '}
          <span style={{ color: 'var(--accent)' }}>{question.qid}</span>
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>pp. 1 / 1</span>
      </div>

      {/* Main grid — 2 columns, 1px gap shows hairline color */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.42fr) minmax(0, 0.58fr)',
          columnGap: 1,
          minHeight: 0,
        }}
      >
        {/* Column 1: question + options */}
        <div
          style={{
            background: 'var(--bg)',
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            rowGap: 1,
            minHeight: 0,
          }}
        >
          {/* Question pane */}
          <div style={{ padding: '14px 18px', background: 'var(--bg)' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.06em',
                color: 'var(--muted)',
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: '1px dashed var(--hairline)',
              }}
            >
              [{question.section}-{String(question.number).padStart(3, '0')}] q1/1
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 15,
                lineHeight: 1.4,
                letterSpacing: '0.02em',
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                color: 'var(--ink)',
              }}
            >
              <MathText>{question.prompt ?? ''}</MathText>
            </div>
          </div>

          {/* Options pane */}
          <div
            style={{
              background: 'var(--bg)',
              padding: '14px 18px',
              overflowY: 'auto',
              minHeight: 0,
            }}
          >
            {question.options?.map((opt) => {
              const isPicked = picked === opt.letter
              const isCorrect = graded && opt.letter === question.answer
              const isWrong = graded && isPicked && !correct
              const rail = isCorrect
                ? 'var(--accent)'
                : isWrong
                  ? 'var(--bad)'
                  : isPicked
                    ? 'var(--ink)'
                    : 'transparent'
              const keycapBg = isCorrect
                ? 'var(--accent)'
                : isWrong || (isPicked && !graded) || isPicked
                  ? 'var(--ink)'
                  : 'var(--panel-2)'
              const keycapFg = isCorrect ? 'oklch(0.16 0 0)' : isPicked ? 'var(--bg)' : 'var(--ink)'
              return (
                <button
                  key={opt.letter}
                  type="button"
                  onClick={() => onPick(opt.letter)}
                  disabled={graded}
                  style={{
                    all: 'unset',
                    cursor: graded ? 'default' : 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '10px 0 10px 10px',
                    marginLeft: -12,
                    borderLeft: `2px solid ${rail}`,
                    transition: 'border-color 80ms',
                    opacity: graded && !isPicked && !isCorrect ? 0.5 : 1,
                    width: '100%',
                  }}
                >
                  {/* keycap */}
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: keycapBg,
                      color: keycapFg,
                      border: '1px solid var(--hairline)',
                      borderRadius: 3,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {opt.letter.toLowerCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      lineHeight: 1.35,
                      letterSpacing: '0.02em',
                      color: 'var(--ink)',
                    }}
                  >
                    <MathText>{opt.text}</MathText>
                  </span>
                  {isCorrect && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        color: 'var(--accent)',
                      }}
                    >
                      [ok]
                    </span>
                  )}
                  {isWrong && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        color: 'var(--bad)',
                      }}
                    >
                      [err]
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Column 2: pedagogy header + scroll pane */}
        <div
          style={{
            background: 'var(--bg)',
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            rowGap: 1,
            minHeight: 0,
          }}
        >
          {/* Header row */}
          <div
            style={{
              padding: '10px 18px',
              background: 'var(--panel-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              color: 'var(--muted)',
              display: 'flex',
              gap: 14,
              alignItems: 'baseline',
            }}
          >
            <span>─ förklaring</span>
            {graded && explanation && (
              <>
                <span>·</span>
                <span>{steps.length} steg</span>
                {explanation.framework_id && (
                  <>
                    <span>·</span>
                    <span style={{ color: 'var(--accent)' }}>{explanation.framework_id}</span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Scroll pane */}
          <div
            style={{
              background: 'var(--bg)',
              padding: '16px 22px',
              overflowY: 'auto',
              minHeight: 0,
              scrollPaddingTop: 16,
            }}
          >
            {!graded ? (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  color: 'var(--muted)',
                }}
              >
                {'>'} svara på frågan för att låsa upp förklaringen
              </p>
            ) : (
              explanation && (
                <>
                  {steps.map((step) => {
                    const isDetail = (step.tier ?? 'essential') === 'detail'
                    const isCollapsed = reveal.isCollapsedDetail(step)
                    // Collapsed detail in mono terminal-row style:
                    //   [03]  step.title                            [+] more
                    if (isCollapsed) {
                      return (
                        <button
                          key={step.n}
                          type="button"
                          onClick={() => reveal.expandDetail(step.n)}
                          style={{
                            all: 'unset',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 6,
                            padding: '4px 0',
                            borderBottom: '1px dashed var(--hairline)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            lineHeight: 1.35,
                            color: 'var(--ink-2)',
                            width: '100%',
                          }}
                        >
                          <span>
                            <span style={{ color: 'var(--muted)', marginRight: 8 }}>
                              [{String(step.n).padStart(2, '0')}]
                            </span>
                            {step.title ?? step.text.slice(0, 60)}
                          </span>
                          <span style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                            [+] more
                          </span>
                        </button>
                      )
                    }
                    return (
                      <article key={step.n} style={{ marginBottom: 18, position: 'relative' }}>
                        {isDetail && (
                          <button
                            type="button"
                            onClick={() => reveal.collapseDetail(step.n)}
                            style={{
                              all: 'unset',
                              cursor: 'pointer',
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              letterSpacing: '0.04em',
                              color: 'var(--muted)',
                            }}
                          >
                            [-] hide
                          </button>
                        )}
                        {step.title && (
                          <h3
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 14,
                              lineHeight: 1.3,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              margin: 0,
                              marginBottom: 6,
                              color: 'var(--ink)',
                              paddingRight: isDetail ? 60 : 0,
                            }}
                          >
                            <span style={{ color: 'var(--accent)', marginRight: 8 }}>
                              [{String(step.n).padStart(2, '0')}]
                            </span>
                            <MathText>{step.title}</MathText>
                          </h3>
                        )}
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 16,
                            lineHeight: 1.55,
                            letterSpacing: '-0.005em',
                            color: 'var(--ink)',
                          }}
                        >
                          <MathText>{step.text}</MathText>
                        </div>
                      </article>
                    )
                  })}

                  {/* Bottom Progressive Reveal CTA — mono terminal row. */}
                  {reveal.totalDetailCount > 0 && (
                    <div
                      style={{
                        marginTop: 12,
                        marginBottom: 16,
                        padding: '10px 0',
                        borderTop: '1px solid var(--hairline)',
                        borderBottom: '1px solid var(--hairline)',
                        textAlign: 'center',
                      }}
                    >
                      {reveal.collapsedDetailCount > 0 ? (
                        <button
                          type="button"
                          onClick={reveal.expandAll}
                          style={{
                            all: 'unset',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            letterSpacing: '0.06em',
                            color: 'var(--accent)',
                          }}
                        >
                          [+] jag förstår fortfarande inte ({reveal.collapsedDetailCount} steg till)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={reveal.collapseAll}
                          style={{
                            all: 'unset',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            letterSpacing: '0.06em',
                            color: 'var(--muted)',
                          }}
                        >
                          [-] korta ner förklaringen
                        </button>
                      )}
                    </div>
                  )}

                  {explanation.distractors.length > 0 && (
                    <section
                      style={{
                        marginTop: 24,
                        paddingTop: 12,
                        borderTop: '1px dashed var(--hairline)',
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: 'var(--muted)',
                          margin: 0,
                          marginBottom: 12,
                        }}
                      >
                        ── distractors
                      </h2>
                      {explanation.distractors.map((d) => (
                        <div
                          key={d.letter}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'max-content 1fr',
                            gap: 12,
                            marginBottom: 10,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--accent)',
                            }}
                          >
                            [{d.letter.toLowerCase()}]
                          </span>
                          <div>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '64px 1fr',
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 11,
                                  color: 'var(--muted)',
                                  textTransform: 'lowercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                lockar:
                              </span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-display)',
                                  fontSize: 14,
                                  lineHeight: 1.5,
                                  color: 'var(--ink)',
                                }}
                              >
                                <MathText>{d.why_tempting}</MathText>
                              </span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 11,
                                  color: 'var(--muted)',
                                  textTransform: 'lowercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                fel:
                              </span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-display)',
                                  fontSize: 14,
                                  lineHeight: 1.5,
                                  color: 'var(--ink)',
                                }}
                              >
                                <MathText>{d.why_wrong}</MathText>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}

                  {explanation.technique && (
                    <section
                      style={{
                        marginTop: 24,
                        paddingLeft: 12,
                        borderLeft: '2px solid var(--accent)',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: 'var(--accent)',
                          margin: 0,
                          marginBottom: 6,
                        }}
                      >
                        TEKNIK
                      </h3>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          lineHeight: 1.45,
                          margin: 0,
                          color: 'var(--ink)',
                        }}
                      >
                        <MathText>{explanation.technique}</MathText>
                      </p>
                    </section>
                  )}
                  {explanation.pitfall && (
                    <section
                      style={{
                        marginTop: 16,
                        paddingLeft: 12,
                        borderLeft: '2px solid var(--bad)',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: 'var(--bad)',
                          margin: 0,
                          marginBottom: 6,
                        }}
                      >
                        FÄLLA
                      </h3>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          lineHeight: 1.45,
                          margin: 0,
                          color: 'var(--ink)',
                        }}
                      >
                        <MathText>{explanation.pitfall}</MathText>
                      </p>
                    </section>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Multi-row status bar — the signature element */}
      <div
        style={{
          background: 'var(--panel-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.06em',
          padding: '6px 16px',
          display: 'grid',
          rowGap: 2,
        }}
      >
        {/* row 1: mode + qid + progress + time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
          <span style={{ color: graded ? 'var(--accent)' : 'var(--muted)' }}>
            -- {graded ? 'GRADERAD' : 'ÖVNING'} -- · {question.section.toLowerCase()} · q1/1 · t+
            {elapsed}s
          </span>
          {graded && (
            <span style={{ color: correct ? 'var(--accent)' : 'var(--bad)' }}>
              {correct ? 'rätt' : 'fel'} · facit: {question.answer.toLowerCase()}
            </span>
          )}
        </div>
        {/* row 2: state-machine — option keymap, then graded summary */}
        <div style={{ color: 'var(--ink-2)' }}>
          {!graded ? (
            question.options
              ?.map(
                (o) =>
                  `${o.letter.toLowerCase()}:${(o.text.length > 16 ? `${o.text.slice(0, 14)}…` : o.text).replace(/\s+/g, ' ')}`,
              )
              .join('  ')
          ) : (
            <>
              <span style={{ color: 'var(--accent)' }}>↵ nästa fråga →</span>
              <span style={{ color: 'var(--muted)', marginLeft: 14 }}>
                [{picked?.toLowerCase()}] picked · {elapsed}s
              </span>
            </>
          )}
        </div>
        {/* row 3: global keymap hints */}
        <div style={{ color: 'var(--muted)' }}>↵ nästa · esc hem · ⌘k palett · / sök · ? hjälp</div>
      </div>
    </div>
  )
}
