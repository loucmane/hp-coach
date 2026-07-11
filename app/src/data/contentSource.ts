// Content source router for the strict-tier corpus (question bank +
// Layer 2 explanations).
//
// Two modes, chosen at build time by `VITE_CONTENT_FROM_API`:
//
//   • OFF (default — dev, vitest, Playwright e2e): fetch the files as
//     local static assets from `/data/*` and `/explanations/*`, exactly
//     as the app always has. Zero new setup; the vitest fetch shim and
//     the Vite dev server keep serving public/ untouched.
//
//   • ON (staging / production): the files are excluded from the Pages
//     bundle (see vite.config.ts) and served instead by the worker's
//     auth-gated `/api/content/:file` route out of R2. Every fetch
//     carries the current Clerk session JWT.
//
// Only `data/` and `explanations/` route through here. Figures,
// frameworks, and normering stay public static assets fetched directly.
//
// `loadBank`/`loadExamExplanations` call `contentFetch(rel)` with a
// leading-slash-free relative path (`data/_index.json`,
// `explanations/host-2025.json`) so the local URL is byte-identical to
// the historical `fetch('/data/...')`.

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

/** True when the build targets the authenticated R2 content API. */
export const contentFromApi = import.meta.env.VITE_CONTENT_FROM_API === 'true'

type TokenGetter = () => Promise<string | null>

// The token getter is registered by <ContentAuthBridge> once Clerk is
// ready (see main.tsx). It's held behind a Promise so a content fetch
// kicked off before Clerk finishes waits for auth rather than firing a
// tokenless (→ 401) request. In local mode the getter is never awaited.
let resolveTokenGetter!: (g: TokenGetter) => void
let tokenGetterPromise: Promise<TokenGetter> = new Promise<TokenGetter>((r) => {
  resolveTokenGetter = r
})

/** Register the Clerk token getter. Idempotent-friendly: the latest
 *  call wins for any fetch that hasn't yet awaited the token. */
export function registerContentAuth(getToken: TokenGetter): void {
  resolveTokenGetter(getToken)
}

/** Test-only: reset the pending token-getter Promise between specs. */
export function __resetContentAuth(): void {
  tokenGetterPromise = new Promise<TokenGetter>((r) => {
    resolveTokenGetter = r
  })
}

/**
 * Fetch a strict-tier content file by its relative key
 * (`data/var-2024.json`, `explanations/host-2025.json`).
 *
 * Local mode → `fetch('/' + rel)` (unchanged historical behavior).
 * API mode  → awaits the Clerk token, then hits the authed worker route.
 * The caller handles response status exactly as before; this only swaps
 * the transport.
 */
export async function contentFetch(rel: string): Promise<Response> {
  if (!contentFromApi) return fetch(`/${rel}`)
  const getToken = await tokenGetterPromise
  const token = await getToken()
  return fetch(`${API_BASE}/api/content/${rel}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
