// /sign-in/* — catch-all for Clerk's path-routing sub-steps.
//
// Same contract as sign-up.$.tsx: <SignIn routing="path"> navigates to
// child paths mid-flow (/sign-in/factor-one, …); without a splat route
// the router ejected the user. Renders the same screen.

import { createFileRoute } from '@tanstack/react-router'

import { SignInScreen } from './sign-in'

export const Route = createFileRoute('/sign-in/$')({
  component: SignInScreen,
})
