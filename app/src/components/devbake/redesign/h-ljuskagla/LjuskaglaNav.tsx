import { X } from 'lucide-react'
import { useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  type DirectionProps,
  fmtClock,
} from '@/components/devbake/redesign/r1Kit'
import type { ProvPassOptionView } from '@/components/devbake/redesign/viewModel'
import { LjuskaglaFramsteg } from './LjuskaglaFramsteg'
import { LjuskaglaDestination, LjuskaglaHome } from './LjuskaglaHome'
import { LjuskaglaOva } from './LjuskaglaOva'
import { Account, type FramePage, FrameShell, type OpenPage, useGate } from './LjuskaglaParts'
import { LjuskaglaProvHub, LjuskaglaProvResult, PassConfirmation } from './LjuskaglaProvpass'
import { LjuskaglaRepetera } from './LjuskaglaRepetera'

/**
 * The focus shell's head: an always-visible Avsluta, the section and the
 * reader's place, the clock (when there is one to show), the account, and a
 * warm line along the bottom for progress.
 */
export function DrillHead({
  section,
  position,
  total,
  elapsed,
  progress,
  onExit,
  theme,
  onTheme,
  onAccountOpenChange,
  inert = false,
}: Pick<DirectionProps, 'theme' | 'onTheme'> & {
  section: string
  position: number
  total: number
  /** Seconds on the clock, or null to leave the clock out. */
  elapsed: number | null
  /** 0–1 */
  progress: number
  onExit: () => void
  onAccountOpenChange: (open: boolean) => void
  /** While a dialog covers the drill. */
  inert?: boolean
}) {
  return (
    <header className="lj-drill-head" inert={inert}>
      <button
        type="button"
        className="lj-text-button lj-exit"
        data-testid="rd-exit"
        onClick={onExit}
      >
        <X size={18} aria-hidden />
        <span>Avsluta</span>
      </button>
      <span className="lj-drill-progress">
        {section}{' '}
        <span>
          · {position} av {total}
        </span>
      </span>
      {elapsed != null && (
        <span className="lj-clock" role="timer" aria-label={`Tid ${fmtClock(elapsed)}`}>
          {fmtClock(elapsed)}
        </span>
      )}
      <Account theme={theme} onTheme={onTheme} onOpenChange={onAccountOpenChange} />
      <span className="lj-progress-line" aria-hidden>
        <i style={{ width: `${progress * 100}%` }} />
      </span>
    </header>
  )
}

/** The door a page belongs to: Repetera is part of Öva, a result part of
 *  Provpass. */
const PAGE_DOOR: Record<FramePage, Destination> = {
  idag: 'idag',
  ova: 'ova',
  repetera: 'ova',
  provpass: 'provpass',
  resultat: 'provpass',
  uppslag: 'uppslag',
  framsteg: 'framsteg',
}

/** What the Provpass hub needs from the direction's root: the pass asked
 *  for (it runs once the host supplies its questions), whether a pass was
 *  just abandoned, and the moves that start or drop a pass. */
export type ProvFlow = {
  requested: string | null
  aborted: boolean
  onStart: (passId: string) => void
  onCancel: () => void
}

/**
 * The normal shell around Idag, Öva, Repetera, Provpass, its result and
 * Framsteg: the five doors and the account, in a sidebar that gains light
 * on approach (desktop) or a bottom bar (phone). A door asks the host to go
 * there and opens the page here as well, so a host that does not navigate
 * (a bare test mount, the real-app preview) still answers the click the way
 * round 1's doors did. The stage remounts the frame for each screen, so a
 * host's navigation always wins. A pass's start confirmation covers the
 * whole shell, which waits inert behind it.
 */
export function LjuskaglaFrame({
  page: initialPage,
  prov,
  ...props
}: DirectionProps & { page: FramePage; prov: ProvFlow }) {
  const { actions } = useDirectionData()
  const [page, setPage] = useState(initialPage)
  const start = useGate<ProvPassOptionView>()
  const open: OpenPage = (next, ask) => {
    ask()
    setPage(next)
  }
  const go = (door: Destination) => open(door, () => actions.go(door))
  const chosen = start.gate
  return (
    <>
      <FrameShell
        door={PAGE_DOOR[page]}
        onGo={go}
        width={props.width}
        account={<Account {...props} initiallyOpen={props.screen === 4} />}
        initiallyCollapsed={props.screen === 4}
        inert={chosen != null}
      >
        <main className="lj-home-scroll" key={page}>
          {page === 'idag' ? (
            <LjuskaglaHome onResume={() => props.onScreen(2)} onOpen={open} />
          ) : page === 'ova' ? (
            <LjuskaglaOva />
          ) : page === 'repetera' ? (
            <LjuskaglaRepetera onBack={() => go('ova')} />
          ) : page === 'provpass' ? (
            <LjuskaglaProvHub
              requested={prov.requested}
              aborted={prov.aborted}
              onAskStart={start.open}
              onCancelWait={prov.onCancel}
              onOpen={open}
            />
          ) : page === 'resultat' ? (
            <LjuskaglaProvResult live={props.live} onOpen={open} />
          ) : page === 'framsteg' ? (
            <LjuskaglaFramsteg width={props.width} onOpen={open} />
          ) : (
            <LjuskaglaDestination destination={page} />
          )}
        </main>
      </FrameShell>
      {chosen && (
        <PassConfirmation
          pass={chosen}
          onCancel={start.close}
          onAccept={() => {
            start.close()
            prov.onStart(chosen.id)
          }}
        />
      )}
    </>
  )
}
