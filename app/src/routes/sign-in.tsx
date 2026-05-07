// /sign-in — Clerk's prebuilt SignIn component on a Sand-palette card.
//
// Public route (no auth guard). After a successful sign-in, Clerk
// redirects via `signInFallbackRedirectUrl` set in main.tsx (= '/').

import { SignIn } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'
import { clerkAppearance } from '@/lib/clerkAppearance'

export const Route = createFileRoute('/sign-in')({
  component: SignInScreen,
})

function SignInScreen() {
  return (
    <MobileFrame tabs={false}>
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          overflowY: 'auto',
        }}
      >
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={clerkAppearance} />
      </div>
    </MobileFrame>
  )
}
