// TrapCard — renders one trap-catalog entry (NOG/KVA/XYZ family).
//
// Collapsed by default — the dogfood user found 25 stacked full cards
// fatiguing on first read. Native <details>/<summary> gives a free,
// keyboard-accessible accordion: scan the 25 pattern titles, expand
// the few you want to study. No JS state.
//
// Visual contract per card:
//   collapsed:  ID kicker · pattern (display)  ·  + (mono affordance)
//   expanded:   above + why → countermeasure (hairline rule) → optional
//               distractor signature → "Öva detta mönster" link

import { Link } from '@tanstack/react-router'

import { MathText } from '@/components/MathText'
import { Eyebrow } from '@/components/primitives'
import type { TrapEntry } from '@/data/frameworks'
import type { Section } from '@/data/questions'

export function TrapCard({ entry, section }: { entry: TrapEntry; section: Section }) {
  return (
    <details
      style={{
        paddingBlock: 'clamp(20px, 2vw + 8px, 32px)',
        borderTop: '1px solid var(--hairline)',
        maxWidth: '68ch',
      }}
    >
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          // Override the default disclosure triangle (added with `display:
          // list-item`) for both Webkit and Gecko.
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
          <Eyebrow>{entry.id.replace('-TRAP-', ' · TRAP ')}</Eyebrow>
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
          <MathText>{entry.pattern_description}</MathText>
        </h3>
      </summary>

      <div style={{ marginTop: 20 }}>
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
        </div>
      </div>
    </details>
  )
}
