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

import { useSignIn } from '@clerk/clerk-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Mono } from '@/components/primitives'
import { useFirstContentSignal } from '@/lib/motion'

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

export const Route = createFileRoute('/dev-login')({
  component: DevLoginScreen,
})

function DevLoginScreen() {
  // Boot-veil content signal (#305 owner verdict) — dev/e2e bootstrap
  // route; its status line is present at mount.
  useFirstContentSignal()
  const { isLoaded, signIn, setActive } = useSignIn()
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('Väntar på Clerk...')

  useEffect(() => {
    if (!isLoaded || !signIn || !setActive) return
    let cancelled = false
    ;(async () => {
      try {
        setStatus('Hämtar sign-in-token...')
        const res = await fetch(`${BASE_URL}/api/dev/login`, { method: 'POST' })
        const body = (await res.json()) as { token?: string; error?: { message: string } }
        if (!res.ok || !body.token) {
          throw new Error(body.error?.message ?? `HTTP ${res.status}`)
        }
        if (cancelled) return
        setStatus('Växlar in token mot session...')
        const result = await signIn.create({
          strategy: 'ticket',
          ticket: body.token,
        })
        if (cancelled) return
        if (result.status !== 'complete' || !result.createdSessionId) {
          throw new Error(`signIn.create returned status=${result.status}`)
        }
        await setActive({ session: result.createdSessionId })
        if (cancelled) return
        setStatus('Klar — omdirigerar...')
        navigate({ to: '/' })
      } catch (err) {
        if (cancelled) return
        setStatus(`Fel: ${err instanceof Error ? err.message : String(err)}`)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLoaded, signIn, setActive, navigate])

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
