import { useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type AppScreenKey,
  type DirectionProps,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { LjuskaglaDrill, LjuskaglaElf, NoQuestions } from './LjuskaglaDrill'
import { type KontoFlow, LjuskaglaFrame, type ProvFlow } from './LjuskaglaNav'
import type { FramePage, KontoVisit, ReadingLight } from './LjuskaglaParts'
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
  12: 'uppslag',
  13: 'konto',
}

export function Ljuskagla(props: DirectionProps) {
  useWebFonts(
    'ljuskagla',
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  )
  const { data, actions } = useDirectionData()
  const { screen } = props
  // The Provpass flow: the pass asked for, which runs once the host supplies
  // its questions, whether one was just abandoned, and the page a pass that
  // ended was left for (a door, opened here too for a host that does not
  // navigate). A move to another screen ends it; a host that answers the
  // start by showing Provpass (screen 9) keeps it.
  const [flowScreen, setFlowScreen] = useState(screen)
  const [requested, setRequested] = useState<string | null>(null)
  const [aborted, setAborted] = useState(false)
  const [leftFor, setLeftFor] = useState<FramePage | null>(null)
  // The paragraph light, one switch for the drills and Konto while
  // Ljuskägla is open (local to this preview: nothing saves it).
  const [spotlight, setSpotlight] = useState(true)
  // How Konto was reached through the account menu: kept across the host's
  // move to Konto (13), forgotten on any other move.
  const [visit, setVisit] = useState<KontoVisit | null>(null)
  if (flowScreen !== screen) {
    setFlowScreen(screen)
    setLeftFor(null)
    if (screen !== 13) setVisit(null)
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
      setLeftFor(null)
    },
    onCancel: () => setRequested(null),
  }
  const konto: KontoFlow = {
    visit,
    onVisit: (section, from) => {
      setVisit((old) => ({
        from: from === 'konto' ? (old?.from ?? null) : from,
        section,
        at: (old?.at ?? 0) + 1,
      }))
      actions.openKonto()
    },
  }
  const light: ReadingLight = { spotlight, onSpotlight: setSpotlight }
  const page: FramePage =
    requested != null || aborted ? 'provpass' : (leftFor ?? FRAME_PAGE[screen] ?? 'idag')
  const quant = screen === 7 ? data.drills.dtk : data.drills.quant
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
          onLeave={(why, to) => {
            setRequested(null)
            setAborted(why === 'aborted')
            setLeftFor(to ?? null)
          }}
        />
      ) : screen === 2 || screen === 3 ? (
        <LjuskaglaDrill {...props} light={light} />
      ) : screen === 14 ? (
        <LjuskaglaElf {...props} light={light} />
      ) : screen === 6 || screen === 7 ? (
        quant.questions.length === 0 ? (
          <NoQuestions
            section={screen === 7 ? 'DTK' : 'Kvant'}
            theme={props.theme}
            onTheme={props.onTheme}
          />
        ) : (
          // A new session, or one whose questions change in number, opens
          // fresh: the drill's place never points past its questions.
          <LjuskaglaQuant
            key={`${screen}:${quant.id}:${quant.questions.length}`}
            {...props}
            session={quant}
          />
        )
      ) : (
        <LjuskaglaFrame
          key={`${screen}-${page}`}
          {...props}
          page={page}
          prov={prov}
          konto={konto}
          light={light}
        />
      )}
    </div>
  )
}
