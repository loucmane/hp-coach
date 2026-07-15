// Frame-capture the loading-arrival bake-off chips (L1/L2/L3) at both
// speeds. Reuses the saved Clerk storageState (memory: authed Playwright
// recipe). Run from app/: node scripts-dev/capture-loading.mjs
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const OUT = 'screenshots-loading'
fs.mkdirSync(OUT, { recursive: true })

const CHIPS = [
  { label: 'L1 · Bläckfläcken', slug: 'l1', testid: 'load1' },
  { label: 'L2 · Skriften', slug: 'l2', testid: 'load2' },
  { label: 'L3 · Vita arket', slug: 'l3', testid: 'load3' },
]

// Offsets (ms) measured from the "Ladda om" click. Latency 300 / 2500.
const PLANS = {
  snabb: { latency: 300, offsets: [150, 380, 480, 600, 800, 1400] },
  langsam: { latency: 2500, offsets: [1200, 2560, 2680, 2800, 2950, 3600] },
}

const browser = await chromium.launch()
const ctx = await browser.newContext({
  storageState: 'tests-e2e/.auth/user.json',
  viewport: { width: 1280, height: 960 },
})
const page = await ctx.newPage()
await page.addInitScript(() => localStorage.setItem('hpc-welcomed', '1'))
await page.goto('http://localhost:5193/dev/motion-bakeoff?dev=1')
await page.getByRole('button', { name: 'L1 · Bläckfläcken' }).waitFor({ timeout: 20000 })

for (const chip of CHIPS) {
  await page.getByRole('button', { name: chip.label }).click()
  await page.getByTestId(`${chip.testid}-stage`).waitFor()
  for (const [speed, plan] of Object.entries(PLANS)) {
    await page.getByTestId(`${chip.testid}-speed-${speed}`).click()
    // Let the speed-change run settle fully before the measured replay.
    await page.waitForTimeout(plan.latency + 900)
    const t0 = Date.now()
    await page.getByTestId(`${chip.testid}-reload`).click()
    for (const off of plan.offsets) {
      const wait = t0 + off - Date.now()
      if (wait > 0) await page.waitForTimeout(wait)
      const actual = Date.now() - t0
      await page.screenshot({
        path: `${OUT}/${chip.slug}-${speed}-${String(off).padStart(4, '0')}ms.png`,
        clip: { x: 180, y: 90, width: 940, height: 820 },
      })
      console.log(`${chip.slug} ${speed} planned=${off} actual=${actual}`)
    }
  }
}

// Perf probe for L1's blur-sharpen: sample rAF deltas across the whole
// arrival window and report avg/max/dropped (>24 ms) frames.
await page.getByRole('button', { name: 'L1 · Bläckfläcken' }).click()
await page.getByTestId('load1-speed-snabb').click()
await page.waitForTimeout(1500)
const probe = page.evaluate(
  () =>
    new Promise((resolve) => {
      const deltas = []
      let last = performance.now()
      const start = last
      function tick(now) {
        deltas.push(now - last)
        last = now
        if (now - start < 1400) requestAnimationFrame(tick)
        else {
          const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
          resolve({
            frames: deltas.length,
            avg: Math.round(avg * 100) / 100,
            max: Math.round(Math.max(...deltas) * 100) / 100,
            dropped: deltas.filter((d) => d > 24).length,
          })
        }
      }
      requestAnimationFrame(tick)
    }),
)
await page.getByTestId('load1-reload').click()
console.log('L1 sharpen perf:', JSON.stringify(await probe))

await browser.close()
console.log('done')
