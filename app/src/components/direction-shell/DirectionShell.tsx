import { lazy, Suspense, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useViewport } from '@/hooks/useViewport'
import { useFirstContentSignal } from '@/lib/motion'
import { DESIGN_DIRECTIONS, type DirectionKey, useDesignStore } from '@/stores/designStore'
import { useUiStore } from '@/stores/uiStore'
import { DirectionSwitcher } from './DirectionSwitcher'
import './directionShell.css'

type DirectionProps = import('@/components/devbake/redesign/r1Kit').DirectionProps
type AppScreenKey = import('@/components/devbake/redesign/r1Kit').AppScreenKey

// This second boundary keeps even the registry behind import(). Its STAGES
// entries in turn load only the chosen direction's code and CSS. The stage
// sits in the bake-off's data provider (kit v2): the same fixture data, and
// actions mapped onto this shell's screen and theme. Without it a
// direction's host actions (go, openRepetera, the drill controller …) are
// no-ops here.
const DirectionStage = lazy(() =>
  Promise.all([
    import('@/components/devbake/redesign/directions'),
    import('@/components/devbake/redesign/directionData'),
  ]).then(([{ STAGES }, { DirectionDataProvider, useBakeoffDirectionData }]) => ({
    default: function StagedDirection({
      direction,
      onAppScreen,
      ...props
    }: DirectionProps & { direction: DirectionKey; onAppScreen: (screen: AppScreenKey) => void }) {
      const Stage = STAGES[direction]
      const { data, actions } = useBakeoffDirectionData({
        screen: props.screen,
        theme: props.theme,
        onScreen: onAppScreen,
        onTheme: props.onTheme,
      })
      return (
        <DirectionDataProvider data={data} actions={actions}>
          <Stage {...props} />
        </DirectionDataProvider>
      )
    },
  })),
)

export function DirectionShell({
  direction,
  screen: initialScreen,
}: {
  direction: DirectionKey
  screen: 1 | 2
}) {
  useFirstContentSignal()
  const mode = useUiStore((s) => s.mode)
  const setMode = useUiStore((s) => s.setMode)
  const setDirection = useDesignStore((s) => s.setDirection)
  const viewport = useViewport()
  const [screen, setScreen] = useState<DirectionProps['screen']>(initialScreen)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcher = useRef<HTMLDetailsElement>(null)
  const name = DESIGN_DIRECTIONS.find((d) => d.key === direction)!.name

  const closeSwitcher = () => {
    setSwitcherOpen(false)
    switcher.current?.querySelector('summary')?.focus()
  }

  // A portal escapes Frame's desktop max-width and any route containment.
  // No normal routed screen mounts underneath this fixture-backed preview.
  return createPortal(
    <div className="direction-shell" data-testid="direction-shell" data-direction={direction}>
      <div className="direction-shell-stage">
        <Suspense fallback={<div role="status">Laddar {name}…</div>}>
          <DirectionStage
            direction={direction}
            screen={screen}
            width={viewport === 'phone' ? 'phone' : 'desktop'}
            theme={mode}
            live={!switcherOpen}
            onScreen={setScreen}
            onAppScreen={setScreen}
            onTheme={setMode}
          />
        </Suspense>
      </div>
      <aside className="direction-shell-chip" aria-label="Designriktning">
        <span>Riktning: {name}</span>
        <span aria-hidden>·</span>
        <details
          ref={switcher}
          open={switcherOpen}
          onToggle={(event) => setSwitcherOpen(event.currentTarget.open)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeSwitcher()
          }}
        >
          <summary>Byt</summary>
          {switcherOpen && <DirectionSwitcher onSelect={closeSwitcher} />}
        </details>
        <span aria-hidden>·</span>
        <button type="button" onClick={() => setDirection(null)}>
          Vanliga appen
        </button>
      </aside>
    </div>,
    document.body,
  )
}
