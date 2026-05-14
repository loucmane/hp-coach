// DispatchedVariant — pick StyleA/B/C from the live drillLayout.
//
// Phase A.6V. The legacy /drill-style-{a,b,c} routes and the
// SessionPlayer dispatch both want to render whichever variant
// matches the user's active Edition. Centralising the switch here
// keeps that decision in one place — if a fourth variant ever
// lands, the legacy routes, SessionPlayer, and any future surfaces
// all flip with one edit.

import { useUiStore } from '@/stores/uiStore'

import type { VariantData } from './DrillVariantShell'
import { StyleA } from './StyleA'
import { StyleB } from './StyleB'
import { StyleC } from './StyleC'

export function DispatchedVariant(data: VariantData) {
  const layout = useUiStore((s) => s.drillLayout)
  switch (layout) {
    case 'b':
      return <StyleB {...data} />
    case 'c':
      return <StyleC {...data} />
    default:
      return <StyleA {...data} />
  }
}
