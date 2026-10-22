import { useState } from 'react'
import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import { useViewport } from '@/hooks/useViewport'
import type { PassOption } from '@/lib/mock'
import { ConditionsSlip } from './ConditionsSlip'
import { ProvLead } from './ProvLead'
import { ProvMargin } from './ProvMargin'
import { ProvRegister } from './ProvRegister'
import { buildHubView, HALF_LABEL, type NavigateHref, type ResultsState } from './provView'
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
  beginRun: () => void
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
  const view = buildHubView({ half, mode, passes: props.passes, picked })
  return (
    <div className={`fa-prov ${phone ? 'fa-phome' : 'fa-home'}`} data-testid="folio-prov">
      <div className="fa-masthead" inert={slipOpen}>
        <span className="fa-label">Provpass</span>
      </div>
      <div className="fa-page-main" data-testid="prov-picker" inert={slipOpen}>
        <h1 className="fa-greet">Öva på tid.</h1>
        <p className="fa-day">
          Ett övningspass under riktiga provvillkor: 40 frågor på {props.durationMs / 60_000}{' '}
          minuter — ingen feedback förrän du lämnar in.
        </p>
        <fieldset className="fa-choices">
          <legend>Halva</legend>
          {(['verbal', 'kvant'] as const).map((h) => (
            <button
              key={h}
              type="button"
              data-testid={`prov-half-${h}`}
              aria-pressed={half === h}
              onClick={() => {
                setPicked(null)
                props.onHalfChange(h)
              }}
            >
              {HALF_LABEL[h]}
            </button>
          ))}
        </fieldset>
        <fieldset className="fa-choices">
          <legend>Läge</legend>
          {(['authentic', 'synthetic'] as const).map((m) => (
            <button
              key={m}
              type="button"
              data-testid={`prov-mode-${m}`}
              aria-pressed={mode === m}
              onClick={() => props.onModeChange(m)}
            >
              {m === 'authentic' ? 'Riktigt pass' : 'Genererat pass'}
            </button>
          ))}
        </fieldset>
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
          onStart={() => {
            if (mode === 'synthetic') props.startSynthetic()
            else if (view.chosen) props.startAuthentic(view.chosen)
          }}
        />
        {mode === 'authentic' && view.sittings.length ? (
          <ProvRegister view={view} phone={phone} onPick={setPicked} />
        ) : null}
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
