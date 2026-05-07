// /sign-in — Clerk's prebuilt SignIn component on a Sand-palette card.
//
// Public route (no auth guard). After a successful sign-in, Clerk
// redirects via `signInFallbackRedirectUrl` set in main.tsx (= '/').

import { SignIn } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

import { MobileFrame } from '@/components/MobileFrame'

export const Route = createFileRoute('/sign-in')({
  component: SignInScreen,
})

function SignInScreen() {
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
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
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
