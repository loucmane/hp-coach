import type { CSSProperties } from 'react'

import type { FocusRequest, FocusStrip } from '../host'
import { SEC_KEY } from '../ui/SecChip'
import { Wordmark } from './Wordmark'
import './focus.css'

function DrillStrip({ section, cells }: FocusStrip) {
  return (
    <nav
      className="fa-drill-strip"
      aria-label="Frågor i passet"
      style={{ '--fa-strip-c': `var(--fa-sec-${SEC_KEY[section]})` } as CSSProperties}
    >
      {cells.map((cell, index) => {
        const outcome =
          cell.state === 'ok' ? 'rätt' : cell.state === 'back' ? 'kommer tillbaka' : 'ej besvarad'
        return (
          <button
            key={cell.id}
            type="button"
            className="fa-strip-cell"
            data-state={cell.state}
            aria-label={`Fråga ${index + 1} av ${cells.length}, ${outcome}`}
            aria-current={cell.current || cell.state === 'cur' ? 'step' : undefined}
            onClick={cell.onSelect}
            disabled={cell.disabled}
          >
            <span aria-hidden="true" />
          </button>
        )
      })}
    </nav>
  )
}

export function FocusBar({
  onExit,
  exitLabel,
  strip,
  where,
}: Pick<FocusRequest, 'exitLabel' | 'strip' | 'where'> & {
  onExit: () => void
}) {
  const drill = strip !== undefined || where != null
  const label = exitLabel === undefined ? (drill ? 'Avsluta passet' : 'Avsluta') : exitLabel
  return (
    <header className={drill ? 'fa-focus-bar fa-drillbar' : 'fa-focus-bar'}>
      {!drill && <Wordmark />}
      {label !== null && (
        <button type="button" className="fa-exit" data-testid="fa-exit" onClick={onExit}>
          {drill && <span aria-hidden="true">←</span>}
          {label}
        </button>
      )}
      {strip && strip.cells.length > 0 && <DrillStrip {...strip} />}
      {where != null && <div className="fa-focus-where">{where}</div>}
    </header>
  )
}
