// /dev/redesign-2026-bakeoff — the whole-app redesign, round 1 (epic
// hpf-qr0p, bead hpf-qr0p.1; brief docs/redesign/2026-10-round1-brief.md).
//
// Four candidate design directions, each a self-contained design system,
// shown on HP-Coach's own screens so the owner can react to real things:
//   A Folio      — editorial paper, next generation
//   B Instrument — precision pro tool
//   C Spår       — expressive learning path
//   D Lager      — spatial depth, glass done right
// Screens: 1 Idag · 2 Läsfråga · 3 Facit · 4 Navigering, at desktop or
// phone width, light or dark. `?d=b&s=2&w=phone&t=dark` selects; `&sbs=1`
// shows the same screen in all four directions side by side; `&bare=1`
// hides the switcher (screenshots). Keys: 1–4 direction, ←/→ screen,
// 0 side by side.
//
// Dev-gated. Kept forever per the keep-bake-offs rule.
//
// Bundling: routeTree.gen imports this module eagerly and autoCodeSplitting
// splits off `component` only, so whatever validateSearch touches ships in
// the entry bundle. This file therefore has no static import from
// components/devbake: the search keys are inline (pinned to the page's
// metadata by -redesign-2026-bakeoff.test.ts) and the page, the four
// directions, their fixtures and fonts load through import() once the dev
// gate lets the page render.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { isDevSurface } from '@/lib/devSurface'

export const DIRECTION_KEYS = ['a', 'b', 'c', 'd'] as const
export const SCREEN_KEYS = [1, 2, 3, 4] as const
export const WIDTH_KEYS = ['desktop', 'phone'] as const
export const THEME_KEYS = ['light', 'dark'] as const

type DirectionKey = (typeof DIRECTION_KEYS)[number]
type ScreenKey = (typeof SCREEN_KEYS)[number]
type WidthKey = (typeof WIDTH_KEYS)[number]
type ThemeKey = (typeof THEME_KEYS)[number]

type BakeoffSearch = {
  d?: DirectionKey
  s?: ScreenKey
  w?: WidthKey
  t?: ThemeKey
  sbs?: true
  bare?: true
}

type Selection = {
  d: DirectionKey
  s: ScreenKey
  w: WidthKey
  t: ThemeKey
  sbs: boolean
  bare: boolean
}

const isOn = (v: unknown) => v === true || v === 1 || v === '1' || v === 'true'

function pick<K extends string | number>(keys: readonly K[], value: unknown): K | undefined {
  return keys.find((k) => String(k) === String(value ?? ''))
}

export function validateSearch(input: Record<string, unknown>): BakeoffSearch {
  const out: BakeoffSearch = {}
  const d = pick(DIRECTION_KEYS, input.d)
  if (d) out.d = d
  const s = pick(SCREEN_KEYS, input.s)
  if (s) out.s = s
  const w = pick(WIDTH_KEYS, input.w)
  if (w) out.w = w
  const t = pick(THEME_KEYS, input.t)
  if (t) out.t = t
  if (isOn(input.sbs)) out.sbs = true
  if (isOn(input.bare)) out.bare = true
  return out
}

export const Route = createFileRoute('/dev_/redesign-2026-bakeoff')({
  validateSearch,
  component: RedesignBakeoffPage,
})

const Redesign2026Bakeoff = lazy(() =>
  import('@/components/devbake/redesign/Redesign2026Bakeoff').then((m) => ({
    default: m.Redesign2026Bakeoff,
  })),
)

function RedesignBakeoffPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        dev-yta — lägg till ?dev=1
      </div>
    )
  }

  // A phone opening the link without `w` sees the phone screens.
  const narrow = typeof window !== 'undefined' && window.innerWidth < 700
  const sel: Selection = {
    d: search.d ?? 'a',
    s: search.s ?? 1,
    w: search.w ?? (narrow ? 'phone' : 'desktop'),
    t: search.t ?? 'light',
    sbs: search.sbs === true,
    bare: search.bare === true,
  }

  return (
    <Suspense fallback={null}>
      <Redesign2026Bakeoff
        sel={sel}
        onSelect={(next: Partial<Selection>) =>
          navigate({
            search: (prev) => ({
              ...prev,
              ...(next.d ? { d: next.d } : {}),
              ...(next.s ? { s: next.s } : {}),
              ...(next.w ? { w: next.w } : {}),
              ...(next.t ? { t: next.t } : {}),
              ...('sbs' in next ? { sbs: next.sbs ? (true as const) : undefined } : {}),
            }),
            replace: true,
          })
        }
      />
    </Suspense>
  )
}
