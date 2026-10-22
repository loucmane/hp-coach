import { useEffect, useRef } from 'react'
import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import type { PassOption } from '@/lib/mock'
import { logMockEvent } from '@/lib/mockEvents'
import { HALF_LABEL, passName, RULES } from './provView'

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
  onStart: () => void
  onClose: () => void
}) {
  const started = useRef(false)
  const shown = useRef(false)
  const panel = useRef<HTMLDivElement>(null)
  const start = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!shown.current) {
      shown.current = true
      logMockEvent('confirm_shown')
    }
    const previous = document.activeElement
    start.current?.focus()
    return () => {
      if (previous instanceof HTMLElement) previous.focus()
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
    logMockEvent('confirm_started')
    onStart()
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
      <div
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
        {pass && mode === 'authentic' && pass.presented < 40 ? (
          <p className="fa-slip-sub">
            {40 - pass.presented} frågor saknas i källan. Passet rättas på {pass.presented}.
          </p>
        ) : null}
        <ul className="fa-slip-rules" aria-label="Villkoren">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        {error ? (
          <p className="fa-status" role="status">
            Kunde inte starta passet. Försök igen.
          </p>
        ) : null}
        <div className="fa-slip-actions">
          <button
            ref={start}
            type="button"
            className="fa-btn"
            data-testid="mock-confirm-start"
            disabled={pending}
            onClick={confirm}
          >
            {pending ? (
              'Startar …'
            ) : (
              <>
                Starta nu <kbd aria-hidden>↵</kbd>
              </>
            )}
          </button>
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
      </div>
    </div>
  )
}
