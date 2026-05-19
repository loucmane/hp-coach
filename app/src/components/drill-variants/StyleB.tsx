// Style B v5 — Workbook (2-column spread).
//
// User has now told me THREE TIMES that the question belongs in
// its own column on the left, not stacked above. The workbook
// aesthetic stays — three hole punches in the spine, all-caps mono
// section headers, checkbox option marks, double-rule section
// dividers — but the COMPOSITION is 2-column, identical structure
// to Variant A.
//
// Mental model: a workbook open to a facing-pages spread. Left
// page = the question (sticky, what you're working on). Right
// page = the explanation (scrolls, what teaches you). Spine in
// the middle.

import { KvaPrompt } from '@/components/drill/KvaPrompt'
import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { QuestionFigure } from '@/components/drill/QuestionFigure'
import { EditionStrip } from '@/components/EditionStrip'
import { MathText } from '@/components/MathText'
import type { VariantData } from './DrillVariantShell'
import { useExplanation } from './useExplanation'
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
  explanation: explanationProp,
  picked,
  graded,
  correct,
  onPick,
  onReset,
}: VariantData) {
  // Self-load if the caller didn't preload (SessionPlayer case).
  const fetched = useExplanation(question.qid)
  const explanation = explanationProp ?? fetched
  const steps = explanation ? resolveSteps(explanation) : []
  const reveal = useProgressiveReveal(steps)
  // LÄS / ELF widen the question column for comfortable reading width.
  const hasLongContext = !!question.context
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
      {/* Chrome strip — workbook header. */}
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
        {/* Phase A.6V Edition Strip — replaces the static 'sida 1 av 1'
         *  marginal. Workbook header was already mono lowercase; the
         *  picker reads native here. */}
        <EditionStrip />
      </header>

      {/* 2-column workbook spread: question page left, pedagogy page right.
       *  Same structure as Variant A's 2-column composition — sticky left,
       *  scrolling right. The aesthetic is workbook, not editorial.
       *
       *  Grid top-padding is zero so the question column's natural-top
       *  matches its sticky-top (= header height) and pins without drift.
       *  Internal section padding gives the visual breath. */}
      <main
        style={{
          flex: 1,
          width: '100%',
          // For LÄS/ELF (long passage) widen the canvas + flip the
          // ratio so the passage column gets book width and pedagogy
          // still has real estate on the right. See StyleA for the
          // same trick — identical rationale.
          maxWidth: hasLongContext ? 1500 : 1320,
          margin: '0 auto',
          padding: '0 clamp(32px, 5vw, 64px) clamp(120px, 14vh, 180px)',
          display: 'grid',
          gridTemplateColumns: hasLongContext
            ? 'minmax(0, 1.2fr) minmax(0, 0.6fr)'
            : 'minmax(0, 0.7fr) minmax(0, 1fr)',
          gap: 'clamp(40px, 4vw, 72px)',
        }}
      >
        {/* ── LEFT PAGE — the question ──────────────────────────────
         *  Stripped of decorative chrome (no hole-punch circles, no
         *  spine border). The single workbook signature kept here is
         *  the checkbox option marks. Everything else is clean
         *  editorial — header, prompt, options, done.
         *
         *  sticky-top matches the running head's height so the question
         *  pins immediately at scrollY=0 — no scroll-drift. */}
        <section
          style={{
            position: 'sticky',
            top: 'clamp(42px, 1.8vh + 22px, 56px)',
            paddingTop: 'clamp(28px, 4vh, 48px)',
            alignSelf: 'start',
            maxHeight: 'calc(100dvh - 100px)',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
          className="hpc-scrollbar-ghost"
        >
          <SectionHeader label="FRÅGA" meta={SECTION_LABEL[question.section] ?? question.section} />

          {/* Prompt — section-specific rendering. KVA splits the
           *  "Kvantitet I: / Kvantitet II:" structure into 3 rows
           *  with mono small-caps eyebrows (same as the baseline
           *  DrillQuestion uses). Other sections render the raw
           *  prompt at display scale. */}
          {/* LÄS / ELF passage — workbook reading panel. Bordered
           *  background tile gives the passage its own zone on the
           *  left page, matching the workbook's "facing-pages spread"
           *  metaphor. Mono small-caps eyebrow names it as a passage
           *  the way a workbook would: PASSAGE / LÄSTEXT. */}
          {question.context && (
            <div
              data-testid="drill-context"
              style={{
                marginBottom: 24,
                border: '1px solid var(--hairline)',
                background: 'var(--panel-2)',
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  borderBottom: '1px solid var(--hairline)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                {question.section === 'ELF' ? 'Passage' : 'Lästext'}
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(14px, 0.8rem + 0.3vw, 16px)',
                  lineHeight: 1.55,
                  color: 'var(--ink)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {question.context}
              </div>
            </div>
          )}
          {/* Prompt block — measure-capped at 60ch so prose stays in a
           *  comfortable workbook reading column even when the grid
           *  track is wider. Same haiku-machine fix as Editorial. */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 1rem + 0.6vw, 26px)',
              lineHeight: 1.3,
              letterSpacing: '-0.015em',
              fontWeight: 500,
              marginBottom: 24,
              color: 'var(--ink)',
              maxWidth: '60ch',
            }}
          >
            {question.section === 'KVA' && question.prompt ? (
              <KvaPrompt prompt={question.prompt} />
            ) : (
              <MathText>{question.prompt ?? ''}</MathText>
            )}
          </div>

          {/* Inline vector figure — XYZ/KVA/NOG diagrams. Sits between
           *  prompt and options. */}
          {question.figure && (
            <div style={{ marginBottom: 24 }}>
              <QuestionFigure figure={question.figure} />
            </div>
          )}

          {/* Options as checkbox rows. Single button per row makes the
           *  whole row clickable, not just the tiny checkbox. The
           *  checkbox label is the letter — the checkbox IS the
           *  affordance, so the letter lives inside it (workbook
           *  metaphor: filling in the answer box). */}
          {question.options && (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {question.options.map((opt) => {
                const isPicked = picked === opt.letter
                const isCorrect = graded && opt.letter === question.answer
                const isWrong = graded && isPicked && !correct
                return (
                  <li key={opt.letter} style={{ margin: 0 }}>
                    <button
                      type="button"
                      onClick={() => onPick(opt.letter)}
                      disabled={graded}
                      aria-label={`Välj ${opt.letter}`}
                      style={{
                        all: 'unset',
                        cursor: graded ? 'default' : 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '26px 1fr',
                        gap: 14,
                        alignItems: 'baseline',
                        padding: '10px 0',
                        width: '100%',
                        opacity: graded && !isPicked && !isCorrect ? 0.45 : 1,
                        transition: 'opacity 200ms',
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 22,
                          height: 22,
                          // var(--ok) = semantic green (stable across palettes).
                          // var(--accent) is decorative palette identity and
                          // can be lemon/rose/tan — wrong color for correctness.
                          border: `1.5px solid ${
                            isCorrect
                              ? 'var(--ok)'
                              : isWrong
                                ? 'var(--bad)'
                                : isPicked
                                  ? 'var(--ink)'
                                  : 'var(--muted-2)'
                          }`,
                          borderRadius: 3,
                          background: isCorrect
                            ? 'var(--ok)'
                            : isPicked
                              ? 'var(--ink)'
                              : 'transparent',
                          color: isCorrect || isPicked ? 'var(--bg)' : 'var(--muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          transition: 'background 180ms, border-color 180ms, color 180ms',
                        }}
                      >
                        {opt.letter.toLowerCase()}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(15px, 0.85rem + 0.3vw, 17px)',
                          lineHeight: 1.45,
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
                    </button>
                  </li>
                )
              })}
            </ol>
          )}

          {graded && (
            <p
              style={{
                marginTop: 16,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                color: correct ? 'var(--ok)' : 'var(--bad)',
                textTransform: 'uppercase',
              }}
            >
              {correct ? '✓ Rätt svar' : `✗ Fel — rätt svar är (${question.answer.toLowerCase()})`}
            </p>
          )}

          {graded && (
            <button
              type="button"
              onClick={onReset}
              style={{
                all: 'unset',
                cursor: 'pointer',
                marginTop: 24,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              ← börja om
            </button>
          )}
        </section>

        {/* ── RIGHT PAGE — pedagogy ──────────────────────────────────
         *  paddingTop matches the question column's internal padding so
         *  both columns align at the top of the canvas. */}
        <section style={{ minWidth: 0, paddingTop: 'clamp(28px, 4vh, 48px)' }}>
          {!graded ? (
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                lineHeight: 1.7,
                color: 'var(--muted)',
                fontStyle: 'italic',
                opacity: 0.6,
                margin: 0,
                paddingTop: 60,
              }}
            >
              Förklaringen visas här när du svarat.
            </p>
          ) : (
            explanation && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'clamp(28px, 4vh, 48px)',
                  animation: 'hpc-reveal 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
                }}
              >
                {/* FÖRKLARING */}
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

                  {/* Progressive Reveal CTA — workbook checkbox row. */}
                  {reveal.totalDetailCount > 0 && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 20,
                        borderTop:
                          '1px dashed color-mix(in oklch, var(--hairline) 70%, transparent)',
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

                {/* VARFÖR INTE DE ANDRA */}
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

                {/* TEKNIK */}
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

                {/* FÄLLAN HÄR */}
                {explanation.pitfall && (
                  <section>
                    <SectionHeader label="FÄLLAN HÄR" />
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

                {/* Klar checkbox footer */}
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
              </div>
            )
          )}
        </section>
      </main>

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

function SectionHeader({ label, meta }: { label: string; meta?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
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
            fontSize: 12,
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
