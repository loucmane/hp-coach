// /sign-up — Clerk's prebuilt SignUp component on a Sand-palette card.
//
// Public route. New users land in the onboarding flow on first sign-in
// (Onboarding screen — task 6 — branches on whether the prefs row has
// daysToExam set).

import { SignUp } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'
import { clerkAppearance } from '@/lib/clerkAppearance'

export const Route = createFileRoute('/sign-up')({
  component: SignUpScreen,
})

function SignUpScreen() {
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
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={clerkAppearance} />
      </div>
    </MobileFrame>
  )
}
