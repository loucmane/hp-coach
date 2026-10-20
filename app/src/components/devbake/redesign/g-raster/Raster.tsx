import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import './raster.css'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  type DirectionProps,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { RasterDrill } from './RasterDrill'
import { RasterFramsteg } from './RasterFramsteg'
import { RasterDestination, RasterHome } from './RasterHome'
import { RasterNav } from './RasterNav'
import { RasterOva } from './RasterOva'
import { RasterProvpass, RasterProvResult } from './RasterProvpass'
import { RasterQuant } from './RasterQuant'
import { RasterRepetera } from './RasterRepetera'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap'

export function Raster(props: DirectionProps) {
  useWebFonts('raster', FONTS)
  const { data, actions } = useDirectionData()
  const screenDest: Destination =
    props.screen === 9 || props.screen === 10
      ? 'provpass'
      : props.screen === 11
        ? 'framsteg'
        : props.screen >= 5
          ? 'ova'
          : 'idag'
  const [dest, setDest] = useState<Destination>(screenDest)
  const [activePass, setActivePass] = useState<string | null>(null)
  const timedPass = dest === 'provpass' && props.screen !== 10 && activePass !== null
  const [menu, setMenu] = useState(props.screen === 4)
  const reading = props.screen === 2 || props.screen === 3
  const drill = reading || props.screen === 6 || props.screen === 7
  const returnToHome = useRef(true)
  if (!drill) returnToHome.current = props.screen === 1 || props.screen === 4
  useLayoutEffect(() => {
    setDest(screenDest)
    setMenu(props.screen === 4)
    if (props.screen !== 9) setActivePass(null)
  }, [props.screen, screenDest])
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
      data-drill={String(drill || timedPass)}
      data-timed-pass={String(timedPass)}
      data-round-two={String(props.screen >= 5)}
      lang="sv"
    >
      {!timedPass ? (
        <RasterNav {...props} dest={drill ? 'ova' : dest} onGo={go} menu={menu} setMenu={setMenu} />
      ) : null}
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
          {dest === 'provpass' ? (
            props.screen === 10 ? (
              <RasterProvResult />
            ) : (
              <RasterProvpass
                live={props.live && !menu}
                width={props.width}
                activePass={activePass}
                onActivePass={setActivePass}
              />
            )
          ) : dest === 'framsteg' ? (
            <RasterFramsteg />
          ) : props.screen === 8 && dest === 'ova' ? (
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
