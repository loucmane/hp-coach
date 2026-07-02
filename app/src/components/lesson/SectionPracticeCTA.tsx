// SectionPracticeCTA — the section-top practice entry on a lektion page.
//
// Two doors, chosen in the lektion-practice bake-off (Sektion-CTA = på):
//   1. "Öva hela <SECTION> →"  — a normal N-question section drill
//      (/drill?section=X). Always shown.
//   2. "Öva svagaste fällorna →" — drills the pattern the user most often
//      falls for in THIS section, read off their live mistake queue via
//      useTopTraps (/drill?framework=ID). Shown only when such a trap
//      exists — it vanishes on good days rather than dangling a button
//      with nothing behind it (same discipline as TopTrapsCard).
//      Threshold is minCount:1 (any missed trap), NOT the home card's
//      recurring ≥2: this is an *active* "I want to drill my weak spots"
//      entry the user chose, so a single recent miss is a valid target —
//      where the passive every-morning home surface needs ≥2 to avoid
//      noise. The link (/drill?section=X&weak=1) drills questions from ALL
//      N weak patterns in the section; "N st" shows how many there are.
//
// Sits under the "N mönster · ~M min läsning" meta line, above the trap
// list — the deliberate "I want to drill, not read" entry that the
// per-row "Öva detta mönster →" links complement.

import { Link } from '@tanstack/react-router'

import { useTopTraps } from '@/api/hooks/useTopTraps'
import type { Section } from '@/data/questions'

export function SectionPracticeCTA({ section }: { section: Section }) {
  // Pull a few traps so a section with several weak patterns still resolves
  // its worst; filter to this section and take the highest-miss one.
  const weakInSection = useTopTraps({ limit: 8, minCount: 1 }).filter((t) => t.section === section)
  const weakest = weakInSection[0]

  return (
    <div
      className="reveal"
      data-testid="section-practice-cta"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 22,
        animationDelay: '60ms',
      }}
    >
      <Link to="/drill" search={{ section }} data-testid="section-practice-all" style={primary}>
        Öva hela {section} → <span style={{ color: 'var(--bg)', opacity: 0.65 }}>~10 frågor</span>
      </Link>

      {weakest && (
        <Link
          to="/drill"
          search={{ section, weak: true }}
          data-testid="section-practice-weak"
          style={ghost}
        >
          Öva svagaste fällorna →{' '}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {weakInSection.length} st
          </span>
        </Link>
      )}
    </div>
  )
}

const primary: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 15,
  background: 'var(--ink)',
  color: 'var(--bg)',
  textDecoration: 'none',
  padding: '11px 18px',
  borderRadius: 9,
  whiteSpace: 'nowrap',
}
const ghost: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 15,
  color: 'var(--ink)',
  textDecoration: 'none',
  padding: '11px 18px',
  borderRadius: 9,
  border: '1px solid var(--hairline)',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
}
