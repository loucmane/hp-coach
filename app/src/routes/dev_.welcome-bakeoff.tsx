// Kept as a permanent comparison. No dev fixture or CSS enters the eager
// route module; the established dev-surface gate guards the lazy page.
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import type { Selection } from '@/components/devbake/welcome/welcomeFixtures'
import { isDevSurface } from '@/lib/devSurface'

export function validateSearch(input: Record<string, unknown>): Partial<Selection> {
  const out: Partial<Selection> = {}
  if (['a', 'b', 'c'].includes(String(input.d))) out.d = input.d as Selection['d']
  if ([1, 2, 3, 4, 5, 6].includes(Number(input.s))) out.s = Number(input.s) as Selection['s']
  if (['desktop', 'phone'].includes(String(input.w))) out.w = input.w as Selection['w']
  if (['light', 'dark'].includes(String(input.t))) out.t = input.t as Selection['t']
  if (['spalt', 'sand', 'sage', 'ink', 'rose'].includes(String(input.p)))
    out.p = input.p as Selection['p']
  if ([true, 1, '1', 'true'].includes(input.sbs as string)) out.sbs = true
  return out
}

export const Route = createFileRoute('/dev_/welcome-bakeoff')({
  validateSearch,
  component: WelcomeBakeoffPage,
})
const WelcomeBakeoff = lazy(() => import('@/components/devbake/welcome/WelcomeBakeoff'))

function WelcomeBakeoffPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        dev-yta — lägg till ?dev=1
      </div>
    )
  }
  const sel: Selection = {
    d: search.d ?? 'a',
    s: search.s ?? 1,
    w: search.w ?? (typeof window !== 'undefined' && window.innerWidth < 700 ? 'phone' : 'desktop'),
    t: search.t ?? 'light',
    p: search.p ?? 'spalt',
    sbs: search.sbs === true,
  }
  return (
    <Suspense fallback={<p>Laddar välkomstflödet…</p>}>
      <WelcomeBakeoff
        sel={sel}
        onSelect={(next) =>
          navigate({
            search: (prev) => ({ ...prev, ...next }),
            replace: true,
          })
        }
      />
    </Suspense>
  )
}
