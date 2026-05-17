// LexiconCard — renders one ORD root entry.
//
// Different rhythm from TrapCard/ProtocolCard: this is a dictionary
// entry, not a pattern. Summary shows the root as the headword
// (display font, bigger), with origin + meaning on the same line as
// the kicker. The expanded body lists example words derived from the
// root — these are what the user practices recognising in the drill.

import { Link } from '@tanstack/react-router'

import { Eyebrow } from '@/components/primitives'
import type { LexiconEntry } from '@/data/frameworks'

export function LexiconCard({ entry }: { entry: LexiconEntry }) {
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
          <Eyebrow>
            {entry.id.replace('-ROOT-', ' · ROT ')} · {entry.origin}
          </Eyebrow>
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
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 2vw + 16px, 40px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {entry.root}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(15px, 0.6vw + 13px, 18px)',
            lineHeight: 1.4,
            color: 'var(--ink-2)',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          {entry.meaning}
        </p>
      </summary>

      <div style={{ marginTop: 20 }}>
        <Eyebrow>Exempel</Eyebrow>
        <ul
          style={{
            marginTop: 10,
            marginBottom: 0,
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 14px',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
            color: 'var(--ink)',
          }}
        >
          {entry.example_words.map((w) => (
            <li
              key={w}
              style={{
                padding: '4px 10px',
                border: '1px solid var(--hairline)',
                borderRadius: 999,
              }}
            >
              {w}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 24 }}>
          <Link
            to="/drill"
            search={{ section: 'ORD' as const }}
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
            Öva ord med denna rot →
          </Link>
        </div>
      </div>
    </details>
  )
}
