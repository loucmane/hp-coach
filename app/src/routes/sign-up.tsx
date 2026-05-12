// /sign-up — Clerk's prebuilt SignUp component on a Sand-palette card.
//
// Public route. New users land in the onboarding flow on first sign-in
// (Onboarding screen — task 6 — branches on whether the prefs row has
// daysToExam set).

import { SignUp } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

import { AuthLayout } from '@/components/AuthLayout'
import { MobileFrame } from '@/components/MobileFrame'
import { clerkAppearance } from '@/lib/clerkAppearance'

export const Route = createFileRoute('/sign-up')({
  component: SignUpScreen,
})

function SignUpScreen() {
  return (
    <MobileFrame tabs={false}>
      <AuthLayout
        brandTitle="Börja här"
        brandKicker="Skapa ett konto för att börja träna inför högskoleprovet med strukturerad coachning."
      >
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={clerkAppearance} />
      </AuthLayout>
    </MobileFrame>
  )
}
