// /sign-up/* — catch-all for Clerk's path-routing sub-steps.
//
// <SignUp routing="path"> navigates to child paths mid-flow
// (/sign-up/verify-email-address, /sign-up/continue, …). Without this
// splat route the router's not-found handling ejected the user before
// the verification-code step, so interactive email sign-up could never
// complete (found 2026-07-19 — Google OAuth and API-created e2e users
// had always bypassed the wizard). Renders the same screen; Clerk
// reads the sub-path itself.

import { createFileRoute } from '@tanstack/react-router'

import { SignUpScreen } from './sign-up'

export const Route = createFileRoute('/sign-up/$')({
  component: SignUpScreen,
})
