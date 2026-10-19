// The bake-off's direction registry (/dev/redesign-2026-bakeoff, bead
// hpf-qr0p.2). Every direction lives in its own folder, which owns two
// things the bake-off reads:
//   - meta.ts  — `meta`: key, slug, name, tagline and the "Om" panel's text,
//                imported here statically (the switcher needs it at once)
//   - a stage  — the component the stage mounts, imported here lazily, so a
//                direction's code, CSS and fonts load when it is first shown
// The page reads DIRECTIONS and STAGES from here only. A folder's builder
// changes their own meta.ts and stage and never this file, as long as the
// stage keeps its file and export name.

import { type ComponentType, lazy } from 'react'

import type {
  DirectionKey,
  DirectionMeta,
  DirectionProps,
} from '@/components/devbake/redesign/r1Kit'
import { meta as folio } from './a-folio/meta'
import { meta as instrument } from './b-instrument/meta'
import { meta as spar } from './c-spar/meta'
import { meta as lager } from './d-lager/meta'
import { meta as svep } from './e-svep/meta'
import { meta as samtal } from './f-samtal/meta'
import { meta as raster } from './g-raster/meta'
import { meta as ljuskagla } from './h-ljuskagla/meta'

/** The directions in key order, a–h: the switcher's order and its keys 1–8. */
export const DIRECTIONS: DirectionMeta[] = [
  folio,
  instrument,
  spar,
  lager,
  svep,
  samtal,
  raster,
  ljuskagla,
]

export const STAGES: Record<DirectionKey, ComponentType<DirectionProps>> = {
  a: lazy(() => import('./a-folio/Folio').then((m) => ({ default: m.Folio }))),
  b: lazy(() => import('./b-instrument/Instrument').then((m) => ({ default: m.Instrument }))),
  c: lazy(() => import('./c-spar/Spar').then((m) => ({ default: m.Spar }))),
  d: lazy(() => import('./d-lager/Lager').then((m) => ({ default: m.Lager }))),
  e: lazy(() => import('./e-svep/Svep').then((m) => ({ default: m.Svep }))),
  f: lazy(() => import('./f-samtal/Samtal').then((m) => ({ default: m.Samtal }))),
  g: lazy(() => import('./g-raster/Raster').then((m) => ({ default: m.Raster }))),
  h: lazy(() => import('./h-ljuskagla/Ljuskagla').then((m) => ({ default: m.Ljuskagla }))),
}
