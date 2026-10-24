import { Wordmark } from './Wordmark'

export function FocusBar({
  onExit,
  exitLabel = 'Avsluta',
}: {
  onExit: () => void
  exitLabel?: string | null
}) {
  return (
    <header className="fa-focus-bar">
      <Wordmark />
      {exitLabel !== null && (
        <button type="button" className="fa-exit" data-testid="fa-exit" onClick={onExit}>
          {exitLabel}
        </button>
      )}
    </header>
  )
}
