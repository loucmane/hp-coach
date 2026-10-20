import { useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type AppScreenKey,
  type DirectionProps,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { LjuskaglaDrill } from './LjuskaglaDrill'
import { LjuskaglaFrame, type ProvFlow } from './LjuskaglaNav'
import type { FramePage } from './LjuskaglaParts'
import { LjuskaglaProvRunner } from './LjuskaglaProvpass'
import { LjuskaglaQuant } from './LjuskaglaQuant'
import './ljuskagla.css'

/** The page the normal shell opens on for each of its screens. */
const FRAME_PAGE: Partial<Record<AppScreenKey, FramePage>> = {
  5: 'ova',
  8: 'repetera',
  9: 'provpass',
  10: 'resultat',
  11: 'framsteg',
}

export function Ljuskagla(props: DirectionProps) {
  useWebFonts(
    'ljuskagla',
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  )
  const { data, actions } = useDirectionData()
  const { screen } = props
  // The Provpass flow: the pass asked for, which runs once the host supplies
  // its questions, and whether one was just abandoned. A move to another
  // screen ends it; a host that answers the start by showing Provpass
  // (screen 9) keeps it.
  const [flowScreen, setFlowScreen] = useState(screen)
  const [requested, setRequested] = useState<string | null>(null)
  const [aborted, setAborted] = useState(false)
  if (flowScreen !== screen) {
    setFlowScreen(screen)
    if (screen !== 9) {
      setRequested(null)
      setAborted(false)
    }
  }
  const run = data.provpass.running
  const running = requested != null && run.passId === requested
  const prov: ProvFlow = {
    requested,
    aborted,
    onStart: (passId) => {
      actions.startProvpass(passId)
      setRequested(passId)
      setAborted(false)
    },
    onCancel: () => setRequested(null),
  }
  const page: FramePage = requested != null || aborted ? 'provpass' : (FRAME_PAGE[screen] ?? 'idag')
  return (
    <div
      className="ljuskagla"
      data-testid="rd-ljuskagla"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      lang="sv"
    >
      {running ? (
        <LjuskaglaProvRunner
          key={run.passId}
          {...props}
          run={run}
          onLeave={(why) => {
            setRequested(null)
            setAborted(why === 'aborted')
          }}
        />
      ) : screen === 2 || screen === 3 ? (
        <LjuskaglaDrill {...props} />
      ) : screen === 6 || screen === 7 ? (
        <LjuskaglaQuant
          key={screen}
          {...props}
          session={screen === 7 ? data.drills.dtk : data.drills.quant}
        />
      ) : (
        <LjuskaglaFrame key={`${screen}-${page}`} {...props} page={page} prov={prov} />
      )}
    </div>
  )
}
