import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import type { Selection } from '@/components/devbake/uppslagB/uppslagBFixtures'
import { isDevSurface } from '@/lib/devSurface'

export function validateSearch(input: Record<string, unknown>): Partial<Selection> {
  const out: Partial<Selection> = {}
  if (['a', 'b', 'c'].includes(String(input.d))) out.d = input.d as Selection['d']
  if ([1, 2, 3, 4, 5, 6, 7, 8].includes(Number(input.s))) out.s = Number(input.s) as Selection['s']
  if ([0, 1, 2, 3, 4, 5].includes(Number(input.e))) out.e = Number(input.e)
  if (['desktop', 'phone'].includes(String(input.w))) out.w = input.w as Selection['w']
  if (['light', 'dark'].includes(String(input.t))) out.t = input.t as Selection['t']
  if (['spalt', 'sand', 'sage', 'ink', 'rose'].includes(String(input.p)))
    out.p = input.p as Selection['p']
  if ([true, 1, '1', 'true'].includes(input.sbs as string)) out.sbs = true
  return out
}

export const Route = createFileRoute('/dev_/uppslag-b-bakeoff')({
  validateSearch,
  component: UppslagBBakeoffPage,
})
const UppslagBBakeoff = lazy(() => import('@/components/devbake/uppslagB/UppslagBBakeoff'))

function UppslagBBakeoffPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  if (!isDevSurface()) return <p style={{ padding: 40 }}>dev-yta — lägg till ?dev=1</p>
  const sel: Selection = {
    d: search.d ?? 'a',
    s: search.s ?? 1,
    e: search.e ?? 0,
    w: search.w ?? (typeof window !== 'undefined' && window.innerWidth < 700 ? 'phone' : 'desktop'),
    t: search.t ?? 'light',
    p: search.p ?? 'spalt',
    sbs: search.sbs === true,
  }
  return (
    <Suspense fallback={<p>Laddar Uppslag…</p>}>
      <UppslagBBakeoff
        sel={sel}
        onSelect={(next) => navigate({ search: (prev) => ({ ...prev, ...next }), replace: true })}
      />
    </Suspense>
  )
}
