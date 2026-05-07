// Typed Hono client for the HP-Coach API.
//
// The client is generated from the worker's exported AppType via hc<AppType>(),
// so request/response shapes are end-to-end typed. A path change in the
// worker breaks the client at typecheck time — no spec drift possible.
//
// The cross-package type import (`../../../worker/src/index`) is type-only.
// Nothing from the worker bundle ends up in the SPA at runtime; tsc just
// reads the AppType signature.

import { hc } from 'hono/client'

import type { AppType } from '../../../worker/src/index'

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

export type ApiClient = ReturnType<typeof hc<AppType>>

/**
 * Build a typed client wired to the current Clerk session. Pass a
 * getToken function (typically `useAuth().getToken` from Clerk) so the
 * client always sends the freshest JWT — Clerk rotates session tokens
 * frequently and we want every request authenticated.
 */
export function makeApiClient(getToken: () => Promise<string | null>): ApiClient {
  return hc<AppType>(BASE_URL, {
    headers: async (): Promise<Record<string, string>> => {
      const token = await getToken()
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
  })
}
