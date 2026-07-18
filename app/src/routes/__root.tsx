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
// screen; signed-out users are redirected to /sign-in (except on the
// public routes, and `/`, where logged-out visitors get the public
// landing — see AuthRouter).

import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { useHydratePrefs } from '@/api/useSyncedPrefs'
import { CommandPalette } from '@/components/CommandPalette'
import { Frame } from '@/components/Frame'
import { PublicLanding } from '@/components/landing/PublicLanding'
import { RouteScene } from '@/components/motion/RouteScene'
import { Btn, Mono } from '@/components/primitives'
import { hasFirstContentFired } from '@/lib/motion'
import { isWelcomed } from '@/lib/welcome'
import { applyThemeToDocument, useUiStore } from '@/stores/uiStore'

export const Route = createRootRoute({
  component: RootShell,
})

// /dev-login bootstraps a Clerk session against the worker's
// /api/dev/login endpoint (dev/staging only). Has to be public — the
// whole point is to render before there's a session.
// /integritet and /villkor are public legal pages — they must render
// logged-out (footer/landing/sign-in links reach them without a session).
const PUBLIC_ROUTES = new Set<string>([
  '/sign-in',
  '/sign-up',
  '/dev-login',
  '/integritet',
  '/villkor',
])

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
        <ClerkGate />
      </Frame>
      {/* Both components self-gate via `isDevSurface()` — visible when
       *  `import.meta.env.DEV` OR `?dev=1` is in the URL OR the
       *  sessionStorage flag is set. Hidden in pure production
       *  preview otherwise. No outer gate here (an earlier attempt to
       *  add one broke the e2e `?dev=1` flow). */}
      <CommandPalette />
    </>
  )
}

// Clerk gate with a load-failure fallback.
//
// We used to render <ClerkLoading>splash</> + <ClerkLoaded>app</> — but
// when Clerk's JS fails to load (network blip, CDN hiccup, Clerk outage:
// `failed_to_load_clerk_js_timeout`), Clerk leaves BOTH states empty, so
// the user was stranded on a permanent blank with no way to recover.
// Drive the gate off `useAuth().isLoaded` instead, and after a timeout
// show a recoverable error instead of an indefinite splash.
const CLERK_LOAD_TIMEOUT_MS = 15_000

// Owner verdict on #305: the brief skeleton frame between the boot veil
// lifting and the page's real content landing read as janky. The veil
// now holds past Clerk resolving until the first REAL CONTENT commits
// (see lib/motion.ts `hpc:first-content` / `useFirstContentSignal`) — the
// user sees their surface colour, then the finished page, never a
// skeleton frame in between on a normal cold boot.
//
// This grace window covers a route we failed to instrument (no Skrift,
// no `useFirstContentSignal` call): once Clerk itself has resolved, give
// the mounted route up to this long to signal before lifting anyway — an
// unsignalled route must not ride all the way to the 1.5s inline
// failsafe on every single load.
const FIRST_CONTENT_GRACE_MS = 1_200

function ClerkGate() {
  const { isLoaded } = useAuth()
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    if (isLoaded) return
    const t = setTimeout(() => setTimedOut(true), CLERK_LOAD_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [isLoaded])

  // Arm the first-content listener at MOUNT, not gated on `isLoaded`. React
  // fires a commit's effects bottom-up (children before parents) — when
  // `isLoaded` flips true, the signed-in tree mounts as ClerkGate's child
  // in the SAME commit, so a surface that's ready at first render (a
  // `Skrift` skip, `useFirstContentSignal`) can dispatch from ITS effect
  // before this effect would otherwise run. Registering the listener
  // early avoids the race for the async case; `hasFirstContentFired()`
  // below covers the synchronous case where the dispatch already
  // happened by the time this effect runs.
  useEffect(() => {
    const lift = () => {
      // Two rAFs so the just-committed content is actually painted
      // before the veil comes off — one rAF only guarantees the browser
      // has scheduled the paint, not that it has happened.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.__hpcBootVeil?.remove()
        })
      })
    }
    if (hasFirstContentFired()) {
      lift()
      return
    }
    window.addEventListener('hpc:first-content', lift, { once: true })
    return () => window.removeEventListener('hpc:first-content', lift)
  }, [])

  // Grace fallback: once Clerk has resolved, an unsignalled route still
  // gets the veil lifted after a short, bounded wait instead of riding to
  // the 1.5s inline failsafe (see FIRST_CONTENT_GRACE_MS above). Skrift/
  // useFirstContentSignal firing first makes this a no-op — remove() is
  // idempotent.
  useEffect(() => {
    if (!isLoaded) return
    const t = setTimeout(() => {
      window.__hpcBootVeil?.remove()
    }, FIRST_CONTENT_GRACE_MS)
    return () => clearTimeout(t)
  }, [isLoaded])

  if (isLoaded) return <AuthRouter />
  if (timedOut) return <ClerkLoadFailed />
  return <SplashLoading />
}

function ClerkLoadFailed() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 'clamp(24px, 6vw, 64px)',
        background: 'var(--bg)',
        textAlign: 'center',
      }}
    >
      <Mono>kunde inte ladda</Mono>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 1vw + 15px, 22px)',
          lineHeight: 1.45,
          color: 'var(--ink-2)',
          maxWidth: '34ch',
          margin: 0,
        }}
      >
        Inloggningen kunde inte starta — det beror oftast på en tillfällig anslutning. Försök igen.
      </p>
      <Btn onClick={() => window.location.reload()} data-testid="clerk-reload">
        Ladda om →
      </Btn>
    </div>
  )
}

function AuthRouter() {
  const location = useLocation()
  const isPublic = PUBLIC_ROUTES.has(location.pathname)
  // `/` splits on auth state: signed-in users keep the Daily Home
  // (routes/index.tsx, via the normal SignedInTree → Outlet path);
  // logged-out visitors get the public landing instead of the old
  // redirect to /sign-in. The landing is rendered directly (not via
  // Outlet) so the index route's authed hooks never mount without a
  // session; it drives its own veil/first-content choreography.
  //
  // ONE tree shape for every non-public route — only the SignedOut
  // child varies by path. An earlier draft returned a differently
  // nested tree for '/', which made React remount SignedInTree (and
  // kill route/session state) on every '/' ↔ other-route navigation.
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
            {location.pathname === '/' ? <PublicLanding /> : <RedirectToSignIn />}
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
  // A2 scene handoff: door changes re-ink the reading window (opacity
  // only, exits lead) instead of sliding. See RouteScene.
  return (
    <RouteScene>
      <Outlet />
    </RouteScene>
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
