import type { ReactElement, ReactNode } from 'react'

/**
 * Boksidan (M3) margin-rail section: a cobalt mono rail label, a vertical
 * hairline spine, and the content column — the editorial chassis the live
 * drill is composed from.
 *
 *   ┌──────────── grid: rail | spine | content ────────────┐
 *   │  FRÅGAN  │  │  <h1 headword / prompt / options …>     │
 *   └──────────┴──┴────────────────────────────────────────┘
 *
 * The rail label is STRUCTURE, so it is rendered in cobalt `--accent` mono
 * (see docs/design-system-conventions.md). All visuals are token-bound and
 * defined under `.hpc-m3-*` in src/index.css.
 *
 * `delay` staggers the entrance (rule draws, rail slides in from the left,
 * content rises) so a section reads top-to-bottom; pass increasing values
 * down a stack of sections.
 */
export function DrillRailSection({
  meta,
  delay = 0,
  className,
  testid,
  children,
}: {
  /** Rail label content (string, or markup for a label + secondary line). */
  meta: ReactNode
  /** Entrance stagger in ms. */
  delay?: number
  /** Extra class on the content column. */
  className?: string
  /** data-testid forwarded to the section root for e2e selectors. */
  testid?: string
  children: ReactNode
}): ReactElement {
  const d = { animationDelay: `${delay}ms` }
  return (
    <section className="hpc-m3-section" data-testid={testid}>
      <hr className="hpc-m3-rule" style={d} />
      <div className="hpc-m3-row">
        <div className="hpc-m3-meta" style={d}>
          {meta}
        </div>
        <div className="hpc-m3-spine" />
        <div
          className={className ? `hpc-m3-content ${className}` : 'hpc-m3-content'}
          style={{ animationDelay: `${delay + 60}ms` }}
        >
          {children}
        </div>
      </div>
    </section>
  )
}
