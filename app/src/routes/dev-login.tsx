// /dev/login — one-shot bootstrap for headless visual verification.
//
// Flow:
//   1. POST /api/dev/login → worker issues a Clerk sign-in token for the
//      configured DEV_LOGIN_EMAIL user
//   2. clerk.signIn.create({ strategy: 'ticket', ticket }) exchanges the
//      token for a real Clerk session
//   3. setActive() activates the session; navigate to '/'
//
// MCP-driven Playwright (or any headless browser) can navigate here once
// per session and become the dev test user — no email OTP, no Clerk
// bot-detection token.
//
// Safety: the worker side refuses to issue tokens when ENVIRONMENT ===
// 'production'. This route is intentionally part of the unauth public
// surface (the SPA still ships it to prod) because PUBLIC_ROUTES in
// __root.tsx renders it without the SignedIn gate; if a prod user
// somehow lands here it just hits a 403 from the worker.

import { useAuth, useClerk, useSignIn } from '@clerk/clerk-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { Mono } from '@/components/primitives'
import { useFirstContentSignal } from '@/lib/motion'

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

export const Route = createFileRoute('/dev-login')({
  component: DevLoginScreen,
})

/** The readable text of a failed step. Clerk's API errors keep it in
 *  `errors[0].longMessage` (or `.message`) and leave `err.message` empty. */
export function devLoginErrorText(err: unknown): string {
  const clerk = (err as { errors?: { longMessage?: string; message?: string }[] } | null)
    ?.errors?.[0]
  const text =
    clerk?.longMessage || clerk?.message || (err instanceof Error ? err.message : String(err ?? ''))
  return text || 'okänt fel'
}

function DevLoginScreen() {
  // Boot-veil content signal (#305 owner verdict) — dev/e2e bootstrap
  // route; its status line is present at mount.
  useFirstContentSignal()
  const { isLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('Väntar på Clerk...')
  // One attempt per page load: the hook identities can change and re-run
  // the effect, and each run would otherwise fetch a fresh token.
  const started = useRef(false)
  // The attempt outlives effect replays (StrictMode) but must not act once
  // the page is really gone: no sign-out, ticket exchange or redirect then.
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !authLoaded || !signIn || !setActive || started.current) return
    started.current = true
    ;(async () => {
      try {
        // A ticket sign-in is refused while a session is active. Never sign
        // out on our own: Clerk can reload this page right after a sign-in,
        // and an automatic sign-out would loop. Already signed in means done;
        // /dev-login?switch=1 switches accounts explicitly, once.
        const url = new URL(window.location.href)
        if (isSignedIn) {
          if (url.searchParams.has('switch')) {
            setStatus('Loggar ut befintlig session...')
            url.searchParams.delete('switch')
            if (!alive.current) return
            await signOut({ redirectUrl: url.toString() })
            return
          }
          setStatus('Redan inloggad — omdirigerar...')
          if (!alive.current) return
          navigate({ to: '/' })
          return
        }
        setStatus('Hämtar sign-in-token...')
        const res = await fetch(`${BASE_URL}/api/dev/login`, { method: 'POST' })
        const body = (await res.json()) as { token?: string; error?: { message: string } }
        if (!res.ok || !body.token) {
          throw new Error(body.error?.message ?? `HTTP ${res.status}`)
        }
        if (!alive.current) return
        setStatus('Växlar in token mot session...')
        const result = await signIn.create({
          strategy: 'ticket',
          ticket: body.token,
        })
        if (result.status !== 'complete' || !result.createdSessionId) {
          throw new Error(`signIn.create returned status=${result.status}`)
        }
        if (!alive.current) return
        await setActive({ session: result.createdSessionId })
        if (!alive.current) return
        setStatus('Klar — omdirigerar...')
        navigate({ to: '/' })
      } catch (err) {
        if (alive.current) setStatus(`Fel: ${devLoginErrorText(err)}`)
      }
    })()
  }, [isLoaded, authLoaded, isSignedIn, signIn, setActive, signOut, navigate])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        padding: 24,
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      <Mono>DEV · LOGIN</Mono>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
        {status}
      </p>
    </div>
  )
}
