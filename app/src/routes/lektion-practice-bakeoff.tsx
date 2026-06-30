// /lektion-practice-bakeoff — surfacing targeted practice on the lektion
// trap rows. Toggle Verb · Tröskel · Täthet · Sektion-CTA on the real XYZ
// catalog. Dev-gated (?dev=1). See docs/learning-modes-design.md.

import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LektionPracticeBakeoff } from '@/components/devbake/LektionPracticeBakeoff'
import { isDevSurface } from '@/lib/devSurface'
import { applyThemeToDocument, useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/lektion-practice-bakeoff')({
  component: LektionPracticeBakeoffRoute,
})

function LektionPracticeBakeoffRoute() {
  const { palette, mode, font, density, useFluid } = useUiStore()

  useEffect(() => {
    applyThemeToDocument(palette, mode, font, density, useFluid)
  }, [palette, mode, font, density, useFluid])

  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /lektion-practice-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  return <LektionPracticeBakeoff />
}
