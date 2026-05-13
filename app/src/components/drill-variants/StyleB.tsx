// Style B v4 — Workbook.
//
// Visual metaphor: a page from a printed HP study booklet. Three
// hole punches at the spine, vertical margin line, all-caps mono
// section headers, checkbox option marks, double-rule dividers,
// "Klar! → nästa" footer. The aesthetic of an actual paper exam
// practice booklet — what a student would scribble on with a
// pencil — but fully interactive.
//
// This is genuinely different from A (Editorial 2-column) and C
// (Cockpit Terminal). The workbook has PERSONALITY: it's the
// "education tool" register, not the "refined publication" or
// "power-user interface" registers. It looks like a tool for
// learning, not for reading or operating.

import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import type { VariantData } from './DrillVariantShell'
import { useProgressiveReveal } from './useProgressiveReveal'

const SECTION_LABEL: Record<string, string> = {
  ORD: 'SYNONYMER',
  LÄS: 'LÄSFÖRSTÅELSE',
  MEK: 'MENINGSKOMPLETTERING',
  ELF: 'ENGLISH READING',
  XYZ: 'ALGEBRA',
  KVA: 'KVANTITATIV JÄMFÖRELSE',
  NOG: 'SUFFICIENS',
  DTK: 'DIAGRAM, TABELLER & KARTOR',
}

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
  const reveal = useProgressiveReveal(steps)
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
      {/* Chrome strip — minimal, mono, workbook header. */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 11,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
          padding: 'clamp(16px, 1.8vh, 24px) clamp(32px, 5vw, 64px) 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        <span>HP · Coach · Övningshäfte</span>
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            fontVariantNumeric: 'tabular-nums',
            textTransform: 'none',
          }}
        >
          sida 1 av 1
        </span>
      </header>

      {/* The workbook page. Wide content area, left-spine treatment. */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto',
          padding: 'clamp(40px, 5vh, 64px) clamp(24px, 4vw, 48px) clamp(80px, 10vh, 120px)',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 'clamp(28px, 4vw, 56px)',
          alignItems: 'start',
        }}
      >
        {/* Spine — vertical margin line + three hole punches.
         *  Signature workbook detail. The hole punches are subtle
         *  outlined circles (not filled) to read as paper detail,
         *  not as decoration. */}
        <aside
          aria-hidden
          style={{
            position: 'sticky',
            top: 'clamp(80px, 9vh, 112px)',
            alignSelf: 'start',
            width: 28,
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(140px, 22vh, 200px)',
            paddingTop: 20,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: decorative hole punches
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '1.5px solid var(--hairline)',
                background: 'color-mix(in oklch, var(--panel-2) 60%, transparent)',
              }}
            />
          ))}
        </aside>

        {/* The actual workbook content. Left-bordered by a soft
         *  vertical rule that runs the full length of the page. */}
        <article
          style={{
            position: 'relative',
            paddingLeft: 'clamp(24px, 3vw, 40px)',
            borderLeft: '1px solid var(--hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(28px, 4vh, 48px)',
          }}
        >
          {/* ── FRÅGA section ────────────────────────────────────── */}
          <section>
            <SectionHeader
              label="FRÅGA 1"
              meta={`${SECTION_LABEL[question.section] ?? question.section}  ·  ${question.qid}`}
            />

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 1.1rem + 0.6vw, 28px)',
                lineHeight: 1.3,
                letterSpacing: '-0.015em',
                fontWeight: 500,
                margin: 0,
                marginBottom: 28,
                whiteSpace: 'pre-wrap',
              }}
            >
              <MathText>{question.prompt ?? ''}</MathText>
            </h1>

            {/* Options as checkbox-prefixed rows. */}
            {question.options && (
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {question.options.map((opt) => {
                  const isPicked = picked === opt.letter
                  const isCorrect = graded && opt.letter === question.answer
                  const isWrong = graded && isPicked && !correct
                  return (
                    <li
                      key={opt.letter}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 24px 1fr',
                        gap: 14,
                        alignItems: 'baseline',
                        padding: '10px 0',
                        opacity: graded && !isPicked && !isCorrect ? 0.4 : 1,
                        transition: 'opacity 200ms',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          letterSpacing: '0.04em',
                          fontWeight: 600,
                          color: 'var(--muted)',
                        }}
                      >
                        {opt.letter.toLowerCase()}.
                      </span>
                      <button
                        type="button"
                        onClick={() => onPick(opt.letter)}
                        disabled={graded}
                        aria-label={`Välj ${opt.letter}`}
                        style={{
                          all: 'unset',
                          cursor: graded ? 'default' : 'pointer',
                          width: 20,
                          height: 20,
                          border: `1.5px solid ${
                            isCorrect
                              ? 'var(--accent)'
                              : isWrong
                                ? 'var(--bad)'
                                : isPicked
                                  ? 'var(--ink)'
                                  : 'var(--muted-2)'
                          }`,
                          borderRadius: 3,
                          background: isCorrect
                            ? 'var(--accent)'
                            : isPicked
                              ? 'var(--ink)'
                              : 'transparent',
                          color: 'var(--bg)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          transition: 'background 180ms, border-color 180ms, color 180ms',
                        }}
                      >
                        {isCorrect ? '✓' : isWrong ? '✗' : isPicked ? '✓' : ''}
                      </button>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(17px, 0.95rem + 0.3vw, 19px)',
                          lineHeight: 1.4,
                          letterSpacing: '-0.005em',
                          fontWeight: isPicked || isCorrect ? 500 : 400,
                          color: 'var(--ink)',
                          textDecoration: isWrong ? 'line-through' : 'none',
                          textDecorationColor: 'var(--bad)',
                          textDecorationThickness: 1.5,
                        }}
                      >
                        <MathText>{opt.text}</MathText>
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}

            {graded && (
              <p
                style={{
                  marginTop: 20,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  color: correct ? 'var(--accent)' : 'var(--bad)',
                  textTransform: 'uppercase',
                }}
              >
                {correct ? '✓ Rätt svar' : `✗ Fel — facit är (${question.answer.toLowerCase()})`}
              </p>
            )}
          </section>

          {graded && <DoubleRule />}

          {/* ── FÖRKLARING section ──────────────────────────────── */}
          {graded && explanation && (
            <>
              <section>
                <SectionHeader label="FÖRKLARING" meta={`${steps.length} steg`} />
                {steps.map((step) => {
                  const isDetail = (step.tier ?? 'essential') === 'detail'
                  const isCollapsed = reveal.isCollapsedDetail(step)
                  if (isCollapsed) {
                    return (
                      <button
                        key={step.n}
                        type="button"
                        onClick={() => reveal.expandDetail(step.n)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'grid',
                          gridTemplateColumns: '36px 1fr auto',
                          gap: 14,
                          alignItems: 'baseline',
                          padding: '8px 0',
                          marginBottom: 8,
                          borderBottom:
                            '1px dashed color-mix(in oklch, var(--hairline) 70%, transparent)',
                          width: '100%',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            color: 'var(--muted)',
                            fontVariantNumeric: 'tabular-nums',
                            fontWeight: 600,
                          }}
                        >
                          {String(step.n).padStart(2, '0')}.
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 16,
                            lineHeight: 1.4,
                            color: 'var(--ink-2)',
                            fontWeight: 500,
                          }}
                        >
                          <MathText>{step.title ?? step.text.slice(0, 80)}</MathText>
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 13,
                            fontStyle: 'italic',
                            color: 'var(--muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          se mer ↘
                        </span>
                      </button>
                    )
                  }
                  return (
                    <article
                      key={step.n}
                      style={{
                        position: 'relative',
                        marginBottom: 'clamp(24px, 3vh, 36px)',
                        display: 'grid',
                        gridTemplateColumns: '36px 1fr',
                        gap: 14,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--ink)',
                          fontVariantNumeric: 'tabular-nums',
                          paddingTop: 2,
                        }}
                      >
                        {String(step.n).padStart(2, '0')}.
                      </span>
                      <div style={{ position: 'relative' }}>
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
                              fontSize: 10,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: 'var(--muted)',
                            }}
                          >
                            dölj ↗
                          </button>
                        )}
                        {step.title && (
                          <h3
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 'clamp(18px, 0.95rem + 0.4vw, 22px)',
                              lineHeight: 1.25,
                              letterSpacing: '-0.012em',
                              fontWeight: 500,
                              margin: 0,
                              marginBottom: 8,
                              paddingRight: isDetail ? 48 : 0,
                              color: 'var(--ink)',
                            }}
                          >
                            <MathText>{step.title}</MathText>
                          </h3>
                        )}
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(16px, 0.9rem + 0.3vw, 18px)',
                            lineHeight: 1.65,
                            letterSpacing: '-0.005em',
                            color: 'var(--ink-2)',
                          }}
                        >
                          <MathText>{step.text}</MathText>
                        </div>
                      </div>
                    </article>
                  )
                })}

                {reveal.totalDetailCount > 0 && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 20,
                      borderTop: '1px dashed color-mix(in oklch, var(--hairline) 70%, transparent)',
                    }}
                  >
                    {reveal.collapsedDetailCount > 0 ? (
                      <button
                        type="button"
                        onClick={reveal.expandAll}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '6px 0',
                          fontFamily: 'var(--font-display)',
                          fontSize: 17,
                          fontStyle: 'italic',
                          color: 'var(--ink)',
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            border: '1.5px solid var(--ink)',
                            borderRadius: 3,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        />
                        Jag förstår fortfarande inte
                        <span
                          style={{
                            color: 'var(--muted)',
                            marginLeft: 4,
                            fontStyle: 'normal',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            letterSpacing: '0.06em',
                          }}
                        >
                          ({reveal.collapsedDetailCount} steg till)
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={reveal.collapseAll}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                        }}
                      >
                        ← Korta ner förklaringen
                      </button>
                    )}
                  </div>
                )}
              </section>

              <DoubleRule />

              {/* ── VARFÖR INTE DE ANDRA ─────────────────────────── */}
              {explanation.distractors.length > 0 && (
                <>
                  <section>
                    <SectionHeader label="VARFÖR INTE DE ANDRA?" />
                    {explanation.distractors.map((d) => (
                      <div
                        key={d.letter}
                        style={{
                          marginBottom: 20,
                          display: 'grid',
                          gridTemplateColumns: '36px 1fr',
                          gap: 14,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--ink)',
                            paddingTop: 2,
                          }}
                        >
                          {d.letter.toLowerCase()}.
                        </span>
                        <div>
                          <p
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 16,
                              lineHeight: 1.55,
                              margin: 0,
                              marginBottom: 4,
                              color: 'var(--ink-2)',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                color: 'var(--muted)',
                                marginRight: 10,
                              }}
                            >
                              FRESTAR
                            </span>
                            <MathText>{d.why_tempting}</MathText>
                          </p>
                          <p
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 16,
                              lineHeight: 1.55,
                              margin: 0,
                              color: 'var(--ink-2)',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                color: 'var(--muted)',
                                marginRight: 10,
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

                  <DoubleRule />
                </>
              )}

              {/* ── TEKNIK ────────────────────────────────────────── */}
              {explanation.technique && (
                <section>
                  <SectionHeader label="TEKNIK" />
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 17,
                      lineHeight: 1.6,
                      margin: 0,
                      color: 'var(--ink)',
                      paddingLeft: 14,
                      borderLeft: '2px solid var(--accent)',
                    }}
                  >
                    <MathText>{explanation.technique}</MathText>
                  </p>
                </section>
              )}

              {/* ── FÄLLA ─────────────────────────────────────────── */}
              {explanation.pitfall && (
                <section>
                  <SectionHeader label="FÄLLA" />
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 17,
                      lineHeight: 1.6,
                      margin: 0,
                      color: 'var(--ink)',
                      fontStyle: 'italic',
                      paddingLeft: 14,
                      borderLeft: '2px solid var(--bad)',
                    }}
                  >
                    <MathText>{explanation.pitfall}</MathText>
                  </p>
                </section>
              )}

              <DoubleRule />

              {/* "Klar!" footer — checkbox row, workbook style. */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onReset}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 0',
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'var(--ink)',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      border: '1.5px solid var(--ink)',
                      borderRadius: 3,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--ink)',
                    }}
                  >
                    ✓
                  </span>
                  Klar — nästa fråga
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: 'var(--muted)',
                      marginLeft: 4,
                    }}
                  >
                    ↵
                  </span>
                </button>
              </div>
            </>
          )}
        </article>
      </main>

      {/* Status line — workbook footer. */}
      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          background: 'var(--bg)',
          borderTop: '1px solid var(--hairline)',
          padding: '10px clamp(32px, 5vw, 64px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          color: 'var(--muted)',
        }}
      >
        <span style={{ color: graded ? 'var(--accent)' : 'var(--muted)' }}>
          -- {graded ? 'GRADERAD' : 'ÖVNING'} -- · {question.section.toLowerCase()}
        </span>
        <span style={{ display: 'inline-flex', gap: 14 }}>
          <span>esc tillbaka</span>
          <span>⌘k palett</span>
          {graded && <span style={{ color: 'var(--ink)' }}>↵ nästa</span>}
        </span>
      </footer>
    </div>
  )
}

// ── Section header — workbook-style mono caps + meta line ──────────
function SectionHeader({ label, meta }: { label: string; meta?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 6,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.18em',
            fontWeight: 700,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {label}
        </h2>
        {meta && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
            }}
          >
            {meta}
          </span>
        )}
      </div>
      <span
        aria-hidden
        style={{
          display: 'block',
          width: '100%',
          height: 1,
          background: 'var(--ink)',
          opacity: 0.85,
        }}
      />
    </div>
  )
}

// ── Double rule — workbook section divider ──────────────────────────
function DoubleRule() {
  return (
    <div
      aria-hidden
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <span style={{ display: 'block', height: 1, background: 'var(--hairline)' }} />
      <span style={{ display: 'block', height: 1, background: 'var(--hairline)' }} />
    </div>
  )
}
