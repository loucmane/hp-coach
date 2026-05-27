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
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'

import { useHydratePrefs } from '@/api/useSyncedPrefs'
import { CommandPalette } from '@/components/CommandPalette'
import { Frame } from '@/components/Frame'
import { Mono } from '@/components/primitives'
import { ShareDebugButton } from '@/components/ShareDebugButton'
import { TweaksLauncher } from '@/components/TweaksLauncher'
import { EASE, prefersReducedMotion } from '@/lib/motion'
import { isWelcomed } from '@/lib/welcome'
import { applyThemeToDocument, useUiStore } from '@/stores/uiStore'

export const Route = createRootRoute({
  component: RootShell,
})

// /dev-login bootstraps a Clerk session against the worker's
// /api/dev/login endpoint (dev/staging only). Has to be public — the
// whole point is to render before there's a session.
const PUBLIC_ROUTES = new Set<string>(['/sign-in', '/sign-up', '/dev-login'])

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
      {/* Both components self-gate via `isDevSurface()` — visible when
       *  `import.meta.env.DEV` OR `?dev=1` is in the URL OR the
       *  sessionStorage flag is set. Hidden in pure production
       *  preview otherwise. No outer gate here (an earlier attempt to
       *  add one broke the e2e `?dev=1` flow). */}
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
  return <FolioTurn pathname={location.pathname} />
}

// Folio Turn — Week 2 of the elevation plan.
//
// Every route change reads like a page turn in the edition: the
// outgoing spread rolls 0.5° right with a small x-slide + 8% opacity
// loss; the arriving spread mirrors it. Total duration is 320ms on
// `EASE.reading`, which is short enough that nobody waits for it but
// long enough to register the turn.
//
// `prefers-reduced-motion` collapses the motion to a straight
// crossfade with no rotation or translation — the page still changes,
// but the reader's vestibular system isn't asked to participate.
function FolioTurn({ pathname }: { pathname: string }) {
  const reduced = prefersReducedMotion()
  const out = reduced ? { opacity: 0 } : { opacity: 0.92, x: 12, rotateZ: 0.5 }
  const arrive = reduced
    ? { opacity: 0, x: 0, rotateZ: 0 }
    : { opacity: 0.92, x: -12, rotateZ: -0.5 }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={arrive}
        animate={{ opacity: 1, x: 0, rotateZ: 0 }}
        exit={out}
        transition={{ duration: 0.32, ease: EASE.reading }}
        style={{
          // origin near the spine keeps the turn anchored on the
          // left edge of the spread — the same place the eye lives
          // when reading a printed page.
          transformOrigin: '0% 50%',
        }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
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
