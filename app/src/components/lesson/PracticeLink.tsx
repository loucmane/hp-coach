// PracticeLink — the surfaced "öva" line shown inside a lesson card's
// <summary> so targeted practice is visible WITHOUT expanding the card.
//
// This is the "below-rule" treatment chosen in the lektion-practice
// bake-off (two independent expert panels picked it 3-2 then 5-0 over
// inline/inline-loud/chip): the verb sits on its own line under the
// headword, in the reading column, where the eye exits the (collapsed)
// read — discoverable by POSITION while staying serif-quiet and Boksidan-
// native, instead of hiding in the right-hand utility strip next to
// "LÄS MER +".
//
// Two interaction details:
//   - It lives in <summary>, so a tap would normally toggle the <details>.
//     stopPropagation keeps the tap a pure navigation (the bake-off
//     critic's must-fix #1). TanStack's <Link> also preventDefaults the
//     full-page nav, so the click never reaches the toggle default.
//   - When the card is OPEN it is hidden (see `details[open]` rule in
//     index.css) so the expanded body's own end-of-read öva takes over —
//     practice is surfaced once, in the right place for each state.

import { Link } from '@tanstack/react-router'

import type { Section } from '@/data/questions'

export function PracticeLink({
  section,
  frameworkId,
  label,
}: {
  section: Section
  frameworkId: string
  label: string
}) {
  return (
    <Link
      to="/drill"
      search={{ section, framework: frameworkId }}
      onClick={(e) => e.stopPropagation()}
      className="hpc-lesson-practice"
      data-testid="lesson-practice-link"
      style={{
        alignSelf: 'flex-start',
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        lineHeight: 1.4,
        color: 'var(--accent)',
        textDecoration: 'none',
        borderBottom: '1px solid var(--accent)',
        paddingBottom: 2,
      }}
    >
      {label} →
    </Link>
  )
}
