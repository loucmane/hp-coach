// E2E suite for the SPA + auth gate.
//
// Two import sources matter:
//   - `@playwright/test`  → vanilla page, used for the unauth-redirect test
//   - `./fixtures`        → page is already signed in via Clerk's testing
//                           helpers; used for everything that needs HomeMobile
//
// The signed-in fixture relies on globalSetup running clerkSetup() once at
// the top of the run (see tests-e2e/global-setup.ts).
//
// B3.2 — selectors updated for the prescriptive daily-plan composition:
//   - "Fortsätt" CTA is gone. The Home hero is now the daily-plan card,
//     and plan items are individual deep-links (no single Fortsätt button).
//   - "Avancerat" trailing link is gone. The escape hatches are the
//     floating tab bar and Cmd+K palette.
//   - The compact "God morgon." greeting + the `daily-plan-card`/
//     `daily-plan-skeleton` testid are the load indicators.

import { expect, test } from '@playwright/test'
import { clearMistakes, expect as authedExpect, seedMockResults, test as authedTest } from './fixtures'

// ── Unauthenticated ────────────────────────────────────────────────────
// The chromium/mobile projects apply the signed-in storageState by default
// (auth.setup.ts). The unauth test needs the opposite. `test.use` is
// scope-wide, so it MUST live inside its own describe block — at file level
// it would deauthenticate every other test here too.
test.describe('unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('visit to / shows the public landing (no redirect)', async ({ page }) => {
    // Since the public landing shipped, `/` no longer redirects a
    // signed-out visitor to /sign-in — it IS the public front door.
    // Full landing coverage lives in landing.spec.ts.
    await page.goto('/')
    await expect(page.getByTestId('public-landing')).toBeVisible({ timeout: 10_000 })
    await expect(page).not.toHaveURL(/sign-in/)
  })
})

// ── Signed-in ──────────────────────────────────────────────────────────
authedTest('Daily Home renders the prescriptive plan card', async ({ page }) => {
  // Reset mistakes/sessions AND seed one fresh mock result per half
  // BEFORE the scheduler reads its signals, so this test always sees the
  // same deterministic scheduler outcome instead of whatever state a
  // prior test/run left behind:
  //   - clearMistakes: an all-mistakes-resolved (or leftover-session)
  //     user can land on "Klart för idag" (DailyPlanCard's `allComplete`
  //     branch renders `daily-plan-complete`, not `daily-plan-card`).
  //   - seedMockResults: a never-mocked (or mock-stale) user gets a
  //     mock-only day, on which DailyPlanCard intentionally renders null
  //     (see its own comment) — neither daily-plan-card nor
  //     daily-plan-skeleton ever appears. See testReset.ts's
  //     'seed-mocks' action for the full story.
  await clearMistakes(page)
  await seedMockResults(page)
  await page.goto('/')

  // The greeting is rendered immediately; the plan card resolves after
  // stats + due + framework hints settle. Both are valid load indicators.
  await authedExpect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })
  // The resolved card is the only state seeding above should allow, but
  // tolerate the loading skeleton, the all-complete panel, and (belt-
  // and-suspenders) the Kallelse too — any of the four proves the route
  // hydrated with a deterministic, non-empty scheduler outcome, and only
  // asserting the exact happy path would make this test as brittle as
  // the bug it's fixing.
  const card = page.getByTestId('daily-plan-card')
  const skeleton = page.getByTestId('daily-plan-skeleton')
  const complete = page.getByTestId('daily-plan-complete')
  const kallelse = page.getByTestId('kallelse-start')
  await authedExpect(card.or(skeleton).or(complete).or(kallelse)).toBeVisible({ timeout: 10_000 })
})

authedTest(
  'Bottom tabs visible on phone — the five doors (Hem/Öva/Provpass/Uppslag/Framsteg)',
  async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'BottomTabs render only at phone viewport (EDITION dropped them on desktop)',
    )
    // The owner-locked five doors, same set + order as the desktop rail.
    for (const label of ['Hem', 'Öva', 'Provpass', 'Uppslag', 'Framsteg']) {
      await authedExpect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
    }
    // Feedback left the bar for /mer · Verktyg.
    await authedExpect(page.getByRole('button', { name: 'Feedback' })).toHaveCount(0)
  },
)

authedTest('Bottom tabs route between sections', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile',
    'BottomTabs render only at phone viewport (EDITION dropped them on desktop)',
  )
  // BottomTabs share aria-current="page" with the active tab and there
  // are multiple Hem renders during a route transition (the active tab
  // briefly overlaps the new route's chrome). Filter the locator down
  // to the tab that's NOT currently the page so the click always
  // targets the intended bar.
  await page
    .getByRole('button', { name: 'Framsteg', exact: true })
    .filter({ hasNot: page.locator('[aria-current="page"]') })
    .click({ force: true })
  await authedExpect(page).toHaveURL(/\/progress$/)
  await page
    .getByRole('button', { name: 'Hem', exact: true })
    .filter({ hasNot: page.locator('[aria-current="page"]') })
    .click({ force: true })
  await authedExpect(page).toHaveURL(/\/$/)
})

authedTest('/dev exposes coach + palette + font + density switchers', async ({ page }) => {
  await page.goto('/dev')
  await authedExpect(page.getByRole('button', { name: /Kompis/ })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Palett: Sage' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Palett: Ink' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Palett: Rose' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Mörk' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: /Hyperlegible/ })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Comfy', exact: true })).toBeVisible()
})

authedTest('palette swatch click applies the new palette to <html>', async ({ page }) => {
  await page.goto('/dev')
  await page.getByRole('button', { name: 'Palett: Sage' }).click()
  // The palette switch fires a PATCH /api/me/prefs and only then runs
  // applyThemeToDocument(). In CI the round-trip can take several
  // hundred ms, so we wait for the data-palette attribute to flip
  // before reading --bg (otherwise we sometimes read the previous
  // palette's value).
  await authedExpect(page.locator('html[data-palette="sage"]')).toHaveCount(1, { timeout: 10_000 })
  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
  )
  authedExpect(bg).toBe('oklch(0.965 0.012 175)')
})

authedTest('dev affordances live in the palette — no floating pills', async ({ page }) => {
  await page.goto('/?dev=1')
  // The floating pills are retired (owner call 2026-07-12): nothing
  // fixed to the viewport corner anymore.
  await authedExpect(page.getByRole('link', { name: /öppna design-tweaks/i })).toHaveCount(0)
  await authedExpect(page.getByTestId('share-debug-button')).toHaveCount(0)
  // Their actions live in the palette: Dev panel navigates to /dev.
  await page.keyboard.press('Control+K')
  await authedExpect(page.getByTestId('cmdk')).toBeVisible({ timeout: 3_000 })
  await page.getByPlaceholder(/sök/i).fill('dev panel')
  await page.getByText('Dev panel', { exact: true }).click()
  await authedExpect(page).toHaveURL(/\/dev$/)
  // Cmd+K toggles the overlay closed again.
  await page.keyboard.press('Control+K')
  await authedExpect(page.getByTestId('cmdk')).toBeVisible({ timeout: 3_000 })
  await page.keyboard.press('Control+K')
  await authedExpect(page.getByTestId('cmdk')).toBeHidden({ timeout: 3_000 })
})

authedTest('mast "mer" opens the settings hub with tools + synced pickers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the mast renders at desktop only')
  await page.goto('/')
  await authedExpect(page.getByTestId('mast-mer')).toBeVisible({ timeout: 10_000 })
  await page.getByTestId('mast-mer').click()
  await authedExpect(page).toHaveURL(/\/mer$/)
  // Verktyg rows — the previously ⌘K-only desktop destinations.
  await authedExpect(page.getByTestId('mer-tool-diagnostik')).toBeVisible()
  await authedExpect(page.getByTestId('mer-tool-avancerat')).toBeVisible()
  await authedExpect(page.getByTestId('mer-tool-coach')).toBeVisible()
  // Settings words present (palette + mode + coach).
  await authedExpect(page.getByRole('button', { name: 'Palett: sage (aktiv)' })).toBeVisible()
  // Scoped to the page body — the mast's quick toggle shares the label.
  await authedExpect(
    page.getByTestId('page-content').getByRole('button', { name: 'Växla till mörkt läge' }),
  ).toBeVisible()
  await authedExpect(page.getByRole('button', { name: /Kompis —/ })).toBeVisible()
})
