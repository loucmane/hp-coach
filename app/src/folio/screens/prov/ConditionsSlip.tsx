import { useEffect, useRef, useState } from 'react'
import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import { Go } from '@/folio/ui/Go'
import { Lit } from '@/folio/ui/Lit'
import type { PassOption } from '@/lib/mock'
import { logMockEvent } from '@/lib/mockEvents'
import { HALF_LABEL, passName } from './provView'

export function ConditionsList({ minutes }: { minutes: number }) {
  return (
    <ul className="fa-prov-terms" aria-label="Villkoren">
      <li>
        <b>{minutes} min</b>
        <span>en klocka, som du kan dölja</span>
      </li>
      <li>
        <b>Ingen paus</b>
        <span>men du kan ändra svar tills tiden går ut</span>
      </li>
      <li>
        <b>Inga avdrag</b>
        <span>lämna ingen fråga tom</span>
      </li>
      <li>
        <b>Avbryter du</b>
        <span>räknas passet inte, men svaren sparas</span>
      </li>
    </ul>
  )
}

export function ConditionsSlip({
  half,
  mode,
  pass,
  pending,
  error,
  minutes,
  onStart,
  onClose,
}: {
  half: MockHalf
  mode: MockMode
  pass: PassOption | null
  pending: boolean
  error: boolean
  minutes: number
  onStart: () => boolean
  onClose: () => void
}) {
  const started = useRef(false)
  const [unavailable, setUnavailable] = useState(false)
  const shown = useRef(false)
  const panel = useRef<HTMLDivElement>(null)
  const start = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!shown.current) {
      shown.current = true
      logMockEvent('confirm_shown')
    }
    const previous = document.activeElement
    const hub = panel.current?.closest('.fa-prov')
    start.current?.focus()
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
      else hub?.querySelector<HTMLButtonElement>('[data-testid="prov-start"]')?.focus()
    }
  }, [])
  useEffect(() => {
    if (error && !pending) started.current = false
  }, [error, pending])
  const dismiss = () => {
    if (started.current || pending) return
    logMockEvent('confirm_backed_out')
    onClose()
  }
  const confirm = () => {
    if (started.current || pending) return
    started.current = true
    setUnavailable(false)
    logMockEvent('confirm_started')
    if (!onStart()) {
      started.current = false
      setUnavailable(true)
    }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.isComposing || e.ctrlKey || e.metaKey || e.altKey)
        return
      if (e.key === 'Escape') {
        e.preventDefault()
        dismiss()
      }
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        !(e.target instanceof Element && e.target.closest('button, a, input, textarea, select'))
      ) {
        e.preventDefault()
        confirm()
      }
      if (e.key === 'Tab') {
        const buttons = [
          ...(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
        ]
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (!first) {
          e.preventDefault()
          panel.current?.focus()
        } else if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === panel.current)
        ) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <div className="fa-slip-layer" data-testid="mock-confirm-sheet">
      <button
        type="button"
        tabIndex={-1}
        className="fa-scrim"
        aria-label="Stäng villkoren"
        onClick={dismiss}
        disabled={pending}
      />
      <Lit
        as="div"
        className="fa-slip"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mock-confirm-heading"
        ref={panel}
        tabIndex={-1}
      >
        <div className="fa-slip-head">
          <span className="fa-label">Starta provpass</span>
        </div>
        <h2 className="fa-slip-title" id="mock-confirm-heading" data-testid="mock-confirm-heading">
          {mode === 'authentic' && pass ? passName(pass) : 'Genererat pass'}
        </h2>
        <p className="fa-slip-sub">
          {HALF_LABEL[half]} · {mode === 'authentic' && pass ? pass.presented : 40} frågor ·{' '}
          {minutes} minuter
        </p>
        <p className="fa-slip-sub">Ingen feedback förrän du lämnar in.</p>
        {mode === 'synthetic' ? (
          <p className="fa-slip-sub">Ingen poäng: det är inte normerat.</p>
        ) : null}
        {pass && mode === 'authentic' && pass.presented < 40 ? (
          <p className="fa-slip-sub">
            {40 - pass.presented} frågor saknas i källan. Passet rättas på {pass.presented}.
          </p>
        ) : null}
        <ConditionsList minutes={minutes} />
        {unavailable ? (
          <p className="fa-status" role="status">
            Inget pass kunde startas. Välj ett annat pass eller försök igen.
          </p>
        ) : error ? (
          <p className="fa-status" role="status">
            Kunde inte starta passet. Försök igen.
          </p>
        ) : null}
        <div className="fa-slip-actions">
          <Go
            ref={start}
            kbd={pending ? undefined : '↵'}
            data-testid="mock-confirm-start"
            disabled={pending}
            onClick={confirm}
          >
            {pending ? 'Startar …' : 'Starta nu'}
          </Go>
          <button
            type="button"
            className="fa-quiet-btn"
            data-testid="mock-confirm-dismiss"
            disabled={pending}
            onClick={dismiss}
          >
            Inte nu <kbd aria-hidden>Esc</kbd>
          </button>
        </div>
      </Lit>
    </div>
  )
}
