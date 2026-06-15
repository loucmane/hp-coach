// /redesign-layout-bakeoff — Task MD of the M3 faithful-rebuild plan.
//
// Three layout calls to make before the rebuild starts (M0–M6), shown on the
// real M3 drill so the judgement is apples-to-apples: desktop 1-col vs 2-col,
// phone rail vs linearised, bare page vs running-head chrome. Dev-gated.

import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LayoutBakeoff } from '@/components/devbake/LayoutBakeoff'
import { isDevSurface } from '@/lib/devSurface'
import { applyThemeToDocument, useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/redesign-layout-bakeoff')({
  component: RedesignLayoutBakeoff,
})

function RedesignLayoutBakeoff() {
  const { palette, mode, font, density, useFluid } = useUiStore()

  // Token-bound like every redesign surface — respond to the live theme.
  useEffect(() => {
    applyThemeToDocument(palette, mode, font, density, useFluid)
  }, [palette, mode, font, density, useFluid])

  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /redesign-layout-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  return <LayoutBakeoff />
}
