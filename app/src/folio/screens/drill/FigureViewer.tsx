import { useEffect, useId, useRef, useState } from 'react'
import type { DrillFigure } from './types'

/** Kept inside .fa-drill so the Folio tokens and scoped rules apply. */
export function FigureViewer({ figure, onClose }: { figure: DrillFigure; onClose: () => void }) {
  const id = useId()
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const area = useRef<HTMLElement>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    close.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'Tab') {
        const buttons = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]') ??
            [],
        )
        const first = buttons[0]
        const last = buttons.at(-1)
        const active = document.activeElement
        if (event.shiftKey && (active === first || !dialog.current?.contains(active))) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && (active === last || !dialog.current?.contains(active))) {
          event.preventDefault()
          first?.focus()
        }
      } else if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key === '+' || event.key === '=') setZoom((z) => Math.min(6, z + 0.5))
        else if (event.key === '-') setZoom((z) => Math.max(1, z - 0.5))
        else if (event.key.toLowerCase() === 'r') setZoom(1)
        else return
        event.preventDefault()
      }
    }
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      document.body.style.overflow = previous
    }
  }, [onClose])
  return (
    <div
      className="rd-viewer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      ref={dialog}
    >
      <header className="rd-viewer-head">
        <h2 id={`${id}-title`}>Förstorad figur</h2>
        <button type="button" className="fa-more" ref={close} onClick={onClose}>
          Stäng
        </button>
      </header>
      <fieldset className="rd-viewer-tools" aria-label="Förstoring">
        <button
          type="button"
          className="fa-more"
          disabled={zoom === 1}
          onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
        >
          Minska
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)} %</output>
        <button
          type="button"
          className="fa-more"
          disabled={zoom === 6}
          onClick={() => setZoom((z) => Math.min(6, z + 0.5))}
        >
          Förstora
        </button>
        <button type="button" className="fa-more" onClick={() => setZoom(1)}>
          Anpassa
        </button>
      </fieldset>
      <section
        className="rd-viewer-area"
        ref={area}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll the enlarged image.
        tabIndex={0}
        aria-label="Figur, rulla för att flytta den förstorade bilden"
        onPointerDown={(event) => {
          if (event.pointerType === 'touch' || !area.current) return
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: area.current.scrollLeft,
            top: area.current.scrollTop,
          }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!drag.current || !area.current) return
          area.current.scrollLeft = drag.current.left + drag.current.x - event.clientX
          area.current.scrollTop = drag.current.top + drag.current.y - event.clientY
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerCancel={() => {
          drag.current = null
        }}
      >
        {failed ? (
          <p>Figuren kunde inte laddas.</p>
        ) : (
          <div
            className="rd-viewer-canvas"
            style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
          >
            <img
              src={`/${figure.src}`}
              alt={figure.alt}
              width={figure.width}
              height={figure.height}
              draggable={false}
              onError={() => setFailed(true)}
            />
          </div>
        )}
      </section>
    </div>
  )
}
