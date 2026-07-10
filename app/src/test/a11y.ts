// Vitest a11y helper — runs axe-core's WCAG 2.x AA ruleset against an
// already-rendered jsdom subtree.
//
// Why not the live-browser audit: the accessibility pass's real evidence
// is a Playwright + @axe-core/playwright run against real browsers (see
// the a11y-audit-{before,after}.json artifacts at the repo root, and the
// task's audit driver script). This helper is the CHEAP regression net
// that runs on every `pnpm test` — it catches accidental re-introductions
// of missing aria-labels, broken landmark nesting, or unlabelled form
// controls in the small set of components wired up below, without
// needing a browser.
//
// jsdom limitation: it does not implement CSS layout or paint, so
// `color-contrast` cannot be computed (axe would either report nothing
// useful or throw) — that rule is disabled here. Real contrast
// verification lives in the Playwright audit, not this layer.
// axe-core ships as a UMD bundle whose default export is the `axe` object
// (with `.run()`); its named exports are internal polyfill plumbing, not
// the API — always import the default.
import axeCore from 'axe-core'

const DISABLED_RULES_JSDOM = [
  // Needs real layout/paint — jsdom has neither.
  'color-contrast',
  // Needs real viewport/zoom geometry.
  'meta-viewport',
  'target-size',
]

/**
 * Runs axe-core against `container` (defaults to `document.body`) with the
 * WCAG 2.0/2.1 AA ruleset, `color-contrast` (and other layout-dependent
 * rules) disabled for jsdom. Returns the raw violations array — assert
 * `violations` is empty, or inspect `.id`/`.nodes` on failure for a
 * readable diff.
 */
export async function runAxe(container: Element = document.body) {
  const results = await axeCore.run(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
    },
    rules: Object.fromEntries(DISABLED_RULES_JSDOM.map((id) => [id, { enabled: false }])),
  })
  return results.violations
}

/** Formats violations into a readable multi-line string for test failure output. */
export function formatViolations(violations: Awaited<ReturnType<typeof runAxe>>): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - ${n.target.join(' ')}: ${n.failureSummary}`)
        .join('\n')
      return `[${v.impact}] ${v.id}: ${v.help}\n${nodes}`
    })
    .join('\n\n')
}
