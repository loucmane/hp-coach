// /pre-grade-bake-off — pick the right-column treatment that fills
// the pre-grade "dead air" 50% of the canvas before the student picks
// an option.
//
// Renders all 4 variants (a/b/c/d) of the right column against the
// SAME real question on the left, so the contrast is purely in how
// the column fills (or refuses to fill) the canvas.
//
// Section picker lets you cycle through KVA → MEK → LÄS → ORD to see
// how each variant handles different content shapes:
//   - KVA: structured math, often short prompt
//   - MEK: 4-luck sentence completion
//   - LÄS: passage + question (longest left column)
//   - ORD: single headword (shortest left column — variant D's bet
//          gets tested hardest here)
//
// After the user picks, the route can be removed in a follow-up PR or
// kept as a "pre-grade audit" surface for future treatments.

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { MathText } from '@/components/MathText'
import { MobileFrame } from '@/components/MobileFrame'
import { PreGradeA } from '@/components/pre-grade-variants/PreGradeA'
import { PreGradeB } from '@/components/pre-grade-variants/PreGradeB'
import { PreGradeC } from '@/components/pre-grade-variants/PreGradeC'
import { PreGradeD } from '@/components/pre-grade-variants/PreGradeD'
import { Mono } from '@/components/primitives'
import { findQuestion, loadBank, type Question, type Section } from '@/data/questions'

export const Route = createFileRoute('/pre-grade-bake-off')({
  component: PreGradeBakeOff,
})

type VariantKey = 'A' | 'B' | 'C' | 'D'
const VARIANT_KEYS: VariantKey[] = ['A', 'B', 'C', 'D']
const VARIANT_LABELS: Record<VariantKey, string> = {
  A: 'Coaching note',
  B: 'Section primer',
  C: 'Apparatus criticus',
  D: 'Negative space',
}
const VARIANT_RECIPES: Record<VariantKey, string> = {
  A: '1–2 rader · sektionsspecifik · strategi-frame',
  B: '3 block · vad testas / poäng / fällor · Layer 1-innehåll',
  C: 'kritisk-utgåva-apparatus · edition / half / qid / position',
  D: 'avsiktlig tomhet · eyebrow + hairline + qid',
}

// Representative qids per section. Each one is real content from
// host-2013 so the page is genuinely informative, not lorem-ipsum.
type SectionDemo = { qid: string; label: string; sectionKey: Section }
const DEMOS: SectionDemo[] = [
  { qid: 'host-2013-kvant1-KVA-015', label: 'KVA · jämförelse', sectionKey: 'KVA' },
  { qid: 'host-2013-verb1-MEK-021', label: 'MEK · meningskomplettering', sectionKey: 'MEK' },
  { qid: 'host-2013-verb1-LÄS-011', label: 'LÄS · läsförståelse', sectionKey: 'LÄS' },
  { qid: 'host-2013-verb1-ORD-002', label: 'ORD · synonym', sectionKey: 'ORD' },
]

function PreGradeBakeOff() {
  const [bank, setBank] = useState<readonly Question[] | null>(null)
  const [demoIdx, setDemoIdx] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadBank()
      .then((b) => alive && setBank(b))
      .catch((e) => alive && setErr(String(e?.message ?? e)))
    return () => {
      alive = false
    }
  }, [])

  const demo = DEMOS[demoIdx]
  const question = bank ? findQuestion(bank, demo.qid) : null

  return (
    <MobileFrame tabs={false}>
      <div
        style={{
          minHeight: '100%',
          padding: 'clamp(20px, 3vw, 40px) clamp(16px, 3vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          color: 'var(--ink)',
          overflow: 'auto',
        }}
      >
        <Header demo={demo} demoIdx={demoIdx} setDemoIdx={setDemoIdx} />
        {err ? (
          <ErrorState message={err} />
        ) : !question ? (
          <LoadingState />
        ) : (
          <>
            {VARIANT_KEYS.map((v) => (
              <VariantCard key={v} variant={v} question={question} />
            ))}
            <Footer />
          </>
        )}
      </div>
    </MobileFrame>
  )
}

function Header({
  demo,
  demoIdx,
  setDemoIdx,
}: {
  demo: SectionDemo
  demoIdx: number
  setDemoIdx: (n: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Mono>Pre-grade column · Bake-off</Mono>
        <Mono>{demo.label}</Mono>
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 2vw + 20px, 44px)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        Vad fyller högerspalten innan grade?
      </h1>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          maxWidth: '60ch',
        }}
      >
        Samma fråga vänster, fyra varianter höger. Bläddra sektionen för att se hur varje variant
        beter sig mot olika innehåll. Pick den som läser bäst tvärs över alla fyra demos.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {DEMOS.map((d, i) => (
          <button
            key={d.qid}
            type="button"
            onClick={() => setDemoIdx(i)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '6px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: i === demoIdx ? 'var(--ink)' : 'var(--muted)',
              borderBottom: `1px solid ${i === demoIdx ? 'var(--ink)' : 'transparent'}`,
              transition: 'all 150ms',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div
      style={{
        padding: 'var(--pad-lg)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--muted)',
      }}
    >
      Laddar …
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: 'var(--pad-lg)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--bad)',
      }}
    >
      Kunde inte ladda fråga: {message}
    </div>
  )
}

function VariantCard({ variant, question }: { variant: VariantKey; question: Question }) {
  return (
    <section
      style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Variant {variant}
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              letterSpacing: '-0.01em',
              fontWeight: 500,
            }}
          >
            {VARIANT_LABELS[variant]}
          </h2>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--muted)',
            letterSpacing: '0.04em',
            maxWidth: '40ch',
            textAlign: 'right',
          }}
        >
          {VARIANT_RECIPES[variant]}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.85fr)',
          gap: 'clamp(32px, 5vw, 80px)',
          alignItems: 'start',
        }}
      >
        <QuestionColumn question={question} />
        <PreGradeColumn variant={variant} question={question} />
      </div>
    </section>
  )
}

function PreGradeColumn({ variant, question }: { variant: VariantKey; question: Question }) {
  // Faux position counter — would be wired to the live session in production.
  const position = 13
  const total = 80
  switch (variant) {
    case 'A':
      return <PreGradeA section={question.section} />
    case 'B':
      return <PreGradeB section={question.section} />
    case 'C':
      return (
        <PreGradeC
          qid={question.qid}
          section={question.section}
          position={position}
          total={total}
        />
      )
    case 'D':
      return <PreGradeD qid={question.qid} />
  }
}

// Lightweight question column — mirrors StyleA's left column shape
// (mono section eyebrow + headword/prompt + option list at low opacity
// to signal "not picked yet"), but without scroll-sticky chrome since
// the bake-off page is a single long scroll.
function QuestionColumn({ question }: { question: Question }) {
  return (
    <div style={{ paddingTop: 'clamp(28px, 4vh, 48px)', maxWidth: '60ch' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 16,
        }}
      >
        Övning · {question.section}
      </div>
      {question.context && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(15px, 0.875rem + 0.3vw, 17px)',
            lineHeight: 1.65,
            color: 'var(--ink-2)',
            marginBottom: 24,
            paddingLeft: 14,
            borderLeft: '1px solid var(--hairline)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {question.context}
        </div>
      )}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(20px, 1rem + 0.6vw, 24px)',
          lineHeight: 1.35,
          letterSpacing: '-0.012em',
          fontWeight: 500,
          marginBottom: 24,
          color: 'var(--ink)',
        }}
      >
        <MathText>{question.prompt ?? ''}</MathText>
      </div>
      {question.options && (
        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            borderTop: '1px solid color-mix(in oklch, var(--hairline) 60%, transparent)',
          }}
        >
          {question.options.map((opt) => (
            <li
              key={opt.letter}
              style={{
                borderBottom: '1px solid color-mix(in oklch, var(--hairline) 60%, transparent)',
                padding: '12px 0',
                paddingLeft: 12,
                marginLeft: -12,
                display: 'grid',
                gridTemplateColumns: '24px 1fr',
                gap: 14,
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {opt.letter.toLowerCase()}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  lineHeight: 1.45,
                  color: 'var(--ink-2)',
                }}
              >
                {opt.text}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Footer() {
  return (
    <div
      style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid var(--hairline)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: '60ch',
      }}
    >
      <div>Cykla mellan sektioner via knapparna ovan.</div>
      <div>
        Säg vilken bokstav (A/B/C/D) — eller blanda: t.ex. "C men ge mig A:s ton om frågan har ett
        konkret strategi-tips".
      </div>
    </div>
  )
}
