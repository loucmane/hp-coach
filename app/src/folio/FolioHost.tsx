import { Component, lazy, type ReactNode, Suspense } from 'react'

import { useUiStore } from '@/stores/uiStore'
import { supportsFolio } from './nav'

const FolioShell = lazy(() => import('./FolioShell').then((m) => ({ default: m.FolioShell })))

export function FolioHost({ pathname, children }: { pathname: string; children: ReactNode }) {
  const enabled = useUiStore((s) => s.folioPreview)
  if (!enabled || !supportsFolio(pathname)) return children
  return (
    <FolioBoundary>
      <Suspense fallback={<FolioLoading />}>
        <FolioShell>{children}</FolioShell>
      </Suspense>
    </FolioBoundary>
  )
}

function FolioLoading() {
  // Never mount children here: a route may start a session as a mount effect.
  return (
    <div style={{ padding: 24 }}>
      <p role="status">Laddar den nya designen…</p>
      <ClassicButton />
    </div>
  )
}

function ClassicButton() {
  return (
    <button type="button" onClick={() => useUiStore.getState().setFolioPreview(false)}>
      Tillbaka till klassisk design
    </button>
  )
}

class FolioBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div role="alert" style={{ padding: 24 }}>
        <p>Den nya designen kunde inte laddas.</p>
        <ClassicButton />
      </div>
    ) : (
      this.props.children
    )
  }
}
