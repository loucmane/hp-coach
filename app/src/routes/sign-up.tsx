// /sign-up — Clerk's prebuilt SignUp component on a Sand-palette card.
//
// Public route. New users land in the onboarding flow on first sign-in
// (Onboarding screen — task 6 — branches on whether the prefs row has
// daysToExam set).

import { SignUp } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'

export const Route = createFileRoute('/sign-up')({
  component: SignUpScreen,
})

function SignUpScreen() {
  return (
    <MobileFrame tabs={false}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
        }}
      >
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              rootBox: { width: '100%' },
              card: { background: 'var(--panel)', border: '1px solid var(--hairline)' },
            },
            variables: {
              colorPrimary: 'var(--ink)' as unknown as string,
              colorBackground: 'var(--panel)' as unknown as string,
              colorText: 'var(--ink)' as unknown as string,
              colorTextSecondary: 'var(--muted)' as unknown as string,
              fontFamily: 'var(--font-ui)' as unknown as string,
            },
          }}
        />
      </div>
    </MobileFrame>
  )
}
