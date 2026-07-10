// Clerk dev-instance FAPI hardening for the e2e suite.
//
// Root cause (see task ci/clerk-fixture-hardening):
//   The failing tests are always the worker-API round-trip family
//   (prefs GET/PATCH, sessions, seeded-mistake replay). Their common
//   thread is that every one makes the app call `Clerk.session.getToken()`
//   — directly (fixtures' page.evaluate) or indirectly (the SPA's typed
//   API client calls getToken() before every request). getToken() hits
//   the shared Clerk dev Frontend API (https://<slug>.clerk.accounts.dev)
//   at /v1/client and /v1/environment. That dev instance intermittently
//   degrades (429 / 5xx / connection resets).
//
//   @clerk/testing already installs a context.route interceptor on the
//   FAPI with a 4-attempt retry (RETRYABLE_STATUS_CODES = 429/502/503/504,
//   BASE_DELAY 500ms, exp backoff). Two gaps let flake through:
//     1. Budget too small — 4 attempts over ~3.5s can't ride out a
//        multi-second degradation blip, and the classic failure log
//        "FAPI request failed after 4 attempts: .../v1/client ...
//        route.fetch: Test ended" shows a refresh firing LATE (often at
//        teardown), so the retry window gets guillotined when the browser
//        context closes.
//     2. No pre-flight — a test can start while the instance is already
//        unhealthy, so it fails on the very first token refresh.
//
// This module supplies both levers WITHOUT forking @clerk/testing:
//   - installFapiRetryRoute(): a Playwright route interceptor registered
//     AFTER setupClerkTestingToken(). Later-registered handlers run first
//     in Playwright, so ours supersedes @clerk/testing's built-in retry
//     for the FAPI path: same testing-token injection + captcha_bypass
//     override, but a larger, capped-backoff budget and a hardening
//     counter. It stays resilient even if the context is tearing down
//     (best-effort fulfill; swallow post-teardown errors).
//   - awaitClerkFapiHealthy(): a pre-flight poll used by the setup
//     project to gate sign-in on the instance actually answering, and to
//     fail LOUD ("infra, not code") when it doesn't.
//
// Diagnostics: the pre-existing HPC_E2E_COUNT_FAPI counter is preserved by
// fixtures/auth.setup; here we additionally track retry pressure and print
// it at process exit when HPC_E2E_COUNT_FAPI is set, so CI logs quantify
// how hard we had to lean on the retry to stay green.

import type { BrowserContext, Page, Route } from '@playwright/test'

// Clerk's testing helper matches these; we mirror them so our handler is a
// drop-in superset. @clerk/testing appends this query param carrying the
// bot-bypass token that clerkSetup() cached in CLERK_TESTING_TOKEN.
const TESTING_TOKEN_PARAM = '__clerk_testing_token'

// Retryable transient conditions. Same status set @clerk/testing retries,
// plus we retry ANY thrown route.fetch error (connection reset / timeout).
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

// Budget: 8 attempts (vs @clerk's 4) with capped exponential backoff, so a
// multi-second dev-instance blip is ridden out instead of failing the test.
// Cap keeps the total bounded (~ 0.4+0.8+1.6+2.4*5 ≈ 15s worst case) so a
// truly-dead instance still fails inside a 30s test timeout rather than
// hanging to the wire.
const MAX_ATTEMPTS = 8
const BASE_DELAY_MS = 400
const MAX_DELAY_MS = 2400
const JITTER_MAX_MS = 250

function backoffDelay(attempt: number): number {
  const raw = BASE_DELAY_MS * 2 ** attempt
  return Math.min(raw, MAX_DELAY_MS) + Math.random() * JITTER_MAX_MS
}

// ── Retry-pressure diagnostics ────────────────────────────────────────
// Only active under HPC_E2E_COUNT_FAPI (same flag as the request counter in
// fixtures.ts / auth.setup.ts). Zero cost on normal runs.
const diag = { retries: 0, transientResponses: 0, networkErrors: 0, giveUps: 0 }
let diagPrinterInstalled = false

function installDiagPrinterOnce(): void {
  if (diagPrinterInstalled || !process.env.HPC_E2E_COUNT_FAPI) return
  diagPrinterInstalled = true
  process.on('exit', () => {
    // eslint-disable-next-line no-console
    console.log(
      `[fapi-retry] retries=${diag.retries} transient=${diag.transientResponses} ` +
        `netErr=${diag.networkErrors} giveUps=${diag.giveUps}`,
    )
  })
}

const debug = (...args: unknown[]): void => {
  if (process.env.CLERK_TESTING_DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[fapi-hardening]', ...args)
  }
}

function fapiUrlRegExp(fapiUrl: string): RegExp {
  const escaped = fapiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^https://${escaped}/v1/.*?(\\?.*)?$`)
}

const routedContexts = new WeakSet<BrowserContext>()

// ── Test-only fault injection ─────────────────────────────────────────
// The degradation simulation (fapi-degradation.spec.ts) proves the retry
// loop actually rides out transient FAPI failures. Playwright's route.fetch
// goes straight to the wire and can't be mocked from underneath, so instead
// the retry loop consults this optional injector: when set, it can force the
// first K attempts to look like a 503 (or throw) BEFORE the real fetch runs,
// exercising the exact backoff/continue path. Null on every normal run —
// the production code path is byte-identical whether or not a test sets it.
export type FaultInjector = (attempt: number) => 'throw' | number | null
let faultInjector: FaultInjector | null = null

/** Test-only: install a fault injector consulted by the retry loop. */
export function __setFapiFaultInjector(fn: FaultInjector | null): void {
  faultInjector = fn
}

/**
 * Register a resilient FAPI route interceptor on the page's context.
 *
 * MUST be called AFTER setupClerkTestingToken() so ours runs first
 * (Playwright dispatches the most-recently-registered matching handler
 * first). We fully handle the request — inject the testing token, retry
 * transient failures with a larger budget than @clerk/testing, apply the
 * same captcha_bypass override, and fulfill — so @clerk/testing's handler
 * never has to run for the FAPI path.
 *
 * Idempotent per context. No-op if CLERK_FAPI isn't set yet (clerkSetup
 * hasn't run) — the caller's setupClerkTestingToken would already have
 * thrown in that case, so this is just defensive.
 */
export async function installFapiRetryRoute(page: Page): Promise<void> {
  const context = page.context()
  const fapiUrl = process.env.CLERK_FAPI
  if (!fapiUrl) {
    debug('CLERK_FAPI unset — skipping retry route install')
    return
  }
  if (routedContexts.has(context)) return
  routedContexts.add(context)
  installDiagPrinterOnce()

  const pattern = fapiUrlRegExp(fapiUrl)

  await context.route(pattern, async (route: Route) => {
    const original = new URL(route.request().url())
    const testingToken = process.env.CLERK_TESTING_TOKEN
    if (testingToken) original.searchParams.set(TESTING_TOKEN_PARAM, testingToken)
    const urlString = original.toString()

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const last = attempt === MAX_ATTEMPTS - 1
      try {
        // Test-only: let a fault injector fake this attempt's outcome BEFORE
        // any real network call. 'throw' → treated like a network error;
        // a retryable status number → short-circuit into the retry/backoff
        // path (no fetch); null / non-retryable number → proceed to the real
        // fetch. Null on every normal run.
        const fault = faultInjector?.(attempt) ?? null
        if (fault === 'throw') {
          throw new Error('[fault-injector] simulated FAPI network error')
        }
        if (typeof fault === 'number' && RETRYABLE_STATUS_CODES.has(fault) && !last) {
          if (process.env.HPC_E2E_COUNT_FAPI) {
            diag.retries++
            diag.transientResponses++
          }
          const delay = backoffDelay(attempt)
          debug(`FAPI ${fault} (injected), retry ${attempt + 1}/${MAX_ATTEMPTS} in ${Math.round(delay)}ms`)
          await new Promise((r) => setTimeout(r, delay))
          continue
        }

        const response = await route.fetch({ url: urlString })
        const status = response.status()

        if (RETRYABLE_STATUS_CODES.has(status) && !last) {
          if (process.env.HPC_E2E_COUNT_FAPI) {
            diag.retries++
            diag.transientResponses++
          }
          const delay = backoffDelay(attempt)
          debug(`FAPI ${status}, retry ${attempt + 1}/${MAX_ATTEMPTS} in ${Math.round(delay)}ms`, urlString)
          await new Promise((r) => setTimeout(r, delay))
          continue
        }

        // Terminal (success, non-retryable, or budget exhausted): mirror
        // @clerk/testing's captcha_bypass override so bot-protection stays
        // bypassed, then fulfill. Only /v1/client & /v1/environment carry
        // these fields; JSON parse is guarded for everything else.
        if (RETRYABLE_STATUS_CODES.has(status) && last && process.env.HPC_E2E_COUNT_FAPI) {
          diag.giveUps++
        }
        let json: unknown
        try {
          json = await response.json()
        } catch {
          await route.fulfill({ response }).catch(swallowTeardown)
          return
        }
        const j = json as {
          response?: { captcha_bypass?: boolean }
          client?: { captcha_bypass?: boolean }
        }
        if (j?.response?.captcha_bypass === false) j.response.captcha_bypass = true
        if (j?.client?.captcha_bypass === false) j.client.captcha_bypass = true
        await route.fulfill({ response, json: j }).catch(swallowTeardown)
        return
      } catch (error) {
        // route.fetch threw: network reset / timeout / "Test ended" during
        // teardown. Retry within budget; on exhaustion fall back to a plain
        // continue so the browser at least gets a real response if the
        // context is still alive.
        if (!last) {
          if (process.env.HPC_E2E_COUNT_FAPI) {
            diag.retries++
            diag.networkErrors++
          }
          const delay = backoffDelay(attempt)
          debug(`FAPI error, retry ${attempt + 1}/${MAX_ATTEMPTS} in ${Math.round(delay)}ms`, error)
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
        if (process.env.HPC_E2E_COUNT_FAPI) diag.giveUps++
        debug('FAPI gave up after budget', error)
        await route.continue({ url: urlString }).catch(swallowTeardown)
        return
      }
    }
  })
}

// After a test ends Playwright tears the context down; an in-flight route
// fulfill/continue then rejects with "Target page/context/browser has been
// closed" or "Test ended". That's expected and harmless — the assertion
// phase is already over — so we swallow exactly those.
function swallowTeardown(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err)
  if (/closed|Test ended|Target page|context or browser/i.test(msg)) return
  // eslint-disable-next-line no-console
  console.warn('[fapi-hardening] unexpected route error:', msg)
}

// ── Pre-flight health gate ────────────────────────────────────────────

export type FapiHealthResult = {
  healthy: boolean
  consecutive: number
  elapsedMs: number
  lastStatus: number | null
  lastError: string | null
}

/**
 * Poll the Clerk dev FAPI until it answers healthily N times in a row, or a
 * generous budget elapses. Uses the browser's own fetch (via page.evaluate)
 * so it exercises the exact network path the app will use, and rides the
 * retry route above.
 *
 * "Healthy" = GET {fapi}/v1/environment returns a non-5xx, non-429 status.
 * /v1/environment is unauthenticated and always present on a Clerk instance,
 * so any 2xx/4xx (other than 429) means the instance is answering.
 *
 * Returns the result; the caller decides whether to throw. On timeout the
 * result.healthy is false and the caller should fail LOUD.
 */
export async function awaitClerkFapiHealthy(
  page: Page,
  opts: { budgetMs?: number; needConsecutive?: number; intervalMs?: number } = {},
): Promise<FapiHealthResult> {
  const budgetMs = opts.budgetMs ?? 90_000
  const needConsecutive = opts.needConsecutive ?? 3
  const intervalMs = opts.intervalMs ?? 1_000
  const fapiUrl = process.env.CLERK_FAPI
  if (!fapiUrl) {
    return { healthy: false, consecutive: 0, elapsedMs: 0, lastStatus: null, lastError: 'CLERK_FAPI unset' }
  }
  const probeUrl = `https://${fapiUrl}/v1/environment`
  const start = Date.now()
  let consecutive = 0
  let lastStatus: number | null = null
  let lastError: string | null = null

  // We need a real browser context to fetch from (so the retry route +
  // CORS behave as in-app). Navigate to about:blank first if needed — some
  // callers pass a page that hasn't navigated yet.
  while (Date.now() - start < budgetMs) {
    const probe = await page
      .evaluate(async (url) => {
        try {
          const res = await fetch(url, { method: 'GET' })
          return { status: res.status as number, error: null as string | null }
        } catch (e) {
          return { status: 0, error: e instanceof Error ? e.message : String(e) }
        }
      }, probeUrl)
      .catch((e: unknown) => ({ status: 0, error: e instanceof Error ? e.message : String(e) }))

    lastStatus = probe.status
    lastError = probe.error
    const ok = probe.status > 0 && probe.status !== 429 && probe.status < 500
    if (ok) {
      consecutive++
      if (consecutive >= needConsecutive) {
        return { healthy: true, consecutive, elapsedMs: Date.now() - start, lastStatus, lastError: null }
      }
    } else {
      consecutive = 0
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }

  return { healthy: false, consecutive, elapsedMs: Date.now() - start, lastStatus, lastError }
}
