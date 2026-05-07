import { expect, test } from '@playwright/test'

// Smoke E2E: the production build serves Daily Home with the iconic
// Fortsätt CTA reachable by keyboard, and the BottomTabs are present.
test('Daily Home renders with iconic CTA and tabs', async ({ page }) => {
  await page.goto('/')

  // Hero CTA — iconic single Fortsätt button.
  const cta = page.getByRole('button', { name: 'Fortsätt' })
  await expect(cta).toBeVisible()

  // Coach voice attribution byline.
  await expect(page.getByText(/— COACH · TAKTIKER/i)).toBeVisible()

  // Bottom tabs anchor the artboard.
  await expect(page.getByRole('button', { name: 'Hem' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Övning' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Coach' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Framsteg' })).toBeVisible()

  // Keyboard reach — focus-visible ring matters.
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
  // Avancerat is a leaf flow — no bottom tabs there. Use `exact` so the
  // "Tillbaka till hem" button on the stub doesn't false-positive.
  await expect(page.getByRole('button', { name: 'Hem', exact: true })).toHaveCount(0)
})

test('Bottom tabs route between sections', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Framsteg', exact: true }).click()
  await expect(page).toHaveURL(/\/progress$/)
  await page.getByRole('button', { name: 'Hem', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('/dev exposes coach voice and theme switchers', async ({ page }) => {
  await page.goto('/dev')
  await expect(page.getByRole('button', { name: 'Kompis' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mörk' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kompakt' })).toBeVisible()
})
