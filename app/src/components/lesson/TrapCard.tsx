// TrapCard — renders one trap-catalog entry (NOG/KVA/XYZ family).
//
// Layout follows the editorial composition established in PedagogyPanel:
// ID kicker (mono small-caps) → pattern (display serif) → why (body) →
// countermeasure (callout with hairline rule) → "Öva detta mönster" link.
//
// No card chrome — flush-left, hairline-articulated, body-text width.
// Phone gets stacked single-column; studio gets the same column with a
// marginalia "Öva" link in the gutter.

import { Link } from '@tanstack/react-router'

import { MathText } from '@/components/MathText'
import { Eyebrow } from '@/components/primitives'
import type { TrapEntry } from '@/data/frameworks'
import type { Section } from '@/data/questions'

export function TrapCard({ entry, section }: { entry: TrapEntry; section: Section }) {
  return (
    <article
      style={{
        paddingBlock: 'clamp(28px, 3vw + 12px, 48px)',
        borderTop: '1px solid var(--hairline)',
        maxWidth: '68ch',
      }}
    >
      <Eyebrow>{entry.id.replace('-TRAP-', ' · TRAP ')}</Eyebrow>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 1.6vw + 14px, 30px)',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
          marginTop: 12,
          marginBottom: 0,
        }}
      >
        <MathText>{entry.pattern_description}</MathText>
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          marginTop: 18,
          marginBottom: 0,
        }}
      >
        <MathText>{entry.why_it_occurs}</MathText>
      </p>
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
      <div style={{ marginTop: 24 }}>
        {/* DTK has no drill yet (image pipeline pending), so its trap
         *  cards fall back to a static label. Every other section has
         *  a working drill behind /drill?section=. */}
        {section === 'DTK' ? (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            övning kommer
          </span>
        ) : (
          <Link
            to="/drill"
            search={{ section }}
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
        )}
      </div>
    </article>
  )
}
