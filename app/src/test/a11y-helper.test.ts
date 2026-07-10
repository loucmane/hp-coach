// Self-test for the runAxe() helper — confirms axe-core actually runs
// under jsdom and reports the violations we expect it to. Not itself a
// product regression test; a11y regression tests colocated with the
// components (DrillQuestion.test.tsx, DrillResult.test.tsx, etc.) are.
import { describe, expect, it } from 'vitest'
import { formatViolations, runAxe } from './a11y'

describe('runAxe helper', () => {
  it('reports no violations on a clean labelled button', async () => {
    document.body.innerHTML = '<button aria-label="Stäng">×</button>'
    const violations = await runAxe()
    expect(violations, formatViolations(violations)).toEqual([])
  })

  it('flags a real violation (icon-only button with no accessible name)', async () => {
    // An <svg> icon has no text content and no label of its own, so the
    // button's accessible name is empty — the exact "icon-only button
    // missing aria-label" class this a11y pass targeted in the app.
    document.body.innerHTML =
      '<button><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg></button>'
    const violations = await runAxe()
    expect(violations.some((v) => v.id === 'button-name')).toBe(true)
  })
})
