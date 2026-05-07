// Singleton QueryClient for the SPA.
//
// Defaults tuned for HP-Coach's profile:
//   - 5 min staleTime: most reads are progress / mastery state that
//     doesn't change every second. Avoids hammering the API on every
//     mount.
//   - refetchOnWindowFocus: true (default) — important for multi-device:
//     focusing the laptop after answering questions on the phone should
//     pick up the new state.
//   - retry: 1 — fail fast on real errors, but tolerate one hiccup.

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
