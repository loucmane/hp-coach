import { useAuth } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useLayoutEffect, useState } from 'react'

import { endedSessionIdsThisTab } from '@/lib/endedSessions'

import { createQueryClient } from './queryClient'

/** Own the shared query cache for the lifetime of Clerk's current identity. */
export function AuthQueryProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [cache, setCache] = useState(() => ({ userId, client: createQueryClient() }))
  const needsSwap = cache.userId !== undefined && cache.userId !== userId

  useLayoutEffect(() => {
    if (cache.userId === userId) return
    // undefined is Clerk's initial loading state, not a previous identity.
    // Keep the initial cache; reset for sign-out and subsequent account changes.
    let client = cache.client
    if (needsSwap) {
      // clear() destroys queries and cancels their retryers, so even a transport
      // that ignores AbortSignal cannot put the previous user's response back.
      client.clear()
      endedSessionIdsThisTab.clear()
      // Mutations cannot be cancelled: late onSuccess callbacks may still
      // write to their captured client. Keep that client out of the new tree.
      client = createQueryClient()
    }
    setCache({ userId, client })
  }, [cache, needsSwap, userId])

  // Clearing in an effect alone lets children render once with the old cache.
  // Withhold children only during a client swap; initial Clerk resolution must
  // preserve the mounted tree and its local state along with the initial cache.
  if (needsSwap) return null
  return <QueryClientProvider client={cache.client}>{children}</QueryClientProvider>
}
