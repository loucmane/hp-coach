import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { type DirectionProps, useWebFonts } from '@/components/devbake/redesign/r1Kit'
import { LjuskaglaDrill } from './LjuskaglaDrill'
import { LjuskaglaFrame } from './LjuskaglaNav'
import { LjuskaglaQuant } from './LjuskaglaQuant'
import './ljuskagla.css'

export function Ljuskagla(props: DirectionProps) {
  useWebFonts(
    'ljuskagla',
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  )
  const { data } = useDirectionData()
  const { screen } = props
  return (
    <div
      className="ljuskagla"
      data-testid="rd-ljuskagla"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      lang="sv"
    >
      {screen === 2 || screen === 3 ? (
        <LjuskaglaDrill {...props} />
      ) : screen === 6 || screen === 7 ? (
        <LjuskaglaQuant
          key={screen}
          {...props}
          session={screen === 7 ? data.drills.dtk : data.drills.quant}
        />
      ) : (
        <LjuskaglaFrame
          key={screen}
          {...props}
          page={screen === 5 ? 'ova' : screen === 8 ? 'repetera' : 'idag'}
        />
      )}
    </div>
  )
}
