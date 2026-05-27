// TypographySpec — Cat 8 preview.
//
// The system rendered. Not a variant — a single spec sheet showing
// every role in the proposed Typography primitive set so the user
// can see what extracting the system gives us. Modelled on Stripe
// Press / iA Writer typography spec pages.

const ROLES = [
  {
    name: 'Display 1',
    note: '"Klart." · masthead. Single-word headlines.',
    size: 'clamp(48px, 4vw + 24px, 72px)',
    family: 'var(--font-display)',
    weight: 500,
    track: '-0.02em',
    lineHeight: 1.05,
    sample: 'Klart.',
  },
  {
    name: 'Display 2',
    note: 'Section masthead · TrapCard headword.',
    size: 'clamp(32px, 2vw + 16px, 44px)',
    family: 'var(--font-display)',
    weight: 500,
    track: '-0.02em',
    lineHeight: 1.1,
    sample: 'Kvadrat-likhet låser inte tecken.',
  },
  {
    name: 'Display 3',
    note: 'Score readout · projected total.',
    size: 'clamp(24px, 1.5vw + 14px, 32px)',
    family: 'var(--font-display)',
    weight: 500,
    track: '-0.015em',
    lineHeight: 1.15,
    sample: '1.89 / 2.00',
  },
  {
    name: 'Display 4',
    note: 'Section letters on /progress.',
    size: '20px',
    family: 'var(--font-display)',
    weight: 500,
    track: '-0.012em',
    lineHeight: 1.2,
    sample: 'XYZ',
  },
  {
    name: 'Body Editorial',
    note: 'Reading paragraphs · 17/1.55. The instrument.',
    size: '17px',
    family: 'var(--font-display)',
    weight: 400,
    track: '0',
    lineHeight: 1.55,
    sample:
      'Studenten ser likhet och drar slutsatsen att kvantiteterna är lika. Hjärnan tar genvägen "lika kvadrater → lika tal" och hoppar över det andra tecknet.',
  },
  {
    name: 'Pull Quote',
    note: 'Italic editorial pulls · CoachLine elevated.',
    size: 'clamp(17px, 0.8vw + 14px, 22px)',
    family: 'var(--font-display)',
    weight: 400,
    track: '-0.005em',
    lineHeight: 1.4,
    italic: true,
    sample: 'Du har dykt upp 11 av de senaste 14 dagarna. Det är hur det görs.',
  },
  {
    name: 'Marginalia',
    note: 'Italic body, side notes · sigil status line.',
    size: '13px',
    family: 'var(--font-display)',
    weight: 400,
    track: '0',
    lineHeight: 1.4,
    italic: true,
    sample: '2 av 4 idag — börja med drill · XYZ',
  },
  {
    name: 'Folio',
    note: 'Mono · page-numbering · status line.',
    size: '11px',
    family: 'var(--font-mono)',
    weight: 500,
    track: '0.06em',
    lineHeight: 1.4,
    caps: true,
    tabular: true,
    sample: 'pp. 04 / 12 · spread 04',
  },
  {
    name: 'Eyebrow',
    note: 'Section labels · 10.5px small-caps mono.',
    size: '10.5px',
    family: 'var(--font-mono)',
    weight: 500,
    track: '0.14em',
    lineHeight: 1.2,
    caps: true,
    sample: 'Återkommande fälla',
  },
]

export function TypographySpec() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
        padding: 'clamp(24px, 3vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      {ROLES.map((role, i) => (
        <div
          key={role.name}
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            columnGap: 32,
            rowGap: 6,
            paddingTop: i === 0 ? 0 : 24,
            borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
          }}
          className="hpc-spec-row"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-2)',
              }}
            >
              {role.name}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {role.size.replace(/clamp\([^)]+\)/, role.size.length > 14 ? 'fluid' : role.size)} ·{' '}
              {role.weight}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 12,
                lineHeight: 1.4,
                color: 'var(--muted)',
              }}
            >
              {role.note}
            </span>
          </div>
          <div
            style={{
              fontFamily: role.family,
              fontWeight: role.weight,
              fontSize: role.size,
              letterSpacing: role.track,
              lineHeight: role.lineHeight,
              fontStyle: role.italic ? 'italic' : 'normal',
              textTransform: role.caps ? 'uppercase' : 'none',
              color: 'var(--ink)',
              fontVariantNumeric: role.tabular ? 'tabular-nums' : undefined,
            }}
          >
            {role.sample}
          </div>
        </div>
      ))}
      <style>{`
        @media (max-width: 768px) {
          .hpc-spec-row { grid-template-columns: 1fr !important; gap: 8px !important; }
        }
      `}</style>
    </div>
  )
}
