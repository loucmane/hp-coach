import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import './raster.css'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  type DirectionProps,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { RasterDrill } from './RasterDrill'
import { RasterDestination, RasterHome } from './RasterHome'
import { RasterNav } from './RasterNav'
import { RasterOva } from './RasterOva'
import { RasterQuant } from './RasterQuant'
import { RasterRepetera } from './RasterRepetera'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap'

export function Raster(props: DirectionProps) {
  useWebFonts('raster', FONTS)
  const { data, actions } = useDirectionData()
  const [dest, setDest] = useState<Destination>(props.screen >= 5 ? 'ova' : 'idag')
  const [menu, setMenu] = useState(props.screen === 4)
  const reading = props.screen === 2 || props.screen === 3
  const drill = reading || props.screen === 6 || props.screen === 7
  const returnToHome = useRef(true)
  if (!drill) returnToHome.current = props.screen === 1 || props.screen === 4
  useLayoutEffect(() => {
    setDest(props.screen >= 5 ? 'ova' : 'idag')
    setMenu(props.screen === 4)
  }, [props.screen])
  const go = useCallback(
    (next: Destination) => {
      setMenu(false)
      setDest(next)
      if (drill) actions.drill.exit?.()
      actions.go(next)
    },
    [drill, actions],
  )
  return (
    <div
      className="rd-raster"
      data-rd="raster"
      data-testid="rd-raster"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      inert={!props.live}
      data-drill={String(drill)}
      data-round-two={String(props.screen >= 5)}
      lang="sv"
    >
      <RasterNav {...props} dest={drill ? 'ova' : dest} onGo={go} menu={menu} setMenu={setMenu} />
      {reading ? (
        <RasterDrill
          {...props}
          live={props.live && !menu}
          onGo={go}
          returnToHome={returnToHome.current}
        />
      ) : drill ? (
        <RasterQuant {...props} live={props.live && !menu} />
      ) : (
        <main className="ra-main" key={dest}>
          {props.screen === 8 && dest === 'ova' ? (
            <RasterRepetera />
          ) : dest === 'ova' ? (
            <RasterOva />
          ) : dest === 'idag' ? (
            <RasterHome
              live={props.live && !menu}
              onResume={() => {
                actions.resume()
                if (data.home.resume?.section === 'LÄS') props.onScreen(2)
              }}
              onGo={go}
            />
          ) : (
            <RasterDestination dest={dest} onHome={() => go('idag')} />
          )}
        </main>
      )}
    </div>
  )
}
