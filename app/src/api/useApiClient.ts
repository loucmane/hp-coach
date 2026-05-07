// Memoised typed API client bound to the current Clerk session.
//
// `getToken` from @clerk/clerk-react returns the active session JWT (or
// null when signed out). Each call to the client triggers `getToken`
// fresh, so token rotation is transparent — components never have to
// think about expiry.

import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'

import { type ApiClient, makeApiClient } from './client'

export function useApiClient(): ApiClient {
  const { getToken } = useAuth()
  return useMemo(() => makeApiClient(() => getToken()), [getToken])
}
