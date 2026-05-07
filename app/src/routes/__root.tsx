// Root route — top-level layout for every page.
//
// Renders the 390x844 phone-frame artboard container that all mobile
// screens live inside. Real device deployment will swap this for a
// fullscreen container; for the dogfood phase we keep the artboard
// presentation everywhere so design and behaviour stay synced.

import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

import { TweaksLauncher } from '@/components/TweaksLauncher'
import { applyThemeToDocument, useUiStore } from '@/stores/uiStore'

export const Route = createRootRoute({
  component: RootShell,
})

function RootShell() {
  const palette = useUiStore((s) => s.palette)
  const mode = useUiStore((s) => s.mode)
  const font = useUiStore((s) => s.font)
  const density = useUiStore((s) => s.density)

  useEffect(() => {
    applyThemeToDocument(palette, mode, font, density)
  }, [palette, mode, font, density])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--panel-2)',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          maxHeight: 'calc(100vh - 64px)',
          background: 'var(--bg)',
          borderRadius: 36,
          overflow: 'hidden',
          border: '1px solid var(--hairline)',
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.18)',
          position: 'relative',
        }}
      >
        <Outlet />
      </div>
      <TweaksLauncher />
    </div>
  )
}
