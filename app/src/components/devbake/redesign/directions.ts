// The bake-off's direction registry (/dev/redesign-2026-bakeoff, bead
// hpf-qr0p.2; screens per direction since kit v2, hpf-qr0p.7). Every
// direction lives in its own folder, which owns two things the bake-off
// reads:
//   - meta.ts  — `meta`: key, slug, name, tagline, the "Om" panel's text
//                and, once it builds more than round 1's four, `screens`;
//                imported here statically (the switcher needs it at once)
//   - a stage  — the component the stage mounts, imported here lazily, so a
//                direction's code, CSS and fonts load when it is first shown
// The page reads DIRECTIONS, STAGES and screensOf from here only. A
// folder's builder changes their own meta.ts and stage and never this file,
// as long as the stage keeps its file and export name.

import { type ComponentType, lazy } from 'react'

import type {
  AppScreenKey,
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

/** What a direction builds until its meta.ts says more: round 1's screens. */
export const DEFAULT_SCREENS: readonly AppScreenKey[] = [1, 2, 3, 4]

/** The screens a direction has built (its meta's `screens`, else round 1's
 *  four). The stage shows the shared "Inte byggd än" card on the others. */
export function screensOf(meta: DirectionMeta): readonly AppScreenKey[] {
  return meta.screens ?? DEFAULT_SCREENS
}

/** Whether the stage mounts the direction itself on `screen`. */
export function builds(meta: DirectionMeta, screen: AppScreenKey): boolean {
  return screensOf(meta).includes(screen)
}
