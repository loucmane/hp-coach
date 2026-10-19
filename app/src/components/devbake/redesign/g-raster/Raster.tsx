import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import './raster.css'
import {
  type Destination,
  type DirectionProps,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { RasterDrill } from './RasterDrill'
import { RasterDestination, RasterHome } from './RasterHome'
import { RasterNav } from './RasterNav'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap'

export function Raster(props: DirectionProps) {
  useWebFonts('raster', FONTS)
  const [dest, setDest] = useState<Destination>('idag')
  const [menu, setMenu] = useState(props.screen === 4)
  const pending = useRef<Destination | null>(null)
  const drill = props.screen === 2 || props.screen === 3
  // Switcher changes reset the destination; drill completion can request Öva.
  useLayoutEffect(() => {
    setDest(pending.current ?? 'idag')
    pending.current = null
    setMenu(props.screen === 4)
  }, [props.screen])
  const { onScreen } = props
  const go = useCallback(
    (next: Destination) => {
      setMenu(false)
      setDest(next)
      if (drill) {
        pending.current = next
        onScreen(1)
      }
    },
    [drill, onScreen],
  )
  return (
    <div
      className="rd-raster"
      data-rd="raster"
      data-testid="rd-raster"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-drill={String(drill)}
      lang="sv"
    >
      <RasterNav {...props} dest={drill ? 'ova' : dest} onGo={go} menu={menu} setMenu={setMenu} />
      {drill ? (
        <RasterDrill {...props} live={props.live && !menu} onGo={go} />
      ) : (
        <main className="ra-main" key={dest}>
          {dest === 'idag' ? (
            <RasterHome live={props.live && !menu} onResume={() => onScreen(2)} onGo={go} />
          ) : (
            <RasterDestination dest={dest} onHome={() => go('idag')} />
          )}
        </main>
      )}
    </div>
  )
}
