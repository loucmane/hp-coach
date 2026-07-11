// Primary navigation — the single source of truth for the five doors.
//
// Owner-locked IA (2026-07-11 nav redesign): five identical doors, same
// set and order in BOTH chromes (desktop rail + phone tab bar):
//
//     Hem · Öva · Provpass · Uppslag · Framsteg
//
// Provpass sits dead-center (slot 3) — the measuring instrument at the
// fulcrum. Every chrome renders THIS list, so the two bars can't drift;
// the nav contract test asserts exactly that.
//
// Accent-active law (owner, mid-build 2026-07-11): the accent color
// appears only on (a) the active door — accent glyph when the rail is
// collapsed, accent label when expanded or on the phone tab — and (b)
// the single Öva due-count numeral. No bokmärke ribbon anywhere in the
// product nav. Nothing else in the chrome may use accent.

import type { ReactNode } from 'react'

import type { IconProps } from '@/components/icons'
import { GlyphFramsteg, GlyphHem, GlyphOva, GlyphProvpass, GlyphUppslag } from '@/components/icons'

/** The five primary destinations. Historically called TabKey (the phone
 *  bottom-tab id); the desktop rail shares the same ids. */
export type DoorId = 'home' | 'ova' | 'provpass' | 'uppslag' | 'framsteg'

/** @deprecated legacy alias — kept because many screens import
 *  `type TabKey` from '@/components/MobileFrame', which re-exports this. */
export type TabKey = DoorId

export type DoorRoute = '/' | '/ova' | '/prov' | '/lektion' | '/progress'

export type Door = {
  id: DoorId
  /** Product string (Swedish) — the same word in every chrome. */
  label: string
  to: DoorRoute
  /** Collapsed-spine glyph (the phone bar is text-only, so it's unused
   *  there). */
  Glyph: (p: IconProps) => ReactNode
}

export const DOORS: readonly Door[] = [
  { id: 'home', label: 'Hem', to: '/', Glyph: GlyphHem },
  { id: 'ova', label: 'Öva', to: '/ova', Glyph: GlyphOva },
  { id: 'provpass', label: 'Provpass', to: '/prov', Glyph: GlyphProvpass },
  { id: 'uppslag', label: 'Uppslag', to: '/lektion', Glyph: GlyphUppslag },
  { id: 'framsteg', label: 'Framsteg', to: '/progress', Glyph: GlyphFramsteg },
] as const

/** door id → route. Derived from DOORS so it can't fall out of sync. One
 *  place so screens don't hardcode the mapping. */
export const TAB_ROUTE: Record<DoorId, DoorRoute> = {
  home: '/',
  ova: '/ova',
  provpass: '/prov',
  uppslag: '/lektion',
  framsteg: '/progress',
}
