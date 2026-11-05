import { useEffect, useRef, useState } from 'react'
import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import { loadBank, type Question } from '@/data/questions'
import { useScopedKeys } from '@/folio/lib/useScopedKeys'
import { useViewport } from '@/hooks/useViewport'
import type { PassOption } from '@/lib/mock'
import { ConditionsSlip } from './ConditionsSlip'
import { ProvLead, ProvLink } from './ProvLead'
import { ProvMargin } from './ProvMargin'
import { ProvRegister } from './ProvRegister'
import { buildHubView, type NavigateHref, type ResultsState } from './provView'
import './prov.css'

export type FolioProvpassProps = {
  half: MockHalf
  mode: MockMode
  onHalfChange: (half: MockHalf) => void
  onModeChange: (mode: MockMode) => void
  passes: readonly PassOption[]
  ready: boolean
  voidNotice: boolean
  results: ResultsState
  navigateHref: NavigateHref
  startAuthentic: (pass: PassOption) => void
  startSynthetic: () => void
  beginRun: () => boolean
  slipOpen: boolean
  pendingPass: PassOption | null
  onDismiss: () => void
  pending: boolean
  error: boolean
  durationMs: number
}
export default function FolioProvpass(props: FolioProvpassProps) {
  const { half, mode, slipOpen } = props
  const phone = useViewport() === 'phone'
  const [picked, setPicked] = useState<string | null>(null)
  const [bank, setBank] = useState<readonly Question[] | null>(null)
  const picker = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(slipOpen)
  useEffect(() => {
    if (wasOpen.current && !slipOpen)
      picker.current?.querySelector<HTMLButtonElement>('[data-testid="prov-start"]')?.focus()
    wasOpen.current = slipOpen
  }, [slipOpen])
  useEffect(() => {
    let live = true
    loadBank()
      .then((rows) => {
        if (live) setBank(rows)
      })
      .catch(() => {
        /* The route owns bank readiness. */
      })
    return () => {
      live = false
    }
  }, [])
  const view = buildHubView({ half, mode, passes: props.passes, picked, bank })
  const start = () => {
    if (mode === 'synthetic') props.startSynthetic()
    else if (view.chosen) props.startAuthentic(view.chosen)
  }
  useScopedKeys(picker, { Enter: start }, { enabled: props.ready && !slipOpen })
  return (
    <div
      className={`fa-prov fa-prov-hub ${phone ? 'fa-prov-phone' : 'fa-prov-desktop'}`}
      data-testid="folio-prov"
    >
      <div className="fa-prov-topline" inert={slipOpen}>
        <span className="fa-label">Provpass</span>
      </div>
      <div
        className="fa-page-main"
        data-testid="prov-picker"
        inert={slipOpen}
        ref={picker}
        tabIndex={-1}
      >
        <h1 className="fa-greet">Öva på tid.</h1>
        <p className="fa-day">
          Ett provpass under riktiga villkor: 40 frågor på {props.durationMs / 60_000} minuter.
          Facit kommer när du lämnat in, inte före.
        </p>
        {props.voidNotice ? (
          <p className="fa-status" role="status" data-testid="prov-void-notice">
            Provet avbröts — ogiltigt.
          </p>
        ) : null}
        <ProvLead
          view={view}
          half={half}
          mode={mode}
          ready={props.ready}
          slipOpen={slipOpen}
          phone={phone}
          minutes={props.durationMs / 60_000}
          onStart={start}
        />
        <div className="fa-prov-alternatives">
          <button type="button" className="fa-prov-card" disabled aria-describedby="fa-half-coming">
            <b>Hel halva · 2 pass</b>
            <small id="fa-half-coming">
              Kommer · 80 frågor, två pass med paus som på provdagen.
            </small>
          </button>
          <button
            type="button"
            className="fa-prov-card"
            data-testid="prov-mode-synthetic"
            aria-pressed={mode === 'synthetic'}
            onClick={() => props.onModeChange('synthetic')}
          >
            <b>Genererat pass</b>
            <small>Blandade frågor. Ingen poäng: det är inte normerat.</small>
          </button>
        </div>
        <p className="fa-prov-short">
          <ProvLink className="fa-link" href={view.short.href} navigateHref={props.navigateHref}>
            Kort på tid · ORD · {view.short.count} frågor · {view.short.minutes} min
          </ProvLink>
        </p>
        <ProvRegister
          view={view}
          half={half}
          mode={mode}
          ready={props.ready}
          onHalfChange={(h) => {
            setPicked(null)
            props.onHalfChange(h)
          }}
          onPick={(key) => {
            setPicked(key)
            props.onModeChange('authentic')
          }}
          onAuthentic={() => props.onModeChange('authentic')}
        />
      </div>
      <div className="fa-margin-wrap" inert={slipOpen}>
        <ProvMargin results={props.results} navigateHref={props.navigateHref} />
      </div>
      {slipOpen ? (
        <ConditionsSlip
          half={half}
          mode={mode}
          pass={props.pendingPass}
          pending={props.pending}
          error={props.error}
          minutes={props.durationMs / 60_000}
          onStart={props.beginRun}
          onClose={props.onDismiss}
        />
      ) : null}
    </div>
  )
}
