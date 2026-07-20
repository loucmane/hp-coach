// /sign-in — Clerk's prebuilt SignIn component on a Sand-palette card.
//
// Public route (no auth guard). After a successful sign-in, Clerk
// redirects via `signInFallbackRedirectUrl` set in main.tsx (= '/').

import { SignIn } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

import { AuthLayout } from '@/components/AuthLayout'
import { MobileFrame } from '@/components/MobileFrame'
import { clerkAppearance } from '@/lib/clerkAppearance'
import { useFirstContentSignal } from '@/lib/motion'

export const Route = createFileRoute('/sign-in')({
  component: SignInScreen,
})

export function SignInScreen() {
  // Boot-veil content signal (#305 owner verdict) — public route, no
  // Skrift block; the card chrome is present at mount.
  useFirstContentSignal()
  return (
    <MobileFrame tabs={false}>
      <AuthLayout
        cardLabel="Logga in"
        crossLink={
          <>
            Inget konto?{' '}
            <a href="/sign-up" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
              → börja här
            </a>
          </>
        }
      >
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={clerkAppearance} />
      </AuthLayout>
    </MobileFrame>
  )
}
