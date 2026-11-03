import { type ReactNode, useId, useRef } from 'react'
import { useDismiss } from '@/folio/lib/useDismiss'

export type PassSlipKind = 'overview' | 'submit' | 'abort'

export function PassSlip({
  kind,
  blanks,
  onClose,
  onSubmit,
  onAbandon,
  children,
}: {
  kind: PassSlipKind
  blanks: string
  onClose: () => void
  onSubmit: () => void
  onAbandon: () => void
  children?: ReactNode
}) {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef(
    document.activeElement instanceof HTMLButtonElement ? document.activeElement : null,
  )
  useDismiss(true, onClose, panel, opener, true)
  const title =
    kind === 'overview'
      ? 'Översikt'
      : kind === 'submit'
        ? 'Lämna in provpasset?'
        : 'Avbryt provpasset?'
  return (
    <div className="fa-pass-slip-layer">
      <button
        type="button"
        className="fa-pass-scrim"
        tabIndex={-1}
        aria-label="Stäng dialogen"
        onClick={onClose}
      />
      <div
        className="fa-pass-slip"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      >
        <h2 id={`${id}-title`} className="fa-pass-slip-title">
          {title}
        </h2>
        <p id={`${id}-description`} className="fa-pass-note">
          {kind === 'abort' ? 'Avbryter du nu blir provpasset ogiltigt.' : blanks}
        </p>
        <button type="button" className="fa-pass-button" onClick={onClose}>
          Fortsätt provpasset
        </button>
        {kind === 'overview' ? (
          children
        ) : (
          <div className="fa-pass-slip-action">
            {kind === 'submit' ? (
              <button type="button" className="fa-pass-button" onClick={onSubmit}>
                Lämna in
              </button>
            ) : (
              <button type="button" className="fa-pass-quiet" onClick={onAbandon}>
                Avbryt provpasset
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
