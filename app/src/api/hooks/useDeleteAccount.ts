// DELETE /api/account — permanent, irreversible account deletion.
//
// The worker deletes the Clerk identity FIRST, then cascades every local
// D1 row (see worker/src/routes/account.ts). This hook is a thin typed
// wrapper over that endpoint; the caller (/konto) owns the typed-"radera"
// confirmation gate and the Clerk sign-out that follows a success.

import { useMutation } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

export type DeleteAccountResult = {
  ok: true
  deleted: boolean
}

/** Trigger account deletion. On-demand (a button press), so a plain
 *  mutation — no caching, no auto-refetch. The caller MUST have gated
 *  this behind an explicit user confirmation before calling mutate(). */
export function useDeleteAccount() {
  const api = useApiClient()
  return useMutation({
    mutationFn: async (): Promise<DeleteAccountResult> => {
      const res = await api.api.account.$delete()
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message =
          body && typeof body === 'object' && 'error' in body
            ? // biome-ignore lint/suspicious/noExplicitAny: narrow error-shape unwrap from an unknown JSON body
              ((body as any).error?.message ?? `DELETE /api/account failed: ${res.status}`)
            : `DELETE /api/account failed: ${res.status}`
        throw new Error(message)
      }
      return (await res.json()) as DeleteAccountResult
    },
  })
}
