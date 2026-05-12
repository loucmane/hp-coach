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
        cardLabel="Börja här"
        pullQuoteLine1="EN KURS"
        pullQuoteLine2="I PROVET."
        subline="Strukturerad pedagogik istället för ett frågebanksverktyg."
        crossLink={
          <>
            Har redan konto?{' '}
            <a href="/sign-in" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
              → logga in
            </a>
          </>
        }
      >
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={clerkAppearance} />
      </AuthLayout>
    </MobileFrame>
  )
}
