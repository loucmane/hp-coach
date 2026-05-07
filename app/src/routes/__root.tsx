// Root route — top-level layout + auth gate for every page.
//
// Renders the 390x844 phone-frame artboard container that all mobile
// screens live inside. Wraps the outlet in a Clerk auth gate: signed-in
// users see the screen; signed-out users see <SignIn /> (except on the
// /sign-in and /sign-up routes themselves, which are public).

import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/clerk-react'
import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Mono } from '@/components/primitives'
import { TweaksLauncher } from '@/components/TweaksLauncher'
import { applyThemeToDocument, useUiStore } from '@/stores/uiStore'

export const Route = createRootRoute({
  component: RootShell,
})

const PUBLIC_ROUTES = new Set<string>(['/sign-in', '/sign-up'])

function RootShell() {
  const palette = useUiStore((s) => s.palette)
  const mode = useUiStore((s) => s.mode)
  const font = useUiStore((s) => s.font)
  const density = useUiStore((s) => s.density)

  useEffect(() => {
    applyThemeToDocument(palette, mode, font, density)
  }, [palette, mode, font, density])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--panel-2)',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          maxHeight: 'calc(100vh - 64px)',
          background: 'var(--bg)',
          borderRadius: 36,
          overflow: 'hidden',
          border: '1px solid var(--hairline)',
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.18)',
          position: 'relative',
        }}
      >
        <ClerkLoading>
          <SplashLoading />
        </ClerkLoading>
        <ClerkLoaded>
          <AuthRouter />
        </ClerkLoaded>
      </div>
      <TweaksLauncher />
    </div>
  )
}

function AuthRouter() {
  const location = useLocation()
  const isPublic = PUBLIC_ROUTES.has(location.pathname)
  return (
    <>
      {isPublic ? (
        <Outlet />
      ) : (
        <>
          <SignedIn>
            <Outlet />
          </SignedIn>
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </>
      )}
    </>
  )
}

// Tiny redirect helper — client-side, not Clerk's <RedirectToSignIn />, so
// the SPA stays inside its router without bouncing through Clerk's hosted
// page when we don't need to.
function RedirectToSignIn() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ to: '/sign-in' })
  }, [navigate])
  return <SplashLoading />
}

// Tiny splash for Clerk's initial JWT bootstrap (~50–200ms). Matches the
// Sand palette so it feels like part of the artboard, not a generic blank.
function SplashLoading() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <Mono>laddar…</Mono>
    </div>
  )
}
