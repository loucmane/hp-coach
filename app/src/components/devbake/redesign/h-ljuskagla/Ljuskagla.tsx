import { useState } from 'react'
import {
  type Destination,
  type DirectionProps,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { LjuskaglaDrill } from './LjuskaglaDrill'
import { LjuskaglaFrame } from './LjuskaglaNav'
import './ljuskagla.css'

export function Ljuskagla(props: DirectionProps) {
  useWebFonts(
    'ljuskagla',
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  )
  const [destination, setDestination] = useState<Destination>('idag')
  const goHome = (dest: Destination) => {
    setDestination(dest)
    props.onScreen(1)
  }
  return (
    <div
      className="ljuskagla"
      data-testid="rd-ljuskagla"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      lang="sv"
    >
      {props.screen === 2 || props.screen === 3 ? (
        <LjuskaglaDrill {...props} onGo={goHome} />
      ) : (
        <LjuskaglaFrame
          key={props.screen}
          {...props}
          destination={destination}
          onGo={setDestination}
        />
      )}
    </div>
  )
}
