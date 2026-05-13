// Root route — top-level layout + auth gate for every page.
//
// Phase A: the hard-coded 390×844 phone artboard is now a responsive
// <Frame> that picks layout based on viewport — phone (full-bleed),
// reader (centered card 640px max), studio (centered card + optional
// rails). Existing screens that wrap their content in MobileFrame still
// work because MobileFrame is now viewport-aware too (iOS decorative
// chrome auto-hides at reader+).
//
// Wraps the outlet in a Clerk auth gate: signed-in users see the
// screen; signed-out users see <SignIn /> (except on the /sign-in
// and /sign-up routes themselves, which are public).

import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/clerk-react'
import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useHydratePrefs } from '@/api/useSyncedPrefs'
import { CommandPalette } from '@/components/CommandPalette'
import { Frame } from '@/components/Frame'
import { Mono } from '@/components/primitives'
import { ShareDebugButton } from '@/components/ShareDebugButton'
import { TweaksLauncher } from '@/components/TweaksLauncher'
import { isWelcomed } from '@/lib/welcome'
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
  const useFluid = useUiStore((s) => s.useFluid)

  useEffect(() => {
    applyThemeToDocument(palette, mode, font, density, useFluid)
  }, [palette, mode, font, density, useFluid])

  return (
    <>
      <Frame>
        <ClerkLoading>
          <SplashLoading />
        </ClerkLoading>
        <ClerkLoaded>
          <AuthRouter />
        </ClerkLoaded>
      </Frame>
      <ShareDebugButton />
      <TweaksLauncher />
      <CommandPalette />
    </>
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
            <SignedInTree />
          </SignedIn>
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </>
      )}
    </>
  )
}

// Hydration of server prefs into local stores happens here, inside <SignedIn>
// — useUserPrefs requires a Clerk session, so this hook is only safe to mount
// after we've confirmed the user is authenticated.
//
// Phase A.6V — also gates the first-time welcome picker. If the user
// hasn't clicked through /welcome yet, redirect them there before
// rendering the rest of the app. Existing dogfood state in `hpc-ui`
// implies welcomed, so we treat the `hpc-welcomed` flag as the
// canonical signal (one-way: set on continue, never cleared).
function SignedInTree() {
  useHydratePrefs()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (location.pathname === '/welcome') return
    if (!isWelcomed()) {
      navigate({ to: '/welcome' })
    }
  }, [navigate, location.pathname])
  return <Outlet />
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
