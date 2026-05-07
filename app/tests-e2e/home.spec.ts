import { expect, test } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────
// Auth gate landed in arch-cloud-db: every authenticated route now goes
// through Clerk's <SignedIn> / <SignedOut> wrapper. The tests below were
// written before auth and assume direct access to /, /dev, etc. They
// stay here as the contract we want to keep — they'll be re-enabled
// once Clerk testing tokens are wired up via @clerk/testing (Playwright
// fixture that injects a signed-in test user via session token; tracked
// as part of task 55 follow-up).
//
// One new test below verifies the unauthenticated redirect contract.
// ─────────────────────────────────────────────────────────────────────

test('unauthenticated visit to / redirects to /sign-in', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 10_000 })
  // Clerk's prebuilt SignIn UI shows the brand text.
  await expect(page.getByText(/sign in/i).first()).toBeVisible()
})

test.describe.skip('post-auth screens (re-enable with @clerk/testing fixture)', () => {
  test('Daily Home renders with iconic CTA and tabs', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('button', { name: 'Fortsätt' })
    await expect(cta).toBeVisible()
    await expect(page.getByText(/— COACH · TAKTIKER/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hem' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Övning' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Coach' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Framsteg' })).toBeVisible()
    await cta.focus()
    await expect(cta).toBeFocused()
  })

  test('Fortsätt routes to /drill', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Fortsätt' }).click()
    await expect(page).toHaveURL(/\/drill$/)
    await expect(page.getByText(/drill-skärmar landar här/i)).toBeVisible()
  })

  test('Avancerat link routes to /avancerat (and tabs are hidden there)', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Avancerat' }).click()
    await expect(page).toHaveURL(/\/avancerat$/)
    await expect(page.getByRole('button', { name: 'Hem', exact: true })).toHaveCount(0)
  })

  test('Bottom tabs route between sections', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Framsteg', exact: true }).click()
    await expect(page).toHaveURL(/\/progress$/)
    await page.getByRole('button', { name: 'Hem', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('/dev exposes coach + palette + font + density switchers', async ({ page }) => {
    await page.goto('/dev')
    await expect(page.getByRole('button', { name: /Kompis/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Palett: Sage' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Palett: Ink' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Palett: Rose' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mörk' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Hyperlegible/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Comfy', exact: true })).toBeVisible()
  })

  test('palette swatch click applies the new palette to <html>', async ({ page }) => {
    await page.goto('/dev')
    await page.getByRole('button', { name: 'Palett: Sage' }).click()
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    )
    expect(bg).toBe('oklch(0.965 0.012 175)')
    expect(await page.evaluate(() => document.documentElement.dataset.palette)).toBe('sage')
  })

  test('floating launcher links to /dev and Cmd+K toggles it', async ({ page }) => {
    await page.goto('/?dev=1')
    await page.getByRole('link', { name: /öppna design-tweaks/i }).click()
    await expect(page).toHaveURL(/\/dev$/)
    await page.keyboard.press('Control+K')
    await expect(page).toHaveURL(/\/(\?dev=1)?$/)
    await page.keyboard.press('Control+K')
    await expect(page).toHaveURL(/\/dev$/)
  })
})
