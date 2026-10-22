import { type ReactNode, useId, useRef } from 'react'

export type SheetState = 'peek' | 'open' | 'full'
export function PhoneSheet({
  state,
  setState,
  feedback,
  position,
  children,
  action,
  onQuestion,
  onReturn,
}: {
  state: SheetState
  setState: (state: SheetState) => void
  feedback: boolean
  position: string
  children: ReactNode
  action: ReactNode
  onQuestion: () => void
  onReturn: () => void
}) {
  const id = useId()
  const down = useRef<number | null>(null)
  const swiped = useRef(false)
  return (
    <section
      className="rd-sheet"
      data-testid="rd-sheet"
      data-state={state}
      aria-label={feedback ? 'Facit' : 'Svara'}
    >
      {feedback ? (
        <button
          type="button"
          className="rd-sheet-grab"
          aria-label={state === 'full' ? 'Visa mindre facit' : 'Visa mer facit'}
          aria-expanded={state !== 'peek'}
          aria-controls={id}
          onClick={() => {
            if (swiped.current) {
              swiped.current = false
              return
            }
            setState(state === 'full' ? 'open' : 'full')
          }}
          onPointerDown={(event) => {
            down.current = event.clientY
            swiped.current = false
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerUp={(event) => {
            if (down.current == null) return
            const distance = event.clientY - down.current
            down.current = null
            if (Math.abs(distance) < 40) return
            swiped.current = true
            setState(distance < 0 ? 'full' : state === 'full' ? 'open' : 'peek')
          }}
          onPointerCancel={() => {
            down.current = null
          }}
        >
          <span aria-hidden />
        </button>
      ) : null}
      <div className="rd-sheet-head">
        <span className="fa-label">{position}</span>
        {feedback ? (
          state !== 'peek' ? (
            <button
              type="button"
              className="fa-more"
              onClick={() => {
                setState('peek')
                onQuestion()
              }}
            >
              Visa texten
            </button>
          ) : null
        ) : (
          <button type="button" className="fa-more" onClick={onQuestion}>
            Till frågan
          </button>
        )}
      </div>
      {feedback && state === 'peek' ? (
        <button type="button" className="fa-btn rd-sheet-return" onClick={onReturn}>
          Tillbaka till facit
        </button>
      ) : null}
      <div className="rd-sheet-body" id={id} hidden={!feedback || state === 'peek'}>
        {children}
      </div>
      {!feedback || state !== 'peek' ? action : null}
    </section>
  )
}
