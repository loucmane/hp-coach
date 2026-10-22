import { type RefObject, useId, useLayoutEffect, useRef, useState } from 'react'
import { ExportStatus } from './KontoSections'
import { COPY, canDelete } from './kontoView'
import type { KontoExtras } from './useKontoExtras'

export function DeleteSlip({
  extras: k,
  opener,
  onClose,
}: {
  extras: KontoExtras
  opener: RefObject<HTMLButtonElement | null>
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const [word, setWord] = useState('')
  const id = useId()
  const busy = !['idle', 'failed'].includes(k.deletion)
  useLayoutEffect(() => {
    const dialog = ref.current
    const trigger = opener.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    field.current?.focus({ preventScroll: true })
    return () => {
      if (dialog.open) dialog.close()
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [opener])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: only a click outside the dialog bounds closes it; native cancel handles Escape
    <dialog
      ref={ref}
      className="fa-kt-slip"
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-warning`}
      data-folio-keyscope
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose()
      }}
    >
      <h2 className="fa-kt-slip-h" id={`${id}-heading`}>
        Radera konto
      </h2>
      <p className="fa-kt-slip-lede" id={`${id}-warning`}>
        Allt raderas direkt — konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom 30
        dagar. Det går inte att ångra.
      </p>
      <div className="fa-kt-slip-export">
        <button
          type="button"
          className="fa-kt-link"
          data-testid="konto-delete-export"
          disabled={k.exported === 'pending'}
          onClick={() => void k.exportNow()}
        >
          Exportera min data först →
        </button>
        <ExportStatus state={k.exported} onRetry={() => void k.exportNow()} />
      </div>
      <div className="fa-kt-word">
        <label className="fa-kt-word-label" htmlFor={`${id}-word`}>
          Skriv radera för att bekräfta.
        </label>
        <input
          ref={field}
          id={`${id}-word`}
          className="fa-kt-field"
          data-testid="konto-delete-confirm"
          value={word}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={busy}
          onChange={(event) => setWord(event.target.value)}
        />
      </div>
      <div className="fa-kt-slip-actions">
        <button
          type="button"
          className="fa-kt-grave"
          data-testid="konto-delete-submit"
          disabled={!canDelete(word) || busy}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault()
          }}
          onClick={() => {
            if (canDelete(word) && !busy) void k.deleteNow()
          }}
        >
          {k.deletion === 'pending' ? 'Raderar…' : 'Radera kontot permanent'}
        </button>
        <button type="button" className="fa-kt-quiet" onClick={onClose}>
          Avbryt
        </button>
      </div>
      <p className="fa-kt-error fa-kt-status" role="status">
        {k.deletion === 'failed'
          ? COPY.deleteFailed
          : k.deletion === 'signout-failed'
            ? COPY.signoutFailed
            : k.deletion === 'signing-out'
              ? 'Kontot är raderat. Loggar ut…'
              : ''}
      </p>
      {k.deletion === 'signout-failed' ? (
        <button type="button" className="fa-kt-link" onClick={() => void k.finishSignOut()}>
          Försök logga ut igen
        </button>
      ) : null}
    </dialog>
  )
}
