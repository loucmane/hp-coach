// /dev/explanation-bake-off — Phase A.6V voice picker
//
// Side-by-side comparison of three hand-crafted explanation variants
// for the same two questions, so the dogfood user can pick the voice
// that wins the corpus regen. Stripped of all drill chrome (no
// answering, no grading state) — just the rendered Layer 2 content
// per variant, three columns at studio width, stacked at reader/phone.
//
// Inputs:
//   /explanations/host-2013-variant-A.json
//   /explanations/host-2013-variant-B.json
//   /explanations/host-2013-variant-C.json
// Each file is a dict keyed by qid; we read the same two qids
// (`host-2013-kvant2-KVA-016`, `host-2013-kvant1-NOG-026`) from
// each, then render in a 2×3 grid.
//
// No persisted state. No uiStore field. After the user picks the
// winner, this route gets removed (or kept as a "voice audit" surface
// for future prompt iterations) in the same PR that updates
// pipeline/explanations/prompts.py.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { resolveSteps, StepList } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Eyebrow, Hairline, Mono } from '@/components/primitives'
import type { Explanation } from '@/data/explanations'
import { useViewport } from '@/hooks/useViewport'

export const Route = createFileRoute('/dev/explanation-bake-off')({
  component: ExplanationBakeOff,
})

type VariantKey = 'A' | 'B' | 'C'
const VARIANT_KEYS: VariantKey[] = ['A', 'B', 'C']

const VARIANT_LABELS: Record<VariantKey, string> = {
  A: 'Coaching Deep',
  B: 'Confident Terse',
  C: 'Ultra-Granular',
}

const VARIANT_RECIPES: Record<VariantKey, string> = {
  A: '7 steg · full hand-holding · empati-öppningar · teknik + pitfall',
  B: '7 steg · ingen explainer-prosa · Trap/Fix · teknik (ingen pitfall)',
  C: '10+ steg · maximal first-principles · korsreferens till stegnummer',
}

// Two pilot questions chosen for cross-section signal — KVA (algebraic
// comparison, narrow pedagogy) and NOG (data sufficiency, distinct
// shape). If the recipe winner reads well across both, it's a safer
// bet for the full corpus.
type PilotQuestion = {
  qid: string
  title: string
  prompt: string
  answer: string
  options: Array<{ letter: string; text: string }>
}

const PILOT_QUESTIONS: PilotQuestion[] = [
  {
    qid: 'host-2013-kvant2-KVA-016',
    title: 'KVA · algebraisk jämförelse',
    prompt: 'b = a + 1   ·   Kvantitet I:  ab − 2a²   ·   Kvantitet II:  a(b − 2a)',
    answer: 'C',
    options: [
      { letter: 'A', text: 'I är större än II' },
      { letter: 'B', text: 'II är större än I' },
      { letter: 'C', text: 'I är lika med II' },
      { letter: 'D', text: 'informationen är otillräcklig' },
    ],
  },
  {
    qid: 'host-2013-kvant1-NOG-026',
    title: 'NOG · ålder + system',
    prompt:
      'Anna och Karin fyller båda år den 4 juli. Hur gammal var Karin den 4 juli 2001? ' +
      '(1) Den 4 juli 2007 var Karin 24 år yngre än Anna. ' +
      '(2) Den 4 juli 2014 kommer Anna att vara dubbelt så gammal som Karin.',
    answer: 'C',
    options: [
      { letter: 'A', text: 'i (1) men ej i (2)' },
      { letter: 'B', text: 'i (2) men ej i (1)' },
      { letter: 'C', text: 'i (1) tillsammans med (2)' },
      { letter: 'D', text: 'i (1) och (2) var för sig' },
      { letter: 'E', text: 'ej genom de båda påståendena' },
    ],
  },
]

type Bank = Record<VariantKey, Record<string, Explanation>>

function ExplanationBakeOff() {
  const navigate = useNavigate()
  const viewport = useViewport()
  const [bank, setBank] = useState<Bank | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all(
      VARIANT_KEYS.map((v) =>
        fetch(`/explanations/host-2013-variant-${v}.json`).then((r) => {
          if (!r.ok) throw new Error(`variant ${v} fetch failed: ${r.status}`)
          return r.json() as Promise<Record<string, Explanation>>
        }),
      ),
    )
      .then((results) => {
        if (!alive) return
        const merged: Bank = {
          A: results[0],
          B: results[1],
          C: results[2],
        }
        setBank(merged)
      })
      .catch((err) => {
        if (!alive) return
        setError(String(err?.message ?? err))
      })
    return () => {
      alive = false
    }
  }, [])

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
        <Header onClose={() => navigate({ to: '/' })} />
        {error ? (
          <ErrorState message={error} />
        ) : !bank ? (
          <LoadingState />
        ) : (
          PILOT_QUESTIONS.map((q) => (
            <QuestionSection key={q.qid} question={q} bank={bank} viewport={viewport} />
          ))
        )}
      </div>
    </MobileFrame>
  )
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Mono>Phase A.6V · Bake-off</Mono>
        <Btn variant="ghost" size="sm" onClick={onClose}>
          Klar
        </Btn>
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
        Explanation voice bake-off
      </h1>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.5vw + 14px, 18px)',
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          maxWidth: '60ch',
        }}
      >
        Tre handskrivna varianter av samma två frågor. Läs alla sex, välj den variant som lär dig
        bäst utifrån noll bakgrund. Vinnaren styr hur de ~3500 förklaringarna i korpus regenereras.
      </p>
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
        background: 'var(--panel-2)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--ink-2)',
      }}
    >
      Kunde inte ladda varianterna: {message}
    </div>
  )
}

function QuestionSection({
  question,
  bank,
  viewport,
}: {
  question: PilotQuestion
  bank: Bank
  viewport: ReturnType<typeof useViewport>
}) {
  // Three-column row at studio width; stacked at reader/phone. The
  // critique flagged this as the right ergonomic for side-by-side
  // comparison (single-screen 30-second eyeball-compare).
  const isStudio = viewport === 'studio'
  return (
    <section
      data-testid={`bake-off-section-${question.qid}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <Hairline />
      <QuestionMasthead question={question} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isStudio ? 'repeat(3, 1fr)' : '1fr',
          gap: 'clamp(20px, 2vw, 32px)',
        }}
      >
        {VARIANT_KEYS.map((v) => {
          const expl = bank[v][question.qid]
          if (!expl) {
            return (
              <VariantCard
                key={v}
                variant={v}
                explanation={null}
                placeholder={`Saknas i Variant ${v}`}
              />
            )
          }
          return <VariantCard key={v} variant={v} explanation={expl} />
        })}
      </div>
    </section>
  )
}

function QuestionMasthead({ question }: { question: PilotQuestion }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Mono style={{ color: 'var(--accent)' }}>{question.title}</Mono>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 0.5vw + 17px, 22px)',
          lineHeight: 1.4,
          color: 'var(--ink)',
          maxWidth: '85ch',
        }}
      >
        <MathText>{question.prompt}</MathText>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 4,
        }}
      >
        {question.options.map((opt) => (
          <span
            key={opt.letter}
            data-testid={`bake-off-option-${question.qid}-${opt.letter}`}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--hairline)',
              borderRadius: 'calc(var(--radius) * 0.4)',
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              color: opt.letter === question.answer ? 'var(--ok)' : 'var(--ink-2)',
              fontWeight: opt.letter === question.answer ? 600 : 400,
            }}
          >
            <strong style={{ marginRight: 6 }}>{opt.letter}</strong>
            {opt.text}
          </span>
        ))}
      </div>
    </div>
  )
}

function VariantCard({
  variant,
  explanation,
  placeholder,
}: {
  variant: VariantKey
  explanation: Explanation | null
  placeholder?: string
}) {
  if (!explanation) {
    return (
      <div
        data-testid={`variant-card-${variant}-empty`}
        style={{
          padding: 'var(--pad-lg)',
          border: '1px dashed var(--hairline)',
          borderRadius: 'calc(var(--radius) * 0.5)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--muted)',
        }}
      >
        {placeholder ?? `Variant ${variant} saknas`}
      </div>
    )
  }
  const words = countWords(explanation)
  // 200 wpm is the textbook average reading speed; we round to the
  // nearest half-minute to avoid false precision in the eyeball estimate.
  const minutes = Math.max(0.5, Math.round((words / 200) * 2) / 2)
  return (
    <article
      data-testid={`variant-card-${variant}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 'clamp(16px, 1.5vw, 28px)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        background: 'var(--panel)',
        containerType: 'inline-size',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Mono style={{ color: 'var(--accent)' }}>
          Variant {variant} · {VARIANT_LABELS[variant]}
        </Mono>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--muted)',
            letterSpacing: 'var(--font-mono-track)',
          }}
        >
          {words} ord · ~{minutes} min läsning
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--muted)',
            letterSpacing: 'var(--font-mono-track)',
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {VARIANT_RECIPES[variant]}
        </span>
      </header>
      <Eyebrow style={{ color: 'var(--muted)' }}>Lösning</Eyebrow>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          lineHeight: 1.5,
          color: 'var(--ink)',
        }}
      >
        <MathText>{explanation.solution_path}</MathText>
      </div>
      <Eyebrow style={{ color: 'var(--muted)' }}>Genomgång</Eyebrow>
      <StepList steps={resolveSteps(explanation)} />
      {explanation.distractors.length > 0 && (
        <>
          <Eyebrow style={{ color: 'var(--muted)' }}>Varför inte de andra</Eyebrow>
          <DistractorList distractors={explanation.distractors} />
        </>
      )}
      <Eyebrow style={{ color: 'var(--muted)' }}>Teknik</Eyebrow>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        <MathText>{explanation.technique}</MathText>
      </div>
      {explanation.pitfall && (
        <>
          <Eyebrow style={{ color: 'var(--muted)' }}>Fälla</Eyebrow>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
            }}
          >
            <MathText>{explanation.pitfall}</MathText>
          </div>
        </>
      )}
    </article>
  )
}

function DistractorList({ distractors }: { distractors: Explanation['distractors'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {distractors.map((d) => (
        <div
          key={d.letter}
          data-testid={`bake-off-distractor-${d.letter}`}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span
            aria-hidden
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 'var(--font-mono-track)',
              color: 'var(--accent)',
              fontWeight: 600,
              flex: '0 0 auto',
              marginTop: 2,
            }}
          >
            {d.letter}
          </span>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 13.5,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
            }}
          >
            <div>
              <MathText>{d.why_tempting}</MathText>
            </div>
            <div style={{ marginTop: 4, color: 'var(--ink)' }}>
              <MathText>{d.why_wrong}</MathText>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Approximate word count, excluding KaTeX-marker contents (math
// segments shouldn't count as "reading" the same way prose does).
function countWords(expl: Explanation): number {
  const parts: string[] = []
  parts.push(expl.solution_path)
  for (const s of expl.steps ?? []) {
    parts.push(s.title ?? '')
    parts.push(s.text)
  }
  for (const d of expl.distractors) {
    parts.push(d.why_tempting, d.why_wrong)
  }
  parts.push(expl.technique)
  if (expl.pitfall) parts.push(expl.pitfall)
  const text = parts.join(' ').replace(/[][^]*[]/g, '')
  return (text.match(/\w+/g) ?? []).length
}
