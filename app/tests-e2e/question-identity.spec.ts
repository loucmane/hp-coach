// E2E: stable question identity in the drill DOM (hpf-ay8).
//
// The regression this pins: before `data-qid`, specs resolved the correct
// answer by matching the RENDERED prompt text against `window.__HPC_BANK__`.
// For a promptless ELF cloze that misses 100% of the time — the DOM shows
// the synthesized `Lucka N` headword while the bank row's prompt is `""`.
// The failure looked like flakiness only because which question the daily
// plan serves is not pinned, so the broken class was sampled at random.
//
// Determinism here comes from the RESOLVER and from `/drill?qid=` direct
// link, never from reshaping plan selection: `host-2013-verb2-ELF-031` is a
// real corpus item (number 31, answer B, prompt "", 4 options,
// parsing_status complete), so the promptless class is under test every run.
//
// Shape follows motion-settle.spec.ts — the same `?qid=` deep link and the
// same `__HPC_BANK__`-ready guard, and that spec carries no env gate, so the
// recipe is known to run in CI. (figure-zoom.spec.ts is the same shape but is
// opt-in behind FIGDIAG=1 — a shape reference, never evidence of green.)

import { clearMistakes, expect, test } from './fixtures'

// Verified in the shipped dataset (app/public/data/host-2013.json):
// prompt "", answer B, 4 options, parsing_status complete.
const CLOZE_QID = 'host-2013-verb2-ELF-031'

test('drill exposes a stable question identity — a promptless cloze resolves by qid', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'identity anchor is the shared drill chassis')

  // Wipes sessions + mistakes. Direct-link mode engages only when there is
  // no active session for this section (drill.tsx:270-272), and this spec
  // deliberately stops at the genomgång without completing the pass — so
  // without the reset a retry would be served by the adopted session
  // instead of the deep link.
  await clearMistakes(page)

  await page.goto(`/drill?section=ELF&qid=${encodeURIComponent(CLOZE_QID)}`)
  await page.waitForFunction(
    () => {
      const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
      return Array.isArray(bank) && bank.length > 0
    },
    null,
    { timeout: 20_000 },
  )
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 30_000 })

  // The class under test really is the promptless one: the stem the page
  // prints is synthesized, and it is NOT what the bank stores.
  await expect(page.getByTestId('drill-prompt')).toHaveText('Lucka 31')

  // Identity BEFORE answering: a mis-serve (direct link suppressed by an
  // active session) must fail loudly here rather than pass on some other
  // question. The incomplete-question early return carries identity too,
  // but without options — unreachable for this item, which is complete.
  const drillQuestion = page.getByTestId('drill-question')
  await expect(drillQuestion).toHaveAttribute('data-qid', CLOZE_QID)

  // Resolve by identity, never by display text.
  const qid = await drillQuestion.getAttribute('data-qid')
  const correctLetter = await page.evaluate((id) => {
    const bank = (window as unknown as { __HPC_BANK__: { qid: string; answer: string }[] })
      .__HPC_BANK__
    return bank.find((q) => q.qid === id)?.answer ?? null
  }, qid)
  expect(correctLetter, `could not resolve answer for qid "${qid}"`).not.toBeNull()

  await page.getByTestId(`option-${correctLetter}`).click()
  await expect(page.getByTestId('pedagogy-panel')).toBeVisible({ timeout: 10_000 })
})
