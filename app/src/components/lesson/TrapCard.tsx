// TrapCard — renders one trap-catalog entry (NOG/KVA/XYZ family).
//
// Collapsed by default — the dogfood user found 25 stacked full cards
// fatiguing on first read. Native <details>/<summary> gives a free,
// keyboard-accessible accordion: scan the 25 pattern titles, expand
// the few you want to study. No JS state.
//
// Expanded body composes the richer schema introduced 2026-05:
//
//   1. TLDR kicker (italic display) — pulled summary above the body
//   2. why_it_occurs — primary body
//   3. recognition_cue ("IGENKÄNNINGSTECKEN") — the textual cue
//   4. countermeasure ("MOTÅTGÄRD") — left-rule callout
//   5. worked_example — 4-beat narrative (Förutsättning · Fällans
//      tanke · Korrekt tanke · Svar)
//   6. counter_example ("NÄR FÄLLAN INTE GÄLLER")
//   7. common_distractor_signature (italic muted, kept as flavor)
//   8. example_questions — inline, resolved against the question bank
//   9. footer: "Öva detta mönster →" + MarkAsReadPill
//
// All fields except pattern_description / why_it_occurs / countermeasure
// are optional — sections render only when present.

import { Link } from '@tanstack/react-router'

import { MathText } from '@/components/MathText'
import { Eyebrow } from '@/components/primitives'
import type { TrapEntry } from '@/data/frameworks'
import type { Section } from '@/data/questions'

import { ExampleQuestions } from './ExampleQuestions'
import { MarkAsReadPill } from './MarkAsReadPill'

export function TrapCard({
  entry,
  section,
  read = false,
  onToggleRead,
}: {
  entry: TrapEntry
  section: Section
  read?: boolean
  onToggleRead?: () => void
}) {
  return (
    <details
      id={entry.id}
      style={{
        paddingBlock: 'clamp(20px, 2vw + 8px, 32px)',
        borderTop: '1px solid var(--hairline)',
        maxWidth: '68ch',
        scrollMarginTop: 'clamp(48px, 8vw, 96px)',
      }}
    >
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
          }}
        >
          <Eyebrow>{`${entry.id.replace('-TRAP-', ' · TRAP ')}${read ? ' · LÄST' : ''}`}</Eyebrow>
          <span
            aria-hidden
            className="trap-card-toggle"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          />
          {/* text set via CSS ::before so it flips on [open] without JS */}
        </div>
        {/* Headword: the `tldr` field IS the coach-voiced one-line
         *  lesson ("Kvadratlikhet låser inte tecknet — x² = y² öppnar
         *  både x = y och x = −y."), authored as the principle the
         *  student should walk away with. `pattern_description` is
         *  the clinical observation ("Student ser x² = y² och drar
         *  slutsatsen x = y..."), which belongs as supporting body
         *  text, not the headword. Swapping makes the scrollable list
         *  read like a book of one-line lessons instead of a catalog
         *  of error codes (synthesis Tier 1 #5). Fallback chain:
         *  tldr → pattern_description for any entry that doesn't
         *  have a tldr yet. */}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 1.4vw + 13px, 26px)',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          <MathText>{entry.tldr || entry.pattern_description}</MathText>
        </h3>
      </summary>

      <div style={{ marginTop: 20 }}>
        {/* Pattern description — what the student typically does —
         *  is now the opening body paragraph. When tldr is missing
         *  (the headword fell back to pattern_description), skip the
         *  duplicate by checking `entry.tldr`. */}
        {entry.tldr && entry.pattern_description && (
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
              lineHeight: 1.55,
              color: 'var(--ink-2)',
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            <MathText>{entry.pattern_description}</MathText>
          </p>
        )}

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            marginTop: 0,
            marginBottom: 0,
          }}
        >
          <MathText>{entry.why_it_occurs}</MathText>
        </p>

        {entry.recognition_cue && (
          <LabelledBlock label="Igenkänningstecken">
            <MathText>{entry.recognition_cue}</MathText>
          </LabelledBlock>
        )}

        <div
          style={{
            marginTop: 24,
            paddingLeft: 'clamp(16px, 1vw + 10px, 24px)',
            borderLeft: '1px solid var(--hairline)',
          }}
        >
          <Eyebrow>Motåtgärd</Eyebrow>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
              lineHeight: 1.55,
              color: 'var(--ink)',
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            <MathText>{entry.countermeasure}</MathText>
          </p>
        </div>

        {entry.worked_example && <WorkedExample example={entry.worked_example} />}

        {entry.counter_example && (
          <LabelledBlock label="När fällan inte gäller">
            <MathText>{entry.counter_example}</MathText>
          </LabelledBlock>
        )}

        {entry.common_distractor_signature && (
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(14px, 0.4vw + 12px, 15px)',
              lineHeight: 1.55,
              color: 'var(--muted)',
              marginTop: 18,
              marginBottom: 0,
              fontStyle: 'italic',
            }}
          >
            <MathText>{entry.common_distractor_signature}</MathText>
          </p>
        )}

        {entry.example_questions && entry.example_questions.length > 0 && (
          <ExampleQuestions qids={entry.example_questions} />
        )}

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/drill"
            search={{ section, framework: entry.id }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              lineHeight: 1.4,
              color: 'var(--ink)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--ink)',
              paddingBottom: 2,
            }}
          >
            Öva detta mönster →
          </Link>
          {onToggleRead && <MarkAsReadPill read={read} onToggle={onToggleRead} />}
        </div>
      </div>
    </details>
  )
}

function LabelledBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <Eyebrow>{label}</Eyebrow>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          marginTop: 8,
          marginBottom: 0,
        }}
      >
        {children}
      </p>
    </div>
  )
}

function WorkedExample({ example }: { example: NonNullable<TrapEntry['worked_example']> }) {
  const beats: Array<{
    label: string
    text: string
    tone: 'neutral' | 'trap' | 'correct' | 'answer'
  }> = [
    { label: 'Förutsättning', text: example.setup, tone: 'neutral' },
    { label: 'Fällans tanke', text: example.trap_thinking, tone: 'trap' },
    { label: 'Korrekt tanke', text: example.correct_thinking, tone: 'correct' },
    { label: 'Svar', text: example.answer, tone: 'answer' },
  ]
  return (
    <div style={{ marginTop: 28 }}>
      <Eyebrow>Räkneexempel</Eyebrow>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {beats.map((b) => (
          <Beat key={b.label} label={b.label} text={b.text} tone={b.tone} />
        ))}
      </div>
    </div>
  )
}

function Beat({
  label,
  text,
  tone,
}: {
  label: string
  text: string
  tone: 'neutral' | 'trap' | 'correct' | 'answer'
}) {
  const color =
    tone === 'trap'
      ? 'var(--muted)'
      : tone === 'correct'
        ? 'var(--ink)'
        : tone === 'answer'
          ? 'var(--ink)'
          : 'var(--ink-2)'
  const style: React.CSSProperties =
    tone === 'answer'
      ? {
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
          lineHeight: 1.5,
          color,
          margin: 0,
        }
      : {
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
          lineHeight: 1.55,
          color,
          margin: 0,
          fontStyle: tone === 'trap' ? 'italic' : 'normal',
        }
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: tone === 'trap' ? 'var(--muted)' : 'var(--ink-2)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <p style={style}>
        <MathText>{text}</MathText>
      </p>
    </div>
  )
}
